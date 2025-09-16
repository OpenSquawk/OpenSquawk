import { WaitlistEntry } from '../../models/WaitlistEntry'

function maskEmail(email: string) {
  const [user, domain] = email.split('@')
  if (!domain) return email
  const visible = user.slice(0, 2)
  return `${visible}${'•'.repeat(Math.max(user.length - 2, 1))}@${domain}`
}

export default defineEventHandler(async () => {
  const [count, latest] = await Promise.all([
    WaitlistEntry.countDocuments(),
    WaitlistEntry.find().sort({ joinedAt: -1 }).limit(8).lean(),
  ])

  const members = latest.map((entry) => ({
    name: entry.name || maskEmail(entry.email),
    email: maskEmail(entry.email),
    joinedAt: entry.joinedAt,
    activatedAt: entry.activatedAt ?? null,
  }))

  return {
    count,
    members,
  }
})

