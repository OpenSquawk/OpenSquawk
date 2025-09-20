import { readBody, createError } from 'h3'
import { requireAdmin } from '../../../../../../utils/auth'
import { AtcFlow } from '../../../../../../models/AtcFlow'
import { AtcState } from '../../../../../../models/AtcState'
import { sanitizeStateInput } from '../../../../../../utils/atcStateInput'
import { serializeState } from '../../../../../../utils/atcTree'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const params = event.context.params || {}
  const flowId = params.flowId
  const originalStateId = params.stateId

  if (!flowId || !originalStateId) {
    throw createError({ statusCode: 400, statusMessage: 'flowId and stateId are required' })
  }

  const body = await readBody<Record<string, any>>(event)
  const desiredStateId = typeof body?.stateId === 'string' && body.stateId.trim().length
    ? body.stateId.trim()
    : originalStateId

  const flow = await AtcFlow.findOne({ $or: [{ _id: flowId }, { name: flowId }] }).exec()
  if (!flow) {
    throw createError({ statusCode: 404, statusMessage: 'Flow not found' })
  }

  const existing = await AtcState.findOne({ flow: flow._id, stateId: originalStateId }).exec()
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'State not found' })
  }

  if (desiredStateId !== originalStateId) {
    const conflict = await AtcState.findOne({ flow: flow._id, stateId: desiredStateId }).exec()
    if (conflict && String(conflict._id) !== String(existing._id)) {
      throw createError({ statusCode: 409, statusMessage: 'Another state already uses this ID' })
    }
  }

  let payload: Record<string, any>
  try {
    payload = sanitizeStateInput(desiredStateId, body)
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: err?.message || 'Invalid state payload' })
  }

  payload.flow = flow._id

  const updated = await AtcState.findByIdAndUpdate(existing._id, { $set: payload }, { new: true })
  if (!updated) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to update state' })
  }

  return serializeState(updated)
})
