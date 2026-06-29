import { defineEventHandler, getQuery } from 'h3'
import { requireAdmin } from '../../../utils/auth'
import { LlmRoutingDecision } from '../../../models/LlmRoutingDecision'

const STATUSES = ['decided', 'abstain', 'invalid', 'timeout', 'error'] as const

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const page = Math.max(parseInt(String(query.page ?? '1'), 10) || 1, 1)
  const pageSize = 20
  const skip = (page - 1) * pageSize
  const status = String(query.status ?? 'all')

  const filter: Record<string, any> = {}
  if ((STATUSES as readonly string[]).includes(status)) {
    filter.status = status
  }

  const [docs, total, statusCounts] = await Promise.all([
    LlmRoutingDecision.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec(),
    LlmRoutingDecision.countDocuments(filter),
    LlmRoutingDecision.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ])

  const counts = Object.fromEntries(statusCounts.map((s: any) => [s._id, s.count]))

  const items = docs.map((doc: any) => ({
    id: String(doc._id),
    sessionId: doc.sessionId,
    flowSlug: doc.flowSlug,
    stateId: doc.stateId,
    transcript: doc.transcript,
    expectedPhrase: doc.expectedPhrase,
    candidates: (doc.candidates || []).map((c: any) => ({ id: c.id, label: c.label, kind: c.kind })),
    chosen: doc.chosen ?? null,
    reason: doc.reason,
    status: doc.status,
    model: doc.model,
    timeoutMs: doc.timeoutMs,
    latencyMs: doc.latencyMs,
    costUsd: doc.costUsd,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  }))

  return {
    items,
    counts,
    pagination: {
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize) || 1,
    },
  }
})
