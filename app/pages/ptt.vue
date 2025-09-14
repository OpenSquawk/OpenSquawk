<template>
  <v-container class="py-8" max-width="800">
    <h1 class="text-h5 mb-4">ATC Push-to-Talk</h1>

    <v-card class="pa-4 mb-4">
      <v-btn
          :color="recording ? 'red' : 'primary'"
          @mousedown="startRec" @mouseup="stopRec"
          @touchstart.prevent="startRec" @touchend.prevent="stopRec"
      >
        {{ recording ? 'Recording…' : 'Push-to-Talk' }}
      </v-btn>

      <div class="mt-4">
        <div><strong>Status:</strong> {{ status }}</div>
        <div v-if="pilotText"><strong>Pilot:</strong> {{ pilotText }}</div>
        <div v-if="replyText"><strong>ATC:</strong> {{ replyText }}</div>
      </div>

      <audio v-if="audioUrl" class="mt-3" :src="audioUrl" controls></audio>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const recording = ref(false);
const status = ref('Bereit');
let mediaRecorder: MediaRecorder | null = null;
let chunks: BlobPart[] = [];
const lastBlob = ref<Blob | null>(null);
const pilotText = ref('');
const replyText = ref('');
const audioUrl = ref<string | null>(null);

function pickMime(): string {
  const c = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',            // iOS Safari fallback
    'audio/ogg;codecs=opus'
  ];
  for (const m of c) if (MediaRecorder.isTypeSupported(m)) return m;
  return 'audio/webm';
}

async function initMedia() {
  if (mediaRecorder) return;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = pickMime();
  mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
  mediaRecorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: mediaRecorder?.mimeType || 'audio/webm' });
    chunks = [];
    lastBlob.value = blob;
    status.value = `Aufnahme fertig (${Math.round(blob.size/1024)} KB)`;
    // direkt senden (ohne Text-Button)
    void sendTTS();
  };
}

async function startRec() {
  await initMedia();
  if (!mediaRecorder) return;
  pilotText.value = '';
  replyText.value = '';
  audioUrl.value = null;
  recording.value = true;
  status.value = 'Aufnahme…';
  chunks = [];
  mediaRecorder.start(10);
}

function stopRec() {
  if (!mediaRecorder || !recording.value) return;
  recording.value = false;
  status.value = 'Verarbeite…';
  mediaRecorder.stop();
}

function extFromType(t: string): string {
  if (t.includes('mp4')) return 'mp4';
  if (t.includes('ogg')) return 'ogg';
  if (t.includes('webm')) return 'webm';
  if (t.includes('wav')) return 'wav';
  return 'webm';
}

async function sendTTS() {
  if (!lastBlob.value) return;
  status.value = 'Sende… (TTS)';
  const ext = extFromType(lastBlob.value.type || '');
  const fd = new FormData();
  fd.append('file', lastBlob.value, `ptt.${ext}`);

  const res = await fetch('/api/ptt/reply', { method: 'POST', body: fd });
  if (!res.ok) {
    status.value = `Fehler: ${res.status}`;
    return;
  }
  const data = await res.json();
  pilotText.value = data.pilotText || '';
  replyText.value = data.replyText || '';

  if (data.audio?.base64) {
    const buf = Uint8Array.from(atob(data.audio.base64), c => c.charCodeAt(0));
    const blob = new Blob([buf], { type: data.audio.mime || 'audio/wav' });
    audioUrl.value = URL.createObjectURL(blob);
  } else {
    audioUrl.value = null;
  }
  status.value = 'OK';
}
</script>
