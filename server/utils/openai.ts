// server/utils/openai.ts
import OpenAI from 'openai'
import {spellIcaoDigits, toIcaoPhonetic} from '../../shared/utils/radioSpeech'
import type {
    LLMDecision,
    LLMDecisionInput,
    LLMDecisionCandidateInput,
    LLMDecisionFlowStatus,
} from '../../shared/types/llm'
import type { DecisionNodeTrigger, DecisionNodeCondition } from '../../shared/types/decision'
import {getServerRuntimeConfig} from './runtimeConfig'

let openaiClient: OpenAI | null = null
let cachedModel: string | null = null

import https from 'node:https'

const httpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 50,        // bei Bedarf anpassen
    maxFreeSockets: 10,
    timeout: 0             // keine Socket-Idle-Timeouts durch Node
})

function ensureOpenAI(): OpenAI {
    if (!openaiClient) {
        const {openaiKey, openaiProject, llmModel} = getServerRuntimeConfig()
        if (!openaiKey) {
            throw new Error('OPENAI_API_KEY is missing. Please set the key before using AI features.')
        }
        const clientOptions: ConstructorParameters<typeof OpenAI>[0] = {apiKey: openaiKey,
            defaultHeaders: { 'Connection': 'keep-alive' },
            defaultHttpAgent: httpsAgent
        }
        if (openaiProject) {
            clientOptions.project = openaiProject
        }
        console.log("using connection opened client")
        openaiClient = new OpenAI(clientOptions)
        cachedModel = llmModel
    }
    console.log("returning existing openai client")
    return openaiClient
}

function getModel(): string {
    if (!cachedModel) {
        const {llmModel} = getServerRuntimeConfig()
        cachedModel = llmModel
    }
    return cachedModel
}

export function getOpenAIClient(): OpenAI {
    return ensureOpenAI()
}

export async function decide(system: string, user: string): Promise<string> {
    const client = ensureOpenAI()
    const model = getModel()
    const r = await client.chat.completions.create({
        model,
        messages: [
            {role: 'system', content: system},
            {role: 'user', content: user}
        ]
    })
    return r.choices?.[0]?.message?.content?.trim() || ''
}

export interface LLMDecisionTraceCall {
    stage: 'readback-check' | 'decision'
    request: Record<string, any>
    response?: any
    rawResponseText?: string
    error?: string
}

export interface LLMDecisionTrace {
    calls: LLMDecisionTraceCall[]
    fallback?: {
        used: boolean
        reason?: string
        selected?: string
    }
}

export interface LLMDecisionResult {
    decision: LLMDecision
    trace?: LLMDecisionTrace
}

type ReadbackStatus = 'ok' | 'missing' | 'incorrect' | 'uncertain'

const READBACK_REQUIREMENTS: Record<string, string[]> = {
    CD_READBACK_CHECK: ['dest', 'sid', 'runway', 'initial_altitude_ft', 'squawk'],
    GRD_TAXI_READBACK_CHECK: ['runway', 'taxi_route', 'hold_short'],
    TWR_TAKEOFF_READBACK_CHECK: ['runway', 'cleared_takeoff'],
    GRD_TAXI_IN_READBACK_CHECK: ['gate', 'taxi_route']
}

const READBACK_JSON_SCHEMA = {
    name: 'readback_check',
    schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
            status: {
                type: 'string',
                enum: ['ok', 'missing', 'incorrect', 'uncertain']
            },
            missing: {
                type: 'array',
                items: {type: 'string'},
                default: []
            },
            incorrect: {
                type: 'array',
                items: {type: 'string'},
                default: []
            },
            confidence: {
                type: 'number'
            },
            notes: {
                type: 'string'
            }
        },
        required: ['status']
    }
} as const

function sanitizeForQuickMatch(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function buildSpokenVariants(key: string, value: string): string[] {
    const normalized = String(value ?? '').trim()
    if (!normalized) return []

    const variants = new Set<string>()
    variants.add(normalized)
    variants.add(normalized.toUpperCase())

    if (key === 'hold_short') {
        const base = normalized.replace(/^holding\s+short/i, 'hold short')
        variants.add(base)
        if (!/\brunway\b/i.test(base)) {
            variants.add(base.replace(/^(hold short)/i, '$1 runway'))
        }
    }

    if (key === 'cleared_takeoff') {
        variants.add(normalized.replace(/take-off/gi, 'takeoff'))
        variants.add(normalized.replace(/take-off/gi, 'take off'))
    }

    if (/^[A-Z]{3,4}$/.test(normalized.toUpperCase())) {
        variants.add(toIcaoPhonetic(normalized))
    }

    if (/^\d{4}$/.test(normalized)) {
        variants.add(normalized.split('').join(' '))
        variants.add(spellIcaoDigits(normalized))
    }

    if (/^\d{1,2}[LCR]?$/i.test(normalized)) {
        const digits = normalized.match(/\d+/)?.[0] ?? ''
        const spelledDigits = spellIcaoDigits(digits)
        const suffix = normalized.replace(/\d+/g, '').toUpperCase()
        const suffixWord = suffix === 'L' ? 'left' : suffix === 'R' ? 'right' : suffix === 'C' ? 'center' : ''

        variants.add(`runway ${normalized}`)
        if (spelledDigits) {
            variants.add(`runway ${spelledDigits}${suffixWord ? ` ${suffixWord}` : ''}`)
        }
    }

    if (key.includes('altitude') || key.includes('level')) {
        const digits = normalized.replace(/[^0-9]/g, '')
        if (digits) {
            const spaced = digits.split('').join(' ')
            variants.add(spaced)
            variants.add(digits)
            variants.add(spellIcaoDigits(digits))
        }
    }

    return Array.from(variants)
}

function pickTransition(
    transitions: Array<{ to: string }> | undefined,
    candidates: Array<{ id: string; state: any }>
): string | null {
    if (!transitions?.length) return null
    for (const option of transitions) {
        if (candidates.some(c => c.id === option.to)) {
            return option.to
        }
    }
    return null
}

function fallbackNextState(input: LLMDecisionInput): string {
    return input.candidates[0]?.id || input.state_id || 'GEN_NO_REPLY'
}

interface CandidateEvaluationContext {
    variables: Record<string, any>
    flags: Record<string, any>
    telemetry: Record<string, any>
    pilotUtterance: string
    lastAtcOutput: string
    flowStatus: Map<string, LLMDecisionFlowStatus>
}

interface CandidateEvaluation {
    candidate: LLMDecisionCandidateInput
    autoTriggers: DecisionNodeTrigger[]
    regexTriggers: DecisionNodeTrigger[]
    noneTriggers: DecisionNodeTrigger[]
    implicitNone: boolean
}

function createFlowStatusMap(flows?: LLMDecisionFlowStatus[] | null): Map<string, LLMDecisionFlowStatus> {
    const map = new Map<string, LLMDecisionFlowStatus>()
    if (!Array.isArray(flows)) {
        return map
    }
    for (const entry of flows) {
        if (entry && typeof entry.slug === 'string') {
            map.set(entry.slug, entry)
        }
    }
    return map
}

function resolveContextValue(path: string | undefined, context: CandidateEvaluationContext): any {
    if (!path || typeof path !== 'string') {
        return undefined
    }
    const segments = path.split('.').map((segment) => segment.trim()).filter(Boolean)
    if (!segments.length) {
        return undefined
    }

    let sourceName = segments[0]
    let current: any

    if (sourceName === 'variables') {
        current = context.variables
        segments.shift()
    } else if (sourceName === 'flags') {
        current = context.flags
        segments.shift()
    } else if (sourceName === 'telemetry') {
        current = context.telemetry
        segments.shift()
    } else {
        current = context.variables
    }

    for (const segment of segments) {
        if (current == null) {
            return undefined
        }
        current = current[segment]
    }
    return current
}

function parseComparisonValue(raw: any): any {
    if (typeof raw === 'number' || typeof raw === 'boolean') {
        return raw
    }
    if (typeof raw !== 'string') {
        return raw
    }
    const trimmed = raw.trim()
    if (!trimmed.length) {
        return trimmed
    }
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith('\'') && trimmed.endsWith('\''))) {
        return trimmed.slice(1, -1)
    }
    const numeric = Number(trimmed)
    if (!Number.isNaN(numeric)) {
        return numeric
    }
    if (trimmed.toLowerCase() === 'true') {
        return true
    }
    if (trimmed.toLowerCase() === 'false') {
        return false
    }
    return trimmed
}

function normalizeComparable(value: any): any {
    if (typeof value === 'number' || typeof value === 'boolean') {
        return value
    }
    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed.length) {
            return ''
        }
        const numeric = Number(trimmed)
        if (!Number.isNaN(numeric)) {
            return numeric
        }
        const lower = trimmed.toLowerCase()
        if (lower === 'true') return true
        if (lower === 'false') return false
        return lower
    }
    return value
}

function evaluateComparison(left: any, operator: string, right: any): boolean {
    const normalizedLeft = normalizeComparable(left)
    const normalizedRight = normalizeComparable(parseComparisonValue(right))
    switch (operator) {
        case '>':
            return typeof normalizedLeft === 'number' && typeof normalizedRight === 'number'
                ? normalizedLeft > normalizedRight
                : false
        case '>=':
            return typeof normalizedLeft === 'number' && typeof normalizedRight === 'number'
                ? normalizedLeft >= normalizedRight
                : false
        case '<':
            return typeof normalizedLeft === 'number' && typeof normalizedRight === 'number'
                ? normalizedLeft < normalizedRight
                : false
        case '<=':
            return typeof normalizedLeft === 'number' && typeof normalizedRight === 'number'
                ? normalizedLeft <= normalizedRight
                : false
        case '!==':
        case '!=':
            return normalizedLeft !== normalizedRight
        case '===':
        case '==':
        default:
            return normalizedLeft === normalizedRight
    }
}

function createRegExp(pattern: string | undefined, flags: string | undefined): RegExp | null {
    if (!pattern || typeof pattern !== 'string') {
        return null
    }
    try {
        const sanitizedFlags = typeof flags === 'string' ? flags : 'i'
        return new RegExp(pattern, sanitizedFlags)
    } catch (err) {
        console.warn('Invalid regex trigger pattern:', err)
        return null
    }
}

function evaluateRegexTrigger(trigger: DecisionNodeTrigger, context: CandidateEvaluationContext): boolean {
    if (!trigger.pattern) {
        return false
    }
    const regex = createRegExp(trigger.pattern, trigger.patternFlags)
    if (!regex) {
        return false
    }
    return regex.test(context.pilotUtterance)
}

function evaluateAutoVariableTrigger(trigger: DecisionNodeTrigger, context: CandidateEvaluationContext): boolean {
    const value = resolveContextValue(trigger.variable, context)
    const operator = typeof trigger.operator === 'string' ? trigger.operator : '=='
    return evaluateComparison(value, operator, trigger.value)
}

function evaluateAutoTimeTrigger(trigger: DecisionNodeTrigger, candidate: LLMDecisionCandidateInput, context: CandidateEvaluationContext): boolean {
    const flowInfo = context.flowStatus.get(candidate.flow)
    if (!flowInfo) {
        return false
    }
    const elapsedMs = typeof flowInfo.state_elapsed_ms === 'number' ? flowInfo.state_elapsed_ms : 0
    const delaySeconds = typeof trigger.delaySeconds === 'number'
        ? trigger.delaySeconds
        : Number(trigger.delaySeconds)
    const delayMs = Number.isFinite(delaySeconds) ? delaySeconds * 1000 : 0
    if (delayMs <= 0) {
        return true
    }
    return elapsedMs >= delayMs
}

function evaluateCandidateTriggers(
    candidate: LLMDecisionCandidateInput,
    context: CandidateEvaluationContext,
): CandidateEvaluation {
    const result: CandidateEvaluation = {
        candidate,
        autoTriggers: [],
        regexTriggers: [],
        noneTriggers: [],
        implicitNone: false,
    }

    const triggers = Array.isArray(candidate.state?.triggers)
        ? candidate.state.triggers.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : []

    if (!triggers.length) {
        result.implicitNone = true
        return result
    }

    for (const trigger of triggers) {
        if (!trigger || typeof trigger !== 'object') {
            continue
        }
        switch (trigger.type) {
            case 'regex':
                if (evaluateRegexTrigger(trigger, context)) {
                    result.regexTriggers.push(trigger)
                }
                break
            case 'auto_variable':
                if (evaluateAutoVariableTrigger(trigger, context)) {
                    result.autoTriggers.push(trigger)
                }
                break
            case 'auto_time':
                if (evaluateAutoTimeTrigger(trigger, candidate, context)) {
                    result.autoTriggers.push(trigger)
                }
                break
            case 'none':
            default:
                result.noneTriggers.push(trigger)
                break
        }
    }

    if (!result.noneTriggers.length && !result.autoTriggers.length && !result.regexTriggers.length) {
        result.implicitNone = true
    }

    return result
}

function evaluateCandidateCondition(condition: DecisionNodeCondition, context: CandidateEvaluationContext): boolean {
    if (!condition || typeof condition !== 'object') {
        return true
    }
    if (condition.type === 'variable_value') {
        const operator = typeof condition.operator === 'string' ? condition.operator : '=='
        const left = resolveContextValue(condition.variable, context)
        return evaluateComparison(left, operator, condition.value)
    }

    const target = context.lastAtcOutput
    if (!condition.pattern) {
        return true
    }
    const regex = createRegExp(condition.pattern, condition.patternFlags)
    if (!regex) {
        return true
    }
    const matches = regex.test(target)
    return condition.type === 'regex_not' ? !matches : matches
}

function evaluateCandidateConditions(
    candidate: LLMDecisionCandidateInput,
    context: CandidateEvaluationContext,
): boolean {
    const conditions = Array.isArray(candidate.state?.conditions)
        ? candidate.state.conditions.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : []
    for (const condition of conditions) {
        if (!evaluateCandidateCondition(condition, context)) {
            return false
        }
    }
    return true
}

function selectCandidates(
    evaluations: CandidateEvaluation[],
    context: CandidateEvaluationContext,
): LLMDecisionCandidateInput[] {
    if (!evaluations.length) {
        return []
    }

    const autoMatches = evaluations.filter((entry) => entry.autoTriggers.length > 0)
    const regexMatches = evaluations.filter((entry) => entry.regexTriggers.length > 0)
    const fallbackMatches = evaluations.filter((entry) => entry.noneTriggers.length > 0 || entry.implicitNone)

    const base = autoMatches.length
        ? autoMatches
        : regexMatches.length
            ? regexMatches
            : fallbackMatches

    if (!base.length) {
        return []
    }

    return base
        .filter((entry) => evaluateCandidateConditions(entry.candidate, context))
        .map((entry) => entry.candidate)
}

function attachFlowRouting(
    decision: LLMDecision,
    candidate: LLMDecisionCandidateInput | undefined,
    input: LLMDecisionInput,
): LLMDecision {
    const result: LLMDecision = { ...decision }
    const currentFlow = typeof input.flow_slug === 'string' && input.flow_slug.length
        ? input.flow_slug
        : 'icao_atc_decision_tree'
    const flowStack = Array.isArray(input.flow_stack) ? input.flow_stack : []
    const stackTop = flowStack.length ? flowStack[flowStack.length - 1] : null

    const targetFlow = candidate?.flow || result.next_flow || currentFlow
    if (targetFlow) {
        result.next_flow = targetFlow
    }

    if (targetFlow && targetFlow !== currentFlow) {
        if (stackTop && stackTop === targetFlow) {
            result.resume_previous = true
            result.flow_push = false
        } else if (typeof result.flow_push !== 'boolean') {
            result.flow_push = true
        }
    }

    if (!result.next_state && candidate) {
        result.next_state = candidate.id
    }

    return result
}

function resolveReadbackValue(key: string, input: LLMDecisionInput): string | null {
    const rawValue = input.variables?.[key]
    if (rawValue !== undefined && rawValue !== null) {
        const trimmed = `${rawValue}`.trim()
        if (trimmed.length > 0) {
            return trimmed
        }
    }

    switch (key) {
        case 'hold_short': {
            const runway = input.variables?.runway
            if (typeof runway === 'string' && runway.trim().length > 0) {
                return `holding short ${runway}`.trim()
            }
            return 'holding short'
        }
        case 'cleared_takeoff': {
            const runway = input.variables?.runway
            if (typeof runway === 'string' && runway.trim().length > 0) {
                return `cleared for take-off ${runway}`.trim()
            }
            return 'cleared for take-off'
        }
        case 'cleared_to_land': {
            const runway = input.variables?.runway
            if (typeof runway === 'string' && runway.trim().length > 0) {
                return `cleared to land runway ${runway}`.trim()
            }
            return 'cleared to land'
        }
        default:
            return null
    }
}

// Extrahiere verwendete Variablen aus Templates
function extractTemplateVariables(text?: string): string[] {
    if (!text) return []
    const matches = text.match(/\{([^}]+)\}/g) || []
    return matches.map(match => match.slice(1, -1)) // Remove { }
}

// Optimized yet sufficient input for reliable decisions
function optimizeInputForLLM(input: LLMDecisionInput) {
    // Collect all available variables from the decision tree
    const availableVariables = [
        'callsign', 'dest', 'dep', 'runway', 'squawk', 'sid', 'transition',
        'initial_altitude_ft', 'climb_altitude_ft', 'cruise_flight_level',
        'taxi_route', 'stand', 'gate', 'atis_code', 'qnh_hpa',
        'ground_freq', 'tower_freq', 'departure_freq', 'approach_freq', 'handoff_freq',
        'star', 'approach_type', 'remarks', 'acf_type'
    ]

    const readbackKeys = READBACK_REQUIREMENTS[input.state_id] || input.state.readback_required || []

    const stateSummary = {
        id: input.state_id,
        role: input.state.role,
        phase: input.state.phase,
        auto: input.state.auto ?? null,
        say_tpl: input.state.say_tpl ?? null,
        utterance_tpl: input.state.utterance_tpl ?? null,
        readback_keys: readbackKeys,
        next: (input.state.next ?? []).map((n: any) => n.to),
        ok_next: (input.state.ok_next ?? []).map((n: any) => n.to),
        bad_next: (input.state.bad_next ?? []).map((n: any) => n.to)
    }

    // Relevante Candidate-Daten mit Template-Variablen
    const candidates = input.candidates.map(c => {
        const templateVars = extractTemplateVariables(c.state.say_tpl)
        const candidateReadback = READBACK_REQUIREMENTS[c.id] || c.state.readback_required || []
        const requiresResponse =
            c.state.role === 'atc' ||
            Boolean(c.state.say_tpl) ||
            Boolean(candidateReadback.length) ||
            c.id.startsWith('INT_')
        return {
            id: c.id,
            flow: c.flow,
            active_flow: c.flow === input.flow_slug,
            source: c.source || 'transition',
            role: c.state.role,
            phase: c.state.phase,
            template_vars: templateVars, // Welche Variablen dieser State verwendet
            auto: c.state.auto ?? null,
            requires_atc_reply: requiresResponse,
            readback_keys: candidateReadback,
            has_say_tpl: Boolean(c.state.say_tpl),
            has_utterance_tpl: Boolean(c.state.utterance_tpl),
            handoff: c.state.handoff ? {
                to: c.state.handoff.to,
                freq: c.state.handoff.freq ?? null
            } : null
        }
    })

    // Sammle alle Template-Variablen aus den Candidates
    const candidateVars = new Set<string>()
    candidates.forEach(c => c.template_vars?.forEach(v => candidateVars.add(v)))

    return {
        state_id: input.state_id,
        current_phase: input.state.phase,
        current_role: input.state.role,
        state_summary: stateSummary,
        candidates: candidates,
        available_variables: availableVariables, // All available variables
        candidate_variables: Array.from(candidateVars), // Variablen die Candidates verwenden
        pilot_utterance: input.pilot_utterance,
        decision_hints: {
            expecting_pilot_call: input.state.role === 'pilot',
            state_auto: input.state.auto ?? null,
            current_unit: input.flags.current_unit,
            has_interrupt_candidate: input.candidates.some(c => c.id.startsWith('INT_')),
            readback_check_state: Boolean(readbackKeys.length)
        },
        current_flow: input.flow_slug,
        flow_stack: input.flow_stack ?? [],
        flows: input.flows ?? [],
        // Current context only without values (to save tokens)
        context: {
            callsign: input.variables.callsign,
            current_unit: input.flags.current_unit,
            in_air: input.flags.in_air,
            phase: input.state.phase
        }
    }
}

export async function routeDecision(input: LLMDecisionInput): Promise<LLMDecisionResult> {
    const pilotUtterance = (input.pilot_utterance || '').trim()
    const pilotText = pilotUtterance.toLowerCase()
    const trace: LLMDecisionTrace = { calls: [] }

    const finalize = (decision: LLMDecision): LLMDecisionResult => {
        if (!trace.calls.length && !trace.fallback) {
            return { decision }
        }
        return { decision, trace }
    }

    const evaluationContext: CandidateEvaluationContext = {
        variables: typeof input.variables === 'object' && input.variables ? input.variables : {},
        flags: typeof input.flags === 'object' && input.flags ? input.flags : {},
        telemetry: typeof input.telemetry === 'object' && input.telemetry ? input.telemetry : {},
        pilotUtterance,
        lastAtcOutput: typeof input.last_atc_output === 'string' ? input.last_atc_output : '',
        flowStatus: createFlowStatusMap(input.flows),
    }

    const originalCandidates = Array.isArray(input.candidates) ? input.candidates : []
    const evaluatedCandidates = originalCandidates.map((candidate) => evaluateCandidateTriggers(candidate, evaluationContext))
    const filteredCandidates = selectCandidates(evaluatedCandidates, evaluationContext)

    const normalizedInput: LLMDecisionInput = {
        ...input,
        variables: evaluationContext.variables,
        flags: evaluationContext.flags,
        telemetry: evaluationContext.telemetry,
        candidates: filteredCandidates,
    }

    if (!filteredCandidates.length) {
        const fallbackDecision = attachFlowRouting({
            next_state: fallbackNextState(normalizedInput),
            off_schema: true,
        }, undefined, normalizedInput)
        return finalize(fallbackDecision)
    }

    async function handleReadback(currentInput: LLMDecisionInput): Promise<LLMDecisionResult> {
        const requiredKeys = READBACK_REQUIREMENTS[currentInput.state_id] || currentInput.state.readback_required || []
        const expectedItems = requiredKeys.reduce<Array<{
            key: string
            value: string
            spoken_variants: string[]
        }>>((acc, key) => {
            const value = resolveReadbackValue(key, currentInput)
            if (!value) {
                return acc
            }

            const normalizedValue = String(value)
            if (!normalizedValue.trim().length) {
                return acc
            }

            acc.push({
                key,
                value: normalizedValue,
                spoken_variants: buildSpokenVariants(key, normalizedValue),
            })
            return acc
        }, [])

        const okNext = pickTransition(currentInput.state.ok_next, currentInput.candidates)
        const badNext = pickTransition(currentInput.state.bad_next, currentInput.candidates)
        const defaultNext = fallbackNextState(currentInput)

        if (!expectedItems.length) {
            const candidate = currentInput.candidates.find((c) => c.id === (okNext ?? defaultNext))
            return finalize(attachFlowRouting({ next_state: okNext ?? defaultNext }, candidate, currentInput))
        }

        const sanitizedPilot = sanitizeForQuickMatch(pilotUtterance)
        const heuristicsOk = expectedItems.every((item) => {
            const sanitizedValue = sanitizeForQuickMatch(item.value)
            return sanitizedValue ? sanitizedPilot.includes(sanitizedValue) : true
        })

        if (heuristicsOk && okNext) {
            const candidate = currentInput.candidates.find((c) => c.id === okNext)
            return finalize(attachFlowRouting({ next_state: okNext }, candidate, currentInput))
        }

        const payload = {
            state_id: currentInput.state_id,
            callsign: currentInput.variables?.callsign,
            pilot_utterance: pilotUtterance,
            expected_items: expectedItems,
            controller_instruction: currentInput.state.say_tpl ?? null,
        }

        const requestBody = {
            model: getModel(),
            response_format: { type: 'json_schema', json_schema: READBACK_JSON_SCHEMA },
            reasoning_effort: 'low',
            n: 1,
            verbosity: 'low',
            messages: [
                {
                    role: 'system',
                    content: [
                        'You are an aviation clearance readback checker.',
                        'Evaluate if the pilot_utterance correctly repeats every item in expected_items.',
                        'Return JSON with keys: status (ok, missing, incorrect, uncertain), missing (array), incorrect (array), notes (optional).',
                        'Treat reasonable phonetic variations as correct.',
                    ].join(' '),
                },
                { role: 'user', content: JSON.stringify(payload) },
            ],
        }

        const callTrace: LLMDecisionTraceCall = {
            stage: 'readback-check',
            request: JSON.parse(JSON.stringify(requestBody)),
        }

        try {
            const client = ensureOpenAI()
            const response = await client.chat.completions.create(requestBody)

            const raw = response.choices?.[0]?.message?.content || '{}'
            callTrace.response = JSON.parse(JSON.stringify(response))
            callTrace.rawResponseText = raw
            trace.calls.push(callTrace)

            const parsed = JSON.parse(raw) as { status?: ReadbackStatus }
            const status: ReadbackStatus = parsed.status || 'uncertain'

            if (status === 'ok') {
                const targetId = okNext ?? defaultNext
                const candidate = currentInput.candidates.find((c) => c.id === targetId)
                return finalize(attachFlowRouting({ next_state: targetId }, candidate, currentInput))
            }

            if ((status === 'missing' || status === 'incorrect') && badNext) {
                const candidate = currentInput.candidates.find((c) => c.id === badNext)
                return finalize(attachFlowRouting({ next_state: badNext }, candidate, currentInput))
            }

            if (status === 'uncertain' && okNext) {
                const candidate = currentInput.candidates.find((c) => c.id === okNext)
                return finalize(attachFlowRouting({ next_state: okNext }, candidate, currentInput))
            }

            const fallbackId = badNext ?? defaultNext
            const candidate = currentInput.candidates.find((c) => c.id === fallbackId)
            return finalize(attachFlowRouting({ next_state: fallbackId }, candidate, currentInput))
        } catch (err) {
            callTrace.error = err instanceof Error ? err.message : String(err)
            trace.calls.push(callTrace)
            if (!trace.fallback) {
                trace.fallback = { used: true, reason: callTrace.error, selected: 'readback-check-fallback' }
            }
            console.warn('[ATC] Readback check failed, using fallback:', err)
            const fallbackId = okNext ?? defaultNext
            const candidate = currentInput.candidates.find((c) => c.id === fallbackId)
            return finalize(attachFlowRouting({ next_state: fallbackId }, candidate, currentInput))
        }
    }

    if (normalizedInput.state?.auto === 'check_readback') {
        return await handleReadback(normalizedInput)
    }

    if (!pilotUtterance) {
        const interruptCandidate = normalizedInput.candidates.find((c) => c.id.startsWith('INT_'))
            || normalizedInput.candidates.find((c) => c.state?.auto === 'monitor')
            || normalizedInput.candidates.find((c) => c.state?.role === 'system')

        if (interruptCandidate) {
            return finalize(attachFlowRouting({ next_state: interruptCandidate.id }, interruptCandidate, normalizedInput))
        }
    }

    if (pilotText.includes('radio check') || pilotText.includes('signal test') ||
        (pilotText.includes('read') && (pilotText.includes('check') || pilotText.includes('you')))) {
        return finalize(attachFlowRouting({
            next_state: normalizedInput.state_id,
            radio_check: true,
            controller_say_tpl: `${normalizedInput.variables.callsign}, read you five by five.`,
        }, undefined, normalizedInput))
    }

    if (pilotText.startsWith('mayday') && normalizedInput.flags.in_air) {
        const candidate = normalizedInput.candidates.find((c) => c.id === 'INT_MAYDAY')
        return finalize(attachFlowRouting({ next_state: 'INT_MAYDAY' }, candidate, normalizedInput))
    }
    if (pilotText.startsWith('pan pan') && normalizedInput.flags.in_air) {
        const candidate = normalizedInput.candidates.find((c) => c.id === 'INT_PANPAN')
        return finalize(attachFlowRouting({ next_state: 'INT_PANPAN' }, candidate, normalizedInput))
    }

    const optimizedInput = optimizeInputForLLM(normalizedInput)
    const atcCandidates = normalizedInput.candidates.filter((c) =>
        c.state.role === 'atc' || c.state.say_tpl || c.id.startsWith('INT_'),
    )

    if (atcCandidates.length === 0 && normalizedInput.candidates.length > 0) {
        const candidate = normalizedInput.candidates[0]
        return finalize(attachFlowRouting({ next_state: candidate.id }, candidate, normalizedInput))
    }

    const system = [
        'You are an ATC state router. Return strict JSON.',
        'Keys: next_state, controller_say_tpl (optional), off_schema (optional), intent (optional).',
        '',
        'CLASSIFY INTENT: Determine if pilot_utterance is PILOT_REQUEST (pilot initiates a call or request), PILOT_READBACK (acknowledging prior ATC instruction), SYS_INTERRUPT (system-driven transition, no pilot input), or OTHER.',
        'Use decision_hints.expecting_pilot_call, state_summary.role and candidates[].requires_atc_reply to guide the choice.',
        '',
        'ROUTING: Choose next_state from candidates[].id that best fits the intent and keeps the flow consistent with state_summary.next/ok_next/bad_next.',
        'If unsure, prefer GEN_NO_REPLY (set off_schema=true) or the first logical candidate.',
        '',
        'ATC RESPONSES: Only include controller_say_tpl when the chosen candidate requires an ATC reply (requires_atc_reply=true), has template variables, or the pilot is off schema.',
        'Never speak for pilot states. Always include {callsign} in ATC responses and prefer provided variables such as {runway}, {squawk}, {dest}.',
        '',
        `Available variables: {${optimizedInput.available_variables.join('}, {')}}`,
        `Common candidate variables: {${optimizedInput.candidate_variables.join('}, {')}}`,
        '',
        'INTERRUPTS: If an interrupt state (id starts with INT_) best matches the intent, select it and answer accordingly.',
        'Do not invent state ids. If nothing fits, respond with next_state "GEN_NO_REPLY" and off_schema=true.',
    ].join(' ')

    optimizedInput.atc_candidates = atcCandidates.map((c) => c.id)

    const user = JSON.stringify(optimizedInput)

    const body = {
        model: getModel(),
        response_format: { type: 'json_object' },
        messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
        ],
    }

    const callTrace: LLMDecisionTraceCall = {
        stage: 'decision',
        request: JSON.parse(JSON.stringify(body)),
    }

    try {
        const client = ensureOpenAI()

        console.log('calling LLM with body:', body)

        const response = await client.chat.completions.create(body)

        const raw = response.choices?.[0]?.message?.content || '{}'
        callTrace.response = JSON.parse(JSON.stringify(response))
        callTrace.rawResponseText = raw
        trace.calls.push(callTrace)

        const parsed = JSON.parse(raw)

        if (!parsed.next_state || typeof parsed.next_state !== 'string') {
            throw new Error('Invalid next_state')
        }

        console.log('LLM decision:', parsed)

        const candidate = normalizedInput.candidates.find((c) => c.id === parsed.next_state)
        return finalize(attachFlowRouting(parsed as LLMDecision, candidate, normalizedInput))
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        callTrace.error = errorMessage
        trace.calls.push(callTrace)
        const fallbackInfo = { used: true, reason: errorMessage } as NonNullable<LLMDecisionTrace['fallback']>
        trace.fallback = fallbackInfo
        console.error('LLM JSON parse error, using smart fallback:', error)

        const callsign = normalizedInput.variables.callsign || ''

        if (pilotText.includes('clearance') || pilotText.includes('request clearance')) {
            fallbackInfo.selected = 'clearance'
            const candidate = normalizedInput.candidates.find((c) => c.id === 'CD_ISSUE_CLR')
            return finalize(attachFlowRouting({
                next_state: 'CD_ISSUE_CLR',
                off_schema: true,
                controller_say_tpl: `{callsign}, cleared to {dest} via {sid} departure, runway {runway}, climb {initial_altitude_ft} feet, squawk {squawk}.`,
            }, candidate, normalizedInput))
        }

        if (pilotText.includes('taxi') || pilotText.includes('pushback')) {
            fallbackInfo.selected = 'taxi'
            const candidate = normalizedInput.candidates.find((c) => c.id === 'GRD_TAXI_INSTR')
            return finalize(attachFlowRouting({
                next_state: 'GRD_TAXI_INSTR',
                off_schema: true,
                controller_say_tpl: `{callsign}, taxi to runway {runway} via {taxi_route}, hold short runway {runway}.`,
            }, candidate, normalizedInput))
        }

        if (pilotText.includes('takeoff') || pilotText.includes('ready')) {
            fallbackInfo.selected = 'takeoff'
            const candidate = normalizedInput.candidates.find((c) => c.id === 'TWR_TAKEOFF_CLR')
            return finalize(attachFlowRouting({
                next_state: 'TWR_TAKEOFF_CLR',
                off_schema: true,
                controller_say_tpl: `{callsign}, wind {remarks}, runway {runway} cleared for take-off.`,
            }, candidate, normalizedInput))
        }

        if (pilotText.startsWith('roger') || pilotText.startsWith('wilco') || pilotText.startsWith('copy that')) {
            fallbackInfo.selected = 'ack'
            return finalize(attachFlowRouting({
                next_state: normalizedInput.state_id,
                off_schema: false,
            }, undefined, normalizedInput))
        }

        fallbackInfo.selected = 'default'
        return finalize(attachFlowRouting({
            next_state: fallbackNextState(normalizedInput),
            off_schema: true,
        }, undefined, normalizedInput))
    }
}

