import { computed, nextTick, ref } from 'vue'
import useCommunicationsEngine from '../../shared/utils/communicationsEngine'

export interface DebugSimulationDeps {
  setLastTransmission: (text: string) => void
  clearLog: () => void
  startDemoFlight: () => void
}

/**
 * Debug drawer state: the scripted end-to-end flow simulation, the decision
 * trace the panel renders, and the current/next-state inspectors.
 *
 * Only the debug panel constructs this — nothing on the normal cockpit path
 * depends on it.
 */
export function useDebugSimulation(
  engine: ReturnType<typeof useCommunicationsEngine>,
  deps: DebugSimulationDeps,
) {
  const {
    currentState, nextCandidates, variables: vars, flags, lastDecisionTrace,
    getStateDetails, moveTo: forceMove, normalizeATCText, renderATCMessage,
    processPilotTransmission, buildLLMContext, applyLLMDecision,
  } = engine
  const { setLastTransmission, clearLog, startDemoFlight } = deps

  const simulationRunning = ref(false)
  const simulationTrace = ref<SimulationTraceEntry[]>([])
  const simulationError = ref('')

  type SimulationDecisionTemplate = {
    next: string
    controllerSayState?: string
    controllerSayTpl?: string
    updates?: Record<string, any>
    note?: string
  }

  type SimulationTraceEntry = {
    kind: 'info' | 'pilot' | 'atc' | 'llm-input' | 'llm-output'
    id: string
    label: string
    payload?: any
  }

  const completedPilotSteps = computed(() => simulationTrace.value.filter(entry => entry.kind === 'pilot').length)

  const simulationPilotSteps = [
    'CD_CHECK_ATIS',
    'CD_VERIFY_READBACK',
    'GRD_READY_FOR_PUSH',
    'GRD_TAXI_REQUEST',
    'GRD_TAXI_READBACK',
    'TWR_LINEUP_REQ',
    'TWR_TAKEOFF_READBACK',
    'DEP_IDENT',
    'DEP_CLIMB_READBACK',
    'DES_READBACK',
    'APP_ESTABLISHED',
    'TWR_LAND_READBACK',
    'GRD_TAXI_IN_REQ',
    'GRD_TAXI_IN_READBACK'
  ] as const

  type SimulationPilotState = typeof simulationPilotSteps[number]

  const simulationDecisions: Record<SimulationPilotState, SimulationDecisionTemplate> = {
    CD_CHECK_ATIS: {
      next: 'CD_ISSUE_CLR',
      controllerSayState: 'CD_ISSUE_CLR',
      updates: {
        push_available: true,
        runway_occupied: false,
        pilot_able: true,
        runway_available: true,
        push_delay_min: 0,
        surface_wind: '220/05',
        speed_restriction: '210 knots',
        emergency_heading: '180'
      }
    },
    CD_VERIFY_READBACK: {
      next: 'CD_READBACK_CHECK'
    },
    GRD_READY_FOR_PUSH: {
      next: 'GRD_PUSH_APPROVE',
      controllerSayState: 'GRD_PUSH_APPROVE'
    },
    GRD_TAXI_REQUEST: {
      next: 'GRD_TAXI_INSTR',
      controllerSayState: 'GRD_TAXI_INSTR'
    },
    GRD_TAXI_READBACK: {
      next: 'TWR_CONTACT',
      controllerSayState: 'TWR_CONTACT'
    },
    TWR_LINEUP_REQ: {
      next: 'TWR_TAKEOFF_CLR',
      controllerSayState: 'TWR_TAKEOFF_CLR'
    },
    TWR_TAKEOFF_READBACK: {
      next: 'DEP_CONTACT',
      controllerSayState: 'DEP_CONTACT'
    },
    DEP_IDENT: {
      next: 'DEP_CLIMB_INSTR',
      controllerSayState: 'DEP_CLIMB_INSTR'
    },
    DEP_CLIMB_READBACK: {
      next: 'ENR_HANDOFF',
      controllerSayState: 'ENR_HANDOFF'
    },
    DES_READBACK: {
      next: 'APP_HANDOFF',
      controllerSayState: 'APP_HANDOFF',
      updates: {
        speed_restriction: '180 knots'
      }
    },
    APP_ESTABLISHED: {
      next: 'TWR_LAND_CONTACT',
      controllerSayState: 'TWR_LAND_CONTACT',
      updates: {
        runway_available: true,
        surface_wind: '210/06'
      }
    },
    TWR_LAND_READBACK: {
      next: 'TWR_VACATE',
      controllerSayState: 'TWR_VACATE'
    },
    GRD_TAXI_IN_REQ: {
      next: 'GRD_TAXI_INSTR_IN',
      controllerSayState: 'GRD_TAXI_INSTR_IN'
    },
    GRD_TAXI_IN_READBACK: {
      next: 'FLOW_COMPLETE'
    }
  }

  const recordedAtcStates = new Set<string>()
  const simulationStepCount = simulationPilotSteps.length

  const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

  const decisionTrace = computed(() => lastDecisionTrace.value)
  const timelineSteps = computed(() => decisionTrace.value?.candidateTimeline?.steps ?? [])
  const timelineUsedFallback = computed(() => Boolean(decisionTrace.value?.candidateTimeline?.fallbackUsed))
  const traceAutoSelection = computed(() => decisionTrace.value?.autoSelection ?? null)
  const traceFallback = computed(() => decisionTrace.value?.fallback ?? null)

  const cloneForTrace = <T>(value: T): T => {
    if (value === undefined || value === null) {
      return value
    }
    try {
      return JSON.parse(JSON.stringify(value))
    } catch (err) {
      console.warn('Failed to clone trace payload, returning original value.', err)
      return value
    }
  }

  function describeElimination(entry: any): string {
    if (!entry || typeof entry !== 'object') {
      return ''
    }
    if (entry.kind === 'regex' && entry.context?.patterns?.length) {
      const patterns = entry.context.patterns
        .map((pattern: any) => pattern?.pattern)
        .filter((value: string | undefined) => Boolean(value))
        .join(', ')
      return patterns ? `Patterns: ${patterns}` : entry.reason
    }
    if (entry.kind === 'condition' && entry.context?.condition) {
      const condition = entry.context.condition
      if (condition.type === 'regex' || condition.type === 'regex_not') {
        const flag = condition.pattern ? `/${condition.pattern}/${condition.patternFlags || 'i'}` : ''
        return flag ? `Condition: ${condition.type} ${flag}` : entry.reason
      }
      const variable = condition.variable || 'value'
      const operator = condition.operator || '=='
      const expected = entry.context?.expectedValue ?? condition.value ?? '—'
      const actual = entry.context?.actualValue ?? '—'
      return `${variable} ${operator} ${expected} (actual: ${actual})`
    }
    return entry.reason
  }

  const debugState = computed(() => {
    if (!currentState.value) return null
    const sayTpl = currentState.value.say_tpl
    return {
      id: currentState.value.id,
      phase: currentState.value.phase,
      role: currentState.value.role,
      frequencyName: currentState.value.frequencyName,
      sayPlain: sayTpl ? renderATCMessage(sayTpl) : '',
      sayNormalized: sayTpl ? normalizeATCText(sayTpl, { ...vars.value, ...flags.value }) : ''
    }
  })

  const debugNextStates = computed(() => {
    return nextCandidates.value.map(id => {
      const state = getStateDetails(id)
      if (!state) {
        return { id, role: '', phase: '', frequencyName: undefined, sayPlain: '', sayNormalized: '' }
      }
      const sayPlain = state.say_tpl ? renderATCMessage(state.say_tpl) : ''
      const sayNormalized = state.say_tpl ? normalizeATCText(state.say_tpl, { ...vars.value, ...flags.value }) : ''
      return {
        id,
        role: state.role,
        phase: state.phase,
        frequencyName: state.frequencyName,
        sayPlain,
        sayNormalized
      }
    })
  })

  const formatTracePayload = (payload: any): string => {
    if (payload === null || payload === undefined) return ''
    if (typeof payload === 'string') return payload
    try {
      return JSON.stringify(payload, null, 2)
    } catch (err) {
      return String(payload)
    }
  }

  const recordCurrentAtcMessage = () => {
    const state = currentState.value
    if (!state?.id || recordedAtcStates.has(state.id) || !state.say_tpl) {
      return
    }

    const plain = renderATCMessage(state.say_tpl)
    const normalized = normalizeATCText(state.say_tpl, { ...vars.value, ...flags.value })

    simulationTrace.value.push({
      kind: 'atc',
      id: state.id,
      label: `ATC • ${state.phase}`,
      payload: { text: plain, normalized }
    })

    setLastTransmission(`ATC: ${plain}`)
    recordedAtcStates.add(state.id)
  }

  const pickNextStateId = (state: ReturnType<typeof getStateDetails> | null): string | null => {
    if (!state) return null

    const chains: Array<Array<{ to: string }>> = []
    if (state.ok_next?.length) chains.push(state.ok_next.map(({ to }) => ({ to })))
    if (state.next?.length) chains.push(state.next.map(({ to }) => ({ to })))
    if (state.bad_next?.length) chains.push(state.bad_next.map(({ to }) => ({ to })))
    if (state.timer_next?.length) chains.push(state.timer_next.map(({ to }) => ({ to })))

    for (const list of chains) {
      for (const entry of list) {
        if (entry?.to) return entry.to
      }
    }

    return null
  }

  const advanceAutomaticStates = async () => {
    let guard = 0

    while (guard++ < 50) {
      const state = currentState.value
      if (!state?.id) break
      if (state.auto === 'end') break

      const autoMode = Boolean(state.auto && state.auto !== 'end')
      if (!autoMode && state.role === 'pilot') break

      const nextId = pickNextStateId(state)
      if (!nextId || nextId === state.id) break

      forceMove(nextId)
      await nextTick()
      recordCurrentAtcMessage()
    }
  }

  const runFullSimulation = async () => {
    if (simulationRunning.value) return

    simulationRunning.value = true
    simulationTrace.value = []
    simulationError.value = ''
    recordedAtcStates.clear()

    try {
      simulationTrace.value.push({
        kind: 'info',
        id: 'init',
        label: 'Simulation Start',
        payload: { timestamp: new Date().toISOString(), steps: simulationStepCount }
      })

      startDemoFlight()
      await nextTick()
      clearLog()
      recordedAtcStates.clear()

      if (currentState.value?.id !== 'CD_CHECK_ATIS') {
        forceMove('CD_CHECK_ATIS')
        await nextTick()
      }

      for (const stepId of simulationPilotSteps) {
        const state = getStateDetails(stepId)
        if (!state?.utterance_tpl) {
          throw new Error(`Missing pilot utterance for ${stepId}`)
        }

        if (currentState.value?.id !== stepId) {
          forceMove(stepId)
          await nextTick()
        }

        await wait(120)

        const pilotText = renderATCMessage(state.utterance_tpl)
        const pilotNormalized = normalizeATCText(state.utterance_tpl, { ...vars.value, ...flags.value })

        simulationTrace.value.push({
          kind: 'pilot',
          id: stepId,
          label: `Pilot • ${state.phase}`,
          payload: { text: pilotText, normalized: pilotNormalized }
        })

        setLastTransmission(`Pilot: ${pilotText}`)

        const quickResponse = processPilotTransmission(pilotText)
        if (quickResponse) {
          simulationTrace.value.push({
            kind: 'info',
            id: `${stepId}-quick`,
            label: 'Quick Response',
            payload: { text: quickResponse }
          })
          await nextTick()
        }

        const ctx = buildLLMContext(pilotText)
        simulationTrace.value.push({
          kind: 'llm-input',
          id: stepId,
          label: 'LLM Request',
          payload: cloneForTrace(ctx)
        })

        const template = simulationDecisions[stepId]
        if (!template) {
          throw new Error(`Missing simulation decision for ${stepId}`)
        }

        const decision: any = { next_state: template.next }
        if (template.controllerSayTpl) {
          decision.controller_say_tpl = template.controllerSayTpl
        } else if (template.controllerSayState) {
          const sayState = getStateDetails(template.controllerSayState)
          if (sayState?.say_tpl) {
            decision.controller_say_tpl = sayState.say_tpl
          }
        }
        if (template.updates) {
          decision.updates = template.updates
        }

        simulationTrace.value.push({
          kind: 'llm-output',
          id: stepId,
          label: `LLM Response → ${decision.next_state}`,
          payload: cloneForTrace(decision)
        })

        applyLLMDecision(decision)
        await nextTick()
        recordCurrentAtcMessage()
        await advanceAutomaticStates()
        await wait(200)
      }

      simulationTrace.value.push({
        kind: 'info',
        id: 'complete',
        label: 'Simulation Complete',
        payload: {
          timestamp: new Date().toISOString(),
          finalState: currentState.value?.id,
          pilotSteps: completedPilotSteps.value
        }
      })
    } catch (err: any) {
      const message = err?.message || String(err)
      simulationError.value = message
      simulationTrace.value.push({
        kind: 'info',
        id: 'error',
        label: 'Simulation aborted',
        payload: { error: message }
      })
    } finally {
      simulationRunning.value = false
    }
  }

  return {
    simulationRunning,
    simulationTrace,
    simulationError,
    simulationStepCount,
    completedPilotSteps,
    decisionTrace,
    timelineSteps,
    timelineUsedFallback,
    traceAutoSelection,
    traceFallback,
    debugState,
    debugNextStates,
    describeElimination,
    formatTracePayload,
    runFullSimulation,
  }
}
