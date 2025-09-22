<template>
  <div class="bg-[#0b1020] text-white min-h-screen pb-24">
    <header class="border-b border-white/10 bg-[#0b1020]/80 backdrop-blur">
      <div class="mx-auto flex w-full max-w-screen-xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 md:px-8">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10">
            <v-icon icon="mdi-radar" size="26" class="text-cyan-300" />
          </div>
          <div>
            <p class="text-lg font-semibold tracking-tight">OpenSquawk Learn</p>
            <p class="text-sm text-white/60">Interactive briefing</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl border border-cyan-400/60 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
            @click="startTour"
          >
            <v-icon icon="mdi-gesture-tap-button" size="18" class="text-cyan-300" />
            Start interactive tour
          </button>
          <NuxtLink
            to="/learn"
            class="inline-flex items-center gap-2 rounded-xl bg-cyan-400/90 px-4 py-2 text-sm font-semibold text-[#0b1020] shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
          >
            <v-icon icon="mdi-play-circle" size="18" class="text-[#0b1020]" />
            Enter training hub
          </NuxtLink>
        </div>
      </div>
    </header>

    <main>
      <section class="relative overflow-hidden border-b border-white/5">
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-transparent to-indigo-500/25" aria-hidden="true"></div>
        <div class="relative z-10 mx-auto w-full max-w-screen-xl px-4 py-16 sm:px-6 md:px-8 md:py-24">
          <div class="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
            <div class="space-y-6">
              <span class="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Guide</span>
              <h1 class="text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
                Train with confidence before you call live AI ATC
              </h1>
              <p class="max-w-2xl text-base text-white/80 sm:text-lg">
                This walkthrough shows how Learn works today. Live AI ATC for full simulator missions is still in closed testing, so treat this as your training ground before calling the real network.
              </p>
              <div class="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5 text-amber-100 shadow-lg shadow-amber-500/10" role="status">
                <div class="flex items-start gap-3">
                  <div class="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200/50 bg-amber-300/20">
                    <v-icon icon="mdi-alert-decagram-outline" size="22" class="text-amber-200" />
                  </div>
                  <div class="space-y-1">
                    <p class="text-sm font-semibold uppercase tracking-wide text-amber-100/90">Current status</p>
                    <p class="text-sm text-amber-50/90">
                      Learn is the training environment. The AI that will staff live frequencies comes later—today you can already rehearse with the same phraseology, mission rhythm and scoring model.
                    </p>
                  </div>
                </div>
              </div>
              <ul class="grid gap-3 text-sm text-white/70 sm:grid-cols-2 sm:text-base">
                <li class="flex items-start gap-3">
                  <v-icon icon="mdi-target" size="20" class="mt-1 text-cyan-300" />
                  <span>Drill ICAO alphabet, clearances and taxi flows with instant feedback.</span>
                </li>
                <li class="flex items-start gap-3">
                  <v-icon icon="mdi-sync" size="20" class="mt-1 text-cyan-300" />
                  <span>Progress, XP and objectives sync to your OpenSquawk account when you sign in.</span>
                </li>
                <li class="flex items-start gap-3">
                  <v-icon icon="mdi-headset" size="20" class="mt-1 text-cyan-300" />
                  <span>Simulate radio readability, enable audio challenge mode and tune ATC speed.</span>
                </li>
                <li class="flex items-start gap-3">
                  <v-icon icon="mdi-airplane-clock" size="20" class="mt-1 text-cyan-300" />
                  <span>Import a SimBrief plan or craft your own mission to rehearse your exact trip.</span>
                </li>
              </ul>
            </div>
            <div class="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-500/10">
              <div class="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                <img
                  src="/img/learn/missions/full-flight/briefing-hero.png"
                  alt="Mission briefing preview"
                  class="h-48 w-full object-cover sm:h-56"
                  loading="lazy"
                />
              </div>
              <div class="rounded-2xl border border-white/10 bg-black/40 p-6">
                <h2 class="text-lg font-semibold">Tour itinerary</h2>
                <p class="mt-3 text-sm text-white/70">
                  Click through the five stops to understand how Learn guides you from briefing to final score.
                </p>
                <ol class="mt-5 space-y-3 text-sm text-white/70">
                  <li
                    v-for="(stage, index) in stageOrder"
                    :key="stage.id"
                    class="flex items-start gap-3"
                  >
                    <div class="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/50 bg-cyan-500/10 text-sm font-semibold text-cyan-200">
                      {{ index + 1 }}
                    </div>
                    <div>
                      <p class="font-semibold text-white">{{ stage.title }}</p>
                      <p class="text-white/60">{{ stage.tagline }}</p>
                    </div>
                  </li>
                </ol>
                <button
                  type="button"
                  class="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400/90 px-4 py-2 text-sm font-semibold text-[#0b1020] shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  @click="startTour"
                >
                  <v-icon icon="mdi-gesture-tap-button" size="18" class="text-[#0b1020]" />
                  Begin the tour
                </button>
              </div>
              <div class="rounded-2xl border border-white/10 bg-black/30 p-6">
                <h3 class="text-base font-semibold">Before you start</h3>
                <ul class="mt-3 space-y-3 text-sm text-white/70">
                  <li class="flex items-start gap-3">
                    <v-icon icon="mdi-account-check-outline" size="18" class="mt-0.5 text-cyan-300" />
                    <span>Sign in so your XP and lesson scores sync when you leave the page.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <v-icon icon="mdi-keyboard-settings-outline" size="18" class="mt-0.5 text-cyan-300" />
                    <span>Have speakers or a headset ready—the tour includes live ATC audio examples.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <v-icon icon="mdi-progress-clock" size="18" class="mt-0.5 text-cyan-300" />
                    <span>Expect to spend about 10 minutes exploring the walkthrough before jumping into Learn.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="learn-tour" class="border-b border-white/5 bg-[#0d1426]/70 py-16 sm:py-20">
        <div class="mx-auto w-full max-w-screen-xl space-y-12 px-4 sm:px-6 md:px-8">
          <div class="space-y-2">
            <p class="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/70">Interactive tour</p>
            <h2 class="text-2xl font-semibold sm:text-3xl">Click through each station and try the tools</h2>
            <p class="max-w-3xl text-base text-white/70">
              The controls below mirror what you will see inside Learn. Explore them in sequence or jump straight to the part you need.
            </p>
          </div>

          <div class="grid gap-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <aside class="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/20">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/60">Progress</p>
                <div class="mt-3 flex items-center gap-3">
                  <div class="flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      class="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 transition-all duration-300"
                      :style="{ width: `${stageProgress}%` }"
                    ></div>
                  </div>
                  <span class="text-sm font-semibold text-white/70">{{ stageProgress }}%</span>
                </div>
                <p class="mt-2 text-xs text-white/50">
                  {{ activeStageIndex + 1 }} / {{ stageOrder.length }} &nbsp;•&nbsp; {{ activeStage.title }}
                </p>
              </div>

              <nav class="space-y-2">
                <button
                  v-for="(stage, index) in stageOrder"
                  :key="stage.id"
                  type="button"
                  class="group flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1426]"
                  :class="[
                    activeStageId === stage.id
                      ? 'border-cyan-400/60 bg-cyan-400/10 text-white'
                      : 'border-white/10 bg-white/0 text-white/70 hover:border-cyan-300/40 hover:text-white'
                  ]"
                  @click="setStage(stage.id)"
                >
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-xl border text-sm font-semibold transition"
                    :class="activeStageId === stage.id ? 'border-cyan-300/70 bg-cyan-500/20 text-cyan-100' : 'border-white/15 bg-white/5 text-white/60 group-hover:border-cyan-200/40 group-hover:text-cyan-100'"
                  >
                    {{ index + 1 }}
                  </div>
                  <div>
                    <p class="text-sm font-semibold">{{ stage.title }}</p>
                    <p class="text-xs text-white/50 group-hover:text-white/70">{{ stage.tagline }}</p>
                  </div>
                </button>
              </nav>

              <div class="rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/60">
                Tip: finish the stage with the <span class="font-semibold text-cyan-200">Next stop</span> button below to keep momentum—exactly how Learn nudges you between missions.
              </div>
            </aside>

            <div class="space-y-6">
              <Transition name="fade-slide" mode="out-in">
                <div :key="activeStageId" class="space-y-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/30">
                  <template v-if="activeStageId === 'overview'">
                    <div class="space-y-2">
                      <p class="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">Stop 1</p>
                      <h3 class="text-xl font-semibold">Get oriented in the mission hub</h3>
                      <p class="text-sm text-white/70">
                        Learn opens with mission tiles that unlock as you progress. Pick a module to preview what skills you will cover and how the system tracks completion.
                      </p>
                    </div>

                    <div class="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                      <img
                        src="/img/learn/modules/img7.jpeg"
                        alt="Module tiles inside the Learn hub"
                        class="h-56 w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div class="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                      <div class="space-y-4 rounded-3xl border border-white/10 bg-[#0f182d]/80 p-5">
                        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Modules</p>
                        <div class="flex flex-wrap gap-2">
                          <button
                            v-for="(module, index) in moduleSummaries"
                            :key="module.title"
                            type="button"
                            class="rounded-2xl border px-4 py-2 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f182d]"
                            :class="index === activeModuleIndex ? 'border-cyan-400/60 bg-cyan-400/15 text-white' : 'border-white/10 bg-white/0 text-white/60 hover:border-cyan-300/40 hover:text-white'"
                            @click="selectModule(index)"
                          >
                            {{ module.title }}
                          </button>
                        </div>
                        <div class="rounded-2xl border border-white/10 bg-black/40 p-5">
                          <h4 class="text-base font-semibold text-white">{{ activeModule.title }}</h4>
                          <p class="mt-2 text-sm text-white/70">{{ activeModule.description }}</p>
                          <ul class="mt-4 space-y-2 text-sm text-white/60">
                            <li
                              v-for="skill in activeModule.skills"
                              :key="skill"
                              class="flex items-start gap-2"
                            >
                              <v-icon icon="mdi-check" size="16" class="mt-0.5 text-cyan-300" />
                              <span>{{ skill }}</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div class="space-y-4 rounded-3xl border border-white/10 bg-[#111a33]/80 p-5">
                        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Mission cards</p>
                        <div class="flex flex-wrap gap-2">
                          <button
                            v-for="(card, index) in overviewCards"
                            :key="card.title"
                            type="button"
                            class="rounded-xl border px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.25em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111a33]"
                            :class="index === activeOverviewCardIndex ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-white/0 text-white/50 hover:border-cyan-300/40 hover:text-white/80'"
                            @click="selectOverviewCard(index)"
                          >
                            {{ card.title }}
                          </button>
                        </div>
                        <div class="rounded-2xl border border-white/10 bg-black/40 p-5">
                          <div class="flex items-center gap-3">
                            <div class="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10">
                              <v-icon :icon="activeOverviewCard.icon" size="22" class="text-cyan-300" />
                            </div>
                            <div>
                              <h4 class="text-base font-semibold text-white">{{ activeOverviewCard.title }}</h4>
                              <p class="text-xs uppercase tracking-[0.28em] text-white/40">What to watch</p>
                            </div>
                          </div>
                          <p class="mt-3 text-sm text-white/70">{{ activeOverviewCard.description }}</p>
                          <ul class="mt-4 space-y-2 text-sm text-white/60">
                            <li
                              v-for="point in activeOverviewCard.points"
                              :key="point"
                              class="flex items-start gap-2"
                            >
                              <v-icon icon="mdi-arrow-right" size="16" class="mt-1 text-cyan-300" />
                              <span>{{ point }}</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="activeStageId === 'flow'">
                    <div class="space-y-2">
                      <p class="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">Stop 2</p>
                      <h3 class="text-xl font-semibold">Walk the mission flow</h3>
                      <p class="text-sm text-white/70">
                        Every mission follows the same pattern: hub, planning, briefing, execution and celebration. Step through the sequence to see what you will do in Learn.
                      </p>
                    </div>

                    <div class="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                      <img
                        src="/img/learn/missions/full-flight/briefing-route.png"
                        alt="Mission planning cards"
                        class="h-56 w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div class="space-y-6">
                      <div class="flex flex-wrap gap-2">
                        <button
                          v-for="(step, index) in stepFlow"
                          :key="step.title"
                          type="button"
                          class="rounded-2xl border px-4 py-2 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1426]"
                          :class="index === activeFlowIndex ? 'border-cyan-400/60 bg-cyan-400/15 text-white' : 'border-white/10 bg-white/0 text-white/60 hover:border-cyan-300/40 hover:text-white'"
                          @click="selectFlow(index)"
                        >
                          {{ step.order }} · {{ step.title }}
                        </button>
                      </div>

                      <div class="rounded-3xl border border-white/10 bg-[#0f182d]/80 p-6">
                        <div class="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-white/40">
                          <span>Mission sequence</span>
                          <span>Step {{ activeFlowStep.order }}</span>
                        </div>
                        <h4 class="mt-3 text-lg font-semibold text-white">{{ activeFlowStep.title }}</h4>
                        <p class="mt-2 text-sm text-white/70">{{ activeFlowStep.description }}</p>
                        <ul v-if="activeFlowStep.tips?.length" class="mt-4 space-y-2 text-sm text-white/60">
                          <li
                            v-for="tip in activeFlowStep.tips"
                            :key="tip"
                            class="flex items-start gap-2"
                          >
                            <v-icon icon="mdi-lightning-bolt" size="16" class="mt-0.5 text-cyan-300" />
                            <span>{{ tip }}</span>
                          </li>
                        </ul>
                        <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
                          <button
                            type="button"
                            class="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-cyan-300/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f182d]"
                            :disabled="activeFlowIndex === 0"
                            :class="{ 'cursor-not-allowed opacity-40 hover:border-white/20 hover:text-white/70': activeFlowIndex === 0 }"
                            @click="previousFlow"
                          >
                            <v-icon icon="mdi-arrow-left" size="18" class="text-cyan-300" />
                            Previous step
                          </button>
                          <button
                            type="button"
                            class="inline-flex items-center gap-2 rounded-xl bg-cyan-400/90 px-4 py-2 text-sm font-semibold text-[#0b1020] shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f182d]"
                            @click="nextFlow"
                          >
                            Next step
                            <v-icon icon="mdi-arrow-right" size="18" class="text-[#0b1020]" />
                          </button>
                        </div>
                      </div>

                      <div class="rounded-3xl border border-white/10 bg-black/40 p-6">
                        <h4 class="text-base font-semibold text-white">Progress, XP and objectives</h4>
                        <ul class="mt-3 space-y-3 text-sm text-white/70">
                          <li class="flex items-start gap-3">
                            <v-icon icon="mdi-trophy" size="18" class="mt-0.5 text-cyan-300" />
                            <span>The “Your progress” card shows level, XP percentage and the next badge you are chasing.</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <v-icon icon="mdi-chart-areaspline" size="18" class="mt-0.5 text-cyan-300" />
                            <span>Objectives focus on weak spots—finish remaining lessons or raise your average score to unlock more missions.</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <v-icon icon="mdi-cloud-check" size="18" class="mt-0.5 text-cyan-300" />
                            <span>State is stored locally for offline practice and syncs to the cloud whenever you are logged in.</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="activeStageId === 'console'">
                    <div class="space-y-2">
                      <p class="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">Stop 3</p>
                      <h3 class="text-xl font-semibold">Master the lesson console</h3>
                      <p class="text-sm text-white/70">
                        Lessons simulate a real frequency. Use the tabs to inspect each panel, then trigger a sample ATC call to hear how the speech engine sounds.
                      </p>
                    </div>

                    <div class="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                      <img
                        src="/img/learn/modules/img11.jpeg"
                        alt="Lesson console preview"
                        class="h-56 w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div class="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                      <div class="rounded-3xl border border-white/10 bg-[#0f182d]/80 p-6">
                        <h4 class="text-base font-semibold text-white">Navigation quick hits</h4>
                        <ul class="mt-3 space-y-3 text-sm text-white/70">
                          <li class="flex items-start gap-3">
                            <v-icon icon="mdi-format-list-bulleted" size="18" class="mt-0.5 text-cyan-300" />
                            <span>Use the mission overview dropdown to jump between lessons and monitor completion.</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <v-icon icon="mdi-history" size="18" class="mt-0.5 text-cyan-300" />
                            <span>The footer arrows move to the previous or next lesson, or roll a fresh scenario instantly.</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <v-icon icon="mdi-eye-off" size="18" class="mt-0.5 text-cyan-300" />
                            <span>Enable audio challenge mode if you want to hide the target text until you intentionally reveal it.</span>
                          </li>
                        </ul>
                      </div>

                      <div class="space-y-4 rounded-3xl border border-white/10 bg-[#111a33]/80 p-6">
                        <div class="flex flex-wrap gap-2">
                          <button
                            v-for="(card, index) in consoleHighlights"
                            :key="card.title"
                            type="button"
                            class="rounded-xl border px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.25em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111a33]"
                            :class="index === activeConsoleIndex ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-white/0 text-white/50 hover:border-cyan-300/40 hover:text-white/80'"
                            @click="selectConsole(index)"
                          >
                            {{ card.title }}
                          </button>
                        </div>
                        <div class="rounded-2xl border border-white/10 bg-black/40 p-5">
                          <div class="flex items-center gap-3">
                            <div class="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10">
                              <v-icon :icon="activeConsoleCard.icon" size="20" class="text-cyan-300" />
                            </div>
                            <div>
                              <h4 class="text-base font-semibold text-white">{{ activeConsoleCard.title }}</h4>
                              <p class="text-xs uppercase tracking-[0.28em] text-white/40">In action</p>
                            </div>
                          </div>
                          <p class="mt-3 text-sm text-white/70">{{ activeConsoleCard.description }}</p>
                          <ul class="mt-4 space-y-2 text-sm text-white/60">
                            <li
                              v-for="item in activeConsoleCard.points"
                              :key="item"
                              class="flex items-start gap-2"
                            >
                              <v-icon icon="mdi-checkbox-blank-circle" size="10" class="mt-1 text-cyan-300" />
                              <span>{{ item }}</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div class="rounded-3xl border border-cyan-400/40 bg-cyan-400/10 p-6 shadow-lg shadow-cyan-500/20">
                      <div class="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/80">Try a sample call</p>
                          <h4 class="mt-1 text-lg font-semibold text-white">Hear the controller voice you will practise with</h4>
                        </div>
                        <div class="flex flex-wrap items-center gap-2">
                          <button
                            v-for="(sample, index) in radioSamples"
                            :key="sample.id"
                            type="button"
                            class="rounded-xl border px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.25em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-cyan-400/20"
                            :class="index === activeSampleIndex ? 'border-white/80 bg-white/20 text-[#0b1020]' : 'border-white/30 bg-white/10 text-white/80 hover:border-white/60 hover:text-white'"
                            @click="selectSample(index)"
                          >
                            {{ sample.label }}
                          </button>
                        </div>
                      </div>

                      <div class="mt-5 grid gap-5 lg:grid-cols-2">
                        <div class="space-y-3 rounded-2xl border border-white/30 bg-black/30 p-4">
                          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">ATC transmission</p>
                          <p class="text-sm text-white/80">{{ activeSample.text }}</p>
                          <p class="text-xs text-white/50">{{ activeSample.description }}</p>
                        </div>
                        <div class="space-y-3 rounded-2xl border border-white/30 bg-black/30 p-4">
                          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Your readback target</p>
                          <p class="text-sm text-white/80">{{ activeSample.readback }}</p>
                          <p class="text-xs text-white/50">Practise typing this response in Learn and aim for ≥ 80% similarity.</p>
                        </div>
                      </div>

                      <div class="mt-5 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          class="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0b1020] shadow-lg shadow-cyan-500/20 transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-cyan-400/20"
                          :disabled="isPlayingSample"
                          :class="{ 'cursor-not-allowed opacity-70': isPlayingSample }"
                          @click="playSample"
                        >
                          <v-icon :icon="isPlayingSample ? 'mdi-timer-sand' : 'mdi-volume-high'" size="18" class="text-[#0b1020]" />
                          {{ isPlayingSample ? 'Generating audio…' : hasHeardSample ? 'Play again' : 'Play controller example' }}
                        </button>
                        <p v-if="sayMeta" class="text-xs text-white/60">
                          Radio quality: {{ sayMeta.radioQuality }} · Voice: {{ sayMeta.voice || 'default' }} · Speed: ×{{ sayMeta.speed?.toFixed(2) || '1.00' }}
                        </p>
                        <p v-if="sampleError" class="text-xs font-semibold text-amber-200">
                          {{ sampleError }}
                        </p>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="activeStageId === 'settings'">
                    <div class="space-y-2">
                      <p class="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">Stop 4</p>
                      <h3 class="text-xl font-semibold">Fine-tune ATC settings and study tips</h3>
                      <p class="text-sm text-white/70">
                        Open the ATC panel inside Learn to shape the audio and training data. Pair it with focused habits so every repetition counts.
                      </p>
                    </div>

                    <div class="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                      <img
                        src="/img/learn/missions/full-flight/briefing-weather.png"
                        alt="Weather briefing illustration"
                        class="h-56 w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div class="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                      <div class="rounded-3xl border border-white/10 bg-[#0f182d]/80 p-6">
                        <h4 class="text-base font-semibold text-white">Training tips</h4>
                        <ul class="mt-3 space-y-3 text-sm text-white/70">
                          <li
                            v-for="tip in trainingTips"
                            :key="tip"
                            class="flex items-start gap-3"
                          >
                            <v-icon icon="mdi-lightbulb-on-outline" size="18" class="mt-0.5 text-cyan-300" />
                            <span>{{ tip }}</span>
                          </li>
                        </ul>
                      </div>

                      <div class="space-y-4 rounded-3xl border border-white/10 bg-[#111a33]/80 p-6">
                        <div class="flex flex-wrap gap-2">
                          <button
                            v-for="(setting, index) in settings"
                            :key="setting.title"
                            type="button"
                            class="rounded-xl border px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.25em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111a33]"
                            :class="index === activeSettingIndex ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-white/0 text-white/50 hover:border-cyan-300/40 hover:text-white/80'"
                            @click="selectSetting(index)"
                          >
                            {{ setting.title }}
                          </button>
                        </div>
                        <div class="rounded-2xl border border-white/10 bg-black/40 p-5">
                          <div class="flex items-center gap-3">
                            <div class="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10">
                              <v-icon :icon="activeSetting.icon" size="20" class="text-cyan-300" />
                            </div>
                            <div>
                              <h4 class="text-base font-semibold text-white">{{ activeSetting.title }}</h4>
                              <p class="text-xs uppercase tracking-[0.28em] text-white/40">Control</p>
                            </div>
                          </div>
                          <p class="mt-3 text-sm text-white/70">{{ activeSetting.description }}</p>
                          <p v-if="activeSetting.tip" class="mt-3 rounded-xl border border-cyan-400/40 bg-cyan-400/10 p-3 text-xs text-cyan-100">
                            {{ activeSetting.tip }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="activeStageId === 'faq'">
                    <div class="space-y-2">
                      <p class="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">Stop 5</p>
                      <h3 class="text-xl font-semibold">Common questions before you dive in</h3>
                      <p class="text-sm text-white/70">
                        Expand the answers and make sure you know what to expect when you open Learn.
                      </p>
                    </div>

                    <div class="space-y-4">
                      <details
                        v-for="faq in faqs"
                        :key="faq.question"
                        class="group rounded-2xl border border-white/10 bg-black/40 p-5"
                      >
                        <summary class="flex cursor-pointer items-center justify-between gap-4 text-left text-base font-semibold">
                          <span>{{ faq.question }}</span>
                          <v-icon icon="mdi-chevron-down" size="20" class="text-cyan-300 transition group-open:rotate-180" />
                        </summary>
                        <p class="mt-3 text-sm text-white/70">{{ faq.answer }}</p>
                      </details>
                    </div>

                    <div class="rounded-3xl border border-cyan-400/50 bg-cyan-400/10 p-6 text-center shadow-lg shadow-cyan-500/25">
                      <h4 class="text-lg font-semibold text-white">Ready for the real missions?</h4>
                      <p class="mt-2 text-sm text-white/80">
                        Head to the Learn hub, choose your module and loop the scenarios until the readback feels automatic. You will be ready when live AI ATC goes public.
                      </p>
                      <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <NuxtLink
                          to="/learn"
                          class="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0b1020] shadow-lg shadow-cyan-500/20 transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-cyan-400/20"
                        >
                          <v-icon icon="mdi-launch" size="20" class="text-[#0b1020]" />
                          Open the Learn hub
                        </NuxtLink>
                        <NuxtLink
                          to="/"
                          class="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-cyan-300/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1426]"
                        >
                          <v-icon icon="mdi-home-outline" size="20" class="text-cyan-300" />
                          Back to homepage
                        </NuxtLink>
                      </div>
                    </div>
                  </template>
                </div>
              </Transition>

              <div class="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 font-semibold transition hover:border-cyan-300/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  :disabled="activeStageIndex === 0"
                  :class="{ 'cursor-not-allowed opacity-40 hover:border-white/20 hover:text-white/70': activeStageIndex === 0 }"
                  @click="goToPreviousStage"
                >
                  <v-icon icon="mdi-arrow-left-bold" size="18" class="text-cyan-300" />
                  Previous stop
                </button>
                <span class="text-xs uppercase tracking-[0.28em] text-white/40">Stay curious—hover, click and test the controls like you would in Learn.</span>
                <button
                  v-if="activeStageIndex < stageOrder.length - 1"
                  type="button"
                  class="inline-flex items-center gap-2 rounded-xl bg-cyan-400/90 px-4 py-2 font-semibold text-[#0b1020] shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  @click="goToNextStage"
                >
                  Next stop: {{ nextStageTitle }}
                  <v-icon icon="mdi-arrow-right-bold" size="18" class="text-[#0b1020]" />
                </button>
                <NuxtLink
                  v-else
                  to="/learn"
                  class="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-semibold text-[#0b1020] shadow-lg shadow-cyan-500/20 transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Enter Learn now
                  <v-icon icon="mdi-launch" size="18" class="text-[#0b1020]" />
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'

const moduleSummaries = [
  {
    icon: 'mdi-alpha',
    title: 'Fundamentals · Basics',
    description: 'Warm up with the ICAO alphabet, numbers and weather essentials.',
    skills: [
      'Lock in ICAO pronunciation and number pacing.',
      'Decode ATIS or METAR snippets to prep runway, wind and QNH.'
    ]
  },
  {
    icon: 'mdi-walkie-talkie',
    title: 'Readbacks · Essential Calls',
    description: 'Drill clearances, taxiing and tower exchanges.',
    skills: [
      'Answer IFR clearances with squawk, procedure and altitude notes.',
      'Track taxi routes and hold-short phrases without getting lost.'
    ]
  },
  {
    icon: 'mdi-traffic-light',
    title: 'ATC · Advanced Calls',
    description: 'Handle reroutes, speed changes and priority requests.',
    skills: [
      'Stay calm through holds, reroutes or runway swaps.',
      'Match the AI phrasing when restrictions appear mid-flight.'
    ]
  },
  {
    icon: 'mdi-airplane',
    title: 'Full Flight · Gate to Gate',
    description: 'Fly the whole story from briefing to taxi-in.',
    skills: [
      'Build a plan from random, manual or SimBrief data.',
      'Link every phase—clearance to shutdown—without leaving the mission.'
    ]
  }
] as const

const overviewCards = [
  {
    icon: 'mdi-radar',
    title: 'Mission hub overview',
    description: 'The Learn hub lists every module with unlockable tiles and live progress.',
    points: [
      'Start in Fundamentals to unlock the rest of the curriculum.',
      'Tiles show lesson count, average score and what to do next.'
    ]
  },
  {
    icon: 'mdi-clipboard-text',
    title: 'Mission setup & briefing',
    description: 'Planning missions let you roll a random route, type your own or import SimBrief.',
    points: [
      'Random mode hands you a callsign, route and weather instantly.',
      'Manual or SimBrief entries make it easy to mirror an upcoming flight.'
    ]
  },
  {
    icon: 'mdi-teach',
    title: 'Lesson console & scoring',
    description: 'Each lesson plays ATC audio, captures your readback and scores accuracy.',
    points: [
      'Reveal text only when you need it, then grade yourself with Check.',
      'Reset, Auto-fill or roll a new scenario to keep the pace high.'
    ]
  }
] as const

const stepFlow = [
  {
    order: '01',
    title: 'Sign in and open the mission hub',
    description: 'Log in and head to /learn. The banner confirms you are in training mode.',
    tips: ['The hub remembers your last module so you can pick up instantly.']
  },
  {
    order: '02',
    title: 'Choose a module',
    description: 'Select Fundamentals, Readbacks, Advanced or Full Flight to match your goal.',
    tips: ['Hover a tile for completion stats and focus areas.']
  },
  {
    order: '03',
    title: 'Lock in a flight (if required)',
    description: 'Some missions need a plan first—pick random, manual or SimBrief and confirm.',
    tips: ['Reroll random flights until the procedures line up with what you want to practise.']
  },
  {
    order: '04',
    title: 'Brief the mission',
    description: 'Review runway, weather, squawk and notes on the briefing cards.',
    tips: ['Use the illustrations to double-check SID, STAR and key calls.']
  },
  {
    order: '05',
    title: 'Practise the lesson',
    description: 'Play the call, fill the blanks and iterate until the score sticks.',
    tips: ['Audio challenge hides the text when you want pure listening practice.']
  },
  {
    order: '06',
    title: 'Advance & celebrate progress',
    description: 'Use the footer to move on—XP updates your level and objectives automatically.',
    tips: ['Aim for 80%+ to unlock the next missions quickly.']
  }
] as const

const consoleHighlights = [
  {
    icon: 'mdi-volume-high',
    title: 'Target audio & phrase',
    description: 'The target panel plays the call and shows reference text when revealed.',
    points: [
      'Speaker handles playback—stop or roll for something new anytime.',
      'Audio challenge hides the script until you tap Reveal text.'
    ]
  },
  {
    icon: 'mdi-form-textbox',
    title: 'Readback workspace',
    description: 'Blanks highlight what is right or needs work.',
    points: [
      'Green checks confirm the field; amber shows what to fix.',
      'Similarity percentages show how close your words were.'
    ]
  },
  {
    icon: 'mdi-auto-fix',
    title: 'Evaluation controls',
    description: 'Three buttons keep the loop fast.',
    points: [
      'Check grades your readback and awards XP.',
      'Reset or Auto-fill to retry or study the model answer.'
    ]
  },
  {
    icon: 'mdi-timeline-clock',
    title: 'Mission footer & sequencing',
    description: 'The footer tracks sequencing and quick actions.',
    points: [
      'Previous/Next jump between lessons or modules with previews.',
      'New scenario mirrors the dice button for rapid reps.'
    ]
  }
] as const

const settings = [
  {
    icon: 'mdi-voice',
    title: 'Browser TTS toggle',
    description: 'Swap between local speech (fast) and the hosted AI voice.',
    tip: 'Use browser speech offline; switch back for the richer AI cadence.'
  },
  {
    icon: 'mdi-eye-outline',
    title: 'Audio challenge',
    description: 'Hide the reference text until you deliberately reveal it.',
    tip: 'Pair with a lower radio level to mimic a noisy frequency.'
  },
  {
    icon: 'mdi-signal-variant',
    title: 'Radio level',
    description: 'Choose readability from 1 (noisy) to 5 (crisp).',
    tip: 'Levels 1–2 add static like a busy network evening.'
  },
  {
    icon: 'mdi-speedometer',
    title: 'ATC speaking speed',
    description: 'Adjust playback between 0.7× and 1.3×.',
    tip: 'Start slow on new procedures, then return to 1.0× as confidence grows.'
  },
  {
    icon: 'mdi-volume-high',
    title: 'Quick test',
    description: 'Play a sample phrase to check audio output and voice.',
    tip: 'Run it at the start of each session to confirm everything works.'
  },
  {
    icon: 'mdi-refresh',
    title: 'Reset training data',
    description: 'Clear XP, progress and local settings on this device.',
    tip: 'Use it before lending your setup or replaying the onboarding.'
  }
] as const

const trainingTips = [
  'Roll each lesson a few times to lock in the phrase.',
  'Bounce between modules so fundamentals stay sharp.',
  'When ready, enable audio challenge and lower the radio level for a stress test.'
] as const

const faqs = [
  {
    question: 'Is this the same AI that will control my simulator session?',
    answer: 'Not yet. Learn is the public trainer while live AI ATC stays in closed testing, but the flows match.'
  },
  {
    question: 'Do I need a SimBrief account to use Learn?',
    answer: 'No. SimBrief import is optional—you can roll a random flight or enter one manually.'
  },
  {
    question: 'How is my progress saved?',
    answer: 'Progress and settings save locally and sync once you sign in.'
  },
  {
    question: 'Can I restart my training?',
    answer: 'Yes. Open ATC settings and use “Reset training data” on this device.'
  },
  {
    question: 'Which devices work best?',
    answer: 'Learn runs best in a desktop browser. A headset is optional for now because you type the readbacks.'
  }
] as const

const radioSamples = [
  {
    id: 'clearance',
    label: 'IFR clearance',
    text: 'Lufthansa one two three, cleared to Munich via the MARUN five November departure, runway two five center, squawk two five four three.',
    readback: 'Cleared to Munich via the MARUN five November departure, runway two five center, squawk two five four three, Lufthansa one two three.',
    description: 'Your very first contact—perfect for warming up on phraseology and squawk numbers.',
    level: 4,
    speed: 1
  },
  {
    id: 'approach',
    label: 'Approach vector',
    text: 'Lufthansa one two three, turn right heading two seven zero, descend to four thousand feet, QNH one zero one eight.',
    readback: 'Right heading two seven zero, descend to four thousand feet, QNH one zero one eight, Lufthansa one two three.',
    description: 'Practise altitude and heading changes while keeping the QNH in the correct slot.',
    level: 3,
    speed: 0.95
  },
  {
    id: 'taxi',
    label: 'Taxi instruction',
    text: 'Lufthansa one two three, taxi to holding point runway two five center via November four, November, hold short runway two five center.',
    readback: 'Taxi to holding point runway two five center via November four, November, hold short runway two five center, Lufthansa one two three.',
    description: 'A ground movement example that reinforces hold-short phraseology.',
    level: 5,
    speed: 1.05
  }
] as const

const stageOrder = [
  {
    id: 'overview',
    title: 'Mission hub orientation',
    tagline: 'See how modules unlock and what each tile means.'
  },
  {
    id: 'flow',
    title: 'Mission flow',
    tagline: 'Follow the Learn rhythm from planning to scoring.'
  },
  {
    id: 'console',
    title: 'Lesson console',
    tagline: 'Interact with ATC playback and evaluation tools.'
  },
  {
    id: 'settings',
    title: 'ATC settings & tips',
    tagline: 'Tune the radio and build strong study habits.'
  },
  {
    id: 'faq',
    title: 'FAQs & next steps',
    tagline: 'Check the fine print before starting your mission.'
  }
] as const

type StageId = typeof stageOrder[number]['id']

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const activeModuleIndex = ref(0)
const activeOverviewCardIndex = ref(0)
const activeFlowIndex = ref(0)
const activeConsoleIndex = ref(0)
const activeSettingIndex = ref(0)
const activeSampleIndex = ref(0)
const activeStageId = ref<StageId>('overview')

const api = useApi()
const auth = useAuthStore()
const isAuthenticated = computed(() => auth.isAuthenticated)

const isClient = typeof window !== 'undefined'

const isPlayingSample = ref(false)
const hasHeardSample = ref(false)
const sampleError = ref<string | null>(null)
const sayMeta = ref<{ radioQuality?: string; voice?: string | null; speed?: number } | null>(null)
const activeAudio = ref<HTMLAudioElement | null>(null)

const activeStageIndex = computed(() => {
  const index = stageOrder.findIndex((stage) => stage.id === activeStageId.value)
  return index < 0 ? 0 : index
})

const stageProgress = computed(() => {
  const progress = ((activeStageIndex.value + 1) / stageOrder.length) * 100
  return Math.round(progress)
})

const activeStage = computed(() => stageOrder[activeStageIndex.value] ?? stageOrder[0])
const nextStageTitle = computed(() => stageOrder[activeStageIndex.value + 1]?.title ?? 'Open the Learn hub')

const activeModule = computed(() => moduleSummaries[activeModuleIndex.value] ?? moduleSummaries[0])
const activeOverviewCard = computed(() => overviewCards[activeOverviewCardIndex.value] ?? overviewCards[0])
const activeFlowStep = computed(() => stepFlow[activeFlowIndex.value] ?? stepFlow[0])
const activeConsoleCard = computed(() => consoleHighlights[activeConsoleIndex.value] ?? consoleHighlights[0])
const activeSetting = computed(() => settings[activeSettingIndex.value] ?? settings[0])
const activeSample = computed(() => radioSamples[activeSampleIndex.value] ?? radioSamples[0])

function startTour() {
  setStage('overview')
  if (isClient) {
    const el = document.getElementById('learn-tour')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

function setStage(id: StageId) {
  const exists = stageOrder.some((stage) => stage.id === id)
  if (!exists) return
  activeStageId.value = id
  if (id !== 'console') {
    stopSamplePlayback()
  }
}

function goToNextStage() {
  const next = stageOrder[activeStageIndex.value + 1]
  if (next) {
    setStage(next.id)
  }
}

function goToPreviousStage() {
  const previous = stageOrder[activeStageIndex.value - 1]
  if (previous) {
    setStage(previous.id)
  }
}

function selectModule(index: number) {
  activeModuleIndex.value = clamp(index, 0, moduleSummaries.length - 1)
}

function selectOverviewCard(index: number) {
  activeOverviewCardIndex.value = clamp(index, 0, overviewCards.length - 1)
}

function selectFlow(index: number) {
  activeFlowIndex.value = clamp(index, 0, stepFlow.length - 1)
}

function nextFlow() {
  if (activeFlowIndex.value < stepFlow.length - 1) {
    activeFlowIndex.value += 1
  } else {
    goToNextStage()
  }
}

function previousFlow() {
  if (activeFlowIndex.value > 0) {
    activeFlowIndex.value -= 1
  }
}

function selectConsole(index: number) {
  activeConsoleIndex.value = clamp(index, 0, consoleHighlights.length - 1)
}

function selectSetting(index: number) {
  activeSettingIndex.value = clamp(index, 0, settings.length - 1)
}

function stopSamplePlayback() {
  if (activeAudio.value) {
    activeAudio.value.pause()
    activeAudio.value.currentTime = 0
    activeAudio.value = null
  }
}

function selectSample(index: number) {
  activeSampleIndex.value = clamp(index, 0, radioSamples.length - 1)
  sampleError.value = null
  sayMeta.value = null
  stopSamplePlayback()
}

async function playSample() {
  sampleError.value = null
  sayMeta.value = null

  if (!isClient) {
    sampleError.value = 'Audio playback is only available in the browser.'
    return
  }

  if (isPlayingSample.value) {
    return
  }

  const sample = activeSample.value
  if (!sample) {
    return
  }

  if (!isAuthenticated.value) {
    sampleError.value = 'Sign in to OpenSquawk to play the controller example.'
    return
  }

  if (typeof Audio === 'undefined') {
    sampleError.value = 'Your browser does not support audio playback here.'
    return
  }

  try {
    isPlayingSample.value = true
    stopSamplePlayback()

    const response: any = await api.post('/api/atc/say', {
      text: sample.text,
      level: sample.level,
      speed: sample.speed,
      tag: 'learn-introduction',
      format: 'smallest'
    })

    const audio = response?.audio
    if (!audio?.base64) {
      throw new Error('Audio payload missing')
    }

    const mime = audio.mime || 'audio/wav'
    const dataUrl = `data:${mime};base64,${audio.base64}`
    const element = new Audio(dataUrl)
    activeAudio.value = element
    element.onended = () => {
      if (activeAudio.value === element) {
        activeAudio.value = null
      }
    }

    await element.play()

    hasHeardSample.value = true
    sayMeta.value = {
      radioQuality: typeof response?.radioQuality === 'string' ? response.radioQuality : undefined,
      voice: typeof response?.voice === 'string' ? response.voice : null,
      speed: typeof response?.speed === 'number' ? response.speed : sample.speed
    }
  } catch (error: any) {
    stopSamplePlayback()
    if (error?.status === 401 || error?.response?.status === 401) {
      sampleError.value = 'Please sign in to your OpenSquawk account to hear the sample.'
    } else if (error?.name === 'NotAllowedError' || error?.name === 'AbortError') {
      sampleError.value = 'Your browser blocked playback. Click the button again to allow audio.'
    } else {
      const message =
        error?.data?.message ||
        error?.statusMessage ||
        error?.message ||
        error?.response?._data?.message
      sampleError.value = message ? String(message) : 'Could not generate audio right now. Try again in a moment.'
    }
  } finally {
    isPlayingSample.value = false
  }
}
</script>

<style scoped>
details summary::-webkit-details-marker {
  display: none;
}

details {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

details[open] {
  border-color: rgba(34, 211, 238, 0.4);
  box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.15), 0 25px 50px -12px rgba(15, 118, 110, 0.35);
}

details summary {
  outline: none;
}

details summary:focus-visible {
  outline: 2px solid rgba(165, 243, 252, 0.8);
  outline-offset: 4px;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
