<script setup lang="ts">
defineProps<{
  flightContext: { callsign?: string, dep?: string, dest?: string }
  flags: Record<string, any>
  vars: Record<string, any>
  logLength: number
  theme: 'light' | 'dark'
}>()

const emit = defineEmits<{ (e: 'back-to-setup'): void }>()

const open = defineModel<boolean>({ required: true })
</script>

<template>
  <v-dialog v-model="open" max-width="520" :content-class="theme === 'light' ? 'pm-dialog-light' : ''">
    <v-card :class="theme === 'light' ? 'bg-white border border-black/10 text-[#0f1420]' : 'bg-[#0b101d] border border-white/10 text-white'">
      <v-card-title class="flex items-center justify-between gap-2 text-base font-semibold">
        <div class="flex items-center gap-2">
          <v-icon icon="mdi-airplane" size="20" color="cyan" />
          Flight info
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" @click="open = false" />
      </v-card-title>
      <v-card-text class="space-y-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-[0.3em] text-white/50">Active flight</p>
            <h2 class="text-2xl font-semibold">{{ flightContext.callsign || 'N/A' }}</h2>
            <p class="text-sm text-white/70">{{ flightContext.dep }} → {{ flightContext.dest }}</p>
          </div>
          <div class="text-right space-y-1">
            <v-chip
                :color="flags.in_air ? 'green' : 'grey'"
                variant="flat"
                size="small"
            >
              {{ flags.in_air ? 'IN-AIR' : 'GROUND' }}
            </v-chip>
            <div class="flex gap-1 justify-end">
              <v-chip size="x-small" :color="flags.emergency_active ? 'red' : 'grey'" variant="outlined">
                EMERG
              </v-chip>
              <v-chip size="x-small" color="cyan" variant="outlined">
                {{ flags.current_unit }}
              </v-chip>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <p class="text-xs text-white/40 uppercase tracking-wider">Stand</p>
            <p class="text-white/80 font-mono">{{ vars.stand }}</p>
          </div>
          <div>
            <p class="text-xs text-white/40 uppercase tracking-wider">Runway</p>
            <p class="text-white/80 font-mono">{{ vars.runway }}</p>
          </div>
          <div>
            <p class="text-xs text-white/40 uppercase tracking-wider">Squawk</p>
            <p class="text-white/80 font-mono">{{ vars.squawk }}</p>
          </div>
          <div>
            <p class="text-xs text-white/40 uppercase tracking-wider">SID</p>
            <p class="text-white/80 font-mono">{{ vars.sid }}</p>
          </div>
        </div>

        <div class="flex justify-between pt-2 border-t border-white/10">
          <div class="text-center">
            <p class="text-lg font-semibold text-cyan-300">{{ flags.radio_checks_done || 0 }}</p>
            <p class="text-xs text-white/40 uppercase tracking-wider">Radio Checks</p>
          </div>
          <div class="text-center">
            <p class="text-lg font-semibold text-orange-300">{{ flags.off_schema_count || 0 }}</p>
            <p class="text-xs text-white/40 uppercase tracking-wider">Off-Schema</p>
          </div>
          <div class="text-center">
            <p class="text-lg font-semibold text-white">{{ logLength }}</p>
            <p class="text-xs text-white/40 uppercase tracking-wider">Transmissions</p>
          </div>
        </div>

        <v-btn
            block
            color="grey"
            variant="outlined"
            size="small"
            prepend-icon="mdi-airplane-off"
            @click="emit('back-to-setup')"
        >
          Select new flight
        </v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
