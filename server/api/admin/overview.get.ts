import { defineEventHandler } from 'h3'
import { requireAdmin } from '../../utils/auth'
import { User } from '../../models/User'
import { InvitationCode } from '../../models/InvitationCode'
import { TransmissionLog } from '../../models/TransmissionLog'

type RecentUser = {
  id: string
  email: string
  name?: string
  role: string
  createdAt: string
  lastLoginAt?: string
}

type RecentInvitation = {
  id: string
  code: string
  channel: string
  label?: string
  createdAt: string
  expiresAt?: string
  usedAt?: string
  createdBy?: { id: string; email: string; name?: string; role: string }
  usedBy?: { id: string; email: string; name?: string; role: string }
}

type RecentTransmission = {
  id: string
  role: string
  channel: string
  direction: string
  text: string
  normalized?: string
  createdAt: string
  user?: { id: string; email: string; name?: string; role: string }
  metadata?: Record<string, any>
}

function mapUser(doc: any): RecentUser {
  return {
    id: String(doc._id),
    email: doc.email,
    name: doc.name || undefined,
    role: doc.role,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    lastLoginAt: doc.lastLoginAt ? new Date(doc.lastLoginAt).toISOString() : undefined,
  }
}

function mapInvitation(doc: any): RecentInvitation {
  return {
    id: String(doc._id),
    code: doc.code,
    channel: doc.channel,
    label: doc.label || undefined,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    expiresAt: doc.expiresAt ? new Date(doc.expiresAt).toISOString() : undefined,
    usedAt: doc.usedAt ? new Date(doc.usedAt).toISOString() : undefined,
    createdBy: doc.createdBy
      ? {
          id: String(doc.createdBy._id),
          email: doc.createdBy.email,
          name: doc.createdBy.name || undefined,
          role: doc.createdBy.role,
        }
      : undefined,
    usedBy: doc.usedBy
      ? {
          id: String(doc.usedBy._id),
          email: doc.usedBy.email,
          name: doc.usedBy.name || undefined,
          role: doc.usedBy.role,
        }
      : undefined,
  }
}

function mapTransmission(doc: any): RecentTransmission {
  return {
    id: String(doc._id),
    role: doc.role,
    channel: doc.channel,
    direction: doc.direction,
    text: doc.text,
    normalized: doc.normalized || undefined,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    user: doc.user
      ? {
          id: String(doc.user._id),
          email: doc.user.email,
          name: doc.user.name || undefined,
          role: doc.user.role,
        }
      : undefined,
    metadata: doc.metadata || undefined,
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const now = new Date()
  const dayAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24)
  const weekAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7)
  const weekAhead = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7)

  const [
    totalUsers,
    adminCount,
    devCount,
    newUsersLastWeek,
    totalInvitations,
    activeInvitations,
    expiringInvitations,
    transmissionsTotal,
    transmissionsLast24h,
    transmissionsByChannelRaw,
    transmissionsByRoleRaw,
    recentUsersDocs,
    recentInvitationsDocs,
    recentTransmissionsDocs,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'dev' }),
    User.countDocuments({ createdAt: { $gte: weekAgo } }),
    InvitationCode.countDocuments(),
    InvitationCode.countDocuments({
      usedBy: { $exists: false },
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gte: now } }],
    }),
    InvitationCode.countDocuments({
      usedBy: { $exists: false },
      expiresAt: { $gte: now, $lte: weekAhead },
    }),
    TransmissionLog.countDocuments(),
    TransmissionLog.countDocuments({ createdAt: { $gte: dayAgo } }),
    TransmissionLog.aggregate([{ $group: { _id: '$channel', count: { $sum: 1 } } }]),
    TransmissionLog.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    User.find().sort({ createdAt: -1 }).limit(5),
    InvitationCode.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'email name role')
      .populate('usedBy', 'email name role'),
    TransmissionLog.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'email name role'),
  ])

  const transmissionsByChannel = transmissionsByChannelRaw.reduce(
    (acc: Record<string, number>, item: any) => {
      acc[item._id || 'unknown'] = item.count
      return acc
    },
    {} as Record<string, number>,
  )

  const transmissionsByRole = transmissionsByRoleRaw.reduce(
    (acc: Record<string, number>, item: any) => {
      acc[item._id || 'unknown'] = item.count
      return acc
    },
    {} as Record<string, number>,
  )

  return {
    generatedAt: now.toISOString(),
    users: {
      total: totalUsers,
      admins: adminCount,
      devs: devCount,
      newLast7Days: newUsersLastWeek,
      recent: recentUsersDocs.map(mapUser),
    },
    invitations: {
      total: totalInvitations,
      active: activeInvitations,
      expiringSoon: expiringInvitations,
      recent: recentInvitationsDocs.map(mapInvitation),
    },
    transmissions: {
      total: transmissionsTotal,
      last24h: transmissionsLast24h,
      byChannel: transmissionsByChannel,
      byRole: transmissionsByRole,
      recent: recentTransmissionsDocs.map(mapTransmission),
    },
  }
})
