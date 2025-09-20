import { listDecisionFlows } from '../../services/decisionFlowService'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const flows = await listDecisionFlows()
  return flows
})
