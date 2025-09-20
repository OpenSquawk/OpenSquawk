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

  const sanitized = sanitizeStateInput({
    ...existing,
    ...body.state,
    role,
    phase,
  })

  if (!sanitized.layout && existing.layout) {
    sanitized.layout = existing.layout
  }

  tree.states.set(nodeId, sanitized)
  await tree.save()

  return {
    success: true,
    node: {
      id: nodeId,
      state: sanitized,
    },
    tree: toClientTree(tree),
  }
})
