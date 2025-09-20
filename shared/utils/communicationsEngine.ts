// communicationsEngine composable - redesigned to load decision trees from the database
import { ref, computed, readonly, watch } from 'vue'
import { normalizeRadioPhrase } from './radioSpeech'
import type {
  DecisionNodeAutoTransition,
  DecisionNodeData,
  DecisionNodeLLMTemplate,
  DecisionNodeUIConfig,
  DecisionTelemetryField,
  DecisionTreeDTO,
  DecisionTreeEngineState,
  DecisionRole as Role,
  DecisionPhase as Phase,
} from '../types/decisionTree'

// --- Parser setup for evaluating transition conditions ---------------------------------------
type CompiledExpression = (scope: Record<string, any>) => any

const expressionCache = new Map<string, CompiledExpression>()

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

// --- Engine specific types -------------------------------------------------------------------
interface DTState extends DecisionNodeData {
  id?: string
  auto_transitions?: DecisionNodeAutoTransition[]
  llm_templates?: DecisionNodeLLMTemplate
  ui?: DecisionNodeUIConfig
  notes?: string
}

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

interface MoveToOptions {
  skipAuto?: boolean
  reason?: string
}

interface AutoEvaluationContext {
  trigger: 'state' | 'telemetry' | 'variables' | 'flags'
  visited: Set<string>
}

interface TelemetryState {
  [key: string]: string | number | boolean | null
}

// --- Static information used by UI integrations ----------------------------------------------
export const FLIGHT_PHASES = [
  { id: 'clearance', name: 'Clearance Delivery', frequency: '121.900', action: 'Request IFR clearance' },
  { id: 'ground', name: 'Ground Control', frequency: '121.700', action: 'Request pushback and taxi' },
  { id: 'tower', name: 'Tower', frequency: '118.700', action: 'Request takeoff clearance' },
  { id: 'departure', name: 'Departure', frequency: '125.350', action: 'Initial contact after takeoff' },
  { id: 'enroute', name: 'Center', frequency: '121.800', action: 'Cruise flight monitoring' },
  { id: 'approach', name: 'Approach', frequency: '120.800', action: 'Approach clearance' },
  { id: 'landing', name: 'Tower (Landing)', frequency: '118.700', action: 'Landing clearance' },
  { id: 'taxiin', name: 'Ground (Taxi In)', frequency: '121.700', action: 'Taxi to gate' },
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
    pilotResponse: '{callsign} cleared {dest} via {sid}, runway {runway}, climb {initial_altitude_ft}, squawk {squawk}.',
  },
]

// --- Helper factories -----------------------------------------------------------------------
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
    phase: 'clearance',
  }
}

function createEmptyTree(): DecisionTreeEngineState {
  return {
    slug: 'uninitialized',
    title: 'Uninitialized flow',
    description: 'Decision tree has not been loaded yet.',
    schemaVersion: '1.0',
    startState: '__UNINITIALIZED__',
    endStates: [],
    variables: {},
    flags: { in_air: false, emergency_active: false, current_unit: 'DEL', stack: [] },
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
    phases: ['Preflight', 'Clearance', 'PushStart', 'TaxiOut', 'Departure', 'Climb', 'Enroute', 'Descent', 'Approach', 'Landing', 'TaxiIn', 'Postflight', 'Interrupt', 'LostComms', 'Missed'],
    telemetrySchema: [],
    states: {
      __UNINITIALIZED__: {
        role: 'system',
        phase: 'Preflight',
        say_tpl: 'Decision tree not loaded yet.',
        next: [],
      },
    },
  }
}

function buildTelemetry(schema: DecisionTelemetryField[] = []): TelemetryState {
  const telemetry: TelemetryState = {}
  for (const field of schema) {
    if (!field?.key) continue
    if (typeof field.default !== 'undefined') {
      telemetry[field.key] = field.default as any
    } else if (field.type === 'boolean') {
      telemetry[field.key] = false
    } else {
      telemetry[field.key] = field.type === 'string' ? '' : 0
    }
  }
  return telemetry
}

function normaliseAutoTransitions(list?: DecisionNodeAutoTransition[]): DecisionNodeAutoTransition[] {
  if (!Array.isArray(list)) return []
  return list
    .filter((entry) => entry && typeof entry.next === 'string')
    .map((entry) => ({
      id: entry.id || crypto.randomUUID?.() || `${Date.now()}_${Math.random()}`,
      name: entry.name || entry.next,
      condition: entry.condition || 'false',
      next: entry.next,
      description: entry.description,
      priority: typeof entry.priority === 'number' ? entry.priority : 0,
      requireConfirmation: Boolean(entry.requireConfirmation),
      allowRepeat: entry.allowRepeat ?? false,
      autopilot: entry.autopilot ?? true,
      watch: Array.isArray(entry.watch) ? entry.watch.filter(Boolean) : [],
    }))
}

function convertDtoToEngine(dto: DecisionTreeDTO): DecisionTreeEngineState {
  const base = dto.tree
  const states = Object.fromEntries(
    (dto.nodes || []).map((node) => {
      const data: DTState = deepClone(node.data || {})
      data.auto_transitions = normaliseAutoTransitions(node.autoTransitions || data.auto_transitions)
      if (node.llmTemplates && !data.llm_templates) {
        data.llm_templates = deepClone(node.llmTemplates)
      }
      if (node.ui && !data.ui) {
        data.ui = deepClone(node.ui)
      }
      if (node.notes && !data.notes) {
        data.notes = node.notes
      }
      return [node.id, data]
    })
  ) as Record<string, DTState>

  return {
    slug: base.slug,
    title: base.title,
    description: base.description || '',
    schemaVersion: base.schemaVersion || '1.0',
    startState: base.startState,
    endStates: Array.isArray(base.endStates) ? [...base.endStates] : [],
    variables: deepClone(base.variables || {}),
    flags: deepClone(base.flags || { in_air: false, emergency_active: false, current_unit: 'DEL', stack: [] }),
    policies: deepClone(base.policies || {}),
    hooks: deepClone(base.hooks || {}),
    roles: (base.roles?.length ? base.roles : ['pilot', 'atc', 'system']) as Role[],
    phases: (base.phases?.length
      ? base.phases
      : ['Preflight', 'Clearance', 'PushStart', 'TaxiOut', 'Departure', 'Climb', 'Enroute', 'Descent', 'Approach', 'Landing', 'TaxiIn', 'Postflight', 'Interrupt', 'LostComms', 'Missed']) as Phase[],
    telemetrySchema: deepClone(base.telemetrySchema || []),
    states: Object.keys(states).length ? states : createEmptyTree().states,
  }
}

function createInitialFlags(flags: Record<string, any>): Record<string, any> {
  const base = deepClone(flags || {})
  if (!Array.isArray(base.stack)) base.stack = []
  return {
    in_air: Boolean(base.in_air),
    emergency_active: Boolean(base.emergency_active),
    current_unit: typeof base.current_unit === 'string' ? base.current_unit : 'DEL',
    stack: base.stack,
    off_schema_count: 0,
    radio_checks_done: 0,
  }
}

function compileExpression(expression: string): CompiledExpression {
  const trimmed = expression.trim()
  if (!trimmed) {
    return () => false
  }
  const body = trimmed.includes('return') ? trimmed : `return (${trimmed})`
  return new Function('scope', `with (scope) { ${body} }`) as CompiledExpression
}

function evaluateExpression(expr: string, context: Record<string, any>): boolean {
  try {
    const key = expr?.trim() || ''
    if (!key) return false
    let compiled = expressionCache.get(key)
    if (!compiled) {
      compiled = compileExpression(key)
      expressionCache.set(key, compiled)
    }
    const result = compiled(context)
    return Boolean(result)
  } catch (error) {
    console.warn(`[Engine] Failed to evaluate expression "${expr}":`, error)
    return false
  }
}

function unitFromHandoff(to: string, fallbackUnit: string) {
  if (/GROUND/i.test(to)) return 'GROUND'
  if (/TOWER/i.test(to)) return 'TOWER'
  if (/DEPART/i.test(to)) return 'DEP'
  if (/APPROACH/i.test(to)) return 'APP'
  if (/CENTER|CTR/i.test(to)) return 'CTR'
  if (/DEL|DELIVERY/i.test(to)) return 'DEL'
  return fallbackUnit
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

function renderTpl(tpl: string, ctx: Record<string, any>): string {
  return tpl.replace(/\{([\w.]+)\}/g, (_match, key) => {
    const parts = String(key).split('.')
    let cur: any = ctx
    for (const part of parts) {
      if (cur == null) break
      cur = cur[part]
    }
    return cur != null ? String(cur) : ''
  })
}

function createTelemetryContext(schema: DecisionTelemetryField[], telemetry: TelemetryState) {
  const ctx: Record<string, any> = {}
  for (const field of schema) {
    ctx[field.key] = telemetry[field.key]
  }
  return ctx
}

export default function useCommunicationsEngine(initialTree?: DecisionTreeDTO) {
  const tree = ref<DecisionTreeEngineState>(createEmptyTree())
  const treeLoaded = ref(false)

  const variables = ref<Record<string, any>>(deepClone(tree.value.variables))
  const flags = ref<Record<string, any>>(createInitialFlags(tree.value.flags))
  const telemetry = ref<TelemetryState>(buildTelemetry(tree.value.telemetrySchema))
  const currentStateId = ref<string>(tree.value.startState)
  const communicationLog = ref<EngineLog[]>([])
  const flightContext = ref<FlightContext>(createDefaultFlightContext())

  function exposeCtx() {
    return {
      ...variables.value,
      ...flags.value,
      telemetry: telemetry.value,
      variables: variables.value,
      flags: flags.value,
    }
  }

  function exposeCtxFlat() {
    return { ...variables.value, ...flags.value, ...telemetry.value }
  }

  function loadTree(dto: DecisionTreeDTO) {
    const engineTree = convertDtoToEngine(dto)
    tree.value = engineTree
    variables.value = deepClone(engineTree.variables)
    flags.value = createInitialFlags(engineTree.flags)
    telemetry.value = buildTelemetry(engineTree.telemetrySchema)
    currentStateId.value = engineTree.startState
    communicationLog.value = []
    Object.assign(flightContext.value, { ...variables.value, phase: 'clearance' })
    treeLoaded.value = true
  }

  if (initialTree) {
    loadTree(initialTree)
  }

  const states = computed<Record<string, DTState>>(() => tree.value.states)

  const currentState = computed<DTState>(() => {
    const state = states.value[currentStateId.value]
    if (state) {
      return { ...state, id: currentStateId.value }
    }
    return { ...tree.value.states.__UNINITIALIZED__, id: currentStateId.value }
  })

  const nextCandidates = computed<string[]>(() => {
    const s = currentState.value
    const nextList = [
      ...(s.next ?? []),
      ...(s.ok_next ?? []),
      ...(s.bad_next ?? []),
      ...((s.timer_next ?? []).map((t) => ({ to: t.to })) ?? []),
    ]
    return Array.from(new Set(nextList.map((entry) => entry.to)))
  })

  const activeFrequency = computed<string | undefined>(() => {
    switch (flags.value.current_unit) {
      case 'DEL':
        return variables.value.delivery_freq
      case 'GROUND':
        return variables.value.ground_freq
      case 'TOWER':
        return variables.value.tower_freq
      case 'DEP':
        return variables.value.departure_freq
      case 'APP':
        return variables.value.approach_freq
      case 'CTR':
        return variables.value.handoff_freq
      default:
        return undefined
    }
  })

  const currentStep = computed(() => {
    const phase = flightContext.value.phase
    const step = COMMUNICATION_STEPS.find((s) => s.phase === phase)
    if (!step) return null
    const ctx = { ...variables.value, ...flags.value }
    return {
      ...step,
      pilot: renderTpl(step.pilot, ctx),
      atc: step.atc ? renderTpl(step.atc, ctx) : undefined,
      pilotResponse: step.pilotResponse ? renderTpl(step.pilotResponse, ctx) : undefined,
    }
  })

  function initializeFlight(fpl: any) {
    const generated = {
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
      cruise_flight_level: fpl.altitude
        ? `FL${String(Math.floor(parseInt(fpl.altitude) / 100)).padStart(3, '0')}`
        : 'FL360',
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
      time_now: new Date().toISOString(),
    }

    variables.value = { ...variables.value, ...generated }
    Object.assign(flightContext.value, { ...generated, phase: 'clearance' })

    flags.value = {
      ...flags.value,
      in_air: false,
      emergency_active: false,
      current_unit: 'DEL',
      stack: [],
      off_schema_count: 0,
      radio_checks_done: 0,
    }

    currentStateId.value = tree.value.startState
    communicationLog.value = []
    evaluateAutoTransitions({ trigger: 'state', visited: new Set() })
  }

  function updateFrequencyVariables(update: Partial<Record<string, string>>) {
    if (!update) return
    const sanitizedEntries = Object.entries(update)
      .filter(([, value]) => typeof value === 'string' && value.trim().length)
      .map(([key, value]) => [key, value!.trim()]) as [string, string][]

    if (!sanitizedEntries.length) {
      return
    }

    for (const [key, value] of sanitizedEntries) {
      variables.value[key] = value
    }

    Object.assign(flightContext.value, Object.fromEntries(sanitizedEntries))
  }

  function buildLLMContext(pilotTranscript: string) {
    const s = currentState.value
    return {
      state_id: s.id,
      state: s,
      candidates: nextCandidates.value.map((id) => ({ id, state: states.value[id] })),
      variables: variables.value,
      flags: flags.value,
      pilot_utterance: pilotTranscript,
    }
  }

  function applyLLMDecision(decision: any) {
    if (!decision) return

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
        offSchema: decision.off_schema,
      })
    }

    if (!decision.radio_check && decision.next_state) {
      moveTo(decision.next_state)
    }
  }

  function processPilotTransmission(transcript: string): string | null {
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

  function moveTo(stateId: string, options: MoveToOptions = {}) {
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
      const shouldExecute = act.if ? evaluateExpression(act.if, exposeCtx()) : true
      if (!shouldExecute) continue
      if (act.set) setByPath({ variables: variables.value, flags: flags.value }, act.set, act.to)
    }

    if (s.handoff?.to) {
      flags.value.current_unit = unitFromHandoff(s.handoff.to, flags.value.current_unit)
      if (s.handoff.freq) {
        variables.value.handoff_freq = renderTpl(s.handoff.freq, exposeCtx())
      }
    }

    if (s.say_tpl) {
      speak(s.role, s.say_tpl, s.id!)
    }

    updateFlightPhase(s.phase)

    if (!options.skipAuto) {
      evaluateAutoTransitions({ trigger: 'state', visited: new Set([stateId]) })
    }
  }

  function evaluateAutoTransitions(context: AutoEvaluationContext) {
    if (!treeLoaded.value) return
    const state = currentState.value
    const transitions = state.auto_transitions ?? []
    if (!transitions.length) return

    const telemetryCtx = createTelemetryContext(tree.value.telemetrySchema, telemetry.value)
    const evalContext = {
      variables: variables.value,
      flags: flags.value,
      telemetry: telemetryCtx,
      state,
    }

    const sorted = [...transitions].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    for (const transition of sorted) {
      if (!transition.condition || !transition.next) continue
      if (context.visited.has(transition.next) && !transition.allowRepeat) continue

      const shouldTrigger = evaluateExpression(transition.condition, evalContext)
      if (!shouldTrigger) continue

      console.debug(
        `[Engine] Auto transition triggered (${context.trigger}) – ${transition.name || transition.id} → ${transition.next}`,
      )

      moveTo(transition.next, { skipAuto: true, reason: `auto:${transition.id}` })
      if (transition.allowRepeat) {
        context.visited.add(transition.next)
        evaluateAutoTransitions(context)
      }
      break
    }
  }

  function updateFlightPhase(phase: Phase) {
    const phaseMap: Record<Phase, string> = {
      Clearance: 'clearance',
      PushStart: 'ground',
      TaxiOut: 'ground',
      Departure: 'tower',
      Climb: 'departure',
      Enroute: 'enroute',
      Descent: 'enroute',
      Approach: 'approach',
      Landing: 'landing',
      TaxiIn: 'taxiin',
      Preflight: 'clearance',
      Postflight: 'taxiin',
      Interrupt: flightContext.value.phase,
      LostComms: flightContext.value.phase,
      Missed: 'approach',
    }

    if (phaseMap[phase]) {
      flightContext.value.phase = phaseMap[phase]
    }
  }

  function resumePriorFlow() {
    const prev = flags.value.stack.pop()
    if (prev) moveTo(prev)
  }

  function speak(speaker: Role, tpl: string, stateId: string, options: { radioCheck?: boolean; offSchema?: boolean } = {}) {
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
    }
    communicationLog.value.push(entry)
  }

  function normalizeATCText(text: string, context: Record<string, any>): string {
    const rendered = renderTpl(text, context)
    return normalizeRadioPhrase(rendered)
  }

  function renderATCMessage(tpl: string) {
    return renderTpl(tpl, exposeCtx())
  }

  function getStateDetails(stateId: string) {
    const s = states.value[stateId]
    if (!s) return null
    return { ...s, id: stateId }
  }

  function updateTelemetry(update: Partial<TelemetryState>) {
    if (!update) return
    Object.assign(telemetry.value, update)
    evaluateAutoTransitions({ trigger: 'telemetry', visited: new Set([currentStateId.value]) })
  }

  watch(
    variables,
    () => {
      evaluateAutoTransitions({ trigger: 'variables', visited: new Set([currentStateId.value]) })
    },
    { deep: true },
  )

  watch(
    flags,
    () => {
      evaluateAutoTransitions({ trigger: 'flags', visited: new Set([currentStateId.value]) })
    },
    { deep: true },
  )

  function genStand() {
    const arr = ['A12', 'B15', 'C23', 'D8', 'E41', 'F18', 'G7', 'H33']
    return arr[Math.floor(Math.random() * arr.length)]
  }

  function genRunway() {
    const arr = ['25L', '25R', '07L', '07R', '18', '36', '09', '27']
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

  return {
    ready: computed(() => treeLoaded.value),
    loadTree,
    tree: readonly(tree),
    telemetry: readonly(telemetry),

    currentState: computed(() => currentState.value),
    currentStateId: readonly(currentStateId),
    variables: readonly(variables),
    flags: readonly(flags),
    nextCandidates,
    activeFrequency,
    communicationLog: readonly(communicationLog),
    clearCommunicationLog: () => {
      communicationLog.value = []
    },

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
    updateTelemetry,

    normalizeATCText,
    renderATCMessage,
    getStateDetails,
  }
}
