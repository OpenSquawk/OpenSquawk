import type { FilterQuery } from 'mongoose'
import mongoose from 'mongoose'
import { AtcFlow, type AtcFlowDocument } from '../models/AtcFlow'
import { AtcState, type AtcStateDocument } from '../models/AtcState'
import type {
  AtcDecisionState,
  AtcDecisionTree,
  AtcFlowWithStates,
  AtcState as SharedAtcState,
  AtcTransition
} from '../../shared/types/atc'

function asPlainObject<T>(value: T): T {
  if (value === null || value === undefined) return value
  if (typeof value !== 'object') return value
  return JSON.parse(JSON.stringify(value))
}

export function serializeFlow(doc: AtcFlowDocument) {
  const plain = doc.toObject({ depopulate: true }) as Record<string, any>
  return {
    id: String(doc._id),
    name: plain.name,
    schemaVersion: plain.schemaVersion ?? '1.0',
    description: plain.description ?? undefined,
    startState: plain.startState,
    endStates: Array.isArray(plain.endStates) ? plain.endStates : [],
    variables: asPlainObject(plain.variables) || {},
    flags: asPlainObject(plain.flags) || {},
    policies: asPlainObject(plain.policies) || {},
    hooks: asPlainObject(plain.hooks) || {},
    roles: Array.isArray(plain.roles) ? plain.roles : [],
    phases: Array.isArray(plain.phases) ? plain.phases : [],
    metadata: plain.metadata ? asPlainObject(plain.metadata) : undefined,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : undefined,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : undefined
  }
}

export function serializeState(doc: AtcStateDocument): SharedAtcState {
  const plain = doc.toObject({ depopulate: true }) as Record<string, any>
  const transitions: AtcTransition[] = Array.isArray(plain.transitions)
    ? plain.transitions.map((t: any) => ({
        id: t.id || new mongoose.Types.ObjectId().toString(),
        kind: t.kind || 'next',
        to: t.to,
        label: t.label ?? undefined,
        description: t.description ?? undefined,
        when: t.when ?? undefined,
        guard: t.guard ?? undefined,
        priority: typeof t.priority === 'number' ? t.priority : 0,
        timer: t.timer?.after_s != null ? { after_s: t.timer.after_s } : undefined,
        auto: t.auto ? asPlainObject(t.auto) : undefined,
        metadata: t.metadata ? asPlainObject(t.metadata) : undefined
      }))
    : []

  const llmTemplates = Array.isArray(plain.llmTemplates)
    ? plain.llmTemplates.map((tpl: any) => ({
        id: tpl.id || new mongoose.Types.ObjectId().toString(),
        name: tpl.name,
        description: tpl.description ?? undefined,
        systemPrompt: tpl.systemPrompt ?? undefined,
        userPrompt: tpl.userPrompt ?? undefined,
        responseFormat: tpl.responseFormat ? asPlainObject(tpl.responseFormat) : undefined,
        sampleResponse: tpl.sampleResponse ?? undefined,
        hints: tpl.hints ?? undefined,
        placeholders: Array.isArray(tpl.placeholders)
          ? tpl.placeholders.map((p: any) => ({
              key: p.key,
              label: p.label ?? undefined,
              description: p.description ?? undefined,
              example: p.example ?? undefined,
              required: Boolean(p.required),
              defaultValue: p.defaultValue ?? undefined,
              autoFill: p.autoFill ? asPlainObject(p.autoFill) : undefined
            }))
          : [],
        metadata: tpl.metadata ? asPlainObject(tpl.metadata) : undefined,
        autoApplyWhen: tpl.autoApplyWhen ?? undefined
      }))
    : []

  const ui = plain.ui ? asPlainObject(plain.ui) : undefined

  return {
    stateId: plain.stateId,
    title: plain.title ?? undefined,
    role: plain.role,
    phase: plain.phase,
    sayTpl: plain.sayTpl ?? undefined,
    utteranceTpl: plain.utteranceTpl ?? undefined,
    elseSayTpl: plain.elseSayTpl ?? undefined,
    readbackRequired: Array.isArray(plain.readbackRequired) ? plain.readbackRequired : undefined,
    auto: plain.auto ?? undefined,
    actions: Array.isArray(plain.actions) ? plain.actions : [],
    condition: plain.condition ?? undefined,
    guard: plain.guard ?? undefined,
    trigger: plain.trigger ?? undefined,
    frequency: plain.frequency ?? undefined,
    frequencyName: plain.frequencyName ?? undefined,
    handoff: plain.handoff ? asPlainObject(plain.handoff) : undefined,
    transitions,
    llmTemplates,
    metadata: plain.metadata ? asPlainObject(plain.metadata) : undefined,
    notes: plain.notes ?? undefined,
    ui,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : undefined,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : undefined
  }
}

function mapToDecisionState(state: SharedAtcState): AtcDecisionState {
  const base: AtcDecisionState = {
    id: state.stateId,
    role: state.role,
    phase: state.phase,
    say_tpl: state.sayTpl,
    utterance_tpl: state.utteranceTpl,
    else_say_tpl: state.elseSayTpl,
    auto: state.auto,
    readback_required: state.readbackRequired,
    actions: state.actions,
    condition: state.condition,
    guard: state.guard,
    trigger: state.trigger,
    frequency: state.frequency,
    frequencyName: state.frequencyName,
    handoff: state.handoff,
    metadata: state.metadata,
    llm_templates: state.llmTemplates?.map(t => ({ ...t }))
  }

  const grouped = {
    next: [] as Required<AtcDecisionState>['next'],
    ok_next: [] as Required<AtcDecisionState>['ok_next'],
    bad_next: [] as Required<AtcDecisionState>['bad_next'],
    timer: [] as Required<AtcDecisionState>['timer_next'],
    auto: [] as NonNullable<AtcDecisionState['auto_next']>
  }

  const sorted = [...(state.transitions || [])].sort((a, b) => {
    const ap = typeof a.priority === 'number' ? a.priority : 0
    const bp = typeof b.priority === 'number' ? b.priority : 0
    return ap - bp
  })

  for (const t of sorted) {
    const common = t.when || t.label || t.description
      ? {
          to: t.to,
          when: t.when ?? undefined,
          label: t.label ?? undefined,
          description: t.description ?? undefined
        }
      : { to: t.to } as { to: string; when?: string; label?: string; description?: string }

    switch (t.kind) {
      case 'ok_next':
        grouped.ok_next?.push(common)
        break
      case 'bad_next':
        grouped.bad_next?.push(common)
        break
      case 'timer':
        grouped.timer?.push({
          to: t.to,
          after_s: t.timer?.after_s ?? 0,
          label: t.label ?? undefined,
          description: t.description ?? undefined
        })
        break
      case 'auto':
        grouped.auto?.push({
          id: t.id,
          to: t.to,
          label: t.label ?? undefined,
          description: t.description ?? undefined,
          priority: typeof t.priority === 'number' ? t.priority : 0,
          when: t.when ?? undefined,
          auto: t.auto ? asPlainObject(t.auto) : undefined
        })
        break
      case 'next':
      case 'interrupt':
      case 'stack':
      case 'custom':
      default:
        grouped.next?.push(common)
        break
    }
  }

  if (grouped.next?.length) base.next = grouped.next
  if (grouped.ok_next?.length) base.ok_next = grouped.ok_next
  if (grouped.bad_next?.length) base.bad_next = grouped.bad_next
  if (grouped.timer?.length) base.timer_next = grouped.timer
  if (grouped.auto?.length) base.auto_next = grouped.auto

  return base
}

export async function loadFlowWithStates(identifier: string): Promise<AtcFlowWithStates | null> {
  let filter: FilterQuery<AtcFlowDocument> = { name: identifier }
  if (mongoose.isValidObjectId(identifier)) {
    filter = { $or: [{ _id: identifier }, { name: identifier }] }
  }

  const flowDoc = await AtcFlow.findOne(filter).exec()
  if (!flowDoc) {
    return null
  }

  const stateDocs = await AtcState.find({ flow: flowDoc._id }).sort({ stateId: 1 }).exec()
  const flow = serializeFlow(flowDoc)
  const states = stateDocs.map(serializeState)

  return { flow, states }
}

export async function loadDecisionTree(identifier: string): Promise<AtcDecisionTree | null> {
  const result = await loadFlowWithStates(identifier)
  if (!result) return null

  const { flow, states } = result
  const tree: AtcDecisionTree = {
    schema_version: flow.schemaVersion || '1.0',
    name: flow.name,
    description: flow.description,
    start_state: flow.startState,
    end_states: flow.endStates,
    variables: asPlainObject(flow.variables) || {},
    flags: asPlainObject(flow.flags) || {},
    policies: asPlainObject(flow.policies) || {},
    hooks: asPlainObject(flow.hooks) || {},
    roles: flow.roles,
    phases: flow.phases,
    states: {}
  }

  for (const state of states) {
    tree.states[state.stateId] = mapToDecisionState(state)
  }

  return tree
}

export function mapStatesById(states: SharedAtcState[]) {
  return states.reduce<Record<string, SharedAtcState>>((acc, state) => {
    acc[state.stateId] = state
    return acc
  }, {})
}
