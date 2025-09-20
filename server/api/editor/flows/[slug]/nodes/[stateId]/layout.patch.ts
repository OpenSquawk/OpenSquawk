import { createError, readBody } from 'h3'
import { requireAdmin } from '../../../../../../utils/auth'
import { DecisionFlow } from '../../../../../../models/DecisionFlow'
import { DecisionNode } from '../../../../../../models/DecisionNode'
import { sanitizeLayout } from '../../../../../../utils/decisionSanitizer'

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

  const node = await DecisionNode.findOne({ flow: flow._id, stateId })
  if (!node) {
    throw createError({ statusCode: 404, statusMessage: 'State not found' })
  }

  const body = await readBody<Record<string, any>>(event)
  const layoutUpdate = sanitizeLayout(body)
  if (!layoutUpdate) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid layout payload' })
  }

  const existingLayout = node.layout || { x: 0, y: 0 }
  node.layout = { ...existingLayout, ...layoutUpdate }
  await node.save()

  return { success: true, layout: node.layout }
})
