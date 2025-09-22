<template>
  <section class="learn-introduction" aria-labelledby="learn-introduction-title">
    <div class="intro-hero">
      <span class="intro-tag">Training hangar</span>
      <h1 id="learn-introduction-title">Welcome to OpenSquawk Pilot Voice Prep</h1>
      <p class="intro-lead">
        This is your guided training area for mastering pilot phraseology and readbacks. It is not the live AI ATC you will
        use inside the full-flight simulator yet—think of it as the dedicated practice range that helps you build radio
        confidence before the public release of Live AI ATC.
      </p>
      <p class="intro-note">
        Live AI ATC is currently in limited testing. Until it opens to everyone, this learning platform delivers structured
        exercises, realistic mission setups, and detailed feedback so you can already train the rhythm of real-world
        communications.
      </p>
    </div>

    <section class="intro-section" aria-labelledby="learn-intro-purpose">
      <h2 id="learn-intro-purpose">Why this training matters</h2>
      <p>
        Every lesson here is designed to make the simulated cockpit chatter feel natural once you plug into the AI controller.
        You will recognise the calls, anticipate the clearances, and respond with the right words when it matters.
      </p>
      <ul class="intro-points">
        <li><strong>Realistic missions:</strong> Each module mirrors a phase of flight—from ICAO basics to full gate-to-gate operations.</li>
        <li><strong>Progression built in:</strong> Modules unlock sequentially, ensuring you master fundamentals before moving on.</li>
        <li><strong>Hands-on drills:</strong> Interactive readbacks, hints, and scoring show exactly where to fine-tune your responses.</li>
      </ul>
    </section>

    <section class="intro-section" aria-labelledby="learn-intro-hub">
      <div class="section-header">
        <h2 id="learn-intro-hub">Mission hub overview</h2>
        <p class="section-sub">
          The hub is the control tower of your training. Tiles highlight available briefings, show progress bars, and tell you
          when a new lesson has arrived.
        </p>
      </div>
      <div class="intro-grid">
        <article class="intro-card">
          <h3>Pick a module</h3>
          <p>
            Start with the ICAO alphabet &amp; numbers module, then continue into ground, departure, and en-route missions. Locked
            cards point you toward the prerequisite lessons you still need to finish.
          </p>
        </article>
        <article class="intro-card">
          <h3>Track your stats</h3>
          <p>
            Each tile displays how many lessons are done, your average score, and a contextual primary action button. Use it to
            jump back into the next unfinished item or to review a finished mission.
          </p>
        </article>
        <article class="intro-card">
          <h3>Mission footer guidance</h3>
          <p>
            When you are inside a mission the footer keeps you oriented—repeat the current scenario, advance to the next lesson,
            or return to the hub at any time.
          </p>
        </article>
      </div>
    </section>

    <section class="intro-section" aria-labelledby="learn-intro-setup">
      <div class="section-header">
        <h2 id="learn-intro-setup">Setting up a mission</h2>
        <p class="section-sub">
          Missions follow a simple three-stage flow: <em>Setup</em>, <em>Briefing</em>, and <em>Lessons</em>. Each stage keeps you aligned with the
          workflow of a real dispatch.
        </p>
      </div>
      <ol class="intro-steps">
        <li>
          <strong>Select your flight plan mode.</strong>
          Choose between the automatic random flight generator, a manual planner where you enter your own data, or a SimBrief
          import for one-click airline dispatch syncing.
        </li>
        <li>
          <strong>Review the live preview.</strong>
          As you tweak callsigns, routes, and procedures, the preview panel updates instantly. Frequency lists, taxi notes, and
          altitude targets appear just like you will hear them later.
        </li>
        <li>
          <strong>Lock &amp; brief.</strong>
          Once satisfied, lock the plan to enter the detailed mission briefing. Here you will see the flight deck setup,
          departure and arrival flows, weather snapshots, and a step-by-step mission checklist. Confirm to start practising the
          lessons tied to this flight.
        </li>
      </ol>
    </section>

    <section class="intro-section" aria-labelledby="learn-intro-lessons">
      <div class="section-header">
        <h2 id="learn-intro-lessons">Inside each lesson</h2>
        <p class="section-sub">
          The lesson console is your virtual radio stack. It combines the scenario briefing, your readback workspace, and
          real-time evaluation tools.
        </p>
      </div>
      <div class="intro-grid intro-grid--split">
        <article class="intro-card">
          <h3>Briefing column</h3>
          <p>
            Listen to the target call via the speaker button, reveal the text if the audio challenge is enabled, and use the
            hints to understand the intent. Need variety? Roll a fresh scenario with the dice icon for new values on the same
            phrase.
          </p>
        </article>
        <article class="intro-card">
          <h3>Readback builder</h3>
          <p>
            Fill the blanks in the readback strip with the correct values. You can reset the form, auto-fill the solution to
            study it, or check your answers to receive an instant score plus per-field feedback.
          </p>
        </article>
        <article class="intro-card">
          <h3>Scenario intelligence</h3>
          <p>
            The top status bar shows callsign, airport data, and available frequencies. Selecting a frequency provides spoken
            guidance on when to use it, mirroring the real cockpit workflow.
          </p>
        </article>
        <article class="intro-card">
          <h3>Progression cues</h3>
          <p>
            Completed lessons earn XP and improve your module average. The mission footer suggests the next logical action—advance
            to the following lesson, repeat with new data, or switch modules once you are satisfied.
          </p>
        </article>
      </div>
    </section>

    <section class="intro-section" aria-labelledby="learn-intro-progress">
      <h2 id="learn-intro-progress">Track your progress</h2>
      <p>
        The "Your progress" area in the hub visualises your level, XP percentage, and the next primary objective. It is the
        quickest way to see what to practise next and which missions will unlock soon.
      </p>
    </section>

    <section class="intro-section" aria-labelledby="learn-intro-settings">
      <h2 id="learn-intro-settings">Tune the experience</h2>
      <p>
        Use the ATC settings button in the top bar to personalise your training session. Toggle browser TTS, enable the audio
        challenge, adjust the simulated radio readability, or slow down / speed up the controller speech. You can even reset
        local progress if you want a clean slate.
      </p>
    </section>

    <section class="intro-section outro" aria-labelledby="learn-intro-outro">
      <h2 id="learn-intro-outro">Stay sharp for Live AI ATC</h2>
      <p>
        Master these drills now and you will step into the upcoming live service with confidence. Treat every mission as a
        chance to refine your phraseology so that when Live AI ATC launches publicly, you will already sound like part of the
        crew.
      </p>
      <p class="outro-cta">Ready? Head back to the Mission Hub and launch your first briefing.</p>
    </section>
  </section>
</template>

<style scoped>
.learn-introduction {
  max-width: 1080px;
  margin: 0 auto;
  padding: 40px 24px 64px;
  display: flex;
  flex-direction: column;
  gap: 56px;
  color: var(--text);
}

.intro-hero {
  background: color-mix(in srgb, var(--bg2) 80%, black 20%);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 24px 80px rgba(3, 7, 18, 0.35);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.intro-tag {
  align-self: flex-start;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  color: var(--accent);
  font-weight: 600;
}

.intro-lead {
  font-size: 18px;
  line-height: 1.6;
  color: var(--t2);
}

.intro-note {
  font-size: 15px;
  line-height: 1.6;
  color: var(--t3);
}

.intro-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-sub {
  color: var(--t3);
  max-width: 720px;
}

.intro-points {
  display: grid;
  gap: 12px;
  padding-left: 20px;
  color: var(--t2);
}

.intro-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.intro-grid--split {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.intro-card {
  background: color-mix(in srgb, var(--bg2) 70%, black 30%);
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 18px 50px rgba(3, 7, 18, 0.35);
}

.intro-card h3 {
  font-size: 20px;
  font-weight: 600;
}

.intro-card p {
  margin: 0;
  color: var(--t2);
  line-height: 1.6;
}

.intro-steps {
  counter-reset: step;
  display: grid;
  gap: 18px;
  color: var(--t2);
  padding-left: 0;
  list-style: none;
}

.intro-steps li {
  position: relative;
  padding-left: 48px;
  line-height: 1.6;
}

.intro-steps li::before {
  counter-increment: step;
  content: counter(step);
  position: absolute;
  left: 0;
  top: 4px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--accent) 25%, transparent);
  color: var(--accent);
  font-weight: 700;
}

.outro {
  border-top: 1px solid var(--border);
  padding-top: 32px;
  margin-top: 16px;
}

.outro-cta {
  margin: 0;
  font-weight: 600;
  color: var(--accent);
}

@media (max-width: 720px) {
  .learn-introduction {
    padding: 32px 16px 56px;
    gap: 48px;
  }

  .intro-hero {
    padding: 24px;
  }

  .intro-steps li {
    padding-left: 40px;
  }

  .intro-steps li::before {
    width: 28px;
    height: 28px;
  }
}
</style>
