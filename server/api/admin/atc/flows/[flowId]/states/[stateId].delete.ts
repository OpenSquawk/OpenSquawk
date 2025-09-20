import { createError } from 'h3'
import { requireAdmin } from '../../../../../../utils/auth'
import { AtcFlow } from '../../../../../../models/AtcFlow'
import { AtcState } from '../../../../../../models/AtcState'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const params = event.context.params || {}
  const flowId = params.flowId
  const stateId = params.stateId

  if (!flowId || !stateId) {
    throw createError({ statusCode: 400, statusMessage: 'flowId and stateId are required' })
  }

  const flow = await AtcFlow.findOne({ $or: [{ _id: flowId }, { name: flowId }] }).exec()
  if (!flow) {
    throw createError({ statusCode: 404, statusMessage: 'Flow not found' })
  }

  const deleted = await AtcState.findOneAndDelete({ flow: flow._id, stateId }).exec()
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'State not found' })
  }

  return { success: true }
})
