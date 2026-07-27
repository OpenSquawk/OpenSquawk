<template>
  <main class="classroom-intro">
    <div class="intro-glow intro-glow--one" aria-hidden="true"></div>
    <div class="intro-glow intro-glow--two" aria-hidden="true"></div>

    <section class="intro-shell" aria-labelledby="classroom-intro-title">
      <div class="intro-copy">
        <span class="eyebrow">
          <v-icon icon="mdi-school-outline" size="17" />
          Classroom
        </span>

        <h1 id="classroom-intro-title">Learn the radio patterns before Live ATC</h1>
        <p class="lead">
          Classroom breaks ICAO/SERA English into short guided drills. Read or listen to a prompt,
          complete the safety-critical parts of the pilot response, check your answer, and repeat
          with new training data.
        </p>

        <div class="steps" aria-label="How Classroom works">
          <article>
            <span class="step-number">1</span>
            <div>
              <h2>Understand the prompt</h2>
              <p>Identify the clearance, instruction, or situation.</p>
            </div>
          </article>
          <article>
            <span class="step-number">2</span>
            <div>
              <h2>Build the pilot response</h2>
              <p>Complete the required callsign, runway, level, heading, channel, or other critical elements.</p>
            </div>
          </article>
          <article>
            <span class="step-number">3</span>
            <div>
              <h2>Check and repeat</h2>
              <p>See what was correct, review the standard phrase, and practise another variation.</p>
            </div>
          </article>
        </div>

        <div class="scope-note" role="note">
          <v-icon icon="mdi-information-outline" size="20" />
          <p>
            Answers are typed. ATC audio is optional. Training values are synthetic and must not be
            used for real-world operations.
          </p>
        </div>

        <div class="intro-actions">
          <NuxtLink
            class="primary-action"
            to="/classroom?panel=module&module=normalize&lesson=icao-alphabet"
            @click="completeIntroduction"
          >
            Start with Foundations
            <v-icon icon="mdi-arrow-right" size="20" />
          </NuxtLink>
          <NuxtLink class="secondary-action" to="/classroom" @click="completeIntroduction">
            View all modules
          </NuxtLink>
        </div>
      </div>

      <aside class="practice-card" aria-label="Example guided drill">
        <div class="practice-card__top">
          <span class="practice-kicker">Example · Mandatory readback</span>
          <span class="synthetic-chip">Synthetic data</span>
        </div>
        <p class="controller-label">ATC prompt</p>
        <blockquote>
          “Training Two Four, turn left heading two seven zero, descend four thousand feet.”
        </blockquote>
        <div class="response-preview">
          <p>Pilot readback</p>
          <div>
            Turn <span>left</span> heading <span>270</span>, descend <span>4,000 ft</span>,
            <span>Training Two Four</span>
          </div>
        </div>
        <div class="check-row">
          <v-icon icon="mdi-check-circle" size="22" />
          <div>
            <strong>4 of 4 required elements correct</strong>
            <span>Direction, heading, level, and callsign</span>
          </div>
        </div>
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import { CLASSROOM_INTRO_STORAGE_KEY } from '~~/shared/constants/storage'

definePageMeta({ middleware: ['require-auth'] })

function completeIntroduction() {
  if (!import.meta.client) return
  window.localStorage.setItem(CLASSROOM_INTRO_STORAGE_KEY, 'true')
}
</script>

<style scoped>
.classroom-intro {
  --ink: #f5f8ff;
  --muted: #a9b7cc;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  position: relative;
  overflow: hidden;
  padding: clamp(24px, 5vw, 64px);
  color: var(--ink);
  background:
    radial-gradient(circle at 18% 12%, rgba(34, 211, 238, .12), transparent 34%),
    linear-gradient(145deg, #060b16 0%, #0a1324 55%, #07111c 100%);
}

.intro-glow {
  position: absolute;
  width: 360px;
  height: 360px;
  border-radius: 999px;
  filter: blur(100px);
  opacity: .18;
  pointer-events: none;
}

.intro-glow--one { background: #22d3ee; top: -180px; right: 5%; }
.intro-glow--two { background: #3b82f6; bottom: -220px; left: -80px; }

.intro-shell {
  position: relative;
  z-index: 1;
  width: min(1180px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(340px, .85fr);
  align-items: center;
  gap: clamp(36px, 6vw, 86px);
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #89edff;
  font-size: .75rem;
  font-weight: 800;
  letter-spacing: .18em;
  text-transform: uppercase;
}

h1 {
  max-width: 760px;
  margin: 16px 0;
  font-size: clamp(2.25rem, 5vw, 4.7rem);
  line-height: .99;
  letter-spacing: -.045em;
}

.lead {
  max-width: 720px;
  color: var(--muted);
  font-size: clamp(1rem, 1.6vw, 1.2rem);
  line-height: 1.65;
}

.steps {
  display: grid;
  gap: 12px;
  margin: 28px 0 22px;
}

.steps article {
  display: grid;
  grid-template-columns: 38px 1fr;
  gap: 14px;
  align-items: start;
}

.step-number {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(103, 232, 249, .35);
  border-radius: 10px;
  color: #8cecff;
  background: rgba(34, 211, 238, .08);
  font-weight: 800;
}

.steps h2 {
  margin: 1px 0 3px;
  font-size: 1rem;
}

.steps p,
.scope-note p {
  margin: 0;
  color: var(--muted);
  font-size: .9rem;
  line-height: 1.5;
}

.scope-note {
  display: flex;
  gap: 12px;
  max-width: 720px;
  padding: 13px 15px;
  border: 1px solid rgba(251, 191, 36, .2);
  border-radius: 12px;
  color: #fcd34d;
  background: rgba(251, 191, 36, .055);
}

.intro-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-top: 24px;
}

.primary-action,
.secondary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 46px;
  border-radius: 12px;
  padding: 0 19px;
  font-weight: 800;
  text-decoration: none;
  transition: transform .18s ease, border-color .18s ease, background .18s ease;
}

.primary-action {
  color: #031217;
  background: linear-gradient(135deg, #67e8f9, #22d3ee);
  box-shadow: 0 14px 36px rgba(34, 211, 238, .2);
}

.secondary-action {
  border: 1px solid rgba(255,255,255,.14);
  color: #dce8f7;
  background: rgba(255,255,255,.04);
}

.primary-action:hover,
.secondary-action:hover { transform: translateY(-2px); }
.secondary-action:hover { border-color: rgba(103,232,249,.4); }

.practice-card {
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 24px;
  padding: clamp(22px, 3vw, 32px);
  background: linear-gradient(160deg, rgba(18,31,52,.94), rgba(8,17,31,.96));
  box-shadow: 0 28px 80px rgba(0,0,0,.38);
}

.practice-card__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.practice-kicker,
.controller-label {
  color: #93a4bb;
  font-size: .7rem;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.synthetic-chip {
  padding: 5px 8px;
  border-radius: 999px;
  color: #fcd34d;
  background: rgba(251,191,36,.09);
  font-size: .68rem;
  font-weight: 800;
}

.controller-label { margin: 28px 0 8px; color: #79e8fa; }

blockquote {
  margin: 0;
  color: #f2f7ff;
  font-size: 1.15rem;
  line-height: 1.6;
}

.response-preview {
  margin-top: 24px;
  padding: 18px;
  border-radius: 14px;
  background: rgba(2,8,18,.65);
}

.response-preview p {
  margin: 0 0 10px;
  color: #93a4bb;
  font-size: .72rem;
  font-weight: 800;
  text-transform: uppercase;
}

.response-preview div { line-height: 2.1; }
.response-preview span {
  padding: 4px 7px;
  border-bottom: 1px solid #22d3ee;
  border-radius: 5px 5px 0 0;
  background: rgba(34,211,238,.1);
}

.check-row {
  display: flex;
  gap: 12px;
  margin-top: 18px;
  color: #6ee7b7;
}

.check-row div { display: grid; gap: 2px; }
.check-row span { color: #91a2b8; font-size: .78rem; }

@media (max-width: 900px) {
  .classroom-intro { place-items: start center; overflow: auto; }
  .intro-shell { grid-template-columns: 1fr; }
  .practice-card { max-width: 620px; }
}

@media (max-width: 560px) {
  .classroom-intro { padding: 24px 18px 36px; }
  h1 { font-size: 2.45rem; }
  .intro-actions { align-items: stretch; flex-direction: column; }
  .practice-card__top { align-items: flex-start; flex-direction: column; }
}
</style>
