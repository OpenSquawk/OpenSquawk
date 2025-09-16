// server/utils/openai.ts
import OpenAI from 'openai'

// Nutzt OPENAI_API_KEY & LLM_MODEL aus Env
const MODEL = process.env.LLM_MODEL || 'gpt-5-nano'
export const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY!})

/**
 * Einfache Chat-Hülle, die reinen Text zurückgibt (z.B. für Debug/sonstige Server-Prompts).
 * WARNING: Client darf diese Funktion NICHT direkt importieren. Nur serverseitig nutzen.
 */
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
    const r = await openai.chat.completions.create()
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
}

/**
 * Router-Entscheidung: Erzwingt JSON-Ausgabe.
 * Wähle NUR aus candidates[].id (Ausnahmen: RESUME_PRIOR_FLOW, GEN_NO_REPLY,
 * INT_* nur wenn Guards erfüllt – v.a. MAYDAY/PANPAN nur in-air).
 */
export async function routeDecision(input: LLMDecisionInput): Promise<LLMDecision> {
    const system = [
        'You are an ATC state router.',
        'Return STRICT JSON with keys: next_state (string), optional updates (object), flags (object), controller_say_tpl (string).',
        'Pick next_state ONLY from input.candidates[].id.',
        'Allowed exceptions:',
        '- "RESUME_PRIOR_FLOW" to return from interrupts.',
        '- "GEN_NO_REPLY" if pilot did not respond / mismatch.',
        '- Interrupts "INT_MAYDAY" / "INT_PANPAN" only if input.flags.in_air === true.',
        'If nothing matches, prefer "GEN_NO_REPLY".',
        'Do NOT invent IDs. Keep updates minimal (only variables used in templates).',
    ].join(' ')

    const user = JSON.stringify(input)

    const body = {
        model: MODEL,
        // JSON-Ausgabe erzwingen
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
        return parsed as LLMDecision
    } catch (e) {
        // Fallback: sichere Default-Transition
        return {next_state: 'GEN_NO_REPLY'}
    }
}
