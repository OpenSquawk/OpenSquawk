<template>
  <div class="presentation" ref="presentationRef">
    <div class="frame">
      <Transition name="fade" mode="out-in">
        <section class="slide" :key="currentIndex" @click="handleSlideClick">
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
          <div v-if="currentSlide.image" class="image">
            <img :src="currentSlide.image.src" :alt="currentSlide.image.alt" loading="lazy" />
            <p v-if="currentSlide.image.caption" class="image-caption">{{ currentSlide.image.caption }}</p>
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
          <div v-if="currentIndex === 0 && !isFullscreen" class="fullscreen-callout">
            <button type="button" class="fullscreen-button" @click.stop="toggleFullscreen">
              Enter fullscreen
            </button>
            <p class="fullscreen-hint">Or press “F” anytime.</p>
          </div>
          <footer v-if="currentSlide.footer" class="slide-footer">{{ currentSlide.footer }}</footer>
        </section>
      </Transition>
      <div class="meta">
        <div class="progress-info">
          <div class="progress-label">{{ currentIndex + 1 }} / {{ totalSlides }}</div>
          <div class="progress">
            <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
          </div>
        </div>
        <div class="meta-actions">
          <button type="button" class="meta-fullscreen" @click.stop="toggleFullscreen">
            {{ isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen' }}
          </button>
          <div class="hint" :class="{ hidden: !showHint }">Press ←/→, space, or click · “F” toggles fullscreen</div>
        </div>
      </div>
      <div class="outline">
        <div
          v-for="(section, index) in sections"
          :key="section.id"
          class="outline-item"
          :class="{ active: index === currentSectionIndex, past: index < currentSectionIndex }"
        >
          <span>{{ section.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { renderSVG } from 'uqr'

const sections = [
  { id: 'intro', label: 'Intro' },
  { id: 'story', label: 'Story' },
  { id: 'vision', label: 'Vision' },
  { id: 'build', label: 'Build' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'invite', label: 'Invite' }
]

const slides = [
  {
    layout: 'title',
    section: 'intro',
    kicker: 'Nick Danner · learning in public',
    title: 'OpenSquawk',
    subtitle: 'A small open-source experiment for shared aviation awareness',
    text: ['Thanks for letting me share where this little project is at right now.']
  },
  {
    section: 'intro',
    title: 'A quick hello',
    bullets: [
      "I'm Nick, a systems tinkerer splitting time between Hamburg and makeshift desks in terminals.",
      'Most of my career was stitching radios, telemetry, and dispatch tools so other people could fly safely.',
      "This is my first time leading an open project, so I'm very much relying on your experience."
    ],
    footer: 'nick.danner@opensquawk.dev · @nickcodes (DMs open)'
  },
  {
    section: 'intro',
    title: 'Path so far',
    bullets: [
      '2015-2018 · Helped a tiny avionics shop wire sensors into aging airframes.',
      '2018-2023 · Worked on real-time telemetry platforms for drones and regional airlines.',
      '2024 · Taking a breather to learn in public and invite others in early.'
    ]
  },
  {
    section: 'story',
    title: 'Why radios keep me up at night',
    text: [
      'Night shifts on ops desks showed how messy it gets when voice, text, and weather live in separate silos.',
      'I kept wondering if a lightweight, transparent stream could help small teams react faster.'
    ]
  },
  {
    section: 'story',
    title: 'The messy moment',
    bullets: [
      'A hack night in Berlin: three chats, two dashboards, and screenshots flying around at 03:00.',
      'Controllers emailed PDFs while crews kept refreshing NOTAM feeds hoping for context.',
      'We trusted the data but not the coordination.'
    ],
    quote: 'We lost more time explaining updates than acting on them.'
  },
  {
    section: 'story',
    title: 'Seed of the idea',
    text: [
      'I started sketching a stream that anyone could inspect, fork, and improve without vendor lock-in.',
      'The hope: community radios plus open tooling might cover gaps that vendors ignore.'
    ],
    image: {
      src: 'https://loremflickr.com/1200/675/airport,night',
      alt: 'Placeholder photo of people collaborating around radios',
      caption: 'Placeholder photo via LoremFlickr to set the scene.'
    }
  },
  {
    section: 'vision',
    title: 'What I hope OpenSquawk becomes',
    text: [
      'An open source kit that turns ATC audio and public data into shared situational awareness.'
    ],
    bullets: [
      'Keep the pipeline transparent so anyone can audit or remix it.',
      'Make it lightweight enough for hobbyists yet useful for ops desks.',
      'Let community voices steer what “useful” means.'
    ]
  },
  {
    section: 'vision',
    title: 'How it might feel day to day',
    columns: [
      {
        heading: 'Pilots',
        text: ['Get concise runway or weather heads-up moments after they drop on frequency.']
      },
      {
        heading: 'Dispatch',
        text: ['See voice + NOTAM + METAR stitched on one simple timeline.']
      },
      {
        heading: 'Community',
        text: ['Tune in, suggest better rules, and share improvements openly.']
      }
    ],
    image: {
      src: 'https://loremflickr.com/1200/675/cockpit',
      alt: 'Placeholder photo of cockpit teamwork',
      caption: 'Simple LoremFlickr placeholder to imagine the workflow.'
    }
  },
  {
    section: 'vision',
    title: 'Principles guiding me',
    bullets: [
      'Plain text configs and docs that explain the “why”, not just the “how”.',
      'Audit trails everywhere so mistakes can be traced kindly.',
      'APIs mirror real use-cases—no secret features hidden in private branches.',
      'Assume contributors will outsmart me, so make experiments easy.'
    ]
  },
  {
    section: 'build',
    title: 'Pieces already moving',
    bullets: [
      'Edge recorders capture a handful of European ATC streams (thanks to patient friends).',
      'Whisper-small transcribes into events with basic tagging for callsigns and runways.',
      'A Nuxt dashboard renders a live timeline so I can sanity check alerts.'
    ]
  },
  {
    section: 'build',
    title: 'Where it still creaks',
    bullets: [
      'Transcripts drift when accents or noise ramp up—confidence handling needs love.',
      'Rule logic is brittle; today it is just my manual tweaks.',
      'Docs lag behind code, so onboarding is rough without me on a call.'
    ]
  },
  {
    section: 'build',
    title: 'Capture flow (draft)',
    columns: [
      {
        heading: 'Listen',
        items: [
          'Community radios stream Opus audio over QUIC tunnels.',
          'Fallback: simple HTTPS polling when ports are locked down.'
        ]
      },
      {
        heading: 'Buffer',
        items: [
          'Rust shim segments audio into 20s chunks with metadata.',
          'S3-compatible storage keeps short-term history.'
        ]
      },
      {
        heading: 'Dispatch',
        items: [
          'Temporal kicks off transcription jobs and retries politely.',
          'Events land on Kafka for anything downstream.'
        ]
      }
    ],
    image: {
      src: 'https://loremflickr.com/1200/675/radio',
      alt: 'Placeholder photo of radio equipment',
      caption: 'LoremFlickr placeholder to visualize the capture setup.'
    }
  },
  {
    section: 'build',
    title: 'Transcribe & enrich',
    bullets: [
      'Automatic language detection picks Whisper models per frequency.',
      'Keyword heuristics tag runways, aircraft, and urgency hints.',
      'Geo lookups attach airport + sector context in near real time.',
      'Low confidence items pause for a simple review queue.'
    ]
  },
  {
    section: 'build',
    title: 'Serving the data',
    columns: [
      {
        heading: 'Real-time',
        items: [
          'SSE and WebSocket endpoints feed dashboards and CLI clients.',
          'Rules engine emits quick summaries for phones or tablets.'
        ]
      },
      {
        heading: 'History',
        items: [
          'Materialize maintains rolling windows for trend checks.',
          'PostgreSQL keeps annotated events for deeper dives.'
        ]
      },
      {
        heading: 'Sharing',
        items: [
          'Supabase auth keeps things open but respectful.',
          'OpenAPI specs generate TypeScript helpers automatically.'
        ]
      }
    ],
    image: {
      src: 'https://loremflickr.com/1200/675/technology',
      alt: 'Placeholder photo of data dashboards',
      caption: 'Another LoremFlickr placeholder to hint at the UI.'
    }
  },
  {
    section: 'build',
    title: 'Toolbox right now',
    columns: [
      {
        heading: 'Languages',
        items: ['Rust for capture agents.', 'Python for transcription orchestration.', 'TypeScript/Vue for the UI.']
      },
      {
        heading: 'Infra',
        items: [
          'Kafka + Redpanda locally for streams.',
          'Materialize & Postgres for storage.',
          'Docker + Nix flakes for reproducible dev envs.'
        ]
      },
      {
        heading: 'Observability',
        items: [
          'Grafana + Loki for quick checks.',
          'Sentry (self-hosted) for Nuxt errors.',
          'Plain text logs shipped to object storage.'
        ]
      }
    ]
  },
  {
    section: 'build',
    title: 'Reality check & open questions',
    bullets: [
      'How to keep costs friendly if community radios scale up?',
      'What safety reviews should an open stream pass before others depend on it?',
      'Is my event schema even close to what real ops teams need?',
      'What have I overlooked completely? I’d love blunt feedback.'
    ],
    note: 'I assume many of you have solved tougher problems—please call out gaps kindly.'
  },
  {
    section: 'roadmap',
    title: 'Next few weeks',
    bullets: [
      'Polish contributor docs and record setup walkthrough videos.',
      'Stabilize capture nodes on cheap single-board computers.',
      'Refine alert wording with two volunteer dispatchers.'
    ]
  },
  {
    section: 'roadmap',
    title: 'Spring & summer focus',
    bullets: [
      'Open-source the review queue UI for low-confidence transcripts.',
      'Publish a simple API playground so others can poke without cloning everything.',
      'Add automated health checks for each radio feed.'
    ]
  },
  {
    section: 'roadmap',
    title: 'Longer-term hopes',
    bullets: [
      'Global map of volunteer radios with uptime badges.',
      'Community rule library people can share and fork.',
      'Experiment with lightweight on-device noise reduction.',
      'Figure out sustainable hosting without putting paywalls up.'
    ]
  },
  {
    section: 'invite',
    title: 'Where I could use help',
    bullets: [
      'Feedback on whether the architecture matches real-world ops pressure.',
      'Advice on running welcoming open-source communities (moderation, onboarding, etc.).',
      'Folks with spare radio gear or know-how to host a feed for a week or two.'
    ]
  },
  {
    section: 'invite',
    title: 'Ways to share advice',
    bullets: [
      'Open an issue or discussion in the repo—small notes are fantastic.',
      'Join a casual video call; I’m happy to schedule around you.',
      'Share docs, templates, or stories from your own open projects I should study.',
      'If you prefer anonymous feedback, I can set up a simple form.'
    ]
  },
  {
    section: 'invite',
    title: 'Thank you for listening',
    text: [
      'I’m opening the repo tonight and would be grateful for any pointers or company.',
      'Scan to star the repo, file an issue, or just say hi.'
    ],
    qr: 'https://github.com/nickmakes/opensquawk',
    footer: 'Seriously, thank you. Every bit of guidance helps me keep this grounded.'
  }
]

const totalSlides = slides.length
const currentIndex = ref(0)
const qrCode = ref('')
const showHint = ref(true)
const isFullscreen = ref(false)
const presentationRef = ref(null)
const qrTarget = 'https://github.com/nickmakes/opensquawk'

const currentSlide = computed(() => slides[currentIndex.value])
const progress = computed(() => ((currentIndex.value + 1) / totalSlides) * 100)
const currentSectionIndex = computed(() => {
  const sectionId = currentSlide.value.section
  const idx = sections.findIndex((section) => section.id === sectionId)
  return idx === -1 ? 0 : idx
})

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
  try {
    if (!document.fullscreenElement) {
      const element = presentationRef.value
      if (element && element.requestFullscreen) {
        await element.requestFullscreen()
      }
    } else if (document.exitFullscreen) {
      await document.exitFullscreen()
    }
  } catch (error) {
    console.error('Failed to toggle fullscreen', error)
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
  } else if (event.key === 'f' || event.key === 'F') {
    event.preventDefault()
    toggleFullscreen()
  }
}

const handleSlideClick = (event) => {
  const target = event.target
  const element = target instanceof Element ? target : null
  if (element && (element.closest('button') || element.closest('a') || element.closest('.qr-wrapper'))) {
    return
  }
  nextSlide()
}

const onFullscreenChange = () => {
  isFullscreen.value = Boolean(document.fullscreenElement)
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  isFullscreen.value = Boolean(document.fullscreenElement)
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
  document.removeEventListener('fullscreenchange', onFullscreenChange)
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
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.18);
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
  padding: 64px 72px 32px;
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
  opacity: 0.85;
}

h1 {
  font-size: clamp(3rem, 5.6vw, 4.4rem);
  margin: 0;
  line-height: 1.05;
}

h2 {
  font-size: clamp(2.4rem, 4.3vw, 3.4rem);
  margin: 0;
  line-height: 1.12;
}

.subtitle {
  font-size: 1.2rem;
  color: rgba(226, 232, 240, 0.88);
  margin: 0;
}

.lead {
  font-size: 1.15rem;
  color: rgba(226, 232, 240, 0.92);
  margin: 0;
}

.bullet-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.bullet-list li {
  display: flex;
  gap: 16px;
  font-size: 1.12rem;
  color: rgba(226, 232, 240, 0.92);
}

.marker {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  margin-top: 10px;
  flex-shrink: 0;
}

.columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 24px;
  align-items: start;
}

.column h3 {
  margin: 0 0 10px;
  font-size: 1.05rem;
  color: #a5b4fc;
  text-transform: uppercase;
  letter-spacing: 0.12em;
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

.image {
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 18px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.6);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.35);
}

.image img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
}

.image-caption {
  margin: 10px 16px 14px;
  font-size: 0.9rem;
  text-align: center;
  color: rgba(148, 163, 184, 0.85);
}

.quote {
  font-size: 1.3rem;
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
  margin-top: 16px;
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

.fullscreen-callout {
  margin-top: auto;
  padding: 20px 24px;
  border-radius: 16px;
  border: 1px dashed rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 320px;
}

.fullscreen-button,
.meta-fullscreen {
  cursor: pointer;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  background: rgba(56, 189, 248, 0.18);
  color: #e2e8f0;
  font-size: 0.95rem;
  padding: 10px 20px;
  transition: background 180ms ease, transform 180ms ease;
}

.fullscreen-button:hover,
.meta-fullscreen:hover {
  background: rgba(56, 189, 248, 0.3);
  transform: translateY(-1px);
}

.fullscreen-hint {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(148, 163, 184, 0.85);
}

.meta {
  padding: 12px 32px 18px;
  display: flex;
  gap: 24px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 18px;
  flex: 1;
  min-width: 220px;
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
  min-width: 72px;
}

.meta-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.hint {
  font-size: 0.85rem;
  color: rgba(148, 163, 184, 0.72);
  transition: opacity 200ms ease;
  text-align: right;
}

.hint.hidden {
  opacity: 0;
}

.outline {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 12px;
  padding: 0 32px 32px;
}

.outline-item {
  text-align: center;
  padding-top: 10px;
  border-top: 2px solid rgba(148, 163, 184, 0.25);
  font-size: 0.85rem;
  color: rgba(148, 163, 184, 0.7);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.outline-item.past {
  border-color: rgba(56, 189, 248, 0.35);
  color: rgba(148, 163, 184, 0.85);
}

.outline-item.active {
  border-color: rgba(56, 189, 248, 0.85);
  color: #e0f2fe;
  font-weight: 600;
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
    padding: 48px 44px 24px;
  }

  h1 {
    font-size: clamp(2.6rem, 7vw, 3.6rem);
  }

  h2 {
    font-size: clamp(2.2rem, 5vw, 3rem);
  }
}

@media (max-width: 768px) {
  .presentation {
    padding: 1.5vh;
  }

  .frame {
    border-radius: 18px;
  }

  .slide {
    padding: 40px 28px 20px;
    gap: 20px;
  }

  .meta {
    padding: 12px 20px 16px;
  }

  .outline {
    padding: 0 20px 24px;
  }

  .meta-actions {
    align-items: stretch;
  }

  .hint {
    text-align: left;
  }
}
</style>
