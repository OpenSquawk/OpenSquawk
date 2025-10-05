<template>
  <div class="feedback-page">
    <section class="feedback-hero">
      <div class="feedback-hero__bg" aria-hidden="true"/>
      <div class="container-outer">
        <div class="hero-grid">
          <header class="hero-copy" data-aos="fade-up">
            <p class="eyebrow">Tell us what to build next</p>
            <h1>Feedback keeps OpenSquawk sharp</h1>
            <p class="hero-description">
              Bridge pilots, classroom cadets and curious builders &mdash; this is your hangar.
              Drop us quick wins, tricky bugs or bold ideas so we can tune every release together.
            </p>
            <div class="hero-actions">
              <a
                class="btn btn-primary"
                href="mailto:info@opensquawk.de?subject=OpenSquawk%20feedback"
              >
                <v-icon icon="mdi-send" size="20"/>
                Send feedback email
              </a>
              <NuxtLink class="btn btn-ghost" to="/classroom">
                <v-icon icon="mdi-school" size="20"/>
                Classroom roadmap
              </NuxtLink>
            </div>
            <p class="hero-footnote">
              Prefer async conversation? Hop into the waitlist reply or ping us on GitHub issues &mdash; we read every note.
            </p>
          </header>
          <div class="hero-preview" data-aos="fade-left" data-aos-delay="100">
            <div class="preview-card">
              <div class="preview-card__header">
                <span class="status-dot" aria-hidden="true"/>
                Realtime loop
              </div>
              <p>
                "Callsign Delta Foxtrot ready for pushback."<br>
                "Stand by, checking traffic…"<br>
                "Push approved, expect taxi via A1."<br>
                <span class="preview-card__note">Leave a note when that loop feels off.</span>
              </p>
            </div>
            <div class="preview-card secondary">
              <h3>How we use your words</h3>
              <ul>
                <li>Rank Live ATC fixes and training packs.</li>
                <li>Shape the Bridge UI so setup stays quick.</li>
                <li>Spot phraseology quirks before release.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="container-outer section-spacing" data-aos="fade-up">
      <header class="section-heading">
        <p class="eyebrow">Choose your runway</p>
        <h2>Pick the track that fits your note</h2>
        <p class="section-lead">
          We split feedback so teams can react quickly. Select the option that matches your vibe and we'll follow up from there.
        </p>
      </header>
      <div class="feedback-grid">
        <article v-for="lane in lanes" :key="lane.title" class="feedback-card">
          <span class="icon-pill">
            <v-icon :icon="lane.icon" size="24"/>
          </span>
          <div class="card-body">
            <h3>{{ lane.title }}</h3>
            <p>{{ lane.description }}</p>
            <div class="chip-list">
              <span v-for="tag in lane.tags" :key="tag" class="chip">{{ tag }}</span>
            </div>
          </div>
          <component
            :is="lane.external ? 'a' : 'NuxtLink'"
            :href="lane.external ? lane.href : undefined"
            :to="!lane.external ? lane.href : undefined"
            class="card-action"
            :target="lane.external ? '_blank' : undefined"
            :rel="lane.external ? 'noopener' : undefined"
          >
            <span>{{ lane.cta }}</span>
            <v-icon icon="mdi-arrow-right" size="20"/>
          </component>
        </article>
      </div>
    </section>

    <section class="bg-panel section-spacing" data-aos="fade-up">
      <div class="container-outer feedback-highlights">
        <header class="section-heading">
          <p class="eyebrow">What happens next</p>
          <h2>Every signal routes into our weekly build</h2>
          <p class="section-lead">
            We review feedback every sprint alongside the Bridge drop plan and classroom schedule.
          </p>
        </header>
        <div class="timeline">
          <div v-for="step in process" :key="step.title" class="timeline-card">
            <span class="icon-pill">
              <v-icon :icon="step.icon" size="22"/>
            </span>
            <div>
              <h3>{{ step.title }}</h3>
              <p>{{ step.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="container-outer section-spacing closing" data-aos="fade-up">
      <div class="closing-card">
        <div class="closing-copy">
          <h2>Want to co-build?</h2>
          <p>
            We're always pairing with engineers, ATC specialists and sim pilots. Tell us how you'd like to help and we'll line up a short call.
          </p>
        </div>
        <div class="closing-actions">
          <a class="btn btn-primary" href="mailto:info@opensquawk.de?subject=OpenSquawk%20collaboration">
            <v-icon icon="mdi-account-plus" size="20"/>
            Start a collaboration note
          </a>
          <NuxtLink class="btn btn-ghost" to="/bridge/index">
            <v-icon icon="mdi-transit-connection-variant" size="20"/>
            Explore the Bridge
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const lanes = [
  {
    icon: 'mdi-lightbulb-on-outline',
    title: 'Product ideas',
    description: 'Share feature ideas for Live ATC, Bridge or the classroom so we can map upcoming drops.',
    tags: ['Feature request', 'Workflow tweak', 'Voice pack'],
    cta: 'Open idea form',
    href: 'https://github.com/opensquawk/opensquawk/discussions',
    external: true
  },
  {
    icon: 'mdi-bug-outline',
    title: 'Report a bug',
    description: 'Found a glitch or audio hiccup? Send steps and recordings so we can reproduce it fast.',
    tags: ['Logs', 'Screenshots', 'Regression'],
    cta: 'Log an issue',
    href: 'https://github.com/opensquawk/opensquawk/issues/new/choose',
    external: true
  },
  {
    icon: 'mdi-headset',
    title: 'Classroom coaching',
    description: 'Tell us where lesson pacing or phraseology feels unclear and we will adjust the drills.',
    tags: ['Lesson feedback', 'Content request', 'Timing'],
    cta: 'Email the classroom team',
    href: 'mailto:info@opensquawk.de?subject=Classroom%20feedback',
    external: true
  },
  {
    icon: 'mdi-account-group-outline',
    title: 'Community & access',
    description: 'Need invite help or want to join the next alpha? Reach out and we will get you sorted.',
    tags: ['Waitlist', 'Invites', 'Partnership'],
    cta: 'Ping support',
    href: 'mailto:info@opensquawk.de?subject=Support%20request',
    external: true
  }
]

const process = [
  {
    icon: 'mdi-email-fast-outline',
    title: 'Collect',
    description: 'We triage every submission and group it by product area within 24 hours.'
  },
  {
    icon: 'mdi-clipboard-list-outline',
    title: 'Prioritize',
    description: 'Roadmap owners review the stack weekly to slot fixes or add ideas to discovery.'
  },
  {
    icon: 'mdi-rocket-launch-outline',
    title: 'Close the loop',
    description: 'Once a change ships we follow up with patch notes or a direct reply so you know it landed.'
  }
]
</script>

<style scoped>
.feedback-page {
  @apply bg-[#0b1020] text-white min-h-screen pb-20;
}

.feedback-hero {
  position: relative;
  overflow: hidden;
  padding: 7rem 0 5rem;
}

.feedback-hero__bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(900px 500px at 15% -5%, rgba(34, 211, 238, 0.28), transparent 60%),
    radial-gradient(780px 420px at 85% 0%, rgba(14, 165, 233, 0.22), transparent 70%),
    linear-gradient(180deg, rgba(11, 16, 32, 0.96) 0%, rgba(11, 16, 32, 0.86) 45%, rgba(10, 15, 28, 0.95) 100%);
  opacity: 0.95;
}

.hero-grid {
  position: relative;
  display: grid;
  gap: 3rem;
  align-items: center;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 1024px) {
  .hero-grid {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  }
}

.hero-copy h1 {
  font-size: clamp(2.5rem, 5vw, 3.75rem);
  font-weight: 600;
  line-height: 1.1;
  margin-bottom: 1.25rem;
}

.hero-description {
  color: rgba(255, 255, 255, 0.75);
  font-size: 1rem;
  max-width: 36rem;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
}

.hero-footnote {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  max-width: 30rem;
}

.hero-preview {
  position: relative;
  display: grid;
  gap: 1.5rem;
}

.preview-card {
  border-radius: 1.75rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 15, 28, 0.85);
  padding: 1.75rem;
  box-shadow: 0 30px 80px rgba(8, 12, 30, 0.45);
}

.preview-card__header {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 999px;
  background: rgba(34, 211, 238, 0.12);
  color: rgba(34, 211, 238, 0.95);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  padding: 0.4rem 0.85rem;
  margin-bottom: 1rem;
}

.status-dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: rgba(34, 211, 238, 1);
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.85);
}

.preview-card p {
  font-size: 0.95rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.78);
}

.preview-card__note {
  display: block;
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.55);
}

.preview-card.secondary {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
}

.preview-card.secondary h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.9rem;
}

.preview-card.secondary ul {
  display: grid;
  gap: 0.65rem;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.95rem;
}

.section-spacing {
  padding-top: 4.5rem;
  padding-bottom: 4.5rem;
}

.section-heading {
  max-width: 44rem;
  margin-bottom: 2.5rem;
}

.section-heading h2 {
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 600;
}

.section-lead {
  margin-top: 0.9rem;
  color: rgba(255, 255, 255, 0.68);
  font-size: 1rem;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.28em;
  color: rgba(34, 211, 238, 0.85);
  font-weight: 600;
}

.eyebrow::before {
  content: '';
  display: block;
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 999px;
  background: rgba(34, 211, 238, 0.85);
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.75);
}

.feedback-grid {
  display: grid;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .feedback-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.feedback-card {
  position: relative;
  display: grid;
  gap: 1.25rem;
  border-radius: 1.75rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(145deg, rgba(15, 20, 36, 0.82), rgba(9, 12, 24, 0.82));
  padding: 1.75rem;
  box-shadow: 0 24px 70px rgba(7, 10, 26, 0.45);
}

.icon-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 1.15rem;
  background: rgba(34, 211, 238, 0.14);
  color: rgba(34, 211, 238, 0.9);
  box-shadow: inset 0 0 30px rgba(34, 211, 238, 0.08);
}

.card-body h3 {
  font-size: 1.3rem;
  font-weight: 600;
}

.card-body p {
  margin-top: 0.6rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.98rem;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.9rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.65);
}

.card-action {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.45rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(34, 211, 238, 0.9);
  text-decoration: none;
  margin-top: auto;
}

.card-action:hover {
  color: rgba(34, 211, 238, 1);
}

.bg-panel {
  background: linear-gradient(180deg, rgba(10, 15, 28, 0.95) 0%, rgba(8, 12, 24, 0.9) 100%);
}

.feedback-highlights {
  display: grid;
  gap: 2.5rem;
}

.timeline {
  display: grid;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .timeline {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.timeline-card {
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 20, 36, 0.78);
  padding: 1.75rem;
  display: grid;
  gap: 1rem;
  align-content: start;
}

.timeline-card h3 {
  font-size: 1.15rem;
  font-weight: 600;
}

.timeline-card p {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.68);
}

.closing {
  padding-bottom: 6rem;
}

.closing-card {
  display: grid;
  gap: 1.5rem;
  border-radius: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.14), rgba(14, 165, 233, 0.08));
  padding: clamp(2rem, 5vw, 3rem);
  box-shadow: 0 28px 90px rgba(5, 12, 28, 0.48);
}

@media (min-width: 1024px) {
  .closing-card {
    grid-template-columns: minmax(0, 1fr) minmax(0, auto);
    align-items: center;
  }
}

.closing-copy h2 {
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 600;
}

.closing-copy p {
  margin-top: 0.75rem;
  color: rgba(255, 255, 255, 0.72);
  max-width: 34rem;
}

.closing-actions {
  display: grid;
  gap: 0.85rem;
}

@media (min-width: 640px) {
  .closing-actions {
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    gap: 1rem;
    justify-content: flex-end;
  }
}

.btn {
  @apply inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition px-5 py-3;
}

.btn-primary {
  @apply bg-cyan-500 text-white hover:bg-cyan-400 shadow-[0_0_35px_rgba(34,211,238,0.25)];
}

.btn-ghost {
  @apply bg-white/5 text-white hover:bg-white/10;
}

.container-outer {
  @apply mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-8;
}
</style>
