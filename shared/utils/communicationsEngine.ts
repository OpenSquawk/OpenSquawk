// communicationsEngine composable
import { ref, computed, readonly, watch, nextTick } from 'vue'
import { useNuxtApp, useState } from '#app'
import type { AtcDecisionTree, AtcDecisionState, AtcAutopilotCondition } from '../types/atc'
import { normalizeRadioPhrase } from './radioSpeech'

type Role = 'pilot' | 'atc' | 'system'
type Phase =
    | 'Preflight' | 'Clearance' | 'PushStart' | 'TaxiOut' | 'Departure'
    | 'Climb' | 'Enroute' | 'Descent' | 'Approach' | 'Landing'
    | 'TaxiIn' | 'Postflight' | 'Interrupt' | 'LostComms' | 'Missed'

interface DTNext { to: string; when?: string }
interface DTHandoff { to: string; freq: string }
interface DTActionSet { set?: string; to?: any; if?: string }

type DTState = AtcDecisionState

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

export default function useCommunicationsEngine(flowName = 'icao_atc_decision_tree') {
    const nuxtApp = useNuxtApp()
    const sharedTree = useState<AtcDecisionTree | null>(`atc-tree-${flowName}`, () => null)
    const sharedReady = useState<boolean>(`atc-tree-ready-${flowName}`, () => false)
    const sharedError = useState<string | null>(`atc-tree-error-${flowName}`, () => null)
    const sharedPromise = useState<Promise<void> | null>(`atc-tree-promise-${flowName}`, () => null)

    const tree = ref<AtcDecisionTree | null>(sharedTree.value)
    const ready = ref<boolean>(Boolean(sharedReady.value && sharedTree.value))
    const loading = ref<boolean>(false)
    const loadError = ref<string | null>(sharedError.value || null)
    const llmActive = ref<boolean>(false)

    const variables = ref<Record<string, any>>({})
    const flags = ref<Record<string, any>>({})
    const previousVariables = ref<Record<string, any>>({})
    const previousFlags = ref<Record<string, any>>({})
    const currentStateId = ref<string>(tree.value?.start_state || '')
    const communicationLog = ref<EngineLog[]>([])
    const lastPilotTransmissionAt = ref<number>(0)
    const lastControllerTransmissionAt = ref<number>(0)
    const autoHoldMap = new Map<string, number>()

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

    const states = computed<Record<string, DTState>>(() => tree.value?.states || {})

    const currentState = computed<DTState>(() => {
        const stateMap = states.value
        const desiredId = currentStateId.value || tree.value?.start_state
        if (desiredId && stateMap[desiredId]) {
            return stateMap[desiredId]
        }
        const fallback = tree.value?.start_state && stateMap[tree.value.start_state]
        if (fallback) {
            return fallback
        }
        return { id: desiredId || '', role: 'system', phase: 'Interrupt' } as DTState
    })

    const nextCandidates = computed<string[]>(() => {
        if (!ready.value) return []
        const candidateIds = new Set<string>()
        const add = (items?: { to: string }[]) => items?.forEach(item => item?.to && candidateIds.add(item.to))
        const state = currentState.value
        add(state.next)
        add(state.ok_next)
        add(state.bad_next)
        state.timer_next?.forEach(t => t?.to && candidateIds.add(t.to))
        return Array.from(candidateIds)
    })

    const activeFrequency = computed<string | undefined>(() => {
        if (!ready.value) return undefined
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

    const currentStep = computed(() => {
        if (!ready.value) return null
        const phase = flightContext.value.phase
        const step = COMMUNICATION_STEPS.find(s => s.phase === phase)
        if (!step) return null
        return {
            ...step,
            pilot: renderTpl(step.pilot, { ...variables.value, ...flags.value }),
            atc: step.atc ? renderTpl(step.atc, { ...variables.value, ...flags.value }) : undefined,
            pilotResponse: step.pilotResponse ? renderTpl(step.pilotResponse, { ...variables.value, ...flags.value }) : undefined
        }
    })

    function cloneDeep<T>(value: T): T {
        return JSON.parse(JSON.stringify(value ?? {}))
    }

    function updateSnapshots() {
        previousVariables.value = cloneDeep(variables.value)
        previousFlags.value = cloneDeep(flags.value)
    }

    function initializeFromTree(treeData: AtcDecisionTree) {
        tree.value = treeData
        ready.value = true
        loading.value = false
        loadError.value = null
        variables.value = { ...treeData.variables }
        const baseFlags = {
            ...treeData.flags,
            off_schema_count: Number(treeData.flags?.off_schema_count ?? 0),
            radio_checks_done: Number(treeData.flags?.radio_checks_done ?? 0),
            stack: Array.isArray(treeData.flags?.stack) ? [...treeData.flags.stack] : []
        }
        flags.value = baseFlags
        currentStateId.value = treeData.start_state
        communicationLog.value = []
        autoHoldMap.clear()
        updateSnapshots()
    }

    async function ensureTreeLoaded(force = false): Promise<void> {
        if (!force && tree.value && sharedReady.value) {
            if (!ready.value) {
                initializeFromTree(tree.value)
            }
            return
        }

        if (!force && sharedPromise.value) {
            loading.value = true
            try {
                await sharedPromise.value
                if (sharedTree.value) {
                    initializeFromTree(sharedTree.value)
                }
            } catch (err: any) {
                loadError.value = err?.message || 'Failed to load decision tree'
                throw err
            } finally {
                loading.value = false
            }
            return
        }

        loading.value = true
        loadError.value = null
        const promise = (async () => {
            try {
                const fetched = await nuxtApp.$fetch<AtcDecisionTree>('/api/atc/decision-tree', {
                    query: { flow: flowName }
                })
                sharedTree.value = fetched
                sharedReady.value = true
                sharedError.value = null
                initializeFromTree(fetched)
            } catch (err: any) {
                const message = err?.message || 'Failed to load decision tree'
                loadError.value = message
                sharedError.value = message
                ready.value = false
                throw err
            } finally {
                loading.value = false
                sharedPromise.value = null
            }
        })()
        sharedPromise.value = promise
        await promise
    }

    if (sharedTree.value && sharedReady.value) {
        initializeFromTree(sharedTree.value)
    }

    const whenReady = ready.value && tree.value ? Promise.resolve() : ensureTreeLoaded()

    watch(variables, () => {
        if (!ready.value) {
            previousVariables.value = cloneDeep(variables.value)
            return
        }
        evaluateAutoTransitions('variables')
        previousVariables.value = cloneDeep(variables.value)
    }, { deep: true })

    watch(flags, () => {
        if (!ready.value) {
            previousFlags.value = cloneDeep(flags.value)
            return
        }
        evaluateAutoTransitions('flags')
        previousFlags.value = cloneDeep(flags.value)
    }, { deep: true })

    function initializeFlight(fpl: any) {
        if (!ready.value || !tree.value) {
            throw new Error('Decision tree not loaded')
        }

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
        autoHoldMap.clear()
        updateSnapshots()
        nextTick(() => evaluateAutoTransitions('state-change'))
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
        if (!ready.value) {
            throw new Error('Decision tree not loaded')
        }
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
        llmActive.value = false

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

        if (decision.controller_say_tpl) {
            speak('atc', decision.controller_say_tpl, currentStateId.value, {
                radioCheck: decision.radio_check,
                offSchema: decision.off_schema
            })
        }

        if (!decision.radio_check) {
            moveTo(decision.next_state)
        }

        evaluateAutoTransitions('llm')
    }

    function processPilotTransmission(transcript: string): string | null {
        lastPilotTransmissionAt.value = Date.now()
        speak('pilot', transcript, currentStateId.value)

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

        if (flags.value.in_air && /^(mayday|pan\s*pan)/.test(t)) {
            const intId = t.startsWith('mayday') ? 'INT_MAYDAY' : 'INT_PANPAN'
            moveTo(intId)
            return null
        }

        return null
    }

    function processUserTransmission(transcript: string): string | null {
        return processPilotTransmission(transcript)
    }

    function moveTo(stateId: string) {
        if (!ready.value) return
        if (!states.value[stateId]) {
            console.warn(`[Engine] Unknown state: ${stateId}`)
            return
        }

        if (stateId.startsWith('INT_')) {
            flags.value.stack.push(currentStateId.value)
        }

        currentStateId.value = stateId
        const s = currentState.value

        for (const act of s.actions ?? []) {
            if (typeof act === 'string') continue
            if (act.if && !safeEvalBoolean(act.if)) continue
            if (act.set) setByPath({ variables: variables.value, flags: flags.value }, act.set, act.to)
        }

        if (s.handoff?.to) {
            flags.value.current_unit = unitFromHandoff(s.handoff.to)
            if (s.handoff.freq) {
                variables.value.handoff_freq = renderTpl(s.handoff.freq, exposeCtx())
            }
        }

        if (s.say_tpl) {
            speak(s.role as Role, s.say_tpl, s.id)
        }

        updateFlightPhase(s.phase as Phase)
        autoHoldMap.clear()
        updateSnapshots()
        nextTick(() => evaluateAutoTransitions('state-change'))
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
        const now = Date.now()
        if (speaker === 'pilot') {
            lastPilotTransmissionAt.value = now
        } else if (speaker === 'atc') {
            lastControllerTransmissionAt.value = now
        }

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

    function readRuntimeValue(path: string) {
        if (!path) return undefined
        const segments = path.split('.').filter(Boolean)
        if (!segments.length) return undefined
        let root: any
        const first = segments[0]
        if (first === 'variables') {
            root = variables.value
            segments.shift()
        } else if (first === 'flags') {
            root = flags.value
            segments.shift()
        } else if (first in variables.value) {
            root = variables.value
        } else if (first in flags.value) {
            root = flags.value
        } else {
            root = variables.value
        }
        return segments.reduce((acc, key) => (acc != null ? acc[key] : undefined), root)
    }

    function readPreviousValue(path: string) {
        if (!path) return undefined
        const segments = path.split('.').filter(Boolean)
        if (!segments.length) return undefined
        let root: any
        const first = segments[0]
        if (first === 'variables') {
            root = previousVariables.value
            segments.shift()
        } else if (first === 'flags') {
            root = previousFlags.value
            segments.shift()
        } else if (first in previousVariables.value) {
            root = previousVariables.value
        } else if (first in previousFlags.value) {
            root = previousFlags.value
        } else {
            root = previousVariables.value
        }
        return segments.reduce((acc, key) => (acc != null ? acc[key] : undefined), root)
    }

    function toNumber(value: any): number | null {
        if (typeof value === 'number' && Number.isFinite(value)) return value
        if (typeof value === 'string' && value.trim().length) {
            const parsed = Number(value)
            if (!Number.isNaN(parsed)) return parsed
        }
        return null
    }

    function evaluateCondition(expression?: string) {
        if (!expression || !expression.trim()) return true
        try {
            const fn = new Function('variables', 'flags', 'context', `return (${expression})`)
            return Boolean(fn(variables.value, flags.value, exposeCtx()))
        } catch (err) {
            console.warn('[Engine] Failed to evaluate condition', expression, err)
            return false
        }
    }

    function evaluateThreshold(auto: AtcAutopilotCondition) {
        if (!auto.variable) return false
        const current = readRuntimeValue(auto.variable)
        const previous = readPreviousValue(auto.variable)
        const operator = auto.operator || '>'
        const currentNum = toNumber(current)
        const valueNum = toNumber(auto.value)
        const prevNum = toNumber(previous)

        switch (operator) {
            case '>':
                return currentNum !== null && valueNum !== null && currentNum > valueNum
            case '>=':
                return currentNum !== null && valueNum !== null && currentNum >= valueNum
            case '<':
                return currentNum !== null && valueNum !== null && currentNum < valueNum
            case '<=':
                return currentNum !== null && valueNum !== null && currentNum <= valueNum
            case '==':
                return current == auto.value
            case '!=':
                return current != auto.value
            case 'rises_above':
                return currentNum !== null && valueNum !== null && prevNum !== null && prevNum <= valueNum && currentNum > valueNum
            case 'drops_below':
                return currentNum !== null && valueNum !== null && prevNum !== null && prevNum >= valueNum && currentNum < valueNum
            case 'changes':
                return current !== previous
            default:
                return false
        }
    }

    function evaluateDelta(auto: AtcAutopilotCondition) {
        if (!auto.variable) return false
        const currentNum = toNumber(readRuntimeValue(auto.variable))
        const prevNum = toNumber(readPreviousValue(auto.variable))
        const target = toNumber(auto.value) ?? 0
        if (currentNum === null || prevNum === null) return false
        if (auto.operator === 'increase') {
            return currentNum - prevNum >= target
        }
        if (auto.operator === 'decrease') {
            return prevNum - currentNum >= target
        }
        return Math.abs(currentNum - prevNum) >= target
    }

    function shouldTriggerAuto(id: string, auto: AtcAutopilotCondition, now: number) {
        if (auto.allowDuringLLM === false && llmActive.value) return false
        if (auto.allowDuringPilotSpeech === false && now - lastPilotTransmissionAt.value < 1200) return false
        if (auto.allowDuringControllerSpeech === false && now - lastControllerTransmissionAt.value < 1200) return false

        let passes = false
        if (auto.mode === 'threshold' && auto.variable) {
            passes = evaluateThreshold(auto)
        } else if (auto.mode === 'delta' && auto.variable) {
            passes = evaluateDelta(auto)
        } else if (auto.expression) {
            passes = evaluateCondition(auto.expression)
        }

        if (!passes) {
            autoHoldMap.delete(id)
            return false
        }

        if (auto.holdForMs && auto.holdForMs > 0) {
            const start = autoHoldMap.get(id)
            if (!start) {
                autoHoldMap.set(id, now)
                return false
            }
            if (now - start < auto.holdForMs) {
                return false
            }
        }

        autoHoldMap.delete(id)
        return true
    }

    function applyAutoTransition(transition: { id: string; to: string; auto?: AtcAutopilotCondition }) {
        const auto = transition.auto
        if (auto?.updates && typeof auto.updates === 'object') {
            Object.assign(variables.value, auto.updates)
        }
        if (auto?.flags && typeof auto.flags === 'object') {
            Object.assign(flags.value, auto.flags)
        }
        if (auto?.controllerSayTpl) {
            speak('atc', auto.controllerSayTpl, currentStateId.value)
        }
        moveTo(transition.to)
    }

    function evaluateAutoTransitions(reason: 'variables' | 'flags' | 'state-change' | 'llm' = 'variables') {
        if (!ready.value) return
        const state = currentState.value
        if (!Array.isArray(state.auto_next) || !state.auto_next.length) return

        const sorted = [...state.auto_next].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
        const now = Date.now()

        for (const candidate of sorted) {
            if (!candidate || !candidate.to) continue
            if (candidate.when && !evaluateCondition(candidate.when)) {
                autoHoldMap.delete(candidate.id)
                continue
            }
            const auto = candidate.auto
            if (!auto) continue
            if (!shouldTriggerAuto(candidate.id, auto, now)) {
                continue
            }
            applyAutoTransition(candidate)
            break
        }
    }

    function markLLMActivity(active: boolean) {
        llmActive.value = active
    }

    return {
        ready: readonly(ready),
        loading: readonly(loading),
        loadError: readonly(loadError),
        whenReady,
        reloadTree: () => ensureTreeLoaded(true),
        markLLMActivity,
        currentState: computed(() => currentState.value),
        currentStateId: readonly(currentStateId),
        variables: readonly(variables),
        flags: readonly(flags),
        nextCandidates,
        activeFrequency,
        communicationLog: readonly(communicationLog),
        clearCommunicationLog: () => { communicationLog.value = [] },
        flightContext: readonly(flightContext),
        currentStep,
        initializeFlight,
        updateFrequencyVariables,
        processPilotTransmission,
        processUserTransmission,
        buildLLMContext,
        applyLLMDecision,
        moveTo,
        resumePriorFlow,
        normalizeATCText,
        renderATCMessage,
        getStateDetails
    }
}
