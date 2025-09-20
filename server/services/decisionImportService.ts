import { randomUUID } from 'node:crypto'
import atcDecisionTree from '~~/shared/data/atcDecisionTree'
import { DecisionFlow } from '../models/DecisionFlow'
import { DecisionNode } from '../models/DecisionNode'
import type { DecisionNodeTransition } from '~~/shared/types/decision'
import { getFlowWithNodes } from './decisionFlowService'

interface LegacyTransition {
  to?: string
  when?: string
  label?: string
  condition?: string
  guard?: string
  after_s?: number
  allowManualProceed?: boolean
  description?: string
}

export interface ImportDecisionTreeOptions {
  slug?: string
  name?: string
  description?: string
}

const ROLE_COLORS: Record<string, string> = {
  pilot: '#0ea5e9',
  atc: '#22d3ee',
  system: '#f59e0b',
}

function createTransition(
  type: DecisionNodeTransition['type'],
  data: LegacyTransition,
  order: number
): DecisionNodeTransition | null {
  if (!data || typeof data !== 'object') return null
  const target = typeof data.to === 'string' ? data.to.trim() : ''
  if (!target) return null

  const transition: DecisionNodeTransition = {
    key: `${type}_${randomUUID().slice(0, 8)}`,
    type,
    target,
    order,
  }

  const label = typeof data.label === 'string' ? data.label.trim() : undefined
  if (label) transition.label = label

  const condition =
    typeof data.when === 'string'
      ? data.when.trim()
      : typeof data.condition === 'string'
        ? data.condition.trim()
        : undefined
  if (condition) transition.condition = condition

  const guard = typeof data.guard === 'string' ? data.guard.trim() : undefined
  if (guard) transition.guard = guard

  const description = typeof data.description === 'string' ? data.description.trim() : undefined
  if (description) transition.description = description

  if (type === 'timer') {
    const after = typeof data.after_s === 'number' ? data.after_s : Number(data.after_s)
    if (Number.isFinite(after)) {
      transition.timer = {
        afterSeconds: Number(after),
        allowManualProceed: data.allowManualProceed !== false,
      }
    }
  }

  return transition
}

export async function importATCDecisionTree(options: ImportDecisionTreeOptions = {}) {
  const slug = typeof options.slug === 'string' && options.slug.trim().length
    ? options.slug.trim()
    : atcDecisionTree.name || 'icao_atc_decision_tree'

  const name = typeof options.name === 'string' && options.name.trim().length
    ? options.name.trim()
    : 'ATC Decision Tree'

  const existingFlow = await DecisionFlow.findOne({ slug })
  const flow = existingFlow || new DecisionFlow({ slug, name })

  flow.name = name
  flow.description = options.description ?? atcDecisionTree.description ?? flow.description
  flow.schemaVersion = atcDecisionTree.schema_version || '1.0'
  flow.startState = atcDecisionTree.start_state
  flow.endStates = Array.isArray(atcDecisionTree.end_states) ? atcDecisionTree.end_states : []
  flow.variables = atcDecisionTree.variables || {}
  flow.flags = atcDecisionTree.flags || {}
  flow.policies = atcDecisionTree.policies || {}
  flow.hooks = atcDecisionTree.hooks || {}
  flow.roles = Array.isArray(atcDecisionTree.roles) ? atcDecisionTree.roles : flow.roles
  flow.phases = Array.isArray(atcDecisionTree.phases) ? atcDecisionTree.phases : flow.phases
  flow.layout = flow.layout || { zoom: 0.9, pan: { x: 0, y: 0 }, groups: [] }

  await flow.save()

  await DecisionNode.deleteMany({ flow: flow._id })

  const phases = Array.isArray(flow.phases) && flow.phases.length ? flow.phases : ['General']
  const phaseColumns = new Map<string, number>()
  phases.forEach((phase, index) => phaseColumns.set(phase, index))
  const phaseRowCounters = new Map<string, number>()

  const stateEntries = Object.entries(atcDecisionTree.states || {})
  const nodesToInsert = stateEntries.map(([stateId, state]) => {
    const role = typeof state.role === 'string' ? state.role : 'system'
    const phase = typeof state.phase === 'string' ? state.phase : 'General'

    const columnIndex = phaseColumns.has(phase) ? phaseColumns.get(phase)! : phaseColumns.size
    if (!phaseColumns.has(phase)) {
      phaseColumns.set(phase, columnIndex)
    }
    const rowIndex = phaseRowCounters.get(phase) || 0
    phaseRowCounters.set(phase, rowIndex + 1)

    const transitions: DecisionNodeTransition[] = []
    let order = 0

    if (Array.isArray(state.next)) {
      for (const entry of state.next as LegacyTransition[]) {
        const transition = createTransition('next', entry, order++)
        if (transition) transitions.push(transition)
      }
    }

    if (Array.isArray(state.ok_next)) {
      for (const entry of state.ok_next as LegacyTransition[]) {
        const transition = createTransition('ok', entry, order++)
        if (transition) transitions.push(transition)
      }
    }

    if (Array.isArray(state.bad_next)) {
      for (const entry of state.bad_next as LegacyTransition[]) {
        const transition = createTransition('bad', entry, order++)
        if (transition) transitions.push(transition)
      }
    }

    if (Array.isArray(state.timer_next)) {
      for (const entry of state.timer_next as LegacyTransition[]) {
        const transition = createTransition('timer', entry, order++)
        if (transition) transitions.push(transition)
      }
    }

    const readbackRequired = Array.isArray(state.readback_required)
      ? state.readback_required.filter((item: any) => typeof item === 'string' && item.trim().length)
      : []

    const layout = {
      x: columnIndex * 340,
      y: rowIndex * 220,
      color: ROLE_COLORS[role] || '#38bdf8',
    }

    return {
      flow: flow._id,
      stateId,
      title: typeof state.title === 'string' ? state.title.trim() || undefined : undefined,
      summary: typeof state.summary === 'string' ? state.summary.trim() || undefined : undefined,
      role,
      phase,
      sayTemplate: typeof state.say_tpl === 'string' ? state.say_tpl : undefined,
      utteranceTemplate: typeof state.utterance_tpl === 'string' ? state.utterance_tpl : undefined,
      elseSayTemplate: typeof state.else_say_tpl === 'string' ? state.else_say_tpl : undefined,
      readbackRequired,
      autoBehavior: typeof state.auto === 'string' ? state.auto : undefined,
      actions: Array.isArray(state.actions) ? state.actions : [],
      handoff: state.handoff && typeof state.handoff === 'object' ? state.handoff : undefined,
      guard: typeof state.guard === 'string' ? state.guard : undefined,
      trigger: typeof state.trigger === 'string' ? state.trigger : undefined,
      frequency: typeof state.frequency === 'string' ? state.frequency : undefined,
      frequencyName: typeof state.frequencyName === 'string' ? state.frequencyName : undefined,
      transitions,
      layout,
    }
  })

  await DecisionNode.insertMany(nodesToInsert)

  const { flow: serializedFlow, nodes } = await getFlowWithNodes(slug)

  return {
    flow: serializedFlow,
    nodes,
    importedStates: nodes.length,
  }
}

