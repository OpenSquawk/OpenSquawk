import { createError, readBody } from 'h3'
import { requireAdmin } from '../../../../../../utils/auth'
import { DecisionFlow } from '../../../../../../models/DecisionFlow'
import { DecisionNode } from '../../../../../../models/DecisionNode'
import {
  sanitizeLayout,
  sanitizeLLMTemplate,
  sanitizeMetadata,
  sanitizeNodeCondition,
  sanitizeNodeTrigger,
  sanitizeTransition,
} from '../../../../../../utils/decisionSanitizer'
import { serializeNodeDocument } from '../../../../../../services/decisionFlowService'

const ROLE_SET = new Set(['pilot', 'atc', 'system'])

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const slugParam = event.context.params?.slug
  const stateParam = event.context.params?.stateId
  if (typeof slugParam !== 'string' || !slugParam.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Missing flow identifier' })
  }
  if (typeof stateParam !== 'string' || !stateParam.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Missing state identifier' })
  }

  const slug = slugParam.trim()
  const stateId = stateParam.trim().toUpperCase()

  const flow = await DecisionFlow.findOne({ slug })
  if (!flow) {
    throw createError({ statusCode: 404, statusMessage: 'Decision flow not found' })
  }

  const node = await DecisionNode.findOne({ flow: flow._id, stateId })
  if (!node) {
    throw createError({ statusCode: 404, statusMessage: 'State not found' })
  }

  const body = await readBody<Record<string, any>>(event)

  if (typeof body.title === 'string') {
    node.title = body.title.trim() || undefined
  }

  if (typeof body.summary === 'string') {
    node.summary = body.summary.trim() || undefined
  }

  if (typeof body.role === 'string') {
    const role = body.role.trim().toLowerCase()
    if (!ROLE_SET.has(role)) {
      throw createError({ statusCode: 400, statusMessage: 'role must be pilot, atc or system' })
    }
    node.role = role
  }

  if (typeof body.phase === 'string' && body.phase.trim()) {
    node.phase = body.phase.trim()
  }

  if (typeof body.sayTemplate === 'string') {
    node.sayTemplate = body.sayTemplate.trim() || undefined
  }

  if (typeof body.utteranceTemplate === 'string') {
    node.utteranceTemplate = body.utteranceTemplate.trim() || undefined
  }

  if (typeof body.elseSayTemplate === 'string') {
    node.elseSayTemplate = body.elseSayTemplate.trim() || undefined
  }

  if (Array.isArray(body.readbackRequired)) {
    node.readbackRequired = body.readbackRequired
      .map((entry: any) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter((entry: string) => entry.length)
  }

  if (typeof body.autoBehavior === 'string') {
    node.autoBehavior = body.autoBehavior.trim() || undefined
  }

  if (Array.isArray(body.actions)) {
    node.actions = body.actions
  }

  if (body.handoff && typeof body.handoff === 'object') {
    if (typeof body.handoff.to === 'string' && body.handoff.to.trim()) {
      node.handoff = {
        to: body.handoff.to.trim(),
        freq: typeof body.handoff.freq === 'string' ? body.handoff.freq.trim() || undefined : undefined,
        note: typeof body.handoff.note === 'string' ? body.handoff.note.trim() || undefined : undefined,
      }
    } else {
      node.handoff = undefined
    }
  }

  if (typeof body.guard === 'string') {
    node.guard = body.guard.trim() || undefined
  }

  if (typeof body.trigger === 'string') {
    node.trigger = body.trigger.trim() || undefined
  }

  if (typeof body.frequency === 'string') {
    node.frequency = body.frequency.trim() || undefined
  }

  if (typeof body.frequencyName === 'string') {
    node.frequencyName = body.frequencyName.trim() || undefined
  }

  if (Array.isArray(body.transitions)) {
    node.transitions = body.transitions.map((transition: any, index: number) => sanitizeTransition(transition, index))
  }

  if (Array.isArray(body.triggers)) {
    node.triggers = body.triggers.map((trigger: any, index: number) => sanitizeNodeTrigger(trigger, index))
  }

  if (Array.isArray(body.conditions)) {
    node.conditions = body.conditions.map((condition: any, index: number) => sanitizeNodeCondition(condition, index))
  }

  const layout = sanitizeLayout(body.layout)
  if (layout) {
    node.layout = layout
  }

  const metadata = sanitizeMetadata(body.metadata)
  if (metadata) {
    node.metadata = metadata
  }

  const llmTemplate = sanitizeLLMTemplate(body.llmTemplate)
  if (llmTemplate) {
    node.llmTemplate = llmTemplate
  }

  await node.save()

  return serializeNodeDocument(node)
})
