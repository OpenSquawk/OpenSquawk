<template>
  <v-container class="py-8" max-width="900">
    <v-row class="mb-4" align="center" justify="space-between">
      <h1 class="text-h5">ATC Generator</h1>
      <v-btn variant="outlined" prepend-icon="mdi-broom" @click="resetForm">Zurücksetzen</v-btn>
    </v-row>

    <v-card class="pa-4 mb-6">
      <v-row dense>
        <v-col cols="12">
          <v-textarea
              v-model="form.text"
              label="ATC-Text (z. B. „D-ABCD ready for taxi…“)"
              rows="4"
              auto-grow
              :counter="500"
              required
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-slider
              v-model="form.level"
              :min="1" :max="5" :step="1"
              label="Radio-Level (1–5)"
              show-ticks tick-size="3" thumb-label
          />
          <div class="text-caption mt-1">
            1 = stark verrauscht · 4 = gut (Default) · 5 = klar
          </div>
        </v-col>

        <v-col cols="12" md="3">
          <v-select
              v-model="form.voice"
              :items="voices"
              label="Stimme"
              item-title="label" item-value="value"
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-text-field v-model="form.tag" label="Tag (optional)" />
        </v-col>

        <v-col cols="12" class="d-flex gap-3">
          <v-btn color="primary" :loading="loading" @click="generate">
            <v-icon start>mdi-play</v-icon> Erzeugen & Abspielen
          </v-btn>
          <v-btn variant="tonal" :disabled="!audioUrl" @click="download">
            <v-icon start>mdi-download</v-icon> OGG herunterladen
          </v-btn>
          <v-btn variant="text" :disabled="!result" @click="copyMeta">
            <v-icon start>mdi-content-copy</v-icon> Meta kopieren
          </v-btn>
          <v-spacer/>
          <v-switch v-model="autoPlay" inset label="Auto-Play" hide-details/>
          <v-switch v-model="persistHistory" inset label="History speichern" hide-details/>
        </v-col>
      </v-row>
    </v-card>

    <v-card class="pa-4 mb-6" v-if="result">
      <v-row>
        <v-col cols="12" md="6">
          <audio ref="player" :src="audioUrl || undefined" controls style="width:100%"></audio>
          <div class="text-caption mt-2">MIME: audio/ogg; codecs=opus · 16 kHz mono</div>
        </v-col>
        <v-col cols="12" md="6">
          <v-list density="compact">
            <v-list-item title="ID" :subtitle="result.id"/>
            <v-list-item title="Erstellt" :subtitle="new Date(result.createdAt || Date.now()).toLocaleString()"/>
            <v-list-item title="Level" :subtitle="String(result.level)"/>
            <v-list-item title="Voice" :subtitle="result.voice"/>
            <v-list-item title="Eingabe" :subtitle="result.text"/>
            <v-list-item title="Normalisiert" :subtitle="result.normalized"/>
            <v-list-item v-if="result.tag" title="Tag" :subtitle="result.tag"/>
          </v-list>
        </v-col>
      </v-row>
    </v-card>

    <v-expand-transition>
      <v-card v-if="history.length" class="pa-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <h2 class="text-subtitle-1">History</h2>
          <v-btn size="small" variant="text" @click="clearHistory"><v-icon>mdi-delete</v-icon> leeren</v-btn>
        </div>
        <v-table density="compact">
          <thead>
          <tr>
            <th>Datum</th><th>Level</th><th>Voice</th><th>Text</th><th>Play</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="h in history" :key="h.id">
            <td>{{ new Date(h.createdAt).toLocaleString() }}</td>
            <td>{{ h.level }}</td>
            <td>{{ h.voice }}</td>
            <td class="truncate">{{ h.text }}</td>
            <td>
              <v-btn size="small" @click="playFromHistory(h)"><v-icon>mdi-play</v-icon></v-btn>
            </td>
          </tr>
          </tbody>
        </v-table>
      </v-card>
    </v-expand-transition>

    <v-snackbar v-model="snack.show" :timeout="3000" color="error">{{ snack.msg }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

type Json = any

const form = ref({ text: '', level: 4, voice: 'alloy', tag: '' })
const loading = ref(false)
const result = ref<Json | null>(null)
const rawJson = ref<Json | null>(null)
const audioUrl = ref<string | null>(null)
const player = ref<HTMLAudioElement | null>(null)
const autoPlay = ref(true)
const persistHistory = ref(true)
const snack = ref({ show: false, msg: '' })
const debugMsg = ref<string>('')

function err(msg: string) { snack.value = { show: true, msg }; debugMsg.value = msg }
const nextTick = (fn: () => void) => Promise.resolve().then(fn)

// --- Robust: erste Base64 + zugehöriges MIME irgendwo im Objekt finden ---
function findFirstAudio(o: Json): { base64: string; mime: string } | null {
  let found: { base64: string; mime?: string } | null = null
  function walk(x: Json, path: string[] = []) {
    if (!x || found) return
    if (typeof x === 'object') {
      // Kandidat: {base64, mime}
      if (typeof x.base64 === 'string') {
        found = { base64: x.base64, mime: typeof x.mime === 'string' ? x.mime : undefined }
      }
      // tiefer gehen
      for (const k of Object.keys(x)) walk(x[k], path.concat(k))
    }
  }
  walk(o)
  if (!found) return null
  const mime = found.mime || guessMimeFromObject(o) || 'audio/ogg'
  return { base64: found.base64, mime }
}

function guessMimeFromObject(o: Json): string | null {
  // Häufige Felder prüfen
  if (o?.audio?.radio?.mime) return o.audio.radio.mime
  if (o?.audio?.mime) return o.audio.mime
  if (o?.audio?.clean?.mime) return o.audio.clean.mime
  return null
}

// --- Base64 normalisieren ---
function normalizeBase64(b64: string) {
  if (!b64) throw new Error('leer')
  // dataURL → payload
  const i = b64.indexOf(',')
  if (i !== -1 && b64.slice(0, 40).includes('base64')) b64 = b64.slice(i + 1)
  b64 = b64.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
  const mod = b64.length % 4
  if (mod === 2) b64 += '=='
  else if (mod === 3) b64 += '='
  else if (mod === 1) throw new Error('Base64-Länge ungültig')
  return b64
}

function base64ToBlobUrl(b64: string, mime = 'application/octet-stream') {
  const clean = normalizeBase64(b64)
  const bin = atob(clean)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const blob = new Blob([bytes], { type: mime })
  return URL.createObjectURL(blob)
}

async function generate() {
  const text = form.value.text.trim()
  if (!text) return err('Text fehlt.')

  loading.value = true
  debugMsg.value = ''
  try {
    const res = await $fetch<Json>('/api/atc/generate', {
      method: 'POST',
      body: { text, level: form.value.level, voice: form.value.voice, tag: form.value.tag || undefined }
    })
    rawJson.value = res
    console.log('ATC response:', res)

    // kompatible Anzeigenamen
    const displayText = res.text ?? res.atcText ?? text
    result.value = { ...res, text: displayText, createdAt: res.createdAt ?? new Date().toISOString() }

    // Audio extrahieren (egal wo)
    const audio = findFirstAudio(res)
    if (!audio) {
      err('Kein Audio in Response gefunden.')
      console.warn('Response ohne erkennbares Audio:', res)
      audioUrl.value = null
      return
    }

    // Blob-URL bauen
    if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = base64ToBlobUrl(audio.base64, audio.mime)

    if (autoPlay.value) nextTick(() => player.value?.play().catch(() => {}))
    if (persistHistory.value) pushHistory(result.value)
    debugMsg.value = `Audio OK · mime=${audio.mime} · base64Len=${audio.base64.length}`
  } catch (e: any) {
    console.error(e)
    err(e?.data?.message || e?.message || 'Fehler beim Generieren')
  } finally {
    loading.value = false
  }
}

function download() {
  if (!audioUrl.value || !result.value) return
  const mime =
      result.value?.audio?.radio?.mime ||
      result.value?.audio?.mime ||
      result.value?.audio?.clean?.mime ||
      'audio/ogg'
  const ext = mime.includes('ogg') ? 'ogg' : mime.includes('wav') ? 'wav' : 'bin'
  const a = document.createElement('a')
  a.href = audioUrl.value
  a.download = `${result.value?.id || 'atc'}.${ext}`
  a.click()
}

async function copyMeta() {
  if (!result.value) return
  const meta = {
    id: result.value.id ?? null,
    createdAt: result.value.createdAt,
    level: result.value.level,
    voice: result.value.voice,
    text: result.value.text ?? '',
    normalized: result.value.normalized ?? null,
    stored: result.value.stored ?? null
  }
  await navigator.clipboard.writeText(JSON.stringify(meta, null, 2))
}

const history = ref<Json[]>([])
function pushHistory(e: Json) {
  const list = [e, ...history.value].slice(0, 50)
  history.value = list
  localStorage.setItem('atc-history', JSON.stringify(list))
}
function loadHistory() {
  const raw = localStorage.getItem('atc-history')
  if (raw) { try { history.value = JSON.parse(raw) } catch {} }
}
function clearHistory() { history.value = []; localStorage.removeItem('atc-history') }
function playFromHistory(h: Json) {
  try {
    const audio = findFirstAudio(h)
    if (!audio) return err('History-Eintrag ohne Audio.')
    if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = base64ToBlobUrl(audio.base64, audio.mime)
    result.value = h
    nextTick(() => player.value?.play().catch(() => {}))
  } catch (e: any) { err(e.message) }
}

onMounted(loadHistory)
</script>


<style scoped>
.truncate {
  max-width: 420px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
