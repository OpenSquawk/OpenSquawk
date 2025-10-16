import type { DecisionNodeCondition, DecisionNodeTrigger } from './decision'

export interface LLMDecisionInput {
    state_id: string
    state: any
    candidates: Array<{ id: string; state: any; flow?: string }>
    variables: Record<string, any>
    flags: Record<string, any>
    pilot_utterance: string
    flow_slug?: string
}

export type FlowActivationMode = 'main' | 'parallel' | 'linear'

export interface FlowActivationInstruction {
    slug: string
    mode?: FlowActivationMode
}

export interface ActiveNodeSummary {
    flow: string
    state: string
    role?: string
    say_tpl?: string
    controller_say_tpl?: string
}

export interface CandidateTraceEntry {
    id: string
    flow: string
    name?: string
    summary?: string
    role?: string
    triggers?: DecisionNodeTrigger[]
    conditions?: DecisionNodeCondition[]
}

export type CandidateTraceStage =
    | 'regex_candidates'
    | 'regex_filtered'
    | 'condition_filtered'
    | 'fallback_candidates'
    | 'fallback_filtered'
    | 'final'

export interface CandidateTraceEliminationContext {
    patterns?: Array<{ id?: string; pattern?: string; flags?: string }>
    transcript?: string
    condition?: {
        id?: string
        type: DecisionNodeCondition['type']
        variable?: string
        operator?: string
        value?: number | string | boolean
        pattern?: string
        patternFlags?: string
    }
    actualValue?: any
    expectedValue?: any
}

export interface CandidateTraceElimination {
    candidate: CandidateTraceEntry
    kind: 'regex' | 'condition'
    reason: string
    context?: CandidateTraceEliminationContext
}

export interface CandidateTraceStep {
    stage: CandidateTraceStage
    label: string
    candidates: CandidateTraceEntry[]
    eliminated?: CandidateTraceElimination[]
    note?: string
}

export interface DecisionCandidateTimeline {
    steps: CandidateTraceStep[]
    fallbackUsed?: boolean
    autoSelected?: CandidateTraceEntry | null
}

export interface LLMDecision {
    next_state: string
    updates?: Record<string, any>
    flags?: Record<string, any>
    controller_say_tpl?: string
    off_schema?: boolean
    radio_check?: boolean
    activate_flow?: string | FlowActivationInstruction
    resume_previous?: boolean
}

export interface LLMDecisionTraceCall {
    stage: 'readback-check' | 'decision'
    request: Record<string, any>
    response?: any
    rawResponseText?: string
    error?: string
}

export interface LLMDecisionTraceFallback {
    used: boolean
    reason?: string
    selected?: string
}

export interface LLMDecisionTrace {
    calls: LLMDecisionTraceCall[]
    fallback?: LLMDecisionTraceFallback
    candidateTimeline?: DecisionCandidateTimeline
    autoSelection?: {
        id: string
        flow: string
        reason?: string
    }
}

export interface LLMDecisionResult {
    decision: LLMDecision
    trace?: LLMDecisionTrace
    active_nodes?: ActiveNodeSummary[]
    pilot_intent?: string | null
}
