// shared/composables/flightlab/useLearnPfdEngine.ts
import { ref, computed, watch } from 'vue'
import type { LearnPfdPhase, LearnPfdScenario, FlightLabButton, PfdInteractionGoal, PfdElement, PfdLayoutMode } from '../../data/flightlab/types'
import type { FlightState } from './useAirbusFBW'

const mainPhaseIds = ['welcome', 'horizon_intro', 'pitch_intro', 'speed_intro', 'speed_explain', 'speed_hold_coarse', 'speed_hold_fine', 'alt_intro', 'vs_intro', 'heading_intro', 'combined', 'free_practice', 'end']

const goalNextPhase: Record<string, string> = {
  'horizon_intro': 'horizon_roll_right',
  'horizon_roll_right': 'pitch_intro',
  'pitch_intro': 'pitch_down',
  'pitch_down': 'speed_intro',
  'speed_intro': 'speed_explain',
  'speed_hold_coarse': 'speed_hold_fine',
  'speed_hold_fine': 'alt_intro',
  'alt_intro': 'vs_intro',
  'vs_intro': 'heading_intro',
  'heading_intro': 'combined',
  'combined': 'free_practice',
}

function evaluateGoal(goal: PfdInteractionGoal, state: FlightState): boolean {
  const actual = state[goal.parameter]
  if (typeof actual !== 'number') return false
  return Math.abs(actual - goal.target) <= goal.tolerance
}

function computeGoalProgress(goal: PfdInteractionGoal, state: FlightState): number {
  const actual = state[goal.parameter]
  if (typeof actual !== 'number') return 0
  const distance = Math.abs(actual - goal.target)
  if (distance <= goal.tolerance) return 1
  // Scale progress: at 10x tolerance distance we're at 0, at tolerance we're at 1
  const maxDistance = goal.tolerance * 10
  return Math.max(0, 1 - (distance - goal.tolerance) / maxDistance)
}

export function useLearnPfdEngine(scenario: LearnPfdScenario, flightState: FlightState) {
  const currentPhaseId = ref(scenario.phases[0]?.id ?? '')
  const isPaused = ref(false)
  const history = ref<Array<{ phaseId: string; buttonId: string; timestamp: number }>>([])
  const startedAt = ref(Date.now())

  // --- Goal evaluation state ---
  const goalMet = ref(false)
  const goalProgress = ref(0)
  const holdStartTime = ref<number | null>(null)
  const showingGoalHint = ref(false)
  const goalHintText = ref<string | null>(null)

  let goalInterval: ReturnType<typeof setInterval> | null = null
  let goalHintTimeout: ReturnType<typeof setTimeout> | null = null
  let goalHintSpoken = false

  // Callbacks
  let onGoalHintCallback: ((text: string) => void) | null = null
  let isAutoAdvanceBlocked: (() => boolean) | null = null

  // --- Maps & computed ---

  const phasesMap = computed(() => {
    const map = new Map<string, LearnPfdPhase>()
    for (const phase of scenario.phases) {
      map.set(phase.id, phase)
    }
    return map
  })

  const currentPhase = computed(() => phasesMap.value.get(currentPhaseId.value) ?? null)

  const isFinished = computed(() => currentPhaseId.value === 'end')

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

  // --- Convenience getters ---

  const visibleElements = computed<PfdElement[]>(() => {
    return currentPhase.value?.visibleElements ?? []
  })

  const layoutMode = computed<PfdLayoutMode>(() => {
    return currentPhase.value?.layoutMode ?? 'model-focus'
  })

  // --- Goal Monitoring ---

  function startGoalMonitoring() {
    stopGoalMonitoring()

    const phase = currentPhase.value
    if (!phase?.interactionGoal) return

    const goal = phase.interactionGoal
    const holdMs = goal.holdMs ?? 2000
    const timeoutMs = phase.goalTimeoutMs ?? 15000

    goalMet.value = false
    goalProgress.value = 0
    holdStartTime.value = null
    showingGoalHint.value = false
    goalHintText.value = null
    goalHintSpoken = false

    goalInterval = setInterval(() => {
      if (isPaused.value) return

      const met = evaluateGoal(goal, flightState)
      goalProgress.value = computeGoalProgress(goal, flightState)

      if (met) {
        if (holdStartTime.value === null) {
          holdStartTime.value = Date.now()
        }

        const held = Date.now() - holdStartTime.value
        if (held >= holdMs) {
          goalMet.value = true
          if (isAutoAdvanceBlocked?.()) return
          stopGoalMonitoring()

          const nextPhase = goalNextPhase[currentPhaseId.value]
          if (nextPhase) {
            goToPhase(nextPhase)
          }
        }
      } else {
        // User left tolerance, reset hold timer
        holdStartTime.value = null
        goalMet.value = false
      }
    }, 200)

    // Hint timeout
    if (phase.goalHint) {
      goalHintTimeout = setTimeout(() => {
        if (!goalMet.value) {
          showingGoalHint.value = true
          goalHintText.value = phase.goalHint ?? null
          if (!goalHintSpoken && goalHintText.value && onGoalHintCallback) {
            goalHintSpoken = true
            onGoalHintCallback(goalHintText.value)
          }
        }
      }, timeoutMs)
    }
  }

  function stopGoalMonitoring() {
    if (goalInterval) {
      clearInterval(goalInterval)
      goalInterval = null
    }
    if (goalHintTimeout) {
      clearTimeout(goalHintTimeout)
      goalHintTimeout = null
    }
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
      stopGoalMonitoring()
      goalMet.value = false
      goalProgress.value = 0
      holdStartTime.value = null
      showingGoalHint.value = false
      goalHintText.value = null
      currentPhaseId.value = phaseId
    }
  }

  // Watch for phase changes to start goal monitoring
  watch(currentPhaseId, () => {
    const phase = currentPhase.value
    if (phase?.interactionGoal) {
      startGoalMonitoring()
    }
  })

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

  function restart() {
    stopGoalMonitoring()
    currentPhaseId.value = scenario.phases[0]?.id ?? ''
    isPaused.value = false
    history.value = []
    startedAt.value = Date.now()
    goalMet.value = false
    goalProgress.value = 0
    holdStartTime.value = null
    showingGoalHint.value = false
    goalHintText.value = null
  }

  function pause() { isPaused.value = true }
  function resume() { isPaused.value = false }

  function cleanup() {
    stopGoalMonitoring()
  }

  // --- Callback setters ---

  function onGoalHint(fn: (text: string) => void) {
    onGoalHintCallback = fn
  }

  function setAutoAdvanceBlocker(fn: () => boolean) {
    isAutoAdvanceBlocked = fn
  }

  function dismissGoalHint() {
    showingGoalHint.value = false
    goalHintText.value = null
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
    // Goal state
    goalMet,
    goalProgress,
    holdStartTime,
    showingGoalHint,
    goalHintText,
    // Convenience getters
    visibleElements,
    layoutMode,
    // Actions
    selectOption,
    goToPhase,
    restart,
    pause,
    resume,
    skipForward,
    skipBack,
    dismissGoalHint,
    // Callback setters
    onGoalHint,
    setAutoAdvanceBlocker,
    cleanup,
  }
}
