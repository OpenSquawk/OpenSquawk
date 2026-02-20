<template>
  <div class="h-screen bg-[#070d1a] text-white flex flex-col overflow-hidden select-none touch-none">
    <!-- Header -->
    <header class="shrink-0 border-b border-white/5 bg-[#070d1a]/90 backdrop-blur px-4 py-3">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <v-icon icon="mdi-gamepad-variant" size="20" class="text-cyan-400/70" />
          <span class="text-sm font-medium text-white/70">Stick Input</span>
        </div>

        <!-- Connection status -->
        <div class="flex items-center gap-2">
          <div
            class="h-2.5 w-2.5 rounded-full"
            :class="isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400/50'"
          />
          <span class="text-xs" :class="isConnected ? 'text-emerald-300' : 'text-white/40'">
            {{ isConnected ? 'Verbunden' : 'Nicht verbunden' }}
          </span>
        </div>
      </div>
    </header>

    <!-- Connection screen -->
    <div v-if="!isConnected" class="flex-1 flex items-center justify-center p-6">
      <div class="w-full max-w-sm space-y-6 text-center">
        <div class="h-20 w-20 rounded-full border border-cyan-400/30 bg-cyan-500/10 flex items-center justify-center mx-auto">
          <v-icon icon="mdi-wifi" size="36" class="text-cyan-300" />
        </div>
        <div>
          <h2 class="text-xl font-semibold mb-2">Verbindung herstellen</h2>
          <p class="text-sm text-white/50">
            Gib den 4-stelligen Code ein, der auf dem PFD-Bildschirm angezeigt wird.
          </p>
        </div>
        <div class="space-y-3">
          <v-text-field
            v-model="sessionCodeInput"
            variant="outlined"
            density="compact"
            placeholder="CODE"
            maxlength="4"
            class="session-code-input"
            :error-messages="connectionError"
            hide-details="auto"
            @keydown.enter="connectToSession"
          />
          <v-btn
            color="primary"
            variant="flat"
            size="large"
            block
            class="rounded-xl font-semibold"
            :loading="isConnecting"
            :disabled="sessionCodeInput.length < 4"
            @click="connectToSession"
          >
            Verbinden
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Stick + Throttle controls -->
    <div v-else class="flex-1 flex gap-2 p-3">
      <!-- Throttle (left side, vertical slider) -->
      <div class="w-20 flex flex-col items-center gap-2">
        <span class="text-[10px] uppercase tracking-widest text-white/30">Thrust</span>
        <div
          ref="throttleTrack"
          class="flex-1 w-16 rounded-2xl border border-white/10 bg-[#0b1328]/90 relative overflow-hidden cursor-pointer"
          @pointerdown="onThrottlePointerDown"
          @pointermove="onThrottlePointerMove"
          @pointerup="onThrottlePointerUp"
          @pointercancel="onThrottlePointerUp"
        >
          <!-- Fill -->
          <div
            class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-500/80 to-amber-400/40 transition-[height] duration-75"
            :style="{ height: `${throttle * 100}%` }"
          />
          <!-- Handle -->
          <div
            class="absolute left-1/2 -translate-x-1/2 w-12 h-3 rounded-full bg-white/80 border border-white/30 shadow-lg"
            :style="{ bottom: `calc(${throttle * 100}% - 6px)` }"
          />
          <!-- Label -->
          <div class="absolute bottom-2 left-0 right-0 text-center">
            <span class="text-xs font-mono font-bold text-white/70">{{ Math.round(throttle * 100) }}%</span>
          </div>
        </div>
      </div>

      <!-- Sidestick (center, 2D pad) -->
      <div class="flex-1 flex flex-col items-center gap-2">
        <span class="text-[10px] uppercase tracking-widest text-white/30">Sidestick</span>
        <div
          ref="stickPad"
          class="flex-1 w-full rounded-2xl border border-white/10 bg-[#0b1328]/90 relative overflow-hidden cursor-pointer"
          @pointerdown="onStickPointerDown"
          @pointermove="onStickPointerMove"
          @pointerup="onStickPointerUp"
          @pointercancel="onStickPointerUp"
        >
          <!-- Crosshair -->
          <div class="absolute inset-0 pointer-events-none">
            <div class="absolute left-1/2 top-0 bottom-0 w-px bg-white/5" />
            <div class="absolute top-1/2 left-0 right-0 h-px bg-white/5" />
          </div>

          <!-- Axis labels -->
          <div class="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-white/20">PUSH (Nase runter)</div>
          <div class="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white/20">PULL (Nase hoch)</div>
          <div class="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-white/20 -rotate-90 origin-center">LEFT</div>
          <div class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/20 rotate-90 origin-center">RIGHT</div>

          <!-- Dead zone circle -->
          <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-white/5" />

          <!-- Stick position indicator -->
          <div
            class="absolute w-14 h-14 rounded-full border-2 transition-transform duration-75"
            :class="stickActive ? 'border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/20' : 'border-white/20 bg-white/5'"
            :style="{
              left: `calc(${(stickX + 1) / 2 * 100}% - 28px)`,
              top: `calc(${(stickY + 1) / 2 * 100}% - 28px)`,
            }"
          >
            <div
              class="absolute inset-0 m-auto w-4 h-4 rounded-full"
              :class="stickActive ? 'bg-cyan-400' : 'bg-white/30'"
            />
          </div>
        </div>

        <!-- Current values -->
        <div class="flex gap-4 text-xs font-mono text-white/40">
          <span>Pitch: {{ stickY > 0 ? '+' : '' }}{{ stickY.toFixed(2) }}</span>
          <span>Roll: {{ stickX > 0 ? '+' : '' }}{{ stickX.toFixed(2) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { useFlightLabSync } from '~~/shared/composables/flightlab/useFlightLabSync'

definePageMeta({ layout: false })
useHead({ title: 'FlightLab - Stick Input' })

const sync = useFlightLabSync()

// --- Connection state ---
const sessionCodeInput = ref('')
const isConnecting = ref(false)
const isConnected = ref(false)
const connectionError = ref('')

// --- Stick state ---
const stickX = ref(0)  // -1 (left) to +1 (right) = roll
const stickY = ref(0)  // -1 (forward/push/nose down) to +1 (back/pull/nose up)
const throttle = ref(0) // 0 (idle) to 1 (TOGA)
const stickActive = ref(false)
const throttleActive = ref(false)

// --- Refs ---
const stickPad = ref<HTMLElement | null>(null)
const throttleTrack = ref<HTMLElement | null>(null)

// --- Send interval ---
let sendInterval: ReturnType<typeof setInterval> | null = null

async function connectToSession() {
  if (sessionCodeInput.value.length < 4) return
  isConnecting.value = true
  connectionError.value = ''

  try {
    await sync.joinSession(sessionCodeInput.value, 'participant')
    isConnected.value = true

    // Start sending stick input at 30Hz
    sendInterval = setInterval(() => {
      sync.sendStickInput({
        pitch: stickY.value,
        roll: stickX.value,
        throttle: throttle.value,
      })
    }, 33)
  } catch (e) {
    connectionError.value = 'Verbindung fehlgeschlagen. Code korrekt?'
    console.error('[stick-input] Connection failed:', e)
  } finally {
    isConnecting.value = false
  }
}

// --- Stick touch handling ---
function onStickPointerDown(e: PointerEvent) {
  stickActive.value = true
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  updateStickPosition(e)
}

function onStickPointerMove(e: PointerEvent) {
  if (!stickActive.value) return
  updateStickPosition(e)
}

function onStickPointerUp(_e: PointerEvent) {
  stickActive.value = false
  // Return to center (spring-loaded like real sidestick)
  stickX.value = 0
  stickY.value = 0
}

function updateStickPosition(e: PointerEvent) {
  const pad = stickPad.value
  if (!pad) return
  const rect = pad.getBoundingClientRect()
  // Normalize to -1..+1
  const rawX = ((e.clientX - rect.left) / rect.width) * 2 - 1
  const rawY = ((e.clientY - rect.top) / rect.height) * 2 - 1
  // Clamp
  stickX.value = Math.max(-1, Math.min(1, rawX))
  // Screen Y: top of pad = push forward (nose down), bottom = pull back (nose up)
  // rawY: -1 at top, +1 at bottom → matches: pull back (bottom) = positive pitch
  stickY.value = Math.max(-1, Math.min(1, rawY))
}

// --- Throttle touch handling ---
function onThrottlePointerDown(e: PointerEvent) {
  throttleActive.value = true
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  updateThrottlePosition(e)
}

function onThrottlePointerMove(e: PointerEvent) {
  if (!throttleActive.value) return
  updateThrottlePosition(e)
}

function onThrottlePointerUp(_e: PointerEvent) {
  throttleActive.value = false
  // Throttle stays where you leave it (not spring-loaded)
}

function updateThrottlePosition(e: PointerEvent) {
  const track = throttleTrack.value
  if (!track) return
  const rect = track.getBoundingClientRect()
  // Bottom = 0, top = 1
  const rawThrottle = 1 - (e.clientY - rect.top) / rect.height
  throttle.value = Math.max(0, Math.min(1, rawThrottle))
}

// --- Cleanup ---
onBeforeUnmount(() => {
  if (sendInterval) {
    clearInterval(sendInterval)
    sendInterval = null
  }
  sync.disconnect()
})
</script>

<style scoped>
.session-code-input :deep(input) {
  text-align: center;
  font-family: monospace;
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}
</style>
