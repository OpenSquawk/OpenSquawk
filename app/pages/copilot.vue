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

const STORAGE_KEY = 'opensquawk.copilot.v4'

const activeProfile = ref(a320Profile)
const phases = computed<SopPhase[]>(() => activeProfile.value.phases)

const scratch = ref<Record<string, string>>({})
const variantSel = ref<Record<string, string>>({})
const expanded = ref<Record<string, boolean>>({})
const activeStepId = ref<string | null>(null)
const simbriefUser = ref('')
const simbriefLoading = ref(false)
const simbriefError = ref('')
const showCanvas = ref(true)
const showSimbrief = ref(false)
const asideHeight = ref(280)
const simbriefWrapRef = ref<HTMLElement | null>(null)
const simbriefPopPos = ref<Record<string, string>>({})

watch(showSimbrief, (v) => {
    if (v && simbriefWrapRef.value) {
        nextTick(() => {
            const rect = simbriefWrapRef.value!.getBoundingClientRect()
            simbriefPopPos.value = {
                top: (rect.bottom + 6) + 'px',
                right: Math.max(8, window.innerWidth - rect.right) + 'px',
            }
        })
    }
})

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
        STAR: 'star',
        RWY: 'rwy',
        ARR_RWY: 'arrivalRunway',
        STAND: 'stand',
        GATE: 'gate',
        ATIS: 'atisLetter',
        ARR_ATIS: 'arrivalAtis',
        SQK: 'squawk',
        INIT_ALT: 'initialClimb',
        PASSING_ALT: 'initialClimb',
        CRZ_FL: 'crzFL',
        TWR_FREQ: 'twrFreq',
        DEP_FREQ: 'depFreq',
        APP_FREQ: 'appFreq',
        GROUND_FREQ: 'groundFreq',
        FREQ: 'depFreq',
        WIND: 'wind',
        ARR_QNH: 'arrivalQnh',
        FLEX_TEMP: 'flexTemp',
        TAXI_ROUTE: 'taxiRoute',
        HOLDING: 'holdingPoint',
        APPROACH: 'approach',
        LDG_CONF: 'landingConfig',
        VAPP: 'vapp',
        MINIMUMS: 'minimums',
        DECISION_ALT: 'decisionAlt',
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
    scrollLock = true
    expanded.value[id] = !expanded.value[id]
    nextTick(() => {
        scrollToStep(id)
    })
}

function selectVariant(stepId: string, variantId: string) {
    scrollLock = true
    variantSel.value[stepId] = variantId
    nextTick(() => scrollToStep(stepId))
}

function cycleVariant(dir: 1 | -1) {
    const cur = activeStep.value
    if (!cur) return
    let owner: SopStep | null = null
    for (const p of phases.value) {
        for (const s of p.steps) {
            if (!s.variants?.length) continue
            if (s.id === cur.step.id) {
                owner = s
                break
            }
            const sel = variantSel.value[s.id] || s.variants[0].id
            const v = s.variants.find(x => x.id === sel)
            if (v?.steps.some(cs => cs.id === cur.step.id)) {
                owner = s
                break
            }
        }
        if (owner) break
    }
    if (!owner || !owner.variants?.length) return
    const ids = owner.variants.map(v => v.id)
    const cursel = variantSel.value[owner.id] || ids[0]
    const idx = ids.indexOf(cursel)
    const next = ids[(idx + dir + ids.length) % ids.length]
    selectVariant(owner.id, next)
}

function jumpToPhase(id: string) {
    const phase = phases.value.find(p => p.id === id)
    if (!phase || !phase.steps[0]) return
    setActive(phase.steps[0].id)
}

function resetAll() {
    if (!confirm('Alle Eingaben, Fortschritt & Canvas löschen?')) return
    scratch.value = {}
    variantSel.value = {}
    expanded.value = {}
    activeStepId.value = phases.value[0]?.steps[0]?.id || null
    canvasImage.value = ''
    clearCanvas()
    persist()
}

// Persistence
const canvasImage = ref<string>('')

function persist() {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        scratch: scratch.value,
        variantSel: variantSel.value,
        activeStepId: activeStepId.value,
        simbriefUser: simbriefUser.value,
        showCanvas: showCanvas.value,
        canvasImage: canvasImage.value,
        asideHeight: asideHeight.value,
    }))
}

watch([scratch, variantSel, activeStepId, showCanvas, simbriefUser, asideHeight], persist, {deep: true})

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
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        cycleVariant(-1)
    } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        cycleVariant(1)
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
                if (typeof v.simbriefUser === 'string') simbriefUser.value = v.simbriefUser
                if (typeof v.showCanvas === 'boolean') showCanvas.value = v.showCanvas
                if (typeof v.canvasImage === 'string') canvasImage.value = v.canvasImage
                if (typeof v.asideHeight === 'number') asideHeight.value = v.asideHeight
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

// Resize Handle für Scratchpad
let resizing = false
let resizeStartY = 0
let resizeStartH = 0

function onResizeStart(e: PointerEvent) {
    resizing = true
    resizeStartY = e.clientY
    resizeStartH = asideHeight.value
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

function onResizeMove(e: PointerEvent) {
    if (!resizing) return
    const dy = resizeStartY - e.clientY
    asideHeight.value = Math.max(100, Math.min(resizeStartH + dy, window.innerHeight * 0.8))
}

function onResizeEnd(e: PointerEvent) {
    if (!resizing) return
    resizing = false
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    persist()
}

// Canvas
const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasWrapRef = ref<HTMLElement | null>(null)
const drawColor = '#fde68a'
const lineWidth = 2.6
let canvasInited = false

function loadCanvasImage() {
    const cv = canvasRef.value
    if (!cv || !canvasImage.value) return
    const img = new Image()
    img.onload = () => {
        const ctx = cv.getContext('2d')!
        const r = cv.getBoundingClientRect()
        ctx.drawImage(img, 0, 0, r.width, r.height)
    }
    img.src = canvasImage.value
}

function saveCanvasImage() {
    const cv = canvasRef.value
    if (!cv) return
    try {
        canvasImage.value = cv.toDataURL('image/png')
        persist()
    } catch {
    }
}

function setupCanvas() {
    const cv = canvasRef.value
    if (!cv || canvasInited) return
    canvasInited = true
    const dpr = window.devicePixelRatio || 1
    const resize = () => {
        const rect = cv.getBoundingClientRect()
        if (rect.width <= 0 || rect.height <= 0) return
        const prev = canvasImage.value
        cv.width = rect.width * dpr
        cv.height = rect.height * dpr
        const ctx = cv.getContext('2d')!
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale(dpr, dpr)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        if (prev) {
            const img = new Image()
            img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height)
            img.src = prev
        }
    }
    resize()
    new ResizeObserver(resize).observe(cv)
    if (canvasImage.value) nextTick(loadCanvasImage)

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
        ctx.strokeStyle = drawColor
        ctx.lineWidth = lineWidth * (0.5 + cur.p)
        ctx.beginPath()
        ctx.moveTo(last.x, last.y)
        ctx.lineTo(cur.x, cur.y)
        ctx.stroke()
        last = cur
    })
    const stop = (e: PointerEvent) => {
        if (!drawing) return
        drawing = false
        last = null
        if (cv.hasPointerCapture(e.pointerId)) cv.releasePointerCapture(e.pointerId)
        saveCanvasImage()
    }
    cv.addEventListener('pointerup', stop)
    cv.addEventListener('pointercancel', stop)
    cv.addEventListener('pointerleave', stop)
}

watch(showCanvas, (v) => {
    if (v) nextTick(setupCanvas)
})

function clearCanvas() {
    const cv = canvasRef.value
    if (!cv) return
    const ctx = cv.getContext('2d')!
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, cv.width, cv.height)
    ctx.restore()
    canvasImage.value = ''
    persist()
    if (canvasWrapRef.value) canvasWrapRef.value.scrollTop = 0
}

function cleanfeedCanvas() {
    const cv = canvasRef.value
    const wrap = canvasWrapRef.value
    if (!cv) return
    const ctx = cv.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    // shift = 40% der sichtbaren Wrapper-Höhe
    const wrapH = wrap ? wrap.clientHeight : 400
    const shift = Math.round(wrapH * 0.4)
    const img = ctx.getImageData(0, 0, cv.width, cv.height)
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, cv.width, cv.height)
    ctx.putImageData(img, 0, -shift * dpr)
    ctx.restore()
    // Nach Shift: direkt zum neuen freien Bereich unten scrollen
    if (wrap) wrap.scrollTop += shift
    saveCanvasImage()
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
    <div class="copilot scene learn-theme">
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
                    <div ref="simbriefWrapRef" class="simbrief-wrap">
                        <button
                            class="icon-btn"
                            :class="{active: showSimbrief}"
                            title="SimBrief"
                            @click="showSimbrief = !showSimbrief"
                        >
                            <v-icon size="18">mdi-cloud-download-outline</v-icon>
                        </button>
                    </div>
                    <button class="icon-btn" :class="{active: showCanvas}" :title="showCanvas ? 'Canvas ausblenden' : 'Canvas einblenden'"
                            @click="showCanvas = !showCanvas">
                        <v-icon size="18">mdi-pen</v-icon>
                    </button>
                    <button class="icon-btn" title="Reset" @click="resetAll">
                        <v-icon size="18">mdi-refresh</v-icon>
                    </button>
                </div>
            </div>
            <div class="phase-bar" role="tablist">
                <button
                    v-for="p in phases"
                    :key="p.id"
                    class="phase-tab"
                    :class="['accent-' + p.accent, {active: activeStep?.phase.id === p.id}]"
                    role="tab"
                    :aria-selected="activeStep?.phase.id === p.id"
                    @click="jumpToPhase(p.id)"
                >
                    <span class="phase-tab-label">{{ p.title }}</span>
                    <span class="phase-tab-progress">{{ phaseProgress[p.id]?.done }}/{{ phaseProgress[p.id]?.total }}</span>
                </button>
            </div>
            <div class="progress-track">
                <div class="progress-fill" :style="{width: totalProgress + '%'}"/>
            </div>
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
                                            @click="selectVariant(step.id, v.id)"
                                        >
                                            {{ v.title }}
                                        </button>
                                    </div>

                                </div>
                            </article>
                        </template>
                    </template>

                    <div class="timeline-spacer"/>
                </div>
                <!-- Fixer Footer: immer an gleicher Position -->
                <div v-if="activeStep" class="step-footer" @click.stop>
                    <button class="btn" :disabled="activeIdx <= 0" @click="prevStep">
                        <v-icon size="20">mdi-chevron-left</v-icon>
                        <span class="footer-btn-label">Back</span>
                    </button>
                    <button v-if="activeStep.step.why" class="btn" :class="{open: expanded[activeStep.step.id]}" @click="toggleWhy(activeStep.step.id)">
                        <v-icon size="18">{{ expanded[activeStep.step.id] ? 'mdi-information' : 'mdi-information-outline' }}</v-icon>
                        <span class="footer-btn-label">Warum</span>
                    </button>
                    <button class="btn primary footer-next" :disabled="activeIdx >= allSteps.length - 1" @click="nextStep">
                        <span>Done &amp; Next</span>
                        <v-icon size="20">mdi-chevron-right</v-icon>
                    </button>
                </div>
            </section>

            <!-- Resize Handle -->
            <div
                v-if="showCanvas"
                class="resize-handle"
                @pointerdown="onResizeStart"
                @pointermove="onResizeMove"
                @pointerup="onResizeEnd"
                @pointercancel="onResizeEnd"
            />

            <!-- Aside (Canvas only, immer unten) -->
            <aside v-if="showCanvas" class="aside" :style="{height: asideHeight + 'px'}">
                <div class="canvas-wrap">
                    <div class="canvas-toolbar">
                        <button class="canvas-btn" @click="clearCanvas">
                            <v-icon size="14">mdi-eraser</v-icon>
                            Wipe
                        </button>
                        <button class="canvas-btn" @click="cleanfeedCanvas" title="Inhalt nach oben schieben, unten leeren Platz nachrutschen">
                            <v-icon size="14">mdi-arrow-up-bold-box-outline</v-icon>
                            Cleanfeed
                        </button>
                    </div>
                    <div ref="canvasWrapRef" class="canvas-scroll">
                        <canvas ref="canvasRef" class="canvas"/>
                    </div>
                </div>
            </aside>
        </main>

        <!-- SimBrief Popover (Teleport zum body um stacking-context zu umgehen) -->
        <Teleport to="body">
            <Transition name="pop">
                <div
                    v-if="showSimbrief"
                    class="simbrief-pop-fixed"
                    :style="simbriefPopPos"
                    @click.stop
                >
                    <div class="simbrief-pop-title">SimBrief Import</div>
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
                    <div v-if="simbriefError" class="simbrief-pop-err">{{ simbriefError }}</div>
                </div>
            </Transition>
        </Teleport>
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
    z-index: 200;
    border-bottom: 1px solid var(--border);
    background: color-mix(in srgb, var(--bg) 86%, transparent);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
}

.hud-inner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 12px;
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
    width: 34px;
    height: 34px;
    border-radius: 10px;
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
    height: 22px;
    background: var(--border);
}

.hud-brand {
    display: flex;
    align-items: baseline;
    gap: 8px;
    line-height: 1;
    min-width: 0;
}

.brand-name {
    font-weight: 600;
    font-size: 14px;
}

.brand-mode {
    font-size: 11.5px;
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
}

.simbrief-wrap {
    position: relative;
}

.simbrief-pop-fixed {
    position: fixed;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    width: 260px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, .14);
    background: rgba(11, 16, 32, .96);
    color: #fff;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 16px 36px rgba(0, 0, 0, .55);
}

.simbrief-pop-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: var(--accent);
}

.simbrief-pop-err {
    font-size: 12px;
    color: #fecaca;
}

.simbrief-input {
    height: 36px;
    padding: 0 10px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: rgba(0, 0, 0, .25);
    outline: none;
    color: var(--text);
    font-size: 13px;
}

.simbrief-input::placeholder {
    color: var(--t4);
}

.simbrief-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    border-radius: 8px;
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
    width: 34px;
    height: 34px;
    border-radius: 9px;
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

.icon-btn.active {
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    border-color: color-mix(in srgb, var(--accent) 40%, transparent);
    color: var(--accent);
}

.pop-enter-active, .pop-leave-active {
    transition: opacity .15s, transform .15s;
}

.pop-enter-from, .pop-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}

.phase-bar {
    display: flex;
    gap: 0;
    overflow-x: auto;
    padding: 0 12px;
    max-width: 1600px;
    margin: 0 auto;
    scrollbar-width: none;
    border-top: 1px solid var(--border);
}

.phase-bar::-webkit-scrollbar {
    display: none;
}

.phase-tab {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border: none;
    background: transparent;
    color: var(--t3);
    font-size: 12.5px;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: color .15s;
}

.phase-tab::after {
    content: '';
    position: absolute;
    left: 10px;
    right: 10px;
    bottom: 0;
    height: 2px;
    background: transparent;
    border-radius: 2px 2px 0 0;
    transition: background .15s;
}

.phase-tab:hover {
    color: var(--text);
}

.phase-tab.active {
    color: var(--pa);
}

.phase-tab.active::after {
    background: var(--pa);
}

.phase-tab-progress {
    font-size: 10.5px;
    opacity: .7;
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

/* Body — Flex-Spalte: Timeline + Canvas immer unten */
.body {
    display: flex;
    flex-direction: column;
    max-width: 1600px;
    margin: 0 auto;
    height: calc(100dvh - 88px - env(safe-area-inset-top));
    overflow: hidden;
}

@media (min-width: 1100px) {
    .body {
        padding: 12px 12px 0;
        height: calc(100dvh - 96px - env(safe-area-inset-top));
    }
}

.timeline-col {
    min-width: 0;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
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

/* Fixer Step-Footer */
.step-footer {
    display: flex;
    gap: 8px;
    padding: 10px 12px;
    padding-bottom: calc(10px + env(safe-area-inset-bottom));
    border-top: 1px solid var(--border);
    background: color-mix(in srgb, var(--bg) 94%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    flex-shrink: 0;
    align-items: stretch;
}

.step-footer .btn {
    border-radius: 12px;
    height: 48px;
}

.footer-next {
    flex: 1;
    justify-content: center;
}

@media (max-width: 480px) {
    .footer-btn-label {
        display: none;
    }
}

/* Step-Footer Button Overrides */
.step-footer .btn:disabled {
    opacity: .35;
    cursor: not-allowed;
}

.step-footer .btn.open {
    background: color-mix(in srgb, #fbbf24 18%, transparent);
    border-color: color-mix(in srgb, #fbbf24 40%, transparent);
    color: #fcd34d;
}


/* Resize Handle */
.resize-handle {
    height: 8px;
    cursor: row-resize;
    flex-shrink: 0;
    background: transparent;
    position: relative;
    z-index: 10;
    touch-action: none;
}

.resize-handle::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 3px;
    border-radius: 999px;
    background: var(--border-strong);
    transition: background .15s;
}

.resize-handle:hover::after {
    background: var(--accent);
}

/* Aside — immer unten */
.aside {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    flex-shrink: 0;
    border-top: 1px solid var(--border);
    background: var(--bg2);
}

@media (min-width: 1100px) {
    .aside {
        border-radius: 14px 14px 0 0;
        border: 1px solid var(--border);
        border-bottom: none;
        background: var(--surface);
    }
}

.canvas-wrap {
    position: relative;
    flex: 1;
    min-height: 0;
}

.canvas-scroll {
    position: absolute;
    inset: 0;
    overflow-y: auto;
    padding: 8px;
}

.canvas-toolbar {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 6px;
}

.canvas-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid var(--border-strong);
    background: rgba(11, 16, 32, .85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: var(--text);
    font-size: 12px;
    cursor: pointer;
    transition: all .15s;
    box-shadow: 0 4px 12px rgba(0, 0, 0, .35);
}

.canvas-btn:hover {
    background: color-mix(in srgb, var(--accent) 10%, var(--surface-2));
    color: var(--text);
}

.canvas {
    display: block;
    width: 100%;
    flex-shrink: 0;
    height: 1400px;
    border-radius: 10px;
    background: rgba(0, 0, 0, .35);
    border: 1px solid var(--border);
    cursor: crosshair;
    touch-action: none;
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
