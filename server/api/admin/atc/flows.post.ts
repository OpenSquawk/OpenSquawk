import { readBody, createError } from 'h3'
import { requireAdmin } from '../../../utils/auth'
import { AtcFlow } from '../../../models/AtcFlow'
import { serializeFlow } from '../../../utils/atcTree'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<Record<string, any>>(event)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const startState = typeof body?.startState === 'string' ? body.startState.trim() : ''

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'name is required' })
  }

  if (!startState) {
    throw createError({ statusCode: 400, statusMessage: 'startState is required' })
  }

  const schemaVersion = typeof body?.schemaVersion === 'string' ? body.schemaVersion.trim() : '1.0'

  const flow = await AtcFlow.create({
    name,
    schemaVersion,
    description: typeof body?.description === 'string' ? body.description.trim() : undefined,
    startState,
    endStates: Array.isArray(body?.endStates) ? body.endStates.filter(Boolean) : [],
    variables: body?.variables && typeof body.variables === 'object' ? body.variables : {},
    flags: body?.flags && typeof body.flags === 'object' ? body.flags : {},
    policies: body?.policies && typeof body.policies === 'object' ? body.policies : {},
    hooks: body?.hooks && typeof body.hooks === 'object' ? body.hooks : {},
    roles: Array.isArray(body?.roles) ? body.roles.filter(Boolean) : ['pilot', 'atc', 'system'],
    phases: Array.isArray(body?.phases) ? body.phases.filter(Boolean) : []
  })

  return serializeFlow(flow)
})
