import { defineEventHandler, createError } from 'h3'
import { requireAdmin } from '../../../utils/auth'
import { DEFAULT_TREE_NAME, toClientTree, getTreeByName } from '../../../utils/decisionTree'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const tree = await getTreeByName(DEFAULT_TREE_NAME)
  if (!tree) {
    throw createError({ statusCode: 404, statusMessage: 'Decision tree not found' })
  }
  return {
    tree: toClientTree(tree),
  }
})
