import { defineEventHandler, createError, readBody } from 'h3'
import { requireAdmin } from '../../../utils/auth'
import { DEFAULT_TREE_NAME, ensureArray, toClientTree, getTreeByName } from '../../../utils/decisionTree'
import type { DecisionTreeRecord } from '~~/types/decision-tree'

interface UpdateTreeRequest {
  tree: Partial<DecisionTreeRecord>
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<UpdateTreeRequest | undefined>(event)
  if (!body?.tree) {
    throw createError({ statusCode: 400, statusMessage: 'Missing tree payload' })
  }

  const tree = await getTreeByName(DEFAULT_TREE_NAME)
  if (!tree) {
    throw createError({ statusCode: 404, statusMessage: 'Decision tree not found' })
  }

  const payload = body.tree
  if (payload.schema_version) tree.schema_version = payload.schema_version
  if (payload.description !== undefined) tree.description = payload.description
  if (payload.start_state) tree.start_state = payload.start_state
  if (payload.end_states) tree.end_states = ensureArray(payload.end_states)
  if (payload.variables) tree.variables = payload.variables
  if (payload.flags) tree.flags = payload.flags
  if (payload.policies) tree.policies = payload.policies
  if (payload.hooks) tree.hooks = payload.hooks
  if (payload.roles) tree.roles = ensureArray(payload.roles)
  if (payload.phases) tree.phases = ensureArray(payload.phases)

  await tree.save()

  return {
    success: true,
    tree: toClientTree(tree),
  }
})
