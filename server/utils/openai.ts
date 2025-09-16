// server/utils/openai.ts
import OpenAI from 'openai'

const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini'
export const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY!})

export async function decide(system: string, user: string): Promise<string> {
    const body = {
        model: MODEL,
        response_format: {type: 'text'},
        messages: [
            {role: 'system', content: system},
            {role: 'user', content: user}
        ],
    }
    console.log('OpenAI request:', body)
    const r = await openai.chat.completions.create(body)
    console.log('OpenAI response:', r)
    return r.choices?.[0]?.message?.content?.trim() || ''
}

/** Typen wie im Frontend */
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
    off_schema?: boolean // Flag wenn LLM frei geantwortet hat
    radio_check?: boolean // Flag für Radio Check
}

// Token-optimierte Eingabe für OpenAI
function optimizeInputForLLM(input: LLMDecisionInput) {
    // Nur relevante Candidate-Daten senden
    const candidates = input.candidates.map(c => ({
        id: c.id,
        role: c.state.role,
        phase: c.state.phase,
        say_tpl: c.state.say_tpl,
        utterance_tpl: c.state.utterance_tpl
    }))

    // Nur wichtige Variablen senden
    const relevantVars = {
        callsign: input.variables.callsign,
        dep: input.variables.dep,
        dest: input.variables.dest,
        runway: input.variables.runway,
        squawk: input.variables.squawk,
        current_frequency: input.variables[`${input.flags.current_unit?.toLowerCase()}_freq`]
    }

    return {
        state_id: input.state_id,
        current_role: input.state.role,
        current_phase: input.state.phase,
        candidates: candidates,
        variables: relevantVars,
        flags: input.flags,
        pilot_utterance: input.pilot_utterance
    }
}

export async function routeDecision(input: LLMDecisionInput): Promise<LLMDecision> {
    const optimizedInput = optimizeInputForLLM(input)

    const system = [
        'You are an ATC state router with flexible response capability.',
        'Return STRICT JSON with keys: next_state (string), optional updates (object), flags (object), controller_say_tpl (string), off_schema (boolean), radio_check (boolean).',
        '',
        'PRIMARY ROUTING:',
        '- Pick next_state from candidates[].id when pilot utterance matches expected flow',
        '- Use "RESUME_PRIOR_FLOW" to return from interrupts',
        '- Use "GEN_NO_REPLY" if pilot did not respond clearly',
        '',
        'SPECIAL CASES:',
        '- RADIO CHECK: If pilot says "radio check" or requests signal test, set radio_check=true and respond with appropriate signal strength',
        '- OFF-SCHEMA: If pilot says something that doesn\'t match any candidate but requires ATC response, set off_schema=true and provide appropriate controller_say_tpl',
        '',
        'INTERRUPTS (only if flags.in_air === true):',
        '- "INT_MAYDAY" for MAYDAY emergencies',
        '- "INT_PANPAN" for PAN-PAN situations',
        '',
        'RESPONSE GENERATION:',
        '- Always use proper ATC phraseology in controller_say_tpl',
        '- Include callsign and relevant flight data',
        '- Keep responses professional and concise',
        '',
        'If uncertain, prefer appropriate ATC response over silence.'
    ].join(' ')

    const user = JSON.stringify(optimizedInput)

    const body = {
        model: MODEL,
        response_format: {type: 'json_object'},
        messages: [
            {role: 'system', content: system},
            {role: 'user', content: user}
        ],
    }

    const r = await openai.chat.completions.create(body)
    console.log('OpenAI router response:', r)

    const raw = r.choices?.[0]?.message?.content || '{}'
    try {
        const parsed = JSON.parse(raw)

        // Minimal-Check
        if (!parsed.next_state || typeof parsed.next_state !== 'string') {
            throw new Error('Missing next_state')
        }

        // Radio Check Handling
        if (parsed.radio_check) {
            const callsign = input.variables.callsign || ''
            const freq = optimizedInput.variables.current_frequency || ''
            parsed.controller_say_tpl = `${callsign}, ${freq}, read you five by five.`
        }

        return parsed as LLMDecision
    } catch (e) {
        console.error('LLM JSON parse error:', e)

        // Fallback: Check for radio check in pilot utterance
        const pilotText = input.pilot_utterance.toLowerCase()
        if (pilotText.includes('radio check') || pilotText.includes('signal') || pilotText.includes('read')) {
            const callsign = input.variables.callsign || ''
            return {
                next_state: input.state_id, // Stay in current state
                radio_check: true,
                controller_say_tpl: `${callsign}, read you five by five.`
            }
        }

        // Standard fallback
        return {next_state: 'GEN_NO_REPLY'}
    }
}
