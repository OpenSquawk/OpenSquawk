// shared/composables/flightlab/useFlightLabEngine.ts
import { ref, computed } from 'vue'
import type { FlightLabPhase, FlightLabScenario, FlightLabButton } from '../../data/flightlab/types'

export function useFlightLabEngine(scenario: FlightLabScenario) {
  const currentPhaseId = ref(scenario.phases[0]?.id ?? '')
  const isPaused = ref(false)
  const history = ref<Array<{ phaseId: string; buttonId: string; timestamp: number }>>([])
  const startedAt = ref(Date.now())

  const phasesMap = computed(() => {
    const map = new Map<string, FlightLabPhase>()
    for (const phase of scenario.phases) {
      map.set(phase.id, phase)
    }
    return map
  })

  const currentPhase = computed(() => phasesMap.value.get(currentPhaseId.value) ?? null)

  // Count only main phases (not comfort/info branches) for progress
  const mainPhaseIds = ['welcome', 'briefing', 'runway', 'engines_pre', 'engines_spool', 'takeoff_roll', 'rotation', 'gear_retract', 'climb', 'climb_high', 'leveloff', 'debrief', 'end']

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
      currentPhaseId.value = phaseId
    }
  }

  function restart() {
    currentPhaseId.value = scenario.phases[0]?.id ?? ''
    isPaused.value = false
    history.value = []
    startedAt.value = Date.now()
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
    // Actions
    selectOption,
    goToPhase,
    restart,
    pause,
    resume,
    skipForward,
    skipBack,
  }
}
