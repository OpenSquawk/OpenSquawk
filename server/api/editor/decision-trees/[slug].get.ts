import { defineEventHandler, createError } from 'h3'
import { requireAdmin } from '~~/server/utils/auth'
import { DecisionTree } from '~~/server/models/DecisionTree'
import { mapDecisionTreeDocument } from '~~/server/utils/decisionTree'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const slugParam = event.context.params?.slug
  const slug = typeof slugParam === 'string' ? slugParam.trim() : ''
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing decision tree identifier' })
  }

  const tree = await DecisionTree.findOne({ slug })
  if (!tree) {
    throw createError({ statusCode: 404, statusMessage: 'Decision tree not found' })
  }

  return mapDecisionTreeDocument(tree)
})
