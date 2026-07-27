import mongoose from 'mongoose'
import type { AppUserDocument } from './AppUser'

export interface BridgeTokenDocument extends mongoose.Document {
  token: string
  user?: mongoose.Types.ObjectId | AppUserDocument
  connectedAt?: Date
  lastStatusAt?: Date
  simConnected: boolean
  flightActive: boolean
  createdAt: Date
  updatedAt: Date
}

const bridgeTokenSchema = new mongoose.Schema<BridgeTokenDocument>(
  {
    token: { type: String, required: true, unique: true, index: true },
    // The app's own mirror, not the website's User collection — AppUser._id is
    // the same ObjectId, so existing tokens keep resolving.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'AppUser' },
    connectedAt: { type: Date },
    lastStatusAt: { type: Date },
    simConnected: { type: Boolean, default: false },
    flightActive: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

export const BridgeToken =
  (mongoose.models.BridgeToken as mongoose.Model<BridgeTokenDocument> | undefined) ||
  mongoose.model<BridgeTokenDocument>('BridgeToken', bridgeTokenSchema)

