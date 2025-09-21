// server/api/llm/decide.post.ts
import { readBody, createError } from 'h3'
import type { LLMDecisionInput, LLMCandidateInput } from '~~/shared/types/llm'
import type {
  RuntimeDecisionSystem,
  RuntimeDecisionState,
  DecisionNodeTrigger,
  DecisionNodeCondition,
} from '~~/shared/types/decision'
import { buildRuntimeDecisionSystem } from '../../services/decisionFlowService'
import { routeDecision } from '../../utils/openai'

type Candidate = { flow: string; id: string; state: RuntimeDecisionState }

type EvaluationContext = {
  pilot: string
  variables: Record<string, any>
  flags: Record<string, any>
  telemetry: Record<string, any>
}

function sanitizeRecord(raw: any): Record<string, any> {
  if (!raw || typeof raw !== 'object') {
    return {}
  }
  return Object.entries(raw).reduce<Record<string, any>>((acc, [key, value]) => {
    acc[key] = value
    return acc
  }, {})
}

function sanitizeFlowState(
  raw: any,
  system: RuntimeDecisionSystem
): Record<string, string> {
  const map: Record<string, string> = {}
  if (raw && typeof raw === 'object') {
    for (const [slug, value] of Object.entries(raw)) {
      if (typeof value === 'string' && value.trim().length && system.flows[slug]) {
        map[slug] = value.trim()
      }
    }
  }
  return map
}

function matchesRegex(pattern: string | undefined, flags: string | undefined, value: string): boolean {
  if (!pattern) {
    return false
  }
  try {
    const regex = new RegExp(pattern, flags)
    return regex.test(value)
  } catch (err) {
    console.warn('Invalid regex trigger', pattern, flags, err)
    return false
  }
}

function normalizeComparableValue(value: any): any {
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed.length) return ''
    const numeric = Number(trimmed)
    if (!Number.isNaN(numeric)) return numeric
    const lower = trimmed.toLowerCase()
    if (lower === 'true') return true
    if (lower === 'false') return false
    return lower
  }
  return value
}

function parseComparisonValue(raw: any): any {
  if (typeof raw === 'number' || typeof raw === 'boolean') {
    return raw
  }
  if (typeof raw !== 'string') {
    return raw
  }
  const trimmed = raw.trim()
  if (!trimmed.length) return ''
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  const numeric = Number(trimmed)
  if (!Number.isNaN(numeric)) return numeric
  if (trimmed.toLowerCase() === 'true') return true
  if (trimmed.toLowerCase() === 'false') return false
  return trimmed
}

function compareValues(left: any, operator: string, right: any): boolean {
  const leftValue = normalizeComparableValue(left)
  const rightValue = normalizeComparableValue(parseComparisonValue(right))
  switch (operator) {
    case '>':
      return typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue > rightValue
        : false
    case '>=':
      return typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue >= rightValue
        : false
    case '<':
      return typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue < rightValue
        : false
    case '<=':
      return typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue <= rightValue
        : false
    case '!==':
    case '!=':
      return leftValue !== rightValue
    case '===':
    case '==':
    default:
      return leftValue === rightValue
  }
}

function getValueByPath(path: string | undefined, context: EvaluationContext): any {
  if (!path || typeof path !== 'string') {
    return undefined
  }
  const segments = path
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)
  if (!segments.length) {
    return undefined
  }
  let sourceKey = segments[0]
  let current: any
  if (sourceKey === 'variables' || sourceKey === 'flags' || sourceKey === 'telemetry') {
    current = (context as any)[sourceKey]
    segments.shift()
  } else {
    current = context.variables
  }
  for (const segment of segments) {
    if (current == null) return undefined
    current = current[segment]
  }
  return current
}

function evaluateAutoTriggers(
  triggers: DecisionNodeTrigger[] | undefined,
  context: EvaluationContext
): boolean {
  if (!Array.isArray(triggers) || !triggers.length) {
    return false
  }
  for (const trigger of triggers) {
    if (!trigger) continue
    if (trigger.type === 'auto_variable') {
      const target = trigger.variable ? getValueByPath(trigger.variable, context) : undefined
      if (trigger.operator) {
        if (compareValues(target, trigger.operator, trigger.value)) {
          return true
        }
      } else if (target) {
        return true
      }
    }
    if (trigger.type === 'auto_time') {
      const delay = typeof trigger.delaySeconds === 'number' ? trigger.delaySeconds : 0
      if (delay <= 0) {
        return true
      }
    }
  }
  return false
}

function hasRegexMatch(
  triggers: DecisionNodeTrigger[] | undefined,
  context: EvaluationContext
): boolean {
  if (!Array.isArray(triggers) || !triggers.length) {
    return false
  }
  return triggers.some(
    (trigger) => trigger?.type === 'regex' && matchesRegex(trigger.pattern, trigger.patternFlags, context.pilot)
  )
}

function hasNoneTrigger(triggers: DecisionNodeTrigger[] | undefined): boolean {
  if (!Array.isArray(triggers) || !triggers.length) {
    return true
  }
  return triggers.some((trigger) => trigger?.type === 'none')
}

function evaluateCondition(condition: DecisionNodeCondition, context: EvaluationContext): boolean {
  if (!condition) {
    return true
  }
  if (condition.type === 'variable_value') {
    const operator = condition.operator || '=='
    const left = getValueByPath(condition.variable, context)
    return compareValues(left, operator, condition.value)
  }
  const matches = matchesRegex(condition.pattern, condition.patternFlags, context.pilot)
  if (condition.type === 'regex') {
    return matches
  }
  if (condition.type === 'regex_not') {
    return !matches
  }
  return true
}

function applyConditions(candidates: Candidate[], context: EvaluationContext): Candidate[] {
  if (!candidates.length) {
    return candidates
  }
  return candidates.filter((candidate) => {
    if (!candidate.state.conditions || !candidate.state.conditions.length) {
      return true
    }
    return candidate.state.conditions.every((condition) => evaluateCondition(condition, context))
  })
}

function collectTransitionTargets(
  state: RuntimeDecisionState | undefined,
  flow: string,
  register: (flow: string, stateId: string) => void
) {
  if (!state) {
    return
  }
  const sequences = [state.next ?? [], state.ok_next ?? [], state.bad_next ?? []]
  for (const list of sequences) {
    for (const entry of list) {
      if (entry?.to) {
        register(flow, entry.to)
      }
    }
  }
}

function prepareDecisionContext(
  input: LLMDecisionInput,
  system: RuntimeDecisionSystem,
  incomingCandidates: LLMCandidateInput[]
) {
  const variables = sanitizeRecord(input.variables)
  const flags = sanitizeRecord(input.flags)
  const telemetry = sanitizeRecord(input.telemetry)
  const flowState = sanitizeFlowState(input.flow_state, system)

  const requestedFlow =
    typeof input.active_flow === 'string' && system.flows[input.active_flow]
      ? input.active_flow
      : ''
  const fallbackFlow =
    (system.main && system.flows[system.main] && system.main) || system.order[0]
  const activeFlow = requestedFlow || fallbackFlow
  if (!activeFlow || !system.flows[activeFlow]) {
    throw createError({ statusCode: 400, statusMessage: 'No matching decision flow found' })
  }

  const activeTree = system.flows[activeFlow]
  if (!activeTree) {
    throw createError({ statusCode: 404, statusMessage: `Decision flow ${activeFlow} not found` })
  }

  if (typeof input.state_id === 'string' && input.state_id.trim().length) {
    flowState[activeFlow] = input.state_id.trim()
  } else if (!flowState[activeFlow] && activeTree.start_state) {
    flowState[activeFlow] = activeTree.start_state
  }

  for (const slug of system.order) {
    if (!flowState[slug]) {
      const tree = system.flows[slug]
      if (tree?.start_state) {
        flowState[slug] = tree.start_state
      }
    }
  }

  const activeStateId = flowState[activeFlow] || activeTree.start_state
  const activeState = activeStateId ? activeTree.states[activeStateId] : undefined
  if (!activeState) {
    throw createError({
      statusCode: 404,
      statusMessage: `State ${activeStateId || '<unknown>'} not found in flow ${activeFlow}`,
    })
  }

  const candidateMap = new Map<string, Candidate>()
  const registerCandidate = (flow: string, stateId: string) => {
    if (!flow || !stateId) return
    const tree = system.flows[flow]
    if (!tree) return
    const state = tree.states[stateId]
    if (!state) return
    const key = `${flow}::${stateId}`
    if (candidateMap.has(key)) return
    candidateMap.set(key, { flow, id: stateId, state })
  }

  collectTransitionTargets(activeState, activeFlow, registerCandidate)

  for (const slug of system.order) {
    const tree = system.flows[slug]
    if (!tree) continue
    const currentId = flowState[slug] || tree.start_state
    if (currentId) {
      collectTransitionTargets(tree.states[currentId], slug, registerCandidate)
    }
    if (tree.start_state) {
      registerCandidate(slug, tree.start_state)
    }
  }

  for (const entry of incomingCandidates) {
    if (!entry || typeof entry.id !== 'string') continue
    const slug = entry.flow && system.flows[entry.flow] ? entry.flow : activeFlow
    registerCandidate(slug, entry.id)
  }

  const candidates = Array.from(candidateMap.values())
  const evaluationContext: EvaluationContext = {
    pilot: typeof input.pilot_utterance === 'string' ? input.pilot_utterance : '',
    variables,
    flags,
    telemetry,
  }

  let filtered = candidates.filter((candidate) =>
    evaluateAutoTriggers(candidate.state.triggers, evaluationContext)
  )

  if (!filtered.length) {
    const regexMatches = candidates.filter((candidate) =>
      hasRegexMatch(candidate.state.triggers, evaluationContext)
    )
    if (regexMatches.length) {
      filtered = regexMatches
    } else {
      filtered = candidates.filter(
        (candidate) => candidate.flow === activeFlow && hasNoneTrigger(candidate.state.triggers)
      )
    }
  }

  if (filtered.length) {
    filtered = applyConditions(filtered, evaluationContext)
  }

  const filteredLookup = new Map<string, Candidate>()
  for (const candidate of filtered) {
    filteredLookup.set(candidate.id, candidate)
  }

  return {
    activeFlow,
    activeStateId,
    activeState,
    flowState,
    variables,
    flags,
    telemetry,
    candidates: filtered,
    filteredLookup,
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<LLMDecisionInput | undefined>(event)
  if (!body) {
    throw createError({ statusCode: 400, statusMessage: 'Missing body' })
  }

  const runtimeSystem = await buildRuntimeDecisionSystem()
  const incomingCandidates = Array.isArray(body.candidates) ? body.candidates : []

  let prepared
  try {
    prepared = prepareDecisionContext(body, runtimeSystem, incomingCandidates)
  } catch (err: any) {
    if (err?.statusCode) {
      throw err
    }
    console.error('Failed to prepare decision context', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to prepare decision context' })
  }

  const decisionInput: LLMDecisionInput = {
    state_id: prepared.activeStateId,
    state: prepared.activeState,
    candidates: prepared.candidates.map((candidate) => ({
      id: candidate.id,
      flow: candidate.flow,
      state: candidate.state,
    })),
    variables: prepared.variables,
    flags: { ...prepared.flags, active_flow: prepared.activeFlow },
    pilot_utterance: typeof body.pilot_utterance === 'string' ? body.pilot_utterance : '',
    active_flow: prepared.activeFlow,
    flow_state: prepared.flowState,
    flow_order: runtimeSystem.order,
    telemetry: prepared.telemetry,
  }

  try {
    const { decision, trace } = await routeDecision(decisionInput)

    const target = prepared.filteredLookup.get(decision.next_state)
    if (target && target.flow && target.flow !== prepared.activeFlow) {
      decision.next_flow = target.flow
    }

    if (decision.off_schema) {
      console.log(`[ATC] Off-schema response for: "${decisionInput.pilot_utterance}"`)
    }
    if (decision.radio_check) {
      console.log(`[ATC] Radio check processed: "${decisionInput.pilot_utterance}"`)
    }

    if (trace?.calls?.length) {
      console.log('[ATC] Decision trace captured with', trace.calls.length, 'call(s)')
    }

    return decision
  } catch (err: any) {
    console.error('Router failed:', err)
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Router failed' })
  }
})
