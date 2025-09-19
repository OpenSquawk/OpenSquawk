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
          <span class="mode">Training Hub</span>
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
            Progress
          </button>

          <!-- ATC Einstellungen -->
          <button class="btn ghost" @click="showSettings=true" title="ATC settings">
            <v-icon size="18">mdi-tune</v-icon>
            ATC
          </button>

          <button class="btn ghost" @click="resetAll" title="Reset">
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
            <div class="eyebrow">ALPHA BUILD · TRAINING</div>
            <h1 class="h1">ATC Learning Hub</h1>
            <p class="muted">Guided paths · missions · XP · badges. Stored locally.</p>
            <div class="actions">
              <button class="btn primary" @click="panel='hub'">
                <v-icon>mdi-play</v-icon>
                Start training
              </button>
              <button class="btn ghost" @click="panel='progress'">
                <v-icon>mdi-progress-check</v-icon>
                Progress
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
                <button class="btn mini soft" @click="startDaily(d)">Accept</button>
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
        <div class="muted">Start with the ICAO alphabet & numbers, then basics, ground, and more.</div>
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
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- MODULE -->
    <section v-if="panel==='module' && current" class="container play" aria-label="Module">
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
            :class="{ active: activeLesson && activeLesson.id===l.id, ok: bestScore(current.id,l.id)>=80 }"
            @click="selectLesson(l)"
        >
          <div class="lesson-top">
            <div class="lesson-title">
              <v-icon size="18">mdi-headset</v-icon>
              {{ l.title }}
            </div>
              <div class="chip" :class="{ ok: bestScore(current.id,l.id)>=80 }">
              {{ bestScore(current.id, l.id) ? bestScore(current.id, l.id) + '%' : 'new' }}
            </div>
          </div>
          <div class="muted small">{{ l.desc }}</div>
          <div class="tags">
            <span v-for="k in l.keywords" :key="k" class="tag">{{ k }}</span>
          </div>
        </button>
      </div>

      <div v-if="activeLesson" class="console">
        <div v-if="scenario" class="scenario-bar">
          <div class="scenario-item">
            <span class="scenario-label">Callsign</span>
            <div class="scenario-value">{{ scenario.callsign }}</div>
            <div class="scenario-sub">{{ scenario.radioCall }}</div>
          </div>
          <div class="scenario-item">
            <span class="scenario-label">Airport</span>
            <div class="scenario-value">{{ scenario.airport.icao }}</div>
            <div class="scenario-sub">{{ scenario.airport.name }}</div>
          </div>
          <div class="scenario-item wide">
            <span class="scenario-label">Frequencies</span>
            <div class="freq-chips">
              <button
                  v-for="freq in scenario.frequencies"
                  :key="freq.type"
                  type="button"
                  class="freq-chip"
                  :class="{ active: activeFrequency && activeFrequency.type === freq.type }"
                  @click="setActiveFrequency(freq)"
              >
                {{ freq.label }} {{ freq.value }}
              </button>
            </div>
            <div v-if="activeFrequency && scenario.frequencyWords[activeFrequency.type]" class="freq-hint muted small">
              {{ scenario.frequencyWords[activeFrequency.type] }}
            </div>
          </div>
        </div>
        <div class="console-grid">
          <div class="col">
            <div class="label">Briefing</div>
            <div class="panel">
              <div class="target-row">
                <div class="target-main">
                  <div class="muted small">{{ activeLesson.desc }}</div>
                  <div
                      class="target-text"
                      :class="{ 'audio-blur': audioContentHidden }"
                      :aria-hidden="audioContentHidden ? 'true' : 'false'"
                  >
                    {{ targetPhrase }}
                  </div>
                  <div v-if="audioContentHidden" class="audio-note muted small">
                    Audio challenge active – listen first.
                  </div>
                </div>
                <div class="target-actions">
                  <button
                      class="btn soft mini"
                      type="button"
                      :disabled="!targetPhrase || ttsLoading"
                      :aria-busy="ttsLoading ? 'true' : 'false'"
                      @click="speakTarget()"
                  >
                    <v-icon size="16" :class="{ spin: ttsLoading }">{{ ttsLoading ? 'mdi-loading' : 'mdi-volume-high' }}</v-icon>
                    {{ sayButtonLabel }}
                  </button>
                  <button
                      v-if="audioContentHidden"
                      class="btn ghost mini"
                      type="button"
                      @click="revealAudioContent"
                  >
                    <v-icon size="16">mdi-eye</v-icon>
                    Reveal text
                  </button>
                  <button class="btn ghost mini" type="button" @click="repeatLesson">
                    <v-icon size="16">mdi-dice-5</v-icon>
                    Roll
                  </button>
                </div>
              </div>
            </div>
            <div class="hints">
              <div v-for="hint in activeLesson.hints" :key="hint" class="hint">
                <v-icon size="16">mdi-lightbulb-on-outline</v-icon>
                {{ hint }}
              </div>
              <div
                  v-for="info in lessonInfo"
                  :key="info"
                  :class="['hint', 'secondary', { 'audio-blur': audioContentHidden }]"
                  :aria-hidden="audioContentHidden ? 'true' : 'false'"
              >
                <v-icon size="16">mdi-information-outline</v-icon>
                {{ info }}
              </div>
            </div>
          </div>

          <div class="col">
            <div class="label">Your readback</div>
            <div class="panel readback-panel">
              <div class="cloze">
                <template v-for="(segment, idx) in activeLesson.readback" :key="segment.type === 'field' ? `f-${segment.key}` : `t-${idx}`">
                  <span v-if="segment.type === 'text'">
                    {{ typeof segment.text === 'function' && scenario ? segment.text(scenario) : segment.text }}
                  </span>
                  <label
                      v-else
                      class="blank"
                      :class="[blankSizeClass(segment.key, segment.width), blankStateClass(segment.key)]"
                  >
                    <span class="sr-only">{{ fieldLabel(segment.key) }}</span>
                    <input
                        v-model="userAnswers[segment.key]"
                        :aria-label="fieldLabel(segment.key)"
                        :placeholder="fieldPlaceholder(segment.key)"
                        :inputmode="fieldInputmode(segment.key)"
                    />
                    <v-icon v-if="fieldPass(segment.key)" size="16" class="blank-status ok">mdi-check</v-icon>
                    <v-icon v-else-if="fieldHasAnswer(segment.key)" size="16" class="blank-status warn">mdi-alert</v-icon>
                    <small v-if="result" class="blank-feedback">
                      Soll: {{ fieldExpectedValue(segment.key) }}
                    </small>
                  </label>
                </template>
              </div>
            </div>
            <div class="row wrap controls">
              <button class="btn primary" type="button" :disabled="evaluating" @click="evaluate">
                <v-icon size="18">mdi-check</v-icon>
                Check
              </button>
              <button class="btn soft" type="button" @click="clearAnswers">
                <v-icon size="18">mdi-eraser</v-icon>
                Reset
              </button>
              <button class="btn ghost" type="button" @click="fillSolution">
                <v-icon size="18">mdi-auto-fix</v-icon>
                Auto-fill
              </button>
            </div>
            <div v-if="result" class="score">
              <div class="score-num">{{ result.score }}%</div>
              <div class="muted small">
                Fields correct: {{ result.hits }}/{{ activeLesson.fields.length }} · Similarity: {{ Math.round(result.sim * 100) }}%
              </div>
            </div>
            <div v-if="result" class="field-checks">
              <div v-for="field in result.fields" :key="field.key" class="field-check" :class="{ ok: field.pass }">
                <div class="field-name">{{ field.label }}</div>
                <div class="field-answer">{{ field.answer || '—' }}</div>
                <div class="field-expected">Expected: {{ field.expected }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="current" class="lesson-actions">
          <div class="lesson-actions-meta">
            <div v-if="nextLessonMeta" class="muted small">
              Next: {{ nextLessonMeta.lesson.title }} · Lesson {{ nextLessonMeta.position }} of {{ nextLessonMeta.total }}
            </div>
            <div v-else class="muted small">
              Last lesson in this module.
            </div>
          </div>
          <div class="lesson-actions-buttons">
            <button class="btn soft" type="button" @click="repeatLesson">
              <v-icon size="18">mdi-dice-5</v-icon>
              New scenario
            </button>
            <button class="btn primary" type="button" :disabled="!nextLessonMeta" @click="goToNextLesson">
              <v-icon size="18">mdi-arrow-right</v-icon>
              Next lesson
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- PROGRESS -->
    <section v-if="panel==='progress'" class="container" aria-label="Progress">
      <h2 class="h2">Overall progress</h2>
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
        <h3 class="h3">ATC settings</h3>

        <div class="settings">
          <div class="set-row">
            <div class="set-info">
              <span>Browser TTS (Web Speech)</span>
              <small class="muted">Runs offline, starts faster, and saves our API calls.</small>
            </div>
            <v-switch v-model="cfg.tts" color="cyan" hide-details inset/>
          </div>

          <div class="set-row">
            <div class="set-info">
              <span>Audio challenge</span>
              <small class="muted">Hides target text & info until you reveal it manually.</small>
            </div>
            <v-switch v-model="cfg.audioChallenge" color="cyan" hide-details inset/>
          </div>

          <div class="set-row">
            <span>Radio level (1..5)</span>
            <v-slider v-model="cfg.radioLevel" :min="1" :max="5" :step="1" color="cyan" thumb-label/>
          </div>

          <div class="set-row">
            <span>Voice</span>
            <v-text-field v-model="cfg.voice" placeholder="alloy" hide-details density="compact" variant="outlined"/>
          </div>

          <div class="set-row">
            <span>Test TTS</span>
            <div class="row">
              <button class="btn soft" @click="say('Frankfurt Ground, Lufthansa one two three, request taxi.')">
                <v-icon>mdi-volume-high</v-icon>
                Test
              </button>
              <button class="btn ghost" @click="stopAudio">
                <v-icon>mdi-stop</v-icon>
                Stop
              </button>
            </div>
          </div>
        </div>

        <div class="row end">
          <button class="btn soft" @click="showSettings=false">Close</button>
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
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useApi } from '~/composables/useApi'
import { createDefaultLearnConfig } from '~~/shared/learn/config'
import type { LearnConfig, LearnProgress, LearnState } from '~~/shared/learn/config'

definePageMeta({ middleware: 'require-auth' })

type BlankWidth = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

type FrequencyType = 'ATIS' | 'DEL' | 'GND' | 'TWR' | 'DEP' | 'APP' | 'CTR'

type Frequency = {
  type: FrequencyType
  label: string
  value: string
}

type AirportData = {
  icao: string
  name: string
  city: string
  runways: string[]
  stands: string[]
  sids: string[]
  transitions: string[]
  approaches: string[]
  taxi: string[]
  freqs: {
    atis: string
    delivery: string
    ground: string
    tower: string
    departure: string
    approach: string
    center: string
  }
  transLevel: string
}

type AirlineData = {
  code: string
  call: string
}

type Scenario = {
  callsign: string
  airlineCode: string
  airlineCall: string
  radioCall: string
  callsignNato: string
  flightNumber: string
  flightNumberWords: string
  airport: AirportData
  destination: AirportData
  runway: string
  runwayWords: string
  stand: string
  taxiRoute: string
  sid: string
  transition: string
  approach: string
  altitudes: {
    initial: number
    climb: number
    initialWords: string
    climbWords: string
  }
  squawk: string
  squawkWords: string
  qnh: number
  qnhWords: string
  atisCode: string
  atisText: string
  atisSummary: {
    runway: string
    wind: string
    visibility: string
    temperature: string
    dewpoint: string
    qnh: string
  }
  wind: string
  windWords: string
  visibility: string
  visibilityWords: string
  temperature: number
  temperatureWords: string
  dewpoint: number
  dewpointWords: string
  metar: string
  metarSegments: {
    wind: string
    visibility: string
    temp: string
    qnh: string
  }
  readability: number
  readabilityWord: string
  readabilityPhrase: string
  frequencies: Frequency[]
  frequencyWords: Record<FrequencyType, string>
  atisFreq: string
  deliveryFreq: string
  groundFreq: string
  towerFreq: string
  departureFreq: string
  approachFreq: string
  centerFreq: string
  transLevel: string
  remarks: string
}

type LessonField = {
  key: string
  label: string
  expected: (scenario: Scenario) => string
  alternatives?: (scenario: Scenario) => string[]
  threshold?: number
  placeholder?: string
  width?: BlankWidth
  inputmode?: 'text' | 'numeric'
}

type ReadbackSegment =
  | { type: 'text'; text: string | ((scenario: Scenario) => string) }
  | { type: 'field'; key: string; width?: BlankWidth }

type Lesson = {
  id: string
  title: string
  desc: string
  keywords: string[]
  hints: string[]
  fields: LessonField[]
  readback: ReadbackSegment[]
  defaultFrequency?: string
  phrase: (scenario: Scenario) => string
  info: (scenario: Scenario) => string[]
  generate: () => Scenario
}

type ModuleDef = {
  id: string
  title: string
  subtitle: string
  art: string
  lessons: Lesson[]
}

type FieldState = {
  key: string
  label: string
  expected: string
  answer: string
  similarity: number
  pass: boolean
}

type ScoreResult = {
  score: number
  hits: number
  sim: number
  passed: boolean
  fields: FieldState[]
}

const natoMap: Record<string, string> = {
  A: 'Alpha',
  B: 'Bravo',
  C: 'Charlie',
  D: 'Delta',
  E: 'Echo',
  F: 'Foxtrot',
  G: 'Golf',
  H: 'Hotel',
  I: 'India',
  J: 'Juliett',
  K: 'Kilo',
  L: 'Lima',
  M: 'Mike',
  N: 'November',
  O: 'Oscar',
  P: 'Papa',
  Q: 'Quebec',
  R: 'Romeo',
  S: 'Sierra',
  T: 'Tango',
  U: 'Uniform',
  V: 'Victor',
  W: 'Whiskey',
  X: 'X-ray',
  Y: 'Yankee',
  Z: 'Zulu'
}

const atcNumberWords: Record<string, string> = {
  '0': 'zero',
  '1': 'one',
  '2': 'two',
  '3': 'tree',
  '4': 'four',
  '5': 'fife',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'niner'
}

const runwaySuffixWords: Record<string, string> = {
  L: 'left',
  R: 'right',
  C: 'center'
}

const readabilityScale = [
  { level: 1, word: 'one', description: 'Unreadable' },
  { level: 2, word: 'two', description: 'Barely readable' },
  { level: 3, word: 'three', description: 'Readable with difficulty' },
  { level: 4, word: 'four', description: 'Readable' },
  { level: 5, word: 'five', description: 'Perfectly readable' }
]

const airlines: AirlineData[] = [
  { code: 'DLH', call: 'Lufthansa' },
  { code: 'BAW', call: 'Speedbird' },
  { code: 'AFR', call: 'Air France' },
  { code: 'KLM', call: 'KLM' },
  { code: 'SWR', call: 'Swiss' },
  { code: 'EZY', call: 'Easyjet' }
]

const airportsData: AirportData[] = [
  {
    icao: 'EDDF',
    name: 'Frankfurt/Main',
    city: 'Frankfurt',
    runways: ['25C', '25R', '07C', '07R', '18'],
    stands: ['V155', 'A12', 'B24', 'G5', 'H43', 'L21'],
    sids: ['ANEKI 7S', 'TOBAK 5Q', 'OBOKA 6N'],
    transitions: ['ANEKI', 'TOBAK', 'OBOKA'],
    approaches: ['ILS Z 25C', 'ILS Y 07C'],
    taxi: ['N3 U4', 'V A', 'N7 K', 'S V12'],
    freqs: {
      atis: '126.350',
      delivery: '121.900',
      ground: '121.800',
      tower: '118.700',
      departure: '125.350',
      approach: '120.800',
      center: '134.200'
    },
    transLevel: 'FL070'
  },
  {
    icao: 'EDDM',
    name: 'Munich',
    city: 'Munich',
    runways: ['26R', '26L', '08R', '08L'],
    stands: ['211', '214', '302', 'N16', 'H45'],
    sids: ['OBAXA 3S', 'MERSI 6S', 'TULSI 5M'],
    transitions: ['OBAXA', 'MERSI', 'TULSI'],
    approaches: ['ILS Z 26R', 'ILS Y 08R'],
    taxi: ['L4 N3', 'P3 W2', 'S1 D2'],
    freqs: {
      atis: '122.130',
      delivery: '121.775',
      ground: '121.800',
      tower: '118.700',
      departure: '129.050',
      approach: '120.800',
      center: '133.700'
    },
    transLevel: 'FL070'
  },
  {
    icao: 'EHAM',
    name: 'Amsterdam Schiphol',
    city: 'Amsterdam',
    runways: ['24', '36L', '18C', '09'],
    stands: ['D14', 'E22', 'F8', 'H4'],
    sids: ['SUGOL 2S', 'ANDIK 2S', 'ARNEM 2V'],
    transitions: ['SUGOL', 'ANDIK', 'ARNEM'],
    approaches: ['ILS Z 24', 'ILS Y 18C'],
    taxi: ['A5 B2', 'K1 V3', 'W4 S8'],
    freqs: {
      atis: '136.050',
      delivery: '121.800',
      ground: '121.900',
      tower: '119.220',
      departure: '123.875',
      approach: '121.200',
      center: '135.050'
    },
    transLevel: 'FL060'
  }
]

const atisLetters = 'ABCDEFGHJKLMNOPQRSTUVWXYZ'.split('')

function gradientArt(colors: string[]): string {
  const stops = colors
    .map((color, idx) => `<stop offset="${Math.round((idx / Math.max(colors.length - 1, 1)) * 100)}%" stop-color="${color}"/>`)
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient></defs><rect fill="url(#g)" width="400" height="240"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function choice<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFlightNumber(): string {
  const length = Math.random() < 0.5 ? 3 : 4
  let value = ''
  for (let i = 0; i < length; i++) {
    value += String(randInt(0, 9))
  }
  if (value.startsWith('0')) value = '1' + value.slice(1)
  return value
}

function generateSquawk(): string {
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += String(randInt(0, 7))
  }
  return code
}

function digitsToWords(value: string): string {
  return value
    .split('')
    .map(char => atcNumberWords[char] ?? char)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function lettersToNato(value: string): string {
  return value
    .toUpperCase()
    .split('')
    .map(char => natoMap[char] ?? char)
    .join(' ')
}

function runwayToWords(runway: string): string {
  const digits = runway.replace(/[^0-9]/g, '').padStart(2, '0')
  const suffix = runway.replace(/[0-9]/g, '')
  const base = digits
    .split('')
    .map(char => atcNumberWords[char] ?? char)
    .join(' ')
  const suffixWord = suffix ? runwaySuffixWords[suffix] ?? suffix.toLowerCase() : ''
  return suffixWord ? `${base} ${suffixWord}` : base
}

function frequencyToSpeech(freq: string): string {
  const [intPart, decimalPart] = freq.split('.')
  const intWords = digitsToWords(intPart)
  if (!decimalPart) return intWords
  const trimmed = decimalPart.replace(/0+$/, '') || decimalPart
  const decWords = trimmed
    .split('')
    .map(char => atcNumberWords[char] ?? char)
    .join(' ')
  return `${intWords} decimal ${decWords}`
}

function formatTemp(temp: number): string {
  const prefix = temp < 0 ? 'M' : ''
  return `${prefix}${Math.abs(temp).toString().padStart(2, '0')}`
}

function temperatureToWords(temp: number): string {
  const prefix = temp < 0 ? 'minus' : 'plus'
  return `${prefix} ${digitsToWords(Math.abs(temp).toString())}`
}

function qnhToWords(qnh: number): string {
  return digitsToWords(qnh.toString())
}

function windToWords(direction: number, speed: number): string {
  const dir = direction.toString().padStart(3, '0')
  const spd = speed.toString().padStart(2, '0')
  return `${dir
    .split('')
    .map(char => atcNumberWords[char] ?? char)
    .join(' ')} degrees at ${spd
    .split('')
    .map(char => atcNumberWords[char] ?? char)
    .join(' ')} knots`
}

function visibilityToWords(vis: string): string {
  if (vis === '9999') return 'ten kilometres or more'
  const numeric = Number(vis)
  if (!Number.isNaN(numeric)) {
    if (numeric >= 1000) {
      const km = Math.round(numeric / 1000)
      return `${digitsToWords(km.toString())} kilometres`
    }
    return `${digitsToWords(vis)} metres`
  }
  return vis
}

function altitudeToWords(value: number): string {
  const thousands = Math.floor(value / 1000)
  const remainder = value % 1000
  let words = thousands ? `${digitsToWords(thousands.toString())} thousand` : ''
  if (remainder) {
    words = `${words} ${digitsToWords(remainder.toString())}`.trim()
  }
  return words.trim()
}

function createBaseScenario(): Scenario {
  const airport = choice(airportsData)
  const possibleDestinations = airportsData.filter(a => a.icao !== airport.icao)
  const destination = choice(possibleDestinations)
  const airline = choice(airlines)
  const flightNumber = randomFlightNumber()
  const callsign = `${airline.code}${flightNumber}`
  const runway = choice(airport.runways)
  const stand = choice(airport.stands)
  const taxiRoute = choice(airport.taxi)
  const sid = choice(airport.sids)
  const transition = choice(airport.transitions)
  const approach = choice(airport.approaches)
  const altitude = choice([4000, 5000, 6000, 7000])
  const climbAltitude = altitude + 2000
  const squawk = generateSquawk()
  const qnh = randInt(984, 1032)
  const windDirection = randInt(0, 35) * 10
  const windSpeed = randInt(3, 18)
  const windDirectionStr = windDirection.toString().padStart(3, '0')
  const windSpeedStr = windSpeed.toString().padStart(2, '0')
  const visibility = choice(['9999', '9000', '8000', '6000'])
  const cloud = choice(['SKC', 'FEW020', 'SCT025', 'BKN030'])
  const temperature = randInt(-3, 28)
  const dewpoint = Math.max(temperature - randInt(2, 6), -10)
  const atisCode = choice(atisLetters)
  const remarks = choice(['NOSIG', 'BECMG 4000', 'TEMPO -SHRA'])
  const now = new Date()
  const minute = Math.floor(now.getUTCMinutes() / 5) * 5
  const timestamp = `${now.getUTCDate().toString().padStart(2, '0')}${now
    .getUTCHours()
    .toString()
    .padStart(2, '0')}${minute.toString().padStart(2, '0')}Z`
  const metarWindGroup = `${windDirectionStr}${windSpeedStr}KT`
  const tempGroup = `${formatTemp(temperature)}/${formatTemp(dewpoint)}`
  const metar = `${airport.icao} ${timestamp} ${metarWindGroup} ${visibility} ${cloud} ${tempGroup} Q${qnh
    .toString()
    .padStart(4, '0')} ${remarks}`

  const frequencies: Frequency[] = [
    { type: 'ATIS', label: 'ATIS', value: airport.freqs.atis },
    { type: 'DEL', label: 'Delivery', value: airport.freqs.delivery },
    { type: 'GND', label: 'Ground', value: airport.freqs.ground },
    { type: 'TWR', label: 'Tower', value: airport.freqs.tower },
    { type: 'DEP', label: 'Departure', value: airport.freqs.departure },
    { type: 'APP', label: 'Approach', value: airport.freqs.approach },
    { type: 'CTR', label: 'Center', value: airport.freqs.center }
  ]

  const frequencyWords = frequencies.reduce((acc, freq) => {
    acc[freq.type] = frequencyToSpeech(freq.value)
    return acc
  }, {} as Record<FrequencyType, string>)

  const readability = choice(readabilityScale)

  const atisText = `${airport.name} information ${atisCode}, time ${timestamp.slice(2, 4)}${timestamp.slice(4, 6)}, runway ${
    runwayToWords(runway)
  } in use, wind ${windToWords(windDirection, windSpeed)}, visibility ${visibilityToWords(visibility)}, temperature ${temperatureToWords(
    temperature
  )}, dew point ${temperatureToWords(dewpoint)}, QNH ${qnh}, transition level ${airport.transLevel.replace('FL', '')}.`

  return {
    callsign,
    airlineCode: airline.code,
    airlineCall: airline.call,
    radioCall: `${airline.call} ${digitsToWords(flightNumber)}`,
    callsignNato: lettersToNato(airline.code),
    flightNumber,
    flightNumberWords: digitsToWords(flightNumber),
    airport,
    destination,
    runway,
    runwayWords: runwayToWords(runway),
    stand,
    taxiRoute,
    sid,
    transition,
    approach,
    altitudes: {
      initial: altitude,
      climb: climbAltitude,
      initialWords: altitudeToWords(altitude),
      climbWords: altitudeToWords(climbAltitude)
    },
    squawk,
    squawkWords: digitsToWords(squawk),
    qnh,
    qnhWords: qnhToWords(qnh),
    atisCode,
    atisText,
    atisSummary: {
      runway,
      wind: `${windDirectionStr}/${windSpeedStr}`,
      visibility,
      temperature: `${temperature}°C`,
      dewpoint: `${dewpoint}°C`,
      qnh: `QNH ${qnh}`
    },
    wind: `${windDirectionStr}/${windSpeedStr}`,
    windWords: windToWords(windDirection, windSpeed),
    visibility,
    visibilityWords: visibilityToWords(visibility),
    temperature,
    temperatureWords: temperatureToWords(temperature),
    dewpoint,
    dewpointWords: temperatureToWords(dewpoint),
    metar,
    metarSegments: {
      wind: metarWindGroup,
      visibility,
      temp: tempGroup,
      qnh: `Q${qnh.toString().padStart(4, '0')}`
    },
    readability: readability.level,
    readabilityWord: readability.word,
    readabilityPhrase: `Readability ${readability.word}`,
    frequencies,
    frequencyWords,
    atisFreq: airport.freqs.atis,
    deliveryFreq: airport.freqs.delivery,
    groundFreq: airport.freqs.ground,
    towerFreq: airport.freqs.tower,
    departureFreq: airport.freqs.departure,
    approachFreq: airport.freqs.approach,
    centerFreq: airport.freqs.center,
    transLevel: airport.transLevel,
    remarks
  }
}

function norm(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function lev(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = new Array(n + 1).fill(0)
  for (let j = 0; j <= n; j++) dp[j] = j
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const temp = dp[j]
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost)
      prev = temp
    }
  }
  return dp[n]
}

function similarity(a: string, b: string): number {
  if (!a && !b) return 1
  const normA = norm(a)
  const normB = norm(b)
  if (!normA && !normB) return 1
  const distance = lev(normA, normB)
  const maxLen = Math.max(normA.length, normB.length, 1)
  return 1 - distance / maxLen
}

const modules = ref<ModuleDef[]>([
  {
    id: 'normalize',
    title: 'Normalize · Fundamentals',
    subtitle: 'Alphabet, ATIS, METAR & Radio Check',
    art: gradientArt(['#0ea5e9', '#22d3ee', '#0f172a']),
    lessons: [
      {
        id: 'icao-alphabet',
        title: 'ICAO Alphabet & Numbers',
        desc: 'Spell letters and digits clearly',
        keywords: ['Alphabet', 'Numbers', 'Normalize'],
        hints: [
          'Spell each letter with its ICAO name (e.g. Delta, Lima, Hotel).',
          'Use ATC numbers: tree, fower, fife, niner.'
        ],
        fields: [
          {
            key: 'letters',
            label: 'Letters',
            expected: scenario => scenario.callsignNato,
            placeholder: 'Delta Lima Hotel',
            width: 'xl',
            threshold: 0.9
          },
          {
            key: 'digits',
            label: 'Numbers',
            expected: scenario => scenario.flightNumberWords,
            placeholder: 'one two three',
            width: 'lg',
            threshold: 0.88
          }
        ],
        readback: [
          { type: 'text', text: 'Call sign: ' },
          { type: 'field', key: 'letters', width: 'lg' },
          { type: 'text', text: ' · ' },
          { type: 'field', key: 'digits', width: 'md' }
        ],
        defaultFrequency: 'DEL',
        phrase: scenario => `${scenario.callsignNato} ${scenario.flightNumberWords}`,
        info: scenario => [
          `Callsign: ${scenario.callsign}`,
          `Radio call: ${scenario.radioCall}`,
          `ICAO spelling: ${scenario.callsignNato}`,
          `Flight number spoken: ${scenario.flightNumberWords}`
        ],
        generate: createBaseScenario
      },
      {
        id: 'atis',
        title: 'Understand the ATIS',
        desc: 'Extract the identifier and key data from the ATIS',
        keywords: ['ATIS', 'Weather'],
        hints: [
          'Remember the ATIS identifier as a single letter.',
          'Order: runway – wind – visibility – temperature – dew point – QNH.'
        ],
        fields: [
          {
            key: 'atis-code',
            label: 'ATIS',
            expected: scenario => scenario.atisCode,
            alternatives: scenario => [
              scenario.atisCode,
              scenario.atisCode.toLowerCase(),
              `Information ${scenario.atisCode}`
            ],
            placeholder: 'Letter',
            width: 'xs',
            threshold: 0.9
          },
          {
            key: 'atis-runway',
            label: 'Runway',
            expected: scenario => scenario.runway,
            alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
            width: 'sm'
          },
          {
            key: 'atis-wind',
            label: 'Wind',
            expected: scenario => scenario.wind,
            alternatives: scenario => [
              scenario.wind,
              `${scenario.wind}KT`,
              scenario.windWords
            ],
            width: 'md'
          },
          {
            key: 'atis-visibility',
            label: 'Visibility',
            expected: scenario => scenario.atisSummary.visibility,
            alternatives: scenario => [scenario.visibility, scenario.visibilityWords],
            width: 'sm'
          },
          {
            key: 'atis-temp',
            label: 'Temperature',
            expected: scenario => scenario.atisSummary.temperature,
            alternatives: scenario => [scenario.temperatureWords],
            width: 'sm'
          },
          {
            key: 'atis-dew',
            label: 'Dew point',
            expected: scenario => scenario.atisSummary.dewpoint,
            alternatives: scenario => [scenario.dewpointWords],
            width: 'sm'
          },
          {
            key: 'atis-qnh',
            label: 'QNH',
            expected: scenario => scenario.qnh.toString(),
            alternatives: scenario => [`QNH ${scenario.qnh}`, scenario.qnhWords],
            width: 'sm'
          }
        ],
        readback: [
          { type: 'text', text: 'Information ' },
          { type: 'field', key: 'atis-code', width: 'xs' },
          { type: 'text', text: ', runway ' },
          { type: 'field', key: 'atis-runway', width: 'sm' },
          { type: 'text', text: ', wind ' },
          { type: 'field', key: 'atis-wind', width: 'md' },
          { type: 'text', text: ', visibility ' },
          { type: 'field', key: 'atis-visibility', width: 'sm' },
          { type: 'text', text: ', temperature ' },
          { type: 'field', key: 'atis-temp', width: 'sm' },
          { type: 'text', text: ', dew point ' },
          { type: 'field', key: 'atis-dew', width: 'sm' },
          { type: 'text', text: ', QNH ' },
          { type: 'field', key: 'atis-qnh', width: 'sm' }
        ],
        defaultFrequency: 'ATIS',
        phrase: scenario => scenario.atisText,
        info: () => [
          'Note the identifier, runway, wind, visibility, temperature, dew point, and QNH.',
          'Visibility: four digits or 9999 for ≥10 km; QNH as a four-digit value.'
        ],
        generate: createBaseScenario
      },
      {
        id: 'metar',
        title: 'Decode the METAR',
        desc: 'Extract the raw METAR values',
        keywords: ['METAR', 'Weather'],
        hints: [
          'Read the METAR in blocks: wind – visibility – clouds – temperature – QNH.',
          'The temperature block looks like 18/10; negative values start with M.'
        ],
        fields: [
          {
            key: 'metar-wind',
            label: 'Wind',
            expected: scenario => scenario.metarSegments.wind,
            alternatives: scenario => [
              scenario.metarSegments.wind,
              `${scenario.wind.replace('/', '')}KT`,
              scenario.wind
            ],
            width: 'md'
          },
          {
            key: 'metar-vis',
            label: 'Visibility',
            expected: scenario => scenario.metarSegments.visibility,
            alternatives: scenario => [scenario.visibility],
            placeholder: '9999',
            width: 'sm',
            inputmode: 'numeric'
          },
          {
            key: 'metar-temp',
            label: 'Temp/Dew',
            expected: scenario => scenario.metarSegments.temp,
            alternatives: scenario => [
              `${formatTemp(scenario.temperature)}/${formatTemp(scenario.dewpoint)}`
            ],
            width: 'md'
          },
          {
            key: 'metar-qnh',
            label: 'QNH',
            expected: scenario => scenario.metarSegments.qnh,
            alternatives: scenario => [`Q${scenario.qnh}`, scenario.qnh.toString()],
            width: 'sm'
          }
        ],
        readback: [
          { type: 'text', text: 'Wind ' },
          { type: 'field', key: 'metar-wind', width: 'md' },
          { type: 'text', text: ', visibility ' },
          { type: 'field', key: 'metar-vis', width: 'sm' },
          { type: 'text', text: ', temperature ' },
          { type: 'field', key: 'metar-temp', width: 'md' },
          { type: 'text', text: ', QNH ' },
          { type: 'field', key: 'metar-qnh', width: 'sm' }
        ],
        defaultFrequency: 'ATIS',
        phrase: scenario => scenario.metar,
        info: scenario => [
          `METAR: ${scenario.metar}`,
          `Interpretation: Wind ${scenario.metarSegments.wind}, visibility ${scenario.visibilityWords}, temperature ${scenario.temperature}°C, QNH ${scenario.qnh}`
        ],
        generate: createBaseScenario
      },
      {
        id: 'radio-check',
        title: 'Radio Check',
        desc: 'Report readability',
        keywords: ['Ground', 'Comms'],
        hints: [
          'Reply with "Readability" followed by the number.',
          'Always finish the check with your call sign.'
        ],
        fields: [
          {
            key: 'rc-callsign',
            label: 'Callsign',
            expected: scenario => scenario.radioCall,
            alternatives: scenario => [
              scenario.radioCall,
              `${scenario.airlineCall} ${scenario.flightNumber}`,
              scenario.callsign
            ],
            placeholder: 'Lufthansa one two three',
            width: 'lg'
          },
          {
            key: 'rc-readability',
            label: 'Readability',
            expected: scenario => scenario.readabilityWord,
            alternatives: scenario => [scenario.readability.toString(), scenario.readabilityWord],
            placeholder: 'five',
            width: 'sm'
          }
        ],
        readback: [
          { type: 'text', text: 'This is ' },
          { type: 'field', key: 'rc-callsign', width: 'lg' },
          { type: 'text', text: ', readability ' },
          { type: 'field', key: 'rc-readability', width: 'sm' }
        ],
        defaultFrequency: 'GND',
        phrase: scenario => `${scenario.airport.name} Ground, ${scenario.radioCall}, radio check on ${scenario.groundFreq}.`,
        info: scenario => [
          `Frequency: ${scenario.groundFreq} (${scenario.frequencyWords.GND})`,
          `Expected response: Readability ${scenario.readability} (${scenario.readabilityWord})`
        ],
        generate: createBaseScenario
      }
    ]
  },
  {
    id: 'arc',
    title: 'ARC Decision Tree',
    subtitle: 'From clearance call to departure',
    art: gradientArt(['#f97316', '#fb923c', '#0f172a']),
    lessons: [
      {
        id: 'clearance-contact',
        title: 'Delivery: Initial contact',
        desc: 'Contact clearance delivery',
        keywords: ['Delivery', 'Clearance'],
        hints: [
          'Order: unit, call sign, ATIS, destination, stand, request.',
          'Say the ATIS as a single letter.'
        ],
        fields: [
          {
            key: 'cd-atis',
            label: 'ATIS',
            expected: scenario => scenario.atisCode,
            alternatives: scenario => [
              scenario.atisCode,
              scenario.atisCode.toLowerCase(),
              `Information ${scenario.atisCode}`
            ],
            width: 'xs',
            threshold: 0.9
          },
          {
            key: 'cd-dest',
            label: 'Destination',
            expected: scenario => scenario.destination.city,
            alternatives: scenario => [scenario.destination.icao, scenario.destination.name],
            width: 'md'
          },
          {
            key: 'cd-stand',
            label: 'Stand/Gate',
            expected: scenario => scenario.stand,
            width: 'sm'
          }
        ],
        readback: [
          {
            type: 'text',
            text: scenario => `${scenario.airport.city} Delivery, ${scenario.radioCall}, information `
          },
          { type: 'field', key: 'cd-atis', width: 'xs' },
          { type: 'text', text: ', IFR to ' },
          { type: 'field', key: 'cd-dest', width: 'md' },
          { type: 'text', text: ', stand ' },
          { type: 'field', key: 'cd-stand', width: 'sm' },
          { type: 'text', text: ', request clearance.' }
        ],
        defaultFrequency: 'DEL',
        phrase: scenario => `${scenario.airport.city} Delivery, ${scenario.radioCall}, information ${scenario.atisCode}, IFR to ${scenario.destination.city}, stand ${scenario.stand}, request clearance.`,
        info: scenario => [
          `ATIS: ${scenario.atisCode}`,
          `Destination: ${scenario.destination.city} (${scenario.destination.icao})`,
          `Stand/Gate: ${scenario.stand}`
        ],
        generate: createBaseScenario
      },
      {
        id: 'clearance-readback',
        title: 'Clearance Readback',
        desc: 'Read back the clearance in full',
        keywords: ['Delivery', 'Readback'],
        hints: [
          'Remember the order: destination – SID – runway – altitude – squawk.',
          'Speak altitude and squawk digits clearly.'
        ],
        fields: [
          {
            key: 'clr-dest',
            label: 'Destination',
            expected: scenario => scenario.destination.city,
            alternatives: scenario => [scenario.destination.icao, scenario.destination.name],
            width: 'md'
          },
          {
            key: 'clr-sid',
            label: 'SID',
            expected: scenario => scenario.sid,
            width: 'lg'
          },
          {
            key: 'clr-runway',
            label: 'Runway',
            expected: scenario => scenario.runway,
            alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
            width: 'sm'
          },
          {
            key: 'clr-alt',
            label: 'Initial Altitude',
            expected: scenario => scenario.altitudes.initialWords,
            alternatives: scenario => [scenario.altitudes.initial.toString(), `${scenario.altitudes.initial} feet`],
            width: 'md'
          },
          {
            key: 'clr-squawk',
            label: 'Squawk',
            expected: scenario => scenario.squawkWords,
            alternatives: scenario => [scenario.squawk, scenario.squawk.split('').join(' ')],
            width: 'md'
          }
        ],
        readback: [
          { type: 'text', text: scenario => `${scenario.radioCall} cleared ` },
          { type: 'field', key: 'clr-dest', width: 'md' },
          { type: 'text', text: ' via ' },
          { type: 'field', key: 'clr-sid', width: 'lg' },
          { type: 'text', text: ', runway ' },
          { type: 'field', key: 'clr-runway', width: 'sm' },
          { type: 'text', text: ', climb ' },
          { type: 'field', key: 'clr-alt', width: 'md' },
          { type: 'text', text: ', squawk ' },
          { type: 'field', key: 'clr-squawk', width: 'md' }
        ],
        defaultFrequency: 'DEL',
        phrase: scenario => `${scenario.radioCall}, cleared to ${scenario.destination.city} via ${scenario.sid}, runway ${scenario.runway}, climb ${scenario.altitudes.initial} feet, squawk ${scenario.squawk}.`,
        info: scenario => [
          `SID: ${scenario.sid} (${scenario.transition})`,
          `Initial Altitude: ${scenario.altitudes.initial} ft (${scenario.altitudes.initialWords})`,
          `Squawk: ${scenario.squawk} (${scenario.squawkWords})`
        ],
        generate: createBaseScenario
      },
      {
        id: 'pushback',
        title: 'Push & Start Readback',
        desc: 'Acknowledge the pushback clearance',
        keywords: ['Ground', 'Pushback'],
        hints: [
          'Repeat the runway direction and QNH, call sign at the end.',
          'QNH may be just the number or "QNH xxxx".'
        ],
        fields: [
          {
            key: 'push-runway',
            label: 'Runway',
            expected: scenario => scenario.runway,
            alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
            width: 'sm'
          },
          {
            key: 'push-qnh',
            label: 'QNH',
            expected: scenario => scenario.qnh.toString(),
            alternatives: scenario => [`QNH ${scenario.qnh}`, scenario.qnhWords],
            width: 'sm'
          },
          {
            key: 'push-callsign',
            label: 'Callsign',
            expected: scenario => scenario.radioCall,
            alternatives: scenario => [
              scenario.radioCall,
              `${scenario.airlineCall} ${scenario.flightNumber}`,
              scenario.callsign
            ],
            width: 'lg'
          }
        ],
        readback: [
          { type: 'text', text: 'Push and start approved, facing runway ' },
          { type: 'field', key: 'push-runway', width: 'sm' },
          { type: 'text', text: ', QNH ' },
          { type: 'field', key: 'push-qnh', width: 'sm' },
          { type: 'text', text: ', ' },
          { type: 'field', key: 'push-callsign', width: 'lg' }
        ],
        defaultFrequency: 'GND',
        phrase: scenario => `${scenario.radioCall}, push and start approved, facing runway ${scenario.runway}. QNH ${scenario.qnh}.`,
        info: scenario => [
          `Stand/Gate: ${scenario.stand}`,
          `Ground: ${scenario.groundFreq} (${scenario.frequencyWords.GND})`
        ],
        generate: createBaseScenario
      },
      {
        id: 'taxi',
        title: 'Taxi Readback',
        desc: 'Read back the taxi clearance with hold short',
        keywords: ['Ground', 'Taxi'],
        hints: [
          'Repeat the route exactly as received, including the hold short.',
          'Finish with the call sign.'
        ],
        fields: [
          {
            key: 'taxi-runway',
            label: 'Runway',
            expected: scenario => scenario.runway,
            alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
            width: 'sm'
          },
          {
            key: 'taxi-route',
            label: 'Route',
            expected: scenario => scenario.taxiRoute,
            alternatives: scenario => [scenario.taxiRoute, `via ${scenario.taxiRoute}`],
            width: 'lg'
          },
          {
            key: 'taxi-hold',
            label: 'Hold Short',
            expected: scenario => scenario.runway,
            alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
            width: 'sm'
          },
          {
            key: 'taxi-callsign',
            label: 'Callsign',
            expected: scenario => scenario.radioCall,
            alternatives: scenario => [
              scenario.radioCall,
              `${scenario.airlineCall} ${scenario.flightNumber}`,
              scenario.callsign
            ],
            width: 'lg'
          }
        ],
        readback: [
          { type: 'text', text: 'Taxi to runway ' },
          { type: 'field', key: 'taxi-runway', width: 'sm' },
          { type: 'text', text: ' via ' },
          { type: 'field', key: 'taxi-route', width: 'lg' },
          { type: 'text', text: ', holding short runway ' },
          { type: 'field', key: 'taxi-hold', width: 'sm' },
          { type: 'text', text: ', ' },
          { type: 'field', key: 'taxi-callsign', width: 'lg' }
        ],
        defaultFrequency: 'GND',
        phrase: scenario => `${scenario.radioCall}, taxi to runway ${scenario.runway} via ${scenario.taxiRoute}, hold short runway ${scenario.runway}.`,
        info: scenario => [
          `Taxi route: ${scenario.taxiRoute}`,
          `Hold short: ${scenario.runway}`
        ],
        generate: createBaseScenario
      },
      {
        id: 'lineup',
        title: 'Line-up Clearance',
        desc: 'Acknowledge line up and wait',
        keywords: ['Tower', 'Line Up'],
        hints: [
          'Repeat the runway, then say "line up and wait".',
          'Place the call sign at the end.'
        ],
        fields: [
          {
            key: 'lineup-runway',
            label: 'Runway',
            expected: scenario => scenario.runway,
            alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
            width: 'sm'
          },
          {
            key: 'lineup-callsign',
            label: 'Callsign',
            expected: scenario => scenario.radioCall,
            alternatives: scenario => [
              scenario.radioCall,
              `${scenario.airlineCall} ${scenario.flightNumber}`,
              scenario.callsign
            ],
            width: 'lg'
          }
        ],
        readback: [
          { type: 'text', text: 'Runway ' },
          { type: 'field', key: 'lineup-runway', width: 'sm' },
          { type: 'text', text: ', line up and wait, ' },
          { type: 'field', key: 'lineup-callsign', width: 'lg' }
        ],
        defaultFrequency: 'TWR',
        phrase: scenario => `${scenario.radioCall}, line up and wait runway ${scenario.runway}.`,
        info: scenario => [
          `Tower: ${scenario.towerFreq} (${scenario.frequencyWords.TWR})`,
          `Line-up: runway ${scenario.runway}`
        ],
        generate: createBaseScenario
      },
      {
        id: 'takeoff',
        title: 'Takeoff Clearance',
        desc: 'Acknowledge the takeoff clearance',
        keywords: ['Tower', 'Departure'],
        hints: [
          'Order: runway – cleared for takeoff – call sign.',
          'Wind information can be omitted if it was not given.'
        ],
        fields: [
          {
            key: 'tko-runway',
            label: 'Runway',
            expected: scenario => scenario.runway,
            alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
            width: 'sm'
          },
          {
            key: 'tko-callsign',
            label: 'Callsign',
            expected: scenario => scenario.radioCall,
            alternatives: scenario => [
              scenario.radioCall,
              `${scenario.airlineCall} ${scenario.flightNumber}`,
              scenario.callsign
            ],
            width: 'lg'
          }
        ],
        readback: [
          { type: 'text', text: 'Runway ' },
          { type: 'field', key: 'tko-runway', width: 'sm' },
          { type: 'text', text: ', cleared for takeoff, ' },
          { type: 'field', key: 'tko-callsign', width: 'lg' }
        ],
        defaultFrequency: 'TWR',
        phrase: scenario => `${scenario.radioCall}, wind ${scenario.windWords}, runway ${scenario.runway}, cleared for takeoff.`,
        info: scenario => [
          `Tower: ${scenario.towerFreq} (${scenario.frequencyWords.TWR})`,
          `Wind: ${scenario.wind} (${scenario.windWords})`
        ],
        generate: createBaseScenario
      },
      {
        id: 'departure-handoff',
        title: 'Departure Handoff',
        desc: 'Switch to departure',
        keywords: ['Departure', 'Handoff'],
        hints: [
          'Repeat the frequency exactly, either as digits or spoken form.',
          'Append the call sign at the end.'
        ],
        fields: [
          {
            key: 'dep-freq',
            label: 'Frequenz',
            expected: scenario => scenario.departureFreq,
            alternatives: scenario => [
              scenario.departureFreq,
              scenario.departureFreq.replace('.', ''),
              scenario.frequencyWords.DEP
            ],
            width: 'md'
          },
          {
            key: 'dep-callsign',
            label: 'Callsign',
            expected: scenario => scenario.radioCall,
            alternatives: scenario => [
              scenario.radioCall,
              `${scenario.airlineCall} ${scenario.flightNumber}`,
              scenario.callsign
            ],
            width: 'lg'
          }
        ],
        readback: [
          { type: 'text', text: 'Contact departure ' },
          { type: 'field', key: 'dep-freq', width: 'md' },
          { type: 'text', text: ', ' },
          { type: 'field', key: 'dep-callsign', width: 'lg' }
        ],
        defaultFrequency: 'DEP',
        phrase: scenario => `${scenario.radioCall}, contact departure ${scenario.departureFreq}.`,
        info: scenario => [
          `Departure: ${scenario.departureFreq} (${scenario.frequencyWords.DEP})`,
          `Tower handoff after departure.`
        ],
        generate: createBaseScenario
      },
      {
        id: 'departure-checkin',
        title: 'Departure Check-in',
        desc: 'Initial call to departure',
        keywords: ['Departure', 'Check-in'],
        hints: [
          'Address the unit first, then state the call sign.',
          'Repeat the altitude and SID exactly as received.'
        ],
        fields: [
          {
            key: 'depcheck-callsign',
            label: 'Callsign',
            expected: scenario => scenario.radioCall,
            alternatives: scenario => [
              scenario.radioCall,
              `${scenario.airlineCall} ${scenario.flightNumber}`,
              scenario.callsign
            ],
            width: 'lg'
          },
          {
            key: 'depcheck-alt',
            label: 'Altitude',
            expected: scenario => scenario.altitudes.initialWords,
            alternatives: scenario => [
              scenario.altitudes.initialWords,
              scenario.altitudes.initial.toString(),
              `${scenario.altitudes.initial} feet`
            ],
            width: 'md'
          },
          {
            key: 'depcheck-sid',
            label: 'SID',
            expected: scenario => scenario.sid,
            width: 'lg'
          }
        ],
        readback: [
          { type: 'text', text: scenario => `${scenario.airport.city} Departure, ` },
          { type: 'field', key: 'depcheck-callsign', width: 'lg' },
          { type: 'text', text: ', passing ' },
          { type: 'field', key: 'depcheck-alt', width: 'md' },
          { type: 'text', text: ', on SID ' },
          { type: 'field', key: 'depcheck-sid', width: 'lg' }
        ],
        defaultFrequency: 'DEP',
        phrase: scenario => `${scenario.airport.city} Departure, ${scenario.radioCall}, passing ${scenario.altitudes.initialWords}, on SID ${scenario.sid}.`,
        info: scenario => [
          `Initial Altitude: ${scenario.altitudes.initial} ft (${scenario.altitudes.initialWords})`,
          `SID: ${scenario.sid}`
        ],
        generate: createBaseScenario
      },
      {
        id: 'climb-instruction',
        title: 'Climb & Direct',
        desc: 'Read back the climb instruction in full',
        keywords: ['Departure', 'Climb'],
        hints: [
          'Start with "Climb", then the altitude and any direct clearance.',
          'Repeat the call sign at the end.'
        ],
        fields: [
          {
            key: 'climb-alt',
            label: 'Altitude',
            expected: scenario => scenario.altitudes.climbWords,
            alternatives: scenario => [
              scenario.altitudes.climbWords,
              scenario.altitudes.climb.toString(),
              `${scenario.altitudes.climb} feet`
            ],
            width: 'md'
          },
          {
            key: 'climb-direct',
            label: 'Direct',
            expected: scenario => scenario.transition,
            width: 'md'
          },
          {
            key: 'climb-callsign',
            label: 'Callsign',
            expected: scenario => scenario.radioCall,
            alternatives: scenario => [
              scenario.radioCall,
              `${scenario.airlineCall} ${scenario.flightNumber}`,
              scenario.callsign
            ],
            width: 'lg'
          }
        ],
        readback: [
          { type: 'text', text: 'Climb ' },
          { type: 'field', key: 'climb-alt', width: 'md' },
          { type: 'text', text: ', direct ' },
          { type: 'field', key: 'climb-direct', width: 'md' },
          { type: 'text', text: ', ' },
          { type: 'field', key: 'climb-callsign', width: 'lg' }
        ],
        defaultFrequency: 'DEP',
        phrase: scenario => `${scenario.radioCall}, climb ${scenario.altitudes.climb} feet, proceed direct ${scenario.transition}.`,
        info: scenario => [
          `Climb: ${scenario.altitudes.climb} ft (${scenario.altitudes.climbWords})`,
          `Direct to: ${scenario.transition}`
        ],
        generate: createBaseScenario
      },
      {
        id: 'center-handoff',
        title: 'Center Handoff',
        desc: 'Acknowledge the handoff to center',
        keywords: ['Center', 'Handoff'],
        hints: [
          'Repeat the frequency exactly (with or without the decimal point).',
          'Place the call sign at the end.'
        ],
        fields: [
          {
            key: 'ctr-freq',
            label: 'Frequenz',
            expected: scenario => scenario.centerFreq,
            alternatives: scenario => [
              scenario.centerFreq,
              scenario.centerFreq.replace('.', ''),
              scenario.frequencyWords.CTR
            ],
            width: 'md'
          },
          {
            key: 'ctr-callsign',
            label: 'Callsign',
            expected: scenario => scenario.radioCall,
            alternatives: scenario => [
              scenario.radioCall,
              `${scenario.airlineCall} ${scenario.flightNumber}`,
              scenario.callsign
            ],
            width: 'lg'
          }
        ],
        readback: [
          { type: 'text', text: 'Contact center ' },
          { type: 'field', key: 'ctr-freq', width: 'md' },
          { type: 'text', text: ', ' },
          { type: 'field', key: 'ctr-callsign', width: 'lg' }
        ],
        defaultFrequency: 'CTR',
        phrase: scenario => `${scenario.radioCall}, contact center ${scenario.centerFreq}.`,
        info: scenario => [
          `Center: ${scenario.centerFreq} (${scenario.frequencyWords.CTR})`,
          `Next unit: Center`
        ],
        generate: createBaseScenario
      }
    ]
  }
])
const panel = ref<'hub' | 'module' | 'progress'>('hub')
const current = ref<ModuleDef | null>(null)
const activeLesson = ref<Lesson | null>(null)
const scenario = ref<Scenario | null>(null)
const hasSpokenTarget = ref(false)
const pendingAutoSay = ref(false)
const activeFrequency = ref<Frequency | null>(null)
const userAnswers = reactive<Record<string, string>>({})
const result = ref<ScoreResult | null>(null)
const evaluating = ref(false)
const ttsLoading = ref(false)
const audioElement = ref<HTMLAudioElement | null>(null)
const sayCache = new Map<string, string>()
const pendingSayRequests = new Map<string, Promise<string>>()
const audioReveal = ref(true)

const toast = ref({ show: false, text: '' })
const showSettings = ref(false)
const api = useApi()

const isClient = typeof window !== 'undefined'
const defaultCfg = createDefaultLearnConfig()
const cfg = ref<LearnConfig>({ ...defaultCfg })
audioReveal.value = !cfg.value.audioChallenge

const xp = ref(0)
const progress = ref<LearnProgress>({})
const level = computed(() => 1 + Math.floor(xp.value / 300))
const seasonPct = computed(() => Math.min(100, Math.round((xp.value % 1000) / 10)))

const audioContentHidden = computed(() => cfg.value.audioChallenge && !audioReveal.value)

type LearnStateResponse = LearnState

let persistTimer: ReturnType<typeof setTimeout> | null = null
const dirtyState = reactive({ xp: false, progress: false, config: false })
const savingState = ref(false)
const pendingSave = ref(false)

async function loadLearnState() {
  if (!isClient) return

  try {
    const response = await api.get<LearnStateResponse>('/api/learn/state')
    if (response) {
      xp.value = Number.isFinite(response.xp) ? Math.max(0, Math.round(response.xp)) : 0
      progress.value = (response.progress ?? {}) as LearnProgress
      cfg.value = { ...defaultCfg, ...(response.config || {}) }
    } else {
      xp.value = 0
      progress.value = {} as LearnProgress
      cfg.value = { ...defaultCfg }
    }
    dirtyState.xp = false
    dirtyState.progress = false
    dirtyState.config = false
  } catch (err) {
    console.error('Failed to load learn state', err)
    xp.value = 0
    progress.value = {} as LearnProgress
    cfg.value = { ...defaultCfg }
  } finally {
    audioReveal.value = !cfg.value.audioChallenge
  }
}

function schedulePersist(immediate = false) {
  if (!isClient) return
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  if (immediate) {
    void persistLearnState(true)
    return
  }
  persistTimer = setTimeout(() => {
    persistTimer = null
    void persistLearnState()
  }, 800)
}

async function persistLearnState(force = false) {
  if (!isClient) return
  if (!force && !dirtyState.xp && !dirtyState.progress && !dirtyState.config) {
    return
  }
  if (savingState.value) {
    pendingSave.value = true
    return
  }
  savingState.value = true
  pendingSave.value = false

  const payload = {
    xp: Math.max(0, Math.round(xp.value)),
    progress: JSON.parse(JSON.stringify(progress.value)),
    config: { ...cfg.value },
  }

  try {
    await api.put('/api/learn/state', payload)
    dirtyState.xp = false
    dirtyState.progress = false
    dirtyState.config = false
  } catch (err) {
    console.error('Failed to persist learn state', err)
  } finally {
    savingState.value = false
    if (pendingSave.value) {
      pendingSave.value = false
      void persistLearnState()
    }
  }
}

if (isClient) {
  await loadLearnState()
}

const markConfigDirty = () => {
  dirtyState.config = true
  schedulePersist()
}

if (isClient) {
  watch(progress, () => {
    dirtyState.progress = true
    schedulePersist()
  }, { deep: true })
  watch(xp, () => {
    dirtyState.xp = true
    schedulePersist()
  })
  watch(() => cfg.value.tts, markConfigDirty)
  watch(() => cfg.value.audioChallenge, () => {
    markConfigDirty()
    resetAudioReveal()
  })
  watch(() => cfg.value.radioLevel, markConfigDirty)
  watch(() => cfg.value.voice, markConfigDirty)
}

onBeforeUnmount(() => {
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  if (dirtyState.xp || dirtyState.progress || dirtyState.config) {
    void persistLearnState(true)
  }
})

const fieldMap = computed<Record<string, LessonField>>(() => {
  const map: Record<string, LessonField> = {}
  if (activeLesson.value) {
    for (const field of activeLesson.value.fields) {
      map[field.key] = field
    }
  }
  return map
})

const fieldStates = computed<Record<string, FieldState>>(() => {
  const map: Record<string, FieldState> = {}
  if (!activeLesson.value || !scenario.value) return map
  for (const field of activeLesson.value.fields) {
    const expected = field.expected(scenario.value).trim()
    const answer = (userAnswers[field.key] ?? '').trim()
    const alternatives = field.alternatives?.(scenario.value) ?? []
    const options = [expected, ...alternatives].map(norm).filter(Boolean)
    const normalizedAnswer = norm(answer)
    const best = options.length ? Math.max(...options.map(option => similarity(normalizedAnswer, option))) : 0
    const pass = answer ? best >= (field.threshold ?? 0.82) : false
    map[field.key] = {
      key: field.key,
      label: field.label,
      expected,
      answer,
      similarity: answer ? best : 0,
      pass
    }
  }
  return map
})

function resetAudioReveal() {
  audioReveal.value = !cfg.value.audioChallenge
}

function revealAudioContent() {
  audioReveal.value = true
}

function blankSizeClass(key: string, override?: BlankWidth): string {
  const field = fieldMap.value[key]
  const size = (override || field?.width || 'md') as BlankWidth
  return `size-${size}`
}

function blankStateClass(key: string): string {
  const state = fieldStates.value[key]
  if (!state) return ''
  if (state.pass) return 'ok'
  if (state.answer) return 'warn'
  return ''
}

function fieldLabel(key: string): string {
  return fieldMap.value[key]?.label ?? 'Field'
}

function fieldPlaceholder(key: string): string {
  return fieldMap.value[key]?.placeholder ?? '…'
}

function fieldInputmode(key: string): 'text' | 'numeric' {
  return fieldMap.value[key]?.inputmode ?? 'text'
}

function fieldPass(key: string): boolean {
  return Boolean(fieldStates.value[key]?.pass)
}

function fieldHasAnswer(key: string): boolean {
  const state = fieldStates.value[key]
  return Boolean(state && state.answer)
}

function fieldExpectedValue(key: string): string {
  return fieldStates.value[key]?.expected ?? ''
}

const targetPhrase = computed(() => (activeLesson.value && scenario.value ? activeLesson.value.phrase(scenario.value) : ''))
const lessonInfo = computed(() => (activeLesson.value && scenario.value ? activeLesson.value.info(scenario.value) : []))
const sayButtonLabel = computed(() => (hasSpokenTarget.value ? 'Say again' : 'Say'))
const nextLessonMeta = computed(() => {
  if (!current.value || !activeLesson.value) return null
  const lessons = current.value.lessons
  const activeId = activeLesson.value.id
  const idx = lessons.findIndex(lesson => lesson.id === activeId)
  if (idx === -1 || idx >= lessons.length - 1) return null
  const nextLesson = lessons[idx + 1]
  return {
    lesson: nextLesson,
    position: idx + 2,
    total: lessons.length
  }
})

watch(activeLesson, lesson => {
  if (lesson) {
    rollScenario(true)
  } else {
    scenario.value = null
  }
})

watch(scenario, newScenario => {
  hasSpokenTarget.value = false
  if (!newScenario) {
    pendingAutoSay.value = false
  }
})

function queueAutoSay() {
  pendingAutoSay.value = true
  void nextTick(() => {
    attemptAutoSay()
  })
}

function attemptAutoSay() {
  if (!pendingAutoSay.value) return
  const phrase = targetPhrase.value?.trim()
  if (!phrase) {
    pendingAutoSay.value = false
    return
  }
  if (ttsLoading.value) return
  pendingAutoSay.value = false
  void speakTarget(true)
}

async function speakTarget(auto = false) {
  const phrase = targetPhrase.value?.trim()
  if (!phrase) return
  if (ttsLoading.value) return
  if (!auto) {
    pendingAutoSay.value = false
  }
  hasSpokenTarget.value = true
  await say(phrase)
}

watch(ttsLoading, loading => {
  if (!loading) {
    attemptAutoSay()
  }
})

function rollScenario(clear = false) {
  if (!activeLesson.value) return
  pendingAutoSay.value = false
  stopAudio()
  const generated = activeLesson.value.generate()
  scenario.value = generated
  const defaultType = activeLesson.value.defaultFrequency
  activeFrequency.value = generated.frequencies.find(freq => freq.type === (defaultType || 'DEL')) || generated.frequencies[0] || null
  resetAnswers(true)
  resetAudioReveal()
  if (clear) {
    result.value = null
  }
  queueAutoSay()
}

function repeatLesson() {
  rollScenario(true)
}

function goToNextLesson() {
  const meta = nextLessonMeta.value
  if (!meta) return
  activeLesson.value = meta.lesson
}

function setActiveFrequency(freq: Frequency) {
  activeFrequency.value = freq
}

function resetAnswers(clearResult = false) {
  if (!activeLesson.value) return
  const keys = activeLesson.value.fields.map(field => field.key)
  Object.keys(userAnswers).forEach(key => {
    if (!keys.includes(key)) {
      delete userAnswers[key]
    }
  })
  for (const key of keys) {
    userAnswers[key] = ''
  }
  if (clearResult) {
    result.value = null
  }
}

function clearAnswers() {
  resetAnswers(true)
}

function fillSolution() {
  if (!activeLesson.value || !scenario.value) return
  for (const field of activeLesson.value.fields) {
    userAnswers[field.key] = field.expected(scenario.value)
  }
}

function computeScore(): ScoreResult | null {
  if (!activeLesson.value) return null
  const details = activeLesson.value.fields
    .map(field => fieldStates.value[field.key])
    .filter(Boolean) as FieldState[]
  if (!details.length) return null
  const total = details.reduce((sum, item) => sum + item.similarity, 0)
  const hits = details.filter(item => item.pass).length
  const avg = total / details.length
  return {
    score: Math.round(avg * 100),
    hits,
    sim: avg,
    passed: hits === details.length && hits > 0,
    fields: details
  }
}

function evaluate() {
  if (!activeLesson.value || !current.value) return
  evaluating.value = true
  try {
    const summary = computeScore()
    if (!summary) return
    result.value = summary

    const modId = current.value.id
    const lesId = activeLesson.value.id
    if (!progress.value[modId]) progress.value[modId] = {}
    const previous = progress.value[modId][lesId] || { best: 0, done: false }
    const best = Math.max(previous.best || 0, summary.score)
    const passed = summary.passed || summary.score >= 80
    const wasDone = previous.done

    progress.value[modId][lesId] = { best, done: passed }

    let gained = 0
    if (passed && !wasDone) gained += 40
    if (summary.score >= 95 && summary.score > (previous.best || 0)) gained += 15
    if (summary.score >= 80 && summary.score > (previous.best || 0)) gained += 10

    if (gained) {
      xp.value += gained
      toastNow(`+${gained} XP · ${activeLesson.value.title}`)
    }
  } finally {
    evaluating.value = false
  }
}

function isModuleUnlocked(id: string) {
  if (id === 'normalize') return true
  const order = modules.value.findIndex(module => module.id === id)
  const previous = modules.value[order - 1]
  return previous ? pct(previous.id) >= 80 : true
}

function openModule(id: string) {
  current.value = modules.value.find(module => module.id === id) || null
  activeLesson.value = null
  panel.value = 'module'
}

function quickContinue(id: string) {
  openModule(id)
  if (!current.value) return
  const mod = current.value
  const prog = progress.value[mod.id] || {}
  const next = mod.lessons.find(lesson => !(prog[lesson.id]?.done)) || mod.lessons[0]
  activeLesson.value = next
}

function selectLesson(lesson: Lesson) {
  activeLesson.value = lesson
}

function bestScore(modId: string, lesId: string) {
  return progress.value[modId]?.[lesId]?.best || 0
}

function doneCount(modId: string) {
  const module = modules.value.find(item => item.id === modId)
  if (!module) return 0
  const moduleProgress = progress.value[modId] || {}
  return module.lessons.filter(lesson => moduleProgress[lesson.id]?.done).length
}

function pct(modId: string) {
  const module = modules.value.find(item => item.id === modId)
  if (!module) return 0
  return Math.round((doneCount(modId) / module.lessons.length) * 100)
}

function avgScore(modId: string) {
  const module = modules.value.find(item => item.id === modId)
  if (!module) return 0
  const moduleProgress = progress.value[modId] || {}
  const values = module.lessons.map(lesson => moduleProgress[lesson.id]?.best || 0)
  const sum = values.reduce((acc, value) => acc + value, 0)
  return Math.round(sum / (values.length || 1))
}

const dailies = ref([
  { id: 'd1', title: '3 readbacks ≥80%', sub: 'Reward: +50 XP', reward: 50 },
  { id: 'd2', title: 'Start 1 module', sub: 'Reward: +20 XP', reward: 20 },
  { id: 'd3', title: 'Play the target phrase', sub: 'Reward: +10 XP', reward: 10 }
])

function startDaily(daily: { id: string; reward: number; title: string }) {
  xp.value += daily.reward
  toastNow(`Daily: ${daily.title} · +${daily.reward} XP`)
  dailies.value = dailies.value.filter(item => item.id !== daily.id)
}

function toastNow(text: string) {
  toast.value.text = text
  toast.value.show = true
}

function resetAll() {
  if (!isClient) return
  progress.value = {} as LearnProgress
  xp.value = 0
  cfg.value = { ...defaultCfg }
  audioReveal.value = !cfg.value.audioChallenge
  dirtyState.progress = true
  dirtyState.xp = true
  dirtyState.config = true
  schedulePersist(true)
}

const worldTiltStyle = ref<any>({})

function tilt(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const dx = (event.clientX - (rect.left + rect.width / 2)) / rect.width
  const dy = (event.clientY - (rect.top + rect.height / 2)) / rect.height
  worldTiltStyle.value = { transform: `perspective(1200px) rotateX(${dy * -3}deg) rotateY(${dx * 3}deg)` }
}

function buildSayCacheKey(text: string, rate: number): string {
  const voice = cfg.value.voice?.trim().toLowerCase() || 'default'
  const radioLevel = cfg.value.radioLevel
  return `${voice}|${radioLevel}|${rate.toFixed(2)}|${text}`
}

async function requestSayAudio(cacheKey: string, payload: Record<string, unknown>): Promise<string> {
  const pending = pendingSayRequests.get(cacheKey)
  if (pending) {
    return pending
  }

  const request = (async () => {
    const response: any = await api.post('/api/atc/say', payload)
    const audioData = response?.audio
    if (!audioData?.base64) {
      throw new Error('Missing audio data')
    }
    const mime = audioData.mime || 'audio/wav'
    return `data:${mime};base64,${audioData.base64}`
  })()

  pendingSayRequests.set(cacheKey, request)

  try {
    const dataUrl = await request
    sayCache.set(cacheKey, dataUrl)
    return dataUrl
  } finally {
    pendingSayRequests.delete(cacheKey)
  }
}

async function playAudioSource(source: string) {
  const audio = new Audio(source)
  audioElement.value = audio
  audio.onended = () => {
    if (audioElement.value === audio) {
      audioElement.value = null
    }
  }
  audio.onerror = () => {
    if (audioElement.value === audio) {
      audioElement.value = null
    }
  }
  try {
    await audio.play()
  } catch (err) {
    console.error('Audio playback failed', err)
  }
}

async function say(text: string) {
  const trimmed = text?.trim()
  if (!trimmed) return

  const rateBase = 0.9 + (cfg.value.radioLevel - 3) * 0.12
  const normalizedRate = Math.min(1.5, Math.max(0.6, rateBase))

  const hasBrowserTts = cfg.value.tts && typeof window !== 'undefined' && 'speechSynthesis' in window

  stopAudio()

  if (hasBrowserTts) {
    const synth = window.speechSynthesis
    const utterance = new SpeechSynthesisUtterance(trimmed)
    utterance.rate = normalizedRate
    if (cfg.value.voice) {
      const voiceName = cfg.value.voice.toLowerCase()
      const voice = synth.getVoices().find(item => item.name.toLowerCase().includes(voiceName))
      if (voice) utterance.voice = voice
    }
    synth.cancel()
    synth.speak(utterance)
    return
  }

  if (ttsLoading.value) return

  const payload: Record<string, unknown> = {
    text: trimmed,
    level: cfg.value.radioLevel,
    speed: normalizedRate,
    moduleId: current.value?.id || 'learn',
    lessonId: activeLesson.value?.id || null,
    tag: 'learn-target'
  }

  if (cfg.value.voice) {
    payload.voice = cfg.value.voice
  }

  const cacheKey = buildSayCacheKey(trimmed, normalizedRate)

  ttsLoading.value = true

  try {
    let dataUrl = sayCache.get(cacheKey)
    if (!dataUrl) {
      dataUrl = await requestSayAudio(cacheKey, payload)
    }
    await playAudioSource(dataUrl)
  } catch (err) {
    console.error('TTS request failed', err)
  } finally {
    ttsLoading.value = false
  }
}

function stopAudio() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  if (audioElement.value) {
    try {
      audioElement.value.pause()
      audioElement.value.currentTime = 0
    } catch (err) {
      // ignore pause errors
    }
    audioElement.value = null
  }
}

function testBeep() {
  void say('Frankfurt Ground, Lufthansa one two three, request taxi.')
}

onMounted(() => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.getVoices()
  }
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
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px
}

.console-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px
}

.col {
  display: flex;
  flex-direction: column;
  gap: 12px
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
  backdrop-filter: blur(10px);
  border-radius: 12px
}

.target-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start
}

.target-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px
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

  .console-grid {
    grid-template-columns: 1fr
  }

  .stats {
    display: none
  }
}


/* Scenario bar & cloze */
.scenario-bar {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  border-radius: 12px;
}

.scenario-item {
  min-width: 180px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 4%, transparent);
  padding: 10px 12px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.scenario-item.wide {
  flex: 1 1 260px;
}

.scenario-label {
  font-size: 11px;
  letter-spacing: .08em;
  color: var(--t3);
  text-transform: uppercase;
}

.scenario-value {
  font-size: 18px;
  font-weight: 600;
}

.scenario-sub {
  color: var(--t3);
  font-size: 13px;
}

.freq-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.freq-chip {
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 4%, transparent);
  padding: 6px 10px;
  font-size: 12px;
  letter-spacing: .02em;
}

.freq-chip.active {
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
}

.freq-hint {
  margin-top: 4px;
}

.target-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.target-text {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.lesson-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 4%, transparent);
  border-radius: 12px;
}

.lesson-actions-meta {
  flex: 1 1 220px;
  color: var(--t3);
  font-size: 12px;
  line-height: 1.4;
}

.lesson-actions-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.row.wrap {
  flex-wrap: wrap;
}

.controls {
  margin-top: 12px;
}

.readback-panel {
  padding: 16px;
}

.cloze {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  line-height: 1.6;
}

.blank {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  background: color-mix(in srgb, var(--text) 4%, transparent);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
  min-width: 100px;
  vertical-align: middle;
  transition: border-color .2s ease, background .2s ease;
}

.blank input {
  background: transparent;
  border: 0;
  color: var(--text);
  min-width: 60px;
  font-size: 14px;
  outline: none;
}

.blank.size-xs { min-width: 70px; }
.blank.size-sm { min-width: 100px; }
.blank.size-md { min-width: 140px; }
.blank.size-lg { min-width: 190px; }
.blank.size-xl { min-width: 240px; }

.blank.ok {
  border-color: color-mix(in srgb, var(--accent) 50%, transparent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}

.blank.warn {
  border-color: color-mix(in srgb, #f97316 40%, transparent);
}

.blank-status {
  position: absolute;
  top: 6px;
  right: 6px;
}

.blank-status.ok {
  color: var(--accent);
}

.blank-status.warn {
  color: #f97316;
}

.blank-feedback {
  margin-top: 4px;
  font-size: 11px;
  color: var(--t3);
}

.field-checks {
  margin-top: 12px;
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.field-check {
  border: 1px dashed color-mix(in srgb, var(--text) 20%, transparent);
  padding: 10px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--text) 3%, transparent);
}

.field-check.ok {
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
}

.field-name {
  font-size: 12px;
  letter-spacing: .08em;
  color: var(--t3);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.field-answer {
  font-weight: 600;
}

.field-expected {
  font-size: 12px;
  color: var(--t3);
}

.hint.secondary {
  opacity: 0.8;
}

.audio-blur {
  filter: blur(8px);
  pointer-events: none;
  user-select: none;
}

.audio-note {
  margin-top: 6px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.set-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.set-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 70%;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 720px) {
  .scenario-bar {
    flex-direction: column;
  }

  .scenario-item {
    width: 100%;
  }

  .target-text {
    font-size: 16px;
  }
}

</style>
