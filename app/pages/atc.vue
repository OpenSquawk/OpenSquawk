<template>
  <v-container class="py-8" max-width="800">
    <h1 class="text-h5 mb-4">ATC Demo (ohne PTT)</h1>

    <v-card class="pa-4">
      <div class="mb-4">
        <div class="mb-2">
          <strong>Verständigungslevel:</strong>
          <span class="ml-1">Stufe {{ radioLevel }}</span>
        </div>
        <v-slider
            v-model="radioLevel"
            :min="1"
            :max="5"
            :step="1"
            show-ticks
            tick-size="3"
            thumb-label
            class="mt-2"
        />
        <div class="text-caption mt-1">
          1 = sehr schlecht (Rauschen/Dropouts) · 4 = gut (Default) · 5 = klar
        </div>
      </div>

      <v-btn :loading="loading" color="primary" @click="generate">
        ATC erzeugen & abspielen (Radio, Stufe {{ radioLevel }})
      </v-btn>

      <div class="mt-4 text-body-2">
        <div><strong>Status:</strong> {{ status }}</div>
        <div v-if="returnedLevel" class="mt-1 text-caption">
          Server-Level bestätigt: {{ returnedLevel }}
        </div>
        <div v-if="atcText" class="mt-2">
          <strong>ATC Text:</strong> {{ atcText }}
        </div>
      </div>

      <div v-if="audioClean || audioRadio" class="mt-4">
        <div v-if="audioClean" class="mb-3">
          <div class="mb-1">Clean (TTS):</div>
          <audio ref="cleanRef" :src="audioClean" controls></audio>
          <v-btn class="ml-2" size="small" @click="play('clean')">Play Clean</v-btn>
        </div>
        <div v-if="audioRadio">
          <div class="mb-1">Radio (Funk-Effekt):</div>
          <audio ref="radioRef" :src="audioRadio" controls></audio>
          <v-btn class="ml-2" size="small" @click="play('radio')">Play Radio</v-btn>
        </div>
      </div>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';

const loading = ref(false);
const status = ref('Bereit');
const atcText = ref('');
const audioClean = ref<string | null>(null);
const audioRadio = ref<string | null>(null);
const cleanRef = ref<HTMLAudioElement | null>(null);
const radioRef = ref<HTMLAudioElement | null>(null);

// Neues State: Verständigungslevel (Default 4)
const radioLevel = ref(4);
const returnedLevel = ref<number | null>(null);

function b64ToUrl(b64: string, mime = 'audio/wav'): string {
  const u8 = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([u8], { type: mime }));
}

async function generate() {
  loading.value = true;
  status.value = 'Erzeuge…';
  atcText.value = '';
  audioClean.value = null;
  audioRadio.value = null;
  returnedLevel.value = null;

  // Übergabe als Query (?level=1..5). GET reicht (Handler akzeptiert i.d.R. GET/POST).
  const res = await fetch(`/api/atc/generate?level=${radioLevel.value}`, { method: 'POST' });
  if (!res.ok) { status.value = `Fehler: ${res.status}`; loading.value = false; return; }
  const data = await res.json();

  atcText.value = data.atcText || '';
  returnedLevel.value = Number(data.level) || null;

  if (data.audio?.clean?.base64) {
    audioClean.value = b64ToUrl(data.audio.clean.base64, data.audio.clean.mime || 'audio/wav');
  }
  if (data.audio?.radio?.base64) {
    audioRadio.value = b64ToUrl(data.audio.radio.base64, data.audio.radio.mime || 'audio/wav');
  }

  await nextTick();
  try { radioRef.value?.play(); } catch {}
  status.value = 'OK';
  loading.value = false;
}

function play(which: 'clean' | 'radio') {
  if (which === 'clean') cleanRef.value?.play();
  else radioRef.value?.play();
}
</script>
