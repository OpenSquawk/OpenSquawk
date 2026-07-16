<script setup lang="ts">
import { WEBSIM_SPAWN_PRESETS } from '~~/shared/data/websim/spawnPresets'
import type { WebSimSpawnPreset } from '~~/shared/data/websim/types'

defineEmits<{ pick: [preset: WebSimSpawnPreset] }>()

const presets = WEBSIM_SPAWN_PRESETS
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6">
    <div class="w-full max-w-3xl">
      <div class="mb-6 text-center">
        <h1 class="text-xl font-semibold text-white/90">OpenSquawk WebSim</h1>
        <p class="mt-1 text-sm text-white/40">Browser-A320 zum Testen von /live-atc ohne MSFS. Startposition wählen:</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          v-for="preset in presets"
          :key="preset.id"
          class="text-left rounded-2xl border border-white/10 bg-[#0b1328]/90 p-4 hover:border-cyan-400/40 hover:bg-[#0b1328] transition-colors"
          @click="$emit('pick', preset)"
        >
          <div class="flex items-center gap-2 mb-1">
            <v-icon icon="mdi-airplane" size="16" class="text-cyan-400/70" />
            <span class="text-sm font-medium text-white/90">{{ preset.label }}</span>
          </div>
          <p class="text-xs text-white/40 leading-relaxed">{{ preset.description }}</p>
        </button>
      </div>
    </div>
  </div>
</template>
