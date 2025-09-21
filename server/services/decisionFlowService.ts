import { createError } from 'h3'
import { DecisionFlow, type DecisionFlowDocument } from '../models/DecisionFlow'
import { DecisionNode, type DecisionNodeDocument } from '../models/DecisionNode'
import type {
  DecisionFlowModel,
  DecisionFlowSummary,
  DecisionNodeModel,
  DecisionNodeTransition,
  RuntimeDecisionAutoTransition,
  RuntimeDecisionState,
  RuntimeDecisionTree,
  RuntimeDecisionSystem,
} from '~~/shared/types/decision'

export function serializeFlowDocument(doc: DecisionFlowDocument, nodeCount = 0): DecisionFlowModel {
  return {
    id: String(doc._id),
    slug: doc.slug,
    name: doc.name,
    description: doc.description || undefined,
    schemaVersion: doc.schemaVersion || undefined,
    startState: doc.startState,
    endStates: Array.isArray(doc.endStates) ? doc.endStates : [],
    variables: doc.variables || {},
    flags: doc.flags || {},
    policies: doc.policies || {},
    hooks: doc.hooks || {},
    roles: Array.isArray(doc.roles) ? doc.roles : [],
    phases: Array.isArray(doc.phases) ? doc.phases : [],
    layout: doc.layout || undefined,
    metadata: doc.metadata || undefined,
    createdAt: doc.createdAt?.toISOString?.() || new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString?.() || new Date().toISOString(),
    nodeCount,
  }
}

export function serializeNodeDocument(doc: DecisionNodeDocument): DecisionNodeModel {
  const obj = doc.toObject<DecisionNodeDocument>({ virtuals: false })
  return {
    stateId: obj.stateId,
    title: obj.title || undefined,
    summary: obj.summary || undefined,
    role: obj.role as any,
    phase: obj.phase,
    sayTemplate: obj.sayTemplate || undefined,
    utteranceTemplate: obj.utteranceTemplate || undefined,
    elseSayTemplate: obj.elseSayTemplate || undefined,
    readbackRequired: Array.isArray(obj.readbackRequired) ? obj.readbackRequired : [],
    autoBehavior: obj.autoBehavior || undefined,
    actions: Array.isArray(obj.actions) ? obj.actions : [],
    handoff: obj.handoff || undefined,
    guard: obj.guard || undefined,
    trigger: obj.trigger || undefined,
    frequency: obj.frequency || undefined,
    frequencyName: obj.frequencyName || undefined,
    triggers: Array.isArray(obj.triggers) ? obj.triggers : [],
    conditions: Array.isArray(obj.conditions) ? obj.conditions : [],
    transitions: Array.isArray(obj.transitions) ? obj.transitions : [],
    layout: obj.layout || undefined,
    metadata: obj.metadata || undefined,
    llmTemplate: obj.llmTemplate || undefined,
    createdAt: obj.createdAt?.toISOString?.(),
    updatedAt: obj.updatedAt?.toISOString?.(),
  }
}

export async function listDecisionFlows(): Promise<DecisionFlowSummary[]> {
  const flows = await DecisionFlow.find().sort({ updatedAt: -1 }).lean()
  if (!flows.length) {
    return []
  }

  const ids = flows.map((flow) => flow._id)
  const counts = await DecisionNode.aggregate([
    { $match: { flow: { $in: ids } } },
    { $group: { _id: '$flow', count: { $sum: 1 } } },
  ])

  const countMap = counts.reduce<Record<string, number>>((acc, entry) => {
    acc[String(entry._id)] = entry.count
    return acc
  }, {})

  return flows.map((flow) => ({
    id: String(flow._id),
    slug: flow.slug,
    name: flow.name,
    description: flow.description || undefined,
    startState: flow.startState,
    nodeCount: countMap[String(flow._id)] || 0,
    updatedAt: flow.updatedAt?.toISOString?.() || new Date().toISOString(),
    createdAt: flow.createdAt?.toISOString?.() || new Date().toISOString(),
  }))
}

export async function getFlowWithNodes(slug: string): Promise<{ flow: DecisionFlowModel; nodes: DecisionNodeModel[] }> {
  const flowDoc = await DecisionFlow.findOne({ slug })
  if (!flowDoc) {
    throw createError({ statusCode: 404, statusMessage: 'Decision flow not found' })
  }

  const nodes = await DecisionNode.find({ flow: flowDoc._id }).sort({ stateId: 1 })
  const flow = serializeFlowDocument(flowDoc, nodes.length)
  const serializedNodes = nodes.map((node) => serializeNodeDocument(node))

  return { flow, nodes: serializedNodes }
}

function toRuntimeTransitions(
  transitions: DecisionNodeTransition[],
  types: Array<DecisionNodeTransition['type']>,
  includeAuto = false
) {
  return transitions
    .filter((transition) => types.includes(transition.type) || (includeAuto && transition.type === 'auto'))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((transition) => ({
      to: transition.target,
      label: transition.label || undefined,
      when: transition.condition || undefined,
      guard: transition.guard || undefined,
    }))
}

function toRuntimeTimers(transitions: DecisionNodeTransition[]): RuntimeDecisionState['timer_next'] {
  return transitions
    .filter((transition) => transition.type === 'timer' && transition.timer)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((transition) => ({
      to: transition.target,
      after_s: transition.timer?.afterSeconds ?? 0,
      label: transition.label || undefined,
    }))
}

function toRuntimeAutoTransitions(transitions: DecisionNodeTransition[]): RuntimeDecisionAutoTransition[] {
  return transitions
    .filter((transition) => transition.autoTrigger)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((transition) => ({
      id: transition.key,
      to: transition.target,
      label: transition.label || undefined,
      description: transition.description || undefined,
      condition: transition.condition || undefined,
      guard: transition.guard || undefined,
      trigger: transition.autoTrigger || null,
      metadata: transition.metadata || undefined,
    }))
}

function serializeRuntimeState(node: DecisionNodeDocument): RuntimeDecisionState {
  const obj = node.toObject<DecisionNodeDocument>({ virtuals: false })
  const transitions = Array.isArray(obj.transitions) ? obj.transitions : []

  return {
    role: obj.role as any,
    phase: obj.phase,
    say_tpl: obj.sayTemplate || undefined,
    utterance_tpl: obj.utteranceTemplate || undefined,
    else_say_tpl: obj.elseSayTemplate || undefined,
    next: toRuntimeTransitions(transitions, ['next'], true),
    ok_next: toRuntimeTransitions(transitions, ['ok']),
    bad_next: toRuntimeTransitions(transitions, ['bad']),
    timer_next: toRuntimeTimers(transitions),
    auto: obj.autoBehavior || null,
    readback_required: Array.isArray(obj.readbackRequired) ? obj.readbackRequired : undefined,
    actions: Array.isArray(obj.actions) ? obj.actions : undefined,
    handoff: obj.handoff || undefined,
    guard: obj.guard || undefined,
    trigger: obj.trigger || undefined,
    frequency: obj.frequency || undefined,
    frequencyName: obj.frequencyName || undefined,
    auto_transitions: toRuntimeAutoTransitions(transitions),
    triggers: Array.isArray(obj.triggers) ? obj.triggers : undefined,
    conditions: Array.isArray(obj.conditions) ? obj.conditions : undefined,
    metadata: obj.metadata || undefined,
  }
}

async function buildRuntimeTreeForDoc(
  flowDoc: DecisionFlowDocument,
  nodeDocs?: DecisionNodeDocument[]
): Promise<RuntimeDecisionTree> {
  const nodes = nodeDocs ?? (await DecisionNode.find({ flow: flowDoc._id }))
  const states = nodes.reduce<Record<string, RuntimeDecisionState>>((acc, node) => {
    acc[node.stateId] = serializeRuntimeState(node)
    return acc
  }, {})

  return {
    slug: flowDoc.slug,
    schema_version: flowDoc.schemaVersion || '1.0',
    name: flowDoc.name || flowDoc.slug,
    description: flowDoc.description || undefined,
    start_state: flowDoc.startState,
    end_states: Array.isArray(flowDoc.endStates) ? flowDoc.endStates : [],
    variables: flowDoc.variables || {},
    flags: flowDoc.flags || {},
    policies: flowDoc.policies || {},
    hooks: flowDoc.hooks || {},
    roles: Array.isArray(flowDoc.roles) ? flowDoc.roles : [],
    phases: Array.isArray(flowDoc.phases) ? flowDoc.phases : [],
    states,
  }
}

export async function buildRuntimeDecisionTree(slug: string): Promise<RuntimeDecisionTree> {
  const flowDoc = await DecisionFlow.findOne({ slug })
  if (!flowDoc) {
    throw createError({ statusCode: 404, statusMessage: 'Decision flow not found' })
  }

  return buildRuntimeTreeForDoc(flowDoc)
}

export async function buildRuntimeDecisionSystem(): Promise<RuntimeDecisionSystem> {
  const flowDocs = await DecisionFlow.find().sort({ updatedAt: -1 })
  if (!flowDocs.length) {
    throw createError({ statusCode: 404, statusMessage: 'No decision flows available' })
  }

  const flowIds = flowDocs.map((doc) => doc._id)

  const nodeDocs = await DecisionNode.find({ flow: { $in: flowIds } })
  const groupedNodes = nodeDocs.reduce<Record<string, DecisionNodeDocument[]>>((acc, node) => {
    const key = String(node.flow)
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(node)
    return acc
  }, {})

  const runtimeTrees: RuntimeDecisionTree[] = []
  for (const doc of flowDocs) {
    const nodes = groupedNodes[String(doc._id)] || []
    runtimeTrees.push(await buildRuntimeTreeForDoc(doc, nodes))
  }

  const flows = runtimeTrees.reduce<Record<string, RuntimeDecisionTree>>((acc, tree) => {
    acc[tree.slug] = tree
    return acc
  }, {})

  const order = runtimeTrees.map((tree) => tree.slug)
  const main = flows['icao_atc_decision_tree'] ? 'icao_atc_decision_tree' : order[0]

  return {
    main,
    order,
    flows,
  }
}
