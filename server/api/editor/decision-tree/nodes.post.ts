import { defineEventHandler, createError, readBody } from 'h3'
import { requireAdmin } from '../../../utils/auth'
import { DEFAULT_TREE_NAME, generateId, sanitizeStateInput, toClientTree, getTreeByName } from '../../../utils/decisionTree'
import type { DecisionTreeState } from '~~/types/decision-tree'

interface CreateNodeRequest {
  id?: string
  state: Partial<DecisionTreeState> & { role: DecisionTreeState['role']; phase: string }
  anchorId?: string
  position?: 'before' | 'after'
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<CreateNodeRequest | undefined>(event)
  if (!body?.state) {
    throw createError({ statusCode: 400, statusMessage: 'Missing node payload' })
  }

  const tree = await getTreeByName(DEFAULT_TREE_NAME)
  if (!tree) {
    throw createError({ statusCode: 404, statusMessage: 'Decision tree not found' })
  }

  const inputId = (body.id || '').trim()
  const anchorId = (body.anchorId || '').trim()
  const position = body.position === 'before' || body.position === 'after' ? body.position : undefined
  const nodeId = inputId || `NODE_${generateId(6).toUpperCase()}`
  if (tree.states.has(nodeId)) {
    throw createError({ statusCode: 409, statusMessage: `State ${nodeId} already exists` })
  }

  const anchorState = anchorId ? tree.states.get(anchorId) : null
  const role = body.state.role
  const phase = body.state.phase || anchorState?.phase || tree.phases?.[0] || 'Unassigned'

  const sanitized = sanitizeStateInput({ ...body.state, role, phase })
  if (!sanitized.layout) {
    if (anchorState?.layout) {
      const offset = position === 'before' ? -220 : 220
      sanitized.layout = {
        x: anchorState.layout.x ?? 0,
        y: (anchorState.layout.y ?? 0) + offset,
      }
    } else {
      const index = tree.states.size
      const col = index % 6
      const row = Math.floor(index / 6)
      sanitized.layout = { x: col * 320, y: row * 180 }
    }
  }

  tree.states.set(nodeId, sanitized)
  await tree.save()

  return {
    success: true,
    node: {
      id: nodeId,
      state: sanitized,
    },
    tree: toClientTree(tree),
  }
})
