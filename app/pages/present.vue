<template>
  <div class="presentation" @click="handleClick">
    <div class="frame">
      <Transition name="fade" mode="out-in">
        <section class="slide" :key="currentIndex">
          <div class="kicker" v-if="currentSlide.kicker">{{ currentSlide.kicker }}</div>
          <h1 v-if="currentSlide.layout === 'title'">{{ currentSlide.title }}</h1>
          <h2 v-else>{{ currentSlide.title }}</h2>
          <p v-if="currentSlide.subtitle" class="subtitle">{{ currentSlide.subtitle }}</p>
          <p v-for="(line, idx) in currentSlide.text || []" :key="`text-${idx}`" class="lead">
            {{ line }}
          </p>
          <ul v-if="currentSlide.bullets" class="bullet-list">
            <li v-for="(bullet, idx) in currentSlide.bullets" :key="`bullet-${idx}`">
              <span class="marker"></span>
              <span>{{ bullet }}</span>
            </li>
          </ul>
          <div v-if="currentSlide.columns" class="columns">
            <div v-for="(column, cIdx) in currentSlide.columns" :key="`col-${cIdx}`" class="column">
              <h3 v-if="column.heading">{{ column.heading }}</h3>
              <p v-for="(line, lIdx) in column.text || []" :key="`col-text-${cIdx}-${lIdx}`">{{ line }}</p>
              <ul v-if="column.items">
                <li v-for="(item, iIdx) in column.items" :key="`col-item-${cIdx}-${iIdx}`">{{ item }}</li>
              </ul>
            </div>
          </div>
          <blockquote v-if="currentSlide.quote" class="quote">
            “{{ currentSlide.quote }}”
          </blockquote>
          <p v-if="currentSlide.note" class="note">{{ currentSlide.note }}</p>
          <div v-if="currentSlide.qr" class="qr-wrapper">
            <img v-if="qrCode" :src="qrCode" alt="QR code linking to the project" />
            <div v-else class="qr-placeholder">QR code is rendering…</div>
            <p>{{ currentSlide.qr }}</p>
          </div>
          <footer v-if="currentSlide.footer" class="slide-footer">{{ currentSlide.footer }}</footer>
        </section>
      </Transition>
      <div class="meta">
        <div class="progress-label">{{ currentIndex + 1 }} / {{ totalSlides }}</div>
        <div class="progress">
          <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
        </div>
        <div class="hint" :class="{ hidden: !showHint }">Press ←/→ or space to navigate</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { renderSVG } from 'uqr'

const slides = [
  {
    layout: 'title',
    kicker: 'Nick Danner · Systems Engineer & Data Enthusiast',
    title: 'OpenSquawk',
    subtitle: 'Streaming aviation intelligence for everyone',
    text: ['A 45-minute story about building my first open-source project.']
  },
  {
    title: 'Meet Nick',
    bullets: [
      'Lead systems engineer turned indie maker focused on aviation data.',
      'Based in Hamburg, Germany with a soft spot for rainy dawn departures.',
      'Eight years crafting telemetry and event-driven platforms for pilots and operations teams.'
    ],
    footer: 'nick.danner@opensquawk.dev · @nickcodes'
  },
  {
    title: 'Professional snapshot',
    bullets: [
      '2015–2018 · Avionics integration engineer at SkyGrid Systems.',
      '2018–2021 · Led real-time telemetry at Aerologix during their European expansion.',
      '2021–2024 · Built streaming analytics for drone corridors at FlightPath Labs.',
      '2024 · Sabbatical dedicated to opening aviation data for small operators.'
    ]
  },
  {
    title: 'How the idea was born',
    text: [
      'Last September I mentored a night shift at the Berlin “Hack the Skies” event.',
      'We tried to correlate ATC voice transcripts with live NOTAM updates and ended up screenshotting dashboards at 3 a.m.'
    ]
  },
  {
    title: 'The pivotal moment',
    bullets: [
      'Controllers emailed PDFs while ops teams waited for context.',
      'Pilots in the room had three different chat threads for runway status.',
      'Everyone trusted the data, but no one shared a single source of truth in real time.'
    ],
    quote: 'We lost more time debating the data than reacting to it.'
  },
  {
    title: 'Opportunity I saw',
    bullets: [
      'Unify voice, text, and telemetry signals without locking them behind proprietary hubs.',
      'Let small operators plug into the same situational awareness tools as major airlines.',
      'Build something transparent enough that the community can audit and extend it.'
    ]
  },
  {
    title: 'Introducing OpenSquawk',
    text: [
      'An open-source streaming platform that ingests public ATC audio, converts it to structured events, and distributes live alerts to crews and ops rooms.'
    ],
    bullets: [
      'Focuses on fast, relevant signal extraction rather than archival playback.',
      'Ships with opinionated defaults yet stays hackable through lightweight plugins.'
    ]
  },
  {
    title: 'Vision',
    columns: [
      {
        heading: 'Radically open data',
        items: [
          'Automate ingestion of global ATC streams and NOTAM feeds.',
          'Expose clean, well-documented event schemas.',
          'Enable remixing without legal or pricing hurdles.'
        ]
      },
      {
        heading: 'Realtime clarity',
        items: [
          'Deliver sub-second alerts to pilots, dispatchers, and analysts.',
          'Blend voice, telemetry, and weather into a shared timeline.',
          'Keep historical context so trends are always one query away.'
        ]
      },
      {
        heading: 'Community-first',
        items: [
          'Design contributions to be approachable for both data and ops folks.',
          'Document every subsystem as if a stranger needs to debug it at 2 a.m.',
          'Celebrate forks, experiments, and shared learning.'
        ]
      }
    ]
  },
  {
    title: 'Guiding product principles',
    bullets: [
      'Default to plain text formats and human-readable configs.',
      'Every automation produces an audit trail you can replay.',
      'APIs mirror internal use-cases—no private endpoints hiding behind the curtain.',
      'Accessibility: works in a browser, a dispatch wallboard, or a CLI feed.'
    ]
  },
  {
    title: 'What already works',
    bullets: [
      'Live ingestion of six European ATC frequencies with Whisper-based transcription.',
      'NOTAM and METAR polling unified into a single event stream.',
      'Rule engine that tags events with urgency levels and suggested actions.',
      'Operator dashboard with streaming timeline and collaborative annotations.'
    ]
  },
  {
    title: 'System at a glance',
    columns: [
      {
        heading: 'Capture',
        items: [
          'Edge devices record VHF audio & push via secure WebRTC relays.',
          'Scheduled scrapers pull NOTAM/METAR diffs every 60 seconds.'
        ]
      },
      {
        heading: 'Decode',
        items: [
          'Whisper small-v3 handles multilingual transcripts.',
          'Keyword matcher spots callsigns, runway states, and weather codes.'
        ]
      },
      {
        heading: 'Enrich',
        items: [
          'Temporal database stitches events with aircraft position feeds.',
          'Geo-fencing adds airport and sector context on the fly.'
        ]
      },
      {
        heading: 'Deliver',
        items: [
          'WebSockets & SSE push curated alerts.',
          'Supabase mirror keeps data queryable for BI tools.'
        ]
      }
    ]
  },
  {
    title: 'Technology stack',
    columns: [
      {
        heading: 'Ingestion & compute',
        items: [
          'Rust microservices for radio capture & pre-processing.',
          'Python workers orchestrated by Temporal for transcription jobs.',
          'Go-based enrichment service with gRPC interfaces.'
        ]
      },
      {
        heading: 'Data & storage',
        items: [
          'Apache Kafka for event streaming with exactly-once semantics.',
          'Materialize for low-latency materialized views.',
          'PostgreSQL for metadata, Supabase for auth & row-level security.'
        ]
      },
      {
        heading: 'Experience layer',
        items: [
          'Nuxt 4 SPA served via edge CDN.',
          'Tailwind + custom visual language for readability in dim ops rooms.',
          'OpenAPI-defined endpoints with generated TypeScript clients.'
        ]
      },
      {
        heading: 'Ops & tooling',
        items: [
          'Nix flakes for deterministic builds.',
          'GitHub Actions pipelines with ephemeral staging environments.',
          'Grafana Cloud for metrics & alerting.'
        ]
      }
    ]
  },
  {
    title: 'Ingestion pipeline details',
    bullets: [
      'Multi-tenant radio capture agents publish Opus streams over QUIC.',
      'Temporal workflows batch frames into 20-second jobs for transcription.',
      'Language detection auto-selects acoustic models per frequency.',
      'Fallback to manual tagging UI when confidence drops below 70%.'
    ]
  },
  {
    title: 'Analysis & scoring engine',
    bullets: [
      'Vector search surfaces similar past events for faster triage.',
      'Rules DSL compiled to WebAssembly so dispatchers can extend it.',
      'Confidence weighting blends transcript certainty with sensor agreement.',
      'Alert fatigue guardrails throttle repeated low-value pings.'
    ]
  },
  {
    title: 'APIs & integrations',
    bullets: [
      'GraphQL gateway for historical queries and analytics.',
      'SSE endpoints for lightweight clients & cockpit tablets.',
      'Plug-in hooks for sending events to Mattermost, Slack, or MS Teams.',
      'CLI toolkit generates JSON Lines for rapid downstream prototyping.'
    ]
  },
  {
    title: 'Developer experience focus',
    bullets: [
      'Devcontainer scripts spin up the full stack with sample data in under five minutes.',
      'Storybook-style playground for testing rule evaluations.',
      'Observability dashboards versioned alongside the code.',
      'Docs site built with Nuxt Content—PRs preview instantly via GitHub Actions.'
    ]
  },
  {
    title: 'Quality, security & observability',
    bullets: [
      'End-to-end tests replay anonymized traffic nightly.',
      'OPA policies guard radio streams and redact sensitive fields.',
      'Grafana Loki captures raw transcripts for 24 hours before purging.',
      'Incident playbooks live in-repo with checklists and runbooks.'
    ]
  },
  {
    title: 'Roadmap · next 90 days',
    bullets: [
      'Expand capture network with five community-hosted radios in Spain & Portugal.',
      'Release v0.2 of the rules DSL with visual editor.',
      'Ship first-class integration for open-source EFB tool SkyPad.',
      'Publish contribution guidelines and governance RFC.'
    ]
  },
  {
    title: 'Roadmap · late 2025',
    bullets: [
      'Global frequency directory with health checks and uptime badges.',
      'Incident review workspace with collaborative tagging.',
      'Edge ML experiments for on-device noise reduction.',
      'Federated deployments for operators with strict data residency needs.'
    ]
  },
  {
    title: 'My ask tonight',
    bullets: [
      'This is my first open-source repo—feedback on structure and tone is gold.',
      'Help validate the event model: does it match the ops reality you live in?',
      'Looking for testers willing to run a capture node for a week.',
      'Point me toward communities where this could deliver real value.'
    ]
  },
  {
    title: 'How you can contribute',
    bullets: [
      'Review the architecture docs and call out blind spots.',
      'Try the setup script and share where it hurts.',
      'Pair-program on the rules editor—frontend or backend welcome.',
      'Even a short note on how you bootstrap open-source communities helps.'
    ]
  },
  {
    title: 'Thank you',
    text: [
      'I am opening the repo tonight and want to grow this with people who care about accessible aviation data.',
      'Scan to star the repo, file an issue, or grab the starter kit.'
    ],
    qr: 'https://github.com/nickmakes/opensquawk',
    footer: 'Reach out anytime: nick.danner@opensquawk.dev · Appreciate your time—excited for your input!'
  }
]

const totalSlides = slides.length
const currentIndex = ref(0)
const qrCode = ref('')
const showHint = ref(true)
const qrTarget = 'https://github.com/nickmakes/opensquawk'

const currentSlide = computed(() => slides[currentIndex.value])
const progress = computed(() => ((currentIndex.value + 1) / totalSlides) * 100)

const goToSlide = (index) => {
  const nextIndex = Math.min(Math.max(index, 0), totalSlides - 1)
  showHint.value = false
  currentIndex.value = nextIndex
}

const nextSlide = () => {
  if (currentIndex.value < totalSlides - 1) {
    goToSlide(currentIndex.value + 1)
  }
}

const previousSlide = () => {
  if (currentIndex.value > 0) {
    goToSlide(currentIndex.value - 1)
  }
}

const onKeydown = (event) => {
  if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(event.key) || event.key === ' ' || event.key === 'Space') {
    event.preventDefault()
    nextSlide()
  } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key) || event.key === 'Backspace') {
    event.preventDefault()
    previousSlide()
  } else if (event.key === 'Home') {
    event.preventDefault()
    goToSlide(0)
  } else if (event.key === 'End') {
    event.preventDefault()
    goToSlide(totalSlides - 1)
  }
}

const handleClick = (event) => {
  const target = event.target
  const element = target instanceof Element ? target : null
  if (element && element.closest('.qr-wrapper')) {
    return
  }
  nextSlide()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  try {
    const svg = renderSVG(qrTarget, {
      ecc: 'M',
      border: 2,
      pixelSize: 10,
      whiteColor: '#ffffff',
      blackColor: '#020617'
    })
    qrCode.value = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  } catch (error) {
    console.error('Failed to generate QR code', error)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
:global(html, body, #__nuxt) {
  margin: 0;
  height: 100%;
  background: radial-gradient(circle at top left, #0f172a, #020617 65%);
  color: #f8fafc;
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
}

.presentation {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5vh;
  box-sizing: border-box;
}

.frame {
  width: min(92vw, 160vh);
  aspect-ratio: 16 / 9;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 24px;
  box-shadow: 0 30px 80px rgba(2, 6, 23, 0.7);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
}

.slide {
  flex: 1;
  padding: 64px 72px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
}

.kicker {
  text-transform: uppercase;
  letter-spacing: 0.28em;
  font-size: 0.85rem;
  color: #38bdf8;
  font-weight: 600;
}

h1 {
  font-size: clamp(3.2rem, 5vw, 4.6rem);
  margin: 0;
  line-height: 1.05;
}

h2 {
  font-size: clamp(2.6rem, 3.8vw, 3.4rem);
  margin: 0;
  line-height: 1.1;
}

.subtitle {
  font-size: 1.5rem;
  max-width: 28ch;
  color: rgba(241, 245, 249, 0.85);
  margin: 0;
}

.lead {
  font-size: 1.25rem;
  line-height: 1.6;
  color: rgba(241, 245, 249, 0.9);
  margin: 0;
  max-width: 70ch;
}

.bullet-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 70ch;
}

.bullet-list li {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16px;
  align-items: start;
  font-size: 1.18rem;
  line-height: 1.6;
  color: rgba(226, 232, 240, 0.95);
}

.marker {
  width: 10px;
  height: 10px;
  margin-top: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
}

.columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 32px;
  max-width: 100%;
}

.column h3 {
  font-size: 1.2rem;
  margin: 0 0 12px;
  color: #a5b4fc;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.column p {
  margin: 0 0 12px;
  font-size: 1.05rem;
  color: rgba(226, 232, 240, 0.9);
}

.column ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 1.05rem;
  color: rgba(226, 232, 240, 0.9);
}

.quote {
  font-size: 1.4rem;
  font-style: italic;
  color: rgba(248, 250, 252, 0.85);
  border-left: 4px solid rgba(129, 140, 248, 0.6);
  padding-left: 16px;
  margin: 0;
}

.note {
  font-size: 1rem;
  color: rgba(148, 163, 184, 0.9);
}

.slide-footer {
  margin-top: auto;
  font-size: 0.95rem;
  color: rgba(148, 163, 184, 0.85);
}

.qr-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.qr-wrapper img {
  width: min(260px, 40vh);
  border-radius: 12px;
  box-shadow: 0 12px 35px rgba(8, 47, 73, 0.45);
  background: #fff;
  padding: 12px;
}

.qr-placeholder {
  width: 220px;
  height: 220px;
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.2);
  display: grid;
  place-items: center;
  font-size: 1rem;
  color: rgba(226, 232, 240, 0.7);
}

.meta {
  padding: 12px 24px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress {
  flex: 1;
  height: 6px;
  background: rgba(148, 163, 184, 0.2);
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  transition: width 220ms ease;
}

.progress-label {
  font-size: 0.9rem;
  color: rgba(148, 163, 184, 0.85);
  min-width: 64px;
}

.hint {
  font-size: 0.85rem;
  color: rgba(148, 163, 184, 0.7);
  transition: opacity 200ms ease;
}

.hint.hidden {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1024px) {
  .slide {
    padding: 48px 44px 36px;
  }

  h1 {
    font-size: clamp(2.6rem, 7vw, 3.6rem);
  }

  h2 {
    font-size: clamp(2.2rem, 5vw, 3rem);
  }

  .lead,
  .bullet-list li,
  .column ul,
  .column p {
    font-size: 1.05rem;
  }
}

@media (max-width: 768px) {
  .presentation {
    padding: 1.5vh;
  }

  .slide {
    padding: 40px 28px 28px;
  }

  .frame {
    border-radius: 16px;
  }
}
</style>
