<script setup lang="ts">
import type { useBugReport } from '~/composables/useBugReport'

/**
 * The composable stays owned by the page: the HUD's "Report issue" button needs
 * `openBugReport` and `bugReportCapturing` before this dialog ever renders. So it
 * is handed over whole rather than unpacked into a dozen props.
 */
const props = defineProps<{
  bug: ReturnType<typeof useBugReport>
  theme: 'light' | 'dark'
}>()

const {
  showBugReportDialog,
  bugReportComment,
  bugReportContact,
  bugReportScreenshot,
  bugReportArrows,
  bugReportLoading,
  bugReportError,
  bugReportSuccess,
  bugReportCanvasRef,
  bugReportImgRef,
  setupAnnotationCanvas,
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  onCanvasMouseLeave,
  undoLastArrow,
  submitBugReport,
} = props.bug
</script>

<template>
  <v-dialog v-model="showBugReportDialog" max-width="680" scrollable :content-class="theme === 'light' ? 'pm-dialog-light' : ''">
    <v-card :class="theme === 'light' ? 'bg-white border border-black/10 text-[#0f1420]' : 'bg-[#0b101d] border border-white/10 text-white'">
      <v-card-title class="flex items-center gap-2 text-base font-semibold pt-4 px-5">
        <v-icon icon="mdi-bug-outline" color="#f87171" size="20" />
        Fehler melden
      </v-card-title>
      <v-card-text class="space-y-4 px-5 pb-2">
        <div v-if="bugReportSuccess" class="rounded-xl bg-emerald-500/10 border border-emerald-400/30 p-4 text-center">
          <v-icon icon="mdi-check-circle-outline" color="emerald" size="32" class="mb-2" />
          <p class="text-emerald-300 font-semibold">Danke! Bug Report wurde gesendet.</p>
        </div>
        <template v-else>
          <div v-if="bugReportScreenshot" class="space-y-2">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-2">
                <v-icon size="18" color="red" class="mt-0.5">mdi-gesture-tap-button</v-icon>
                <div>
                  <p class="text-sm font-semibold text-white/90">Wo ist der Fehler? Zeichne einen Pfeil hin.</p>
                  <p class="text-xs text-white/55 leading-snug">
                    Klicke auf die Stelle und ziehe mit gedrückter Maustaste (am Handy: mit dem Finger)
                    zur Problemstelle. Du kannst mehrere Pfeile setzen.
                  </p>
                </div>
              </div>
              <v-btn
                v-if="bugReportArrows.length > 0"
                size="x-small"
                variant="text"
                color="red"
                prepend-icon="mdi-undo"
                class="shrink-0"
                @click="undoLastArrow"
              >
                Pfeil zurück
              </v-btn>
            </div>
            <div class="relative rounded-xl overflow-hidden border border-white/10" style="line-height:0">
              <img
                ref="bugReportImgRef"
                :src="bugReportScreenshot"
                class="w-full block"
                alt="Screenshot"
                @load="setupAnnotationCanvas"
              />
              <canvas
                ref="bugReportCanvasRef"
                class="absolute inset-0 w-full h-full cursor-crosshair select-none"
                style="touch-action:none"
                @pointerdown="onCanvasMouseDown"
                @pointermove="onCanvasMouseMove"
                @pointerup="onCanvasMouseUp"
                @pointerleave="onCanvasMouseLeave"
                @pointercancel="onCanvasMouseLeave"
              />
              <span
                v-if="bugReportArrows.length === 0"
                class="pointer-events-none absolute inset-0 flex items-center justify-center text-center px-4"
              >
                <span class="rounded-full bg-black/55 px-3 py-1 text-xs text-white/85 backdrop-blur">
                  ✏️ Hier ziehen, um einen Pfeil zur Fehlerstelle zu zeichnen
                </span>
              </span>
            </div>
          </div>
          <div v-else class="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/50">
            Kein Screenshot verfügbar
          </div>

          <v-textarea
            v-model="bugReportComment"
            label="Was ist kaputt? Was sollte stattdessen passieren?"
            variant="outlined"
            color="red"
            rows="3"
            auto-grow
            maxlength="2000"
            counter="2000"
            hide-details="auto"
            :disabled="bugReportLoading"
          />

          <v-text-field
            v-model="bugReportContact"
            label="Dein Name / Kontakt"
            variant="outlined"
            color="red"
            density="comfortable"
            hide-details
            :disabled="bugReportLoading"
          />

          <v-alert
            v-if="bugReportError"
            type="error"
            density="compact"
            variant="tonal"
            class="bg-red-500/10 text-red-200"
          >
            {{ bugReportError }}
          </v-alert>
        </template>
      </v-card-text>
      <v-card-actions v-if="!bugReportSuccess" class="justify-end gap-2 px-5 pb-4">
        <v-btn variant="text" color="grey" :disabled="bugReportLoading" @click="showBugReportDialog = false">
          Abbrechen
        </v-btn>
        <v-btn
          color="red"
          variant="flat"
          :loading="bugReportLoading"
          :disabled="!bugReportComment.trim()"
          @click="submitBugReport"
        >
          Bug melden
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
