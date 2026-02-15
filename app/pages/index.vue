<template>
  <div class="bg-[#0b1020] text-white antialiased selection:bg-cyan-400/30">
    <header
      ref="headerRef"
      class="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#0b1020]/70 backdrop-blur"
      data-aos="fade-down"
    >
      <nav class="container-outer flex items-center justify-between py-3.5 sm:py-4">
        <NuxtLink
          to="#"
          class="flex items-center gap-2 font-semibold tracking-tight"
          @click.prevent="handleAnchorNavigation('#')"
        >
          <v-icon icon="mdi-radar" size="28" class="text-cyan-400" />
          <span class="text-white">OpenSquawk</span>
        </NuxtLink>

        <div class="hidden lg:flex items-center gap-6 text-sm">
          <NuxtLink
            v-for="item in navLinks"
            :key="item.to"
            :to="item.to"
            :class="[
              'transition-colors hover:text-cyan-300',
              isNavLinkActive(item.to) ? 'text-cyan-300' : 'text-white/70'
            ]"
            @click.prevent="handleAnchorNavigation(item.to)"
          >
            {{ item.label }}
          </NuxtLink>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          <NuxtLink to="/roadmap" class="btn btn-ghost whitespace-nowrap btn-compact hidden sm:inline-flex">
            <v-icon icon="mdi-map-marker-path" size="18" />
            Roadmap
          </NuxtLink>
          <NuxtLink
            :to="GITHUB_URL"
            external
            target="_blank"
            rel="noopener"
            class="btn btn-ghost whitespace-nowrap btn-compact hidden lg:inline-flex"
          >
            <v-icon icon="mdi-github" size="18" />
            GitHub
          </NuxtLink>
          <NuxtLink to="/login" class="btn btn-primary whitespace-nowrap btn-compact" aria-label="Login">
            <v-icon icon="mdi-login" size="18" />
            <span class="hidden sm:inline">Login</span>
          </NuxtLink>
          <button
            type="button"
            class="mobile-toggle lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
            :aria-expanded="isMobileNavOpen ? 'true' : 'false'"
            aria-controls="mobile-navigation"
            aria-label="Toggle navigation"
            @click="toggleMobileNav"
          >
            <span class="sr-only">Toggle navigation</span>
            <span class="hamburger" :class="{ 'is-open': isMobileNavOpen }">
              <span class="hamburger-bar"></span>
              <span class="hamburger-bar"></span>
              <span class="hamburger-bar"></span>
            </span>
          </button>
        </div>
      </nav>

      <Transition name="mobile-nav">
        <div
          v-if="isMobileNavOpen"
          id="mobile-navigation"
          class="lg:hidden border-t border-white/10 bg-[#0b1020]/95 backdrop-blur"
        >
          <div class="container-outer py-4 space-y-4">
            <nav class="grid gap-2 text-sm">
              <NuxtLink
                v-for="item in mobileNavLinks"
                :key="`mobile-${item.to}`"
                :to="item.to"
                :external="item.external"
                :target="item.external ? '_blank' : undefined"
                :rel="item.external ? 'noopener' : undefined"
                class="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/80 transition hover:bg-white/10"
                @click="handleMobileNavLinkClick($event, item)"
              >
                <span class="flex items-center gap-3">
                  <v-icon v-if="item.icon" :icon="item.icon" size="18" class="text-white/60" />
                  <span>{{ item.label }}</span>
                </span>
                <v-icon icon="mdi-chevron-right" size="18" class="text-white/60" />
              </NuxtLink>
            </nav>
          </div>
        </div>
      </Transition>
    </header>

    <section class="gradient-hero relative overflow-hidden">
      <div class="hero-overlay absolute inset-0 pointer-events-none">
        <div class="absolute -top-24 right-0 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div class="container-outer relative z-10 mt-10 pb-14 pt-16 sm:mt-12 sm:pb-20 sm:pt-24 md:pb-28 md:pt-32">
        <div class="hero-stack mx-auto max-w-5xl lg:my-20">
          <div class="hero-copy max-w-3xl" data-aos="fade-up">
            <span class="chip mb-4">Structured Radio Training</span>
            <h1 class="text-4xl font-semibold leading-tight sm:text-6xl md:text-7xl">
              Train ATC before you fly VATSIM.
            </h1>
            <p class="mt-4 text-base text-white/80 sm:mt-6 sm:text-lg">
              Practice realistic radio communication in a safe environment. No pressure. No embarrassment. Just structured learning.
            </p>
            <ul class="mt-7 grid gap-2.5 text-sm text-white/70 sm:text-base">
              <li class="flex items-start gap-2">
                <v-icon icon="mdi-format-list-checks" size="18" class="mt-[3px] text-cyan-300" />
                <span>Structured scenarios</span>
              </li>
              <li class="flex items-start gap-2">
                <v-icon icon="mdi-check-decagram-outline" size="18" class="mt-[3px] text-cyan-300" />
                <span>Instant feedback</span>
              </li>
              <li class="flex items-start gap-2">
                <v-icon icon="mdi-airplane-takeoff" size="18" class="mt-[3px] text-cyan-300" />
                <span>Built for VATSIM preparation</span>
              </li>
            </ul>
            <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3.5">
              <NuxtLink to="#cta" class="btn btn-primary text-base">
                <v-icon icon="mdi-school" size="20" />
                Start Training
              </NuxtLink>
              <NuxtLink to="#how-it-works" class="btn btn-ghost text-base">
                <v-icon icon="mdi-play-circle-outline" size="20" />
                See How It Works
              </NuxtLink>
            </div>
          </div>

          <div class="hero-highlights mt-10 grid gap-4 sm:grid-cols-3 sm:gap-5" data-aos="fade-up" data-aos-delay="120">
            <article class="hero-highlight glass rounded-2xl p-5">
              <v-icon icon="mdi-headset" size="22" class="text-cyan-300" />
              <h3 class="mt-3 text-lg font-semibold">From first calls to confident readbacks</h3>
              <p class="mt-2 text-sm text-white/75">A calm place to train phraseology before your first busy frequency.</p>
            </article>
            <article class="hero-highlight glass rounded-2xl p-5">
              <v-icon icon="mdi-school-outline" size="22" class="text-cyan-300" />
              <h3 class="mt-3 text-lg font-semibold">Classroom in alpha, 0€ today</h3>
              <p class="mt-2 text-sm text-white/75">Structured VFR + IFR scenario training with waitlist-based access.</p>
            </article>
            <article class="hero-highlight glass rounded-2xl p-5">
              <v-icon icon="mdi-github" size="22" class="text-cyan-300" />
              <h3 class="mt-3 text-lg font-semibold">Open source core</h3>
              <p class="mt-2 text-sm text-white/75">Inspect, self-host and contribute to the stack any time.</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section id="problem" ref="problemSplashRef" class="problem-splash relative overflow-hidden border-y border-white/10">
      <NuxtImg
        src="/img/landing/feedback.jpeg"
        alt="Pilot preparing and reviewing notes"
        class="problem-splash-image parallax-media"
        :style="problemParallaxStyle"
        format="webp"
      />
      <div class="problem-splash-overlay"></div>
      <div class="problem-splash-content container-outer">
        <div class="max-w-3xl" data-aos="fade-up">
          <span class="chip">Common First-Flight Friction</span>
          <h2 class="mt-4 text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">Your first VATSIM flight is stressful.</h2>
          <p class="mt-4 text-base text-white/80 sm:text-lg">
            That first push-to-talk moment often feels like a test. Most pilots know the procedures, but not the words and rhythm under pressure.
          </p>
          <ul class="mt-6 grid gap-3 text-white/85 sm:grid-cols-2">
            <li class="glass rounded-xl px-4 py-3 text-sm sm:text-base">
              <span class="inline-flex items-start gap-3">
                <v-icon icon="mdi-help-circle-outline" class="mt-[2px] text-cyan-300" />
                <span>Unsure what to say</span>
              </span>
            </li>
            <li class="glass rounded-xl px-4 py-3 text-sm sm:text-base">
              <span class="inline-flex items-start gap-3">
                <v-icon icon="mdi-radio-off" class="mt-[2px] text-cyan-300" />
                <span>Afraid to block frequency</span>
              </span>
            </li>
            <li class="glass rounded-xl px-4 py-3 text-sm sm:col-span-2 sm:text-base">
              <span class="inline-flex items-start gap-3">
                <v-icon icon="mdi-script-text-outline" class="mt-[2px] text-cyan-300" />
                <span>Don’t know IFR phraseology</span>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section id="solution" class="bg-[#0b1020] py-16 sm:py-20 md:py-28">
      <div class="container-outer">
        <div data-aos="fade-up">
          <h2 class="text-4xl font-semibold sm:text-5xl md:text-6xl">OpenSquawk is your ATC practice environment.</h2>
          <p class="mt-3 max-w-3xl text-white/80">
            Instead of throwing you into live pressure, OpenSquawk gives you structured radio training with clear progression.
          </p>
          <div class="mt-8 grid gap-5 sm:grid-cols-2 sm:gap-6">
            <div class="card">
              <h3 class="text-lg font-semibold">Structured radio training</h3>
              <p class="mt-2 text-sm text-white/70">
                Learn in guided scenarios with a clear objective for each session.
              </p>
            </div>
            <div class="card">
              <h3 class="text-lg font-semibold">Safe repetition</h3>
              <p class="mt-2 text-sm text-white/70">
                Repeat calls until they sound natural, without blocking a real frequency.
              </p>
            </div>
            <div class="card sm:col-span-2">
              <h3 class="text-lg font-semibold">Feedback that helps</h3>
              <p class="mt-2 text-sm text-white/70">
                Get immediate clarity on phraseology, key information and communication quality.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section ref="arrivalSplashRef" class="arrival-splash relative overflow-hidden border-y border-white/10">
      <NuxtImg
        src="/img/learn/missions/full-flight/briefing-arrival.png"
        alt="Arrival briefing board"
        class="arrival-splash-image parallax-media"
        :style="arrivalParallaxStyle"
        format="webp"
      />
      <div class="arrival-splash-overlay"></div>
      <div class="arrival-splash-content container-outer">
        <div class="max-w-3xl" data-aos="fade-up">
          <span class="chip">Confidence Before Frequency</span>
          <h2 class="mt-4 text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
            Train the arrival call before the real one.
          </h2>
          <p class="mt-4 text-base text-white/80 sm:text-lg">
            Learn the phraseology, pacing and structure on your own terms, then take that confidence to VATSIM.
          </p>
        </div>
      </div>
    </section>

    <section id="how-it-works" class="border-y border-white/10 bg-[#0a0f1c] py-16 sm:py-20 md:py-28">
      <div class="container-outer">
        <div class="max-w-2xl" data-aos="fade-up">
          <h2 class="text-4xl font-semibold sm:text-5xl md:text-6xl">How it works</h2>
          <p class="mt-3 text-white/80">Three simple steps to build confidence before live ops.</p>
        </div>
        <div class="mt-10 grid gap-5 md:grid-cols-3 md:gap-7">
          <article class="card" data-aos="fade-up" data-aos-delay="0">
            <span class="step-number">1</span>
            <h3 class="mt-4 text-xl font-semibold">Choose a scenario</h3>
            <p class="mt-2 text-white/70">Pick a session that matches your current level and training goal.</p>
          </article>
          <article class="card" data-aos="fade-up" data-aos-delay="100">
            <span class="step-number">2</span>
            <h3 class="mt-4 text-xl font-semibold">Speak like on VATSIM</h3>
            <p class="mt-2 text-white/70">Use realistic phraseology and train the timing of your calls.</p>
          </article>
          <article class="card" data-aos="fade-up" data-aos-delay="200">
            <span class="step-number">3</span>
            <h3 class="mt-4 text-xl font-semibold">Get feedback & improve</h3>
            <p class="mt-2 text-white/70">Review what worked, fix what didn’t, and run it again.</p>
          </article>
        </div>
      </div>
    </section>

    <section id="classroom" class="bg-[#0b1020] py-16 sm:py-20 md:py-28">
      <div class="container-outer">
        <div class="mx-auto max-w-3xl text-center" data-aos="fade-up">
          <span class="chip">Core Product Today</span>
          <h2 class="mt-5 text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">The ATC Classroom</h2>
          <p class="mt-4 text-base text-white/80 sm:text-lg">
            Classroom training builds phraseology, clarity and confidence with structured sessions you can repeat at your own pace.
          </p>
        </div>
        <div class="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 sm:gap-4" data-aos="fade-up" data-aos-delay="100">
          <div class="glass rounded-2xl px-4 py-3 text-sm text-white/85 sm:text-base">
            <div class="flex items-center gap-3">
              <v-icon icon="mdi-school-outline" class="text-cyan-300" />
              <span>Beginner to Advanced scenarios</span>
            </div>
          </div>
          <div class="glass rounded-2xl px-4 py-3 text-sm text-white/85 sm:text-base">
            <div class="flex items-center gap-3">
              <v-icon icon="mdi-airplane" class="text-cyan-300" />
              <span>VFR + IFR practice tracks</span>
            </div>
          </div>
          <div class="glass rounded-2xl px-4 py-3 text-sm text-white/85 sm:text-base">
            <div class="flex items-center gap-3">
              <v-icon icon="mdi-headset" class="text-cyan-300" />
              <span>Realistic phraseology</span>
            </div>
          </div>
          <div class="glass rounded-2xl px-4 py-3 text-sm text-white/85 sm:text-base">
            <div class="flex items-center gap-3">
              <v-icon icon="mdi-timer-sand" class="text-cyan-300" />
              <span>Self-paced learning</span>
            </div>
          </div>
        </div>
        <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row" data-aos="fade-up" data-aos-delay="150">
          <NuxtLink to="#cta" class="btn btn-primary">Start Training</NuxtLink>
          <NuxtLink to="/roadmap" class="btn btn-ghost">Roadmap & feature voting</NuxtLink>
        </div>
      </div>

      <div ref="classroomSplashRef" class="classroom-splash relative mt-14 overflow-hidden border-y border-white/10">
        <NuxtImg
          src="/img/landing/simulator.jpeg"
          alt="OpenSquawk Classroom session preview"
          class="classroom-splash-image parallax-media"
          :style="classroomParallaxStyle"
          format="webp"
        />
        <div class="classroom-splash-overlay"></div>
        <div class="classroom-splash-content container-outer">
          <div class="max-w-3xl" data-aos="fade-up">
            <span class="chip">Classroom Session View</span>
            <h3 class="mt-4 text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
              From first calls to confident readbacks.
            </h3>
            <p class="mt-4 text-base text-white/80 sm:text-lg">
              Train in a calm environment, repeat transmissions without pressure and walk into busy frequencies prepared.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section id="lineup" class="bg-gradient-to-b from-[#0b1020] to-[#0a0f1c] py-16 sm:py-20 md:py-28">
      <div class="container-outer">
        <div class="mx-auto max-w-3xl text-center" data-aos="fade-up">
          <span class="chip">Availability</span>
          <h2 class="mt-5 text-4xl font-semibold sm:text-5xl md:text-6xl">
            Product lineup & availability
          </h2>
          <p class="mt-4 text-base text-white/80 sm:text-lg">
            Three tracks, one mission. Classroom is free in invitation alpha, Live ATC is closed alpha, and the open-source stack stays 0€ to inspect or self-host.
          </p>
        </div>

        <div class="mt-12 grid items-stretch gap-6 lg:grid-cols-2 xl:grid-cols-3 xl:gap-8">
          <article
            class="card border-2 border-cyan-400/40 relative flex h-full flex-col pricing-card shadow-[0_0_40px_rgba(34,211,238,.2)]"
            data-aos="fade-up"
            data-aos-delay="0"
          >
            <div class="absolute -top-3 right-4 chip bg-cyan-500/30 border-cyan-400/50">
              Live today
            </div>
            <div class="flex flex-col flex-1">
              <div class="flex flex-col flex-1">
                <h3 class="text-2xl font-semibold">
                  Classroom (alpha)
                </h3>
                <p class="mt-3 flex-1 text-sm text-white/75 sm:text-base">
                  Structured training sessions for phraseology, readbacks and confidence before live frequency.
                </p>
                <div class="mt-6 text-2xl font-semibold sm:text-3xl">
                  Alpha access<span class="text-white/60 text-sm font-normal"> · waitlist open</span>
                </div>
                <ul class="mt-6 space-y-2.5 text-sm">
                  <li class="flex items-start gap-3 text-white/80">
                    <v-icon icon="mdi-check-circle" size="18" class="text-emerald-400 mt-[2px]" />
                    <span>Beginner to advanced scenario packs</span>
                  </li>
                  <li class="flex items-start gap-3 text-white/80">
                    <v-icon icon="mdi-check-circle" size="18" class="text-emerald-400 mt-[2px]" />
                    <span>Instant feedback on key details</span>
                  </li>
                  <li class="flex items-start gap-3 text-white/60">
                    <v-icon icon="mdi-close-circle" size="18" class="text-red-400 mt-[2px]" />
                    <span>Public open signup (planned)</span>
                  </li>
                  <li class="flex items-start gap-3 text-white/60">
                    <v-icon icon="mdi-close-circle" size="18" class="text-red-400 mt-[2px]" />
                    <span>Offline package download (researching)</span>
                  </li>
                </ul>
              </div>
              <NuxtLink to="#cta" class="btn btn-primary w-full mt-8">
                Join classroom waitlist
              </NuxtLink>
            </div>
          </article>

          <article
            class="card relative flex h-full flex-col pricing-card"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <div class="absolute -top-3 right-4 chip">
              In development
            </div>
            <div class="flex flex-col flex-1">
              <div class="flex flex-col flex-1">
                <h3 class="text-2xl font-semibold">Live ATC (in development)</h3>
                <p class="mt-3 flex-1 text-sm text-white/75 sm:text-base">
                  Real-time controller loop for solo radio practice when networks are offline.
                </p>
                <div class="mt-6 text-2xl font-semibold sm:text-3xl">
                  Closed alpha<span class="text-white/60 text-sm font-normal"> · in development</span>
                </div>
                <ul class="mt-6 space-y-2.5 text-sm">
                  <li class="flex items-start gap-3 text-white/80">
                    <v-icon icon="mdi-check-circle" size="18" class="text-emerald-400 mt-[2px]" />
                    <span>PTT → STT → LLM → TTS pipeline</span>
                  </li>
                  <li class="flex items-start gap-3 text-white/80">
                    <v-icon icon="mdi-check-circle" size="18" class="text-emerald-400 mt-[2px]" />
                    <span>MSFS telemetry integration</span>
                  </li>
                  <li class="flex items-start gap-3 text-white/60">
                    <v-icon icon="mdi-close-circle" size="18" class="text-red-400 mt-[2px]" />
                    <span>Public download (post-alpha)</span>
                  </li>
                  <li class="flex items-start gap-3 text-white/60">
                    <v-icon icon="mdi-close-circle" size="18" class="text-red-400 mt-[2px]" />
                    <span>X-Plane / FlightGear builds (roadmap)</span>
                  </li>
                </ul>
              </div>
              <NuxtLink to="#cta" class="btn btn-primary w-full mt-8">
                Join Live ATC waitlist
              </NuxtLink>
            </div>
          </article>

          <article class="card relative flex h-full flex-col pricing-card" data-aos="fade-up" data-aos-delay="200">
            <div class="absolute -top-3 right-4 chip">Open source</div>
            <div class="flex flex-col flex-1">
              <div class="flex flex-col flex-1">
                <h3 class="text-2xl font-semibold">
                  Self-host & contribute
                </h3>
                <p class="mt-3 flex-1 text-sm text-white/75 sm:text-base">
                  Clone the repo, run Docker and adapt the stack for your own training setup.
                </p>
                <div class="mt-6 text-2xl font-semibold sm:text-3xl">
                  0€<span class="text-white/60 text-sm font-normal"> / always</span>
                </div>
                <ul class="mt-6 space-y-2.5 text-sm">
                  <li class="flex items-start gap-3 text-white/80">
                    <v-icon icon="mdi-check-circle" size="18" class="text-emerald-400 mt-[2px]" />
                    <span>Core UI + services are fully open</span>
                  </li>
                  <li class="flex items-start gap-3 text-white/80">
                    <v-icon icon="mdi-check-circle" size="18" class="text-emerald-400 mt-[2px]" />
                    <span>Modify prompts and controller logic</span>
                  </li>
                  <li class="flex items-start gap-3 text-white/60">
                    <v-icon icon="mdi-close-circle" size="18" class="text-red-400 mt-[2px]" />
                    <span>Managed hosting or SLA</span>
                  </li>
                  <li class="flex items-start gap-3 text-white/60">
                    <v-icon icon="mdi-close-circle" size="18" class="text-red-400 mt-[2px]" />
                    <span>Cloud voice/STT credits included</span>
                  </li>
                </ul>
              </div>
              <NuxtLink
                :to="GITHUB_URL"
                external
                target="_blank"
                rel="noopener"
                class="btn btn-ghost w-full mt-8"
              >
                View repository
              </NuxtLink>
            </div>
          </article>
        </div>
        <div
          class="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-5 text-sm text-white/70 sm:px-7 sm:py-6"
          data-aos="fade-up"
          data-aos-delay="260"
        >
          Live ATC stays offline-first while licensing for networks such as VATSIM and IVAO is reviewed. In parallel we expand the Classroom and open-source stack based on roadmap votes.
        </div>
      </div>
    </section>

    <section id="daily-drill" class="border-y border-white/10 bg-[#0a0f1c] py-16 sm:py-20 md:py-28">
      <div class="container-outer">
        <div class="card grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:gap-10" data-aos="zoom-in">
          <div>
            <span class="chip">Coming next</span>
            <h2 class="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">5 Minutes a Day. Noticeable Improvement.</h2>
            <p class="mt-3 text-white/80">
              Small daily exercises that train your phraseology, clarity and confidence.
            </p>
            <p class="mt-3 text-white/70">
              Daily Drills are designed for quick wins: one prompt, one response, one feedback loop.
            </p>
          </div>
          <div class="grid gap-4 text-sm text-white/80 sm:text-base">
            <div class="glass flex items-center gap-3 rounded-xl p-4">
              <v-icon icon="mdi-comment-processing-outline" class="text-cyan-300" />
              1 focused ATC prompt
            </div>
            <div class="glass flex items-center gap-3 rounded-xl p-4">
              <v-icon icon="mdi-radio-handheld" class="text-cyan-300" />
              Speak your readback
            </div>
            <div class="glass flex items-center gap-3 rounded-xl p-4">
              <v-icon icon="mdi-chart-line" class="text-cyan-300" />
              Get immediate improvement feedback
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="community" class="bg-[#0b1020] py-16 sm:py-20 md:py-28">
      <div class="container-outer space-y-10">
        <div class="max-w-2xl" data-aos="fade-up">
          <h2 class="text-4xl font-semibold sm:text-5xl md:text-6xl">Community proof, not hype</h2>
          <p class="mt-3 text-white/80">
            OpenSquawk is shaped by aspiring VATSIM pilots and early testers who train with us every week.
          </p>
        </div>

        <div class="grid gap-5 md:grid-cols-3 md:gap-7">
          <article class="card" data-aos="fade-up" data-aos-delay="0">
            <h3 class="text-lg font-semibold">Discord Community</h3>
            <p class="mt-2 text-sm text-white/70">
              Join ongoing discussions around phraseology, scenarios and upcoming training modules.
            </p>
            <a :href="DISCORD_INVITE_MAILTO" class="btn btn-ghost mt-4">Request Discord invite</a>
          </article>
          <article class="card" data-aos="fade-up" data-aos-delay="100">
            <h3 class="text-lg font-semibold">Early feedback</h3>
            <blockquote class="mt-3 text-sm text-white/80">
              “I finally understood IFR readbacks without freezing on frequency.”
            </blockquote>
            <p class="mt-2 text-xs text-white/50">Early Classroom pilot</p>
          </article>
          <article class="card" data-aos="fade-up" data-aos-delay="200">
            <h3 class="text-lg font-semibold">Used by aspiring VATSIM pilots</h3>
            <blockquote class="mt-3 text-sm text-white/80">
              “The structure helped me speak cleaner and calmer during my first flights.”
            </blockquote>
            <p class="mt-2 text-xs text-white/50">OpenSquawk community member</p>
          </article>
        </div>
      </div>
    </section>

    <section
      id="cta"
      class="border-y border-white/10 bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-transparent py-16 sm:py-20 md:py-28"
    >
      <div class="container-outer">
        <div class="card grid gap-8 md:grid-cols-2 md:gap-10" data-aos="zoom-in">
          <div class="space-y-4">
            <div>
              <h3 class="text-3xl font-semibold leading-tight sm:text-4xl">
                Join the waitlist for early access
              </h3>
              <p class="mt-2 text-white/80">
                Register your interest for Classroom access and we will guide you into the next available training wave.
              </p>
            </div>
            <div v-if="waitlistLoading" class="text-sm text-white/60">Loading waitlist…</div>
            <template v-else>
              <p class="text-sm text-white/70">
                <span class="font-semibold text-cyan-300">{{ waitlistCountDisplay }}</span>
                aspiring pilots are already in the queue.
              </p>
              <p class="text-xs text-white/60">
                Last signup:
                <span class="font-medium text-white">{{ waitlistLastJoinedFormatted }}</span>
                <span v-if="waitlistStats?.lastJoinedAt" class="text-white/40">
                  ({{ formatRelativeFromNow(waitlistStats?.lastJoinedAt) }})
                </span>
              </p>
            </template>
            <p class="text-xs text-white/60">
              Product and roadmap deep-dives now live on
              <NuxtLink to="/roadmap" class="text-cyan-300 underline">the roadmap page</NuxtLink>
              and
              <NuxtLink to="/news" class="text-cyan-300 underline">news updates</NuxtLink>.
            </p>
          </div>

          <form class="space-y-4" @submit.prevent="submitWaitlist">
            <div class="grid gap-3">
              <input
                v-model.trim="waitlistForm.name"
                aria-label="Name"
                type="text"
                placeholder="First and last name (optional)"
                class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 placeholder-white/40 outline-none focus:border-cyan-400"
              />
              <input
                v-model.trim="waitlistForm.email"
                aria-label="Email"
                type="email"
                required
                placeholder="your@email"
                class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 placeholder-white/40 outline-none focus:border-cyan-400"
              />
              <textarea
                v-model.trim="waitlistForm.notes"
                rows="3"
                placeholder="What do you want to improve first? (optional)"
                class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 placeholder-white/40 outline-none focus:border-cyan-400"
              />
            </div>

            <div
              v-if="waitlistCaptchaVisible"
              class="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60"
            >
              <p class="text-sm font-medium text-white">Aviation captcha</p>
              <p>
                Answer to continue:
                <span class="text-cyan-300">{{ waitlistCaptcha.challenge.prompt }}</span>
              </p>
              <input
                v-model.trim="waitlistCaptcha.answer"
                type="text"
                required
                aria-label="Aviation captcha answer for waitlist"
                placeholder="Type the answer"
                class="w-full rounded-2xl border border-white/10 bg-[#0b1020]/40 px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-cyan-400"
              />
              <p v-if="waitlistCaptchaReminder" class="text-xs text-amber-200">{{ waitlistCaptchaReminder }}</p>
              <p v-else-if="waitlistCaptcha.answer && !waitlistCaptchaValid" class="text-xs text-red-300">
                Check the ATC question and try again.
              </p>
            </div>

            <div class="space-y-2 text-xs text-white/60">
              <label class="flex items-start gap-3">
                <input type="checkbox" v-model="waitlistForm.subscribeUpdates" class="mt-1" />
                <span>Yes, send me product updates and invite drops.</span>
              </label>
              <label class="flex items-start gap-3">
                <input type="checkbox" v-model="waitlistForm.consentTerms" class="mt-1" required />
                <span>
                  I accept the
                  <NuxtLink to="/agb" class="text-cyan-300 underline">terms of service</NuxtLink>
                  of OpenSquawk.
                </span>
              </label>
              <label class="flex items-start gap-3">
                <input type="checkbox" v-model="waitlistForm.consentPrivacy" class="mt-1" required />
                <span>
                  I have read the
                  <NuxtLink to="/datenschutz" class="text-cyan-300 underline">privacy policy</NuxtLink>
                  and consent to storing my details for contact purposes.
                </span>
              </label>
            </div>

            <button type="submit" class="btn btn-primary w-full" :disabled="waitlistSubmitting">
              <span v-if="waitlistSubmitting" class="flex items-center gap-2">
                <v-progress-circular indeterminate size="16" width="2" color="white" />
                Sending data…
              </span>
              <span v-else>Join the waitlist</span>
            </button>

            <p v-if="waitlistSuccess" class="text-sm text-green-300">
              Thank you! You are on the waitlist and we will reach out as soon as slots open up.
            </p>
            <p v-else-if="waitlistError" class="text-sm text-red-300">{{ waitlistError }}</p>
          </form>
        </div>
      </div>
    </section>

    <section id="faq" class="border-y border-white/10 bg-[#0a0f1c] py-16 sm:py-20 md:py-28">
      <div class="container-outer">
        <div class="mb-10 max-w-2xl" data-aos="fade-up">
          <h2 class="text-4xl font-semibold sm:text-5xl md:text-6xl">FAQ</h2>
          <p class="mt-3 text-white/80">Answers to the questions that usually decide whether people start.</p>
        </div>
        <div class="grid gap-5 md:grid-cols-2 md:gap-7">
          <article class="card" data-aos="fade-up" data-aos-delay="0">
            <h3 class="font-semibold">Is Classroom free right now?</h3>
            <p class="mt-2 text-sm text-white/75">
              Yes. Classroom is currently <strong>0€ during invitation alpha</strong>.
            </p>
          </article>
          <article class="card" data-aos="fade-up" data-aos-delay="100">
            <h3 class="font-semibold">What is the difference between Classroom and Live ATC?</h3>
            <p class="mt-2 text-sm text-white/75">
              Classroom is structured training (listening/readback/feedback). Live ATC is the real-time simulator radio loop and is still in closed alpha.
            </p>
          </article>
          <article class="card" data-aos="fade-up" data-aos-delay="200">
            <h3 class="font-semibold">Do I need to be on VATSIM to use it?</h3>
            <p class="mt-2 text-sm text-white/75">
              No. OpenSquawk is built for <strong>VATSIM preparation</strong>, so you can train before flying live on network frequencies.
            </p>
          </article>
          <article class="card" data-aos="fade-up" data-aos-delay="300">
            <h3 class="font-semibold">Can I self-host and inspect the stack?</h3>
            <p class="mt-2 text-sm text-white/75">
              Yes. The core is open source and self-hosting remains <strong>0€ / always</strong>.
            </p>
          </article>
          <article class="card" data-aos="fade-up" data-aos-delay="400">
            <h3 class="font-semibold">How do I get access?</h3>
            <p class="mt-2 text-sm text-white/75">
              Join the waitlist for Classroom and Live ATC. Access is currently released in rolling batches.
            </p>
          </article>
          <article class="card" data-aos="fade-up" data-aos-delay="500">
            <h3 class="font-semibold">Is this for real-world aviation?</h3>
            <p class="mt-2 text-sm text-white/75">
              No. OpenSquawk is simulator training software, not intended for real-world ATC communication.
            </p>
          </article>
        </div>
      </div>
    </section>

    <footer class="border-t border-white/10 bg-[#070b16] text-white" data-aos="fade-up">
      <div class="container-outer py-12 sm:py-16">
        <div class="flex flex-col gap-10">
          <div class="footer-brand">
            <div class="inline-flex items-center justify-center gap-2 sm:justify-start lg:flex-none">
              <v-icon icon="mdi-radar" size="26" class="text-cyan-400" />
              <span class="text-lg font-semibold">OpenSquawk</span>
            </div>
            <p class="mx-auto max-w-2xl text-sm text-white/70 sm:mx-0 lg:flex-1 lg:max-w-3xl">
              The place where you learn to speak before you speak on VATSIM.
            </p>
            <div class="footer-brand-actions lg:flex-none">
              <NuxtLink :to="GITHUB_URL" external target="_blank" rel="noopener" class="footer-action">
                <v-icon icon="mdi-github" size="18" class="text-white/70" />
                <span>GitHub</span>
              </NuxtLink>
              <NuxtLink to="/roadmap" class="footer-action">
                <v-icon icon="mdi-map-marker-path" size="18" class="text-white/70" />
                <span>Roadmap</span>
              </NuxtLink>
              <NuxtLink to="/news" class="footer-action">
                <v-icon icon="mdi-newspaper-variant-outline" size="18" class="text-white/70" />
                <span>News</span>
              </NuxtLink>
            </div>
          </div>

          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h4 class="mb-3 font-semibold">Training</h4>
              <ul class="space-y-2 text-sm text-white/70">
                <li><NuxtLink to="#how-it-works" class="hover:text-cyan-300">How it works</NuxtLink></li>
                <li><NuxtLink to="#classroom" class="hover:text-cyan-300">ATC Classroom</NuxtLink></li>
                <li><NuxtLink to="#lineup" class="hover:text-cyan-300">Product lineup</NuxtLink></li>
                <li><NuxtLink to="#daily-drill" class="hover:text-cyan-300">Daily Drill</NuxtLink></li>
                <li><NuxtLink to="#cta" class="hover:text-cyan-300">Start Training</NuxtLink></li>
              </ul>
            </div>
            <div>
              <h4 class="mb-3 font-semibold">Community</h4>
              <ul class="space-y-2 text-sm text-white/70">
                <li><NuxtLink to="#community" class="hover:text-cyan-300">Social proof</NuxtLink></li>
                <li><NuxtLink to="#faq" class="hover:text-cyan-300">FAQ</NuxtLink></li>
                <li><NuxtLink to="/feedback" class="hover:text-cyan-300">Feedback & ideas</NuxtLink></li>
                <li><a :href="DISCORD_INVITE_MAILTO" class="hover:text-cyan-300">Discord invite request</a></li>
                <li><a href="mailto:info@opensquawk.de" class="hover:text-cyan-300">info@opensquawk.de</a></li>
              </ul>
            </div>
            <div>
              <h4 class="mb-3 font-semibold">Legal</h4>
              <ul class="space-y-2 text-sm text-white/70">
                <li><NuxtLink to="/impressum" class="hover:text-cyan-300">Imprint</NuxtLink></li>
                <li><NuxtLink to="/datenschutz" class="hover:text-cyan-300">Privacy</NuxtLink></li>
                <li><NuxtLink to="/agb" class="hover:text-cyan-300">Terms</NuxtLink></li>
                <li><NuxtLink to="/login" class="hover:text-cyan-300">Login</NuxtLink></li>
              </ul>
            </div>
          </div>
        </div>

        <div class="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/60 sm:text-left">
          © {{ year }} OpenSquawk. Not for real-world aviation. *VATSIM/IVAO: trademarks of their respective owners.
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useHead, useRoute, useRouter } from '#imports'
import { useApi } from '~/composables/useApi'

const api = useApi()

const GITHUB_URL = 'https://github.com/OpenSquawk/OpenSquawk'
const DISCORD_INVITE_MAILTO = 'mailto:info@opensquawk.de?subject=Discord%20Community%20Invite%20Request'

interface NavLink {
  label: string
  to: string
}

interface ExtendedNavLink extends NavLink {
  external?: boolean
  icon?: string
}

const navLinks: NavLink[] = [
  { label: 'How it works', to: '#how-it-works' },
  { label: 'Classroom', to: '#classroom' },
  { label: 'Lineup', to: '#lineup' },
  { label: 'FAQ', to: '#faq' },
  { label: 'Start', to: '#cta' },
]

const mobileNavLinks = computed<ExtendedNavLink[]>(() => [
  ...navLinks,
  { label: 'Roadmap', to: '/roadmap', icon: 'mdi-map-marker-path' },
  { label: 'News', to: '/news', icon: 'mdi-newspaper-variant-outline' },
  { label: 'GitHub', to: GITHUB_URL, external: true, icon: 'mdi-github' },
])

const router = useRouter()
const route = useRoute()

const headerRef = ref<HTMLElement | null>(null)
const problemSplashRef = ref<HTMLElement | null>(null)
const arrivalSplashRef = ref<HTMLElement | null>(null)
const classroomSplashRef = ref<HTMLElement | null>(null)
const headerHeight = ref(0)
const activeSection = ref<string>('')
const problemParallaxOffset = ref(0)
const arrivalParallaxOffset = ref(0)
const classroomParallaxOffset = ref(0)

const SCROLL_MARGIN = 24
const PARALLAX_LIMIT = 52
const isNavLinkActive = (hash: string) => activeSection.value === hash

interface ScrollOptions {
  updateUrl?: boolean
}

let sectionElements: { hash: string; element: HTMLElement }[] = []
let isInternalNavigation = false
let parallaxAnimationFrame: number | null = null

const clampParallax = (value: number) => Math.max(-PARALLAX_LIMIT, Math.min(PARALLAX_LIMIT, value))

const calculateParallaxOffset = (element: HTMLElement | null, strength: number) => {
  if (!import.meta.client || !element) return 0
  const rect = element.getBoundingClientRect()
  if (!rect.height) return 0
  const viewportCenter = window.innerHeight * 0.5
  const sectionCenter = rect.top + rect.height * 0.5
  const normalized = (viewportCenter - sectionCenter) / window.innerHeight
  return clampParallax(normalized * strength)
}

const updateParallaxOffsets = () => {
  if (!import.meta.client) return
  problemParallaxOffset.value = calculateParallaxOffset(problemSplashRef.value, 84)
  arrivalParallaxOffset.value = calculateParallaxOffset(arrivalSplashRef.value, 92)
  classroomParallaxOffset.value = calculateParallaxOffset(classroomSplashRef.value, 98)
}

const scheduleParallaxUpdate = () => {
  if (!import.meta.client) return
  if (parallaxAnimationFrame !== null) return
  parallaxAnimationFrame = window.requestAnimationFrame(() => {
    parallaxAnimationFrame = null
    updateParallaxOffsets()
  })
}

const problemParallaxStyle = computed(() => ({
  transform: `translate3d(0, ${problemParallaxOffset.value}px, 0) scale(1.08)`,
}))

const arrivalParallaxStyle = computed(() => ({
  transform: `translate3d(0, ${arrivalParallaxOffset.value}px, 0) scale(1.08)`,
}))

const classroomParallaxStyle = computed(() => ({
  transform: `translate3d(0, ${classroomParallaxOffset.value}px, 0) scale(1.1)`,
}))

const updateHeaderHeight = () => {
  if (!import.meta.client) return
  headerHeight.value = headerRef.value?.offsetHeight ?? 0
}

const updateSectionElements = () => {
  if (!import.meta.client) return
  sectionElements = navLinks
    .map((link) => {
      if (!link.to.startsWith('#')) return null
      const element = document.querySelector<HTMLElement>(link.to)
      return element ? { hash: link.to, element } : null
    })
    .filter((value): value is { hash: string; element: HTMLElement } => value !== null)
}

const updateActiveSection = () => {
  if (!import.meta.client) return
  if (!sectionElements.length) {
    activeSection.value = ''
    return
  }

  const scrollPosition = window.scrollY + headerHeight.value + SCROLL_MARGIN + 1
  for (let index = sectionElements.length - 1; index >= 0; index -= 1) {
    const { hash, element } = sectionElements[index]
    if (scrollPosition >= element.offsetTop) {
      activeSection.value = hash
      return
    }
  }

  activeSection.value = ''
}

const handleScroll = () => {
  updateActiveSection()
  scheduleParallaxUpdate()
}

const handleResize = () => {
  updateHeaderHeight()
  updateSectionElements()
  updateActiveSection()
  scheduleParallaxUpdate()
}

const scrollToSection = (hash: string, behavior: ScrollBehavior = 'smooth', options: ScrollOptions = {}) => {
  if (!import.meta.client || !hash.startsWith('#')) return

  if (hash === '#') {
    window.scrollTo({ top: 0, behavior })
    activeSection.value = ''
    if (options.updateUrl !== false && route.hash) {
      isInternalNavigation = true
      router
        .replace({ hash: '' })
        .catch(() => {})
        .finally(() => {
          isInternalNavigation = false
        })
    }
    return
  }

  const target = document.querySelector<HTMLElement>(hash)
  if (!target) return

  const top = target.getBoundingClientRect().top + window.scrollY - headerHeight.value - SCROLL_MARGIN
  window.scrollTo({
    top: Math.max(0, top),
    behavior,
  })
  activeSection.value = hash

  if (options.updateUrl !== false && route.hash !== hash) {
    isInternalNavigation = true
    router
      .replace({ hash })
      .catch(() => {})
      .finally(() => {
        isInternalNavigation = false
      })
  }
}

const handleAnchorNavigation = (hash: string, behavior: ScrollBehavior = 'smooth', options: ScrollOptions = {}) => {
  if (!import.meta.client) return

  if (!hash || hash === '#') {
    scrollToSection('#', behavior, options)
    return
  }

  scrollToSection(hash, behavior, options)
}

const handleDocumentClick = (event: MouseEvent) => {
  if (!import.meta.client || event.defaultPrevented) return

  const target = event.target as HTMLElement | null
  if (!target) return

  const anchor = target.closest('a[href]') as HTMLAnchorElement | null
  if (!anchor) return

  if (anchor.target === '_blank' || anchor.hasAttribute('download') || anchor.getAttribute('data-scroll-ignore') === 'true') {
    return
  }

  const href = anchor.getAttribute('href') ?? ''
  if (!href) return

  const isHashOnly = href.startsWith('#')
  const samePage = anchor.host === window.location.host && anchor.pathname === window.location.pathname
  const hash = anchor.hash || (isHashOnly ? href : '')

  if (!hash || (!isHashOnly && !samePage)) return

  event.preventDefault()
  handleAnchorNavigation(hash)
}

const handleHashChange = () => {
  if (!import.meta.client || isInternalNavigation) return

  const { hash } = window.location
  if (!hash) {
    updateActiveSection()
    return
  }

  handleAnchorNavigation(hash, 'auto', { updateUrl: false })
}

const isMobileNavOpen = ref(false)

const toggleMobileNav = () => {
  isMobileNavOpen.value = !isMobileNavOpen.value
}

const closeMobileNav = () => {
  isMobileNavOpen.value = false
}

const handleMobileNavLinkClick = (event: MouseEvent, item: ExtendedNavLink) => {
  if (item.external) {
    closeMobileNav()
    return
  }

  if (item.to.startsWith('#')) {
    event.preventDefault()
    handleAnchorNavigation(item.to)
    closeMobileNav()
    return
  }

  closeMobileNav()
}

watch(
  () => route.fullPath,
  () => {
    closeMobileNav()
  },
)

if (import.meta.client) {
  watch(isMobileNavOpen, (open) => {
    document.body.classList.toggle('overflow-hidden', open)
    nextTick(() => {
      updateHeaderHeight()
      updateActiveSection()
      scheduleParallaxUpdate()
    })
  })

  onBeforeUnmount(() => {
    document.body.classList.remove('overflow-hidden')
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('hashchange', handleHashChange)
    document.removeEventListener('click', handleDocumentClick)
    if (parallaxAnimationFrame !== null) {
      window.cancelAnimationFrame(parallaxAnimationFrame)
      parallaxAnimationFrame = null
    }
  })
}

interface WaitlistStats {
  count: number
  displayCount: number
  syntheticBoost: number
  recent7Days: number
  recent30Days: number
  lastJoinedAt: string | null
  generatedAt: string
}

interface CaptchaChallenge {
  id: string
  prompt: string
  answers: string[]
}

interface CaptchaState {
  challenge: CaptchaChallenge
  answer: string
}

const CAPTCHA_CHALLENGES: CaptchaChallenge[] = [
  {
    id: 'vfr-visual',
    prompt: 'What does the “V” in VFR stand for?',
    answers: ['visual', 'visual flight rules'],
  },
  {
    id: 'ifr-instrument',
    prompt: 'What does the “I” in IFR stand for?',
    answers: ['instrument', 'instrument flight rules'],
  },
  {
    id: 'atc-meaning',
    prompt: 'What does the A in ATC stand for?',
    answers: ['air', 'air traffic control'],
  },
  {
    id: 'affirm',
    prompt: 'How do pilots say “yes” on the radio?',
    answers: ['affirm', 'affirmative'],
  },
  {
    id: 'roger-copy',
    prompt: 'Which word means “I received your transmission” on the radio?',
    answers: ['roger', 'roger that', 'roger copy', 'copy'],
  },
  {
    id: 'wilco',
    prompt: 'Which word means “I will comply with your instruction”?',
    answers: ['wilco'],
  },
  {
    id: 'niner',
    prompt: 'How do pilots say the number 9 on the radio?',
    answers: ['niner', 'nine'],
  },
  {
    id: 'phonetic-alpha',
    prompt: 'What is the NATO phonetic word for the letter “A”?',
    answers: ['alpha'],
  },
  {
    id: 'phonetic-bravo',
    prompt: 'What is the NATO phonetic word for the letter “B”?',
    answers: ['bravo'],
  },
]

const DEFAULT_CAPTCHA = CAPTCHA_CHALLENGES[0]

const createCaptchaState = () =>
  reactive({
    challenge: DEFAULT_CAPTCHA,
    answer: '',
  }) as CaptchaState

const normaliseCaptchaValue = (value: string) =>
  value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const isCaptchaAnswerValid = (state: CaptchaState) => {
  const response = normaliseCaptchaValue(state.answer)
  if (!response) return false
  return state.challenge.answers.some((answer) => normaliseCaptchaValue(answer) === response)
}

const pickRandomChallenge = (excludeId?: string) => {
  const pool = excludeId ? CAPTCHA_CHALLENGES.filter((challenge) => challenge.id !== excludeId) : CAPTCHA_CHALLENGES
  const available = pool.length ? pool : CAPTCHA_CHALLENGES
  const index = Math.floor(Math.random() * available.length)
  return available[index]
}

const rotateCaptchaChallenge = (state: CaptchaState) => {
  const nextChallenge = pickRandomChallenge(state.challenge?.id)
  state.challenge = nextChallenge
  state.answer = ''
}

const numberFormatter = computed(() => new Intl.NumberFormat('en-US'))
const formatNumber = (value: number | null | undefined) => numberFormatter.value.format(Math.max(0, Math.round(value ?? 0)))

const dateLocale = 'en-US'
const shortDateOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }

const year = new Date().getFullYear()

const waitlistForm = reactive({
  name: '',
  email: '',
  notes: '',
  consentPrivacy: false,
  consentTerms: false,
  subscribeUpdates: false,
})

const waitlistCaptcha = createCaptchaState()
const waitlistCaptchaVisible = ref(false)
const waitlistCaptchaReminder = ref('')

const waitlistSubmitting = ref(false)
const waitlistSuccess = ref(false)
const waitlistError = ref('')
const waitlistStats = ref<WaitlistStats | null>(null)
const waitlistLoading = ref(false)

const waitlistCountDisplay = computed(() => formatNumber(waitlistStats.value?.displayCount ?? 0))
const waitlistLastJoinedFormatted = computed(() => {
  const iso = waitlistStats.value?.lastJoinedAt
  if (!iso) return '–'
  return formatWaitlistDate(iso)
})
const waitlistCaptchaValid = computed(() => isCaptchaAnswerValid(waitlistCaptcha))

watch(
  () => waitlistForm.email,
  (value) => {
    const hasValue = value?.trim().length > 0
    if (hasValue) {
      waitlistCaptchaVisible.value = true
    } else {
      waitlistCaptchaVisible.value = false
      waitlistCaptcha.answer = ''
      waitlistCaptchaReminder.value = ''
    }
  },
)

watch(
  () => waitlistCaptcha.answer,
  (value) => {
    if (waitlistCaptchaReminder.value && value?.trim().length) {
      waitlistCaptchaReminder.value = ''
    }
  },
)

async function loadWaitlistStats() {
  try {
    waitlistLoading.value = true
    const data = (await api.get('/api/service/waitlist', { auth: false })) as WaitlistStats
    waitlistStats.value = data
  } catch (err) {
    console.warn('Waitlist stats unavailable', err)
  } finally {
    waitlistLoading.value = false
  }
}

async function submitWaitlist() {
  if (waitlistSubmitting.value) return

  waitlistError.value = ''
  waitlistSuccess.value = false
  waitlistCaptchaReminder.value = ''

  const email = waitlistForm.email.trim()
  if (!email) {
    waitlistError.value = 'Please add your email so we can reach you.'
    return
  }

  if (!waitlistForm.consentPrivacy || !waitlistForm.consentTerms) {
    waitlistError.value = 'Please confirm the required checkboxes.'
    return
  }

  if (!waitlistCaptchaVisible.value) {
    waitlistCaptchaVisible.value = true
  }

  const hasCaptchaAnswer = waitlistCaptcha.answer.trim().length > 0
  if (!waitlistCaptchaValid.value) {
    if (!hasCaptchaAnswer) {
      waitlistCaptchaReminder.value = 'We currently get lots of spam. Please answer the short ATC question.'
    }
    return
  }

  waitlistSubmitting.value = true

  try {
    await api.post(
      '/api/service/waitlist',
      {
        name: waitlistForm.name,
        email,
        notes: waitlistForm.notes,
        consentPrivacy: waitlistForm.consentPrivacy,
        consentTerms: waitlistForm.consentTerms,
        wantsProductUpdates: waitlistForm.subscribeUpdates,
        source: 'landing-phase1-cta',
      },
      { auth: false },
    )

    waitlistSuccess.value = true
    await loadWaitlistStats()

    waitlistForm.name = ''
    waitlistForm.email = ''
    waitlistForm.notes = ''
    waitlistForm.consentPrivacy = false
    waitlistForm.consentTerms = false
    waitlistForm.subscribeUpdates = false

    waitlistCaptchaReminder.value = ''
    rotateCaptchaChallenge(waitlistCaptcha)
  } catch (err: any) {
    const fallback = 'Registration failed'
    const message = err?.data?.statusMessage || err?.message || fallback
    waitlistError.value = message
  } finally {
    waitlistSubmitting.value = false
  }
}

const formatWaitlistDate = (iso: string) => {
  if (!iso) return 'unknown'
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) {
    return 'unknown'
  }
  return parsed.toLocaleDateString(dateLocale, shortDateOptions)
}

const formatRelativeFromNow = (iso?: string | null) => {
  if (!iso) return '–'
  const target = new Date(iso)
  if (Number.isNaN(target.getTime())) return '–'

  const diff = Date.now() - target.getTime()
  const minute = 1000 * 60
  const hour = minute * 60
  const day = hour * 24

  if (diff < minute) return 'just now'
  if (diff < hour) {
    const mins = Math.round(diff / minute)
    return `${mins} min${mins === 1 ? '' : 's'} ago`
  }
  if (diff < day) {
    const hours = Math.round(diff / hour)
    return `${hours} hr${hours === 1 ? '' : 's'} ago`
  }
  if (diff < day * 14) {
    const days = Math.round(diff / day)
    return `${days} day${days === 1 ? '' : 's'} ago`
  }

  const weeks = Math.round(diff / (day * 7))
  if (weeks < 9) {
    return `${weeks} wk${weeks === 1 ? '' : 's'} ago`
  }

  const months = Math.round(diff / (day * 30))
  return `${months} mo${months === 1 ? '' : 's'} ago`
}

const initAosIfNeeded = async () => {
  if (!import.meta.client) return
  // @ts-ignore optional runtime global from module
  if ('AOS' in window) return
  const [{ default: AOS }] = await Promise.all([import('aos'), import('aos/dist/aos.css')])
  AOS.init({ once: true, duration: 600, easing: 'ease-out' })
}

onMounted(() => {
  if (!import.meta.client) return

  rotateCaptchaChallenge(waitlistCaptcha)

  nextTick(() => {
    updateHeaderHeight()
    updateSectionElements()
    updateActiveSection()
    updateParallaxOffsets()

    if (route.hash) {
      handleAnchorNavigation(route.hash, 'auto', { updateUrl: false })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)
    window.addEventListener('hashchange', handleHashChange)
    document.addEventListener('click', handleDocumentClick)

    window.setTimeout(() => {
      updateHeaderHeight()
      updateSectionElements()
      updateActiveSection()
      updateParallaxOffsets()
    }, 300)
  })

  void loadWaitlistStats()
  void initAosIfNeeded()
})

useHead(() => ({
  htmlAttrs: { lang: 'en' },
  title: 'Train ATC before you fly VATSIM | OpenSquawk',
  meta: [
    {
      name: 'description',
      content:
        'OpenSquawk helps aspiring VATSIM pilots train realistic radio communication with structured scenarios, instant feedback and clear progression.',
    },
    { name: 'theme-color', content: '#0ea5e9' },
    { property: 'og:title', content: 'Train ATC before you fly VATSIM | OpenSquawk' },
    {
      property: 'og:description',
      content:
        'Practice realistic ATC phraseology in a safe, structured environment. Build confidence before your first VATSIM flight.',
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: 'https://opensquawk.example.com/cover.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Train ATC before you fly VATSIM | OpenSquawk' },
    {
      name: 'twitter:description',
      content: 'Structured ATC radio training for aspiring VATSIM pilots.',
    },
    { name: 'twitter:image', content: 'https://opensquawk.example.com/cover.png' },
  ],
}))
</script>

<style scoped>
.container-outer {
  @apply mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-8;
}

.gradient-hero {
  background:
    radial-gradient(1200px 600px at 12% -20%, rgba(6, 182, 212, 0.32), transparent),
    radial-gradient(900px 520px at 100% 5%, rgba(59, 130, 246, 0.22), transparent),
    linear-gradient(180deg, rgba(11, 16, 32, 0.92) 0%, rgba(11, 16, 32, 0.94) 42%, rgba(11, 16, 32, 0.98) 68%, #0a0f1c 100%);
}

.gradient-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(7, 11, 24, 0.05) 0%, rgba(9, 14, 28, 0.1) 55%, rgba(11, 16, 32, 0.5) 100%),
    url('/img/learn/missions/full-flight/briefing-weather.png') center / cover no-repeat;
  opacity: 1;
  pointer-events: none;
  z-index: 0;
}

.hero-overlay {
  background: linear-gradient(90deg, rgba(11, 16, 32, 0.88) 0%, rgba(11, 16, 32, 0.62) 46%, rgba(11, 16, 32, 0.22) 100%);
  z-index: 1;
}

.hero-highlight {
  height: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 20px 44px rgba(6, 15, 35, 0.28);
}

.hero-highlight h3 {
  text-wrap: balance;
}

.hero-highlight p {
  text-wrap: pretty;
}

.problem-splash {
  min-height: clamp(500px, 72vh, 830px);
  position: relative;
  background: #0a0f1c;
}

.problem-splash-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 35%;
}

.problem-splash-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(7, 12, 24, 0.2) 10%, rgba(7, 12, 24, 0.44) 54%, rgba(7, 12, 24, 0.9) 100%),
    radial-gradient(100% 85% at 50% 100%, rgba(34, 211, 238, 0.18), rgba(34, 211, 238, 0));
}

.problem-splash-content {
  position: relative;
  z-index: 2;
  min-height: inherit;
  display: flex;
  align-items: flex-end;
  padding-top: 4.5rem;
  padding-bottom: 3.75rem;
}

.arrival-splash {
  min-height: clamp(480px, 72vh, 820px);
  position: relative;
  background: #0a0f1c;
}

.arrival-splash-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 45%;
}

.classroom-splash {
  min-height: clamp(470px, 70vh, 790px);
  position: relative;
  background: #0a0f1c;
}

.classroom-splash-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 40%;
}

.parallax-media {
  transform-origin: center center;
  will-change: transform;
  transition: transform 260ms ease-out;
}

.arrival-splash-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(7, 12, 24, 0.16) 10%, rgba(7, 12, 24, 0.42) 54%, rgba(7, 12, 24, 0.88) 100%),
    radial-gradient(90% 80% at 50% 100%, rgba(34, 211, 238, 0.16), rgba(34, 211, 238, 0));
}

.arrival-splash-content {
  position: relative;
  z-index: 2;
  min-height: inherit;
  display: flex;
  align-items: flex-end;
  padding-top: 4.5rem;
  padding-bottom: 3.75rem;
}

.classroom-splash-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(7, 12, 24, 0.2) 8%, rgba(7, 12, 24, 0.4) 52%, rgba(7, 12, 24, 0.9) 100%),
    radial-gradient(120% 90% at 50% 100%, rgba(34, 211, 238, 0.2), rgba(34, 211, 238, 0));
}

.classroom-splash-content {
  position: relative;
  z-index: 2;
  min-height: inherit;
  display: flex;
  align-items: flex-end;
  padding-top: 4.5rem;
  padding-bottom: 3.75rem;
}

.glass {
  background: rgba(255, 255, 255, 0.065);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.btn {
  @apply inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-medium transition sm:px-6;
}

.btn-primary {
  @apply border border-cyan-300/40 bg-cyan-500 text-white hover:bg-cyan-400 shadow-[0_0_48px_rgba(34,211,238,.3)];
}

.btn-ghost {
  @apply bg-white/5 text-white hover:bg-white/10;
}

.btn-compact {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
}

@media (min-width: 640px) {
  .btn-compact {
    padding: 0.6rem 1rem;
    font-size: 0.875rem;
  }
}

.card {
  @apply rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 md:p-7;
  backdrop-filter: blur(14px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 22px 52px rgba(5, 12, 28, 0.3);
}

.pricing-card {
  overflow: visible;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.035)),
    rgba(11, 16, 32, 0.72);
  min-height: 100%;
}

.chip {
  @apply inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs tracking-[0.08em] text-white;
}

.step-number {
  @apply inline-flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/50 bg-cyan-400/10 text-lg font-semibold text-cyan-200;
}

.mobile-nav-enter-active,
.mobile-nav-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.mobile-nav-enter-from,
.mobile-nav-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.mobile-toggle {
  @apply inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10;
  width: 44px;
  height: 44px;
}

@media (min-width: 1024px) {
  .mobile-toggle {
    display: none;
  }
}

.hamburger {
  position: relative;
  width: 20px;
  height: 14px;
}

.hamburger-bar {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.9);
  transition: top 0.25s ease, transform 0.25s ease, opacity 0.25s ease;
}

.hamburger-bar:nth-child(1) {
  top: 0;
}

.hamburger-bar:nth-child(2) {
  top: 6px;
}

.hamburger-bar:nth-child(3) {
  top: 12px;
}

.hamburger.is-open .hamburger-bar:nth-child(1) {
  top: 6px;
  transform: rotate(45deg);
}

.hamburger.is-open .hamburger-bar:nth-child(2) {
  opacity: 0;
  transform: translateX(-6px);
}

.hamburger.is-open .hamburger-bar:nth-child(3) {
  top: 6px;
  transform: rotate(-45deg);
}

@media (prefers-reduced-motion: reduce) {
  .parallax-media {
    transition: none;
    transform: none !important;
  }

  .hamburger-bar {
    transition: none;
  }
}

.footer-brand {
  @apply flex flex-col items-center gap-4 text-center sm:items-start sm:text-left lg:flex-row lg:items-center lg:justify-between lg:gap-8;
}

.footer-brand-actions {
  @apply flex flex-wrap items-center justify-center gap-3 sm:justify-start lg:ml-auto lg:justify-end;
}

.footer-action {
  @apply inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-cyan-400/60 hover:bg-white/10;
}
</style>
