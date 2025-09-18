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

    // Relevante Candidate-Daten mit Template-Variablen
    const candidates = input.candidates.map(c => {
        const templateVars = extractTemplateVariables(c.state.say_tpl)
        return {
            id: c.id,
            role: c.state.role,
            phase: c.state.phase,
            template_vars: templateVars // Welche Variablen dieser State verwendet
        }
    })

    // Sammle alle Template-Variablen aus den Candidates
    const candidateVars = new Set<string>()
    candidates.forEach(c => c.template_vars?.forEach(v => candidateVars.add(v)))

    return {
        state_id: input.state_id,
        current_phase: input.state.phase,
        current_role: input.state.role,
        candidates: candidates,
        available_variables: availableVariables, // Alle verfügbaren Variablen
        candidate_variables: Array.from(candidateVars), // Variablen die Candidates verwenden
        pilot_utterance: input.pilot_utterance,
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
    const pilotText = input.pilot_utterance.toLowerCase().trim()

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
        'Keys: next_state, controller_say_tpl (optional), off_schema (optional).',
        '',
        'ROUTING: Pick next_state from candidates[].id when pilot matches expected flow.',
        'ATC RESPONSES: Only include controller_say_tpl if:',
        '- Next state role is "atc" OR has template_vars',
        '- OR off_schema=true (pilot needs response but no candidate fits)',
        '- OR pilot needs acknowledgment/correction',
        '',
        'TEMPLATE VARIABLES: When generating controller_say_tpl, you can use these variables:',
        `Available: {${optimizedInput.available_variables.join('}, {')}}`,
        `Common in candidates: {${optimizedInput.candidate_variables.join('}, {')}}`,
        'Always include {callsign} in ATC responses. Use variables like {runway}, {squawk}, {dest} as needed.',
        '',
        'PILOT STATES: If next state role is "pilot", NO controller_say_tpl needed.',
        'DEFAULT: Use "GEN_NO_REPLY" if unclear.',
        '',
        'Examples: "{callsign}, taxi to runway {runway} via {taxi_route}"',
        '"{callsign}, cleared to {dest} via {sid} departure, squawk {squawk}"'
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
