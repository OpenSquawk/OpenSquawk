import { requireAdmin } from '../../../utils/auth'
import { AtcFlow } from '../../../models/AtcFlow'
import { AtcState } from '../../../models/AtcState'
import { serializeFlow } from '../../../utils/atcTree'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const flows = await AtcFlow.find({}).sort({ updatedAt: -1 }).exec()
  const stats = await AtcState.aggregate([
    { $group: { _id: '$flow', count: { $sum: 1 }, updatedAt: { $max: '$updatedAt' } } }
  ])

  const statsMap = new Map<string, { count: number; updatedAt?: Date }>()
  for (const entry of stats) {
    statsMap.set(String(entry._id), { count: entry.count, updatedAt: entry.updatedAt })
  }

  return flows.map((doc) => {
    const base = serializeFlow(doc)
    const stat = statsMap.get(base.id) || { count: 0, updatedAt: undefined }
    return {
      ...base,
      stateCount: stat.count,
      lastStateUpdate: stat.updatedAt instanceof Date ? stat.updatedAt.toISOString() : undefined
    }
  })
})
