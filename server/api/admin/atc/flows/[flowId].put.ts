import { readBody, createError } from 'h3'
import { requireAdmin } from '../../../../utils/auth'
import { AtcFlow } from '../../../../models/AtcFlow'
import { serializeFlow } from '../../../../utils/atcTree'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const params = event.context.params || {}
  const flowId = params.flowId
  if (!flowId) {
    throw createError({ statusCode: 400, statusMessage: 'flowId missing' })
  }

  const body = await readBody<Record<string, any>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Body required' })
  }

  const updates: Record<string, any> = {}

  if (typeof body.name === 'string') updates.name = body.name.trim()
  if (typeof body.schemaVersion === 'string') updates.schemaVersion = body.schemaVersion.trim()
  if (typeof body.description === 'string' || body.description === null) updates.description = body.description ?? undefined
  if (typeof body.startState === 'string') updates.startState = body.startState.trim()
  if (Array.isArray(body.endStates)) updates.endStates = body.endStates.filter(Boolean)
  if (Array.isArray(body.roles)) updates.roles = body.roles.filter(Boolean)
  if (Array.isArray(body.phases)) updates.phases = body.phases.filter(Boolean)
  if (body.variables && typeof body.variables === 'object') updates.variables = body.variables
  if (body.flags && typeof body.flags === 'object') updates.flags = body.flags
  if (body.policies && typeof body.policies === 'object') updates.policies = body.policies
  if (body.hooks && typeof body.hooks === 'object') updates.hooks = body.hooks
  if (body.metadata && typeof body.metadata === 'object') updates.metadata = body.metadata

  if (!Object.keys(updates).length) {
    throw createError({ statusCode: 400, statusMessage: 'No valid fields to update' })
  }

  const updated = await AtcFlow.findOneAndUpdate(
    { $or: [{ _id: flowId }, { name: flowId }] },
    { $set: updates },
    { new: true }
  )

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Flow not found' })
  }

  return serializeFlow(updated)
})
