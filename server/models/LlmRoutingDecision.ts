import mongoose from 'mongoose'

const { Schema } = mongoose

// Outcome of a single LLM routing attempt. `decided` = the model picked a valid
// candidate; `abstain` = it returned "none"; `invalid` = it returned something
// outside the candidate set; `timeout` = the request hit the time limit;
// `error` = transport/parse failure. Timeouts and errors are persisted too so
// the configured time limit can be tuned against real latency.
export type LlmRoutingStatus = 'decided' | 'abstain' | 'invalid' | 'timeout' | 'error'

export interface LlmRoutingCandidate {
  id: string
  label?: string
  kind: 'ok' | 'bad'
}

export interface LlmRoutingDecisionAttrs {
  /** Python runtime session id (no user is known backend-side yet). */
  sessionId: string
  flowSlug?: string
  stateId: string
  /** Raw STT transcript the regex layer failed to route. */
  transcript: string
  /** Rendered expected pilot phrase the model compares the transcript against. */
  expectedPhrase?: string
  candidates: LlmRoutingCandidate[]
  /** Chosen candidate id, or null when the model abstained / failed. */
  chosen: string | null
  reason?: string
  status: LlmRoutingStatus
  model: string
  /** Time budget the call was given, in ms (what to tune). */
  timeoutMs: number
  /** Wall-clock time the call actually took, in ms (incl. timeouts/errors). */
  latencyMs: number
  inputTokens?: number
  outputTokens?: number
  costUsd?: number
  createdAt: Date
}

const candidateSchema = new Schema<LlmRoutingCandidate>(
  {
    id: { type: String, required: true },
    label: { type: String },
    kind: { type: String, enum: ['ok', 'bad'], required: true },
  },
  { _id: false },
)

const llmRoutingDecisionSchema = new mongoose.Schema<LlmRoutingDecisionAttrs>({
  sessionId: { type: String, required: true, index: true },
  flowSlug: { type: String },
  stateId: { type: String, required: true },
  transcript: { type: String, required: true },
  expectedPhrase: { type: String },
  candidates: { type: [candidateSchema], default: [] },
  chosen: { type: String, default: null },
  reason: { type: String },
  status: {
    type: String,
    enum: ['decided', 'abstain', 'invalid', 'timeout', 'error'],
    required: true,
    index: true,
  },
  model: { type: String, required: true },
  timeoutMs: { type: Number, required: true },
  latencyMs: { type: Number, required: true },
  inputTokens: { type: Number },
  outputTokens: { type: Number },
  costUsd: { type: Number },
  createdAt: { type: Date, default: () => new Date(), index: true },
})

llmRoutingDecisionSchema.index({ status: 1, createdAt: -1 })

export const LlmRoutingDecision =
  (mongoose.models.LlmRoutingDecision as mongoose.Model<LlmRoutingDecisionAttrs> | undefined) ||
  mongoose.model<LlmRoutingDecisionAttrs>('LlmRoutingDecision', llmRoutingDecisionSchema)
