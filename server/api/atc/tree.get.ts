import { defineEventHandler, createError } from 'h3'
import { getTreeByName, DEFAULT_TREE_NAME, toClientTree } from '../../utils/decisionTree'

export default defineEventHandler(async () => {
  const tree = await getTreeByName(DEFAULT_TREE_NAME)
  if (!tree) {
    throw createError({ statusCode: 404, statusMessage: 'Decision tree not found' })
  }
  return {
    tree: toClientTree(tree),
  }
})
