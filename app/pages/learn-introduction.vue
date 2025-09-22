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
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-transparent to-indigo-500/20" aria-hidden="true"></div>
        <div class="relative z-10 mx-auto w-full max-w-screen-xl px-4 py-16 sm:px-6 md:px-8 md:py-20">
          <div class="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
            <div class="space-y-6">
              <span class="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Orientation</span>
              <h1 class="text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">Get comfy with Learn before live AI ATC opens</h1>
              <p class="max-w-2xl text-base text-white/80 sm:text-lg">
                Learn is your training hangar. Live AI ATC for full simulator flights is still in closed testing, so this tour shows how to practise the phraseology, rhythm and scoring system ahead of time.
              </p>
              <div class="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5 text-amber-100 shadow-lg shadow-amber-500/10" role="status">
                <div class="flex items-start gap-3">
                  <div class="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200/50 bg-amber-300/20">
                    <v-icon icon="mdi-alert-decagram-outline" size="22" class="text-amber-200" />
                  </div>
                  <div class="space-y-1">
                    <p class="text-sm font-semibold uppercase tracking-wide text-amber-100/90">Current status</p>
                    <p class="text-sm text-amber-50/90">Learn is live for everyone right now. Use it to rehearse radio work—your XP and objectives will carry over once live AI ATC opens up.</p>
                  </div>
                </div>
              </div>
              <ul class="grid gap-3 text-sm text-white/70 sm:grid-cols-2 sm:text-base">
                <li class="flex items-start gap-3">
                  <v-icon icon="mdi-target" size="20" class="mt-1 text-cyan-300" />
                  <span>Follow a friendly instructor who explains each part of the Learn hub.</span>
                </li>
                <li class="flex items-start gap-3">
                  <v-icon icon="mdi-headset" size="20" class="mt-1 text-cyan-300" />
                  <span>Choose text-only mode or switch on the radio voice before you start.</span>
                </li>
                <li class="flex items-start gap-3">
                  <v-icon icon="mdi-rocket-launch" size="20" class="mt-1 text-cyan-300" />
                  <span>Unlock missions by scoring 80% or better—exactly like the real trainer.</span>
                </li>
                <li class="flex items-start gap-3">
                  <v-icon icon="mdi-sync" size="20" class="mt-1 text-cyan-300" />
                  <span>Progress syncs to your OpenSquawk account as soon as you sign in.</span>
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
                <h2 class="text-lg font-semibold">What you will cover</h2>
                <ol class="mt-4 space-y-3 text-sm text-white/70">
                  <li class="flex items-start gap-3">
                    <div class="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-500/10 text-sm font-semibold text-cyan-200">01</div>
                    <span>Tour the Learn hub and pick your starting module.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <div class="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-500/10 text-sm font-semibold text-cyan-200">02</div>
                    <span>Walk through the mission rhythm from briefing to scoring.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <div class="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-500/10 text-sm font-semibold text-cyan-200">03</div>
                    <span>Try the lesson console, ATC audio and key settings.</span>
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
            </div>
          </div>
        </div>
      </section>

      <section id="learn-tour" class="border-b border-white/5 bg-[#0d1426]/70 py-16 sm:py-20">
        <div class="mx-auto w-full max-w-screen-xl space-y-12 px-4 sm:px-6 md:px-8">
          <div class="space-y-3">
            <p class="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/70">Interactive tour</p>
            <h2 class="text-2xl font-semibold sm:text-3xl">Click through each station and let the instructor guide you</h2>
            <p class="max-w-3xl text-base text-white/70">We break the Learn experience into five short stops. Decide if you want the radio voice or text-only notes, run a quick radio check, then follow the instructor at your own pace.</p>
          </div>

          <div class="grid gap-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <aside class="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/20">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/60">Progress</p>
                <div class="mt-3 flex items-center gap-3">
                  <div class="flex-1 overflow-hidden rounded-full bg-white/10">
                    <div class="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 transition-all duration-300" :style="{ width: `${stageProgress}%` }"></div>
                  </div>
                  <span class="text-sm font-semibold text-white/70">{{ stageProgress }}%</span>
                </div>
                <p class="mt-2 text-xs text-white/50">Stop {{ activeStageIndex + 1 }} / {{ stageOrder.length }} · {{ activeStage.title }}</p>
              </div>

              <div class="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">Instructor voice</p>
                    <p class="text-sm text-white/70">Pick how you want to follow along.</p>
                  </div>
                  <img src="/img/logo.jpeg" alt="Instructor avatar" class="h-10 w-10 rounded-full border border-white/20 object-cover" loading="lazy" />
                </div>
                <div class="inline-flex rounded-full border border-white/10 bg-black/60 p-1">
                  <button
                    type="button"
                    class="rounded-full px-3 py-1 text-xs font-semibold transition"
                    :class="voicePreference === 'text' ? 'bg-white text-[#0b1020] shadow' : 'text-white/60 hover:text-white'"
                    @click="setVoicePreference('text')"
                  >
                    Text only
                  </button>
                  <button
                    type="button"
                    class="rounded-full px-3 py-1 text-xs font-semibold transition"
                    :class="voicePreference === 'radio' ? 'bg-cyan-400 text-[#0b1020] shadow-lg shadow-cyan-500/40' : 'text-white/60 hover:text-white'"
                    @click="setVoicePreference('radio')"
                  >
                    Radio voice
                  </button>
                </div>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold transition hover:border-cyan-300/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  :class="{ 'cursor-not-allowed opacity-60': isCheckingRadio }"
                  :disabled="isCheckingRadio"
                  @click="playRadioCheck"
                >
                  <v-icon :icon="isCheckingRadio ? 'mdi-timer-sand' : 'mdi-access-point-check'" size="16" class="text-cyan-300" />
                  {{ isCheckingRadio ? 'Checking audio…' : radioReady ? 'Play radio check again' : 'Run radio check' }}
                </button>
                <p v-if="voicePreference === 'radio' && !isAuthenticated" class="text-xs font-semibold text-amber-200">Sign in to OpenSquawk so we can play the instructor voice.</p>
                <p v-if="radioCheckError" class="text-xs font-semibold text-amber-200">{{ radioCheckError }}</p>
                <p v-else-if="radioReady" class="text-xs text-white/60">Radio voice ready. Loud and clear!</p>
                <p v-if="radioCheckMeta" class="text-xs text-white/40">Radio {{ radioCheckMeta.radioQuality || 'level 4' }} · Voice {{ radioCheckMeta.voice || 'default' }} · ×{{ (radioCheckMeta.speed ?? 1).toFixed(2) }}</p>
                <p v-if="guideVoiceError" class="text-xs font-semibold text-amber-200">{{ guideVoiceError }}</p>
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
                Tip: finish each stop with the Next button so the instructor keeps the flow going—just like the prompts inside Learn.
              </div>
            </aside>

            <div class="space-y-6">
              <div class="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#0f182d]/90 p-6 shadow-xl shadow-black/30 sm:flex-row sm:items-center">
                <img src="/img/logo.jpeg" alt="Instructor avatar" class="h-14 w-14 rounded-2xl border border-cyan-400/40 object-cover" loading="lazy" />
                <div>
                  <p class="text-sm text-white/80">{{ activeGuide.intro }}</p>
                  <ul v-if="activeGuide.bullets?.length" class="mt-3 space-y-2 text-sm text-white/60">
                    <li v-for="bullet in activeGuide.bullets" :key="bullet" class="flex items-start gap-2">
                      <v-icon icon="mdi-sparkles" size="16" class="mt-0.5 text-cyan-300" />
                      <span>{{ bullet }}</span>
                    </li>
                  </ul>
                  <p v-if="voicePreference === 'radio' && radioReady" class="mt-3 text-xs uppercase tracking-[0.28em] text-cyan-200/70">Radio instructor active</p>
                </div>
              </div>

              <Transition name="fade-slide" mode="out-in">
                <div :key="activeStageId" class="space-y-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/30">
                  <template v-if="activeStageId === 'overview'">
                    <div class="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                      <img
                        src="/img/learn/modules/img7.jpeg"
                        alt="Module tiles inside the Learn hub"
                        class="h-56 w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div class="space-y-5">
                      <div class="rounded-3xl border border-white/10 bg-[#101a33]/80 p-5">
                        <div class="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">Module cards</p>
                            <h3 class="mt-1 text-lg font-semibold text-white">Peek at the hub tiles</h3>
                          </div>
                          <div class="flex items-center gap-2">
                            <button
                              type="button"
                              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-cyan-300/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101a33]"
                              @click="previousModule"
                            >
                              <v-icon icon="mdi-chevron-left" size="18" class="text-cyan-300" />
                            </button>
                            <button
                              type="button"
                              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-cyan-300/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101a33]"
                              @click="nextModule"
                            >
                              <v-icon icon="mdi-chevron-right" size="18" class="text-cyan-300" />
                            </button>
                          </div>
                        </div>
                        <div class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
                          <div class="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10">
                            <v-icon :icon="activeModule.icon" size="24" class="text-cyan-300" />
                          </div>
                          <div class="space-y-2">
                            <h4 class="text-base font-semibold text-white">{{ activeModule.title }}</h4>
                            <p class="text-sm text-white/70">{{ activeModule.description }}</p>
                            <ul class="space-y-2 text-sm text-white/60">
                              <li v-for="skill in activeModule.skills" :key="skill" class="flex items-start gap-2">
                                <v-icon icon="mdi-check" size="16" class="mt-0.5 text-cyan-300" />
                                <span>{{ skill }}</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                        <div class="mt-4 flex items-center gap-2 text-xs text-white/50">
                          <div class="flex gap-1">
                            <span
                              v-for="(_, index) in moduleSummaries"
                              :key="`dot-${index}`"
                              class="inline-flex h-2 w-2 rounded-full"
                              :class="index === activeModuleIndex ? 'bg-cyan-300' : 'bg-white/20'"
                            ></span>
                          </div>
                          <span>Unlock new tiles by scoring 80%+ in the current pack.</span>
                        </div>
                      </div>

                      <div class="rounded-3xl border border-cyan-400/40 bg-cyan-400/10 p-5 text-sm text-white/80 shadow-lg shadow-cyan-500/20">
                        <p class="font-semibold text-white">Instructor tip</p>
                        <p class="mt-1">Start with Fundamentals to warm up, then hop between packs to keep variety high.</p>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="activeStageId === 'flow'">
                    <div class="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                      <img
                        src="/img/learn/missions/full-flight/briefing-route.png"
                        alt="Mission planning cards"
                        class="h-56 w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div class="grid gap-6 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)]">
                      <div class="rounded-3xl border border-white/10 bg-[#101a33]/80 p-5">
                        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">Mission rhythm</p>
                        <ol class="mt-4 space-y-2 text-sm text-white/60">
                          <li v-for="(step, index) in stepFlow" :key="step.title">
                            <button
                              type="button"
                              class="flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition"
                              :class="index === activeFlowIndex ? 'border-cyan-400/50 bg-cyan-400/10 text-white' : 'border-white/10 bg-white/0 hover:border-cyan-300/30 hover:text-white'"
                              @click="selectFlow(index)"
                            >
                              <div class="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold">{{ step.order }}</div>
                              <span>{{ step.title }}</span>
                            </button>
                          </li>
                        </ol>
                      </div>

                      <div class="rounded-3xl border border-white/10 bg-[#0f182d]/80 p-6">
                        <div class="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p class="text-xs uppercase tracking-[0.28em] text-white/50">Step {{ activeFlowStep.order }}</p>
                            <h3 class="mt-1 text-lg font-semibold text-white">{{ activeFlowStep.title }}</h3>
                          </div>
                          <div class="flex items-center gap-2">
                            <button
                              type="button"
                              class="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:border-cyan-300/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f182d]"
                              :disabled="activeFlowIndex === 0"
                              :class="{ 'cursor-not-allowed opacity-40 hover:border-white/15 hover:text-white/70': activeFlowIndex === 0 }"
                              @click="previousFlow"
                            >
                              <v-icon icon="mdi-chevron-left" size="16" class="text-cyan-300" />
                              Back
                            </button>
                            <button
                              type="button"
                              class="inline-flex items-center gap-2 rounded-full bg-cyan-400/90 px-3 py-1.5 text-xs font-semibold text-[#0b1020] shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f182d]"
                              @click="nextFlow"
                            >
                              Next
                              <v-icon icon="mdi-chevron-right" size="16" class="text-[#0b1020]" />
                            </button>
                          </div>
                        </div>
                        <p class="mt-3 text-sm text-white/70">{{ activeFlowStep.description }}</p>
                        <ul v-if="activeFlowStep.tips?.length" class="mt-4 space-y-2 text-sm text-white/60">
                          <li v-for="tip in activeFlowStep.tips" :key="tip" class="flex items-start gap-2">
                            <v-icon icon="mdi-lightning-bolt" size="16" class="mt-0.5 text-cyan-300" />
                            <span>{{ tip }}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="activeStageId === 'console'">
                    <div class="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                      <img
                        src="/img/learn/modules/img11.jpeg"
                        alt="Lesson console preview"
                        class="h-56 w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div class="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                      <div class="rounded-3xl border border-white/10 bg-[#101a33]/80 p-6">
                        <div class="flex flex-wrap gap-2">
                          <button
                            v-for="(card, index) in consoleHighlights"
                            :key="card.title"
                            type="button"
                            class="rounded-xl border px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.25em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101a33]"
                            :class="index === activeConsoleIndex ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-white/0 text-white/50 hover:border-cyan-300/40 hover:text-white/80'"
                            @click="selectConsole(index)"
                          >
                            {{ card.title }}
                          </button>
                        </div>
                        <div class="mt-5 rounded-2xl border border-white/10 bg-black/40 p-5">
                          <div class="flex items-center gap-3">
                            <div class="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10">
                              <v-icon :icon="activeConsoleCard.icon" size="20" class="text-cyan-300" />
                            </div>
                            <div>
                              <h4 class="text-base font-semibold text-white">{{ activeConsoleCard.title }}</h4>
                              <p class="text-xs uppercase tracking-[0.28em] text-white/40">Highlights</p>
                            </div>
                          </div>
                          <p class="mt-3 text-sm text-white/70">{{ activeConsoleCard.description }}</p>
                          <ul class="mt-4 space-y-2 text-sm text-white/60">
                            <li v-for="item in activeConsoleCard.points" :key="item" class="flex items-start gap-2">
                              <v-icon icon="mdi-checkbox-blank-circle" size="10" class="mt-1 text-cyan-300" />
                              <span>{{ item }}</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div class="space-y-4 rounded-3xl border border-cyan-400/40 bg-cyan-400/10 p-6 shadow-lg shadow-cyan-500/20">
                        <div class="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/80">Try a sample call</p>
                            <h4 class="mt-1 text-lg font-semibold text-white">Hear the controller you will practise with</h4>
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

                        <div class="grid gap-5 lg:grid-cols-2">
                          <div class="space-y-3 rounded-2xl border border-white/30 bg-black/30 p-4">
                            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">ATC transmission</p>
                            <p class="text-sm text-white/80">{{ activeSample.text }}</p>
                            <p class="text-xs text-white/50">{{ activeSample.description }}</p>
                          </div>
                          <div class="space-y-3 rounded-2xl border border-white/30 bg-black/30 p-4">
                            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Your readback target</p>
                            <p class="text-sm text-white/80">{{ activeSample.readback }}</p>
                            <p class="text-xs text-white/50">Type this in Learn and aim for ≥ 80% similarity.</p>
                          </div>
                        </div>

                        <div class="mt-4 flex flex-wrap items-center gap-3">
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
                          <p v-if="sayMeta" class="text-xs text-white/60">Radio {{ sayMeta.radioQuality || activeSample.level }} · Voice {{ sayMeta.voice || 'default' }} · ×{{ (sayMeta.speed ?? activeSample.speed).toFixed(2) }}</p>
                          <p v-if="sampleError" class="text-xs font-semibold text-amber-200">{{ sampleError }}</p>
                        </div>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="activeStageId === 'settings'">
                    <div class="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                      <img
                        src="/img/learn/missions/full-flight/briefing-weather.png"
                        alt="Weather briefing illustration"
                        class="h-56 w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div class="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                      <div class="rounded-3xl border border-white/10 bg-[#101a33]/80 p-6">
                        <h4 class="text-base font-semibold text-white">Quick training habits</h4>
                        <ul class="mt-3 space-y-3 text-sm text-white/70">
                          <li v-for="tip in trainingTips" :key="tip" class="flex items-start gap-3">
                            <v-icon icon="mdi-lightbulb-on-outline" size="18" class="mt-0.5 text-cyan-300" />
                            <span>{{ tip }}</span>
                          </li>
                        </ul>
                      </div>

                      <div class="space-y-4 rounded-3xl border border-white/10 bg-[#0f182d]/80 p-6">
                        <div class="flex flex-wrap gap-2">
                          <button
                            v-for="(setting, index) in settings"
                            :key="setting.title"
                            type="button"
                            class="rounded-xl border px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.25em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f182d]"
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
                          <p v-if="activeSetting.tip" class="mt-3 rounded-xl border border-cyan-400/40 bg-cyan-400/10 p-3 text-xs text-cyan-100">{{ activeSetting.tip }}</p>
                        </div>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="activeStageId === 'faq'">
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
                      <p class="mt-2 text-sm text-white/80">Head to the Learn hub, choose your module and loop the scenarios until the readback feels automatic. You will be ready when live AI ATC goes public.</p>
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

              <div class="rounded-3xl border border-white/10 bg-gradient-to-r from-[#101a33] via-[#0f182d] to-[#0b1524] p-5 shadow-inner shadow-black/40">
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.28em] text-white/40">Stop {{ activeStageIndex + 1 }} of {{ stageOrder.length }}</p>
                    <p class="mt-1 text-sm text-white/70">Take the next hop when you are ready—the instructor will cue the next lesson.</p>
                  </div>
                  <div class="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-cyan-300/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101a33]"
                      :disabled="activeStageIndex === 0"
                      :class="{ 'cursor-not-allowed opacity-40 hover:border-white/20 hover:text-white/70': activeStageIndex === 0 }"
                      @click="goToPreviousStage"
                    >
                      <v-icon icon="mdi-arrow-left-bold" size="18" class="text-cyan-300" />
                      Previous stop
                    </button>
                    <button
                      v-if="activeStageIndex < stageOrder.length - 1"
                      type="button"
                      class="inline-flex items-center gap-2 rounded-xl bg-cyan-400/90 px-4 py-2 text-sm font-semibold text-[#0b1020] shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101a33]"
                      @click="goToNextStage"
                    >
                      Next stop: {{ nextStageTitle }}
                      <v-icon icon="mdi-arrow-right-bold" size="18" class="text-[#0b1020]" />
                    </button>
                    <NuxtLink
                      v-else
                      to="/learn"
                      class="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0b1020] shadow-lg shadow-cyan-500/20 transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#101a33]"
                    >
                      Enter Learn now
                      <v-icon icon="mdi-launch" size="18" class="text-[#0b1020]" />
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'

type VoicePreference = 'text' | 'radio'

const moduleSummaries = [
  {
    icon: 'mdi-alpha-circle-outline',
    title: 'Fundamentals',
    description: 'Warm up on ICAO alphabet, numbers and ATIS cues.',
    skills: ['Speed up your phonetics and numbers.', 'Translate METAR data into plain language.']
  },
  {
    icon: 'mdi-walkie-talkie',
    title: 'Clearances & Taxi',
    description: 'Answer IFR clearances and ground instructions without hesitation.',
    skills: ['Copy squawk, route and climb details with confidence.', 'Trace taxi routes without missing hold shorts.']
  },
  {
    icon: 'mdi-radar',
    title: 'Approach & Tower',
    description: 'Handle headings, altitude changes and landing calls.',
    skills: ['Stay ahead of vectors and speed changes.', 'Practise landing clearances until the cadence sticks.']
  },
  {
    icon: 'mdi-airplane-cog',
    title: 'Full Flight',
    description: 'Plan, brief and fly a gate-to-gate storyline.',
    skills: ['Roll random or SimBrief routes to mirror your sim.', 'Keep the momentum from clearance to shutdown.']
  }
] as const

const stepFlow = [
  {
    order: '01',
    title: 'Pick a module',
    description: 'Tap a tile in the hub to focus on the skill group you want today.',
    tips: ['Hover a tile to see lesson counts and your average score.']
  },
  {
    order: '02',
    title: 'Set up the flight',
    description: 'Roll a random mission or import your own route when the module needs it.',
    tips: ['Reroll until the procedure matches what you want to practise.']
  },
  {
    order: '03',
    title: 'Brief quickly',
    description: 'Scan runway, weather and notes so you know what call is coming.',
    tips: ['Use the visuals as a double-check before you begin.']
  },
  {
    order: '04',
    title: 'Practise & score',
    description: 'Play the call, read it back, then loop until 80%+ feels automatic.',
    tips: ['Switch modules whenever you need a fresh challenge.']
  }
] as const

const consoleHighlights = [
  {
    icon: 'mdi-play-circle-outline',
    title: 'Listen & reveal',
    description: 'Trigger the controller audio and reveal the script only when needed.',
    points: ['Toggle Reveal text for extra listening practice.', 'Roll a new scenario anytime to keep the pace up.']
  },
  {
    icon: 'mdi-pencil-outline',
    title: 'Type your readback',
    description: 'Fill the blanks with your response and watch the highlights show what matched.',
    points: ['Green checks confirm a correct field immediately.', 'Amber cues point out what to adjust next round.']
  },
  {
    icon: 'mdi-trophy-outline',
    title: 'Grade & advance',
    description: 'Use Check to score yourself, then hop to the next lesson with the footer arrows.',
    points: ['Auto-fill reveals the model answer for study mode.', 'Next lesson jumps ahead without leaving the mission.']
  }
] as const

const settings = [
  {
    icon: 'mdi-eye-outline',
    title: 'Audio challenge',
    description: 'Hide the target text until you tap Reveal. Great for pure listening drills.',
    tip: 'Pair it with a slower speed the first time you try a new call.'
  },
  {
    icon: 'mdi-signal-variant',
    title: 'Radio quality',
    description: 'Slide between level 1 (gritty) and 5 (crisp) to mimic real traffic.',
    tip: 'Drop to level 2 when you want a “busy frequency” vibe.'
  },
  {
    icon: 'mdi-refresh',
    title: 'Reset training data',
    description: 'Clear XP and local streaks when you want a fresh start on this device.',
    tip: 'Perfect before handing your setup to a friend for their own run.'
  }
] as const

const trainingTips = [
  'Loop each lesson twice so the cadence sticks.',
  'Mix easy and hard modules to keep your ears sharp.',
  'Lower the radio quality once you are comfortable with the script.'
] as const

const faqs = [
  {
    question: 'Is this the same AI I will hear during a simulator session?',
    answer: 'Not yet. Learn is the public trainer while live AI ATC stays in closed testing, but the phraseology and scoring match what is coming.'
  },
  {
    question: 'Do I need SimBrief to use Learn?',
    answer: 'No. SimBrief import is optional—you can roll a random flight or type one manually in seconds.'
  },
  {
    question: 'How is my progress saved?',
    answer: 'Everything saves locally for offline practice and syncs to your account as soon as you sign in.'
  }
] as const

const radioSamples = [
  {
    id: 'clearance',
    label: 'IFR clearance',
    text: 'Lufthansa one two three, cleared to Munich via the MARUN five November departure, runway two five center, squawk two five four three.',
    readback: 'Cleared to Munich via the MARUN five November departure, runway two five center, squawk two five four three, Lufthansa one two three.',
    description: 'Warm-up call that covers routing, runway and squawk.',
    level: 4,
    speed: 1
  },
  {
    id: 'approach',
    label: 'Approach vector',
    text: 'Lufthansa one two three, turn right heading two seven zero, descend to four thousand feet, QNH one zero one eight.',
    readback: 'Right heading two seven zero, descend to four thousand feet, QNH one zero one eight, Lufthansa one two three.',
    description: 'Keep headings, altitude and QNH organised at speed.',
    level: 3,
    speed: 0.95
  },
  {
    id: 'taxi',
    label: 'Taxi instruction',
    text: 'Lufthansa one two three, taxi to holding point runway two five center via November four, November, hold short runway two five center.',
    readback: 'Taxi to holding point runway two five center via November four, November, hold short runway two five center, Lufthansa one two three.',
    description: 'Ground movement example that reinforces hold-short phraseology.',
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

const stageGuides: Record<StageId, { intro: string; bullets: string[]; voice: string }> = {
  overview: {
    intro: 'We begin in the Learn lounge. Each tile is a self-contained mission pack—hover one to see what unlocks next.',
    bullets: ['Unlock new tiles by scoring 80% or higher.', 'Preview lesson count and focus before you commit.'],
    voice: 'Welcome to the Learn lounge. This is where you pick a mission pack before calling live AI ATC. Unlock new tiles by scoring eighty percent or better.'
  },
  flow: {
    intro: 'Every training run follows the same rhythm. We will step through it once so you always know what is next.',
    bullets: ['Quick loop: choose, prep, practise, celebrate.', 'Swap modules anytime if you want a different vibe.'],
    voice: 'Here is the cadence we will follow. Pick a module, set up the flight, brief quickly, then practise until the score sticks.'
  },
  console: {
    intro: 'The lesson console is your sandbox. Hover, reveal and score just like you will inside Learn.',
    bullets: ['Trigger audio, type your readback, then grade it.', 'Use reveal and reset controls to stay in the flow.'],
    voice: 'Inside the lesson console you will hear the controller, reveal the script when you need it, and answer back in your own words. I will show you the key controls now.'
  },
  settings: {
    intro: 'Need a tweak? Open the ATC settings panel. A few sliders can change the challenge instantly.',
    bullets: ['Shape difficulty with audio challenge and radio quality.', 'Reset progress locally whenever you want a clean slate.'],
    voice: 'These settings let you dial in the training. Adjust audio challenge, radio quality, or clear your device when you are ready to restart.'
  },
  faq: {
    intro: 'Almost ready! Scan the quick answers and then hop into the Learn hub when you feel confident.',
    bullets: ['Remember: live AI ATC is still in closed testing for now.', 'Take the Learn hub for as many laps as you like.'],
    voice: 'Wrap up with a few quick reminders. Learn is the public trainer today, and you can enter the hub whenever you feel ready.'
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const activeModuleIndex = ref(0)
const activeFlowIndex = ref(0)
const activeConsoleIndex = ref(0)
const activeSettingIndex = ref(0)
const activeSampleIndex = ref(0)
const activeStageId = ref<StageId>('overview')
const voicePreference = ref<VoicePreference>('text')

const api = useApi()
const auth = useAuthStore()
const isAuthenticated = computed(() => auth.isAuthenticated)

const isClient = typeof window !== 'undefined'

const activeAudio = ref<HTMLAudioElement | null>(null)
const activeAudioSource = ref<'sample' | 'guide' | 'radio-check' | null>(null)
const isPlayingSample = ref(false)
const hasHeardSample = ref(false)
const sampleError = ref<string | null>(null)
const sayMeta = ref<{ radioQuality?: string; voice?: string | null; speed?: number } | null>(null)

const isCheckingRadio = ref(false)
const radioReady = ref(false)
const radioCheckError = ref<string | null>(null)
const radioCheckMeta = ref<{ radioQuality?: string; voice?: string | null; speed?: number } | null>(null)

const guideVoiceError = ref<string | null>(null)
const isGeneratingGuide = ref(false)

type SayResult = {
  dataUrl: string
  meta: { radioQuality?: string; voice?: string | null; speed?: number }
}

const stageAudioCache = new Map<StageId, SayResult>()

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
const activeFlowStep = computed(() => stepFlow[activeFlowIndex.value] ?? stepFlow[0])
const activeConsoleCard = computed(() => consoleHighlights[activeConsoleIndex.value] ?? consoleHighlights[0])
const activeSetting = computed(() => settings[activeSettingIndex.value] ?? settings[0])
const activeSample = computed(() => radioSamples[activeSampleIndex.value] ?? radioSamples[0])
const activeGuide = computed(() => stageGuides[activeStageId.value])

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
  if (!stageOrder.some((stage) => stage.id === id)) return
  activeStageId.value = id
  guideVoiceError.value = null
  stopActiveAudio()
  if (id === 'overview') {
    activeModuleIndex.value = 0
  }
  if (id === 'flow') {
    activeFlowIndex.value = 0
  }
  if (id === 'console') {
    activeConsoleIndex.value = 0
  }
  if (id === 'settings') {
    activeSettingIndex.value = 0
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

function cycleModule(direction: 1 | -1) {
  const count = moduleSummaries.length
  activeModuleIndex.value = (activeModuleIndex.value + direction + count) % count
}

function nextModule() {
  cycleModule(1)
}

function previousModule() {
  cycleModule(-1)
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

function selectSample(index: number) {
  activeSampleIndex.value = clamp(index, 0, radioSamples.length - 1)
  sampleError.value = null
  sayMeta.value = null
  stopActiveAudio()
}

function setVoicePreference(mode: VoicePreference) {
  voicePreference.value = mode
  guideVoiceError.value = null
  if (mode === 'text' && activeAudioSource.value === 'guide') {
    stopActiveAudio()
  }
  if (mode === 'radio' && isClient) {
    speakStageGuide(activeStageId.value)
  }
}

function stopActiveAudio() {
  if (activeAudio.value) {
    activeAudio.value.pause()
    activeAudio.value.currentTime = 0
    activeAudio.value = null
  }
  activeAudioSource.value = null
}

async function fetchSayAudio({
  text,
  tag,
  level,
  speed
}: {
  text: string
  tag: string
  level?: number
  speed?: number
}): Promise<SayResult> {
  const response: any = await api.post('/api/atc/say', {
    text,
    level,
    speed,
    tag,
    format: 'smallest'
  })

  const audio = response?.audio
  if (!audio?.base64) {
    throw new Error('Audio payload missing')
  }

  const mime = audio.mime || 'audio/wav'
  const dataUrl = `data:${mime};base64,${audio.base64}`

  return {
    dataUrl,
    meta: {
      radioQuality: typeof response?.radioQuality === 'string' ? response.radioQuality : undefined,
      voice: typeof response?.voice === 'string' ? response.voice : null,
      speed: typeof response?.speed === 'number' ? response.speed : speed
    }
  }
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
    stopActiveAudio()

    const { dataUrl, meta } = await fetchSayAudio({
      text: sample.text,
      level: sample.level,
      speed: sample.speed,
      tag: `learn-introduction-sample-${sample.id}`
    })

    const element = new Audio(dataUrl)
    activeAudio.value = element
    activeAudioSource.value = 'sample'
    element.onended = () => {
      if (activeAudio.value === element) {
        activeAudio.value = null
        activeAudioSource.value = null
      }
    }

    await element.play()

    hasHeardSample.value = true
    sayMeta.value = meta
  } catch (error: any) {
    stopActiveAudio()
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

async function playRadioCheck() {
  radioCheckError.value = null

  if (!isClient) {
    radioCheckError.value = 'Audio playback is only available in the browser.'
    return
  }

  if (isCheckingRadio.value) {
    return
  }

  if (!isAuthenticated.value) {
    radioCheckError.value = 'Sign in to OpenSquawk to run the radio check.'
    return
  }

  if (typeof Audio === 'undefined') {
    radioCheckError.value = 'Your browser does not support audio playback here.'
    return
  }

  try {
    isCheckingRadio.value = true
    stopActiveAudio()

    const { dataUrl, meta } = await fetchSayAudio({
      text: 'OpenSquawk instructor here. Radio check for the Learn orientation. You should hear me loud and clear.',
      level: 4,
      speed: 0.95,
      tag: 'learn-introduction-radio-check'
    })

    const element = new Audio(dataUrl)
    activeAudio.value = element
    activeAudioSource.value = 'radio-check'
    element.onended = () => {
      if (activeAudio.value === element) {
        activeAudio.value = null
        activeAudioSource.value = null
      }
    }

    await element.play()

    radioReady.value = true
    radioCheckMeta.value = meta
  } catch (error: any) {
    stopActiveAudio()
    radioReady.value = false
    if (error?.status === 401 || error?.response?.status === 401) {
      radioCheckError.value = 'Please sign in to your OpenSquawk account to run the radio check.'
    } else if (error?.name === 'NotAllowedError' || error?.name === 'AbortError') {
      radioCheckError.value = 'Your browser blocked playback. Press the button again to allow audio.'
    } else {
      const message =
        error?.data?.message ||
        error?.statusMessage ||
        error?.message ||
        error?.response?._data?.message
      radioCheckError.value = message ? String(message) : 'Could not complete the radio check. Try again in a moment.'
    }
  } finally {
    isCheckingRadio.value = false
  }
}

async function speakStageGuide(stageId: StageId) {
  if (voicePreference.value !== 'radio') {
    return
  }

  if (!isClient) {
    return
  }

  if (!isAuthenticated.value) {
    guideVoiceError.value = 'Sign in to unlock the radio instructor.'
    return
  }

  const guide = stageGuides[stageId]
  if (!guide?.voice) {
    return
  }

  if (typeof Audio === 'undefined') {
    guideVoiceError.value = 'Your browser does not support audio playback here.'
    return
  }

  if (isGeneratingGuide.value) {
    return
  }

  try {
    isGeneratingGuide.value = true
    guideVoiceError.value = null

    let cached = stageAudioCache.get(stageId)
    if (!cached) {
      cached = await fetchSayAudio({
        text: guide.voice,
        level: 4,
        speed: 0.95,
        tag: `learn-introduction-guide-${stageId}`
      })
      stageAudioCache.set(stageId, cached)
    }

    stopActiveAudio()

    const element = new Audio(cached.dataUrl)
    activeAudio.value = element
    activeAudioSource.value = 'guide'
    element.onended = () => {
      if (activeAudio.value === element) {
        activeAudio.value = null
        activeAudioSource.value = null
      }
    }

    await element.play()
  } catch (error: any) {
    stopActiveAudio()
    if (error?.status === 401 || error?.response?.status === 401) {
      guideVoiceError.value = 'Please sign in to your OpenSquawk account to hear the instructor.'
    } else if (error?.name === 'NotAllowedError' || error?.name === 'AbortError') {
      guideVoiceError.value = 'Your browser blocked playback. Click again to allow audio.'
    } else {
      const message =
        error?.data?.message ||
        error?.statusMessage ||
        error?.message ||
        error?.response?._data?.message
      guideVoiceError.value = message ? String(message) : 'Could not play the instructor voice right now. Try again shortly.'
    }
  } finally {
    isGeneratingGuide.value = false
  }
}

watch(activeStageId, (stage) => {
  guideVoiceError.value = null
  if (voicePreference.value === 'radio') {
    speakStageGuide(stage)
  }
})

watch(voicePreference, (mode) => {
  guideVoiceError.value = null
  if (mode === 'radio') {
    speakStageGuide(activeStageId.value)
  }
})

watch(isAuthenticated, (authed) => {
  if (!authed) {
    radioReady.value = false
    radioCheckMeta.value = null
    radioCheckError.value = null
    stageAudioCache.clear()
    if (voicePreference.value === 'radio') {
      guideVoiceError.value = 'Sign in to unlock the radio instructor.'
    }
  }
})
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
