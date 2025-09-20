import { createError } from 'h3'
import { buildRuntimeDecisionTree } from '../../../services/decisionFlowService'

export default defineEventHandler(async (event) => {
  const slugParam = event.context.params?.slug
  if (typeof slugParam !== 'string' || !slugParam.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Missing flow identifier' })
  }

  const tree = await buildRuntimeDecisionTree(slugParam.trim())
  return tree
})
