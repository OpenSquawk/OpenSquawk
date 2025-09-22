<template>
  <div class="presentation" @click="handleClick">
    <div class="frame">
      <button
        v-if="canFullscreen"
        class="fullscreen-btn"
        type="button"
        @click.stop="toggleFullscreen"
      >
        <span>{{ isFullscreen ? 'Exit fullscreen' : 'Go fullscreen' }}</span>
        <span class="key-hint">F</span>
      </button>
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
          <div v-if="currentSlide.image" class="media" @click.stop>
            <img
              :src="currentSlide.image.src"
              :alt="currentSlide.image.alt"
              loading="lazy"
            />
            <p v-if="currentSlide.image.caption" class="caption">{{ currentSlide.image.caption }}</p>
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
        <div class="progress-label">{{ currentIndex + 1 }} / {{ totalSlides }}</div>
        <div class="progress">
          <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
        </div>
        <div class="hint" :class="{ hidden: !showHint }">Press ←/→ or space · F toggles fullscreen</div>
      </div>
      <div class="topic-outline" @click.stop>
        <div
          v-for="topic in topicStates"
          :key="topic.id"
          class="topic-chip"
          :class="{
            active: topic.state === 'active',
            done: topic.state === 'done'
          }"
          role="button"
          :tabindex="topic.firstIndex >= 0 ? 0 : -1"
          :aria-current="topic.state === 'active' ? 'step' : undefined"
          @click.stop="jumpToTopic(topic)"
          @keydown="onTopicKeydown($event, topic)"
        >
          <span class="topic-dot"></span>
          <span class="topic-label">{{ topic.label }}</span>
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
    topic: 'hello',
    kicker: 'Nick Danner · systems tinkerer still figuring things out',
    title: 'OpenSquawk',
    subtitle: 'Trying to open up live aviation signals without gatekeepers',
    text: ['A 45-minute walk-through from a solo maintainer hoping to learn from you.']
  },
  {
    topic: 'hello',
    title: "Hi, I'm Nick",
    bullets: [
      'Systems engineer who loves aviation, still learning something new each sprint.',
      'Hamburg based, splitting time between a tiny coworking desk and the local airfield café.',
      'This side project is just me for now—grateful for any advice from wiser folks.'
    ],
    image: {
      src: 'https://loremflickr.com/1600/900/portrait,laptop?lock=12',
      alt: 'Lorem pixel placeholder of a friendly person working on a laptop.',
      caption: 'Lorem pixel placeholder photo'
    },
    footer: 'nick.danner@opensquawk.dev · @nickcodes'
  },
  {
    topic: 'hello',
    title: 'A few honest stats',
    bullets: [
      '2015–2018 · Avionics integration at SkyGrid Systems, where I learned disciplined testing.',
      '2018–2021 · Telemetry prototypes at Aerologix—lots of “does this make sense?” moments.',
      '2021–2024 · FlightPath Labs: streaming analytics for drone corridors with generous mentors.',
      '2024 · Sabbatical to see if open tools for small operators can exist.'
    ]
  },
  {
    topic: 'story',
    title: 'How the idea sparked',
    text: [
      'Last September I helped at the Berlin “Hack the Skies” night shift and quickly felt out of my depth.',
      'We tried to align ATC voice, NOTAM updates, and chat threads; screenshots and post-its ruled the night.'
    ],
    image: {
      src: 'https://loremflickr.com/1600/900/hackathon,team?lock=24',
      alt: 'Lorem pixel placeholder of a small team working late at laptops.',
      caption: 'Lorem pixel placeholder photo'
    }
  },
  {
    topic: 'story',
    title: 'What wasn’t working',
    bullets: [
      'Controllers forwarded PDFs while ops teams guessed the right context.',
      'Pilots swapped runway status across scattered group chats.',
      'No shared timeline existed, so decisions lagged behind the data.'
    ],
    quote: 'We lost more time debating the data than reacting to it.'
  },
  {
    topic: 'story',
    title: 'Why I thought maybe I could help',
    bullets: [
      'Unify voice, text, and telemetry in the open so nobody needs pricey dashboards to start.',
      'Document every step so newcomers (like me) can understand the plumbing.',
      'Keep it small, transparent, and welcoming so real experts feel safe to improve it.'
    ]
  },
  {
    topic: 'vision',
    title: 'What I’m trying to build',
    text: [
      'OpenSquawk is an open-source stream that turns public ATC audio into events small ops teams can act on.'
    ],
    bullets: [
      'Focus on actionable alerts first; archival ideas can wait.',
      'Start with gentle defaults but leave every piece hackable.'
    ],
    image: {
      src: 'https://loremflickr.com/1600/900/airplane,cockpit?lock=36',
      alt: 'Lorem pixel placeholder showing an aircraft cockpit radio stack.',
      caption: 'Lorem pixel placeholder photo'
    }
  },
  {
    topic: 'vision',
    title: 'A modest vision',
    columns: [
      {
        heading: 'Open data',
        items: [
          'Ingest public ATC streams and NOTAM feeds with scripts anyone can audit.',
          'Describe events in plain language plus schemas.',
          'Let remixing happen without paywalls.'
        ]
      },
      {
        heading: 'Clear signals',
        items: [
          'Deliver quick alerts for the humans in the loop.',
          'Blend voice, telemetry, and weather into one shared timeline.',
          'Keep context so digging deeper is one query away.'
        ]
      },
      {
        heading: 'People first',
        items: [
          'Lower the bar for contributions from dispatchers and devs alike.',
          'Explain decisions openly—even when I’m unsure.',
          'Celebrate forks, experiments, and “this broke for me” reports.'
        ]
      }
    ]
  },
  {
    topic: 'vision',
    title: 'Guiding principles',
    bullets: [
      'Default to text formats and readable config—no magic boxes.',
      'Every automation keeps an audit trail so we can inspect it together.',
      'APIs match internal needs; no private power features.',
      'Accessible in a browser, on a wallboard, or via CLI.'
    ]
  },
  {
    topic: 'vision',
    title: 'Tiny wins so far',
    bullets: [
      'Live ingestion of six European frequencies with Whisper transcription (still tuning accuracy).',
      'NOTAM and METAR polling merged into a single event stream.',
      'Rule engine tagging events with urgency hints—definitely needs peer review.',
      'Bare-bones dashboard showing a streaming timeline and shared notes.'
    ],
    image: {
      src: 'https://loremflickr.com/1600/900/radar,control?lock=48',
      alt: 'Lorem pixel placeholder radar screens glowing in a dark room.',
      caption: 'Lorem pixel placeholder photo'
    },
    note: 'Plenty of sharp edges remain—would love reviews on reliability and developer experience.'
  },
  {
    topic: 'build',
    title: 'System at a glance',
    columns: [
      {
        heading: 'Capture',
        items: [
          'Edge radios push VHF audio via small QUIC relays (Raspberry Pi friendly).',
          'NOTAM/METAR diff scrapers every 60 seconds with retry logic I’m still hardening.'
        ]
      },
      {
        heading: 'Decode',
        items: [
          'Whisper small-v3 for multilingual transcripts (open to better ideas).',
          'Keyword matcher for callsigns, runway states, and weather codes.'
        ]
      },
      {
        heading: 'Enrich',
        items: [
          'Temporal database stitches events with ADS-B position feeds.',
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
    ],
    image: {
      src: 'https://loremflickr.com/1600/900/technology,diagram?lock=60',
      alt: 'Lorem pixel placeholder diagram of connected technology components.',
      caption: 'Lorem pixel placeholder sketch'
    }
  },
  {
    topic: 'build',
    title: 'Tech stack (current draft)',
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
          'Apache Kafka for event streaming (considering Redpanda if simpler).',
          'Materialize for low-latency views.',
          'PostgreSQL for metadata; Supabase for auth & row-level security.'
        ]
      },
      {
        heading: 'Experience layer',
        items: [
          'Nuxt 4 SPA served via edge CDN.',
          'Tailwind-inspired styling tuned for ops rooms.',
          'OpenAPI-defined endpoints with generated TypeScript clients.'
        ]
      },
      {
        heading: 'Ops & tooling',
        items: [
          'Nix flakes for deterministic builds.',
          'GitHub Actions pipelines with ephemeral staging.',
          'Grafana Cloud for metrics & alerting.'
        ]
      }
    ],
    note: 'Happy to swap components if there are smarter picks.'
  },
  {
    topic: 'build',
    title: 'Ingestion pipeline notes',
    bullets: [
      'Multi-tenant radio capture agents publish Opus streams over QUIC.',
      'Temporal workflows batch frames into 20-second jobs for transcription.',
      'Language detection auto-picks acoustic models (still verifying accuracy).',
      'Fallback to manual tagging UI when confidence drops below 70%.'
    ],
    note: 'Would love advice on better fallback heuristics.'
  },
  {
    topic: 'build',
    title: 'Analysis experiments so far',
    bullets: [
      'Vector search surfaces similar past events for faster triage.',
      'Rules DSL compiled to WebAssembly so dispatchers can extend it.',
      'Confidence weighting blends transcript certainty with sensor agreement.',
      'Alert fatigue guardrails throttle repeated low-value pings.'
    ],
    note: 'These are early experiments—please poke holes.'
  },
  {
    topic: 'build',
    title: 'APIs & integrations',
    bullets: [
      'GraphQL gateway for historical queries and analytics.',
      'SSE endpoints for lightweight clients & cockpit tablets.',
      'Plug-in hooks for Mattermost, Slack, or MS Teams notifications.',
      'CLI toolkit emits JSON Lines for quick prototyping.'
    ]
  },
  {
    topic: 'build',
    title: 'Making it kinder for contributors',
    bullets: [
      'Devcontainer scripts spin up the stack with sample data in under five minutes (I hope).',
      'Playground UI for testing rule evaluations before merging.',
      'Observability dashboards versioned with the code.',
      'Docs site built with Nuxt Content—PRs preview via GitHub Actions.'
    ],
    note: 'Always looking for docs feedback—writing is hard.'
  },
  {
    topic: 'build',
    title: 'Keeping things safe & observable',
    bullets: [
      'End-to-end tests replay anonymized traffic nightly (coverage still thin).',
      'OPA policies guard radio streams and redact sensitive fields.',
      'Grafana Loki captures raw transcripts for 24 hours before purging.',
      'Incident playbooks live in-repo with checklists and runbooks.'
    ]
  },
  {
    topic: 'road',
    title: 'Roadmap · next 90 days',
    bullets: [
      'Expand capture network with five community-hosted radios in Spain & Portugal.',
      'Release v0.2 of the rules DSL with visual editor scaffolding.',
      'Ship first-class integration for open-source EFB tool SkyPad.',
      'Publish contribution guidelines and lightweight governance draft.'
    ],
    note: 'Holding myself accountable by sharing this list.'
  },
  {
    topic: 'road',
    title: 'Roadmap · looking further',
    bullets: [
      'Global frequency directory with health checks and uptime badges.',
      'Incident review workspace with collaborative tagging.',
      'Edge ML experiments for on-device noise reduction.',
      'Federated deployments for operators with strict data residency needs.'
    ]
  },
  {
    topic: 'together',
    title: 'Why I’m sharing tonight',
    bullets: [
      'This is my first open-source repo—guidance on structure and tone would mean a lot.',
      'Need reality checks: does the event model map to how your ops actually work?',
      'Curious how you approach starting and sustaining open projects.',
      'If nothing else, I’d love stories about what to avoid.'
    ]
  },
  {
    topic: 'together',
    title: 'Ways to join if it resonates',
    bullets: [
      'Review the architecture docs and call out blind spots.',
      'Run the setup script; let me know where it hurts or feels confusing.',
      'Pair-program on the rules editor—frontend, backend, or DX improvements welcome.',
      'Even a quick note on community building or licensing helps.'
    ]
  },
  {
    topic: 'together',
    title: 'Thank you & repo',
    text: [
      'I’m opening the repo tonight and would love to grow it with people who care about accessible aviation data.',
      'Scan to star the repo, file an issue, or just drop a note with your advice.'
    ],
    qr: 'https://github.com/nickmakes/opensquawk',
    note: 'I’m grateful for any tips on launching and maintaining open-source projects.',
    footer: 'Thanks for listening—please reach out: nick.danner@opensquawk.dev · Any feedback is gold.'
  }
]

const topics = [
  { id: 'hello', label: 'Hi' },
  { id: 'story', label: 'Story' },
  { id: 'vision', label: 'Vision' },
  { id: 'build', label: 'Build' },
  { id: 'road', label: 'Road' },
  { id: 'together', label: 'Together' }
]

const totalSlides = slides.length
const currentIndex = ref(0)
const qrCode = ref('')
const showHint = ref(true)
const qrTarget = 'https://github.com/nickmakes/opensquawk'
const isFullscreen = ref(false)
const canFullscreen = ref(false)

const topicBoundaries = topics.map((topic) => {
  const indices = slides.reduce((acc, slide, index) => {
    if (slide.topic === topic.id) {
      acc.push(index)
    }
    return acc
  }, [])
  return {
    ...topic,
    firstIndex: indices.length ? Math.min(...indices) : -1,
    lastIndex: indices.length ? Math.max(...indices) : -1
  }
})

const topicStates = computed(() =>
  topicBoundaries.map((topic) => {
    if (topic.firstIndex === -1) {
      return { ...topic, state: 'todo' }
    }
    if (currentIndex.value > topic.lastIndex) {
      return { ...topic, state: 'done' }
    }
    if (currentIndex.value >= topic.firstIndex && currentIndex.value <= topic.lastIndex) {
      return { ...topic, state: 'active' }
    }
    return { ...topic, state: 'todo' }
  })
)

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

const requestFullscreen = async () => {
  const element = document.documentElement
  if (!element) {
    return
  }

  if (element.requestFullscreen) {
    await element.requestFullscreen()
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen()
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen()
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen()
  }
}

const exitFullscreen = async () => {
  if (document.exitFullscreen) {
    await document.exitFullscreen()
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen()
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen()
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen()
  }
}

const toggleFullscreen = async () => {
  try {
    if (document.fullscreenElement) {
      await exitFullscreen()
    } else {
      await requestFullscreen()
    }
  } catch (error) {
    console.error('Fullscreen toggle failed', error)
  }
}

const updateFullscreenState = () => {
  isFullscreen.value = Boolean(document.fullscreenElement)
}

const jumpToTopic = (topic) => {
  if (typeof topic.firstIndex === 'number' && topic.firstIndex >= 0) {
    goToSlide(topic.firstIndex)
  }
}

const onTopicKeydown = (event, topic) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    event.stopPropagation()
    jumpToTopic(topic)
  }
}

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
  if (target instanceof Element) {
    if (target.closest('.qr-wrapper') || target.closest('.fullscreen-btn') || target.closest('.topic-outline')) {
      return
    }
  }
  nextSlide()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('fullscreenchange', updateFullscreenState)
  canFullscreen.value =
    typeof document.fullscreenEnabled === 'undefined' ? true : Boolean(document.fullscreenEnabled)
  updateFullscreenState()

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
  document.removeEventListener('fullscreenchange', updateFullscreenState)
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
  opacity: 0.75;
}

h1 {
  font-size: clamp(3.2rem, 6vw, 4rem);
  margin: 0;
  line-height: 1.08;
}

h2 {
  font-size: clamp(2.6rem, 5vw, 3.2rem);
  margin: 0;
  line-height: 1.12;
}

.subtitle {
  font-size: 1.35rem;
  color: rgba(226, 232, 240, 0.85);
  margin: 0;
}

.lead {
  font-size: 1.25rem;
  line-height: 1.6;
  color: rgba(226, 232, 240, 0.92);
  margin: 0;
}

.bullet-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bullet-list li {
  display: flex;
  gap: 14px;
  font-size: 1.15rem;
  color: rgba(226, 232, 240, 0.9);
  line-height: 1.55;
}

.marker {
  width: 12px;
  height: 12px;
  margin-top: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  flex-shrink: 0;
}

.columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 24px;
}

.column h3 {
  margin: 0 0 12px;
  font-size: 1.2rem;
  color: rgba(129, 140, 248, 0.85);
  text-transform: uppercase;
  letter-spacing: 0.14em;
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

.media {
  align-self: center;
  width: min(75%, 820px);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.media img {
  width: 100%;
  height: auto;
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(8, 47, 73, 0.55);
  object-fit: cover;
}

.caption {
  font-size: 0.8rem;
  color: rgba(148, 163, 184, 0.75);
  letter-spacing: 0.12em;
  text-transform: uppercase;
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

.fullscreen-btn {
  position: absolute;
  top: 24px;
  right: 28px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.32);
  background: rgba(148, 163, 184, 0.12);
  color: #e2e8f0;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 160ms ease, border 160ms ease, color 160ms ease;
}

.fullscreen-btn:hover {
  background: rgba(148, 163, 184, 0.22);
  border-color: rgba(148, 163, 184, 0.45);
}

.fullscreen-btn:focus-visible {
  outline: 2px solid #38bdf8;
  outline-offset: 3px;
}

.key-hint {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 6px;
  padding: 2px 6px;
  font-size: 0.75rem;
  color: rgba(226, 232, 240, 0.85);
  background: rgba(15, 23, 42, 0.7);
}

.meta {
  padding: 12px 24px 16px;
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
  color: rgba(148, 163, 184, 0.75);
  transition: opacity 200ms ease;
}

.hint.hidden {
  opacity: 0;
}

.topic-outline {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 0 36px 26px;
  flex-wrap: wrap;
}

.topic-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(148, 163, 184, 0.55);
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.18);
  cursor: pointer;
  transition: color 160ms ease, border 160ms ease, background 160ms ease, opacity 160ms ease;
  opacity: 0.45;
}

.topic-chip.done {
  color: rgba(226, 232, 240, 0.8);
  border-color: rgba(148, 163, 184, 0.35);
  opacity: 0.85;
}

.topic-chip.active {
  color: #f8fafc;
  border-color: rgba(56, 189, 248, 0.8);
  background: rgba(56, 189, 248, 0.18);
  opacity: 1;
}

.topic-chip:focus-visible {
  outline: 2px solid rgba(56, 189, 248, 0.85);
  outline-offset: 3px;
}

.topic-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
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

  .media {
    width: min(88%, 700px);
  }

  .fullscreen-btn {
    top: 18px;
    right: 20px;
    padding: 8px 14px;
  }

  h1 {
    font-size: clamp(2.6rem, 7vw, 3.4rem);
  }

  h2 {
    font-size: clamp(2.2rem, 5.5vw, 3rem);
  }

  .topic-outline {
    padding: 0 24px 20px;
    gap: 10px;
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

  .media {
    width: 100%;
  }

  .media img {
    border-radius: 14px;
  }

  .fullscreen-btn {
    font-size: 0.8rem;
    padding: 6px 12px;
  }

  .topic-chip {
    font-size: 0.75rem;
    padding: 6px 12px;
  }
}
</style>
