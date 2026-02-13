// communicationsEngine composable
import { ref, computed, readonly, reactive } from 'vue'
import type {
    RuntimeDecisionTree,
    RuntimeDecisionSystem,
    RuntimeDecisionState,
    RuntimeDecisionAutoTransition,
    DecisionNodeAutoTrigger,
} from '../types/decision'
import type { FlowActivationInstruction, FlowActivationMode, LLMDecisionTrace } from '../types/llm'
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
    session_id: string
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
    flow?: string
}

interface FlowSnapshot {
    tree: RuntimeDecisionTree
    variables: Record<string, any>
    flags: EngineFlags
    telemetry: TelemetryState
    currentStateId: string
    communicationLog: EngineLog[]
    autoHistory: Map<string, Set<string>>
    flightContext: FlightContext
    ready: boolean
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

function createSessionId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function normalizeATCText(text: string, context: Record<string, any>): string {
    const rendered = renderTpl(text, context)
    return normalizeRadioPhrase(rendered)
}

function createDefaultFlightContext(): FlightContext {
    return {
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
        remarks: 'standard',
        time_now: undefined,
        phase: 'clearance',
    }
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
    const runtimeSystem = ref<RuntimeDecisionSystem | null>(null)
    const flowOrder = ref<string[]>([])
    const activeFlowSlug = ref<string>('')
    const sessionId = ref<string>('')
    const flowStack = ref<string[]>([])

    const tree = ref<RuntimeDecisionTree | null>(null)
    const ready = ref(false)
    const lastDecisionTrace = ref<LLMDecisionTrace | null>(null)

    const flowSnapshots = reactive<Record<string, FlowSnapshot>>({})

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

    // Flight context used for pm_alt.vue integration
    const flightContext = ref<FlightContext>(createDefaultFlightContext())

    const currentState = computed<RuntimeDecisionState & { id: string } | null>(() => {
        const stateMap = states.value
        const fallbackId = tree.value?.start_state
        const id = currentStateId.value || fallbackId
        if (!id) return null
        const base = stateMap[id]
        return base ? { ...base, id } : null
    })

    function ensureSnapshot(slug: string): FlowSnapshot {
        const snapshot = flowSnapshots[slug]
        if (!snapshot) {
            throw new Error(`Flow snapshot not loaded: ${slug}`)
        }
        return snapshot
    }

    function getActiveSnapshot(): FlowSnapshot | null {
        if (!activeFlowSlug.value) return null
        return flowSnapshots[activeFlowSlug.value] || null
    }

    function assignActiveVariables(next: Record<string, any>) {
        variables.value = next
        if (activeFlowSlug.value && flowSnapshots[activeFlowSlug.value]) {
            flowSnapshots[activeFlowSlug.value].variables = next
        }
    }

    function ensureSessionValue(raw?: string): string {
        if (raw && typeof raw === 'string' && raw.trim().length) {
            sessionId.value = raw.trim()
        } else if (!sessionId.value) {
            sessionId.value = createSessionId()
        }
        return sessionId.value
    }

    function assignActiveFlags(next: EngineFlags) {
        const normalizedSession = ensureSessionValue(next?.session_id)
        next.session_id = normalizedSession
        flags.value = next
        if (activeFlowSlug.value && flowSnapshots[activeFlowSlug.value]) {
            flowSnapshots[activeFlowSlug.value].flags = next
        }
    }

    function assignActiveTelemetry(next: TelemetryState) {
        telemetry.value = next
        if (activeFlowSlug.value && flowSnapshots[activeFlowSlug.value]) {
            flowSnapshots[activeFlowSlug.value].telemetry = next
        }
    }

    function assignCommunicationLog(next: EngineLog[]) {
        communicationLog.value = next
        if (activeFlowSlug.value && flowSnapshots[activeFlowSlug.value]) {
            flowSnapshots[activeFlowSlug.value].communicationLog = next
        }
    }

    function assignFlightContext(next: FlightContext) {
        flightContext.value = next
        if (activeFlowSlug.value && flowSnapshots[activeFlowSlug.value]) {
            flowSnapshots[activeFlowSlug.value].flightContext = next
        }
    }

    function setActiveStateId(stateId: string) {
        currentStateId.value = stateId
        if (activeFlowSlug.value && flowSnapshots[activeFlowSlug.value]) {
            flowSnapshots[activeFlowSlug.value].currentStateId = stateId
        }
    }

    function createSnapshotFromTree(treeData: RuntimeDecisionTree): FlowSnapshot {
        const variables = { ...treeData.variables }
        const baseFlags = (treeData.flags && typeof treeData.flags === 'object') ? { ...treeData.flags } : {}
        const stack = Array.isArray((baseFlags as any).stack) ? [...(baseFlags as any).stack] : []
        const flags: EngineFlags = {
            in_air: Boolean((baseFlags as any).in_air),
            emergency_active: Boolean((baseFlags as any).emergency_active),
            current_unit: typeof (baseFlags as any).current_unit === 'string'
                ? (baseFlags as any).current_unit
                : 'DEL',
            stack,
            off_schema_count: Number((baseFlags as any).off_schema_count) || 0,
            radio_checks_done: Number((baseFlags as any).radio_checks_done) || 0,
            session_id: '',
            ...(baseFlags as EngineFlags),
        }
        if (!Array.isArray(flags.stack)) {
            flags.stack = []
        }
        if (typeof flags.session_id !== 'string') {
            flags.session_id = ''
        }

        const telemetry: TelemetryState = {
            altitude_ft: Number((baseFlags as any).altitude_ft) || 0,
            speed_kts: Number((baseFlags as any).speed_kts) || 0,
            groundspeed_kts: Number((baseFlags as any).groundspeed_kts) || 0,
            vertical_speed_fpm: Number((baseFlags as any).vertical_speed_fpm) || 0,
            latitude_deg: Number((baseFlags as any).latitude_deg) || 0,
            longitude_deg: Number((baseFlags as any).longitude_deg) || 0,
            heading_deg: Number((baseFlags as any).heading_deg) || 0,
        }

        const log: EngineLog[] = []
        const snapshotContext = createDefaultFlightContext()
        snapshotContext.phase = 'clearance'

        const autoHistory = new Map<string, Set<string>>()
        if (treeData.start_state) {
            autoHistory.set(treeData.start_state, new Set())
        }

        return {
            tree: treeData,
            variables,
            flags,
            telemetry,
            currentStateId: treeData.start_state,
            communicationLog: log,
            autoHistory,
            flightContext: snapshotContext,
            ready: true,
        }
    }

    function persistActiveSnapshot() {
        if (!activeFlowSlug.value) return
        const snapshot = flowSnapshots[activeFlowSlug.value]
        if (!snapshot) return
        snapshot.variables = variables.value
        snapshot.flags = flags.value
        snapshot.telemetry = telemetry.value
        snapshot.currentStateId = currentStateId.value
        snapshot.communicationLog = communicationLog.value
        snapshot.flightContext = flightContext.value
        snapshot.ready = ready.value
    }

    function activateFlow(slug: string) {
        const snapshot = ensureSnapshot(slug)
        if (activeFlowSlug.value && activeFlowSlug.value !== slug) {
            persistActiveSnapshot()
        }
        activeFlowSlug.value = slug
        tree.value = snapshot.tree
        assignActiveVariables(snapshot.variables)
        assignActiveFlags(snapshot.flags)
        assignActiveTelemetry(snapshot.telemetry)
        assignCommunicationLog(snapshot.communicationLog)
        assignFlightContext(snapshot.flightContext)
        setActiveStateId(snapshot.currentStateId)
        ready.value = snapshot.ready
    }

    function resolveFlowMode(slug: string | undefined): FlowActivationMode {
        if (!slug) return 'parallel'
        const system = runtimeSystem.value
        if (!system) return 'parallel'
        if (slug === system.main) return 'main'
        const treeData = system.flows[slug]
        if (!treeData) return 'parallel'
        if (treeData.entry_mode === 'main') return 'main'
        if (treeData.entry_mode === 'linear') return 'linear'
        return 'parallel'
    }

    function normalizeFlowInstruction(target: string | FlowActivationInstruction | null | undefined): FlowActivationInstruction | null {
        if (!target) return null
        if (typeof target === 'string') {
            return { slug: target, mode: resolveFlowMode(target) }
        }
        if (!target.slug) return null
        return { slug: target.slug, mode: target.mode ?? resolveFlowMode(target.slug) }
    }

    function setActiveFlow(target: string | FlowActivationInstruction, options: { skipStack?: boolean } = {}) {
        const instruction = normalizeFlowInstruction(target)
        if (!instruction) {
            throw new Error(`Flow snapshot not loaded: ${typeof target === 'string' ? target : target?.slug}`)
        }
        const slug = instruction.slug
        if (!slug || !flowSnapshots[slug]) {
            throw new Error(`Flow snapshot not loaded: ${slug}`)
        }
        const previous = activeFlowSlug.value
        const shouldPush = !options.skipStack
            && instruction.mode === 'linear'
            && previous
            && previous !== slug
        if (shouldPush) {
            flowStack.value.push(previous)
        }
        activateFlow(slug)
        ready.value = true
        queueMicrotask(() => evaluateAutoTransitions())
    }
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

    function resetAutoHistory(stateId: string, slug = activeFlowSlug.value) {
        if (!slug) return
        const snapshot = ensureSnapshot(slug)
        snapshot.autoHistory.set(stateId, new Set())
    }

    function markAutoExecuted(stateId: string, transitionId: string, slug = activeFlowSlug.value) {
        if (!slug) return
        const snapshot = ensureSnapshot(slug)
        if (!snapshot.autoHistory.has(stateId)) {
            snapshot.autoHistory.set(stateId, new Set())
        }
        snapshot.autoHistory.get(stateId)!.add(transitionId)
    }

    function hasAutoExecuted(stateId: string, transitionId: string, slug = activeFlowSlug.value): boolean {
        if (!slug) return false
        const snapshot = ensureSnapshot(slug)
        const set = snapshot.autoHistory.get(stateId)
        return set ? set.has(transitionId) : false
    }

    function resetEngineFromTree(treeData: RuntimeDecisionTree) {
        const system: RuntimeDecisionSystem = {
            main: treeData.slug,
            order: [treeData.slug],
            flows: { [treeData.slug]: treeData },
        }
        resetEngineFromSystem(system, { activeSlug: treeData.slug })
    }

    function resetEngineFromSystem(system: RuntimeDecisionSystem, options: { activeSlug?: string } = {}) {
        runtimeSystem.value = system
        const order = Array.isArray(system.order) && system.order.length
            ? [...system.order]
            : Object.keys(system.flows)
        flowOrder.value = order

        for (const key of Object.keys(flowSnapshots)) {
            delete flowSnapshots[key]
        }

        for (const slug of order) {
            const treeData = system.flows[slug]
            if (!treeData) continue
            flowSnapshots[slug] = createSnapshotFromTree(treeData)
        }

        flowStack.value = []
        sessionId.value = createSessionId()
        for (const slug of order) {
            const snapshot = flowSnapshots[slug]
            if (snapshot) {
                snapshot.flags.session_id = sessionId.value
            }
        }

        const preferred = options.activeSlug && system.flows[options.activeSlug]
            ? options.activeSlug
            : system.main && system.flows[system.main]
                ? system.main
                : order[0]

        if (preferred) {
            activateFlow(preferred)
            ready.value = true
            const snapshot = ensureSnapshot(preferred)
            resetAutoHistory(snapshot.currentStateId, preferred)
            evaluateAutoTransitions()
        } else {
            activeFlowSlug.value = ''
            tree.value = null
            ready.value = false
            assignActiveVariables({})
            assignActiveFlags({
                in_air: false,
                emergency_active: false,
                current_unit: 'DEL',
                stack: [],
                off_schema_count: 0,
                radio_checks_done: 0,
                session_id: ensureSessionValue(),
            })
            assignActiveTelemetry({
                altitude_ft: 0,
                speed_kts: 0,
                groundspeed_kts: 0,
                vertical_speed_fpm: 0,
                latitude_deg: 0,
                longitude_deg: 0,
                heading_deg: 0,
            })
            assignCommunicationLog([])
            assignFlightContext(createDefaultFlightContext())
            setActiveStateId('')
        }
    }

    function loadRuntimeTree(data: RuntimeDecisionTree) {
        resetEngineFromTree(data)
    }

    function loadRuntimeSystem(data: RuntimeDecisionSystem, options: { activeSlug?: string } = {}) {
        resetEngineFromSystem(data, options)
    }

    const activeFlow = computed(() => activeFlowSlug.value)

    const mainFlowSlug = computed(() => runtimeSystem.value?.main || '')

    const availableFlows = computed(() => {
        if (!runtimeSystem.value) return [] as Array<{ slug: string; name: string; description?: string; start: string }>
        return flowOrder.value
            .filter((slug) => Boolean(runtimeSystem.value!.flows[slug]))
            .map((slug) => {
                const treeData = runtimeSystem.value!.flows[slug]
                return {
                    slug,
                    name: treeData.name || slug,
                    description: treeData.description,
                    start: treeData.start_state,
                    mode: treeData.entry_mode || (slug === runtimeSystem.value!.main ? 'main' : 'parallel'),
                }
            })
    })

    async function fetchRuntimeTree(slug = 'icao_atc_decision_tree') {
        ready.value = false
        const fetcher: any = (globalThis as any).$fetch
        if (typeof fetcher !== 'function') {
            throw new Error('Universal fetch is not available in this context')
        }
        const data = await fetcher<RuntimeDecisionSystem>('/api/decision-flows/runtime')
        const activeSlug = slug && data.flows[slug] ? slug : data.main
        resetEngineFromSystem(data, { activeSlug })
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
        const nextVariables = {
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
        assignActiveVariables(nextVariables)

        // Update flight context
        Object.assign(flightContext.value, {
            ...variables.value,
            phase: 'clearance'
        })

        const nextFlags: EngineFlags = {
            ...flags.value,
            in_air: false,
            emergency_active: false,
            current_unit: 'DEL',
            stack: [],
            off_schema_count: 0,
            radio_checks_done: 0,
            session_id: ensureSessionValue(flags.value.session_id)
        }
        assignActiveFlags(nextFlags)

        setActiveStateId(runtime.start_state)
        assignCommunicationLog([])
        resetAutoHistory(runtime.start_state)
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
        let candidates = nextCandidates.value
            .map(id => ({ id, state: states.value[id], flow: runtime.slug }))
            .filter(candidate => candidate.state)

        // "Look through" auto-behavior check states (e.g. CD_READBACK_CHECK).
        // If ALL candidates are check_readback/monitor states, expand them to
        // their ok_next + bad_next targets so the LLM can evaluate the pilot's
        // readback directly and route to the correct outcome.
        const allAutoCheck = candidates.length > 0 && candidates.every(c =>
            c.state.auto === 'check_readback' || c.state.auto === 'monitor'
        )
        if (allAutoCheck) {
            const expanded: typeof candidates = []
            const seen = new Set<string>()
            for (const c of candidates) {
                const targets = [
                    ...(c.state.ok_next ?? []),
                    ...(c.state.bad_next ?? []),
                    ...(c.state.next ?? []),
                ]
                for (const t of targets) {
                    if (!t?.to || seen.has(t.to)) continue
                    seen.add(t.to)
                    const targetState = states.value[t.to]
                    if (targetState) {
                        expanded.push({ id: t.to, state: targetState, flow: runtime.slug })
                    }
                }
            }
            if (expanded.length > 0) {
                candidates = expanded
            }
        }

        return {
            state_id: s.id,
            state: { ...s },
            candidates,
            variables: { ...variables.value },
            flags: { ...flags.value },
            pilot_utterance: pilotTranscript,
            tree: runtime.name,
            flow_slug: runtime.slug,
        }
    }

    function applyLLMDecision(decision: any, trace?: LLMDecisionTrace | null) {
        if (!decision || typeof decision !== 'object') {
            lastDecisionTrace.value = null
            return
        }

        lastDecisionTrace.value = trace ?? null

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

        if (decision.activate_flow) {
            const activation = normalizeFlowInstruction(decision.activate_flow as any)
            if (activation && (activation.slug !== activeFlowSlug.value || activation.mode === 'main')) {
                try {
                    setActiveFlow(activation)
                } catch (err) {
                    console.warn('[Engine] Failed to activate flow from decision', err)
                }
            }
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
            const resumed = resumeLinearFlow()
            if (!resumed) {
                resumeStackedState()
            }
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
        speak('pilot', transcript, currentStateId.value)
        return null
    }

    function processUserTransmission(transcript: string): string | null {
        return processPilotTransmission(transcript)
    }

    /**
     * After a decision lands on a state, walk forward through all non-pilot
     * states (ATC replies, system checks, handoffs) collecting ATC messages
     * that need TTS playback, until we reach the next pilot state.
     *
     * This is the core auto-advance mechanism for the live ATC flow.
     * It handles:
     * - ATC states with say_tpl (collect for TTS, advance)
     * - System states (check_readback, monitor, etc) — advance via ok_next
     * - Handoff states (advance automatically)
     * - States with single unambiguous transitions
     */
    function collectAtcStatesUntilPilotTurn(maxHops = 30): Array<{ stateId: string; say_tpl: string; rendered: string; normalized: string }> {
        const messages: Array<{ stateId: string; say_tpl: string; rendered: string; normalized: string }> = []
        const visited = new Set<string>()
        let hops = 0

        while (hops++ < maxHops) {
            const s = currentState.value
            if (!s) break

            // Prevent infinite loops
            if (visited.has(s.id)) break
            visited.add(s.id)

            // If we're on a pilot state, stop — it's the pilot's turn to speak
            if (s.role === 'pilot') break

            // If this is an end state, stop
            const endStates = tree.value?.end_states ?? []
            if (endStates.includes(s.id)) break

            // Collect ATC/system messages for TTS
            if (s.say_tpl) {
                messages.push({
                    stateId: s.id,
                    say_tpl: s.say_tpl,
                    rendered: renderTpl(s.say_tpl, exposeCtx()),
                    normalized: normalizeATCText(s.say_tpl, exposeCtxFlat()),
                })
            }

            // Determine the next state to advance to.
            // Strategy:
            // 1. For auto-behavior states (check_readback, monitor, pop_stack),
            //    prefer ok_next (assume success for auto-advance)
            // 2. For states with a single eligible transition, take it
            // 3. For ambiguous states (multiple eligible), stop
            let nextId: string | null = null

            const auto = s.auto
            if (auto === 'check_readback' || auto === 'monitor' || auto === 'pop_stack_or_route_by_intent') {
                // Auto-behavior states: prefer ok_next, then next
                const okTransitions = (s.ok_next ?? []).filter(t => {
                    if (!t?.to) return false
                    if (t.when && !evaluateConditionExpression(t.when)) return false
                    if (t.guard && !evaluateConditionExpression(t.guard)) return false
                    return true
                })
                if (okTransitions.length > 0) {
                    nextId = okTransitions[0].to
                }
            }

            if (!nextId) {
                // Collect all eligible transitions
                const allTransitions = [
                    ...(s.next ?? []),
                    ...(s.ok_next ?? []),
                ] as Array<{ to?: string; when?: string; guard?: string }>

                const eligible = allTransitions.filter(t => {
                    if (!t?.to) return false
                    if (t.when && !evaluateConditionExpression(t.when)) return false
                    if (t.guard && !evaluateConditionExpression(t.guard)) return false
                    return true
                })

                // Only advance if there's exactly one unambiguous path
                if (eligible.length === 1) {
                    nextId = eligible[0].to!
                }
            }

            if (!nextId || !states.value[nextId]) break

            // Advance to the next state (moveTo handles logging, actions, handoffs)
            moveTo(nextId)
        }

        return messages
    }

    /**
     * Computed: expected pilot phrases for the current state.
     * If we're on a pilot state, returns that state's utterance_tpl rendered.
     * If we're on an ATC state, looks at the next candidates that are pilot states.
     */
    const expectedPilotPhrases = computed<Array<{ stateId: string; text: string; normalized: string }>>(() => {
        const s = currentState.value
        if (!s) return []

        // If current state IS a pilot state with utterance_tpl, show it
        if (s.role === 'pilot' && s.utterance_tpl) {
            return [{
                stateId: s.id,
                text: renderTpl(s.utterance_tpl, exposeCtx()),
                normalized: normalizeATCText(s.utterance_tpl, exposeCtxFlat()),
            }]
        }

        // Otherwise look at next candidates that are pilot states
        const results: Array<{ stateId: string; text: string; normalized: string }> = []
        for (const id of nextCandidates.value) {
            const state = states.value[id]
            if (!state) continue
            if (state.role === 'pilot' && state.utterance_tpl) {
                results.push({
                    stateId: id,
                    text: renderTpl(state.utterance_tpl, exposeCtx()),
                    normalized: normalizeATCText(state.utterance_tpl, exposeCtxFlat()),
                })
            }
        }
        return results
    })

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
        assignActiveTelemetry(next)
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

    let pendingSimpleAutoTransition: { from: string; to: string } | null = null

    function evaluateSimpleAutoFlow(loopGuard = 0) {
        if (!ready.value || loopGuard > 20) return
        if (pendingSimpleAutoTransition?.from === currentStateId.value) {
            return
        }

        const state = currentState.value
        if (!state) return
        if (state.role === 'atc' && state.say_tpl) return

        const transitions = [
            ...(state.next ?? []),
            ...(state.ok_next ?? []),
            ...(state.bad_next ?? []),
        ] as Array<{ to?: string, guard?: string, when?: string, type?: string | null }>

        const eligible = transitions.filter(candidate => {
            if (!candidate || typeof candidate.to !== 'string' || !candidate.to.length) {
                return false
            }
            if (candidate.type === 'auto') {
                return false
            }
            if (candidate.when && !evaluateConditionExpression(candidate.when)) {
                return false
            }
            if (candidate.guard && !evaluateConditionExpression(candidate.guard)) {
                return false
            }
            return true
        })

        if (eligible.length !== 1) return

        const targetId = eligible[0].to!
        const targetState = states.value[targetId]
        if (!targetState) return

        const silentSystemHop = targetState.role === 'system' && !targetState.say_tpl
        const delay = silentSystemHop
            ? 50
            : Math.floor(Math.random() * 1000) + 1000

        const fromStateId = currentStateId.value
        pendingSimpleAutoTransition = { from: fromStateId, to: targetId }
        setTimeout(() => {
            pendingSimpleAutoTransition = null
            if (currentStateId.value !== fromStateId) {
                return
            }
            moveTo(targetId)
            evaluateSimpleAutoFlow(loopGuard + 1)
        }, delay)
    }

    function evaluateAutoTransitions(loopGuard = 0) {
        if (!ready.value || loopGuard > 8) return
        const state = currentState.value
        if (!state) return

        const autoTransitions = state.auto_transitions ?? []

        for (const transition of autoTransitions) {
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

        evaluateSimpleAutoFlow(loopGuard + 1)
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

        setActiveStateId(stateId)
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

    function resumeStackedState() {
        const prev = flags.value.stack.pop()
        if (prev) moveTo(prev)
    }

    function resumeLinearFlow(): boolean {
        const previousFlow = flowStack.value.pop()
        if (previousFlow) {
            try {
                setActiveFlow({ slug: previousFlow, mode: resolveFlowMode(previousFlow) }, { skipStack: true })
                return true
            } catch (err) {
                console.warn('[Engine] Failed to resume linear flow', err)
            }
        } else if (mainFlowSlug.value && activeFlowSlug.value !== mainFlowSlug.value) {
            try {
                setActiveFlow({ slug: mainFlowSlug.value, mode: 'main' }, { skipStack: true })
                return true
            } catch (err) {
                console.warn('[Engine] Failed to restore main flow', err)
            }
        }
        return false
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
            offSchema: options.offSchema,
            flow: activeFlowSlug.value || undefined,
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
        clearCommunicationLog: () => { assignCommunicationLog([]) },
        activeFlow,
        availableFlows,
        sessionId: readonly(sessionId),
        lastDecisionTrace: readonly(lastDecisionTrace),

        // pm_alt.vue integration
        flightContext: readonly(flightContext),
        currentStep,

        // Lifecycle
        initializeFlight,
        updateFrequencyVariables,
        loadRuntimeTree,
        loadRuntimeSystem,
        fetchRuntimeTree,
        setActiveFlow,
        isReady,

        // Communication
        processPilotTransmission,
        processUserTransmission,
        buildLLMContext,
        applyLLMDecision,
        collectAtcStatesUntilPilotTurn,
        expectedPilotPhrases,

        // Flow Control
        moveTo,

        // Utilities
        normalizeATCText,
        renderATCMessage,
        getStateDetails,
        updateTelemetry,
    }
}
