import { computed, onUnmounted, ref, type Ref } from 'vue'
import { pmLog } from '../../shared/utils/pmLog'
import useCommunicationsEngine from '../../shared/utils/communicationsEngine'
import type { useFrequencyPresets } from '~/composables/useFrequencyPresets'
import type { useRadioSpeech } from '~/composables/useRadioSpeech'
import { FREQ_ROLE_LABEL, normalizedFrequencyValue } from '~/composables/useFrequencyPresets'
import { MAX_ACTIVE_TRAFFIC, resolveTrafficTier, targetTrafficCount } from '../../shared/data/trafficTiers'
import { createRng, trafficSeed, type Rng } from '../../shared/utils/aiTraffic/rng'
import { createCallsignFactory } from '../../shared/utils/aiTraffic/callsign'
import {
  DEFAULT_READBACK_PROTECTION_MS,
  evaluateGate,
  type GateInput,
} from '../../shared/utils/aiTraffic/gating'
import {
  applyDirect,
  cooldownSecFor,
  planInstruction,
  renderInstruction,
  type RadioEvent,
} from '../../shared/utils/aiTraffic/instructions'
import { nextFreeSlot } from '../../shared/utils/aiTraffic/separation'
import {
  NM_PER_FIX,
  advanceAircraft,
  advancePhase,
  createSimAircraft,
  findLeader,
  generateFixPool,
  isArrival,
  isDespawnable,
} from '../../shared/utils/aiTraffic/sim'
import type { SimAircraft } from '../../shared/utils/aiTraffic/types'

/**
 * Simulated background traffic on the tuned frequency (`ai-traffic`).
 *
 * A pure OBSERVER: it reads the engine, the session and the PTT state, and it
 * writes only to the speech queue and the communication log. It never touches
 * radioBackend — the Python backend owns the dialogue *with* the user, this owns
 * the radio *around* the user. The two share exactly two things: the speech
 * queue (arbitration) and the log (display).
 *
 * See docs/plans/2026-07-14-ai-traffic-architecture-design.md — this composable
 * is the design's four internal modules (CallsignFactory, TrafficSim,
 * InstructionPlanner, RadioScheduler) wired to Vue; all the rules themselves live
 * as pure functions under shared/utils/aiTraffic/ so they test without a browser.
 */

const TICK_MS = 1000

/** Traffic pairs are short by design, so a real ATC reply never waits long. */
const READBACK_DELAY_MS = 700
const ATC_REPLY_DELAY_MS = 900

/** Spawner cadence — a new arrival/departure every 30–120 s while under target. */
const SPAWN_INTERVAL_MIN_SEC = 30
const SPAWN_INTERVAL_MAX_SEC = 120

/** Runway occupancy booked per movement. */
const RUNWAY_SLOT_SEC = 90

export interface AiTrafficDeps {
  /** The settings toggle. */
  aiTrafficEnabled: Ref<boolean>
  /** usePttRecording — the user is holding PTT. */
  isRecording: Ref<boolean>
  /** useLiveAtcSession — a user transmission is out at the backend. */
  transmitInFlight: Ref<boolean>
  backendSessionId: Ref<string | null>
  backendExpectedPhrase: Ref<string | null>
  /** Stamped by scheduleControllerSpeech — opens the readback window. */
  lastControllerSpeechAtMs: Ref<number | null>
  currentScreen: Ref<'login' | 'flightselect' | 'scenario' | 'monitor' | 'complete'>
  freq: ReturnType<typeof useFrequencyPresets>
  speech: ReturnType<typeof useRadioSpeech>
  /** Infinity for the literal-strict reading of "ATC is awaiting a readback". */
  readbackProtectionMs?: number
}

export function useAiTraffic(
  engine: ReturnType<typeof useCommunicationsEngine>,
  deps: AiTrafficDeps,
) {
  const { currentState, variables: vars, appendLogEntry } = engine
  const {
    aiTrafficEnabled, isRecording, transmitInFlight,
    backendSessionId, backendExpectedPhrase, lastControllerSpeechAtMs,
    currentScreen, freq, speech,
  } = deps
  const { frequencies, airportFrequencies, airportName, activeAirportIcao } = freq
  const { speakWithRadioEffects } = speech

  // --- Pool state --------------------------------------------------------------
  let rng: Rng | null = null
  let callsigns: ReturnType<typeof createCallsignFactory> | null = null
  let fixPool: string[] = []
  let timer: ReturnType<typeof setInterval> | null = null

  /** Sim clock in seconds since start() — the timeline everything is booked on. */
  let nowSec = 0
  let nextSpawnAtSec = 0
  /** When the tuned frequency last carried anything, for ambient chatter. */
  let lastRadioAtSec = 0
  let ambientAfterSec = 60
  /** The last departure to use the runway, for the wake timer. */
  let lastDeparture: { type: SimAircraft['type']; atSec: number } | null = null

  const pool = ref<SimAircraft[]>([])
  /** Events whose gate was shut — re-checked on the next tick, never dropped. */
  const pending = ref<RadioEvent[]>([])
  const running = ref(false)

  /** Only what is on the tuned frequency is audible; the rest lives on, silently. */
  const audible = computed(() =>
    pool.value.filter(ac => normalizedFrequencyValue(ac.frequency) === normalizedFrequencyValue(frequencies.value.active)),
  )

  // --- Gating ------------------------------------------------------------------

  const gateInput = (): GateInput => ({
    aiTrafficEnabled: aiTrafficEnabled.value,
    isRecording: isRecording.value,
    transmitInFlight: transmitInFlight.value,
    sessionActive: Boolean(backendSessionId.value) && currentScreen.value === 'monitor',
    readback: {
      currentStateRole: (currentState.value as any)?.role,
      backendExpectedPhrase: backendExpectedPhrase.value,
      lastControllerSpeechAtMs: lastControllerSpeechAtMs.value,
      nowMs: Date.now(),
      readbackProtectionMs: deps.readbackProtectionMs ?? DEFAULT_READBACK_PROTECTION_MS,
    },
  })

  /** The chain, evaluated fresh. Called before enqueue AND again at playback. */
  const gateOpen = () => evaluateGate(gateInput()).open

  // --- Station / runway context ------------------------------------------------

  /** e.g. 'Frankfurt Approach' — whoever owns the frequency the traffic is on. */
  const stationName = () => {
    const active = normalizedFrequencyValue(frequencies.value.active)
    const entry = airportFrequencies.value.find(e => normalizedFrequencyValue(e.frequency) === active)
    const role = entry ? (FREQ_ROLE_LABEL[entry.type] || entry.type) : 'Radar'
    return airportName.value ? `${airportName.value} ${role}` : role
  }

  const activeRunway = () => String((vars as any).value?.runway || '25R')

  /**
   * Every reservation on the runway, the user's included. The user's aircraft is
   * a slot reservation, never a simulated position — simulated traffic always
   * yields to it, so the user never gets an extra instruction or delay out of
   * background traffic. Their flow belongs to the backend alone.
   */
  const occupiedSlots = () => {
    const slots = pool.value.filter(ac => ac.runwaySlot).map(ac => ac.runwaySlot!)
    const userSlot = userRunwayReservation()
    return userSlot ? [...slots, userSlot] : slots
  }

  /**
   * Derive the user's runway occupancy from the flow state. Departure flows block
   * the runway from line-up until airborne; arrival flows from the landing
   * clearance until the runway is vacated.
   */
  const userRunwayReservation = () => {
    const stateId = String((currentState.value as any)?.id || '').toLowerCase()
    if (!stateId) return null
    const blocking = /(line_?up|lineup|takeoff|take_?off|departure_roll|land|final|rollout|vacate)/.test(stateId)
    if (!blocking) return null
    // The user owns the runway for as long as they are on such a state; the slot
    // simply keeps being re-derived each tick while that holds.
    return { fromSec: nowSec, toSec: nowSec + RUNWAY_SLOT_SEC }
  }

  // --- Spawner -----------------------------------------------------------------

  const trafficTier = () =>
    resolveTrafficTier(activeAirportIcao.value, airportFrequencies.value.map(e => e.type))

  const targetPopulation = () => targetTrafficCount(trafficTier(), new Date().getHours())

  const spawnOne = () => {
    if (!rng || !callsigns) return
    if (pool.value.length >= MAX_ACTIVE_TRAFFIC) return
    const generated = callsigns.next()
    if (!generated) return // no distinct callsign available — simply don't spawn

    const kind = rng.chance(0.6) ? 'arrival' : 'departure'
    const aircraft = createSimAircraft(generated, kind, {
      rng,
      nowSec,
      frequency: frequencies.value.active,
      fixPool,
    })
    // Book the runway as late as it is free — traffic never cuts into a slot.
    const desired = { fromSec: nowSec + 120, toSec: nowSec + 120 + RUNWAY_SLOT_SEC }
    aircraft.runwaySlot = nextFreeSlot(desired, occupiedSlots())
    pool.value.push(aircraft)
    pmLog.debug('AI-TRAFFIC spawn', aircraft.callsign, aircraft.type.icao, kind)
  }

  const despawn = (aircraft: SimAircraft) => {
    callsigns?.release(aircraft.callsign)
    pool.value = pool.value.filter(ac => ac !== aircraft)
    pending.value = pending.value.filter(e => e.callsign !== aircraft.callsign)
    pmLog.debug('AI-TRAFFIC despawn', aircraft.callsign)
  }

  // --- RadioScheduler ----------------------------------------------------------

  /**
   * Speak one event as an atomic ATC-call + readback pair, so a real ATC reply
   * can never slot itself between the two. Only the FIRST element carries the
   * gate: once an exchange has started it plays out, exactly as a real frequency
   * would. The gate on that first element is the playback-time re-check — the
   * enqueue-time check already happened in dispatch().
   */
  const speakPair = (event: RadioEvent, aircraft: SimAircraft) => {
    const controllerFirst = event.order === 'atc_first'
    const first = controllerFirst
      ? { text: event.atcText, voice: undefined, speaker: 'atc' as const, delay: ATC_REPLY_DELAY_MS }
      : { text: event.pilotReadbackText, voice: aircraft.voiceId, speaker: 'pilot' as const, delay: 0 }
    const second = controllerFirst
      ? { text: event.pilotReadbackText, voice: aircraft.voiceId, speaker: 'pilot' as const, delay: READBACK_DELAY_MS }
      : { text: event.atcText, voice: undefined, speaker: 'atc' as const, delay: ATC_REPLY_DELAY_MS }

    const log = (speaker: 'atc' | 'pilot', text: string) =>
      appendLogEntry(speaker, text, currentState.value?.id ?? '', {
        frequency: aircraft.frequency,
        traffic: true,
      })

    // Only true once the first half has actually committed to being spoken. The
    // model update and the log hang off that, not off enqueueing: if the gate
    // shuts at playback the event goes back on the queue, and applying its
    // effects here would then apply them twice — splicing a direct out of the
    // route twice, or silently skipping a phase.
    let firstSpoken = false

    speakWithRadioEffects(first.text, {
      voice: first.voice,
      tag: 'ai-traffic',
      delayMs: first.delay,
      updateLastTransmission: false,
      useNormalizedForTTS: true,
      gate: gateOpen,
      onGateClosed: () => {
        pending.value.push(event)
        pmLog.debug('AI-TRAFFIC gate closed at playback —', event.callsign, 'requeued')
      },
      onSpoken: () => {
        firstSpoken = true
        lastRadioAtSec = nowSec
        log(first.speaker, first.text)
        applyEventEffects(event, aircraft)
      },
    })
    speakWithRadioEffects(second.text, {
      voice: second.voice,
      tag: 'ai-traffic',
      delayMs: second.delay,
      updateLastTransmission: false,
      useNormalizedForTTS: true,
      // Bound to the first half, not to the gating chain: once an exchange has
      // started it plays out (a real frequency doesn't cut off mid-readback), but
      // a pair that never started must not answer itself.
      gate: () => firstSpoken,
      onSpoken: () => log(second.speaker, second.text),
    })
  }

  /** The model update an instruction implies, applied once it has been spoken. */
  const applyEventEffects = (event: RadioEvent, aircraft: SimAircraft) => {
    const plan = event.plan
    // Leave this aircraft alone until the instruction has had time to work.
    aircraft.quietUntilSec = nowSec + cooldownSecFor(plan)
    switch (plan.kind) {
      case 'speed':
        if (aircraft.type.wake !== 'L' && plan.speedKts) aircraft.assignedSpeedKts = plan.speedKts
        break
      case 'vector':
        aircraft.vectorDelaySec += plan.vectorDelaySec ?? 90
        break
      case 'direct':
        if (plan.direct) applyDirect(aircraft, plan.direct)
        break
      case 'wake_hold':
        aircraft.nextEventAtSec = nowSec + (plan.holdSec ?? 60)
        if (aircraft.runwaySlot) {
          aircraft.runwaySlot = nextFreeSlot(
            { fromSec: nowSec + (plan.holdSec ?? 60), toSec: nowSec + (plan.holdSec ?? 60) + RUNWAY_SLOT_SEC },
            occupiedSlots().filter(s => s !== aircraft.runwaySlot),
          )
        }
        break
      case 'slot_hold':
        if (aircraft.runwaySlot) {
          aircraft.runwaySlot = nextFreeSlot(
            aircraft.runwaySlot,
            occupiedSlots().filter(s => s !== aircraft.runwaySlot),
          )
          aircraft.nextEventAtSec = aircraft.runwaySlot.fromSec
        }
        break
      case 'handover':
        aircraft.phase = 'handed_off'
        break
      case 'phase':
        if (rng) {
          advancePhase(aircraft, rng, nowSec)
          if (aircraft.phase === 'takeoff') lastDeparture = { type: aircraft.type, atSec: nowSec }
        }
        break
      default:
        break
    }
  }

  /** Try to get one pending event onto the frequency. One pair per tick, at most. */
  const dispatch = () => {
    if (!pending.value.length) return
    // Enqueue-time check. The same chain runs again at playback (see speakPair).
    const gate = evaluateGate(gateInput())
    if (!gate.open) return

    const event = pending.value.shift()!
    const aircraft = pool.value.find(ac => ac.callsign === event.callsign)
    if (!aircraft) return // despawned while the event sat in the queue
    speakPair(event, aircraft)
  }

  // --- The 1 Hz tick -----------------------------------------------------------

  const tick = () => {
    if (!running.value || !rng) return
    nowSec += TICK_MS / 1000

    for (const aircraft of [...pool.value]) {
      advanceAircraft(aircraft, TICK_MS / 1000)
      if (isDespawnable(aircraft)) despawn(aircraft)
    }

    // Population control. `target` can legitimately be 0 (a GA field at 03:00).
    const target = targetPopulation()
    if (pool.value.length > target) {
      // Over target (the clock crossed a band): let the extras leave quietly
      // rather than teleporting them away mid-exchange.
      const surplus = pool.value.filter(ac => !pending.value.some(e => e.callsign === ac.callsign))
      surplus.slice(target).forEach(ac => despawn(ac))
    } else if (pool.value.length < target && nowSec >= nextSpawnAtSec) {
      spawnOne()
      nextSpawnAtSec = nowSec + rng.int(SPAWN_INTERVAL_MIN_SEC, SPAWN_INTERVAL_MAX_SEC)
    }

    // Plan at most one new event per tick — the queue is FIFO and short pairs are
    // the whole point; flooding it would delay a real ATC reply.
    if (pending.value.length === 0) {
      for (const aircraft of audible.value) {
        const plan = planInstruction(aircraft, {
          nowSec,
          rng,
          leader: findLeader(aircraft, audible.value.filter(isArrival)),
          occupiedSlots: occupiedSlots(),
          lastDeparture,
          handover: aircraft.phase === 'handed_off' ? null : handoverFor(aircraft),
          nmPerFix: NM_PER_FIX,
          silentForSec: nowSec - lastRadioAtSec,
          ambientAfterSec,
        })
        if (!plan) continue
        pending.value.push(renderInstruction(aircraft, plan, {
          rng,
          station: stationName(),
          runway: activeRunway(),
        }))
        // Re-roll the ambient threshold so the frequency doesn't fall into a rhythm.
        ambientAfterSec = rng.int(45, 90)
        break
      }
    }

    dispatch()
  }

  /** Where an aircraft goes once it leaves this sector — the last call it makes. */
  const handoverFor = (aircraft: SimAircraft) => {
    const leaving =
      (aircraft.phase === 'climbout' && aircraft.altitudeFt > 6000)
      || (aircraft.phase === 'rollout' && aircraft.iasKts <= 0)
    if (!leaving) return null
    const entry = airportFrequencies.value.find(e => (aircraft.phase === 'climbout' ? e.type === 'DEP' || e.type === 'CTR' : e.type === 'GND'))
    if (!entry?.frequency) return null
    return {
      station: airportName.value ? `${airportName.value} ${FREQ_ROLE_LABEL[entry.type] || entry.type}` : (FREQ_ROLE_LABEL[entry.type] || entry.type),
      frequency: entry.frequency,
    }
  }

  // --- Lifecycle ---------------------------------------------------------------

  /** Called once startMonitoring() has a live backend session. */
  const start = (sessionId: string, airportIcao?: string) => {
    stop()
    const seed = trafficSeed(sessionId)
    rng = createRng(seed)
    fixPool = generateFixPool(createRng(`${seed}|${airportIcao ?? 'fixes'}`))
    callsigns = createCallsignFactory({
      rng,
      tier: trafficTier(),
      userCallsigns: [
        (vars as any).value?.callsign,
        (vars as any).value?.callsign_short,
      ].filter(Boolean),
    })
    nowSec = 0
    lastRadioAtSec = 0
    nextSpawnAtSec = 0
    lastDeparture = null
    ambientAfterSec = rng.int(45, 90)
    pool.value = []
    pending.value = []
    running.value = true
    timer = setInterval(tick, TICK_MS)
    pmLog.info('AI-TRAFFIC start', { seed, tier: trafficTier(), target: targetPopulation() })
  }

  /**
   * Spawner off, pool empty, pending events dropped. Anything already enqueued
   * invalidates itself through the playback-time gate, and the call that is
   * physically playing right now finishes (≤ ~8 s) — stopCurrentSpeech() is
   * global and would take a real queued ATC reply down with it.
   */
  const stop = () => {
    if (timer) { clearInterval(timer); timer = null }
    running.value = false
    pool.value = []
    pending.value = []
    rng = null
    callsigns = null
    lastDeparture = null
  }

  onUnmounted(stop)

  return {
    start,
    stop,
    running,
    /** Exposed for the debug panel: who is currently on the tuned frequency. */
    audible,
    pool,
    gateState: () => evaluateGate(gateInput()),
  }
}
