import { createError } from 'h3'
import { requireAdmin } from '../../../../../../utils/auth'
import { DecisionFlow } from '../../../../../../models/DecisionFlow'
import { DecisionNode } from '../../../../../../models/DecisionNode'

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
  const stateId = stateParam.trim().toUpperCase()

  const flow = await DecisionFlow.findOne({ slug })
  if (!flow) {
    throw createError({ statusCode: 404, statusMessage: 'Decision flow not found' })
  }

  const result = await DecisionNode.deleteOne({ flow: flow._id, stateId })
  if (!result.deletedCount) {
    throw createError({ statusCode: 404, statusMessage: 'State not found' })
  }

  return { success: true }
})
