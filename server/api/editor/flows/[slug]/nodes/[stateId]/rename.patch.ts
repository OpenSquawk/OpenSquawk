import { createError, readBody } from 'h3'
import { requireAdmin } from '../../../../../../utils/auth'
import { DecisionFlow } from '../../../../../../models/DecisionFlow'
import { DecisionNode } from '../../../../../../models/DecisionNode'
import { serializeNodeDocument } from '../../../../../../services/decisionFlowService'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const slugParam = event.context.params?.slug
  const stateParam = event.context.params?.stateId
  if (typeof slugParam !== 'string' || !slugParam.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Missing flow identifier' })
  }
  if (typeof stateParam !== 'string' || !stateParam.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Missing state identifier' })
  }

  const slug = slugParam.trim()
  const currentStateId = stateParam.trim().toUpperCase()

  const body = await readBody<{ stateId?: string }>(event)
  const nextStateRaw = typeof body?.stateId === 'string' ? body.stateId.trim() : ''
  if (!nextStateRaw) {
    throw createError({ statusCode: 400, statusMessage: 'Neuer Identifier ist erforderlich' })
  }

  const nextStateId = nextStateRaw.toUpperCase()
  const flow = await DecisionFlow.findOne({ slug })
  if (!flow) {
    throw createError({ statusCode: 404, statusMessage: 'Decision flow not found' })
  }

  const existingNode = await DecisionNode.findOne({ flow: flow._id, stateId: nextStateId })
  if (existingNode) {
    throw createError({ statusCode: 409, statusMessage: 'State identifier already exists' })
  }

  const node = await DecisionNode.findOne({ flow: flow._id, stateId: currentStateId })
  if (!node) {
    throw createError({ statusCode: 404, statusMessage: 'State not found' })
  }

  if (nextStateId === currentStateId) {
    const references = await DecisionNode.find({
      flow: flow._id,
      'transitions.target': currentStateId,
    })
    return {
      node: serializeNodeDocument(node),
      references: references.map((ref) => serializeNodeDocument(ref)),
      flow: {
        startState: flow.startState,
        endStates: flow.endStates ?? [],
      },
    }
  }

  const referencingNodes = await DecisionNode.find({
    flow: flow._id,
    'transitions.target': currentStateId,
  }).select('_id')

  const referencingIds = referencingNodes.map((entry) => entry._id)

  node.stateId = nextStateId
  await node.save()

  if (referencingIds.length) {
    await DecisionNode.updateMany(
      { flow: flow._id, _id: { $in: referencingIds } },
      { $set: { 'transitions.$[transition].target': nextStateId } },
      { arrayFilters: [{ 'transition.target': currentStateId }] }
    )
  }

  if (flow.startState === currentStateId) {
    flow.startState = nextStateId
  }
  if (Array.isArray(flow.endStates) && flow.endStates.length) {
    flow.endStates = flow.endStates.map((entry: string) => (entry === currentStateId ? nextStateId : entry))
  }
  await flow.save()

  const updatedReferences = referencingIds.length
    ? await DecisionNode.find({ _id: { $in: referencingIds } })
    : []

  return {
    node: serializeNodeDocument(node),
    references: updatedReferences.map((ref) => serializeNodeDocument(ref)),
    flow: {
      startState: flow.startState,
      endStates: flow.endStates ?? [],
    },
  }
})
