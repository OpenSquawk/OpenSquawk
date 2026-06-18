import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireAdmin } from '../../../utils/auth'
import { BugReport } from '../../../models/BugReport'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const status = body?.status
  if (status !== 'open' && status !== 'resolved') {
    throw createError({ statusCode: 400, statusMessage: 'status must be "open" or "resolved"' })
  }

  const doc = await BugReport.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true },
  ).lean() as any

  if (!doc) {
    throw createError({ statusCode: 404, statusMessage: 'Bug report not found' })
  }

  return { id: String(doc._id), status: doc.status }
})
