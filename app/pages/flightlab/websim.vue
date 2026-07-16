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

const nearRunway = computed(() => distanceToRunwayNm.value < 3)

const runwayOffsetDeg = computed(() => {
  if (!targetRunway.value) return 0
  const brg = bearingDeg(model.state.lat, model.state.lon, targetRunway.value.thresholdLat, targetRunway.value.thresholdLon)
  return angleDiffDeg(model.state.heading_deg, brg)
})

const stickDisabled = computed(() => model.state.apMode !== 'OFF' && !model.state.on_ground)

onBeforeUnmount(() => {
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
          <div class="flex items-center gap-1.5 text-xs" :class="bridgeClient.connected.value ? 'text-emerald-300' : 'text-white/30'">
            <div class="h-2 w-2 rounded-full" :class="bridgeClient.connected.value ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'" />
            Bridge {{ bridgeClient.connected.value ? 'verbunden' : 'verbindet…' }}
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

      <main class="flex-1 grid gap-2 p-2 overflow-hidden" style="grid-template-columns: 1fr 1.3fr 1fr; grid-template-rows: 1fr auto">
        <div class="rounded-2xl overflow-hidden border border-white/5 bg-[#050a15]">
          <ClientOnly>
            <WebsimExteriorView
              :pitch="model.state.pitch_deg"
              :bank="model.state.bank_deg"
              :near-runway="nearRunway"
              :runway-offset-deg="runwayOffsetDeg"
            />
          </ClientOnly>
        </div>

        <div class="rounded-2xl overflow-hidden border border-white/5 bg-black flex items-center justify-center">
          <FlightlabPfdContainer
            :pitch="model.state.pitch_deg"
            :bank-angle="model.state.bank_deg"
            :heading="model.state.heading_deg"
            :speed="model.state.ias_kts"
            :altitude="model.state.altitude_ft"
            :vertical-speed="model.state.vs_fpm"
            :visible-elements="[...PFD_ELEMENTS]"
            :scale="0.85"
          />
        </div>

        <div class="rounded-2xl overflow-hidden border border-white/5 bg-[#0b1328]">
          <ClientOnly>
            <WebsimNdMap :lat="model.state.lat" :lon="model.state.lon" :heading="model.state.heading_deg" />
          </ClientOnly>
        </div>

        <div class="col-span-3 grid grid-cols-3 gap-2">
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
