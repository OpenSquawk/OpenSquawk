import { getFlowWithNodes } from './decisionFlowService'

export interface ImportDecisionTreeOptions {
  slug?: string
  name?: string
  description?: string
}

export async function importATCDecisionTree(options: ImportDecisionTreeOptions = {}) {
  const slug = typeof options.slug === 'string' && options.slug.trim().length
    ? options.slug.trim()
    : 'icao_atc_decision_tree'

  const { flow, nodes } = await getFlowWithNodes(slug)

  return {
    flow,
    nodes,
    importedStates: nodes.length,
  }
}
