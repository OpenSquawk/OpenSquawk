<script setup lang="ts">
defineProps<{
  /** Enables "Remove flag" — only meaningful once the transmission is already flagged. */
  faulty: boolean
  theme: 'light' | 'dark'
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'remove'): void
  (e: 'cancel'): void
}>()

const open = defineModel<boolean>({ required: true })
const note = defineModel<string>('note', { required: true })
</script>

<template>
  <v-dialog v-model="open" max-width="420" :content-class="theme === 'light' ? 'pm-dialog-light' : ''">
    <v-card :class="theme === 'light' ? 'bg-white border border-black/10 text-[#0f1420]' : 'bg-[#0b101d] border border-white/10 text-white'">
      <v-card-title class="flex items-center gap-2 text-base font-semibold">
        <v-icon icon="mdi-alert-circle-outline" color="#f87171" size="20" />
        Mark transmission as faulty
      </v-card-title>
      <v-card-text class="space-y-4 text-sm text-white/70">
        <p>
          Optionally leave a short note so the dev team can follow up on the transmission.
        </p>
        <v-textarea
            v-model="note"
            label="Issue description (optional)"
            variant="outlined"
            color="red"
            rows="3"
            auto-grow
        />
      </v-card-text>
      <v-card-actions class="justify-end gap-2">
        <v-btn variant="text" color="grey" @click="emit('cancel')">
          Cancel
        </v-btn>
        <v-btn
            v-if="faulty"
            variant="text"
            color="cyan"
            @click="emit('remove')"
        >
          Remove flag
        </v-btn>
        <v-btn color="red" variant="flat" @click="emit('confirm')">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
