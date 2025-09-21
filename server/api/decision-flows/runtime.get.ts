import { buildRuntimeDecisionSystem } from '../../services/decisionFlowService'

export default defineEventHandler(async () => {
  const system = await buildRuntimeDecisionSystem()
  return system
})
