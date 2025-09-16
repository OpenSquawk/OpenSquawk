import { WaitlistEntry } from '../../models/WaitlistEntry'

const DAY_MS = 1000 * 60 * 60 * 24

function computeDisplayCount(rawCount: number, now: Date) {
  const baseline = Math.max(rawCount, 26)
  const month = now.getUTCMonth()
  const dayOfMonth = now.getUTCDate()
  const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 1)
  const today = Date.UTC(now.getUTCFullYear(), month, dayOfMonth)
  const dayOfYear = Math.floor((today - startOfYear) / DAY_MS) + 1

  const irregularPulse = [0, 2, 4, 3, 6, 4, 7][dayOfYear % 7]
  const fortnightCycle = Math.floor((dayOfYear % 56) / 8)
  const monthPhaseBoost = month % 2 === 0 ? 11 : 15
  const gradualDrift = Math.floor(dayOfMonth / 5)

  const display = baseline + monthPhaseBoost + irregularPulse + fortnightCycle + gradualDrift
  return Math.max(31, display)
}

export default defineEventHandler(async () => {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS)
  const monthAgo = new Date(now.getTime() - 30 * DAY_MS)

  const [count, latestEntry, recent7Days, recent30Days] = await Promise.all([
    WaitlistEntry.countDocuments(),
    WaitlistEntry.findOne().sort({ joinedAt: -1 }).select({ joinedAt: 1 }).lean(),
    WaitlistEntry.countDocuments({ joinedAt: { $gte: weekAgo } }),
    WaitlistEntry.countDocuments({ joinedAt: { $gte: monthAgo } }),
  ])

  const displayCount = computeDisplayCount(count, now)
  const boost = Math.max(0, displayCount - count)

  return {
    count,
    displayCount,
    syntheticBoost: boost,
    recent7Days,
    recent30Days,
    lastJoinedAt: latestEntry?.joinedAt ? latestEntry.joinedAt.toISOString() : null,
    generatedAt: now.toISOString(),
  }
})

