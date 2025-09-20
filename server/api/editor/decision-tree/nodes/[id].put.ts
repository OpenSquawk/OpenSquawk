import { defineEventHandler, createError, readBody } from 'h3'
import { requireAdmin } from '../../../../utils/auth'
import {
  DEFAULT_TREE_NAME,
  sanitizeStateInput,
  toClientTree,
  getTreeByName,
} from '../../../../utils/decisionTree'
import type { DecisionTreeState } from '~~/types/decision-tree'

interface UpdateNodeRequest {
  state: Partial<DecisionTreeState>
  id?: string
}

function updateTransitionTargets(state: DecisionTreeState, from: string, to: string) {
  const remap = (list?: { to: string }[]) => {
    list?.forEach((transition) => {
      if (transition.to === from) transition.to = to
    })
  }
  remap(state.next)
  remap(state.ok_next)
  remap(state.bad_next)
  state.timer_next?.forEach((transition) => {
    if (transition.to === from) transition.to = to
  })
  state.auto_transitions?.forEach((transition) => {
    if (transition.to === from) transition.to = to
  })
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const params = event.context.params as { id?: string }
  const nodeId = (params?.id || '').trim()
  if (!nodeId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing node id' })
  }

  const body = await readBody<UpdateNodeRequest | undefined>(event)
  if (!body?.state) {
    throw createError({ statusCode: 400, statusMessage: 'Missing node payload' })
  }

  const tree = await getTreeByName(DEFAULT_TREE_NAME)
  if (!tree) {
    throw createError({ statusCode: 404, statusMessage: 'Decision tree not found' })
  }

  const existing = tree.states.get(nodeId)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: `State ${nodeId} not found` })
  }

  const role = (body.state.role || existing.role) as DecisionTreeState['role']
  const phase = body.state.phase || existing.phase
  const requestedId = (body.id || '').trim()
  const renameRequested = requestedId && requestedId !== nodeId

  if (renameRequested && tree.states.has(requestedId)) {
    throw createError({ statusCode: 409, statusMessage: `State ${requestedId} already exists` })
  }

  const sanitized = sanitizeStateInput({
    ...existing,
    ...body.state,
    role,
    phase,
  })

  if (!sanitized.layout && existing.layout) {
    sanitized.layout = existing.layout
  }

  let responseId = nodeId

  if (renameRequested) {
    if (!sanitized.label) {
      sanitized.label = existing.label || nodeId
    }
    updateTransitionTargets(sanitized, nodeId, requestedId)
    tree.states.delete(nodeId)
    tree.states.set(requestedId, sanitized)
    tree.states.forEach((state, id) => {
      if (id !== requestedId) {
        updateTransitionTargets(state, nodeId, requestedId)
      }
    })
    if (tree.start_state === nodeId) {
      tree.start_state = requestedId
    }
    tree.end_states = tree.end_states.map((id) => (id === nodeId ? requestedId : id))
    tree.markModified('states')
    responseId = requestedId
  } else {
    tree.states.set(nodeId, sanitized)
  }

  await tree.save()

  return {
    success: true,
    node: {
      id: responseId,
      state: sanitized,
    },
    tree: toClientTree(tree),
  }
})
