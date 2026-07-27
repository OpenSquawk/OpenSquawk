import { getHeader, type H3Event } from 'h3'
import mongoose from 'mongoose'
import { AppUser, type AppUserDocument } from '../models/AppUser'
import { mirrorAppUser } from './authMode'

export function normalizeBridgeToken(input: unknown) {
  if (typeof input !== 'string') {
    return null
  }
  const token = input.trim()
  if (!token) {
    return null
  }
  if (token.length < 6 || token.length > 256) {
    return null
  }
  return token
}

export function getBridgeTokenFromHeader(event: H3Event) {
  return normalizeBridgeToken(getHeader(event, 'x-bridge-token'))
}

/**
 * The identity behind a bridge token, from the app's own mirror.
 *
 * Bridge endpoints are called by the desktop app with only a token, so there is
 * no session to resolve and no chance to refresh the mirror first. A token
 * paired before the mirror existed would otherwise report "not connected" and
 * push the user through pairing again, so a missing mirror row is backfilled
 * from the website's User here rather than treated as "unknown user".
 *
 * PHASE 1 (app repo): drop the backfill — by then every token predates nothing
 * and there is no User collection to read.
 */
export async function resolveBridgeUser(
  user: unknown,
): Promise<AppUserDocument | null> {
  if (!user) return null

  // Already populated by the caller's .populate('user', ...).
  if (typeof user === 'object' && 'email' in (user as Record<string, unknown>)) {
    return user as AppUserDocument
  }

  const userId = String((user as { _id?: unknown })?._id ?? user)
  if (!mongoose.isValidObjectId(userId)) return null

  const mirrored = await AppUser.findById(userId)
  if (mirrored) return mirrored

  const { User } = await import('../models/User')
  const websiteUser = await User.findById(userId)
  if (!websiteUser) return null

  return await mirrorAppUser({
    subject: String(websiteUser._id),
    email: websiteUser.email,
    name: websiteUser.name,
    role: websiteUser.role,
  }, { force: true })
}
