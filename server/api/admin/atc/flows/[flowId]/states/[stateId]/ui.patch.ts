import { readBody, createError } from 'h3'
import { requireAdmin } from '../../../../../../../utils/auth'
import { AtcFlow } from '../../../../../../../models/AtcFlow'
import { AtcState } from '../../../../../../../models/AtcState'
import { sanitizeStateUiPayload } from '../../../../../../../utils/atcStateInput'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const params = event.context.params || {}
  const flowId = params.flowId
  const stateId = params.stateId

  if (!flowId || !stateId) {
    throw createError({ statusCode: 400, statusMessage: 'flowId and stateId are required' })
  }

  const body = await readBody<Record<string, any>>(event)
  let ui: Record<string, any>
  try {
    ui = sanitizeStateUiPayload(body)
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: err?.message || 'Invalid UI payload' })
  }

  const flow = await AtcFlow.findOne({ $or: [{ _id: flowId }, { name: flowId }] }).exec()
  if (!flow) {
    throw createError({ statusCode: 404, statusMessage: 'Flow not found' })
  }

  const updated = await AtcState.findOneAndUpdate(
    { flow: flow._id, stateId },
    { $set: { ui } },
    { new: true }
  ).exec()

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'State not found' })
  }

  return { success: true, ui: updated.ui || ui }
})
