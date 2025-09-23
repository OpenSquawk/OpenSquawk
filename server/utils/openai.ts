// server/utils/openai.ts
import OpenAI from 'openai'
import {spellIcaoDigits, toIcaoPhonetic} from '../../shared/utils/radioSpeech'
import type {
    ActiveNodeSummary,
    CandidateTraceEntry,
    CandidateTraceStep,
    DecisionCandidateTimeline,
    FlowActivationInstruction,
    FlowActivationMode,
    LLMDecision,
    LLMDecisionInput,
    LLMDecisionResult,
    LLMDecisionTrace,
    LLMDecisionTraceCall,
} from '../../shared/types/llm'
import type { DecisionNodeCondition, DecisionNodeTrigger, RuntimeDecisionState, RuntimeDecisionSystem } from '../../shared/types/decision'
import { buildRuntimeDecisionSystem } from '../services/decisionFlowService'
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

interface IndexedStateEntry {
    flow: string
    state: RuntimeDecisionState
}

interface DecisionCandidate {
    id: string
    flow: string
    state: RuntimeDecisionState
    triggers: DecisionNodeTrigger[]
    regexTriggers: DecisionNodeTrigger[]
    noneTriggers: DecisionNodeTrigger[]
}

interface PreparedCandidateResult {
    finalCandidates: DecisionCandidate[]
    candidateFlowMap: Map<string, string>
    candidateIndex: Map<string, DecisionCandidate>
    finalCandidateIndex: Map<string, DecisionCandidate>
    activeFlowSlug: string
    flowEntryModes: Map<string, FlowActivationMode>
    timeline: DecisionCandidateTimeline
    autoSelected?: DecisionCandidate | null
}

const RUNTIME_CACHE_TTL_MS = 5_000
let runtimeSystemCache: { system: RuntimeDecisionSystem; index: Map<string, IndexedStateEntry>; timestamp: number } | null = null

function buildRuntimeIndex(system: RuntimeDecisionSystem): Map<string, IndexedStateEntry> {
    const index = new Map<string, IndexedStateEntry>()
    for (const [flowSlug, tree] of Object.entries(system.flows || {})) {
        const states = tree?.states || {}
        for (const [stateId, state] of Object.entries(states)) {
            index.set(stateId, { flow: flowSlug, state })
        }
    }
    return index
}

async function getRuntimeSystemIndex(): Promise<{ system: RuntimeDecisionSystem; index: Map<string, IndexedStateEntry> }> {
    const now = Date.now()
    if (!runtimeSystemCache || now - runtimeSystemCache.timestamp > RUNTIME_CACHE_TTL_MS) {
        const system = await buildRuntimeDecisionSystem()
        runtimeSystemCache = {
            system,
            index: buildRuntimeIndex(system),
            timestamp: now,
        }
    }
    return { system: runtimeSystemCache.system, index: runtimeSystemCache.index }
}

function evaluateRegexPattern(pattern: string | undefined, flags: string | undefined, value: string): boolean {
    const source = pattern?.trim()
    if (!source) {
        return false
    }
    const normalizedFlags = flags && flags.trim().length ? flags : 'i'
    try {
        const regex = new RegExp(source, normalizedFlags)
        return regex.test(value)
    } catch {
        return false
    }
}

function analyzeTriggers(triggers: DecisionNodeTrigger[] | undefined, utterance: string) {
    if (!Array.isArray(triggers) || triggers.length === 0) {
        return { matchesRegex: false, matchesNone: true }
    }

    let matchesRegex = false
    let hasNone = false
    for (const trigger of triggers) {
        if (!trigger) continue
        if (trigger.type === 'regex') {
            if (evaluateRegexPattern(trigger.pattern, trigger.patternFlags, utterance)) {
                matchesRegex = true
            }
        } else if (trigger.type === 'none') {
            hasNone = true
        }
    }

    if (!matchesRegex && !hasNone) {
        hasNone = true
    }

    return { matchesRegex, matchesNone: hasNone }
}

function normalizeComparable(value: any): any {
    if (typeof value === 'number') return value
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed.length) return ''
        const numeric = Number(trimmed)
        if (!Number.isNaN(numeric)) return numeric
        if (trimmed.toLowerCase() === 'true') return true
        if (trimmed.toLowerCase() === 'false') return false
        return trimmed
    }
    return value
}

function parseComparable(raw: any): any {
    if (typeof raw === 'number' || typeof raw === 'boolean') {
        return raw
    }
    if (typeof raw === 'string') {
        const trimmed = raw.trim()
        if (!trimmed.length) return ''
        const numeric = Number(trimmed)
        if (!Number.isNaN(numeric)) return numeric
        if (trimmed.toLowerCase() === 'true') return true
        if (trimmed.toLowerCase() === 'false') return false
        if (
            (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith('\'') && trimmed.endsWith('\''))
        ) {
            return trimmed.slice(1, -1)
        }
        return trimmed
    }
    return raw
}

function compareValuesSafe(left: any, operator: string | undefined, right: any): {
    result: boolean
    left: any
    right: any
    operator: string
} {
    const normalizedLeft = normalizeComparable(left)
    const normalizedRight = normalizeComparable(parseComparable(right))
    const op = operator || '=='
    let result = false
    switch (op) {
        case '>':
            result = typeof normalizedLeft === 'number' && typeof normalizedRight === 'number'
                ? normalizedLeft > normalizedRight
                : false
            break
        case '>=':
            result = typeof normalizedLeft === 'number' && typeof normalizedRight === 'number'
                ? normalizedLeft >= normalizedRight
                : false
            break
        case '<':
            result = typeof normalizedLeft === 'number' && typeof normalizedRight === 'number'
                ? normalizedLeft < normalizedRight
                : false
            break
        case '<=':
            result = typeof normalizedLeft === 'number' && typeof normalizedRight === 'number'
                ? normalizedLeft <= normalizedRight
                : false
            break
        case '!==':
        case '!=':
            result = normalizedLeft !== normalizedRight
            break
        case '===':
        case '==':
        default:
            result = normalizedLeft === normalizedRight
            break
    }
    return { result, left: normalizedLeft, right: normalizedRight, operator: op }
}

function resolveContextPath(
    path: string | undefined,
    context: { variables: Record<string, any>; flags: Record<string, any> }
) {
    if (!path || typeof path !== 'string') return undefined
    const segments = path.split('.').map(segment => segment.trim()).filter(Boolean)
    if (!segments.length) return undefined

    let current: any
    const [first, ...rest] = segments
    if (first === 'variables' || first === 'flags') {
        current = (context as any)[first]
    } else {
        current = context.variables
        rest.unshift(first)
    }

    for (const segment of rest) {
        if (current == null) return undefined
        current = current[segment]
    }
    return current
}

function evaluateConditionEntry(
    condition: DecisionNodeCondition | undefined,
    context: { variables: Record<string, any>; flags: Record<string, any> },
    utterance: string
): { passed: boolean; detail?: { condition: DecisionNodeCondition; actualValue?: any; expectedValue?: any; operator?: string } } {
    if (!condition) return { passed: true }
    switch (condition.type) {
        case 'regex': {
            const passed = evaluateRegexPattern(condition.pattern, condition.patternFlags, utterance)
            return {
                passed,
                detail: passed ? undefined : { condition },
            }
        }
        case 'regex_not': {
            const matched = evaluateRegexPattern(condition.pattern, condition.patternFlags, utterance)
            const passed = !matched
            return {
                passed,
                detail: passed ? undefined : { condition },
            }
        }
        case 'variable_value':
        default: {
            const left = resolveContextPath(condition.variable, context)
            const comparison = compareValuesSafe(left, condition.operator, condition.value)
            return {
                passed: comparison.result,
                detail: comparison.result
                    ? undefined
                    : {
                          condition,
                          actualValue: comparison.left,
                          expectedValue: comparison.right,
                          operator: comparison.operator,
                      },
            }
        }
    }
}

function evaluateConditionList(
    conditions: DecisionNodeCondition[] | undefined,
    context: { variables: Record<string, any>; flags: Record<string, any> },
    utterance: string
): { passed: boolean; failure?: { condition: DecisionNodeCondition; actualValue?: any; expectedValue?: any; operator?: string } } {
    if (!Array.isArray(conditions) || conditions.length === 0) {
        return { passed: true }
    }
    const ordered = [...conditions].sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    for (const condition of ordered) {
        const result = evaluateConditionEntry(condition, context, utterance)
        if (!result.passed) {
            return {
                passed: false,
                failure: {
                    condition,
                    actualValue: result.detail?.actualValue,
                    expectedValue: result.detail?.expectedValue,
                    operator: result.detail?.operator,
                },
            }
        }
    }
    return { passed: true }
}

async function prepareDecisionCandidates(
    input: LLMDecisionInput,
    utterance: string
): Promise<PreparedCandidateResult> {
    const { system, index } = await getRuntimeSystemIndex()

    let activeFlowSlug = input.flow_slug && system.flows[input.flow_slug]
        ? input.flow_slug
        : undefined

    if (!activeFlowSlug) {
        const entry = index.get(input.state_id)
        if (entry) {
            activeFlowSlug = entry.flow
        }
    }

    if (!activeFlowSlug) {
        activeFlowSlug = system.main || Object.keys(system.flows)[0] || ''
    }

    const flowEntryModes = new Map<string, FlowActivationMode>()
    for (const [slug, tree] of Object.entries(system.flows || {})) {
        const mode = tree.entry_mode === 'main'
            ? 'main'
            : tree.entry_mode === 'linear'
                ? 'linear'
                : slug === system.main
                    ? 'main'
                    : 'parallel'
        flowEntryModes.set(slug, mode)
    }

    const candidateMap = new Map<string, DecisionCandidate>()

    const createCandidate = (id: string, flow: string | undefined, state: RuntimeDecisionState | undefined): DecisionCandidate | null => {
        if (!id || !state) return null
        const triggers = Array.isArray(state.triggers) ? state.triggers.filter(Boolean) : []
        const regexTriggers = triggers.filter(trigger => trigger?.type === 'regex')
        const noneTriggers = triggers.filter(trigger => trigger?.type === 'none')
        return {
            id,
            flow: flow || activeFlowSlug,
            state,
            triggers,
            regexTriggers,
            noneTriggers,
        }
    }

    const addCandidate = (id: string | undefined, flow: string | undefined, state: RuntimeDecisionState | undefined) => {
        if (!id) return
        if (candidateMap.has(id)) return
        const candidate = createCandidate(id, flow, state)
        if (candidate) {
            candidateMap.set(id, candidate)
        }
    }

    for (const raw of input.candidates || []) {
        if (!raw?.id) continue
        const indexed = index.get(raw.id)
        const flow = raw.flow || indexed?.flow || activeFlowSlug
        const state = indexed?.state ? { ...indexed.state } : raw.state
        addCandidate(raw.id, flow, state)
    }

    for (const raw of input.candidates || []) {
        if (!raw?.id || !raw.state) continue
        if (!candidateMap.has(raw.id)) {
            addCandidate(raw.id, raw.flow || activeFlowSlug, raw.state)
        }
    }

    for (const [flowSlug, tree] of Object.entries(system.flows || {})) {
        const startStateId = tree.start_state
        if (!startStateId) continue
        const indexed = index.get(startStateId)
        const state = indexed?.state ? { ...indexed.state } : tree.states?.[startStateId]
        addCandidate(startStateId, flowSlug, state)
    }

    const candidates = Array.from(candidateMap.values())
    const context = { variables: input.variables || {}, flags: input.flags || {} }
    const timelineSteps: CandidateTraceStep[] = []
    let fallbackUsed = false

    const toTraceEntry = (candidate: DecisionCandidate): CandidateTraceEntry => ({
        id: candidate.id,
        flow: candidate.flow,
        name: candidate.state?.name,
        summary: candidate.state?.summary,
        role: candidate.state?.role,
        triggers: candidate.triggers,
        conditions: candidate.state?.conditions || [],
    })

    const recordStep = (
        stage: CandidateTraceStage,
        label: string,
        stepCandidates: DecisionCandidate[],
        eliminated: CandidateTraceElimination[] = [],
        note?: string
    ) => {
        timelineSteps.push({
            stage,
            label,
            candidates: stepCandidates.map(toTraceEntry),
            eliminated: eliminated.length ? eliminated : undefined,
            note,
        })
    }

    const regexCandidates = candidates.filter(candidate => candidate.regexTriggers.length > 0)
    let workingSet: DecisionCandidate[] = []

    if (regexCandidates.length > 0) {
        recordStep('regex_candidates', 'Regex candidates', regexCandidates)

        const survivors: DecisionCandidate[] = []
        const eliminated: CandidateTraceElimination[] = []

        for (const candidate of regexCandidates) {
            const matched = candidate.regexTriggers.some(trigger =>
                evaluateRegexPattern(trigger.pattern, trigger.patternFlags, utterance)
            )
            if (matched) {
                survivors.push(candidate)
            } else {
                eliminated.push({
                    candidate: toTraceEntry(candidate),
                    kind: 'regex',
                    reason: 'No regex trigger matched the pilot utterance.',
                    context: {
                        patterns: candidate.regexTriggers.map(trigger => ({
                            id: trigger.id,
                            pattern: trigger.pattern,
                            flags: trigger.patternFlags,
                        })),
                        transcript: utterance,
                    },
                })
            }
        }

        recordStep(
            'regex_filtered',
            'Regex evaluation',
            survivors,
            eliminated,
            survivors.length ? undefined : 'No regex triggers matched the pilot transmission.'
        )

        workingSet = survivors
    } else {
        recordStep('regex_candidates', 'Regex candidates', [], [], 'No regex-triggered transitions available.')
        workingSet = []
    }

    let finalCandidates: DecisionCandidate[] = []

    if (workingSet.length > 0) {
        const survivors: DecisionCandidate[] = []
        const eliminated: CandidateTraceElimination[] = []

        for (const candidate of workingSet) {
            const evaluation = evaluateConditionList(candidate.state?.conditions, context, utterance)
            if (evaluation.passed) {
                survivors.push(candidate)
            } else if (evaluation.failure) {
                eliminated.push({
                    candidate: toTraceEntry(candidate),
                    kind: 'condition',
                    reason: 'Node conditions were not satisfied.',
                    context: {
                        condition: evaluation.failure.condition,
                        actualValue: evaluation.failure.actualValue,
                        expectedValue: evaluation.failure.expectedValue,
                        operator: evaluation.failure.operator,
                    },
                })
            } else {
                eliminated.push({
                    candidate: toTraceEntry(candidate),
                    kind: 'condition',
                    reason: 'Node conditions were not satisfied.',
                })
            }
        }

        recordStep(
            'condition_filtered',
            'Condition evaluation',
            survivors,
            eliminated,
            survivors.length ? undefined : 'All regex candidates failed their conditions.'
        )

        finalCandidates = survivors
    }

    if (finalCandidates.length === 0) {
        fallbackUsed = true
        const fallbackCandidates = candidates.filter(candidate =>
            candidate.noneTriggers.length > 0 || (candidate.triggers.length === 0 && candidate.regexTriggers.length === 0)
        )

        if (fallbackCandidates.length > 0) {
            recordStep('fallback_candidates', 'Fallback candidates', fallbackCandidates)

            const survivors: DecisionCandidate[] = []
            const eliminated: CandidateTraceElimination[] = []

            for (const candidate of fallbackCandidates) {
                const evaluation = evaluateConditionList(candidate.state?.conditions, context, utterance)
                if (evaluation.passed) {
                    survivors.push(candidate)
                } else if (evaluation.failure) {
                    eliminated.push({
                        candidate: toTraceEntry(candidate),
                        kind: 'condition',
                        reason: 'Node conditions were not satisfied.',
                        context: {
                            condition: evaluation.failure.condition,
                            actualValue: evaluation.failure.actualValue,
                            expectedValue: evaluation.failure.expectedValue,
                            operator: evaluation.failure.operator,
                        },
                    })
                } else {
                    eliminated.push({
                        candidate: toTraceEntry(candidate),
                        kind: 'condition',
                        reason: 'Node conditions were not satisfied.',
                    })
                }
            }

            recordStep(
                'fallback_filtered',
                'Fallback evaluation',
                survivors,
                eliminated,
                survivors.length ? undefined : 'No fallback candidates satisfied their conditions.'
            )

            finalCandidates = survivors
        } else {
            recordStep('fallback_candidates', 'Fallback candidates', [], [], 'No fallback triggers defined.')
            recordStep('fallback_filtered', 'Fallback evaluation', [], [], 'No fallback candidates available.')
        }
    }

    recordStep(
        'final',
        'Final candidates',
        finalCandidates,
        [],
        finalCandidates.length ? undefined : 'No transitions remain after evaluation.'
    )

    const autoSelected = finalCandidates.length === 1 ? finalCandidates[0] : null

    const candidateFlowMap = new Map<string, string>()
    for (const candidate of finalCandidates) {
        if (candidate.flow) {
            candidateFlowMap.set(candidate.id, candidate.flow)
        }
    }

    const finalCandidateIndex = new Map<string, DecisionCandidate>()
    for (const candidate of finalCandidates) {
        finalCandidateIndex.set(candidate.id, candidate)
    }

    const timeline: DecisionCandidateTimeline = {
        steps: timelineSteps,
        fallbackUsed,
        autoSelected: autoSelected ? toTraceEntry(autoSelected) : null,
    }

    return {
        finalCandidates,
        candidateFlowMap,
        candidateIndex: candidateMap,
        finalCandidateIndex,
        activeFlowSlug,
        flowEntryModes,
        timeline,
        autoSelected,
    }
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
    const trace: LLMDecisionTrace = {calls: []}
    let candidateFlowMap = new Map<string, string>()
    let activeFlowSlug = input.flow_slug || ''

    const prepared = await prepareDecisionCandidates(input, pilotUtterance)
    candidateFlowMap = prepared.candidateFlowMap
    const flowEntryModes = prepared.flowEntryModes
    if (prepared.activeFlowSlug) {
        activeFlowSlug = prepared.activeFlowSlug
        input.flow_slug = prepared.activeFlowSlug
    }
    trace.candidateTimeline = prepared.timeline
    if (prepared.autoSelected) {
        trace.autoSelection = {
            id: prepared.autoSelected.id,
            flow: prepared.autoSelected.flow,
            reason: 'Single candidate remained after trigger and condition evaluation.',
        }
    }
    input.candidates = prepared.finalCandidates.map(candidate => ({
        id: candidate.id,
        state: candidate.state,
        flow: candidate.flow,
    }))

    const resolveActivationInstruction = (
        value?: string | FlowActivationInstruction | null
    ): FlowActivationInstruction | undefined => {
        if (!value) return undefined
        if (typeof value === 'string') {
            const normalizedMode = flowEntryModes.get(value)
                || (value === prepared.activeFlowSlug ? 'main' : undefined)
            return {
                slug: value,
                mode: normalizedMode || 'parallel',
            }
        }
        if (!value.slug) return undefined
        const normalizedMode = value.mode
            || flowEntryModes.get(value.slug)
            || (value.slug === prepared.activeFlowSlug ? 'main' : undefined)
        return {
            slug: value.slug,
            mode: normalizedMode || 'parallel',
        }
    }

    const finalize = (decision: LLMDecision): LLMDecisionResult => {
        const targetState = typeof decision.next_state === 'string' ? decision.next_state : ''
        const normalizedControllerSay = typeof decision.controller_say_tpl === 'string'
            ? decision.controller_say_tpl.trim()
            : ''

        const targetCandidate = targetState
            ? prepared.finalCandidateIndex.get(targetState) || prepared.candidateIndex.get(targetState)
            : undefined
        const targetFlow = targetCandidate?.flow || (targetState ? candidateFlowMap.get(targetState) : undefined)
        const candidateSayTemplate = targetCandidate?.state?.say_tpl
        const candidateRole = targetCandidate?.state?.role

        if ((!normalizedControllerSay.length) && candidateRole === 'atc' && typeof candidateSayTemplate === 'string') {
            decision.controller_say_tpl = candidateSayTemplate
        }

        let activation = resolveActivationInstruction(decision.activate_flow as any)
        if (!activation && targetFlow && targetFlow !== activeFlowSlug) {
            activation = resolveActivationInstruction(targetFlow)
        }

        const finalControllerSay = typeof decision.controller_say_tpl === 'string'
            ? decision.controller_say_tpl.trim()
            : ''
        const atcWillSpeak = Boolean(
            (finalControllerSay && finalControllerSay.length)
            || (candidateRole === 'atc' && typeof candidateSayTemplate === 'string' && candidateSayTemplate.trim().length)
        )

        if (targetCandidate?.state?.auto === 'pop_stack_or_route_by_intent') {
            decision.resume_previous = true
        }

        if (activation) {
            if (activation.slug !== activeFlowSlug && atcWillSpeak && activation.mode !== 'main') {
                activation.mode = 'linear'
            }
            decision.activate_flow = activation
        } else if (decision.activate_flow) {
            delete (decision as any).activate_flow
        }

        let activeNodes: ActiveNodeSummary[] | undefined
        if (activation?.mode === 'parallel') {
            const nodes: ActiveNodeSummary[] = []

            if (input.state_id && activeFlowSlug) {
                const previousSay = typeof input.state?.say_tpl === 'string' ? input.state.say_tpl : undefined
                nodes.push({
                    flow: activeFlowSlug,
                    state: input.state_id,
                    role: input.state?.role,
                    say_tpl: previousSay,
                    controller_say_tpl: input.state?.role === 'atc' ? previousSay : undefined,
                })
            }

            if (targetState) {
                const flowForTarget = targetFlow || activeFlowSlug
                if (flowForTarget) {
                    nodes.push({
                        flow: flowForTarget,
                        state: targetState,
                        role: candidateRole,
                        say_tpl: typeof candidateSayTemplate === 'string' ? candidateSayTemplate : undefined,
                        controller_say_tpl: candidateRole === 'atc'
                            ? (decision.controller_say_tpl || candidateSayTemplate || undefined)
                            : undefined,
                    })
                }
            }

            if (nodes.length) {
                const seen = new Set<string>()
                activeNodes = nodes.filter(node => {
                    if (!node.flow || !node.state) {
                        return false
                    }
                    const key = `${node.flow}::${node.state}`
                    if (seen.has(key)) {
                        return false
                    }
                    seen.add(key)
                    return true
                })
            }

            if (!activeNodes?.length) {
                activeNodes = undefined
            }
        }

        const shouldAttachTrace = Boolean(
            trace.calls.length
            || trace.fallback
            || (trace.candidateTimeline && trace.candidateTimeline.steps.length)
            || trace.autoSelection
        )

        const result: LLMDecisionResult = { decision }
        if (shouldAttachTrace) {
            result.trace = trace
        }
        if (activeNodes && activeNodes.length) {
            result.active_nodes = activeNodes
        }
        return result
    }

    async function handleReadbackCheck(): Promise<LLMDecisionResult> {
        const requiredKeys = READBACK_REQUIREMENTS[input.state_id] || input.state.readback_required || []
        const expectedItems = requiredKeys.reduce<Array<{
            key: string;
            value: string;
            spoken_variants: string[]
        }>>((acc, key) => {
            const value = resolveReadbackValue(key, input)
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
                spoken_variants: buildSpokenVariants(key, normalizedValue)
            })
            return acc
        }, [])

        const okNext = pickTransition(input.state.ok_next, input.candidates)
        const badNext = pickTransition(input.state.bad_next, input.candidates)
        const defaultNext = fallbackNextState(input)

        if (!expectedItems.length) {
            return finalize({next_state: okNext ?? defaultNext})
        }

        const sanitizedPilot = sanitizeForQuickMatch(pilotUtterance)
        const heuristicsOk = expectedItems.every(item => {
            const sanitizedValue = sanitizeForQuickMatch(item.value)
            return sanitizedValue ? sanitizedPilot.includes(sanitizedValue) : true
        })

        if (heuristicsOk && okNext) {
            return finalize({next_state: okNext})
        }

        const payload = {
            state_id: input.state_id,
            callsign: input.variables?.callsign,
            pilot_utterance: pilotUtterance,
            expected_items: expectedItems,
            controller_instruction: input.state.say_tpl ?? null
        }

        const requestBody = {
            model: getModel(),
            response_format: {type: 'json_schema', json_schema: READBACK_JSON_SCHEMA},
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
                        'Treat reasonable phonetic variations as correct.'
                    ].join(' ')
                },
                {role: 'user', content: JSON.stringify(payload)}
            ]
        }

        const callTrace: LLMDecisionTraceCall = {
            stage: 'readback-check',
            request: JSON.parse(JSON.stringify(requestBody))
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
                return finalize({next_state: okNext ?? defaultNext})
            }

            if ((status === 'missing' || status === 'incorrect') && badNext) {
                return finalize({next_state: badNext})
            }

            if (status === 'uncertain' && okNext) {
                return finalize({next_state: okNext})
            }

            return finalize({next_state: badNext ?? defaultNext})
        } catch (err) {
            callTrace.error = err instanceof Error ? err.message : String(err)
            trace.calls.push(callTrace)
            if (!trace.fallback) {
                trace.fallback = {used: true, reason: callTrace.error, selected: 'readback-check-fallback'}
            }
            console.warn('[ATC] Readback check failed, using fallback:', err)
            return finalize({next_state: okNext ?? defaultNext})
        }
    }

    if (input.state?.auto === 'check_readback') {
        return await handleReadbackCheck()
    }

    if (!pilotUtterance) {
        const interruptCandidate = input.candidates.find(c => c.id.startsWith('INT_'))
            || input.candidates.find(c => c.state?.auto === 'monitor')
            || input.candidates.find(c => c.state?.role === 'system')

        if (interruptCandidate) {
            return finalize({next_state: interruptCandidate.id})
        }
    }

    const optimizedInput = optimizeInputForLLM(input)

    // Check whether the next states require ATC responses
    const atcCandidates = input.candidates.filter(c =>
        c.state.role === 'atc' || c.state.say_tpl || c.id.startsWith('INT_')
    )

    // If no ATC states are available, perform a simple transition without a response
    if (atcCandidates.length === 0 && input.candidates.length > 0) {
        return finalize({next_state: input.candidates[0].id})
    }

    // Compact yet informative prompt — includes variable info for intelligent responses
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
        'Do not invent state ids. If nothing fits, respond with next_state "GEN_NO_REPLY" and off_schema=true.'
    ].join(' ')

    // Update optimized input to indicate which candidates need ATC responses
    optimizedInput.atc_candidates = atcCandidates.map(c => c.id)

    const user = JSON.stringify(optimizedInput)

    const body = {
        model: getModel(),
        response_format: {type: 'json_object'},
        messages: [
            {role: 'system', content: system},
            {role: 'user', content: user}
        ]
    }

    const callTrace: LLMDecisionTraceCall = {
        stage: 'decision',
        request: JSON.parse(JSON.stringify(body))
    }

    try {
        const client = ensureOpenAI()

        console.log("calling LLM with body:", body)

        const r = await client.chat.completions.create(body)

        const raw = r.choices?.[0]?.message?.content || '{}'
        callTrace.response = JSON.parse(JSON.stringify(r))
        callTrace.rawResponseText = raw
        trace.calls.push(callTrace)

        const parsed = JSON.parse(raw)

        // Minimal validation
        if (!parsed.next_state || typeof parsed.next_state !== 'string') {
            throw new Error('Invalid next_state')
        }

        console.log("LLM decision:", parsed)

        return finalize(parsed as LLMDecision)

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e)
        callTrace.error = errorMessage
        trace.calls.push(callTrace)
        const fallbackInfo = {used: true, reason: errorMessage} as NonNullable<LLMDecisionTrace['fallback']>
        trace.fallback = fallbackInfo
        console.error('LLM JSON parse error, using smart fallback:', e)

        // Smart keyword-based fallback - mit Template-Variablen
        const callsign = input.variables.callsign || ''

        // Pilot braucht Clearance → ATC muss antworten
        if (pilotText.includes('clearance') || pilotText.includes('request clearance')) {
            fallbackInfo.selected = 'clearance'
            return finalize({
                next_state: 'CD_ISSUE_CLR',
                off_schema: true,
                controller_say_tpl: `{callsign}, cleared to {dest} via {sid} departure, runway {runway}, climb {initial_altitude_ft} feet, squawk {squawk}.`
            })
        }

        // Pilot fragt nach Taxi → ATC muss antworten
        if (pilotText.includes('taxi') || pilotText.includes('pushback')) {
            fallbackInfo.selected = 'taxi'
            return finalize({
                next_state: 'GRD_TAXI_INSTR',
                off_schema: true,
                controller_say_tpl: `{callsign}, taxi to runway {runway} via {taxi_route}, hold short runway {runway}.`
            })
        }

        // Pilot ready for takeoff → ATC muss antworten
        if (pilotText.includes('takeoff') || pilotText.includes('ready')) {
            fallbackInfo.selected = 'takeoff'
            return finalize({
                next_state: 'TWR_TAKEOFF_CLR',
                off_schema: true,
                controller_say_tpl: `{callsign}, wind {remarks}, runway {runway} cleared for take-off.`
            })
        }

        // Pilot readback or acknowledgment → no ATC response required
        if (pilotText.includes('wilco') || pilotText.includes('roger') ||
            pilotText.includes('cleared') || pilotText.includes('copied')) {
            fallbackInfo.selected = 'acknowledge'
            return finalize({
                next_state: input.candidates[0]?.id || 'GEN_NO_REPLY'
                // Keine controller_say_tpl - Pilot hat nur acknowledged
            })
        }

        // Generic fallback - mit Template
        fallbackInfo.selected = 'generic'
        return finalize({
            next_state: 'GEN_NO_REPLY',
            off_schema: true,
            controller_say_tpl: `{callsign}, say again your last transmission.`
        })
    }
}
