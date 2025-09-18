// composables/communicationsEngine.ts
import { ref, computed, readonly } from 'vue'
import atcDecisionTree from "../data/atcDecisionTree";

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
    id?: string
    role: Role
    phase: Phase
    say_tpl?: string
    utterance_tpl?: string
    else_say_tpl?: string
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
    frequency?: string // Für einfachere Freq-Zugriffe
    frequencyName?: string // Name der Frequenz (DEL, GND, TWR, etc.)
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
        off_schema_count: number // Zähler für Off-Schema Antworten
        radio_checks_done: number // Zähler für Radio Checks
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

// Flight Phases und Communication Steps für bessere Integration
export const FLIGHT_PHASES = [
    { id: 'clearance', name: 'Clearance Delivery', frequency: '121.900', action: 'Request IFR clearance' },
    { id: 'ground', name: 'Ground Control', frequency: '121.700', action: 'Request pushback and taxi' },
    { id: 'tower', name: 'Tower', frequency: '118.700', action: 'Request takeoff clearance' },
    { id: 'departure', name: 'Departure', frequency: '125.350', action: 'Initial contact after takeoff' },
    { id: 'enroute', name: 'Center', frequency: '121.800', action: 'Cruise flight monitoring' },
    { id: 'approach', name: 'Approach', frequency: '120.800', action: 'Approach clearance' },
    { id: 'landing', name: 'Tower (Landing)', frequency: '118.700', action: 'Landing clearance' },
    { id: 'taxiin', name: 'Ground (Taxi In)', frequency: '121.700', action: 'Taxi to gate' }
]

export const COMMUNICATION_STEPS = [
    {
        id: 'cd_request',
        phase: 'clearance',
        trigger: 'pilot',
        frequency: '121.900',
        frequencyName: 'Clearance Delivery',
        pilot: '{callsign} information {atis_code}, IFR to {dest}, stand {stand}, request clearance.',
        atc: '{callsign}, cleared to {dest} via {sid} departure, runway {runway}, climb {initial_altitude_ft} feet, squawk {squawk}.',
        pilotResponse: '{callsign} cleared {dest} via {sid}, runway {runway}, climb {initial_altitude_ft}, squawk {squawk}.'
    }
    // Weitere Steps können hier definiert werden
]

// --- ATC Decision Tree laden ---
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
    flight_level: string
    ground_freq: string
    tower_freq: string
    departure_freq: string
    approach_freq: string
    handoff_freq: string
    qnh_hpa: number | string
    taxi_route: string
    remarks?: string
    time_now?: string
    phase: string
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
    radioCheck?: boolean
    offSchema?: boolean
    readback?: {
        stateId: string
        required: string[]
        missing: string[]
        correct: boolean
    }
}

interface PendingReadback {
    stateId: string
    required: string[]
    expected: Record<string, string>
    anchorIndex?: number
    lastEntryIndex?: number
    lastResult?: {
        missing: string[]
        correct: boolean
    }
}

interface ReadbackResult {
    stateId: string
    entryIndex: number
    required: string[]
    missing: string[]
    correct: boolean
}

// NATO/ICAO Normalizer (gekürzt für bessere Performance)
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

const ENGLISH_DIGITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'] as const
const TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'] as const
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'] as const
const ICAO_WORD_REPLACEMENTS: Record<string, string> = {
    one: 'wun',
    two: 'too',
    three: 'tree',
    four: 'fower',
    five: 'fife',
    six: 'six',
    seven: 'seven',
    eight: 'eight',
    nine: 'niner',
    zero: 'zero'
}

export function normalizeATCText(text: string, context: Record<string, any>): string {
    let normalized = renderTpl(text, context)

    // Runway normalization
    normalized = normalized.replace(/runway\s+(\d{1,2})([LRC]?)/gi, (_, num: string, suffix: string) => {
        const n = num.split('').map(d => ICAO_NUMBERS[d] || d).join(' ')
        const s = suffix === 'L' ? ' left' : suffix === 'R' ? ' right' : suffix === 'C' ? ' center' : ''
        return `runway ${n}${s}`
    })

    // Flight Level
    normalized = normalized.replace(/FL(\d{3})/gi, (_, lvl: string) => {
        const n = lvl.split('').map(d => ICAO_NUMBERS[d] || d).join(' ')
        return `flight level ${n}`
    })

    // Frequency normalization
    normalized = normalized.replace(/(\d{3})\.(\d{1,3})/g, (_, a: string, b: string) => {
        const A = a.split('').map(d => ICAO_NUMBERS[d] || d).join(' ')
        const B = b.split('').map(d => ICAO_NUMBERS[d] || d).join(' ')
        return `${A} decimal ${B}`
    })

    // Squawk codes
    normalized = normalized.replace(/squawk\s+(\d{4})/gi, (_, code: string) => {
        const n = code.split('').map(d => ICAO_NUMBERS[d] || d).join(' ')
        return `squawk ${n}`
    })

    return normalized
}

function renderTpl(tpl: string, ctx: Record<string, any>): string {
    return tpl.replace(/\{([\w.]+)\}/g, (_m, key) => {
        const parts = key.split('.')
        let cur: any = ctx
        for (const p of parts) cur = cur?.[p]
        return (cur ?? '').toString()
    })
}

export default function useCommunicationsEngine() {
    const tree = ref<DecisionTree>({
        ...atcDecisionTree as DecisionTree,
        flags: {
            ...atcDecisionTree.flags,
            off_schema_count: 0,
            radio_checks_done: 0
        }
    })

    const states = computed<Record<string, DTState>>(() => tree.value.states)

    const variables = ref<Record<string, any>>({ ...tree.value.variables })
    const flags = ref({ ...tree.value.flags })
    const currentStateId = ref<string>(tree.value.start_state)
    const communicationLog = ref<EngineLog[]>([])
    const pendingReadback = ref<PendingReadback | null>(null)
    const lastReadbackResult = ref<ReadbackResult | null>(null)

    // Flight Context für bessere Integration mit pm_alt.vue Stil
    const flightContext = ref<FlightContext>({
        callsign: '',
        aircraft: 'A320',
        dep: 'EDDF',
        dest: 'EDDM',
        stand: 'A12',
        runway: '25R',
        squawk: '1234',
        atis_code: 'K',
        sid: 'ANEKI7S',
        transition: 'ANEKI',
        flight_level: 'FL360',
        ground_freq: '121.700',
        tower_freq: '118.700',
        departure_freq: '125.350',
        approach_freq: '120.800',
        handoff_freq: '121.800',
        qnh_hpa: 1015,
        taxi_route: 'A, V',
        phase: 'clearance'
    })

    const currentState = computed<DTState>(() => {
        const s = states.value[currentStateId.value] || states.value[tree.value.start_state]
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
        return Array.from(new Set(nxt))
    })

    const activeFrequency = computed<string | undefined>(() => {
        switch (flags.value.current_unit) {
            case 'DEL': return variables.value.delivery_freq
            case 'GROUND': return variables.value.ground_freq
            case 'TOWER': return variables.value.tower_freq
            case 'DEP': return variables.value.departure_freq
            case 'APP': return variables.value.approach_freq
            case 'CTR': return variables.value.handoff_freq
            default: return undefined
        }
    })

    // Current Step für pm_alt.vue Integration
    const currentStep = computed(() => {
        const phase = flightContext.value.phase
        const step = COMMUNICATION_STEPS.find(s => s.phase === phase)
        if (step) {
            return {
                ...step,
                pilot: renderTpl(step.pilot, { ...variables.value, ...flags.value }),
                atc: step.atc ? renderTpl(step.atc, { ...variables.value, ...flags.value }) : undefined,
                pilotResponse: step.pilotResponse ? renderTpl(step.pilotResponse, { ...variables.value, ...flags.value }) : undefined
            }
        }
        return null
    })

    function initializeFlight(fpl: any) {
        // Variablen setzen
        variables.value = {
            ...variables.value,
            callsign: fpl.callsign || fpl.callsign,
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
            taxi_route: 'A, V',
            delivery_freq: '121.900',
            ground_freq: '121.700',
            tower_freq: '118.700',
            departure_freq: '125.350',
            approach_freq: '120.800',
            handoff_freq: '121.800',
            qnh_hpa: 1015,
            push_delay_min: 0,
            surface_wind: '220/05',
            speed_restriction: '210 knots',
            emergency_heading: '180',
            remarks: 'standard',
            time_now: new Date().toISOString()
        }

        // Flight Context aktualisieren
        Object.assign(flightContext.value, {
            ...variables.value,
            phase: 'clearance'
        })

        flags.value = {
            ...flags.value,
            in_air: false,
            emergency_active: false,
            current_unit: 'DEL',
            stack: [],
            off_schema_count: 0,
            radio_checks_done: 0
        }

        currentStateId.value = tree.value.start_state
        communicationLog.value = []
    }

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

    function applyLLMDecision(decision: any) {
        // Updates anwenden
        if (decision.updates) Object.assign(variables.value, decision.updates)
        if (decision.flags) Object.assign(flags.value, decision.flags)

        // Off-Schema und Radio Check Tracking
        if (decision.off_schema) {
            flags.value.off_schema_count++
            console.log(`[Engine] Off-schema response #${flags.value.off_schema_count}`)
        }
        if (decision.radio_check) {
            flags.value.radio_checks_done++
            console.log(`[Engine] Radio check #${flags.value.radio_checks_done}`)
        }

        // Controller Response
        if (decision.controller_say_tpl) {
            speak('atc', decision.controller_say_tpl, currentStateId.value, {
                radioCheck: decision.radio_check,
                offSchema: decision.off_schema
            })
        }

        // State Transition (nur wenn nicht Radio Check)
        if (!decision.radio_check) {
            moveTo(decision.next_state)
        }
    }

    function processPilotTransmission(transcript: string): string | null {
        // Log pilot input
        speak('pilot', transcript, currentStateId.value)

        // Radio Check Detection (fallback falls LLM es nicht erkennt)
        const t = transcript.toLowerCase()
        if (t.includes('radio check') || (t.includes('read') && t.includes('check'))) {
            const callsign = variables.value.callsign || ''
            const response = `${callsign}, read you five by five.`
            flags.value.radio_checks_done++

            setTimeout(() => {
                speak('atc', response, currentStateId.value, { radioCheck: true })
            }, 500)

            return response
        }

        // Emergency Interrupts
        if (flags.value.in_air && /^(mayday|pan\s*pan)/.test(t)) {
            const intId = t.startsWith('mayday') ? 'INT_MAYDAY' : 'INT_PANPAN'
            moveTo(intId)
            return null
        }

        return null // LLM soll entscheiden
    }

    function processUserTransmission(transcript: string): string | null {
        return processPilotTransmission(transcript)
    }

    function moveTo(stateId: string) {
        if (!states.value[stateId]) {
            console.warn(`[Engine] Unknown state: ${stateId}`)
            return
        }

        if (stateId.startsWith('INT_')) {
            flags.value.stack.push(currentStateId.value)
        }

        currentStateId.value = stateId
        const s = currentState.value

        // Actions ausführen
        for (const act of s.actions ?? []) {
            if (typeof act === 'string') continue
            if (act.if && !safeEvalBoolean(act.if)) continue
            if (act.set) setByPath({ variables: variables.value, flags: flags.value }, act.set, act.to)
        }

        // Handoff
        if (s.handoff?.to) {
            flags.value.current_unit = unitFromHandoff(s.handoff.to)
            if (s.handoff.freq) {
                variables.value.handoff_freq = renderTpl(s.handoff.freq, exposeCtx())
            }
        }

        // Auto-Say
        if (s.say_tpl) {
            speak(s.role, s.say_tpl, s.id!)
        }

        // Phase Update für Flight Context
        updateFlightPhase(s.phase)

        if (s.auto) {
            handleAutoState(s)
        }
    }

    function handleAutoState(state: DTState) {
        if (state.auto === 'check_readback') {
            runReadbackAuto(state)
        }
    }

    function updateFlightPhase(phase: Phase) {
        const phaseMap: Record<Phase, string> = {
            'Clearance': 'clearance',
            'PushStart': 'ground',
            'TaxiOut': 'ground',
            'Departure': 'tower',
            'Climb': 'departure',
            'Enroute': 'enroute',
            'Descent': 'enroute',
            'Approach': 'approach',
            'Landing': 'landing',
            'TaxiIn': 'taxiin',
            'Preflight': 'clearance',
            'Postflight': 'taxiin',
            'Interrupt': flightContext.value.phase,
            'LostComms': flightContext.value.phase,
            'Missed': 'approach'
        }

        if (phaseMap[phase]) {
            flightContext.value.phase = phaseMap[phase]
        }
    }

    function resumePriorFlow() {
        const prev = flags.value.stack.pop()
        if (prev) moveTo(prev)
    }

    function speak(speaker: Role, tpl: string, stateId: string, options: { radioCheck?: boolean, offSchema?: boolean } = {}) {
        const msg = renderTpl(tpl, exposeCtx())
        const entry: EngineLog = {
            timestamp: new Date(),
            frequency: activeFrequency.value,
            speaker,
            message: msg,
            normalized: normalizeATCText(msg, exposeCtxFlat()),
            state: stateId,
            radioCheck: options.radioCheck,
            offSchema: options.offSchema
        }
        communicationLog.value.push(entry)

        if (speaker === 'atc') {
            const state = states.value[stateId]
            const required = state?.readback_required
            if (required?.length) {
                preparePendingReadback(stateId, required)
            }
        } else if (speaker === 'pilot') {
            handlePilotReadbackEvaluation(entry, stateId)
        }
    }

    function renderATCMessage(tpl: string) {
        return renderTpl(tpl, exposeCtx())
    }

    function handlePilotReadbackEvaluation(entry: EngineLog, pilotStateId: string) {
        const pending = pendingReadback.value
        if (!pending || !pending.required.length) return

        refreshPendingReadback()

        const entryIndex = communicationLog.value.length - 1
        if (pending.anchorIndex !== undefined && entryIndex <= pending.anchorIndex) return
        if (pending.lastEntryIndex === entryIndex) return

        const evaluation = evaluateReadbackEntry(pending, entry)

        entry.readback = {
            stateId: pending.stateId,
            required: [...pending.required],
            missing: evaluation.missing,
            correct: evaluation.correct
        }

        const requiresFollowUpCheck = pilotStateLeadsToReadbackCheck(pilotStateId)

        if (requiresFollowUpCheck || !evaluation.correct) {
            pendingReadback.value = {
                ...pending,
                lastEntryIndex: entryIndex,
                lastResult: evaluation
            }
        } else {
            pendingReadback.value = null
        }

        lastReadbackResult.value = {
            stateId: pending.stateId,
            entryIndex,
            required: [...pending.required],
            missing: evaluation.missing,
            correct: evaluation.correct
        }
    }

    function pilotStateLeadsToReadbackCheck(stateId: string) {
        const state = states.value[stateId]
        if (!state || state.role !== 'pilot') return false

        const chains = [
            ...(state.ok_next ?? []),
            ...(state.next ?? []),
            ...(state.bad_next ?? []),
            ...((state.timer_next ?? []).map(({ to }) => ({ to })))
        ]

        return chains.some(({ to }) => {
            if (!to) return false
            const target = states.value[to]
            return target?.auto === 'check_readback'
        })
    }

    function resolveExpectedReadbackValue(key: string, ctx: Record<string, any>): string | undefined {
        const direct = (ctx as any)?.[key]
        if (direct !== undefined && direct !== null && String(direct).trim()) {
            return String(direct)
        }

        switch (key) {
            case 'hold_short': {
                const holdShort = (ctx as any)?.hold_short
                if (holdShort !== undefined && holdShort !== null && String(holdShort).trim()) {
                    return String(holdShort)
                }
                const runway = (ctx as any)?.runway
                if (runway !== undefined && runway !== null && String(runway).trim()) {
                    return String(runway)
                }
                return undefined
            }
            case 'cleared_takeoff':
                return 'cleared for takeoff'
            default:
                return undefined
        }
    }

    function exposeCtx() {
        return {
            ...variables.value,
            ...flags.value,
            variables: variables.value,
            flags: flags.value,
        }
    }

    function exposeCtxFlat() {
        return { ...variables.value, ...flags.value }
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

    function getStateDetails(stateId: string) {
        const s = states.value[stateId]
        if (!s) return null
        return { ...s, id: stateId }
    }

    function runReadbackAuto(state: DTState) {
        refreshPendingReadback()
        const pending = pendingReadback.value
        const pilotEntry = getLastPilotEntry()

        let evaluation: { correct: boolean; missing: string[] } | null = null
        let required: string[] = []
        let sourceStateId: string | null = null

        const pilotEntryIndex = pilotEntry ? communicationLog.value.lastIndexOf(pilotEntry) : -1
        const entryAfterAnchor = !pending || pending.anchorIndex === undefined || pilotEntryIndex > pending.anchorIndex

        if (pilotEntry?.readback && (!pending || pilotEntry.readback.stateId === pending.stateId) && entryAfterAnchor) {
            evaluation = {
                correct: pilotEntry.readback.correct,
                missing: pilotEntry.readback.missing
            }
            required = [...(pilotEntry.readback.required || [])]
            sourceStateId = pilotEntry.readback.stateId
        } else if (pending && pilotEntry && entryAfterAnchor) {
            const result = evaluateReadbackEntry(pending, pilotEntry)
            evaluation = result
            required = [...pending.required]
            sourceStateId = pending.stateId
            pilotEntry.readback = {
                stateId: pending.stateId,
                required: [...pending.required],
                missing: result.missing,
                correct: result.correct
            }
            lastReadbackResult.value = {
                stateId: pending.stateId,
                entryIndex: pilotEntryIndex >= 0 ? pilotEntryIndex : communicationLog.value.length - 1,
                required: [...pending.required],
                missing: result.missing,
                correct: result.correct
            }
        } else if (!pending && lastReadbackResult.value) {
            evaluation = {
                correct: lastReadbackResult.value.correct,
                missing: lastReadbackResult.value.missing
            }
            required = [...lastReadbackResult.value.required]
            sourceStateId = lastReadbackResult.value.stateId
            if (pilotEntry && (!pilotEntry.readback || pilotEntry.readback.stateId !== sourceStateId)) {
                pilotEntry.readback = {
                    stateId: sourceStateId,
                    required: [...required],
                    missing: [...lastReadbackResult.value.missing],
                    correct: lastReadbackResult.value.correct
                }
            }
        }

        if (!evaluation) {
            const fallback = state.bad_next?.find(n => n.to)?.to
                || state.next?.find(n => n.to)?.to
                || state.ok_next?.find(n => n.to)?.to
            if (fallback && fallback !== state.id) {
                moveTo(fallback)
            }
            return
        }

        if (pending && sourceStateId === pending.stateId && evaluation.correct) {
            pendingReadback.value = null
        }

        if (!required.length && pending) {
            required = [...pending.required]
        }

        if (pilotEntry) {
            pilotEntry.readback = {
                stateId: sourceStateId || pilotEntry.readback?.stateId || pending?.stateId || '',
                required: [...required],
                missing: evaluation.missing,
                correct: evaluation.correct
            }
        }

        if (evaluation.correct) {
            const okTarget = state.ok_next?.find(n => n.to)?.to
            if (okTarget && okTarget !== state.id) {
                moveTo(okTarget)
                return
            }
        } else {
            const badTarget = state.bad_next?.find(n => n.to)?.to
                || state.next?.find(n => n.to)?.to
            if (badTarget && badTarget !== state.id) {
                moveTo(badTarget)
                return
            }
        }

        const defaultTarget = state.ok_next?.[0]?.to || state.next?.[0]?.to || state.bad_next?.[0]?.to
        if (defaultTarget && defaultTarget !== state.id) {
            moveTo(defaultTarget)
        }
    }

    function preparePendingReadback(stateId: string, required: string[]) {
        const ctx = exposeCtxFlat()
        const expected: Record<string, string> = {}

        for (const key of required) {
            const val = resolveExpectedReadbackValue(key, ctx)
            if (val !== undefined && val !== null && String(val).trim()) {
                expected[key] = String(val)
            }
        }

        pendingReadback.value = {
            stateId,
            required: [...required],
            expected,
            anchorIndex: communicationLog.value.length - 1
        }
        lastReadbackResult.value = null
    }

    function refreshPendingReadback() {
        if (!pendingReadback.value) return
        const ctx = exposeCtxFlat()
        const expected: Record<string, string> = {}

        for (const key of pendingReadback.value.required) {
            const val = resolveExpectedReadbackValue(key, ctx)
            if (val !== undefined && val !== null && String(val).trim()) {
                expected[key] = String(val)
            }
        }

        pendingReadback.value = {
            ...pendingReadback.value,
            expected
        }
    }

    function getLastPilotEntry() {
        for (let i = communicationLog.value.length - 1; i >= 0; i--) {
            const entry = communicationLog.value[i]
            if (entry.speaker === 'pilot') {
                return entry
            }
        }
        return undefined
    }

    function evaluateReadbackEntry(pending: PendingReadback, entry: EngineLog) {
        const plain = entry.message.toLowerCase()
        const normalized = entry.normalized.toLowerCase()
        const sanitizedPlain = plain.replace(/[^a-z0-9]/g, '')
        const sanitizedNormalized = normalized.replace(/[^a-z0-9]/g, '')
        const missing: string[] = []

        for (const key of pending.required) {
            const expected = pending.expected[key]
            if (!expected) continue

            const patterns = buildReadbackPatterns(key, expected, exposeCtxFlat())
            if (!patterns.length) continue

            let matched = false
            for (const pattern of patterns) {
                const lower = pattern.toLowerCase()
                if (!lower) continue
                if (plain.includes(lower) || normalized.includes(lower)) {
                    matched = true
                    break
                }
                const sanitizedPattern = lower.replace(/[^a-z0-9]/g, '')
                if (sanitizedPattern && (sanitizedPlain.includes(sanitizedPattern) || sanitizedNormalized.includes(sanitizedPattern))) {
                    matched = true
                    break
                }
            }

            if (!matched) {
                missing.push(key)
            }
        }

        return {
            correct: missing.length === 0,
            missing
        }
    }

    function buildReadbackPatterns(key: string, rawValue: string, ctx: Record<string, any>): string[] {
        const patterns = new Set<string>()
        const value = (rawValue ?? '').toString().trim()
        if (!value) return []

        const lower = value.toLowerCase()
        patterns.add(lower)
        patterns.add(lower.replace(/\s+/g, ' '))

        const normalizedValue = normalizeATCText(value, ctx).toLowerCase()
        if (normalizedValue && normalizedValue !== lower) {
            patterns.add(normalizedValue)
        }

        switch (key) {
            case 'dest':
            case 'dep':
            case 'callsign':
            case 'transition':
                patterns.add(lower.replace(/[^a-z0-9]/g, ''))
                break
            case 'sid': {
                const sanitized = lower.replace(/[^a-z0-9]/g, '')
                if (sanitized) patterns.add(sanitized)
                lower.split(/\s+/).filter(Boolean).forEach(part => patterns.add(part))
                break
            }
            case 'runway': {
                patterns.add(`runway ${lower}`)
                const normalizedRunway = normalizeATCText(`runway ${value}`, ctx).toLowerCase()
                if (normalizedRunway) patterns.add(normalizedRunway)
                const sanitizedRunway = lower.replace(/[^a-z0-9]/g, '')
                if (sanitizedRunway) patterns.add(sanitizedRunway)
                const runwayEnglish = digitsToEnglishSequence(value)
                if (runwayEnglish) patterns.add(`runway ${runwayEnglish}`)
                const runwayIcao = digitsToICAOSequence(value)
                if (runwayIcao) patterns.add(`runway ${runwayIcao}`)
                break
            }
            case 'initial_altitude_ft':
            case 'climb_altitude_ft':
            case 'initial_altitude':
            case 'climb_altitude': {
                patterns.add(`${lower} feet`)
                patterns.add(`climb ${lower}`)
                patterns.add(`climb to ${lower}`)
                patterns.add(`climb maintain ${lower}`)

                const digits = lower.replace(/[^0-9]/g, '')
                if (digits) {
                    patterns.add(digits)
                    patterns.add(digits.split('').join(' '))
                }

                const englishNumber = numberToEnglish(Number(digits || value))
                if (englishNumber) {
                    patterns.add(englishNumber)
                    patterns.add(`${englishNumber} feet`)
                    patterns.add(`climb ${englishNumber}`)
                    patterns.add(`climb to ${englishNumber}`)
                    patterns.add(`climb maintain ${englishNumber}`)
                }

                const icaoNumber = numberToICAOWords(Number(digits || value))
                if (icaoNumber && icaoNumber !== englishNumber) {
                    patterns.add(icaoNumber)
                    patterns.add(`${icaoNumber} feet`)
                    patterns.add(`climb ${icaoNumber}`)
                    patterns.add(`climb to ${icaoNumber}`)
                    patterns.add(`climb maintain ${icaoNumber}`)
                }

                const englishDigits = digitsToEnglishSequence(digits)
                if (englishDigits) {
                    patterns.add(englishDigits)
                    patterns.add(`climb ${englishDigits}`)
                }

                const icaoDigits = digitsToICAOSequence(digits)
                if (icaoDigits) {
                    patterns.add(icaoDigits)
                    patterns.add(`climb ${icaoDigits}`)
                }
                break
            }
            case 'squawk': {
                patterns.add(`squawk ${lower}`)
                const digits = lower.replace(/[^0-9]/g, '')
                if (digits) {
                    patterns.add(digits)
                    patterns.add(digits.split('').join(' '))
                    patterns.add(`squawk ${digits}`)
                    const englishDigits = digitsToEnglishSequence(digits)
                    if (englishDigits) {
                        patterns.add(englishDigits)
                        patterns.add(`squawk ${englishDigits}`)
                    }
                    const icaoDigits = digitsToICAOSequence(digits)
                    if (icaoDigits) {
                        patterns.add(icaoDigits)
                        patterns.add(`squawk ${icaoDigits}`)
                    }
                }
                const normalizedSquawk = normalizeATCText(`squawk ${value}`, ctx).toLowerCase()
                if (normalizedSquawk) patterns.add(normalizedSquawk)
                break
            }
            case 'taxi_route': {
                value.split(/[,\s]+/).map(part => part.trim().toLowerCase()).filter(Boolean).forEach(part => patterns.add(part))
                break
            }
            case 'hold_short': {
                patterns.add(`hold short ${lower}`)
                patterns.add(`hold short of ${lower}`)
                patterns.add(`holding short ${lower}`)
                patterns.add(`holding short of ${lower}`)
                const normalizedHold = normalizeATCText(`hold short ${value}`, ctx).toLowerCase()
                if (normalizedHold) patterns.add(normalizedHold)
                break
            }
            case 'gate': {
                patterns.add(`gate ${lower}`)
                break
            }
            case 'cleared_takeoff': {
                patterns.add('cleared for takeoff')
                patterns.add('cleared for take-off')
                patterns.add('cleared for take off')
                patterns.add('cleared takeoff')
                patterns.add('cleared for departure')
                break
            }
            default:
                break
        }

        return Array.from(patterns).map(p => p.trim()).filter(Boolean)
    }

    function digitsToEnglishSequence(value: string): string {
        const digits = (value ?? '').toString().replace(/[^0-9]/g, '')
        if (!digits) return ''
        return digits.split('').map(d => ENGLISH_DIGITS[Number(d)] ?? '').filter(Boolean).join(' ')
    }

    function digitsToICAOSequence(value: string): string {
        const digits = (value ?? '').toString().replace(/[^0-9]/g, '')
        if (!digits) return ''
        return digits.split('').map(d => ICAO_NUMBERS[d] || '').filter(Boolean).join(' ')
    }

    function numberToEnglish(num: number): string {
        if (!Number.isFinite(num) || num <= 0) return ''
        if (num >= 100000) return ''

        const parts: string[] = []
        const thousands = Math.floor(num / 1000)
        let remainder = num % 1000

        if (thousands > 0) {
            parts.push(`${numberToEnglish(thousands)} thousand`)
        }

        if (remainder >= 100) {
            const hundreds = Math.floor(remainder / 100)
            parts.push(`${ENGLISH_DIGITS[hundreds]} hundred`)
            remainder %= 100
        }

        if (remainder >= 20) {
            const tens = Math.floor(remainder / 10)
            const ones = remainder % 10
            parts.push(`${TENS[tens]}${ones ? ` ${ENGLISH_DIGITS[ones]}` : ''}`)
        } else if (remainder >= 10) {
            parts.push(TEENS[remainder - 10])
        } else if (remainder > 0) {
            parts.push(ENGLISH_DIGITS[remainder])
        }

        return parts.join(' ').replace(/\s+/g, ' ').trim()
    }

    function numberToICAOWords(num: number): string {
        const english = numberToEnglish(num)
        if (!english) return ''
        return english
            .split(/\s+/)
            .map(word => ICAO_WORD_REPLACEMENTS[word as keyof typeof ICAO_WORD_REPLACEMENTS] || word)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()
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

    function safeEvalBoolean(expr?: string): boolean {
        if (!expr) return true
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
        // State
        currentState: computed(() => currentState.value),
        currentStateId: readonly(currentStateId),
        variables: readonly(variables),
        flags: readonly(flags),
        nextCandidates,
        activeFrequency,
        communicationLog: readonly(communicationLog),
        clearCommunicationLog: () => { communicationLog.value = [] },

        // pm_alt.vue Integration
        flightContext: readonly(flightContext),
        currentStep,

        // Lifecycle
        initializeFlight,

        // Communication
        processPilotTransmission,
        processUserTransmission,
        buildLLMContext,
        applyLLMDecision,

        // Flow Control
        moveTo,
        resumePriorFlow,

        // Utilities
        normalizeATCText,
        renderATCMessage,
        getStateDetails
    }
}
