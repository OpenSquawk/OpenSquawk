<script setup lang="ts">
import { angleDiffDeg, bearingDeg, distanceNm } from '~~/shared/utils/geo'
import { useWebSimFlightModel } from '~~/shared/composables/flightlab/useWebSimFlightModel'
import { WEBSIM_AIRPORTS, WEBSIM_SPAWN_PRESETS } from '~~/shared/data/websim/spawnPresets'
import type { WebSimSpawnPreset } from '~~/shared/data/websim/types'

definePageMeta({ layout: false, middleware: ['require-auth'] })
useHead({ title: 'FlightLab - WebSim' })

const PFD_ELEMENTS = ['attitude', 'speedTape', 'altitudeTape', 'verticalSpeed', 'heading'] as const

const model = useWebSimFlightModel(WEBSIM_SPAWN_PRESETS[0]!)
const bridgeClient = useWebSimBridgeClient(model)

const hasSpawned = ref(false)

// Three states instead of a boolean: a run of failed telemetry POSTs (e.g. the
// server's Mongo connection down) otherwise reads as "verbindet…" forever,
// indistinguishable from a normal first connect.
const BRIDGE_ERROR_THRESHOLD = 2
const bridgeStatus = computed<'connecting' | 'error' | 'connected'>(() => {
  if (bridgeClient.connected.value) return 'connected'
  if (bridgeClient.failureStreak.value >= BRIDGE_ERROR_THRESHOLD) return 'error'
  return 'connecting'
})

function pickPreset(preset: WebSimSpawnPreset) {
  model.spawn(preset)
  model.start()
  hasSpawned.value = true
  void bridgeClient.startBridgeClient()
}

const targetRunway = computed(() => {
  for (const airport of Object.values(WEBSIM_AIRPORTS)) {
    const runway = airport.runways.find((r) => r.id === model.state.targetRunwayId)
    if (runway) return runway
  }
  return null
})

const distanceToRunwayNm = computed(() =>
  targetRunway.value
    ? distanceNm(model.state.lat, model.state.lon, targetRunway.value.thresholdLat, targetRunway.value.thresholdLon)
    : Infinity,
)

// Wide enough that the runway strip is visible well before touching down on
// final, not just in the last few NM (WP2 Fix 5).
const nearRunway = computed(() => distanceToRunwayNm.value < 12)

const runwayOffsetDeg = computed(() => {
  if (!targetRunway.value) return 0
  const brg = bearingDeg(model.state.lat, model.state.lon, targetRunway.value.thresholdLat, targetRunway.value.thresholdLon)
  return angleDiffDeg(model.state.heading_deg, brg)
})

const stickDisabled = computed(() => model.state.apMode !== 'OFF' && !model.state.on_ground)

// FlightlabPfdContainer renders a fixed 631x550px canvas scaled by `scale` — a
// hardcoded 0.85 clips the right edge (VS tape, altitude readout box) once the
// PFD grid cell is narrower than that. Measure the actual cell and fit the PFD
// inside it instead.
const PFD_BASE_W = 631
const PFD_BASE_H = 550
const pfdCellRef = ref<HTMLElement | null>(null)
const pfdScale = ref(0.85)
let pfdResizeObserver: ResizeObserver | null = null

function updatePfdScale() {
  const el = pfdCellRef.value
  if (!el) return
  const w = el.clientWidth
  const h = el.clientHeight
  if (w <= 0 || h <= 0) return
  const fit = Math.min(w / PFD_BASE_W, h / PFD_BASE_H)
  pfdScale.value = Math.min(1.15, Math.max(0.5, fit))
}

watch(pfdCellRef, (el, previousEl) => {
  if (previousEl) pfdResizeObserver?.unobserve(previousEl)
  if (!el) return
  if (!pfdResizeObserver && typeof ResizeObserver !== 'undefined') {
    pfdResizeObserver = new ResizeObserver(updatePfdScale)
  }
  pfdResizeObserver?.observe(el)
  updatePfdScale()
})

onBeforeUnmount(() => {
  pfdResizeObserver?.disconnect()
  bridgeClient.stopBridgeClient()
  model.stop()
})
</script>

<template>
  <div class="h-screen bg-[#070d1a] text-white overflow-hidden">
    <WebsimSpawnScreen v-if="!hasSpawned" @pick="pickPreset" />

    <div v-else class="h-full flex flex-col">
      <header class="shrink-0 border-b border-white/5 bg-[#070d1a]/90 backdrop-blur px-4 py-2 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <NuxtLink to="/flightlab" class="text-white/40 hover:text-white/80">
            <v-icon icon="mdi-arrow-left" size="18" />
          </NuxtLink>
          <span class="text-sm font-medium text-white/70">OpenSquawk WebSim</span>
        </div>
        <div class="flex items-center gap-3">
          <div
            class="flex items-center gap-1.5 text-xs"
            :class="{
              'text-emerald-300': bridgeStatus === 'connected',
              'text-red-300': bridgeStatus === 'error',
              'text-white/30': bridgeStatus === 'connecting',
            }"
            :title="bridgeStatus === 'error' ? bridgeClient.lastError.value ?? undefined : undefined"
          >
            <div
              class="h-2 w-2 rounded-full"
              :class="{
                'bg-emerald-400 animate-pulse': bridgeStatus === 'connected',
                'bg-red-400': bridgeStatus === 'error',
                'bg-white/20': bridgeStatus === 'connecting',
              }"
            />
            <template v-if="bridgeStatus === 'connected'">Bridge verbunden</template>
            <template v-else-if="bridgeStatus === 'error'">Bridge Fehler{{ bridgeClient.lastError.value ? ` (${bridgeClient.lastError.value})` : '' }}</template>
            <template v-else>Bridge verbindet…</template>
          </div>
          <a
            v-if="bridgeClient.liveAtcUrl.value"
            :href="bridgeClient.liveAtcUrl.value"
            target="_blank"
            rel="noopener"
            class="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200 hover:bg-cyan-500/20"
          >
            /live-atc öffnen ↗
          </a>
        </div>
      </header>

      <main class="flex-1 grid gap-2 p-2 overflow-hidden" style="grid-template-columns: 1fr 1.3fr 1fr; grid-template-rows: minmax(0, 1fr) auto">
        <div class="min-h-0 rounded-2xl overflow-hidden border border-white/5 bg-[#050a15]">
          <ClientOnly>
            <WebsimExteriorView
              :pitch="model.state.pitch_deg"
              :bank="model.state.bank_deg"
              :altitude-ft="model.state.altitude_ft"
              :field-elevation-ft="targetRunway?.elevation_ft ?? 0"
              :near-runway="nearRunway"
              :distance-to-runway-nm="distanceToRunwayNm"
              :runway-offset-deg="runwayOffsetDeg"
            />
          </ClientOnly>
        </div>

        <div ref="pfdCellRef" class="min-h-0 rounded-2xl overflow-hidden border border-white/5 bg-black flex items-center justify-center">
          <FlightlabPfdContainer
            :pitch="model.state.pitch_deg"
            :bank-angle="model.state.bank_deg"
            :heading="model.state.heading_deg"
            :speed="model.state.ias_kts"
            :altitude="model.state.altitude_ft"
            :vertical-speed="model.state.vs_fpm"
            :visible-elements="[...PFD_ELEMENTS]"
            :scale="pfdScale"
          />
        </div>

        <div class="min-h-0 rounded-2xl overflow-hidden border border-white/5 bg-[#0b1328]">
          <ClientOnly>
            <WebsimNdMap :lat="model.state.lat" :lon="model.state.lon" :heading="model.state.heading_deg" />
          </ClientOnly>
        </div>

        <div class="col-span-3 grid grid-cols-3 gap-2 items-stretch">
          <WebsimSidestickPad
            :throttle="model.manualInput.throttle"
            :disabled="stickDisabled"
            @stick="(pitch, roll) => model.setStick(pitch, roll)"
            @throttle="(v) => model.setThrottle(v)"
          />
          <WebsimFcuPanel
            :target-ias="model.state.target_ias"
            :target-hdg="model.state.target_hdg"
            :target-alt="model.state.target_alt"
            :ap-mode="model.state.apMode"
            @set-ias="(v) => model.setFcuTarget({ ias: v })"
            @set-hdg="(v) => model.setFcuTarget({ hdg: v })"
            @set-alt="(v) => model.setFcuTarget({ alt: v })"
            @press-ap="model.pressAp"
            @press-nav="model.pressNav"
            @press-appr="model.pressAppr"
          />
          <WebsimRadioPanel
            :com-active="model.state.com_active"
            :com-standby="model.state.com_standby"
            :transponder="model.state.transponder_code"
            :gear-down="model.state.gearDown"
            :parking-brake="model.state.parkingBrake"
            :engine-state="model.state.engineState"
            :on-ground="model.state.on_ground"
            @swap-com="model.swapCom"
            @set-standby="(v) => model.setCom(undefined, v)"
            @toggle-gear="model.toggleGear"
            @toggle-parking-brake="model.toggleParkingBrake"
            @start-engines="model.startEngines"
          />
        </div>
      </main>
    </div>
  </div>
</template>
