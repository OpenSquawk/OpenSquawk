<script setup lang="ts">
import type { ReadbackFieldDetail } from '~/composables/useRadioBackend'

withDefaults(defineProps<{
  log: readonly any[]
  /** Per-field STT readback breakdown for the last pilot call; empty hides the block. */
  readbackReport: readonly ReadbackFieldDetail[]
  readbackTranscript: string
  limit?: number
  dense?: boolean
}>(), {
  limit: 30,
  dense: true,
})

const emit = defineEmits<{ (e: 'clear'): void }>()
</script>

<template>
  <div class="rail">
    <!-- STT readback check: what was recognised vs missing in the last call. -->
    <div v-if="readbackReport.length" class="pm-readback-check">
      <div class="pm-readback-head">
        <v-icon size="15">mdi-magnify-scan</v-icon>
        <span>Readback check</span>
      </div>
      <p v-if="readbackTranscript" class="pm-readback-heard">heard: “{{ readbackTranscript }}”</p>
      <div
          v-for="r in readbackReport"
          :key="r.field"
          class="pm-readback-row"
          :class="r.matched ? 'is-ok' : 'is-missing'"
      >
        <v-icon size="13">{{ r.matched ? 'mdi-check-circle' : 'mdi-close-circle' }}</v-icon>
        <span class="pm-readback-text">
          <span class="pm-readback-field">{{ r.field }}</span>
          = <span class="pm-readback-expected">{{ r.expected || '—' }}</span>
          <template v-if="r.matched"> → “{{ r.matched_via }}”</template>
          <template v-else>
            → not recognised<span v-if="r.accepted_forms.length" class="pm-readback-forms">
              (say: {{ r.accepted_forms.join(' / ') }})</span>
          </template>
        </span>
      </div>
    </div>

    <CommLog :entries="log" :limit="limit" :dense="dense" @clear="emit('clear')" />
  </div>
</template>

<style scoped>
.pm-readback-check {
  margin-bottom: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: color-mix(in srgb, var(--text) 4%, transparent);
  font-size: 11.5px;
}
.pm-readback-head {
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
  letter-spacing: .12em;
  font-size: 10px;
  font-weight: 600;
  color: color-mix(in srgb, var(--text) 55%, transparent);
  margin-bottom: 6px;
}
.pm-readback-heard {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: color-mix(in srgb, var(--text) 50%, transparent);
  margin-bottom: 6px;
  font-size: 11px;
}
.pm-readback-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  line-height: 1.5;
}
.pm-readback-row.is-ok { color: #6ee7a8; }
.pm-readback-row.is-missing { color: #fca5a5; }
.pm-readback-field { color: var(--t2); }
.pm-readback-expected { color: var(--text); font-weight: 600; }
.pm-readback-forms { color: var(--t4); }
</style>
