import { getHeader, type H3Event } from 'h3'
import mongoose from 'mongoose'
import { AppUser, type AppUserDocument } from '../models/AppUser'

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

/** Resolve the identity behind a bridge token from the app's own user store. */
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

  return await AppUser.findById(userId)
}
