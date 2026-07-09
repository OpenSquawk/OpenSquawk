import mongoose from 'mongoose'
import type {
  FeatureWish, HardwareItem, NetworkExperience, OperatingSystem, PricingPreference,
  RadioPainPoint, Simulator, ToolkitDuration, ToolkitItem,
} from '~~/shared/onboarding/config'

export interface PilotProfileDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId
  simulator?: Simulator
  os?: OperatingSystem
  hardware: HardwareItem[]
  radioConfidence?: number
  radioPainPoint?: RadioPainPoint
  networkExperience: NetworkExperience[]
  toolkit: ToolkitItem[]
  toolkitDuration: Partial<Record<ToolkitItem, ToolkitDuration>>
  topFeatures: FeatureWish[]
  pricingPreference?: PricingPreference
  resultCallsign?: string
  completedAt?: Date
  skippedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const pilotProfileSchema = new mongoose.Schema<PilotProfileDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    simulator: { type: String },
    os: { type: String },
    hardware: { type: [String], default: () => [] },
    radioConfidence: { type: Number, min: 1, max: 5 },
    radioPainPoint: { type: String },
    networkExperience: { type: [String], default: () => [] },
    toolkit: { type: [String], default: () => [] },
    toolkitDuration: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    topFeatures: { type: [String], default: () => [] },
    pricingPreference: { type: String },
    resultCallsign: { type: String, trim: true },
    completedAt: { type: Date },
    skippedAt: { type: Date },
  },
  { timestamps: true },
)

export const PilotProfile =
  (mongoose.models.PilotProfile as mongoose.Model<PilotProfileDocument> | undefined) ||
  mongoose.model<PilotProfileDocument>('PilotProfile', pilotProfileSchema)
