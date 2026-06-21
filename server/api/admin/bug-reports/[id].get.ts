import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireAdmin } from '../../../utils/auth'
import { BugReport } from '../../../models/BugReport'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  const doc = await BugReport.findById(id).populate('userId', 'email name role').lean() as any

  if (!doc) {
    throw createError({ statusCode: 404, statusMessage: 'Bug report not found' })
  }

  return {
    id: String(doc._id),
    comment: doc.comment,
    contact: doc.contact,
    user: doc.userId
      ? { id: String((doc.userId as any)._id), email: (doc.userId as any).email, name: (doc.userId as any).name }
      : undefined,
    screenshot: doc.screenshot || null,
    pmState: doc.pmState || null,
    status: doc.status,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  }
})
