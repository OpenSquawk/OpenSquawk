<template>
  <div class="presentation" ref="presentationEl" @click="handleClick">
    <button
      v-if="canFullscreen && !isFullscreen"
      type="button"
      class="fullscreen-toggle"
      @click.stop="toggleFullscreen"
    >
      <span>Go fullscreen</span>
      <kbd>F</kbd>
    </button>
    <div class="frame">
      <Transition name="fade" mode="out-in">
        <section class="slide" :key="currentIndex">
          <div class="kicker" v-if="currentSlide.kicker">{{ currentSlide.kicker }}</div>
          <h1 v-if="currentSlide.layout === 'title'">{{ currentSlide.title }}</h1>
          <h2 v-else>{{ currentSlide.title }}</h2>
          <p v-if="currentSlide.subtitle" class="subtitle">{{ currentSlide.subtitle }}</p>

          <div
            v-if="currentSlide.fullscreenPrompt && !isFullscreen && canFullscreen"
            class="fullscreen-callout"
          >
            <div class="callout-card">
              <p>For the full experience, please go fullscreen.</p>
              <button type="button" @click.stop="toggleFullscreen">
                Enter fullscreen
                <span class="key-hint">F</span>
              </button>
            </div>
          </div>

          <p
            v-for="(line, idx) in currentSlide.text || []"
            :key="`text-${idx}`"
            class="lead"
          >
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

          <div v-if="currentSlide.image" class="media" @click.stop>
            <img :src="currentSlide.image" :alt="currentSlide.imageAlt || ''" loading="lazy" />
            <p v-if="currentSlide.imageCredit" class="image-caption">{{ currentSlide.imageCredit }}</p>
          </div>

          <p v-if="currentSlide.note" class="note">{{ currentSlide.note }}</p>

          <div v-if="currentSlide.qr" class="qr-wrapper" @click.stop>
            <img v-if="qrCode" :src="qrCode" alt="QR code linking to the project" />
            <div v-else class="qr-placeholder">QR code is rendering…</div>
            <p>{{ currentSlide.qr }}</p>
          </div>

          <footer v-if="currentSlide.footer" class="slide-footer">{{ currentSlide.footer }}</footer>
        </section>
      </Transition>
      <div class="meta">
        <div class="meta-top">
          <div class="progress-label">{{ currentIndex + 1 }} / {{ totalSlides }}</div>
          <div class="hint" :class="{ hidden: !showHint }">Press ←/→, space, or click · F toggles fullscreen</div>
        </div>
        <div class="section-outline" v-if="sectionStates.length">
          <div class="section-track">
            <div class="section-progress" :style="{ width: `${progress}%` }"></div>
            <div
              v-for="section in sectionStates"
              :key="section.label"
              class="section-node"
              :class="{ active: section.isActive, passed: section.isPassed }"
            >
              <div class="dot"></div>
              <span>{{ section.label }}</span>
            </div>
          </div>
        </div>
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
    section: 'Intro',
    kicker: 'Nick Danner · systems tinkerer & radio nerd',
    title: 'OpenSquawk',
    subtitle: 'Open-source AI ATC for home flight simulation',
    text: [
      'Thanks for lending a solo builder 45 minutes to walk through the vision, the research, and the work in progress.'
    ],
    fullscreenPrompt: true,
    note: 'Press F or use the button to enter fullscreen whenever you like.'
  },
  {
    section: 'Intro',
    title: 'Hello I am …',
    text: ['Nick Danner—systems tinkerer & radio nerd based in Hamburg.'],
    bullets: [
      "Still figuring out public speaking—thanks for the patience tonight.",
      'One-person systems engineer turning radio noise into context for sim pilots.',
      'Working from a tiny desk, a stack of SDRs, and plenty of curiosity.'
    ],
    footer: 'nick.danner@opensquawk.dev · @nickcodes'
  },
  {
    section: 'Intro',
    title: "Why I'm sharing tonight",
    bullets: [
      'Pressure-test the roadmap before opening the code later this evening.',
      'Validate whether the unscripted AI ATC vision maps to real ops expectations.',
      'Collect stories on starting and sustaining open aviation tech projects.',
      "If nothing else, learn what traps to dodge from folks who have been there."
    ]
  },
  {
    section: 'Intro',
    title: 'What OpenSquawk is aiming for',
    bullets: [
      'Pipeline: Speech-to-Text → domain-tuned LLM → Text-to-Speech, all runnable on a home rig.',
      'Open architecture that lets hobbyists and ops desks inspect every decision.',
      'Clear guardrails so experimental automation never hides its reasoning.'
    ]
  },
  {
    section: 'Story',
    title: 'Why this matters',
    bullets: [
      'Real pilots practise with networks like VATSIM, yet coverage gaps remain for everyday flying.',
      'Built-in sim ATC is still rigid: limited phraseology, no real voice, and little regional nuance.',
      'Community keeps asking for affordable, always-on AI ATC without vendor lock-in.'
    ],
    quote: 'We trust the data. We just never see it in the same place when it matters.'
  },
  {
    section: 'Story',
    title: 'What the market already offers',
    bullets: [
      'SayIntentions.AI: cloud-first, subscription, ~88k airports, rich features yet tough monthly pricing.',
      'BeyondATC: one-time license, hybrid rule engine plus offline LLM for natural dialogue and traffic.',
      'FSHud & Pilot2ATC: reliable rule-based control with menus or strict grammars slowly adding voice.',
      'Open-source attempts like Red Griffin ATC or BlueSky stop short of full STT→LLM→TTS pipelines.'
    ],
    image: 'https://picsum.photos/seed/opensquawk-airfield/1200/675',
    imageAlt: 'placeholder photo of a small airfield at dawn with soft light',
    imageCredit: 'Photo placeholder via Lorem Picsum'
  },
  {
    section: 'Story',
    title: 'Lessons learned from those teams',
    bullets: [
      'Cloud-native AI ATC faces brutal recurring costs; offline-first keeps the lights on.',
      'Hybrid architectures—rules for separation, LLMs for phrasing—balance realism and safety.',
      'Traffic management matters as much as speech; users notice when sequencing fails.'
    ]
  },
  {
    section: 'Vision',
    title: 'So… what is OpenSquawk?',
    text: [
      "It's an open-source AI ATC toolkit for simulators like MSFS and X-Plane.",
      'It listens to pilot audio, interprets intent with a domain model, and responds using authentic radio phraseology.'
    ]
  },
  {
    section: 'Vision',
    title: 'Vision in three words',
    columns: [
      {
        heading: 'Open',
        items: ['Use public sources, document every step, and welcome scrutiny.']
      },
      {
        heading: 'Helpful',
        items: ['Deliver context quickly without burying people in dashboards.']
      },
      {
        heading: 'Welcoming',
        items: ['Keep contributions bite-sized so newcomers can land safely.']
      }
    ]
  },
  {
    section: 'Vision',
    title: 'Principles keeping me honest',
    bullets: [
      'Plain-text configs and transparent event schemas first.',
      'If automation acts, it leaves a replayable trail.',
      'APIs used internally stay the ones everyone else gets.',
      'Ship small slices so the community always sees the current reality.'
    ]
  },
  {
    section: 'Progress',
    title: 'What already runs (on a good day)',
    bullets: [
      'Local Whisper small prototype transcribes six European frequencies with <1.5 s latency.',
      'NOTAM & METAR polling feeds a shared event bus every minute.',
      'Lightweight rule engine tags events with context for experimentation.',
      'Early Nuxt dashboard streams a shared timeline for remote testers.'
    ],
    image: 'https://picsum.photos/seed/opensquawk-dashboard/1200/675',
    imageAlt: 'placeholder photo of dashboard screens glowing with charts',
    imageCredit: 'Photo placeholder via Lorem Picsum'
  },
  {
    section: 'Progress',
    title: 'Where it still creaks',
    bullets: [
      'RF front-ends need better shielding—busy nights still swamp the signal.',
      'Temporal workflows restart slowly when a transcription job stalls.',
      'Docs and setup scripts lag behind features, so onboarding feels brittle.'
    ]
  },
  {
    section: 'Progress',
    title: 'Reality check & open questions',
    bullets: [
      'How do we keep compute costs friendly as community radios scale?',
      'Which separation rules are essential for a credible first release?',
      'Where can we source and license ATC dialogue data for finetuning?'
    ]
  },
  {
    section: 'Tech',
    title: 'System sketch',
    columns: [
      {
        heading: 'Capture',
        items: [
          'Community SDR nodes push Opus audio via QUIC relays.',
          'Scheduled scrapers pull NOTAM & METAR diffs roughly every 60 seconds.'
        ]
      },
      {
        heading: 'Decode',
        items: [
          'Whisper small-v3 handles multilingual transcripts on consumer GPUs.',
          'Error-correction layer normalises callsigns, runway states, and weather codes.'
        ]
      },
      {
        heading: 'Decide',
        items: [
          'Hybrid rules + LLM decide clearances while checking traffic constraints.',
          'Temporal data store links transcripts with aircraft positions and airspace.'
        ]
      },
      {
        heading: 'Deliver',
        items: ['WebSockets and SSE push curated alerts.', 'Supabase mirror keeps data queryable for BI tools.']
      }
    ]
  },
  {
    section: 'Tech',
    title: 'Technology stack',
    columns: [
      {
        heading: 'Ingestion & compute',
        items: [
          'Rust capture agents buffer radio frames and handle QUIC uplinks.',
          'Python workers on Temporal coordinate Whisper inference and post-processing.',
          'Domain-tuned 7B-class LLM served via llama.cpp with structured prompts.'
        ]
      },
      {
        heading: 'Data & storage',
        items: [
          'Kafka or Redpanda for event streaming with exactly-once semantics.',
          'DuckDB + Materialize-style views for low-latency querying.',
          'PostgreSQL for metadata, Supabase for auth and row-level security.'
        ]
      },
      {
        heading: 'Experience layer',
        items: [
          'Nuxt 4 SPA served via edge CDN.',
          'Tailwind + custom visual language tuned for dim ops rooms.',
          'OpenAPI-defined endpoints with generated TypeScript clients.'
        ]
      },
      {
        heading: 'Ops & tooling',
        items: [
          'Nix flakes for deterministic builds.',
          'GitHub Actions pipelines with ephemeral staging environments.',
          'Grafana Cloud + Loki for metrics and transcript retention.'
        ]
      }
    ]
  },
  {
    section: 'Tech',
    title: 'Ingestion focus',
    bullets: [
      'Multi-tenant capture agents publish Opus streams over QUIC with auto gain control.',
      'Temporal workflows batch frames into 20-second jobs for transcription.',
      'Language detection auto-selects acoustic models per frequency.',
      'Manual review UI appears when confidence dips below 70%.'
    ]
  },
  {
    section: 'Tech',
    title: 'Making sense of signals',
    bullets: [
      'Vector search surfaces similar past events for faster triage.',
      'Rules DSL compiled to WebAssembly so dispatchers can extend it.',
      'Confidence weighting blends transcript certainty with sensor agreement.',
      'Alert fatigue guardrails throttle repeated low-value pings.'
    ]
  },
  {
    section: 'Tech',
    title: 'Sharing the data',
    bullets: [
      'GraphQL gateway for historical queries and analytics.',
      'SSE endpoints for lightweight clients and cockpit tablets.',
      'Plug-in hooks for sending events to Mattermost, Slack, or MS Teams.',
      'CLI toolkit generates JSON Lines for quick downstream prototyping.'
    ]
  },
  {
    section: 'Tech',
    title: 'DX and docs hopes',
    bullets: [
      'Devcontainer scripts spin up the stack with sample data in under five minutes.',
      'Playground UI exercises rule evaluations and TTS voices.',
      'Observability dashboards versioned alongside the code.',
      'Docs site built with Nuxt Content—PRs preview instantly via GitHub Actions.'
    ]
  },
  {
    section: 'Tech',
    title: 'Keeping things safe-ish',
    bullets: [
      'End-to-end tests replay anonymised traffic nightly.',
      'OPA policies guard radio streams and redact sensitive fields.',
      'Loki captures raw transcripts for 24 hours before purging.',
      'Incident playbooks live in-repo with checklists and runbooks.'
    ]
  },
  {
    section: 'Roadmap',
    title: 'Next few weeks',
    bullets: [
      'Expand capture network with five community-hosted radios in Spain and Portugal.',
      'Release rules DSL v0.2 with a friendlier visual editor.',
      'Ship first-class integration for the open-source EFB tool SkyPad.',
      'Publish contribution guidelines and a lightweight governance RFC.'
    ],
    image: 'https://picsum.photos/seed/opensquawk-roadmap/1200/675',
    imageAlt: 'placeholder photo of notes and roadmap sketches on a desk',
    imageCredit: 'Photo placeholder via Lorem Picsum'
  },
  {
    section: 'Roadmap',
    title: 'Longer-term hopes',
    bullets: [
      'Community radios filing reliable telemetry without me in the loop.',
      'Shared rule libraries emerging from dispatch teams in the wild.',
      'Enough stability that new folks build on top without holding their breath.'
    ]
  },
  {
    section: 'Roadmap',
    title: 'Longer-term dreams (late 2025?)',
    bullets: [
      'Global frequency directory with health checks and uptime badges.',
      'Incident review workspace with collaborative tagging.',
      'Edge ML experiments for on-device noise reduction.',
      'Federated deployments for operators with strict data residency needs.'
    ]
  },
  {
    section: 'Together',
    title: 'Where I could use help',
    bullets: [
      'Balancing ease-of-use with the control ops teams expect.',
      'Finding stories from the field that shape the event model early.'
    ]
  },
  {
    section: 'Together',
    title: 'Where I need the most help',
    bullets: [
      'Fresh eyes on repository structure, documentation tone, and accessibility.',
      'Pointers to communities who might benefit would mean a lot.'
    ]
  },
  {
    section: 'Together',
    title: 'Ways to join in',
    bullets: [
      'Review the architecture docs and call out blind spots.',
      'Try the setup script and let me know where it hurts.',
      'Pair-program on the rules editor—frontend or backend welcome.',
      'Even short notes on how you start open-source communities help.'
    ]
  },
  {
    section: 'Together',
    title: 'Thank you',
    text: [
      "I'm opening the repo tonight and would love to grow it with folks who know more than I do.",
      'Scan to star the repo, file an issue, or grab the starter kit.'
    ],
    qr: 'https://github.com/nickmakes/opensquawk',
    footer: 'Reach out anytime: nick.danner@opensquawk.dev · Thanks again for any guidance!'
  }
]

const totalSlides = slides.length
const currentIndex = ref(0)
const qrCode = ref('')
const showHint = ref(true)
const presentationEl = ref(null)
const isFullscreen = ref(false)
const canFullscreen = ref(false)
const qrTarget = 'https://github.com/nickmakes/opensquawk'

const sectionOrder = ['Intro', 'Story', 'Vision', 'Progress', 'Tech', 'Roadmap', 'Together']
const sectionDetails = sectionOrder
  .map((label) => {
    const indices = slides
      .map((slide, idx) => (slide.section === label ? idx : -1))
      .filter((idx) => idx !== -1)
    if (!indices.length) {
      return null
    }
    return {
      label,
      firstIndex: indices[0],
      lastIndex: indices[indices.length - 1]
    }
  })
  .filter((section) => section !== null)

const currentSlide = computed(() => slides[currentIndex.value])
const progress = computed(() => ((currentIndex.value + 1) / totalSlides) * 100)
const currentSection = computed(() => currentSlide.value.section)
const sectionStates = computed(() =>
  sectionDetails.map((section) => ({
    ...section,
    isActive: section.label === currentSection.value,
    isPassed: currentIndex.value > section.lastIndex
  }))
)

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

const toggleFullscreen = async () => {
  if (typeof document === 'undefined') {
    return
  }

  try {
    if (!document.fullscreenElement) {
      const el = presentationEl.value || document.documentElement
      if (el && el.requestFullscreen) {
        await el.requestFullscreen()
      }
    } else if (document.exitFullscreen) {
      await document.exitFullscreen()
    }
  } catch (error) {
    console.error('Failed to toggle fullscreen', error)
  }
}

const onFullscreenChange = () => {
  if (typeof document === 'undefined') {
    return
  }
  isFullscreen.value = Boolean(document.fullscreenElement)
}

const fullscreenEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']

const onKeydown = (event) => {
  if (
    ['ArrowRight', 'ArrowDown', 'PageDown'].includes(event.key) ||
    event.key === ' ' ||
    event.key === 'Space'
  ) {
    event.preventDefault()
    nextSlide()
  } else if (
    ['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key) ||
    event.key === 'Backspace'
  ) {
    event.preventDefault()
    previousSlide()
  } else if (event.key === 'Home') {
    event.preventDefault()
    goToSlide(0)
  } else if (event.key === 'End') {
    event.preventDefault()
    goToSlide(totalSlides - 1)
  } else if (event.key === 'f' || event.key === 'F') {
    event.preventDefault()
    toggleFullscreen()
  }
}

const handleClick = (event) => {
  const target = event.target
  const element = target instanceof Element ? target : null
  if (
    element &&
    (element.closest('.qr-wrapper') ||
      element.closest('.fullscreen-callout') ||
      element.closest('.fullscreen-toggle') ||
      element.closest('.section-outline') ||
      element.closest('.meta'))
  ) {
    return
  }
  nextSlide()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)

  if (typeof document !== 'undefined') {
    canFullscreen.value = document.fullscreenEnabled !== false
    fullscreenEvents.forEach((eventName) => {
      document.addEventListener(eventName, onFullscreenChange)
    })
    onFullscreenChange()
  }

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
  if (typeof document !== 'undefined') {
    fullscreenEvents.forEach((eventName) => {
      document.removeEventListener(eventName, onFullscreenChange)
    })
  }
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
  position: relative;
}

.fullscreen-toggle {
  position: fixed;
  top: 20px;
  right: 28px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.85);
  color: rgba(226, 232, 240, 0.92);
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 180ms ease, color 180ms ease, border 180ms ease;
  z-index: 10;
}

.fullscreen-toggle:hover {
  background: rgba(30, 41, 59, 0.95);
  color: #f8fafc;
  border-color: rgba(148, 163, 184, 0.6);
}

.fullscreen-toggle kbd {
  padding: 2px 6px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.65);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
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

.fullscreen-callout {
  margin-top: 12px;
}

.callout-card {
  padding: 20px 24px;
  border-radius: 18px;
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.3);
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 16px 40px rgba(2, 6, 23, 0.45);
}

.callout-card p {
  margin: 0;
  font-size: 1.05rem;
  color: rgba(226, 232, 240, 0.9);
}

.callout-card button {
  align-self: flex-start;
  padding: 10px 18px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  color: #0f172a;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: transform 150ms ease;
}

.callout-card button:hover {
  transform: translateY(-1px);
}

.key-hint {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.12);
  color: #0f172a;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
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
  list-style: disc;
  padding-left: 16px;
  margin: 0;
}

.quote {
  font-size: 1.4rem;
  line-height: 1.6;
  color: rgba(148, 163, 184, 0.95);
  border-left: 3px solid rgba(148, 163, 184, 0.4);
  padding-left: 18px;
  margin: 0;
}

.media {
  max-width: min(70ch, 100%);
}

.media img {
  width: 100%;
  border-radius: 18px;
  box-shadow: 0 22px 55px rgba(2, 6, 23, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.image-caption {
  margin-top: 8px;
  font-size: 0.85rem;
  color: rgba(148, 163, 184, 0.8);
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
  padding: 18px 28px 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.meta-top {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: space-between;
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
  text-align: right;
}

.hint.hidden {
  opacity: 0;
}

.section-outline {
  padding: 4px 4px 0;
}

.section-track {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
}

.section-track::before {
  content: '';
  position: absolute;
  top: 18px;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(148, 163, 184, 0.25);
  z-index: 0;
}

.section-progress {
  position: absolute;
  top: 18px;
  left: 0;
  width: 0;
  max-width: 100%;
  height: 2px;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  border-radius: 999px;
  transition: width 220ms ease;
  z-index: 0;
}

.section-node {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(148, 163, 184, 0.7);
  z-index: 1;
}

.section-node .dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.5);
  border: 2px solid rgba(15, 23, 42, 0.9);
  transition: all 180ms ease;
}

.section-node.active .dot {
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  border-color: rgba(15, 23, 42, 0.95);
}

.section-node.passed .dot {
  background: rgba(148, 163, 184, 0.9);
}

.section-node span {
  text-align: center;
  white-space: nowrap;
}

.section-node.active span {
  color: #e2e8f0;
  font-weight: 600;
}

.section-node.passed span {
  color: rgba(226, 232, 240, 0.85);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1280px) {
  .fullscreen-toggle {
    top: 14px;
    right: 16px;
  }
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

  .meta {
    padding: 16px 20px 20px;
  }

  .section-node {
    font-size: 0.7rem;
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

  .fullscreen-toggle {
    top: 12px;
    right: 12px;
  }
}
</style>
