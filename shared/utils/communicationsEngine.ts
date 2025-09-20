// communicationsEngine composable
import { ref, computed, readonly } from 'vue'
import { normalizeRadioPhrase } from './radioSpeech'
import { useAuthStore } from '~/stores/auth'
import type {
    DecisionTreeRecord,
    DecisionTreeState,
    AutoTransition,
    TelemetryKey,
} from '../../types/decision-tree'

type Role = DecisionTreeState['role']
type Phase = DecisionTreeState['phase']

// Flight phases and communication steps for better integration
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
    // Additional steps can be defined here
]

type FrequencyVariableKey = 'atis_freq'
    | 'delivery_freq'
    | 'ground_freq'
    | 'tower_freq'
    | 'departure_freq'
    | 'approach_freq'
    | 'handoff_freq'

export interface FlightTelemetry {
    altitude_ft?: number
    speed_kt?: number
    vertical_speed_fpm?: number
    latitude?: number
    longitude?: number
}

const DEFAULT_TREE: DecisionTreeRecord = {
    schema_version: '0.0',
    name: 'loading',
    description: 'Loading ATC decision tree…',
    start_state: 'GEN_NO_REPLY',
    end_states: [],
    variables: {},
    flags: {
        in_air: false,
        emergency_active: false,
        current_unit: 'DEL',
        stack: [],
    },
    policies: {
        timeouts: {
            pilot_readback_timeout_s: 8,
            controller_ack_timeout_s: 6,
            no_reply_retry_after_s: 5,
            no_reply_max_retries: 2,
            lost_comms_detect_after_s: 90,
        },
        no_reply_sequence: [],
        interrupts_allowed_when: {},
    },
    hooks: {},
    roles: ['pilot', 'atc', 'system'],
    phases: [],
    states: {},
}

const MAX_AUTO_CHAIN = 10
type AutoTrigger = 'state-entry' | 'telemetry-update' | 'decision-applied'

function createInitialFlags(base: Record<string, any>): Record<string, any> {
    const stack = Array.isArray(base?.stack) ? [...base.stack] : []
    return {
        ...base,
        stack,
        in_air: Boolean(base?.in_air),
        emergency_active: Boolean(base?.emergency_active),
        current_unit: base?.current_unit || 'DEL',
        off_schema_count: 0,
        radio_checks_done: 0,
    }
}

function cloneStates(states: Record<string, DecisionTreeState>): Record<string, DecisionTreeState> {
    const result: Record<string, DecisionTreeState> = {}
    Object.entries(states || {}).forEach(([id, state]) => {
        result[id] = {
            ...state,
            readback_required: Array.isArray(state.readback_required) ? [...state.readback_required] : [],
            next: Array.isArray(state.next) ? [...state.next] : [],
            ok_next: Array.isArray(state.ok_next) ? [...state.ok_next] : [],
            bad_next: Array.isArray(state.bad_next) ? [...state.bad_next] : [],
            timer_next: Array.isArray(state.timer_next) ? [...state.timer_next] : [],
            auto_transitions: Array.isArray(state.auto_transitions) ? [...state.auto_transitions] : [],
        }
    })
    return result
}

// --- Load ATC decision tree ---
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
    atis_freq?: string
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

export function normalizeATCText(text: string, context: Record<string, any>): string {
    const rendered = renderTpl(text, context)
    return normalizeRadioPhrase(rendered)
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
    const auth = useAuthStore()

    const tree = ref<DecisionTreeRecord>({
        ...DEFAULT_TREE,
        states: cloneStates(DEFAULT_TREE.states),
    })
    const treeReady = ref(false)
    const treeLoading = ref(false)
    const treeError = ref<string | null>(null)

    const states = computed<Record<string, DecisionTreeState>>(() => tree.value.states || {})

    const variables = ref<Record<string, any>>({ ...DEFAULT_TREE.variables })
    const flags = ref<Record<string, any>>(createInitialFlags(DEFAULT_TREE.flags))
    const telemetry = ref<FlightTelemetry>({})
    const currentStateId = ref<string>(DEFAULT_TREE.start_state)
    const communicationLog = ref<EngineLog[]>([])

    // Flight context used for pm_alt.vue integration
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
        atis_freq: '118.025',
        ground_freq: '121.700',
        tower_freq: '118.700',
        departure_freq: '125.350',
        approach_freq: '120.800',
        handoff_freq: '121.800',
        qnh_hpa: 1015,
        taxi_route: 'A, V',
        phase: 'clearance'
    })

    const currentState = computed<DecisionTreeState & { id: string }>(() => {
        const fallback = states.value[tree.value.start_state]
        const s = states.value[currentStateId.value] || fallback || { role: 'system', phase: 'Preflight' }
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

    // Current step for pm_alt.vue integration
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

    function applyTree(record: DecisionTreeRecord) {
        tree.value = {
            ...record,
            states: cloneStates(record.states),
        }
        variables.value = { ...record.variables }
        flags.value = createInitialFlags(record.flags)
        currentStateId.value = record.start_state
        treeReady.value = true
        treeError.value = null
    }

    async function loadDecisionTree(force = false) {
        if (treeLoading.value) {
            return
        }
        if (treeReady.value && !force) {
            return
        }
        treeLoading.value = true
        treeError.value = null

        try {
            if (!auth.initialized) {
                await auth.fetchUser().catch(() => null)
            }

            const headers: Record<string, string> = { Accept: 'application/json' }
            if (auth.accessToken) {
                headers.Authorization = `Bearer ${auth.accessToken}`
            }

            let response = await fetch('/api/atc/tree', {
                method: 'GET',
                headers,
            })

            if (response.status === 401) {
                const refreshed = await auth.tryRefresh?.()
                if (refreshed && auth.accessToken) {
                    headers.Authorization = `Bearer ${auth.accessToken}`
                    response = await fetch('/api/atc/tree', {
                        method: 'GET',
                        headers,
                    })
                }
            }

            if (!response.ok) {
                throw new Error(`Failed to load decision tree (${response.status})`)
            }

            const payload = await response.json()
            if (!payload?.tree) {
                throw new Error('Decision tree payload missing')
            }

            applyTree(payload.tree as DecisionTreeRecord)
        } catch (err: any) {
            console.error('Failed to load ATC decision tree', err)
            treeError.value = err?.message || 'Failed to load decision tree'
        } finally {
            treeLoading.value = false
        }
    }

    async function ensureTreeLoaded() {
        if (!treeReady.value) {
            await loadDecisionTree()
        }
    }

    if (typeof window !== 'undefined') {
        ensureTreeLoaded()
    }

    async function initializeFlight(fpl: any) {
        await ensureTreeLoaded()

        variables.value = {
            ...tree.value.variables,
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
            atis_freq: '118.025',
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

        Object.assign(flightContext.value, {
            ...variables.value,
            phase: 'clearance'
        })

        flags.value = createInitialFlags(tree.value.flags)
        flags.value.in_air = false
        flags.value.emergency_active = false
        flags.value.current_unit = 'DEL'
        flags.value.stack = []
        flags.value.off_schema_count = 0
        flags.value.radio_checks_done = 0

        telemetry.value = {}

        currentStateId.value = tree.value.start_state
        communicationLog.value = []

        runAutoTransitions('state-entry')
    }

    function evaluateExpressionCondition(expression?: string): boolean {
        const trimmed = (expression || '').trim()
        if (!trimmed) return false
        try {
            const fn = new Function('variables', 'flags', 'telemetry', `return (${trimmed})`)
            return Boolean(fn(variables.value, flags.value, telemetry.value))
        } catch (err) {
            console.warn('Failed to evaluate auto transition expression', trimmed, err)
            return false
        }
    }

    function evaluateTelemetryCondition(auto: AutoTransition): boolean {
        if (!auto.telemetryKey || !auto.comparator) {
            return false
        }
        const value = telemetry.value[auto.telemetryKey as keyof FlightTelemetry]
        if (value === undefined || value === null) {
            return false
        }
        const numericValue = Number(value)
        const target = Number(auto.value ?? 0)
        switch (auto.comparator) {
            case '>':
                return numericValue > target
            case '>=':
                return numericValue >= target
            case '<':
                return numericValue < target
            case '<=':
                return numericValue <= target
            case '!==':
                return numericValue !== target
            case '===':
                return numericValue === target
            default:
                return false
        }
    }

    function checkAutoCondition(auto: AutoTransition): boolean {
        if (auto.enabled === false) {
            return false
        }
        if (auto.conditionType === 'telemetry') {
            return evaluateTelemetryCondition(auto)
        }
        if (auto.expression) {
            return evaluateExpressionCondition(auto.expression)
        }
        return false
    }

    function runAutoTransitions(initialTrigger: AutoTrigger) {
        let trigger: AutoTrigger = initialTrigger
        let depth = 0
        const visited = new Set<string>()

        while (depth < MAX_AUTO_CHAIN) {
            const stateId = currentStateId.value
            const state = currentState.value
            const transitions = Array.isArray(state.auto_transitions) ? [...state.auto_transitions] : []
            transitions.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

            let applied = false
            for (const auto of transitions) {
                if (auto.enabled === false) continue
                if (!auto.to || auto.to === stateId) continue
                const runOn = auto.runOn && auto.runOn.length ? auto.runOn : ['state-entry']
                if (!runOn.includes(trigger)) continue
                const key = `${stateId}:${auto.id || auto.to}`
                if (visited.has(key)) continue
                if (!checkAutoCondition(auto)) continue

                visited.add(key)
                moveTo(auto.to, { skipAuto: true })
                trigger = 'state-entry'
                depth += 1
                applied = true
                break
            }

            if (!applied) {
                break
            }
        }
    }

    function updateFrequencyVariables(update: Partial<Record<FrequencyVariableKey, string>>) {
        if (!update) return

        const sanitizedEntries = Object.entries(update)
            .filter(([, value]) => typeof value === 'string' && value.trim().length)
            .map(([key, value]) => [key, value!.trim()]) as [FrequencyVariableKey, string][]

        if (!sanitizedEntries.length) {
            return
        }

        for (const [key, value] of sanitizedEntries) {
            variables.value[key] = value
        }

        Object.assign(flightContext.value, Object.fromEntries(sanitizedEntries))
    }

    function updateTelemetry(update: Partial<FlightTelemetry>) {
        if (!update) return

        const cleanedEntries = Object.entries(update).filter(([, value]) => value !== undefined && value !== null)
        if (!cleanedEntries.length) return

        const nextTelemetry: FlightTelemetry = { ...telemetry.value }
        for (const [key, value] of cleanedEntries) {
            const numeric = typeof value === 'string' ? Number(value) : value
            ;(nextTelemetry as any)[key] = numeric
        }

        telemetry.value = nextTelemetry
        runAutoTransitions('telemetry-update')
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
        // Apply updates
        if (decision.updates) Object.assign(variables.value, decision.updates)
        if (decision.flags) Object.assign(flags.value, decision.flags)

        // Track off-schema responses and radio checks
        if (decision.off_schema) {
            flags.value.off_schema_count++
            console.log(`[Engine] Off-schema response #${flags.value.off_schema_count}`)
        }
        if (decision.radio_check) {
            flags.value.radio_checks_done++
            console.log(`[Engine] Radio check #${flags.value.radio_checks_done}`)
        }

        // Controller response
        if (decision.controller_say_tpl) {
            speak('atc', decision.controller_say_tpl, currentStateId.value, {
                radioCheck: decision.radio_check,
                offSchema: decision.off_schema
            })
        }

        // State transition (only when not a radio check)
        if (!decision.radio_check) {
            moveTo(decision.next_state)
        }

        runAutoTransitions('decision-applied')
    }

    function processPilotTransmission(transcript: string): string | null {
        // Log pilot input
        speak('pilot', transcript, currentStateId.value)

        // Radio check detection (fallback if the LLM misses it)
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

        return null // Let the LLM decide
    }

    function processUserTransmission(transcript: string): string | null {
        return processPilotTransmission(transcript)
    }

    function moveTo(stateId: string, options: { skipAuto?: boolean } = {}) {
        if (!states.value[stateId]) {
            console.warn(`[Engine] Unknown state: ${stateId}`)
            return
        }

        if (stateId.startsWith('INT_')) {
            flags.value.stack.push(currentStateId.value)
        }

        currentStateId.value = stateId
        const s = currentState.value

        // Execute actions
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

        // Update flight context phase
        updateFlightPhase(s.phase)

        if (!options.skipAuto) {
            runAutoTransitions('state-entry')
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
        telemetry: readonly(telemetry),
        treeLoading: readonly(treeLoading),
        treeReady: readonly(treeReady),
        treeError: readonly(treeError),
        nextCandidates,
        activeFrequency,
        communicationLog: readonly(communicationLog),
        clearCommunicationLog: () => { communicationLog.value = [] },

        // pm_alt.vue integration
        flightContext: readonly(flightContext),
        currentStep,

        // Lifecycle
        initializeFlight,
        updateFrequencyVariables,
        updateTelemetry,
        loadTree: loadDecisionTree,
        ensureTreeLoaded,

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
