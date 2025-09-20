import { getQuery, createError } from 'h3'
import { loadDecisionTree } from '../../utils/atcTree'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const identifier = typeof query.flow === 'string' && query.flow.trim().length
    ? query.flow.trim()
    : 'icao_atc_decision_tree'

  const tree = await loadDecisionTree(identifier)
  if (!tree) {
    throw createError({ statusCode: 404, statusMessage: 'Decision tree not found' })
  }

  return tree
})
