// composables/communicationsEngine.ts
import { ref, computed, readonly } from 'vue'
import atcDecisionTree from "./atcDecisionTree";

// --- DecisionTree-Types (aus ~/data/atcDecisionTree.json abgeleitet) ---
type Role = 'pilot' | 'atc' | 'system'
type Phase =
    | 'Preflight' | 'Clearance' | 'PushStart' | 'TaxiOut' | 'Departure'
    | 'Climb' | 'Enroute' | 'Descent' | 'Approach' | 'Landing'
    | 'TaxiIn' | 'Postflight' | 'Interrupt' | 'LostComms' | 'Missed'

interface DTNext { to: string; when?: string }
interface DTHandoff { to: string; freq: string }
interface DTActionSet { set?: string; to?: any; if?: string }

interface DTState {
    id?: string // im JSON sind Keys die IDs — hier zur Bequemlichkeit.
    role: Role
    phase: Phase
    // Texte
    say_tpl?: string
    utterance_tpl?: string
    else_say_tpl?: string
    // Routing
    next?: DTNext[]
    ok_next?: DTNext[]
    bad_next?: DTNext[]
    timer_next?: { after_s: number; to: string }[]
    handoff?: DTHandoff
    condition?: string
    guard?: string
    trigger?: string
    auto?: 'check_readback' | 'monitor' | 'end' | 'pop_stack_or_route_by_intent'
    readback_required?: string[]
    actions?: (DTActionSet | string)[]
}

interface DecisionTree {
    schema_version: string
    name: string
    description: string
    start_state: string
    end_states: string[]
    variables: Record<string, any>
    flags: {
        in_air: boolean
        emergency_active: boolean
        current_unit: string
        stack: string[]
    }
    policies: {
        timeouts: {
            pilot_readback_timeout_s: number
            controller_ack_timeout_s: number
            no_reply_retry_after_s: number
            no_reply_max_retries: number
            lost_comms_detect_after_s: number
        }
        no_reply_sequence: { after_s: number; controller_say_tpl: string }[]
        interrupts_allowed_when: Record<string, string>
    }
    hooks: Record<string, boolean | string>
    roles: Role[]
    phases: Phase[]
    states: Record<string, DTState>
}

// --- ATC Decition Tree laden ---

// ----------------- Public API / Kontext -----------------
export interface FlightContext {
    callsign: string
    aircraft: string
    dep: string
    dest: string
    stand: string
    runway: string
    squawk: string
    atis_code: string
    sid: string
    transition: string
    flight_level: string // z.B. "FL360"
    ground_freq: string
    tower_freq: string
    departure_freq: string
    approach_freq: string
    handoff_freq: string
    qnh_hpa: number | string
    taxi_route: string
    remarks?: string
    time_now?: string
    // intern
    lastTransmission?: string
    awaitingResponse?: boolean
}

export interface EngineLog {
    timestamp: Date
    frequency?: string
    speaker: Role
    message: string
    normalized: string
    state: string
}

// ----------------- NATO/ICAO Normalizer -----------------
const NATO_PHONETIC: Record<string, string> = {
    A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo', F: 'Foxtrot',
    G: 'Golf', H: 'Hotel', I: 'India', J: 'Juliett', K: 'Kilo', L: 'Lima',
    M: 'Mike', N: 'November', O: 'Oscar', P: 'Papa', Q: 'Quebec', R: 'Romeo',
    S: 'Sierra', T: 'Tango', U: 'Uniform', V: 'Victor', W: 'Whiskey',
    X: 'X-ray', Y: 'Yankee', Z: 'Zulu'
}
const ICAO_NUMBERS: Record<string, string> = {
    '0': 'zero', '1': 'wun', '2': 'too', '3': 'tree', '4': 'fower',
    '5': 'fife', '6': 'six', '7': 'seven', '8': 'eight', '9': 'niner'
}

function normalizeAltitude(altitude: number): string {
    if (altitude >= 1000) {
        const thousands = Math.floor(altitude / 1000).toString().split('').map(d => ICAO_NUMBERS[d] || d).join(' ')
        const remainder = altitude % 1000
        return remainder > 0 ? `${thousands} thousand ${remainder}` : `${thousands} thousand`
    }
    return altitude.toString()
}

export function normalizeATCText(text: string, context: Record<string, any>): string {
    let normalized = renderTpl(text, context)

    // runway 25L → two five left
    normalized = normalized.replace(/runway\s+(\d{1,2})([LRC]?)/gi, (_, num: string, suffix: string) => {
        const n = num.split('').map(d => ICAO_NUMBERS[d] || d).join(' ')
        const s = suffix === 'L' ? ' left' : suffix === 'R' ? ' right' : suffix === 'C' ? ' center' : ''
        return `runway ${n}${s}`
    })

    // FL350 → flight level three five zero
    normalized = normalized.replace(/FL(\d{3})/gi, (_, lvl: string) => {
        const n = lvl.split('').map(d => ICAO_NUMBERS[d] || d).join(' ')
        return `flight level ${n}`
    })

    // 5000 ft → five thousand
    normalized = normalized.replace(/\b(\d{1,5})\s*(?:feet?|ft)\b/gi, (_, alt: string) => normalizeAltitude(parseInt(alt)))

    // 121.9 → wun too wun decimal niner
    normalized = normalized.replace(/(\d{3})\.(\d{1,3})/g, (_, a: string, b: string) => {
        const A = a.split('').map(d => ICAO_NUMBERS[d] || d).join(' ')
        const B = b.split('').map(d => ICAO_NUMBERS[d] || d).join(' ')
        return `${A} decimal ${B}`
    })

    // squawk 4567 → fower fife six seven
    normalized = normalized.replace(/squawk\s+(\d{4})/gi, (_, code: string) => {
        const n = code.split('').map(d => ICAO_NUMBERS[d] || d).join(' ')
        return `squawk ${n}`
    })

    // heading 270 → heading two seven zero
    normalized = normalized.replace(/heading\s+(\d{3})/gi, (_, hdg: string) => {
        const n = hdg.split('').map(d => ICAO_NUMBERS[d] || d).join(' ')
        return `heading ${n}`
    })

    // via A, B5 → via Alpha, Bravo five
    normalized = normalized.replace(/via\s+([A-Z](?:\d+)?(?:\s*,\s*[A-Z](?:\d+)?)*)/gi, (_, route: string) => {
        const parts = route.split(/\s*,\s*/).map(seg =>
            seg.replace(/([A-Z])(\d+)?/g, (_m, L: string, N?: string) => {
                const letter = NATO_PHONETIC[L] || L
                const number = N ? N.split('').map(d => ICAO_NUMBERS[d] || d).join(' ') : ''
                return number ? `${letter} ${number}` : letter
            })
        )
        return `via ${parts.join(', ')}`
    })

    // A5 → Alpha five
    normalized = normalized.replace(/\b([A-Z])(\d+)\b/g, (_m, L: string, N: string) => {
        const letter = NATO_PHONETIC[L] || L
        const number = N.split('').map(d => ICAO_NUMBERS[d] || d).join(' ')
        return `${letter} ${number}`
    })

    // 280/15 → two eight zero at wun fife
    normalized = normalized.replace(/(\d{3})\/(\d{1,2})/g, (_m, d: string, s: string) => {
        const D = d.split('').map(x => ICAO_NUMBERS[x] || x).join(' ')
        const S = s.split('').map(x => ICAO_NUMBERS[x] || x).join(' ')
        return `${D} at ${S}`
    })

    return normalized
}

// ----------------- Template-Renderer -----------------
function renderTpl(tpl: string, ctx: Record<string, any>): string {
    return tpl.replace(/\{([\w.]+)\}/g, (_m, key) => {
        // Variablen können z.B. variables.callsign oder flags.in_air sein
        const parts = key.split('.')
        let cur: any = ctx
        for (const p of parts) cur = cur?.[p]
        return (cur ?? '').toString()
    })
}

// ----------------- Engine -----------------
export default function useCommunicationsEngine() {
    // Decision Tree in-Memory
    const tree = ref<DecisionTree>(atcDecisionTree as DecisionTree)
    const states = computed<Record<string, DTState>>(() => tree.value.states)

    // Laufzeitkontext
    const variables = ref<Record<string, any>>({ ...tree.value.variables })
    const flags = ref({ ...tree.value.flags })
    const currentStateId = ref<string>(tree.value.start_state)

    const communicationLog = ref<EngineLog[]>([])

    const currentState = computed<DTState>(() => {
        const s = states.value[currentStateId.value]
        return { ...s, id: currentStateId.value }
    })

    const nextCandidates = computed<string[]>(() => {
        const s = currentState.value
        const nxt = [
            ...(s.next ?? []),
            ...(s.ok_next ?? []),
            ...(s.bad_next ?? []),
            ...(s.timer_next?.map(t => ({ to: t.to })) ?? [])
        ].map(x => x.to)
        // uniq
        return Array.from(new Set(nxt))
    })

    // Frequenz aus Variablen (Controller-Einheit) ableiten
    const activeFrequency = computed<string | undefined>(() => {
        switch (flags.value.current_unit) {
            case 'DEL': return renderTpl('{variables.delivery_freq}', { variables: variables.value })
            case 'GROUND': return renderTpl('{variables.ground_freq}', { variables: variables.value })
            case 'TOWER': return renderTpl('{variables.tower_freq}', { variables: variables.value })
            case 'DEP': return renderTpl('{variables.departure_freq}', { variables: variables.value })
            case 'APP': return renderTpl('{variables.approach_freq}', { variables: variables.value })
            case 'CTR': return renderTpl('{variables.handoff_freq}', { variables: variables.value })
            default: return undefined
        }
    })

    // ---------- öffentliche API ----------
    function initializeFlight(fpl: any) {
        variables.value = {
            ...variables.value,
            callsign: fpl.callsign,
            acf_type: fpl.aircraft?.split('/')[0] || 'A320',
            dep: fpl.dep || fpl.departure || 'EDDF',
            dest: fpl.arr || fpl.arrival || 'EDDM',
            stand: genStand(),
            runway: genRunway(),
            squawk: fpl.assignedsquawk || genSquawk(),
            atis_code: genATIS(),
            sid: genSID(fpl.route || ''),
            transition: 'DCT',
            cruise_flight_level: fpl.altitude ? `FL${String(Math.floor(parseInt(fpl.altitude) / 100)).padStart(3, '0')}` : 'FL360',
            initial_altitude_ft: 5000,
            climb_altitude_ft: 7000,
            star: 'RNAV X',
            approach_type: 'ILS Z',
            taxi_route: 'A, V',
            delivery_freq: '121.900',
            ground_freq: '121.700',
            tower_freq: '118.700',
            departure_freq: '125.350',
            approach_freq: '120.800',
            handoff_freq: '121.800',
            qnh_hpa: 1015,
            remarks: 'standard',
            time_now: new Date().toISOString()
        }
        flags.value = { ...flags.value, in_air: false, emergency_active: false, current_unit: 'DEL', stack: [] }
        currentStateId.value = tree.value.start_state
        communicationLog.value = []
    }

    // Pilot-Input verarbeiten → LLM bekommt State + Candidates
    function buildLLMContext(pilotTranscript: string) {
        const s = currentState.value
        return {
            state_id: s.id,
            state: s,
            candidates: nextCandidates.value.map(id => ({ id, state: states.value[id] })),
            variables: variables.value,
            flags: flags.value,
            pilot_utterance: pilotTranscript
        }
    }

    // LLM-Entscheidung anwenden
    function applyLLMDecision(decision: { next_state: string; updates?: Record<string, any>; flags?: Record<string, any>; controller_say_tpl?: string }) {
        // Variablen/Flags updaten
        if (decision.updates) Object.assign(variables.value, decision.updates)
        if (decision.flags) Object.assign(flags.value, decision.flags)
        // ggf. ATC sagt etwas sofort (z.B. Reminders)
        if (decision.controller_say_tpl) {
            speak('atc', decision.controller_say_tpl, currentStateId.value)
        }
        moveTo(decision.next_state)
    }

    // Direkter Pilotenspruch → einfache Router-Heuristik (Interrupts/Readbacks). Für echte Logik nutzt ihr LLM:
    function processPilotTransmission(transcript: string) {
        // Interrupt-Shortcuts (nur in der Luft)
        const t = transcript.toLowerCase()
        if (flags.value.in_air && /^(mayday|pan\s*pan)/.test(t)) {
            const intId = t.startsWith('mayday') ? 'INT_MAYDAY' : 'INT_PANPAN'
            moveTo(intId)
            speak('pilot', transcript, intId)
            return
        }

        // Standard: Loggen & LLM-Context anbieten
        speak('pilot', transcript, currentStateId.value)
    }

    // Zum State springen und Auto-Aktionen ausführen
    function moveTo(stateId: string) {
        if (!states.value[stateId]) return
        // Stack-Mechanik (vereinfacht): Interrupts pushen aktuellen State
        if (stateId.startsWith('INT_')) flags.value.stack.push(currentStateId.value)

        currentStateId.value = stateId
        const s = currentState.value

        // Actions ausführen (nur SET/IF minimal)
        for (const act of s.actions ?? []) {
            if (typeof act === 'string') continue
            if (act.if && !safeEvalBoolean(act.if)) continue
            if (act.set) setByPath({ variables: variables.value, flags: flags.value }, act.set, act.to)
        }

        // Handoff → Frequenz/Unit setzen
        if (s.handoff?.to) {
            flags.value.current_unit = unitFromHandoff(s.handoff.to)
            if (s.handoff.freq) {
                // Frequenz ins variables-Objekt aufnehmen, falls dynamisch
                variables.value.handoff_freq = renderTpl(s.handoff.freq, { ...exposeCtx() })
            }
        }

        // Auto-Say (ATC/System)
        if (s.say_tpl) speak(s.role, s.say_tpl, s.id!)

        // Auto-Ende / Monitor / Check-Readback werden vom LLM/Client gesteuert.
    }

    // Letzten Flow wieder aufnehmen (z.B. nach Interrupt)
    function resumePriorFlow() {
        const prev = flags.value.stack.pop()
        if (prev) moveTo(prev)
    }

    // Hilfsfunktionen
    function speak(speaker: Role, tpl: string, stateId: string) {
        const msg = renderTpl(tpl, exposeCtx())
        communicationLog.value.push({
            timestamp: new Date(),
            frequency: activeFrequency.value,
            speaker,
            message: msg,
            normalized: normalizeATCText(msg, exposeCtxFlat()),
            state: stateId
        })
    }

    function exposeCtx() {
        return { variables: variables.value, flags: flags.value }
    }
    function exposeCtxFlat() {
        // Für den Normalizer wollen wir einfache Platzhalter-Namen
        return {
            ...variables.value,
            ...flags.value
        }
    }

    function unitFromHandoff(to: string) {
        if (/GROUND/i.test(to)) return 'GROUND'
        if (/TOWER/i.test(to)) return 'TOWER'
        if (/DEPART/i.test(to)) return 'DEP'
        if (/APPROACH/i.test(to)) return 'APP'
        if (/CENTER|CTR/i.test(to)) return 'CTR'
        if (/DEL|DELIVERY/i.test(to)) return 'DEL'
        return flags.value.current_unit
    }

    function genStand() {
        const arr = ['A12','B15','C23','D8','E41','F18','G7','H33']
        return arr[Math.floor(Math.random() * arr.length)]
    }
    function genRunway() {
        const arr = ['25L','25R','07L','07R','18','36','09','27']
        return arr[Math.floor(Math.random() * arr.length)]
    }
    function genSquawk() {
        return String(Math.floor(Math.random() * 8000 + 1000)).padStart(4, '0')
    }
    function genATIS() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        return letters[Math.floor(Math.random() * letters.length)]
    }
    function genSID(_route: string) {
        const sids = ['SULUS5S', 'TOBAK2E', 'MARUN7F', 'CINDY1A', 'HELEN4B']
        return sids[Math.floor(Math.random() * sids.length)]
    }

    // einfache bool-Guards (nur Variablen/Flags, keine eval unsicherer Ausdrücke)
    function safeEvalBoolean(expr?: string): boolean {
        if (!expr) return true
        // sehr einfache Auswertung: flags.in_air === true
        const m = expr.match(/^(variables|flags)\.([A-Za-z0-9_]+)\s*===\s*(true|false|'[^']*'|"[^"]*"|\d+)$/)
        if (!m) return false
        const bag = m[1] === 'variables' ? variables.value : flags.value as any
        const key = m[2]
        const rhsRaw = m[3]
        let rhs: any = rhsRaw
        if (rhsRaw === 'true') rhs = true
        else if (rhsRaw === 'false') rhs = false
        else if (/^\d+$/.test(rhsRaw)) rhs = Number(rhsRaw)
        else rhs = rhsRaw.replace(/^['"]|['"]$/g, '')
        return bag?.[key] === rhs
    }

    function setByPath(root: Record<string, any>, path: string, val: any) {
        const parts = path.split('.')
        let cur = root
        for (let i = 0; i < parts.length - 1; i++) {
            const p = parts[i]
            if (!(p in cur)) cur[p] = {}
            cur = cur[p]
        }
        cur[parts[parts.length - 1]] = val
    }

    return {
        // state/vars/flags
        currentState: computed(() => currentState.value),
        currentStateId: readonly(currentStateId),
        variables: readonly(variables),
        flags: readonly(flags),
        nextCandidates,
        activeFrequency,
        communicationLog: readonly(communicationLog),

        // lifecycle
        initializeFlight,

        // Pilot in → baut Kontext für LLM
        processPilotTransmission,
        buildLLMContext,
        applyLLMDecision,

        // Flow-Steuerung
        moveTo,
        resumePriorFlow,

        // utils
        normalizeATCText
    }
}
