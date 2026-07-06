<template>
  <div class="min-h-screen bg-[#050910] text-white">
    <!-- Session-start overlay: covers the (synchronous) taxi-route computation -->
    <div
        v-if="sessionStarting"
        class="fixed inset-0 z-[2000] flex flex-col items-center justify-center gap-4 bg-[#050910]/80 backdrop-blur"
        role="status"
        aria-live="polite"
    >
      <v-progress-circular indeterminate color="cyan" size="48" width="4" />
      <p class="text-sm text-white/80">{{ sessionStartingMessage }}</p>
    </div>

    <div v-if="currentScreen !== 'monitor'" class="mx-auto w-full max-w-[420px] px-4 pb-24 pt-6 sm:px-6">
      <!-- Login/Flight Selection Screen -->
      <section v-if="currentScreen === 'login'" class="space-y-6">
        <v-card class="bg-white/5 backdrop-blur border border-white/10">
          <v-card-text class="space-y-4">
            <div>
              <h2 class="text-lg font-semibold">VATSIM Integration</h2>
              <p class="text-sm text-white/70">Enter your CID to load your filtered flight plans.</p>
            </div>
            <v-text-field
                v-model="vatsimId"
                label="VATSIM CID"
                variant="outlined"
                density="comfortable"
                color="cyan"
                prepend-inner-icon="mdi-account-circle"
                hide-details
                inputmode="numeric"
            />
            <v-btn
                block
                color="cyan"
                variant="flat"
                :loading="loading"
                @click="loadFlightPlans"
            >
              Load flight plans
            </v-btn>
            <v-alert
                v-if="error"
                type="warning"
                density="compact"
                variant="tonal"
                class="bg-amber-500/10 text-amber-200"
            >
              {{ error }}
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- Demo Mode -->
        <v-card class="bg-white/5 backdrop-blur border border-white/10">
          <v-card-text class="space-y-4">
            <div>
              <h2 class="text-lg font-semibold">Demo Mode</h2>
              <p class="text-sm text-white/70">Start with a sample flight plan for testing.</p>
            </div>
            <v-btn
                block
                color="orange"
                variant="outlined"
                @click="startDemoFlight"
            >
              Start demo (DLH39A EDDF→EDDM)
            </v-btn>
          </v-card-text>
        </v-card>
      </section>

      <!-- Flight Selection Screen -->
      <section v-else-if="currentScreen === 'flightselect'" class="space-y-6">
        <div class="flex items-center justify-between">
          <v-btn icon @click="currentScreen = 'login'" class="text-cyan-300">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <h2 class="text-lg font-semibold">Available flight plans</h2>
          <v-chip color="cyan" variant="outlined" size="small">{{ vatsimId }}</v-chip>
        </div>

        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="cyan" class="mb-4" />
          <p class="text-sm text-white/70">Loading flight plans from VATSIM…</p>
        </div>

        <div v-else-if="flightPlans.length === 0" class="text-center py-8">
          <v-icon size="48" class="text-white/30 mb-4">mdi-airplane-off</v-icon>
          <p class="text-white/70">No flight plans found</p>
          <v-btn color="cyan" variant="outlined" class="mt-4" @click="currentScreen = 'login'">
            Back
          </v-btn>
        </div>

        <div v-else class="space-y-3">
          <v-card
              v-for="plan in flightPlans"
              :key="plan.id"
              class="bg-white/5 border border-white/10 backdrop-blur transition hover:border-cyan-400/60 cursor-pointer"
              @click="selectedPlan = plan; currentScreen = 'scenario'"
          >
            <v-card-text class="space-y-2">
              <div class="flex items-baseline justify-between">
                <h3 class="text-xl font-semibold tracking-tight">{{ plan.callsign }}</h3>
                <span class="text-xs uppercase text-white/50">{{ plan.aircraft?.split('/')[0] }}</span>
              </div>
              <div class="flex flex-col gap-1 text-sm text-white/70">
                <div class="flex items-center gap-2">
                  <v-icon icon="mdi-map-marker" size="16" class="text-cyan-300" />
                  <span>{{ plan.dep }} → {{ plan.arr }}</span>
                </div>
                <div v-if="plan.altitude" class="flex items-center gap-2">
                  <v-icon icon="mdi-airplane-takeoff" size="16" class="text-cyan-300" />
                  <span>FL{{ Math.floor(parseInt(plan.altitude) / 100) }}</span>
                </div>
                <div v-if="plan.assignedsquawk" class="flex items-start gap-2">
                  <v-icon icon="mdi-radar" size="16" class="text-cyan-300" />
                  <span class="text-xs text-white/60">Squawk: {{ plan.assignedsquawk }}</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </section>

      <!-- ── Scenario Picker ─────────────────────────────────────────────── -->
      <section v-else-if="currentScreen === 'scenario'" class="space-y-6">
        <!-- Header -->
        <div class="flex items-center gap-3">
          <v-btn icon variant="text" @click="currentScreen = flightPlans.length > 0 ? 'flightselect' : 'login'" class="text-cyan-300">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <div>
            <h2 class="text-lg font-semibold">Choose your scenario</h2>
            <p v-if="selectedPlan" class="text-sm text-white/50">
              {{ selectedPlan.callsign }} · {{ selectedPlan.dep }} → {{ selectedPlan.arr }}
            </p>
          </div>
        </div>

        <v-alert
            v-if="error"
            type="warning"
            density="compact"
            variant="tonal"
            closable
            class="bg-amber-500/10 text-amber-200"
            @click:close="error = ''"
        >
          {{ error }}
        </v-alert>

        <!-- Scenarios grouped by journey, each chain shown as a flow -->
        <div v-for="grp in chainGroups" :key="grp.category" class="space-y-3">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-white/35">
            {{ grp.category }}
          </p>

          <v-card
              v-for="chain in grp.chains"
              :key="chain.id"
              class="bg-white/5 border border-white/10 backdrop-blur"
              rounded="lg"
          >
            <v-card-text class="p-4 space-y-3">
              <!-- Chain header + run-the-whole-thing button -->
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2 min-w-0">
                  <v-icon :icon="chain.complete.icon" class="text-cyan-300 shrink-0" size="24" />
                  <div class="min-w-0">
                    <div class="font-semibold text-sm leading-tight">{{ chain.complete.name }}</div>
                    <div class="text-[11px] text-white/45 leading-snug truncate">{{ chain.complete.subtitle }}</div>
                  </div>
                </div>
                <v-btn size="small" color="cyan" variant="flat" class="shrink-0" @click="launchScenario(chain.complete)">
                  Fly full
                </v-btn>
              </div>

              <!-- Phase flow: tap a step to practise just that phase -->
              <div class="pm-flow">
                <template v-for="(seg, i) in chain.segments" :key="seg.id">
                  <button
                      type="button"
                      class="pm-flow-node"
                      :title="seg.subtitle"
                      @click="launchScenario(seg)"
                  >
                    <v-icon :icon="seg.icon" size="13" />
                    <span>{{ seg.name }}</span>
                  </button>
                  <v-icon v-if="i < chain.segments.length - 1" size="13" class="pm-flow-arrow">
                    mdi-arrow-right
                  </v-icon>
                </template>
              </div>
            </v-card-text>
          </v-card>
        </div>

        <!-- Standalone drills -->
        <div v-if="drillScenarios.length" class="space-y-3">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-white/35">
            Drills
          </p>
          <v-card
              v-for="drill in drillScenarios"
              :key="drill.id"
              class="bg-white/5 border border-white/10 backdrop-blur"
              rounded="lg"
          >
            <v-card-text class="p-4">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2 min-w-0">
                  <v-icon :icon="drill.icon" class="text-cyan-300 shrink-0" size="24" />
                  <div class="min-w-0">
                    <div class="font-semibold text-sm leading-tight">{{ drill.name }}</div>
                    <div class="text-[11px] text-white/45 leading-snug truncate">{{ drill.subtitle }}</div>
                  </div>
                </div>
                <v-btn size="small" color="cyan" variant="flat" class="shrink-0" @click="launchScenario(drill)">
                  Start
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </div>

        <p class="text-[10px] text-white/30 text-center">
          Tap a step to practise just that phase · “Fly full” runs the whole chain.
        </p>
      </section>

      <!-- ── Completion Screen ───────────────────────────────────────────── -->
      <section v-else-if="currentScreen === 'complete'" class="space-y-6">
        <div class="text-center space-y-3 pt-10 pb-6">
          <v-icon size="72" class="text-green-400">mdi-check-circle-outline</v-icon>
          <h2 class="text-2xl font-semibold">
            {{ completedScenario?.name ?? 'Session' }} complete
          </h2>
          <p class="text-white/50 text-sm">
            {{ selectedPlan?.callsign }} ·
            {{ selectedPlan?.dep }} → {{ selectedPlan?.arr }}
          </p>
        </div>

        <div class="space-y-3">
          <v-btn block color="cyan" variant="flat" @click="flyAgain">
            <v-icon start>mdi-refresh</v-icon>
            Fly again
          </v-btn>

          <v-btn
              v-if="oppositeScenario"
              block
              color="white"
              variant="outlined"
              @click="launchScenario(oppositeScenario!)"
          >
            <v-icon start>{{ oppositeScenario.icon }}</v-icon>
            Try {{ oppositeScenario.name }}
          </v-btn>

          <v-btn block variant="text" class="text-white/60" @click="currentScreen = 'scenario'">
            Back to scenarios
          </v-btn>
        </div>
      </section>

    </div>

    <!-- Main Monitoring Screen (full app shell) -->
    <section v-else class="pm-shell learn-theme">
      <!-- Persistent top bar (HUD): brand + freq controls + actions -->
      <header class="hud" role="banner">
        <nav class="hud-inner" aria-label="Global">
          <div class="hud-left">
            <NuxtLink class="hud-logo" to="/bridge" title="Back to bridge">
              <v-icon size="22" class="hud-logo-icon">mdi-radar</v-icon>
            </NuxtLink>
            <div class="hud-divider" aria-hidden="true"></div>
            <span class="brand">OpenSquawk</span>
            <span class="sep">|</span>
            <v-menu v-model="experienceMenu" :offset="[0, 8]" location="bottom start" transition="scale-transition">
              <template #activator="{ props }">
                <button
                    class="mode-switch"
                    type="button"
                    v-bind="props"
                    aria-haspopup="menu"
                    :aria-expanded="experienceMenu ? 'true' : 'false'"
                >
                  <span class="mode-switch-label">Live ATC</span>
                  <v-icon size="16" class="mode-switch-icon">mdi-chevron-down</v-icon>
                </button>
              </template>
              <div class="experience-menu" role="menu" aria-label="Select experience">
                <NuxtLink
                    to="/classroom"
                    role="menuitemradio"
                    class="experience-option"
                    aria-checked="false"
                >
                  <v-icon size="18" class="experience-option-icon">mdi-school</v-icon>
                  <div class="experience-option-body">
                    <div class="experience-option-title">Classroom</div>
                    <div class="experience-option-sub">Mission hub & drills</div>
                  </div>
                </NuxtLink>
                <div
                    role="menuitemradio"
                    class="experience-option is-active"
                    aria-checked="true"
                >
                  <v-icon size="18" class="experience-option-icon">mdi-radio-handheld</v-icon>
                  <div class="experience-option-body">
                    <div class="experience-option-title">Live ATC</div>
                    <div class="experience-option-sub">Live radio with AI controllers</div>
                  </div>
                  <v-icon size="16" class="experience-option-check">mdi-check</v-icon>
                </div>
              </div>
            </v-menu>

            <div class="hud-context-group" aria-label="Flight context">
              <button
                  type="button"
                  class="hud-context-btn"
                  title="Edit flight"
                  @click="showFlightSheet = true"
              >
                <span class="hud-context-callsign">{{ flightContext.callsign || 'N/A' }}</span>
                <span class="hud-context-route">{{ flightContext.dep }} → {{ flightContext.dest }}</span>
              </button>
              <v-menu
                  v-model="hudStatusMenu"
                  :offset="[8, 0]"
                  location="bottom end"
                  :close-on-content-click="false"
              >
                <template #activator="{ props }">
                  <button
                      type="button"
                      class="hud-context-toggle"
                      :class="{ 'is-open': hudStatusMenu }"
                      :aria-expanded="hudStatusMenu ? 'true' : 'false'"
                      aria-label="Show flight status"
                      v-bind="props"
                  >
                    <v-icon size="16">mdi-chevron-down</v-icon>
                  </button>
                </template>
                <div class="hud-status-panel" role="menu">
                  <div class="hud-status-row">
                    <span class="hud-status-key">State</span>
                    <v-chip :color="flags.in_air ? 'green' : 'grey'" size="x-small" variant="flat">
                      {{ flags.in_air ? 'IN-AIR' : 'GROUND' }}
                    </v-chip>
                  </div>
                  <div class="hud-status-row">
                    <span class="hud-status-key">Unit</span>
                    <v-chip color="cyan" size="x-small" variant="outlined">{{ flags.current_unit }}</v-chip>
                  </div>
                  <div class="hud-status-row">
                    <span class="hud-status-key">Emergency</span>
                    <v-chip :color="flags.emergency_active ? 'red' : 'grey'" size="x-small" variant="outlined">
                      {{ flags.emergency_active ? 'ACTIVE' : 'NONE' }}
                    </v-chip>
                  </div>
                  <div class="hud-status-row">
                    <span class="hud-status-key">Radio checks</span>
                    <span class="hud-status-val">{{ flags.radio_checks_done || 0 }}</span>
                  </div>
                  <div class="hud-status-row">
                    <span class="hud-status-key">Off-schema</span>
                    <span class="hud-status-val">{{ flags.off_schema_count || 0 }}</span>
                  </div>
                </div>
              </v-menu>
            </div>
          </div>

          <div class="hud-center">
            <div class="freq-control-group" aria-label="Frequency controls">
              <div class="freq-stack">
                <HoldSelect
                    :options="presetOptions"
                    placement="down"
                    title="Select standby frequency"
                    dense
                    menu-class="freq-hold-menu"
                    @select="onPresetSelectStandby"
                >
                  <template #default="{ open }">
                    <button type="button" class="freq-chip freq-chip-sby" :class="{ 'is-open': open }">
                      <span class="freq-chip-tag">SBY</span>
                      <span class="freq-chip-value-sm">{{ frequencies.standby || '---' }}</span>
                    </button>
                  </template>
                  <template #option="{ option }">
                    <v-tooltip :text="`Source: ${option.sourceLabel}`" location="end" open-delay="200">
                      <template #activator="{ props: tip }">
                        <div v-bind="tip" class="freq-option">
                          <div class="freq-option-main">
                            <span class="freq-option-label">{{ option.label }}</span>
                            <span class="freq-option-sub">{{ option.sublabel }}</span>
                          </div>
                          <span class="freq-option-source" :aria-label="`Source ${option.sourceLabel}`">
                            {{ option.sourceLabel }}
                          </span>
                        </div>
                      </template>
                    </v-tooltip>
                  </template>
                  <template #footer="{ close }">
                    <form class="freq-manual" @submit.prevent="applyManualFrequency('standby', close)">
                      <input
                          v-model="manualFreqStandby"
                          class="freq-manual-input"
                          type="text"
                          inputmode="decimal"
                          placeholder="Manuell, z.B. 121.500"
                          maxlength="7"
                          aria-label="Manual standby frequency"
                      >
                      <button type="submit" class="freq-manual-btn" :disabled="!normalizeManualFreq(manualFreqStandby)">SET</button>
                    </form>
                  </template>
                </HoldSelect>
                <HoldSelect
                    :options="presetOptions"
                    placement="down"
                    title="Select active frequency"
                    dense
                    menu-class="freq-hold-menu"
                    @select="onPresetSelectActive"
                >
                  <template #default="{ open }">
                    <button type="button" class="freq-chip freq-chip-act" :class="{ 'is-open': open }">
                      <span class="freq-chip-tag">ACT</span>
                      <span class="freq-chip-value">{{ frequencies.active || '---' }}</span>
                    </button>
                  </template>
                  <template #option="{ option }">
                    <v-tooltip :text="`Source: ${option.sourceLabel}`" location="end" open-delay="200">
                      <template #activator="{ props: tip }">
                        <div v-bind="tip" class="freq-option">
                          <div class="freq-option-main">
                            <span class="freq-option-label">{{ option.label }}</span>
                            <span class="freq-option-sub">{{ option.sublabel }}</span>
                          </div>
                          <span class="freq-option-source" :aria-label="`Source ${option.sourceLabel}`">
                            {{ option.sourceLabel }}
                          </span>
                        </div>
                      </template>
                    </v-tooltip>
                  </template>
                  <template #footer="{ close }">
                    <form class="freq-manual" @submit.prevent="applyManualFrequency('active', close)">
                      <input
                          v-model="manualFreqActive"
                          class="freq-manual-input"
                          type="text"
                          inputmode="decimal"
                          placeholder="Manuell, z.B. 121.500"
                          maxlength="7"
                          aria-label="Manual active frequency"
                      >
                      <button type="submit" class="freq-manual-btn" :disabled="!normalizeManualFreq(manualFreqActive)">SET</button>
                    </form>
                  </template>
                </HoldSelect>
              </div>

              <button
                  type="button"
                  class="freq-swap-btn"
                  aria-label="Swap active and standby frequencies"
                  @click="swapFrequencies"
              >
                <v-icon :class="{ 'swap-animation': swapAnimation }">mdi-swap-vertical</v-icon>
              </button>
            </div>

            <HoldSelect
                :options="readabilityOptions"
                placement="down"
                title="Readability"
                @select="onReadabilitySelect"
            >
              <template #default="{ open }">
                <button type="button" class="signal-chip" :class="{ 'is-open': open }" aria-label="Set readability">
                  <span class="signal-bars">
                    <span
                        v-for="i in 5"
                        :key="i"
                        class="signal-bar"
                        :class="{ 'signal-active': i <= signalStrength }"
                    />
                  </span>
                </button>
              </template>
            </HoldSelect>
          </div>

          <div class="hud-right">
            <v-tooltip
                v-if="bridgeConnected"
                :text="bridgeSimActiveFreq ? `SimBridge connected · COM1 ${bridgeSimActiveFreq}` : 'SimBridge connected'"
                location="bottom"
            >
              <template #activator="{ props }">
                <span class="bridge-badge" v-bind="props" role="status" aria-label="SimBridge connected">
                  <span class="bridge-badge-dot" aria-hidden="true"></span>
                  <v-icon size="15">mdi-bridge</v-icon>
                  <span class="bridge-badge-label">Bridge</span>
                </span>
              </template>
            </v-tooltip>
            <button
                type="button"
                class="btn ghost"
                :title="helpLang === 'de' ? 'Hilfe — wie funktioniert /pm' : 'Help — how /pm works'"
                @click="openHelp"
            >
              <v-icon size="18">mdi-help-circle-outline</v-icon>
              <span class="btn-label">{{ helpLang === 'de' ? 'Hilfe' : 'Help' }}</span>
            </button>
            <button
                type="button"
                class="btn ghost"
                title="Fehler melden"
                :disabled="bugReportCapturing"
                @click="openBugReport"
            >
              <v-icon size="18">{{ bugReportCapturing ? 'mdi-loading mdi-spin' : 'mdi-bug-outline' }}</v-icon>
              <span class="btn-label">{{ bugReportCapturing ? '…' : 'Bug' }}</span>
            </button>
            <NuxtLink class="btn ghost" to="/feedback" title="Share feedback or ideas">
              <v-icon size="18">mdi-message-draw</v-icon>
              <span class="btn-label">Feedback</span>
            </NuxtLink>
            <button
                type="button"
                class="btn ghost"
                title="Settings"
                @click="showSettingsSheet = true"
            >
              <v-icon size="18">mdi-cog</v-icon>
              <span class="btn-label">Settings</span>
            </button>
            <NuxtLink class="btn ghost" to="/logout" title="Logout">
              <v-icon size="18">mdi-logout</v-icon>
              <span class="btn-label">Logout</span>
            </NuxtLink>
          </div>
        </nav>
      </header>

      <div class="pm-body">
        <!-- Main tab content -->
        <main class="pm-main">
          <div class="pm-main-inner">
            <!-- =============== FUNK TAB =============== -->
            <!-- Expected Communication (learning aid) -->
            <div
                v-show="activeTab === 'funk'"
                v-if="learningMode && (displayControllerSay || displayExpectedPhrase)"
                class="pm-block"
            >
              <v-card class="bg-white/5 border border-white/10">
                <v-card-text class="space-y-3">
                  <div class="flex items-center justify-between">
                    <p class="text-xs uppercase tracking-[0.3em] text-white/40">Expected communication</p>
                    <v-tooltip :text="showRadioPronunciation ? 'Switch to plain text' : 'Switch to radio pronunciation'" location="top">
                      <template #activator="{ props: tip }">
                        <v-btn
                            v-bind="tip"
                            :icon="showRadioPronunciation ? 'mdi-text' : 'mdi-radio'"
                            size="x-small"
                            variant="text"
                            :color="showRadioPronunciation ? 'cyan' : 'white'"
                            @click="showRadioPronunciation = !showRadioPronunciation"
                        />
                      </template>
                    </v-tooltip>
                  </div>

                  <div v-if="displayControllerSay" class="space-y-2 rounded-2xl bg-green-500/10 border border-green-500/20 p-3 text-sm">
                    <div class="flex items-center gap-2 text-green-300">
                      <v-icon size="16">mdi-radio-tower</v-icon>
                      <span class="text-xs uppercase font-semibold">ATC</span>
                    </div>
                    <p class="font-mono text-white">{{ displayControllerSay }}</p>
                  </div>

                  <div v-if="displayExpectedPhrase" class="space-y-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 p-3 text-sm">
                    <div class="flex items-center gap-2 text-blue-300">
                      <v-icon size="16">mdi-account-pilot</v-icon>
                      <span class="text-xs uppercase font-semibold">Pilot (You)</span>
                    </div>
                    <p class="font-mono text-white">{{ displayExpectedPhrase }}</p>
                  </div>
                </v-card-text>
              </v-card>
            </div>

            <!-- Input mode switch: voice / text -->
            <div v-show="activeTab === 'funk'" class="pm-block">
              <div class="pm-seg">
                <button
                    type="button"
                    class="pm-seg-btn"
                    :class="{ 'is-active': inputMode === 'voice' }"
                    @click="inputMode = 'voice'"
                >
                  <v-icon size="18">mdi-microphone</v-icon>
                  <span>Voice</span>
                </button>
                <button
                    type="button"
                    class="pm-seg-btn"
                    :class="{ 'is-active': inputMode === 'text' }"
                    @click="inputMode = 'text'"
                >
                  <v-icon size="18">mdi-keyboard</v-icon>
                  <span>Text</span>
                </button>
              </div>
            </div>

            <!-- Push to Talk (voice mode) -->
            <div v-show="activeTab === 'funk' && inputMode === 'voice'" class="pm-block">
              <v-sheet class="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/10 to-transparent p-4 shadow-lg">
                <v-alert
                    v-if="!micPermission"
                    type="info"
                    variant="tonal"
                    class="bg-cyan-500/10 text-cyan-100 mb-4"
                    density="compact"
                >
                  Microphone permission required for push-to-talk.
                  <template #append>
                    <v-btn color="cyan" size="small" variant="flat" @click="requestMicAccess">Allow</v-btn>
                  </template>
                </v-alert>

                <ClientOnly>
                  <div
                      class="ptt-pad flex h-52 lg:h-60 items-center justify-center rounded-2xl border text-center transition cursor-pointer"
                      :class="isRecording ? 'border-green-400/40 ring-4 ring-green-400/40 bg-green-500/10' : 'border-white/10 ring-1 ring-white/5 bg-black/40'"
                      @touchstart.prevent="startRecording(false)"
                      @touchend.prevent="stopRecording"
                      @touchcancel.prevent="stopRecording"
                      @mousedown.prevent="startRecording(false)"
                      @mouseup.prevent="stopRecording"
                      @mouseleave="stopRecording"
                  >
                    <div class="space-y-1">
                      <v-icon
                          :icon="isRecording ? 'mdi-access-point' : 'mdi-radio-handheld'"
                          size="44"
                          :class="isRecording ? 'text-green-400 animate-pulse' : 'text-cyan-300'"
                      />
                      <p
                          class="text-[11px] uppercase tracking-[0.35em] mt-1"
                          :class="isRecording ? 'text-green-300' : 'text-white/40'"
                      >
                        {{ isRecording ? 'Transmitting' : 'Hold to transmit' }}
                      </p>
                      <p
                          v-if="bridgePttConnected"
                          class="text-[10px] uppercase tracking-[0.25em] flex items-center justify-center gap-1.5"
                          :class="isRecording ? 'text-green-300' : 'text-cyan-300/70'"
                      >
                        <span
                            class="inline-block h-1.5 w-1.5 rounded-full"
                            :class="isRecording ? 'bg-green-400 animate-pulse' : 'bg-cyan-300/60'"
                        />
                        {{ isRecording ? 'Hotkey transmitting' : 'Hotkey armed' }}
                      </p>
                      <p class="pt-2 text-4xl font-bold font-mono tracking-tight">{{ frequencies.active || '---' }}</p>
                      <p class="text-xs text-white/45">Active frequency</p>
                    </div>
                  </div>
                </ClientOnly>
              </v-sheet>
            </div>

            <!-- Manual text input (text mode) -->
            <div v-show="activeTab === 'funk' && inputMode === 'text'" class="pm-block">
              <v-card class="bg-white/5 border border-white/10">
                <v-card-text class="space-y-3">
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold">Text Input</h3>
                    <v-chip size="small" color="cyan" variant="outlined" class="font-mono">{{ frequencies.active || '---' }}</v-chip>
                  </div>
                  <v-text-field
                      v-model="pilotInput"
                      label="Pilot Transmission (Text)"
                      variant="outlined"
                      color="cyan"
                      hide-details
                      @keyup.enter="sendPilotText"
                      append-inner-icon="mdi-send"
                      @click:append-inner="sendPilotText"
                  />

                  <div v-if="backendExpectedPhrase" class="space-y-1">
                    <p class="text-[11px] uppercase tracking-[0.25em] text-white/40">Suggested phrase</p>
                    <div class="flex flex-wrap gap-2">
                      <v-chip
                          size="small"
                          color="cyan"
                          variant="outlined"
                          class="cursor-pointer text-xs font-mono"
                          @click="pilotInput = backendExpectedPhrase"
                      >
                        {{ backendExpectedPhrase }}
                      </v-chip>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>

            <!-- Last Transmission (funk) -->
            <div
                v-show="activeTab === 'funk'"
                v-if="lastTransmission"
                class="pm-block"
            >
              <v-card
                  :class="[
                    'border backdrop-blur',
                    lastTransmissionFaulty
                      ? 'bg-red-500/10 border-red-400/30'
                      : 'bg-cyan-500/10 border-cyan-400/20'
                  ]"
              >
                <v-card-text class="space-y-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <v-icon
                          icon="mdi-microphone-outline"
                          size="16"
                          :class="lastTransmissionFaulty ? 'text-red-300' : 'text-cyan-300'"
                      />
                      <span
                          class="text-xs uppercase tracking-[0.3em]"
                          :class="lastTransmissionFaulty ? 'text-red-300' : 'text-cyan-300'"
                      >
                        Last transmission
                      </span>
                    </div>
                    <div class="flex flex-wrap items-center gap-1">
                      <v-chip
                          v-if="lastTransmissionFaulty"
                          size="x-small"
                          color="red"
                          variant="flat"
                      >
                        Faulty
                      </v-chip>
                      <v-btn
                          variant="text"
                          size="small"
                          :color="lastTransmissionFaulty ? 'red' : 'amber'"
                          class="text-[0.65rem] uppercase tracking-[0.3em]"
                          @click="startTransmissionIssueFlow"
                      >
                        <template #prepend>
                          <v-icon size="16">mdi-alert-circle-outline</v-icon>
                        </template>
                        {{ lastTransmissionFaulty ? 'Edit issue' : 'Mark as faulty' }}
                      </v-btn>
                      <v-btn
                          v-if="lastTransmissionFaulty"
                          variant="text"
                          size="small"
                          color="cyan"
                          class="text-[0.65rem] uppercase tracking-[0.3em]"
                          @click="resetLastTransmissionFault"
                      >
                        <template #prepend>
                          <v-icon size="16">mdi-restore</v-icon>
                        </template>
                        Reset
                      </v-btn>
                      <v-btn
                          variant="text"
                          size="small"
                          color="cyan"
                          class="text-[0.65rem] uppercase tracking-[0.3em]"
                          @click="clearLastTransmission"
                      >
                        <template #prepend>
                          <v-icon size="16">mdi-close</v-icon>
                        </template>
                        Delete
                      </v-btn>
                    </div>
                  </div>
                  <p class="text-sm text-white font-mono whitespace-pre-line">{{ lastTransmission }}</p>
                  <div
                      v-if="lastTransmissionFaulty"
                      class="space-y-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2"
                  >
                    <p class="text-xs uppercase tracking-[0.25em] text-red-200/80">Issue description</p>
                    <p v-if="lastTransmissionFaultNote" class="text-sm text-red-100">
                      {{ lastTransmissionFaultNote }}
                    </p>
                    <p v-else class="text-xs text-red-200/70">
                      Marked as faulty.
                    </p>
                  </div>
                </v-card-text>
              </v-card>
            </div>

            <!-- =============== LOG TAB (mobile only) =============== -->
            <div v-show="activeTab === 'log'" class="pm-block pm-log-tab">
              <CommLog :entries="log" :limit="20" @clear="clearLog" />
            </div>

          </div>
        </main>

        <!-- Desktop log rail -->
        <aside class="pm-lograil">
          <!-- STT readback check: what was recognised vs missing in the last call. -->
          <div v-if="lastReadbackReport.length" class="pm-readback-check">
            <div class="pm-readback-head">
              <v-icon size="15">mdi-magnify-scan</v-icon>
              <span>Readback check</span>
            </div>
            <p v-if="lastReadbackTranscript" class="pm-readback-heard">heard: “{{ lastReadbackTranscript }}”</p>
            <div
                v-for="r in lastReadbackReport"
                :key="r.field"
                class="pm-readback-row"
                :class="r.matched ? 'is-ok' : 'is-missing'"
            >
              <v-icon size="13">{{ r.matched ? 'mdi-check-circle' : 'mdi-close-circle' }}</v-icon>
              <span class="pm-readback-text">
                <span class="pm-readback-field">{{ r.field }}</span>
                = <span class="pm-readback-expected">{{ r.expected || '—' }}</span>
                <template v-if="r.matched"> → “{{ r.matched_via }}”</template>
                <template v-else>
                  → not recognised<span v-if="r.accepted_forms.length" class="pm-readback-forms">
                    (say: {{ r.accepted_forms.join(' / ') }})</span>
                </template>
              </span>
            </div>
          </div>
          <CommLog :entries="log" :limit="30" dense @clear="clearLog" />
        </aside>
      </div>

      <!-- Bottom nav (mobile) -->
      <nav class="pm-bottomnav">
        <button
            v-for="tab in visibleTabs"
            :key="tab.id"
            type="button"
            class="pm-navbtn"
            :class="{ 'is-active': activeTab === tab.id }"
            @click="activeTab = tab.id"
        >
          <v-icon size="22">{{ tab.icon }}</v-icon>
          <span>{{ tab.label }}</span>
        </button>
      </nav>

      <!-- Debug FAB (bottom-left) -->
      <button
          v-if="debugMode"
          type="button"
          class="debug-fab"
          :class="{ 'is-open': showDebugDrawer }"
          :aria-pressed="showDebugDrawer ? 'true' : 'false'"
          :aria-label="showDebugDrawer ? 'Close debug panel' : 'Open debug panel'"
          title="Debug panel"
          @click="showDebugDrawer = !showDebugDrawer"
      >
        <v-icon size="22">{{ showDebugDrawer ? 'mdi-close' : 'mdi-bug' }}</v-icon>
      </button>

      <!-- Debug drawer (left, non-blocking) -->
      <Transition name="debug-drawer">
        <aside
            v-if="showDebugDrawer && debugMode"
            class="debug-drawer"
            role="complementary"
            aria-label="Debug panel"
        >
          <header class="debug-drawer-head">
            <div class="flex items-center gap-2">
              <v-icon size="18" color="orange">mdi-bug</v-icon>
              <h3 class="text-base font-semibold">Debug</h3>
              <v-chip size="x-small" color="grey" variant="outlined">LLM</v-chip>
            </div>
            <button
                type="button"
                class="debug-drawer-close"
                aria-label="Close debug panel"
                @click="showDebugDrawer = false"
            >
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </header>

          <div class="debug-drawer-body">
            <v-card
                v-if="simulationRunning || simulationTrace.length"
                class="bg-white/5 border border-white/10 mb-3"
            >
              <v-card-text class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <h4 class="text-sm font-semibold">Simulation Trace</h4>
                    <v-chip size="x-small" color="cyan" variant="outlined">
                      {{ completedPilotSteps }} / {{ simulationStepCount }}
                    </v-chip>
                  </div>
                  <v-chip size="x-small" :color="simulationRunning ? 'orange' : 'grey'" variant="tonal">
                    {{ simulationRunning ? 'Running' : 'Ready' }}
                  </v-chip>
                </div>

                <v-alert
                    v-if="simulationError"
                    type="warning"
                    variant="tonal"
                    density="compact"
                    class="bg-amber-500/10 text-amber-200"
                >
                  {{ simulationError }}
                </v-alert>

                <div
                    v-if="simulationRunning && simulationTrace.length === 0"
                    class="text-xs text-white/60"
                >
                  Simulation initializing...
                </div>

                <div v-else class="space-y-2 max-h-60 overflow-y-auto pr-1">
                  <div
                      v-for="(entry, idx) in simulationTrace"
                      :key="idx"
                      class="rounded-xl border border-white/10 bg-black/40 p-2 space-y-1"
                  >
                    <div class="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-white/40">
                      <span>{{ entry.label }}</span>
                      <span class="text-white/60">{{ entry.id }}</span>
                    </div>
                    <div v-if="entry.kind === 'pilot' || entry.kind === 'atc'" class="space-y-1">
                      <p class="text-xs font-mono text-white">{{ entry.payload?.text }}</p>
                      <p class="text-[10px] text-white/50 font-mono">{{ entry.payload?.normalized }}</p>
                    </div>
                    <pre
                        v-else-if="entry.payload"
                        class="text-[10px] text-white/60 font-mono whitespace-pre-wrap"
                    >{{ formatTracePayload(entry.payload) }}</pre>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <v-card class="bg-white/5 border border-white/10">
              <v-card-text class="space-y-3">
                <div class="flex items-center justify-between">
                  <h4 class="text-sm font-semibold">Flow Insights</h4>
                </div>

                <div class="flex items-center justify-between text-[10px] text-white/50">
                  <span>Session: {{ sessionLabel }}</span>
                  <div class="flex flex-wrap gap-1" v-if="traceAutoSelection || (traceFallback?.used) || timelineUsedFallback">
                    <v-chip v-if="traceAutoSelection" size="x-small" color="cyan" variant="outlined">
                      Auto: {{ traceAutoSelection.id }}
                    </v-chip>
                    <v-chip v-if="timelineUsedFallback" size="x-small" color="orange" variant="tonal">
                      Fallback candidates
                    </v-chip>
                    <v-chip v-if="traceFallback?.used" size="x-small" color="red" variant="tonal">
                      Fallback: {{ traceFallback.reason || 'triggered' }}
                    </v-chip>
                  </div>
                </div>

                <div class="space-y-2 rounded-xl border border-white/10 bg-black/30 p-2">
                  <p class="text-[10px] uppercase tracking-[0.25em] text-white/40">Current node</p>
                  <p class="font-mono text-xs text-white">{{ debugState?.id || '—' }}</p>
                  <p class="text-[10px] text-white/50">
                    {{ debugState ? `${debugState.role} • ${debugState.phase}` : 'N/A' }}
                    <span v-if="debugState?.frequencyName" class="ml-1 text-white/40">({{ debugState.frequencyName }})</span>
                  </p>
                  <p v-if="debugState?.sayPlain" class="text-[11px] text-white/70">
                    Auto (LLM): <span class="font-mono text-white">{{ debugState.sayPlain }}</span>
                  </p>
                  <p v-if="debugState?.sayNormalized" class="text-[10px] text-white/40">
                    Radio: {{ debugState.sayNormalized }}
                  </p>
                </div>

                <div>
                  <p class="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2">Upcoming decisions</p>
                  <div v-if="debugNextStates.length" class="space-y-2">
                    <div
                        v-for="state in debugNextStates"
                        :key="state.id"
                        class="space-y-1 rounded-xl border border-white/10 bg-black/30 p-2"
                    >
                      <div class="flex items-start justify-between gap-2">
                        <div>
                          <p class="font-mono text-xs text-white">{{ state.id }}</p>
                          <p class="text-[10px] text-white/50">
                            {{ state.role || '—' }} • {{ state.phase || '—' }}
                            <span v-if="state.frequencyName" class="ml-1 text-white/40">({{ state.frequencyName }})</span>
                          </p>
                        </div>
                        <v-chip
                            size="x-small"
                            color="cyan"
                            variant="outlined"
                            class="cursor-pointer"
                            @click="forceMove(state.id)"
                        >
                          Jump
                        </v-chip>
                      </div>
                      <p v-if="state.sayPlain" class="text-[11px] text-white/70">
                        ATC: <span class="font-mono text-white">{{ state.sayPlain }}</span>
                      </p>
                      <p v-if="state.sayNormalized" class="text-[10px] text-white/40">
                        Radio: {{ state.sayNormalized }}
                      </p>
                    </div>
                  </div>
                  <p v-else class="text-[10px] text-white/50">No further decisions available.</p>
                </div>

                <div class="space-y-2 rounded-xl border border-white/10 bg-black/30 p-2">
                  <p class="text-[10px] uppercase tracking-[0.25em] text-white/40">Decision timeline</p>
                  <div v-if="timelineSteps.length" class="space-y-2">
                    <div
                      v-for="(step, index) in timelineSteps"
                      :key="`${step.stage}-${index}`"
                      class="space-y-2 rounded-lg border border-white/10 bg-black/40 p-2"
                    >
                      <div class="flex items-start justify-between gap-2">
                        <div>
                          <p class="font-semibold text-xs text-white">{{ step.label }}</p>
                          <p class="text-[10px] text-white/50 uppercase tracking-[0.2em]">{{ step.stage }}</p>
                        </div>
                        <v-chip size="x-small" color="cyan" variant="outlined">
                          {{ step.candidates.length }} cand.
                        </v-chip>
                      </div>
                      <p v-if="step.note" class="text-[10px] text-white/50">{{ step.note }}</p>
                      <div v-if="step.candidates.length" class="space-y-1">
                        <div
                          v-for="candidate in step.candidates"
                          :key="candidate.id"
                          class="rounded-md border border-white/10 bg-black/30 p-1.5"
                        >
                          <div class="flex items-center justify-between gap-2">
                            <span class="font-mono text-[11px] text-white">{{ candidate.id }}</span>
                            <span class="text-[10px] text-white/50">{{ candidate.flow || 'current' }}</span>
                          </div>
                          <p v-if="candidate.summary" class="text-[10px] text-white/60 mt-0.5">{{ candidate.summary }}</p>
                        </div>
                      </div>
                      <div v-if="step.eliminated?.length" class="space-y-1">
                        <p class="text-[10px] text-red-200/80 uppercase tracking-[0.25em]">Eliminated</p>
                        <div
                          v-for="elim in step.eliminated"
                          :key="`${step.stage}-${elim.candidate.id}`"
                          class="space-y-1 rounded-md border border-red-400/30 bg-red-500/10 p-1.5 text-[10px] text-red-100"
                        >
                          <div class="flex items-center justify-between gap-2">
                            <span class="font-mono text-[11px]">{{ elim.candidate.id }}</span>
                            <span class="text-[10px] text-red-200/80">{{ elim.kind }}</span>
                          </div>
                          <p class="text-[10px] text-red-100/80">{{ elim.reason }}</p>
                          <p v-if="describeElimination(elim)" class="text-[10px] text-red-100/70">{{ describeElimination(elim) }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p v-else class="text-[10px] text-white/50">No decision timeline available yet.</p>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </aside>
      </Transition>

      <!-- Flight info sheet (opened via hud-context click) -->
      <v-dialog v-model="showFlightSheet" max-width="520">
        <v-card class="bg-[#0b101d] border border-white/10 text-white">
          <v-card-title class="flex items-center justify-between gap-2 text-base font-semibold">
            <div class="flex items-center gap-2">
              <v-icon icon="mdi-airplane" size="20" color="cyan" />
              Flight info
            </div>
            <v-btn icon="mdi-close" variant="text" size="small" @click="showFlightSheet = false" />
          </v-card-title>
          <v-card-text class="space-y-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs uppercase tracking-[0.3em] text-white/50">Active flight</p>
                <h2 class="text-2xl font-semibold">{{ flightContext.callsign || 'N/A' }}</h2>
                <p class="text-sm text-white/70">{{ flightContext.dep }} → {{ flightContext.dest }}</p>
              </div>
              <div class="text-right space-y-1">
                <v-chip
                    :color="flags.in_air ? 'green' : 'grey'"
                    variant="flat"
                    size="small"
                >
                  {{ flags.in_air ? 'IN-AIR' : 'GROUND' }}
                </v-chip>
                <div class="flex gap-1 justify-end">
                  <v-chip size="x-small" :color="flags.emergency_active ? 'red' : 'grey'" variant="outlined">
                    EMERG
                  </v-chip>
                  <v-chip size="x-small" color="cyan" variant="outlined">
                    {{ flags.current_unit }}
                  </v-chip>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p class="text-xs text-white/40 uppercase tracking-wider">Stand</p>
                <p class="text-white/80 font-mono">{{ vars.stand }}</p>
              </div>
              <div>
                <p class="text-xs text-white/40 uppercase tracking-wider">Runway</p>
                <p class="text-white/80 font-mono">{{ vars.runway }}</p>
              </div>
              <div>
                <p class="text-xs text-white/40 uppercase tracking-wider">Squawk</p>
                <p class="text-white/80 font-mono">{{ vars.squawk }}</p>
              </div>
              <div>
                <p class="text-xs text-white/40 uppercase tracking-wider">SID</p>
                <p class="text-white/80 font-mono">{{ vars.sid }}</p>
              </div>
            </div>

            <div class="flex justify-between pt-2 border-t border-white/10">
              <div class="text-center">
                <p class="text-lg font-semibold text-cyan-300">{{ flags.radio_checks_done || 0 }}</p>
                <p class="text-xs text-white/40 uppercase tracking-wider">Radio Checks</p>
              </div>
              <div class="text-center">
                <p class="text-lg font-semibold text-orange-300">{{ flags.off_schema_count || 0 }}</p>
                <p class="text-xs text-white/40 uppercase tracking-wider">Off-Schema</p>
              </div>
              <div class="text-center">
                <p class="text-lg font-semibold text-white">{{ log.length }}</p>
                <p class="text-xs text-white/40 uppercase tracking-wider">Transmissions</p>
              </div>
            </div>

            <v-btn
                block
                color="grey"
                variant="outlined"
                size="small"
                prepend-icon="mdi-airplane-off"
                @click="backToSetup"
            >
              Select new flight
            </v-btn>
          </v-card-text>
        </v-card>
      </v-dialog>

      <!-- Settings sheet (opened via Settings button in HUD) -->
      <v-dialog v-model="showSettingsSheet" max-width="560">
        <v-card class="bg-[#0b101d] border border-white/10 text-white">
          <v-card-title class="flex items-center justify-between gap-2 text-base font-semibold">
            <div class="flex items-center gap-2">
              <v-icon icon="mdi-cog" size="20" color="cyan" />
              Settings
            </div>
            <v-btn icon="mdi-close" variant="text" size="small" @click="showSettingsSheet = false" />
          </v-card-title>
          <v-card-text class="space-y-4">
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs uppercase tracking-[0.3em] text-white/40">
                  Speech speed
                </label>
                <span class="text-xs font-mono text-white/60">{{ speechSpeedLabel }}</span>
              </div>
              <v-slider
                  v-model="speechSpeed"
                  :min="0.7"
                  :max="1.3"
                  :step="0.05"
                  color="cyan"
                  thumb-label
                  hide-details
              />
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <v-switch
                  v-model="radioEffectsEnabled"
                  color="cyan"
                  inset
                  label="Radio effects"
                  hide-details
              />
              <v-switch
                  v-model="readbackEnabled"
                  color="cyan"
                  inset
                  label="Readback voice"
                  hide-details
              />
              <v-switch
                  v-model="learningMode"
                  color="cyan"
                  inset
                  label="Learning aid (expected comm)"
                  hide-details
              />
              <v-switch
                  v-model="debugMode"
                  color="orange"
                  inset
                  label="Developer debug"
                  hide-details
              />
            </div>

            <div class="pt-2 border-t border-white/10 space-y-3">
              <div>
                <p class="text-xs uppercase tracking-[0.3em] text-white/40">Voice input</p>
                <p class="text-[11px] text-white/50 mt-1">
                  Pre-recording keeps the mic listening in the background so the start of your transmission isn't clipped.
                </p>
              </div>
              <v-switch
                  v-model="prerecEnabled"
                  color="cyan"
                  inset
                  label="Pre-recording (rolling buffer)"
                  hide-details
              />
              <div :class="{ 'opacity-50 pointer-events-none': !prerecEnabled }">
                <div class="flex items-center justify-between mb-2">
                  <label class="text-xs uppercase tracking-[0.3em] text-white/40">
                    Pre-recording lead-in
                  </label>
                  <span class="text-xs font-mono text-white/60">{{ prerecSeconds.toFixed(1) }}s</span>
                </div>
                <v-slider
                    v-model="prerecSeconds"
                    :min="0.3"
                    :max="2.5"
                    :step="0.1"
                    color="cyan"
                    thumb-label
                    hide-details
                    :disabled="!prerecEnabled"
                />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-dialog>

      <!-- Bug Report Dialog -->
      <v-dialog v-model="showBugReportDialog" max-width="680" scrollable>
        <v-card class="bg-[#0b101d] border border-white/10 text-white">
          <v-card-title class="flex items-center gap-2 text-base font-semibold pt-4 px-5">
            <v-icon icon="mdi-bug-outline" color="#f87171" size="20" />
            Fehler melden
          </v-card-title>
          <v-card-text class="space-y-4 px-5 pb-2">
            <div v-if="bugReportSuccess" class="rounded-xl bg-emerald-500/10 border border-emerald-400/30 p-4 text-center">
              <v-icon icon="mdi-check-circle-outline" color="emerald" size="32" class="mb-2" />
              <p class="text-emerald-300 font-semibold">Danke! Bug Report wurde gesendet.</p>
            </div>
            <template v-else>
              <div v-if="bugReportScreenshot" class="space-y-2">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-start gap-2">
                    <v-icon size="18" color="red" class="mt-0.5">mdi-gesture-tap-button</v-icon>
                    <div>
                      <p class="text-sm font-semibold text-white/90">Wo ist der Fehler? Zeichne einen Pfeil hin.</p>
                      <p class="text-xs text-white/55 leading-snug">
                        Klicke auf die Stelle und ziehe mit gedrückter Maustaste (am Handy: mit dem Finger)
                        zur Problemstelle. Du kannst mehrere Pfeile setzen.
                      </p>
                    </div>
                  </div>
                  <v-btn
                    v-if="bugReportArrows.length > 0"
                    size="x-small"
                    variant="text"
                    color="red"
                    prepend-icon="mdi-undo"
                    class="shrink-0"
                    @click="undoLastArrow"
                  >
                    Pfeil zurück
                  </v-btn>
                </div>
                <div class="relative rounded-xl overflow-hidden border border-white/10" style="line-height:0">
                  <img
                    ref="bugReportImgRef"
                    :src="bugReportScreenshot"
                    class="w-full block"
                    alt="Screenshot"
                    @load="setupAnnotationCanvas"
                  />
                  <canvas
                    ref="bugReportCanvasRef"
                    class="absolute inset-0 w-full h-full cursor-crosshair select-none"
                    style="touch-action:none"
                    @pointerdown="onCanvasMouseDown"
                    @pointermove="onCanvasMouseMove"
                    @pointerup="onCanvasMouseUp"
                    @pointerleave="onCanvasMouseLeave"
                    @pointercancel="onCanvasMouseLeave"
                  />
                  <span
                    v-if="bugReportArrows.length === 0"
                    class="pointer-events-none absolute inset-0 flex items-center justify-center text-center px-4"
                  >
                    <span class="rounded-full bg-black/55 px-3 py-1 text-xs text-white/85 backdrop-blur">
                      ✏️ Hier ziehen, um einen Pfeil zur Fehlerstelle zu zeichnen
                    </span>
                  </span>
                </div>
              </div>
              <div v-else class="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/50">
                Kein Screenshot verfügbar
              </div>

              <v-textarea
                v-model="bugReportComment"
                label="Was ist kaputt? Was sollte stattdessen passieren?"
                variant="outlined"
                color="red"
                rows="3"
                auto-grow
                maxlength="2000"
                counter="2000"
                hide-details="auto"
                :disabled="bugReportLoading"
              />

              <v-text-field
                v-model="bugReportContact"
                label="Dein Name / Kontakt"
                variant="outlined"
                color="red"
                density="comfortable"
                hide-details
                :disabled="bugReportLoading"
              />

              <v-alert
                v-if="bugReportError"
                type="error"
                density="compact"
                variant="tonal"
                class="bg-red-500/10 text-red-200"
              >
                {{ bugReportError }}
              </v-alert>
            </template>
          </v-card-text>
          <v-card-actions v-if="!bugReportSuccess" class="justify-end gap-2 px-5 pb-4">
            <v-btn variant="text" color="grey" :disabled="bugReportLoading" @click="showBugReportDialog = false">
              Abbrechen
            </v-btn>
            <v-btn
              color="red"
              variant="flat"
              :loading="bugReportLoading"
              :disabled="!bugReportComment.trim()"
              @click="submitBugReport"
            >
              Bug melden
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Transmission issue dialog -->
      <v-dialog v-model="showTransmissionIssueDialog" max-width="420">
        <v-card class="bg-[#0b101d] border border-white/10 text-white">
          <v-card-title class="flex items-center gap-2 text-base font-semibold">
            <v-icon icon="mdi-alert-circle-outline" color="#f87171" size="20" />
            Mark transmission as faulty
          </v-card-title>
          <v-card-text class="space-y-4 text-sm text-white/70">
            <p>
              Optionally leave a short note so the dev team can follow up on the transmission.
            </p>
            <v-textarea
                v-model="transmissionIssueNote"
                label="Issue description (optional)"
                variant="outlined"
                color="red"
                rows="3"
                auto-grow
            />
          </v-card-text>
          <v-card-actions class="justify-end gap-2">
            <v-btn variant="text" color="grey" @click="cancelTransmissionIssue">
              Cancel
            </v-btn>
            <v-btn
                v-if="lastTransmissionFaulty"
                variant="text"
                color="cyan"
                @click="removeTransmissionIssue"
            >
              Remove flag
            </v-btn>
            <v-btn color="red" variant="flat" @click="confirmTransmissionIssue">
              Save
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Help / how-it-works overlay (first-run + reopenable via the ? button) -->
      <v-dialog v-model="showHelp" max-width="560" scrollable>
        <v-card class="bg-[#0b1220] text-white border border-white/10">
          <v-card-title class="d-flex align-center justify-space-between gap-2">
            <span class="text-base font-semibold">{{ helpContent.title }}</span>
            <v-btn size="small" variant="tonal" color="cyan" @click="toggleHelpLang">
              {{ helpLang === 'de' ? 'EN' : 'DE' }}
            </v-btn>
          </v-card-title>
          <v-card-text>
            <p class="text-sm text-white/70 mb-4">{{ helpContent.intro }}</p>
            <div class="space-y-3">
              <div v-for="(step, i) in helpContent.steps" :key="i" class="flex gap-3">
                <v-icon size="22" class="text-cyan-300 shrink-0 mt-1">{{ step.icon }}</v-icon>
                <div>
                  <div class="text-sm font-semibold">{{ step.title }}</div>
                  <div class="text-[13px] text-white/65 leading-snug">{{ step.text }}</div>
                </div>
              </div>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="cyan" variant="flat" @click="dismissHelp">
              {{ helpLang === 'de' ? 'Verstanden' : 'Got it' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import useCommunicationsEngine from "../../shared/utils/communicationsEngine";
import { normalizeRadioPhrase, normalizeAtisForSpeech, DEFAULT_AIRLINE_TELEPHONY } from '../../shared/utils/radioSpeech';
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'
import { loadPizzicatoLite } from '../../shared/utils/pizzicatoLite'
import type { PizzicatoLite } from '../../shared/utils/pizzicatoLite'
import { createNoiseGenerators, getReadabilityProfile } from '../../shared/utils/radioEffects'
import { createAtisAudioLoop, type AtisAudioLoop } from '../../shared/utils/atisAudioLoop'
import type {
  CandidateTraceElimination,
  CandidateTraceEntry,
  CandidateTraceStage,
  CandidateTraceStep,
  DecisionCandidateTimeline,
  LLMDecisionTrace,
} from '../../shared/types/llm'

// ---------------------------------------------------------------------------
// Debug logger — prefix [PM] so it's easy to filter in DevTools.
// Disable at runtime: localStorage.setItem('PM_DEBUG', '0')
// Re-enable:          localStorage.setItem('PM_DEBUG', '1')
// Show trace detail:  localStorage.setItem('PM_DEBUG', 'verbose')
// ---------------------------------------------------------------------------
const pmLog = (() => {
  const level = () => {
    if (typeof localStorage === 'undefined') return 'on'
    return localStorage.getItem('PM_DEBUG') ?? 'on'
  }
  const enabled  = () => level() !== '0'
  const verbose  = () => level() === 'verbose'
  return {
    info:  (...a: any[]) => enabled() && console.log   ('[PM]', ...a),
    warn:  (...a: any[]) => enabled() && console.warn  ('[PM]', ...a),
    error: (...a: any[]) => enabled() && console.error ('[PM]', ...a),
    debug: (...a: any[]) => verbose() && console.debug ('[PM:v]', ...a),
    group: (label: string, fn: () => void) => {
      if (!enabled()) { fn(); return }
      console.groupCollapsed(`[PM] ${label}`)
      fn()
      console.groupEnd()
    },
  }
})()

// Core State
const engine = useCommunicationsEngine()
const auth = useAuthStore()
const api = useApi()
const router = useRouter()
const route = useRoute()
const radioBackend = useRadioBackend()
const config = useRuntimeConfig()

const STORAGE_KEYS = {
  selectedPlan: 'pm_selected_plan',
  vatsimId: 'pm_vatsim_id',
  prerecEnabled: 'pm_prerec_enabled',
  prerecSeconds: 'pm_prerec_seconds',
  helpSeen: 'pm_help_seen',
  helpLang: 'pm_help_lang',
} as const

// ── Help / how-it-works overlay ────────────────────────────────────────────
const HELP_CONTENT = {
  de: {
    title: 'Wie /pm funktioniert',
    intro: 'Du bist der Pilot. Du sprichst per Funk mit der Flugsicherung (ATC) und arbeitest ein realistisches Szenario ab.',
    steps: [
      { icon: 'mdi-radio-handheld', title: 'Frequenz einstellen', text: 'Stelle die aktive COM1-Frequenz auf den zuständigen Lotsen. Auf der falschen Frequenz kommt dein Funkspruch nicht durch.' },
      { icon: 'mdi-microphone', title: 'Sprechtaste (PTT)', text: 'Halte die Sprechtaste gedrückt, sprich, lass los. Beim Senden wird die Taste grün. Ein neuer Funkspruch unterbricht die laufende ATC-Ausgabe.' },
      { icon: 'mdi-repeat', title: 'Readback', text: 'Lies Anweisungen zurück (Frequenz, Piste, Squawk, Höhe …). Stimmt es nicht, sagt ATC „say again“. Nach 3 Versuchen wird übersprungen.' },
      { icon: 'mdi-alert-octagon', title: 'Notfall', text: 'Mit „Mayday“ oder „Pan-Pan“ rufst du einen Notfall aus, mit „cancel mayday“ beendest du ihn wieder.' },
      { icon: 'mdi-bug-outline', title: 'Fehler melden', text: 'Mit dem Bug-Knopf meldest du einen Fehler — die ganze Funksession wird mitgeschickt.' },
    ],
  },
  en: {
    title: 'How /pm works',
    intro: 'You are the pilot. You talk to ATC over the radio and work through a realistic scenario.',
    steps: [
      { icon: 'mdi-radio-handheld', title: 'Tune the frequency', text: 'Set the active COM1 frequency to the controller you need. On the wrong frequency your call will not get through.' },
      { icon: 'mdi-microphone', title: 'Push-to-talk (PTT)', text: 'Hold the talk button, speak, release. The pad turns green while you transmit. A new transmission cuts any ATC speech still playing.' },
      { icon: 'mdi-repeat', title: 'Read back', text: 'Read instructions back (frequency, runway, squawk, altitude …). If it is wrong ATC says “say again”. After 3 tries it is skipped.' },
      { icon: 'mdi-alert-octagon', title: 'Emergency', text: 'Say “Mayday” or “Pan-Pan” to declare an emergency, and “cancel mayday” to end it.' },
      { icon: 'mdi-bug-outline', title: 'Report a bug', text: 'Use the Bug button to report an issue — the whole radio session is attached.' },
    ],
  },
} as const

const showHelp = ref(false)
const helpLang = ref<'de' | 'en'>('de')
const helpContent = computed(() => HELP_CONTENT[helpLang.value])
const openHelp = () => { showHelp.value = true }
const dismissHelp = () => {
  showHelp.value = false
  try { window.localStorage.setItem(STORAGE_KEYS.helpSeen, '1') } catch { /* ignore */ }
}
const toggleHelpLang = () => {
  helpLang.value = helpLang.value === 'de' ? 'en' : 'de'
  try { window.localStorage.setItem(STORAGE_KEYS.helpLang, helpLang.value) } catch { /* ignore */ }
}
/** Open the help overlay automatically the first time a session is entered. */
const maybeShowFirstRunHelp = () => {
  if (typeof window === 'undefined') return
  try {
    const lang = window.localStorage.getItem(STORAGE_KEYS.helpLang)
    if (lang === 'de' || lang === 'en') helpLang.value = lang
    if (!window.localStorage.getItem(STORAGE_KEYS.helpSeen)) showHelp.value = true
  } catch { /* ignore */ }
}

let restoringFromStorage = true

const persistSelectedPlan = (plan: any | null) => {
  if (typeof window === 'undefined') return

  try {
    if (plan) {
      window.localStorage.setItem(STORAGE_KEYS.selectedPlan, JSON.stringify(plan))
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.selectedPlan)
    }
  } catch (err) {
    console.warn('Failed to persist flight selection', err)
  }
}

const {
  currentState,
  nextCandidates,
  activeFrequency,
  communicationLog: log,
  clearCommunicationLog,
  variables: vars,
  flags,
  flightContext,
  currentStep,
  availableFlows,
  activeFlow,
  sessionId: engineSessionId,
  lastDecisionTrace,
  appendLogEntry,
  patchVariables,
  patchFlags,
  initializeFlight,
  updateFrequencyVariables,
  fetchRuntimeTree,
  isReady: engineReady,
  processPilotTransmission,
  buildLLMContext,
  applyLLMDecision,
  setActiveFlow,
  moveTo: forceMove,
  moveToSilent,
  normalizeATCText,
  renderATCMessage,
  getStateDetails,
  collectAtcStatesUntilPilotTurn,
  expectedPilotPhrases,
} = engine

const backendSessionId = ref<string | null>(null)
// Last ATC utterance returned by the backend (pre-rendered, correct variables).
const lastControllerSay = ref<string | null>(null)
// Authoritative expected pilot phrase from the backend — replaces local engine rendering.
const backendExpectedPhrase = ref<string | null>(null)
// Per-field readback diagnostic from the last transmission (STT debug panel).
const lastReadbackReport = ref<import('../composables/useRadioBackend').ReadbackFieldDetail[]>([])
const lastReadbackTranscript = ref<string>('')
// Toggle: show radio pronunciation (wun, tree, squawk niner…) vs plain text.
const showRadioPronunciation = ref(false)

function toRadioSpeech(text: string): string {
  return normalizeRadioPhrase(text, {
    expandCallsigns: true,
    expandAirports: true,
    airlineMap: DEFAULT_AIRLINE_TELEPHONY,
    sidSuffixIcao: true,
  })
}

// Display helpers — apply ICAO phonetics when the toggle is on.
const displayControllerSay = computed(() =>
  lastControllerSay.value
    ? (showRadioPronunciation.value ? toRadioSpeech(lastControllerSay.value) : lastControllerSay.value)
    : null
)
const displayExpectedPhrase = computed(() =>
  backendExpectedPhrase.value
    ? (showRadioPronunciation.value ? toRadioSpeech(backendExpectedPhrase.value) : backendExpectedPhrase.value)
    : null
)

// Maps frequency_name from the flow state to the resolved airport frequency variable.
const FREQ_NAME_TO_VAR: Record<string, string> = {
  'clearance delivery': 'delivery_freq',
  'delivery':           'delivery_freq',
  'ground':             'ground_freq',
  'tower':              'tower_freq',
  'departure':          'departure_freq',
  'approach':           'approach_freq',
  'centre':             'handoff_freq',
  'center':             'handoff_freq',
  'radar':              'handoff_freq',
}

// Derived from the raw airport frequency list — always reflects the real airport
// data regardless of which flow snapshot is active.  Used by expectedFrequencyForState
// so the wrong-frequency check is reliable across all flow transitions.
const airportFreqMap = computed<Record<string, string>>(() => {
  const result: Record<string, string> = {}
  for (const entry of airportFrequencies.value) {
    const key = frequencyTypeMap[entry.type]
    if (key && entry.frequency && !result[key]) {
      result[key] = entry.frequency
    }
  }
  return result
})

function expectedFrequencyForState(): string | null {
  const freqName = (currentState.value as any)?.frequency_name as string | undefined
  if (!freqName) return null
  const varKey = FREQ_NAME_TO_VAR[freqName.toLowerCase()]
  if (!varKey) return null
  // airportFreqMap is the authoritative source — it comes from the live airport
  // data and is unaffected by flow-snapshot switches.  Fall back to the engine
  // variable store for any edge-case where airport data is missing.
  return airportFreqMap.value[varKey] ?? ((vars as any).value[varKey] as string ?? null)
}

// All real frequencies published for a logical position. Some airports list
// several for the same role (e.g. EDDM has two Tower frequencies, 118.700 and
// 120.500) — the wrong-frequency gate accepts ANY of them, while
// expectedFrequencyForState() still returns the primary one for the prompt.
const airportFreqListMap = computed<Record<string, string[]>>(() => {
  const result: Record<string, string[]> = {}
  for (const entry of airportFrequencies.value) {
    const key = frequencyTypeMap[entry.type]
    if (key && entry.frequency) {
      (result[key] ||= []).push(entry.frequency)
    }
  }
  return result
})

function acceptedFrequenciesForState(): string[] {
  const freqName = (currentState.value as any)?.frequency_name as string | undefined
  if (!freqName) return []
  const varKey = FREQ_NAME_TO_VAR[freqName.toLowerCase()]
  if (!varKey) return []
  const all = [...(airportFreqListMap.value[varKey] ?? [])]
  const fromVars = (vars as any).value[varKey] as string | undefined
  if (fromVars) all.push(fromVars)
  return Array.from(new Set(all.map(normalizedFrequencyValue).filter(Boolean)))
}

const lastTransmission = ref('')
const lastTransmissionFaulty = ref(false)
const lastTransmissionFaultNote = ref('')
const showTransmissionIssueDialog = ref(false)
const transmissionIssueNote = ref('')

function setLastTransmission(text: string) {
  lastTransmission.value = text
  lastTransmissionFaulty.value = false
  lastTransmissionFaultNote.value = ''
}

function clearLastTransmission() {
  setLastTransmission('')
}

function markLastTransmissionFault(note: string) {
  if (!lastTransmission.value) return
  lastTransmissionFaulty.value = true
  lastTransmissionFaultNote.value = note
}

function resetLastTransmissionFault() {
  lastTransmissionFaulty.value = false
  lastTransmissionFaultNote.value = ''
}

function startTransmissionIssueFlow() {
  if (!lastTransmission.value) return
  transmissionIssueNote.value = lastTransmissionFaultNote.value
  showTransmissionIssueDialog.value = true
}

function confirmTransmissionIssue() {
  if (!lastTransmission.value) {
    showTransmissionIssueDialog.value = false
    return
  }

  markLastTransmissionFault(transmissionIssueNote.value.trim())
  showTransmissionIssueDialog.value = false
}

function removeTransmissionIssue() {
  resetLastTransmissionFault()
  showTransmissionIssueDialog.value = false
}

function cancelTransmissionIssue() {
  showTransmissionIssueDialog.value = false
}

const clearLog = () => {
  clearCommunicationLog()
  clearLastTransmission()
}

const activeFlowInfo = computed(() => {
  const slug = activeFlow.value
  const flows = availableFlows.value
  const entry = (slug ? flows.find((flow) => flow.slug === slug) : undefined) || flows.find((flow) => flow.mode === 'main') || flows[0]
  const resolvedSlug = entry?.slug || slug || ''
  const name = entry?.name || resolvedSlug || 'Main Flow'
  const description = entry?.description || ''
  const mode = entry?.mode || (resolvedSlug && resolvedSlug === slug ? 'parallel' : 'parallel')
  const modeLabel = mode === 'main' ? 'Main' : mode === 'linear' ? 'Linear' : 'Parallel'
  return { slug: resolvedSlug, name, description, mode, modeLabel }
})

const decisionTrace = computed(() => lastDecisionTrace.value)
const timelineSteps = computed(() => decisionTrace.value?.candidateTimeline?.steps ?? [])
const timelineUsedFallback = computed(() => Boolean(decisionTrace.value?.candidateTimeline?.fallbackUsed))
const traceAutoSelection = computed(() => decisionTrace.value?.autoSelection ?? null)
const traceFallback = computed(() => decisionTrace.value?.fallback ?? null)
const sessionLabel = computed(() => engineSessionId.value || flags.value.session_id || '-')

const VALID_TRACE_STAGES: ReadonlySet<CandidateTraceStage> = new Set(
  [
    'regex_candidates',
    'regex_filtered',
    'condition_filtered',
    'fallback_candidates',
    'fallback_filtered',
    'final'
  ] as CandidateTraceStage[]
)

const cloneForTrace = <T>(value: T): T => {
  if (value === undefined || value === null) {
    return value
  }
  try {
    return JSON.parse(JSON.stringify(value))
  } catch (err) {
    console.warn('Failed to clone trace payload, returning original value.', err)
    return value
  }
}

const isPlainObject = (value: unknown): value is Record<string, any> => {
  return typeof value === 'object' && value !== null
}

const ensureTraceCalls = (calls: unknown): LLMDecisionTrace['calls'] => {
  if (!Array.isArray(calls)) {
    return []
  }
  return calls
    .filter((entry): entry is Record<string, any> => isPlainObject(entry))
    .map((entry) => {
      const normalized: LLMDecisionTrace['calls'][number] = {
        stage: entry.stage === 'readback-check' ? 'readback-check' : 'decision',
        request: isPlainObject(entry.request) ? cloneForTrace(entry.request) : {},
      }
      if ('response' in entry) {
        normalized.response = cloneForTrace(entry.response)
      }
      if (typeof entry.rawResponseText === 'string') {
        normalized.rawResponseText = entry.rawResponseText
      }
      if (typeof entry.error === 'string') {
        normalized.error = entry.error
      }
      return normalized
    })
}

const normalizeTraceFallback = (raw: unknown): LLMDecisionTrace['fallback'] | undefined => {
  if (!isPlainObject(raw)) {
    return undefined
  }
  const fallback: LLMDecisionTrace['fallback'] = {
    used: Boolean(raw.used),
  }
  if (typeof raw.reason === 'string' && raw.reason.trim().length) {
    fallback.reason = raw.reason
  }
  if (typeof raw.selected === 'string' && raw.selected.trim().length) {
    fallback.selected = raw.selected
  }
  return fallback
}

const normalizeTraceAutoSelection = (
  raw: unknown
): NonNullable<LLMDecisionTrace['autoSelection']> | undefined => {
  if (!isPlainObject(raw)) {
    return undefined
  }
  const id = typeof raw.id === 'string' && raw.id.trim().length ? raw.id : undefined
  if (!id) {
    return undefined
  }
  const flow = typeof raw.flow === 'string' && raw.flow.trim().length ? raw.flow : 'current'
  const autoSelection: NonNullable<LLMDecisionTrace['autoSelection']> = { id, flow }
  if (typeof raw.reason === 'string' && raw.reason.trim().length) {
    autoSelection.reason = raw.reason
  }
  return autoSelection
}

const normalizeTimelineCandidate = (raw: unknown): CandidateTraceEntry | null => {
  if (!isPlainObject(raw)) {
    return null
  }
  const id = typeof raw.id === 'string' && raw.id.trim().length ? raw.id : undefined
  if (!id) {
    return null
  }
  const flow = typeof raw.flow === 'string' && raw.flow.trim().length
    ? raw.flow
    : typeof raw.flow?.slug === 'string'
      ? raw.flow.slug
      : 'current'
  const candidate: CandidateTraceEntry = {
    id,
    flow,
  }
  if (typeof raw.name === 'string') {
    candidate.name = raw.name
  }
  if (typeof raw.summary === 'string') {
    candidate.summary = raw.summary
  }
  if (typeof raw.role === 'string') {
    candidate.role = raw.role
  }
  if (Array.isArray(raw.triggers)) {
    candidate.triggers = cloneForTrace(raw.triggers)
  }
  if (Array.isArray(raw.conditions)) {
    candidate.conditions = cloneForTrace(raw.conditions)
  }
  return candidate
}

const normalizeTimelineElimination = (raw: unknown): CandidateTraceElimination | null => {
  if (!isPlainObject(raw)) {
    return null
  }
  const candidate = normalizeTimelineCandidate(raw.candidate)
  if (!candidate) {
    return null
  }
  const kind: CandidateTraceElimination['kind'] = raw.kind === 'regex' ? 'regex' : 'condition'
  const reason = typeof raw.reason === 'string' && raw.reason.trim().length ? raw.reason : ''
  const elimination: CandidateTraceElimination = {
    candidate,
    kind,
    reason,
  }
  if (isPlainObject(raw.context)) {
    elimination.context = cloneForTrace(raw.context)
  }
  return elimination
}

const normalizeTimelineStep = (raw: unknown): CandidateTraceStep | null => {
  if (!isPlainObject(raw)) {
    return null
  }
  const stageCandidate = typeof raw.stage === 'string' && VALID_TRACE_STAGES.has(raw.stage as CandidateTraceStage)
    ? (raw.stage as CandidateTraceStage)
    : 'final'
  const label = typeof raw.label === 'string' && raw.label.trim().length ? raw.label : stageCandidate
  const candidates = Array.isArray(raw.candidates)
    ? raw.candidates
        .map((candidate) => normalizeTimelineCandidate(candidate))
        .filter((candidate): candidate is CandidateTraceEntry => Boolean(candidate))
    : []
  const eliminated = Array.isArray(raw.eliminated)
    ? raw.eliminated
        .map((entry) => normalizeTimelineElimination(entry))
        .filter((entry): entry is CandidateTraceElimination => Boolean(entry))
    : []
  const note = typeof raw.note === 'string' && raw.note.trim().length ? raw.note : undefined
  const step: CandidateTraceStep = {
    stage: stageCandidate,
    label,
    candidates,
  }
  if (eliminated.length) {
    step.eliminated = eliminated
  }
  if (note) {
    step.note = note
  }
  return step
}

const normalizeCandidateTimeline = (raw: unknown): DecisionCandidateTimeline | undefined => {
  if (!isPlainObject(raw)) {
    return undefined
  }
  const steps = Array.isArray(raw.steps)
    ? raw.steps
        .map((step) => normalizeTimelineStep(step))
        .filter((step): step is CandidateTraceStep => Boolean(step))
    : []
  const timeline: DecisionCandidateTimeline = { steps }
  if ('fallbackUsed' in raw) {
    timeline.fallbackUsed = Boolean((raw as any).fallbackUsed)
  } else if ('fallback_used' in raw) {
    timeline.fallbackUsed = Boolean((raw as any).fallback_used)
  }
  const autoSelected = normalizeTimelineCandidate((raw as any).autoSelected ?? (raw as any).auto_selected)
  if (autoSelected !== null && autoSelected !== undefined) {
    timeline.autoSelected = autoSelected
  }
  return timeline
}

const normalizeDecisionTraceResult = (result: any): LLMDecisionTrace | null => {
  const traceSource = isPlainObject(result?.trace) ? result.trace : undefined
  const fallbackFromTrace = normalizeTraceFallback(traceSource?.fallback)
  const timelineFromTrace = normalizeCandidateTimeline(traceSource?.candidateTimeline ?? traceSource?.timeline)
  const autoSelectionFromTrace = normalizeTraceAutoSelection(traceSource?.autoSelection ?? traceSource?.auto_selection)

  const baseTrace: LLMDecisionTrace | null = traceSource
    ? {
        calls: ensureTraceCalls(traceSource.calls),
        ...(fallbackFromTrace ? { fallback: fallbackFromTrace } : {}),
        ...(timelineFromTrace ? { candidateTimeline: timelineFromTrace } : {}),
        ...(autoSelectionFromTrace ? { autoSelection: autoSelectionFromTrace } : {}),
      }
    : null

  const candidateTimeline = timelineFromTrace
    ?? normalizeCandidateTimeline(result?.candidateTimeline ?? result?.candidate_timeline ?? result?.timeline)
  const autoSelection = autoSelectionFromTrace
    ?? normalizeTraceAutoSelection(result?.autoSelection ?? result?.auto_selection)
  const fallback = fallbackFromTrace
    ?? normalizeTraceFallback(result?.fallback ?? result?.fallbackInfo ?? result?.fallback_info)

  if (!baseTrace && !candidateTimeline && !autoSelection && !fallback) {
    return null
  }

  const trace: LLMDecisionTrace = baseTrace ?? { calls: [] }

  if (candidateTimeline && !trace.candidateTimeline) {
    trace.candidateTimeline = candidateTimeline
  }
  if (autoSelection && !trace.autoSelection) {
    trace.autoSelection = autoSelection
  }
  if (fallback && !trace.fallback) {
    trace.fallback = fallback
  }

  return trace
}

function describeElimination(entry: any): string {
  if (!entry || typeof entry !== 'object') {
    return ''
  }
  if (entry.kind === 'regex' && entry.context?.patterns?.length) {
    const patterns = entry.context.patterns
      .map((pattern: any) => pattern?.pattern)
      .filter((value: string | undefined) => Boolean(value))
      .join(', ')
    return patterns ? `Patterns: ${patterns}` : entry.reason
  }
  if (entry.kind === 'condition' && entry.context?.condition) {
    const condition = entry.context.condition
    if (condition.type === 'regex' || condition.type === 'regex_not') {
      const flag = condition.pattern ? `/${condition.pattern}/${condition.patternFlags || 'i'}` : ''
      return flag ? `Condition: ${condition.type} ${flag}` : entry.reason
    }
    const variable = condition.variable || 'value'
    const operator = condition.operator || '=='
    const expected = entry.context?.expectedValue ?? condition.value ?? '—'
    const actual = entry.context?.actualValue ?? '—'
    return `${variable} ${operator} ${expected} (actual: ${actual})`
  }
  return entry.reason
}

// ---------------------------------------------------------------------------
// Scenario definitions
// ---------------------------------------------------------------------------

interface Scenario {
  id: string
  name: string
  subtitle: string
  icon: string
  startFlow: string
  /** Display-only chain label, e.g. "Clearance → Taxi → Tower → Departure" */
  chain: string
  isComplete: boolean
  /** When true, backend will NOT follow next_flow links (single-phase practice). */
  noChain: boolean
  /**
   * Which airport from the flight plan to use for frequency lookups.
   * 'dep' = departure airport, 'arr' = arrival/destination airport.
   */
  airport: 'dep' | 'arr'
}

const SCENARIOS: Scenario[] = [
  // ── Complete chains ──────────────────────────────────────────────────────
  {
    id: 'ifr-departure',
    name: 'IFR Departure',
    subtitle: 'Clearance → Taxi → Tower → Departure',
    chain: 'clearance-v1 → taxi-v1 → tower-v1 → departure-v1',
    icon: 'mdi-airplane-takeoff',
    startFlow: 'clearance-v1',
    isComplete: true,
    noChain: false,
    airport: 'dep',
  },
  {
    id: 'vfr-arrival',
    name: 'VFR Arrival',
    subtitle: 'Approach → Circuit → Landing → Taxi-in',
    chain: 'vfr-arrival-v1 → vfr-circuit-landing-v1 → taxi-in-v1',
    icon: 'mdi-airplane-landing',
    startFlow: 'vfr-arrival-v1',
    isComplete: true,
    noChain: false,
    airport: 'arr',
  },
  {
    id: 'ifr-arrival',
    name: 'IFR Arrival',
    subtitle: 'Enroute → Approach → Landing → Taxi-in',
    chain: 'ifr-enroute-arrival-v1 → ifr-arrival-v1 → ifr-tower-landing-v1 → taxi-in-v1',
    icon: 'mdi-airplane-landing',
    startFlow: 'ifr-enroute-arrival-v1',
    isComplete: true,
    noChain: false,
    airport: 'arr',
  },
  // ── Individual phases ────────────────────────────────────────────────────
  {
    id: 'clearance',
    name: 'Clearance',
    subtitle: 'Request IFR clearance',
    chain: 'clearance-v1',
    icon: 'mdi-file-document-outline',
    startFlow: 'clearance-v1',
    isComplete: false,
    noChain: true,
    airport: 'dep',
  },
  {
    id: 'taxi',
    name: 'Startup & Taxi',
    subtitle: 'Startup → Pushback → Taxi',
    chain: 'taxi-v1',
    icon: 'mdi-car-side',
    startFlow: 'taxi-v1',
    isComplete: false,
    noChain: true,
    airport: 'dep',
  },
  {
    id: 'tower',
    name: 'Tower',
    subtitle: 'Line-up and takeoff',
    chain: 'tower-v1',
    icon: 'mdi-tower-fire',
    startFlow: 'tower-v1',
    isComplete: false,
    noChain: true,
    airport: 'dep',
  },
  {
    id: 'departure',
    name: 'Departure',
    subtitle: 'Initial climb check-in',
    chain: 'departure-v1',
    icon: 'mdi-radar',
    startFlow: 'departure-v1',
    isComplete: false,
    noChain: true,
    airport: 'dep',
  },
  {
    id: 'vfr-approach',
    name: 'VFR Approach',
    subtitle: 'Initial contact & joining',
    chain: 'vfr-arrival-v1',
    icon: 'mdi-binoculars',
    startFlow: 'vfr-arrival-v1',
    isComplete: false,
    noChain: true,
    airport: 'arr',
  },
  {
    id: 'circuit-landing',
    name: 'Circuit & Landing',
    subtitle: 'Traffic circuit and landing',
    chain: 'vfr-circuit-landing-v1',
    icon: 'mdi-airport',
    startFlow: 'vfr-circuit-landing-v1',
    isComplete: false,
    noChain: true,
    airport: 'arr',
  },
  {
    id: 'ifr-enroute',
    name: 'Enroute Descent',
    subtitle: 'Area Control stepped descent',
    chain: 'ifr-enroute-arrival-v1',
    icon: 'mdi-arrow-down-bold-circle-outline',
    startFlow: 'ifr-enroute-arrival-v1',
    isComplete: false,
    noChain: true,
    airport: 'arr',
  },
  {
    id: 'ifr-approach',
    name: 'IFR Approach',
    subtitle: 'STAR, vectors & ILS',
    chain: 'ifr-arrival-v1',
    icon: 'mdi-radar',
    startFlow: 'ifr-arrival-v1',
    isComplete: false,
    noChain: true,
    airport: 'arr',
  },
  {
    id: 'ifr-landing',
    name: 'IFR Landing',
    subtitle: 'Established, land and vacate',
    chain: 'ifr-tower-landing-v1',
    icon: 'mdi-airport',
    startFlow: 'ifr-tower-landing-v1',
    isComplete: false,
    noChain: true,
    airport: 'arr',
  },
  {
    id: 'taxi-in',
    name: 'Taxi-in',
    subtitle: 'Post-landing ground movement',
    chain: 'taxi-in-v1',
    icon: 'mdi-parking',
    startFlow: 'taxi-in-v1',
    isComplete: false,
    noChain: true,
    airport: 'arr',
  },
  // ── Drills (standalone, not part of a journey chain) ─────────────────────
  {
    id: 'rto',
    name: 'Rejected Take-Off',
    subtitle: 'Tower cancels takeoff — reject and stop',
    chain: 'rto-v1',
    icon: 'mdi-airplane-alert',
    startFlow: 'rto-v1',
    isComplete: false,
    noChain: true,
    airport: 'dep',
  },
  {
    id: 'info-arrival',
    name: 'Uncontrolled Field (Info)',
    subtitle: 'Self-announce arrival, no clearances',
    chain: 'info-arrival-v1',
    icon: 'mdi-account-voice',
    startFlow: 'info-arrival-v1',
    isComplete: false,
    noChain: true,
    airport: 'arr',
  },
]

// ---------------------------------------------------------------------------
// Chooser layout: each complete chain is shown as a flow of its phases, so it's
// clear which single-phase practice maps to which segment of which journey.
// ---------------------------------------------------------------------------
interface ChainDef {
  category: 'Departure' | 'Arrival'
  completeId: string   // the isComplete scenario that flies the whole chain
  segmentIds: string[] // individual-phase scenario ids, in order
}

const CHAIN_DEFS: ChainDef[] = [
  { category: 'Departure', completeId: 'ifr-departure', segmentIds: ['clearance', 'taxi', 'tower', 'departure'] },
  { category: 'Arrival',   completeId: 'ifr-arrival',   segmentIds: ['ifr-enroute', 'ifr-approach', 'ifr-landing', 'taxi-in'] },
  { category: 'Arrival',   completeId: 'vfr-arrival',   segmentIds: ['vfr-approach', 'circuit-landing', 'taxi-in'] },
]

// Standalone drills shown in their own section, separate from the journey chains.
const DRILL_IDS = ['rto', 'info-arrival']
const drillScenarios = computed(() => DRILL_IDS
  .map(id => SCENARIOS.find(s => s.id === id))
  .filter((s): s is Scenario => !!s))

const chainGroups = computed(() => {
  const byCategory = new Map<string, Array<{ id: string; complete: Scenario; segments: Scenario[] }>>()
  for (const def of CHAIN_DEFS) {
    const complete = SCENARIOS.find(s => s.id === def.completeId)
    if (!complete) continue
    const segments = def.segmentIds
      .map(id => SCENARIOS.find(s => s.id === id))
      .filter((s): s is Scenario => !!s)
    if (!byCategory.has(def.category)) byCategory.set(def.category, [])
    byCategory.get(def.category)!.push({ id: def.completeId, complete, segments })
  }
  return Array.from(byCategory, ([category, chains]) => ({ category, chains }))
})

/** The scenario the user just finished (used on the completion screen). */
const completedScenario = ref<Scenario | null>(null)
/** The scenario currently being flown. */
const activeScenario = ref<Scenario | null>(null)

const oppositeScenario = computed<Scenario | null>(() => {
  if (!completedScenario.value) return null
  if (completedScenario.value.id === 'ifr-departure')
    return SCENARIOS.find(s => s.id === 'vfr-arrival') ?? null
  if (completedScenario.value.id === 'vfr-arrival')
    return SCENARIOS.find(s => s.id === 'ifr-departure') ?? null
  return null
})

// UI State
const currentScreen = ref<'login' | 'flightselect' | 'scenario' | 'monitor' | 'complete'>('login')
const loading = ref(false)
const error = ref('')
const pilotInput = ref('')
const isRecording = ref(false)
const micPermission = ref(false)
/** Maximum PTT hold time in ms. Auto-stops and submits the recording when exceeded. */
const PTT_MAX_DURATION_MS = 30_000  // 30 s — long enough for any realistic transmission
const swapAnimation = ref(false)
const signalStrength = ref(5)
const speechSpeed = ref(0.95)
const radioCheckLoading = ref(false)
const radioEffectsEnabled = ref(true)
const readbackEnabled = ref(false)
const debugMode = ref(true)

// ── Bug Report ───────────────────────────────────────────────────────────────
const showBugReportDialog = ref(false)
const bugReportComment = ref('')
const bugReportContact = ref('')
const bugReportScreenshot = ref<string | null>(null)
const bugReportArrows = ref<Array<{ fx: number; fy: number; tx: number; ty: number }>>([])
const bugReportLoading = ref(false)
const bugReportCapturing = ref(false)
const bugReportError = ref('')
const bugReportSuccess = ref(false)
const bugReportCanvasRef = ref<HTMLCanvasElement | null>(null)
const bugReportImgRef = ref<HTMLImageElement | null>(null)
let _arrowDrawing = false
let _arrowStart = { x: 0, y: 0 }

function setupAnnotationCanvas() {
  const canvas = bugReportCanvasRef.value
  const img = bugReportImgRef.value
  if (!canvas || !img) return
  canvas.width = img.clientWidth
  canvas.height = img.clientHeight
}

function _drawArrow(ctx: CanvasRenderingContext2D, fx: number, fy: number, tx: number, ty: number) {
  const headLen = 14
  const angle = Math.atan2(ty - fy, tx - fx)
  ctx.strokeStyle = '#ef4444'
  ctx.fillStyle = '#ef4444'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(fx, fy)
  ctx.lineTo(tx, ty)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(tx, ty)
  ctx.lineTo(tx - headLen * Math.cos(angle - Math.PI / 6), ty - headLen * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(tx - headLen * Math.cos(angle + Math.PI / 6), ty - headLen * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
}

function _redrawAnnotations(preview?: { fx: number; fy: number; tx: number; ty: number }) {
  const canvas = bugReportCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (const a of bugReportArrows.value) _drawArrow(ctx, a.fx, a.fy, a.tx, a.ty)
  if (preview) {
    ctx.globalAlpha = 0.55
    _drawArrow(ctx, preview.fx, preview.fy, preview.tx, preview.ty)
    ctx.globalAlpha = 1
  }
}

function _canvasCoords(e: MouseEvent) {
  const canvas = bugReportCanvasRef.value!
  const rect = canvas.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function onCanvasMouseDown(e: MouseEvent) {
  _arrowStart = _canvasCoords(e)
  _arrowDrawing = true
}

function onCanvasMouseMove(e: MouseEvent) {
  if (!_arrowDrawing) return
  const { x, y } = _canvasCoords(e)
  _redrawAnnotations({ fx: _arrowStart.x, fy: _arrowStart.y, tx: x, ty: y })
}

function onCanvasMouseUp(e: MouseEvent) {
  if (!_arrowDrawing) return
  _arrowDrawing = false
  const { x, y } = _canvasCoords(e)
  const dx = x - _arrowStart.x
  const dy = y - _arrowStart.y
  if (Math.sqrt(dx * dx + dy * dy) < 8) { _redrawAnnotations(); return }
  bugReportArrows.value = [...bugReportArrows.value, { fx: _arrowStart.x, fy: _arrowStart.y, tx: x, ty: y }]
  _redrawAnnotations()
}

function onCanvasMouseLeave() {
  if (!_arrowDrawing) return
  _arrowDrawing = false
  _redrawAnnotations()
}

function undoLastArrow() {
  bugReportArrows.value = bugReportArrows.value.slice(0, -1)
  _redrawAnnotations()
}

async function openBugReport() {
  bugReportError.value = ''
  bugReportSuccess.value = false
  bugReportComment.value = ''
  bugReportArrows.value = []
  bugReportScreenshot.value = null
  bugReportContact.value = [auth.user?.name, auth.user?.email].filter(Boolean).join(' — ')

  // Capture the screenshot BEFORE opening the dialog, otherwise the open
  // dialog overlay would appear in the shot instead of the actual bug state.
  bugReportCapturing.value = true
  try {
    // modern-screenshot renders via a native SVG <foreignObject>, so modern CSS
    // such as color-mix()/oklch() (used throughout the app) is supported.
    // html2canvas could not parse those and silently produced no screenshot.
    const { domToJpeg } = await import('modern-screenshot')
    bugReportScreenshot.value = await domToJpeg(document.body, {
      quality: 0.75,
      scale: 0.55,
      // Skip assets we cannot read (cross-origin tiles/avatars) instead of failing.
      filter: (node) => !(node instanceof Element && node.getAttribute?.('data-no-screenshot') === 'true'),
    })
  } catch (err) {
    // Screenshot is optional — keep the report flow usable, but surface why.
    console.warn('[PM] Bug report screenshot capture failed', err)
    bugReportScreenshot.value = null
    bugReportError.value = 'Screenshot konnte nicht erstellt werden – Bug-Report ohne Bild möglich.'
  } finally {
    bugReportCapturing.value = false
  }

  showBugReportDialog.value = true
}

async function submitBugReport() {
  if (!bugReportComment.value.trim()) { bugReportError.value = 'Bitte einen Kommentar eingeben.'; return }
  bugReportLoading.value = true
  bugReportError.value = ''

  try {
    let finalScreenshot: string | undefined
    if (bugReportScreenshot.value) {
      const img = bugReportImgRef.value
      const src = new Image()
      await new Promise<void>((res) => { src.onload = () => res(); src.src = bugReportScreenshot.value! })
      const out = document.createElement('canvas')
      out.width = src.naturalWidth; out.height = src.naturalHeight
      const ctx = out.getContext('2d')!
      ctx.drawImage(src, 0, 0)
      if (bugReportArrows.value.length > 0 && img) {
        const sx = src.naturalWidth / img.clientWidth
        const sy = src.naturalHeight / img.clientHeight
        for (const a of bugReportArrows.value) _drawArrow(ctx, a.fx * sx, a.fy * sy, a.tx * sx, a.ty * sy)
      }
      finalScreenshot = out.toDataURL('image/jpeg', 0.8)
    }

    const pmState = {
      flowSlug: activeScenario.value?.startFlow || '',
      scenarioId: activeScenario.value?.id || '',
      currentStateId: (currentState.value as any)?.id || '',
      variables: (vars as any)?.value || {},
      flags: (flags as any)?.value || {},
      flightContext: (flightContext as any)?.value || {},
      communicationLog: ((log as any)?.value || [] as any[]).slice(-20),
    }

    await api.post('/api/bug-reports', {
      comment: bugReportComment.value.trim(),
      contact: bugReportContact.value.trim(),
      screenshot: finalScreenshot,
      pmState,
    })

    bugReportSuccess.value = true
    setTimeout(() => { showBugReportDialog.value = false; bugReportSuccess.value = false }, 2500)
  } catch (err: any) {
    bugReportError.value = err?.data?.statusMessage || err?.message || 'Fehler beim Senden.'
  } finally {
    bugReportLoading.value = false
  }
}

/**
 * Restore a /pm session from a saved bug-report snapshot (admin link
 * `/pm?restoreBugReport=<id>`). The Python backend has no "resume mid-session"
 * endpoint, so we recreate a real, working session for the SAME flight and
 * scenario via startMonitoring(), then overlay the saved variables/flags and
 * the captured conversation so the admin can reproduce and try out the bug.
 */
async function restoreBugReportState(restoreId: string) {
  try {
    const report = await api.get<any>(`/api/admin/bug-reports/${restoreId}`)
    const state = report?.pmState
    if (!state) {
      error.value = 'Bug-Report enthält keinen gespeicherten State.'
      return
    }

    // Locate the scenario the report was captured in.
    const scenario =
      SCENARIOS.find(s => s.id === state.scenarioId) ||
      SCENARIOS.find(s => s.startFlow === state.flowSlug)
    if (!scenario) {
      error.value = `Bug-Report-Restore: Szenario "${state.scenarioId || state.flowSlug || '?'}" nicht gefunden.`
      return
    }

    // Reconstruct a flight plan from the snapshot so startMonitoring resolves the
    // correct airport/frequencies and creates a backend session for the same flight.
    const v = state.variables || {}
    const fc = state.flightContext || {}
    const dep = v.dep || fc.dep
    const dest = v.dest || fc.dest
    const flightPlan: Record<string, any> = {
      callsign: v.callsign || fc.callsign || 'UNKNOWN',
      aircraft: v.acf_type || fc.acf_type || 'A320',
      dep,
      departure: dep,
      arr: dest,
      arrival: dest,
      route: fc.route || v.route || '',
      assignedsquawk: v.squawk,
    }

    // Spin up a real session (loads tree, fetches frequencies, creates backend session).
    await startMonitoring(flightPlan, scenario)
    // startMonitoring bails out on error without entering the monitor screen.
    if (currentScreen.value !== 'monitor') return

    // Overlay the exact saved values over the freshly generated ones (stand, SID, …).
    if (state.variables && Object.keys(state.variables).length) patchVariables(state.variables)
    if (state.flags && Object.keys(state.flags).length) patchFlags(state.flags)

    // Restore the captured conversation for context.
    clearCommunicationLog?.()
    if (Array.isArray(state.communicationLog)) {
      for (const e of state.communicationLog) {
        if (!e?.message) continue
        appendLogEntry(e.speaker || 'system', e.message, e.state || '', {
          frequency: e.frequency,
          flow: e.flow,
          radioCheck: e.radioCheck,
          offSchema: e.offSchema,
        })
      }
    }

    // A fresh backend session always starts at the flow's start state, so we
    // can't fake the local cursor onto the captured mid-flow state without
    // desyncing transmits. Tell the admin where the bug was captured instead.
    error.value =
      `Bug-Report wiederhergestellt: ${scenario.name} · ${flightPlan.callsign} (${dep || '?'}→${dest || '?'}). ` +
      `Erfasster State: ${state.currentStateId || '?'} (Flow ${state.flowSlug || '?'}).`
  } catch (err) {
    console.warn('[PM] Bug report restore failed', err)
    error.value = 'Bug-Report konnte nicht wiederhergestellt werden.'
  }
}
// ────────────────────────────────────────────────────────────────────────────

// Pre-recording (rolling mic buffer) so the first ~1s of PTT speech isn't clipped
const prerecEnabled = ref(true)
const prerecSeconds = ref(1.0)

// Layout / view state
const activeTab = ref<'funk' | 'log'>('funk')
const experienceMenu = ref(false)
const inputMode = ref<'voice' | 'text'>('voice')
const learningMode = ref(true)

// Overlays / sheets opened from HUD controls
const showFlightSheet = ref(false)
const showSettingsSheet = ref(false)
const showDebugDrawer = ref(false)
const hudStatusMenu = ref(false)

type PmTab = {
  id: 'funk' | 'log'
  label: string
  icon: string
  mobileOnly?: boolean
}
const TABS: PmTab[] = [
  { id: 'funk', label: 'Radio', icon: 'mdi-radio-handheld' },
  { id: 'log', label: 'Log', icon: 'mdi-format-list-bulleted', mobileOnly: true },
]
const visibleTabs = computed(() => TABS)

const simulationRunning = ref(false)
const simulationTrace = ref<SimulationTraceEntry[]>([])
const simulationError = ref('')

// Frequencies
const frequencies = ref({
  active: '121.900',
  standby: '118.100'
})

const airportFrequencies = ref<AirportFrequencyEntry[]>([])
const airportName = ref<string | undefined>(undefined)
const airportFrequencyLoading = ref(false)
const frequencySources = ref({ vatsim: false, openaip: false })
const atisPlaybackLoading = ref(false)
const atisLoopKey = ref<string | null>(null)
let atisAudioLoop: AtisAudioLoop | null = null
let atisLoopActive = false
let atisLoopSeq = 0
// ICAO of the airport this session operates at (dep for departures, arr for
// arrivals) — drives ATIS announcements, METAR fallback, and the periodic refetch.
const activeAirportIcao = ref<string | undefined>(undefined)
// Virtual ATIS start times per loop key.  Keeps the broadcast position stable
// across tune-out/tune-in: re-tuning resumes where the loop would be if it
// had been playing continuously.
const atisEpochByKey = new Map<string, number>()
// Airport-data refresh scheduling.  VATSIM ATIS regenerates from real-world
// METARs, which publish at :20/:50 — the new info letter shows up on the
// datafeed a couple of minutes later, so refetch at :23 and :53.  When no
// ATIS is on the feed yet (station may log on mid-session), poll more often.
let airportDataRefreshTimer: ReturnType<typeof setTimeout> | null = null
const ATIS_REFRESH_MINUTES = [23, 53]
const ATIS_RETRY_NO_DATA_MS = 5 * 60 * 1000

const cancelAirportDataRefresh = () => {
  if (airportDataRefreshTimer) {
    clearTimeout(airportDataRefreshTimer)
    airportDataRefreshTimer = null
  }
}

const msUntilNextAtisSlot = (): number => {
  const now = new Date()
  let best = Infinity
  for (const hourOffset of [0, 1]) {
    for (const minute of ATIS_REFRESH_MINUTES) {
      const candidate = new Date(now)
      candidate.setHours(now.getHours() + hourOffset, minute, 0, 0)
      const delta = candidate.getTime() - now.getTime()
      if (delta > 0 && delta < best) best = delta
    }
  }
  return best
}

const scheduleAirportDataRefresh = () => {
  cancelAirportDataRefresh()
  const hasAtisData = Boolean(atisFrequencyEntry.value?.atisText)
  const slotDelay = msUntilNextAtisSlot()
  // With live ATIS data wait for the next METAR slot; without it, also retry
  // sooner in case the ATIS station logs on mid-session.
  const delay = hasAtisData ? slotDelay : Math.min(slotDelay, ATIS_RETRY_NO_DATA_MS)
  airportDataRefreshTimer = setTimeout(async () => {
    airportDataRefreshTimer = null
    if (currentScreen.value === 'monitor' && activeAirportIcao.value) {
      await fetchAirportFrequencies(activeAirportIcao.value, { silent: true })
      // Pre-generate audio for a changed info letter so the loop restart
      // (triggered by the key change) plays without a generation gap.
      prefetchAtisAudio()
    }
    if (currentScreen.value === 'monitor') {
      scheduleAirportDataRefresh()
    }
  }, delay)
}

// Send unauthenticated visitors to login while preserving where they were
// headed (e.g. /pm?token=… so the bridge link survives the round-trip),
// instead of dropping them on the classroom fallback after sign-in.
const redirectToLogin = () => {
  router.push({ path: '/login', query: { redirect: route.fullPath } })
}

onMounted(async () => {
  try {
    if (!auth.accessToken) {
      const refreshed = await auth.tryRefresh()
      if (!refreshed) {
        redirectToLogin()
        return
      }
    }

    if (!auth.user) {
      await auth.fetchUser().catch((err) => {
        console.error('Session initialisation failed', err)
        redirectToLogin()
      })
    }

    try {
      await fetchRuntimeTree('icao_atc_decision_tree', config.public.radioBackendUrl as string)
    } catch (err) {
      console.error('Failed to load decision tree from Python backend', err)
      error.value = 'Decision engine konnte nicht initialisiert werden.'
      return
    }

    if (typeof window !== 'undefined') {
      const storedVatsimId = window.localStorage.getItem(STORAGE_KEYS.vatsimId)
      if (storedVatsimId) {
        vatsimId.value = storedVatsimId
      }

      const storedPrerecEnabled = window.localStorage.getItem(STORAGE_KEYS.prerecEnabled)
      if (storedPrerecEnabled !== null) {
        prerecEnabled.value = storedPrerecEnabled === '1'
      }
      const storedPrerecSeconds = window.localStorage.getItem(STORAGE_KEYS.prerecSeconds)
      if (storedPrerecSeconds !== null) {
        const parsed = Number.parseFloat(storedPrerecSeconds)
        if (Number.isFinite(parsed) && parsed >= 0.2 && parsed <= 3) {
          prerecSeconds.value = parsed
        }
      }

      const storedPlanRaw = window.localStorage.getItem(STORAGE_KEYS.selectedPlan)
      if (storedPlanRaw) {
        try {
          const parsedPlan = JSON.parse(storedPlanRaw)
          selectedPlan.value = parsedPlan
          currentScreen.value = 'scenario'
        } catch (err) {
          console.warn('Failed to restore stored flight plan', err)
          window.localStorage.removeItem(STORAGE_KEYS.selectedPlan)
        }
      }
    }

    // Restore state from bug report (admin link: /pm?restoreBugReport=<id>)
    const restoreId = route.query.restoreBugReport as string | undefined
    if (restoreId) {
      await restoreBugReportState(restoreId)
    }
  } finally {
    restoringFromStorage = false
  }
})

watch(
  () => auth.accessToken,
  (token) => {
    if (!token) {
      persistSelectedPlan(null)
      redirectToLogin()
    }
  }
)

// VATSIM Integration
const vatsimId = ref('1857215')
const flightPlans = ref<any[]>([])
const selectedPlan = ref<any>(null)

watch(vatsimId, (id) => {
  if (restoringFromStorage || typeof window === 'undefined') {
    return
  }

  const trimmed = id.trim()
  if (trimmed) {
    window.localStorage.setItem(STORAGE_KEYS.vatsimId, trimmed)
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.vatsimId)
  }
})

// Audio
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<Blob[]>([])
/** Timer that auto-stops a PTT recording when PTT_MAX_DURATION_MS is exceeded. */
let pttMaxDurationTimer: ReturnType<typeof setTimeout> | null = null

// Computed Properties
const radioQuality = computed(() => {
  const strength = signalStrength.value
  if (strength >= 5) return { color: 'success', text: 'EXCELLENT' }
  if (strength >= 4) return { color: 'success', text: 'GOOD' }
  if (strength >= 3) return { color: 'warning', text: 'FAIR' }
  if (strength >= 2) return { color: 'orange', text: 'POOR' }
  return { color: 'error', text: 'WEAK' }
})

const speechSpeedLabel = computed(() => `${speechSpeed.value.toFixed(2)}x`)

const completedPilotSteps = computed(() => simulationTrace.value.filter(entry => entry.kind === 'pilot').length)

// All ATIS stations at the airport.  Large airports broadcast separate
// Arrival and Departure ATIS on different frequencies (EDDF_A_ATIS /
// EDDF_D_ATIS on VATSIM), each with its own info letter and text.
const atisEntries = computed(() => airportFrequencies.value.filter(entry => entry.type === 'ATIS'))

// Primary ATIS entry for the quick-play button — prefer one with live text.
const atisFrequencyEntry = computed(() =>
  atisEntries.value.find(entry => (entry.atisText || '').trim()) || atisEntries.value[0])

/**
 * Extract the runway in use from live ATIS text ("DEP RWY 25C", "EXPECT ILS
 * APPROACH RUNWAY 25L", "RUNWAY IN USE 07"). Prefers a phrase matching the
 * requested kind (departure/arrival); falls back to any runway mention.
 * Returns null when no ATIS text carries a runway — callers keep their default.
 */
const extractAtisRunway = (kind: 'dep' | 'arr'): string | null => {
  const RWY = String.raw`(?:RWY|RUNWAY)S?\s*([0-3]?\d\s*[LRC]?)\b`
  const kindPatterns = kind === 'dep'
    ? [new RegExp(String.raw`DEP(?:ARTURE)?S?[^.]{0,40}?${RWY}`, 'i')]
    : [
        new RegExp(String.raw`(?:ARR(?:IVAL)?S?|LANDING)[^.]{0,40}?${RWY}`, 'i'),
        new RegExp(String.raw`EXPECT[^.]{0,60}?APPROACH[^.]{0,20}?${RWY}`, 'i'),
      ]
  const genericPattern = new RegExp(RWY, 'i')

  const texts = atisEntries.value
    .map(entry => (entry.atisText || '').trim())
    .filter(Boolean)

  for (const patterns of [kindPatterns, [genericPattern]]) {
    for (const text of texts) {
      for (const pattern of patterns) {
        const match = pattern.exec(text)
        if (match?.[1]) {
          const designator = match[1].replace(/\s+/g, '').toUpperCase()
          // Normalise "7L" -> "07L" so it matches OSM runway refs.
          return /^\d[LRC]?$/.test(designator) ? `0${designator}` : designator
        }
      }
    }
  }
  return null
}

const frequencySourceLabels = computed(() => {
  const labels: string[] = []
  if (frequencySources.value.vatsim) labels.push('VATSIM')
  if (frequencySources.value.openaip) labels.push('OpenAIP')
  return labels
})

const normalizedFrequencyValue = (value: string | undefined) =>
  (value || '').trim().replace(/\s+/g, '').replace(',', '.')

// The ATIS station matching the currently tuned frequency (if any).  With
// multiple ATIS stations, each frequency carries its own broadcast.
const tunedAtisEntry = computed<AirportFrequencyEntry | null>(() => {
  const active = normalizedFrequencyValue(frequencies.value.active)
  if (!active) return null
  const matches = atisEntries.value.filter(entry =>
    entry.frequency
    && entry.frequency !== FREQUENCY_PLACEHOLDER
    && normalizedFrequencyValue(entry.frequency) === active,
  )
  if (!matches.length) return null
  // Two sources can list the same frequency — prefer the entry with live text.
  return matches.find(entry => (entry.atisText || '').trim()) || matches[0]!
})

const frequencyDisplayKey = (entry: AirportFrequencyEntry) =>
  [
    (entry.type || '').trim().toUpperCase(),
    normalizedFrequencyValue(entry.frequency),
  ].join('|')

const sourceLabel = (sources: Array<'vatsim' | 'openaip'>) => {
  const hasVatsim = sources.includes('vatsim')
  const hasOpenAip = sources.includes('openaip')
  if (hasVatsim && hasOpenAip) return 'VATSIM + OpenAIP'
  if (hasVatsim) return 'VATSIM'
  if (hasOpenAip) return 'OpenAIP'
  return 'Source'
}

const displayAirportFrequencies = computed<DisplayAirportFrequencyEntry[]>(() => {
  const grouped = new Map<string, DisplayAirportFrequencyEntry>()

  for (const entry of airportFrequencies.value) {
    if (!entry.frequency || entry.frequency === FREQUENCY_PLACEHOLDER) continue

    const key = frequencyDisplayKey(entry)
    const existing = grouped.get(key)

    if (!existing) {
      grouped.set(key, {
        ...entry,
        displayKey: key,
        sourceList: [entry.source],
        sourceLabel: sourceLabel([entry.source]),
      })
      continue
    }

    if (!existing.sourceList.includes(entry.source)) {
      existing.sourceList.push(entry.source)
    }
    existing.sourceLabel = sourceLabel(existing.sourceList)
    existing.callsign ||= entry.callsign
    existing.atisCode ||= entry.atisCode
    existing.atisText ||= entry.atisText
  }

  return [...grouped.values()].sort((a, b) => {
    const aRoleIndex = FREQ_ROLE_ORDER.includes(a.type) ? FREQ_ROLE_ORDER.indexOf(a.type) : Number.MAX_SAFE_INTEGER
    const bRoleIndex = FREQ_ROLE_ORDER.includes(b.type) ? FREQ_ROLE_ORDER.indexOf(b.type) : Number.MAX_SAFE_INTEGER
    const roleDiff = aRoleIndex - bRoleIndex
    if (roleDiff !== 0) return roleDiff
    return a.frequency.localeCompare(b.frequency)
  })
})

type PreparedSpeech = {
  template: string
  plain: string
  normalized: string
}

type SpeechOptions = {
  voice?: string
  tag?: string
  updateLastTransmission?: boolean
  lastTransmissionLabel?: string
  delayMs?: number
  useNormalizedForTTS?: boolean
  speed?: number
  lessonId?: string
}

type SimulationDecisionTemplate = {
  next: string
  controllerSayState?: string
  controllerSayTpl?: string
  updates?: Record<string, any>
  note?: string
}

type SimulationTraceEntry = {
  kind: 'info' | 'pilot' | 'atc' | 'llm-input' | 'llm-output'
  id: string
  label: string
  payload?: any
}

type AirportFrequencyEntry = {
  type: string
  label: string
  frequency: string
  source: 'vatsim' | 'openaip'
  callsign?: string
  atisCode?: string
  atisText?: string
  lastUpdated?: string
}

type DisplayAirportFrequencyEntry = AirportFrequencyEntry & {
  displayKey: string
  sourceList: Array<'vatsim' | 'openaip'>
  sourceLabel: string
}

type FrequencyVariableUpdate = Partial<Record<'atis_freq' | 'delivery_freq' | 'ground_freq' | 'tower_freq' | 'departure_freq' | 'approach_freq' | 'handoff_freq', string>>

const simulationPilotSteps = [
  'CD_CHECK_ATIS',
  'CD_VERIFY_READBACK',
  'GRD_READY_FOR_PUSH',
  'GRD_TAXI_REQUEST',
  'GRD_TAXI_READBACK',
  'TWR_LINEUP_REQ',
  'TWR_TAKEOFF_READBACK',
  'DEP_IDENT',
  'DEP_CLIMB_READBACK',
  'DES_READBACK',
  'APP_ESTABLISHED',
  'TWR_LAND_READBACK',
  'GRD_TAXI_IN_REQ',
  'GRD_TAXI_IN_READBACK'
] as const

type SimulationPilotState = typeof simulationPilotSteps[number]

const simulationDecisions: Record<SimulationPilotState, SimulationDecisionTemplate> = {
  CD_CHECK_ATIS: {
    next: 'CD_ISSUE_CLR',
    controllerSayState: 'CD_ISSUE_CLR',
    updates: {
      push_available: true,
      runway_occupied: false,
      pilot_able: true,
      runway_available: true,
      push_delay_min: 0,
      surface_wind: '220/05',
      speed_restriction: '210 knots',
      emergency_heading: '180'
    }
  },
  CD_VERIFY_READBACK: {
    next: 'CD_READBACK_CHECK'
  },
  GRD_READY_FOR_PUSH: {
    next: 'GRD_PUSH_APPROVE',
    controllerSayState: 'GRD_PUSH_APPROVE'
  },
  GRD_TAXI_REQUEST: {
    next: 'GRD_TAXI_INSTR',
    controllerSayState: 'GRD_TAXI_INSTR'
  },
  GRD_TAXI_READBACK: {
    next: 'TWR_CONTACT',
    controllerSayState: 'TWR_CONTACT'
  },
  TWR_LINEUP_REQ: {
    next: 'TWR_TAKEOFF_CLR',
    controllerSayState: 'TWR_TAKEOFF_CLR'
  },
  TWR_TAKEOFF_READBACK: {
    next: 'DEP_CONTACT',
    controllerSayState: 'DEP_CONTACT'
  },
  DEP_IDENT: {
    next: 'DEP_CLIMB_INSTR',
    controllerSayState: 'DEP_CLIMB_INSTR'
  },
  DEP_CLIMB_READBACK: {
    next: 'ENR_HANDOFF',
    controllerSayState: 'ENR_HANDOFF'
  },
  DES_READBACK: {
    next: 'APP_HANDOFF',
    controllerSayState: 'APP_HANDOFF',
    updates: {
      speed_restriction: '180 knots'
    }
  },
  APP_ESTABLISHED: {
    next: 'TWR_LAND_CONTACT',
    controllerSayState: 'TWR_LAND_CONTACT',
    updates: {
      runway_available: true,
      surface_wind: '210/06'
    }
  },
  TWR_LAND_READBACK: {
    next: 'TWR_VACATE',
    controllerSayState: 'TWR_VACATE'
  },
  GRD_TAXI_IN_REQ: {
    next: 'GRD_TAXI_INSTR_IN',
    controllerSayState: 'GRD_TAXI_INSTR_IN'
  },
  GRD_TAXI_IN_READBACK: {
    next: 'FLOW_COMPLETE'
  }
}

const recordedAtcStates = new Set<string>()
const simulationStepCount = simulationPilotSteps.length

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

let audioContext: AudioContext | null = null
let pizzicatoLite: PizzicatoLite | null = null
let speechQueue: Promise<void> = Promise.resolve()

// Tracks objects that must be torn down when frequency changes mid-speech.
let _currentAudio: HTMLAudioElement | null = null
let _currentPizzicatoSound: { stop: () => void } | null = null
// All in-flight TTS requests (playback is serialized, but generation runs in
// parallel so a reply's TTS doesn't wait for earlier speech to finish playing).
const _pendingSpeechAborts = new Set<AbortController>()
// Incremented on each stopCurrentSpeech() call so enqueued tasks can detect
// they belong to a cancelled generation and exit early.
let _speechGeneration = 0

/** Immediately stop any in-flight TTS request and audio playback. */
const stopCurrentSpeech = () => {
  _speechGeneration++
  for (const abort of _pendingSpeechAborts) {
    abort.abort()
  }
  _pendingSpeechAborts.clear()
  if (_currentPizzicatoSound) {
    try { _currentPizzicatoSound.stop() } catch (_) { /* ignore */ }
    _currentPizzicatoSound = null
  }
  if (_currentAudio) {
    _currentAudio.pause()
    _currentAudio.src = ''
    _currentAudio = null
  }
  // Drop queued tasks by resolving the queue immediately.
  speechQueue = Promise.resolve()
}

const enqueueSpeech = (task: () => Promise<void>) => {
  const generation = _speechGeneration
  speechQueue = speechQueue
    .then(() => {
      if (generation !== _speechGeneration) return  // cancelled — skip
      return task()
    })
    .catch(err => {
      if (err?.name !== 'AbortError') console.error('Speech queue error:', err)
    })
  return speechQueue
}

const prepareSpeech = (tpl: string): PreparedSpeech => {
  const plain = renderATCMessage(tpl)
  const normalized = normalizeATCText(tpl, { ...vars.value, ...flags.value })
  return { template: tpl, plain, normalized }
}

const debugState = computed(() => {
  if (!currentState.value) return null
  const sayTpl = currentState.value.say_tpl
  return {
    id: currentState.value.id,
    phase: currentState.value.phase,
    role: currentState.value.role,
    frequencyName: currentState.value.frequencyName,
    sayPlain: sayTpl ? renderATCMessage(sayTpl) : '',
    sayNormalized: sayTpl ? normalizeATCText(sayTpl, { ...vars.value, ...flags.value }) : ''
  }
})

const debugNextStates = computed(() => {
  return nextCandidates.value.map(id => {
    const state = getStateDetails(id)
    if (!state) {
      return { id, role: '', phase: '', frequencyName: undefined, sayPlain: '', sayNormalized: '' }
    }
    const sayPlain = state.say_tpl ? renderATCMessage(state.say_tpl) : ''
    const sayNormalized = state.say_tpl ? normalizeATCText(state.say_tpl, { ...vars.value, ...flags.value }) : ''
    return {
      id,
      role: state.role,
      phase: state.phase,
      frequencyName: state.frequencyName,
      sayPlain,
      sayNormalized
    }
  })
})

// Methods
const normalizeExpectedText = (text: string): string => {
  if (!flightContext.value) return text
  return normalizeATCText(text, { ...vars.value, ...flags.value })
}

const ensureAudioContext = async (): Promise<AudioContext | null> => {
  if (typeof window === 'undefined') return null

  if (!audioContext) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    if (!Ctx) return null
    audioContext = new Ctx()
  }

  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume()
    } catch (err) {
      console.warn('AudioContext resume failed', err)
    }
  }

  return audioContext
}

const ensurePizzicato = async (ctx: AudioContext | null): Promise<PizzicatoLite | null> => {
  if (!ctx) return null
  if (!pizzicatoLite) {
    pizzicatoLite = await loadPizzicatoLite()
  }
  return pizzicatoLite
}


const playAudioWithEffects = async (base64: string, mime = 'audio/wav') => {
  if (typeof window === 'undefined') return

  const dataUrl = `data:${mime || 'audio/wav'};base64,${base64}`

  const playWithoutEffects = () =>
    new Promise<void>((resolve) => {
      const audio = new Audio(dataUrl)
      _currentAudio = audio
      audio.onended = () => { _currentAudio = null; resolve() }
      audio.onerror = () => { _currentAudio = null; resolve() }
      audio.play().catch(() => { _currentAudio = null; resolve() })
    })

  if (!radioEffectsEnabled.value) {
    await playWithoutEffects()
    return
  }

  try {
    const ctx = await ensureAudioContext()
    const pizzicato = await ensurePizzicato(ctx)
    if (!ctx || !pizzicato) throw new Error('Audio engine unavailable')

    const sound = await pizzicato.createSoundFromBase64(ctx, base64)
    const readability = Math.max(1, Math.min(5, signalStrength.value))
    const profile = getReadabilityProfile(readability)

    const { Effects } = pizzicato

    const highpass = new Effects.HighPassFilter(ctx, {
      frequency: profile.eq.highpass,
      q: profile.eq.highpassQ
    })
    const lowpass = new Effects.LowPassFilter(ctx, {
      frequency: profile.eq.lowpass,
      q: profile.eq.lowpassQ
    })
    sound.addEffect(highpass)
    sound.addEffect(lowpass)

    if (profile.eq.bandpass) {
      sound.addEffect(
        new Effects.BandPassFilter(ctx, {
          frequency: profile.eq.bandpass.frequency,
          q: profile.eq.bandpass.q
        })
      )
    }

    if (profile.presence) {
      sound.addEffect(new Effects.PeakingFilter(ctx, profile.presence))
    }

    profile.distortions.forEach((amount) => {
      sound.addEffect(new Effects.Distortion(ctx, { amount }))
    })

    sound.addEffect(new Effects.Compressor(ctx, profile.compressor))

    if (profile.tremolos) {
      profile.tremolos.forEach((tremolo) => {
        sound.addEffect(new Effects.Tremolo(ctx, tremolo))
      })
    }

    sound.setVolume(profile.gain)

    const stopNoiseGenerators = createNoiseGenerators(ctx, sound.duration, profile, readability)

    _currentPizzicatoSound = sound
    try {
      await sound.play()
    } finally {
      _currentPizzicatoSound = null
      stopNoiseGenerators.forEach((stop) => stop())
      sound.clearEffects()
    }
  } catch (err) {
    console.error('Failed to apply radio effect', err)
    await playWithoutEffects()
  }
}

/** Kick off TTS generation immediately (parallel to whatever is playing). */
const fetchSpeechAudio = (prepared: PreparedSpeech, options: SpeechOptions = {}): Promise<any | null> => {
  const abort = new AbortController()
  _pendingSpeechAborts.add(abort)
  return (async () => {
    try {
      const speed = options.speed ?? speechSpeed.value
      const usesNormalized = options.useNormalizedForTTS !== false
      const response = await api.post('/api/atc/say', {
        text: usesNormalized ? prepared.normalized : prepared.plain,
        // The normalized variant already went through the client-side
        // radiotelephony normalizer — the server must not normalize again.
        preNormalized: usesNormalized,
        level: signalStrength.value,
        voice: options.voice || 'alloy',
        speed,
        moduleId: 'pilot-monitoring',
        lessonId: currentState.value?.id || 'general',
        tag: options.tag || 'controller-reply',
        sessionId: engineSessionId.value || flags.value.session_id || undefined,
      }, { signal: abort.signal })
      if (abort.signal.aborted) return null  // frequency changed while in flight
      return response
    } catch (err: any) {
      if (err?.name === 'AbortError' || abort.signal.aborted) {
        pmLog.info('TTS cancelled (frequency change)')
        return null
      }
      pmLog.error('TTS FAILED', err)
      console.error('TTS failed:', err)
      return null
    } finally {
      _pendingSpeechAborts.delete(abort)
    }
  })()
}

const speakPrepared = async (
  prepared: PreparedSpeech,
  options: SpeechOptions = {},
  audioPromise?: Promise<any | null>,
) => {
  pmLog.info('TTS ▶', prepared.plain.slice(0, 100))
  const response = await (audioPromise ?? fetchSpeechAudio(prepared, options))
  if (!response) return

  if (response.success && response.audio) {
    pmLog.debug('TTS ✓  provider=%s  size=%dB', response.meta?.ttsProvider, response.audio.size)
    if (options.updateLastTransmission !== false) {
      setLastTransmission(options.lastTransmissionLabel || `ATC: ${prepared.plain}`)
    }
    await playAudioWithEffects(response.audio.base64, response.audio.mime)
  } else {
    pmLog.warn('TTS ✗  unexpected response', response)
  }
}

const speakWithRadioEffects = (tpl: string, options: SpeechOptions = {}) => {
  const prepared = prepareSpeech(tpl)
  const delay = options.delayMs ?? 0
  // Start TTS generation NOW — it overlaps queued speech and the artificial
  // controller delay instead of adding to them, so the audible latency is
  // max(generation, delay) rather than the sum of everything in the queue.
  const audioPromise = fetchSpeechAudio(prepared, options)
  enqueueSpeech(async () => {
    const generation = _speechGeneration
    if (delay > 0) {
      await wait(delay)
    }
    if (generation !== _speechGeneration) return  // stopped while waiting
    await speakPrepared(prepared, options, audioPromise)
  })
}

const speakPlainText = (text: string, options: SpeechOptions = {}) => {
  const trimmed = text.trim()
  if (!trimmed) {
    return Promise.resolve()
  }

  const speed = options.speed ?? speechSpeed.value
  const lessonId = options.lessonId || currentState.value?.id || 'general'

  return enqueueSpeech(async () => {
    try {
      const response = await api.post('/api/atc/say', {
        text: trimmed,
        level: signalStrength.value,
        voice: options.voice || 'alloy',
        speed,
        moduleId: 'pilot-monitoring',
        lessonId,
        tag: options.tag || 'announcement',
        sessionId: engineSessionId.value || flags.value.session_id || undefined,
      })

      if (response.success && response.audio) {
        if (options.updateLastTransmission !== false) {
          setLastTransmission(options.lastTransmissionLabel || trimmed)
        }
        await playAudioWithEffects(response.audio.base64, response.audio.mime)
      }
    } catch (err) {
      console.error('TTS failed:', err)
    }
  })
}

const scheduleControllerSpeech = (tpl: string) => {
  const plain = renderATCMessage(tpl)
  speakWithRadioEffects(tpl, {
    delayMs: 800 + Math.random() * 2000,
    tag: 'controller-reply',
    updateLastTransmission: true,
    useNormalizedForTTS: true,
    lastTransmissionLabel: `ATC: ${plain}`
  })
}

const speakPilotReadback = (text: string) => {
  speakWithRadioEffects(text, {
    delayMs: 400,
    voice: 'verse',
    tag: 'pilot-readback',
    updateLastTransmission: false,
    useNormalizedForTTS: true
  })
}

// --- Silence auto-advance ----------------------------------------------------
// Some pilot states let ATC continue on its own when the pilot stays quiet
// (e.g. the takeoff roll in tower-v1: no report needed, Tower hands off after a
// while anyway). Such states carry auto_advance_on_silence +
// auto_advance_timeout_ms in the runtime tree; whenever the session lands on
// one, arm a timer that fires the backend /timeout endpoint. Any pilot
// transmission or telemetry-fired advance re-arms or clears it via
// applyBackendDecision.
let silenceTimer: ReturnType<typeof setTimeout> | null = null

function clearSilenceTimer() {
  if (silenceTimer) {
    clearTimeout(silenceTimer)
    silenceTimer = null
  }
}

function armSilenceTimer() {
  clearSilenceTimer()
  const state = currentState.value as any
  if (!state?.auto_advance_on_silence || !backendSessionId.value) return
  const ms = Math.max(1000, Number(state.auto_advance_timeout_ms ?? 30000))
  const sessionAtArm = backendSessionId.value
  const stateAtArm = state.id
  pmLog.debug('SILENCE TIMER armed', { state: stateAtArm, ms })
  const fire = async () => {
    silenceTimer = null
    // Never fire stale: the session ended or the state moved on while waiting.
    if (backendSessionId.value !== sessionAtArm) return
    if ((currentState.value as any)?.id !== stateAtArm) return
    // Don't talk over the pilot mid-PTT — check again shortly.
    if (isRecording.value) {
      silenceTimer = setTimeout(fire, 5000)
      return
    }
    try {
      pmLog.info('SILENCE TIMEOUT fired →', stateAtArm)
      const response = await radioBackend.timeout(sessionAtArm)
      applyBackendDecision(response)
    } catch (e: any) {
      // 422 = the state changed under us (race with a transmission) — harmless.
      const status = e?.status ?? e?.response?.status
      if (status !== 422) pmLog.warn('SILENCE TIMEOUT failed', e)
    }
  }
  silenceTimer = setTimeout(fire, ms)
}

// Apply a backend decision (from a pilot transmission, a telemetry tick, or a
// silence timeout) to the local engine + UI: sync the
// flow/cursor/variables/flags, speak the controller reply, and surface
// completion. Shared so all backend-driven ATC lands through one code path.
const applyBackendDecision = (
  response: import('../composables/useRadioBackend').RadioTransmitResponse,
  opts: { transcript?: string } = {},
) => {
  // If the backend has chained to a different flow, switch the local engine
  // first so moveToSilent can find the new states and expectedFrequencyForState()
  // returns the correct frequency_name.
  if (response.active_flow && response.active_flow !== activeFlow.value) {
    pmLog.info('FLOW CHANGE  local:', activeFlow.value, '→ backend:', response.active_flow)
    try {
      setActiveFlow(response.active_flow)
    } catch (e) {
      pmLog.warn('setActiveFlow failed for', response.active_flow, e)
    }
  }

  // Advance local cursor through every state the backend auto-walked, then the
  // final state. moveToSilent updates current_unit, actions, handoffs and the
  // communication log without scheduling further auto-transitions.
  for (const stateId of response.auto_advanced_states ?? []) {
    pmLog.debug('moveToSilent ← auto_advanced:', stateId)
    moveToSilent(stateId)
  }
  pmLog.debug('moveToSilent ← next_state_id:', response.next_state_id)
  moveToSilent(response.next_state_id)

  // Capture the per-field readback diagnostic for the STT debug panel.
  lastReadbackReport.value = response.readback_report ?? []
  if (opts.transcript !== undefined) lastReadbackTranscript.value = opts.transcript

  // Update expected phrase AFTER cursor moves so any local-engine reactive
  // updates from moveToSilent have already settled.
  backendExpectedPhrase.value = response.expected_pilot_template ?? null

  // Sync variables + routing flags from backend so the local renderer stays in step.
  if (response.variables && Object.keys(response.variables).length) {
    patchVariables(response.variables)
    pmLog.debug('variables synced:', response.variables)
  }
  if (response.flags && Object.keys(response.flags).length) {
    patchFlags(response.flags)
    pmLog.debug('flags synced:', response.flags)
  }

  // TTS: use the pre-rendered string from the backend (correct variable values).
  let sayText = response.controller_say_rendered || response.controller_say_template
  const rb = response.readback_report ?? []
  const readbackPassed = rb.length > 0 && rb.every((r: any) => r.matched)
  if (sayText && readbackPassed && !/^\s*(readback correct|correct[,.\s]|negative|i say again)/i.test(sayText)) {
    sayText = `Readback correct. ${sayText}`
  }
  if (sayText) {
    pmLog.info('TTS →', sayText)
    lastControllerSay.value = sayText
    scheduleControllerSpeech(sayText)
    appendLogEntry('atc', sayText, response.next_state_id, {
      flow: response.active_flow,
      frequency: frequencies.value.active,
    })
  }

  if (response.fallback_used) {
    pmLog.warn('FALLBACK USED:', response.fallback_reason)
    console.warn('[Backend] Fallback used:', response.fallback_reason)
  }

  if (response.session_complete) {
    pmLog.info('SESSION COMPLETE — showing completion screen')
    completedScenario.value = activeScenario.value
    currentScreen.value = 'complete'
  }

  // Re-arm (or clear) the silence auto-advance for whatever state we're now on.
  armSilenceTimer()
}

const handlePilotTransmission = async (message: string, source: 'text' | 'ptt' = 'text') => {
  const transcript = message.trim()
  // Ignore empty or content-free transmissions: silence, a stray PTT tap, or
  // Whisper hallucinating punctuation on near-silent audio. A genuine short call
  // ("roger", "wilco") still contains letters/digits and passes.
  if (!transcript || !/[a-z0-9]/i.test(transcript)) return

  // STT MINIMUM-WORD GATE — search here if a spoken transmission was ignored.
  // Voice (PTT) only: drop transcripts shorter than the configured minimum.
  // Whisper hallucinates short real words ("Test", "Thank you", "Okay") on
  // near-silent or noisy audio; left unfiltered those reach the backend as a
  // (wrong) readback attempt — counting toward the 3x-skip — and now also
  // trigger a paid LLM-router call. Text input is exempt so deliberate short
  // commands still work. Threshold is the NUXT_PUBLIC_PTT_MIN_WORDS env var
  // (default 2); set it to 1 to effectively disable the gate.
  const minPttWords = Number(config.public.pttMinWords ?? 2)
  if (source === 'ptt' && transcript.split(/\s+/).filter(Boolean).length < minPttWords) {
    pmLog.info(`IGNORED short PTT transcript (<${minPttWords} words):`, transcript)
    return
  }

  // Mark this as the latest transmission; a newer one started before the backend
  // replies supersedes it (the stale reply is dropped below).
  const myGen = ++transmitGeneration

  const prefix = source === 'ptt' ? 'Pilot (PTT)' : 'Pilot'
  setLastTransmission(`${prefix}: ${transcript}`)

  // Log the pilot's call with the ACTUAL tuned frequency (the engine's own
  // notion of "active frequency" is unit-derived and can lag what's tuned).
  appendLogEntry('pilot', transcript, currentState.value?.id ?? '', {
    frequency: frequencies.value.active,
  })

  if (readbackEnabled.value) {
    speakPilotReadback(transcript)
  }

  // --- Radio check ---
  // A service call, valid on ANY frequency and answered by whoever owns it.
  // Handled entirely locally: it must bypass the wrong-frequency gate (its
  // purpose is verifying the tuned frequency) and never reach the backend
  // flow engine (the training state stays untouched).
  if (RADIO_CHECK_RE.test(transcript)) {
    answerRadioCheck(transcript)
    return
  }

  // --- Say again ---
  // Pilot asks ATC to repeat. Handled locally: re-speak the last controller
  // transmission without advancing the flow.
  if (SAY_AGAIN_RE.test(transcript) && lastControllerSay.value) {
    const reply = `I say again. ${lastControllerSay.value}`
    scheduleControllerSpeech(reply)
    appendLogEntry('atc', reply, currentState.value?.id ?? '', { frequency: frequencies.value.active })
    return
  }

  // --- Sign-off ---
  // A bare goodbye / thank-you (no readback or request alongside): acknowledge
  // politely instead of evaluating it as a transmission. Requires a farewell
  // with no digits, no readback/acknowledgement words, and only a few words, so
  // it never swallows a real call like "wilco, thanks" or a frequency readback.
  const wordCount = transcript.split(/\s+/).filter(Boolean).length
  const hasActionWord = /\b(wilco|roger|cleared|clear|runway|contact|ready|request|squawk|descend|climb|taxi|line\s?up|holding|hold short|approved|affirm|going|switching|push|startup)\b/i.test(transcript)
  if (FAREWELL_RE.test(transcript) && !/\d/.test(transcript) && !hasActionWord && wordCount <= 6) {
    const cs = (vars as any).value?.callsign ?? ''
    const reply = cs ? `Good day, ${cs}.` : 'Good day.'
    scheduleControllerSpeech(reply)
    appendLogEntry('atc', reply, currentState.value?.id ?? '', { frequency: frequencies.value.active })
    return
  }

  // --- Frequency check ---
  // Reject the transmission if the pilot is on the wrong frequency. A position
  // can publish several valid frequencies (e.g. two Tower freqs); accept any of
  // them, and only fall back to the single expected value when no list resolves.
  const expectedFreq = expectedFrequencyForState()
  const acceptedFreqs = acceptedFrequenciesForState()
  const activeNorm = normalizedFrequencyValue(frequencies.value.active)
  const onValidFreq = acceptedFreqs.length
    ? acceptedFreqs.includes(activeNorm)
    : frequencies.value.active === expectedFreq
  if (expectedFreq && !onValidFreq) {
    const callsign = (vars as any).value?.callsign ?? ''
    const freqName = (currentState.value as any)?.frequency_name as string | undefined
    // Tell the pilot exactly which frequency to switch to (and the position),
    // since tuning is manual and the call won't go through until they do.
    const target = freqName ? `${freqName} on ${expectedFreq}` : expectedFreq
    const reply = callsign
      ? `${callsign}, you are on the wrong frequency. Contact ${target}.`
      : `Station calling, wrong frequency. Contact ${target}.`
    pmLog.warn('WRONG FREQUENCY', { active: frequencies.value.active, expected: expectedFreq })
    lastControllerSay.value = reply
    scheduleControllerSpeech(reply)
    // Add the ATC "wrong frequency" reply to the communication log.
    appendLogEntry('atc', reply, currentState.value?.id ?? '', {
      offSchema: true,
      frequency: frequencies.value.active,
    })
    return
  }

  if (!backendSessionId.value) {
    pmLog.error('TRANSMIT BLOCKED — no backend session', { transcript, source })
    console.error('No backend session — cannot transmit')
    setLastTransmission(`${prefix}: ${transcript} (no session)`)
    return
  }

  pmLog.group(`▶ TRANSMIT  [${source}]  session=${backendSessionId.value.slice(0,8)}`, () => {
    pmLog.info('utterance   :', transcript)
    pmLog.info('local state :', currentState.value?.id ?? '—')
    pmLog.info('session_id  :', backendSessionId.value)
  })

  try {
    // The pilot spoke — a pending silence auto-advance no longer applies. The
    // response re-arms it if the next state also allows silence.
    clearSilenceTimer()
    const response = await radioBackend.transmit(backendSessionId.value, transcript)

    // Drop a stale reply if the pilot already transmitted again while this call
    // was in flight — only the newest transmission's result is applied (#16).
    if (myGen !== transmitGeneration) {
      pmLog.info('Discarded stale transmission reply (superseded by a newer transmission)')
      return
    }

    pmLog.group(`✓ RESPONSE  ${currentState.value?.id ?? '?'} → ${response.next_state_id}`, () => {
      pmLog.info('next_state        :', response.next_state_id)
      pmLog.info('auto_advanced     :', response.auto_advanced_states ?? [])
      pmLog.info('fallback_used     :', response.fallback_used, response.fallback_reason ?? '')
      pmLog.info('say_template      :', response.controller_say_template ?? '—')
      pmLog.info('say_rendered      :', response.controller_say_rendered ?? '—')
      pmLog.info('expected_pilot    :', response.expected_pilot_template ?? '—')
      pmLog.info('variables         :', response.variables)
      pmLog.info('flags             :', response.flags)
      if (response.trace?.length) {
        pmLog.debug('trace:')
        response.trace.forEach(t => pmLog.debug(`  [${t.type}]`, t.message))
      }
    })

    applyBackendDecision(response, { transcript })
  } catch (e: any) {
    const status = e?.status ?? e?.response?.status
    if (status === 404) {
      // Session expired (idle timeout) or backend restarted without the
      // persisted session — reset to scenario selection for a clean restart.
      pmLog.error('SESSION GONE (404) — resetting to scenario selection', { session: backendSessionId.value })
      backendSessionId.value = null
      error.value = 'Session expired — please start the scenario again.'
      currentScreen.value = 'scenario'
      return
    }
    pmLog.error('TRANSMIT FAILED', { transcript, session: backendSessionId.value, error: e })
    console.error('Backend transmission failed', e)
    setLastTransmission(`${prefix}: ${transcript} (backend failed)`)
  }
}

// VATSIM Integration
const loadFlightPlans = async () => {
  if (!vatsimId.value) return

  loading.value = true
  error.value = ''

  try {
    const response = await api.get('/api/vatsim/flightplans', {
      query: { cid: vatsimId.value }
    })

    if (Array.isArray(response) && response.length > 0) {
      flightPlans.value = response.slice(0, 10)
      currentScreen.value = 'flightselect'
    } else {
      error.value = 'No flight plans found for this VATSIM ID'
    }
  } catch (err) {
    console.error('Error loading flight plans:', err)
    error.value = 'Error loading flight plans. Please check the VATSIM ID.'
  } finally {
    loading.value = false
  }
}

// Overlay shown while a session is being created. For taxi flows the backend
// computes a real OSM taxi route synchronously, so the create call can take a
// few seconds — the spinner tells the user that work is happening.
const sessionStarting = ref(false)
const sessionStartingMessage = ref('Starting session…')

const startMonitoring = async (flightPlan: any, scenario: Scenario) => {
  activeScenario.value = scenario
  sessionStarting.value = true
  sessionStartingMessage.value = /^taxi/.test(scenario.startFlow)
    ? 'Calculating taxi route…'
    : 'Starting session…'

  // 1. Ensure the local tree is loaded from the Python backend (same source as session)
  try {
    if (!engineReady.value) {
      await fetchRuntimeTree(scenario.startFlow, config.public.radioBackendUrl as string)
    }
  } catch (err) {
    console.error('Failed to prepare decision engine', err)
    error.value = 'Entscheidungsbaum konnte nicht geladen werden.'
    sessionStarting.value = false
    return
  }

  // 2. Initialize the local flight engine first so generated values (stand, SID, squawk)
  //    are computed and available in vars.value before we create the backend session.
  initializeFlight(flightPlan)

  // 3a. Resolve which airport to use for frequencies.
  //     Departure scenarios use the dep airport; arrival scenarios use arr.
  const scenarioIcao: string | undefined =
    scenario.airport === 'arr'
      ? (flightPlan.arr || flightPlan.arrival || flightPlan.dep || flightPlan.departure)
      : (flightPlan.dep || flightPlan.departure || flightPlan.arr || flightPlan.arrival)
  activeAirportIcao.value = scenarioIcao

  // Fetch real airport frequencies BEFORE building backendVariables so that
  // all freq vars are resolved from live VATSIM/OpenAIP data.
  await fetchAirportFrequencies(scenarioIcao)

  // Runway in use from live ATIS (the flight plan carries no runway). Falls
  // back to the engine-generated one when no ATIS text mentions a runway.
  const atisRunway = extractAtisRunway(scenario.airport === 'arr' ? 'arr' : 'dep')
  if (atisRunway) {
    patchVariables({ runway: atisRunway })
    pmLog.info('Runway from ATIS:', atisRunway)
  }

  // Pre-generate the ATIS TTS audio now so the first tune-in plays instantly
  // instead of waiting for generation. Fire-and-forget.
  prefetchAtisAudio()

  // 3b. Build the backend variable payload.  The backend stores ALL keys so that
  //     frequencies declared in downstream chained flows (tower_freq for taxi-v1,
  //     departure_freq for tower-v1, etc.) are already populated with real airport
  //     values when the session advances to those flows.
  const v = (vars as any).value
  const backendVariables: Record<string, any> = {
    callsign:         v.callsign         || flightPlan.callsign || 'UNKNOWN',
    information:      v.atis_code        || 'K',
    destination:      v.dest             || flightPlan.arr || flightPlan.arrival || 'Unknown',
    stand:            v.stand            || 'A1',
    sid:              v.sid              || 'UNKNOWN1A',
    initial_altitude: String(v.initial_altitude_ft ?? 5000),
    squawk:           String(v.squawk ?? '2000'),
    // Shared / arrival variables. The engine generates these, but they were not
    // being forwarded — so arrival flows (and taxi/tower on departure) fell back
    // to YAML defaults and ignored the selected flight. Names are mapped to the
    // backend flow conventions (qnh_hpa→qnh, acf_type→aircraft_type, …).
    runway:           atisRunway         || v.runway || '25R',
    qnh:              String(v.qnh_hpa ?? '1013'),
    surface_wind:     v.surface_wind     || '250/08',
    // taxi_route is intentionally NOT sent: the backend computes the real OSM
    // taxi route (and crossings) from airport_icao + stand/runway, and falls
    // back to the flow's YAML default on its own. Sending a placeholder here
    // would count as a caller override and suppress that computation.
    aircraft_type:    v.acf_type         || 'A320',
    cruise_level:     v.cruise_flight_level || 'FL360',
    assigned_squawk:  String(v.squawk ?? '2000'),
    // All airport frequencies — available to every flow in the chain.
    delivery_freq:    v.delivery_freq    || '121.950',
    ground_freq:      v.ground_freq      || '121.800',
    tower_freq:       v.tower_freq       || '118.700',
    departure_freq:   v.departure_freq   || '120.000',
    approach_freq:    v.approach_freq    || '119.000',
    handoff_freq:     v.handoff_freq     || '131.150',
  }

  // VFR flights identify by aircraft registration, not an airline callsign.
  // Assign a German D-registration and its abbreviated form (D-EMIL -> D-IL,
  // first letter + last two), which ATC uses after the first call. Mirror it
  // into the local engine vars and HUD so the display matches the radio.
  if (scenario.startFlow.startsWith('vfr') || scenario.startFlow.startsWith('info')) {
    const pool = ['D-EMIL', 'D-EKLM', 'D-ENNY', 'D-ELLA', 'D-EOMT', 'D-ELPC', 'D-EMTO', 'D-EBRA']
    const reg = pool[Math.floor(Math.random() * pool.length)]
    const short = `D-${reg.replace(/^D-/, '').slice(-2)}`
    backendVariables.callsign = reg
    backendVariables.callsign_short = short
    patchVariables({ callsign: reg, callsign_short: short })
  } else {
    backendVariables.callsign_short = backendVariables.callsign
  }
  pmLog.info('backend variables payload:', backendVariables)

  // 4. Create a backend session with the flight-plan-derived variables
  try {
    error.value = ''
    const session = await radioBackend.createSession(
      scenario.startFlow,
      backendVariables,
      scenario.noChain,
      scenarioIcao,
      v.dest || flightPlan.arr || flightPlan.arrival,
      // Live aircraft position (bridge connected): backend starts the taxi
      // route at the real parking position instead of a random stand.
      bridgeConnected.value ? bridgePosition.value : null,
    )
    backendSessionId.value = session.session_id
    pmLog.group(`SESSION CREATED  id=${session.session_id.slice(0, 8)}`, () => {
      pmLog.info('flow        :', session.flow_slug)
      pmLog.info('start state :', session.current_state)
      pmLog.info('variables   :', session.variables)
      pmLog.info('flags       :', session.flags)
    })
    // Sync cursor to wherever the backend initialised (usually start_state)
    moveToSilent(session.current_state)
    pmLog.debug('moveToSilent ← session start_state:', session.current_state)
    // Sync session variables back so the local renderer stays in step.
    if (session.variables && Object.keys(session.variables).length) {
      patchVariables(session.variables)
    }
    // Sync boolean routing flags from session
    if (session.flags && Object.keys(session.flags).length) {
      patchFlags(session.flags)
    }
    // Seed the expected pilot phrase from the start state
    backendExpectedPhrase.value = session.expected_pilot_template ?? null
    pmLog.info('expected_pilot (session start):', backendExpectedPhrase.value ?? '—')
  } catch (err) {
    pmLog.error('SESSION CREATE FAILED', err)
    console.error('Failed to create backend session', err)
    error.value = 'Verbindung zum Training-Backend fehlgeschlagen.'
    return
  } finally {
    // The slow part (route computation) is done once createSession resolves.
    sessionStarting.value = false
  }

  error.value = ''
  selectedPlan.value = flightPlan
  currentScreen.value = 'monitor'
  persistSelectedPlan(flightPlan)
  maybeShowFirstRunHelp()

  // Start from a known baseline; the first controller's frequency is tuned in
  // automatically below, once the initial state-walk tells us which pilot state
  // the scenario opens on.
  frequencies.value.active = '121.900'
  frequencies.value.standby = '118.100'

  // 4. Walk the initial ATC/system states locally (deterministic, no LLM).
  //    Safe because we loaded the tree from the same Python backend, so the
  //    walk is identical to what the backend will do on the first transmission.
  try {
    await nextTick()
    const startMessages = collectAtcStatesUntilPilotTurn()
    for (const msg of startMessages) {
      scheduleControllerSpeech(msg.say_tpl)
    }
  } catch (err) {
    console.warn('Initial state advance failed:', err)
  }

  // Pre-tune COM1 active to the frequency the opening pilot call is expected on,
  // so the very first transmission isn't met with a confusing 'wrong frequency'
  // rejection. Later handoffs stay manual — tuning to the next controller
  // remains part of the exercise.
  await nextTick()
  const firstFreq = expectedFrequencyForState()
  if (firstFreq) {
    frequencies.value.active = firstFreq
    pmLog.info('Pre-tuned COM1 active to first frequency:', firstFreq)
  }
}

const startDemoFlight = () => {
  const demoFlight = {
    callsign: 'DLH39A',
    aircraft: 'A320/L',
    dep: 'EDDF',
    arr: 'EDDM',
    altitude: '36000',
  }
  selectedPlan.value = demoFlight
  currentScreen.value = 'scenario'
}

/** Launch a specific scenario with the current flight plan. */
const launchScenario = async (scenario: Scenario) => {
  if (!selectedPlan.value) return
  await startMonitoring(selectedPlan.value, scenario)
}

/** Re-fly the same scenario that was just completed. */
const flyAgain = async () => {
  if (!completedScenario.value || !selectedPlan.value) {
    currentScreen.value = 'scenario'
    return
  }
  await startMonitoring(selectedPlan.value, completedScenario.value)
}

const backToSetup = () => {
  currentScreen.value = 'login'
  selectedPlan.value = null
  persistSelectedPlan(null)
  clearLastTransmission()
  airportFrequencies.value = []
  frequencySources.value = { vatsim: false, openaip: false }
}

// Audio/PTT Functions
const requestMicAccess = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true })
    micPermission.value = true
  } catch (err) {
    console.error('Microphone permission denied:', err)
    micPermission.value = false
  }
}

// ---------------------------------------------------------------------------
// Pre-recording: continuously capture mic into a PCM ring buffer so the start
// of a PTT transmission isn't clipped. On PTT release we prepend the rolling
// buffer to the actively-captured frames and ship as WAV.
// ---------------------------------------------------------------------------
let prerecCtx: AudioContext | null = null
let prerecStream: MediaStream | null = null
let prerecSource: MediaStreamAudioSourceNode | null = null
let prerecNode: ScriptProcessorNode | null = null
let prerecSampleRate = 16000
let prerecRing: Float32Array | null = null
let prerecRingWrite = 0
let prerecRingFilled = false
let prerecLiveChunks: Float32Array[] = []
let prerecLiveCapture = false
let prerecLiveIntercom = false
let prerecStarting = false
let prerecLivePrebuffer: Float32Array = new Float32Array(0)

const snapshotPrerecPCM = (): Float32Array => {
  if (!prerecRing) return new Float32Array(0)
  const rb = prerecRing
  if (!prerecRingFilled) return rb.slice(0, prerecRingWrite)
  const out = new Float32Array(rb.length)
  const tail = rb.length - prerecRingWrite
  out.set(rb.subarray(prerecRingWrite), 0)
  out.set(rb.subarray(0, prerecRingWrite), tail)
  return out
}

const encodeWav = (pcm: Float32Array, sampleRate: number): Blob => {
  const length = pcm.length
  const buffer = new ArrayBuffer(44 + length * 2)
  const view = new DataView(buffer)
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + length * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, length * 2, true)
  let off = 44
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]))
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    off += 2
  }
  return new Blob([buffer], { type: 'audio/wav' })
}

const stopPrerecCapture = () => {
  prerecLiveCapture = false
  prerecLiveChunks = []
  try { prerecNode?.disconnect() } catch {}
  try { prerecSource?.disconnect() } catch {}
  if (prerecCtx) {
    try { void prerecCtx.close() } catch {}
  }
  if (prerecStream) {
    prerecStream.getTracks().forEach(t => t.stop())
  }
  prerecCtx = null
  prerecStream = null
  prerecSource = null
  prerecNode = null
  prerecRing = null
  prerecRingWrite = 0
  prerecRingFilled = false
}

const startPrerecCapture = async () => {
  if (typeof window === 'undefined') return
  if (prerecCtx || prerecStarting) return
  if (!prerecEnabled.value) return
  if (inputMode.value !== 'voice') return
  if (!micPermission.value) return

  prerecStarting = true
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    })
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) {
      stream.getTracks().forEach(t => t.stop())
      return
    }
    const ctx = new AC()
    prerecCtx = ctx
    prerecStream = stream
    prerecSampleRate = ctx.sampleRate
    prerecSource = ctx.createMediaStreamSource(stream)
    const node = ctx.createScriptProcessor(2048, 1, 1)
    prerecNode = node
    const ringSize = Math.max(1, Math.ceil(prerecSampleRate * Math.max(0.2, prerecSeconds.value)))
    prerecRing = new Float32Array(ringSize)
    prerecRingWrite = 0
    prerecRingFilled = false
    prerecLiveChunks = []
    prerecLiveCapture = false

    node.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0)
      const rb = prerecRing
      if (!rb) return
      const len = input.length
      for (let i = 0; i < len; i++) {
        rb[prerecRingWrite++] = input[i]
        if (prerecRingWrite >= rb.length) {
          prerecRingWrite = 0
          prerecRingFilled = true
        }
      }
      if (prerecLiveCapture) {
        prerecLiveChunks.push(new Float32Array(input))
      }
    }

    prerecSource.connect(node)
    // ScriptProcessor only emits events while connected to destination.
    // Mute via a zero-gain node so we don't echo mic to speakers.
    const muteGain = ctx.createGain()
    muteGain.gain.value = 0
    node.connect(muteGain)
    muteGain.connect(ctx.destination)
  } catch (err) {
    console.warn('[PM] prerec capture failed', err)
    stopPrerecCapture()
  } finally {
    prerecStarting = false
  }
}

const restartPrerecCapture = async () => {
  stopPrerecCapture()
  await startPrerecCapture()
}

/** Clear any pending PTT auto-stop timer. */
const clearPttTimer = () => {
  if (pttMaxDurationTimer !== null) {
    clearTimeout(pttMaxDurationTimer)
    pttMaxDurationTimer = null
  }
}

/** Start the PTT auto-stop safety timer. Fires stopRecording() if the user
 *  holds PTT longer than PTT_MAX_DURATION_MS.  Without this, very long
 *  recordings produce blobs too large to base64-encode synchronously. */
const startPttTimer = () => {
  clearPttTimer()
  pttMaxDurationTimer = setTimeout(() => {
    pmLog.warn(`PTT auto-stop: exceeded ${PTT_MAX_DURATION_MS / 1000}s limit`)
    stopRecording()
  }, PTT_MAX_DURATION_MS)
}

const startRecording = async (isIntercom = false) => {
  if (!micPermission.value) {
    await requestMicAccess()
    return
  }

  // Barge-in: keying the mic cuts any ATC speech still playing, mirroring a real
  // half-duplex radio where transmitting overrides the controller's output.
  stopCurrentSpeech()

  // Pre-recording path: ring buffer + active capture, encoded to WAV on release
  if (prerecEnabled.value) {
    if (!prerecCtx) {
      await startPrerecCapture()
    }
    if (prerecCtx && prerecNode) {
      prerecLivePrebuffer = snapshotPrerecPCM()
      prerecLiveChunks = []
      prerecLiveIntercom = isIntercom
      prerecLiveCapture = true
      isRecording.value = true
      startPttTimer()
      if (radioEffectsEnabled.value) {
        playPTTBeep(true)
      }
      return
    }
    // Fall through to MediaRecorder if prerec init failed
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      }
    })

    mediaRecorder.value = new MediaRecorder(stream)
    audioChunks.value = []

    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.value.push(event.data)
      }
    }

    mediaRecorder.value.onstop = () => {
      const audioBlob = new Blob(audioChunks.value, { type: 'audio/wav' })
      processTransmission(audioBlob, isIntercom, 'webm')
      stream.getTracks().forEach(track => track.stop())
    }

    mediaRecorder.value.start()
    isRecording.value = true
    startPttTimer()

    if (radioEffectsEnabled.value) {
      playPTTBeep(true)
    }

  } catch (err) {
    console.error('Failed to start recording:', err)
  }
}

const stopRecording = () => {
  // Always clear the safety timer, regardless of which recording path is active.
  clearPttTimer()

  if (prerecLiveCapture) {
    prerecLiveCapture = false
    isRecording.value = false
    if (radioEffectsEnabled.value) {
      playPTTBeep(false)
    }
    const prebuffer = prerecLivePrebuffer
    const liveLen = prerecLiveChunks.reduce((sum, c) => sum + c.length, 0)
    const combined = new Float32Array(prebuffer.length + liveLen)
    combined.set(prebuffer, 0)
    let off = prebuffer.length
    for (const c of prerecLiveChunks) {
      combined.set(c, off)
      off += c.length
    }
    prerecLiveChunks = []
    prerecLivePrebuffer = new Float32Array(0)
    if (combined.length === 0) return
    const blob = encodeWav(combined, prerecSampleRate)
    processTransmission(blob, prerecLiveIntercom, 'wav')
    return
  }

  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
    isRecording.value = false

    if (radioEffectsEnabled.value) {
      playPTTBeep(false)
    }
  }
}

/**
 * Convert an ArrayBuffer to a base64 string without blowing the call stack.
 *
 * The naive approach — btoa(String.fromCharCode(...new Uint8Array(buf))) —
 * spreads every byte as a separate function argument.  For recordings longer
 * than a few seconds the argument count exceeds the JS engine limit (~65 k –
 * 131 k args) and throws RangeError: Maximum call stack size exceeded,
 * silently aborting the PTT request before it is ever sent.
 *
 * Processing in 8 KB chunks keeps argument count well within safe limits
 * regardless of recording length.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 8192
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)))
  }
  return btoa(binary)
}

// Build the Whisper-prompt seed for the current state: the expected pilot
// phrase plus the active variable values (callsign, SID, squawk, runway,
// frequencies…). The server expands these to spoken ICAO form and appends them
// to the bias prompt so Whisper is steered toward exactly what's expected.
function buildSttExpected(): { phrase?: string; tokens: string[] } {
  const phrase = backendExpectedPhrase.value?.trim() || undefined
  const dict = ((vars as any).value ?? {}) as Record<string, unknown>
  const tokens: string[] = []
  for (const val of Object.values(dict)) {
    if (typeof val === 'number') { tokens.push(String(val)); continue }
    if (typeof val === 'string') {
      const t = val.trim()
      if (t && t.length <= 24) tokens.push(t)
    }
  }
  return { phrase, tokens }
}

const processTransmission = async (audioBlob: Blob, isIntercom: boolean, format: 'wav' | 'webm' = 'webm') => {
  const channel = isIntercom ? 'INTERCOM' : 'RADIO'
  pmLog.info(`PTT ▶ ${channel}  blob=${(audioBlob.size / 1024).toFixed(1)}KB  fmt=${format}  session=${backendSessionId.value?.slice(0,8) ?? 'none'}`)
  try {
    const arrayBuffer = await audioBlob.arrayBuffer()
    const base64Audio = arrayBufferToBase64(arrayBuffer)

    if (isIntercom) {
      const result = await api.post('/api/atc/ptt', {
        audio: base64Audio,
        moduleId: 'pilot-monitoring-intercom',
        lessonId: 'intercom',
        format,
        sessionId: backendSessionId.value || undefined,
      })

      if (result.success) {
        pmLog.info('PTT ✓ INTERCOM  transcription:', result.transcription)
        setLastTransmission(`INTERCOM: ${result.transcription}`)
        const transcription = result.transcription.toLowerCase()
        if (transcription.includes('checklist') || transcription.includes('check list')) {
          speakWithRadioEffects('Checklist functionality available in advanced mode', {
            delayMs: 600,
            updateLastTransmission: false,
            tag: 'system-info',
            useNormalizedForTTS: true
          })
        }
      }
    } else {
      const result = await api.post('/api/atc/ptt', {
        audio: base64Audio,
        moduleId: 'pilot-monitoring',
        lessonId: currentState.value?.id || 'general',
        format,
        sessionId: backendSessionId.value || undefined,
        expected: buildSttExpected(),
      })

      if (result.success) {
        pmLog.info('PTT ✓ RADIO  transcription:', result.transcription)
        await handlePilotTransmission(result.transcription, 'ptt')
      } else {
        pmLog.warn('PTT ✗ RADIO  Whisper returned no transcription', result)
      }
    }
  } catch (err) {
    pmLog.error(`PTT ✗ ${channel}  error:`, err)
    console.error('Error processing transmission:', err)
    setLastTransmission('Error processing audio')
  }
}

const sendPilotText = async () => {
  const text = pilotInput.value.trim()
  if (!text) return

  pilotInput.value = ''
  await handlePilotTransmission(text, 'text')
}

const FREQUENCY_PLACEHOLDER = '---'

const frequencyTypeMap: Record<string, keyof FrequencyVariableUpdate> = {
  ATIS: 'atis_freq',
  DEL: 'delivery_freq',
  CLD: 'delivery_freq',
  GND: 'ground_freq',
  TWR: 'tower_freq',
  DEP: 'departure_freq',
  APP: 'approach_freq',
  CTR: 'handoff_freq',
  ACC: 'handoff_freq',
  FSS: 'handoff_freq'
}

const toFrequencyVariableUpdate = (entry: AirportFrequencyEntry): FrequencyVariableUpdate | null => {
  if (!entry?.frequency) {
    return null
  }

  const targetKey = frequencyTypeMap[entry.type]
  if (!targetKey) {
    return null
  }

  return { [targetKey]: entry.frequency } as FrequencyVariableUpdate
}

const updateEngineFrequencyFromEntry = (entry: AirportFrequencyEntry) => {
  const update = toFrequencyVariableUpdate(entry)
  if (!update) {
    return
  }

  updateFrequencyVariables(update)
}

const syncLocalFrequenciesWithEngine = (updates: FrequencyVariableUpdate) => {
  const currentUnit = flags.value.current_unit
  if (currentUnit === 'DEL' && updates.delivery_freq) {
    frequencies.value.active = updates.delivery_freq
  } else if (currentUnit === 'GROUND' && updates.ground_freq) {
    frequencies.value.active = updates.ground_freq
  } else if (currentUnit === 'TOWER' && updates.tower_freq) {
    frequencies.value.active = updates.tower_freq
  } else if (currentUnit === 'DEP' && updates.departure_freq) {
    frequencies.value.active = updates.departure_freq
  } else if (currentUnit === 'APP' && updates.approach_freq) {
    frequencies.value.active = updates.approach_freq
  } else if (currentUnit === 'CTR' && updates.handoff_freq) {
    frequencies.value.active = updates.handoff_freq
  }

  if (updates.ground_freq) {
    frequencies.value.standby = updates.ground_freq
  }
}

const applyFrequencyVariablesFromList = (list: AirportFrequencyEntry[], options: { syncRadio?: boolean } = {}) => {
  if (!Array.isArray(list) || list.length === 0) {
    return
  }

  const prioritized = [...list].sort((a, b) => {
    if (a.source === b.source) return 0
    return a.source === 'vatsim' ? -1 : 1
  })

  const updates: FrequencyVariableUpdate = {}

  for (const entry of prioritized) {
    const targetKey = frequencyTypeMap[entry.type]
    if (!targetKey) continue
    if (updates[targetKey]) continue
    if (!entry.frequency) continue
    updates[targetKey] = entry.frequency
  }

  if (Object.keys(updates).length > 0) {
    updateFrequencyVariables(updates)
    if (options.syncRadio !== false) {
      syncLocalFrequenciesWithEngine(updates)
    }
  }
}

const fetchAirportFrequencies = async (icao: string | undefined, options: { silent?: boolean } = {}) => {
  if (!icao) return

  // Silent mode (background refresh): keep the current list visible while
  // fetching and never retune the user's radio — only swap data when it arrives.
  if (!options.silent) {
    airportFrequencyLoading.value = true
    airportFrequencies.value = []
    airportName.value = undefined
    frequencySources.value = { vatsim: false, openaip: false }
  }

  try {
    const response = await api.get(`/api/airports/${encodeURIComponent(icao)}/frequencies`)
    const entries = Array.isArray(response?.frequencies) ? response.frequencies as AirportFrequencyEntry[] : []
    airportFrequencies.value = entries
    airportName.value = typeof response?.airportName === 'string' ? response.airportName : undefined
    frequencySources.value = {
      vatsim: Boolean(response?.sources?.vatsim),
      openaip: Boolean(response?.sources?.openaip)
    }

    applyFrequencyVariablesFromList(entries, { syncRadio: !options.silent })
  } catch (err) {
    console.error('Failed to load airport frequencies:', err)
    if (!options.silent) {
      airportFrequencies.value = []
      airportName.value = undefined
      frequencySources.value = { vatsim: false, openaip: false }
    }
  } finally {
    if (!options.silent) {
      airportFrequencyLoading.value = false
    }
  }
}

const setActiveFrequencyFromList = (entry: AirportFrequencyEntry) => {
  if (!entry) return
  const isPlaceholder = !entry.frequency || entry.frequency === FREQUENCY_PLACEHOLDER

  if (!isPlaceholder && frequencies.value.active !== entry.frequency) {
    // Tuning away from the current frequency — cut any in-progress ATC speech
    // so the pilot no longer "hears" the controller on the old channel.
    stopCurrentSpeech()
    frequencies.value.standby = frequencies.value.active
    frequencies.value.active = entry.frequency
  }

  updateEngineFrequencyFromEntry(entry)
}

const setStandbyFrequencyFromList = (entry: AirportFrequencyEntry) => {
  if (!entry) return
  const isPlaceholder = !entry.frequency || entry.frequency === FREQUENCY_PLACEHOLDER

  if (!isPlaceholder) {
    frequencies.value.standby = entry.frequency
  }

  updateEngineFrequencyFromEntry(entry)
}

const fetchMetarText = async (icao: string | undefined): Promise<string | null> => {
  if (!icao) return null

  try {
    const response = await api.get('/api/vatsim/metar', { query: { id: icao } })
    if (typeof response === 'string') {
      const trimmed = response.trim()
      return trimmed.length ? trimmed : null
    }
  } catch (err) {
    console.error('Failed to fetch METAR:', err)
  }

  return null
}

/** "Arrival" / "Departure" variant from the station callsign (EDDF_A_ATIS / EDDF_D_ATIS). */
const atisVariantLabel = (entry: AirportFrequencyEntry): string => {
  const callsign = (entry.callsign || '').toUpperCase()
  if (callsign.includes('_A_')) return 'Arrival '
  if (callsign.includes('_D_')) return 'Departure '
  // Fallback: published station name (OpenAIP) sometimes carries the variant.
  const label = (entry.label || '').toLowerCase()
  if (label.includes('arr')) return 'Arrival '
  if (label.includes('dep')) return 'Departure '
  return ''
}

const buildAtisAnnouncement = (entry: AirportFrequencyEntry, fallback?: string): string => {
  const parts: string[] = []
  const icao = activeAirportIcao.value || flightContext.value.dep
  const variant = atisVariantLabel(entry)
  const location = icao ? `${icao} ${variant}ATIS` : `${variant}ATIS`
  parts.push(location)

  if (entry.atisCode) {
    parts.push(`Information ${entry.atisCode}`)
  }

  if (entry.atisText) {
    parts.push(entry.atisText)
  } else if (fallback) {
    parts.push(fallback)
  }

  if (!entry.frequency || entry.frequency === FREQUENCY_PLACEHOLDER) {
    parts.push('Frequency unavailable')
  } else {
    parts.push(`Frequency ${entry.frequency}`)
  }

  return parts
    .map(segment => segment.trim())
    .filter(Boolean)
    .join('. ')
    .replace(/\s+/g, ' ')
}

const buildAtisLoopKey = (entry: AirportFrequencyEntry): string => {
  const icao = (activeAirportIcao.value || flightContext.value.dep || 'XXXX').toUpperCase()
  // Station identity: with separate Arrival/Departure ATIS, each station
  // gets its own loop (own content, own virtual-clock epoch).
  const station = (entry.callsign || normalizedFrequencyValue(entry.frequency) || '-').toUpperCase()
  const code = entry.atisCode || '-'
  const text = (entry.atisText || '').trim()
  return `${icao}|${station}|${code}|${text.length}`
}

const resolveAtisEpoch = (entry: AirportFrequencyEntry): number => {
  if (entry.lastUpdated) {
    const parsed = Date.parse(entry.lastUpdated)
    if (Number.isFinite(parsed)) return parsed
  }
  // No timestamp from VATSIM — pin a stable epoch per ATIS content so that
  // tuning away and back resumes mid-broadcast instead of restarting at zero.
  const key = buildAtisLoopKey(entry)
  const cached = atisEpochByKey.get(key)
  if (cached) return cached
  const epoch = Date.now()
  atisEpochByKey.set(key, epoch)
  return epoch
}

const ensureAtisAudioLoop = (): AtisAudioLoop => {
  if (!atisAudioLoop) {
    atisAudioLoop = createAtisAudioLoop()
  }
  return atisAudioLoop
}

const stopAtisLoop = () => {
  atisLoopSeq += 1
  atisLoopActive = false
  atisLoopKey.value = null
  if (atisAudioLoop) {
    try {
      atisAudioLoop.stop()
    } catch (err) {
      pmLog.warn('ATIS loop stop failed', err)
    }
  }
}

// TTS audio cache per ATIS broadcast (keyed by loop key + signal level) so
// tune-in is instant when the audio was prefetched or heard before.
const atisAudioRequestCache = new Map<string, Promise<any | null>>()

/** Request (or reuse) the TTS audio for an ATIS broadcast. Deduped by content. */
const requestAtisAudio = (entry: AirportFrequencyEntry, content: string): { announcement: string; promise: Promise<any | null> } => {
  const announcement = buildAtisAnnouncement({ ...entry, atisText: content })
  const cacheKey = `${buildAtisLoopKey(entry)}|${signalStrength.value}`

  let promise = atisAudioRequestCache.get(cacheKey)
  if (!promise) {
    const spokenAnnouncement = normalizeAtisForSpeech(announcement, {
      airportIcao: activeAirportIcao.value || flightContext.value.dep,
      airportName: airportName.value,
    })
    promise = api.post('/api/atc/say', {
      text: spokenAnnouncement,
      preNormalized: true,
      level: signalStrength.value,
      voice: 'verse',
      speed: 0.9,
      moduleId: 'pilot-monitoring',
      lessonId: 'atis',
      tag: 'atis',
      sessionId: engineSessionId.value || flags.value.session_id || undefined,
    }).catch((err: any) => {
      // Drop failed requests from the cache so a retune retries.
      atisAudioRequestCache.delete(cacheKey)
      pmLog.error('ATIS TTS failed', err)
      return null
    })
    atisAudioRequestCache.set(cacheKey, promise)
  }

  return { announcement, promise }
}

/** Pre-generate TTS for all ATIS broadcasts so the first tune-in plays instantly. */
const prefetchAtisAudio = () => {
  for (const entry of atisEntries.value) {
    const content = (entry.atisText || '').trim()
    if (!content) continue
    requestAtisAudio(entry, content)
  }
}

const startAtisLoop = async (entry: AirportFrequencyEntry) => {
  if (!entry) return

  const desiredKey = buildAtisLoopKey(entry)
  if (atisLoopActive && atisLoopKey.value === desiredKey) {
    return
  }

  stopAtisLoop()

  // Carrier-Noise SOFORT — user gets feedback before TTS is back
  const loop = ensureAtisAudioLoop()
  try {
    loop.startLoading()
  } catch (err) {
    pmLog.warn('ATIS carrier start failed', err)
  }
  atisLoopActive = true
  atisLoopKey.value = desiredKey

  let content = (entry.atisText || '').trim()
  if (!content) {
    const metar = await fetchMetarText(activeAirportIcao.value || flightContext.value.dep)
    if (metar) {
      content = `METAR ${metar}`
    }
  }

  if (!content) {
    setLastTransmission('ATIS: No current information available')
    // Lass den Carrier laufen — Pilot hört dass die Frequenz aktiv ist, nur keine Ansage
    return
  }

  const { announcement, promise } = requestAtisAudio(entry, content)
  const epoch = resolveAtisEpoch(entry)
  const requestSeq = ++atisLoopSeq
  atisPlaybackLoading.value = true

  try {
    const response = await promise

    if (requestSeq !== atisLoopSeq) return
    if (!response?.success || !response.audio) {
      pmLog.warn('ATIS loop TTS returned no audio')
      atisLoopActive = false
      atisLoopKey.value = null
      return
    }

    const result = await loop.startBroadcast({
      audioBase64: response.audio.base64,
      mime: response.audio.mime,
      epochMs: epoch,
    })

    if (requestSeq !== atisLoopSeq) return
    if (!result) {
      pmLog.warn('ATIS loop broadcast start returned null (decode failed?)')
      // Mark inactive so a retune triggers a fresh attempt instead of being
      // swallowed by the "already active on this key" early-return.
      atisLoopActive = false
      atisLoopKey.value = null
      return
    }

    pmLog.info('ATIS loop start', {
      icao: activeAirportIcao.value || flightContext.value.dep,
      atisCode: entry.atisCode,
      duration: result.duration,
      requestedOffset: result.requestedOffset,
      epochAgeSec: (Date.now() - epoch) / 1000,
    })

    setLastTransmission(`ATIS: ${announcement}`)
  } catch (err) {
    pmLog.error('ATIS loop start failed', err)
    if (requestSeq === atisLoopSeq) {
      atisLoopActive = false
      atisLoopKey.value = null
    }
  } finally {
    if (requestSeq === atisLoopSeq) {
      atisPlaybackLoading.value = false
    }
  }
}

const playAtisBroadcast = async () => {
  const atisEntry = atisFrequencyEntry.value
  if (!atisEntry) return
  setActiveFrequencyFromList(atisEntry)
  await startAtisLoop(atisEntry)
}

const RADIO_CHECK_RE = /\b(radio|signal)\s*check\b|how do you read/i

// Pilot asking ATC to repeat its last transmission.
const SAY_AGAIN_RE = /\b(say again|come again|repeat( that| your last)?)\b|please\s+say\s+again|pls\s+say\s+again/i
// Bare sign-off / pleasantry (no substantive content alongside).
const FAREWELL_RE = /\b(good\s?bye|bye[\s-]?bye|tsch(ü|ue)ss|servus|good day|cheerio|auf\s?wieder|thank you|thanks|danke)\b/i

// Monotonic counter so a newer pilot transmission supersedes an older one still
// awaiting its backend response — only the latest result is applied (#16).
let transmitGeneration = 0

/** Spoken readability per signal-strength level (1–5). */
const READABILITY_PHRASE: Record<number, string> = {
  5: 'read you 5, loud and clear',
  4: 'read you 4',
  3: 'read you 3, readable with difficulty',
  2: 'read you 2, say again',
  1: 'read you 1, unreadable',
}

/** Whichever station owns the currently tuned frequency, if any. */
const tunedStationEntry = (): AirportFrequencyEntry | null => {
  const active = normalizedFrequencyValue(frequencies.value.active)
  if (!active) return null
  return airportFrequencies.value.find(entry =>
    entry.frequency
    && entry.frequency !== FREQUENCY_PLACEHOLDER
    && normalizedFrequencyValue(entry.frequency) === active,
  ) ?? null
}

const answerRadioCheck = (transcript: string) => {
  const callsign = (vars as any).value?.callsign || flightContext.value.callsign || ''
  const entry = tunedStationEntry()

  // ATIS is a broadcast, and an unknown frequency is unstaffed — no reply.
  if (!entry || entry.type === 'ATIS') {
    pmLog.info('RADIO CHECK — no station on', frequencies.value.active)
    setLastTransmission(`Pilot: ${transcript} — no reply on ${frequencies.value.active}`)
    appendLogEntry('system', `No reply on ${frequencies.value.active}`, currentState.value?.id ?? '', {
      radioCheck: true,
      frequency: frequencies.value.active,
    })
    return
  }

  const role = FREQ_ROLE_LABEL[entry.type] || entry.type
  const station = airportName.value ? `${airportName.value} ${role}` : role
  const readability = READABILITY_PHRASE[signalStrength.value] || `read you ${signalStrength.value}`
  const reply = callsign
    ? `${callsign}, ${station}, ${readability}`
    : `Station calling, ${station}, ${readability}`

  pmLog.info('RADIO CHECK', { station, freq: frequencies.value.active, readability: signalStrength.value })
  lastControllerSay.value = reply
  scheduleControllerSpeech(reply)
  appendLogEntry('atc', reply, currentState.value?.id ?? '', {
    radioCheck: true,
    frequency: frequencies.value.active,
  })
}

const performRadioCheck = async () => {
  if (!flightContext.value.callsign) return

  radioCheckLoading.value = true

  const station = tunedStationEntry()
  const stationName = station && station.type !== 'ATIS'
    ? (airportName.value ? `${airportName.value} ${FREQ_ROLE_LABEL[station.type] || station.type}` : FREQ_ROLE_LABEL[station.type] || station.type)
    : frequencies.value.active
  const message = `${stationName}, ${flightContext.value.callsign}, radio check`

  try {
    await handlePilotTransmission(message, 'text')
  } catch (err) {
    console.error('Radio check failed:', err)
  } finally {
    radioCheckLoading.value = false
  }
}

const swapFrequencies = () => {
  swapAnimation.value = true

  // Swapping away from the active frequency — cut any in-progress speech
  // so the pilot no longer "hears" the controller on the old channel.
  if (frequencies.value.active !== frequencies.value.standby) {
    stopCurrentSpeech()
  }

  const temp = frequencies.value.active
  frequencies.value.active = frequencies.value.standby
  frequencies.value.standby = temp

  setTimeout(() => {
    swapAnimation.value = false
  }, 500)
}

// --- Frequency presets (for the hold-to-select gesture) ---------------------
const FREQ_ROLE_ORDER = ['ATIS', 'DEL', 'CLD', 'GND', 'TWR', 'DEP', 'APP', 'CTR', 'ACC', 'FSS']
const FREQ_ROLE_LABEL: Record<string, string> = {
  ATIS: 'ATIS', DEL: 'Delivery', CLD: 'Delivery', GND: 'Ground', TWR: 'Tower',
  DEP: 'Departure', APP: 'Approach', CTR: 'Center', ACC: 'Center', FSS: 'Radio',
}

const frequencyPresets = computed<DisplayAirportFrequencyEntry[]>(() => {
  // Use the grouped overview list so every distinct frequency shows up in the dropdown
  // (deduped by type+frequency, with merged sources for tooltip).
  return displayAirportFrequencies.value
})

const presetKey = (entry: AirportFrequencyEntry | DisplayAirportFrequencyEntry) =>
  'displayKey' in entry ? entry.displayKey : `${entry.type}-${entry.frequency}`
const presetLabel = (entry: AirportFrequencyEntry) => {
  // Distinguish multiple ATIS stations (Arrival ATIS / Departure ATIS).
  if (entry.type === 'ATIS') {
    const variant = atisVariantLabel(entry)
    if (variant) return `${variant}ATIS`
  }
  return FREQ_ROLE_LABEL[entry.type] || entry.type
}

type FrequencyPresetOption = {
  value: string
  label: string
  sublabel: string
  color: string
  sourceLabel: string
  callsign?: string
}

const presetOptions = computed<FrequencyPresetOption[]>(() =>
  frequencyPresets.value.map((entry) => ({
    value: presetKey(entry),
    label: presetLabel(entry),
    sublabel: entry.type === 'ATIS' && entry.atisCode
      ? `${entry.frequency} · Info ${entry.atisCode}`
      : entry.frequency,
    color: entry.type === 'ATIS' ? '#f59e0b' : '#22d3ee',
    sourceLabel: entry.sourceLabel,
    callsign: entry.callsign,
  }))
)

const findPreset = (value: string | number) =>
  frequencyPresets.value.find((entry) => presetKey(entry) === value)

const onPresetSelectActive = (opt: { value: string | number }) => {
  const entry = findPreset(opt.value)
  if (entry) setActiveFrequencyFromList(entry)
}
const onPresetSelectStandby = (opt: { value: string | number }) => {
  const entry = findPreset(opt.value)
  if (entry) setStandbyFrequencyFromList(entry)
}

// --- Manual frequency entry (free-tune any VHF airband channel) --------------
const manualFreqActive = ref('')
const manualFreqStandby = ref('')

// Accepts inputs like "121.5", "121,500" or "118" and normalises to a valid
// VHF airband frequency string (118.000–136.975). Returns null when invalid so
// callers/UI can disable the action.
function normalizeManualFreq(input: string): string | null {
  const raw = input.trim().replace(',', '.')
  if (!raw) return null
  const num = Number(raw)
  if (!Number.isFinite(num) || num < 118 || num >= 137) return null
  return num.toFixed(3)
}

function applyManualFrequency(target: 'active' | 'standby', close?: () => void) {
  const model = target === 'active' ? manualFreqActive : manualFreqStandby
  const freq = normalizeManualFreq(model.value)
  if (!freq) return

  if (target === 'active') {
    if (frequencies.value.active !== freq) {
      // Tuning away from the current frequency — cut any in-progress ATC speech
      // so the pilot no longer "hears" the controller on the old channel.
      stopCurrentSpeech()
      frequencies.value.standby = frequencies.value.active
      frequencies.value.active = freq
    }
  } else {
    frequencies.value.standby = freq
  }

  model.value = ''
  close?.()
}

// Readability / signal strength quick-select (top bar)
const readabilityOptions = [
  { value: 5, label: 'Excellent', sublabel: 'Readability 5', color: '#22c55e' },
  { value: 4, label: 'Good', sublabel: 'Readability 4', color: '#22c55e' },
  { value: 3, label: 'Fair', sublabel: 'Readability 3', color: '#eab308' },
  { value: 2, label: 'Poor', sublabel: 'Readability 2', color: '#f97316' },
  { value: 1, label: 'Weak', sublabel: 'Readability 1', color: '#ef4444' },
]
const onReadabilitySelect = (opt: { value: string | number }) => {
  signalStrength.value = Number(opt.value)
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const playPTTBeep = (start: boolean) => {
  if (!radioEffectsEnabled.value) return

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(start ? 800 : 600, audioContext.currentTime)
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.1)
  } catch (err) {
    // Audio context may not be available
  }
}

const formatTracePayload = (payload: any): string => {
  if (payload === null || payload === undefined) return ''
  if (typeof payload === 'string') return payload
  try {
    return JSON.stringify(payload, null, 2)
  } catch (err) {
    return String(payload)
  }
}

const recordCurrentAtcMessage = () => {
  const state = currentState.value
  if (!state?.id || recordedAtcStates.has(state.id) || !state.say_tpl) {
    return
  }

  const plain = renderATCMessage(state.say_tpl)
  const normalized = normalizeATCText(state.say_tpl, { ...vars.value, ...flags.value })

  simulationTrace.value.push({
    kind: 'atc',
    id: state.id,
    label: `ATC • ${state.phase}`,
    payload: { text: plain, normalized }
  })

  setLastTransmission(`ATC: ${plain}`)
  recordedAtcStates.add(state.id)
}

const pickNextStateId = (state: ReturnType<typeof getStateDetails> | null): string | null => {
  if (!state) return null

  const chains: Array<Array<{ to: string }>> = []
  if (state.ok_next?.length) chains.push(state.ok_next.map(({ to }) => ({ to })))
  if (state.next?.length) chains.push(state.next.map(({ to }) => ({ to })))
  if (state.bad_next?.length) chains.push(state.bad_next.map(({ to }) => ({ to })))
  if (state.timer_next?.length) chains.push(state.timer_next.map(({ to }) => ({ to })))

  for (const list of chains) {
    for (const entry of list) {
      if (entry?.to) return entry.to
    }
  }

  return null
}

const advanceAutomaticStates = async () => {
  let guard = 0

  while (guard++ < 50) {
    const state = currentState.value
    if (!state?.id) break
    if (state.auto === 'end') break

    const autoMode = Boolean(state.auto && state.auto !== 'end')
    if (!autoMode && state.role === 'pilot') break

    const nextId = pickNextStateId(state)
    if (!nextId || nextId === state.id) break

    forceMove(nextId)
    await nextTick()
    recordCurrentAtcMessage()
  }
}

const runFullSimulation = async () => {
  if (simulationRunning.value) return

  simulationRunning.value = true
  simulationTrace.value = []
  simulationError.value = ''
  recordedAtcStates.clear()
  debugMode.value = true

  try {
    simulationTrace.value.push({
      kind: 'info',
      id: 'init',
      label: 'Simulation Start',
      payload: { timestamp: new Date().toISOString(), steps: simulationStepCount }
    })

    startDemoFlight()
    await nextTick()
    clearLog()
    recordedAtcStates.clear()

    if (currentState.value?.id !== 'CD_CHECK_ATIS') {
      forceMove('CD_CHECK_ATIS')
      await nextTick()
    }

    for (const stepId of simulationPilotSteps) {
      const state = getStateDetails(stepId)
      if (!state?.utterance_tpl) {
        throw new Error(`Missing pilot utterance for ${stepId}`)
      }

      if (currentState.value?.id !== stepId) {
        forceMove(stepId)
        await nextTick()
      }

      await wait(120)

      const pilotText = renderATCMessage(state.utterance_tpl)
      const pilotNormalized = normalizeATCText(state.utterance_tpl, { ...vars.value, ...flags.value })

      simulationTrace.value.push({
        kind: 'pilot',
        id: stepId,
        label: `Pilot • ${state.phase}`,
        payload: { text: pilotText, normalized: pilotNormalized }
      })

      setLastTransmission(`Pilot: ${pilotText}`)

      const quickResponse = processPilotTransmission(pilotText)
      if (quickResponse) {
        simulationTrace.value.push({
          kind: 'info',
          id: `${stepId}-quick`,
          label: 'Quick Response',
          payload: { text: quickResponse }
        })
        await nextTick()
      }

      const ctx = buildLLMContext(pilotText)
      simulationTrace.value.push({
        kind: 'llm-input',
        id: stepId,
        label: 'LLM Request',
        payload: cloneForTrace(ctx)
      })

      const template = simulationDecisions[stepId]
      if (!template) {
        throw new Error(`Missing simulation decision for ${stepId}`)
      }

      const decision: any = { next_state: template.next }
      if (template.controllerSayTpl) {
        decision.controller_say_tpl = template.controllerSayTpl
      } else if (template.controllerSayState) {
        const sayState = getStateDetails(template.controllerSayState)
        if (sayState?.say_tpl) {
          decision.controller_say_tpl = sayState.say_tpl
        }
      }
      if (template.updates) {
        decision.updates = template.updates
      }

      simulationTrace.value.push({
        kind: 'llm-output',
        id: stepId,
        label: `LLM Response → ${decision.next_state}`,
        payload: cloneForTrace(decision)
      })

      applyLLMDecision(decision)
      await nextTick()
      recordCurrentAtcMessage()
      await advanceAutomaticStates()
      await wait(200)
    }

    simulationTrace.value.push({
      kind: 'info',
      id: 'complete',
      label: 'Simulation Complete',
      payload: {
        timestamp: new Date().toISOString(),
        finalState: currentState.value?.id,
        pilotSteps: completedPilotSteps.value
      }
    })
  } catch (err: any) {
    const message = err?.message || String(err)
    simulationError.value = message
    simulationTrace.value.push({
      kind: 'info',
      id: 'error',
      label: 'Simulation aborted',
      payload: { error: message }
    })
  } finally {
    simulationRunning.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await requestMicAccess()
})

watch(showTransmissionIssueDialog, (open) => {
  if (!open) {
    transmissionIssueNote.value = ''
  }
})

// Watch for frequency changes from engine
watch(() => activeFrequency.value, (newFreq) => {
  if (newFreq && newFreq !== frequencies.value.active) {
    frequencies.value.active = newFreq
  }
})

// Background airport-data refresh while monitoring, aligned to METAR
// publication slots (:23/:53 — see ATIS_REFRESH_MINUTES).  The silent fetch
// never blanks the list or retunes the radio; when the info letter changes,
// the ATIS-loop watcher below sees a new key and restarts the broadcast.
watch(currentScreen, (screen) => {
  if (screen === 'monitor') {
    scheduleAirportDataRefresh()
  } else {
    cancelAirportDataRefresh()
  }
}, { immediate: true })

// ATIS loop: start when any ATIS frequency is tuned (arrival/departure ATIS
// are separate stations with own content), stop when tuned away, restart on
// info-letter change or when switching between ATIS stations.
watch(
  () => {
    const entry = tunedAtisEntry.value
    if (!entry) return null
    return {
      entry,
      key: buildAtisLoopKey(entry),
    }
  },
  (next, prev) => {
    if (!next) {
      if (atisLoopActive) stopAtisLoop()
      return
    }
    if (prev && prev.key === next.key && atisLoopActive) return
    startAtisLoop(next.entry)
  },
  { immediate: true }
)

// Pre-recording: manage continuous mic capture lifecycle
watch([inputMode, micPermission, prerecEnabled], ([mode, mic, enabled]) => {
  if (mode === 'voice' && mic && enabled) {
    void startPrerecCapture()
  } else {
    stopPrerecCapture()
  }
}, { immediate: true })

watch(prerecSeconds, (val) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEYS.prerecSeconds, String(val))
  }
  if (prerecCtx) {
    void restartPrerecCapture()
  }
})

watch(prerecEnabled, (val) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEYS.prerecEnabled, val ? '1' : '0')
  }
})

// --- SimBridge live frequency sync -----------------------------------------
// When /pm is opened with ?token=<bridge-token> and that bridge is actively
// posting telemetry, mirror the sim's COM1 radio panel (active + standby) into
// the radio and surface a "Bridge connected" indicator. The bridge counts as
// connected only while fresh telemetry keeps arriving — if it goes quiet we
// drop the badge.
const bridgeToken = computed(() => {
  const value = route.query.token
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' ? raw.trim() : ''
})
const bridgeConnected = ref(false)
const bridgeSimActiveFreq = ref<string | null>(null)
// Last known aircraft position from bridge telemetry. Sent at session creation
// so the backend can start the taxi route at the real parking position.
const bridgePosition = ref<{ lat: number; lon: number } | null>(null)
// Telemetry older than this means the bridge stopped posting.
const BRIDGE_TELEMETRY_STALE_MS = 12_000
const BRIDGE_POLL_INTERVAL_MS = 3_000
let bridgePoller: ReturnType<typeof setInterval> | null = null
// Last sim active frequency we pushed into the radio — only re-tune active when
// the sim value actually changes, so manual/flow tuning isn't constantly
// overridden. Standby has no such anchor: while connected it strictly mirrors
// the sim's standby radio.
let lastSyncedSimActive: string | null = null

function normalizeSimFreq(value: unknown): string | null {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num) || num < 118 || num >= 137) return null
  return num.toFixed(3)
}

// Map the raw bridge telemetry (SimConnect-style field names) to the
// sim-agnostic contract the backend understands. distance_to_*_nm are omitted
// until pm.vue has a reliable airport-coordinate source to compute them from;
// heading is currently true (bridge only reports true) — magnetic correction is
// needed before any localizer/heading trigger can rely on it.
function normalizeBridgeTelemetry(raw: any): import('../composables/useRadioBackend').NormalizedTelemetry | null {
  if (!raw || typeof raw !== 'object') return null
  const num = (v: unknown): number | undefined => {
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isFinite(n) ? n : undefined
  }
  return {
    altitude_ft: num(raw.PLANE_ALTITUDE),
    ias_kts: num(raw.AIRSPEED_INDICATED),
    gs_kts: num(raw.GROUND_VELOCITY),
    vs_fpm: num(raw.VERTICAL_SPEED),
    heading_deg: num(raw.PLANE_HEADING_DEGREES_TRUE),
    on_ground: typeof raw.SIM_ON_GROUND === 'boolean' ? raw.SIM_ON_GROUND : undefined,
  }
}

// Only forward telemetry that meaningfully changed, so idle cruise doesn't POST
// an identical tick every poll. Rounded so tiny jitter doesn't count as change.
let lastSentTelemetrySig: string | null = null
function telemetrySignature(t: import('../composables/useRadioBackend').NormalizedTelemetry): string {
  const r = (v: number | undefined, step: number) => (v === undefined ? '_' : Math.round(v / step))
  return [
    r(t.altitude_ft, 100), r(t.ias_kts, 5), r(t.gs_kts, 5),
    r(t.vs_fpm, 100), r(t.heading_deg, 5), t.on_ground ? 'G' : 'A',
  ].join('|')
}

async function forwardTelemetryToBackend(rawTelemetry: any) {
  if (!backendSessionId.value) return
  const normalized = normalizeBridgeTelemetry(rawTelemetry)
  if (!normalized) return
  const sig = telemetrySignature(normalized)
  if (sig === lastSentTelemetrySig) return  // nothing meaningful changed
  lastSentTelemetrySig = sig
  try {
    const response = await radioBackend.sendTelemetry(backendSessionId.value, normalized)
    if (response.telemetry_fired) {
      pmLog.info('TELEMETRY FIRED →', response.next_state_id)
      applyBackendDecision(response)
    }
  } catch (e: any) {
    // A 404 means the session is gone; the transmit path already handles the
    // reset, so here we just stop forwarding until a new session exists.
    if ((e?.status ?? e?.response?.status) === 404) {
      pmLog.warn('TELEMETRY session gone (404) — pausing telemetry forwarding')
    } else {
      pmLog.warn('TELEMETRY forward failed', e)
    }
  }
}

async function pollBridgeTelemetry() {
  const token = bridgeToken.value
  if (!token) return
  try {
    const res = await $fetch<{ connected: boolean; lastTelemetryAt: string | null; telemetry: any }>(
      '/api/bridge/live',
      { headers: { 'x-bridge-token': token } },
    )
    const ts = res.lastTelemetryAt ? Date.parse(res.lastTelemetryAt) : null
    const fresh = Boolean(res.connected && ts && Date.now() - ts < BRIDGE_TELEMETRY_STALE_MS)
    bridgeConnected.value = fresh

    if (!fresh) {
      // Bridge went quiet — drop the active sync anchor so reconnecting re-tunes.
      lastSyncedSimActive = null
      lastSentTelemetrySig = null
      bridgeSimActiveFreq.value = null
      bridgePosition.value = null
      return
    }

    // Track the aircraft position (0/0 is the bridge's "no data" default).
    const lat = Number(res.telemetry?.PLANE_LATITUDE)
    const lon = Number(res.telemetry?.PLANE_LONGITUDE)
    bridgePosition.value =
      Number.isFinite(lat) && Number.isFinite(lon) && (Math.abs(lat) > 0.5 || Math.abs(lon) > 0.5)
        ? { lat, lon }
        : null

    const simActive = normalizeSimFreq(res.telemetry?.COM_ACTIVE_FREQUENCY)
    const simStandby = normalizeSimFreq(res.telemetry?.COM_STANDBY_FREQUENCY)
    bridgeSimActiveFreq.value = simActive

    // Mirror COM1 active: tuning away cuts in-progress ATC speech on the old
    // channel, same as a manual tune.
    if (simActive && simActive !== lastSyncedSimActive) {
      lastSyncedSimActive = simActive
      if (frequencies.value.active !== simActive) {
        stopCurrentSpeech()
        frequencies.value.active = simActive
      }
    }

    // Mirror COM1 standby (no audio side effects — it's just the staged
    // channel). While connected the standby always reflects the sim's standby
    // radio, never the previously tuned channel.
    if (simStandby && frequencies.value.standby !== simStandby) {
      frequencies.value.standby = simStandby
    }

    // Feed the (normalised) telemetry to the authoritative backend so it can
    // fire proactive, aircraft-state-driven ATC. No-op when nothing meaningful
    // changed or when no telemetry trigger matches the current state.
    void forwardTelemetryToBackend(res.telemetry)
  } catch {
    bridgeConnected.value = false
  }
}

function startBridgeSync() {
  stopBridgeSync()
  if (!bridgeToken.value) return
  void pollBridgeTelemetry()
  bridgePoller = setInterval(pollBridgeTelemetry, BRIDGE_POLL_INTERVAL_MS)
}

function stopBridgeSync() {
  if (bridgePoller) {
    clearInterval(bridgePoller)
    bridgePoller = null
  }
}

// --- Remote push-to-talk over the bridge link --------------------------------
// The OpenSquawk Bridge captures a global hotkey on the PC and POSTs each edge
// to /api/bridge/ptt; the backend relays it here over WebSocket so PTT works
// while the sim (not this tab) is focused. We reuse the on-screen pad's
// startRecording/stopRecording, so behaviour is identical to holding the pad.
let pttSocket: WebSocket | null = null
let pttReconnectTimer: ReturnType<typeof setTimeout> | null = null
let pttClosedByUs = false
const bridgePttConnected = ref(false)

async function handleRemotePtt(state: 'down' | 'up') {
  if (state === 'down') {
    // A backgrounded tab can suspend the prerec AudioContext; resume it so the
    // ring buffer + live capture are running when the edge arrives from the sim.
    if (prerecCtx && prerecCtx.state === 'suspended') {
      try { await prerecCtx.resume() } catch {}
    }
    void startRecording(false)
  } else {
    stopRecording()
  }
}

function schedulePttReconnect() {
  if (pttReconnectTimer || pttClosedByUs) return
  pttReconnectTimer = setTimeout(() => {
    pttReconnectTimer = null
    connectPttSocket()
  }, 3_000)
}

function connectPttSocket() {
  disconnectPttSocket()
  const token = bridgeToken.value
  if (!token || typeof window === 'undefined') return
  pttClosedByUs = false
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const url = `${proto}//${window.location.host}/api/bridge/ws`
  let socket: WebSocket
  try {
    socket = new WebSocket(url)
  } catch {
    schedulePttReconnect()
    return
  }
  pttSocket = socket

  socket.onopen = () => {
    bridgePttConnected.value = true
    try { socket.send(JSON.stringify({ type: 'subscribe', token })) } catch {}
  }
  socket.onmessage = (ev) => {
    let data: any
    try { data = JSON.parse(typeof ev.data === 'string' ? ev.data : String(ev.data)) } catch { return }
    if (data?.type === 'ptt' && (data.state === 'down' || data.state === 'up')) {
      void handleRemotePtt(data.state)
    }
  }
  socket.onclose = () => {
    bridgePttConnected.value = false
    if (pttSocket === socket) pttSocket = null
    if (!pttClosedByUs) schedulePttReconnect()
  }
  socket.onerror = () => {
    try { socket.close() } catch {}
  }
}

function disconnectPttSocket() {
  pttClosedByUs = true
  if (pttReconnectTimer) {
    clearTimeout(pttReconnectTimer)
    pttReconnectTimer = null
  }
  if (pttSocket) {
    try { pttSocket.close() } catch {}
    pttSocket = null
  }
  bridgePttConnected.value = false
}

onMounted(() => {
  startBridgeSync()
  connectPttSocket()
})

watch(bridgeToken, () => {
  bridgeConnected.value = false
  bridgeSimActiveFreq.value = null
  lastSyncedSimActive = null
  startBridgeSync()
  connectPttSocket()
})

onUnmounted(() => {
  stopAtisLoop()
  stopPrerecCapture()
  cancelAirportDataRefresh()
  stopBridgeSync()
  disconnectPttSocket()
  clearSilenceTimer()
})
</script>

<style scoped>
.ptt-pad {
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.signal-bar {
  width: 3px;
  height: 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 1px;
  transition: all 0.3s ease;
}

.signal-bar:nth-child(1) { height: 4px; }
.signal-bar:nth-child(2) { height: 6px; }
.signal-bar:nth-child(3) { height: 8px; }
.signal-bar:nth-child(4) { height: 10px; }
.signal-bar:nth-child(5) { height: 12px; }

.signal-bar.signal-active {
  background: #22d3ee;
  box-shadow: 0 0 4px #22d3ee;
}

.swap-animation {
  transform: rotate(180deg);
  transition: transform 0.5s ease;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.animate-pulse {
  animation: pulse 1s infinite;
}

/* ---------------------------------------------------------------------------
   App shell layout (monitor screen)
   --------------------------------------------------------------------------- */
.pm-shell {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
}

/* HUD top bar (matches classroom design) */
.hud {
  flex: 0 0 auto;
  position: sticky;
  top: 0;
  z-index: 40;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg) 85%, transparent);
  backdrop-filter: blur(10px);
  padding-top: env(safe-area-inset-top);
}
.hud-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 12px;
  margin: 0 auto;
  width: 100%;
}
.hud-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.hud-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 8px;
}
.hud-right {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: nowrap;
  justify-content: flex-end;
  margin-left: auto;
}
.hud-right .btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 8px 12px;
  border-radius: 12px;
}
.hud-right .btn-label {
  white-space: nowrap;
}
.bridge-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(52, 211, 153, 0.4);
  background: rgba(16, 185, 129, 0.14);
  color: rgba(167, 243, 208, 0.95);
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: default;
}
.bridge-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #34d399;
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.8);
  animation: bridge-badge-pulse 1.8s ease-in-out infinite;
}
.bridge-badge-label {
  white-space: nowrap;
}
@keyframes bridge-badge-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@media (max-width: 900px) {
  .bridge-badge-label { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .bridge-badge-dot { animation: none; }
}
.hud-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--accent) 38%, transparent);
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--accent);
  transition: border-color .2s ease, background .2s ease, color .2s ease;
}
.hud-logo:hover {
  border-color: color-mix(in srgb, var(--accent) 54%, transparent);
  background: color-mix(in srgb, var(--accent) 20%, transparent);
}
.hud-logo-icon {
  color: currentColor;
}
.hud-divider {
  width: 1px;
  height: 32px;
  background: var(--border);
  border-radius: 999px;
}
.brand {
  font-weight: 600;
  white-space: nowrap;
}
.sep {
  color: var(--t3);
}
.mode-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--t2);
  font: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: color .2s ease, background .2s ease, border-color .2s ease;
}
.mode-switch:hover,
.mode-switch:focus-visible {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border-color: color-mix(in srgb, var(--accent) 22%, transparent);
  outline: none;
}
.mode-switch-icon { color: currentColor; }

:global(.experience-menu) {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 240px;
  padding: 8px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  background: color-mix(in srgb, var(--bg) 92%, transparent);
  box-shadow: 0 18px 40px rgba(2, 6, 23, .4);
}
:global(.experience-option) {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--t2);
  text-align: left;
  font: inherit;
  cursor: pointer;
  text-decoration: none;
  transition: background .2s ease, border-color .2s ease, color .2s ease;
}
:global(.experience-option:hover),
:global(.experience-option:focus-visible) {
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  border-color: color-mix(in srgb, var(--accent) 26%, transparent);
  color: var(--accent);
  outline: none;
}
:global(.experience-option.is-active) {
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  border-color: color-mix(in srgb, var(--accent) 32%, transparent);
  color: var(--accent);
}
:global(.experience-option-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
:global(.experience-option-title) {
  font-weight: 600;
  line-height: 1.2;
}
:global(.experience-option-sub) {
  font-size: 12px;
  color: var(--t3);
}

/* Flight context: styled like freq-control-group, with status dropdown toggle */
.hud-context-group {
  display: inline-flex;
  align-items: stretch;
  min-height: 40px;
  margin-left: 4px;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(34, 211, 238, 0.32);
  background: rgba(34, 211, 238, 0.08);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
}
.hud-context-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 1px;
  min-width: 110px;
  padding: 4px 12px;
  background: transparent;
  text-align: left;
  line-height: 1.15;
  color: inherit;
  cursor: pointer;
  transition: background 120ms ease, transform 80ms ease;
}
.hud-context-btn:hover {
  background: rgba(34, 211, 238, 0.1);
}
.hud-context-btn:active {
  transform: scale(0.98);
  background: rgba(34, 211, 238, 0.18);
}
.hud-context-callsign {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}
.hud-context-route {
  font-size: 11px;
  color: var(--t3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}
.hud-context-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  min-height: 100%;
  border-left: 1px solid rgba(34, 211, 238, 0.24);
  color: #67e8f9;
  background: rgba(34, 211, 238, 0.06);
  transition: background 120ms ease, color 120ms ease, transform 120ms ease;
  -webkit-tap-highlight-color: transparent;
}
.hud-context-toggle:hover {
  color: #cffafe;
  background: rgba(34, 211, 238, 0.16);
}
.hud-context-toggle.is-open {
  background: rgba(34, 211, 238, 0.22);
}
.hud-context-toggle.is-open .v-icon {
  transform: rotate(180deg);
}

.hud-status-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 220px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  background: color-mix(in srgb, var(--bg) 94%, transparent);
  box-shadow: 0 18px 40px rgba(2, 6, 23, .45);
  backdrop-filter: blur(10px);
}
.hud-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
}
.hud-status-key {
  color: var(--t3);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 10px;
}
.hud-status-val {
  color: var(--text);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 1180px) {
  .hud-context-btn .hud-context-route {
    display: none;
  }
  .sep,
  .mode-switch,
  .hud-divider,
  .brand {
    display: none;
  }
}
@media (max-width: 720px) {
  .hud-context-group {
    display: none;
  }
}
@media (max-width: 860px) {
  .hud-inner {
    gap: 8px;
    padding: 8px 10px;
  }
  .hud-right { gap: 6px; }
  .hud-right .btn {
    padding: 8px;
    min-width: 40px;
    justify-content: center;
  }
  .hud-right .btn-label { display: none; }
  .hud-center { padding: 0; }
}

.pm-body {
  flex: 1 1 auto;
  display: flex;
  min-height: 0;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.pm-main {
  flex: 1 1 auto;
  min-width: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.pm-main-inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 16px 14px 24px;
}
.pm-block {
  margin-bottom: 16px;
}
.pm-block:last-child {
  margin-bottom: 0;
}

.pm-lograil {
  display: none;
}

.pm-readback-check {
  margin-bottom: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  font-size: 11.5px;
}
.pm-readback-head {
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
  letter-spacing: .12em;
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 6px;
}
.pm-readback-heard {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 6px;
  font-size: 11px;
}
.pm-readback-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  line-height: 1.5;
}
.pm-readback-row.is-ok { color: #6ee7a8; }
.pm-readback-row.is-missing { color: #fca5a5; }
.pm-readback-field { color: rgba(255, 255, 255, 0.7); }
.pm-readback-expected { color: #fff; font-weight: 600; }
.pm-readback-forms { color: rgba(255, 255, 255, 0.4); }

/* Scenario chooser — phase flow with arrows */
.pm-flow {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.pm-flow-node {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 11.5px;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.8);
  transition: border-color .15s, background .15s, color .15s;
}
.pm-flow-node:hover {
  border-color: rgba(34, 211, 238, 0.6);
  background: rgba(34, 211, 238, 0.1);
  color: #fff;
}
.pm-flow-arrow {
  color: rgba(255, 255, 255, 0.25);
}

.pm-bottomnav {
  flex: 0 0 auto;
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  gap: 2px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(5, 9, 16, 0.95);
  backdrop-filter: blur(10px);
  padding: 6px 6px calc(env(safe-area-inset-bottom) + 6px);
}

.pm-navbtn {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 4px;
  border-radius: 12px;
  border: 1px solid transparent;
  color: var(--t2);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  background: transparent;
  transition: color .2s ease, background .2s ease, border-color .2s ease;
  -webkit-tap-highlight-color: transparent;
}
.pm-navbtn:hover,
.pm-navbtn:focus-visible {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border-color: color-mix(in srgb, var(--accent) 22%, transparent);
  outline: none;
}
.pm-navbtn.is-active {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  border-color: color-mix(in srgb, var(--accent) 32%, transparent);
}

/* Frequency control group in the top bar: SBY (top) + ACT (bottom) + swap */
.freq-control-group {
  display: inline-flex;
  align-items: stretch;
  min-height: 56px;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid rgba(34, 211, 238, 0.35);
  background: rgba(34, 211, 238, 0.09);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
}
.freq-stack {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.freq-chip {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 8px;
  min-width: 130px;
  padding: 4px 12px;
  background: transparent;
  line-height: 1.1;
  transition: background 120ms ease, transform 80ms ease;
  cursor: pointer;
}
.freq-chip-sby {
  border-bottom: 1px solid rgba(34, 211, 238, 0.18);
  padding-top: 5px;
  padding-bottom: 4px;
}
.freq-chip-act {
  padding-top: 4px;
  padding-bottom: 5px;
}
.freq-chip:hover {
  background: rgba(34, 211, 238, 0.08);
}
.freq-chip.is-open {
  background: rgba(34, 211, 238, 0.2);
  transform: scale(0.99);
}
.freq-swap-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  min-height: 100%;
  border-left: 1px solid rgba(34, 211, 238, 0.26);
  color: #67e8f9;
  background: rgba(34, 211, 238, 0.08);
  transition: background 120ms ease, color 120ms ease;
  -webkit-tap-highlight-color: transparent;
}
.freq-swap-btn:hover {
  color: #cffafe;
  background: rgba(34, 211, 238, 0.16);
}
.freq-swap-btn:active {
  background: rgba(34, 211, 238, 0.22);
}
.freq-chip-tag {
  font-size: 9px;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.5);
}
.freq-chip-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}
.freq-chip-value-sm {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.78);
}

/* Dropdown option row with source label on the right */
.freq-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
}
.freq-option-main {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}
.freq-option-label {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  line-height: 1.1;
}
.freq-option-sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  line-height: 1.1;
}
.freq-option-source {
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(103, 232, 249, 0.78);
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(34, 211, 238, 0.4);
  background: rgba(34, 211, 238, 0.08);
  white-space: nowrap;
  flex-shrink: 0;
}

/* Manual free-tune frequency entry inside the freq hold-select menu */
.freq-manual {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.freq-manual-input {
  flex: 1 1 auto;
  min-width: 0;
  padding: 7px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  font-size: 13px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  outline: none;
}
.freq-manual-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
  font-family: inherit;
}
.freq-manual-input:focus {
  border-color: rgba(34, 211, 238, 0.6);
  background: rgba(34, 211, 238, 0.06);
}
.freq-manual-btn {
  flex-shrink: 0;
  padding: 7px 12px;
  border-radius: 10px;
  border: 1px solid rgba(34, 211, 238, 0.4);
  background: rgba(34, 211, 238, 0.12);
  color: #67e8f9;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: background 90ms ease, opacity 90ms ease;
}
.freq-manual-btn:hover {
  background: rgba(34, 211, 238, 0.2);
}
.freq-manual-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Preset hold-select trigger buttons (freq tab) */
.preset-action-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(34, 211, 238, 0.4);
  background: rgba(34, 211, 238, 0.1);
  color: #67e8f9;
  font-size: 13px;
  font-weight: 600;
  transition: border-color 120ms ease, background 120ms ease, transform 80ms ease;
}
.preset-action-chip.standby {
  border-color: rgba(245, 158, 11, 0.4);
  background: rgba(245, 158, 11, 0.1);
  color: #fbbf24;
}
.preset-action-chip.is-open {
  transform: scale(0.97);
}

/* Unified segmented control (voice / text, etc.) */
.pm-seg {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
}
.pm-seg-btn {
  flex: 1 1 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.6);
  transition: color 130ms ease, background 130ms ease;
  -webkit-tap-highlight-color: transparent;
}
.pm-seg-btn:hover {
  color: rgba(255, 255, 255, 0.85);
}
.pm-seg-btn.is-active {
  color: #050910;
  background: #22d3ee;
}

/* Readability / signal trigger in the top bar */
.signal-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  padding: 0;
  border-radius: 14px;
  border: 1px solid rgba(34, 211, 238, 0.35);
  background: rgba(34, 211, 238, 0.09);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
  transition: background 120ms ease, transform 80ms ease;
}
.signal-chip:hover {
  background: rgba(34, 211, 238, 0.16);
}
.signal-chip.is-open {
  background: rgba(34, 211, 238, 0.18);
  transform: scale(0.97);
}
.signal-chip .signal-bars {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
}

/* Tablet / desktop: use the extra space ----------------------------------- */
@media (min-width: 1024px) {
  .pm-lograil {
    display: block;
    flex: 0 0 360px;
    width: 360px;
    overflow-y: auto;
    border-left: 1px solid rgba(255, 255, 255, 0.08);
    padding: 16px 14px;
  }
  .pm-bottomnav {
    display: none;
  }
  .pm-main-inner {
    max-width: 760px;
    padding: 20px 20px 28px;
  }
  /* Log lives in the right rail on desktop, so its tab body is redundant */
  .pm-log-tab {
    display: none !important;
  }
  /* No bottom nav on desktop: drop the FAB back down to the corner. */
  .debug-fab {
    bottom: calc(env(safe-area-inset-bottom) + 16px);
  }
  .debug-drawer {
    bottom: calc(env(safe-area-inset-bottom) + 16px);
  }
}

/* =========================================================================
 * Debug FAB + drawer (left, non-blocking, can stay open in parallel)
 * ======================================================================= */
.debug-fab {
  position: fixed;
  left: 16px;
  /* Clear the mobile bottom nav (~64px) by default; desktop overrides below. */
  bottom: calc(env(safe-area-inset-bottom) + 78px);
  z-index: 60;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  border: 1px solid rgba(249, 115, 22, 0.45);
  background: rgba(249, 115, 22, 0.16);
  color: #fdba74;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease, transform 160ms ease, border-color 160ms ease;
}
.debug-fab:hover {
  background: rgba(249, 115, 22, 0.26);
  color: #fed7aa;
  transform: translateY(-1px);
}
.debug-fab.is-open {
  background: rgba(249, 115, 22, 0.35);
  border-color: rgba(249, 115, 22, 0.7);
  color: #fff;
}

.debug-drawer {
  position: fixed;
  top: 72px;
  left: 12px;
  bottom: calc(env(safe-area-inset-bottom) + 76px);
  width: min(420px, calc(100vw - 24px));
  z-index: 55;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(8, 13, 24, 0.96);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(14px);
  pointer-events: auto;
}
.debug-drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.debug-drawer-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  background: transparent;
  transition: background 120ms ease, color 120ms ease;
}
.debug-drawer-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
.debug-drawer-body {
  padding: 12px 14px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.debug-drawer-enter-active,
.debug-drawer-leave-active {
  transition: transform 220ms ease, opacity 220ms ease;
}
.debug-drawer-enter-from,
.debug-drawer-leave-to {
  transform: translateX(-12px);
  opacity: 0;
}

@media (max-width: 640px) {
  .debug-drawer {
    top: 64px;
    left: 8px;
    right: 8px;
    width: auto;
    bottom: calc(env(safe-area-inset-bottom) + 84px);
  }
}
</style>
