import { readBody, createError } from 'h3'
import { requireAdmin } from '../../../../../utils/auth'
import { AtcFlow } from '../../../../../models/AtcFlow'
import { AtcState } from '../../../../../models/AtcState'
import { sanitizeStateInput } from '../../../../../utils/atcStateInput'
import { serializeState } from '../../../../../utils/atcTree'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const params = event.context.params || {}
  const flowId = params.flowId
  if (!flowId) {
    throw createError({ statusCode: 400, statusMessage: 'flowId missing' })
  }

  const body = await readBody<Record<string, any>>(event)
  const stateId = typeof body?.stateId === 'string' ? body.stateId.trim() : ''
  if (!stateId) {
    throw createError({ statusCode: 400, statusMessage: 'stateId is required' })
  }

  const flow = await AtcFlow.findOne({ $or: [{ _id: flowId }, { name: flowId }] }).exec()
  if (!flow) {
    throw createError({ statusCode: 404, statusMessage: 'Flow not found' })
  }

  let payload: Record<string, any>
  try {
    payload = sanitizeStateInput(stateId, body)
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: err?.message || 'Invalid state payload' })
  }

  payload.flow = flow._id

  const existing = await AtcState.findOne({ flow: flow._id, stateId }).exec()
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'State with this ID already exists' })
  }

  const doc = await AtcState.create(payload)
  return serializeState(doc)
})
