import { defineEventHandler } from 'h3'
import { requireAdmin } from '../../../utils/auth'
import atcDecisionTree from '~~/shared/data/atcDecisionTree'
import { AtcDecisionTree } from '../../../models/AtcDecisionTree'
import type { DecisionTreeRecord, DecisionTreeState } from '~~/types/decision-tree'
import {
  DEFAULT_TREE_NAME,
  sanitizeStateInput,
  toClientTree,
} from '../../../utils/decisionTree'

function buildInitialLayout(index: number) {
  const col = index % 6
  const row = Math.floor(index / 6)
  return {
    x: col * 320,
    y: row * 180,
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const payload = atcDecisionTree as DecisionTreeRecord
  const treeName = payload?.name || DEFAULT_TREE_NAME

  let tree = await AtcDecisionTree.findOne({ name: treeName })
  if (!tree) {
    tree = new AtcDecisionTree({
      name: treeName,
      schema_version: payload.schema_version,
      description: payload.description,
      start_state: payload.start_state,
      end_states: payload.end_states,
      variables: payload.variables,
      flags: payload.flags,
      policies: payload.policies,
      hooks: payload.hooks,
      roles: payload.roles,
      phases: payload.phases,
    })
  } else {
    tree.schema_version = payload.schema_version
    tree.description = payload.description
    tree.start_state = payload.start_state
    tree.end_states = payload.end_states
    tree.variables = payload.variables
    tree.flags = payload.flags
    tree.policies = payload.policies
    tree.hooks = payload.hooks
    tree.roles = payload.roles
    tree.phases = payload.phases
  }

  const statesEntries = Object.entries(payload.states || {})
  const newStates = new Map<string, DecisionTreeState>()

  statesEntries.forEach(([id, state], index) => {
    const sanitized = sanitizeStateInput({
      ...state,
      role: state.role,
      phase: state.phase,
      layout: state.layout || buildInitialLayout(index),
    })
    newStates.set(id, sanitized)
  })

  tree.states = newStates

  await tree.save()

  return {
    success: true,
    tree: toClientTree(tree),
  }
})
