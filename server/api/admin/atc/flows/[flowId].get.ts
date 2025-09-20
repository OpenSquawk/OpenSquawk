import { getQuery, createError } from 'h3'
import { requireAdmin } from '../../../../utils/auth'
import { loadFlowWithStates } from '../../../../utils/atcTree'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const params = event.context.params || {}
  const flowId = params.flowId
  if (!flowId) {
    throw createError({ statusCode: 400, statusMessage: 'flowId missing' })
  }

  const query = getQuery(event)
  const includeStates = query.states !== 'false' && query.states !== '0'

  const result = await loadFlowWithStates(flowId)
  if (!result) {
    throw createError({ statusCode: 404, statusMessage: 'Flow not found' })
  }

  if (!includeStates) {
    return result.flow
  }

  return result
})
