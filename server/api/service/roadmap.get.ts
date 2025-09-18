import { RoadmapVote } from '../../models/RoadmapVote'
import { ROADMAP_ITEMS } from '../../data/roadmapItems'

const DAY_MS = 1000 * 60 * 60 * 24

export default defineEventHandler(async () => {
  const now = new Date()
  const [aggregated, recentVotes] = await Promise.all([
    RoadmapVote.aggregate<{
      _id: string
      votes: number
      averageImportance: number
      lastVoteAt: Date
    }>([
      {
        $group: {
          _id: '$itemKey',
          votes: { $sum: 1 },
          averageImportance: { $avg: '$importance' },
          lastVoteAt: { $max: '$submittedAt' },
        },
      },
    ]),
    RoadmapVote.countDocuments({ submittedAt: { $gte: new Date(now.getTime() - 7 * DAY_MS) } }),
  ])

  const stats = new Map(aggregated.map((entry) => [entry._id, entry]))

  const items = ROADMAP_ITEMS.map((item) => {
    const stat = stats.get(item.key)
    const average = stat ? Number(stat.averageImportance?.toFixed(2)) : null
    const scorePercent = average ? Math.round((average / 5) * 100) : 0
    return {
      key: item.key,
      title: item.title,
      description: item.description,
      category: item.category,
      icon: item.icon,
      votes: stat?.votes ?? 0,
      averageImportance: average,
      scorePercent,
      lastVoteAt: stat?.lastVoteAt ? stat.lastVoteAt.toISOString() : null,
    }
  }).sort((a, b) => {
    const voteDelta = (b.votes ?? 0) - (a.votes ?? 0)
    if (voteDelta !== 0) {
      return voteDelta
    }
    const avgA = a.averageImportance ?? 0
    const avgB = b.averageImportance ?? 0
    if (avgB !== avgA) {
      return avgB - avgA
    }
    return a.title.localeCompare(b.title)
  })

  const totalVotes = items.reduce((acc, item) => acc + item.votes, 0)

  return {
    items,
    totalVotes,
    recentVotes7Days: recentVotes,
    generatedAt: now.toISOString(),
  }
})
