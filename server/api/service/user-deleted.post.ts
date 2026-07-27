import { createError, defineEventHandler, readBody } from 'h3'
import mongoose from 'mongoose'
import { requireServiceSecret } from '../../utils/serviceAuth'
import { AppUser } from '../../models/AppUser'
import { LearnProfile } from '../../models/LearnProfile'
import { PilotProfile } from '../../models/PilotProfile'
import { BridgeToken } from '../../models/BridgeToken'
import { TransmissionLog } from '../../models/TransmissionLog'

/**
 * APP-SIDE. Receiving end of the account-deletion webhook (Phase 0.6c).
 *
 * With two independent databases, deleting a user on the website cannot reach
 * the app's data — so the website calls this. It is DSGVO-relevant: the privacy
 * policy promises deletion, and this is what makes that promise true for the
 * app's half.
 *
 * Deliberately loud. It reports what it deleted and fails with a real error if
 * it could not, so the caller can surface the failure instead of telling the
 * user their data is gone when it is not.
 */
export default defineEventHandler(async (event) => {
  requireServiceSecret(event)

  const body = await readBody(event)
  const subject = String(body?.subject || body?.userId || '').trim()

  if (!subject) {
    throw createError({ statusCode: 400, statusMessage: 'Missing subject' })
  }

  // The mirror keys on _id where the subject is an ObjectId (which it is for
  // every identity opensquawk.de issues), otherwise on ssoSubject.
  const appUser = mongoose.isValidObjectId(subject)
    ? await AppUser.findById(subject)
    : await AppUser.findOne({ ssoSubject: subject })

  // Profiles reference the identity by _id, which equals the subject. Resolve
  // it even when no mirror row exists — data can outlive the mirror, and
  // "no mirror" must not mean "nothing to delete".
  const userId = appUser?._id ?? (mongoose.isValidObjectId(subject) ? subject : null)

  if (!userId) {
    return { success: true, deleted: {}, note: 'No app-side data for this subject.' }
  }

  const [learnProfiles, pilotProfiles, bridgeTokens, transmissionLogs] = await Promise.all([
    LearnProfile.deleteMany({ user: userId }),
    PilotProfile.deleteMany({ user: userId }),
    BridgeToken.deleteMany({ user: userId }),
    TransmissionLog.deleteMany({ user: userId }),
  ])

  if (appUser) {
    await appUser.deleteOne()
  }

  const deleted = {
    appUser: appUser ? 1 : 0,
    learnProfiles: learnProfiles.deletedCount ?? 0,
    pilotProfiles: pilotProfiles.deletedCount ?? 0,
    bridgeTokens: bridgeTokens.deletedCount ?? 0,
    transmissionLogs: transmissionLogs.deletedCount ?? 0,
  }

  console.info(`[user-deleted] subject=${subject} deleted=${JSON.stringify(deleted)}`)

  return { success: true, deleted }
})
