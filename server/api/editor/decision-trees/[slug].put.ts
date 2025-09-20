import { defineEventHandler, createError, readBody } from 'h3'
import { requireAdmin } from '~~/server/utils/auth'
import { DecisionTree } from '~~/server/models/DecisionTree'
import { applyDecisionTreePayload, mapDecisionTreeDocument } from '~~/server/utils/decisionTree'
import type { DecisionTreeDTO } from '~~/shared/types/decisionTree'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)

  const slugParam = event.context.params?.slug
  const slug = typeof slugParam === 'string' ? slugParam.trim() : ''
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing decision tree identifier' })
  }

  const payload = await readBody<DecisionTreeDTO | null>(event)
  if (!payload || !payload.tree) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }
  if (!payload.tree.startState) {
    throw createError({ statusCode: 400, statusMessage: 'startState is required' })
  }
  if (!payload.tree.title) {
    throw createError({ statusCode: 400, statusMessage: 'title is required' })
  }

  let tree = await DecisionTree.findOne({ slug })
  if (!tree) {
    tree = new DecisionTree({
      slug,
      title: payload.tree.title,
      startState: payload.tree.startState,
    })
  }

  applyDecisionTreePayload(tree, payload, {
    id: user._id ? String(user._id) : undefined,
    email: user.email,
    name: user.name || undefined,
  })

  await tree.save()

  return mapDecisionTreeDocument(tree)
})
