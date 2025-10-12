import { createError, readBody } from 'h3'
import { requireAdmin } from '../../../../utils/auth'
import { DecisionFlow } from '../../../../models/DecisionFlow'
import { getFlowWithNodes } from '../../../../services/decisionFlowService'

function sanitizeStringArray(values: any): string[] | undefined {
  if (!Array.isArray(values)) return undefined
  const mapped = values
    .map((value: any) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value: string) => value.length)
  if (!mapped.length) return undefined
  return Array.from(new Set(mapped))
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const slugParam = event.context.params?.slug
  if (typeof slugParam !== 'string' || !slugParam.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Missing flow identifier' })
  }

  const slug = slugParam.trim()
  const flow = await DecisionFlow.findOne({ slug })
  if (!flow) {
    throw createError({ statusCode: 404, statusMessage: 'Decision flow not found' })
  }

  const body = await readBody<Record<string, any>>(event)

  if (typeof body.name === 'string' && body.name.trim()) {
    flow.name = body.name.trim()
  }

  if (typeof body.description === 'string') {
    flow.description = body.description.trim() || undefined
  }

  if (typeof body.schemaVersion === 'string') {
    const version = body.schemaVersion.trim()
    flow.schemaVersion = version || flow.schemaVersion
  }

  if (typeof body.startState === 'string' && body.startState.trim()) {
    flow.startState = body.startState.trim()
  }

  const endStates = sanitizeStringArray(body.endStates)
  if (endStates) {
    flow.endStates = endStates
  }

  const roles = sanitizeStringArray(body.roles)
  if (roles) {
    flow.roles = roles
  }

  const phases = sanitizeStringArray(body.phases)
  if (phases) {
    flow.phases = phases
  }

  if (typeof body.entryMode === 'string') {
    flow.entryMode = body.entryMode === 'linear' ? 'linear' : 'parallel'
  }

  if (typeof body.isMain === 'boolean') {
    flow.isMain = body.isMain
  }

  if (body.variables && typeof body.variables === 'object') {
    flow.variables = body.variables
    flow.markModified('variables')
  }

  if (body.flags && typeof body.flags === 'object') {
    flow.flags = body.flags
    flow.markModified('flags')
  }

  if (body.policies && typeof body.policies === 'object') {
    flow.policies = body.policies
    flow.markModified('policies')
  }

  if (body.hooks && typeof body.hooks === 'object') {
    flow.hooks = body.hooks
    flow.markModified('hooks')
  }

  if (body.layout && typeof body.layout === 'object') {
    const layout = flow.layout || { zoom: 1, pan: { x: 0, y: 0 }, groups: [] }
    const zoomValue = body.layout.zoom
    const zoom = typeof zoomValue === 'number' ? zoomValue : Number(zoomValue)
    if (Number.isFinite(zoom)) {
      layout.zoom = Math.min(Math.max(zoom, 0.25), 3)
    }
    if (body.layout.pan && typeof body.layout.pan === 'object') {
      const panX = body.layout.pan.x
      const panY = body.layout.pan.y
      const parsedX = typeof panX === 'number' ? panX : Number(panX)
      const parsedY = typeof panY === 'number' ? panY : Number(panY)
      if (Number.isFinite(parsedX)) layout.pan = layout.pan || { x: 0, y: 0 }
      if (Number.isFinite(parsedX)) layout.pan.x = parsedX
      if (Number.isFinite(parsedY)) layout.pan = layout.pan || { x: 0, y: 0 }
      if (Number.isFinite(parsedY)) layout.pan.y = parsedY
    }
    if (Array.isArray(body.layout.groups)) {
      layout.groups = body.layout.groups
        .map((group: any) => {
          if (!group || typeof group !== 'object') return null
          const id = typeof group.id === 'string' ? group.id.trim() : ''
          const label = typeof group.label === 'string' ? group.label.trim() : ''
          if (!id || !label) return null
          if (!group.bounds || typeof group.bounds !== 'object') return null
          const bounds = {
            x: Number(group.bounds.x) || 0,
            y: Number(group.bounds.y) || 0,
            width: Number(group.bounds.width) || 0,
            height: Number(group.bounds.height) || 0,
          }
          return {
            id,
            label,
            color: typeof group.color === 'string' ? group.color.trim() || undefined : undefined,
            bounds,
          }
        })
        .filter((group): group is NonNullable<typeof group> => Boolean(group))
    }
    flow.layout = layout
    flow.markModified('layout')
  }

  if (body.metadata && typeof body.metadata === 'object') {
    const metadata = flow.metadata || {}
    if (typeof body.metadata.notes === 'string') {
      metadata.notes = body.metadata.notes.trim() || undefined
    }
    if (Array.isArray(body.metadata.tags)) {
      metadata.tags = body.metadata.tags
        .map((tag: any) => (typeof tag === 'string' ? tag.trim() : ''))
        .filter((tag: string) => tag.length)
    }
    if (typeof body.metadata.ownerId === 'string') {
      metadata.ownerId = body.metadata.ownerId.trim() || undefined
    }
    if (typeof body.metadata.lastEditedBy === 'string') {
      metadata.lastEditedBy = body.metadata.lastEditedBy.trim() || undefined
    }
    flow.metadata = metadata
    flow.markModified('metadata')
  }

  await flow.save()

  if (flow.isMain) {
    await DecisionFlow.updateMany(
      { _id: { $ne: flow._id } },
      { $set: { isMain: false } }
    )
  }

  const data = await getFlowWithNodes(slug)
  return data
})
