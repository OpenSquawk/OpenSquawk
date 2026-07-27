import mongoose from 'mongoose'
import { AppUser, type AppUserDocument, type AppUserRole } from '../models/AppUser'

export type AuthMode = 'open' | 'sso'

/**
 * How this deployment obtains an identity.
 *
 * - `open` — self-hosted, no login at all. Every request is the one local user.
 * - `sso`  — identity is handed over from the issuer (opensquawk.de) via a
 *            one-time code; the app then mints and verifies its own session.
 *
 * There is deliberately no third mode: the app never owns passwords, invites or
 * password resets. Entitlement/feature-gating must NOT be mixed in here —
 * AUTH_MODE is an *identity* concept (see Phase 5.2 of the split plan).
 */

// The single local identity used in AUTH_MODE=open. Fixed so that profiles,
// bridge tokens and progress survive restarts. Distinct from DEV_BYPASS_USER_ID
// in server/utils/auth.ts, which is a separate local-dev-only bypass.
export const LOCAL_USER_ID = '000000000000000000000010'
export const LOCAL_USER_SUBJECT = 'local'
const LOCAL_USER_EMAIL = 'local@opensquawk.invalid'
const LOCAL_USER_NAME = 'Local User'

export function getAuthMode(): AuthMode {
  // PHASE 1 (app repo): flip this default to 'open' and delete the note below.
  //
  // The default is 'sso' for as long as the website surface (/api/admin/**,
  // /api/editor/**, invitations, waitlist) still lives in this repo. Defaulting
  // to 'open' here would mean that any deployment which simply forgets to set
  // AUTH_MODE serves those endpoints to everyone as the local admin user.
  // In the app repo that surface is gone and 'open' is the correct default.
  const raw = (process.env.AUTH_MODE || 'sso').trim().toLowerCase()
  return raw === 'open' ? 'open' : 'sso'
}

export function isOpenAuthMode() {
  return getAuthMode() === 'open'
}

/**
 * Where an unauthenticated user is sent in AUTH_MODE=sso. Empty in `open`.
 */
export function getAuthIssuer(): string {
  return (process.env.NUXT_PUBLIC_AUTH_ISSUER || '').trim().replace(/\/+$/, '')
}

let localUserPromise: Promise<AppUserDocument> | null = null

/**
 * The one identity of an AUTH_MODE=open instance. Persisted (rather than kept
 * in memory) because BridgeToken/LearnProfile/PilotProfile reference it.
 */
export function getLocalAppUser(): Promise<AppUserDocument> {
  if (!localUserPromise) {
    localUserPromise = AppUser.findOneAndUpdate(
      { _id: LOCAL_USER_ID },
      {
        // _id is seeded from the filter's equality condition on insert.
        $setOnInsert: {
          ssoSubject: LOCAL_USER_SUBJECT,
          email: LOCAL_USER_EMAIL,
          name: LOCAL_USER_NAME,
          role: 'admin',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec().catch((err) => {
      // Never cache a failed lookup — a transient DB outage must not disable
      // the instance for the rest of the process lifetime.
      localUserPromise = null
      throw err
    }) as Promise<AppUserDocument>
  }
  return localUserPromise
}

// Re-upserting the mirror on every single request would add a write to every
// authenticated call. Subjects seen recently are skipped.
const MIRROR_TTL_MS = 5 * 60 * 1000
const mirroredAt = new Map<string, number>()

export interface MirrorInput {
  subject: string
  email: string
  name?: string
  role?: AppUserRole
}

/**
 * Write/refresh the local mirror of an SSO identity.
 *
 * When the subject is a valid ObjectId — which it is for every identity issued
 * by opensquawk.de, where the subject *is* `User._id` — it is reused verbatim
 * as the mirror's `_id`, so pre-existing `LearnProfile.user` / `PilotProfile.user`
 * / `BridgeToken.user` references keep resolving without a migration
 * (see server/models/AppUser.ts). A non-ObjectId subject from some future
 * issuer simply gets a generated `_id` and is matched on `ssoSubject`.
 */
export async function mirrorAppUser(input: MirrorInput, options: { force?: boolean } = {}) {
  const subject = String(input.subject || '').trim()
  if (!subject) return null

  const last = mirroredAt.get(subject)
  if (!options.force && last && Date.now() - last < MIRROR_TTL_MS) {
    return null
  }

  const update: Record<string, unknown> = {
    ssoSubject: subject,
    email: input.email,
    role: input.role || 'user',
  }
  if (input.name !== undefined) update.name = input.name

  // On insert, MongoDB seeds the document from the filter's equality
  // conditions — so matching on _id is what carries the subject into _id.
  const filter = mongoose.isValidObjectId(subject) ? { _id: subject } : { ssoSubject: subject }

  const doc = await AppUser.findOneAndUpdate(
    filter,
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec()

  mirroredAt.set(subject, Date.now())
  return doc
}

/** Test seam — the mirror cache is process-local and otherwise unreachable. */
export function resetAuthModeCaches() {
  localUserPromise = null
  mirroredAt.clear()
}
