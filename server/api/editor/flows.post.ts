import { readBody, createError } from 'h3'
import { requireAdmin } from '../../utils/auth'
import { DecisionFlow } from '../../models/DecisionFlow'
import { getFlowWithNodes } from '../../services/decisionFlowService'

function sanitizeSlug(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9-_]/gi, '-')
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<Record<string, any>>(event)

  const rawSlug = typeof body.slug === 'string' ? body.slug.trim() : ''
  const slug = rawSlug ? sanitizeSlug(rawSlug) : ''
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug is required' })
  }

  const rawName = typeof body.name === 'string' ? body.name.trim() : ''
  if (!rawName) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  }

  const existing = await DecisionFlow.findOne({ slug })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'A decision flow with this slug already exists' })
  }

  const startState = (typeof body.startState === 'string' ? body.startState.trim() : '') || 'START'
  const description = typeof body.description === 'string' ? body.description.trim() : undefined
  const schemaVersion = (typeof body.schemaVersion === 'string' ? body.schemaVersion.trim() : '') || '1.0'

  const roles = Array.isArray(body.roles)
    ? body.roles
        .map((role: any) => (typeof role === 'string' ? role.trim() : ''))
        .filter((role: string) => role.length)
    : ['pilot', 'atc', 'system']

  const phases = Array.isArray(body.phases)
    ? body.phases
        .map((phase: any) => (typeof phase === 'string' ? phase.trim() : ''))
        .filter((phase: string) => phase.length)
    : []

  const endStates = Array.isArray(body.endStates)
    ? body.endStates
        .map((state: any) => (typeof state === 'string' ? state.trim() : ''))
        .filter((state: string) => state.length)
    : [startState]

  const flow = new DecisionFlow({
    slug,
    name: rawName,
    description,
    schemaVersion,
    startState,
    endStates,
    variables: body.variables && typeof body.variables === 'object' ? body.variables : {},
    flags: body.flags && typeof body.flags === 'object' ? body.flags : {},
    policies: body.policies && typeof body.policies === 'object' ? body.policies : {},
    hooks: body.hooks && typeof body.hooks === 'object' ? body.hooks : {},
    roles,
    phases,
  })

  await flow.save()

  const { flow: serialized } = await getFlowWithNodes(slug)
  return serialized
})
