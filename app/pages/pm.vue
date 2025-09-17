<template>
  <div class="min-h-screen bg-[#050910] text-white">
    <div class="mx-auto w-full max-w-[420px] px-4 pb-24 pt-6 sm:px-6">
      <!-- Header -->
      <header class="flex items-center justify-between pb-6">
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-cyan-400/80">OpenSquawk</p>
          <h1 class="text-2xl font-semibold">Pilot Monitoring</h1>
          <p class="mt-1 text-sm text-white/70">Decision Tree • Enhanced LLM • VATSIM</p>
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
          <v-card-text class="space-y-3">
            <h3 class="text-lg font-semibold">Quick Actions</h3>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <v-btn
                  color="orange"
                  variant="flat"
                  @click="performRadioCheck"
                  :loading="radioCheckLoading"
                  prepend-icon="mdi-radio"
                  density="comfortable"
                  :disabled="isSimulating"
              >
                Radio Check
              </v-btn>
              <v-btn
                  color="cyan"
                  variant="flat"
                  @click="runSimulation"
                  :loading="isSimulating"
                  :disabled="isSimulating"
                  prepend-icon="mdi-airplane-takeoff"
                  density="comfortable"
              >
                Demo-Flug Simulation
              </v-btn>
              <v-btn
                  v-if="isSimulating"
                  color="red"
                  variant="outlined"
                  @click="stopSimulation"
                  prepend-icon="mdi-stop-circle"
                  density="comfortable"
              >
                Simulation stoppen
              </v-btn>
            </div>
            <div v-if="isSimulating || simulationStepIndex > 0" class="space-y-2">
              <div class="flex items-center justify-between text-xs text-white/50">
                <span>Simulation Fortschritt</span>
                <span class="font-mono text-white/70">{{ Math.min(simulationStepIndex, simulationSteps.length) }} / {{ simulationSteps.length }}</span>
              </div>
              <v-progress-linear
                  :model-value="simulationProgress"
                  color="cyan"
                  height="6"
                  rounded
                  striped
              />
            </div>
            <v-alert
                v-if="simulationError"
                type="warning"
                density="comfortable"
                variant="tonal"
                class="bg-amber-500/10 text-amber-100"
                border="start"
                border-color="amber"
            >
              {{ simulationError }}
            </v-alert>
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
                :disabled="isSimulating"
            />
            <p class="text-xs text-white/50">
              Für Notfälle wenn PTT nicht funktioniert oder für Tests
            </p>
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

            <div v-if="simulationLog.length" class="space-y-3 border-t border-white/10 pt-3">
              <div class="flex items-center justify-between">
                <p class="text-xs uppercase tracking-[0.3em] text-white/40">Simulation Trace</p>
                <div class="flex items-center gap-2">
                  <v-chip size="x-small" color="cyan" variant="outlined">{{ simulationLog.length }}</v-chip>
                  <v-btn size="x-small" variant="text" color="cyan" @click="clearSimulationTrace">Clear</v-btn>
                </div>
              </div>
              <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
                <div
                    v-for="entry in simulationLog"
                    :key="`${entry.timestamp}-${entry.stepId}`"
                    class="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-3"
                >
                  <div class="flex items-center justify-between text-[11px] text-white/50">
                    <span class="font-semibold text-white/70">{{ entry.title }}</span>
                    <span class="font-mono">{{ entry.stateBefore }} → {{ entry.stateAfter || '…' }}</span>
                  </div>
                  <p class="text-[11px] text-white/40">{{ entry.description }}</p>
                  <div class="space-y-1">
                    <p class="text-xs text-white">
                      <span class="text-white/50 uppercase tracking-[0.2em] mr-2">Pilot</span>
                      <span class="font-mono">{{ entry.pilot }}</span>
                    </p>
                    <p class="text-[11px] text-white/40">{{ entry.pilotNormalized }}</p>
                  </div>
                  <div class="grid grid-cols-1 gap-1 text-[11px] text-white/50 sm:grid-cols-2">
                    <div>
                      <p class="font-semibold text-white/60 uppercase tracking-[0.2em]">LLM Request</p>
                      <p>State: {{ entry.llmRequest.state_id }} ({{ entry.llmRequest.phase }})</p>
                      <p>Candidates: {{ entry.llmRequest.candidates.join(', ') }}</p>
                    </div>
                    <div>
                      <p class="font-semibold text-white/60 uppercase tracking-[0.2em]">Decision</p>
                      <p>Next: {{ entry.llmResponse.next_state }}</p>
                      <p v-if="entry.llmResponse.controller_say_tpl">Say: {{ entry.llmResponse.controller_say_tpl }}</p>
                    </div>
                  </div>
                  <div v-if="entry.controllerAuto" class="space-y-1 text-[11px] text-cyan-200">
                    <div>
                      <span class="uppercase tracking-[0.2em] mr-2">ATC Auto</span>
                      <span class="font-mono">{{ entry.controllerAuto }}</span>
                    </div>
                    <p v-if="entry.controllerNormalized" class="text-white/60 font-mono">{{ entry.controllerNormalized }}</p>
                  </div>
                  <div v-if="entry.warnings?.length" class="flex flex-wrap gap-1">
                    <v-chip
                        v-for="warn in entry.warnings"
                        :key="warn"
                        size="x-small"
                        color="amber"
                        variant="tonal"
                    >
                      {{ warn }}
                    </v-chip>
                  </div>
                </div>
              </div>
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
  processPilotTransmission,
  buildLLMContext,
  applyLLMDecision,
  moveTo: forceMove,
  normalizeATCText,
  renderATCMessage,
  getStateDetails,
  buildNominalFlow
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

type SimulationTrace = {
  stepId: string
  title: string
  description?: string
  stateBefore: string
  pilot: string
  pilotNormalized: string
  llmRequest: {
    state_id: string
    role: string
    phase: string
    candidates: string[]
  }
  llmResponse: any
  stateAfter?: string
  phaseAfter?: string
  controllerAuto?: string
  controllerNormalized?: string
  warnings?: string[]
  timestamp: string
}

const simulationActive = ref(false)
const isSimulating = ref(false)
const simulationStepIndex = ref(0)
const simulationLog = ref<SimulationTrace[]>([])
const simulationError = ref('')
const lastSimulationEntry = ref<SimulationTrace | null>(null)
const simulationProgress = computed(() => {
  const total = simulationSteps.value.length
  if (total === 0) return 0
  const step = Math.min(simulationStepIndex.value, total)
  return Math.round((step / total) * 100)
})

// Frequencies
const frequencies = ref({
  active: '121.900',
  standby: '118.100'
})

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

type SimulationPlanEntry = {
  stateId: string
  nextStateId?: string
  stateBefore: string
  title: string
  description: string
  pilotTpl: string
  phase: string
  frequencyName: string
}

const SIMULATION_LABELS: Record<string, { title: string; description: string }> = {
  CD_CHECK_ATIS: {
    title: 'Clearance Request',
    description: 'Initial contact with Clearance Delivery to obtain IFR clearance.'
  },
  CD_VERIFY_READBACK: {
    title: 'Clearance Readback',
    description: 'Read back the received IFR clearance before start-up.'
  },
  GRD_READY_FOR_PUSH: {
    title: 'Pushback Request',
    description: 'Call Ground once ready for pushback and engine start.'
  },
  GRD_TAXI_REQUEST: {
    title: 'Taxi Request',
    description: 'Request taxi clearance after pushback is complete.'
  },
  GRD_TAXI_READBACK: {
    title: 'Taxi Readback',
    description: 'Acknowledge taxi routing and hold short instructions.'
  },
  TWR_LINEUP_REQ: {
    title: 'Ready for Departure',
    description: 'Advise Tower that you are ready for departure at the holding point.'
  },
  TWR_TAKEOFF_READBACK: {
    title: 'Takeoff Clearance Readback',
    description: 'Read back the takeoff clearance.'
  },
  DEP_CONTACT: {
    title: 'Departure Check-in',
    description: 'Initial call to Departure after handoff from Tower.'
  },
  DEP_CLIMB_READBACK: {
    title: 'Climb Readback',
    description: 'Acknowledge climb and direct routing instructions.'
  },
  DES_READBACK: {
    title: 'Descent Clearance Readback',
    description: 'Read back the STAR and descent clearance from Center.'
  },
  APP_ESTABLISHED: {
    title: 'Established on Approach',
    description: 'Report established on the localizer to Approach.'
  },
  TWR_LAND_READBACK: {
    title: 'Landing Clearance Readback',
    description: 'Read back landing clearance from Tower.'
  },
  GRD_TAXI_IN_REQ: {
    title: 'Runway Vacated',
    description: 'Report runway vacated and request taxi in.'
  },
  GRD_TAXI_IN_READBACK: {
    title: 'Taxi-In Readback',
    description: 'Acknowledge taxi-in instructions back to stand.'
  }
}

const FREQUENCY_BY_PHASE: Record<string, string> = {
  Clearance: 'Clearance Delivery',
  PushStart: 'Ground',
  TaxiOut: 'Ground',
  Departure: 'Tower',
  Climb: 'Departure',
  Enroute: 'Center',
  Descent: 'Center',
  Approach: 'Approach',
  Landing: 'Tower',
  TaxiIn: 'Ground',
  Postflight: 'Operations',
  Interrupt: 'Supervisor',
  LostComms: 'Emergency',
  Missed: 'Tower'
}

const simulationSteps = computed<SimulationPlanEntry[]>(() => {
  const plan = buildNominalFlow()
  return plan
    .map(step => {
      const state = getStateDetails(step.stateId)
      if (!state || !state.utterance_tpl) return null
      const meta = SIMULATION_LABELS[step.stateId] || {
        title: step.stateId,
        description: `${state.phase} • ${state.role}`
      }
      return {
        stateId: step.stateId,
        nextStateId: step.nextStateId,
        stateBefore: step.stateId,
        title: meta.title,
        description: meta.description,
        pilotTpl: state.utterance_tpl,
        phase: state.phase,
        frequencyName: FREQUENCY_BY_PHASE[state.phase] || state.phase
      }
    })
    .filter((entry): entry is SimulationPlanEntry => entry !== null)
})

// Methods
const normalizeExpectedText = (text: string): string => {
  if (!flightContext.value) return text
  return normalizeATCText(text, { ...vars.value, ...flags.value })
}

const formatPilotTransmission = (tpl: string) => {
  if (!tpl) return ''
  const rendered = renderATCMessage(tpl)
  return rendered.replace(/\s+/g, ' ').replace(/\s+([,.])/g, '$1').trim()
}

const normalizePilotTransmission = (text: string) => {
  return normalizeATCText(text, { ...vars.value, ...flags.value })
}

const runSimulatedDecision = async (ctx: ReturnType<typeof buildLLMContext>, transcript: string) => {
  const index = simulationStepIndex.value
  const steps = simulationSteps.value
  const step = steps[index]
  const warnings: string[] = []

  if (!step) {
    warnings.push('No simulation step configured; falling back to current state.')
  } else if (step.stateBefore && step.stateBefore !== ctx.state_id) {
    warnings.push(`Expected state ${step.stateBefore} but received ${ctx.state_id}`)
  }

  const entry: SimulationTrace = {
    stepId: step?.stateId || `manual_${simulationStepIndex.value + 1}`,
    title: step?.title || 'Manual Decision',
    description: step?.description,
    stateBefore: ctx.state_id,
    pilot: transcript,
    pilotNormalized: normalizePilotTransmission(transcript),
    llmRequest: {
      state_id: ctx.state_id,
      role: ctx.state.role,
      phase: ctx.state.phase,
      candidates: ctx.candidates.map(c => c.id)
    },
    llmResponse: {},
    timestamp: new Date().toISOString()
  }

  if (warnings.length) {
    entry.warnings = warnings
  }

  simulationLog.value.push(entry)
  lastSimulationEntry.value = entry

  let nextStateId = ctx.state_id
  if (step?.nextStateId) {
    nextStateId = step.nextStateId
  } else if (ctx.candidates.length > 0) {
    nextStateId = ctx.candidates[0].id
  }

  const decision: any = { next_state: nextStateId }
  const nextState = getStateDetails(nextStateId)
  if (nextState?.role === 'atc' && nextState.say_tpl) {
    decision.controller_say_tpl = nextState.say_tpl
  }

  simulationStepIndex.value = Math.min(index + 1, steps.length)
  entry.llmResponse = decision
  return decision
}

const stopSimulation = () => {
  simulationActive.value = false
  isSimulating.value = false
}

const clearSimulationTrace = () => {
  simulationLog.value = []
  simulationStepIndex.value = 0
  simulationError.value = ''
}

const runSimulation = async () => {
  if (isSimulating.value) return
  simulationError.value = ''

  try {
    if (currentScreen.value !== 'monitor') {
      startDemoFlight()
    } else if (selectedPlan.value) {
      startMonitoring(selectedPlan.value)
    } else {
      startDemoFlight()
    }

    clearLog()
    simulationLog.value = []
    simulationStepIndex.value = 0
    simulationActive.value = true
    isSimulating.value = true

    for (const step of simulationSteps.value) {
      if (!simulationActive.value) break
      const pilotText = formatPilotTransmission(step.pilotTpl)
      if (!pilotText) continue
      await wait(300)
      await handlePilotTransmission(pilotText, 'text')
      await nextTick()
      await wait(150)
    }

    await nextTick()
    if (currentState.value?.id !== 'FLOW_COMPLETE') {
      simulationError.value = `Simulation ended at ${currentState.value?.id || 'unknown state'}`
    }
  } catch (err: any) {
    simulationError.value = err?.message || 'Simulation failed'
    console.error('Simulation failed:', err)
  } finally {
    stopSimulation()
    lastSimulationEntry.value = null
  }
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
    const decision = simulationActive.value
      ? await runSimulatedDecision(ctx, transcript)
      : await api.post('/api/llm/decide', ctx)

    const outcome = applyLLMDecision(decision)

    if (simulationActive.value && lastSimulationEntry.value) {
      await nextTick()
      lastSimulationEntry.value.stateAfter = outcome.state?.id || currentState.value?.id || '—'
      lastSimulationEntry.value.phaseAfter = outcome.state?.phase || currentState.value?.phase
      if (outcome.spoken) {
        lastSimulationEntry.value.controllerAuto = outcome.spoken
        lastSimulationEntry.value.controllerNormalized = normalizePilotTransmission(outcome.spoken)
      } else if (outcome.state?.say_tpl) {
        const controllerText = renderATCMessage(outcome.state.say_tpl)
        lastSimulationEntry.value.controllerAuto = controllerText
        lastSimulationEntry.value.controllerNormalized = normalizePilotTransmission(controllerText)
      }
      lastSimulationEntry.value = null
    }

    const controllerTemplate = decision.controller_say_tpl || (outcome.state?.role === 'atc' ? outcome.state.say_tpl : undefined)
    if (controllerTemplate && !decision.radio_check) {
      scheduleControllerSpeech(controllerTemplate)
    }
  } catch (e) {
    console.error('LLM decision failed', e)
    if (simulationActive.value) {
      simulationError.value = e instanceof Error ? e.message : 'Simulation decision failed'
      stopSimulation()
    }
    if (lastSimulationEntry.value) {
      lastSimulationEntry.value.warnings = [
        ...(lastSimulationEntry.value.warnings || []),
        'Decision processing failed'
      ]
      lastSimulationEntry.value = null
    }
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

const startMonitoring = (flightPlan: any) => {
  selectedPlan.value = flightPlan
  initializeFlight(flightPlan)
  currentScreen.value = 'monitor'

  // Set appropriate frequency based on departure airport
  if (flightPlan.dep === 'EDDF') {
    frequencies.value.active = '121.900' // Frankfurt Delivery
    frequencies.value.standby = '121.700' // Frankfurt Ground
  }
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
  startMonitoring(demoFlight)
}

const backToSetup = () => {
  currentScreen.value = 'login'
  selectedPlan.value = null
  lastTransmission.value = ''
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
  if (isSimulating.value) return
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
  if (isSimulating.value) return
  const text = pilotInput.value.trim()
  if (!text) return

  pilotInput.value = ''
  await handlePilotTransmission(text, 'text')
}

const performRadioCheck = async () => {
  if (isSimulating.value) return
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
