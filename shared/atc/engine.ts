import { reactive, computed } from 'vue'
import type { EngineState, FlightPlan, FlightVars, TelemetryState, Transmission,
  TransmissionDebug, RouteRequest, RouteCandidate, RouteResponse, Phase } from './types'
import { getPhase } from './phases'
import { renderTemplate } from './templateRenderer'
import { evaluateTelemetry } from './telemetryWatcher'

let txCounter = 0
function nextTxId(): string {
  return `tx-${Date.now()}-${++txCounter}`
}

function makeDefaultVars(): FlightVars {
  return {
    callsign: '', aircraft: '', dep: '', dest: '', stand: '', runway: '',
    sid: '', squawk: '', atis_code: '', initial_alt: '', flight_level: '',
    qnh: '', taxi_route: '', ground_freq: '', tower_freq: '',
    departure_freq: '', approach_freq: '', center_freq: '', atis_freq: '',
    wind: '', arrival_runway: '', arrival_stand: '', arrival_taxi_route: '',
    star: '', approach_type: '',
  }
}

function makeDefaultTelemetry(): TelemetryState {
  return {
    altitude_ft: 0, speed_kts: 0, groundspeed_kts: 0,
    vertical_speed_fpm: 0, heading_deg: 0,
    latitude_deg: 0, longitude_deg: 0, on_ground: true,
  }
}

function makeDefaultState(): EngineState {
  return {
    currentPhase: 'clearance',
    currentInteraction: null,
    waitingFor: 'pilot',
    vars: makeDefaultVars(),
    flags: { inAir: false, emergencyActive: false, previousPhase: null },
    telemetry: makeDefaultTelemetry(),
    sessionId: '',
    transmissions: [],
  }
}

export function useAtcEngine() {
  const state = reactive<EngineState>(makeDefaultState())

  const currentPhase = computed<Phase | undefined>(() => getPhase(state.currentPhase))

  // --- Internal helpers ---

  function logTransmission(
    speaker: Transmission['speaker'],
    message: string,
    debug: TransmissionDebug = {},
  ): Transmission {
    const phase = currentPhase.value
    const tx: Transmission = {
      id: nextTxId(),
      timestamp: new Date(),
      speaker,
      message,
      phase: state.currentPhase,
      frequency: phase?.frequency ?? '',
      debug,
    }
    state.transmissions.push(tx)
    return tx
  }

  function advancePhase(toPhase: string, trigger?: string): void {
    const from = state.currentPhase
    state.currentPhase = toPhase
    state.currentInteraction = null
    state.waitingFor = 'pilot'
    const phase = getPhase(toPhase)
    logTransmission('system', `Phase: ${from} → ${toPhase}${trigger ? ` (${trigger})` : ''}`, {
      engineAction: {
        templateUsed: '',
        variablesUpdated: {},
        phaseChanged: { from, to: toPhase },
      },
    })
    if (phase && !state.flags.inAir && toPhase === 'departure') {
      state.flags.inAir = true
    }
  }

  function getCandidates(): RouteCandidate[] {
    const phase = currentPhase.value
    if (!phase) return []
    return phase.interactions
      .filter((i) => {
        if (!i.when) return true
        return !!state.vars[i.when]
      })
      .map((i) => ({
        id: i.id,
        intent: i.pilotIntent,
        example: i.pilotExample ? renderTemplate(i.pilotExample, state.vars) : undefined,
      }))
  }

  function checkReadback(
    text: string,
    required: string[],
    vars: FlightVars,
  ): { complete: boolean; missing: string[] } {
    const lower = text.toLowerCase()
    const missing: string[] = []
    for (const field of required) {
      const val = vars[field]
      if (!val) continue
      if (!lower.includes(val.toLowerCase())) {
        missing.push(field)
      }
    }
    return { complete: missing.length === 0, missing }
  }

  function applyUpdates(updates: Record<string, any>): Record<string, any> {
    const applied: Record<string, any> = {}
    for (const [k, v] of Object.entries(updates)) {
      state.vars[k] = String(v)
      applied[k] = v
    }
    return applied
  }

  function handleHandoff(handoff: { toPhase: string; say?: string }, vars: FlightVars): string | null {
    if (handoff.say) {
      const msg = renderTemplate(handoff.say, vars)
      logTransmission('atc', msg, {
        engineAction: {
          templateUsed: handoff.say,
          variablesUpdated: {},
          handoff: { from: state.currentPhase, to: handoff.toPhase },
        },
      })
      advancePhase(handoff.toPhase, 'handoff')
      return msg
    }
    advancePhase(handoff.toPhase, 'handoff')
    return null
  }

  // --- Public API ---

  function initFlight(plan: FlightPlan): void {
    Object.assign(state, makeDefaultState())
    state.sessionId = `ses-${Date.now()}`
    state.vars.callsign = plan.callsign
    state.vars.dep = plan.dep
    state.vars.dest = plan.arr
    if (plan.aircraft) state.vars.aircraft = plan.aircraft
    if (plan.altitude) state.vars.flight_level = plan.altitude
    if (plan.squawk) state.vars.squawk = plan.squawk
    if (plan.assignedsquawk) state.vars.squawk = plan.assignedsquawk
    logTransmission('system', `Flight initialized: ${plan.callsign} ${plan.dep}→${plan.arr}`)
  }

  async function handlePilotInput(text: string, sttRaw?: string): Promise<string> {
    // 1. Log pilot transmission
    logTransmission('pilot', text, { sttRaw })

    // 2. Build candidates
    const candidates = getCandidates()
    const recentTx = state.transmissions.slice(-6).map(t => `[${t.speaker}] ${t.message}`)

    // 3. Route via LLM
    const req: RouteRequest = {
      pilotSaid: text,
      phase: state.currentPhase,
      interaction: state.currentInteraction,
      waitingFor: state.waitingFor,
      candidates,
      vars: { ...state.vars },
      recentTransmissions: recentTx,
    }

    const res = await $fetch<RouteResponse>('/api/atc/route', {
      method: 'POST',
      body: req,
    })

    // 4. Find chosen interaction
    const phase = currentPhase.value
    if (!phase) throw new Error(`Phase not found: ${state.currentPhase}`)

    const interaction = phase.interactions.find(i => i.id === res.chosen)
    if (!interaction) throw new Error(`Interaction not found: ${res.chosen}`)

    // 5. Apply updates
    let variablesUpdated: Record<string, any> = {}
    if (interaction.updates) {
      variablesUpdated = applyUpdates(interaction.updates)
    }

    // 6. Render ATC response
    const atcText = renderTemplate(interaction.atcResponse, state.vars)
    state.currentInteraction = interaction.id

    // 7. Handle readback
    let readbackResult: TransmissionDebug['readbackResult']
    if (state.waitingFor === 'readback' && interaction.readback) {
      readbackResult = res.readbackResult
        ?? checkReadback(text, interaction.readback.required, state.vars)
    }
    if (interaction.readback && state.waitingFor !== 'readback') {
      state.waitingFor = 'readback'
    } else {
      state.waitingFor = 'pilot'
    }

    // 8. Log ATC transmission
    logTransmission('atc', atcText, {
      llmRequest: {
        currentPhase: state.currentPhase,
        currentInteraction: state.currentInteraction,
        pilotSaid: text,
        candidates: candidates.map(c => ({ id: c.id, intent: c.intent })),
        contextSent: req.vars,
      },
      llmResponse: {
        chosenInteraction: res.chosen,
        confidence: res.confidence,
        reason: res.reason,
        tokensUsed: res.tokensUsed,
        durationMs: res.durationMs,
        model: res.model,
      },
      engineAction: {
        templateUsed: interaction.atcResponse,
        variablesUpdated,
      },
      readbackResult,
    })

    // 9. Handle handoff (after logging the main response)
    if (interaction.handoff) {
      const handoffMsg = handleHandoff(interaction.handoff, state.vars)
      if (handoffMsg) return `${atcText}\n${handoffMsg}`
    }

    return atcText
  }

  function updateTelemetry(data: Partial<TelemetryState>): void {
    Object.assign(state.telemetry, data)
    const phase = currentPhase.value
    if (!phase) return
    const event = evaluateTelemetry(state.telemetry, phase)
    if (event?.type === 'phase_advance' && event.toPhase) {
      logTransmission('system', `Telemetry auto-advance: ${event.trigger.condition}`, {
        telemetryTrigger: {
          parameter: event.trigger.parameter,
          condition: event.trigger.condition,
          value: event.trigger.value as number,
        },
      })
      advancePhase(event.toPhase, `telemetry: ${event.trigger.condition}`)
    }
  }

  function declareEmergency(type: 'mayday' | 'panpan'): void {
    state.flags.previousPhase = state.currentPhase
    state.flags.emergencyActive = true
    advancePhase('emergency', type)
    logTransmission('pilot', `${type.toUpperCase()}, ${type.toUpperCase()}, ${type.toUpperCase()}, ${state.vars.callsign}`)
  }

  function reset(): void {
    Object.assign(state, makeDefaultState())
  }

  return {
    state,
    currentPhase,
    initFlight,
    handlePilotInput,
    updateTelemetry,
    declareEmergency,
    reset,
  }
}
