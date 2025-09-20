// communicationsEngine composable
import { ref, computed, readonly } from 'vue'
import type {
    RuntimeDecisionTree,
    RuntimeDecisionState,
    RuntimeDecisionAutoTransition,
    DecisionNodeAutoTrigger,
} from '../types/decision'
import { normalizeRadioPhrase } from './radioSpeech'

// --- DecisionTree runtime types ---
type Role = 'pilot' | 'atc' | 'system'
type Phase = string

interface EngineFlags {
    in_air: boolean
    emergency_active: boolean
    current_unit: string
    stack: string[]
    off_schema_count: number
    radio_checks_done: number
    [key: string]: any
}

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

type TelemetryState = {
    altitude_ft: number
    speed_kts: number
    groundspeed_kts: number
    vertical_speed_fpm: number
    latitude_deg: number
    longitude_deg: number
    heading_deg: number
    [key: string]: number
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
    const tree = ref<RuntimeDecisionTree | null>(null)
    const ready = ref(false)

    const states = computed<Record<string, RuntimeDecisionState>>(() => tree.value?.states ?? {})

    const variables = ref<Record<string, any>>({})
    const flags = ref<EngineFlags>({
        in_air: false,
        emergency_active: false,
        current_unit: 'DEL',
        stack: [],
        off_schema_count: 0,
        radio_checks_done: 0,
    })
    const currentStateId = ref<string>('')
    const communicationLog = ref<EngineLog[]>([])

    const telemetry = ref<TelemetryState>({
        altitude_ft: 0,
        speed_kts: 0,
        groundspeed_kts: 0,
        vertical_speed_fpm: 0,
        latitude_deg: 0,
        longitude_deg: 0,
        heading_deg: 0,
    })

    const autoExecutionHistory = new Map<string, Set<string>>()

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

    const currentState = computed<RuntimeDecisionState & { id: string } | null>(() => {
        const stateMap = states.value
        const fallbackId = tree.value?.start_state
        const id = currentStateId.value || fallbackId
        if (!id) return null
        const base = stateMap[id]
        return base ? { ...base, id } : null
    })

    const nextCandidates = computed<string[]>(() => {
        const s = currentState.value
        if (!s) return []
        const entries = [
            ...(s.next ?? []),
            ...(s.ok_next ?? []),
            ...(s.bad_next ?? []),
            ...(s.timer_next?.map(t => ({ to: t.to })) ?? []),
        ]
        return Array.from(
            new Set(
                entries
                    .map(entry => entry?.to)
                    .filter((id): id is string => typeof id === 'string' && id.length)
            )
        )
    })

    const isReady = computed(() => ready.value)

    function ensureTree(): RuntimeDecisionTree {
        if (!tree.value) {
            throw new Error('Decision tree not loaded')
        }
        return tree.value
    }

    function resetAutoHistory(stateId: string) {
        autoExecutionHistory.set(stateId, new Set())
    }

    function markAutoExecuted(stateId: string, transitionId: string) {
        if (!autoExecutionHistory.has(stateId)) {
            autoExecutionHistory.set(stateId, new Set())
        }
        autoExecutionHistory.get(stateId)!.add(transitionId)
    }

    function hasAutoExecuted(stateId: string, transitionId: string): boolean {
        const set = autoExecutionHistory.get(stateId)
        return set ? set.has(transitionId) : false
    }

    function resetEngineFromTree(treeData: RuntimeDecisionTree) {
        tree.value = treeData
        variables.value = { ...treeData.variables }
        const baseFlags = (treeData.flags && typeof treeData.flags === 'object') ? { ...treeData.flags } : {}
        const stack = Array.isArray(baseFlags.stack) ? [...baseFlags.stack] : []
        flags.value = {
            in_air: Boolean(baseFlags.in_air),
            emergency_active: Boolean(baseFlags.emergency_active),
            current_unit: typeof baseFlags.current_unit === 'string' ? baseFlags.current_unit : 'DEL',
            stack,
            off_schema_count: 0,
            radio_checks_done: 0,
            ...baseFlags,
        }
        if (!Array.isArray(flags.value.stack)) {
            flags.value.stack = []
        }
        currentStateId.value = treeData.start_state
        communicationLog.value = []
        telemetry.value = {
            altitude_ft: Number(baseFlags.altitude_ft) || 0,
            speed_kts: Number(baseFlags.speed_kts) || 0,
            groundspeed_kts: Number(baseFlags.groundspeed_kts) || 0,
            vertical_speed_fpm: Number(baseFlags.vertical_speed_fpm) || 0,
            latitude_deg: Number(baseFlags.latitude_deg) || 0,
            longitude_deg: Number(baseFlags.longitude_deg) || 0,
            heading_deg: Number(baseFlags.heading_deg) || 0,
        }
        autoExecutionHistory.clear()
        resetAutoHistory(currentStateId.value)
        flightContext.value.phase = 'clearance'
        ready.value = true
        evaluateAutoTransitions()
    }

    function loadRuntimeTree(data: RuntimeDecisionTree) {
        resetEngineFromTree(data)
    }

    async function fetchRuntimeTree(slug = 'icao_atc_decision_tree') {
        ready.value = false
        const fetcher: any = (globalThis as any).$fetch
        if (typeof fetcher !== 'function') {
            throw new Error('Universal fetch is not available in this context')
        }
        const data = await fetcher<RuntimeDecisionTree>(`/api/decision-flows/${slug}/runtime`)
        resetEngineFromTree(data)
    }

    function normalizeComparableValue(value: any): any {
        if (typeof value === 'number') return value
        if (typeof value === 'boolean') return value
        if (typeof value === 'string') {
            const trimmed = value.trim()
            const numeric = Number(trimmed)
            if (!Number.isNaN(numeric)) return numeric
            if (trimmed.toLowerCase() === 'true') return true
            if (trimmed.toLowerCase() === 'false') return false
            return trimmed.toLowerCase()
        }
        return value
    }

    function parseComparisonValue(raw: any): any {
        if (typeof raw === 'number' || typeof raw === 'boolean') return raw
        if (typeof raw !== 'string') return raw
        const trimmed = raw.trim()
        if (!trimmed.length) return trimmed
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith('\'') && trimmed.endsWith('\''))) {
            return trimmed.slice(1, -1)
        }
        const numeric = Number(trimmed)
        if (!Number.isNaN(numeric)) return numeric
        if (trimmed.toLowerCase() === 'true') return true
        if (trimmed.toLowerCase() === 'false') return false
        return trimmed
    }

    function compareValues(left: any, operator: string, right: any): boolean {
        const leftValue = normalizeComparableValue(left)
        const rightValue = normalizeComparableValue(parseComparisonValue(right))
        switch (operator) {
            case '>':
                return typeof leftValue === 'number' && typeof rightValue === 'number' ? leftValue > rightValue : false
            case '>=':
                return typeof leftValue === 'number' && typeof rightValue === 'number' ? leftValue >= rightValue : false
            case '<':
                return typeof leftValue === 'number' && typeof rightValue === 'number' ? leftValue < rightValue : false
            case '<=':
                return typeof leftValue === 'number' && typeof rightValue === 'number' ? leftValue <= rightValue : false
            case '===':
            case '==':
                return leftValue === rightValue
            case '!==':
            case '!=':
                return leftValue !== rightValue
            default:
                return false
        }
    }

    function getValueByPath(path: string): any {
        if (!path || typeof path !== 'string') return undefined
        const segments = path.split('.').map(part => part.trim()).filter(Boolean)
        if (!segments.length) return undefined
        let sourceKey = segments[0]
        let current: any
        if (sourceKey === 'variables') {
            current = variables.value
            segments.shift()
        } else if (sourceKey === 'flags') {
            current = flags.value
            segments.shift()
        } else if (sourceKey === 'telemetry') {
            current = telemetry.value
            segments.shift()
        } else {
            current = variables.value
        }
        for (const segment of segments) {
            if (current == null) return undefined
            current = current[segment]
        }
        return current
    }

    function evaluateSimpleCondition(condition: string): boolean {
        const expr = condition.trim()
        if (!expr) return true
        const pattern = /^(variables|flags|telemetry)\.([A-Za-z0-9_.]+)\s*(===|==|!==|!=|>=|<=|>|<)\s*(.+)$/
        const match = expr.match(pattern)
        if (match) {
            const [, source, path, operator, rawValue] = match
            const fullPath = `${source}.${path}`
            const left = getValueByPath(fullPath)
            return compareValues(left, operator, rawValue)
        }
        // Allow shorthand without namespace (defaults to variables)
        const fallbackPattern = /^([A-Za-z0-9_.]+)\s*(===|==|!==|!=|>=|<=|>|<)\s*(.+)$/
        const fallback = expr.match(fallbackPattern)
        if (fallback) {
            const [, path, operator, rawValue] = fallback
            const left = getValueByPath(path)
            return compareValues(left, operator, rawValue)
        }
        return false
    }

    function evaluateConditionExpression(expression?: string): boolean {
        if (!expression || !expression.trim()) return true
        const expr = expression.trim()
        if (expr.includes('||')) {
            return expr.split('||').some(part => evaluateConditionExpression(part.trim()))
        }
        if (expr.includes('&&')) {
            return expr.split('&&').every(part => evaluateConditionExpression(part.trim()))
        }
        return evaluateSimpleCondition(expr)
    }

    const activeFrequency = computed<string | undefined>(() => {
        const unit = typeof flags.value.current_unit === 'string' ? flags.value.current_unit.toUpperCase() : 'DEL'
        switch (unit) {
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

    function initializeFlight(fpl: any) {
        const runtime = ensureTree()
        // Set variables
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

        // Update flight context
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

        currentStateId.value = runtime.start_state
        communicationLog.value = []
        resetAutoHistory(currentStateId.value)
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

    function buildLLMContext(pilotTranscript: string) {
        const runtime = ensureTree()
        const s = currentState.value
        if (!s) {
            throw new Error('Decision state unavailable')
        }
        const candidates = nextCandidates.value
            .map(id => ({ id, state: states.value[id] }))
            .filter(candidate => candidate.state)

        return {
            state_id: s.id,
            state: { ...s },
            candidates,
            variables: { ...variables.value },
            flags: { ...flags.value },
            pilot_utterance: pilotTranscript,
            tree: runtime.name,
        }
    }

    function applyLLMDecision(decision: any) {
        if (!decision || typeof decision !== 'object') {
            return
        }

        if (decision.updates && typeof decision.updates === 'object') {
            Object.assign(variables.value, decision.updates)
        }

        if (decision.flags && typeof decision.flags === 'object') {
            Object.assign(flags.value, decision.flags)
        }

        if (decision.telemetry && typeof decision.telemetry === 'object') {
            updateTelemetry(decision.telemetry)
        }

        if (Array.isArray(decision.stack)) {
            flags.value.stack = decision.stack.slice()
        }

        if (decision.off_schema) {
            flags.value.off_schema_count++
            console.log(`[Engine] Off-schema response #${flags.value.off_schema_count}`)
        }

        if (decision.radio_check) {
            flags.value.radio_checks_done++
            console.log(`[Engine] Radio check #${flags.value.radio_checks_done}`)
        }

        if (decision.controller_say_tpl) {
            speak('atc', decision.controller_say_tpl, currentStateId.value, {
                radioCheck: decision.radio_check,
                offSchema: decision.off_schema
            })
        }

        const resumeFlow = decision.resume_previous === true
        const nextState = typeof decision.next_state === 'string'
            ? decision.next_state
            : typeof decision.nextState === 'string'
                ? decision.nextState
                : null

        if (resumeFlow) {
            resumePriorFlow()
        } else if (!decision.radio_check && nextState) {
            moveTo(nextState)
        }

        if (!decision.radio_check) {
            queueMicrotask(() => evaluateAutoTransitions())
        }
    }

    function processPilotTransmission(transcript: string): string | null {
        if (!ready.value) {
            return null
        }
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

    function resolveTelemetryValue(parameter: string) {
        const value = (telemetry.value as any)[parameter]
        if (value !== undefined) return value
        return (variables.value as any)[parameter]
    }

    function updateTelemetry(update: Partial<TelemetryState> | null | undefined) {
        if (!update || typeof update !== 'object') {
            return
        }
        const next: TelemetryState = { ...telemetry.value }
        for (const [key, raw] of Object.entries(update)) {
            if (raw === undefined || raw === null) continue
            const current = telemetry.value[key]
            if (typeof current === 'number') {
                const numeric = typeof raw === 'number' ? raw : Number(raw)
                if (!Number.isNaN(numeric)) {
                    next[key] = numeric
                    continue
                }
            }
            const fallback = typeof raw === 'number' ? raw : Number(raw)
            next[key] = Number.isNaN(fallback) ? current : fallback
        }
        telemetry.value = next
        queueMicrotask(() => evaluateAutoTransitions())
    }

    function evaluateAutoTrigger(trigger: DecisionNodeAutoTrigger | null | undefined): boolean {
        if (!trigger) return false
        if (trigger.type === 'expression') {
            return evaluateConditionExpression(trigger.expression)
        }
        if (trigger.type === 'telemetry') {
            if (!trigger.parameter || !trigger.operator) return false
            const left = resolveTelemetryValue(trigger.parameter)
            return compareValues(left, trigger.operator, trigger.value)
        }
        if (trigger.type === 'variable') {
            const target = trigger.variable ? getValueByPath(trigger.variable) : undefined
            if (trigger.operator) {
                return compareValues(target, trigger.operator, trigger.value)
            }
            return Boolean(target)
        }
        return false
    }

    function evaluateAutoTransitions(loopGuard = 0) {
        if (!ready.value || loopGuard > 8) return
        const state = currentState.value
        if (!state || !state.auto_transitions?.length) return

        for (const transition of state.auto_transitions) {
            if (!transition || !transition.trigger) continue
            if (transition.trigger.once !== false && hasAutoExecuted(state.id, transition.id)) {
                continue
            }
            if (transition.condition && !evaluateConditionExpression(transition.condition)) {
                continue
            }
            if (transition.guard && !evaluateConditionExpression(transition.guard)) {
                continue
            }
            if (!evaluateAutoTrigger(transition.trigger)) {
                continue
            }
            markAutoExecuted(state.id, transition.id)
            const delay = transition.trigger.delayMs ?? 0
            if (delay > 0) {
                setTimeout(() => {
                    moveTo(transition.to)
                    evaluateAutoTransitions(loopGuard + 1)
                }, delay)
            } else {
                moveTo(transition.to)
                evaluateAutoTransitions(loopGuard + 1)
            }
            return
        }
    }

    function moveTo(stateId: string) {
        ensureTree()
        if (!states.value[stateId]) {
            console.warn(`[Engine] Unknown state: ${stateId}`)
            return
        }

        if (stateId.startsWith('INT_')) {
            flags.value.stack.push(currentStateId.value)
        }

        currentStateId.value = stateId
        resetAutoHistory(stateId)
        const s = currentState.value
        if (!s) return

        // Execute actions
        for (const act of s.actions ?? []) {
            if (typeof act === 'string') continue
            if (act.if && !safeEvalBoolean(act.if)) continue
            if (act.set) {
                setByPath({ variables: variables.value, flags: flags.value, telemetry: telemetry.value }, act.set, act.to)
            }
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
        queueMicrotask(() => evaluateAutoTransitions())
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
            telemetry: telemetry.value,
        }
    }

    function exposeCtxFlat() {
        return { ...variables.value, ...flags.value, ...telemetry.value }
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
        return evaluateConditionExpression(expr)
    }

    function setByPath(root: Record<string, any>, path: string, val: any) {
        const parts = path.split('.').map(part => part.trim()).filter(Boolean)
        if (!parts.length) return
        let cur = root
        for (let i = 0; i < parts.length - 1; i++) {
            const p = parts[i]
            if (!(p in cur) || typeof cur[p] !== 'object') {
                cur[p] = {}
            }
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
        loadRuntimeTree,
        fetchRuntimeTree,
        isReady,

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
        getStateDetails,
        updateTelemetry,
    }
}
