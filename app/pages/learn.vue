<template>
  <div class="bg-[#0b1020] text-white antialiased selection:bg-cyan-400/30">
    <!-- NAV -->
    <header class="sticky top-0 z-50 bg-[#0b1020]/70 backdrop-blur border-b border-white/10" data-aos="fade-down">
      <nav class="container-outer py-3 flex items-center justify-between">
        <NuxtLink to="#" class="flex items-center gap-2 font-semibold tracking-tight">
          <v-icon icon="mdi-radar" size="28" class="text-cyan-400" />
          <span>OpenSquawk</span>
        </NuxtLink>
        <div class="hidden md:flex gap-6 text-sm">
          <a href="#overview" @click.prevent="panel='overview'" class="hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded">Übersicht</a>
          <a href="#learn" @click.prevent="panel='module'; openFirstUnfinished(activeModule?.id || modules[0].id)" class="hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded">Lernpfad</a>
          <a href="#progress" @click.prevent="panel='progress'" class="hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded">Fortschritt</a>
          <a href="#settings" @click.prevent="panel='settings'" class="hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded">Einstellungen</a>
        </div>
        <div class="flex items-center gap-2">
          <NuxtLink to="#cta" class="btn btn-primary text-sm">Starten</NuxtLink>
          <button class="btn btn-ghost text-sm" @click="resetProgress"><v-icon icon="mdi-restore" />Reset</button>
        </div>
      </nav>
    </header>

    <!-- HERO / INTRO -->
    <section class="gradient-hero relative overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute -top-24 right-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div class="container-outer pt-12 pb-10 md:pt-20 md:pb-16">
        <div class="max-w-2xl" data-aos="fade-up">
          <span class="chip mb-4">Lernpfad · Basics → VATSIM</span>
          <h1 class="text-4xl md:text-5xl font-semibold leading-tight">ATC verstehen – in klaren Schritten</h1>
          <p class="mt-4 text-white/80">Geführter Lernmodus mit Scoring, Readback-Check, lokalem Fortschritt. Kein Backend nötig.</p>
          <div class="flex flex-col sm:flex-row gap-3 mt-6">
            <a href="#learn" @click.prevent="panel='overview'" class="btn btn-primary">Loslegen</a>
            <a href="#progress" @click.prevent="panel='progress'" class="btn btn-ghost">Fortschritt ansehen</a>
          </div>
        </div>
      </div>
    </section>

    <!-- MAIN -->
    <main class="py-12 md:py-16">
      <div class="container-outer">
        <!-- OVERVIEW -->
        <section v-show="panel==='overview'" id="overview" data-aos="fade-up">
          <div class="max-w-2xl mb-6">
            <h2 class="text-3xl md:text-4xl font-semibold">Module</h2>
            <p class="text-white/80 mt-2">Basics, Ground, Departure, Arrival, VATSIM.</p>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="m in modules" :key="m.id" class="card" data-aos="fade-up" :data-aos-delay="m.order*60">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <v-icon icon="mdi-school" />
                  <div>
                    <div class="text-lg font-semibold">{{ m.title }}</div>
                    <div class="text-white/70 text-sm">{{ m.subtitle }}</div>
                  </div>
                </div>
                <div class="text-xs text-white/60">{{ moduleDoneCount(m.id) }}/{{ m.lessons.length }}</div>
              </div>
              <p class="text-white/80 mt-3 text-sm">{{ m.desc }}</p>
              <div class="mt-4">
                <v-progress-linear :model-value="moduleProgressPct(m.id)" height="10" rounded color="cyan" />
                <div class="text-xs text-white/60 mt-1">{{ moduleProgressPct(m.id) }}% abgeschlossen</div>
              </div>
              <div class="mt-4 flex gap-2">
                <button class="btn btn-primary" @click="openModule(m.id)"><v-icon icon="mdi-play" />Öffnen</button>
                <button class="btn btn-ghost" @click="openFirstUnfinished(m.id)">Weitermachen</button>
              </div>
            </div>
          </div>
        </section>

        <!-- MODULE -->
        <section v-show="panel==='module' && activeModule" id="learn" data-aos="fade-up">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-2xl md:text-3xl font-semibold">{{ activeModule?.title }}</h2>
              <p class="text-white/70">{{ activeModule?.subtitle }}</p>
            </div>
            <div class="min-w-[220px]">
              <div class="text-xs mb-1 text-white/60">Fortschritt</div>
              <v-progress-linear :model-value="moduleProgressPct(activeModule!.id)" height="10" rounded color="cyan" />
              <div class="text-xs mt-1 text-white/60">
                {{ moduleDoneCount(activeModule!.id) }}/{{ activeModule!.lessons.length }} · Ø {{ avgModuleScore(activeModule!.id) }}%
              </div>
            </div>
          </div>

          <!-- Lessons list -->
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <div v-for="l in activeModule!.lessons" :key="l.id" class="card hover:ring-1 hover:ring-cyan-400/40 transition">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <v-icon icon="mdi-headset" />
                  <div class="font-semibold">{{ l.title }}</div>
                </div>
                <span class="chip" :class="lessonState(l).done ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200' : ''">
                  {{ lessonState(l).done ? 'fertig' : 'neu' }}
                </span>
              </div>
              <p class="text-white/80 text-sm mt-2">{{ l.desc }}</p>
              <ul class="mt-3 text-white/70 text-sm list-disc list-inside">
                <li v-for="k in l.keywords" :key="k">Keyword: <span class="text-white">{{ k }}</span></li>
              </ul>
              <div class="mt-2 text-xs text-white/60">Ziel: <span class="text-white/80">{{ l.target }}</span></div>

              <div class="mt-4 flex gap-2">
                <button class="btn btn-primary" @click="startLesson(l)"><v-icon icon="mdi-play" />Üben</button>
                <button class="btn btn-ghost" @click="fillWithTarget(l)"><v-icon icon="mdi-auto-fix" />Autotext</button>
              </div>

              <div v-if="lessonState(l).bestScore" class="mt-3 text-xs text-white/60">
                Bester Score: <b>{{ lessonState(l).bestScore }}%</b>
              </div>
            </div>
          </div>

          <!-- Active Lesson -->
          <div v-if="activeLesson" class="card mt-8">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <v-icon icon="mdi-clipboard-text-outline" />
                <div>
                  <div class="text-xl font-semibold">{{ activeLesson.title }}</div>
                  <div class="text-white/70 text-sm">{{ activeLesson.desc }}</div>
                </div>
              </div>
              <button class="btn btn-ghost" @click="activeLesson=null"><v-icon icon="mdi-close" /></button>
            </div>

            <div class="grid md:grid-cols-2 gap-6 mt-4">
              <div>
                <div class="text-xs text-white/60 mb-1">Zielphrase</div>
                <div class="glass rounded-xl p-3 leading-6 border border-white/10">{{ activeLesson.target }}</div>

                <div class="mt-4 text-xs text-white/60 mb-1">Hinweise</div>
                <ul class="text-sm text-white/80 list-disc list-inside">
                  <li v-for="hint in activeLesson.hints" :key="hint">{{ hint }}</li>
                </ul>
              </div>

              <div>
                <div class="text-xs text-white/60 mb-1">Deine Antwort</div>
                <v-textarea
                    v-model="userInput"
                    auto-grow
                    placeholder="MVP: tippen (PTT später)."
                    class="bg-white/5 rounded-xl border border-white/10"
                    color="cyan"
                    rows="3"
                />
                <div class="flex items-center gap-2 mt-2">
                  <button class="btn btn-primary" :disabled="evaluating" @click="evaluate(activeLesson)">
                    <v-icon icon="mdi-check" /> Prüfen
                  </button>
                  <button class="btn btn-ghost" @click="userInput=''"><v-icon icon="mdi-eraser" /> Löschen</button>
                  <button class="btn btn-ghost" @click="speak(activeLesson.target)"><v-icon icon="mdi-volume-high" /> Abspielen</button>
                </div>

                <div v-if="lastResult" class="mt-4">
                  <div class="text-xs text-white/60 mb-1">Ergebnis</div>
                  <div class="glass rounded-xl p-3 border border-white/10">
                    <div class="text-lg font-semibold">{{ lastResult.score }}%</div>
                    <div class="text-white/80 text-sm mt-1">{{ feedbackText(lastResult.score) }}</div>
                    <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div class="p-2 bg-white/5 rounded-lg border border-white/10">
                        Keyword-Treffer: <span class="font-semibold">{{ lastResult.keywordHits }}/{{ activeLesson.keywords.length }}</span>
                      </div>
                      <div class="p-2 bg-white/5 rounded-lg border border-white/10">
                        Ähnlichkeit: <span class="font-semibold">{{ Math.round(lastResult.similarity*100) }}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        <!-- PROGRESS -->
        <section v-show="panel==='progress'" id="progress" data-aos="fade-up">
          <h2 class="text-2xl md:text-3xl font-semibold">Fortschritt</h2>
          <p class="text-white/80">Alle Scores nach Modul/Lektion.</p>

          <div class="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="m in modules" :key="m.id" class="card">
              <div class="flex items-center justify-between">
                <div class="font-semibold">{{ m.title }}</div>
                <span class="chip">{{ moduleProgressPct(m.id) }}%</span>
              </div>
              <div class="mt-3 space-y-2">
                <div v-for="l in m.lessons" :key="l.id" class="flex items-center justify-between text-sm py-2 border-b border-white/10 last:border-0">
                  <div>{{ l.title }}</div>
                  <div class="text-white/70">{{ bestScoreByIds(m.id,l.id) ? bestScoreByIds(m.id,l.id)+'%' : '—' }}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- SETTINGS -->
        <section v-show="panel==='settings'" id="settings" data-aos="fade-up">
          <h2 class="text-2xl md:text-3xl font-semibold">Einstellungen</h2>
          <div class="grid md:grid-cols-2 gap-6 mt-4">
            <div class="card">
              <div class="font-semibold">Audio</div>
              <div class="mt-3 flex items-center justify-between">
                <span class="text-white/80">Browser-TTS für Zielphrasen</span>
                <v-switch v-model="settings.tts" color="cyan" hide-details inset />
              </div>
              <div class="text-xs text-white/60 mt-2">Web Speech API; Stimme browserabhängig.</div>
            </div>
            <div class="card">
              <div class="font-semibold">Bewertung</div>
              <div class="mt-3">
                <label class="text-sm text-white/80">Gewichtung Keywords vs. Ähnlichkeit</label>
                <v-slider v-model="settings.keywordWeight" :min="0" :max="1" :step="0.05" color="cyan" thumb-label />
                <div class="text-xs text-white/60">0 = nur Ähnlichkeit, 1 = nur Keywords. Standard 0.6.</div>
              </div>
            </div>
          </div>
          <div class="mt-4">
            <button class="btn btn-ghost" @click="resetProgress"><v-icon icon="mdi-restore" /> Fortschritt zurücksetzen</button>
          </div>
        </section>
      </div>
    </main>

    <!-- FOOT -->
    <footer class="border-t border-white/10 bg-[#0a0f1c] py-6">
      <div class="container-outer text-sm text-white/60 flex items-center justify-between">
        <span>© OpenSquawk</span>
        <span>Nur für Simulator · kein Real-World ATC</span>
      </div>
    </footer>

    <!-- Congrats Dialog -->
    <v-dialog v-model="showCongrats" max-width="520">
      <div class="card">
        <div class="flex items-center gap-3">
          <v-icon icon="mdi-check-decagram" class="text-emerald-400" />
          <div class="font-semibold">Lektionen abgeschlossen</div>
        </div>
        <p class="text-white/80 mt-2">Weiter zur nächsten Lektion?</p>
        <div class="mt-4 flex gap-2 justify-end">
          <button class="btn btn-ghost" @click="showCongrats=false">Schließen</button>
          <button class="btn btn-primary" @click="goNextLesson"><v-icon icon="mdi-arrow-right" /> Weiter</button>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

type Lesson = { id:string; title:string; desc:string; target:string; hints:string[]; keywords:string[] }
type ModuleDef = { id:string; order:number; title:string; subtitle:string; desc:string; lessons:Lesson[] }

const modules = ref<ModuleDef[]>([
  { id:'basics', order:1, title:'Basics', subtitle:'Funkdisziplin & Grundphrasen', desc:'Callsign, Readback, Zahlen.',
    lessons:[
      { id:'callsign', title:'Callsign melden', desc:'Erster Call korrekt.',
        target:'Frankfurt Ground, Lufthansa one two three at stand A12, request taxi.',
        hints:['Stationsname, Callsign, Position, Intent'], keywords:['Frankfurt Ground','Lufthansa','stand','request taxi'] },
      { id:'readback', title:'Einfacher Readback', desc:'Kurz bestätigen.',
        target:'Lufthansa one two three, roger.', hints:['Callsign + roger/affirm'], keywords:['roger','affirm'] }
    ]},
  { id:'ground', order:2, title:'Ground', subtitle:'Taxi-Clearances', desc:'Taxiways, Hold-Short.',
    lessons:[
      { id:'taxi1', title:'Taxi-Clearance lesen', desc:'Via A, A5, B2.',
        target:'Lufthansa one two three, taxi to runway two five via A, A five, B two, hold short runway two five.',
        hints:['taxi to runway + via + hold short'], keywords:['taxi to runway','via','hold short'] },
      { id:'handoff', title:'Handoff bestätigen', desc:'Frequenzwechsel.',
        target:'Contact Tower on one one niner decimal five, Lufthansa one two three.',
        hints:['Contact Tower on ...','decimal'], keywords:['Contact Tower','decimal'] }
    ]},
  { id:'departure', order:3, title:'Departure', subtitle:'Line-up & Takeoff', desc:'Line up and wait.',
    lessons:[ { id:'lineup', title:'Line up', desc:'Aufrollen und warten.',
      target:'Lufthansa one two three, line up and wait runway two five.',
      hints:['line up and wait'], keywords:['line up and wait'] } ]},
  { id:'arrival', order:4, title:'Arrival', subtitle:'Approach & Landing', desc:'Vacate & melden.',
    lessons:[ { id:'vacate', title:'Runway verlassen', desc:'Verlasse Bahn, melde frei.',
      target:'Lufthansa one two three, vacated runway two five via A six.',
      hints:['vacated runway','via taxiway'], keywords:['vacated','runway'] } ]},
  { id:'vatsim', order:5, title:'VATSIM', subtitle:'Netiquette & Connect', desc:'Erster Online-Call.',
    lessons:[ { id:'checkin', title:'Initial Check-in', desc:'Kurzer, sauberer erster Call.',
      target:'Frankfurt Ground, Lufthansa one two three, A320 at stand A12, IFR to Munich, information Bravo, request clearance.',
      hints:['IFR/VFR, ATIS Info, Request'], keywords:['IFR','information','request clearance'] } ]}
])

const panel = ref<'overview'|'module'|'progress'|'settings'>('overview')
const activeModule = ref<ModuleDef | null>(modules.value[0])
const activeLesson = ref<Lesson | null>(null)
const userInput = ref('')
const evaluating = ref(false)
const lastResult = ref<{score:number, similarity:number, keywordHits:number} | null>(null)
const showCongrats = ref(false)
const settings = ref({ tts: true, keywordWeight: 0.6 })

// Progress
type LessonProgress = { bestScore:number; done:boolean }
type ModuleProgress = Record<string, LessonProgress>
const progress = ref<Record<string, ModuleProgress>>({})

const LS_KEY='opensquawk.learn.progress.v1'
const LS_SETTINGS='opensquawk.learn.settings.v1'
onMounted(()=>{
  const p = localStorage.getItem(LS_KEY); if (p) progress.value = JSON.parse(p)
  const s = localStorage.getItem(LS_SETTINGS); if (s) settings.value = { ...settings.value, ...JSON.parse(s) }
})
watch(progress, v => localStorage.setItem(LS_KEY, JSON.stringify(v)), { deep:true })
watch(settings, v => localStorage.setItem(LS_SETTINGS, JSON.stringify(v)), { deep:true })

function openModule(id:string){
  activeModule.value = modules.value.find(m=>m.id===id) || null
  panel.value='module'; activeLesson.value=null; userInput.value=''; lastResult.value=null
}
function openFirstUnfinished(modId:string){
  openModule(modId)
  const m = activeModule.value!; const mp = progress.value[m.id] || {}
  const next = m.lessons.find(l => !(mp[l.id]?.done))
  if (next) startLesson(next)
}
function startLesson(l:Lesson){ activeLesson.value=l; userInput.value=''; lastResult.value=null }
function fillWithTarget(l:Lesson){ if(!activeLesson.value || activeLesson.value.id!==l.id) startLesson(l); userInput.value=l.target }

function ensureModuleProgress(modId:string){ if(!progress.value[modId]) progress.value[modId]={} }
function lessonState(l:Lesson){ const mp = activeModule.value ? progress.value[activeModule.value.id]?.[l.id] : undefined; return { done:!!mp?.done, bestScore: mp?.bestScore||0 } }
function bestScoreByIds(modId:string, lesId:string){ return progress.value[modId]?.[lesId]?.bestScore || 0 }
function moduleDoneCount(modId:string){ const m=modules.value.find(x=>x.id===modId); if(!m) return 0; const mp=progress.value[modId]||{}; return m.lessons.filter(ls=>mp[ls.id]?.done).length }
function moduleProgressPct(modId:string){ const m=modules.value.find(x=>x.id===modId); if(!m||!m.lessons.length) return 0; return Math.round(moduleDoneCount(modId)/m.lessons.length*100) }
function avgModuleScore(modId:string){ const m=modules.value.find(x=>x.id===modId); if(!m) return 0; const mp=progress.value[modId]||{}; const scores=m.lessons.map(ls=>mp[ls.id]?.bestScore||0); const sum=scores.reduce((a,b)=>a+b,0); return Math.round(sum/(scores.length||1)) }

function normalize(s:string){ return s.toLowerCase().replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim() }
function levenshtein(a:string,b:string){ const m=a.length,n=b.length; if(!m) return n; if(!n) return m; const dp=new Array(n+1).fill(0); for(let j=0;j<=n;j++) dp[j]=j; for(let i=1;i<=m;i++){ let prev=dp[0]; dp[0]=i; for(let j=1;j<=n;j++){ const tmp=dp[j]; const cost=a[i-1]===b[j-1]?0:1; dp[j]=Math.min(dp[j]+1, dp[j-1]+1, prev+cost); prev=tmp } } return dp[n] }
function evaluateSimilarity(a:string,b:string){ const s1=normalize(a), s2=normalize(b); const dist=levenshtein(s1,s2); const maxLen=Math.max(s1.length,s2.length)||1; return 1 - dist/maxLen }
function countKeywordHits(text:string, kws:string[]){ const t=normalize(text); return kws.reduce((sum,kw)=> sum + (t.includes(normalize(kw))?1:0), 0) }

async function evaluate(l:Lesson){
  evaluating.value=true
  await new Promise(r=>setTimeout(r,200))
  const sim = evaluateSimilarity(userInput.value, l.target)
  const hits = countKeywordHits(userInput.value, l.keywords)
  const kwScore = l.keywords.length ? (hits/l.keywords.length) : 1
  const weight = settings.value.keywordWeight
  const final = Math.round(((kwScore*weight) + (sim*(1-weight))) * 100)
  lastResult.value = { score: final, similarity: sim, keywordHits: hits }

  if(activeModule.value){
    ensureModuleProgress(activeModule.value.id)
    const mp = progress.value[activeModule.value.id]
    const prev = mp[l.id]?.bestScore || 0
    const best = Math.max(prev, final)
    mp[l.id] = { bestScore: best, done: best >= 80 }
    if (mp[l.id].done) showCongrats.value = true
  }
  evaluating.value=false
}
function goNextLesson(){
  showCongrats.value=false
  if(!activeModule.value || !activeLesson.value) return
  const idx = activeModule.value.lessons.findIndex(x=>x.id===activeLesson.value!.id)
  const next = activeModule.value.lessons[idx+1]
  if(next) startLesson(next); else { panel.value='overview'; activeLesson.value=null }
}
function feedbackText(score:number){ if(score>=90) return 'Sehr gut.'; if(score>=80) return 'Gut, kleine Korrekturen.'; if(score>=65) return 'Okay, Struktur schärfen.'; return 'Nochmal: Keywords & Struktur.' }
function speak(text:string){ if(!settings.value.tts) return; const u=new SpeechSynthesisUtterance(text); u.rate=0.95; u.pitch=1.0; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u) }
function resetProgress(){ progress.value={}; lastResult.value=null; activeLesson.value=null }
</script>

<style scoped>
/* CI-Klassen, identisch zum Landing-Page-Stil */
.container-outer { @apply mx-auto max-w-screen-xl px-4; }

/* Hero Gradient */
.gradient-hero {
  background:
      radial-gradient(1200px 600px at 10% -10%, rgba(6,182,212,.35), transparent),
      radial-gradient(900px 480px at 100% 10%, rgba(59,130,246,.25), transparent),
      linear-gradient(180deg, #0b1020 0%, #0b1020 60%, #0a0f1c 100%);
}

/* Glass/Card/Button/Chip wie CI */
.glass { background: rgba(255,255,255,.06); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,.08); }
.card { @apply glass rounded-2xl p-5 md:p-6; }
.btn { @apply inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400; }
.btn-primary { @apply bg-cyan-500 text-white hover:bg-cyan-400 shadow-[0_0_40px_rgba(34,211,238,.25)]; }
.btn-ghost { @apply bg-white/5 text-white hover:bg-white/10; }
.chip { @apply inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 text-white px-3 py-1 text-xs; }

/* Accessibility: sichtbare Focus-States */
a:focus-visible, button:focus-visible { outline: none; box-shadow: 0 0 0 2px rgba(34,211,238,.8); border-radius: 10px; }
</style>
