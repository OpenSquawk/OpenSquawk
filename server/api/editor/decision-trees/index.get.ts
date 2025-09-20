import { defineEventHandler } from 'h3'
import { requireAdmin } from '~~/server/utils/auth'
import { DecisionTree } from '~~/server/models/DecisionTree'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const trees = await DecisionTree.find({}, { slug: 1, title: 1, description: 1, updatedAt: 1, startState: 1, endStates: 1 })
    .sort({ updatedAt: -1 })

  return {
    items: trees.map((tree) => ({
      slug: tree.slug,
      title: tree.title,
      description: tree.description || undefined,
      updatedAt: tree.updatedAt?.toISOString() || undefined,
      startState: tree.startState,
      endStates: Array.isArray(tree.endStates) ? [...tree.endStates] : [],
      nodeCount: Array.isArray(tree.states) ? tree.states.length : 0,
    })),
  }
})
