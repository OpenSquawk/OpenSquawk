<template>
  <div class="min-h-screen bg-[#050910] text-white">
    <div class="mx-auto w-full max-w-[420px] px-4 pb-24 pt-6 sm:px-6">
      <!-- Header -->
      <header class="flex items-center justify-between pb-6">
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-cyan-400/80">OpenSquawk</p>
          <h1 class="text-2xl font-semibold">Pilot Monitoring</h1>
          <p class="mt-1 text-sm text-white/70">Alpha Build • Decision Tree • VATSIM</p>
        </div>
        <div class="text-right">
          <v-chip size="small" :color="currentState?.phase === 'Interrupt' ? 'red' : 'cyan'" variant="flat" class="mb-1">
            {{ currentState?.id || 'INIT' }}
          </v-chip>
          <div class="text-xs text-white/50">{{ currentState?.phase || 'Setup' }}</div>
        </div>
      </header>

      <!-- Login/Flight Selection Screen -->
      <section v-if="currentScreen === 'login'" class="space-y-6">
        <v-card class="bg-white/5 backdrop-blur border border-white/10">
          <v-card-text class="space-y-4">
            <div>
              <h2 class="text-lg font-semibold">VATSIM Integration</h2>
              <p class="text-sm text-white/70">Gib deine CID ein um deine gefilterten Flugpläne zu laden</p>
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
              Flugpläne abrufen
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
              <p class="text-sm text-white/70">Starte mit einem Beispiel-Flugplan zum Testen</p>
            </div>
            <v-btn
                block
                color="orange"
                variant="outlined"
                @click="startDemoFlight"
            >
              Demo starten (DLH39A EDDF→EDDM)
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
          <h2 class="text-lg font-semibold">Verfügbare Flugpläne</h2>
          <v-chip color="cyan" variant="outlined" size="small">{{ vatsimId }}</v-chip>
        </div>

        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="cyan" class="mb-4" />
          <p class="text-sm text-white/70">Lade Flugpläne von VATSIM...</p>
        </div>

        <div v-else-if="flightPlans.length === 0" class="text-center py-8">
          <v-icon size="48" class="text-white/30 mb-4">mdi-airplane-off</v-icon>
          <p class="text-white/70">Keine Flugpläne gefunden</p>
          <v-btn color="cyan" variant="outlined" class="mt-4" @click="currentScreen = 'login'">
            Zurück
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
                <p class="text-xs uppercase tracking-[0.3em] text-white/50">Aktiver Flug</p>
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
              Neuen Flug wählen
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
              Frequenzen tauschen
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
              <p class="text-xs uppercase tracking-[0.3em] text-white/40">Erwartete Kommunikation</p>
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
                <span class="text-xs uppercase font-semibold">Pilot (Du)</span>
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
              Mikrofonberechtigung erforderlich für Push-To-Talk.
              <template #append>
                <v-btn color="cyan" size="small" variant="flat" @click="requestMicAccess">Erlauben</v-btn>
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
                    {{ radioMode === 'atc' ? `Sendet auf ${frequencies.active}` : 'Crew Intercom • Checklist' }}
                  </p>
                </div>
              </div>
            </ClientOnly>
          </v-sheet>
        </div>

        <!-- Quick Actions -->
        <v-card class="bg-white/5 border border-white/10">
          <v-card-text class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Quick Actions</h3>
              <v-chip v-if="atisFrequency" size="small" color="cyan" variant="tonal" class="font-mono">
                {{ atisFrequency.frequency }}
              </v-chip>
            </div>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <v-btn
                  color="orange"
                  variant="flat"
                  @click="performRadioCheck"
                  :loading="radioCheckLoading"
                  prepend-icon="mdi-radio"
                  density="comfortable"
              >
                Radio Check
              </v-btn>
              <v-btn
                  color="cyan"
                  variant="outlined"
                  @click="runFullSimulation"
                  :loading="simulationRunning"
                  prepend-icon="mdi-progress-check"
                  density="comfortable"
              >
                Voller Flug (Simulation)
              </v-btn>
              <v-btn
                  color="purple"
                  variant="tonal"
                  @click="handleTuneAtis"
                  :loading="atisLoading"
                  :disabled="!atisFrequency"
                  prepend-icon="mdi-broadcast"
                  density="comfortable"
              >
                ATIS abhören
              </v-btn>
            </div>
            <div class="space-y-2">
              <v-btn
                  block
                  variant="tonal"
                  color="cyan"
                  class="justify-between"
                  @click="toggleFrequencyList"
                  :loading="airportFrequenciesLoading"
              >
                <div class="flex items-center gap-2">
                  <v-icon size="18">mdi-signal-variant</v-icon>
                  <span>Frequenzen {{ flightContext.dep || 'N/A' }}</span>
                </div>
                <v-icon>{{ showFrequencyList ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
              </v-btn>
              <v-expand-transition>
                <div
                    v-if="showFrequencyList"
                    class="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div v-if="airportFrequenciesLoading" class="flex items-center gap-2 text-sm text-white/70">
                    <v-progress-circular indeterminate size="20" color="cyan" />
                    <span>Lade Frequenzen…</span>
                  </div>
                  <v-alert
                      v-else-if="airportFrequenciesError"
                      type="warning"
                      density="comfortable"
                      variant="tonal"
                      class="bg-amber-500/10 text-amber-200"
                  >
                    {{ airportFrequenciesError }}
                  </v-alert>
                  <div v-else-if="airportFrequencies.length" class="space-y-2">
                    <div
                        v-for="entry in airportFrequencies"
                        :key="`${entry.type}-${entry.frequency}`"
                        class="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                    >
                      <div>
                        <p class="text-sm font-medium text-white">
                          {{ frequencyDisplayName(entry) }}
                        </p>
                        <p v-if="entry.description" class="text-xs text-white/50">
                          {{ entry.description }}
                        </p>
                      </div>
                      <div class="flex items-center gap-2">
                        <v-chip size="small" color="cyan" variant="outlined" class="font-mono">
                          {{ entry.frequency }}
                        </v-chip>
                        <v-btn
                            variant="text"
                            color="cyan"
                            size="small"
                            @click="quickTuneFrequency(entry.frequency, entry)"
                        >
                          TUNE
                        </v-btn>
                      </div>
                    </div>
                  </div>
                  <p v-else class="text-sm text-white/60">Keine Frequenzen verfügbar.</p>
                </div>
              </v-expand-transition>
            </div>
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
              Für Notfälle wenn PTT nicht funktioniert oder für Tests
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
                {{ simulationRunning ? 'Läuft' : 'Bereit' }}
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
              Simulation initialisiert...
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

            <div class="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-3">
              <p class="text-xs uppercase tracking-[0.3em] text-white/40">Aktueller Knoten</p>
              <p class="font-mono text-sm text-white">{{ debugState?.id || '—' }}</p>
              <p class="text-[11px] text-white/50">
                {{ debugState ? `${debugState.role} • ${debugState.phase}` : 'N/A' }}
                <span v-if="debugState?.frequencyName" class="ml-1 text-white/40">({{ debugState.frequencyName }})</span>
              </p>
              <p v-if="debugState?.sayPlain" class="text-xs text-white/70">
                Auto: <span class="font-mono text-white">{{ debugState.sayPlain }}</span>
              </p>
              <p v-if="debugState?.sayNormalized" class="text-[11px] text-white/40">
                Funk: {{ debugState.sayNormalized }}
              </p>
            </div>

            <div>
              <p class="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">Nächste Entscheidungen</p>
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
                    Funk: {{ state.sayNormalized }}
                  </p>
                </div>
              </div>
              <p v-else class="text-xs text-white/50">Keine weiteren Entscheidungen verfügbar.</p>
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
                Leeren
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
                  <v-chip size="x-small" color="cyan" variant="outlined">{{ entry.frequency || 'N/A' }}</v-chip>
                  <span class="text-xs text-white/40">{{ entry.state }}</span>
                </div>
              </div>

              <p v-if="log.length === 0" class="text-xs text-white/50 text-center py-4">
                Noch keine Kommunikation aufgezeichnet.
              </p>
            </div>
          </v-card-text>
        </v-card>

        <!-- Last Transmission -->
        <v-card v-if="lastTransmission" class="bg-cyan-500/10 border border-cyan-400/20">
          <v-card-text class="space-y-2">
            <div class="flex items-center gap-2">
              <v-icon icon="mdi-microphone-outline" size="16" class="text-cyan-300" />
              <span class="text-xs uppercase tracking-[0.3em] text-cyan-300">Letzte Übertragung</span>
            </div>
            <p class="text-sm text-white font-mono">{{ lastTransmission }}</p>
          </v-card-text>
        </v-card>

        <!-- Settings -->
        <v-card class="bg-white/5 border border-white/10">
          <v-card-text class="space-y-4">
            <h3 class="text-lg font-semibold">Settings</h3>

            <div class="space-y-4">
              <div>
                <label class="text-xs uppercase tracking-[0.3em] text-white/40 block mb-2">
                  Signal Stärke
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

              <div class="grid gap-3 sm:grid-cols-3">
                <v-switch
                    v-model="radioEffectsEnabled"
                    color="cyan"
                    inset
                    label="Radio-Effekte"
                    hide-details
                />
                <v-switch
                    v-model="readbackEnabled"
                    color="cyan"
                    inset
                    label="Readback Stimme"
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
import type { AirportFrequency } from '~/shared/types/airport'

// Core State
const engine = useCommunicationsEngine()
const auth = useAuthStore()
const api = useApi()
const router = useRouter()
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
  initializeFlight,
  applyAirportFrequencies,
  processPilotTransmission,
  buildLLMContext,
  applyLLMDecision,
  moveTo: forceMove,
  normalizeATCText,
  renderATCMessage,
  getStateDetails
} = engine

const clearLog = () => {
  clearCommunicationLog()
  lastTransmission.value = ''
}

// UI State
const currentScreen = ref<'login' | 'flightselect' | 'monitor'>('login')
const loading = ref(false)
const error = ref('')
const pilotInput = ref('')
const lastTransmission = ref('')
const radioMode = ref<'atc' | 'intercom'>('atc')
const isRecording = ref(false)
const micPermission = ref(false)
const swapAnimation = ref(false)
const signalStrength = ref(4)
const radioCheckLoading = ref(false)
const radioEffectsEnabled = ref(true)
const readbackEnabled = ref(false)
const debugMode = ref(false)

const simulationRunning = ref(false)
const simulationTrace = ref<SimulationTraceEntry[]>([])
const simulationError = ref('')

// Frequencies
const frequencies = ref({
  active: '121.900',
  standby: '118.100'
})

const airportFrequencies = ref<AirportFrequency[]>([])
const airportFrequenciesLoading = ref(false)
const airportFrequenciesError = ref('')
const showFrequencyList = ref(false)

type AtisInfo = {
  icao: string
  frequency?: string
  text: string
  code?: string
  lastUpdated?: string
}

const atisInfo = ref<AtisInfo | null>(null)
const atisLoading = ref(false)
const atisError = ref('')

onMounted(async () => {
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
})

watch(
  () => auth.accessToken,
  (token) => {
    if (!token) {
      router.push('/login')
    }
  }
)

// VATSIM Integration
const vatsimId = ref('1857215')
const flightPlans = ref<any[]>([])
const selectedPlan = ref<any>(null)

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

const completedPilotSteps = computed(() => simulationTrace.value.filter(entry => entry.kind === 'pilot').length)

const atisFrequency = computed(() => {
  const entry = findAirportFrequency(['ATIS'])
  const fallback = flightContext.value.atis_freq
  const frequency = entry?.frequency || (typeof fallback === 'string' ? fallback : '')
  if (!frequency) return null

  return {
    frequency,
    name: entry?.name || 'ATIS',
    source: entry ? 'catalog' : 'context'
  }
})

function findAirportFrequency(types: string[]): AirportFrequency | undefined {
  if (!Array.isArray(types) || !types.length) return undefined
  const targets = types.map(type => type.toUpperCase())
  return airportFrequencies.value.find((entry) => {
    const type = entry.type?.toUpperCase?.() ?? ''
    const name = entry.name?.toUpperCase?.() ?? ''
    return targets.some(target => type.includes(target) || name.includes(target))
  })
}

const frequencyTypeLabels: Record<string, string> = {
  ATIS: 'ATIS',
  DEL: 'Clearance Delivery',
  GND: 'Ground',
  TWR: 'Tower',
  DEP: 'Departure',
  APP: 'Approach',
  CTR: 'Center'
}

const frequencyDisplayName = (entry: AirportFrequency) => {
  if (!entry) return ''
  if (entry.name) return entry.name
  const upper = entry.type?.toUpperCase?.() ?? ''
  return frequencyTypeLabels[upper] || upper || 'Frequency'
}

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

const playAudioWithEffects = async (base64: string) => {
  if (typeof window === 'undefined') return

  if (!radioEffectsEnabled.value) {
    await new Promise<void>((resolve) => {
      const audio = new Audio(`data:audio/wav;base64,${base64}`)
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
      audio.play().catch(() => resolve())
    })
    return
  }

  try {
    const ctx = await ensureAudioContext()
    if (!ctx) throw new Error('AudioContext unavailable')

    const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    const arrayBuffer = binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength)
    const buffer = await ctx.decodeAudioData(arrayBuffer)

    await new Promise<void>((resolve) => {
      const source = ctx.createBufferSource()
      source.buffer = buffer

      const highpass = ctx.createBiquadFilter()
      highpass.type = 'highpass'
      highpass.frequency.value = 320

      const lowpass = ctx.createBiquadFilter()
      lowpass.type = 'lowpass'
      lowpass.frequency.value = 3100

      const compressor = ctx.createDynamicsCompressor()
      compressor.threshold.value = -28
      compressor.knee.value = 30
      compressor.ratio.value = 12
      compressor.attack.value = 0.003
      compressor.release.value = 0.25

      const gainNode = ctx.createGain()
      gainNode.gain.value = 0.9

      source.connect(highpass)
      highpass.connect(lowpass)
      lowpass.connect(compressor)
      compressor.connect(gainNode)
      gainNode.connect(ctx.destination)

      let noiseSource: AudioBufferSourceNode | null = null

      if (buffer.duration > 0) {
        const length = Math.ceil(buffer.duration * ctx.sampleRate)
        const noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate)
        const channel = noiseBuffer.getChannelData(0)
        const strength = Math.max(1, Math.min(5, signalStrength.value))
        const intensity = (6 - strength) / 6
        const amplitude = 0.015 + intensity * 0.045
        for (let i = 0; i < channel.length; i++) {
          channel[i] = (Math.random() * 2 - 1) * amplitude
        }
        noiseSource = ctx.createBufferSource()
        noiseSource.buffer = noiseBuffer
        const bandPass = ctx.createBiquadFilter()
        bandPass.type = 'bandpass'
        bandPass.frequency.value = 1800
        bandPass.Q.value = 1.2
        const noiseGain = ctx.createGain()
        noiseGain.gain.value = amplitude * 0.6
        noiseSource.connect(bandPass)
        bandPass.connect(noiseGain)
        noiseGain.connect(ctx.destination)
        noiseSource.start(0)
      }

      source.onended = () => {
        if (noiseSource) {
          try {
            noiseSource.stop()
          } catch (err) {
            // ignore
          }
        }
        resolve()
      }

      source.start(0)
    })
  } catch (err) {
    console.error('Failed to apply radio effect', err)
    await new Promise<void>((resolve) => {
      const audio = new Audio(`data:audio/wav;base64,${base64}`)
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
      audio.play().catch(() => resolve())
    })
  }
}

const speakPrepared = async (prepared: PreparedSpeech, options: SpeechOptions = {}) => {
  try {
    const response = await api.post('/api/atc/say', {
      text: options.useNormalizedForTTS === false ? prepared.plain : prepared.normalized,
      level: signalStrength.value,
      voice: options.voice || 'alloy',
      speed: 0.95,
      moduleId: 'pilot-monitoring',
      lessonId: currentState.value?.id || 'general',
      tag: options.tag || 'controller-reply'
    })

    if (response.success && response.audio) {
      if (options.updateLastTransmission !== false) {
        lastTransmission.value = options.lastTransmissionLabel || `ATC: ${prepared.plain}`
      }
      await playAudioWithEffects(response.audio.base64)
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

const handleTuneAtis = async () => {
  const freqInfo = atisFrequency.value
  const dep = flightContext.value.dep
  if (!freqInfo || !dep) return

  atisLoading.value = true

  try {
    const atisEntry = findAirportFrequency(['ATIS']) || { type: 'ATIS', frequency: freqInfo.frequency, name: freqInfo.name }
    quickTuneFrequency(freqInfo.frequency, atisEntry)

    const hasText = await loadAtisInfo(dep)
    const info = atisInfo.value

    if (hasText && info?.text) {
      const prefix = info.code ? `Information ${info.code}. ` : ''
      speakWithRadioEffects(`${prefix}${info.text}`, {
        tag: 'atis-broadcast',
        updateLastTransmission: false,
        useNormalizedForTTS: false,
        delayMs: 400
      })
      lastTransmission.value = `System: ATIS ${dep} (${freqInfo.frequency})`
    } else {
      const fallbackMessage = atisError.value || `Keine ATIS Daten für ${dep}`
      lastTransmission.value = `System: ${fallbackMessage}`
    }
  } catch (err) {
    console.error('ATIS playback failed:', err)
    lastTransmission.value = 'System: ATIS konnte nicht abgespielt werden'
  } finally {
    atisLoading.value = false
  }
}

const handlePilotTransmission = async (message: string, source: 'text' | 'ptt' = 'text') => {
  const transcript = message.trim()
  if (!transcript) return

  const prefix = source === 'ptt' ? 'Pilot (PTT)' : 'Pilot'
  lastTransmission.value = `${prefix}: ${transcript}`

  const quickResponse = processPilotTransmission(transcript)

  if (readbackEnabled.value) {
    speakPilotReadback(transcript)
  }

  if (quickResponse) {
    scheduleControllerSpeech(quickResponse)
    return
  }

  const ctx = buildLLMContext(transcript)

  try {
    const decision = await api.post('/api/llm/decide', ctx)

    applyLLMDecision(decision)

    if (decision.controller_say_tpl && !decision.radio_check) {
      scheduleControllerSpeech(decision.controller_say_tpl)
    }
  } catch (e) {
    console.error('LLM decision failed', e)
    lastTransmission.value = `${prefix}: ${transcript} (LLM failed)`
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
      error.value = 'Keine Flugpläne für diese VATSIM ID gefunden'
    }
  } catch (err) {
    console.error('Error loading flight plans:', err)
    error.value = 'Fehler beim Laden der Flugpläne. Bitte VATSIM ID prüfen.'
  } finally {
    loading.value = false
  }
}

const quickTuneFrequency = (frequency: string, entry?: AirportFrequency | null) => {
  const target = frequency?.trim()
  if (!target) return

  if (frequencies.value.active !== target) {
    frequencies.value.standby = frequencies.value.active
    frequencies.value.active = target
  }

  const label = entry ? frequencyDisplayName(entry) : ''
  if (label) {
    lastTransmission.value = `System: ${label} ${target} eingestellt`
  } else {
    lastTransmission.value = `System: Frequenz ${target} eingestellt`
  }
}

const loadAirportFrequencies = async (icao: string) => {
  const code = icao.toUpperCase()
  airportFrequenciesLoading.value = true
  airportFrequenciesError.value = ''

  try {
    const response = await api.get('/api/airports/frequencies', {
      query: { icao: code }
    })

    const list: AirportFrequency[] = Array.isArray(response?.frequencies) ? response.frequencies : []
    airportFrequencies.value = list

    if (!response?.success && !list.length) {
      airportFrequenciesError.value = 'Keine Frequenzen für diesen Airport gefunden.'
    }

    if (list.length) {
      applyAirportFrequencies(code, list)
      const ground = findAirportFrequency(['GND', 'GROUND', 'APRON'])
      if (ground?.frequency) {
        frequencies.value.standby = ground.frequency
      }
    }
  } catch (err) {
    console.error('Failed to load airport frequencies:', err)
    airportFrequencies.value = []
    airportFrequenciesError.value = 'Frequenzen konnten nicht geladen werden.'
  } finally {
    airportFrequenciesLoading.value = false
  }
}

const toggleFrequencyList = () => {
  showFrequencyList.value = !showFrequencyList.value
  if (showFrequencyList.value && !airportFrequencies.value.length && flightContext.value.dep) {
    loadAirportFrequencies(flightContext.value.dep)
  }
}

const loadAtisInfo = async (icao: string): Promise<boolean> => {
  const code = icao.toUpperCase()
  atisError.value = ''

  try {
    const feed = await api.get('/api/vatsim/feed')
    const entries: any[] = Array.isArray(feed?.atis) ? feed.atis : []
    const match = entries.find((entry) => {
      const callsign = String(entry?.callsign || '').toUpperCase()
      const entryIcao = String(entry?.icao || entry?.airport || '').toUpperCase()
      return callsign.startsWith(code) || entryIcao === code
    })

    if (match) {
      const textParts = Array.isArray(match.text_atis)
        ? match.text_atis
        : [match.text_atis ?? match.text ?? '']
      const text = textParts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()

      atisInfo.value = {
        icao: code,
        frequency: match.frequency || match.freq,
        text,
        code: match.atis_code || match.code,
        lastUpdated: match.last_updated || match.timestamp || match.update_timestamp
      }

      if (!text) {
        atisError.value = 'ATIS ist derzeit leer.'
      }

      return Boolean(text)
    }

    atisInfo.value = { icao: code, text: '' }
    atisError.value = 'Kein ATIS auf VATSIM aktiv.'
    return false
  } catch (err) {
    console.error('Failed to load ATIS feed:', err)
    atisInfo.value = { icao: code, text: '' }
    atisError.value = 'ATIS konnte nicht geladen werden.'
    return false
  }
}

const startMonitoring = async (flightPlan: any) => {
  selectedPlan.value = flightPlan
  initializeFlight(flightPlan)
  currentScreen.value = 'monitor'

  airportFrequencies.value = []
  airportFrequenciesError.value = ''
  showFrequencyList.value = false
  atisInfo.value = null
  atisError.value = ''
  atisLoading.value = false

  const depIcao = flightPlan.dep || flightPlan.departure || flightPlan.origin
  if (typeof depIcao === 'string' && depIcao.length === 4) {
    await loadAirportFrequencies(depIcao.toUpperCase())
  }
}

const startDemoFlight = async () => {
  const demoFlight = {
    callsign: 'DLH39A',
    aircraft: 'A320/L',
    dep: 'EDDF',
    arr: 'EDDM',
    altitude: '36000',
    assignedsquawk: '1234'
  }
  await startMonitoring(demoFlight)
}

const backToSetup = () => {
  currentScreen.value = 'login'
  selectedPlan.value = null
  lastTransmission.value = ''
  airportFrequencies.value = []
  airportFrequenciesError.value = ''
  showFrequencyList.value = false
  atisInfo.value = null
  atisError.value = ''
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
        lastTransmission.value = `INTERCOM: ${result.transcription}`
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
    lastTransmission.value = 'Error processing audio'
  }
}

const sendPilotText = async () => {
  const text = pilotInput.value.trim()
  if (!text) return

  pilotInput.value = ''
  await handlePilotTransmission(text, 'text')
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
  return date.toLocaleTimeString('de-DE', {
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

const cloneForTrace = <T>(value: T): T => {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch (_err) {
    return value
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

  lastTransmission.value = `ATC: ${plain}`
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

    await startDemoFlight()
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

      lastTransmission.value = `Pilot: ${pilotText}`

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
