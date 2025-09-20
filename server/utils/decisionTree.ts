import type { AtcDecisionTreeDocument } from '../models/AtcDecisionTree'
import { AtcDecisionTree } from '../models/AtcDecisionTree'
import type { AutoTransition, DecisionTreeRecord, DecisionTreeState } from '~~/types/decision-tree'

export const DEFAULT_TREE_NAME = 'icao_atc_decision_tree'

export function ensureArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : []
}

export function generateId(length = 8) {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
  let result = ''
  for (let i = 0; i < length; i += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return result
}

export function normalizeAutoTransitions(list?: AutoTransition[]): AutoTransition[] {
  const items = ensureArray(list).map((item) => ({
    id: item.id || generateId(8),
    to: item.to,
    label: item.label,
    description: item.description,
    conditionType: item.conditionType || 'expression',
    expression: item.expression,
    telemetryKey: item.telemetryKey,
    comparator: item.comparator || '>',
    value: typeof item.value === 'number' ? item.value : undefined,
    enabled: item.enabled !== false,
    priority: typeof item.priority === 'number' ? item.priority : 0,
    runOn: item.runOn && item.runOn.length ? item.runOn : ['state-entry'],
  }))

  // ensure uniqueness by id
  const existing = new Set<string>()
  return items.map((item) => {
    let id = item.id
    if (!id || existing.has(id)) {
      id = generateId(8)
    }
    existing.add(id)
    return { ...item, id }
  })
}

export function sanitizeStateInput(input: Partial<DecisionTreeState> & { role: DecisionTreeState['role']; phase: string }): DecisionTreeState {
  return {
    role: input.role,
    phase: input.phase,
    label: input.label,
    prompt_out: input.prompt_out,
    say_tpl: input.say_tpl,
    utterance_tpl: input.utterance_tpl,
    else_say_tpl: input.else_say_tpl,
    auto: input.auto,
    trigger: input.trigger,
    guard: input.guard,
    handoff: input.handoff,
    readback_required: ensureArray(input.readback_required),
    actions: ensureArray(input.actions),
    next: ensureArray(input.next),
    ok_next: ensureArray(input.ok_next),
    bad_next: ensureArray(input.bad_next),
    timer_next: ensureArray(input.timer_next),
    auto_transitions: normalizeAutoTransitions(input.auto_transitions),
    llm_templates: input.llm_templates,
    layout: input.layout,
    metadata: input.metadata,
    notes: input.notes,
  }
}

export function toClientTree(doc: AtcDecisionTreeDocument): DecisionTreeRecord {
  const states: Record<string, DecisionTreeState> = {}
  doc.states.forEach((state, id) => {
    states[id] = {
      ...state,
      readback_required: ensureArray(state.readback_required),
      actions: ensureArray(state.actions),
      next: ensureArray(state.next),
      ok_next: ensureArray(state.ok_next),
      bad_next: ensureArray(state.bad_next),
      timer_next: ensureArray(state.timer_next),
      auto_transitions: normalizeAutoTransitions(state.auto_transitions),
      llm_templates: state.llm_templates,
      layout: state.layout,
      metadata: state.metadata,
      notes: state.notes,
    }
  })

  return {
    _id: String(doc._id),
    schema_version: doc.schema_version,
    name: doc.name,
    description: doc.description,
    start_state: doc.start_state,
    end_states: ensureArray(doc.end_states),
    variables: doc.variables || {},
    flags: doc.flags || {},
    policies: doc.policies || {},
    hooks: doc.hooks || {},
    roles: ensureArray(doc.roles),
    phases: ensureArray(doc.phases),
    states,
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
  }
}

export async function getTreeByName(name: string): Promise<AtcDecisionTreeDocument | null> {
  return AtcDecisionTree.findOne({ name })
}

export async function getOrCreateDefaultTree(): Promise<AtcDecisionTreeDocument | null> {
  const existing = await getTreeByName(DEFAULT_TREE_NAME)
  if (existing) return existing
  return null
}
