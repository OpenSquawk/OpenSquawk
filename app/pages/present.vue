<template>
  <div class="presentation" @contextmenu.prevent>
    <div
      ref="stageRef"
      class="stage"
      tabindex="0"
      @click="handleStageClick"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <transition name="slide-fade" mode="out-in">
        <section
          :key="currentSlide"
          class="slide"
          :class="[
            currentSlideData.theme ?? 'dark',
            currentSlideData.layout ? `layout-${currentSlideData.layout}` : 'layout-default'
          ]"
        >
          <div class="content">
            <div class="heading">
              <p v-if="currentSlideData.kicker" class="kicker">{{ currentSlideData.kicker }}</p>
              <h1 class="title">{{ currentSlideData.title }}</h1>
              <p v-if="currentSlideData.subtitle" class="subtitle">{{ currentSlideData.subtitle }}</p>
            </div>
            <p v-if="currentSlideData.description" class="description">
              {{ currentSlideData.description }}
            </p>
            <p v-if="currentSlideData.statement" class="statement">
              {{ currentSlideData.statement }}
            </p>
            <blockquote v-if="currentSlideData.quote" class="quote">
              <p>“{{ currentSlideData.quote.text }}”</p>
              <footer v-if="currentSlideData.quote.author">— {{ currentSlideData.quote.author }}</footer>
            </blockquote>
            <ul v-if="currentSlideData.points" class="points">
              <li v-for="point in currentSlideData.points" :key="point">
                {{ point }}
              </li>
            </ul>
            <div v-if="currentSlideData.columns" class="column-grid">
              <div v-for="column in currentSlideData.columns" :key="column.title" class="column">
                <h3>{{ column.title }}</h3>
                <ul>
                  <li v-for="item in column.points" :key="item">{{ item }}</li>
                </ul>
              </div>
            </div>
            <div v-if="currentSlideData.callouts" class="callouts">
              <span v-for="callout in currentSlideData.callouts" :key="callout">{{ callout }}</span>
            </div>
            <div v-if="currentSlideData.layout === 'qr' && currentSlideData.qr" class="qr">
              <div class="qr-box" v-html="qrSvgMarkup" aria-hidden="true"></div>
              <div class="qr-meta">
                <span class="qr-label">{{ currentSlideData.qr.label }}</span>
                <span v-if="currentSlideData.qr.caption" class="qr-caption">{{ currentSlideData.qr.caption }}</span>
              </div>
            </div>
            <p v-if="currentSlideData.note" class="note">
              {{ currentSlideData.note }}
            </p>
          </div>
          <div class="footer">
            <div class="hint">
              <span>
                <template v-if="isLastSlide">Press ← to revisit</template>
                <template v-else-if="isFirstSlide">Press → or space to begin</template>
                <template v-else>Use ←/→ or space to navigate</template>
              </span>
            </div>
            <div class="progress">
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
              </div>
              <div class="counter">
                {{ currentSlide + 1 }} / {{ totalSlides }}
              </div>
            </div>
          </div>
        </section>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { renderSVG } from 'uqr';

type SlideLayout = 'default' | 'title' | 'statement' | 'columns' | 'qr';
type SlideTheme = 'dark' | 'light' | 'accent' | 'ocean' | 'slate';

interface SlideColumn {
  title: string;
  points: string[];
}

interface SlideQuote {
  text: string;
  author?: string;
}

interface SlideQr {
  url: string;
  label: string;
  caption?: string;
}

interface Slide {
  layout?: SlideLayout;
  theme?: SlideTheme;
  kicker?: string;
  title: string;
  subtitle?: string;
  description?: string;
  statement?: string;
  points?: string[];
  columns?: SlideColumn[];
  callouts?: string[];
  quote?: SlideQuote;
  note?: string;
  qr?: SlideQr;
}

const qrUrl = 'https://opensquawk.app';
const qrSvgMarkup = renderSVG(qrUrl, {
  pixelSize: 12,
  whiteColor: '#f8fafc',
  blackColor: '#020617'
});

const slides: Slide[] = [
  {
    layout: 'title',
    theme: 'ocean',
    kicker: 'Community Preview · January 2025',
    title: 'OpenSquawk',
    subtitle: 'Open-source AI air traffic control for flight simulators'
  },
  {
    theme: 'dark',
    kicker: 'About me',
    title: "Hi, I'm Nick Hartmann",
    subtitle: 'Founder & maintainer of OpenSquawk',
    points: [
      'Berlin-based software engineer and lifelong sim pilot',
      'Instrument-rated private pilot with 400+ simulated IFR hours per year',
      'Previously led audio platform teams at AeroCast and Avionic Labs'
    ]
  },
  {
    theme: 'slate',
    title: 'Career snapshot',
    points: [
      '12 years shipping distributed voice and realtime collaboration products',
      'Scaled a 30-person platform group delivering 24/7 ATC audio to 80k pilots',
      'Organizer of the Berlin Flight Sim meetup with 2,000+ members'
    ]
  },
  {
    layout: 'statement',
    theme: 'accent',
    title: 'The moment the idea clicked',
    statement:
      "A stormy VATSIM approach into Innsbruck last March lost its controller mid-briefing — the immersion vanished and our group lesson collapsed."
  },
  {
    theme: 'dark',
    title: 'Pain points we ran into',
    points: [
      'Commercial AI-ATC seats cost more than €600/year for training squads',
      'Closed models make it impossible to audit phraseology or extend new procedures',
      'Latency spikes and patchy coverage ruin multi-crew immersion'
    ]
  },
  {
    theme: 'light',
    title: 'The opportunity I saw',
    points: [
      'Fuse open speech + LLM stack with published ICAO/FAA procedures',
      'Community-tuned decision trees that evolve faster than closed vendors',
      'Modular bridges that any simulator or voice client can snap into'
    ]
  },
  {
    theme: 'ocean',
    title: 'Vision for OpenSquawk',
    points: [
      'Accessible, modifiable ATC for every simmer regardless of budget',
      'Transparent governance for phraseology, training data, and models',
      'Composable platform that training orgs can embed into their workflows'
    ]
  },
  {
    layout: 'columns',
    theme: 'slate',
    title: 'Vision pillars',
    columns: [
      {
        title: 'Open by design',
        points: ['MIT-licensed core stack', 'Transparent data provenance', 'Plugin system for voices and data']
      },
      {
        title: 'Operational realism',
        points: ['ICAO & FAA phrase packs', 'Scenario-based decision trees', 'Live weather and traffic hooks']
      },
      {
        title: 'Community sustainability',
        points: ['Cost-shared infrastructure blueprints', 'Mentored contributor onboarding', 'Shared governance charters']
      }
    ]
  },
  {
    theme: 'dark',
    title: 'What already works today',
    points: [
      'Nuxt 4 single-page app with Vuetify + Tailwind theming',
      'Node.js orchestration service for prompts, speech, and account flows',
      'MongoDB backing store for lesson plans and rating progress',
      'OpenAI + Piper TTS pipeline with configurable voice profiles'
    ]
  },
  {
    layout: 'columns',
    theme: 'light',
    title: 'Platform anatomy',
    columns: [
      {
        title: 'Client',
        points: [
          'SPA dashboard with session control and training flows',
          'WebSocket control surface for sim hardware',
          'Offline-friendly briefings and transcripts'
        ]
      },
      {
        title: 'Orchestration',
        points: [
          'Node 22 service mesh with Pinia-powered auth APIs',
          'Decision-tree engine encoding ATC states and phraseology',
          'Audio mixer layering multi-voice output and ambient beds'
        ]
      },
      {
        title: 'Intelligence',
        points: [
          'LLM adapters for OpenAI, local LLaMA, and Mistral models',
          'Speech connectors for Piper, ElevenLabs, and Azure voices',
          'Telemetry aggregator feeding evaluation and training loops'
        ]
      }
    ]
  },
  {
    theme: 'slate',
    title: 'Realtime session flow',
    points: [
      'Pilot request enters via websocket bridge or native mic client',
      'Intent classifier selects scenario-specific ATC state machine',
      'Planner LLM drafts responses with guardrails for brevity and tone',
      'Speech synth streams audio under 200 ms while logs sync to the UI'
    ]
  },
  {
    theme: 'dark',
    title: 'AI & speech stack details',
    points: [
      'Primary planner: GPT-4o mini with pluggable interface for open models',
      'Fallback offline pack: LLaMA 3.1 guard plus RAG from community corpus',
      'Speech output via Piper or ElevenLabs with pilot-selectable voices',
      'Summarisation worker distils transcripts for post-flight review'
    ]
  },
  {
    theme: 'light',
    title: 'Web experience highlights',
    points: [
      'Responsive cockpit UI built with Vuetify, Tailwind, and motion cues',
      'Lesson cards guide IFR flows from clearance to shutdown',
      'Inline waveform preview helps QA new phrase packs quickly',
      'Dark-mode palette tuned for dimmed cockpits and VR streaming'
    ]
  },
  {
    theme: 'slate',
    title: 'Simulator integration runway',
    points: [
      'MSFS SimConnect bridge streaming traffic and weather (beta)',
      'X-Plane UDP translator mapping radios and navigation data (alpha)',
      'DCS hook design drafted — needs protocol champion support',
      'Open HTTP/WebSocket API for EFBs and instructor stations'
    ]
  },
  {
    theme: 'dark',
    title: 'Reliability foundations',
    points: [
      'Worker pool with circuit breakers around AI and speech providers',
      'Observability stack: OpenTelemetry + Grafana + Loki',
      'Graceful degradation to text-only prompts when audio stalls',
      'Rolling audio buffer keeps handoffs smooth on node failover'
    ]
  },
  {
    theme: 'light',
    title: 'Security & trust commitments',
    points: [
      'OAuth2-compatible auth with rotating refresh tokens',
      'Per-club tenancy and RBAC for instructors, students, and guests',
      'Immutable audit log of every clearance and instruction',
      'Telemetry is opt-in and anonymised by default'
    ]
  },
  {
    layout: 'statement',
    theme: 'accent',
    title: 'Roadmap focus areas',
    statement:
      'Three tracks drive 2025: rock-solid sim bridges, richer training content, and a community-led governance model.'
  },
  {
    theme: 'dark',
    title: 'Next 90 days',
    points: [
      'Ship MSFS + X-Plane bridge beta with installer and docs',
      'Open-source visual decision tree editor for phrase logic',
      'Publish contributor playbook, CODEOWNERS, and triage rituals',
      'Host 20 instructor-led sessions to validate training flows'
    ]
  },
  {
    theme: 'slate',
    title: '6–12 month horizon',
    points: [
      'Launch community phraseology review board with monthly cadences',
      'Add multilingual ATIS and VFR training content packs',
      'Introduce self-hosted speech container for offline squadrons',
      'Secure sustainable sponsorships to cover infra and model costs'
    ]
  },
  {
    theme: 'light',
    title: 'Where I need your help',
    points: [
      'Review the architecture and call out blind spots or missing safeguards',
      'Stress-test the learning flows and share real-world ATC quirks',
      'Co-design contributor onboarding, mentorship, and governance',
      'Connect us with sim clubs, instructors, and potential sponsors'
    ]
  },
  {
    theme: 'dark',
    title: 'First open-source launch jitters',
    subtitle: 'Looking for advice and honest critique',
    points: [
      'What rituals keep your open projects healthy from day zero?',
      'How do you structure docs that invite meaningful pull requests?',
      'Who should we talk to about licensing voice and data assets responsibly?'
    ],
    note: 'Reach me at nick@opensquawk.app or @nicksim on Mastodon.'
  },
  {
    layout: 'qr',
    theme: 'ocean',
    kicker: 'Let’s build this together',
    title: 'Thank you!',
    subtitle: 'Scan to explore the project',
    points: [
      'Repo + docs: opensquawk.app',
      'Tell me what to fix next and where to focus contributions'
    ],
    qr: {
      url: qrUrl,
      label: 'https://opensquawk.app',
      caption: 'Open the live roadmap, try the demo build, and share feedback.'
    }
  }
];

const currentSlide = ref(0);
const totalSlides = slides.length;

const currentSlideData = computed(() => slides[currentSlide.value]);
const progress = computed(() => ((currentSlide.value + 1) / totalSlides) * 100);
const isFirstSlide = computed(() => currentSlide.value === 0);
const isLastSlide = computed(() => currentSlide.value === totalSlides - 1);

const goToSlide = (index: number) => {
  const nextIndex = Math.min(Math.max(index, 0), totalSlides - 1);
  currentSlide.value = nextIndex;
};

const goToNext = () => {
  if (!isLastSlide.value) {
    currentSlide.value += 1;
  }
};

const goToPrevious = () => {
  if (!isFirstSlide.value) {
    currentSlide.value -= 1;
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.defaultPrevented) {
    return;
  }

  if (event.key === ' ' && event.shiftKey) {
    event.preventDefault();
    goToPrevious();
    return;
  }

  if (event.key === ' ' || event.key === 'ArrowRight' || event.key === 'PageDown') {
    event.preventDefault();
    goToNext();
    return;
  }

  if (event.key === 'ArrowLeft' || event.key === 'PageUp' || event.key === 'Backspace') {
    event.preventDefault();
    goToPrevious();
    return;
  }

  if (event.key === 'Home') {
    event.preventDefault();
    goToSlide(0);
    return;
  }

  if (event.key === 'End') {
    event.preventDefault();
    goToSlide(totalSlides - 1);
  }
};

const stageRef = ref<HTMLElement | null>(null);

const handleStageClick = (event: MouseEvent) => {
  const stage = stageRef.value;
  if (!stage) {
    return;
  }

  const rect = stage.getBoundingClientRect();
  const relativeX = event.clientX - rect.left;
  const threshold = rect.width * 0.35;

  if (relativeX < threshold) {
    goToPrevious();
  } else {
    goToNext();
  }
};

const touchStartX = ref<number | null>(null);

const handleTouchStart = (event: TouchEvent) => {
  if (event.touches.length === 1) {
    touchStartX.value = event.touches[0].clientX;
  }
};

const handleTouchEnd = (event: TouchEvent) => {
  if (touchStartX.value === null) {
    return;
  }

  const deltaX = event.changedTouches[0].clientX - touchStartX.value;
  if (Math.abs(deltaX) > 40) {
    if (deltaX < 0) {
      goToNext();
    } else {
      goToPrevious();
    }
  }
  touchStartX.value = null;
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.presentation {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at 12% 18%, rgba(37, 99, 235, 0.18), transparent 55%),
    radial-gradient(circle at 85% 12%, rgba(14, 165, 233, 0.12), transparent 45%),
    #020617;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(12px, 2vw, 32px);
}

.stage {
  width: min(96vw, calc(96vh * (16 / 9)));
  height: min(96vh, calc(96vw * (9 / 16)));
  aspect-ratio: 16 / 9;
  border-radius: clamp(24px, 4vw, 42px);
  overflow: hidden;
  box-shadow: 0 40px 120px rgba(15, 23, 42, 0.45);
  position: relative;
  cursor: pointer;
  user-select: none;
  background: transparent;
}

.slide {
  width: 100%;
  height: 100%;
  padding: clamp(40px, 4vw, 96px) clamp(48px, 5vw, 120px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: var(--text-primary, #f8fafc);
  background: var(--slide-bg, linear-gradient(135deg, #0f172a, #020617));
}

.slide.dark {
  --slide-bg: linear-gradient(140deg, #0f172a, #020617 58%, #111827);
  --text-primary: #f8fafc;
  --text-muted: rgba(226, 232, 240, 0.75);
  --panel-color: rgba(148, 163, 184, 0.18);
}

.slide.slate {
  --slide-bg: linear-gradient(140deg, #1e293b, #0b1120 60%, #111c2e);
  --text-primary: #f8fafc;
  --text-muted: rgba(226, 232, 240, 0.78);
  --panel-color: rgba(125, 211, 252, 0.18);
}

.slide.ocean {
  --slide-bg: radial-gradient(circle at 15% 15%, #2563eb 0%, #0b1223 55%, #020617 100%);
  --text-primary: #f8fafc;
  --text-muted: rgba(226, 232, 240, 0.85);
  --panel-color: rgba(191, 219, 254, 0.22);
}

.slide.light {
  --slide-bg: linear-gradient(140deg, #f8fafc, #e2e8f0);
  --text-primary: #0f172a;
  --text-muted: rgba(15, 23, 42, 0.72);
  --panel-color: rgba(15, 23, 42, 0.08);
}

.slide.accent {
  --slide-bg: linear-gradient(140deg, #4338ca, #0f172a 65%, #312e81);
  --text-primary: #eef2ff;
  --text-muted: rgba(226, 232, 255, 0.76);
  --panel-color: rgba(165, 180, 252, 0.22);
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: clamp(1.8rem, 2.5vh, 3rem);
}

.heading {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.kicker {
  font-size: clamp(0.75rem, 1vw, 0.95rem);
  letter-spacing: 0.32em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--text-muted);
}

.title {
  font-size: clamp(2.6rem, 4vw, 4.2rem);
  line-height: 1.1;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.subtitle {
  font-size: clamp(1.1rem, 1.5vw, 1.6rem);
  color: var(--text-muted);
  max-width: 60ch;
}

.description,
.statement,
.points li,
.column-grid ul li,
.note,
.quote {
  font-size: clamp(1.05rem, 1.45vw, 1.45rem);
  line-height: 1.55;
  color: var(--text-primary);
}

.description {
  max-width: 70ch;
  color: var(--text-muted);
}

.statement {
  font-size: clamp(1.45rem, 2.5vw, 2.2rem);
  font-weight: 500;
  max-width: 68ch;
  color: var(--text-primary);
}

.points {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: clamp(0.75rem, 1vh, 1.2rem);
}

.points li {
  position: relative;
  padding-left: 1.75rem;
  color: var(--text-primary);
}

.points li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 999px;
  background: var(--text-primary);
  opacity: 0.65;
  transform: translateY(-50%);
}

.column-grid {
  display: grid;
  gap: clamp(1.5rem, 2vw, 2.5rem);
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.column h3 {
  font-size: clamp(1.1rem, 1.6vw, 1.6rem);
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.column ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.65rem;
}

.column li {
  position: relative;
  padding-left: 1.35rem;
  color: var(--text-muted);
}

.column li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--panel-color);
  transform: translateY(-50%);
}

.callouts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.callouts span {
  border-radius: 999px;
  padding: 0.45rem 0.9rem;
  background: var(--panel-color);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
}

.quote {
  border-left: 4px solid var(--panel-color);
  padding-left: 1.25rem;
  color: var(--text-muted);
  max-width: 60ch;
}

.quote p {
  font-style: italic;
}

.quote footer {
  margin-top: 0.65rem;
  font-size: 0.95rem;
  opacity: 0.85;
}

.note {
  font-size: clamp(0.95rem, 1.2vw, 1.1rem);
  color: var(--text-muted);
  margin-top: auto;
}

.qr {
  display: flex;
  align-items: center;
  gap: clamp(1.5rem, 2vw, 3rem);
  flex-wrap: wrap;
}

.qr-box {
  background: #f8fafc;
  padding: clamp(0.75rem, 1vw, 1.2rem);
  border-radius: 1.25rem;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.28);
  display: inline-flex;
}

.qr-box :deep(svg) {
  width: clamp(140px, 18vw, 220px);
  height: clamp(140px, 18vw, 220px);
  display: block;
}

.qr-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.qr-label {
  font-weight: 600;
  font-size: clamp(1rem, 1.4vw, 1.3rem);
  color: var(--text-primary);
}

.qr-caption {
  font-size: clamp(0.95rem, 1.2vw, 1.1rem);
  color: var(--text-muted);
  max-width: 32ch;
}

.footer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hint span {
  font-size: clamp(0.85rem, 1vw, 0.95rem);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.progress {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-track {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: var(--panel-color, rgba(148, 163, 184, 0.25));
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #38bdf8, #6366f1);
  transition: width 0.45s ease;
}

.counter {
  font-size: clamp(0.95rem, 1.2vw, 1.1rem);
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(14px) scale(0.995);
}

@media (max-width: 900px) {
  .slide {
    padding: clamp(32px, 4vw, 64px);
  }

  .title {
    font-size: clamp(2.2rem, 6vw, 3.2rem);
  }

  .content {
    gap: 1.5rem;
  }

  .qr {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
