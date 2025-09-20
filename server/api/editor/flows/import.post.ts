import { readBody } from 'h3'
import { requireAdmin } from '../../../utils/auth'
import { importATCDecisionTree } from '../../../services/decisionImportService'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<Record<string, any> | undefined>(event)

  const { flow, importedStates } = await importATCDecisionTree({
    slug: typeof body?.slug === 'string' ? body.slug : undefined,
    name: typeof body?.name === 'string' ? body.name : undefined,
    description: typeof body?.description === 'string' ? body.description : undefined,
  })

  return {
    flow,
    importedStates,
  }
})
