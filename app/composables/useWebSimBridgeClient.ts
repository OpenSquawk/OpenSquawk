// app/composables/useWebSimBridgeClient.ts
//
// Feeds the WebSim flight model into the exact same bridge endpoints a real
// MSFS bridge app posts to, so /live-atc?token=... can't tell the difference.
// docs/plans/2026-07-16-websim-design.md

import { computed, onBeforeUnmount, ref } from 'vue'
import { destinationPoint, normalizeHeading } from '../../shared/utils/geo'
import { glideslopeAltitudeFt } from '../../shared/utils/webSimPhysics'
import { WEBSIM_AIRPORTS } from '../../shared/data/websim/spawnPresets'
import type { PendingCommand, SimControlCommand } from '../../shared/utils/simControl'
import type { useWebSimFlightModel } from '../../shared/composables/flightlab/useWebSimFlightModel'

const TOKEN_STORAGE_KEY = 'osq_websim_bridge_token'
const DATA_INTERVAL_MS = 2000
const STATUS_INTERVAL_MS = 10000

export function useWebSimBridgeClient(model: ReturnType<typeof useWebSimFlightModel>) {
  const bridgeToken = ref('')
  const connected = ref(false)
  const liveAtcUrl = computed(() => (bridgeToken.value ? `/live-atc?token=${bridgeToken.value}` : ''))

  let dataInterval: ReturnType<typeof setInterval> | null = null
  let statusInterval: ReturnType<typeof setInterval> | null = null

  function ensureToken(): string {
    if (typeof window === 'undefined') return ''
    let token = window.localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!token) {
      token = crypto.randomUUID()
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
    }
    bridgeToken.value = token
    return token
  }

  function autoEngageApIfOff() {
    if (model.state.apMode === 'OFF') model.setApMode('SELECTED')
  }

  /** setup_approach: reposition onto the requested runway's ILS. False if we don't have data for that airport/runway. */
  function applySetupApproach(cmd: Extract<SimControlCommand, { type: 'setup_approach' }>): boolean {
    const airport = WEBSIM_AIRPORTS[cmd.airport_icao]
    if (!airport) return false
    const normalizedRunway = cmd.runway.replace(/^0/, '')
    const runway = airport.runways.find((r) => r.id === cmd.runway || r.id === normalizedRunway)
    if (!runway) return false

    const distNm = cmd.final_distance_nm ?? 10
    const point = destinationPoint(runway.thresholdLat, runway.thresholdLon, normalizeHeading(runway.course_deg + 180), distNm)
    const altitude = cmd.altitude_ft ?? glideslopeAltitudeFt(runway.elevation_ft, distNm)

    model.reposition({
      icao: airport.icao,
      lat: point.lat,
      lon: point.lon,
      heading_deg: runway.course_deg,
      altitude_ft: altitude,
      on_ground: false,
      apMode: 'APPR_CAPTURED',
      targetRunwayId: runway.id,
      target_hdg: runway.course_deg,
      target_alt: altitude,
    })
    return true
  }

  async function applyCommand(pending: PendingCommand) {
    const cmd = pending.command
    let status: 'ok' | 'failed' = 'ok'
    let reason: string | null = null

    if (cmd.type === 'set_altitude') {
      model.setFcuTarget({ alt: cmd.altitude_ft })
      autoEngageApIfOff()
    } else if (cmd.type === 'set_heading') {
      model.setFcuTarget({ hdg: cmd.heading_deg })
      autoEngageApIfOff()
    } else if (cmd.type === 'set_speed') {
      model.setFcuTarget({ ias: cmd.ias_kts })
      autoEngageApIfOff()
    } else if (cmd.type === 'setup_approach') {
      if (!applySetupApproach(cmd)) {
        status = 'failed'
        reason = `no WebSim data for ${cmd.airport_icao} runway ${cmd.runway}`
      }
    }

    try {
      await $fetch('/api/bridge/command-result', {
        method: 'POST',
        headers: { 'x-bridge-token': bridgeToken.value },
        body: { id: pending.id, status, reason },
      })
    } catch {
      // Best-effort — the command channel's own TTL will expire it server-side.
    }
  }

  async function postTelemetry() {
    const token = bridgeToken.value
    if (!token) return
    try {
      const response = await $fetch<{ commands?: PendingCommand[] }>('/api/bridge/data', {
        method: 'POST',
        headers: { 'x-bridge-token': token },
        body: model.bridgeTelemetryFields(),
      })
      connected.value = true
      for (const pending of response.commands ?? []) {
        void applyCommand(pending)
      }
    } catch {
      connected.value = false
    }
  }

  async function postStatus() {
    const token = bridgeToken.value
    if (!token) return
    try {
      await $fetch('/api/bridge/status', {
        method: 'POST',
        headers: { 'x-bridge-token': token },
        body: { simConnected: true, flightActive: !model.state.on_ground },
      })
    } catch {
      // Non-critical — status is a secondary indicator, telemetry polling drives `connected`.
    }
  }

  async function startBridgeClient() {
    const token = ensureToken()
    if (!token) return
    try {
      await $fetch('/api/bridge/connect', { method: 'POST', headers: { 'x-bridge-token': token } })
    } catch {
      // The page requires login, so this should always succeed; telemetry POSTs will keep retrying regardless.
    }
    void postTelemetry()
    void postStatus()
    stopBridgeClient()
    dataInterval = setInterval(postTelemetry, DATA_INTERVAL_MS)
    statusInterval = setInterval(postStatus, STATUS_INTERVAL_MS)
  }

  function stopBridgeClient() {
    if (dataInterval) {
      clearInterval(dataInterval)
      dataInterval = null
    }
    if (statusInterval) {
      clearInterval(statusInterval)
      statusInterval = null
    }
  }

  onBeforeUnmount(() => stopBridgeClient())

  return {
    bridgeToken,
    connected,
    liveAtcUrl,
    startBridgeClient,
    stopBridgeClient,
  }
}
