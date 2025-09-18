// server/utils/openai.ts
import OpenAI from 'openai'
import { getServerRuntimeConfig } from './runtimeConfig'

let openaiClient: OpenAI | null = null
let cachedModel: string | null = null

function ensureOpenAI(): OpenAI {
    if (!openaiClient) {
        const { openaiKey, openaiProject, llmModel } = getServerRuntimeConfig()
        if (!openaiKey) {
            throw new Error('OPENAI_API_KEY fehlt. Bitte den Schlüssel setzen, bevor KI-Funktionen genutzt werden.')
        }
        const clientOptions: ConstructorParameters<typeof OpenAI>[0] = { apiKey: openaiKey }
        if (openaiProject) {
            clientOptions.project = openaiProject
        }
        openaiClient = new OpenAI(clientOptions)
        cachedModel = llmModel
    }
    return openaiClient
}

function getModel(): string {
    if (!cachedModel) {
        const { llmModel } = getServerRuntimeConfig()
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

export interface LLMDecisionInput {
    state_id: string
    state: any
    candidates: Array<{ id: string; state: any }>
    variables: Record<string, any>
    flags: Record<string, any>
    pilot_utterance: string
}

export interface LLMDecision {
    next_state: string
    updates?: Record<string, any>
    flags?: Record<string, any>
    controller_say_tpl?: string
    off_schema?: boolean
    radio_check?: boolean
}

type ReadbackStatus = 'ok' | 'missing' | 'incorrect' | 'uncertain'

const READBACK_REQUIREMENTS: Record<string, string[]> = {
    CD_READBACK_CHECK: ['dest', 'sid', 'runway', 'initial_altitude_ft', 'squawk']
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
                items: { type: 'string' },
                default: []
            },
            incorrect: {
                type: 'array',
                items: { type: 'string' },
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

const ICAO_LETTERS: Record<string, string> = {
    A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo', F: 'Foxtrot',
    G: 'Golf', H: 'Hotel', I: 'India', J: 'Juliett', K: 'Kilo', L: 'Lima',
    M: 'Mike', N: 'November', O: 'Oscar', P: 'Papa', Q: 'Quebec', R: 'Romeo',
    S: 'Sierra', T: 'Tango', U: 'Uniform', V: 'Victor', W: 'Whiskey',
    X: 'X-ray', Y: 'Yankee', Z: 'Zulu'
}

const ICAO_DIGITS: Record<string, string> = {
    '0': 'zero', '1': 'wun', '2': 'too', '3': 'tree', '4': 'fower',
    '5': 'fife', '6': 'six', '7': 'seven', '8': 'eight', '9': 'niner'
}

function toPhonetic(value: string): string {
    return value
        .toUpperCase()
        .split('')
        .map((ch) => ICAO_LETTERS[ch] || ICAO_DIGITS[ch] || ch)
        .join(' ')
}

function buildSpokenVariants(key: string, value: string): string[] {
    const normalized = String(value ?? '').trim()
    if (!normalized) return []

    const variants = new Set<string>()
    variants.add(normalized)
    variants.add(normalized.toUpperCase())

    if (/^[A-Z]{3,4}$/.test(normalized.toUpperCase())) {
        variants.add(toPhonetic(normalized))
    }

    if (/^\d{4}$/.test(normalized)) {
        variants.add(normalized.split('').join(' '))
        variants.add(normalized.split('').map((d) => ICAO_DIGITS[d] || d).join(' '))
    }

    if (/^\d{1,2}[LCR]?$/i.test(normalized)) {
        const digits = normalized.match(/\d+/)?.[0] ?? ''
        const spelledDigits = digits
            .split('')
            .map((d) => ICAO_DIGITS[d] || d)
            .join(' ')
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
            variants.add(digits.split('').map((d) => ICAO_DIGITS[d] || d).join(' '))
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

// Extrahiere verwendete Variablen aus Templates
function extractTemplateVariables(text?: string): string[] {
    if (!text) return []
    const matches = text.match(/\{([^}]+)\}/g) || []
    return matches.map(match => match.slice(1, -1)) // Remove { }
}

// Optimierte aber ausreichende Eingabe für gute Entscheidungen
function optimizeInputForLLM(input: LLMDecisionInput) {
    // Sammle alle verfügbaren Variablen aus dem Decision Tree
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
        available_variables: availableVariables, // Alle verfügbaren Variablen
        candidate_variables: Array.from(candidateVars), // Variablen die Candidates verwenden
        pilot_utterance: input.pilot_utterance,
        decision_hints: {
            expecting_pilot_call: input.state.role === 'pilot',
            state_auto: input.state.auto ?? null,
            current_unit: input.flags.current_unit,
            has_interrupt_candidate: input.candidates.some(c => c.id.startsWith('INT_')),
            readback_check_state: Boolean(readbackKeys.length)
        },
        // Nur aktueller Context ohne Werte (für Token-Sparen)
        context: {
            callsign: input.variables.callsign,
            current_unit: input.flags.current_unit,
            in_air: input.flags.in_air,
            phase: input.state.phase
        }
    }
}

export async function routeDecision(input: LLMDecisionInput): Promise<LLMDecision> {
    const pilotUtterance = (input.pilot_utterance || '').trim()
    const pilotText = pilotUtterance.toLowerCase()

    async function handleReadbackCheck(): Promise<LLMDecision> {
        const requiredKeys = READBACK_REQUIREMENTS[input.state_id] || input.state.readback_required || []
        const expectedItems = requiredKeys
            .map(key => ({ key, value: input.variables?.[key] }))
            .filter(item => item.value !== undefined && item.value !== null && `${item.value}`.trim().length > 0)
            .map(item => ({
                key: item.key,
                value: String(item.value),
                spoken_variants: buildSpokenVariants(item.key, String(item.value))
            }))

        const okNext = pickTransition(input.state.ok_next, input.candidates)
        const badNext = pickTransition(input.state.bad_next, input.candidates)
        const defaultNext = fallbackNextState(input)

        if (!expectedItems.length) {
            return { next_state: okNext ?? defaultNext }
        }

        const sanitizedPilot = sanitizeForQuickMatch(pilotUtterance)
        const heuristicsOk = expectedItems.every(item => {
            const sanitizedValue = sanitizeForQuickMatch(item.value)
            return sanitizedValue ? sanitizedPilot.includes(sanitizedValue) : true
        })

        if (heuristicsOk && okNext) {
            return { next_state: okNext }
        }

        try {
            const client = ensureOpenAI()
            const model = getModel()
            const payload = {
                state_id: input.state_id,
                callsign: input.variables?.callsign,
                pilot_utterance: pilotUtterance,
                expected_items: expectedItems,
                controller_instruction: input.state.say_tpl ?? null
            }

            const response = await client.chat.completions.create({
                model,
                response_format: { type: 'json_schema', json_schema: READBACK_JSON_SCHEMA },
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
                    { role: 'user', content: JSON.stringify(payload) }
                ]
            })

            const raw = response.choices?.[0]?.message?.content || '{}'
            const parsed = JSON.parse(raw) as { status?: ReadbackStatus }
            const status: ReadbackStatus = parsed.status || 'uncertain'

            if (status === 'ok') {
                return { next_state: okNext ?? defaultNext }
            }

            if ((status === 'missing' || status === 'incorrect') && badNext) {
                return { next_state: badNext }
            }

            if (status === 'uncertain' && okNext) {
                return { next_state: okNext }
            }

            return { next_state: badNext ?? defaultNext }
        } catch (err) {
            console.warn('[ATC] Readback check failed, using fallback:', err)
            return { next_state: okNext ?? defaultNext }
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
            return { next_state: interruptCandidate.id }
        }
    }

    // Sofortige Erkennung ohne LLM für häufige Cases
    if (pilotText.includes('radio check') || pilotText.includes('signal test') ||
        (pilotText.includes('read') && (pilotText.includes('check') || pilotText.includes('you')))) {
        return {
            next_state: input.state_id,
            radio_check: true,
            controller_say_tpl: `${input.variables.callsign}, read you five by five.`
        }
    }

    // Emergency ohne LLM
    if (pilotText.startsWith('mayday') && input.flags.in_air) {
        return { next_state: 'INT_MAYDAY' }
    }
    if (pilotText.startsWith('pan pan') && input.flags.in_air) {
        return { next_state: 'INT_PANPAN' }
    }

    const optimizedInput = optimizeInputForLLM(input)

    // Prüfe ob nächste States ATC-Responses brauchen
    const atcCandidates = input.candidates.filter(c =>
        c.state.role === 'atc' || c.state.say_tpl || c.id.startsWith('INT_')
    )

    // Wenn keine ATC-States verfügbar, einfache Transition ohne Response
    if (atcCandidates.length === 0 && input.candidates.length > 0) {
        return { next_state: input.candidates[0].id }
    }

    // Kompakter aber informativer Prompt - mit Variable-Info für intelligente Responses
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

    try {
        const client = ensureOpenAI()
        const model = getModel()
        const body = {
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user }
            ]
        }

        console.log("calling LLM with body:", body)

        const r = await client.chat.completions.create(body)

        const raw = r.choices?.[0]?.message?.content || '{}'
        const parsed = JSON.parse(raw)

        // Minimal validation
        if (!parsed.next_state || typeof parsed.next_state !== 'string') {
            throw new Error('Invalid next_state')
        }

        console.log("LLM decision:", parsed)

        return parsed as LLMDecision

    } catch (e) {
        console.error('LLM JSON parse error, using smart fallback:', e)

        // Smart keyword-based fallback - mit Template-Variablen
        const callsign = input.variables.callsign || ''

        // Pilot braucht Clearance → ATC muss antworten
        if (pilotText.includes('clearance') || pilotText.includes('request clearance')) {
            return {
                next_state: 'CD_ISSUE_CLR',
                off_schema: true,
                controller_say_tpl: `{callsign}, cleared to {dest} via {sid} departure, runway {runway}, climb {initial_altitude_ft} feet, squawk {squawk}.`
            }
        }

        // Pilot fragt nach Taxi → ATC muss antworten
        if (pilotText.includes('taxi') || pilotText.includes('pushback')) {
            return {
                next_state: 'GRD_TAXI_INSTR',
                off_schema: true,
                controller_say_tpl: `{callsign}, taxi to runway {runway} via {taxi_route}, hold short runway {runway}.`
            }
        }

        // Pilot ready for takeoff → ATC muss antworten
        if (pilotText.includes('takeoff') || pilotText.includes('ready')) {
            return {
                next_state: 'TWR_TAKEOFF_CLR',
                off_schema: true,
                controller_say_tpl: `{callsign}, wind {remarks}, runway {runway} cleared for take-off.`
            }
        }

        // Pilot readback oder acknowledgment → keine ATC response nötig
        if (pilotText.includes('wilco') || pilotText.includes('roger') ||
            pilotText.includes('cleared') || pilotText.includes('copied')) {
            return {
                next_state: input.candidates[0]?.id || 'GEN_NO_REPLY'
                // Keine controller_say_tpl - Pilot hat nur acknowledged
            }
        }

        // Generic fallback - mit Template
        return {
            next_state: 'GEN_NO_REPLY',
            off_schema: true,
            controller_say_tpl: `{callsign}, say again your last transmission.`
        }
    }
}
