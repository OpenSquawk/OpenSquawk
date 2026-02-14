<template>
  <div class="ptt-wrapper">
    <button
      class="ptt-btn"
      :class="{
        'ptt-btn--recording': isRecording,
        'ptt-btn--loading': loading,
        'ptt-btn--disabled': disabled,
      }"
      :disabled="disabled || loading"
      @mousedown.prevent="startRecording"
      @mouseup.prevent="stopRecording"
      @mouseleave="stopRecording"
      @touchstart.prevent="startRecording"
      @touchend.prevent="stopRecording"
      @touchcancel="stopRecording"
    >
      <!-- Pulsing ring (recording state) -->
      <span v-if="isRecording" class="ptt-pulse-ring" />

      <!-- Spinning ring (loading state) -->
      <span v-if="loading" class="ptt-spinner-ring" />

      <!-- Default cyan ring -->
      <span v-if="!isRecording && !loading" class="ptt-idle-ring" />

      <v-icon
        :icon="isRecording ? 'mdi-microphone' : 'mdi-microphone-outline'"
        :size="28"
        :color="isRecording ? '#ef4444' : 'white'"
      />
    </button>

    <div class="ptt-label">
      <span v-if="permissionDenied" class="ptt-status ptt-status--error">
        Microphone access denied
      </span>
      <span v-else-if="isRecording" class="ptt-status ptt-status--recording">
        Transmitting...
      </span>
      <span v-else-if="loading" class="ptt-status ptt-status--loading">
        Processing...
      </span>
      <span v-else class="ptt-status ptt-status--idle">
        Hold to transmit
      </span>
      <span class="ptt-freq">{{ unit }} &middot; {{ frequency }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  frequency: string;
  unit: string;
  disabled?: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'recording-complete', payload: { audio: string; format: string }): void;
}>();

const isRecording = ref(false);
const permissionDenied = ref(false);

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let stream: MediaStream | null = null;

function getPreferredMimeType(): string {
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    return 'audio/webm;codecs=opus';
  }
  if (MediaRecorder.isTypeSupported('audio/webm')) {
    return 'audio/webm';
  }
  return '';
}

async function startRecording() {
  if (props.disabled || props.loading || isRecording.value) return;

  permissionDenied.value = false;

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    permissionDenied.value = true;
    return;
  }

  audioChunks = [];
  const mimeType = getPreferredMimeType();
  const options: MediaRecorderOptions = mimeType ? { mimeType } : {};

  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(audioChunks, {
      type: mediaRecorder?.mimeType || 'audio/webm',
    });
    blobToBase64(blob).then((base64) => {
      emit('recording-complete', {
        audio: base64,
        format: mediaRecorder?.mimeType || 'audio/webm',
      });
    });
    cleanupStream();
  };

  mediaRecorder.start();
  isRecording.value = true;
}

function stopRecording() {
  if (!isRecording.value || !mediaRecorder) return;

  isRecording.value = false;

  if (mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  } else {
    cleanupStream();
  }
}

function cleanupStream() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  mediaRecorder = null;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the data URL prefix to return raw base64
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
</script>

<style scoped>
.ptt-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

/* ── Button ── */
.ptt-btn {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--text) 8%, transparent),
    color-mix(in srgb, var(--text) 4%, transparent)
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 6px 18px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(var(--glass-blur, 18px)) saturate(var(--glass-sat, 140%));
  -webkit-backdrop-filter: blur(var(--glass-blur, 18px)) saturate(var(--glass-sat, 140%));
  transition: transform 0.12s ease, box-shadow 0.15s ease, background 0.2s ease;
  outline: none;
  touch-action: none;
}

@media (min-width: 768px) {
  .ptt-btn {
    width: 100px;
    height: 100px;
  }
}

.ptt-btn:active:not(.ptt-btn--disabled) {
  transform: scale(0.95);
}

.ptt-btn--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Idle ring ── */
.ptt-idle-ring {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--accent) 50%, transparent);
  pointer-events: none;
}

/* ── Recording pulse ring ── */
.ptt-pulse-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 3px solid #ef4444;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.4), inset 0 0 12px rgba(239, 68, 68, 0.15);
  animation: ptt-pulse 1s ease-in-out infinite;
  pointer-events: none;
}

@keyframes ptt-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.7;
  }
}

.ptt-btn--recording {
  background: linear-gradient(
    180deg,
    rgba(239, 68, 68, 0.2),
    rgba(239, 68, 68, 0.1)
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 0 28px rgba(239, 68, 68, 0.35);
}

/* ── Loading spinner ring ── */
.ptt-spinner-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--accent) 20%, transparent);
  border-top-color: var(--accent);
  animation: ptt-spin 0.8s linear infinite;
  pointer-events: none;
}

@keyframes ptt-spin {
  to {
    transform: rotate(360deg);
  }
}

.ptt-btn--loading {
  cursor: wait;
}

/* ── Labels ── */
.ptt-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.ptt-status {
  font-size: 0.8rem;
  letter-spacing: 0.02em;
}

.ptt-status--idle {
  color: var(--t3);
}

.ptt-status--recording {
  color: #ef4444;
  animation: ptt-status-blink 1s ease-in-out infinite;
}

@keyframes ptt-status-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.ptt-status--loading {
  color: var(--t3);
}

.ptt-status--error {
  color: #ef4444;
  font-size: 0.75rem;
}

.ptt-freq {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 0.04em;
}
</style>
