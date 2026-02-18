// shared/composables/flightlab/useFlightLabEngine.ts
import { ref, computed, watch } from 'vue'
import type { FlightLabPhase, FlightLabScenario, FlightLabButton, FlightLabTelemetryState, SimConditionGroup, SimCondition } from '../../data/flightlab/types'

export function useFlightLabEngine(scenario: FlightLabScenario) {
  const currentPhaseId = ref(scenario.phases[0]?.id ?? '')
  const isPaused = ref(false)
  const history = ref<Array<{ phaseId: string; buttonId: string; timestamp: number }>>([])
  const startedAt = ref(Date.now())

  // --- Auto-Advance / SimConnect ---
  const autoAdvanceEnabled = ref(true)
  const currentTelemetry = ref<FlightLabTelemetryState | null>(null)
  const showingHelpMessage = ref(false)
  const helpMessageText = ref<string | null>(null)
  const conditionsMet = ref(false)

  let conditionInterval: ReturnType<typeof setInterval> | null = null
  let helpTimeout: ReturnType<typeof setTimeout> | null = null
  let helpMessageSpoken = false

  // Callback for TTS when help message triggers
  let onHelpMessage: ((text: string) => void) | null = null
  let isAutoAdvanceBlocked: (() => boolean) | null = null

  const phasesMap = computed(() => {
    const map = new Map<string, FlightLabPhase>()
    for (const phase of scenario.phases) {
      map.set(phase.id, phase)
    }
    return map
  })

  const currentPhase = computed(() => phasesMap.value.get(currentPhaseId.value) ?? null)

  // Count only main phases (not comfort/info branches) for progress
  const mainPhaseIds = ['welcome', 'seatbelt_on', 'briefing', 'runway', 'engines_spool', 'takeoff_roll', 'rotation', 'gear_retract', 'climb', 'climb_high', 'leveloff', 'seatbelt_off', 'debrief', 'end']

  const progress = computed(() => {
    const idx = mainPhaseIds.indexOf(currentPhaseId.value)
    if (idx === -1) {
      // We're in a sub-phase, find the closest main phase from history
      for (let i = history.value.length - 1; i >= 0; i--) {
        const entry = history.value[i]
        if (!entry) continue
        const mainIdx = mainPhaseIds.indexOf(entry.phaseId)
        if (mainIdx !== -1) return Math.round((mainIdx / (mainPhaseIds.length - 1)) * 100)
      }
      return 0
    }
    return Math.round((idx / (mainPhaseIds.length - 1)) * 100)
  })

  const isFinished = computed(() => currentPhaseId.value === 'end')

  /** Whether the current phase has sim conditions that can be monitored */
  const hasSimConditions = computed(() => {
    const phase = currentPhase.value
    return !!(phase?.simConditions && phase.simConditionNextPhase)
  })

  // --- Condition Evaluation ---

  function evaluateCondition(condition: SimCondition, telemetry: FlightLabTelemetryState): boolean {
    const actual = telemetry[condition.variable]
    const expected = condition.value

    switch (condition.operator) {
      case '>': return (actual as number) > (expected as number)
      case '<': return (actual as number) < (expected as number)
      case '>=': return (actual as number) >= (expected as number)
      case '<=': return (actual as number) <= (expected as number)
      case '==': return actual === expected
      case '!=': return actual !== expected
      default: return false
    }
  }

  function evaluateConditions(group: SimConditionGroup, telemetry: FlightLabTelemetryState): boolean {
    if (group.logic === 'AND') {
      return group.conditions.every(c => evaluateCondition(c, telemetry))
    } else {
      return group.conditions.some(c => evaluateCondition(c, telemetry))
    }
  }

  // --- Condition Monitoring ---

  function startConditionMonitoring() {
    stopConditionMonitoring()

    const phase = currentPhase.value
    if (!phase?.simConditions || !phase.simConditionNextPhase) return

    conditionsMet.value = false
    showingHelpMessage.value = false
    helpMessageText.value = null
    helpMessageSpoken = false

    // Check every 500ms
    conditionInterval = setInterval(() => {
      if (!autoAdvanceEnabled.value || isPaused.value) return
      if (!currentTelemetry.value || !phase.simConditions) return

      const met = evaluateConditions(phase.simConditions, currentTelemetry.value)
      conditionsMet.value = met

      if (met && phase.simConditionNextPhase) {
        if (isAutoAdvanceBlocked?.()) return
        stopConditionMonitoring()
        goToPhase(phase.simConditionNextPhase)
      }
    }, 500)

    // Help timeout
    const timeoutMs = phase.simConditionTimeoutMs ?? 20000
    if (phase.simConditionHelpMessage) {
      helpTimeout = setTimeout(() => {
        if (!conditionsMet.value && autoAdvanceEnabled.value) {
          showingHelpMessage.value = true
          helpMessageText.value = phase.simConditionHelpMessage ?? null
          if (!helpMessageSpoken && helpMessageText.value && onHelpMessage) {
            helpMessageSpoken = true
            onHelpMessage(helpMessageText.value)
          }
        }
      }, timeoutMs)
    }
  }

  function stopConditionMonitoring() {
    if (conditionInterval) {
      clearInterval(conditionInterval)
      conditionInterval = null
    }
    if (helpTimeout) {
      clearTimeout(helpTimeout)
      helpTimeout = null
    }
  }

  function dismissHelpMessage() {
    showingHelpMessage.value = false
    helpMessageText.value = null
  }

  // --- Telemetry ---

  function updateTelemetry(data: FlightLabTelemetryState) {
    currentTelemetry.value = { ...data, timestamp: Date.now() }
  }

  function toggleAutoAdvance() {
    autoAdvanceEnabled.value = !autoAdvanceEnabled.value
    if (autoAdvanceEnabled.value && hasSimConditions.value) {
      startConditionMonitoring()
    } else {
      stopConditionMonitoring()
      conditionsMet.value = false
      showingHelpMessage.value = false
      helpMessageText.value = null
    }
  }

  function setOnHelpMessage(fn: (text: string) => void) {
    onHelpMessage = fn
  }

  function setAutoAdvanceBlocker(fn: () => boolean) {
    isAutoAdvanceBlocked = fn
  }

  // --- Phase navigation ---

  function selectOption(button: FlightLabButton) {
    if (isPaused.value) return
    history.value.push({
      phaseId: currentPhaseId.value,
      buttonId: button.id,
      timestamp: Date.now(),
    })
    goToPhase(button.next)
    return button
  }

  function goToPhase(phaseId: string) {
    if (phasesMap.value.has(phaseId)) {
      stopConditionMonitoring()
      conditionsMet.value = false
      showingHelpMessage.value = false
      helpMessageText.value = null
      currentPhaseId.value = phaseId
    }
  }

  // Watch for phase changes to start condition monitoring
  watch(currentPhaseId, () => {
    if (autoAdvanceEnabled.value && hasSimConditions.value) {
      startConditionMonitoring()
    }
  })

  function restart() {
    stopConditionMonitoring()
    currentPhaseId.value = scenario.phases[0]?.id ?? ''
    isPaused.value = false
    history.value = []
    startedAt.value = Date.now()
    conditionsMet.value = false
    showingHelpMessage.value = false
    helpMessageText.value = null
    currentTelemetry.value = null
  }

  function pause() { isPaused.value = true }
  function resume() { isPaused.value = false }

  function skipForward() {
    const idx = mainPhaseIds.indexOf(currentPhaseId.value)
    const next = mainPhaseIds[idx + 1]
    if (idx >= 0 && next) {
      goToPhase(next)
    }
  }

  function skipBack() {
    const idx = mainPhaseIds.indexOf(currentPhaseId.value)
    const prev = mainPhaseIds[idx - 1]
    if (idx > 0 && prev) {
      goToPhase(prev)
    }
  }

  function cleanup() {
    stopConditionMonitoring()
  }

  return {
    // State
    currentPhaseId,
    currentPhase,
    isPaused,
    history,
    progress,
    isFinished,
    startedAt,
    scenario,
    // Auto-Advance State
    autoAdvanceEnabled,
    currentTelemetry,
    showingHelpMessage,
    helpMessageText,
    conditionsMet,
    hasSimConditions,
    // Actions
    selectOption,
    goToPhase,
    restart,
    pause,
    resume,
    skipForward,
    skipBack,
    // Auto-Advance Actions
    updateTelemetry,
    toggleAutoAdvance,
    dismissHelpMessage,
    evaluateConditions,
    setOnHelpMessage,
    setAutoAdvanceBlocker,
    cleanup,
  }
}
