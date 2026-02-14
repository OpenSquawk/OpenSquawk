import type { Phase, TelemetryCondition, TelemetryState } from './types'

export interface TelemetryEvent {
  type: 'phase_advance' | 'atc_interrupt'
  toPhase?: string
  interactionId?: string
  trigger: {
    parameter: string
    condition: string
    value: number | boolean
  }
}

/**
 * Evaluates a single telemetry condition against current telemetry state.
 * Returns true if the condition is met, false otherwise.
 */
export function evaluateCondition(
  telemetry: TelemetryState,
  condition: TelemetryCondition
): boolean {
  const actual = telemetry[condition.parameter]
  if (actual === undefined) return false

  const val = condition.value
  switch (condition.operator) {
    case '>':  return (actual as number) > val
    case '>=': return (actual as number) >= val
    case '<':  return (actual as number) < val
    case '<=': return (actual as number) <= val
    case '==': return actual == val  // loose equality for boolean/number comparison (on_ground == 1)
    case '!=': return actual != val
    default:   return false
  }
}

/**
 * Evaluates telemetry against the current phase's autoAdvance condition.
 * If the condition is met and nextPhase is set, returns a phase_advance event.
 * Otherwise returns null.
 */
export function evaluateTelemetry(
  telemetry: TelemetryState,
  currentPhase: Phase
): TelemetryEvent | null {
  if (currentPhase.autoAdvance && currentPhase.nextPhase) {
    if (evaluateCondition(telemetry, currentPhase.autoAdvance)) {
      return {
        type: 'phase_advance',
        toPhase: currentPhase.nextPhase,
        trigger: {
          parameter: currentPhase.autoAdvance.parameter,
          condition: `${currentPhase.autoAdvance.parameter} ${currentPhase.autoAdvance.operator} ${currentPhase.autoAdvance.value}`,
          value: telemetry[currentPhase.autoAdvance.parameter] as number,
        },
      }
    }
  }

  return null
}
