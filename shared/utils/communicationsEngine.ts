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

const NOMINAL_FLOW_SEQUENCE: string[] = [
    'CD_CHECK_ATIS',
    'CD_VERIFY_READBACK',
    'GRD_READY_FOR_PUSH',
    'GRD_TAXI_REQUEST',
    'GRD_TAXI_READBACK',
    'TWR_LINEUP_REQ',
    'TWR_TAKEOFF_READBACK',
    'DEP_CONTACT',
    'DEP_CLIMB_READBACK',
    'DES_READBACK',
    'APP_ESTABLISHED',
    'TWR_LAND_READBACK',
    'GRD_TAXI_IN_REQ',
    'GRD_TAXI_IN_READBACK'
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
}

interface DecisionOutcome {
    state: DTState | null
    spoken?: string | null
    radioCheck?: boolean
    offSchema?: boolean
}

interface MoveResult {
    state: DTState | null
    spoken?: string | null
}

interface TransmissionSnapshot {
    stateId: string | null
    message: string
    normalized: string
    timestamp: Date
}

interface SimulationFlowStep {
    stateId: string
    nextStateId?: string
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
    const lastPilotTransmission = ref<TransmissionSnapshot>({
        stateId: null,
        message: '',
        normalized: '',
        timestamp: new Date(0)
    })
    const lastAtcTransmission = ref<TransmissionSnapshot>({
        stateId: null,
        message: '',
        normalized: '',
        timestamp: new Date(0)
    })
    const pendingReadback = ref<{ stateId: string; required: string[] } | null>(null)

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
        const baseVars = tree.value.variables || {}
        const nowIso = new Date().toISOString()

        variables.value = {
            ...baseVars,
            callsign: fpl?.callsign || baseVars.callsign || 'DLH39A',
            acf_type: fpl?.aircraft?.split('/')[0] || baseVars.acf_type || 'A320',
            dep: fpl?.dep || fpl?.departure || baseVars.dep || 'EDDF',
            dest: fpl?.arr || fpl?.arrival || baseVars.dest || 'EDDM',
            stand: genStand(),
            runway: genRunway(),
            squawk: fpl?.assignedsquawk || genSquawk(),
            atis_code: genATIS(),
            sid: genSID(fpl?.route || '') || baseVars.sid,
            transition: baseVars.transition || 'ANEKI',
            cruise_flight_level: fpl?.altitude
                ? `FL${String(Math.floor(parseInt(fpl.altitude) / 100)).padStart(3, '0')}`
                : baseVars.cruise_flight_level || 'FL360',
            initial_altitude_ft: baseVars.initial_altitude_ft || 5000,
            climb_altitude_ft: baseVars.climb_altitude_ft || 7000,
            taxi_route: baseVars.taxi_route || 'A, V',
            delivery_freq: baseVars.delivery_freq || '121.900',
            ground_freq: baseVars.ground_freq || '121.700',
            tower_freq: baseVars.tower_freq || '118.700',
            departure_freq: baseVars.departure_freq || '125.350',
            approach_freq: baseVars.approach_freq || '120.800',
            handoff_freq: baseVars.handoff_freq || '121.800',
            qnh_hpa: baseVars.qnh_hpa || 1015,
            remarks: baseVars.remarks || '280 degrees at 12 knots',
            runway_available: baseVars.runway_available ?? true,
            runway_occupied: baseVars.runway_occupied ?? false,
            push_available: baseVars.push_available ?? true,
            pilot_able: baseVars.pilot_able ?? true,
            pilot_requests_amendment: false,
            problem: baseVars.problem || 'engine vibrations',
            intent: baseVars.intent || 'return to departure',
            alt_instruction: baseVars.alt_instruction || 'maintain 4000 feet',
            instruction: baseVars.instruction || 'heading 220',
            time_now: nowIso
        }

        Object.assign(flightContext.value, {
            callsign: variables.value.callsign,
            aircraft: variables.value.acf_type,
            dep: variables.value.dep,
            dest: variables.value.dest,
            stand: variables.value.stand,
            runway: variables.value.runway,
            squawk: variables.value.squawk,
            atis_code: variables.value.atis_code,
            sid: variables.value.sid,
            transition: variables.value.transition,
            flight_level: variables.value.cruise_flight_level,
            ground_freq: variables.value.ground_freq,
            tower_freq: variables.value.tower_freq,
            departure_freq: variables.value.departure_freq,
            approach_freq: variables.value.approach_freq,
            handoff_freq: variables.value.handoff_freq,
            qnh_hpa: variables.value.qnh_hpa,
            taxi_route: variables.value.taxi_route,
            remarks: variables.value.remarks,
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

        communicationLog.value = []
        lastPilotTransmission.value = {
            stateId: null,
            message: '',
            normalized: '',
            timestamp: new Date(0)
        }
        lastAtcTransmission.value = {
            stateId: null,
            message: '',
            normalized: '',
            timestamp: new Date(0)
        }
        pendingReadback.value = null

        moveTo(tree.value.start_state, { allowRadioChecks: false })
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

    function applyLLMDecision(decision: any): DecisionOutcome {
        if (decision.updates) Object.assign(variables.value, decision.updates)
        if (decision.flags) Object.assign(flags.value, decision.flags)

        if (decision.off_schema) {
            flags.value.off_schema_count++
            console.log(`[Engine] Off-schema response #${flags.value.off_schema_count}`)
        }
        if (decision.radio_check) {
            flags.value.radio_checks_done++
            console.log(`[Engine] Radio check #${flags.value.radio_checks_done}`)
        }

        if (decision.radio_check) {
            const fallback = decision.controller_say_tpl || `${variables.value.callsign}, read you five by five.`
            const spoken = speak('atc', fallback, currentStateId.value, {
                radioCheck: true,
                offSchema: decision.off_schema
            })
            return {
                state: currentState.value,
                spoken,
                radioCheck: true,
                offSchema: decision.off_schema
            }
        }

        const moveResult = moveTo(decision.next_state, {
            speechMeta: {
                overrideSay: decision.controller_say_tpl,
                radioCheck: decision.radio_check,
                offSchema: decision.off_schema
            }
        })

        return {
            state: moveResult.state,
            spoken: moveResult.spoken,
            radioCheck: !!decision.radio_check,
            offSchema: !!decision.off_schema
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

    function resolveTransition(list?: DTNext[]): string | undefined {
        if (!list) return undefined
        for (const option of list) {
            if (!option?.to) continue
            if (!option.when || safeEvalBoolean(option.when)) {
                return option.to
            }
        }
        return undefined
    }

    function toNato(value: string): string {
        return value
            .toUpperCase()
            .split('')
            .map(ch => NATO_PHONETIC[ch] || ICAO_NUMBERS[ch] || ch)
            .join(' ')
    }

    function evaluatePendingReadback(): boolean {
        const pending = pendingReadback.value
        if (!pending || pending.required.length === 0) return true

        const pilotRaw = lastPilotTransmission.value.message.toUpperCase()
        if (!pilotRaw) return false

        const context = exposeCtxFlat()

        return pending.required.every(key => {
            const rawVal = context[key]
            if (rawVal === undefined || rawVal === null) return false
            const upper = String(rawVal).toUpperCase()
            const variants = new Set<string>([
                upper,
                upper.replace(/\s+/g, ''),
                upper.replace(/[^A-Z0-9]/g, '')
            ])

            if (/[A-Z]/.test(upper)) {
                variants.add(toNato(upper))
            }
            if (/^\d+$/.test(upper)) {
                variants.add(upper.split('').join(' '))
            }
            if (key.includes('runway')) {
                const normalized = normalizeATCText(`runway {${key}}`, exposeCtx()).toUpperCase()
                variants.add(normalized)
                variants.add(normalized.replace('RUNWAY ', ''))
            }
            if (key.includes('squawk')) {
                variants.add(upper.split('').join(' '))
            }
            if (key.endsWith('_ft')) {
                variants.add(`${upper} FT`)
                variants.add(`${upper} FEET`)
            }

            return Array.from(variants).some(variant => variant && pilotRaw.includes(variant))
        })
    }

    function computeAutoNextState(state: DTState): string | undefined {
        if (state.auto === 'end') {
            return undefined
        }

        if (state.auto === 'check_readback') {
            const ok = evaluatePendingReadback()
            pendingReadback.value = null
            if (ok) {
                return resolveTransition(state.ok_next) ?? resolveTransition(state.next)
            }
            return resolveTransition(state.bad_next) ?? resolveTransition(state.next)
        }

        if (state.auto === 'monitor') {
            return resolveTransition(state.next)
        }

        if (state.auto === 'pop_stack_or_route_by_intent') {
            const prior = flags.value.stack.pop()
            if (prior) return prior
            return resolveTransition(state.next) ?? resolveTransition(state.ok_next) ?? resolveTransition(state.bad_next)
        }

        if (state.role === 'system') {
            return resolveTransition(state.next) ?? resolveTransition(state.ok_next) ?? resolveTransition(state.bad_next)
        }

        if (state.role === 'atc') {
            return resolveTransition(state.next) ?? resolveTransition(state.ok_next) ?? resolveTransition(state.bad_next)
        }

        if (state.role === 'pilot') {
            if (!state.utterance_tpl || state.auto) {
                return resolveTransition(state.next) ?? resolveTransition(state.ok_next) ?? resolveTransition(state.bad_next)
            }
        }

        return undefined
    }

    function moveTo(stateId: string, options: { speechMeta?: { overrideSay?: string; radioCheck?: boolean; offSchema?: boolean }; allowRadioChecks?: boolean } = {}): MoveResult {
        const visited = new Set<string>()
        let nextId: string | undefined = stateId
        let firstSpoken: string | null = null
        let speechMeta = options.speechMeta

        while (nextId) {
            const targetState = states.value[nextId]
            if (!targetState) {
                console.warn(`[Engine] Unknown state: ${nextId}`)
                break
            }

            if (visited.has(nextId)) {
                console.warn('[Engine] Auto-transition loop detected at', nextId)
                break
            }
            visited.add(nextId)

            if (nextId.startsWith('INT_') && !options.allowRadioChecks) {
                flags.value.stack.push(currentStateId.value)
            }

            currentStateId.value = nextId
            const state = currentState.value

            for (const act of state.actions ?? []) {
                if (typeof act === 'string') continue
                if (act.if && !safeEvalBoolean(act.if)) continue
                if (act.set) setByPath({ variables: variables.value, flags: flags.value }, act.set, act.to)
            }

            if (state.handoff?.to) {
                flags.value.current_unit = unitFromHandoff(state.handoff.to)
                if (state.handoff.freq) {
                    const rendered = renderTpl(state.handoff.freq, exposeCtx())
                    variables.value.handoff_freq = rendered
                    flightContext.value.handoff_freq = rendered
                }
            }

            let say = state.say_tpl
            if (state.condition && !safeEvalBoolean(state.condition)) {
                say = state.else_say_tpl || say
            }
            if (speechMeta?.overrideSay) {
                say = speechMeta.overrideSay
            }

            if (say && state.role !== 'pilot') {
                const spoken = speak(state.role, say, state.id!, {
                    radioCheck: speechMeta?.radioCheck,
                    offSchema: speechMeta?.offSchema
                })
                if (!firstSpoken && spoken) {
                    firstSpoken = spoken
                }
            }

            updateFlightPhase(state.phase)

            speechMeta = undefined

            const autoNext = computeAutoNextState(state)
            if (autoNext) {
                nextId = autoNext
                continue
            }

            break
        }

        return {
            state: currentState.value,
            spoken: firstSpoken
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
            'Postflight': 'postflight',
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

    function speak(speaker: Role, tpl: string, stateId: string, options: { radioCheck?: boolean; offSchema?: boolean } = {}): string {
        const msg = renderTpl(tpl, exposeCtx())
        const normalized = normalizeATCText(msg, exposeCtxFlat())
        const timestamp = new Date()

        const entry: EngineLog = {
            timestamp,
            frequency: activeFrequency.value,
            speaker,
            message: msg,
            normalized,
            state: stateId,
            radioCheck: options.radioCheck,
            offSchema: options.offSchema
        }
        communicationLog.value.push(entry)

        const snapshot: TransmissionSnapshot = { stateId, message: msg, normalized, timestamp }
        if (speaker === 'pilot') {
            lastPilotTransmission.value = snapshot
        } else if (speaker === 'atc') {
            lastAtcTransmission.value = snapshot
            const state = states.value[stateId]
            if (state?.readback_required?.length) {
                pendingReadback.value = { stateId, required: [...state.readback_required] }
            } else if (pendingReadback.value?.stateId === stateId) {
                pendingReadback.value = null
            }
        }

        return msg
    }

    function renderATCMessage(tpl: string) {
        return renderTpl(tpl, exposeCtx())
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

    function buildNominalFlow(): SimulationFlowStep[] {
        return NOMINAL_FLOW_SEQUENCE
            .map((stateId) => {
                const state = states.value[stateId]
                if (!state) return null
                const nextId = resolveTransition(state.next)
                    ?? resolveTransition(state.ok_next)
                    ?? resolveTransition(state.bad_next)
                return { stateId, nextStateId: nextId }
            })
            .filter((step): step is SimulationFlowStep => step !== null)
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
        lastAtcTransmission: readonly(lastAtcTransmission),
        lastPilotTransmission: readonly(lastPilotTransmission),

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
        buildNominalFlow,

        // Utilities
        normalizeATCText,
        renderATCMessage,
        getStateDetails
    }
}
