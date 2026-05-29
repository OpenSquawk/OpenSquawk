<template>
  <div class="min-h-screen bg-[#050910] text-white">
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
              @click="startMonitoring(plan)"
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

            <div class="hud-context">
              <p class="hud-context-callsign">{{ flightContext.callsign || 'N/A' }}</p>
              <p class="hud-context-route">{{ flightContext.dep }} → {{ flightContext.dest }}</p>
            </div>
            <div class="hud-status">
              <v-chip :color="flags.in_air ? 'green' : 'grey'" size="x-small" variant="flat">
                {{ flags.in_air ? 'IN-AIR' : 'GROUND' }}
              </v-chip>
              <v-chip color="cyan" size="x-small" variant="outlined">{{ flags.current_unit }}</v-chip>
            </div>
          </div>

          <div class="hud-center">
            <div class="freq-control-group" aria-label="Frequency controls">
              <HoldSelect
                  :options="presetOptions"
                  placement="down"
                  title="Select frequency (active)"
                  @select="onPresetSelectActive"
              >
                <template #default="{ open }">
                  <button type="button" class="freq-chip" :class="{ 'is-open': open }">
                    <span class="freq-chip-row">
                      <span class="freq-chip-tag">ACT</span>
                      <span class="freq-chip-value">{{ frequencies.active || '---' }}</span>
                    </span>
                    <span class="freq-chip-standby">SBY {{ frequencies.standby || '---' }}</span>
                  </button>
                </template>
              </HoldSelect>

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
            <NuxtLink class="btn ghost" to="/feedback" title="Share feedback or ideas">
              <v-icon size="18">mdi-message-draw</v-icon>
              <span class="btn-label">Feedback</span>
            </NuxtLink>
            <NuxtLink class="btn ghost" to="/logout" title="Logout">
              <v-icon size="18">mdi-logout</v-icon>
              <span class="btn-label">Logout</span>
            </NuxtLink>
          </div>
        </nav>
      </header>

      <div class="pm-body">
        <!-- Desktop sidebar nav -->
        <nav class="pm-sidenav">
          <button
              v-for="tab in desktopTabs"
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
                      :class="isRecording ? 'border-red-400/40 ring-4 ring-red-400/40 bg-red-500/10' : 'border-white/10 ring-1 ring-white/5 bg-black/40'"
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
                          :class="isRecording ? 'text-red-400 animate-pulse' : 'text-cyan-300'"
                      />
                      <p
                          class="text-[11px] uppercase tracking-[0.35em] mt-1"
                          :class="isRecording ? 'text-red-300' : 'text-white/40'"
                      >
                        {{ isRecording ? 'Transmitting' : 'Hold to transmit' }}
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

            <!-- =============== FREQ TAB =============== -->
            <div v-show="activeTab === 'freq'" class="pm-block">
              <v-card class="bg-white/5 backdrop-blur border border-white/10">
                <v-card-text class="space-y-4">
                  <h3 class="text-lg font-semibold">Radio Setup</h3>

                  <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <v-text-field
                        v-model="frequencies.active"
                        label="Active"
                        variant="outlined"
                        color="cyan"
                        hide-details
                        density="comfortable"
                        class="freq-input-active font-mono"
                    />
                    <v-btn
                        icon="mdi-swap-horizontal"
                        color="cyan"
                        variant="tonal"
                        size="small"
                        aria-label="Swap frequencies"
                        :class="{ 'swap-animation': swapAnimation }"
                        @click="swapFrequencies"
                    />
                    <v-text-field
                        v-model="frequencies.standby"
                        label="Standby"
                        variant="outlined"
                        color="cyan"
                        hide-details
                        density="comfortable"
                        class="freq-input-standby font-mono"
                    />
                  </div>
                </v-card-text>
              </v-card>
            </div>

            <!-- Frequency Directory -->
            <div v-show="activeTab === 'freq'" class="pm-block">
              <v-card class="bg-white/5 border border-white/10">
                <v-card-text class="space-y-3">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <h3 class="text-lg font-semibold">Frequency overview</h3>
                    <div class="flex items-center gap-2">
                      <v-progress-circular
                          v-if="airportFrequencyLoading"
                          indeterminate
                          color="cyan"
                          size="18"
                      />
                      <template v-else>
                        <v-chip
                            v-for="label in frequencySourceLabels"
                            :key="label"
                            size="x-small"
                            color="cyan"
                            variant="outlined"
                        >
                          {{ label }}
                        </v-chip>
                      </template>
                    </div>
                  </div>

                  <div
                      v-if="airportFrequencyLoading"
                      class="flex items-center gap-2 text-sm text-white/60"
                  >
                    <v-progress-circular indeterminate size="20" color="cyan" />
                    <span>Loading frequencies from the network...</span>
                  </div>
                  <div
                      v-else-if="displayAirportFrequencies.length === 0"
                      class="text-xs text-white/50"
                  >
                    No frequencies available. Please try again later.
                  </div>
                  <div v-else class="frequency-grid">
                    <div
                        v-for="freq in displayAirportFrequencies"
                        :key="freq.displayKey"
                        class="frequency-card"
                    >
                      <div class="frequency-card-content">
                        <div class="frequency-card-topline">
                          <v-chip size="x-small" color="cyan" variant="outlined">{{ freq.type }}</v-chip>
                          <v-tooltip :text="`Source: ${freq.sourceLabel}`" location="top">
                            <template #activator="{ props: tip }">
                              <v-btn
                                  v-bind="tip"
                                  icon="mdi-information-outline"
                                  size="x-small"
                                  variant="text"
                                  color="cyan"
                                  aria-label="Show frequency source"
                              />
                            </template>
                          </v-tooltip>
                        </div>

                        <div class="frequency-value">
                          {{ freq.frequency }}
                        </div>

                        <div class="frequency-description">
                          <span>{{ freq.label }}</span>
                          <span v-if="freq.callsign"> · {{ freq.callsign }}</span>
                          <span v-if="freq.atisCode"> · ATIS {{ freq.atisCode }}</span>
                        </div>
                      </div>

                      <div class="frequency-actions" role="group" aria-label="Frequency actions">
                        <button
                            type="button"
                            class="frequency-action-btn"
                            @click="setActiveFrequencyFromList(freq)"
                        >
                          ACT
                        </button>
                        <button
                            type="button"
                            class="frequency-action-btn"
                            @click="setStandbyFrequencyFromList(freq)"
                        >
                          SBY
                        </button>
                      </div>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>

            <!-- =============== LOG TAB (mobile only) =============== -->
            <div v-show="activeTab === 'log'" class="pm-block pm-log-tab">
              <CommLog :entries="log" :limit="20" @clear="clearLog" />
            </div>

            <!-- =============== FLUG TAB =============== -->
            <div v-show="activeTab === 'flug'" class="pm-block">
              <v-card class="bg-white/5 backdrop-blur border border-white/10">
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
                      <div class="flex gap-1">
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
                      @click="backToSetup"
                      prepend-icon="mdi-airplane-off"
                  >
                    Select new flight
                  </v-btn>
                </v-card-text>
              </v-card>
            </div>

            <!-- =============== MORE TAB =============== -->
            <div v-show="activeTab === 'more'" class="pm-block">
              <v-card class="bg-white/5 border border-white/10">
                <v-card-text class="space-y-4">
                  <h3 class="text-lg font-semibold">Settings</h3>

                  <div class="space-y-4">
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
                  </div>
                </v-card-text>
              </v-card>
            </div>

            <!-- =============== DEBUG TAB =============== -->
            <div v-show="activeTab === 'debug' && debugMode" class="pm-block">
              <v-card
                  v-if="simulationRunning || simulationTrace.length"
                  class="bg-white/5 border border-white/10 mb-4"
              >
                <v-card-text class="space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <h3 class="text-lg font-semibold">Simulation Trace</h3>
                      <v-chip size="small" color="cyan" variant="outlined">
                        {{ completedPilotSteps }} / {{ simulationStepCount }}
                      </v-chip>
                    </div>
                    <v-chip size="small" :color="simulationRunning ? 'orange' : 'grey'" variant="tonal">
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
                      class="text-sm text-white/60"
                  >
                    Simulation initializing...
                  </div>

                  <div
                      v-else
                      class="space-y-2 max-h-64 overflow-y-auto pr-1"
                  >
                    <div
                        v-for="(entry, idx) in simulationTrace"
                        :key="idx"
                        class="rounded-2xl border border-white/10 bg-black/40 p-3 space-y-2"
                    >
                      <div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40">
                        <span>{{ entry.label }}</span>
                        <span class="text-white/60">{{ entry.id }}</span>
                      </div>
                      <div v-if="entry.kind === 'pilot' || entry.kind === 'atc'" class="space-y-1">
                        <p class="text-sm font-mono text-white">{{ entry.payload?.text }}</p>
                        <p class="text-[11px] text-white/50 font-mono">{{ entry.payload?.normalized }}</p>
                      </div>
                      <pre
                          v-else-if="entry.payload"
                          class="text-[11px] text-white/60 font-mono whitespace-pre-wrap"
                      >{{ formatTracePayload(entry.payload) }}</pre>
                    </div>
                  </div>
                </v-card-text>
              </v-card>

              <v-card class="bg-white/5 border border-white/10">
                <v-card-text class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold">Debug: Flow Insights</h3>
                    <v-chip size="small" color="grey" variant="outlined">LLM</v-chip>
                  </div>

                  <div class="flex items-center justify-between text-[11px] text-white/50">
                    <span>Session: {{ sessionLabel }}</span>
                    <div class="flex flex-wrap gap-2" v-if="traceAutoSelection || (traceFallback?.used) || timelineUsedFallback">
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

                  <div class="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-3">
                    <p class="text-xs uppercase tracking-[0.3em] text-white/40">Current node</p>
                    <p class="font-mono text-sm text-white">{{ debugState?.id || '—' }}</p>
                    <p class="text-[11px] text-white/50">
                      {{ debugState ? `${debugState.role} • ${debugState.phase}` : 'N/A' }}
                      <span v-if="debugState?.frequencyName" class="ml-1 text-white/40">({{ debugState.frequencyName }})</span>
                    </p>
                    <p v-if="debugState?.sayPlain" class="text-xs text-white/70">
                      Auto (LLM): <span class="font-mono text-white">{{ debugState.sayPlain }}</span>
                    </p>
                    <p v-if="debugState?.sayNormalized" class="text-[11px] text-white/40">
                      Radio: {{ debugState.sayNormalized }}
                    </p>
                  </div>

                  <div>
                    <p class="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">Upcoming decisions</p>
                    <div v-if="debugNextStates.length" class="space-y-2">
                      <div
                          v-for="state in debugNextStates"
                          :key="state.id"
                          class="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-3"
                      >
                        <div class="flex items-start justify-between gap-2">
                          <div>
                            <p class="font-mono text-sm text-white">{{ state.id }}</p>
                            <p class="text-[11px] text-white/50">
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
                        <p v-if="state.sayPlain" class="text-xs text-white/70">
                          ATC: <span class="font-mono text-white">{{ state.sayPlain }}</span>
                        </p>
                        <p v-if="state.sayNormalized" class="text-[11px] text-white/40">
                          Radio: {{ state.sayNormalized }}
                        </p>
                      </div>
                    </div>
                    <p v-else class="text-xs text-white/50">No further decisions available.</p>
                  </div>

                  <div class="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-3">
                    <p class="text-xs uppercase tracking-[0.3em] text-white/40">Decision timeline</p>
                    <div v-if="timelineSteps.length" class="space-y-3">
                      <div
                        v-for="(step, index) in timelineSteps"
                        :key="`${step.stage}-${index}`"
                        class="space-y-2 rounded-xl border border-white/10 bg-black/40 p-3"
                      >
                        <div class="flex items-start justify-between gap-3">
                          <div>
                            <p class="font-semibold text-sm text-white">{{ step.label }}</p>
                            <p class="text-[11px] text-white/50 uppercase tracking-[0.2em]">{{ step.stage }}</p>
                          </div>
                          <v-chip size="x-small" color="cyan" variant="outlined">
                            {{ step.candidates.length }} candidates
                          </v-chip>
                        </div>
                        <p v-if="step.note" class="text-[11px] text-white/50">{{ step.note }}</p>
                        <div v-if="step.candidates.length" class="space-y-2">
                          <div
                            v-for="candidate in step.candidates"
                            :key="candidate.id"
                            class="rounded-lg border border-white/10 bg-black/30 p-2"
                          >
                            <div class="flex items-center justify-between gap-2">
                              <span class="font-mono text-sm text-white">{{ candidate.id }}</span>
                              <span class="text-[11px] text-white/50">{{ candidate.flow || 'current' }}</span>
                            </div>
                            <p v-if="candidate.summary" class="text-[11px] text-white/60 mt-1">{{ candidate.summary }}</p>
                          </div>
                        </div>
                        <div v-if="step.eliminated?.length" class="space-y-2">
                          <p class="text-[11px] text-red-200/80 uppercase tracking-[0.25em]">Eliminated</p>
                          <div
                            v-for="elim in step.eliminated"
                            :key="`${step.stage}-${elim.candidate.id}`"
                            class="space-y-1 rounded-lg border border-red-400/30 bg-red-500/10 p-2 text-xs text-red-100"
                          >
                            <div class="flex items-center justify-between gap-2">
                              <span class="font-mono text-sm">{{ elim.candidate.id }}</span>
                              <span class="text-[11px] text-red-200/80">{{ elim.kind }}</span>
                            </div>
                            <p class="text-[11px] text-red-100/80">{{ elim.reason }}</p>
                            <p v-if="describeElimination(elim)" class="text-[10px] text-red-100/70">{{ describeElimination(elim) }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p v-else class="text-[11px] text-white/50">No decision timeline available yet.</p>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </div>
        </main>

        <!-- Desktop log rail -->
        <aside class="pm-lograil">
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
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
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
const radioBackend = useRadioBackend()
const config = useRuntimeConfig()

const STORAGE_KEYS = {
  selectedPlan: 'pm_selected_plan',
  vatsimId: 'pm_vatsim_id',
  prerecEnabled: 'pm_prerec_enabled',
  prerecSeconds: 'pm_prerec_seconds',
} as const

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
  initializeFlight,
  updateFrequencyVariables,
  fetchRuntimeTree,
  isReady: engineReady,
  processPilotTransmission,
  buildLLMContext,
  applyLLMDecision,
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
// Toggle: show radio pronunciation (wun, tree, squawk niner…) vs plain text.
const showRadioPronunciation = ref(false)

function toRadioSpeech(text: string): string {
  return normalizeRadioPhrase(text, {
    expandCallsigns: true,
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

function expectedFrequencyForState(): string | null {
  const freqName = (currentState.value as any)?.frequency_name as string | undefined
  if (!freqName) return null
  const varKey = FREQ_NAME_TO_VAR[freqName.toLowerCase()]
  return varKey ? ((vars as any).value[varKey] as string ?? null) : null
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

// UI State
const currentScreen = ref<'login' | 'flightselect' | 'monitor'>('login')
const loading = ref(false)
const error = ref('')
const pilotInput = ref('')
const isRecording = ref(false)
const micPermission = ref(false)
const swapAnimation = ref(false)
const signalStrength = ref(5)
const speechSpeed = ref(0.95)
const radioCheckLoading = ref(false)
const radioEffectsEnabled = ref(true)
const readbackEnabled = ref(false)
const debugMode = ref(true)

// Pre-recording (rolling mic buffer) so the first ~1s of PTT speech isn't clipped
const prerecEnabled = ref(true)
const prerecSeconds = ref(1.0)

// Layout / view state
const activeTab = ref<'funk' | 'freq' | 'log' | 'flug' | 'more' | 'debug'>('funk')
const experienceMenu = ref(false)
const inputMode = ref<'voice' | 'text'>('voice')
const learningMode = ref(true)

type PmTab = {
  id: 'funk' | 'freq' | 'log' | 'flug' | 'more' | 'debug'
  label: string
  icon: string
  mobileOnly?: boolean
  debugOnly?: boolean
}
const TABS: PmTab[] = [
  { id: 'funk', label: 'Radio', icon: 'mdi-radio-handheld' },
  { id: 'freq', label: 'Freq', icon: 'mdi-sine-wave' },
  { id: 'log', label: 'Log', icon: 'mdi-format-list-bulleted', mobileOnly: true },
  { id: 'flug', label: 'Flight', icon: 'mdi-airplane' },
  { id: 'more', label: 'More', icon: 'mdi-cog' },
  { id: 'debug', label: 'Debug', icon: 'mdi-bug', debugOnly: true },
]
const visibleTabs = computed(() => TABS.filter((tab) => !tab.debugOnly || debugMode.value))
const desktopTabs = computed(() => visibleTabs.value.filter((tab) => !tab.mobileOnly))

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

onMounted(async () => {
  try {
    if (!auth.accessToken) {
      const refreshed = await auth.tryRefresh()
      if (!refreshed) {
        router.push('/login')
        return
      }
    }

    if (!auth.user) {
      await auth.fetchUser().catch((err) => {
        console.error('Session initialisation failed', err)
        router.push('/login')
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
          await startMonitoring(parsedPlan)
        } catch (err) {
          console.warn('Failed to restore stored flight plan', err)
          window.localStorage.removeItem(STORAGE_KEYS.selectedPlan)
        }
      }
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
      router.push('/login')
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

const atisFrequencyEntry = computed(() => airportFrequencies.value.find(entry => entry.type === 'ATIS'))

const frequencySourceLabels = computed(() => {
  const labels: string[] = []
  if (frequencySources.value.vatsim) labels.push('VATSIM')
  if (frequencySources.value.openaip) labels.push('OpenAIP')
  return labels
})

const normalizedFrequencyValue = (value: string | undefined) =>
  (value || '').trim().replace(/\s+/g, '').replace(',', '.')

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

const enqueueSpeech = (task: () => Promise<void>) => {
  speechQueue = speechQueue
    .then(() => task())
    .catch(err => {
      console.error('Speech queue error:', err)
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
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
      audio.play().catch(() => resolve())
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

    try {
      await sound.play()
    } finally {
      stopNoiseGenerators.forEach((stop) => stop())
      sound.clearEffects()
    }
  } catch (err) {
    console.error('Failed to apply radio effect', err)
    await playWithoutEffects()
  }
}

const speakPrepared = async (prepared: PreparedSpeech, options: SpeechOptions = {}) => {
  pmLog.info('TTS ▶', prepared.plain.slice(0, 100))
  try {
    const speed = options.speed ?? speechSpeed.value
    const response = await api.post('/api/atc/say', {
      text: options.useNormalizedForTTS === false ? prepared.plain : prepared.normalized,
      level: signalStrength.value,
      voice: options.voice || 'alloy',
      speed,
      moduleId: 'pilot-monitoring',
      lessonId: currentState.value?.id || 'general',
      tag: options.tag || 'controller-reply',
      sessionId: engineSessionId.value || flags.value.session_id || undefined,
    })

    if (response.success && response.audio) {
      pmLog.debug('TTS ✓  provider=%s  size=%dB', response.meta?.ttsProvider, response.audio.size)
      if (options.updateLastTransmission !== false) {
        setLastTransmission(options.lastTransmissionLabel || `ATC: ${prepared.plain}`)
      }
      await playAudioWithEffects(response.audio.base64, response.audio.mime)
    } else {
      pmLog.warn('TTS ✗  unexpected response', response)
    }
  } catch (err) {
    pmLog.error('TTS FAILED', err)
    console.error('TTS failed:', err)
  }
}

const speakWithRadioEffects = (tpl: string, options: SpeechOptions = {}) => {
  const prepared = prepareSpeech(tpl)
  const delay = options.delayMs ?? 0
  enqueueSpeech(async () => {
    if (delay > 0) {
      await wait(delay)
    }
    await speakPrepared(prepared, options)
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

const handlePilotTransmission = async (message: string, source: 'text' | 'ptt' = 'text') => {
  const transcript = message.trim()
  if (!transcript) return

  const prefix = source === 'ptt' ? 'Pilot (PTT)' : 'Pilot'
  setLastTransmission(`${prefix}: ${transcript}`)

  processPilotTransmission(transcript)

  if (readbackEnabled.value) {
    speakPilotReadback(transcript)
  }

  // --- Frequency check ---
  // Reject the transmission if the pilot is on the wrong frequency.
  const expectedFreq = expectedFrequencyForState()
  if (expectedFreq && frequencies.value.active !== expectedFreq) {
    const callsign = (vars as any).value?.callsign ?? ''
    const reply = callsign
      ? `${callsign}, check frequency. You are on ${frequencies.value.active}, expected ${expectedFreq}.`
      : `Station calling, check frequency. Expected ${expectedFreq}.`
    pmLog.warn('WRONG FREQUENCY', { active: frequencies.value.active, expected: expectedFreq })
    lastControllerSay.value = reply
    scheduleControllerSpeech(reply)
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
    const response = await radioBackend.transmit(backendSessionId.value, transcript)

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

    // Advance local cursor through every state the backend auto-walked, then
    // the final state. moveToSilent updates current_unit, actions, handoffs,
    // and the communication log without scheduling further auto-transitions.
    for (const stateId of response.auto_advanced_states ?? []) {
      pmLog.debug('moveToSilent ← auto_advanced:', stateId)
      moveToSilent(stateId)
    }
    pmLog.debug('moveToSilent ← next_state_id:', response.next_state_id)
    moveToSilent(response.next_state_id)

    // Update expected phrase AFTER cursor moves so any local-engine reactive
    // updates from moveToSilent have already settled.
    backendExpectedPhrase.value = response.expected_pilot_template ?? null

    // Sync variables from backend — keeps local renderer in step with backend state.
    // Without this, {{squawk}} / {{sid}} etc. render from stale frontend defaults.
    const changedVars: Record<string, any> = {}
    for (const [k, v] of Object.entries(response.variables ?? {})) {
      if ((vars as any).value[k] !== v) {
        ;(vars as any).value[k] = v
        changedVars[k] = v
      }
    }
    if (Object.keys(changedVars).length) {
      pmLog.debug('variables synced:', changedVars)
    }

    // Sync boolean routing flags (in_air, emergency_active, etc.) from backend.
    const changedFlags: Record<string, boolean> = {}
    for (const [k, v] of Object.entries(response.flags ?? {})) {
      if (typeof v === 'boolean') {
        (flags as any).value[k] = v
        changedFlags[k] = v
      }
    }
    if (Object.keys(changedFlags).length) {
      pmLog.debug('flags synced:', changedFlags)
    }

    // TTS: use the pre-rendered string from the backend (correct variable values).
    // Fall back to rendering the template locally if rendered is absent.
    const sayText = response.controller_say_rendered || response.controller_say_template
    if (sayText) {
      pmLog.info('TTS →', sayText)
      lastControllerSay.value = sayText
      scheduleControllerSpeech(sayText)
    }

    if (response.fallback_used) {
      pmLog.warn('FALLBACK USED:', response.fallback_reason)
      console.warn('[Backend] Fallback used:', response.fallback_reason)
    }
  } catch (e) {
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

const startMonitoring = async (flightPlan: any) => {
  // 1. Ensure the local tree is loaded from the Python backend (same source as session)
  try {
    if (!engineReady.value) {
      await fetchRuntimeTree('clearance', config.public.radioBackendUrl as string)
    }
  } catch (err) {
    console.error('Failed to prepare decision engine', err)
    error.value = 'Entscheidungsbaum konnte nicht geladen werden.'
    return
  }

  // 2. Initialize the local flight engine first so generated values (stand, SID, squawk)
  //    are computed and available in vars.value before we create the backend session.
  initializeFlight(flightPlan)

  // 3. Build the backend variable payload — maps frontend variable names to the
  //    names declared in clearance-v1.yaml. Unknown keys are silently ignored by
  //    the backend so it's safe to pass extras.
  const v = (vars as any).value
  const backendVariables: Record<string, any> = {
    callsign:        v.callsign    || flightPlan.callsign || 'UNKNOWN',
    information:     v.atis_code   || 'K',
    destination:     v.dest        || flightPlan.arr || flightPlan.arrival || 'Unknown',
    stand:           v.stand       || 'A1',
    sid:             v.sid         || 'UNKNOWN1A',
    initial_altitude: String(v.initial_altitude_ft ?? 5000),
    squawk:          String(v.squawk ?? '2000'),
  }
  pmLog.info('backend variables payload:', backendVariables)

  // 4. Create a backend session with the flight-plan-derived variables
  try {
    const session = await radioBackend.createSession('clearance', backendVariables)
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
    // Sync session variables back so the local renderer stays in step
    for (const [k, v] of Object.entries(session.variables ?? {})) {
      ;(vars as any).value[k] = v
    }
    // Sync boolean routing flags from session
    for (const [k, v] of Object.entries(session.flags ?? {})) {
      if (typeof v === 'boolean') (flags as any).value[k] = v
    }
    // Seed the expected pilot phrase from the start state
    backendExpectedPhrase.value = session.expected_pilot_template ?? null
    pmLog.info('expected_pilot (session start):', backendExpectedPhrase.value ?? '—')
  } catch (err) {
    pmLog.error('SESSION CREATE FAILED', err)
    console.error('Failed to create backend session', err)
    error.value = 'Verbindung zum Training-Backend fehlgeschlagen.'
    return
  }

  error.value = ''
  selectedPlan.value = flightPlan
  currentScreen.value = 'monitor'
  persistSelectedPlan(flightPlan)

  if (flightPlan.dep === 'EDDF') {
    frequencies.value.active = '121.900'
    frequencies.value.standby = '121.700'
  }

  await fetchAirportFrequencies(flightPlan.dep || flightPlan.departure)

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
}

const startDemoFlight = () => {
  const demoFlight = {
    callsign: 'DLH39A',
    aircraft: 'A320/L',
    dep: 'EDDF',
    arr: 'EDDM',
    altitude: '36000',
  }
  void startMonitoring(demoFlight)
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

const startRecording = async (isIntercom = false) => {
  if (!micPermission.value) {
    await requestMicAccess()
    return
  }

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

    if (radioEffectsEnabled.value) {
      playPTTBeep(true)
    }

  } catch (err) {
    console.error('Failed to start recording:', err)
  }
}

const stopRecording = () => {
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

const processTransmission = async (audioBlob: Blob, isIntercom: boolean, format: 'wav' | 'webm' = 'webm') => {
  const channel = isIntercom ? 'INTERCOM' : 'RADIO'
  pmLog.info(`PTT ▶ ${channel}  blob=${(audioBlob.size / 1024).toFixed(1)}KB  fmt=${format}  session=${backendSessionId.value?.slice(0,8) ?? 'none'}`)
  try {
    const arrayBuffer = await audioBlob.arrayBuffer()
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

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

const applyFrequencyVariablesFromList = (list: AirportFrequencyEntry[]) => {
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
    syncLocalFrequenciesWithEngine(updates)
  }
}

const fetchAirportFrequencies = async (icao: string | undefined) => {
  if (!icao) return

  airportFrequencyLoading.value = true
  airportFrequencies.value = []
  airportName.value = undefined
  frequencySources.value = { vatsim: false, openaip: false }

  try {
    const response = await api.get(`/api/airports/${encodeURIComponent(icao)}/frequencies`)
    const entries = Array.isArray(response?.frequencies) ? response.frequencies as AirportFrequencyEntry[] : []
    airportFrequencies.value = entries
    airportName.value = typeof response?.airportName === 'string' ? response.airportName : undefined
    frequencySources.value = {
      vatsim: Boolean(response?.sources?.vatsim),
      openaip: Boolean(response?.sources?.openaip)
    }

    applyFrequencyVariablesFromList(entries)
  } catch (err) {
    console.error('Failed to load airport frequencies:', err)
    airportFrequencies.value = []
    airportName.value = undefined
    frequencySources.value = { vatsim: false, openaip: false }
  } finally {
    airportFrequencyLoading.value = false
  }
}

const setActiveFrequencyFromList = (entry: AirportFrequencyEntry) => {
  if (!entry) return
  const isPlaceholder = !entry.frequency || entry.frequency === FREQUENCY_PLACEHOLDER

  if (!isPlaceholder && frequencies.value.active !== entry.frequency) {
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

const buildAtisAnnouncement = (entry: AirportFrequencyEntry, fallback?: string): string => {
  const parts: string[] = []
  const location = flightContext.value.dep ? `${flightContext.value.dep} ATIS` : 'ATIS'
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
  const icao = (flightContext.value.dep || 'XXXX').toUpperCase()
  const code = entry.atisCode || '-'
  const text = (entry.atisText || '').trim()
  return `${icao}|${code}|${text.length}`
}

const resolveAtisEpoch = (entry: AirportFrequencyEntry): number => {
  if (entry.lastUpdated) {
    const parsed = Date.parse(entry.lastUpdated)
    if (Number.isFinite(parsed)) return parsed
  }
  return Date.now()
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
    const metar = await fetchMetarText(flightContext.value.dep)
    if (metar) {
      content = `METAR ${metar}`
    }
  }

  if (!content) {
    setLastTransmission('ATIS: No current information available')
    // Lass den Carrier laufen — Pilot hört dass die Frequenz aktiv ist, nur keine Ansage
    return
  }

  const announcement = buildAtisAnnouncement({ ...entry, atisText: content })
  const spokenAnnouncement = normalizeAtisForSpeech(announcement, {
    airportIcao: flightContext.value.dep,
    airportName: airportName.value,
  })
  const epoch = resolveAtisEpoch(entry)
  const requestSeq = ++atisLoopSeq
  atisPlaybackLoading.value = true

  try {
    const response = await api.post('/api/atc/say', {
      text: spokenAnnouncement,
      level: signalStrength.value,
      voice: 'verse',
      speed: 0.9,
      moduleId: 'pilot-monitoring',
      lessonId: 'atis',
      tag: 'atis',
      sessionId: engineSessionId.value || flags.value.session_id || undefined,
    })

    if (requestSeq !== atisLoopSeq) return
    if (!response?.success || !response.audio) return

    const result = await loop.startBroadcast({
      audioBase64: response.audio.base64,
      mime: response.audio.mime,
      epochMs: epoch,
    })

    if (requestSeq !== atisLoopSeq) return
    if (!result) {
      pmLog.warn('ATIS loop broadcast start returned null (decode failed?)')
      return
    }

    pmLog.info('ATIS loop start', {
      icao: flightContext.value.dep,
      atisCode: entry.atisCode,
      duration: result.duration,
      requestedOffset: result.requestedOffset,
      epochAgeSec: (Date.now() - epoch) / 1000,
    })

    setLastTransmission(`ATIS: ${announcement}`)
  } catch (err) {
    pmLog.error('ATIS loop TTS failed', err)
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

const performRadioCheck = async () => {
  if (!flightContext.value.callsign) return

  radioCheckLoading.value = true

  const message = `${frequencies.value.active}, ${flightContext.value.callsign}, radio check`

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

const frequencyPresets = computed<AirportFrequencyEntry[]>(() => {
  const byType = new Map<string, AirportFrequencyEntry>()
  const prioritized = [...airportFrequencies.value].sort((a, b) =>
    a.source === b.source ? 0 : (a.source === 'vatsim' ? -1 : 1)
  )
  for (const entry of prioritized) {
    if (!entry.frequency || entry.frequency === FREQUENCY_PLACEHOLDER) continue
    if (!byType.has(entry.type)) byType.set(entry.type, entry)
  }
  const result: AirportFrequencyEntry[] = []
  for (const type of FREQ_ROLE_ORDER) {
    const entry = byType.get(type)
    if (entry) result.push(entry)
  }
  for (const [type, entry] of byType) {
    if (!FREQ_ROLE_ORDER.includes(type)) result.push(entry)
  }
  return result
})

const presetKey = (entry: AirportFrequencyEntry) => `${entry.type}-${entry.frequency}`
const presetLabel = (entry: AirportFrequencyEntry) => FREQ_ROLE_LABEL[entry.type] || entry.type

const presetOptions = computed(() =>
  frequencyPresets.value.map((entry) => ({
    value: presetKey(entry),
    label: presetLabel(entry),
    sublabel: entry.frequency,
    color: entry.type === 'ATIS' ? '#f59e0b' : '#22d3ee',
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

// ATIS loop: start when ATIS frequency is tuned, stop otherwise, restart on info-letter change
watch(
  () => {
    const entry = atisFrequencyEntry.value
    if (!entry?.frequency || entry.frequency === FREQUENCY_PLACEHOLDER) return null
    const active = normalizedFrequencyValue(frequencies.value.active)
    const atisFreq = normalizedFrequencyValue(entry.frequency)
    if (!active || active !== atisFreq) return null
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

onUnmounted(() => {
  stopAtisLoop()
  stopPrerecCapture()
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

.freq-input-active :deep(.v-field__outline) {
  --v-field-border-color: #4ade80;
}

.freq-input-standby :deep(.v-field__outline) {
  --v-field-border-color: #f59e0b;
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

.hud-context {
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-left: 4px;
  line-height: 1.15;
}
.hud-context-callsign {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hud-context-route {
  font-size: 11px;
  color: var(--t3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hud-status {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex-shrink: 0;
}

@media (max-width: 1180px) {
  .hud-context,
  .hud-status,
  .sep,
  .mode-switch,
  .hud-divider,
  .brand {
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

.pm-sidenav {
  display: none;
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

/* Frequency control group in the top bar */
.freq-control-group {
  display: inline-flex;
  align-items: stretch;
  height: 46px;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid rgba(34, 211, 238, 0.35);
  background: rgba(34, 211, 238, 0.09);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
}
.freq-chip {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  min-width: 98px;
  padding: 6px 11px 6px 12px;
  background: transparent;
  line-height: 1.1;
  transition: background 120ms ease, transform 80ms ease;
}
.freq-chip:hover {
  background: rgba(34, 211, 238, 0.08);
}
.freq-chip.is-open {
  background: rgba(34, 211, 238, 0.18);
  transform: scale(0.98);
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
.freq-chip-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.freq-chip-tag {
  font-size: 9px;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.5);
}
.freq-chip-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}
.freq-chip-standby {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.58);
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

.frequency-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 10px;
}
.frequency-card {
  display: flex;
  min-height: 136px;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.32);
  overflow: hidden;
}
.frequency-card-content {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: center;
  padding: 14px;
}
.frequency-card-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 24px;
}
.frequency-value {
  margin-top: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 30px;
  font-weight: 750;
  line-height: 1;
  color: #fff;
}
.frequency-description {
  margin-top: 6px;
  min-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}
.frequency-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(34, 211, 238, 0.06);
}
.frequency-action-btn {
  min-height: 38px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: rgba(103, 232, 249, 0.95);
  transition: background 120ms ease, color 120ms ease;
  -webkit-tap-highlight-color: transparent;
}
.frequency-action-btn + .frequency-action-btn {
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}
.frequency-action-btn:hover {
  background: rgba(34, 211, 238, 0.14);
  color: #cffafe;
}
.frequency-action-btn:active {
  background: rgba(34, 211, 238, 0.22);
}

/* Tablet / desktop: use the extra space ----------------------------------- */
@media (min-width: 1024px) {
  .pm-sidenav {
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    gap: 6px;
    width: 168px;
    padding: 16px 12px;
    border-right: 1px solid var(--border);
    background: color-mix(in srgb, var(--bg) 70%, transparent);
    overflow-y: auto;
  }
  .pm-sidenav .pm-navbtn {
    flex: 0 0 auto;
    flex-direction: row;
    justify-content: flex-start;
    gap: 10px;
    padding: 11px 14px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.01em;
  }
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
}
</style>
