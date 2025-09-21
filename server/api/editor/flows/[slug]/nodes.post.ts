import { createError, readBody } from 'h3'
import { requireAdmin } from '../../../../utils/auth'
import { DecisionFlow } from '../../../../models/DecisionFlow'
import { DecisionNode } from '../../../../models/DecisionNode'
import {
  sanitizeLayout,
  sanitizeLLMTemplate,
  sanitizeMetadata,
  sanitizeNodeCondition,
  sanitizeNodeTrigger,
  sanitizeTransition,
} from '../../../../utils/decisionSanitizer'
import { serializeNodeDocument } from '../../../../services/decisionFlowService'

const ROLE_SET = new Set(['pilot', 'atc', 'system'])

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
  const rawStateId = typeof body.stateId === 'string' ? body.stateId.trim() : ''
  if (!rawStateId) {
    throw createError({ statusCode: 400, statusMessage: 'stateId is required' })
  }

  const stateId = rawStateId.toUpperCase()
  const existingNode = await DecisionNode.findOne({ flow: flow._id, stateId })
  if (existingNode) {
    throw createError({ statusCode: 409, statusMessage: 'State already exists in this flow' })
  }

  const role = typeof body.role === 'string' ? body.role.trim().toLowerCase() : ''
  if (!ROLE_SET.has(role)) {
    throw createError({ statusCode: 400, statusMessage: 'role must be pilot, atc or system' })
  }

  const phase = typeof body.phase === 'string' ? body.phase.trim() : ''
  if (!phase) {
    throw createError({ statusCode: 400, statusMessage: 'phase is required' })
  }

  const transitions = Array.isArray(body.transitions)
    ? body.transitions.map((transition: any, index: number) => sanitizeTransition(transition, index))
    : []

  const triggers = Array.isArray(body.triggers)
    ? body.triggers.map((trigger: any, index: number) => sanitizeNodeTrigger(trigger, index))
    : []

  const conditions = Array.isArray(body.conditions)
    ? body.conditions.map((condition: any, index: number) => sanitizeNodeCondition(condition, index))
    : []

  const layout = sanitizeLayout(body.layout) || { x: 0, y: 0 }
  const metadata = sanitizeMetadata(body.metadata)
  const llmTemplate = sanitizeLLMTemplate(body.llmTemplate)

  const readbackRequired = Array.isArray(body.readbackRequired)
    ? body.readbackRequired
        .map((entry: any) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter((entry: string) => entry.length)
    : []

  const node = new DecisionNode({
    flow: flow._id,
    stateId,
    title: typeof body.title === 'string' ? body.title.trim() || undefined : undefined,
    summary: typeof body.summary === 'string' ? body.summary.trim() || undefined : undefined,
    role,
    phase,
    sayTemplate: typeof body.sayTemplate === 'string' ? body.sayTemplate.trim() || undefined : undefined,
    utteranceTemplate:
      typeof body.utteranceTemplate === 'string' ? body.utteranceTemplate.trim() || undefined : undefined,
    elseSayTemplate:
      typeof body.elseSayTemplate === 'string' ? body.elseSayTemplate.trim() || undefined : undefined,
    readbackRequired,
    autoBehavior: typeof body.autoBehavior === 'string' ? body.autoBehavior.trim() || undefined : undefined,
    actions: Array.isArray(body.actions) ? body.actions : [],
    handoff:
      body.handoff && typeof body.handoff === 'object' && typeof body.handoff.to === 'string'
        ? {
            to: body.handoff.to.trim(),
            freq: typeof body.handoff.freq === 'string' ? body.handoff.freq.trim() || undefined : undefined,
            note: typeof body.handoff.note === 'string' ? body.handoff.note.trim() || undefined : undefined,
          }
        : undefined,
    guard: typeof body.guard === 'string' ? body.guard.trim() || undefined : undefined,
    trigger: typeof body.trigger === 'string' ? body.trigger.trim() || undefined : undefined,
    frequency: typeof body.frequency === 'string' ? body.frequency.trim() || undefined : undefined,
    frequencyName:
      typeof body.frequencyName === 'string' ? body.frequencyName.trim() || undefined : undefined,
    triggers,
    conditions,
    transitions,
    layout,
    metadata,
    llmTemplate,
  })

  await node.save()

  return serializeNodeDocument(node)
})
