<template>
  <div class="min-h-screen bg-[#050910] text-white">
    <div class="mx-auto w-full max-w-[420px] px-4 pb-24 pt-6 sm:px-6">
      <!-- Header -->


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

      <!-- Main Monitoring Screen -->
      <section v-else class="space-y-6">
        <!-- Flight Info Card -->
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

            <!-- Flight Info Grid -->
            <div class="grid grid-cols-2 gap-3 text-sm">
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

            <!-- Stats -->
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

            <!-- Back to Setup Button -->
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

        <!-- Frequency Controls -->
        <v-card class="bg-white/5 backdrop-blur border border-white/10">
          <v-card-text class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Radio Setup</h3>
              <v-chip color="cyan" variant="flat" size="small" class="font-mono">
                {{ activeFrequency || '---' }}
              </v-chip>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <v-text-field
                  v-model="frequencies.active"
                  label="Active"
                  variant="outlined"
                  color="cyan"
                  hide-details
                  density="comfortable"
                  class="freq-input-active font-mono"
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

            <v-btn
                block
                color="cyan"
                variant="tonal"
                prepend-icon="mdi-swap-horizontal"
                @click="swapFrequencies"
                :class="{ 'swap-animation': swapAnimation }"
            >
              Swap frequencies
            </v-btn>

            <!-- Signal Quality -->
            <div class="flex items-center justify-between">
              <span class="text-xs uppercase tracking-[0.3em] text-white/40">Signal</span>
              <div class="flex items-center gap-1">
                <div
                    v-for="i in 5"
                    :key="i"
                    class="signal-bar"
                    :class="{ 'signal-active': i <= signalStrength }"
                />
                <span class="text-xs text-white/50 ml-2">{{ radioQuality.text }}</span>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Expected Communication -->
        <v-card v-if="currentStep" class="bg-white/5 border border-white/10">
          <v-card-text class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-xs uppercase tracking-[0.3em] text-white/40">Expected communication</p>
              <v-chip color="orange" variant="tonal" size="small">{{ currentStep.frequencyName }}</v-chip>
            </div>

            <div v-if="currentStep.atc" class="space-y-2 rounded-2xl bg-green-500/10 border border-green-500/20 p-3 text-sm">
              <div class="flex items-center gap-2 text-green-300">
                <v-icon size="16">mdi-radio-tower</v-icon>
                <span class="text-xs uppercase font-semibold">ATC</span>
              </div>
              <p class="font-mono text-white">{{ normalizeExpectedText(currentStep.atc) }}</p>
            </div>

            <div v-if="currentStep.pilot" class="space-y-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 p-3 text-sm">
              <div class="flex items-center gap-2 text-blue-300">
                <v-icon size="16">mdi-account-pilot</v-icon>
                <span class="text-xs uppercase font-semibold">Pilot (You)</span>
              </div>
              <p class="font-mono text-white">{{ normalizeExpectedText(currentStep.pilot) }}</p>
            </div>
          </v-card-text>
        </v-card>

        <!-- Push to Talk -->
        <div>
          <p class="mb-2 text-xs uppercase tracking-[0.3em] text-white/40">Push to Talk</p>
          <v-sheet class="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/10 to-transparent p-4 shadow-lg">
            <v-btn-toggle
                v-model="radioMode"
                color="cyan"
                class="mb-4 flex w-full"
                mandatory
            >
              <v-btn value="atc" prepend-icon="mdi-radio-handheld" class="flex-1">ATC</v-btn>
              <v-btn value="intercom" prepend-icon="mdi-account-voice" class="flex-1">Intercom</v-btn>
            </v-btn-toggle>

            <!-- Microphone Permission Alert -->
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
                  class="ptt-pad flex h-48 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-center transition cursor-pointer"
                  :class="isRecording ? 'ring-4 ring-cyan-400/70 shadow-2xl bg-cyan-900/20' : 'ring-1 ring-white/5'"
                  @touchstart.prevent="startRecording(radioMode === 'intercom')"
                  @touchend.prevent="stopRecording"
                  @touchcancel.prevent="stopRecording"
                  @mousedown.prevent="startRecording(radioMode === 'intercom')"
                  @mouseup.prevent="stopRecording"
                  @mouseleave="stopRecording"
              >
                <div>
                  <v-icon
                      :icon="isRecording ? 'mdi-record' : (radioMode === 'atc' ? 'mdi-radio-handheld' : 'mdi-headphones')"
                      size="48"
                      :class="isRecording ? 'text-red-400 animate-pulse' : 'text-cyan-300'"
                  />
                  <p class="text-xs uppercase tracking-[0.35em] text-white/40 mt-2">
                    {{ isRecording ? 'TRANSMITTING' : 'Hold to transmit' }}
                  </p>
                  <p class="pt-3 text-3xl font-semibold">
                    {{ radioMode === 'atc' ? 'ATC' : 'INTERCOM' }}
                  </p>
                  <p class="mt-2 text-sm text-white/60">
                    {{ radioMode === 'atc' ? `Transmitting on ${frequencies.active}` : 'Crew Intercom • Checklist' }}
                  </p>
                </div>
              </div>
            </ClientOnly>
          </v-sheet>
        </div>

        <!-- Frequency Directory -->
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

            <v-expansion-panels variant="accordion" class="bg-transparent">
              <v-expansion-panel>
                <v-expansion-panel-title class="text-sm text-white/70">
                  Frequencies for {{ flightContext.dep || 'departure' }}
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div
                      v-if="airportFrequencyLoading"
                      class="flex items-center gap-2 text-sm text-white/60"
                  >
                    <v-progress-circular indeterminate size="20" color="cyan" />
                    <span>Loading frequencies from the network…</span>
                  </div>
                  <div
                      v-else-if="airportFrequencies.length === 0"
                      class="text-xs text-white/50"
                  >
                    No frequencies available. Please try again later.
                  </div>
                  <div v-else class="space-y-3">
                    <div
                        v-for="freq in airportFrequencies"
                        :key="freq.callsign || `${freq.type}-${freq.frequency}-${freq.source}`"
                        class="rounded-2xl border border-white/10 bg-black/40 p-3 space-y-2"
                    >
                      <div class="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div class="flex items-center gap-2">
                            <v-chip size="x-small" color="cyan" variant="outlined">{{ freq.type }}</v-chip>
                            <span class="text-sm font-semibold text-white">{{ freq.label }}</span>
                          </div>
                          <div class="text-xs text-white/50 mt-1" v-if="freq.callsign">
                            {{ freq.callsign }}
                          </div>
                          <div class="text-xs text-white/50 mt-1" v-else>
                            {{ freq.source === 'vatsim' ? 'VATSIM' : 'OpenAIP' }}
                          </div>
                        </div>
                        <div class="text-right">
                          <div class="text-lg font-mono text-white">{{ freq.frequency }}</div>
                          <div class="flex items-center justify-end gap-2 mt-2">
                            <v-btn
                                size="x-small"
                                color="cyan"
                                variant="tonal"
                                @click="setActiveFrequencyFromList(freq)"
                            >
                              <template #prepend>
                                <v-icon size="16">mdi-crosshairs-gps</v-icon>
                              </template>
                              Active
                            </v-btn>
                            <v-btn
                                size="x-small"
                                color="orange"
                                variant="text"
                                @click="setStandbyFrequencyFromList(freq)"
                            >
                              <template #prepend>
                                <v-icon size="16">mdi-timer-sand</v-icon>
                              </template>
                              Standby
                            </v-btn>
                          </div>
                        </div>
                      </div>
                      <div class="flex flex-wrap items-center gap-2 text-[11px] text-white/40">
                        <v-chip
                            size="x-small"
                            :color="freq.source === 'vatsim' ? 'green' : 'blue'"
                            variant="outlined"
                        >
                          {{ freq.source.toUpperCase() }}
                        </v-chip>
                        <v-chip
                            v-if="freq.atisCode"
                            size="x-small"
                            color="orange"
                            variant="tonal"
                        >
                          ATIS {{ freq.atisCode }}
                        </v-chip>
                      </div>
                    </div>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>

        <!-- Manual Input Fallback -->
        <v-card class="bg-white/5 border border-white/10">
          <v-card-text class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Manual Input</h3>
              <v-chip size="small" color="cyan" variant="outlined">Fallback</v-chip>
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
            <p class="text-xs text-white/50">
              For emergencies when PTT fails or for testing
            </p>
          </v-card-text>
        </v-card>

        <!-- Simulation Trace -->
        <v-card
            v-if="simulationRunning || simulationTrace.length"
            class="bg-white/5 border border-white/10"
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

        <!-- Debug Information -->
        <v-card v-if="debugMode" class="bg-white/5 border border-white/10">
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

        <!-- Communication Log -->
        <v-card class="bg-white/5 border border-white/10">
          <v-card-text class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-semibold">Communication Log</h3>
                <v-chip size="small" color="cyan" variant="outlined">{{ log.length }}</v-chip>
              </div>
              <v-btn
                  size="small"
                  variant="text"
                  color="cyan"
                  class="text-xs uppercase tracking-[0.2em]"
                  :disabled="log.length === 0"
                  @click="clearLog"
              >
                Clear
              </v-btn>
            </div>

            <div class="space-y-2 max-h-64 overflow-y-auto">
              <div
                  v-for="entry in log.slice(-8)"
                  :key="entry.timestamp.getTime()"
                  class="rounded-2xl border border-white/10 bg-black/40 p-3"
              >
                <div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40 mb-1">
                  <span class="flex items-center gap-2">
                    <v-icon
                        :icon="entry.speaker === 'pilot' ? 'mdi-account-pilot' : 'mdi-radio-tower'"
                        size="12"
                        :class="entry.speaker === 'pilot' ? 'text-blue-400' : 'text-green-400'"
                    />
                    {{ entry.speaker.toUpperCase() }}
                    <v-chip v-if="entry.radioCheck" size="x-small" color="orange" variant="flat">RADIO CHECK</v-chip>
                    <v-chip v-if="entry.offSchema" size="x-small" color="red" variant="flat">OFF-SCHEMA</v-chip>
                  </span>
                  <span>{{ formatTime(entry.timestamp) }}</span>
                </div>
                <p class="text-sm text-white font-mono">{{ entry.message }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <v-chip
                      v-if="entry.flow"
                      size="x-small"
                      color="purple"
                      variant="outlined"
                  >
                    {{ entry.flow }}
                  </v-chip>
                  <v-chip size="x-small" color="cyan" variant="outlined">{{ entry.frequency || 'N/A' }}</v-chip>
                  <span class="text-xs text-white/40">{{ entry.state }}</span>
                </div>
              </div>

              <p v-if="log.length === 0" class="text-xs text-white/50 text-center py-4">
                No communications recorded yet.
              </p>
            </div>
          </v-card-text>
        </v-card>

        <!-- Last Transmission -->
        <v-card
            v-if="lastTransmission"
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

        <!-- Settings -->
        <v-card class="bg-white/5 border border-white/10">
          <v-card-text class="space-y-4">
            <h3 class="text-lg font-semibold">Settings</h3>

            <div class="space-y-4">
              <div>
                <label class="text-xs uppercase tracking-[0.3em] text-white/40 block mb-2">
                  Signal strength
                </label>
                <v-slider
                    v-model="signalStrength"
                    min="1"
                    max="5"
                    step="1"
                    show-ticks="always"
                    color="cyan"
                    thumb-label
                    hide-details
                />
              </div>

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

              <div class="grid gap-3 sm:grid-cols-3">
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
                    v-model="debugMode"
                    color="orange"
                    inset
                    label="Debug Mode"
                    hide-details
                />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import useCommunicationsEngine from "../../shared/utils/communicationsEngine";
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'
import { loadPizzicatoLite } from '../../shared/utils/pizzicatoLite'
import type { PizzicatoLite } from '../../shared/utils/pizzicatoLite'
import { createNoiseGenerators, getReadabilityProfile } from '../../shared/utils/radioEffects'
import type {
  CandidateTraceElimination,
  CandidateTraceEntry,
  CandidateTraceStage,
  CandidateTraceStep,
  DecisionCandidateTimeline,
  LLMDecisionTrace,
} from '../../shared/types/llm'

// Core State
const engine = useCommunicationsEngine()
const auth = useAuthStore()
const api = useApi()
const router = useRouter()

const STORAGE_KEYS = {
  selectedPlan: 'pm_selected_plan',
  vatsimId: 'pm_vatsim_id'
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
  normalizeATCText,
  renderATCMessage,
  getStateDetails
} = engine

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
const sessionLabel = computed(() => engineSessionId.value || flags.session_id || '-')

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
    .map((entry) => cloneForTrace(entry))
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
const radioMode = ref<'atc' | 'intercom'>('atc')
const isRecording = ref(false)
const micPermission = ref(false)
const swapAnimation = ref(false)
const signalStrength = ref(4)
const speechSpeed = ref(0.95)
const radioCheckLoading = ref(false)
const radioEffectsEnabled = ref(true)
const readbackEnabled = ref(false)
const debugMode = ref(true)

const simulationRunning = ref(false)
const simulationTrace = ref<SimulationTraceEntry[]>([])
const simulationError = ref('')

// Frequencies
const frequencies = ref({
  active: '121.900',
  standby: '118.100'
})

const airportFrequencies = ref<AirportFrequencyEntry[]>([])
const airportFrequencyLoading = ref(false)
const frequencySources = ref({ vatsim: false, openaip: false })
const atisPlaybackLoading = ref(false)

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
      await fetchRuntimeTree()
    } catch (err) {
      console.error('Failed to load decision tree runtime', err)
      error.value = 'Decision engine konnte nicht initialisiert werden.'
      return
    }

    if (typeof window !== 'undefined') {
      const storedVatsimId = window.localStorage.getItem(STORAGE_KEYS.vatsimId)
      if (storedVatsimId) {
        vatsimId.value = storedVatsimId
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
      sessionId: engineSessionId.value || flags.session_id || undefined,
    })

    if (response.success && response.audio) {
      if (options.updateLastTransmission !== false) {
        setLastTransmission(options.lastTransmissionLabel || `ATC: ${prepared.plain}`)
      }
      await playAudioWithEffects(response.audio.base64, response.audio.mime)
    }
  } catch (err) {
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
        sessionId: engineSessionId.value || flags.session_id || undefined,
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

  const ctx = buildLLMContext(transcript)

  try {
    const result = await api.post('/api/llm/decide', ctx)
    const decision =
      result?.decision && typeof result.decision === 'object'
        ? result.decision
        : (result && typeof result === 'object' && 'next_state' in result)
          ? result
          : null

    if (!decision) {
      console.error('LLM decision response had unexpected shape:', result)
      setLastTransmission(`${prefix}: ${transcript} (invalid decision response)`)
      return
    }

    const normalizedTrace = normalizeDecisionTraceResult(result)

    applyLLMDecision(decision, normalizedTrace ?? null)

    if (decision.controller_say_tpl && !decision.radio_check) {
      scheduleControllerSpeech(decision.controller_say_tpl)
    }
  } catch (e) {
    console.error('LLM decision failed', e)
    setLastTransmission(`${prefix}: ${transcript} (LLM failed)`)
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
  try {
    if (!engineReady.value) {
      await fetchRuntimeTree()
    }
  } catch (err) {
    console.error('Failed to prepare decision engine', err)
    error.value = 'Entscheidungsbaum konnte nicht geladen werden.'
    return
  }

  error.value = ''
  selectedPlan.value = flightPlan
  initializeFlight(flightPlan)
  currentScreen.value = 'monitor'
  persistSelectedPlan(flightPlan)

  // Set appropriate frequency based on departure airport
  if (flightPlan.dep === 'EDDF') {
    frequencies.value.active = '121.900' // Frankfurt Delivery
    frequencies.value.standby = '121.700' // Frankfurt Ground
  }

  await fetchAirportFrequencies(flightPlan.dep || flightPlan.departure)
}

const startDemoFlight = () => {
  const demoFlight = {
    callsign: 'DLH39A',
    aircraft: 'A320/L',
    dep: 'EDDF',
    arr: 'EDDM',
    altitude: '36000',
    assignedsquawk: '1234'
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

const startRecording = async (isIntercom = false) => {
  if (!micPermission.value) {
    await requestMicAccess()
    return
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
      processTransmission(audioBlob, isIntercom)
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
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
    isRecording.value = false

    if (radioEffectsEnabled.value) {
      playPTTBeep(false)
    }
  }
}

const processTransmission = async (audioBlob: Blob, isIntercom: boolean) => {
  try {
    const arrayBuffer = await audioBlob.arrayBuffer()
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    if (isIntercom) {
      const result = await api.post('/api/atc/ptt', {
        audio: base64Audio,
        context: {
          state_id: currentState.value?.id || 'INTERCOM',
          state: {},
          candidates: [],
          variables: { callsign: vars.value.callsign },
          flags: {}
        },
        moduleId: 'pilot-monitoring-intercom',
        lessonId: 'intercom',
        format: 'webm',
        autoDecide: false
      })

      if (result.success) {
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
      const ctx = buildLLMContext('')

      const result = await api.post('/api/atc/ptt', {
        audio: base64Audio,
        context: ctx,
        moduleId: 'pilot-monitoring',
        lessonId: currentState.value?.id || 'general',
        format: 'webm',
        autoDecide: false
      })

      if (result.success) {
        await handlePilotTransmission(result.transcription, 'ptt')
      }
    }
  } catch (err) {
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
  frequencySources.value = { vatsim: false, openaip: false }

  try {
    const response = await api.get(`/api/airports/${encodeURIComponent(icao)}/frequencies`)
    const entries = Array.isArray(response?.frequencies) ? response.frequencies as AirportFrequencyEntry[] : []
    airportFrequencies.value = entries
    frequencySources.value = {
      vatsim: Boolean(response?.sources?.vatsim),
      openaip: Boolean(response?.sources?.openaip)
    }

    applyFrequencyVariablesFromList(entries)
  } catch (err) {
    console.error('Failed to load airport frequencies:', err)
    airportFrequencies.value = []
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

const playAtisBroadcast = async () => {
  const atisEntry = atisFrequencyEntry.value
  if (!atisEntry) return

  setActiveFrequencyFromList(atisEntry)
  atisPlaybackLoading.value = true

  try {
    let content = atisEntry.atisText || ''
    if (!content) {
      const metar = await fetchMetarText(flightContext.value.dep)
      if (metar) {
        content = `METAR ${metar}`
      }
    }

    if (!content) {
      setLastTransmission('ATIS: No current information available')
      return
    }

    const announcement = buildAtisAnnouncement({ ...atisEntry, atisText: content })
    await speakPlainText(announcement, {
      voice: 'verse',
      speed: 0.9,
      tag: 'atis-broadcast',
      lessonId: 'atis',
      lastTransmissionLabel: `ATIS: ${announcement}`
    })
  } catch (err) {
    console.error('ATIS playback failed:', err)
  } finally {
    atisPlaybackLoading.value = false
  }
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
</style>
