import { computed, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { normalizeSimFreq, normalizeBridgeTelemetry, telemetrySignature } from '../../shared/utils/bridgeTelemetry'
import { pmLog } from '../../shared/utils/pmLog'
import type { SimControlCommandResult } from '../../shared/utils/simControl'
import type { useFrequencyPresets } from '~/composables/useFrequencyPresets'

export interface SimBridgeSyncDeps {
  backendSessionId: Ref<string | null>
  radioBackend: ReturnType<typeof useRadioBackend>
  /** Applies a backend response (telemetry can fire a proactive ATC transmission). */
  applyBackendDecision: (response: any) => void
  /** Tuning away cuts in-progress ATC speech, same as a manual tune. */
  stopCurrentSpeech: () => void
  resumePrerecIfSuspended: () => Promise<void> | void
  startRecording: (fromPad: boolean) => Promise<void> | void
  stopRecording: () => void
  /** A frequency-sim-control command the bridge has finished (or the server expired). */
  onCommandResult: (result: SimControlCommandResult) => void
}

/**
 * SimBridge live frequency sync + remote push-to-talk.
 *
 * When /live-atc is opened with ?token=<bridge-token> and that bridge is actively
 * posting telemetry, mirror the sim's COM1 radio panel (active + standby) into
 * the radio and surface a "Bridge connected" indicator. The bridge counts as
 * connected only while fresh telemetry keeps arriving — if it goes quiet we
 * drop the badge.
 */
export function useSimBridgeSync(
  freq: ReturnType<typeof useFrequencyPresets>,
  deps: SimBridgeSyncDeps,
) {
  const route = useRoute()
  const { frequencies } = freq
  const {
    backendSessionId, radioBackend, applyBackendDecision, stopCurrentSpeech,
    resumePrerecIfSuspended, startRecording, stopRecording, onCommandResult,
  } = deps

  const bridgeToken = computed(() => {
    const value = route.query.token
    const raw = Array.isArray(value) ? value[0] : value
    return typeof raw === 'string' ? raw.trim() : ''
  })
  const bridgeConnected = ref(false)
  const bridgeSimActiveFreq = ref<string | null>(null)
  // Last known aircraft position from bridge telemetry. Sent at session creation
  // so the backend can start the taxi route at the real parking position.
  const bridgePosition = ref<{ lat: number; lon: number } | null>(null)
  // Telemetry older than this means the bridge stopped posting.
  const BRIDGE_TELEMETRY_STALE_MS = 12_000
  const BRIDGE_POLL_INTERVAL_MS = 3_000
  let bridgePoller: ReturnType<typeof setInterval> | null = null
  // Last sim active frequency we pushed into the radio — only re-tune active when
  // the sim value actually changes, so manual/flow tuning isn't constantly
  // overridden. Standby has no such anchor: while connected it strictly mirrors
  // the sim's standby radio.
  let lastSyncedSimActive: string | null = null

  // Only forward telemetry that meaningfully changed, so idle cruise doesn't POST
  // an identical tick every poll. Rounded so tiny jitter doesn't count as change.
  let lastSentTelemetrySig: string | null = null

  async function forwardTelemetryToBackend(rawTelemetry: any) {
    if (!backendSessionId.value) return
    const normalized = normalizeBridgeTelemetry(rawTelemetry)
    if (!normalized) return
    const sig = telemetrySignature(normalized)
    if (sig === lastSentTelemetrySig) return  // nothing meaningful changed
    lastSentTelemetrySig = sig
    try {
      const response = await radioBackend.sendTelemetry(backendSessionId.value, normalized)
      if (response.telemetry_fired) {
        pmLog.info('TELEMETRY FIRED →', response.next_state_id)
        applyBackendDecision(response)
      }
    } catch (e: any) {
      // A 404 means the session is gone; the transmit path already handles the
      // reset, so here we just stop forwarding until a new session exists.
      if ((e?.status ?? e?.response?.status) === 404) {
        pmLog.warn('TELEMETRY session gone (404) — pausing telemetry forwarding')
      } else {
        pmLog.warn('TELEMETRY forward failed', e)
      }
    }
  }

  async function pollBridgeTelemetry() {
    const token = bridgeToken.value
    if (!token) return
    try {
      const res = await $fetch<{
        connected: boolean
        lastTelemetryAt: string | null
        telemetry: any
        commandResults?: SimControlCommandResult[]
      }>(
        '/api/bridge/live',
        { headers: { 'x-bridge-token': token } },
      )

      // Frequency-sim-control results (design §4): announce regardless of
      // telemetry freshness below — a command can resolve/expire even on the
      // poll where the bridge itself has just gone quiet.
      for (const result of res.commandResults ?? []) {
        onCommandResult(result)
      }

      const ts = res.lastTelemetryAt ? Date.parse(res.lastTelemetryAt) : null
      const fresh = Boolean(res.connected && ts && Date.now() - ts < BRIDGE_TELEMETRY_STALE_MS)
      bridgeConnected.value = fresh

      if (!fresh) {
        // Bridge went quiet — drop the active sync anchor so reconnecting re-tunes.
        lastSyncedSimActive = null
        lastSentTelemetrySig = null
        bridgeSimActiveFreq.value = null
        bridgePosition.value = null
        return
      }

      // Track the aircraft position (0/0 is the bridge's "no data" default).
      const lat = Number(res.telemetry?.PLANE_LATITUDE)
      const lon = Number(res.telemetry?.PLANE_LONGITUDE)
      bridgePosition.value =
        Number.isFinite(lat) && Number.isFinite(lon) && (Math.abs(lat) > 0.5 || Math.abs(lon) > 0.5)
          ? { lat, lon }
          : null

      const simActive = normalizeSimFreq(res.telemetry?.COM_ACTIVE_FREQUENCY)
      const simStandby = normalizeSimFreq(res.telemetry?.COM_STANDBY_FREQUENCY)
      bridgeSimActiveFreq.value = simActive

      // Mirror COM1 active: tuning away cuts in-progress ATC speech on the old
      // channel, same as a manual tune.
      if (simActive && simActive !== lastSyncedSimActive) {
        lastSyncedSimActive = simActive
        if (frequencies.value.active !== simActive) {
          stopCurrentSpeech()
          frequencies.value.active = simActive
        }
      }

      // Mirror COM1 standby (no audio side effects — it's just the staged
      // channel). While connected the standby always reflects the sim's standby
      // radio, never the previously tuned channel.
      if (simStandby && frequencies.value.standby !== simStandby) {
        frequencies.value.standby = simStandby
      }

      // Feed the (normalised) telemetry to the authoritative backend so it can
      // fire proactive, aircraft-state-driven ATC. No-op when nothing meaningful
      // changed or when no telemetry trigger matches the current state.
      void forwardTelemetryToBackend(res.telemetry)
    } catch {
      bridgeConnected.value = false
    }
  }

  function startBridgeSync() {
    stopBridgeSync()
    if (!bridgeToken.value) return
    void pollBridgeTelemetry()
    bridgePoller = setInterval(pollBridgeTelemetry, BRIDGE_POLL_INTERVAL_MS)
  }

  function stopBridgeSync() {
    if (bridgePoller) {
      clearInterval(bridgePoller)
      bridgePoller = null
    }
  }

  // --- Remote push-to-talk over the bridge link --------------------------------
  // The OpenSquawk Bridge captures a global hotkey on the PC and POSTs each edge
  // to /api/bridge/ptt; the backend relays it here over WebSocket so PTT works
  // while the sim (not this tab) is focused. We reuse the on-screen pad's
  // startRecording/stopRecording, so behaviour is identical to holding the pad.
  let pttSocket: WebSocket | null = null
  let pttReconnectTimer: ReturnType<typeof setTimeout> | null = null
  let pttClosedByUs = false
  const bridgePttConnected = ref(false)

  async function handleRemotePtt(state: 'down' | 'up') {
    if (state === 'down') {
      await resumePrerecIfSuspended()
      void startRecording(false)
    } else {
      stopRecording()
    }
  }

  function schedulePttReconnect() {
    if (pttReconnectTimer || pttClosedByUs) return
    pttReconnectTimer = setTimeout(() => {
      pttReconnectTimer = null
      connectPttSocket()
    }, 3_000)
  }

  function connectPttSocket() {
    disconnectPttSocket()
    const token = bridgeToken.value
    if (!token || typeof window === 'undefined') return
    pttClosedByUs = false
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${proto}//${window.location.host}/api/bridge/ws`
    let socket: WebSocket
    try {
      socket = new WebSocket(url)
    } catch {
      schedulePttReconnect()
      return
    }
    pttSocket = socket

    socket.onopen = () => {
      bridgePttConnected.value = true
      try { socket.send(JSON.stringify({ type: 'subscribe', token })) } catch {}
    }
    socket.onmessage = (ev) => {
      let data: any
      try { data = JSON.parse(typeof ev.data === 'string' ? ev.data : String(ev.data)) } catch { return }
      if (data?.type === 'ptt' && (data.state === 'down' || data.state === 'up')) {
        void handleRemotePtt(data.state)
      }
    }
    socket.onclose = () => {
      bridgePttConnected.value = false
      if (pttSocket === socket) pttSocket = null
      if (!pttClosedByUs) schedulePttReconnect()
    }
    socket.onerror = () => {
      try { socket.close() } catch {}
    }
  }

  function disconnectPttSocket() {
    pttClosedByUs = true
    if (pttReconnectTimer) {
      clearTimeout(pttReconnectTimer)
      pttReconnectTimer = null
    }
    if (pttSocket) {
      try { pttSocket.close() } catch {}
      pttSocket = null
    }
    bridgePttConnected.value = false
  }

  onMounted(() => {
    startBridgeSync()
    connectPttSocket()
  })

  watch(bridgeToken, () => {
    bridgeConnected.value = false
    bridgeSimActiveFreq.value = null
    lastSyncedSimActive = null
    startBridgeSync()
    connectPttSocket()
  })

  onUnmounted(() => {
    stopBridgeSync()
    disconnectPttSocket()
  })

  return {
    bridgeToken,
    bridgeConnected,
    bridgeSimActiveFreq,
    bridgePosition,
    bridgePttConnected,
    startBridgeSync,
    stopBridgeSync,
    connectPttSocket,
    disconnectPttSocket,
  }
}
