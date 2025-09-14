<template>
  <div class="scene">
    <!-- TOP BAR (flach, kantig) -->
    <header class="hud" role="banner">
      <nav class="hud-inner" aria-label="Global">
        <div class="hud-left">
          <v-icon size="22" class="text-accent">mdi-airplane-takeoff</v-icon>
          <span class="brand">OpenSquawk</span>
          <span class="sep">|</span>
          <span class="mode">Lernwelt</span>
        </div>
        <div class="hud-right">
          <span class="chip">Lvl {{ level }}</span>
          <span class="chip">{{ xp }} XP</span>
          <button class="btn ghost" @click="panel='progress'"><v-icon size="18">mdi-chart-line</v-icon> Fortschritt</button>
          <button class="btn ghost" @click="showSettings=true"><v-icon size="18">mdi-cog</v-icon> Einstellungen</button>
          <button class="btn ghost" @click="resetAll"><v-icon size="18">mdi-refresh</v-icon> Reset</button>
        </div>
      </nav>
    </header>

    <!-- HERO (MSFS-Anmutung, aber CI-Farben; flach, keine Rundungen/Schatten) -->
    <section class="hero" role="region" aria-label="Intro">
      <div class="container">
        <div class="panel hero-panel" :style="worldTiltStyle" @mousemove="tilt">
          <div class="hero-left">
            <div class="eyebrow">TRAINING</div>
            <h1 class="h1">ATC Lernwelt</h1>
            <p class="muted">Geführte Pfade · Missionen · XP · Achievements. Lokal gespeichert, kein Backend.</p>
            <div class="actions">
              <button class="btn primary" @click="panel='hub'"><v-icon>mdi-play</v-icon> Losfliegen</button>
              <button class="btn ghost" @click="panel='progress'">Fortschritt</button>
            </div>
            <div class="season">
              <div class="bar">
                <div class="fill" :style="{ width: seasonPct + '%' }"></div>
              </div>
              <div class="meta"><span>Season 1 · Ground School</span><span>{{ seasonPct }}%</span></div>
            </div>
          </div>

          <div class="hero-right">
            <div class="rail-title"><v-icon size="18">mdi-calendar-star</v-icon> Daily Challenges</div>
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

    <!-- HUB (MSFS-Kachelmenü; flach/kantig) -->
    <main v-if="panel==='hub'" class="container" role="main">
      <div class="hub-head">
        <h2 class="h2">Mission Hub</h2>
        <div class="muted">Wähle ein Modul – sammle XP, schalte Abzeichen frei.</div>
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
              <div class="tile-title"><v-icon size="18">mdi-flag-checkered</v-icon> {{ m.title }}</div>
              <div class="muted">{{ doneCount(m.id) }}/{{ m.lessons.length }}</div>
            </div>
            <div class="muted small">{{ m.subtitle }}</div>
            <div class="line"><div class="line-fill" :style="{ width: pct(m.id)+'%' }"></div></div>
            <div class="tile-actions">
              <button class="btn primary" :disabled="!isModuleUnlocked(m.id)" @click="openModule(m.id)">
                <v-icon size="18">mdi-play</v-icon> Start
              </button>
              <button class="btn soft" @click="quickContinue(m.id)">Weiter</button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- MODULE -->
    <section v-if="panel==='module' && current" class="container play" aria-label="Modul">
      <div class="play-head">
        <div class="crumbs">
          <button class="link" @click="panel='hub'"><v-icon size="16">mdi-arrow-left</v-icon> Hub</button>
          <span class="muted">/ {{ current.title }}</span>
        </div>
        <div class="stats">
          <span class="stat"><v-icon size="18">mdi-progress-check</v-icon> {{ doneCount(current.id) }}/{{ current.lessons.length }}</span>
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
            <div class="lesson-title"><v-icon size="18">mdi-headset</v-icon> {{ l.title }}</div>
            <div class="chip" :class="{ ok: bestScore(current.id,l.id)>=80 }">
              {{ bestScore(current.id,l.id) ? bestScore(current.id,l.id)+'%' : 'neu' }}
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
          <div class="panel">{{ activeLesson.target }}</div>
          <div class="hints">
            <div v-for="h in activeLesson.hints" :key="h" class="hint">
              <v-icon size="16">mdi-lightbulb-on-outline</v-icon> {{ h }}
            </div>
          </div>
          <div class="row">
            <button class="btn soft" @click="speak(activeLesson.target)"><v-icon>mdi-volume-high</v-icon> Abspielen</button>
            <button class="btn ghost" @click="fillTarget"><v-icon>mdi-auto-fix</v-icon> Autotext</button>
          </div>
        </div>

        <div class="col">
          <div class="label">Deine Readback</div>
          <v-textarea v-model="userInput" rows="4" class="input" placeholder="Tippen (PTT später)"/>
          <div class="row">
            <button class="btn primary" :disabled="evaluating" @click="evaluate"><v-icon>mdi-check</v-icon> Prüfen</button>
            <button class="btn ghost" @click="userInput=''"><v-icon>mdi-eraser</v-icon> Löschen</button>
          </div>

          <div v-if="result" class="score">
            <div class="score-num">{{ result.score }}%</div>
            <div class="muted small">
              Keywords: {{ result.hits }}/{{ activeLesson.keywords.length }} · Ähnlichkeit: {{ Math.round(result.sim*100) }}%
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
              <span class="muted">{{ bestScore(m.id,l.id) ? bestScore(m.id,l.id)+'%' : '—' }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SETTINGS -->
    <v-dialog v-model="showSettings" max-width="720">
      <div class="panel dialog">
        <h3 class="h3">Einstellungen</h3>
        <div class="settings">
          <div class="set-row">
            <span>Browser-TTS</span>
            <v-switch v-model="cfg.tts" color="cyan" hide-details inset />
          </div>
          <div class="set-row">
            <span>Keyword-Gewichtung</span>
            <v-slider v-model="cfg.kwWeight" :min="0" :max="1" :step="0.05" color="cyan" thumb-label />
          </div>
        </div>
        <div class="row end">
          <button class="btn soft" @click="showSettings=false">Schließen</button>
        </div>
      </div>
    </v-dialog>

    <!-- TOAST -->
    <v-snackbar v-model="toast.show" timeout="2200" location="top" color="#22d3ee">
      <v-icon class="mr-2">mdi-trophy</v-icon> {{ toast.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

/** MODULE DATA (dummy, funktionsfähig) **/
type Lesson = { id:string; title:string; desc:string; target:string; hints:string[]; keywords:string[] }
type ModuleDef = { id:string; title:string; subtitle:string; art:string; lessons:Lesson[] }

const modules = ref<ModuleDef[]>([
  {
    id:'basics',
    title:'Basics',
    subtitle:'Callsign · Struktur · Zahlen',
    art:'https://images.unsplash.com/photo-1541392822270-85b2ff6c4577?q=80&w=1600&auto=format&fit=crop',
    lessons:[
      { id:'callsign', title:'Check-in', desc:'Erster Call korrekt.',
        target:'Frankfurt Ground, Lufthansa one two three at stand A12, request taxi.',
        hints:['Station • Callsign • Position • Intent'], keywords:['Frankfurt Ground','Lufthansa','stand','request taxi'] },
      { id:'readback', title:'Short Readback', desc:'Kurz bestätigen.',
        target:'Lufthansa one two three, roger.',
        hints:['Callsign + roger/affirm'], keywords:['roger','affirm'] }
    ]
  },
  {
    id:'ground',
    title:'Ground',
    subtitle:'Taxi • Hold Short • Handoff',
    art:'https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?q=80&w=1600&auto=format&fit=crop',
    lessons:[
      { id:'taxi1', title:'Taxi-Clearance', desc:'Via A, A5, B2.',
        target:'Lufthansa one two three, taxi to runway two five via A, A five, B two, hold short runway two five.',
        hints:['Taxi to runway • via • hold short'], keywords:['taxi to runway','via','hold short'] },
      { id:'handoff', title:'Handoff', desc:'Frequenzwechsel.',
        target:'Contact Tower on one one niner decimal five, Lufthansa one two three.',
        hints:['Contact Tower on … • decimal'], keywords:['Contact Tower','decimal'] }
    ]
  },
  {
    id:'departure',
    title:'Departure',
    subtitle:'Line up • Takeoff',
    art:'https://images.unsplash.com/photo-1494412685616-a5d310fbb07d?q=80&w=1600&auto=format&fit=crop',
    lessons:[
      { id:'lineup', title:'Line up', desc:'Aufrollen und warten.',
        target:'Lufthansa one two three, line up and wait runway two five.',
        hints:['line up and wait'], keywords:['line up and wait'] }
    ]
  },
  {
    id:'arrival',
    title:'Arrival',
    subtitle:'Approach • Vacate',
    art:'https://images.unsplash.com/photo-1542089363-07b2d92aacc3?q=80&w=1600&auto=format&fit=crop',
    lessons:[
      { id:'vacate', title:'Vacate', desc:'Verlasse Bahn, melde frei.',
        target:'Lufthansa one two three, vacated runway two five via A six.',
        hints:['vacated runway • via taxiway'], keywords:['vacated','runway'] }
    ]
  },
  {
    id:'vatsim',
    title:'VATSIM',
    subtitle:'Netiquette • Connect',
    art:'https://images.unsplash.com/photo-1508264769638-658b34d79f6e?q=80&w=1600&auto=format&fit=crop',
    lessons:[
      { id:'checkin', title:'IFR Check-in', desc:'Erster Online-Call.',
        target:'Frankfurt Ground, Lufthansa one two three, A320 at stand A12, IFR to Munich, information Bravo, request clearance.',
        hints:['IFR/VFR • ATIS Info • Request'], keywords:['IFR','information','request clearance'] }
    ]
  }
])

/** STATE **/
const panel = ref<'hub'|'module'|'progress'>('hub')
const current = ref<ModuleDef|null>(null)
const activeLesson = ref<Lesson|null>(null)
const userInput = ref('')

const toast = ref({ show:false, text:'' })
const showSettings = ref(false)
const cfg = ref({ tts:true, kwWeight:0.6 })

// Gamification
const xp = ref( Number(localStorage.getItem('os_xp')||'0') )
const level = computed(()=> 1 + Math.floor(xp.value / 300))
const seasonPct = computed(()=> Math.min(100, Math.round((xp.value % 1000)/10)))

type Prog = Record<string, Record<string,{best:number;done:boolean}>>
const progress = ref<Prog>( JSON.parse(localStorage.getItem('os_progress')||'{}') )

watch(progress, v => localStorage.setItem('os_progress', JSON.stringify(v)), { deep:true })
watch(xp, v => localStorage.setItem('os_xp', String(v)) )
watch(cfg, v => localStorage.setItem('os_cfg', JSON.stringify(v)), { deep:true })

/** HUB / FLOW **/
function isModuleUnlocked(id:string){
  if (id==='basics') return true
  const order = modules.value.findIndex(m=>m.id===id)
  const prev = modules.value[order-1]
  return pct(prev.id) >= 80
}
function openModule(id:string){
  current.value = modules.value.find(m=>m.id===id) || null
  activeLesson.value = null
  panel.value = 'module'
}
function quickContinue(id:string){
  openModule(id)
  const m = current.value!
  const mp = progress.value[m.id] || {}
  const next = m.lessons.find(l => !(mp[l.id]?.done))
  activeLesson.value = next || m.lessons[0]
}
function selectLesson(l:Lesson){ activeLesson.value = l; userInput.value='' }

function bestScore(modId:string, lesId:string){ return progress.value[modId]?.[lesId]?.best || 0 }
function doneCount(modId:string){
  const m = modules.value.find(x=>x.id===modId); if(!m) return 0
  const mp = progress.value[modId] || {}
  return m.lessons.filter(l => mp[l.id]?.done).length
}
function pct(modId:string){
  const m = modules.value.find(x=>x.id===modId); if(!m) return 0
  return Math.round(doneCount(modId)/m.lessons.length*100)
}
function avgScore(modId:string){
  const m = modules.value.find(x=>x.id===modId); if(!m) return 0
  const mp = progress.value[modId] || {}
  const arr = m.lessons.map(l => mp[l.id]?.best || 0)
  const s = arr.reduce((a,b)=>a+b,0)
  return Math.round(s/(arr.length||1))
}

/** EVALUATION (flach, schnell) **/
const evaluating = ref(false)
const result = ref<{score:number, sim:number, hits:number}|null>(null)
function norm(s:string){ return s.toLowerCase().replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim() }
function lev(a:string,b:string){
  const m=a.length,n=b.length; if(!m) return n; if(!n) return m
  const dp=new Array(n+1).fill(0); for(let j=0;j<=n;j++) dp[j]=j
  for(let i=1;i<=m;i++){ let p=dp[0]; dp[0]=i
    for(let j=1;j<=n;j++){ const t=dp[j]; const c=a[i-1]===b[j-1]?0:1; dp[j]=Math.min(dp[j]+1, dp[j-1]+1, p+c); p=t }
  } return dp[n]
}
function sim(a:string,b:string){ const A=norm(a), B=norm(b); const d=lev(A,B); const M=Math.max(A.length,B.length)||1; return 1 - d/M }
function hits(text:string,kws:string[]){ const T=norm(text); return kws.reduce((s,k)=> s + (T.includes(norm(k))?1:0),0) }

async function evaluate(){
  if(!current.value || !activeLesson.value) return
  evaluating.value = true
  await new Promise(r=>setTimeout(r,180))
  const s = sim(userInput.value, activeLesson.value.target)
  const h = hits(userInput.value, activeLesson.value.keywords)
  const kwScore = activeLesson.value.keywords.length ? (h/activeLesson.value.keywords.length) : 1
  const score = Math.round(((kwScore*cfg.value.kwWeight) + (s*(1-cfg.value.kwWeight))) * 100)
  result.value = { score, sim:s, hits:h }

  const modId = current.value.id, lesId = activeLesson.value.id
  if (!progress.value[modId]) progress.value[modId] = {}
  const prev = progress.value[modId][lesId]?.best || 0
  const best = Math.max(prev, score)
  const passedBefore = progress.value[modId][lesId]?.done || false
  progress.value[modId][lesId] = { best, done: best>=80 }

  // XP
  let gained = 0
  if (best>=80 && !passedBefore) gained += 40
  if (score>=95) gained += 15
  if (score>=80 && userInput.value.length <= activeLesson.value.target.length+8) gained += 10
  if (gained){ xp.value += gained; toastNow(`+${gained} XP · ${activeLesson.value.title}`) }

  evaluating.value = false
}

/** AUDIO **/
function speak(t:string){ if(!cfg.value.tts) return; const u=new SpeechSynthesisUtterance(t); u.rate=.95; u.pitch=1; speechSynthesis.cancel(); speechSynthesis.speak(u) }
function fillTarget(){ if(activeLesson.value) userInput.value = activeLesson.value.target }

/** DAILIES **/
const dailies = ref([
  { id:'d1', title:'3 Readbacks ≥80%', sub:'Belohnung: +50 XP', reward:50 },
  { id:'d2', title:'1 Modul starten', sub:'Belohnung: +20 XP', reward:20 },
  { id:'d3', title:'Zielphrase abspielen', sub:'Belohnung: +10 XP', reward:10 }
])
function startDaily(d:{id:string;reward:number;title:string}){ xp.value += d.reward; toastNow(`Daily: ${d.title} · +${d.reward} XP`); dailies.value = dailies.value.filter(x=>x.id!==d.id) }

/** UI helpers **/
function toastNow(t:string){ toast.value.text=t; toast.value.show=true }
function resetAll(){ localStorage.clear(); location.reload() }

/** MSFS-Tilt ohne Shadow/Radius **/
const worldTiltStyle = ref<any>({})
function tilt(e:MouseEvent){
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const dx = (e.clientX - (rect.left + rect.width/2)) / rect.width
  const dy = (e.clientY - (rect.top + rect.height/2)) / rect.height
  worldTiltStyle.value = { transform:`perspective(1200px) rotateX(${dy*-3}deg) rotateY(${dx*3}deg)` }
}
</script>

<style scoped>
/* === CI TOKENS (aus deinem CI-Dokument) === */
:root{
  --bg: #0b1020;              /* --brand.bg */
  --bg2: #0a0f1c;             /* --brand.bg-2 */
  --accent: #22d3ee;          /* --brand.accent */
  --accent2: #0ea5e9;         /* --brand.accent-2 */
  --text: #ffffff;            /* --brand.text */
  --t2: rgba(255,255,255,.80);/* --brand.text-2 */
  --t3: rgba(255,255,255,.60);/* --brand.text-3 */
  --border: rgba(255,255,255,.10); /* --brand.border */
}

/* === BASICS (kantig: keine Rundungen, keine Schatten) === */
.scene{ min-height:100vh; background: var(--bg); color: var(--text); }
.container{ max-width:1200px; margin:0 auto; padding: 20px; }
.h1{ font-size: clamp(32px, 5vw, 48px); font-weight:600; line-height:1.2 }
.h2{ font-size: clamp(24px, 3.5vw, 32px); font-weight:600; line-height:1.25 }
.h3{ font-size: 20px; font-weight:600 }
.muted{ color: var(--t3) }
.small{ font-size: 13px }
.strong{ font-weight:600 }

/* HUD */
.hud{ position:sticky; top:0; z-index:40; border-bottom:1px solid var(--border); background: color-mix(in srgb, var(--bg) 85%, transparent); }
.hud-inner{ display:flex; align-items:center; justify-content:space-between; padding:10px 20px; }
.hud-left{ display:flex; align-items:center; gap:10px; }
.brand{ font-weight:600 }
.mode{ color: var(--t2) }
.sep{ color: var(--t3) }
.hud-right{ display:flex; gap:8px; align-items:center; }
.text-accent{ color: var(--accent) }

/* Hero */
.hero{ background:
    radial-gradient(800px 400px at 80% -10%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 60%),
    radial-gradient(600px 300px at 10% -5%, color-mix(in srgb, var(--accent2) 15%, transparent), transparent 60%),
    linear-gradient(180deg, var(--bg) 0%, var(--bg) 60%, var(--bg2) 100%);
  padding: 18px 0 8px;
}
.hero-panel{ display:grid; grid-template-columns: 1.1fr .9fr; gap:20px; border:1px solid var(--border); background: color-mix(in srgb, var(--text) 6%, transparent); padding:20px; transform-style:preserve-3d; }
.hero-left .eyebrow{ font-size:12px; letter-spacing:.16em; color: var(--t3) }
.actions{ display:flex; gap:10px; margin-top:12px }
.season{ margin-top:14px }
.bar{ height:8px; background: color-mix(in srgb, var(--text) 8%, transparent); border:1px solid var(--border) }
.fill{ height:100%; background: linear-gradient(90deg, var(--accent), var(--accent2)) }
.meta{ display:flex; justify-content:space-between; margin-top:6px; color: var(--t3); font-size:12px }

.hero-right .rail-title{ color: var(--t3); display:flex; align-items:center; gap:6px; margin-bottom:6px }
.rail{ display:flex; gap:10px; overflow:auto }
.card{ border:1px solid var(--border); background: color-mix(in srgb, var(--text) 6%, transparent); padding:12px; min-width:240px }
.card-head{ display:flex; justify-content:space-between; align-items:center }
.badge{ border:1px solid var(--border); padding:2px 6px; font-size:12px; color: var(--t2) }
.card-title{ font-weight:600; margin:6px 0 2px }

/* Buttons (kantig) */
.btn{ display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border:1px solid var(--border); background: color-mix(in srgb, var(--text) 6%, transparent); color: var(--text); font-weight:600 }
.btn:hover{ background: color-mix(in srgb, var(--text) 10%, transparent) }
.btn.primary{ background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 90%, transparent), color-mix(in srgb, var(--accent) 70%, transparent)); color:#061318; border-color: color-mix(in srgb, var(--accent) 60%, transparent) }
.btn.soft{ background: color-mix(in srgb, var(--text) 8%, transparent) }
.btn.ghost{ background: transparent }
.btn.mini{ padding:6px 10px; font-size:12px }
.chip{ display:inline-flex; align-items:center; padding:6px 10px; border:1px solid var(--border); background: color-mix(in srgb, var(--text) 6%, transparent); font-size:12px }

/* HUB tiles */
.hub-head{ margin: 6px 0 10px }
.tiles{ display:grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap:12px }
.tile{ border:1px solid var(--border); background: color-mix(in srgb, var(--text) 6%, transparent); display:flex; flex-direction:column }
.tile.locked{ filter:saturate(.7) brightness(.9) }
.tile-media{ height:140px; background-size:cover; background-position:center }
.tile-body{ padding:12px }
.tile-top{ display:flex; justify-content:space-between; align-items:center; margin-bottom:4px }
.tile-title{ font-weight:600; display:flex; align-items:center; gap:6px }
.line{ height:8px; border:1px solid var(--border); background: color-mix(in srgb, var(--text) 8%, transparent) }
.line-fill{ height:100%; background: linear-gradient(90deg, var(--accent), var(--accent2)) }
.tile-actions{ display:flex; gap:8px; margin-top:10px }

/* Play */
.play .play-head{ display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:10px }
.crumbs{ display:flex; align-items:center; gap:8px }
.link{ background:transparent; border:0; color: var(--text); display:inline-flex; align-items:center; gap:6px }
.stats{ display:flex; gap:8px }
.stat{ border:1px solid var(--border); padding:6px 10px; background: color-mix(in srgb, var(--text) 6%, transparent) }

.lesson-grid{ display:grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap:10px }
.lesson{ text-align:left; border:1px solid var(--border); padding:12px; background: color-mix(in srgb, var(--text) 5%, transparent); cursor:pointer }
.lesson.active{ outline:1px solid color-mix(in srgb, var(--accent) 50%, transparent) }
.lesson.ok{ border-color: color-mix(in srgb, #4caf50 60%, transparent) }
.lesson-top{ display:flex; justify-content:space-between; align-items:center }
.tags{ display:flex; flex-wrap:wrap; gap:6px; margin-top:8px }
.tag{ border:1px dashed color-mix(in srgb, var(--text) 25%, transparent); color: var(--t3); font-size:11px; padding:2px 6px }

.console{ display:grid; grid-template-columns: 1.1fr .9fr; gap:12px; margin-top:12px }
.col .label{ font-size:12px; letter-spacing:.12em; color: var(--t3); margin-bottom:6px }
.panel{ border:1px solid var(--border); background: color-mix(in srgb, var(--text) 6%, transparent); padding:12px }
.row{ display:flex; gap:8px; margin-top:8px }
.row.between{ justify-content:space-between }
.row.end{ justify-content:flex-end }
.input :deep(textarea){ background: color-mix(in srgb, var(--text) 6%, transparent); border:1px solid var(--border); color: var(--text) }
.score{ margin-top:8px }
.score-num{ font-size:28px; font-weight:700 }

/* Progress */
.progress-grid{ display:grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap:12px; margin-top:10px }
.list{ margin-top:8px }
.list-row{ display:flex; justify-content:space-between; border-bottom:1px dashed color-mix(in srgb, var(--text) 12%, transparent); padding:8px 0 }
.list-row:last-child{ border-bottom:0 }

/* Responsive */
@media (max-width: 980px){
  .hero-panel{ grid-template-columns:1fr; }
  .console{ grid-template-columns:1fr; }
  .stats{ display:none }
}
</style>

<!-- am Ende der Datei -->

<!-- GLOBAL: CI-Tokens + Body -->
<style>
</style>

<!-- SCOPED: Komponenten-Styles (ohne :root) -->
<style scoped>
/* alles wie zuvor, aber ohne :root – beginnt z.B. mit: */
.scene{ min-height:100vh; background: var(--bg); color: var(--text); }
.container{ max-width:1200px; margin:0 auto; padding:20px; }
/* … rest deines Styles unverändert … */

</style>
