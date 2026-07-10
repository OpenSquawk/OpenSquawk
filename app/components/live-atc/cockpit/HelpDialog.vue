<script setup lang="ts">
import { computed } from 'vue'

/** `lang` stays owned by the page — the HUD help button localises its tooltip off it. */
const props = defineProps<{ theme: 'light' | 'dark', lang: 'de' | 'en' }>()

const emit = defineEmits<{
  (e: 'dismiss'): void
  (e: 'toggle-lang'): void
}>()

const open = defineModel<boolean>({ required: true })

const HELP_CONTENT = {
  de: {
    title: 'Wie /live-atc funktioniert',
    intro: 'Du bist der Pilot. Du sprichst per Funk mit der Flugsicherung (ATC) und arbeitest ein realistisches Szenario ab.',
    steps: [
      { icon: 'mdi-radio-handheld', title: 'Frequenz einstellen', text: 'Stelle die aktive COM1-Frequenz auf den zuständigen Lotsen. Auf der falschen Frequenz kommt dein Funkspruch nicht durch.' },
      { icon: 'mdi-microphone', title: 'Sprechtaste (PTT)', text: 'Halte die Sprechtaste gedrückt, sprich, lass los. Beim Senden wird die Taste grün. Ein neuer Funkspruch unterbricht die laufende ATC-Ausgabe.' },
      { icon: 'mdi-repeat', title: 'Readback', text: 'Lies Anweisungen zurück (Frequenz, Piste, Squawk, Höhe …). Stimmt es nicht, sagt ATC „say again“. Nach 3 Versuchen wird übersprungen.' },
      { icon: 'mdi-alert-octagon', title: 'Notfall', text: 'Mit „Mayday“ oder „Pan-Pan“ rufst du einen Notfall aus, mit „cancel mayday“ beendest du ihn wieder.' },
      { icon: 'mdi-bug-outline', title: 'Fehler melden', text: 'Mit dem Bug-Knopf meldest du einen Fehler — die ganze Funksession wird mitgeschickt.' },
    ],
  },
  en: {
    title: 'How /live-atc works',
    intro: 'You are the pilot. You talk to ATC over the radio and work through a realistic scenario.',
    steps: [
      { icon: 'mdi-radio-handheld', title: 'Tune the frequency', text: 'Set the active COM1 frequency to the controller you need. On the wrong frequency your call will not get through.' },
      { icon: 'mdi-microphone', title: 'Push-to-talk (PTT)', text: 'Hold the talk button, speak, release. The pad turns green while you transmit. A new transmission cuts any ATC speech still playing.' },
      { icon: 'mdi-repeat', title: 'Read back', text: 'Read instructions back (frequency, runway, squawk, altitude …). If it is wrong ATC says “say again”. After 3 tries it is skipped.' },
      { icon: 'mdi-alert-octagon', title: 'Emergency', text: 'Say “Mayday” or “Pan-Pan” to declare an emergency, and “cancel mayday” to end it.' },
      { icon: 'mdi-bug-outline', title: 'Report a bug', text: 'Use the Bug button to report an issue — the whole radio session is attached.' },
    ],
  },
} as const

const helpContent = computed(() => HELP_CONTENT[props.lang])
</script>

<template>
  <v-dialog v-model="open" max-width="560" scrollable :content-class="theme === 'light' ? 'pm-dialog-light' : ''">
    <v-card :class="theme === 'light' ? 'bg-white text-[#0f1420] border border-black/10' : 'bg-[#0b1220] text-white border border-white/10'">
      <v-card-title class="d-flex align-center justify-space-between gap-2">
        <span class="text-base font-semibold">{{ helpContent.title }}</span>
        <v-btn size="small" variant="tonal" color="cyan" @click="emit('toggle-lang')">
          {{ lang === 'de' ? 'EN' : 'DE' }}
        </v-btn>
      </v-card-title>
      <v-card-text>
        <p class="text-sm text-white/70 mb-4">{{ helpContent.intro }}</p>
        <div class="space-y-3">
          <div v-for="(step, i) in helpContent.steps" :key="i" class="flex gap-3">
            <v-icon size="22" class="text-cyan-300 shrink-0 mt-1">{{ step.icon }}</v-icon>
            <div>
              <div class="text-sm font-semibold">{{ step.title }}</div>
              <div class="text-[13px] text-white/65 leading-snug">{{ step.text }}</div>
            </div>
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="cyan" variant="flat" @click="emit('dismiss')">
          {{ lang === 'de' ? 'Verstanden' : 'Got it' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
