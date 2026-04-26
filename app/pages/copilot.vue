<script setup lang="ts">
import {computed, defineComponent, h, nextTick, onMounted, onUnmounted, ref, watch} from 'vue'
import {VMenu} from 'vuetify/components'
import {a320Profile, glossary, scratchFields, type SopPhase, type SopStep} from '~~/shared/data/a320SopTimeline'

// RichText: rendert Text mit Glossar-Pills + Scratchpad-Placeholders
const RichText = defineComponent({
    name: 'RichText',
    props: {
        tokens: {type: Array as () => any[], required: true},
        resolve: {type: Function as any, required: true},
        glossary: {type: Object as any, required: true},
    },
    setup(props) {
        return () => h('span', {class: 'rt'},
            (props.tokens as any[]).map((seg, i) => {
                if (seg.type === 'placeholder') {
                    const v = props.resolve(seg.placeholderKey)
                    if (v) return h('span', {key: i, class: 'rt-placeholder filled'}, v)
                    return h('span', {key: i, class: 'rt-placeholder'}, seg.value)
                }
                if (seg.type === 'term') {
                    const entry = (props.glossary as Map<string, any>).get(seg.term)
                    if (!entry) return h('span', {key: i}, seg.value)
                    return h(VMenu as any, {
                        key: i,
                        openOnHover: true,
                        openOnClick: true,
                        location: 'top',
                        offset: 6,
                        closeOnContentClick: false,
                    }, {
                        activator: ({props: a}: any) => h('span', {...a, class: 'rt-term'}, seg.value),
                        default: () => h('div', {class: 'rt-term-popover'}, [
                            h('div', {class: 'rt-term-head'}, entry.term),
                            h('div', {class: 'rt-term-short'}, entry.short),
                            entry.long ? h('div', {class: 'rt-term-long'}, entry.long) : null,
                        ]),
                    })
                }
                return h('span', {key: i}, seg.value)
            }),
        )
    },
})

useHead({
    title: 'Copilot · A320 SOP – OpenSquawk',
    meta: [
        {name: 'apple-mobile-web-app-capable', content: 'yes'},
        {name: 'mobile-web-app-capable', content: 'yes'},
        {name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent'},
        {name: 'theme-color', content: '#0b1020'},
        {name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no'},
    ],
    link: [{rel: 'manifest', href: '/copilot.webmanifest'}],
})

const STORAGE_KEY = 'opensquawk.copilot.v3'

const activeProfile = ref(a320Profile)
const phases = computed<SopPhase[]>(() => activeProfile.value.phases)

const scratch = ref<Record<string, string>>({})
const variantSel = ref<Record<string, string>>({})
const expanded = ref<Record<string, boolean>>({})
const activeStepId = ref<string | null>(null)
const simbriefUser = ref('')
const simbriefLoading = ref(false)
const simbriefError = ref('')
const showAside = ref(false)
const rightTab = ref<'scratch' | 'canvas'>('scratch')

// Quick-Jot
interface QuickNote {
    text: string
    time: string
}

const quickDraft = ref('')
const quickNotes = ref<QuickNote[]>([])

function feedQuick() {
    const t = quickDraft.value.trim()
    if (!t) return
    const time = new Date().toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'})
    quickNotes.value.push({text: t, time})
    quickDraft.value = ''
    persist()
    nextTick(() => {
        const f = document.querySelector('.quickjot-feed') as HTMLElement | null
        if (f) f.scrollTop = f.scrollHeight
    })
}

function clearJot() {
    if (!confirm('Alle Notizen löschen?')) return
    quickNotes.value = []
    persist()
}

// Glossary
const glossaryByTerm = new Map(glossary.map(g => [g.term.toUpperCase(), g]))
const glossaryRegex = (() => {
    const sorted = [...glossary].sort((a, b) => b.term.length - a.term.length)
    const escaped = sorted.map(g => g.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    return new RegExp(`\\b(${escaped.join('|')})\\b`, 'g')
})()

interface Segment {
    type: 'text' | 'term' | 'placeholder'
    value: string
    term?: string
    placeholderKey?: string
}

function tokenize(input: string): Segment[] {
    if (!input) return []
    const out: Segment[] = []
    const placeholderRx = /\[([A-Z0-9_ +/-]+)\]/g
    let last = 0
    let m: RegExpExecArray | null
    while ((m = placeholderRx.exec(input)) !== null) {
        if (m.index > last) out.push(...splitGlossary(input.slice(last, m.index)))
        const key = m[1].trim()
        out.push({type: 'placeholder', value: m[0], placeholderKey: key})
        last = m.index + m[0].length
    }
    if (last < input.length) out.push(...splitGlossary(input.slice(last)))
    return out
}

function splitGlossary(text: string): Segment[] {
    const out: Segment[] = []
    let last = 0
    let m: RegExpExecArray | null
    glossaryRegex.lastIndex = 0
    while ((m = glossaryRegex.exec(text)) !== null) {
        if (m.index > last) out.push({type: 'text', value: text.slice(last, m.index)})
        out.push({type: 'term', value: m[0], term: m[0].toUpperCase()})
        last = m.index + m[0].length
    }
    if (last < text.length) out.push({type: 'text', value: text.slice(last)})
    return out
}

function placeholderValue(key: string): string {
    const map: Record<string, string> = {
        Callsign: 'callsign', CALLSIGN: 'callsign',
        DEST: 'destination',
        SID: 'sid',
        RWY: 'rwy',
        STAND: 'stand',
        ATIS: 'atisLetter',
        SQK: 'squawk',
        INIT_ALT: 'initialClimb',
        PASSING_ALT: 'initialClimb',
        TWR_FREQ: 'twrFreq',
        DEP_FREQ: 'depFreq',
        FREQ: 'depFreq',
        WIND: 'wind',
        FLEX_TEMP: 'flexTemp',
        TAXI_ROUTE: 'taxiRoute',
        HOLDING: 'holdingPoint',
        DIRECTION: '',
        Station: '',
    }
    const fieldKey = map[key]
    if (fieldKey) return scratch.value[fieldKey] || ''
    return ''
}

// SimBrief Import
async function importSimbrief() {
    if (!simbriefUser.value.trim()) return
    simbriefLoading.value = true
    simbriefError.value = ''
    try {
        const value = simbriefUser.value.trim()
        const isNumeric = /^\d+$/.test(value)
        const params = isNumeric ? {userid: value} : {username: value}
        const data = await $fetch<any>('/api/copilot/simbrief', {params})
        const map: Record<string, any> = {
            callsign: data.callsign,
            flightNumber: data.flightNumber,
            aircraftReg: data.aircraftReg,
            departure: data.departure,
            destination: data.destination,
            altn: data.altn,
            route: data.route,
            crzFL: data.crzFL,
            costIndex: data.costIndex,
            zfw: data.zfw,
            blockFuel: data.blockFuel,
            tripFuel: data.tripFuel,
            sid: data.sid,
            rwy: data.rwy,
            transAlt: data.transAlt,
            transLevel: data.transLevel,
            initialClimb: data.atc?.initial_alt,
        }
        for (const [k, v] of Object.entries(map)) {
            if (v !== undefined && v !== null && v !== '') scratch.value[k] = String(v)
        }
        persist()
    } catch (e: any) {
        simbriefError.value = e?.data?.statusMessage || e?.message || 'Fehler beim Laden'
    } finally {
        simbriefLoading.value = false
    }
}

// Steps mit Variants flach
function stepsForPhase(phase: SopPhase): SopStep[] {
    const out: SopStep[] = []
    for (const s of phase.steps) {
        out.push(s)
        if (s.variants?.length) {
            const sel = variantSel.value[s.id] || s.variants[0].id
            const variant = s.variants.find(v => v.id === sel)
            if (variant) out.push(...variant.steps)
        }
    }
    return out
}

const allSteps = computed(() => {
    const out: { phase: SopPhase; step: SopStep; idx: number }[] = []
    let i = 0
    for (const p of phases.value) for (const s of stepsForPhase(p)) out.push({phase: p, step: s, idx: i++})
    return out
})

const activeIdx = computed(() => allSteps.value.findIndex(s => s.step.id === activeStepId.value))
const activeStep = computed(() => allSteps.value[activeIdx.value])

const phaseProgress = computed(() => {
    const ai = activeIdx.value
    const out: Record<string, { done: number; total: number; pct: number }> = {}
    for (const p of phases.value) {
        const steps = stepsForPhase(p)
        const total = steps.length
        let done = 0
        for (const s of steps) {
            const idx = allSteps.value.findIndex(a => a.step.id === s.id)
            if (idx >= 0 && idx < ai) done++
        }
        out[p.id] = {done, total, pct: total ? Math.round(done / total * 100) : 0}
    }
    return out
})

const totalProgress = computed(() => {
    const total = allSteps.value.length
    if (!total || activeIdx.value < 0) return 0
    return Math.round((activeIdx.value / total) * 100)
})

function positionClass(idx: number): string {
    const ai = activeIdx.value
    if (idx === ai) return 'is-active'
    const d = idx - ai
    if (d < 0) return Math.abs(d) <= 1 ? 'is-past is-near' : 'is-past'
    return d <= 1 ? 'is-future is-near' : 'is-future'
}

let scrollLock = false

function setActive(id: string) {
    activeStepId.value = id
    nextTick(() => scrollToStep(id))
}

function nextStep() {
    if (activeIdx.value < 0 || activeIdx.value >= allSteps.value.length - 1) return
    activeStepId.value = allSteps.value[activeIdx.value + 1].step.id
    nextTick(() => scrollToStep(activeStepId.value!))
}

function prevStep() {
    if (activeIdx.value <= 0) return
    activeStepId.value = allSteps.value[activeIdx.value - 1].step.id
    nextTick(() => scrollToStep(activeStepId.value!))
}

function scrollToStep(id: string) {
    const el = document.querySelector(`[data-step-id="${id}"]`) as HTMLElement | null
    if (!el) return
    scrollLock = true
    el.scrollIntoView({behavior: 'smooth', block: 'center'})
    setTimeout(() => {
        scrollLock = false
    }, 600)
}

function toggleWhy(id: string) {
    expanded.value[id] = !expanded.value[id]
}

function jumpToPhase(id: string) {
    const phase = phases.value.find(p => p.id === id)
    if (!phase || !phase.steps[0]) return
    setActive(phase.steps[0].id)
}

function resetAll() {
    if (!confirm('Alle Eingaben & Fortschritt löschen?')) return
    scratch.value = {}
    variantSel.value = {}
    expanded.value = {}
    activeStepId.value = phases.value[0]?.steps[0]?.id || null
    persist()
}

// Persistence
function persist() {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        scratch: scratch.value,
        variantSel: variantSel.value,
        activeStepId: activeStepId.value,
        quickNotes: quickNotes.value,
    }))
}

watch([scratch, variantSel], persist, {deep: true})
watch(quickNotes, persist, {deep: true})

// Keyboard
function onKey(e: KeyboardEvent) {
    const t = e.target as HTMLElement
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        nextStep()
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        prevStep()
    } else if (e.key === 'Enter') {
        e.preventDefault()
        nextStep()
    } else if (e.key === 'i' || e.key === 'I') {
        if (activeStepId.value) toggleWhy(activeStepId.value)
    }
}

// Active-Step durch Scrollen erkennen
let observer: IntersectionObserver | null = null

function setupObserver() {
    if (typeof IntersectionObserver === 'undefined') return
    observer?.disconnect()
    const root = document.querySelector('.timeline') as HTMLElement | null
    if (!root) return
    observer = new IntersectionObserver((entries) => {
        if (scrollLock) return
        let best: { id: string; ratio: number } | null = null
        for (const e of entries) {
            if (e.isIntersecting) {
                const id = (e.target as HTMLElement).dataset.stepId
                if (!id) continue
                if (!best || e.intersectionRatio > best.ratio) best = {id, ratio: e.intersectionRatio}
            }
        }
        if (best) activeStepId.value = best.id
    }, {root, rootMargin: '-40% 0px -40% 0px', threshold: [0, 0.1, 0.5, 1]})
    document.querySelectorAll('[data-step-id]').forEach(el => observer?.observe(el))
}

watch(allSteps, () => nextTick(setupObserver))

onMounted(() => {
    if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
            try {
                const v = JSON.parse(raw)
                if (v.scratch) scratch.value = v.scratch
                if (v.variantSel) variantSel.value = v.variantSel
                if (v.activeStepId) activeStepId.value = v.activeStepId
                if (Array.isArray(v.quickNotes)) quickNotes.value = v.quickNotes
            } catch {
            }
        }
    }
    if (!activeStepId.value && allSteps.value.length) activeStepId.value = allSteps.value[0].step.id
    nextTick(() => {
        setupObserver()
        scrollToStep(activeStepId.value!)
        setupCanvas()
    })
    window.addEventListener('keydown', onKey)
})

onUnmounted(() => {
    observer?.disconnect()
    window.removeEventListener('keydown', onKey)
})

// Scratchpad Felder
const groupedFields = computed(() => {
    const groups: Record<string, typeof scratchFields> = {}
    for (const f of scratchFields) {
        if (!groups[f.group]) groups[f.group] = []
        groups[f.group].push(f)
    }
    return groups
})

const groupTitles: Record<string, string> = {
    flight: 'Flight',
    env: 'ATIS / Environment',
    atc: 'ATC',
    perf: 'Performance',
    fuel: 'Fuel & Weights',
}

// Canvas
const canvasRef = ref<HTMLCanvasElement | null>(null)
const drawColor = ref('#fde68a')
const lineWidth = ref(2.6)
let canvasInited = false

function setupCanvas() {
    const cv = canvasRef.value
    if (!cv || canvasInited) return
    canvasInited = true
    const dpr = window.devicePixelRatio || 1
    const resize = () => {
        const rect = cv.getBoundingClientRect()
        if (rect.width <= 0 || rect.height <= 0) return
        cv.width = rect.width * dpr
        cv.height = rect.height * dpr
        const ctx = cv.getContext('2d')!
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale(dpr, dpr)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
    }
    resize()
    new ResizeObserver(resize).observe(cv)

    let drawing = false
    let last: { x: number; y: number; p: number } | null = null
    const pos = (e: PointerEvent) => {
        const r = cv.getBoundingClientRect()
        return {x: e.clientX - r.left, y: e.clientY - r.top, p: e.pressure > 0 ? e.pressure : 0.5}
    }
    cv.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        cv.setPointerCapture(e.pointerId)
        drawing = true
        last = pos(e)
    })
    cv.addEventListener('pointermove', (e) => {
        if (!drawing || !last) return
        e.preventDefault()
        const ctx = cv.getContext('2d')!
        const cur = pos(e)
        ctx.strokeStyle = drawColor.value
        ctx.lineWidth = lineWidth.value * (0.5 + cur.p)
        ctx.beginPath()
        ctx.moveTo(last.x, last.y)
        ctx.lineTo(cur.x, cur.y)
        ctx.stroke()
        last = cur
    })
    const stop = (e: PointerEvent) => {
        drawing = false
        last = null
        if (cv.hasPointerCapture(e.pointerId)) cv.releasePointerCapture(e.pointerId)
    }
    cv.addEventListener('pointerup', stop)
    cv.addEventListener('pointercancel', stop)
    cv.addEventListener('pointerleave', stop)
}

watch(rightTab, (v) => {
    if (v === 'canvas') nextTick(setupCanvas)
})

function clearCanvas() {
    const cv = canvasRef.value
    if (!cv) return
    const ctx = cv.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, cv.width, cv.height)
    ctx.restore()
    ctx.scale(dpr, dpr)
}

// Actor-Meta
const actorIcon: Record<string, string> = {
    pilot: 'mdi-radio-handheld',
    pf: 'mdi-airplane',
    pm: 'mdi-eye-check',
    atc: 'mdi-tower-fire',
    cabin: 'mdi-account-group',
    system: 'mdi-cog-sync-outline',
}

const actorLabel: Record<string, string> = {
    pilot: 'Funkspruch · DU',
    pf: 'Pilot Flying',
    pm: 'Pilot Monitoring',
    atc: 'ATC sagt',
    cabin: 'Cabin Crew',
    system: 'Flugzeug',
}
</script>

<template>
    <div class="copilot scene">
        <!-- HUD -->
        <header class="hud">
            <div class="hud-inner">
                <div class="hud-left">
                    <NuxtLink to="/" class="hud-logo" title="Zurück">
                        <v-icon size="22">mdi-radar</v-icon>
                    </NuxtLink>
                    <div class="hud-divider"/>
                    <div class="hud-brand">
                        <div class="brand-name">Copilot</div>
                        <div class="brand-mode">{{ activeProfile.name }}</div>
                    </div>
                </div>

                <div class="hud-right">
                    <div class="simbrief-box">
                        <v-icon size="16" class="simbrief-icon">mdi-cloud-download-outline</v-icon>
                        <input
                            v-model="simbriefUser"
                            placeholder="SimBrief User / ID"
                            class="simbrief-input"
                            @keyup.enter="importSimbrief"
                        />
                        <button
                            class="simbrief-btn"
                            :disabled="simbriefLoading || !simbriefUser.trim()"
                            @click="importSimbrief"
                        >
                            <v-icon v-if="simbriefLoading" size="14">mdi-loading mdi-spin</v-icon>
                            <span v-else>Import</span>
                        </button>
                    </div>
                    <button class="icon-btn" :title="showAside ? 'Schließen' : 'Scratchpad / Canvas'"
                            @click="showAside = !showAside">
                        <v-icon size="20">{{ showAside ? 'mdi-close' : 'mdi-notebook-edit-outline' }}</v-icon>
                    </button>
                    <button class="icon-btn" title="Reset" @click="resetAll">
                        <v-icon size="20">mdi-refresh</v-icon>
                    </button>
                </div>
            </div>
            <div class="phase-bar">
                <button
                    v-for="p in phases"
                    :key="p.id"
                    class="phase-pill"
                    :class="['accent-' + p.accent, {active: activeStep?.phase.id === p.id}]"
                    @click="jumpToPhase(p.id)"
                >
                    <span class="phase-pill-label">{{ p.title }}</span>
                    <span class="phase-pill-progress">{{ phaseProgress[p.id]?.done }}/{{ phaseProgress[p.id]?.total }}</span>
                </button>
            </div>
            <div class="progress-track">
                <div class="progress-fill" :style="{width: totalProgress + '%'}"/>
            </div>
            <div v-if="simbriefError" class="error-banner">{{ simbriefError }}</div>
        </header>

        <main class="body">
            <!-- Timeline -->
            <section class="timeline-col">
                <div class="timeline">
                    <div class="timeline-spacer"/>

                    <template v-for="(phase, pi) in phases" :key="phase.id">
                        <!-- Phase Banner als nahtloser Abschnitt -->
                        <div :class="['phase-banner', 'accent-' + phase.accent, {first: pi === 0}]">
                            <div class="phase-banner-bar"/>
                            <div class="phase-banner-body">
                                <div class="phase-eyebrow">Phase {{ pi + 1 }} · {{ phases.length }}</div>
                                <h2 class="phase-title">{{ phase.title }}</h2>
                                <div v-if="phase.subtitle" class="phase-sub">{{ phase.subtitle }}</div>
                            </div>
                            <div class="phase-progress-mini">
                                <div class="phase-progress-mini-track">
                                    <div class="phase-progress-mini-fill" :style="{width: phaseProgress[phase.id]?.pct + '%'}"/>
                                </div>
                                <span>{{ phaseProgress[phase.id]?.done }}/{{ phaseProgress[phase.id]?.total }}</span>
                            </div>
                        </div>

                        <template v-for="step in phase.steps" :key="step.id">
                            <!-- Step Block (mit oder ohne Variants) -->
                            <article
                                :data-step-id="step.id"
                                :class="['step', 'accent-' + phase.accent,
                                    positionClass(allSteps.findIndex(a => a.step.id === step.id)),
                                    `actor-${step.actor}`,
                                    {'has-variants': !!step.variants}]"
                                @click="setActive(step.id)"
                            >
                                <div class="step-rail">
                                    <div class="actor-dot">
                                        <v-icon size="18">{{ actorIcon[step.actor] }}</v-icon>
                                    </div>
                                </div>
                                <div class="step-body">
                                    <div class="step-meta">
                                        <span class="actor-label">{{ actorLabel[step.actor] }}</span>
                                        <span v-if="step.look" class="look-pill">
                                            <v-icon size="12">mdi-eye-outline</v-icon>
                                            {{ step.look }}
                                        </span>
                                    </div>
                                    <h3 class="step-title">
                                        <RichText :tokens="tokenize(step.label)" :resolve="placeholderValue" :glossary="glossaryByTerm"/>
                                    </h3>

                                    <div v-if="step.callout" class="callout">
                                        <v-icon size="16" class="callout-icon">mdi-radio-handheld</v-icon>
                                        <div class="callout-text">
                                            <RichText :tokens="tokenize(step.callout)" :resolve="placeholderValue" :glossary="glossaryByTerm"/>
                                        </div>
                                    </div>

                                    <p v-if="step.detail" class="step-detail">
                                        <RichText :tokens="tokenize(step.detail)" :resolve="placeholderValue" :glossary="glossaryByTerm"/>
                                    </p>

                                    <Transition name="why">
                                        <div v-if="expanded[step.id] && step.why" class="why-block">
                                            <div class="why-label">
                                                <v-icon size="14">mdi-lightbulb-on-outline</v-icon>
                                                Warum?
                                            </div>
                                            <p>
                                                <RichText :tokens="tokenize(step.why)" :resolve="placeholderValue" :glossary="glossaryByTerm"/>
                                            </p>
                                        </div>
                                    </Transition>

                                    <div v-if="step.simNote" class="sim-note">
                                        <v-icon size="13">mdi-monitor</v-icon>
                                        <span>{{ step.simNote }}</span>
                                    </div>

                                    <div v-if="step.inputKeys?.length" class="input-row">
                                        <span
                                            v-for="k in step.inputKeys"
                                            :key="k"
                                            class="input-chip"
                                            :class="{filled: !!scratch[k]}"
                                        >
                                            <span class="input-chip-label">{{ scratchFields.find(f => f.key === k)?.label || k }}</span>
                                            <span v-if="scratch[k]" class="input-chip-value">{{ scratch[k] }}</span>
                                        </span>
                                    </div>

                                    <div v-if="step.variants?.length" class="variant-tabs" @click.stop>
                                        <button
                                            v-for="v in step.variants"
                                            :key="v.id"
                                            class="variant-tab"
                                            :class="{active: (variantSel[step.id] || step.variants[0].id) === v.id}"
                                            @click="variantSel[step.id] = v.id"
                                        >
                                            {{ v.title }}
                                        </button>
                                    </div>

                                    <!-- Inline Actions: nur auf aktiver Karte -->
                                    <Transition name="actions">
                                        <div v-if="activeStepId === step.id" class="inline-actions" @click.stop>
                                            <button class="act act-back" :disabled="activeIdx <= 0" @click="prevStep">
                                                <v-icon size="20">mdi-chevron-left</v-icon>
                                                <span>Back</span>
                                            </button>
                                            <button v-if="step.why" class="act act-why" :class="{open: expanded[step.id]}" @click="toggleWhy(step.id)">
                                                <v-icon size="18">{{ expanded[step.id] ? 'mdi-information' : 'mdi-information-outline' }}</v-icon>
                                                <span>Warum</span>
                                            </button>
                                            <button class="act act-next" :disabled="activeIdx >= allSteps.length - 1" @click="nextStep">
                                                <span>Done & Next</span>
                                                <v-icon size="20">mdi-chevron-right</v-icon>
                                            </button>
                                        </div>
                                    </Transition>
                                </div>
                            </article>
                        </template>
                    </template>

                    <div class="timeline-spacer"/>
                </div>
            </section>

            <!-- Aside (Scratchpad / Canvas) -->
            <aside class="aside" :class="{'mobile-open': showAside}">
                <div class="aside-tabs">
                    <button :class="['aside-tab', {active: rightTab === 'scratch'}]" @click="rightTab = 'scratch'">
                        <v-icon size="18">mdi-notebook-edit-outline</v-icon>
                        Scratchpad
                    </button>
                    <button :class="['aside-tab', {active: rightTab === 'canvas'}]" @click="rightTab = 'canvas'">
                        <v-icon size="18">mdi-draw-pen</v-icon>
                        Canvas
                    </button>
                </div>

                <div v-show="rightTab === 'scratch'" class="scratchpad">
                    <div v-for="(fields, group) in groupedFields" :key="group" class="field-group">
                        <div class="field-group-title">{{ groupTitles[group] || group }}</div>
                        <div class="field-grid">
                            <label v-for="f in fields" :key="f.key" class="field">
                                <span class="field-label">{{ f.label }}</span>
                                <input v-model="scratch[f.key]" :placeholder="f.placeholder" class="field-input"/>
                            </label>
                        </div>
                    </div>
                </div>

                <div v-show="rightTab === 'canvas'" class="canvas-wrap">
                    <div class="canvas-toolbar">
                        <div class="color-row">
                            <button
                                v-for="c in ['#fde68a','#22d3ee','#a78bfa','#f472b6','#ffffff']"
                                :key="c"
                                class="color-dot"
                                :style="{background: c}"
                                :class="{active: drawColor === c}"
                                @click="drawColor = c"
                            />
                        </div>
                        <input v-model.number="lineWidth" type="range" min="1" max="6" step="0.5" class="line-slider"/>
                        <button class="canvas-clear" @click="clearCanvas">
                            <v-icon size="14">mdi-eraser</v-icon>
                            Clear
                        </button>
                    </div>
                    <canvas ref="canvasRef" class="canvas"/>
                    <div class="canvas-hint">Maus, Trackpad, Apple Pencil & Stylus – druckempfindlich.</div>
                </div>
            </aside>
        </main>

        <!-- Mobile Quick-Jot -->
        <div class="quickjot">
            <div v-if="quickNotes.length" class="quickjot-feed">
                <div v-for="(n, i) in quickNotes" :key="i" class="quickjot-note">
                    <span class="quickjot-time">{{ n.time }}</span>
                    <span class="quickjot-text">{{ n.text }}</span>
                </div>
            </div>
            <div class="quickjot-input">
                <input
                    v-model="quickDraft"
                    placeholder="Schnell notieren · Enter oder ↑"
                    class="quickjot-field"
                    @keyup.enter="feedQuick"
                />
                <button v-if="quickNotes.length" class="quickjot-clear" title="Notizen löschen" @click="clearJot">
                    <v-icon size="16">mdi-delete-outline</v-icon>
                </button>
                <button class="quickjot-feed-btn" :disabled="!quickDraft.trim()" title="Feed (nach oben pushen)" @click="feedQuick">
                    <v-icon size="18">mdi-arrow-up-bold</v-icon>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.copilot {
    --bg: #0b1020;
    --bg2: #0a0f1c;
    --accent: #22d3ee;
    --accent2: #0ea5e9;
    --text: #ffffff;
    --t2: rgba(255, 255, 255, .80);
    --t3: rgba(255, 255, 255, .60);
    --t4: rgba(255, 255, 255, .38);
    --border: rgba(255, 255, 255, .10);
    --border-strong: rgba(255, 255, 255, .18);
    --surface: rgba(255, 255, 255, .03);
    --surface-2: rgba(255, 255, 255, .06);
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    padding-top: env(safe-area-inset-top);
    background-image:
        radial-gradient(900px 480px at 80% -10%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 60%),
        radial-gradient(680px 360px at 8% -6%, color-mix(in srgb, var(--accent2) 12%, transparent), transparent 60%);
}

.accent-cyan {
    --pa: #22d3ee;
    --pa-soft: rgba(34, 211, 238, .12);
}

.accent-sky {
    --pa: #38bdf8;
    --pa-soft: rgba(56, 189, 248, .12);
}

.accent-indigo {
    --pa: #818cf8;
    --pa-soft: rgba(129, 140, 248, .12);
}

.accent-emerald {
    --pa: #34d399;
    --pa-soft: rgba(52, 211, 153, .12);
}

.accent-amber {
    --pa: #fbbf24;
    --pa-soft: rgba(251, 191, 36, .12);
}

.accent-rose {
    --pa: #fb7185;
    --pa-soft: rgba(251, 113, 133, .12);
}

/* Actor accents */
.actor-pilot {
    --aa: #22d3ee;
}

.actor-pf {
    --aa: #34d399;
}

.actor-pm {
    --aa: #a78bfa;
}

.actor-atc {
    --aa: #fbbf24;
}

.actor-cabin {
    --aa: #fb7185;
}

.actor-system {
    --aa: #94a3b8;
}

/* HUD */
.hud {
    position: sticky;
    top: 0;
    z-index: 40;
    border-bottom: 1px solid var(--border);
    background: color-mix(in srgb, var(--bg) 86%, transparent);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
}

.hud-inner {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 14px;
    max-width: 1600px;
    margin: 0 auto;
}

.hud-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.hud-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, var(--accent) 38%, transparent);
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    color: var(--accent);
    flex-shrink: 0;
    transition: all .2s;
}

.hud-logo:hover {
    background: color-mix(in srgb, var(--accent) 22%, transparent);
}

.hud-divider {
    width: 1px;
    height: 32px;
    background: var(--border);
}

.hud-brand {
    display: flex;
    flex-direction: column;
    line-height: 1.1;
}

.brand-name {
    font-weight: 600;
    font-size: 15px;
}

.brand-mode {
    font-size: 12px;
    color: var(--accent);
}

.hud-right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
}

.simbrief-box {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px 6px 12px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--surface);
    height: 44px;
}

.simbrief-icon {
    color: var(--t3);
}

.simbrief-input {
    background: transparent;
    border: none;
    outline: none;
    color: var(--text);
    width: 150px;
    font-size: 14px;
}

.simbrief-input::placeholder {
    color: var(--t4);
}

.simbrief-btn {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 9px;
    background: var(--accent);
    color: #001218;
    border: none;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
}

.simbrief-btn:disabled {
    opacity: .4;
    cursor: not-allowed;
}

.icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--t2);
    cursor: pointer;
    transition: all .2s;
    flex-shrink: 0;
}

.icon-btn:hover {
    background: var(--surface-2);
    color: var(--text);
}

.phase-bar {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding: 0 14px 10px;
    max-width: 1600px;
    margin: 0 auto;
    scrollbar-width: none;
}

.phase-bar::-webkit-scrollbar {
    display: none;
}

.phase-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 14px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--t2);
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: all .2s;
}

.phase-pill:hover {
    background: var(--surface-2);
    color: var(--text);
}

.phase-pill.active {
    color: #001218;
    background: var(--pa);
    border-color: var(--pa);
}

.phase-pill-progress {
    font-size: 11px;
    opacity: .8;
    font-variant-numeric: tabular-nums;
}

.progress-track {
    height: 2px;
    background: var(--surface);
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #22d3ee, #818cf8, #fb7185);
    transition: width .3s ease;
}

.error-banner {
    background: color-mix(in srgb, #ef4444 14%, transparent);
    color: #fecaca;
    padding: 6px 14px;
    font-size: 12.5px;
    text-align: center;
}

/* Body */
.body {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    max-width: 1600px;
    margin: 0 auto;
    height: calc(100dvh - 132px - env(safe-area-inset-top));
}

@media (min-width: 1100px) {
    .body {
        grid-template-columns: minmax(0, 1fr) 440px;
        gap: 16px;
        padding: 16px;
        height: calc(100dvh - 148px - env(safe-area-inset-top));
    }
}

.timeline-col {
    min-width: 0;
    display: flex;
    flex-direction: column;
}

/* Timeline = große Scroll-Snap-Liste, nahtlose Blöcke */
.timeline {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
    overscroll-behavior: contain;
}

.timeline::-webkit-scrollbar {
    width: 0;
}

.timeline-spacer {
    height: 30vh;
}

/* Phase Banner – nahtlos, kein Card-Look */
.phase-banner {
    display: flex;
    align-items: stretch;
    gap: 14px;
    padding: 22px 18px 16px;
    background: linear-gradient(180deg, var(--pa-soft), transparent);
    border-top: 1px solid color-mix(in srgb, var(--pa) 24%, transparent);
    scroll-snap-align: start;
}

.phase-banner.first {
    border-top: none;
}

.phase-banner-bar {
    width: 4px;
    border-radius: 4px;
    background: var(--pa);
    box-shadow: 0 0 12px color-mix(in srgb, var(--pa) 60%, transparent);
}

.phase-banner-body {
    flex: 1;
    min-width: 0;
}

.phase-eyebrow {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: .22em;
    text-transform: uppercase;
    color: var(--pa);
    margin-bottom: 2px;
}

.phase-title {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.15;
}

.phase-sub {
    margin-top: 2px;
    font-size: 13px;
    color: var(--t3);
}

.phase-progress-mini {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    gap: 4px;
    font-size: 11.5px;
    color: var(--t3);
    font-variant-numeric: tabular-nums;
}

.phase-progress-mini-track {
    width: 72px;
    height: 3px;
    background: var(--surface-2);
    border-radius: 999px;
    overflow: hidden;
}

.phase-progress-mini-fill {
    height: 100%;
    background: var(--pa);
    transition: width .3s;
}

/* STEP BLOCK – nahtlos, ohne Card */
.step {
    position: relative;
    display: grid;
    grid-template-columns: 60px minmax(0, 1fr);
    align-items: stretch;
    gap: 0;
    padding: 16px 18px;
    border-top: 1px solid var(--border);
    cursor: pointer;
    scroll-snap-align: center;
    transition: opacity .25s, padding .2s, background .25s, transform .2s;
}

.step:first-of-type {
    border-top: none;
}

/* Position-States */
.step.is-past {
    opacity: .42;
}

.step.is-past.is-near {
    opacity: .55;
}

.step.is-future {
    opacity: .58;
}

.step.is-future.is-near {
    opacity: .78;
}

.step.is-active {
    opacity: 1;
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--pa) 8%, transparent),
        color-mix(in srgb, var(--pa) 4%, transparent) 60%,
        transparent);
    padding: 24px 18px 22px;
}

/* Linker Rail – Actor-Indicator + Linie */
.step-rail {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 60px;
}

.step-rail::before {
    content: '';
    position: absolute;
    top: -16px;
    bottom: -16px;
    left: 50%;
    width: 2px;
    transform: translateX(-50%);
    background: var(--border);
}

.step:first-of-type .step-rail::before {
    top: 0;
}

.step:last-of-type .step-rail::before {
    bottom: 0;
}

.actor-dot {
    position: relative;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid var(--bg);
    background: color-mix(in srgb, var(--aa) 22%, var(--bg));
    color: var(--aa);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--aa) 40%, transparent);
    transition: transform .25s, box-shadow .25s;
}

.step.is-active .actor-dot {
    background: var(--aa);
    color: #001218;
    transform: scale(1.18);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--aa) 28%, transparent),
        0 8px 22px color-mix(in srgb, var(--aa) 50%, transparent);
}

.step.is-past .actor-dot {
    background: color-mix(in srgb, var(--aa) 12%, var(--bg));
    color: color-mix(in srgb, var(--aa) 60%, white 0%);
}

.step.is-past .actor-dot::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: rgba(0, 0, 0, .25);
}

/* Step Body */
.step-body {
    min-width: 0;
    padding-left: 4px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.step-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.actor-label {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--aa);
}

.look-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 6px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--t3);
    font-size: 11.5px;
}

.step-title {
    font-size: 15.5px;
    font-weight: 600;
    line-height: 1.35;
    color: var(--t2);
    transition: font-size .2s, color .2s;
}

.step.is-active .step-title {
    font-size: 19px;
    color: var(--text);
}

.callout {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 10px 12px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    border-left: 3px solid var(--accent);
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 13.5px;
    line-height: 1.55;
    color: #cffafe;
}

.callout-icon {
    color: var(--accent);
    flex-shrink: 0;
    margin-top: 2px;
}

.callout-text {
    flex: 1;
    min-width: 0;
}

.step-detail {
    color: var(--t2);
    font-size: 14px;
    line-height: 1.55;
}

.sim-note {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 7px;
    background: color-mix(in srgb, #a78bfa 12%, transparent);
    border-left: 2px solid #a78bfa;
    color: #ddd6fe;
    font-size: 12px;
    width: fit-content;
}

.input-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.input-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 9px;
    border-radius: 7px;
    background: var(--surface);
    border: 1px solid var(--border);
    font-size: 12px;
}

.input-chip-label {
    color: var(--t3);
    font-weight: 600;
    font-size: 10.5px;
    letter-spacing: .08em;
    text-transform: uppercase;
}

.input-chip-value {
    color: var(--t4);
    font-variant-numeric: tabular-nums;
}

.input-chip.filled {
    border-color: color-mix(in srgb, var(--accent) 40%, transparent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
}

.input-chip.filled .input-chip-label {
    color: var(--accent);
}

.input-chip.filled .input-chip-value {
    color: #cffafe;
}

/* Why-Block */
.why-block {
    padding: 12px 14px;
    border-radius: 10px;
    background: color-mix(in srgb, #fbbf24 8%, transparent);
    border-left: 3px solid #fbbf24;
}

.why-label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 10.5px;
    letter-spacing: .18em;
    text-transform: uppercase;
    font-weight: 700;
    color: #fcd34d;
    margin-bottom: 4px;
}

.why-block p {
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--t2);
}

.why-enter-active, .why-leave-active {
    transition: opacity .2s, max-height .25s ease;
    overflow: hidden;
}

.why-enter-from, .why-leave-to {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
}

.why-enter-to, .why-leave-from {
    opacity: 1;
    max-height: 600px;
}

/* Variant Tabs */
.variant-tabs {
    display: flex;
    gap: 4px;
    padding: 4px;
    border-radius: 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    overflow-x: auto;
}

.variant-tab {
    flex: 1;
    min-width: max-content;
    padding: 9px 14px;
    border-radius: 9px;
    border: none;
    background: transparent;
    color: var(--t3);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: all .2s;
}

.variant-tab:hover {
    color: var(--text);
    background: var(--surface-2);
}

.variant-tab.active {
    background: color-mix(in srgb, var(--pa) 18%, transparent);
    color: var(--pa);
}

/* Inline Actions */
.inline-actions {
    display: flex;
    gap: 8px;
    margin-top: 6px;
    align-items: stretch;
}

.act {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 48px;
    padding: 0 16px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--t2);
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all .15s;
}

.act:hover:not(:disabled) {
    background: var(--surface-2);
    color: var(--text);
}

.act:disabled {
    opacity: .35;
    cursor: not-allowed;
}

.act-back {
    flex: 0 0 auto;
}

.act-why {
    flex: 0 0 auto;
}

.act-why.open {
    background: color-mix(in srgb, #fbbf24 18%, transparent);
    border-color: color-mix(in srgb, #fbbf24 40%, transparent);
    color: #fcd34d;
}

.act-next {
    flex: 1 1 auto;
    background: linear-gradient(135deg, var(--pa), color-mix(in srgb, var(--pa) 70%, var(--accent2) 30%));
    border-color: transparent;
    color: #001218;
    box-shadow: 0 12px 24px -10px color-mix(in srgb, var(--pa) 60%, transparent);
}

.act-next:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 18px 30px -10px color-mix(in srgb, var(--pa) 70%, transparent);
}

@media (max-width: 480px) {
    .act-back span, .act-why span {
        display: none;
    }

    .act-back, .act-why {
        padding: 0 12px;
    }
}

.actions-enter-active, .actions-leave-active {
    transition: opacity .2s, max-height .25s, transform .2s;
    overflow: hidden;
}

.actions-enter-from, .actions-leave-to {
    opacity: 0;
    max-height: 0;
    transform: translateY(-4px);
}

.actions-enter-to, .actions-leave-from {
    opacity: 1;
    max-height: 80px;
}

/* Aside */
.aside {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
}

@media (min-width: 1100px) {
    .aside {
        max-height: 100%;
    }
}

.aside-tabs {
    display: flex;
    gap: 4px;
    padding: 4px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: var(--surface);
}

.aside-tab {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 12px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: var(--t3);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
}

.aside-tab.active {
    background: var(--surface-2);
    color: var(--accent);
}

.scratchpad {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
    border-radius: 18px;
    border: 1px solid var(--border);
    background: var(--surface);
    overflow-y: auto;
    flex: 1;
    min-height: 0;
}

.field-group-title {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: .22em;
    text-transform: uppercase;
    color: var(--accent);
    opacity: .85;
    margin-bottom: 8px;
}

.field-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.field-label {
    font-size: 10.5px;
    color: var(--t4);
    letter-spacing: .08em;
    text-transform: uppercase;
    font-weight: 600;
}

.field-input {
    height: 40px;
    padding: 0 12px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: rgba(0, 0, 0, .25);
    color: var(--text);
    font-size: 14px;
    font-variant-numeric: tabular-nums;
}

.field-input::placeholder {
    color: var(--t4);
}

.field-input:focus {
    outline: none;
    border-color: color-mix(in srgb, var(--accent) 56%, transparent);
}

.canvas-wrap {
    padding: 12px;
    border-radius: 18px;
    border: 1px solid var(--border);
    background: var(--surface);
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-height: 0;
}

.canvas-toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.color-row {
    display: flex;
    gap: 6px;
}

.color-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    box-shadow: 0 0 0 2px transparent;
    cursor: pointer;
    transition: box-shadow .2s, transform .15s;
}

.color-dot.active {
    box-shadow: 0 0 0 2px var(--text);
    transform: scale(1.06);
}

.line-slider {
    flex: 1;
    accent-color: var(--accent);
    min-width: 80px;
}

.canvas-clear {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 9px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--t2);
    font-size: 12.5px;
    cursor: pointer;
}

.canvas {
    display: block;
    width: 100%;
    flex: 1;
    min-height: 280px;
    border-radius: 14px;
    background: rgba(0, 0, 0, .35);
    border: 1px solid var(--border);
    cursor: crosshair;
    touch-action: none;
}

.canvas-hint {
    font-size: 11.5px;
    color: var(--t4);
}

/* Mobile Aside Drawer */
@media (max-width: 1099px) {
    .aside {
        position: fixed;
        inset: 0;
        z-index: 70;
        background: var(--bg);
        padding: 16px;
        padding-top: calc(env(safe-area-inset-top) + 16px);
        padding-bottom: calc(env(safe-area-inset-bottom) + 80px);
        transform: translateY(100%);
        transition: transform .25s ease;
        overflow-y: auto;
    }

    .aside.mobile-open {
        transform: translateY(0);
    }

    .scratchpad, .canvas-wrap {
        max-height: none;
    }
}

/* QUICK-JOT (immer sichtbar unten auf Mobile) */
.quickjot {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 50;
    border-top: 1px solid var(--border);
    background: color-mix(in srgb, var(--bg) 92%, transparent);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    padding-bottom: env(safe-area-inset-bottom);
    display: flex;
    flex-direction: column;
    max-height: 50vh;
}

@media (min-width: 1100px) {
    .quickjot {
        display: none;
    }

    /* Auf Desktop fügen wir den Notes-Bereich später optional hinzu */
}

.quickjot-feed {
    overflow-y: auto;
    padding: 8px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 36vh;
}

.quickjot-feed::-webkit-scrollbar {
    width: 4px;
}

.quickjot-feed::-webkit-scrollbar-thumb {
    background: var(--border-strong);
    border-radius: 2px;
}

.quickjot-note {
    display: flex;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--surface);
    border-left: 2px solid var(--accent);
    font-size: 13.5px;
    color: var(--t2);
    line-height: 1.4;
    word-break: break-word;
    animation: jot-in .25s ease;
}

@keyframes jot-in {
    from {
        opacity: 0;
        transform: translateY(8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.quickjot-time {
    flex-shrink: 0;
    font-size: 11px;
    color: var(--t4);
    font-variant-numeric: tabular-nums;
    padding-top: 1px;
}

.quickjot-text {
    flex: 1;
    min-width: 0;
}

.quickjot-input {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-top: 1px solid var(--border);
    background: var(--bg);
}

.quickjot-field {
    flex: 1;
    height: 44px;
    padding: 0 14px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    font-size: 14px;
}

.quickjot-field::placeholder {
    color: var(--t4);
}

.quickjot-field:focus {
    outline: none;
    border-color: color-mix(in srgb, var(--accent) 56%, transparent);
    background: color-mix(in srgb, var(--accent) 6%, var(--surface));
}

.quickjot-clear {
    width: 38px;
    height: 44px;
    border-radius: 11px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--t3);
    cursor: pointer;
}

.quickjot-feed-btn {
    width: 48px;
    height: 44px;
    border-radius: 12px;
    border: none;
    background: var(--accent);
    color: #001218;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.quickjot-feed-btn:disabled {
    opacity: .35;
    cursor: not-allowed;
}

/* Auf Mobile: Platz schaffen damit Quick-Jot nicht den letzten Step verdeckt */
@media (max-width: 1099px) {
    .body {
        padding-bottom: 0;
    }

    .timeline-spacer:last-of-type {
        height: calc(40vh + 60px);
    }
}

/* RichText */
:deep(.rt-term) {
    display: inline-block;
    padding: 0 5px;
    border-radius: 5px;
    background: color-mix(in srgb, #fbbf24 14%, transparent);
    border-bottom: 1px dashed color-mix(in srgb, #fbbf24 50%, transparent);
    color: #fde68a;
    cursor: help;
    font-weight: 600;
    transition: background .15s;
}

:deep(.rt-term:hover) {
    background: color-mix(in srgb, #fbbf24 22%, transparent);
}

:deep(.rt-placeholder) {
    display: inline-block;
    padding: 0 6px;
    margin: 0 1px;
    border-radius: 5px;
    background: var(--surface);
    border: 1px dashed var(--border-strong);
    color: var(--t4);
    font-style: italic;
    font-size: .92em;
}

:deep(.rt-placeholder.filled) {
    background: color-mix(in srgb, #22d3ee 14%, transparent);
    border: 1px solid color-mix(in srgb, #22d3ee 38%, transparent);
    color: #cffafe;
    font-style: normal;
}

:deep(.rt-term-popover) {
    max-width: 320px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, #fbbf24 30%, transparent);
    background: color-mix(in srgb, #0b1020 95%, transparent);
    color: var(--text);
    box-shadow: 0 24px 48px rgba(0, 0, 0, .5);
}

:deep(.rt-term-head) {
    font-weight: 700;
    font-size: 13px;
    letter-spacing: .08em;
    color: #fde68a;
    margin-bottom: 4px;
}

:deep(.rt-term-short) {
    font-size: 13px;
    color: var(--t2);
    line-height: 1.45;
}

:deep(.rt-term-long) {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid var(--border);
    font-size: 12px;
    color: var(--t3);
    line-height: 1.5;
}
</style>
