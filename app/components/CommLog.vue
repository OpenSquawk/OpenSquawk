<script setup lang="ts">
withDefaults(defineProps<{
  entries: readonly any[]
  limit?: number
  dense?: boolean
}>(), {
  limit: 8,
  dense: false,
})

const emit = defineEmits<{ (e: 'clear'): void }>()

const formatTime = (date: Date): string => {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
</script>

<template>
  <v-card class="bg-white/5 border border-white/10 h-full">
    <v-card-text class="space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-semibold">Communication Log</h3>
          <v-chip size="small" color="cyan" variant="outlined">{{ entries.length }}</v-chip>
        </div>
        <v-btn
            size="small"
            variant="text"
            color="cyan"
            class="text-xs uppercase tracking-[0.2em]"
            :disabled="entries.length === 0"
            @click="emit('clear')"
        >
          Clear
        </v-btn>
      </div>

      <div class="space-y-2 overflow-y-auto" :class="dense ? 'max-h-[70vh]' : 'max-h-64'">
        <div
            v-for="entry in entries.slice(-limit)"
            :key="entry.timestamp.getTime?.() ?? entry.timestamp"
            class="rounded-2xl border border-white/10 bg-black/40 p-3"
        >
          <div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40 mb-1">
            <span class="flex items-center gap-2">
              <v-icon
                  :icon="entry.speaker === 'pilot' ? 'mdi-account-pilot' : 'mdi-radio-tower'"
                  size="12"
                  :class="entry.speaker === 'pilot' ? 'text-blue-400' : 'text-green-400'"
              />
              {{ entry.speaker.toUpperCase() }}
              <v-chip v-if="entry.radioCheck" size="x-small" color="orange" variant="flat">RADIO CHECK</v-chip>
              <v-chip v-if="entry.offSchema" size="x-small" color="red" variant="flat">OFF-SCHEMA</v-chip>
            </span>
            <span>{{ formatTime(entry.timestamp) }}</span>
          </div>
          <p class="text-sm text-white font-mono">{{ entry.message }}</p>
          <div class="flex items-center gap-2 mt-1">
            <v-chip v-if="entry.flow" size="x-small" color="purple" variant="outlined">{{ entry.flow }}</v-chip>
            <v-chip size="x-small" color="cyan" variant="outlined">{{ entry.frequency || 'N/A' }}</v-chip>
            <span class="text-xs text-white/40">{{ entry.state }}</span>
          </div>
        </div>

        <p v-if="entries.length === 0" class="text-xs text-white/50 text-center py-4">
          No communications recorded yet.
        </p>
      </div>
    </v-card-text>
  </v-card>
</template>
