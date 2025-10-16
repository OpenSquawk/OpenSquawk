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
    entryMode: doc.entryMode || 'parallel',
    isMain: doc.isMain || false,
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
    entryMode: flow.entryMode || 'parallel',
    isMain: Boolean(flow.isMain),
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

type TransitionWithSource = {
  source: DecisionNodeDocument
  transition: DecisionNodeTransition
}

function describeTransitionType(transition: DecisionNodeTransition): string | null {
  switch (transition.type) {
    case 'next':
      return 'on the standard progression'
    case 'ok':
      return 'when the acknowledgement branch is selected'
    case 'bad':
      return 'when the rejection branch is selected'
    case 'timer':
      return 'after its timer elapses'
    case 'auto':
      return 'through an automatic follow-up'
    case 'interrupt':
      return 'as an interrupt'
    case 'return':
      return 'when control returns from a nested sequence'
    default:
      return null
  }
}

function describeAutoTrigger(trigger: DecisionNodeTransition['autoTrigger']): string | null {
  if (!trigger) {
    return null
  }

  if (typeof trigger.description === 'string' && trigger.description.trim().length) {
    return trigger.description.trim()
  }

  let base: string
  switch (trigger.type) {
    case 'telemetry':
      base = `the telemetry trigger monitoring ${trigger.parameter ?? 'the configured parameter'}`
      break
    case 'variable':
      base = `the variable trigger watching ${trigger.variable ?? 'the configured variable'}`
      break
    case 'expression':
      base = 'the expression trigger'
      break
    default:
      base = 'the automatic trigger'
      break
  }

  if (trigger.operator) {
    base += ` with operator ${trigger.operator}`
  }

  if (typeof trigger.delayMs === 'number' && trigger.delayMs > 0) {
    base += ' after its configured delay'
  }

  return `${base} fires`
}

function describeIncomingTransition({ source, transition }: TransitionWithSource): string | null {
  const trimmedTitle = typeof source.title === 'string' ? source.title.trim() : ''
  const sourceName = trimmedTitle.length ? trimmedTitle : source.stateId

  const detailParts: string[] = []
  if (transition.label) {
    detailParts.push(`via "${transition.label}"`)
  }

  if (transition.description) {
    detailParts.push(transition.description)
  }

  const typePhrase = describeTransitionType(transition)
  if (typePhrase) {
    detailParts.push(typePhrase)
  }

  const qualifiers: string[] = []
  if (transition.condition) {
    qualifiers.push(`condition "${transition.condition}" matches`)
  }

  if (transition.guard) {
    qualifiers.push(`guard "${transition.guard}" allows it`)
  }

  const autoTriggerDescription = describeAutoTrigger(transition.autoTrigger)
  if (autoTriggerDescription) {
    qualifiers.push(autoTriggerDescription)
  }

  const segments: string[] = [`From ${sourceName}`]
  if (detailParts.length) {
    segments.push(detailParts.join(' '))
  }

  if (qualifiers.length) {
    segments.push(`when ${qualifiers.join(' and ')}`)
  }

  const sentence = segments.join(' ').replace(/\s+/g, ' ').trim()
  return sentence.length ? sentence : null
}

function buildEntrySummaryForState(
  node: DecisionNodeDocument,
  incoming: TransitionWithSource[],
  startStateId: string
): string | undefined {
  if (node.stateId === startStateId) {
    return 'Configured start state of this flow.'
  }

  if (!incoming.length) {
    return 'Reached by external routing; no internal transitions target this state.'
  }

  const descriptions = incoming
    .slice()
    .sort((a, b) => (a.transition.order ?? 0) - (b.transition.order ?? 0))
    .map((entry) => describeIncomingTransition(entry))
    .filter((value): value is string => Boolean(value))

  if (!descriptions.length) {
    return 'Reached via transitions whose conditions are defined elsewhere.'
  }

  if (descriptions.length === 1) {
    return `Entry condition: ${descriptions[0]}.`
  }

  const bulletList = descriptions.map((text) => `- ${text}`).join('\n')
  return `Possible entry paths:\n${bulletList}`
}

function serializeRuntimeState(node: DecisionNodeDocument): RuntimeDecisionState {
  const obj = node.toObject<DecisionNodeDocument>({ virtuals: false })
  const transitions = Array.isArray(obj.transitions) ? obj.transitions : []

  return {
    role: obj.role as any,
    phase: obj.phase,
    name: obj.title || undefined,
    summary: obj.summary || undefined,
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

  const incomingMap = nodes.reduce<Record<string, TransitionWithSource[]>>((acc, node) => {
    const nodeTransitions = Array.isArray(node.transitions) ? node.transitions : []
    for (const transition of nodeTransitions) {
      if (!transition?.target) {
        continue
      }
      if (!acc[transition.target]) {
        acc[transition.target] = []
      }
      acc[transition.target].push({ source: node, transition })
    }
    return acc
  }, {})

  const states = nodes.reduce<Record<string, RuntimeDecisionState>>((acc, node) => {
    acc[node.stateId] = serializeRuntimeState(node)
    return acc
  }, {})

  for (const node of nodes) {
    const runtimeState = states[node.stateId]
    if (!runtimeState) {
      continue
    }

    const entrySummary = buildEntrySummaryForState(node, incomingMap[node.stateId] ?? [], flowDoc.startState)
    if (entrySummary) {
      runtimeState.entry_summary = entrySummary
    }
  }

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
    entry_mode: flowDoc.isMain ? 'main' : flowDoc.entryMode || 'parallel',
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
  const preferredMain = flowDocs.find((doc) => doc.isMain)?.slug
  const fallbackMain = flowDocs.find((doc) => doc.slug === 'icao_atc_decision_tree')?.slug
  const main = preferredMain || fallbackMain || order[0]

  return {
    main,
    order,
    flows,
  }
}
