import { createError } from 'h3'
import { requireAdmin } from '../../../../utils/auth'
import { getFlowWithNodes } from '../../../../services/decisionFlowService'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const slug = event.context.params?.slug
  if (typeof slug !== 'string' || !slug.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Missing flow identifier' })
  }

  const data = await getFlowWithNodes(slug.trim())
  return data
})
