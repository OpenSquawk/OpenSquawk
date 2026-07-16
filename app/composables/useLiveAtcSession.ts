import { computed, nextTick, onUnmounted, ref } from 'vue'
import type { Ref } from 'vue'
import { pmLog } from '../../shared/utils/pmLog'
import { SCENARIOS, type Scenario } from '../../shared/constants/scenarios'
import { normalizedFrequencyValue, type useFrequencyPresets } from '~/composables/useFrequencyPresets'
import type { useSessionState } from '~/composables/useSessionState'
import { useApi } from '~/composables/useApi'
import type { useRadioSpeech } from '~/composables/useRadioSpeech'
import useCommunicationsEngine from '../../shared/utils/communicationsEngine'
import {
  parseSimControl,
  simControlRejectionSpeech,
  simControlResultSpeech,
  type SimControlCommand,
  type SimControlCommandResult,
} from '../../shared/utils/simControl'

export interface LiveAtcSessionDeps {
  state: ReturnType<typeof useSessionState>
  freq: ReturnType<typeof useFrequencyPresets>
  speech: ReturnType<typeof useRadioSpeech>
  radioBackend: ReturnType<typeof useRadioBackend>
  api: ReturnType<typeof useApi>
  /** NUXT_PUBLIC_* runtime config (radioBackendUrl, pttMinWords). */
  config: ReturnType<typeof useRuntimeConfig>
  /** Pre-generate ATIS audio once the airport is known (useAtisPlayback). */
  prefetchAtisAudio: () => void
  /** True while the pilot holds PTT — the silence timer must not talk over them. */
  isRecording: Ref<boolean>
  bridgeConnected: Ref<boolean>
  bridgePosition: Ref<{ lat: number; lon: number } | null>
  /** ?token=… from the route — auths the frequency-sim-control channel (design §4). */
  bridgeToken: Ref<string>
  persistSelectedPlan: (plan: any | null) => void
  maybeShowFirstRunHelp: () => void
}

/**
 * The session controller: everything that talks to the Python backend and moves
 * the user between screens.
 *
 * Constructed last, after every composable it calls into. The composables that
 * in turn need handlePilotTransmission/applyBackendDecision (speech, PTT,
 * bridge) receive them as thin forwarding closures from the page, which is what
 * breaks the cycle — see useSessionState for the other half of the split.
 */
export function useLiveAtcSession(
  engine: ReturnType<typeof useCommunicationsEngine>,
  deps: LiveAtcSessionDeps,
) {
  const {
    currentState, activeFlow, setActiveFlow, moveToSilent, patchVariables, patchFlags,
    appendLogEntry, initializeFlight, fetchRuntimeTree, isReady: engineReady,
    collectAtcStatesUntilPilotTurn, variables: vars, clearCommunicationLog,
  } = engine

  const {
    state, freq, speech, radioBackend, api, config, prefetchAtisAudio,
    isRecording, bridgeConnected, bridgePosition, bridgeToken,
    persistSelectedPlan, maybeShowFirstRunHelp,
  } = deps

  const {
    currentScreen, loading, error, pilotInput,
    vatsimId, flightPlans, selectedPlan,
    completedScenario, activeScenario,
    sessionStarting, sessionStartingMessage,
    backendSessionId, lastControllerSay, backendExpectedPhrase,
    lastReadbackReport, lastReadbackTranscript,
    setLastTransmission, clearLastTransmission,
  } = state

  const {
    frequencies, airportFrequencies, frequencySources, activeAirportIcao,
    expectedFrequencyForState, acceptedFrequenciesForState, extractAtisRunway,
    fetchAirportFrequencies,
  } = freq

  const {
    RADIO_CHECK_RE, SAY_AGAIN_RE, FAREWELL_RE,
    scheduleControllerSpeech, speakPilotReadback, answerRadioCheck,
  } = speech

  const { readbackEnabled } = speech

  // Monotonic counter so a newer pilot transmission supersedes an older one still
  // awaiting its backend response — only the latest result is applied (#16).
  let transmitGeneration = 0

  // True while a pilot transmission is out at the backend. Read by useAiTraffic's
  // gating chain: simulated traffic must not key up in the window between the
  // user finishing their call and ATC answering it, or the traffic call reads as
  // the reply. A counter rather than a boolean, so two overlapping transmissions
  // can't have the first one's finally clear the flag out from under the second.
  const transmitInFlightCount = ref(0)
  const transmitInFlight = computed(() => transmitInFlightCount.value > 0)

  // --- Silence auto-advance ----------------------------------------------------
  // Some pilot states let ATC continue on its own when the pilot stays quiet
  // (e.g. the takeoff roll in tower-v1: no report needed, Tower hands off after a
  // while anyway). Such states carry auto_advance_on_silence +
  // auto_advance_timeout_ms in the runtime tree; whenever the session lands on
  // one, arm a timer that fires the backend /timeout endpoint. Any pilot
  // transmission or telemetry-fired advance re-arms or clears it via
  // applyBackendDecision.
  let silenceTimer: ReturnType<typeof setTimeout> | null = null

  function clearSilenceTimer() {
    if (silenceTimer) {
      clearTimeout(silenceTimer)
      silenceTimer = null
    }
  }

  function armSilenceTimer() {
    clearSilenceTimer()
    const state = currentState.value as any
    if (!state?.auto_advance_on_silence || !backendSessionId.value) return
    const ms = Math.max(1000, Number(state.auto_advance_timeout_ms ?? 30000))
    const sessionAtArm = backendSessionId.value
    const stateAtArm = state.id
    pmLog.debug('SILENCE TIMER armed', { state: stateAtArm, ms })
    const fire = async () => {
      silenceTimer = null
      // Never fire stale: the session ended or the state moved on while waiting.
      if (backendSessionId.value !== sessionAtArm) return
      if ((currentState.value as any)?.id !== stateAtArm) return
      // Don't talk over the pilot mid-PTT — check again shortly.
      if (isRecording.value) {
        silenceTimer = setTimeout(fire, 5000)
        return
      }
      try {
        pmLog.info('SILENCE TIMEOUT fired →', stateAtArm)
        const response = await radioBackend.timeout(sessionAtArm)
        applyBackendDecision(response)
      } catch (e: any) {
        // 422 = the state changed under us (race with a transmission) — harmless.
        const status = e?.status ?? e?.response?.status
        if (status !== 422) pmLog.warn('SILENCE TIMEOUT failed', e)
      }
    }
    silenceTimer = setTimeout(fire, ms)
  }

  // Apply a backend decision (from a pilot transmission, a telemetry tick, or a
  // silence timeout) to the local engine + UI: sync the
  // flow/cursor/variables/flags, speak the controller reply, and surface
  // completion. Shared so all backend-driven ATC lands through one code path.
  const applyBackendDecision = (
    response: import('./useRadioBackend').RadioTransmitResponse,
    opts: { transcript?: string } = {},
  ) => {
    // If the backend has chained to a different flow, switch the local engine
    // first so moveToSilent can find the new states and expectedFrequencyForState()
    // returns the correct frequency_name.
    if (response.active_flow && response.active_flow !== activeFlow.value) {
      pmLog.info('FLOW CHANGE  local:', activeFlow.value, '→ backend:', response.active_flow)
      try {
        setActiveFlow(response.active_flow)
      } catch (e) {
        pmLog.warn('setActiveFlow failed for', response.active_flow, e)
      }
    }

    // Advance local cursor through every state the backend auto-walked, then the
    // final state. moveToSilent updates current_unit, actions, handoffs and the
    // communication log without scheduling further auto-transitions.
    for (const stateId of response.auto_advanced_states ?? []) {
      pmLog.debug('moveToSilent ← auto_advanced:', stateId)
      moveToSilent(stateId)
    }
    pmLog.debug('moveToSilent ← next_state_id:', response.next_state_id)
    moveToSilent(response.next_state_id)

    // Capture the per-field readback diagnostic for the STT debug panel.
    lastReadbackReport.value = response.readback_report ?? []
    if (opts.transcript !== undefined) lastReadbackTranscript.value = opts.transcript

    // Update expected phrase AFTER cursor moves so any local-engine reactive
    // updates from moveToSilent have already settled.
    backendExpectedPhrase.value = response.expected_pilot_template ?? null

    // Sync variables + routing flags from backend so the local renderer stays in step.
    if (response.variables && Object.keys(response.variables).length) {
      patchVariables(response.variables)
      pmLog.debug('variables synced:', response.variables)
    }
    if (response.flags && Object.keys(response.flags).length) {
      patchFlags(response.flags)
      pmLog.debug('flags synced:', response.flags)
    }

    // TTS: use the pre-rendered string from the backend (correct variable values).
    let sayText = response.controller_say_rendered || response.controller_say_template
    const rb = response.readback_report ?? []
    const readbackPassed = rb.length > 0 && rb.every((r: any) => r.matched)
    if (sayText && readbackPassed && !/^\s*(readback correct|correct[,.\s]|negative|i say again)/i.test(sayText)) {
      sayText = `Readback correct. ${sayText}`
    }
    if (sayText) {
      pmLog.info('TTS →', sayText)
      lastControllerSay.value = sayText
      scheduleControllerSpeech(sayText)
      appendLogEntry('atc', sayText, response.next_state_id, {
        flow: response.active_flow,
        frequency: frequencies.value.active,
      })
    }

    if (response.fallback_used) {
      pmLog.warn('FALLBACK USED:', response.fallback_reason)
      console.warn('[Backend] Fallback used:', response.fallback_reason)
    }

    if (response.session_complete) {
      pmLog.info('SESSION COMPLETE — showing completion screen')
      completedScenario.value = activeScenario.value
      currentScreen.value = 'complete'
    }

    // Re-arm (or clear) the silence auto-advance for whatever state we're now on.
    armSilenceTimer()
  }

  // --- Frequency-sim-control (design doc §4) ------------------------------------
  // A matched command from handlePilotTransmission is queued server-side for the
  // bridge to execute; the result comes back asynchronously via the /api/bridge/live
  // poll (see handleSimControlResult below), so this call itself stays silent on
  // success — only a network/enqueue failure gets an immediate ATC reply.
  const sendSimControlCommand = async (command: SimControlCommand) => {
    try {
      await $fetch('/api/bridge/command', {
        method: 'POST',
        headers: { 'x-bridge-token': bridgeToken.value },
        body: { command },
      })
    } catch (e) {
      pmLog.warn('SIM CONTROL enqueue failed', e)
      const reply = 'unable to reach bridge, say again'
      scheduleControllerSpeech(reply)
      appendLogEntry('atc', reply, currentState.value?.id ?? '', { frequency: frequencies.value.active })
    }
  }

  /** Speak the outcome of a bridge command surfaced by useSimBridgeSync's telemetry poll. */
  const handleSimControlResult = (result: SimControlCommandResult) => {
    const reply = simControlResultSpeech(result)
    scheduleControllerSpeech(reply)
    appendLogEntry('atc', reply, currentState.value?.id ?? '', { frequency: frequencies.value.active })
  }

  const handlePilotTransmission = async (message: string, source: 'text' | 'ptt' = 'text') => {
    const transcript = message.trim()
    // Ignore empty or content-free transmissions: silence, a stray PTT tap, or
    // Whisper hallucinating punctuation on near-silent audio. A genuine short call
    // ("roger", "wilco") still contains letters/digits and passes.
    if (!transcript || !/[a-z0-9]/i.test(transcript)) return

    // STT MINIMUM-WORD GATE — search here if a spoken transmission was ignored.
    // Voice (PTT) only: drop transcripts shorter than the configured minimum.
    // Whisper hallucinates short real words ("Test", "Thank you", "Okay") on
    // near-silent or noisy audio; left unfiltered those reach the backend as a
    // (wrong) readback attempt — counting toward the 3x-skip — and now also
    // trigger a paid LLM-router call. Text input is exempt so deliberate short
    // commands still work. Threshold is the NUXT_PUBLIC_PTT_MIN_WORDS env var
    // (default 2); set it to 1 to effectively disable the gate.
    const minPttWords = Number(config.public.pttMinWords ?? 2)
    if (source === 'ptt' && transcript.split(/\s+/).filter(Boolean).length < minPttWords) {
      pmLog.info(`IGNORED short PTT transcript (<${minPttWords} words):`, transcript)
      return
    }

    // Mark this as the latest transmission; a newer one started before the backend
    // replies supersedes it (the stale reply is dropped below).
    const myGen = ++transmitGeneration

    const prefix = source === 'ptt' ? 'Pilot (PTT)' : 'Pilot'
    setLastTransmission(`${prefix}: ${transcript}`)

    // Log the pilot's call with the ACTUAL tuned frequency (the engine's own
    // notion of "active frequency" is unit-derived and can lag what's tuned).
    appendLogEntry('pilot', transcript, currentState.value?.id ?? '', {
      frequency: frequencies.value.active,
    })

    if (readbackEnabled.value) {
      speakPilotReadback(transcript)
    }

    // --- Radio check ---
    // A service call, valid on ANY frequency and answered by whoever owns it.
    // Handled entirely locally: it must bypass the wrong-frequency gate (its
    // purpose is verifying the tuned frequency) and never reach the backend
    // flow engine (the training state stays untouched).
    if (RADIO_CHECK_RE.test(transcript)) {
      answerRadioCheck(transcript)
      return
    }

    // --- Say again ---
    // Pilot asks ATC to repeat. Handled locally: re-speak the last controller
    // transmission without advancing the flow.
    if (SAY_AGAIN_RE.test(transcript) && lastControllerSay.value) {
      const reply = `I say again. ${lastControllerSay.value}`
      scheduleControllerSpeech(reply)
      appendLogEntry('atc', reply, currentState.value?.id ?? '', { frequency: frequencies.value.active })
      return
    }

    // --- Sign-off ---
    // A bare goodbye / thank-you (no readback or request alongside): acknowledge
    // politely instead of evaluating it as a transmission. Requires a farewell
    // with no digits, no readback/acknowledgement words, and only a few words, so
    // it never swallows a real call like "wilco, thanks" or a frequency readback.
    const wordCount = transcript.split(/\s+/).filter(Boolean).length
    const hasActionWord = /\b(wilco|roger|cleared|clear|runway|contact|ready|request|squawk|descend|climb|taxi|line\s?up|holding|hold short|approved|affirm|going|switching|push|startup)\b/i.test(transcript)
    if (FAREWELL_RE.test(transcript) && !/\d/.test(transcript) && !hasActionWord && wordCount <= 6) {
      const cs = (vars as any).value?.callsign ?? ''
      const reply = cs ? `Good day, ${cs}.` : 'Good day.'
      scheduleControllerSpeech(reply)
      appendLogEntry('atc', reply, currentState.value?.id ?? '', { frequency: frequencies.value.active })
      return
    }

    // --- Sim control (frequency-driven simulator command) ---
    // A meta channel: the pilot talking to their OWN simulator, not ATC — so it
    // runs before the frequency gate (like radio check) and, unlike every other
    // transmission, never reaches radioBackend.transmit()/the decision flow.
    // Only live while a bridge is actually connected (design doc §4); parseSimControl's
    // anchors already keep it from ever matching real ICAO phraseology either way.
    if (bridgeConnected.value) {
      const simResult = parseSimControl(transcript)
      if (simResult.matched) {
        void sendSimControlCommand(simResult.command)
        return
      }
      if (simResult.reason !== 'no_intent') {
        const reply = simControlRejectionSpeech(simResult.reason)
        scheduleControllerSpeech(reply)
        appendLogEntry('atc', reply, currentState.value?.id ?? '', { frequency: frequencies.value.active })
        return
      }
    }

    // --- Frequency check ---
    // Reject the transmission if the pilot is on the wrong frequency. A position
    // can publish several valid frequencies (e.g. two Tower freqs); accept any of
    // them, and only fall back to the single expected value when no list resolves.
    const expectedFreq = expectedFrequencyForState()
    const acceptedFreqs = acceptedFrequenciesForState()
    const activeNorm = normalizedFrequencyValue(frequencies.value.active)
    const onValidFreq = acceptedFreqs.length
      ? acceptedFreqs.includes(activeNorm)
      : frequencies.value.active === expectedFreq
    if (expectedFreq && !onValidFreq) {
      const callsign = (vars as any).value?.callsign ?? ''
      const freqName = (currentState.value as any)?.frequency_name as string | undefined
      // Tell the pilot exactly which frequency to switch to (and the position),
      // since tuning is manual and the call won't go through until they do.
      const target = freqName ? `${freqName} on ${expectedFreq}` : expectedFreq
      const reply = callsign
        ? `${callsign}, you are on the wrong frequency. Contact ${target}.`
        : `Station calling, wrong frequency. Contact ${target}.`
      pmLog.warn('WRONG FREQUENCY', { active: frequencies.value.active, expected: expectedFreq })
      lastControllerSay.value = reply
      scheduleControllerSpeech(reply)
      // Add the ATC "wrong frequency" reply to the communication log.
      appendLogEntry('atc', reply, currentState.value?.id ?? '', {
        offSchema: true,
        frequency: frequencies.value.active,
      })
      return
    }

    if (!backendSessionId.value) {
      pmLog.error('TRANSMIT BLOCKED — no backend session', { transcript, source })
      console.error('No backend session — cannot transmit')
      setLastTransmission(`${prefix}: ${transcript} (no session)`)
      return
    }

    pmLog.group(`▶ TRANSMIT  [${source}]  session=${backendSessionId.value.slice(0,8)}`, () => {
      pmLog.info('utterance   :', transcript)
      pmLog.info('local state :', currentState.value?.id ?? '—')
      pmLog.info('session_id  :', backendSessionId.value)
    })

    transmitInFlightCount.value++
    try {
      // The pilot spoke — a pending silence auto-advance no longer applies. The
      // response re-arms it if the next state also allows silence.
      clearSilenceTimer()
      const response = await radioBackend.transmit(backendSessionId.value, transcript)

      // Drop a stale reply if the pilot already transmitted again while this call
      // was in flight — only the newest transmission's result is applied (#16).
      if (myGen !== transmitGeneration) {
        pmLog.info('Discarded stale transmission reply (superseded by a newer transmission)')
        return
      }

      pmLog.group(`✓ RESPONSE  ${currentState.value?.id ?? '?'} → ${response.next_state_id}`, () => {
        pmLog.info('next_state        :', response.next_state_id)
        pmLog.info('auto_advanced     :', response.auto_advanced_states ?? [])
        pmLog.info('fallback_used     :', response.fallback_used, response.fallback_reason ?? '')
        pmLog.info('say_template      :', response.controller_say_template ?? '—')
        pmLog.info('say_rendered      :', response.controller_say_rendered ?? '—')
        pmLog.info('expected_pilot    :', response.expected_pilot_template ?? '—')
        pmLog.info('variables         :', response.variables)
        pmLog.info('flags             :', response.flags)
        if (response.trace?.length) {
          pmLog.debug('trace:')
          response.trace.forEach(t => pmLog.debug(`  [${t.type}]`, t.message))
        }
      })

      applyBackendDecision(response, { transcript })
    } catch (e: any) {
      const status = e?.status ?? e?.response?.status
      if (status === 404) {
        // Session expired (idle timeout) or backend restarted without the
        // persisted session — reset to scenario selection for a clean restart.
        pmLog.error('SESSION GONE (404) — resetting to scenario selection', { session: backendSessionId.value })
        backendSessionId.value = null
        error.value = 'Session expired — please start the scenario again.'
        currentScreen.value = 'scenario'
        return
      }
      pmLog.error('TRANSMIT FAILED', { transcript, session: backendSessionId.value, error: e })
      console.error('Backend transmission failed', e)
      setLastTransmission(`${prefix}: ${transcript} (backend failed)`)
    } finally {
      transmitInFlightCount.value = Math.max(0, transmitInFlightCount.value - 1)
    }
  }

  // VATSIM Integration
  const loadFlightPlans = async () => {
    if (!vatsimId.value) return

    loading.value = true
    error.value = ''

    try {
      const response = await api.get('/api/vatsim/flightplans', {
        query: { cid: vatsimId.value }
      })

      if (Array.isArray(response) && response.length > 0) {
        flightPlans.value = response.slice(0, 10)
        currentScreen.value = 'flightselect'
      } else {
        error.value = 'No flight plans found for this VATSIM ID'
      }
    } catch (err) {
      console.error('Error loading flight plans:', err)
      error.value = 'Error loading flight plans. Please check the VATSIM ID.'
    } finally {
      loading.value = false
    }
  }

  const startMonitoring = async (flightPlan: any, scenario: Scenario) => {
    activeScenario.value = scenario
    sessionStarting.value = true
    sessionStartingMessage.value = /^taxi/.test(scenario.startFlow)
      ? 'Calculating taxi route…'
      : 'Starting session…'

    // 1. Ensure the local tree is loaded from the Python backend (same source as session)
    try {
      if (!engineReady.value) {
        await fetchRuntimeTree(scenario.startFlow, config.public.radioBackendUrl as string)
      }
    } catch (err) {
      console.error('Failed to prepare decision engine', err)
      error.value = 'Entscheidungsbaum konnte nicht geladen werden.'
      sessionStarting.value = false
      return
    }

    // 2. Initialize the local flight engine first so generated values (stand, SID, squawk)
    //    are computed and available in vars.value before we create the backend session.
    initializeFlight(flightPlan)

    // 3a. Resolve which airport to use for frequencies.
    //     Departure scenarios use the dep airport; arrival scenarios use arr.
    const scenarioIcao: string | undefined =
      scenario.airport === 'arr'
        ? (flightPlan.arr || flightPlan.arrival || flightPlan.dep || flightPlan.departure)
        : (flightPlan.dep || flightPlan.departure || flightPlan.arr || flightPlan.arrival)
    activeAirportIcao.value = scenarioIcao

    // Fetch real airport frequencies BEFORE building backendVariables so that
    // all freq vars are resolved from live VATSIM/OpenAIP data.
    await fetchAirportFrequencies(scenarioIcao)

    // Runway in use from live ATIS (the flight plan carries no runway). Falls
    // back to the engine-generated one when no ATIS text mentions a runway.
    const atisRunway = extractAtisRunway(scenario.airport === 'arr' ? 'arr' : 'dep')
    if (atisRunway) {
      patchVariables({ runway: atisRunway })
      pmLog.info('Runway from ATIS:', atisRunway)
    }

    // Pre-generate the ATIS TTS audio now so the first tune-in plays instantly
    // instead of waiting for generation. Fire-and-forget.
    prefetchAtisAudio()

    // 3b. Build the backend variable payload.  The backend stores ALL keys so that
    //     frequencies declared in downstream chained flows (tower_freq for taxi-v1,
    //     departure_freq for tower-v1, etc.) are already populated with real airport
    //     values when the session advances to those flows.
    const v = (vars as any).value
    const backendVariables: Record<string, any> = {
      callsign:         v.callsign         || flightPlan.callsign || 'UNKNOWN',
      information:      v.atis_code        || 'K',
      destination:      v.dest             || flightPlan.arr || flightPlan.arrival || 'Unknown',
      stand:            v.stand            || 'A1',
      sid:              v.sid              || 'UNKNOWN1A',
      initial_altitude: String(v.initial_altitude_ft ?? 5000),
      squawk:           String(v.squawk ?? '2000'),
      // Shared / arrival variables. The engine generates these, but they were not
      // being forwarded — so arrival flows (and taxi/tower on departure) fell back
      // to YAML defaults and ignored the selected flight. Names are mapped to the
      // backend flow conventions (qnh_hpa→qnh, acf_type→aircraft_type, …).
      runway:           atisRunway         || v.runway || '25R',
      qnh:              String(v.qnh_hpa ?? '1013'),
      surface_wind:     v.surface_wind     || '250/08',
      // taxi_route is intentionally NOT sent: the backend computes the real OSM
      // taxi route (and crossings) from airport_icao + stand/runway, and falls
      // back to the flow's YAML default on its own. Sending a placeholder here
      // would count as a caller override and suppress that computation.
      aircraft_type:    v.acf_type         || 'A320',
      cruise_level:     v.cruise_flight_level || 'FL360',
      assigned_squawk:  String(v.squawk ?? '2000'),
      // All airport frequencies — available to every flow in the chain.
      delivery_freq:    v.delivery_freq    || '121.950',
      ground_freq:      v.ground_freq      || '121.800',
      tower_freq:       v.tower_freq       || '118.700',
      departure_freq:   v.departure_freq   || '120.000',
      approach_freq:    v.approach_freq    || '119.000',
      handoff_freq:     v.handoff_freq     || '131.150',
    }

    // VFR flights identify by aircraft registration, not an airline callsign.
    // Assign a German D-registration and its abbreviated form (D-EMIL -> D-IL,
    // first letter + last two), which ATC uses after the first call. Mirror it
    // into the local engine vars and HUD so the display matches the radio.
    if (scenario.startFlow.startsWith('vfr') || scenario.startFlow.startsWith('info')) {
      const pool = ['D-EMIL', 'D-EKLM', 'D-ENNY', 'D-ELLA', 'D-EOMT', 'D-ELPC', 'D-EMTO', 'D-EBRA']
      const reg = pool[Math.floor(Math.random() * pool.length)]
      const short = `D-${reg.replace(/^D-/, '').slice(-2)}`
      backendVariables.callsign = reg
      backendVariables.callsign_short = short
      patchVariables({ callsign: reg, callsign_short: short })
    } else {
      backendVariables.callsign_short = backendVariables.callsign
    }
    pmLog.info('backend variables payload:', backendVariables)

    // 4. Create a backend session with the flight-plan-derived variables
    try {
      error.value = ''
      const session = await radioBackend.createSession(
        scenario.startFlow,
        backendVariables,
        scenario.noChain,
        scenarioIcao,
        v.dest || flightPlan.arr || flightPlan.arrival,
        // Live aircraft position (bridge connected): backend starts the taxi
        // route at the real parking position instead of a random stand.
        bridgeConnected.value ? bridgePosition.value : null,
      )
      backendSessionId.value = session.session_id
      pmLog.group(`SESSION CREATED  id=${session.session_id.slice(0, 8)}`, () => {
        pmLog.info('flow        :', session.flow_slug)
        pmLog.info('start state :', session.current_state)
        pmLog.info('variables   :', session.variables)
        pmLog.info('flags       :', session.flags)
      })
      // Sync cursor to wherever the backend initialised (usually start_state)
      moveToSilent(session.current_state)
      pmLog.debug('moveToSilent ← session start_state:', session.current_state)
      // Sync session variables back so the local renderer stays in step.
      if (session.variables && Object.keys(session.variables).length) {
        patchVariables(session.variables)
      }
      // Sync boolean routing flags from session
      if (session.flags && Object.keys(session.flags).length) {
        patchFlags(session.flags)
      }
      // Seed the expected pilot phrase from the start state
      backendExpectedPhrase.value = session.expected_pilot_template ?? null
      pmLog.info('expected_pilot (session start):', backendExpectedPhrase.value ?? '—')
    } catch (err) {
      pmLog.error('SESSION CREATE FAILED', err)
      console.error('Failed to create backend session', err)
      error.value = 'Verbindung zum Training-Backend fehlgeschlagen.'
      return
    } finally {
      // The slow part (route computation) is done once createSession resolves.
      sessionStarting.value = false
    }

    error.value = ''
    selectedPlan.value = flightPlan
    currentScreen.value = 'monitor'
    persistSelectedPlan(flightPlan)
    maybeShowFirstRunHelp()

    // Start from a known baseline; the first controller's frequency is tuned in
    // automatically below, once the initial state-walk tells us which pilot state
    // the scenario opens on.
    frequencies.value.active = '121.900'
    frequencies.value.standby = '118.100'

    // 4. Walk the initial ATC/system states locally (deterministic, no LLM).
    //    Safe because we loaded the tree from the same Python backend, so the
    //    walk is identical to what the backend will do on the first transmission.
    try {
      await nextTick()
      const startMessages = collectAtcStatesUntilPilotTurn()
      for (const msg of startMessages) {
        scheduleControllerSpeech(msg.say_tpl)
      }
    } catch (err) {
      console.warn('Initial state advance failed:', err)
    }

    // Pre-tune COM1 active to the frequency the opening pilot call is expected on,
    // so the very first transmission isn't met with a confusing 'wrong frequency'
    // rejection. Later handoffs stay manual — tuning to the next controller
    // remains part of the exercise.
    await nextTick()
    const firstFreq = expectedFrequencyForState()
    if (firstFreq) {
      frequencies.value.active = firstFreq
      pmLog.info('Pre-tuned COM1 active to first frequency:', firstFreq)
    }
  }

  const startDemoFlight = () => {
    const demoFlight = {
      callsign: 'DLH39A',
      aircraft: 'A320/L',
      dep: 'EDDF',
      arr: 'EDDM',
      altitude: '36000',
    }
    selectedPlan.value = demoFlight
    currentScreen.value = 'scenario'
  }

  /** Launch a specific scenario with the current flight plan. */
  const launchScenario = async (scenario: Scenario) => {
    if (!selectedPlan.value) return
    await startMonitoring(selectedPlan.value, scenario)
  }

  /** Re-fly the same scenario that was just completed. */
  const flyAgain = async () => {
    if (!completedScenario.value || !selectedPlan.value) {
      currentScreen.value = 'scenario'
      return
    }
    await startMonitoring(selectedPlan.value, completedScenario.value)
  }

  const backToSetup = () => {
    currentScreen.value = 'login'
    selectedPlan.value = null
    persistSelectedPlan(null)
    clearLastTransmission()
    airportFrequencies.value = []
    frequencySources.value = { vatsim: false, openaip: false }
  }

  const sendPilotText = async () => {
    const text = pilotInput.value.trim()
    if (!text) return

    pilotInput.value = ''
    await handlePilotTransmission(text, 'text')
  }

  /**
   * Restore a /live-atc session from a saved bug-report snapshot (admin link
   * `/live-atc?restoreBugReport=<id>`). The Python backend has no "resume mid-session"
   * endpoint, so we recreate a real, working session for the SAME flight and
   * scenario via startMonitoring(), then overlay the saved variables/flags and
   * the captured conversation so the admin can reproduce and try out the bug.
   */
  async function restoreBugReportState(restoreId: string) {
    try {
      const report = await api.get<any>(`/api/admin/bug-reports/${restoreId}`)
      const state = report?.pmState
      if (!state) {
        error.value = 'Bug-Report enthält keinen gespeicherten State.'
        return
      }

      // Locate the scenario the report was captured in.
      const scenario =
        SCENARIOS.find(s => s.id === state.scenarioId) ||
        SCENARIOS.find(s => s.startFlow === state.flowSlug)
      if (!scenario) {
        error.value = `Bug-Report-Restore: Szenario "${state.scenarioId || state.flowSlug || '?'}" nicht gefunden.`
        return
      }

      // Reconstruct a flight plan from the snapshot so startMonitoring resolves the
      // correct airport/frequencies and creates a backend session for the same flight.
      const v = state.variables || {}
      const fc = state.flightContext || {}
      const dep = v.dep || fc.dep
      const dest = v.dest || fc.dest
      const flightPlan: Record<string, any> = {
        callsign: v.callsign || fc.callsign || 'UNKNOWN',
        aircraft: v.acf_type || fc.acf_type || 'A320',
        dep,
        departure: dep,
        arr: dest,
        arrival: dest,
        route: fc.route || v.route || '',
        assignedsquawk: v.squawk,
      }

      // Spin up a real session (loads tree, fetches frequencies, creates backend session).
      await startMonitoring(flightPlan, scenario)
      // startMonitoring bails out on error without entering the monitor screen.
      if (currentScreen.value !== 'monitor') return

      // Overlay the exact saved values over the freshly generated ones (stand, SID, …).
      if (state.variables && Object.keys(state.variables).length) patchVariables(state.variables)
      if (state.flags && Object.keys(state.flags).length) patchFlags(state.flags)

      // Restore the captured conversation for context.
      clearCommunicationLog?.()
      if (Array.isArray(state.communicationLog)) {
        for (const e of state.communicationLog) {
          if (!e?.message) continue
          appendLogEntry(e.speaker || 'system', e.message, e.state || '', {
            frequency: e.frequency,
            flow: e.flow,
            radioCheck: e.radioCheck,
            offSchema: e.offSchema,
          })
        }
      }

      // A fresh backend session always starts at the flow's start state, so we
      // can't fake the local cursor onto the captured mid-flow state without
      // desyncing transmits. Tell the admin where the bug was captured instead.
      error.value =
        `Bug-Report wiederhergestellt: ${scenario.name} · ${flightPlan.callsign} (${dep || '?'}→${dest || '?'}). ` +
        `Erfasster State: ${state.currentStateId || '?'} (Flow ${state.flowSlug || '?'}).`
    } catch (err) {
      console.warn('[PM] Bug report restore failed', err)
      error.value = 'Bug-Report konnte nicht wiederhergestellt werden.'
    }
  }

  onUnmounted(clearSilenceTimer)

  return {
    clearSilenceTimer,
    transmitInFlight,
    applyBackendDecision,
    handlePilotTransmission,
    handleSimControlResult,
    loadFlightPlans,
    startMonitoring,
    startDemoFlight,
    launchScenario,
    flyAgain,
    backToSetup,
    sendPilotText,
    restoreBugReportState,
  }
}
