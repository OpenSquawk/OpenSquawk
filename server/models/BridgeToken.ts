import mongoose from 'mongoose'
import type { UserDocument } from './User'

export interface BridgeTokenDocument extends mongoose.Document {
  token: string
  user?: mongoose.Types.ObjectId | UserDocument
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
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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

