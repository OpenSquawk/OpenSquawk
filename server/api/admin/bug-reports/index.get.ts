import { defineEventHandler, getQuery } from 'h3'
import { requireAdmin } from '../../../utils/auth'
import { BugReport } from '../../../models/BugReport'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const page = Math.max(parseInt(String(query.page ?? '1'), 10) || 1, 1)
  const pageSize = 20
  const skip = (page - 1) * pageSize
  const status = String(query.status ?? 'open')

  const filter: Record<string, any> = {}
  if (status === 'open' || status === 'resolved') {
    filter.status = status
  }

  const [docs, total] = await Promise.all([
    BugReport.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: pageSize },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDoc',
          pipeline: [{ $project: { email: 1, name: 1, role: 1 } }],
        },
      },
      {
        $project: {
          comment: 1,
          contact: 1,
          userId: 1,
          userDoc: 1,
          status: 1,
          createdAt: 1,
          'pmState.flowSlug': 1,
          'pmState.scenarioId': 1,
          'pmState.currentStateId': 1,
          hasScreenshot: { $gt: [{ $strLenCP: { $ifNull: ['$screenshot', ''] } }, 0] },
        },
      },
    ]).exec(),
    BugReport.countDocuments(filter),
  ])

  const items = docs.map((doc: any) => ({
    id: String(doc._id),
    comment: doc.comment,
    contact: doc.contact,
    user: doc.userDoc?.[0]
      ? { id: String(doc.userDoc[0]._id), email: doc.userDoc[0].email, name: doc.userDoc[0].name }
      : undefined,
    pmState: {
      flowSlug: doc.pmState?.flowSlug,
      scenarioId: doc.pmState?.scenarioId,
      currentStateId: doc.pmState?.currentStateId,
    },
    status: doc.status,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    hasScreenshot: Boolean(doc.hasScreenshot),
  }))

  return {
    items,
    pagination: {
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize) || 1,
    },
  }
})
