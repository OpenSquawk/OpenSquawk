<script setup lang="ts">
import {computed, defineComponent, h, nextTick, onMounted, onUnmounted, ref, watch} from 'vue'
import {VMenu} from 'vuetify/components'
import {a320Profile, glossary, scratchFields, type SopPhase, type SopStep} from '~~/shared/data/a320SopTimeline'

// Inline-Komponente für Rich-Text (Glossar-Pills + Scratchpad-Placeholder)
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

const STORAGE_KEY = 'opensquawk.copilot.v2'

const activeProfile = ref(a320Profile)
const phases = computed<SopPhase[]>(() => activeProfile.value.phases)

// State
const scratch = ref<Record<string, string>>({})
const variantSel = ref<Record<string, string>>({})
const completed = ref<Record<string, boolean>>({})
const expanded = ref<Record<string, boolean>>({})       // step.id → why-Toggle
const activeStepId = ref<string | null>(null)
const simbriefUser = ref('')
const simbriefLoading = ref(false)
const simbriefError = ref('')
const showScratchpadMobile = ref(false)
const rightTab = ref<'scratch' | 'canvas'>('scratch')

// Glossary lookup (lange Terms zuerst → "TRANS ALT" vor "ALT")
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
    // 1. Placeholder [KEY] aufsplitten
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

// Steps inkl. Variants flach
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
    const out: { phase: SopPhase; step: SopStep }[] = []
    for (const p of phases.value) for (const s of stepsForPhase(p)) out.push({phase: p, step: s})
    return out
})

const phaseProgress = computed(() => {
    const out: Record<string, { done: number; total: number; pct: number }> = {}
    for (const p of phases.value) {
        const steps = stepsForPhase(p)
        const done = steps.filter(s => completed.value[s.id]).length
        out[p.id] = {done, total: steps.length, pct: steps.length ? Math.round(done / steps.length * 100) : 0}
    }
    return out
})

const totalProgress = computed(() => {
    const total = allSteps.value.length
    if (!total) return 0
    const done = allSteps.value.filter(({step}) => completed.value[step.id]).length
    return Math.round((done / total) * 100)
})

const activeStep = computed(() => allSteps.value.find(s => s.step.id === activeStepId.value))

function toggleDone(id: string) {
    completed.value[id] = !completed.value[id]
    persist()
}

function toggleWhy(id: string) {
    expanded.value[id] = !expanded.value[id]
}

function setActive(id: string) {
    activeStepId.value = id
}

function nextStep() {
    const list = allSteps.value
    const idx = list.findIndex(({step}) => step.id === activeStepId.value)
    const cur = list[idx]
    if (cur) completed.value[cur.step.id] = true
    const next = list[idx + 1]
    if (next) {
        activeStepId.value = next.step.id
        nextTick(() => scrollToStep(next.step.id))
    }
    persist()
}

function prevStep() {
    const list = allSteps.value
    const idx = list.findIndex(({step}) => step.id === activeStepId.value)
    if (idx <= 0) return
    activeStepId.value = list[idx - 1].step.id
    nextTick(() => scrollToStep(activeStepId.value!))
}

function scrollToStep(id: string) {
    const el = document.querySelector(`[data-step-id="${id}"]`) as HTMLElement | null
    if (el) el.scrollIntoView({behavior: 'smooth', block: 'center'})
}

function jumpToPhase(id: string) {
    const el = document.querySelector(`[data-phase-id="${id}"]`) as HTMLElement | null
    if (el) el.scrollIntoView({behavior: 'smooth', block: 'start'})
}

function resetAll() {
    if (!confirm('Alle Eingaben & Fortschritt löschen?')) return
    scratch.value = {}
    completed.value = {}
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
        completed: completed.value,
        variantSel: variantSel.value,
        activeStepId: activeStepId.value,
    }))
}

watch([scratch, variantSel], persist, {deep: true})

onMounted(() => {
    if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
            try {
                const v = JSON.parse(raw)
                if (v.scratch) scratch.value = v.scratch
                if (v.completed) completed.value = v.completed
                if (v.variantSel) variantSel.value = v.variantSel
                if (v.activeStepId) activeStepId.value = v.activeStepId
            } catch {
            }
        }
    }
    setupCanvas()
    setupActiveObserver()
    if (!activeStepId.value && allSteps.value.length) activeStepId.value = allSteps.value[0].step.id
})

let observer: IntersectionObserver | null = null

function setupActiveObserver() {
    if (typeof IntersectionObserver === 'undefined') return
    observer = new IntersectionObserver((entries) => {
        let best: { id: string; ratio: number } | null = null
        for (const e of entries) {
            if (e.isIntersecting) {
                const id = (e.target as HTMLElement).dataset.stepId
                if (!id) continue
                if (!best || e.intersectionRatio > best.ratio) best = {id, ratio: e.intersectionRatio}
            }
        }
        if (best && best.ratio > 0.55) activeStepId.value = best.id
    }, {threshold: [0.55, 0.8]})
    nextTick(() => {
        document.querySelectorAll('[data-step-id]').forEach(el => observer?.observe(el))
    })
}

watch(allSteps, () => {
    nextTick(() => {
        observer?.disconnect()
        document.querySelectorAll('[data-step-id]').forEach(el => observer?.observe(el))
    })
})

onUnmounted(() => {
    observer?.disconnect()
})

// Scratchpad-Felder
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

function setupCanvas() {
    const cv = canvasRef.value
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    const resize = () => {
        const rect = cv.getBoundingClientRect()
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
        return {x: e.clientX - r.left, y: e.clientY - r.top, p: e.pressure || 0.5}
    }
    cv.addEventListener('pointerdown', (e) => {
        cv.setPointerCapture(e.pointerId)
        drawing = true
        last = pos(e)
    })
    cv.addEventListener('pointermove', (e) => {
        if (!drawing || !last) return
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
    const stop = () => {
        drawing = false
        last = null
    }
    cv.addEventListener('pointerup', stop)
    cv.addEventListener('pointercancel', stop)
    cv.addEventListener('pointerleave', stop)
}

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

const actorMeta: Record<string, { label: string; cls: string }> = {
    pilot: {label: 'Sagen', cls: 'tag-pilot'},
    pf: {label: 'PF', cls: 'tag-pf'},
    pm: {label: 'PM', cls: 'tag-pm'},
    atc: {label: 'ATC sagt', cls: 'tag-atc'},
    cabin: {label: 'Cabin', cls: 'tag-cabin'},
    system: {label: 'Flugzeug', cls: 'tag-system'},
}
</script>

<template>
    <div class="copilot scene">
        <!-- HUD / Top Bar -->
        <header class="hud">
            <div class="hud-inner">
                <div class="hud-left">
                    <NuxtLink to="/" class="hud-logo" title="Zurück zur Startseite">
                        <v-icon size="22">mdi-radar</v-icon>
                    </NuxtLink>
                    <div class="hud-divider"/>
                    <div class="hud-brand">
                        <div class="brand-name">OpenSquawk</div>
                        <div class="brand-mode">
                            <v-icon size="14">mdi-airplane-cog</v-icon>
                            Copilot · {{ activeProfile.name }}
                        </div>
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
                    <button class="icon-btn" :title="showScratchpadMobile ? 'Schließen' : 'Scratchpad'"
                            @click="showScratchpadMobile = !showScratchpadMobile">
                        <v-icon size="20">{{ showScratchpadMobile ? 'mdi-close' : 'mdi-notebook-edit-outline' }}</v-icon>
                    </button>
                    <button class="icon-btn" title="Reset" @click="resetAll">
                        <v-icon size="20">mdi-refresh</v-icon>
                    </button>
                </div>
            </div>
            <!-- Phase Pills -->
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

        <!-- Body -->
        <main class="body">
            <!-- Timeline -->
            <section class="timeline-col">
                <div class="timeline">
                    <div
                        v-for="phase in phases"
                        :key="phase.id"
                        :data-phase-id="phase.id"
                        :class="['phase', 'accent-' + phase.accent]"
                    >
                        <header class="phase-header">
                            <div>
                                <div class="phase-eyebrow">Phase</div>
                                <h2 class="phase-title">{{ phase.title }}</h2>
                                <div v-if="phase.subtitle" class="phase-sub">{{ phase.subtitle }}</div>
                            </div>
                            <div class="phase-progress">
                                <div class="phase-progress-track">
                                    <div class="phase-progress-fill" :style="{width: phaseProgress[phase.id]?.pct + '%'}"/>
                                </div>
                                <div class="phase-progress-label">
                                    {{ phaseProgress[phase.id]?.done }} / {{ phaseProgress[phase.id]?.total }}
                                </div>
                            </div>
                        </header>

                        <ol class="steps">
                            <template v-for="step in phase.steps" :key="step.id">
                                <!-- Reguläre Step-Karte -->
                                <li
                                    v-if="!step.variants"
                                    :data-step-id="step.id"
                                    class="step-card"
                                    :class="{
                                        active: activeStepId === step.id,
                                        done: completed[step.id]
                                    }"
                                    @click="setActive(step.id)"
                                >
                                    <div class="step-head">
                                        <span :class="['actor-tag', actorMeta[step.actor]?.cls]">
                                            {{ actorMeta[step.actor]?.label }}
                                        </span>
                                        <h3 class="step-title">
                                            <RichText :text="step.label" :tokens="tokenize(step.label)" :resolve="placeholderValue"
                                                      :glossary="glossaryByTerm"/>
                                        </h3>
                                        <button
                                            v-if="step.why"
                                            class="why-btn"
                                            :class="{open: expanded[step.id]}"
                                            :title="expanded[step.id] ? 'Hintergrund ausblenden' : 'Warum?'"
                                            @click.stop="toggleWhy(step.id)"
                                        >
                                            <v-icon size="18">{{ expanded[step.id] ? 'mdi-information' : 'mdi-information-outline' }}</v-icon>
                                        </button>
                                    </div>

                                    <div v-if="step.callout" class="callout">
                                        <v-icon size="16" class="callout-icon">mdi-radio-handheld</v-icon>
                                        <div class="callout-text">
                                            <RichText :text="step.callout" :tokens="tokenize(step.callout)" :resolve="placeholderValue"
                                                      :glossary="glossaryByTerm"/>
                                        </div>
                                    </div>

                                    <p v-if="step.detail" class="step-detail">
                                        <RichText :text="step.detail" :tokens="tokenize(step.detail)" :resolve="placeholderValue"
                                                  :glossary="glossaryByTerm"/>
                                    </p>

                                    <Transition name="why">
                                        <div v-if="expanded[step.id] && step.why" class="why-block">
                                            <div class="why-label">
                                                <v-icon size="14">mdi-lightbulb-on-outline</v-icon>
                                                Warum?
                                            </div>
                                            <p>
                                                <RichText :text="step.why" :tokens="tokenize(step.why)" :resolve="placeholderValue"
                                                          :glossary="glossaryByTerm"/>
                                            </p>
                                        </div>
                                    </Transition>

                                    <div v-if="step.look || step.simNote" class="meta-row">
                                        <div v-if="step.look" class="meta-chip">
                                            <v-icon size="14">mdi-eye-outline</v-icon>
                                            {{ step.look }}
                                        </div>
                                        <div v-if="step.simNote" class="meta-chip sim">
                                            <v-icon size="14">mdi-monitor</v-icon>
                                            {{ step.simNote }}
                                        </div>
                                    </div>

                                    <div v-if="step.inputKeys?.length" class="input-row">
                                        <span
                                            v-for="k in step.inputKeys"
                                            :key="k"
                                            class="input-chip"
                                            :class="{filled: !!scratch[k]}"
                                        >
                                            <span class="input-chip-label">{{ scratchFields.find(f => f.key === k)?.label || k }}</span>
                                            <span class="input-chip-value">{{ scratch[k] || '—' }}</span>
                                        </span>
                                    </div>
                                </li>

                                <!-- Step mit Variants -->
                                <li
                                    v-else
                                    :data-step-id="step.id"
                                    class="step-card variant"
                                    :class="{active: activeStepId === step.id, done: completed[step.id]}"
                                    @click="setActive(step.id)"
                                >
                                    <div class="step-head">
                                        <span :class="['actor-tag', actorMeta[step.actor]?.cls]">
                                            {{ actorMeta[step.actor]?.label }}
                                        </span>
                                        <h3 class="step-title">{{ step.label }}</h3>
                                        <button
                                            v-if="step.why"
                                            class="why-btn"
                                            :class="{open: expanded[step.id]}"
                                            @click.stop="toggleWhy(step.id)"
                                        >
                                            <v-icon size="18">{{ expanded[step.id] ? 'mdi-information' : 'mdi-information-outline' }}</v-icon>
                                        </button>
                                    </div>
                                    <p v-if="step.detail" class="step-detail">{{ step.detail }}</p>

                                    <Transition name="why">
                                        <div v-if="expanded[step.id] && step.why" class="why-block">
                                            <div class="why-label">
                                                <v-icon size="14">mdi-lightbulb-on-outline</v-icon>
                                                Warum?
                                            </div>
                                            <p>{{ step.why }}</p>
                                        </div>
                                    </Transition>

                                    <div class="variant-tabs">
                                        <button
                                            v-for="v in step.variants"
                                            :key="v.id"
                                            class="variant-tab"
                                            :class="{active: (variantSel[step.id] || step.variants![0].id) === v.id}"
                                            @click.stop="variantSel[step.id] = v.id"
                                        >
                                            {{ v.title }}
                                        </button>
                                    </div>

                                    <div class="variant-steps">
                                        <div
                                            v-for="vstep in (step.variants.find(v => v.id === (variantSel[step.id] || step.variants![0].id))?.steps || [])"
                                            :key="vstep.id"
                                            :data-step-id="vstep.id"
                                            class="vstep"
                                            :class="{active: activeStepId === vstep.id, done: completed[vstep.id]}"
                                            @click.stop="setActive(vstep.id)"
                                        >
                                            <div class="vstep-head">
                                                <h4>{{ vstep.label }}</h4>
                                                <button
                                                    v-if="vstep.why"
                                                    class="why-btn small"
                                                    :class="{open: expanded[vstep.id]}"
                                                    @click.stop="toggleWhy(vstep.id)"
                                                >
                                                    <v-icon size="16">mdi-information-outline</v-icon>
                                                </button>
                                            </div>
                                            <p v-if="vstep.detail" class="step-detail small">{{ vstep.detail }}</p>
                                            <p v-if="vstep.callout" class="callout small">
                                                <v-icon size="14" class="callout-icon">mdi-radio-handheld</v-icon>
                                                <span class="callout-text">
                                                    <RichText :text="vstep.callout" :tokens="tokenize(vstep.callout)" :resolve="placeholderValue"
                                                              :glossary="glossaryByTerm"/>
                                                </span>
                                            </p>
                                            <Transition name="why">
                                                <div v-if="expanded[vstep.id] && vstep.why" class="why-block">
                                                    <div class="why-label">
                                                        <v-icon size="14">mdi-lightbulb-on-outline</v-icon>
                                                        Warum?
                                                    </div>
                                                    <p>{{ vstep.why }}</p>
                                                </div>
                                            </Transition>
                                        </div>
                                    </div>
                                </li>
                            </template>
                        </ol>
                    </div>
                </div>

                <!-- Action Bar -->
                <div class="action-bar">
                    <button class="action-prev" :disabled="!activeStepId" @click="prevStep">
                        <v-icon size="22">mdi-chevron-left</v-icon>
                    </button>
                    <div class="action-center">
                        <div class="action-eyebrow">{{ activeStep?.phase.title || '—' }}</div>
                        <div class="action-step">{{ activeStep?.step.label || 'Bereit' }}</div>
                    </div>
                    <button
                        class="action-done"
                        :class="{checked: activeStepId && completed[activeStepId]}"
                        :disabled="!activeStepId"
                        :title="activeStepId && completed[activeStepId] ? 'Erledigt – nochmal öffnen' : 'Erledigt markieren'"
                        @click="activeStepId && toggleDone(activeStepId)"
                    >
                        <v-icon size="22">{{ activeStepId && completed[activeStepId] ? 'mdi-check-circle' : 'mdi-check-circle-outline' }}</v-icon>
                    </button>
                    <button class="action-next" :disabled="!activeStepId" @click="nextStep">
                        <span>Done & Next</span>
                        <v-icon size="20">mdi-arrow-right</v-icon>
                    </button>
                </div>
            </section>

            <!-- Right Panel -->
            <aside class="aside" :class="{'mobile-open': showScratchpadMobile}">
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

                <div v-if="rightTab === 'scratch'" class="scratchpad">
                    <div v-for="(fields, group) in groupedFields" :key="group" class="field-group">
                        <div class="field-group-title">{{ groupTitles[group] || group }}</div>
                        <div class="field-grid">
                            <label v-for="f in fields" :key="f.key" class="field">
                                <span class="field-label">{{ f.label }}</span>
                                <input
                                    v-model="scratch[f.key]"
                                    :placeholder="f.placeholder"
                                    class="field-input"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <div v-else class="canvas-wrap">
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
                    <div class="canvas-hint">Apple Pencil / Stylus wird druckempfindlich erkannt.</div>
                </div>
            </aside>
        </main>
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
    --t4: rgba(255, 255, 255, .40);
    --border: rgba(255, 255, 255, .10);
    --border-strong: rgba(255, 255, 255, .18);
    --surface: rgba(255, 255, 255, .03);
    --surface-2: rgba(255, 255, 255, .06);
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    background-image:
        radial-gradient(900px 480px at 80% -10%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 60%),
        radial-gradient(680px 360px at 8% -6%, color-mix(in srgb, var(--accent2) 12%, transparent), transparent 60%);
}

/* Phase accents */
.accent-cyan {
    --pa: #22d3ee;
}

.accent-sky {
    --pa: #38bdf8;
}

.accent-indigo {
    --pa: #818cf8;
}

.accent-emerald {
    --pa: #34d399;
}

.accent-amber {
    --pa: #fbbf24;
}

.accent-rose {
    --pa: #fb7185;
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
    gap: 16px;
    padding: 10px 14px;
    max-width: 1600px;
    margin: 0 auto;
    width: 100%;
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
    transition: all .2s ease;
    flex-shrink: 0;
}

.hud-logo:hover {
    border-color: color-mix(in srgb, var(--accent) 54%, transparent);
    background: color-mix(in srgb, var(--accent) 20%, transparent);
}

.hud-divider {
    width: 1px;
    height: 36px;
    background: var(--border);
    border-radius: 999px;
}

.hud-brand {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
    min-width: 0;
}

.brand-name {
    font-weight: 600;
    font-size: 15px;
}

.brand-mode {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--accent);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.hud-right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: nowrap;
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
    width: 160px;
    font-size: 14px;
}

.simbrief-input::placeholder {
    color: var(--t4);
}

.simbrief-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 9px;
    background: var(--accent);
    color: #001218;
    border: none;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: background .2s;
}

.simbrief-btn:hover:not(:disabled) {
    background: color-mix(in srgb, var(--accent) 80%, white 20%);
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
    padding: 8px 14px 10px;
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
    transition: all .2s;
    flex-shrink: 0;
}

.phase-pill:hover {
    color: var(--text);
    background: var(--surface-2);
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
    overflow: hidden;
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

/* Body Layout */
.body {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    padding: 14px;
    max-width: 1600px;
    margin: 0 auto;
}

@media (min-width: 1100px) {
    .body {
        grid-template-columns: minmax(0, 1fr) 440px;
    }
}

.timeline-col {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
}

.timeline {
    border-radius: 20px;
    border: 1px solid var(--border);
    background: var(--surface);
    overflow-y: auto;
    overflow-x: hidden;
    scroll-snap-type: y mandatory;
    max-height: calc(100dvh - 240px);
    min-height: 60vh;
}

.timeline::-webkit-scrollbar {
    width: 6px;
}

.timeline::-webkit-scrollbar-thumb {
    background: var(--border-strong);
    border-radius: 3px;
}

.phase {
    scroll-snap-align: start;
}

.phase-header {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 18px 12px;
    backdrop-filter: blur(10px);
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--pa) 18%, var(--bg) 82%) 0%,
        color-mix(in srgb, var(--pa) 6%, var(--bg) 94%) 100%);
    border-bottom: 1px solid color-mix(in srgb, var(--pa) 30%, transparent);
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
    font-size: 20px;
    font-weight: 600;
    line-height: 1.15;
}

.phase-sub {
    font-size: 13px;
    color: var(--t3);
    margin-top: 2px;
}

.phase-progress {
    text-align: right;
    flex-shrink: 0;
}

.phase-progress-track {
    width: 100px;
    height: 4px;
    background: var(--surface-2);
    border-radius: 999px;
    overflow: hidden;
    margin-bottom: 4px;
}

.phase-progress-fill {
    height: 100%;
    background: var(--pa);
    transition: width .3s;
}

.phase-progress-label {
    font-size: 11px;
    color: var(--t3);
    font-variant-numeric: tabular-nums;
}

.steps {
    list-style: none;
    margin: 0;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.step-card {
    scroll-snap-align: start;
    scroll-margin-top: 80px;
    border-radius: 16px;
    border: 1px solid var(--border);
    background: linear-gradient(180deg, var(--surface-2), var(--surface));
    padding: 16px 18px;
    cursor: pointer;
    transition: border-color .2s, transform .15s, box-shadow .2s, opacity .2s;
    position: relative;
}

.step-card:hover {
    border-color: var(--border-strong);
}

.step-card.active {
    border-color: var(--pa);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--pa) 50%, transparent),
        0 18px 38px -22px color-mix(in srgb, var(--pa) 80%, transparent);
}

.step-card.done {
    opacity: .6;
}

.step-card.done .step-title {
    text-decoration: line-through;
    text-decoration-color: var(--t4);
}

.step-card.done::after {
    content: '';
    position: absolute;
    top: 14px;
    right: 14px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #34d399;
    background-image: linear-gradient(135deg, #34d399, #10b981);
    mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="black" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>') center/14px no-repeat,
        linear-gradient(black, black);
    -webkit-mask-composite: source-in;
    mask-composite: intersect;
}

.step-head {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    flex-wrap: wrap;
}

.actor-tag {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: .14em;
    text-transform: uppercase;
    border: 1px solid;
    flex-shrink: 0;
}

.tag-pilot {
    background: color-mix(in srgb, #22d3ee 18%, transparent);
    border-color: color-mix(in srgb, #22d3ee 40%, transparent);
    color: #67e8f9;
}

.tag-pf {
    background: color-mix(in srgb, #34d399 18%, transparent);
    border-color: color-mix(in srgb, #34d399 40%, transparent);
    color: #6ee7b7;
}

.tag-pm {
    background: color-mix(in srgb, #a78bfa 18%, transparent);
    border-color: color-mix(in srgb, #a78bfa 40%, transparent);
    color: #c4b5fd;
}

.tag-atc {
    background: color-mix(in srgb, #fbbf24 18%, transparent);
    border-color: color-mix(in srgb, #fbbf24 40%, transparent);
    color: #fcd34d;
}

.tag-cabin {
    background: color-mix(in srgb, #fb7185 18%, transparent);
    border-color: color-mix(in srgb, #fb7185 40%, transparent);
    color: #fda4af;
}

.tag-system {
    background: var(--surface-2);
    border-color: var(--border-strong);
    color: var(--t2);
}

.step-title {
    flex: 1;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.3;
    min-width: 0;
}

.why-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--t3);
    cursor: pointer;
    transition: all .2s;
    flex-shrink: 0;
}

.why-btn:hover {
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    border-color: color-mix(in srgb, var(--accent) 32%, transparent);
    color: var(--accent);
}

.why-btn.open {
    background: color-mix(in srgb, var(--accent) 18%, transparent);
    border-color: color-mix(in srgb, var(--accent) 40%, transparent);
    color: var(--accent);
}

.why-btn.small {
    width: 30px;
    height: 30px;
    border-radius: 8px;
}

.callout {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin-top: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    background: linear-gradient(180deg, rgba(34, 211, 238, .12), rgba(34, 211, 238, .05));
    border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 13.5px;
    line-height: 1.55;
    color: #cffafe;
}

.callout.small {
    padding: 8px 10px;
    font-size: 12.5px;
    margin-top: 8px;
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
    margin-top: 10px;
    color: var(--t2);
    font-size: 14px;
    line-height: 1.55;
}

.step-detail.small {
    font-size: 13px;
    margin-top: 6px;
}

.why-block {
    margin-top: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    background: color-mix(in srgb, #fbbf24 8%, transparent);
    border: 1px solid color-mix(in srgb, #fbbf24 24%, transparent);
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
    margin-top: 0;
    padding-top: 0;
    padding-bottom: 0;
    border-width: 0;
}

.why-enter-to, .why-leave-from {
    opacity: 1;
    max-height: 400px;
}

.meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
}

.meta-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 8px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--t3);
    font-size: 12px;
}

.meta-chip.sim {
    color: #c4b5fd;
    border-color: color-mix(in srgb, #a78bfa 30%, transparent);
    background: color-mix(in srgb, #a78bfa 10%, transparent);
}

.input-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
}

.input-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 8px;
    background: var(--surface);
    border: 1px solid var(--border);
    font-size: 12px;
}

.input-chip-label {
    color: var(--t3);
    font-weight: 600;
    font-size: 10.5px;
    letter-spacing: .1em;
    text-transform: uppercase;
}

.input-chip-value {
    color: var(--t4);
    font-variant-numeric: tabular-nums;
}

.input-chip.filled {
    border-color: color-mix(in srgb, var(--accent) 38%, transparent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
}

.input-chip.filled .input-chip-label {
    color: var(--accent);
}

.input-chip.filled .input-chip-value {
    color: #cffafe;
}

/* Variants */
.variant-tabs {
    display: flex;
    gap: 6px;
    margin-top: 14px;
    padding: 4px;
    border-radius: 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    overflow-x: auto;
}

.variant-tab {
    flex: 1;
    min-width: max-content;
    padding: 8px 14px;
    border-radius: 9px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--t3);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all .2s;
    white-space: nowrap;
}

.variant-tab:hover {
    color: var(--text);
    background: var(--surface-2);
}

.variant-tab.active {
    background: color-mix(in srgb, var(--accent) 18%, transparent);
    border-color: color-mix(in srgb, var(--accent) 38%, transparent);
    color: var(--accent);
}

.variant-steps {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
}

.vstep {
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: rgba(0, 0, 0, .25);
    cursor: pointer;
    transition: border-color .2s;
}

.vstep:hover {
    border-color: var(--border-strong);
}

.vstep.active {
    border-color: var(--pa);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--pa) 40%, transparent);
}

.vstep.done {
    opacity: .55;
}

.vstep-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
}

.vstep-head h4 {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.3;
    flex: 1;
}

/* Action Bar */
.action-bar {
    position: sticky;
    bottom: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 16px;
    border: 1px solid var(--border);
    background: color-mix(in srgb, var(--bg) 92%, transparent);
    backdrop-filter: blur(14px);
    box-shadow: 0 24px 48px -16px rgba(0, 0, 0, .6);
}

.action-prev, .action-done {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--t2);
    cursor: pointer;
    transition: all .2s;
    flex-shrink: 0;
}

.action-prev:hover, .action-done:hover {
    background: var(--surface-2);
    color: var(--text);
}

.action-done.checked {
    background: color-mix(in srgb, #34d399 22%, transparent);
    border-color: color-mix(in srgb, #34d399 50%, transparent);
    color: #6ee7b7;
}

.action-prev:disabled, .action-done:disabled, .action-next:disabled {
    opacity: .4;
    cursor: not-allowed;
}

.action-center {
    flex: 1;
    min-width: 0;
    text-align: center;
    padding: 0 8px;
}

.action-eyebrow {
    font-size: 10.5px;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: var(--t3);
    margin-bottom: 1px;
}

.action-step {
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.action-next {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 48px;
    padding: 0 18px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    color: #001218;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: transform .15s, box-shadow .2s;
    box-shadow: 0 12px 24px -8px color-mix(in srgb, var(--accent) 50%, transparent);
    flex-shrink: 0;
}

.action-next:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 18px 32px -8px color-mix(in srgb, var(--accent) 60%, transparent);
}

@media (max-width: 640px) {
    .action-next span {
        display: none;
    }

    .action-next {
        padding: 0 14px;
    }
}

/* Aside */
.aside {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
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
    transition: all .2s;
}

.aside-tab:hover {
    color: var(--text);
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
    max-height: calc(100dvh - 280px);
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
    transition: border-color .2s, background .2s;
}

.field-input::placeholder {
    color: var(--t4);
}

.field-input:focus {
    outline: none;
    border-color: color-mix(in srgb, var(--accent) 56%, transparent);
    background: rgba(0, 0, 0, .35);
}

.canvas-wrap {
    padding: 12px;
    border-radius: 18px;
    border: 1px solid var(--border);
    background: var(--surface);
}

.canvas-toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
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

.canvas-clear:hover {
    color: var(--text);
}

.canvas {
    display: block;
    width: 100%;
    height: 60vh;
    border-radius: 14px;
    background: rgba(0, 0, 0, .35);
    border: 1px solid var(--border);
    cursor: crosshair;
    touch-action: none;
}

.canvas-hint {
    margin-top: 6px;
    font-size: 11.5px;
    color: var(--t4);
}

/* Mobile Aside Drawer */
@media (max-width: 1099px) {
    .aside {
        position: fixed;
        inset: 0;
        z-index: 60;
        background: var(--bg);
        padding: 16px;
        padding-top: calc(env(safe-area-inset-top) + 16px);
        transform: translateY(100%);
        transition: transform .25s ease;
        overflow-y: auto;
    }

    .aside.mobile-open {
        transform: translateY(0);
    }

    .scratchpad {
        max-height: none;
    }
}

/* RichText – Glossar & Placeholder */
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
