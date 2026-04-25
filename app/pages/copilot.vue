<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue'
import {a320Profile, scratchFields, sopProfiles, type SopPhase, type SopStep} from '~~/shared/data/a320SopTimeline'

useHead({
    title: 'Copilot · A320 SOP – OpenSquawk',
    meta: [
        {name: 'apple-mobile-web-app-capable', content: 'yes'},
        {name: 'mobile-web-app-capable', content: 'yes'},
        {name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent'},
        {name: 'theme-color', content: '#050910'},
        {name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no'},
    ],
    link: [{rel: 'manifest', href: '/copilot.webmanifest'}],
})

const STORAGE_KEY = 'opensquawk.copilot.v1'

// Statische Tailwind-Klassen pro Phase (dynamic interp wird nicht von JIT erkannt)
const phaseChrome: Record<string, { bar: string; label: string }> = {
    cyan: {bar: 'bg-cyan-500/10 border-cyan-400/20', label: 'text-cyan-300'},
    sky: {bar: 'bg-sky-500/10 border-sky-400/20', label: 'text-sky-300'},
    indigo: {bar: 'bg-indigo-500/10 border-indigo-400/20', label: 'text-indigo-300'},
    emerald: {bar: 'bg-emerald-500/10 border-emerald-400/20', label: 'text-emerald-300'},
    amber: {bar: 'bg-amber-500/10 border-amber-400/20', label: 'text-amber-300'},
    rose: {bar: 'bg-rose-500/10 border-rose-400/20', label: 'text-rose-300'},
}

const activeProfile = ref(a320Profile)
const phases = computed<SopPhase[]>(() => activeProfile.value.phases)

// Scratchpad-State
const scratch = ref<Record<string, string>>({})
const variantSel = ref<Record<string, string>>({})       // stepId → variantId
const completed = ref<Record<string, boolean>>({})
const activeStepId = ref<string | null>(null)
const simbriefUser = ref('')
const simbriefLoading = ref(false)
const simbriefError = ref('')

// SimBrief import
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

// Template-Interpolation für Callouts
function interp(t?: string): string {
    if (!t) return ''
    return t.replace(/\[([^\]]+)\]/g, (_, key) => {
        const k = String(key).trim()
        const map: Record<string, string> = {
            'Callsign': scratch.value.callsign,
            'CALLSIGN': scratch.value.callsign,
            'DEST': scratch.value.destination,
            'SID': scratch.value.sid,
            'RWY': scratch.value.rwy,
            'ALT': scratch.value.initialClimb,
            'CLEARED ALT': scratch.value.initialClimb,
            'SQK': scratch.value.squawk,
            'ATIS': scratch.value.atisLetter,
            'XX': scratch.value.stand,
            'FREQ': scratch.value.depFreq,
            'TEMP': scratch.value.flexTemp,
            'TWY': scratch.value.taxiRoute,
            'TWY A, B, C': scratch.value.taxiRoute,
        }
        const val = map[k]
        return val ? val : `[${k}]`
    })
}

// Visible steps (mit Variant-Substitution)
function stepsForPhase(phase: SopPhase): SopStep[] {
    const out: SopStep[] = []
    for (const s of phase.steps) {
        if (s.variants?.length) {
            const sel = variantSel.value[s.id] || s.variants[0].id
            out.push(s)
            const variant = s.variants.find(v => v.id === sel)
            if (variant) out.push(...variant.steps)
        } else {
            out.push(s)
        }
    }
    return out
}

const allSteps = computed(() => {
    const out: { phase: SopPhase; step: SopStep }[] = []
    for (const p of phases.value) for (const s of stepsForPhase(p)) out.push({phase: p, step: s})
    return out
})

const progressPct = computed(() => {
    const total = allSteps.value.length
    if (!total) return 0
    const done = allSteps.value.filter(({step}) => completed.value[step.id]).length
    return Math.round((done / total) * 100)
})

function toggleDone(id: string) {
    completed.value[id] = !completed.value[id]
    persist()
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

function scrollToStep(id: string) {
    const el = document.querySelector(`[data-step-id="${id}"]`) as HTMLElement | null
    if (el) el.scrollIntoView({behavior: 'smooth', block: 'center'})
}

function resetAll() {
    if (!confirm('Alle Eingaben & Fortschritt löschen?')) return
    scratch.value = {}
    completed.value = {}
    variantSel.value = {}
    activeStepId.value = null
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

// Aktive Step-Beobachtung beim Scrollen
let observer: IntersectionObserver | null = null

function setupActiveObserver() {
    if (typeof IntersectionObserver === 'undefined') return
    observer = new IntersectionObserver((entries) => {
        for (const e of entries) {
            if (e.isIntersecting && e.intersectionRatio > 0.6) {
                const id = (e.target as HTMLElement).dataset.stepId
                if (id) activeStepId.value = id
            }
        }
    }, {threshold: [0.6]})
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

// Right Panel Tabs
const rightTab = ref<'scratch' | 'canvas'>('scratch')

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

// Canvas (Apple Pencil)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const drawColor = ref('#fde68a')
const lineWidth = ref(2.4)

function setupCanvas() {
    const cv = canvasRef.value
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    const resize = () => {
        const rect = cv.getBoundingClientRect()
        cv.width = rect.width * dpr
        cv.height = rect.height * dpr
        const ctx = cv.getContext('2d')!
        ctx.scale(dpr, dpr)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
    }
    resize()
    new ResizeObserver(resize).observe(cv)

    let drawing = false
    let last: { x: number; y: number; p: number } | null = null

    function pos(e: PointerEvent) {
        const r = cv!.getBoundingClientRect()
        return {x: e.clientX - r.left, y: e.clientY - r.top, p: e.pressure || 0.5}
    }

    cv.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch' && (e as any).isPrimary === false) return
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
    ctx.clearRect(0, 0, cv.width, cv.height)
}

const actorMeta: Record<string, { label: string; cls: string }> = {
    pilot: {label: 'PILOT → ATC', cls: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/30'},
    pf: {label: 'PF', cls: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30'},
    pm: {label: 'PM', cls: 'bg-violet-500/15 text-violet-200 border-violet-400/30'},
    atc: {label: 'ATC', cls: 'bg-amber-500/15 text-amber-200 border-amber-400/30'},
    cabin: {label: 'CABIN', cls: 'bg-rose-500/15 text-rose-200 border-rose-400/30'},
    system: {label: 'SYSTEM', cls: 'bg-white/10 text-white/80 border-white/15'},
}
</script>

<template>
    <div class="copilot-root min-h-screen bg-[#050910] text-white">
        <!-- Top Bar -->
        <header class="sticky top-0 z-30 border-b border-white/10 bg-[#050910]/85 backdrop-blur">
            <div class="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-2 px-3 py-2 sm:px-5 sm:py-3">
                <NuxtLink to="/" class="flex items-center gap-2 font-semibold tracking-tight">
                    <v-icon icon="mdi-airplane-takeoff" size="22" class="text-cyan-400"/>
                    <span class="text-sm sm:text-base">Copilot</span>
                </NuxtLink>
                <span class="hidden sm:inline rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[11px] uppercase tracking-wider text-cyan-300">
                    {{ activeProfile.name }}
                </span>

                <div class="ml-auto flex flex-wrap items-center gap-2">
                    <div class="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1">
                        <input
                            v-model="simbriefUser"
                            placeholder="SimBrief User / ID"
                            class="w-32 sm:w-44 bg-transparent text-sm placeholder-white/40 focus:outline-none"
                            @keyup.enter="importSimbrief"
                        />
                        <button
                            class="rounded-md bg-cyan-500/90 px-2.5 py-1 text-xs font-medium text-black hover:bg-cyan-400 disabled:opacity-50"
                            :disabled="simbriefLoading || !simbriefUser.trim()"
                            @click="importSimbrief"
                        >
                            <v-icon v-if="simbriefLoading" icon="mdi-loading mdi-spin" size="14"/>
                            <span v-else>Import</span>
                        </button>
                    </div>
                    <button class="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80 hover:bg-white/10" @click="resetAll">
                        <v-icon icon="mdi-refresh" size="14" class="mr-1"/>
                        Reset
                    </button>
                </div>
            </div>
            <!-- Progress Bar -->
            <div class="h-1 w-full bg-white/5">
                <div class="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-400 transition-all" :style="{width: progressPct + '%'}"/>
            </div>
            <div v-if="simbriefError" class="bg-rose-500/15 px-4 py-1 text-xs text-rose-200">
                {{ simbriefError }}
            </div>
        </header>

        <!-- Main Grid -->
        <main class="mx-auto grid w-full max-w-[1600px] gap-3 px-2 py-3 sm:px-4 sm:py-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,460px)]">
            <!-- Timeline Column -->
            <section class="relative">
                <div
                    class="timeline-scroll snap-y snap-mandatory overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.02] shadow-inner"
                    style="max-height: calc(100dvh - 180px); min-height: 60vh;"
                >
                    <div
                        v-for="phase in phases"
                        :key="phase.id"
                        class="snap-start scroll-mt-2"
                    >
                        <div :class="['sticky top-0 z-10 border-b px-4 py-2.5 backdrop-blur', phaseChrome[phase.color]?.bar || 'bg-white/5 border-white/10']">
                            <div class="flex items-center justify-between gap-3">
                                <div>
                                    <div :class="['text-[11px] font-semibold uppercase tracking-[0.18em]', phaseChrome[phase.color]?.label || 'text-white/70']">
                                        Phase
                                    </div>
                                    <h2 class="text-base font-semibold sm:text-lg">{{ phase.title }}</h2>
                                    <div v-if="phase.subtitle" class="text-xs text-white/55">{{ phase.subtitle }}</div>
                                </div>
                                <div class="text-xs text-white/50">
                                    {{ stepsForPhase(phase).filter(s => completed[s.id]).length }} / {{ stepsForPhase(phase).length }}
                                </div>
                            </div>
                        </div>

                        <ol class="space-y-2.5 px-3 py-3 sm:px-5 sm:py-4">
                            <template v-for="step in phase.steps" :key="step.id">
                                <!-- Step ohne Variants -->
                                <li
                                    v-if="!step.variants"
                                    :data-step-id="step.id"
                                    class="snap-start scroll-mt-20"
                                    @click="setActive(step.id)"
                                >
                                    <div :class="['group rounded-xl border bg-white/[0.03] p-3 transition sm:p-4',
                                        activeStepId === step.id ? 'border-cyan-400/60 ring-1 ring-cyan-400/40' : 'border-white/10 hover:border-white/20',
                                        completed[step.id] ? 'opacity-60' : '']">
                                        <div class="flex items-start gap-3">
                                            <button
                                                class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/20"
                                                :class="completed[step.id] ? 'bg-emerald-500/80 border-emerald-400 text-black' : 'bg-white/5'"
                                                @click.stop="toggleDone(step.id)"
                                            >
                                                <v-icon v-if="completed[step.id]" icon="mdi-check" size="14"/>
                                            </button>
                                            <div class="min-w-0 flex-1">
                                                <div class="flex flex-wrap items-center gap-2">
                                                    <span :class="['rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', actorMeta[step.actor]?.cls]">
                                                        {{ actorMeta[step.actor]?.label || step.actor }}
                                                    </span>
                                                    <span class="text-sm font-medium sm:text-base">{{ step.label }}</span>
                                                </div>
                                                <p v-if="step.callout" class="mt-2 rounded-lg bg-black/40 px-3 py-2 font-mono text-[13px] leading-relaxed text-cyan-100/90 ring-1 ring-cyan-400/15">
                                                    {{ interp(step.callout) }}
                                                </p>
                                                <p v-if="step.detail" class="mt-2 text-sm text-white/70">{{ step.detail }}</p>
                                                <div v-if="step.look" class="mt-1.5 inline-flex items-center gap-1 text-xs text-white/50">
                                                    <v-icon icon="mdi-eye-outline" size="13"/>
                                                    {{ step.look }}
                                                </div>
                                                <div v-if="step.inputKeys?.length" class="mt-2 flex flex-wrap gap-1.5">
                                                    <span
                                                        v-for="k in step.inputKeys"
                                                        :key="k"
                                                        :class="['rounded-md border px-2 py-0.5 text-[11px]',
                                                            scratch[k] ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200' : 'border-white/15 bg-white/5 text-white/55']"
                                                    >
                                                        {{ scratchFields.find(f => f.key === k)?.label || k }}{{ scratch[k] ? `: ${scratch[k]}` : '' }}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>

                                <!-- Step mit Variants: horizontaler Slider -->
                                <li
                                    v-else
                                    :data-step-id="step.id"
                                    class="snap-start scroll-mt-20"
                                    @click="setActive(step.id)"
                                >
                                    <div :class="['rounded-xl border bg-white/[0.03] p-3 sm:p-4',
                                        activeStepId === step.id ? 'border-cyan-400/60 ring-1 ring-cyan-400/40' : 'border-white/10']">
                                        <div class="flex items-start gap-3">
                                            <button
                                                class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/20"
                                                :class="completed[step.id] ? 'bg-emerald-500/80 border-emerald-400 text-black' : 'bg-white/5'"
                                                @click.stop="toggleDone(step.id)"
                                            >
                                                <v-icon v-if="completed[step.id]" icon="mdi-check" size="14"/>
                                            </button>
                                            <div class="min-w-0 flex-1">
                                                <div class="flex flex-wrap items-center gap-2">
                                                    <span :class="['rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', actorMeta[step.actor]?.cls]">
                                                        {{ actorMeta[step.actor]?.label }}
                                                    </span>
                                                    <span class="text-sm font-medium sm:text-base">{{ step.label }}</span>
                                                </div>
                                                <p v-if="step.detail" class="mt-1.5 text-sm text-white/70">{{ step.detail }}</p>

                                                <!-- Variant Tabs -->
                                                <div class="mt-3 flex flex-wrap gap-1.5">
                                                    <button
                                                        v-for="v in step.variants"
                                                        :key="v.id"
                                                        :class="['rounded-md px-2.5 py-1 text-xs transition',
                                                            (variantSel[step.id] || step.variants![0].id) === v.id
                                                                ? 'bg-cyan-500/80 text-black'
                                                                : 'bg-white/5 text-white/70 hover:bg-white/10']"
                                                        @click.stop="variantSel[step.id] = v.id"
                                                    >
                                                        {{ v.title }}
                                                    </button>
                                                </div>

                                                <!-- Variant-Steps -->
                                                <div class="mt-3 space-y-2">
                                                    <div
                                                        v-for="vstep in (step.variants.find(v => v.id === (variantSel[step.id] || step.variants![0].id))?.steps || [])"
                                                        :key="vstep.id"
                                                        :data-step-id="vstep.id"
                                                        class="rounded-lg border border-white/10 bg-black/30 p-2.5 sm:p-3"
                                                        :class="[completed[vstep.id] ? 'opacity-60' : '']"
                                                    >
                                                        <div class="flex items-start gap-2">
                                                            <button
                                                                class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-white/20"
                                                                :class="completed[vstep.id] ? 'bg-emerald-500/80 border-emerald-400 text-black' : 'bg-white/5'"
                                                                @click.stop="toggleDone(vstep.id)"
                                                            >
                                                                <v-icon v-if="completed[vstep.id]" icon="mdi-check" size="11"/>
                                                            </button>
                                                            <div class="min-w-0 flex-1">
                                                                <div class="text-sm font-medium">{{ vstep.label }}</div>
                                                                <p v-if="vstep.callout" class="mt-1.5 rounded bg-black/40 px-2 py-1.5 font-mono text-xs text-cyan-100/90 ring-1 ring-cyan-400/15">
                                                                    {{ interp(vstep.callout) }}
                                                                </p>
                                                                <p v-if="vstep.detail" class="mt-1 text-xs text-white/65">{{ vstep.detail }}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </template>
                        </ol>
                    </div>
                </div>

                <!-- Sticky Action Bar -->
                <div class="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                    <div class="text-xs text-white/60">
                        Aktiv: <span class="text-white/90">{{ allSteps.find(s => s.step.id === activeStepId)?.step.label || '–' }}</span>
                    </div>
                    <div class="ml-auto flex gap-2">
                        <button class="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                                @click="activeStepId && toggleDone(activeStepId)">
                            <v-icon icon="mdi-check-circle-outline" size="14" class="mr-1"/>
                            Mark done
                        </button>
                        <button class="rounded-md bg-cyan-500/90 px-4 py-1.5 text-xs font-semibold text-black hover:bg-cyan-400" @click="nextStep">
                            Next →
                        </button>
                    </div>
                </div>
            </section>

            <!-- Right Panel -->
            <aside class="space-y-3">
                <div class="flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                    <button
                        :class="['flex-1 rounded-lg px-3 py-1.5 text-sm transition',
                            rightTab === 'scratch' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white/90']"
                        @click="rightTab = 'scratch'"
                    >
                        <v-icon icon="mdi-notebook-edit-outline" size="16" class="mr-1"/>
                        Scratchpad
                    </button>
                    <button
                        :class="['flex-1 rounded-lg px-3 py-1.5 text-sm transition',
                            rightTab === 'canvas' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white/90']"
                        @click="rightTab = 'canvas'"
                    >
                        <v-icon icon="mdi-draw-pen" size="16" class="mr-1"/>
                        Canvas
                    </button>
                </div>

                <!-- Scratchpad -->
                <div v-if="rightTab === 'scratch'"
                     class="space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:p-4"
                     style="max-height: calc(100dvh - 220px);">
                    <div v-for="(fields, group) in groupedFields" :key="group">
                        <div class="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
                            {{ groupTitles[group] || group }}
                        </div>
                        <div class="grid grid-cols-2 gap-1.5">
                            <label v-for="f in fields" :key="f.key" class="block">
                                <div class="text-[10px] uppercase tracking-wider text-white/45">{{ f.label }}</div>
                                <input
                                    v-model="scratch[f.key]"
                                    :placeholder="f.placeholder"
                                    class="w-full rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-sm placeholder-white/30 focus:border-cyan-400/60 focus:outline-none"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Canvas -->
                <div v-else
                     class="rounded-2xl border border-white/10 bg-white/[0.02] p-2 sm:p-3"
                     style="max-height: calc(100dvh - 220px);">
                    <div class="mb-2 flex flex-wrap items-center gap-2">
                        <div class="flex gap-1">
                            <button
                                v-for="c in ['#fde68a','#22d3ee','#a78bfa','#f472b6','#ffffff']"
                                :key="c"
                                class="h-6 w-6 rounded-full ring-2 ring-transparent transition"
                                :style="{background: c}"
                                :class="drawColor === c ? 'ring-white' : ''"
                                @click="drawColor = c"
                            />
                        </div>
                        <input v-model.number="lineWidth" type="range" min="1" max="6" step="0.5" class="w-24"/>
                        <button class="ml-auto rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs hover:bg-white/10" @click="clearCanvas">
                            <v-icon icon="mdi-eraser" size="14" class="mr-1"/>
                            Clear
                        </button>
                    </div>
                    <canvas
                        ref="canvasRef"
                        class="block h-[60vh] w-full cursor-crosshair touch-none rounded-xl bg-[#0a0f1c] ring-1 ring-white/10"
                    />
                    <div class="mt-1 text-[11px] text-white/45">Apple Pencil / Pen wird druckempfindlich erfasst.</div>
                </div>
            </aside>
        </main>
    </div>
</template>

<style scoped>
.copilot-root {
    /* iOS Safe Areas im Standalone-Mode */
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
}

.timeline-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
}

.timeline-scroll::-webkit-scrollbar {
    width: 6px;
}

.timeline-scroll::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.18);
    border-radius: 3px;
}
</style>
