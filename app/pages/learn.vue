<template>
  <div class="scene">
    <!-- APP BAR -->
    <header class="hud" role="banner">
      <nav class="hud-inner" aria-label="Global">
        <div class="hud-left">
          <!-- 9-Dots App-Icon → Dashboard -->
          <button class="icon-btn" title="Dashboard" @click="panel='hub'">
            <v-icon size="22" class="text-accent">mdi-dots-grid</v-icon>
          </button>
          <span class="brand">OpenSquawk</span>
          <span class="sep">|</span>
          <span class="mode">Lernwelt</span>
        </div>

        <div class="hud-right">
          <span class="chip">Lvl {{ level }}</span>
          <span class="chip">{{ xp }} XP</span>

          <!-- Quick ATC: Voice & Level -->
          <div class="chip inline">
            <v-icon size="16" class="text-accent">mdi-radio-handheld</v-icon>
            <span class="ml-1">L {{ cfg.radioLevel }}</span>
            <input type="range" min="1" max="5" step="1" v-model.number="cfg.radioLevel"/>
          </div>

          <button class="btn ghost" @click="panel='progress'">
            <v-icon size="18">mdi-chart-line</v-icon>
            Fortschritt
          </button>

          <!-- ATC Einstellungen -->
          <button class="btn ghost" @click="showSettings=true" title="ATC-Einstellungen">
            <v-icon size="18">mdi-tune</v-icon>
            ATC
          </button>

          <button class="btn ghost" @click="resetAll" title="Zurücksetzen">
            <v-icon size="18">mdi-refresh</v-icon>
            Reset
          </button>
        </div>
      </nav>
    </header>

    <!-- HERO -->
    <section class="hero" role="region" aria-label="Intro">
      <div class="container">
        <div class="panel hero-panel" :style="worldTiltStyle" @mousemove="tilt">
          <div class="hero-left">
            <div class="eyebrow">TRAINING</div>
            <h1 class="h1">ATC Lernwelt</h1>
            <p class="muted">Geführte Pfade · Missionen · XP · Abzeichen. Lokal gespeichert.</p>
            <div class="actions">
              <button class="btn primary" @click="panel='hub'">
                <v-icon>mdi-play</v-icon>
                Losfliegen
              </button>
              <button class="btn ghost" @click="panel='progress'">
                <v-icon>mdi-progress-check</v-icon>
                Fortschritt
              </button>
              <button class="btn ghost" @click="testBeep">
                <v-icon>mdi-volume-high</v-icon>
                Test
              </button>
            </div>
            <div class="season">
              <div class="bar">
                <div class="fill" :style="{ width: seasonPct + '%' }"></div>
              </div>
              <div class="meta"><span>Season 1 · Ground School</span><span>{{ seasonPct }}%</span></div>
            </div>
          </div>

          <div class="hero-right">
            <div class="rail-title">
              <v-icon size="18">mdi-calendar-star</v-icon>
              Daily Challenges
            </div>
            <div class="rail">
              <div v-for="d in dailies" :key="d.id" class="card">
                <div class="card-head">
                  <span class="badge">{{ d.reward }} XP</span>
                  <v-icon size="18">mdi-lightning-bolt</v-icon>
                </div>
                <div class="card-title">{{ d.title }}</div>
                <div class="card-sub muted">{{ d.sub }}</div>
                <button class="btn mini soft" @click="startDaily(d)">Annehmen</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- HUB -->
    <main v-if="panel==='hub'" class="container" role="main">
      <div class="hub-head">
        <h2 class="h2">Mission Hub</h2>
        <div class="muted">Starte mit ICAO Alphabet & Zahlen, dann Basics, Ground …</div>
      </div>

      <div class="tiles">
        <div
            v-for="m in modules"
            :key="m.id"
            class="tile"
            :class="{ locked: !isModuleUnlocked(m.id) }"
        >
          <div class="tile-media" :style="{ backgroundImage: `url(${m.art})` }"></div>
          <div class="tile-body">
            <div class="tile-top">
              <div class="tile-title">
                <v-icon size="18">mdi-flag-checkered</v-icon>
                {{ m.title }}
              </div>
              <div class="muted">{{ doneCount(m.id) }}/{{ m.lessons.length }}</div>
            </div>
            <div class="muted small">{{ m.subtitle }}</div>
            <div class="line">
              <div class="line-fill" :style="{ width: pct(m.id)+'%' }"></div>
            </div>
            <div class="tile-actions">
              <button class="btn primary" :disabled="!isModuleUnlocked(m.id)" @click="openModule(m.id)">
                <v-icon size="18">mdi-play</v-icon>
                Start
              </button>
              <button class="btn soft" @click="quickContinue(m.id)">
                <v-icon size="18">mdi-skip-next</v-icon>
                Weiter
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- MODULE -->
    <section v-if="panel==='module' && current" class="container play" aria-label="Modul">
      <div class="play-head">
        <div class="crumbs">
          <button class="link" @click="panel='hub'">
            <v-icon size="16">mdi-arrow-left</v-icon>
            Hub
          </button>
          <span class="muted">/ {{ current.title }}</span>
        </div>
        <div class="stats">
          <span class="stat"><v-icon size="18">mdi-progress-check</v-icon> {{
              doneCount(current.id)
            }}/{{ current.lessons.length }}</span>
          <span class="stat"><v-icon size="18">mdi-star</v-icon> Ø {{ avgScore(current.id) }}%</span>
        </div>
      </div>

      <div class="lesson-grid">
        <button
            v-for="l in current.lessons"
            :key="l.id"
            class="lesson"
            :class="{ active: activeLesson?.id===l.id, ok: bestScore(current.id,l.id)>=80 }"
            @click="selectLesson(l)"
        >
          <div class="lesson-top">
            <div class="lesson-title">
              <v-icon size="18">mdi-headset</v-icon>
              {{ l.title }}
            </div>
            <div class="chip" :class="{ ok: bestScore(current.id,l.id)>=80 }">
              {{ bestScore(current.id, l.id) ? bestScore(current.id, l.id) + '%' : 'neu' }}
            </div>
          </div>
          <div class="muted small">{{ l.desc }}</div>
          <div class="tags">
            <span v-for="k in l.keywords" :key="k" class="tag">{{ k }}</span>
          </div>
        </button>
      </div>

      <div v-if="activeLesson" class="console">
        <div class="col">
          <div class="label">Zielphrase</div>
          <div class="panel">
            <div class="target-row">
              <span>{{ activeLesson.target }}</span>
              <div class="row">
                <button class="btn soft" @click="speak(activeLesson.target)">
                  <v-icon>mdi-volume-high</v-icon>
                  Abspielen
                </button>
                <button class="btn ghost" @click="fillTarget">
                  <v-icon>mdi-auto-fix</v-icon>
                  Autotext
                </button>
              </div>
            </div>
          </div>
          <div class="hints">
            <div v-for="h in activeLesson.hints" :key="h" class="hint">
              <v-icon size="16">mdi-lightbulb-on-outline</v-icon>
              {{ h }}
            </div>
          </div>
        </div>


        <div v-if="!textReadback" class="col">
          <div class="label">Deine Readback</div>

          <!-- PTT Toggle -->
          <div class="ptt-toggle">
            <button
                class="btn soft"
                :class="{ active: usePTT }"
                @click="usePTT = !usePTT"
            >
              <v-icon>{{ usePTT ? 'mdi-microphone' : 'mdi-keyboard' }}</v-icon>
              {{ usePTT ? 'PTT Mode' : 'Text Mode' }}
            </button>
          </div>

          <!-- Text Input (wenn PTT aus) -->
          <v-textarea
              v-if="!usePTT"
              v-model="userInput"
              rows="4"
              class="input"
              placeholder="Tippen Sie Ihre Readback"
          />

          <!-- PTT Interface (wenn PTT an) -->
          <div v-if="usePTT" class="ptt-interface">
            <div class="ptt-status">
              <div class="status-indicator"
                   :class="{ recording: tts.isRecording.value, processing: tts.isLoading.value }">
                <v-icon size="24">
                  {{
                    tts.isRecording.value ? 'mdi-record-rec' : tts.isLoading.value ? 'mdi-loading mdi-spin' : 'mdi-microphone'
                  }}
                </v-icon>
              </div>
              <div class="status-text">
                {{
                  tts.isRecording.value ? 'Aufnahme läuft...' :
                      tts.isLoading.value ? 'Verarbeitung...' :
                          'Bereit für Aufnahme'
                }}
              </div>
            </div>

            <!-- PTT Button -->
            <button
                class="btn-ptt"
                :class="{ recording: tts.isRecording.value, disabled: tts.isLoading.value }"
                @mousedown="startPTT"
                @mouseup="stopPTT"
                @touchstart="startPTT"
                @touchend="stopPTT"
                :disabled="tts.isLoading.value"
            >
              <v-icon size="32">mdi-radio-handheld</v-icon>
              <span>{{ tts.isRecording.value ? 'Recording...' : 'Hold to Talk' }}</span>
            </button>

            <!-- Letztes Readback anzeigen -->
            <div v-if="lastTranscription" class="transcription">
              <div class="transcription-label">Ihr Readback:</div>
              <div class="transcription-text">{{ lastTranscription }}</div>
            </div>
          </div>

          <!-- Buttons -->
          <div class="row">
            <button
                v-if="!usePTT"
                class="btn primary"
                :disabled="evaluating"
                @click="evaluate"
            >
              <v-icon>mdi-check</v-icon>
              Prüfen
            </button>

            <button
                v-if="usePTT && lastTranscription"
                class="btn primary"
                :disabled="tts.isLoading.value"
                @click="evaluatePTT"
            >
              <v-icon>mdi-check</v-icon>
              Bewerten
            </button>

            <button class="btn ghost" @click="clearInput">
              <v-icon>mdi-eraser</v-icon>
              Löschen
            </button>
          </div>

          <!-- Ergebnis (für beide Modi) -->
          <div v-if="result" class="score">
            <div class="score-num">{{ result.score }}%</div>
            <div class="muted small">
      <span v-if="!usePTT">
        Keywords: {{ result.hits }}/{{ activeLesson.keywords.length }} · Ähnlichkeit: {{
          Math.round(result.sim * 100)
        }}%
      </span>
              <span v-else>
        Genauigkeit: {{ Math.round(result.evaluation.accuracy * 100) }}% ·
        Keywords: {{ result.evaluation.keywordMatch * 100 }}%
      </span>
            </div>

            <!-- PTT-spezifisches Feedback -->
            <div v-if="usePTT && result.evaluation" class="ptt-feedback">
              <div class="feedback-text">{{ result.evaluation.feedback }}</div>
              <div v-if="result.evaluation.mistakes" class="mistakes">
                <strong>Verbesserungen:</strong>
                <ul>
                  <li v-for="mistake in result.evaluation.mistakes" :key="mistake">{{ mistake }}</li>
                </ul>
              </div>
              <div v-if="result.playAgain" class="replay-notice">
                <v-icon>mdi-repeat</v-icon>
                Funkspruch wird wiederholt...
              </div>
            </div>
          </div>

          <!-- Fehler anzeigen -->
          <div v-if="tts.error.value" class="error-message">
            <v-icon>mdi-alert</v-icon>
            {{ tts.error.value }}
          </div>
        </div>
        <div v-else class="col">
          <div class="label">Deine Readback</div>
          <v-textarea v-model="userInput" rows="4" class="input" placeholder="Tippen (PTT später)"/>
          <div class="row">
            <button class="btn primary" :disabled="evaluating" @click="evaluate">
              <v-icon>mdi-check</v-icon>
              Prüfen
            </button>
            <button class="btn ghost" @click="userInput=''">
              <v-icon>mdi-eraser</v-icon>
              Löschen
            </button>
          </div>

          <div v-if="result" class="score">
            <div class="score-num">{{ result.score }}%</div>
            <div class="muted small">
              Keywords: {{ result.hits }}/{{ activeLesson.keywords.length }} · Ähnlichkeit:
              {{ Math.round(result.sim * 100) }}%
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- PROGRESS -->
    <section v-if="panel==='progress'" class="container" aria-label="Fortschritt">
      <h2 class="h2">Gesamtfortschritt</h2>
      <div class="progress-grid">
        <div v-for="m in modules" :key="m.id" class="panel">
          <div class="row between">
            <div class="strong">{{ m.title }}</div>
            <div class="muted">{{ pct(m.id) }}%</div>
          </div>
          <div class="list">
            <div v-for="l in m.lessons" :key="l.id" class="list-row">
              <span>{{ l.title }}</span>
              <span class="muted">{{ bestScore(m.id, l.id) ? bestScore(m.id, l.id) + '%' : '—' }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SETTINGS DIALOG -->
    <v-dialog v-model="showSettings" max-width="720">
      <div class="panel dialog">
        <h3 class="h3">ATC Einstellungen</h3>

        <div class="settings">
          <div class="set-row">
            <span>Browser-TTS (Web Speech)</span>
            <v-switch v-model="cfg.tts" color="cyan" hide-details inset/>
          </div>

          <div class="set-row">
            <span>Funk-Level (1..5)</span>
            <v-slider v-model="cfg.radioLevel" :min="1" :max="5" :step="1" color="cyan" thumb-label/>
          </div>

          <div class="set-row">
            <span>Voice</span>
            <v-text-field v-model="cfg.voice" placeholder="alloy" hide-details density="compact" variant="outlined"/>
          </div>

          <div class="set-row">
            <span>Probe-TTS</span>
            <div class="row">
              <button class="btn soft" @click="speak('Frankfurt Ground, Lufthansa one two three, request taxi.')">
                <v-icon>mdi-volume-high</v-icon>
                Probe
              </button>
              <button class="btn ghost" @click="stopAudio">
                <v-icon>mdi-stop</v-icon>
                Stopp
              </button>
            </div>
          </div>
        </div>

        <div class="row end">
          <button class="btn soft" @click="showSettings=false">Schließen</button>
        </div>
      </div>
    </v-dialog>

    <!-- TOAST -->
    <v-snackbar v-model="toast.show" timeout="2200" location="top" color="#22d3ee">
      <v-icon class="mr-2">mdi-trophy</v-icon>
      {{ toast.text }}
    </v-snackbar>
  </div>
</template>


<script setup lang="ts">
import {ref, computed, watch} from 'vue'
import useRadioTTS from "../../composables/radioTtsNew";
import learnModules, {Lesson, ModuleDef} from "../../composables/learnModules";

/** AUDIO **/
const tts = useRadioTTS()
const textReadback = ref(false)

// Server TTS verwenden
function speak(text: string) {
  if (cfg.value.tts) {
    tts.speakBrowser(text)
  } else {
    tts.speakServer(text, {
      level: cfg.value.radioLevel,
      voice: cfg.value.voice || 'alloy',
      moduleId: current.value?.id,
      lessonId: activeLesson.value?.id
    })
  }
}

// PTT-Button hinzufügen (optional)
const handlePTT = async () => {
  if (tts.isRecording.value) {
    const audioBlob = await tts.stopRecording()
    if (audioBlob && activeLesson.value) {
      const result = await tts.submitPTT(audioBlob, {
        expectedText: activeLesson.value.target,
        moduleId: current.value!.id,
        lessonId: activeLesson.value.id
      })

      // Bewertung anzeigen
      console.log('PTT Score:', result.evaluation.score)
      if (result.playAgain) {
        speak(activeLesson.value.target) // Nochmal abspielen
      }
    }
  } else {
    await tts.startRecording()
  }
}

// Zufällige Phrase für Lektion generieren
const generateRandomPhrase = async () => {
  if (current.value && activeLesson.value) {
    const response = await tts.generatePhrase({
      moduleId: current.value.id,
      lessonId: activeLesson.value.id,
      type: 'instruction'
    })

    // Generierte Phrase abspielen
    if (response.phrases[0]) {
      speak(response.phrases[0].original)
    }
  }
}

onMounted(() => {
  // Browser benötigt Mikrofon-Berechtigung
  navigator.mediaDevices.getUserMedia({audio: true})
})

function stopAudio() {
  tts.stop()
}


/** STATE **/
const panel = ref<'hub' | 'module' | 'progress'>('hub')
const current = ref<ModuleDef | null>(null)
const activeLesson = ref<Lesson | null>(null)
const userInput = ref('')

const toast = ref({show: false, text: ''})
const showSettings = ref(false)
const cfg = ref({
  tts: JSON.parse(localStorage.getItem('os_cfg') || '{"tts":true}').tts ?? true,
  kwWeight: JSON.parse(localStorage.getItem('os_cfg_kw') || '{"v":0.6}').v ?? 0.6,
  radioLevel: JSON.parse(localStorage.getItem('os_cfg_level') || '{"v":4}').v ?? 4,
  voice: (JSON.parse(localStorage.getItem('os_cfg_voice') || '{"v":"alloy"}').v) ?? 'alloy'
})

const xp = ref(Number(localStorage.getItem('os_xp') || '0'))
const level = computed(() => 1 + Math.floor(xp.value / 300))
const seasonPct = computed(() => Math.min(100, Math.round((xp.value % 1000) / 10)))

type Prog = Record<string, Record<string, { best: number; done: boolean }>>
const progress = ref<Prog>(JSON.parse(localStorage.getItem('os_progress') || '{}'))

watch(progress, v => localStorage.setItem('os_progress', JSON.stringify(v)), {deep: true})
watch(xp, v => localStorage.setItem('os_xp', String(v)))
watch(() => cfg.value.tts, v => localStorage.setItem('os_cfg', JSON.stringify({tts: v})))
watch(() => cfg.value.kwWeight, v => localStorage.setItem('os_cfg_kw', JSON.stringify({v})))
watch(() => cfg.value.radioLevel, v => localStorage.setItem('os_cfg_level', JSON.stringify({v})))
watch(() => cfg.value.voice, v => localStorage.setItem('os_cfg_voice', JSON.stringify({v})))

const modules = learnModules

/** HUB / FLOW **/
function isModuleUnlocked(id: string) {
  if (id === 'icao') return true
  const order = modules.value.findIndex(m => m.id === id)
  const prev = modules.value[order - 1]
  return prev ? pct(prev.id) >= 80 : true
}

function openModule(id: string) {
  current.value = modules.value.find(m => m.id === id) || null
  activeLesson.value = null
  panel.value = 'module'
}

function quickContinue(id: string) {
  openModule(id)
  const m = current.value!
  const mp = progress.value[m.id] || {}
  const next = m.lessons.find(l => !(mp[l.id]?.done))
  activeLesson.value = next || m.lessons[0]
}

function selectLesson(l: Lesson) {
  activeLesson.value = l
  userInput.value = ''
}

function bestScore(modId: string, lesId: string) {
  return progress.value[modId]?.[lesId]?.best || 0
}

function doneCount(modId: string) {
  const m = modules.value.find(x => x.id === modId);
  if (!m) return 0
  const mp = progress.value[modId] || {}
  return m.lessons.filter(l => mp[l.id]?.done).length
}

function pct(modId: string) {
  const m = modules.value.find(x => x.id === modId);
  if (!m) return 0
  return Math.round(doneCount(modId) / m.lessons.length * 100)
}

function avgScore(modId: string) {
  const m = modules.value.find(x => x.id === modId);
  if (!m) return 0
  const mp = progress.value[modId] || {}
  const arr = m.lessons.map(l => mp[l.id]?.best || 0)
  const s = arr.reduce((a, b) => a + b, 0)
  return Math.round(s / (arr.length || 1))
}

/** EVALUATION (leicht) **/
const evaluating = ref(false)
const result = ref<{ score: number, sim: number, hits: number } | null>(null)

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function lev(a: string, b: string) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m
  const dp = new Array(n + 1).fill(0);
  for (let j = 0; j <= n; j++) dp[j] = j
  for (let i = 1; i <= m; i++) {
    let p = dp[0];
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const t = dp[j];
      const c = a[i - 1] === b[j - 1] ? 0 : 1
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, p + c);
      p = t
    }
  }
  return dp[n]
}

function sim(a: string, b: string) {
  const A = norm(a), B = norm(b);
  const d = lev(A, B);
  const M = Math.max(A.length, B.length) || 1;
  return 1 - d / M
}

function hits(text: string, kws: string[]) {
  const T = norm(text);
  return kws.reduce((s, k) => s + (T.includes(norm(k)) ? 1 : 0), 0)
}

function fillTarget() {
  if (activeLesson.value) userInput.value = activeLesson.value.target
}

/** DAILIES **/
const dailies = ref([
  {id: 'd1', title: '3 Readbacks ≥80%', sub: 'Belohnung: +50 XP', reward: 50},
  {id: 'd2', title: '1 Modul starten', sub: 'Belohnung: +20 XP', reward: 20},
  {id: 'd3', title: 'Zielphrase abspielen', sub: 'Belohnung: +10 XP', reward: 10}
])

function startDaily(d: { id: string; reward: number; title: string }) {
  xp.value += d.reward;
  toastNow(`Daily: ${d.title} · +${d.reward} XP`);
  dailies.value = dailies.value.filter(x => x.id !== d.id)
}

/** UI helpers **/
function toastNow(t: string) {
  toast.value.text = t;
  toast.value.show = true
}

function resetAll() {
  localStorage.clear();
  location.reload()
}

/** Hero Tilt **/
const worldTiltStyle = ref<any>({})

function tilt(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const dx = (e.clientX - (rect.left + rect.width / 2)) / rect.width
  const dy = (e.clientY - (rect.top + rect.height / 2)) / rect.height
  worldTiltStyle.value = {transform: `perspective(1200px) rotateX(${dy * -3}deg) rotateY(${dx * 3}deg)`}
}

/** Quick demo beep via speak() **/
function testBeep() {
  speak('Test message. Radio check, one two three.')
}

// Diese Ergänzungen in Ihr <script setup> von learn.vue hinzufügen:

// PTT State hinzufügen
const usePTT = ref(false)
const lastTranscription = ref('')
const pttResult = ref<any>(null)

// PTT Funktionen
async function startPTT() {
  if (!activeLesson.value || tts.isLoading.value) return

  try {
    await tts.startRecording()
  } catch (error) {
    console.error('PTT start failed:', error)
  }
}

async function stopPTT() {
  if (!tts.isRecording.value) return

  try {
    const audioBlob = await tts.stopRecording()
    if (audioBlob && activeLesson.value) {
      // Transkription durchführen
      const pttResponse = await tts.submitPTT(audioBlob, {
        expectedText: activeLesson.value.target,
        moduleId: current.value!.id,
        lessonId: activeLesson.value.id,
        format: 'webm'
      })

      lastTranscription.value = pttResponse.transcription
      pttResult.value = pttResponse

      // Automatisch bewerten falls gewünscht
      if (pttResponse.success) {
        await evaluatePTT()
      }

      // Funkspruch wiederholen falls empfohlen
      if (pttResponse.playAgain && activeLesson.value) {
        setTimeout(() => {
          speak(activeLesson.value!.target)
        }, 1000)
      }
    }
  } catch (error) {
    console.error('PTT processing failed:', error)
  }
}

async function evaluatePTT() {
  if (!pttResult.value || !activeLesson.value || !current.value) return

  evaluating.value = true

  try {
    // PTT Ergebnis in normales Result-Format konvertieren
    const pttEval = pttResult.value.evaluation

    result.value = {
      score: pttEval.score,
      sim: pttEval.accuracy,
      hits: Math.round(pttEval.keywordMatch * (activeLesson.value.keywords?.length || 0)),
      evaluation: pttEval,
      isPTT: true
    }

    // XP vergeben wie bei normalem Evaluate
    const modId = current.value.id
    const lesId = activeLesson.value.id
    const score = pttEval.score

    if (!progress.value[modId]) progress.value[modId] = {}
    const prev = progress.value[modId][lesId]?.best || 0
    const best = Math.max(prev, score)
    const passedBefore = progress.value[modId][lesId]?.done || false
    progress.value[modId][lesId] = {best, done: best >= 80}

    let gained = 0
    if (best >= 80 && !passedBefore) gained += 40
    if (score >= 95) gained += 15
    if (score >= 80) gained += 10

    if (gained) {
      xp.value += gained
      toastNow(`+${gained} XP · ${activeLesson.value.title}`)
    }

  } catch (error) {
    console.error('PTT evaluation failed:', error)
  } finally {
    evaluating.value = false
  }
}

function clearInput() {
  if (usePTT.value) {
    lastTranscription.value = ''
    pttResult.value = null
  } else {
    userInput.value = ''
  }
  result.value = null
}

// Bestehende evaluate() Funktion erweitern um PTT-Check
async function evaluate() {
  if (usePTT.value) {
    return evaluatePTT()
  }

  // Ihr bestehender evaluate() Code bleibt unverändert...
  if (!current.value || !activeLesson.value) return
  evaluating.value = true
  await new Promise(r => setTimeout(r, 160))
  const s = sim(userInput.value, activeLesson.value.target)
  const h = hits(userInput.value, activeLesson.value.keywords)
  const kwScore = activeLesson.value.keywords.length ? (h / activeLesson.value.keywords.length) : 1
  const score = Math.round(((kwScore * 0.6) + (s * 0.4)) * 100)
  result.value = {score, sim: s, hits: h}
  const modId = current.value.id, lesId = activeLesson.value.id
  if (!progress.value[modId]) progress.value[modId] = {}
  const prev = progress.value[modId][lesId]?.best || 0
  const best = Math.max(prev, score)
  const passedBefore = progress.value[modId][lesId]?.done || false
  progress.value[modId][lesId] = {best, done: best >= 80}
  let gained = 0
  if (best >= 80 && !passedBefore) gained += 40
  if (score >= 95) gained += 15
  if (score >= 80 && userInput.value.length <= activeLesson.value.target.length + 8) gained += 10
  if (gained) {
    xp.value += gained;
    toastNow(`+${gained} XP · ${activeLesson.value.title}`)
  }
  evaluating.value = false
}

// Optional: Keyboard Shortcuts für PTT
onMounted(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Leertaste für PTT (wie bei echten Funkgeräten)
    if (e.code === 'Space' && usePTT.value && !tts.isRecording.value) {
      e.preventDefault()
      startPTT()
    }
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space' && usePTT.value && tts.isRecording.value) {
      e.preventDefault()
      stopPTT()
    }
  }

  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('keyup', handleKeyUp)
  })
})
</script>

<style scoped>
:root {
  --bg: #0b1020;
  --bg2: #0a0f1c;
  --accent: #22d3ee;
  --accent2: #0ea5e9;
  --text: #ffffff;
  --t2: rgba(255, 255, 255, .80);
  --t3: rgba(255, 255, 255, .60);
  --border: rgba(255, 255, 255, .10);
}

.scene {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text)
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px
}

.h1 {
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 600;
  line-height: 1.2
}

.h2 {
  font-size: clamp(24px, 3.5vw, 32px);
  font-weight: 600;
  line-height: 1.25
}

.h3 {
  font-size: 20px;
  font-weight: 600
}

.muted {
  color: var(--t3)
}

.small {
  font-size: 13px
}

.strong {
  font-weight: 600
}

.text-accent {
  color: var(--accent)
}

/* App Bar */
.hud {
  position: sticky;
  top: 0;
  z-index: 40;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg) 85%, transparent)
}

.hud-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px
}

.hud-left {
  display: flex;
  align-items: center;
  gap: 10px
}

.brand {
  font-weight: 600
}

.mode {
  color: var(--t2)
}

.sep {
  color: var(--t3)
}

.hud-right {
  display: flex;
  gap: 8px;
  align-items: center
}

.icon-btn {
  border: 1px solid var(--border);
  background: transparent;
  padding: 6px;
  display: inline-flex;
  align-items: center
}

.icon-btn:hover {
  background: color-mix(in srgb, var(--text) 6%, transparent);
  transform: scale(1.05);
}

/* Chips/Controls */
.chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  font-size: 12px
}

.chip.inline {
  gap: 8px
}

.chip.inline input[type="range"] {
  width: 120px;
  accent-color: var(--accent);
  background: transparent
}

/* Hero */
.hero {
  background: radial-gradient(800px 400px at 80% -10%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 60%),
  radial-gradient(600px 300px at 10% -5%, color-mix(in srgb, var(--accent2) 15%, transparent), transparent 60%),
  linear-gradient(180deg, var(--bg) 0%, var(--bg) 60%, var(--bg2) 100%);
  margin-top: -3em;
  padding: 18px 0 8px;
  padding-top: 4em;
}

.hero-panel {
  display: grid;
  grid-template-columns: 1.1fr .9fr;
  gap: 20px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  padding: 20px;
  transform-style: preserve-3d
}

.hero-left .eyebrow {
  font-size: 12px;
  letter-spacing: .16em;
  color: var(--t3)
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 12px
}

.season {
  margin-top: 14px
}

.bar {
  height: 8px;
  background: color-mix(in srgb, var(--text) 8%, transparent);
  border: 1px solid var(--border)
}

.fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent2))
}

.meta {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  color: var(--t3);
  font-size: 12px
}

.hero-right .rail-title {
  color: var(--t3);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px
}

.rail {
  display: flex;
  gap: 10px;
  overflow: auto
}

.card {
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  padding: 12px;
  min-width: 240px
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center
}

.badge {
  border: 1px solid var(--border);
  padding: 2px 6px;
  font-size: 12px;
  color: var(--t2)
}

.card-title {
  font-weight: 600;
  margin: 6px 0 2px
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  color: var(--text);
  font-weight: 600
}

.btn:hover {
  background: color-mix(in srgb, var(--text) 10%, transparent)
}

.btn.primary {
  background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 90%, transparent), color-mix(in srgb, var(--accent) 70%, transparent));
  color: #061318;
  border-color: color-mix(in srgb, var(--accent) 60%, transparent)
}

.btn.soft {
  background: color-mix(in srgb, var(--text) 8%, transparent)
}

.btn.ghost {
  background: transparent
}

.btn.mini {
  padding: 6px 10px;
  font-size: 12px
}

/* HUB tiles */
.hub-head {
  margin: 6px 0 10px
}

.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px
}

.tile {
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  display: flex;
  flex-direction: column
}

.tile.locked {
  filter: saturate(.7) brightness(.9)
}

.tile-media {
  height: 140px;
  background-size: cover;
  background-position: center
}

.tile-body {
  padding: 12px
}

.tile-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px
}

.tile-title {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px
}

.line {
  height: 8px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 8%, transparent)
}

.line-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent2))
}

.tile-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px
}

/* Play */
.play .play-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 10px
}

.crumbs {
  display: flex;
  align-items: center;
  gap: 8px
}

.link {
  background: transparent;
  border: 0;
  color: var(--text);
  display: inline-flex;
  align-items: center;
  gap: 6px
}

.stats {
  display: flex;
  gap: 8px
}

.stat {
  border: 1px solid var(--border);
  padding: 6px 10px;
  background: color-mix(in srgb, var(--text) 6%, transparent)
}

.lesson-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px
}

.lesson {
  text-align: left;
  border: 1px solid var(--border);
  padding: 12px;
  background: color-mix(in srgb, var(--text) 5%, transparent);
  cursor: pointer
}

.lesson.active {
  outline: 1px solid color-mix(in srgb, var(--accent) 50%, transparent)
}

.lesson.ok {
  border-color: color-mix(in srgb, #4caf50 60%, transparent)
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px
}

.tag {
  border: 1px dashed color-mix(in srgb, var(--text) 25%, transparent);
  color: var(--t3);
  font-size: 11px;
  padding: 2px 6px
}

.console {
  display: grid;
  grid-template-columns: 1.1fr .9fr;
  gap: 12px;
  margin-top: 12px
}

.col .label {
  font-size: 12px;
  letter-spacing: .12em;
  color: var(--t3);
  margin-bottom: 6px
}

.panel {
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  padding: 12px;
  backdrop-filter: blur(10px)
}

.target-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: flex-start
}

.row {
  display: flex;
  gap: 8px;
  margin-top: 8px
}

.row.between {
  justify-content: space-between
}

.row.end {
  justify-content: flex-end
}

.input :deep(textarea) {
  background: color-mix(in srgb, var(--text) 6%, transparent);
  border: 1px solid var(--border);
  color: var(--text)
}

.score {
  margin-top: 8px
}

.score-num {
  font-size: 28px;
  font-weight: 700
}

/* Progress */
.progress-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-top: 10px
}

.list {
  margin-top: 8px
}

.list-row {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px dashed color-mix(in srgb, var(--text) 12%, transparent);
  padding: 8px 0
}

.list-row:last-child {
  border-bottom: 0
}

/* Responsive */
@media (max-width: 980px) {
  .hero-panel {
    grid-template-columns: 1fr
  }

  .console {
    grid-template-columns: 1fr
  }

  .stats {
    display: none
  }
}


/* PTT-spezifische Styles */
.ptt-toggle {
  margin-bottom: 12px;
}

.ptt-toggle .btn.active {
  background: color-mix(in srgb, var(--accent) 20%, transparent);
  border-color: var(--accent);
}

.ptt-interface {
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.ptt-status {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.status-indicator {
  width: 40px;
  height: 40px;
  border: 2px solid var(--border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.status-indicator.recording {
  border-color: #f44336;
  background: color-mix(in srgb, #f44336 20%, transparent);
  animation: pulse 1s infinite;
}

.status-indicator.processing {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 20%, transparent);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.status-text {
  font-size: 14px;
  color: var(--t2);
}

.btn-ptt {
  width: 100%;
  padding: 20px;
  border: 2px solid var(--border);
  background: color-mix(in srgb, var(--text) 8%, transparent);
  color: var(--text);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.btn-ptt:hover:not(.disabled) {
  background: color-mix(in srgb, var(--text) 12%, transparent);
  transform: translateY(-2px);
}

.btn-ptt.recording {
  border-color: #f44336;
  background: color-mix(in srgb, #f44336 15%, transparent);
  animation: pulse 1s infinite;
}

.btn-ptt.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.transcription {
  margin-top: 16px;
  padding: 12px;
  background: color-mix(in srgb, var(--accent) 5%, transparent);
  border: 1px dashed color-mix(in srgb, var(--accent) 30%, transparent);
  border-radius: 6px;
}

.transcription-label {
  font-size: 12px;
  color: var(--t3);
  margin-bottom: 4px;
}

.transcription-text {
  font-weight: 500;
}

.ptt-feedback {
  margin-top: 12px;
  padding: 12px;
  background: color-mix(in srgb, var(--text) 4%, transparent);
  border-radius: 6px;
}

.feedback-text {
  margin-bottom: 8px;
  font-style: italic;
}

.mistakes {
  margin-top: 8px;
}

.mistakes ul {
  margin: 4px 0 0 16px;
}

.mistakes li {
  margin: 2px 0;
  font-size: 13px;
}

.replay-notice {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  color: var(--accent);
  font-size: 13px;
}

.error-message {
  margin-top: 8px;
  padding: 8px 12px;
  background: color-mix(in srgb, #f44336 10%, transparent);
  border: 1px solid color-mix(in srgb, #f44336 30%, transparent);
  border-radius: 6px;
  color: #ff6b6b;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
</style>
