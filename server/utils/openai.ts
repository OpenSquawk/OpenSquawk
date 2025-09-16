// server/utils/openai.ts
import OpenAI from 'openai'

const MODEL = process.env.LLM_MODEL || 'gpt-5-nano'
export const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY!})

export async function decide(system: string, user: string): Promise<string> {
    const r = await openai.chat.completions.create({
        model: MODEL,
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

// Optimierte aber ausreichende Eingabe für gute Entscheidungen
function optimizeInputForLLM(input: LLMDecisionInput) {
    // Nur relevante Candidate-Daten (reduziert aber nicht zu stark)
    const candidates = input.candidates.map(c => ({
        id: c.id,
        role: c.state.role,
        phase: c.state.phase,
        say_tpl: c.state.say_tpl ? c.state.say_tpl.substring(0, 100) : undefined // Gekürzt auf 100 Zeichen
    }))

    // Wichtige Variablen für Context
    const essentials = {
        callsign: input.variables.callsign,
        dep: input.variables.dep,
        dest: input.variables.dest,
        runway: input.variables.runway,
        squawk: input.variables.squawk,
        current_unit: input.flags.current_unit,
        in_air: input.flags.in_air
    }

    return {
        state_id: input.state_id,
        current_phase: input.state.phase,
        current_role: input.state.role,
        candidates: candidates,
        context: essentials,
        pilot_utterance: input.pilot_utterance
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

    // Kompakter aber informativer Prompt - nur ATC responses wenn nötig
    const system = [
        'You are an ATC state router. Return strict JSON.',
        'Keys: next_state, controller_say_tpl (optional), off_schema (optional).',
        '',
        'ROUTING: Pick next_state from candidates[].id when pilot matches expected flow.',
        'ATC RESPONSES: Only include controller_say_tpl if:',
        '- Next state role is "atc" OR has say_tpl',
        '- OR off_schema=true (pilot needs response but no candidate fits)',
        '- OR pilot needs acknowledgment/correction',
        '',
        'PILOT STATES: If next state role is "pilot", NO controller_say_tpl needed.',
        'DEFAULT: Use "GEN_NO_REPLY" if unclear.',
        '',
        'Use proper ATC phraseology when controller_say_tpl is included.'
    ].join(' ')

    // Update optimized input to indicate which candidates need ATC responses
    optimizedInput.atc_candidates = atcCandidates.map(c => c.id)

    const user = JSON.stringify(optimizedInput)

    try {
        const r = await openai.chat.completions.create({
            model: MODEL,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user }
            ]
        })

        const raw = r.choices?.[0]?.message?.content || '{}'
        const parsed = JSON.parse(raw)

        // Minimal validation
        if (!parsed.next_state || typeof parsed.next_state !== 'string') {
            throw new Error('Invalid next_state')
        }

        return parsed as LLMDecision

    } catch (e) {
        console.error('LLM JSON parse error, using smart fallback:', e)

        // Smart keyword-based fallback - nur ATC response wenn nötig
        const callsign = input.variables.callsign || ''

        // Pilot braucht Clearance → ATC muss antworten
        if (pilotText.includes('clearance') || pilotText.includes('request clearance')) {
            return {
                next_state: 'CD_ISSUE_CLR',
                off_schema: true,
                controller_say_tpl: `${callsign}, standby for clearance.`
            }
        }

        // Pilot fragt nach Taxi → ATC muss antworten
        if (pilotText.includes('taxi') || pilotText.includes('pushback')) {
            return {
                next_state: 'GRD_TAXI_INSTR',
                off_schema: true,
                controller_say_tpl: `${callsign}, standby for taxi instructions.`
            }
        }

        // Pilot ready for takeoff → ATC muss antworten
        if (pilotText.includes('takeoff') || pilotText.includes('ready')) {
            return {
                next_state: 'TWR_TAKEOFF_CLR',
                off_schema: true,
                controller_say_tpl: `${callsign}, standby for takeoff clearance.`
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

        // Generic fallback - nur response wenn unklar was pilot will
        return {
            next_state: 'GEN_NO_REPLY',
            off_schema: true,
            controller_say_tpl: `${callsign}, say again your last transmission.`
        }
    }
}
