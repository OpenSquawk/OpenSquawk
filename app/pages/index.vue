<template>
  <div class="bg-[#0b1020] text-white antialiased selection:bg-cyan-400/30">
    <!-- NAV -->
    <header class="fixed left-0 right-0 top-0 z-50 bg-[#0b1020]/70 backdrop-blur border-b border-white/10"
            data-aos="fade-down">
      <nav class="container-outer flex items-center justify-between py-3">
        <NuxtLink to="#" class="flex items-center gap-2 font-semibold tracking-tight">
          <v-icon icon="mdi-radar" size="28" class="text-cyan-400"/>
          <span class="text-white">OpenSquawk</span>
        </NuxtLink>
        <div class="hidden lg:flex items-center gap-6 text-sm">
          <NuxtLink
              v-for="item in navLinks"
              :key="item.to"
              :to="item.to"
              class="hover:text-cyan-300"
          >
            {{ item.label }}
          </NuxtLink>
        </div>
        <div class="flex items-center gap-2 sm:gap-3">
          <NuxtLink
              to="/login"
              class="btn btn-primary whitespace-nowrap btn-compact"
              aria-label="Login"
          >
            <v-icon icon="mdi-login" size="18"/>
            <span class="hidden sm:inline">Login</span>
          </NuxtLink>
          <span
              class="hidden lg:inline-block text-sm text-white/70"
              title="OpenSquawk is open-source on GitHub"
          >
          <NuxtLink
              :to="GITHUB_URL"
              external
              target="_blank"
              rel="noopener"
              class="btn btn-ghost btn-compact"
          >
            <v-icon icon="mdi-github"/>
            GitHub
          </NuxtLink></span>
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
                  @click="closeMobileNav"
              >
                <span class="flex items-center gap-3">
                  <v-icon v-if="item.icon" :icon="item.icon" size="18" class="text-white/60"/>
                  <span>{{ item.label }}</span>
                </span>
                <v-icon icon="mdi-chevron-right" size="18" class="text-white/60"/>
              </NuxtLink>
            </nav>
            <div class="grid gap-2">
              <NuxtLink to="/login" class="btn btn-primary w-full" @click="closeMobileNav">
                <v-icon icon="mdi-login" size="18"/>
                Login
              </NuxtLink>
            </div>
          </div>
        </div>
      </Transition>
    </header>

    <!-- HERO -->
    <section class="gradient-hero relative overflow-hidden">
      <div class="hero-overlay absolute inset-0 pointer-events-none">
        <div class="absolute -top-24 right-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl"/>
      </div>

      <div class="container-outer relative z-10 mt-8 pt-14 pb-10 sm:pt-20 sm:pb-16 md:pt-24 md:pb-20">
        <div
            class="hero-grid grid gap-10 lg:my-20 xl:gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center">
          <div class="hero-copy max-w-2xl" data-aos="fade-up">
            <span class="chip mb-4">In development · Live AI ATC</span>
            <h1 class="text-3xl sm:text-5xl md:text-6xl font-semibold leading-tight">
              OpenSquawk<br/>
              <span class="text-cyan-400">Live speech ATC for simulator pilots</span>
            </h1>
            <p class="mt-4 sm:mt-6 text-white/80 text-base sm:text-lg">
              Push-to-talk in your sim, get authentic instructions back. Speech-to-text, an AI-guided state machine and
              realistic text-to-speech keep every exchange inside real-world procedures.
            </p>
            <ul class="mt-6 space-y-2 text-white/70 text-sm sm:text-base">
              <li class="flex items-start gap-2">
                <v-icon icon="mdi-microphone" size="18" class="mt-[3px] text-cyan-300"/>
                <span>Built for natural radio without losing procedural control.</span>
              </li>
              <li class="flex items-start gap-2">
                <v-icon icon="mdi-microsoft" size="18" class="mt-[3px] text-cyan-300"/>
                <span>MSFS plug-in streams flight state so the controller can react</span>
              </li>
              <li class="flex items-start gap-2">
                <v-icon icon="mdi-package-variant" size="18" class="mt-[3px] text-cyan-300"/>
                <span><strong>Product lineup</strong>: Live ATC (in development) and Classroom listening drills (alpha, invite only)</span>
              </li>
            </ul>
            <p class="mt-2 text-sm text-white/70">
              We build in the open and welcome collaborators – engineers, ATC SMEs, voice nerds and sim pilots. Say hi
              at
              <a class="text-cyan-300 underline" href="mailto:info@opensquawk.de">info@opensquawk.de</a>.
            </p>
            <div class="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
              <NuxtLink to="#cta" class="btn btn-primary text-base">
                <v-icon icon="mdi-account-plus" size="20"/>
                Join the Live ATC waitlist
              </NuxtLink>
              <NuxtLink to="#classroom" class="btn btn-ghost text-base">
                <v-icon icon="mdi-school" size="20"/>
                Classroom alpha info
              </NuxtLink>
            </div>
          </div>
          <div class="hero-form w-full max-w-xl lg:justify-self-end
         backdrop-blur-md
" data-aos="fade-left" data-aos-delay="140">
            <form class="rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-5 space-y-4"
                  @submit.prevent="submitUpdates">
              <div class="space-y-3">
                <h3 class="text-2xl font-semibold">
                  Hear about new features first!
                </h3>
                <p class="text-sm text-white/70">
                  Join the feature list and get updates on releases, drops & classroom content.
                </p>
              </div>
              <div class="flex flex-col gap-3 py-2 sm:flex-row">
                <input
                    v-model.trim="updatesForm.email"
                    type="email"
                    required
                    placeholder="your@email"
                    class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-cyan-400"
                    aria-label="Email for product updates"
                />
                <button
                    type="submit"
                    class="btn btn-primary w-full sm:w-auto lg:w-48"
                    :disabled="!updatesFormValid || updatesSubmitting"
                >
                  <span v-if="updatesSubmitting" class="flex items-center gap-2">
                    <v-progress-circular indeterminate size="16" width="2" color="white"/>
                    Saving…
                  </span>
                  <span v-else class="flex items-center gap-2 w-28 justify-center">
                    <v-icon icon="mdi-bell-ring" size="18"/>
                    Notify me
                  </span>
                </button>
              </div>
              <div class="space-y-2 text-xs text-white/60">
                <label class="flex items-start gap-3">
                  <input type="checkbox" v-model="updatesForm.consentMarketing" class="mt-1" required/>
                  <span>
                    Yes, email me when new features, waitlist drops or classroom content go live.
                  </span>
                </label>
                <label class="flex items-start gap-3">
                  <input type="checkbox" v-model="updatesForm.consentPrivacy" class="mt-1" required/>
                  <span>
                    I have read the
                    <NuxtLink to="/datenschutz" class="text-cyan-300 underline">privacy policy</NuxtLink>.
                  </span>
                </label>
              </div>
              <p v-if="updatesSuccess" class="text-sm text-green-300">
                Thanks! We will let you know when new features go live.
              </p>
              <p v-else-if="updatesError" class="text-sm text-red-300">{{ updatesError }}</p>
              <p v-else class="text-xs text-white/50">
                No spam – only relevant product updates. Unsubscribe any time.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- SOCIAL PROOF / LOGOS -->
    <section class="py-8 sm:py-10 border-t border-white/10 bg-[#0a0f1c]" data-aos="fade-up">
      <div class="container-outer">
        <div
            class="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 items-center opacity-80 text-xs sm:text-sm md:text-base">
          <div class="flex items-center justify-center gap-2 text-white/60">
            <v-icon icon="mdi-radar" class="opacity-70"/>
            Live ATC · in development
          </div>
          <div class="flex items-center justify-center gap-2 text-white/60">
            <v-icon icon="mdi-school" class="opacity-70"/>
            Classroom · alpha invites running
          </div>
          <div class="flex items-center justify-center gap-2 text-white/60">
            <v-icon icon="mdi-waveform" class="opacity-70"/>
            STT → LLM → TTS Pipeline
          </div>
          <div class="flex items-center justify-center gap-2 text-white/60">
            <v-icon icon="mdi-microsoft" class="opacity-70"/>
            MSFS 2020 first · 2024+ roadmap
          </div>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section id="features" class="py-12 sm:py-16 md:py-24 bg-gradient-to-b from-[#0a0f1c] to-[#0b1020]">
      <div class="container-outer">
        <div class="max-w-2xl mb-10" data-aos="fade-up">
          <h2 class="text-3xl md:text-4xl font-semibold">
            Built for real-sounding, state-aware radio work
          </h2>
          <p class="mt-3 text-white/80">
            OpenSquawk combines open tooling with domain rules so every call feels like talking to a human controller –
            without giving the LLM free rein.
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-3 md:gap-6">
          <div class="card" data-aos="fade-up" data-aos-delay="0">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/20">
                <v-icon icon="mdi-waveform" class="text-cyan-300"/>
              </div>
              <h3 class="font-semibold text-lg">
                Speech-in, speech-out
              </h3>
            </div>
            <p class="mt-3 text-white/80">
              Whisper-class STT cleans up radio audio, the LLM matches it to our curated decision tree and Coqui/Piper
              voices read back the exact instruction.
            </p>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="100">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/20">
                <v-icon icon="mdi-airplane-takeoff" class="text-cyan-300"/>
              </div>
              <h3 class="font-semibold text-lg">
                Flight-state aware logic
              </h3>
            </div>
            <p class="mt-3 text-white/80">
              Our MSFS plug-in mirrors heading, altitude, flight plan and traffic data into the controller so ATC can
              vector, warn or hand off even without a pilot call.
            </p>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="200">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/20">
                <v-icon icon="mdi-source-repository" class="text-cyan-300"/>
              </div>
              <h3 class="font-semibold text-lg">
                Open and auditable
              </h3>
            </div>
            <p class="mt-3 text-white/80">
              Everything ships as open source so simmers, instructors and researchers can inspect prompts, rules and
              voices – or self-host the full stack.
            </p>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2 md:gap-6 mt-6">
          <div class="card" data-aos="fade-up" data-aos-delay="0">
            <h3 class="font-semibold text-lg">
              Simulator roadmap
            </h3>
            <p class="mt-3 text-white/80">
              Live ATC launches with Microsoft Flight Simulator on Windows. We are mapping the same telemetry bridge to
              MSFS 2024, then X-Plane and later FlightGear (Win/Linux/macOS).
            </p>
            <ul class="mt-3 space-y-2 text-white/70 text-sm list-disc list-inside">
              <li>MSFS 2020: plug-in prototype streaming flight data & push-to-talk audio.</li>
              <li>MSFS 2024: compatibility update shortly after release.</li>
              <li>X-Plane & FlightGear: design underway, targeting Windows first, then Linux/macOS.</li>
            </ul>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="100">
            <h3 class="font-semibold text-lg">
              Classroom alpha today
            </h3>
            <p class="mt-3 text-white/80">
              The Classroom mode already runs listening drills: play ATC clips, extract clearances, compare with the
              answer key and repeat until it sticks.
            </p>
            <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div class="glass rounded-xl p-3 flex items-center gap-2">
                <v-icon icon="mdi-headset"/>
                Hearing exercises
              </div>
              <div class="glass rounded-xl p-3 flex items-center gap-2">
                <v-icon icon="mdi-clipboard-text"/>
                Instant answer check
              </div>
              <div class="glass rounded-xl p-3 flex items-center gap-2">
                <v-icon icon="mdi-account-hard-hat"/>
                Invite-only alpha
              </div>
              <div class="glass rounded-xl p-3 flex items-center gap-2">
                <v-icon icon="mdi-source-branch"/>
                Open source code
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- NEWS -->
    <section id="news" class="py-12 sm:py-16 md:py-24 bg-[#0b1020] border-y border-white/10">
      <div class="container-outer space-y-8">
        <div class="max-w-2xl" data-aos="fade-up">
          <h2 class="text-3xl md:text-4xl font-semibold">News & Updates</h2>
          <p class="mt-3 text-white/80">
            Content-driven posts keep you in the loop. All articles are stored in Markdown – new stories show up here
            automatically.
          </p>
        </div>
        <div v-if="latestNews.length" class="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          <article
              v-for="post in latestNews"
              :key="post.slug"
              class="card flex flex-col gap-4"
              data-aos="fade-up"
          >
            <div class="space-y-2">
              <span class="chip text-[10px] uppercase tracking-[0.3em]">{{ formatNewsDate(post.publishedAt) }}</span>
              <h3 class="text-xl font-semibold">{{ post.title }}</h3>
              <p class="text-sm text-white/70">{{ post.excerpt }}</p>
            </div>
            <div class="mt-auto flex items-center justify-between text-xs text-white/60">
              <span>{{ post.readingTime }}</span>
              <NuxtLink :to="`/news/${post.slug}`" class="text-cyan-300 text-sm font-medium hover:underline">
                Read more
              </NuxtLink>
            </div>
          </article>
        </div>
        <div v-else class="card text-sm text-white/70" data-aos="fade-up">
          No news published yet – the first post is coming soon.
        </div>
        <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3" data-aos="fade-up">
          <NuxtLink to="/news" class="btn btn-ghost">
            View all news
          </NuxtLink>
          <span class="text-xs text-white/50 sm:text-left text-center">
            Tell us if you want to share your own experience.
          </span>
        </div>
      </div>
    </section>

    <!-- ROADMAP -->
    <section id="roadmap" class="py-12 sm:py-16 md:py-24 bg-[#0b1020] border-y border-white/10">
      <div class="container-outer space-y-10">
        <div class="max-w-3xl" data-aos="fade-up">
          <h2 class="text-3xl md:text-4xl font-semibold">
            Roadmap & community voting
          </h2>
          <p class="mt-3 text-white/80">
            Vote on what should take priority next. We combine votes with timestamps to plan features for training,
            immersion and infrastructure.
          </p>
          <div
              class="mt-4 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
            <v-icon icon="mdi-account-group" size="18" class="text-cyan-300"/>
            <span>{{ roadmapStatsLabel }}</span>
          </div>
          <div class="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <button
                type="button"
                class="btn btn-ghost w-full sm:w-auto"
                @click="toggleRoadmap"
                :aria-expanded="roadmapExpanded"
            >
              <span v-if="roadmapExpanded">Hide roadmap details</span>
              <span v-else>Show roadmap details</span>
            </button>
            <span v-if="!roadmapExpanded" class="text-xs text-white/50 text-center sm:text-left">
              Expand to explore priorities and submit your votes.
            </span>
          </div>
        </div>

        <div v-if="roadmapExpanded" class="space-y-6">
          <div v-if="roadmapLoading" class="card text-white/70" data-aos="fade-up">
            Loading current roadmap priorities…
          </div>
          <template v-else>
            <div class="grid gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
              <div
                  v-for="item in roadmapItems"
                  :key="item.key"
                  class="card flex flex-col gap-4"
                  data-aos="fade-up"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <span class="chip text-[10px] uppercase tracking-[0.3em]">{{ item.category }}</span>
                    <h3 class="mt-2 flex items-center gap-2 text-lg font-semibold">
                      <v-icon v-if="item.icon" :icon="item.icon" size="22" class="text-cyan-300"/>
                      <span>{{ item.title }}</span>
                    </h3>
                  </div>
                  <div class="text-right text-xs text-white/60 space-y-1">
                    <div class="text-sm font-semibold text-white">
                      <template v-if="item.averageImportance !== null">
                        {{ formatAverage(item.averageImportance) }}/5
                      </template>
                      <template v-else>—</template>
                    </div>
                    <div>
                      <span>{{ formatNumber(item.votes) }} votes</span>
                    </div>
                    <div v-if="item.lastVoteAt" class="text-white/40">
                      <span>last vote {{ formatRelativeFromNow(item.lastVoteAt) }}</span>
                    </div>
                    <div v-else class="text-white/40">
                      no votes yet
                    </div>
                  </div>
                </div>
                <p class="text-sm text-white/70">{{ item.description }}</p>
                <div class="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div class="h-2 rounded-full bg-cyan-400 transition-all" :style="{ width: `${item.scorePercent}%` }"/>
                </div>
                <div class="space-y-3">
                  <div class="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-white/50">
                    <span>Choose priority</span>
                    <span v-if="roadmapTouched[item.key]" class="text-cyan-300">
                      marked
                    </span>
                  </div>
                  <div
                      class="roadmap-scale"
                      role="group"
                      :aria-label="`Priority for ${item.title}`"
                  >
                    <button
                        v-for="value in ROADMAP_SCALE"
                        :key="value"
                        type="button"
                        class="roadmap-pill"
                        :class="{ 'is-active': roadmapSelections[item.key] === value }"
                        :aria-pressed="roadmapSelections[item.key] === value"
                        @click="selectRoadmapImportance(item.key, value)"
                    >
                      <span class="text-sm font-semibold">{{ value }}</span>
                      <span class="label">{{ roadmapImportanceShortLabel(value) }}</span>
                    </button>
                  </div>
                  <div class="text-sm text-white/80">
                    {{ roadmapImportanceLabel(roadmapSelections[item.key]) }}
                  </div>
                </div>
              </div>
            </div>

            <div
                class="card flex flex-col gap-4 border-white/10 bg-white/5 md:flex-row md:items-center md:justify-between"
                data-aos="fade-up">
              <div class="space-y-2">
                <h4 class="text-lg font-semibold">
                  Save your selection
                </h4>
                <p class="text-sm text-white/70">
                  We store every vote individually with a timestamp, so we see what matters right now. Adjust several
                  cards and submit everything together.
                </p>
              </div>
              <div class="flex w-full flex-col gap-2 md:w-auto">
                <button
                    type="button"
                    class="btn btn-primary w-full md:w-auto"
                    @click="submitRoadmapVotes"
                    :disabled="!hasRoadmapVote || roadmapSubmitting"
                >
                  <span v-if="roadmapSubmitting" class="flex items-center gap-2">
                    <v-progress-circular indeterminate size="16" width="2" color="white"/>
                    Saving votes…
                  </span>
                  <span v-else>Submit votes</span>
                </button>
                <p v-if="roadmapSuccess" class="text-center text-sm text-green-300 md:text-left">
                  Thanks! Your votes have been recorded.
                </p>
                <p v-else-if="roadmapError" class="text-center text-sm text-red-300 md:text-left">{{ roadmapError }}</p>
                <p v-else class="text-center text-xs text-white/50 md:text-left">
                  Tip: Only adjust priorities when you have feedback for that topic.
                </p>
              </div>
            </div>
          </template>
          <div class="card space-y-4" data-aos="fade-up">
            <div class="space-y-2">
              <h4 class="text-lg font-semibold">
                Missing something on the roadmap?
              </h4>
              <p class="text-sm text-white/70">
                Share the feature you are missing or a problem we should solve. We prioritise community ideas.
              </p>
            </div>
            <form class="space-y-3" @submit.prevent="submitRoadmapSuggestion">
              <input
                  v-model.trim="roadmapSuggestionForm.title"
                  type="text"
                  required
                  placeholder="Short title – e.g. ATIS integration for EDDF"
                  class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-cyan-400"
                  aria-label="Title for roadmap suggestion"
              />
              <textarea
                  v-model.trim="roadmapSuggestionForm.details"
                  rows="4"
                  required
                  placeholder="Describe why this matters or how it would help you."
                  class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-cyan-400"
              />
              <div class="grid gap-3 sm:grid-cols-2">
                <input
                    v-model.trim="roadmapSuggestionForm.email"
                    type="email"
                    placeholder="Email (optional)"
                    class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-cyan-400"
                />
                <label class="flex items-start gap-3 text-xs text-white/60">
                  <input
                      type="checkbox"
                      v-model="roadmapSuggestionForm.allowContact"
                      class="mt-1"
                      :disabled="!roadmapSuggestionForm.email"
                  />
                  <span>
                    Feel free to follow up by email if questions pop up.
                  </span>
                </label>
              </div>
              <label class="flex items-start gap-3 text-xs text-white/60">
                <input type="checkbox" v-model="roadmapSuggestionForm.consentPrivacy" class="mt-1" required/>
                <span>
                  I have read the <NuxtLink to="/datenschutz"
                                            class="text-cyan-300 underline">privacy policy</NuxtLink> and consent to the processing of my suggestion.
                </span>
              </label>
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                    type="submit"
                    class="btn btn-primary w-full sm:w-auto"
                    :disabled="!roadmapSuggestionFormValid || roadmapSuggestionSubmitting"
                >
                  <span v-if="roadmapSuggestionSubmitting" class="flex items-center gap-2">
                    <v-progress-circular indeterminate size="16" width="2" color="white"/>
                    Sending suggestion…
                  </span>
                  <span v-else>Send suggestion</span>
                </button>
                <p v-if="roadmapSuggestionSuccess" class="text-sm text-green-300">
                  Thanks! We will review your suggestion and follow up if needed.
                </p>
                <p v-else-if="roadmapSuggestionError" class="text-sm text-red-300">{{ roadmapSuggestionError }}</p>
                <p v-else class="text-xs text-white/50">
                  We read every suggestion personally. The optional contact field is only used for follow-ups.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- CLASSROOM -->
    <section id="classroom" class="py-12 sm:py-16 md:py-24 bg-[#0b1020]">
      <div class="container-outer">
        <div class="grid gap-6 md:grid-cols-2 md:gap-8 items-center">
          <div data-aos="fade-right">
            <h2 class="text-3xl md:text-4xl font-semibold">
              Classroom
            </h2>
            <p class="mt-3 text-white/80">
              Invitation-only cohorts practise listening comprehension: extract the clearance, compare with the answer
              key and repeat until every call sticks.
            </p>
            <ol class="mt-5 space-y-3 text-white/80">
              <li class="flex gap-3"><span class="chip">1</span><span><b>Basics</b> (concept): numbers, letters, standard readbacks.</span>
              </li>
              <li class="flex gap-3"><span class="chip">2</span><span><b>Simples</b> (alpha): taxi, takeoff, initial climb, basic vectors.</span>
              </li>
              <li class="flex gap-3"><span class="chip">3</span><span><b>Patterns</b> (bravo): full pattern work, touch-and-go, exit instructions.</span>
              </li>
              <li class="flex gap-3"><span class="chip">5</span><span><b>Full flight</b>  clearance to destination, enroute calls, approach handoff.</span>
              </li>
            </ol>
            <div class="mt-6 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
              <NuxtLink to="#cta" class="btn btn-primary">
                Join Live ATC waitlist
              </NuxtLink>
              <a href="mailto:info@opensquawk.de" class="btn btn-ghost">
                Request a Classroom invite
              </a>
            </div>
          </div>
          <img src="/img/landing/simulator.jpeg" alt="Runway" class="rounded-lg card w-full object-cover"/>
        </div>
      </div>
    </section>

    <!-- PRICING -->
    <section id="pricing" class="py-12 sm:py-16 md:py-24 bg-gradient-to-b from-[#0b1020] to-[#0a0f1c]">
      <div class="container-outer">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4" data-aos="fade-up">
          <div class="max-w-2xl">
            <h2 class="text-3xl md:text-4xl font-semibold">
              Product lineup & availability
            </h2>
            <p class="mt-3 text-white/80">
              Two experiences, one stack. Classroom is flying today via invitation, Live ATC is the flagship in active
              development and the open-source core stays free to inspect or host yourself.
            </p>
          </div>
        </div>

        <div class="mt-8 grid gap-4 md:grid-cols-3 md:gap-6 items-stretch">
          <!-- Live ATC -->
          <div class="card relative flex flex-col h-full pricing-card" data-aos="fade-up" data-aos-delay="0">
            <div class="absolute -top-3 right-4 chip">Flagship</div>
            <div class="flex flex-col flex-1">
              <div class="flex flex-col flex-1">
                <h3 class="text-xl font-semibold">
                  Live ATC (in development)
                </h3>
                <p class="mt-2 text-white/80 flex-1">
                  AI controller that listens to your PTT call, consults the state machine and answers with authentic
                  phraseology. Perfect for solo IFR/VFR practice when networks are offline.
                </p>
                <div class="mt-5 text-3xl font-semibold">
                  Closed alpha<span class="text-white/60 text-sm font-normal"> · waitlist open</span>
                </div>
                <ul class="mt-5 space-y-3 text-sm">
                  <li class="flex items-start gap-3 text-white/80">
                    <v-icon icon="mdi-check-circle" size="18" class="text-emerald-400 mt-[2px]"/>
                    <span>PTT → STT → LLM decision tree → TTS pipeline</span>
                  </li>
                  <li class="flex items-start gap-3 text-white/80">
                    <v-icon icon="mdi-check-circle" size="18" class="text-emerald-400 mt-[2px]"/>
                    <span>MSFS 2020 plug-in streams live telemetry</span>
                  </li>
                  <li class="flex items-start gap-3 text-white/80">
                    <v-icon icon="mdi-check-circle" size="18" class="text-emerald-400 mt-[2px]"/>
                    <span>Proactive calls for spacing, altitude and handoffs</span>
                  </li>
                  <li class="flex items-start gap-3 text-white/60">
                    <v-icon icon="mdi-close-circle" size="18" class="text-red-400 mt-[2px]"/>
                    <span>Public download (planned post-alpha)</span>
                  </li>
                  <li class="flex items-start gap-3 text-white/60">
                    <v-icon icon="mdi-close-circle" size="18" class="text-red-400 mt-[2px]"/>
                    <span>X-Plane / FlightGear builds (roadmap)</span>
                  </li>
                </ul>
              </div>
              <NuxtLink to="#cta" class="btn btn-primary w-full mt-6">
                Join the waitlist
              </NuxtLink>
            </div>
          </div>

          <!-- Classroom -->
          <div
              class="card border-2 border-cyan-400/40 relative flex flex-col h-full pricing-card shadow-[0_0_40px_rgba(34,211,238,.25)]"
              data-aos="fade-up"
              data-aos-delay="100"
          >
            <div class="absolute -top-3 right-4 chip bg-cyan-500/30 border-cyan-400/50">
              Live today
            </div>
            <div class="flex flex-col flex-1">
              <div class="flex flex-col flex-1">
                <h3 class="text-xl font-semibold">Classroom (alpha invitation)</h3>
                <p class="mt-2 text-white/80 flex-1">
                  Listening drills that sharpen comprehension: decode clearances, practise readbacks and compare against
                  official transcripts.
                </p>
                <div class="mt-5 text-3xl font-semibold">
                  Invitation only<span class="text-white/60 text-sm font-normal"> · alpha</span>
                </div>
                <ul class="mt-5 space-y-3 text-sm">
                  <li class="flex items-start gap-3 text-white/80">
                    <v-icon icon="mdi-check-circle" size="18" class="text-emerald-400 mt-[2px]"/>
                    <span>Scenario packs: Ground, Departure, Approach</span>
                  </li>
                  <li class="flex items-start gap-3 text-white/80">
                    <v-icon icon="mdi-check-circle" size="18" class="text-emerald-400 mt-[2px]"/>
                    <span>Instant feedback on key details (altitude, squawk, headings)</span>
                  </li>
                  <li class="flex items-start gap-3 text-white/80">
                    <v-icon icon="mdi-check-circle" size="18" class="text-emerald-400 mt-[2px]"/>
                    <span>Invite-based cohorts for structured feedback</span>
                  </li>
                  <li class="flex items-start gap-3 text-white/60">
                    <v-icon icon="mdi-close-circle" size="18" class="text-red-400 mt-[2px]"/>
                    <span>Public signup (planned)</span>
                  </li>
                  <li class="flex items-start gap-3 text-white/60">
                    <v-icon icon="mdi-close-circle" size="18" class="text-red-400 mt-[2px]"/>
                    <span>Offline package download (researching)</span>
                  </li>
                </ul>
              </div>
              <NuxtLink to="#classroom" class="btn btn-primary w-full mt-6">
                Request an invite
              </NuxtLink>
            </div>
          </div>

          <div class="card relative flex flex-col h-full pricing-card" data-aos="fade-up" data-aos-delay="200">
            <div class="absolute -top-3 right-4 chip">Open source</div>
            <div class="flex flex-col flex-1">
              <div class="flex flex-col flex-1">
                <h3 class="text-xl font-semibold">
                  Self-host & contribute
                </h3>
                <p class="mt-2 text-white/80 flex-1">
                  Clone the repo, run Docker and modify the controller logic. Ideal for researchers, virtual airlines or
                  devs who want a fully local stack.
                </p>
                <div class="mt-5 text-3xl font-semibold">
                  0€<span class="text-white/60 text-sm font-normal"> / always</span>
                </div>
                <ul class="mt-5 space-y-3 text-sm">
                  <li class="flex items-start gap-3 text-white/80">
                    <v-icon icon="mdi-check-circle" size="18" class="text-emerald-400 mt-[2px]"/>
                    <span>Nuxt UI, Node services, STT/LLM/TTS pipeline – all open</span>
                  </li>
                  <li class="flex items-start gap-3 text-white/80">
                    <v-icon icon="mdi-check-circle" size="18" class="text-emerald-400 mt-[2px]"/>
                    <span>Decision tree & prompts ready for experimentation</span>
                  </li>
                  <li class="flex items-start gap-3 text-white/80">
                    <v-icon icon="mdi-check-circle" size="18" class="text-emerald-400 mt-[2px]"/>
                    <span>Plugin SDK hooks for future sims (X-Plane, FlightGear)</span>
                  </li>
                  <li class="flex items-start gap-3 text-white/60">
                    <v-icon icon="mdi-close-circle" size="18" class="text-red-400 mt-[2px]"/>
                    <span>Managed hosting or SLA</span>
                  </li>
                  <li class="flex items-start gap-3 text-white/60">
                    <v-icon icon="mdi-close-circle" size="18" class="text-red-400 mt-[2px]"/>
                    <span>Cloud voice/STT credits included</span>
                  </li>
                </ul>
              </div>
              <NuxtLink
                  :to="GITHUB_URL"
                  external
                  target="_blank"
                  rel="noopener"
                  class="btn btn-ghost w-full mt-6"
              >
                View repository
              </NuxtLink>
            </div>
          </div>
        </div>

        <div class="mt-8 text-sm text-white/70 space-y-2" data-aos="fade-up" data-aos-delay="300">
          <p>
            Live ATC alpha runs offline-first while we research licensing for networks such as VATSIM and IVAO. We will
            only enable direct connectivity once community rules and legal reviews are satisfied.
          </p>
          <p>
            Until then we double down on the state machine, simulator plug-ins and new Classroom scenarios – shaped by
            roadmap votes and alpha feedback.
          </p>
        </div>
      </div>
    </section>

    <!-- OPEN SOURCE -->
    <section id="opensource" class="py-12 sm:py-16 md:py-24 bg-[#0a0f1c]">
      <div class="container-outer">
        <div class="grid gap-6 md:grid-cols-2 md:gap-8 items-center">
          <div data-aos="fade-right">
            <h2 class="text-3xl md:text-4xl font-semibold">
              Open-source, community-driven
            </h2>
            <p class="mt-3 text-white/80">
              Transparent architecture, clear roadmap, open issues. Build your own voices, integrations and workflows.
            </p>
            <ul class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <li class="glass rounded-xl p-3 flex items-center gap-2">
                <v-icon icon="mdi-license"/>
                MIT/Apache licence (tbd)
              </li>
              <li class="glass rounded-xl p-3 flex items-center gap-2">
                <v-icon icon="mdi-docker"/>
                Docker‑based microservices
              </li>
              <li class="glass rounded-xl p-3 flex items-center gap-2">
                <v-icon icon="mdi-puzzle"/>
                Plugin SDK for sims
              </li>
              <li class="glass rounded-xl p-3 flex items-center gap-2">
                <v-icon icon="mdi-console"/>
                REST API for extensions
              </li>
            </ul>
            <div class="mt-6 flex flex-col sm:flex-row gap-3">
              <NuxtLink to="#cta" class="btn btn-primary">
                Get involved
              </NuxtLink>
              <NuxtLink
                  to="https://github.com/OpenSquawk/OpenSquawk"
                  external
                  target="_blank"
                  rel="noopener"
                  class="btn btn-ghost"
              >
                GitHub repository
              </NuxtLink>
              <NuxtLink to="/news" class="btn btn-ghost">News</NuxtLink>
            </div>
          </div>
          <div class="card" data-aos="fade-left">
            <pre class="text-xs md:text-sm overflow-x-auto"><code>// Example: REST route for taxi paths
POST /api/route/taxi
{
  "icao": "EDDF",
  "from": { "type": "gate", "ref": "A20" },
  "to":   { "type": "runway", "ref": "25C" }
}
// → Response: list of segments, geometry, suggested readback</code></pre>
          </div>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section class="py-12 sm:py-16 md:py-24 bg-[#0b1020]">
      <div class="container-outer">
        <div class="max-w-2xl mb-10" data-aos="fade-up">
          <h2 class="text-3xl md:text-4xl font-semibold">
            Radio loop in four tightly controlled stages
          </h2>
          <p class="mt-3 text-white/80">
            Every transmission passes through deterministic checkpoints so phraseology stays believable and safe.
          </p>
        </div>
        <div class="grid md:grid-cols-4 gap-4 md:gap-6">
          <div class="card" data-aos="fade-up" data-aos-delay="0">
            <h3 class="font-semibold flex items-center gap-2">
              <v-icon icon="mdi-radio-handheld"/>
              1 · Capture
            </h3>
            <p class="mt-2 text-white/80">Push-to-talk audio plus simulator telemetry stream into the engine.</p></div>
          <div class="card" data-aos="fade-up" data-aos-delay="100">
            <h3 class="font-semibold flex items-center gap-2">
              <v-icon icon="mdi-waveform"/>
              2 · Understand
            </h3>
            <p class="mt-2 text-white/80">Whisper-class STT normalises radio noise; the LLM interprets intent.</p></div>
          <div class="card" data-aos="fade-up" data-aos-delay="200">
            <h3 class="font-semibold flex items-center gap-2">
              <v-icon icon="mdi-brain"/>
              3 · Decide
            </h3>
            <p class="mt-2 text-white/80">A curated state machine enforces valid clearances and cross-checks flight
              data.</p></div>
          <div class="card" data-aos="fade-up" data-aos-delay="300">
            <h3 class="font-semibold flex items-center gap-2">
              <v-icon icon="mdi-microphone"/>
              4 · Speak
            </h3>
            <p class="mt-2 text-white/80">Coqui/Piper TTS deliver regionalised voices with crisp numbers.</p></div>
        </div>
      </div>
    </section>

    <!-- CONTRIBUTING -->
    <section id="contributing" class="py-12 sm:py-16 md:py-24 bg-[#0a0f1c] border-y border-white/10">
      <div class="container-outer">
        <div class="grid gap-6 md:grid-cols-2 md:gap-8 items-start">
          <div data-aos="fade-right">
            <h2 class="text-3xl md:text-4xl font-semibold">
              Contribute
            </h2>
            <p class="mt-3 text-white/80">
              Issues with the label <code
                class="text-xs bg-white/10 px-1.5 py-0.5 rounded">help-wanted</code> highlight tasks where we need
              support. Everything happens transparently on GitHub.
            </p>
            <ul class="mt-5 space-y-3 text-white/80 text-sm">
              <li class="flex gap-3">
                <v-icon icon="mdi-nodejs" class="text-cyan-300 mt-[2px]"/>
                <span>Node/Nuxt devs for backend & frontend.</span></li>
              <li class="flex gap-3">
                <v-icon icon="mdi-headset" class="text-cyan-300 mt-[2px]"/>
                <span>ATC SMEs for phraseology, procedures and training feedback.</span></li>
              <li class="flex gap-3">
                <v-icon icon="mdi-test-tube" class="text-cyan-300 mt-[2px]"/>
                <span>Testers for alpha builds & simulator integration.</span></li>
              <li class="flex gap-3">
                <v-icon icon="mdi-cash-multiple" class="text-cyan-300 mt-[2px]"/>
                <span>Infra & cost benchmarking to keep hosting affordable.</span></li>
            </ul>
            <p class="mt-5 text-sm text-white/70">
              Email us at <a href="mailto:info@opensquawk.de"
                             class="text-cyan-300 underline">info@opensquawk.de</a> or leave a comment directly on the
              issue.
            </p>
            <div class="mt-6 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
              <NuxtLink to="#roadmap" class="btn btn-primary">
                Shape the roadmap
              </NuxtLink>
              <NuxtLink to="/news" class="btn btn-ghost">
                Latest updates
              </NuxtLink>
            </div>
          </div>
          <div class="card" data-aos="fade-left">
            <h3 class="font-semibold text-lg">Current focus areas</h3>
            <ul class="mt-3 space-y-2 text-white/70 text-sm list-disc list-inside">
              <li>Stabilise the alpha prototype & simplify setup
              </li>
              <li>Verify Decision Tree logic
              </li>
              <li>Review & prioritise roadmap ideas
              </li>
              <li>Model hosting costs</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section id="cta"
             class="py-12 sm:py-16 md:py-24 bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-transparent border-y border-white/10">
      <div class="container-outer">
        <div class="card grid gap-6 md:grid-cols-2 md:gap-8" data-aos="zoom-in">
          <div class="space-y-4">
            <div>
              <h3 class="text-2xl md:text-3xl font-semibold">
                Early access & waitlist
              </h3>
              <p class="mt-2 text-white/80">
                Sign up to secure your spot for the alpha build. Right now (including internal tests) there are
                <span class="font-semibold text-cyan-300">{{ waitlistCountDisplay }}</span>
                interested pilots waiting for the next invite drop.
              </p>
            </div>
            <div>
              <div v-if="waitlistLoading" class="text-sm text-white/60">
                Loading waitlist…
              </div>
              <template v-else>
                <div class="text-xs text-white/60">
                  Last signup:
                  <span class="font-medium text-white">{{ waitlistLastJoinedFormatted }}</span>
                  <span v-if="waitlistStats?.lastJoinedAt" class="text-white/40">
                    ({{ formatRelativeFromNow(waitlistStats?.lastJoinedAt) }})
                  </span>
                </div>
              </template>
            </div>
            <p class="text-xs text-white/60">
              We send invites in batches, prioritise active waitlist spots and deliver invite codes via email.
            </p>
          </div>
          <form class="space-y-4" @submit.prevent="submitWaitlist">
            <div class="grid gap-3">
              <input
                  v-model.trim="waitlistForm.name"
                  aria-label="Name"
                  type="text"
                  placeholder="First and last name (optional)"
                  class="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 placeholder-white/40 outline-none focus:border-cyan-400"
              />
              <input
                  v-model.trim="waitlistForm.email"
                  aria-label="Email"
                  type="email"
                  required
                  placeholder="your@email"
                  class="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 placeholder-white/40 outline-none focus:border-cyan-400"
              />
              <textarea
                  v-model.trim="waitlistForm.notes"
                  rows="3"
                  placeholder="What do you want to learn with OpenSquawk? (optional)"
                  class="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 placeholder-white/40 outline-none focus:border-cyan-400"
              />
            </div>
            <div class="space-y-2 text-xs text-white/60">
              <label class="flex items-start gap-3">
                <input type="checkbox" v-model="waitlistForm.subscribeUpdates" class="mt-1"/>
                <span>
                  Yes, keep me posted when new features, drops or classroom content go live.
                </span>
              </label>
              <label class="flex items-start gap-3">
                <input type="checkbox" v-model="waitlistForm.consentTerms" class="mt-1" required/>
                <span>
                  I accept the <NuxtLink to="/agb" class="text-cyan-300 underline">terms of service</NuxtLink> of OpenSquawk.
                </span>
              </label>
              <label class="flex items-start gap-3">
                <input type="checkbox" v-model="waitlistForm.consentPrivacy" class="mt-1" required/>
                <span>
                  I have read the <NuxtLink to="/datenschutz"
                                            class="text-cyan-300 underline">privacy policy</NuxtLink> and consent to storing my details for contact purposes.
                </span>
              </label>
            </div>
            <button
                type="submit"
                class="btn btn-primary w-full"
                :disabled="!waitlistFormValid || waitlistSubmitting"
            >
              <span v-if="waitlistSubmitting" class="flex items-center gap-2">
                <v-progress-circular indeterminate size="16" width="2" color="white"/>
                Sending data…
              </span>
              <span v-else>Join the waitlist</span>
            </button>
            <p v-if="waitlistSuccess" class="text-sm text-green-300">
              Thank you! You are on the waitlist and we will reach out as soon as slots open up.
              <span v-if="waitlistLastOptInUpdates" class="mt-1 block text-xs text-green-200/80">
                You will also receive product updates when new features go live.
              </span>
            </p>
            <p v-else-if="waitlistError" class="text-sm text-red-300">{{ waitlistError }}</p>
          </form>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="py-12 sm:py-16 md:py-24 bg-[#0a0f1c]">
      <div class="container-outer">
        <div class="max-w-2xl mb-10" data-aos="fade-up">
          <h2 class="text-3xl md:text-4xl font-semibold">FAQ</h2>
          <p class="mt-3 text-white/80">
            Quick answers.
          </p>
        </div>
        <div class="grid gap-4 md:grid-cols-2 md:gap-6">
          <div class="card" data-aos="fade-up" data-aos-delay="0">
            <h3 class="font-semibold">
              Is this for real-world aviation?
            </h3>
            <p class="mt-2 text-white/80">
              No, OpenSquawk is for flight simulators and training. It is not intended for real-world radio comms.
            </p>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="100">
            <h3 class="font-semibold">
              Which simulators are supported?
            </h3>
            <p class="mt-2 text-white/80">
              MSFS first (alpha focus), X-Plane next. Additional simulators will follow community demand.
            </p>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="200">
            <h3 class="font-semibold">
              Can I self-host?
            </h3>
            <p class="mt-2 text-white/80">
              Alpha: Docker Compose + Node services are available. Docs and installers are in progress. Hosting options
              will follow.
            </p>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="300">
            <h3 class="font-semibold">
              How do I access the Classroom?
            </h3>
            <p class="mt-2 text-white/80">
              The Classroom is invitation-only during alpha. Join the waitlist and mention “Classroom” or email
              <a href="mailto:info@opensquawk.de" class="text-cyan-300 underline">info@opensquawk.de</a> to request an
              invite.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="bg-[#070b16] border-t border-white/10 text-white" data-aos="fade-up">
      <div class="container-outer py-12 sm:py-16">
        <div class="flex flex-col gap-10">
          <div class="footer-brand">
            <div class="inline-flex items-center justify-center gap-2 sm:justify-start lg:flex-none">
              <v-icon icon="mdi-radar" size="26" class="text-cyan-400"/>
              <span class="text-lg font-semibold">OpenSquawk</span>
            </div>
            <p class="mx-auto max-w-2xl text-sm text-white/70 sm:mx-0 lg:flex-1 lg:max-w-3xl">
              OpenSquawk builds Live ATC and Classroom training as open-source projects: speech-to-text, LLM-guided
              state machine and natural TTS ready for sim pilots.
            </p>
            <div class="footer-brand-actions lg:flex-none">
              <NuxtLink
                  :to="GITHUB_URL"
                  external
                  target="_blank"
                  rel="noopener"
                  class="footer-action"
              >
                <v-icon icon="mdi-github" size="18" class="text-white/70"/>
                <span>GitHub</span>
              </NuxtLink>
              <NuxtLink to="/login" class="footer-action">
                <v-icon icon="mdi-login" size="18" class="text-white/70"/>
                <span>Login</span>
              </NuxtLink>
            </div>
          </div>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h4 class="mb-3 font-semibold">Product</h4>
              <ul class="space-y-2 text-sm text-white/70">
                <li>
                  <NuxtLink to="#features" class="hover:text-cyan-300">
                    Live ATC
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="#classroom" class="hover:text-cyan-300">
                    Classroom
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="#pricing" class="hover:text-cyan-300">
                    Product lineup
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="#faq" class="hover:text-cyan-300">FAQ</NuxtLink>
                </li>
              </ul>
            </div>
            <div>
              <h4 class="mb-3 font-semibold">Resources</h4>
              <ul class="space-y-2 text-sm text-white/70">
                <li>
                  <NuxtLink to="#opensource" class="hover:text-cyan-300">
                    Open-source
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="#news" class="hover:text-cyan-300">News</NuxtLink>
                </li>
                <li>
                  <NuxtLink to="#contributing" class="hover:text-cyan-300">
                    Get involved
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/feedback" class="hover:text-cyan-300">
                    Feedback &amp; ideas
                  </NuxtLink>
                </li>
                <li><a href="mailto:info@opensquawk.de" class="hover:text-cyan-300">info@opensquawk.de</a></li>
              </ul>
            </div>
            <div>
              <h4 class="mb-3 font-semibold">Legal</h4>
              <ul class="space-y-2 text-sm text-white/70">
                <li>
                  <NuxtLink to="/impressum" class="hover:text-cyan-300">
                    Imprint
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/datenschutz" class="hover:text-cyan-300">
                    Privacy
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/agb" class="hover:text-cyan-300">
                    Terms
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/api-docs" class="hover:text-cyan-300">
                    API documentation
                  </NuxtLink>
                </li>
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
import {ref, reactive, computed, onMounted, watch, onBeforeUnmount} from 'vue'
import {useHead, useRoute} from '#imports'
import {useApi} from '~/composables/useApi'
import {getAllNews} from '~~/shared/utils/news'
import type {NewsPost} from '~~/shared/utils/news'

const api = useApi()

const GITHUB_URL = 'https://github.com/FaktorxMensch/OpenSquawk'

interface NavLink {
  label: string
  to: string
}

interface ExtendedNavLink extends NavLink {
  external?: boolean
  icon?: string
}

const navLinks: NavLink[] = [
  {label: 'Live ATC', to: '#features'},
  {label: 'Classroom', to: '#classroom'},
  {label: 'Roadmap', to: '#roadmap'},
  {label: 'Lineup', to: '#pricing'},
  {label: 'Get involved', to: '#contributing'},
  {label: 'FAQ', to: '#faq'},
]

const mobileNavLinks = computed<ExtendedNavLink[]>(() => [
  ...navLinks,
  {label: 'GitHub', to: GITHUB_URL, external: true, icon: 'mdi-github'},
])

const isMobileNavOpen = ref(false)
const toggleMobileNav = () => {
  isMobileNavOpen.value = !isMobileNavOpen.value
}
const closeMobileNav = () => {
  isMobileNavOpen.value = false
}

const route = useRoute()
watch(
    () => route.fullPath,
    () => {
      closeMobileNav()
    },
)

if (import.meta.client) {
  watch(isMobileNavOpen, (open) => {
    document.body.classList.toggle('overflow-hidden', open)
  })

  onBeforeUnmount(() => {
    document.body.classList.remove('overflow-hidden')
  })
}

const numberFormatter = computed(() => new Intl.NumberFormat('en-US'))
const formatNumber = (value: number | null | undefined) => numberFormatter.value.format(Math.max(0, Math.round(value ?? 0)))
const ROADMAP_SCALE = [1, 2, 3, 4, 5] as const

const dateLocale = 'en-US'
const shortDateOptions: Intl.DateTimeFormatOptions = {day: '2-digit', month: 'short', year: 'numeric'}

interface WaitlistStats {
  count: number
  displayCount: number
  syntheticBoost: number
  recent7Days: number
  recent30Days: number
  lastJoinedAt: string | null
  generatedAt: string
}

interface RoadmapItemWithStats {
  key: string
  title: string
  description: string
  category: string
  icon: string
  votes: number
  averageImportance: number | null
  scorePercent: number
  lastVoteAt: string | null
}

interface RoadmapResponse {
  items: RoadmapItemWithStats[]
  totalVotes: number
  recentVotes7Days: number
}

const year = new Date().getFullYear()

const waitlistForm = reactive({
  name: '',
  email: '',
  notes: '',
  consentPrivacy: false,
  consentTerms: false,
  subscribeUpdates: false,
})

const waitlistSubmitting = ref(false)
const waitlistSuccess = ref(false)
const waitlistError = ref('')
const waitlistLastOptInUpdates = ref(false)
const waitlistStats = ref<WaitlistStats | null>(null)
const waitlistLoading = ref(false)

const updatesForm = reactive({
  email: '',
  consentPrivacy: false,
  consentMarketing: false,
})
const updatesSubmitting = ref(false)
const updatesSuccess = ref(false)
const updatesError = ref('')

const roadmapSuggestionForm = reactive({
  title: '',
  details: '',
  email: '',
  allowContact: false,
  consentPrivacy: false,
})
const roadmapSuggestionSubmitting = ref(false)
const roadmapSuggestionSuccess = ref(false)
const roadmapSuggestionError = ref('')

const allNewsEntries = computed<NewsPost[]>(() => getAllNews())
const latestNews = computed<NewsPost[]>(() => allNewsEntries.value.slice(0, 3))

const waitlistCountDisplay = computed(() => formatNumber(waitlistStats.value?.displayCount ?? 0))
const waitlistLastJoinedFormatted = computed(() => {
  const iso = waitlistStats.value?.lastJoinedAt
  if (!iso) return '–'
  return formatWaitlistDate(iso)
})
const waitlistFormValid = computed(() =>
    Boolean(waitlistForm.email && waitlistForm.consentPrivacy && waitlistForm.consentTerms)
)
const updatesFormValid = computed(() =>
    Boolean(updatesForm.email && updatesForm.consentPrivacy && updatesForm.consentMarketing)
)
const roadmapSuggestionFormValid = computed(() => {
  const title = roadmapSuggestionForm.title.trim()
  const details = roadmapSuggestionForm.details.trim()
  const email = roadmapSuggestionForm.email.trim()
  const wantsContact = roadmapSuggestionForm.allowContact

  return (
      title.length >= 4 &&
      details.length >= 20 &&
      roadmapSuggestionForm.consentPrivacy &&
      (!wantsContact || email.length > 0)
  )
})

watch(
    () => roadmapSuggestionForm.email,
    (value) => {
      if (!value) {
        roadmapSuggestionForm.allowContact = false
      }
    },
)

async function loadWaitlistStats() {
  try {
    waitlistLoading.value = true
    const data = (await api.get('/api/service/waitlist', {auth: false})) as WaitlistStats
    waitlistStats.value = data
  } catch (err) {
    console.warn('Waitlist stats unavailable', err)
  } finally {
    waitlistLoading.value = false
  }
}

async function submitWaitlist() {
  if (!waitlistFormValid.value || waitlistSubmitting.value) return

  waitlistSubmitting.value = true
  waitlistError.value = ''
  waitlistSuccess.value = false
  waitlistLastOptInUpdates.value = false

  try {
    const wantsProductUpdates = waitlistForm.subscribeUpdates
    await api.post(
        '/api/service/waitlist',
        {
          name: waitlistForm.name,
          email: waitlistForm.email,
          notes: waitlistForm.notes,
          consentPrivacy: waitlistForm.consentPrivacy,
          consentTerms: waitlistForm.consentTerms,
          wantsProductUpdates,
        },
        {auth: false},
    )
    waitlistLastOptInUpdates.value = wantsProductUpdates
    waitlistSuccess.value = true
    await loadWaitlistStats()
    waitlistForm.name = ''
    waitlistForm.email = ''
    waitlistForm.notes = ''
    waitlistForm.consentPrivacy = false
    waitlistForm.consentTerms = false
    waitlistForm.subscribeUpdates = false
  } catch (err: any) {
    const fallback = 'Registration failed'
    const message = err?.data?.statusMessage || err?.message || fallback
    waitlistError.value = message
  } finally {
    waitlistSubmitting.value = false
  }
}

async function submitUpdates() {
  if (!updatesFormValid.value || updatesSubmitting.value) return

  updatesSubmitting.value = true
  updatesError.value = ''
  updatesSuccess.value = false

  try {
    await api.post(
        '/api/service/updates',
        {
          email: updatesForm.email,
          consentPrivacy: updatesForm.consentPrivacy,
          consentMarketing: updatesForm.consentMarketing,
          source: 'landing-hero',
        },
        {auth: false},
    )
    updatesSuccess.value = true
    updatesForm.email = ''
    updatesForm.consentPrivacy = false
    updatesForm.consentMarketing = false
  } catch (err: any) {
    const fallback = 'Could not save sign-up'
    const message = err?.data?.statusMessage || err?.message || fallback
    updatesError.value = message
  } finally {
    updatesSubmitting.value = false
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

const formatAverage = (value: number) => value.toFixed(1)

const formatNewsDate = (iso: string) => {
  if (!iso) return 'tbd'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'tbd'
  return date.toLocaleDateString(dateLocale, shortDateOptions)
}

const roadmapExpanded = ref(false)
const roadmapItems = ref<RoadmapItemWithStats[]>([])
const roadmapLoading = ref(false)
const roadmapTotals = ref(0)
const roadmapRecent7Days = ref(0)
const roadmapSelections = reactive<Record<string, number>>({})
const roadmapTouched = reactive<Record<string, boolean>>({})
const roadmapSubmitting = ref(false)
const roadmapSuccess = ref(false)
const roadmapError = ref('')

const hasRoadmapVote = computed(() => Object.values(roadmapTouched).some(Boolean))
const roadmapStatsLabel = computed(() => {
  const total = formatNumber(roadmapTotals.value)
  const recent = formatNumber(roadmapRecent7Days.value)
  return `${total} votes submitted`
})

const roadmapImportanceLabel = (value?: number) => {
  const labels: Record<number, string> = {
    1: 'Nice to have, not urgent',
    2: 'Can wait',
    3: 'Important for me',
    4: 'Very important',
    5: 'Top priority',
  }
  return labels[value ?? 0] || 'Not rated yet'
}
const roadmapImportanceShortLabel = (value: number) => {
  const labels: Record<number, string> = {
    1: 'No',
    2: 'Meh',
    3: 'Later',
    4: 'Now',
    5: 'Top',
  }
  return labels[value] || ''
}

const selectRoadmapImportance = (key: string, value: number) => {
  if (!ROADMAP_SCALE.includes(value as (typeof ROADMAP_SCALE)[number])) {
    return
  }
  roadmapSelections[key] = value
  roadmapTouched[key] = true
  roadmapSuccess.value = false
}

const toggleRoadmap = () => {
  roadmapExpanded.value = !roadmapExpanded.value
}

async function loadRoadmap() {
  try {
    roadmapLoading.value = true
    const data = (await api.get('/api/service/roadmap', {auth: false})) as RoadmapResponse
    roadmapItems.value = data.items ?? []
    roadmapTotals.value = data.totalVotes ?? 0
    roadmapRecent7Days.value = data.recentVotes7Days ?? 0

    const activeKeys = new Set<string>()
    for (const item of roadmapItems.value) {
      activeKeys.add(item.key)
      if (typeof roadmapSelections[item.key] !== 'number') {
        roadmapSelections[item.key] = 3
      }
      if (roadmapTouched[item.key] === undefined) {
        roadmapTouched[item.key] = false
      }
    }
    for (const key of Object.keys(roadmapSelections)) {
      if (!activeKeys.has(key)) {
        delete roadmapSelections[key]
        delete roadmapTouched[key]
      }
    }
  } catch (err) {
    console.warn('Roadmap stats unavailable', err)
  } finally {
    roadmapLoading.value = false
  }
}

async function submitRoadmapVotes() {
  if (!hasRoadmapVote.value || roadmapSubmitting.value) return

  const votes = Object.entries(roadmapSelections)
      .filter(([key]) => roadmapTouched[key])
      .map(([key, importance]) => ({key, importance}))

  if (!votes.length) {
    return
  }

  roadmapSubmitting.value = true
  roadmapError.value = ''
  roadmapSuccess.value = false

  try {
    await api.post('/api/service/roadmap', {votes}, {auth: false})
    roadmapSuccess.value = true
    Object.keys(roadmapTouched).forEach((key) => {
      roadmapTouched[key] = false
    })
    await loadRoadmap()
  } catch (err: any) {
    const fallback = 'Could not submit votes'
    const message = err?.data?.statusMessage || err?.message || fallback
    roadmapError.value = message
  } finally {
    roadmapSubmitting.value = false
  }
}

async function submitRoadmapSuggestion() {
  if (!roadmapSuggestionFormValid.value || roadmapSuggestionSubmitting.value) return

  roadmapSuggestionSubmitting.value = true
  roadmapSuggestionError.value = ''
  roadmapSuggestionSuccess.value = false

  try {
    await api.post(
        '/api/service/roadmap-suggestions',
        {
          title: roadmapSuggestionForm.title,
          details: roadmapSuggestionForm.details,
          email: roadmapSuggestionForm.email || undefined,
          allowContact: roadmapSuggestionForm.allowContact,
          consentPrivacy: roadmapSuggestionForm.consentPrivacy,
        },
        {auth: false},
    )
    roadmapSuggestionSuccess.value = true
    roadmapSuggestionForm.title = ''
    roadmapSuggestionForm.details = ''
    roadmapSuggestionForm.email = ''
    roadmapSuggestionForm.allowContact = false
    roadmapSuggestionForm.consentPrivacy = false
  } catch (err: any) {
    const fallback = 'Could not save suggestion'
    const message = err?.data?.statusMessage || err?.message || fallback
    roadmapSuggestionError.value = message
  } finally {
    roadmapSuggestionSubmitting.value = false
  }
}

useHead(() => ({
  htmlAttrs: {lang: 'en'},
  title: 'OpenSquawk – Open-source, low-cost AI ATC for flight simulation',
  meta: [
    {
      name: 'description',
      content: 'We are building OpenSquawk: open-source, low-cost AI ATC for flight sim pilots. Community roadmap, self-host today, hosted options in planning.'
    },
    {name: 'theme-color', content: '#0ea5e9'},
    {property: 'og:title', content: 'OpenSquawk – Open-source, low-cost AI ATC'},
    {
      property: 'og:description',
      content: 'Alpha prototype for sim pilots. Community-driven features, self-host today, hosted options tomorrow.'
    },
    {property: 'og:type', content: 'website'},
    {property: 'og:image', content: 'https://opensquawk.example.com/cover.png'},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: 'OpenSquawk – Open-source, low-cost AI ATC'},
    {name: 'twitter:description', content: 'Alpha prototype with community roadmap. Self-host today, hosted later.'},
    {name: 'twitter:image', content: 'https://opensquawk.example.com/cover.png'},
  ],
}))

onMounted(async () => {
  await Promise.all([loadWaitlistStats(), loadRoadmap()])
  // @ts-ignore – optional fallback
  if (!('AOS' in window)) {
    const [{default: AOS}] = await Promise.all([
      import('aos'),
      import('aos/dist/aos.css')
    ])
    AOS.init({once: true, duration: 600, easing: 'ease-out'})
  }
})
</script>


<style scoped>
.container-outer {
  @apply mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-8;
}

.gradient-hero {
  background: radial-gradient(1200px 600px at 10% -10%, rgba(6, 182, 212, .35), transparent),
  radial-gradient(900px 480px at 100% 10%, rgba(59, 130, 246, .25), transparent),
  linear-gradient(180deg, #0b1020 0%, #0b1020 60%, #0a0f1c 100%);
}

.gradient-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: url('/img/learn/modules/img6.jpeg') center/cover no-repeat;
  opacity: 0.45;
  pointer-events: none;
  z-index: 0;
}

.hero-overlay {
  background: linear-gradient(90deg, rgba(11, 16, 32, 0.9) 0%, rgba(11, 16, 32, 0.68) 45%, rgba(11, 16, 32, 0.15) 100%);
  z-index: 1;
}

.glass {
  background: rgba(255, 255, 255, .06);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, .08);
}

.btn {
  @apply inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition px-4 py-2.5 sm:px-5 sm:py-3;
}

.btn-primary {
  @apply bg-cyan-500 text-white hover:bg-cyan-400 shadow-[0_0_40px_rgba(34,211,238,.25)];
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
  @apply glass rounded-2xl p-4 sm:p-5 md:p-6;
}

.pricing-card {
  overflow: visible;
}

.chip {
  @apply inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 text-white px-3 py-1 text-xs;
}

.roadmap-scale {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.5rem;
}

.roadmap-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.55rem 0.65rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.875rem;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.roadmap-pill:hover {
  background: rgba(34, 211, 238, 0.18);
  border-color: rgba(34, 211, 238, 0.4);
  color: #fff;
}

.roadmap-pill.is-active {
  background: rgba(34, 211, 238, 0.28);
  border-color: rgba(34, 211, 238, 0.65);
  color: #fff;
  box-shadow: 0 0 24px rgba(34, 211, 238, 0.25);
}

.roadmap-pill .label {
  font-size: 0.6rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.roadmap-pill.is-active .label {
  color: rgba(224, 242, 254, 0.85);
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
  .hamburger-bar {
    transition: none;
  }
}

.footer-brand {
  @apply flex flex-col items-center gap-4 text-center sm:items-start sm:text-left lg:flex-row lg:items-center lg:justify-between lg:gap-8;
}

.footer-brand-actions {
  @apply flex flex-wrap items-center justify-center gap-3 sm:justify-start lg:justify-end lg:ml-auto;
}

.footer-action {
  @apply inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-cyan-400/60 hover:bg-white/10;
}

@media (max-width: 480px) {
  .roadmap-scale {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .roadmap-pill {
    padding: 0.5rem 0.6rem;
  }
}

.chip.absolute {
  background: #434752;
}

img.card {
  padding: 0
}
</style>
