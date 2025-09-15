<template>
  <v-container class="pm-container py-4" fluid>
    <!-- TOP BAR -->
    <header class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-3">
        <v-icon size="22">mdi-airplane-takeoff</v-icon>
        <div class="text-subtitle-1 font-semibold">PilotMonitoring</div>
      </div>
      <div class="flex items-center gap-2">
        <v-chip v-if="session.callsign" size="small" class="text-no-wrap">{{ session.callsign }}</v-chip>
        <v-chip size="small" variant="tonal">{{ phase }}</v-chip>
      </div>
    </header>

    <!-- STEP 1: LOGIN / FLIGHTPLAN PICK -->
    <v-card v-if="step==='auth'" class="p-4">
      <div class="mb-2 font-medium">VATSIM ID</div>
      <v-text-field
          v-model="form.cid"
          variant="outlined"
          density="comfortable"
          type="tel"
          placeholder="z. B. 1234567"
          append-inner-icon="mdi-account-search"
          @click:append-inner="loadFlightplans"
          @keyup.enter="loadFlightplans"
      />
      <div class="text-caption mb-2">
        Holt die letzten Flightplans (max. 50) direkt von VATSIM (v2 Core API).
      </div>
      <v-btn :loading="loading.flightplans" color="primary" class="w-full" @click="loadFlightplans">
        Flightplans laden
      </v-btn>
    </v-card>

    <v-card v-else-if="step==='pick'" class="p-0 overflow-hidden">
      <div class="p-4 pb-2 flex items-center justify-between">
        <div class="font-medium">Flightplan wählen</div>
        <v-btn variant="text" icon="mdi-refresh" @click="loadFlightplans" />
      </div>
      <v-divider />
      <div class="max-h-[50vh] overflow-auto">
        <v-list lines="two" density="comfortable">
          <v-list-item
              v-for="fp in flightplans"
              :key="fp.id"
              @click="selectFlight(fp)"
              :title="`${fp.callsign} · ${fp.dep} → ${fp.arr}${fp.alt?` (ALT ${fp.alt})`:''}`"
              :subtitle="formatRoute(fp.route)"
          >
            <template #prepend>
              <v-avatar size="28" class="bg-surface-variant">
                <span class="text-caption">{{ (fp.flight_type||'').toUpperCase() }}</span>
              </v-avatar>
            </template>
            <template #append>
              <div class="text-right text-caption">
                <div>FL {{ fp.altitude }}</div>
                <div class="opacity-70">{{ formatIso(fp.filed) }}</div>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </div>
      <v-divider />
      <div class="p-3">
        <v-btn variant="tonal" class="w-full" @click="step='auth'">Andere ID</v-btn>
      </div>
    </v-card>

    <!-- STEP 2: MAIN -->
    <v-card v-else class="p-0">
      <!-- Flight Info -->
      <p>
        {{ session.dep }} → {{ session.arr }} · ALT {{ session.alt || 'n/a' }}<br />
      </p>
      <!-- Info row -->
      <div class="px-4 pt-3 pb-2 grid grid-cols-2 gap-2 items-center">
        <v-select
            v-model="phase"
            :items="phases"
            label="Phase"
            density="compact"
            hide-details
            variant="outlined"
        />
        <v-switch v-model="settings.taxiRandom" :label="`Taxi Randomness ${settings.taxiRandom?'ON':'OFF'}`" hide-details />
        <v-switch v-model="settings.simulate" :label="`Simulationsmodus ${settings.simulate?'ON':'OFF'}`" hide-details />
        <v-btn size="small" prepend-icon="mdi-weather-windy" @click="loadMetar">METAR laden</v-btn>
      </div>

      <!-- Frequencies -->
      <v-divider />
      <div class="px-4 py-3 grid grid-cols-3 gap-3 items-end">
        <div>
          <div class="text-caption mb-1">Active</div>
          <v-text-field
              v-model="radios.active"
              variant="outlined" density="comfortable" hide-details
              placeholder="118.525"
              @change="onFreqChange('active')"
          />
        </div>
        <div>
          <div class="text-caption mb-1">Standby</div>
          <v-text-field
              v-model="radios.standby"
              variant="outlined" density="comfortable" hide-details
              placeholder="121.900"
              @change="onFreqChange('standby')"
          />
        </div>
        <div class="flex gap-2">
          <v-btn class="flex-1" variant="tonal" prepend-icon="mdi-swap-horizontal" @click="swapFreq">Swap</v-btn>
          <v-btn class="flex-1" variant="tonal" prepend-icon="mdi-access-point" @click="suggestFreq">VATSIM</v-btn>
        </div>
      </div>

      <!-- Radio Check -->
      <v-divider />
      <div class="px-4 py-3">
        <div class="flex items-center justify-between mb-2">
          <div class="font-medium">Radio Check</div>
          <v-chip v-if="radioCheck.status" size="small" :color="radioCheck.status==='ok'?'green':'orange'">
            {{ radioCheck.status==='ok'?'Good':'Pending' }}
          </v-chip>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <v-text-field v-model="radioCheck.unit" label="Station (z. B. EDDF TWR)" density="compact" hide-details />
          <v-text-field v-model="session.callsign" label="Callsign" density="compact" hide-details />
          <v-btn color="primary" @click="runRadioCheck" :loading="loading.radio">Durchführen</v-btn>
        </div>
        <div v-if="radioCheck.lastReply" class="text-caption mt-2 opacity-80">
          Reply: {{ radioCheck.lastReply }}
        </div>
      </div>

      <!-- PTT AREA -->
      <v-divider />
      <div class="px-4 py-3">
        <div class="grid grid-cols-2 gap-3">
          <!-- INTERCOM -->
          <div
              class="ptt h-[34vh] rounded-2xl flex flex-col items-center justify-center bg-surface-variant"
              :class="{ active: ptt.holding==='ic' }"
              @pointerdown.prevent="startPTT('ic')"
              @pointerup.prevent="stopPTT('ic')"
              @pointercancel.prevent="cancelPTT"
              @touchstart.prevent
              @touchend.prevent
          >
            <v-icon size="36">mdi-account-voice</v-icon>
            <div class="mt-2 font-medium">INTERCOM</div>
            <div class="text-caption opacity-70">Gedrückt halten</div>
          </div>

          <!-- ATC -->
          <div
              class="ptt h-[34vh] rounded-2xl flex flex-col items-center justify-center bg-primary text-white"
              :class="{ active: ptt.holding==='atc' }"
              @pointerdown.prevent="startPTT('atc')"
              @pointerup.prevent="stopPTT('atc')"
              @pointercancel.prevent="cancelPTT"
              @touchstart.prevent
              @touchend.prevent
          >
            <v-icon size="36">mdi-radio-handheld</v-icon>
            <div class="mt-2 font-medium">ATC</div>
            <div class="text-caption opacity-90">Gedrückt halten</div>
          </div>
        </div>

        <!-- Recorder status -->
        <div class="mt-3 text-caption opacity-75">
          Mic: {{ audio.perm }} · {{ recStatus }}
        </div>
      </div>

      <!-- CHECKLISTS (Intercom vorlesen lassen) -->
      <v-divider />
      <div class="px-4 py-3">
        <div class="flex items-center justify-between mb-2">
          <div class="font-medium">A320 Checklisten</div>
          <v-select
              v-model="check.current"
              :items="Object.keys(check.lists)"
              density="compact"
              hide-details
              style="max-width: 220px"
          />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <v-btn variant="tonal" prepend-icon="mdi-play" @click="speakChecklist(false)">Vorlesen</v-btn>
          <v-btn variant="tonal" prepend-icon="mdi-account-voice" @click="speakChecklist(true)">Call-and-Response</v-btn>
        </div>
      </div>
    </v-card>

    <!-- PERMISSIONS DIALOG -->
    <v-dialog v-model="ui.askMic" persistent>
      <v-card class="p-4">
        <div class="text-subtitle-1 mb-2">Mikrofon-Berechtigung</div>
        <div class="text-body-2 mb-4">Bitte Zugriff erlauben für PTT & Radio-Check.</div>
        <v-btn color="primary" @click="initMic">Jetzt erlauben</v-btn>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
// Nuxt 4 + Vuetify + Pinia (assumed installed)
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { defineStore, storeToRefs } from 'pinia'

// ---------- Types (aus VATSIM Docs) ----------
/** VATSIM v2: /v2/members/:cid/flightplans – Schema siehe vatsim.dev */
type V2FlightPlan = {
  id: number
  connection_id: number
  vatsim_id: string
  flight_type: string
  callsign: string
  aircraft: string
  cruisespeed: string
  dep: string
  arr: string
  alt?: string
  altitude: string
  rmks?: string
  route?: string
  deptime?: string
  hrsenroute: number
  minenroute: number
  hrsfuel: number
  minsfuel: number
  filed: string // ISO
  assignedsquawk?: string
  modifiedbycid?: string
  modifiedbycallsign?: string
}

// V3 Data feed excerpts
type V3Controller = { callsign:string; frequency:string; }
type V3Feed = { controllers: V3Controller[]; atis: any[]; }

// ---------- Pinia Session Store (leichtgewichtig in dieser Datei) ----------
const usePMStore = defineStore('pm', () => {
  const callsign = ref('')
  const dep = ref('')       // ICAO
  const arr = ref('')
  const alt = ref('')
  const route = ref('')
  const runway = ref('')
  const cid = ref('')

  return { callsign, dep, arr, alt, route, runway, cid }
})
const pm = usePMStore()
const session = storeToRefs(pm)

// ---------- Local State ----------
const step = ref<'auth'|'pick'|'main'>('auth')
const loading = reactive({ flightplans:false, radio:false })
const form = reactive({ cid: '1857215' })
const flightplans = ref<V2FlightPlan[]>([])
const radios = reactive({ active: '121.900', standby: '118.525' })
const phases = ['Preflight','Start','Pushback','Taxi','Lineup','Takeoff','Departure','Enroute','Descent','Approach','Landing','After Landing','Shutdown']
const phase = ref<'Preflight'|string>('Preflight')
const settings = reactive({ taxiRandom: false, simulate: true })
const radioCheck = reactive({ unit: 'EDDF TWR', status: '', lastReply: '' })
const ui = reactive({ askMic: false })
const audio = reactive({ perm: 'n/a' as 'n/a'|'granted'|'denied'|'prompt', stream: null as MediaStream | null, recorder: null as MediaRecorder | null, chunks: [] as BlobPart[] })
const ptt = reactive({ holding: '' as ''|'ic'|'atc', startedAt: 0 })
const recStatus = computed(() => ptt.holding ? 'Aufnahme läuft…' : (audio.recorder ? 'Bereit' : 'Inaktiv'))

// ---------- On Mount ----------
onMounted(async () => {
  // iOS: permissions
  await checkMicPerm()
  // if launched from deep link with cid
  const maybeCid = new URLSearchParams(location.search).get('cid')
  if (maybeCid) { form.cid = maybeCid }
})

// ---------- Permissions ----------
async function checkMicPerm() {
  try {
    // @ts-ignore iOS supports permissions for microphone
    const status = await navigator.permissions?.query?.({ name: 'microphone' as any })
    audio.perm = (status?.state as any) || 'prompt'
  } catch {
    audio.perm = 'prompt'
  }
  if (audio.perm !== 'granted') ui.askMic = true
}
async function initMic() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
    audio.stream = stream
    audio.perm = 'granted'
    ui.askMic = false
  } catch (e) {
    audio.perm = 'denied'
  }
}

// ---------- VATSIM: Flightplans laden ----------
async function loadFlightplans() {
  if (!form.cid) return
  loading.flightplans = true
  try {
    const res = await $fetch<V2FlightPlan[]>(`/api/vatsim/flightplans?cid=${encodeURIComponent(form.cid)}`)
    flightplans.value = (res || []).sort((a,b) => new Date(b.filed).getTime() - new Date(a.filed).getTime())
    step.value = 'pick'
  } finally {
    loading.flightplans = false
  }
}

// ---------- Auswahl ----------
async function selectFlight(fp: V2FlightPlan) {
  pm.cid = fp.vatsim_id
  pm.callsign = fp.callsign
  pm.dep = fp.dep
  pm.arr = fp.arr
  pm.alt = fp.alt || ''
  pm.route = fp.route || ''
  phase.value = 'Start'
  await nextTick()
  step.value = 'main'
  // erste Frequenz (Tower oder Delivery) vorschlagen
  suggestFreq()
  // optional: METAR anfragen
  loadMetar()
}

// ---------- METAR ----------
async function loadMetar() {
  if (!session.dep.value && !session.arr.value) return
  // Einfache Text-METARs (pro Station getrennt)
  const ids = [session.dep.value, session.arr.value, session.alt.value].filter(Boolean).join(',')
  if (!ids) return
  const text = await $fetch<string>(`/api/vatsim/metar?id=${ids}`, { responseType: 'text' })
  console.log('METAR', text)
}

// ---------- V3 Feed nutzen um passende Frequenzen vorzuschlagen ----------
async function suggestFreq() {
  try {
    const feed = await $fetch<V3Feed>('/api/vatsim/feed')
    // simple Heuristik: Tower/Ground bei DEP suchen
    const dep = session.dep.value
    const tower = feed.controllers.find(c => c.callsign?.startsWith(dep+'_TWR'))
    const gnd   = feed.controllers.find(c => c.callsign?.startsWith(dep+'_GND'))
    const cand = tower?.frequency || gnd?.frequency
    if (cand) radios.standby = normalizeFreq(cand)
  } catch (e) {
    // ignore
  }
}

// ---------- Frequenz Utils ----------
function normalizeFreq(f: string) {
  // Eingaben wie "121.9" → "121.900"
  if (!f) return f
  const s = f.trim()
  return s.includes('.') ? (s.split('.')[0] + '.' + (s.split('.')[1] + '000').slice(0,3)) : s
}
function swapFreq() {
  const t = radios.active
  radios.active = radios.standby
  radios.standby = t
  // Handoff-Trigger
  onHandoffAfterFreqSwitch()
}
function onFreqChange(which: 'active'|'standby') {
  radios[which] = normalizeFreq(radios[which])
}


// ---------- Radio Check ----------
async function runRadioCheck() {
  loading.radio = true
  try {
    // Phrase generieren (Pilot → ATC)
    const phrase = `${radioCheck.unit}, ${session.callsign.value}, radio check on ${radios.active}.`
    await ttsATC(phrase) // Station ansprechen
    // simulierte Antwort (oder vom LLM/Backend holen)
    const reply = `${session.callsign.value}, ${radioCheck.unit}, read you five.`
    radioCheck.lastReply = reply
    await ttsATC(reply)
    radioCheck.status = 'ok'
  } finally {
    loading.radio = false
  }
}

// ---------- PTT ----------
function startPTT(kind: 'ic'|'atc') {
  if (!audio.stream) return
  ptt.holding = kind
  ptt.startedAt = Date.now()
  audio.chunks = []
  try {
    const mime = pickBestMime()
    const rec = new MediaRecorder(audio.stream!, { mimeType: mime })
    audio.recorder = rec
    rec.ondataavailable = (ev) => { if (ev.data?.size) audio.chunks.push(ev.data) }
    rec.onstop = async () => {
      const blob = new Blob(audio.chunks, { type: rec.mimeType })
      if (kind === 'atc') await submitATC(blob)
      else await submitIntercom(blob)
    }
    rec.start()
  } catch (e) {
    console.warn('Recorder failed', e)
  }
}
function stopPTT(_kind: 'ic'|'atc') {
  if (audio.recorder && audio.recorder.state !== 'inactive') audio.recorder.stop()
  ptt.holding = ''
}
function cancelPTT() {
  if (audio.recorder && audio.recorder.state !== 'inactive') audio.recorder.stop()
  ptt.holding = ''
}
function pickBestMime() {
  const cand = [
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/webm'
  ]
  for (const c of cand) if ((window as any).MediaRecorder?.isTypeSupported?.(c)) return c
  return ''
}

// ---------- Backend Hooks (Whisper/LLM/TTS) ----------
async function submitATC(blob: Blob) {
  try {
    const fd = new FormData()
    fd.append('audio', blob, 'ptt.webm')
    fd.append('freq', radios.active)
    fd.append('callsign', session.callsign.value)
    fd.append('phase', phase.value)
    // Server verarbeitet Whisper + LLM → intent/action & ATC-Flow
    const res = await $fetch('/api/ptt/reply', { method: 'POST', body: fd })
    // Erwartete Antwort: { atcText: string, next?: {...}, tts?: {base64,mime} }
    // Fallback: selbst normalisieren & sprechen
    const text = (res as any)?.atcText || 'Say again.'
    await ttsATC(text)
    // TODO: flows.onServerReply(...)
  } catch (e) {
    await ttsATC('Transmission not received.')
  }
}
async function submitIntercom(blob: Blob) {
  // Optional: STT lokal/remote, Trainingshinweise etc.
  console.log('Intercom audio', blob.type, blob.size)
}
async function ttsATC(text: string) {
  // 1) Backend bevorzugt (dein TTS/Radio-Filter)
  try {
    const body = { text: normalizeAtcText(text), level: 4, voice: 'alloy' }
    const a = await $fetch<{ mime:string;base64:string }>('/api/atc/generate',{ method:'POST', body })
    if (a?.base64 && a?.mime) return playBase64(a.base64, a.mime)
  } catch { /* fallback */ }
  // 2) Browser SpeechSynthesis Fallback
  try {
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.95
    speechSynthesis.speak(u)
  } catch { /* ignore */ }
}
async function playBase64(b64: string, mime: string) {
  const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  const blob = new Blob([bin], { type: mime })
  const url = URL.createObjectURL(blob)
  const audioEl = new Audio(url)
  audioEl.play().finally(() => setTimeout(()=>URL.revokeObjectURL(url), 5_000))
}

// ---------- Simple Flow/Handoff Engine (TS statt rohem JSON) ----------
type CommStep = {
  id: string
  freqRole: 'DEL'|'GND'|'TWR'|'DEP'|'APP'|'CTR'
  atc?: (ctx: any) => string                 // was ATC sagt
  pilot?: (ctx: any) => string               // was Pilot sagt
  requireFreq?: (prefix: string) => boolean  // blockt bis passende Freq aktiv
  awaitPTT?: boolean                         // erwartet Pilot-PPT
  next?: string | ((ctx:any)=>string)
}
const flows: Record<string, CommStep> = {
  // Beispiel: Taxi → Handoff Tower → Lineup
  taxiClearance: {
    id:'taxiClearance', freqRole:'GND',
    pilot:(c)=> `${c.callsign}, request taxi`,
    atc:(c)=> `${c.callsign}, taxi to ${c.hp} via ${c.route}`,
    awaitPTT:true, next:'handoffTower'
  },
  handoffTower: {
    id:'handoffTower', freqRole:'GND',
    atc:(c)=> `${c.callsign}, contact ${c.dep} Tower on ${c.twr}`,
    requireFreq:(pref)=> radios.active.startsWith(pref), // wartend bis freq gewechselt
    next:'lineup'
  },
  lineup: {
    id:'lineup', freqRole:'TWR',
    pilot:(c)=> `${c.dep} Tower, ${c.callsign} at ${c.hp}, ready for departure`,
    atc:(c)=> `${c.callsign}, line up and wait runway ${c.rwy}`,
    awaitPTT:true, next:'takeoff'
  },
  takeoff: {
    id:'takeoff', freqRole:'TWR',
    atc:(c)=> `${c.callsign}, wind ${c.wind}, runway ${c.rwy}, cleared for takeoff`,
    awaitPTT:true
  }
}
function onHandoffAfterFreqSwitch() {
  // hier könnte man pending steps fortsetzen, wenn requireFreq erfüllt
}

// ---------- ATC-Normalizer (Zahlen → ICAO-Funk) ----------
function normalizeAtcText(s: string) {
  const mapDigits: Record<string,string> = { '0':'zero','1':'wun','2':'too','3':'tree','4':'fower','5':'fife','6':'six','7':'seven','8':'eight','9':'niner' }
  const sayNum = (m:string) => m.split('').map(ch => mapDigits[ch] ?? ch).join(' ')
  return s
      // RWY 25R → runway two fife right
      .replace(/\brwy\s*([0-3]?\d)([LCR])?\b/ig, (_m, d, lr) => `runway ${sayNum(String(d))}${lr?` ${({L:'left',C:'center',R:'right'} as any)[lr.toUpperCase()]}`:''}`)
      .replace(/\brunway\s*([0-3]?\d)([LCR])?\b/ig, (_m, d, lr) => `runway ${sayNum(String(d))}${lr?` ${({L:'left',C:'center',R:'right'} as any)[lr.toUpperCase()]}`:''}`)
      // QNH 1013
      .replace(/\bQNH\s*(\d{3,4})\b/ig, (_m, n) => `Q N H ${sayNum(n)}`)
      // Squawk 4567
      .replace(/\bsquawk\s*(\d{4})\b/ig, (_m, n) => `squawk ${sayNum(n)}`)
      // Frequenz 118.525
      .replace(/\b(\d{3})\.(\d{1,3})\b/g, (_m,a,b) => `${sayNum(a)} decimal ${sayNum(b)}`)
      // Zahlen alleinstehend (z. B. Wind 220)
      .replace(/\b(\d{2,4})\b/g, (_m, n) => sayNum(n))
}

// ---------- Helpers ----------
function formatRoute(r?: string) {
  if (!r) return '—'
  return r.length > 120 ? r.slice(0,120)+'…' : r
}
function formatIso(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString()
}

// ---------- Watchers ----------
watch(() => phase.value, (p) => {
  // Phasenwechsel → passende Freq vorschlagen
  if (['Taxi','Lineup','Takeoff'].includes(p)) suggestFreq()
})

const check = reactive({
  current: 'Before Start',
  lists: {
    'Before Start': [
      'Parking brake set',
      'Fuel pumps on',
      'Beacon on',
      'APU running',
      'Doors closed',
      'Windows closed',
      'Seatbelts fastened',
      'Flight controls free and correct',
      'Instruments set',
      'Altimeters set',
      'Radios set',
      'FMS programmed',
      'Takeoff briefing complete'
    ],
    'After Takeoff': [
      'Landing gear up',
      'Flaps up',
      'Autopilot on',
      'Thrust set to climb power',
      'Climb checklist complete'
    ],
    'Descent': [
      'Seatbelts sign on',
      'Descent checklist complete'
    ],
    'Before Landing': [
      'Landing gear down',
      'Flaps set for landing',
      'Landing checklist complete'
    ]
  }
})

// Checklist vorlesen (Intercom)
async function speakChecklist(callAndResponse: boolean) {
  alert('Not implemented yet.')
}
</script>

<style scoped>
.pm-container {
  max-width: 430px; /* iPhone-Breite */
  margin-inline: auto;
}
.ptt {
  touch-action: none;
  user-select: none;
  border: 2px solid rgba(0,0,0,.08);
  transition: transform .06s ease, box-shadow .06s ease, filter .06s ease;
}
.ptt.active {
  transform: scale(0.98);
  box-shadow: 0 8px 22px rgba(0,0,0,.25);
  filter: brightness(1.02);
}
</style>
