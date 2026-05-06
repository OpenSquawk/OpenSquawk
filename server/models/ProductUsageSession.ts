import mongoose from 'mongoose'

export type ProductUsageKey = 'classroom' | 'liveatc'

export interface ProductUsageSessionDocument extends mongoose.Document {
  user?: mongoose.Types.ObjectId
  product: ProductUsageKey
  path?: string
  durationSeconds: number
  startedAt: Date
  endedAt: Date
  createdAt: Date
}

const productUsageSessionSchema = new mongoose.Schema<ProductUsageSessionDocument>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  product: { type: String, enum: ['classroom', 'liveatc'], required: true, index: true },
  path: { type: String, trim: true },
  durationSeconds: { type: Number, required: true, min: 0 },
  startedAt: { type: Date, required: true },
  endedAt: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: () => new Date() },
})

export const ProductUsageSession =
  (mongoose.models.ProductUsageSession as mongoose.Model<ProductUsageSessionDocument> | undefined) ||
  mongoose.model<ProductUsageSessionDocument>('ProductUsageSession', productUsageSessionSchema)
