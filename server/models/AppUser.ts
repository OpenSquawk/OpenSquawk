import mongoose from 'mongoose'

export type AppUserRole = 'user' | 'admin' | 'dev'

/**
 * The app's own view of an identity.
 *
 * The app never reads the website's `User` collection — that collection lives
 * in the website's database and is unreachable once the repos are split. What
 * the app keeps instead is this mirror, written when an identity arrives
 * (SSO exchange) or, in AUTH_MODE=open, as a single fixed local row.
 *
 * `_id` is deliberately the ObjectId of the SSO subject (i.e. the website's
 * `User._id`). Every existing `LearnProfile.user`, `PilotProfile.user` and
 * `BridgeToken.user` reference therefore stays valid without a data migration,
 * and app-side queries keep working unchanged. `ssoSubject` is kept as its own
 * field because the delete webhook addresses users by subject, not by _id.
 */
export interface AppUserDocument extends mongoose.Document {
  ssoSubject: string
  email: string
  name?: string
  role: AppUserRole
  createdAt: Date
  updatedAt: Date
}

const appUserSchema = new mongoose.Schema<AppUserDocument>(
  {
    ssoSubject: { type: String, required: true, unique: true, index: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, trim: true },
    role: { type: String, enum: ['user', 'admin', 'dev'], default: 'user' },
  },
  {
    timestamps: true,
  },
)

export const AppUser =
  (mongoose.models.AppUser as mongoose.Model<AppUserDocument> | undefined) ||
  mongoose.model<AppUserDocument>('AppUser', appUserSchema)
