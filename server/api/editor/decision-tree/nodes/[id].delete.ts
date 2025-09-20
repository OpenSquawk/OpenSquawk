import { defineEventHandler, createError } from 'h3'
import { requireAdmin } from '../../../../utils/auth'
import { DEFAULT_TREE_NAME, toClientTree, getTreeByName } from '../../../../utils/decisionTree'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const params = event.context.params as { id?: string }
  const nodeId = (params?.id || '').trim()
  if (!nodeId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing node id' })
  }

  const tree = await getTreeByName(DEFAULT_TREE_NAME)
  if (!tree) {
    throw createError({ statusCode: 404, statusMessage: 'Decision tree not found' })
  }

  if (!tree.states.has(nodeId)) {
    throw createError({ statusCode: 404, statusMessage: `State ${nodeId} not found` })
  }

  tree.states.delete(nodeId)
  await tree.save()

  return {
    success: true,
    removed: nodeId,
    tree: toClientTree(tree),
  }
})
