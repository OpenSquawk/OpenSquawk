<template>
  <div class="pilot-monitoring-page bg-[#050b18] text-white min-h-screen">
    <v-app-bar
      flat
      density="comfortable"
      class="bg-[#050b18]/90 backdrop-blur-sm border-b border-white/10"
    >
      <template #prepend>
        <NuxtLink to="/" class="flex items-center gap-2 text-white/80">
          <v-icon icon="mdi-chevron-left" size="22" />
          <span class="text-sm font-medium">Zurück</span>
        </NuxtLink>
      </template>
      <v-app-bar-title class="text-base font-semibold tracking-tight">Pilot Monitoring</v-app-bar-title>
      <template #append>
        <v-btn icon variant="text" @click="settingsSheet = true">
          <v-icon icon="mdi-cog" />
        </v-btn>
      </template>
    </v-app-bar>

    <v-main class="pt-20 pb-24">
      <v-container class="max-w-screen-sm mx-auto px-4 sm:px-6 py-4 space-y-6">
        <div class="flex justify-between items-center">
          <div class="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Workflow</div>
          <div class="text-xs text-white/60">Schritt {{ step }} von 3</div>
        </div>

        <div v-if="step === 1" class="space-y-4">
          <v-card variant="flat" class="rounded-3xl border border-white/10 bg-white/5">
            <v-card-title class="text-lg font-semibold">1 · VATSIM Flightplan verknüpfen</v-card-title>
            <v-card-text class="space-y-4 text-sm text-white/80">
              <p>
                Prefile deinen Flugplan bei VATSIM und gib anschließend deine Mitglieds-ID an.
                Wir laden den aktuellsten Eintrag automatisch und bereiten METAR &amp; Routing vor.
              </p>
              <v-text-field
                v-model="vatsimIdInput"
                label="VATSIM ID"
                variant="solo"
                color="primary"
                bg-color="#0f1629"
                prepend-inner-icon="mdi-account"
                type="number"
                inputmode="numeric"
                hint="z. B. 1857215"
                persistent-hint
                @keyup.enter="loadFlightPlans"
              />
              <v-btn
                block
                color="primary"
                size="large"
                class="rounded-2xl"
                :loading="store.isFetchingFlights"
                @click="loadFlightPlans"
              >
                Flightplan laden
              </v-btn>
              <v-alert
                v-if="store.fetchError"
                type="error"
                variant="tonal"
                class="rounded-2xl"
              >
                {{ store.fetchError }}
              </v-alert>
              <div class="bg-black/40 rounded-2xl p-4 space-y-2 font-mono text-xs">
                <div class="text-cyan-300">Beispiel Request</div>
                <pre class="whitespace-pre-wrap break-all text-white/80">{{ sampleFlightRequest }}</pre>
              </div>
              <div class="bg-black/40 rounded-2xl p-4 space-y-2 font-mono text-[11px] leading-5">
                <div class="text-cyan-300">Response (gekürzt)</div>
                <pre class="whitespace-pre overflow-x-auto text-white/70">{{ sampleFlightResponse }}</pre>
              </div>
              <div class="text-xs text-white/60">
                Tipp: Datenquellen wie
                <a
                  href="https://data.vatsim.net/v3/vatsim-data.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-cyan-300"
                >
                  data.vatsim.net
                </a>
                liefern ergänzende Live-Informationen (Online-ATC, ATIS usw.).
              </div>
            </v-card-text>
          </v-card>
        </div>

        <div v-else-if="step === 2" class="space-y-4">
          <v-card variant="flat" class="rounded-3xl border border-white/10 bg-white/5">
            <v-card-title class="flex items-center justify-between">
              <span class="text-lg font-semibold">2 · Flightplan auswählen</span>
              <v-btn size="small" variant="text" class="text-white/70" @click="step = 1">
                <v-icon icon="mdi-pencil" size="16" class="mr-1" />ID ändern
              </v-btn>
            </v-card-title>
            <v-card-text class="space-y-4 text-sm text-white/80">
              <div v-if="!store.flights.length">
                <v-alert type="info" variant="tonal" class="rounded-2xl">
                  Kein Flightplan gefunden – bitte prüfen, ob der Flug korrekt vorgefiled wurde.
                </v-alert>
              </div>
              <div v-else class="space-y-4">
                <v-card
                  v-for="plan in store.flights"
                  :key="plan.id"
                  variant="flat"
                  class="rounded-2xl border border-white/10 bg-black/30"
                >
                  <v-card-title class="flex items-center justify-between text-white">
                    <div class="flex flex-col">
                      <span class="text-lg font-semibold">{{ plan.callsign }}</span>
                      <span class="text-xs text-white/60">Filed {{ plan.filed_at ? useDateTime(plan.filed_at) : '–' }}</span>
                    </div>
                    <v-chip size="small" color="cyan" variant="flat">
                      {{ plan.aircraft_flight_plan.flight_rules === 'I' ? 'IFR' : 'VFR' }}
                    </v-chip>
                  </v-card-title>
                  <v-card-text class="text-sm text-white/70 space-y-2">
                    <div class="flex justify-between">
                      <span>Aircraft</span>
                      <span class="font-medium">{{ plan.aircraft_flight_plan.aircraft }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Route</span>
                      <span class="font-medium text-right max-w-[60%]">{{ plan.aircraft_flight_plan.route ?? '—' }}</span>
                    </div>
                    <div class="grid grid-cols-3 gap-2 text-xs text-white/60">
                      <div>
                        <div class="text-white/50">DEP</div>
                        <div class="font-semibold text-white">{{ plan.aircraft_flight_plan.departure }}</div>
                      </div>
                      <div>
                        <div class="text-white/50">ARR</div>
                        <div class="font-semibold text-white">{{ plan.aircraft_flight_plan.arrival }}</div>
                      </div>
                      <div>
                        <div class="text-white/50">ALT</div>
                        <div class="font-semibold text-white">{{ plan.aircraft_flight_plan.alternate ?? '—' }}</div>
                      </div>
                    </div>
                  </v-card-text>
                  <v-card-actions class="px-4 pb-4">
                    <v-btn
                      block
                      color="primary"
                      class="rounded-2xl"
                      @click="handleSelectFlight(plan.id)"
                    >
                      Diesen Flug nutzen
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </div>
            </v-card-text>
          </v-card>
        </div>

        <div v-else-if="step === 3" class="space-y-6">
          <v-card variant="flat" class="rounded-3xl border border-white/10 bg-white/5">
            <v-card-title class="flex items-start justify-between">
              <div>
                <div class="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Flight</div>
                <div class="text-xl font-semibold">{{ selectedFlight?.callsign }}</div>
              </div>
              <v-btn size="small" variant="text" class="text-white/70" @click="step = 2">
                <v-icon icon="mdi-airplane-edit" size="16" class="mr-1" /> Wechseln
              </v-btn>
            </v-card-title>
            <v-card-text class="text-sm text-white/80 space-y-3">
              <div class="flex items-center justify-between">
                <span>Aircraft</span>
                <span class="font-medium">{{ selectedFlight?.aircraft_flight_plan.aircraft ?? '—' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Route</span>
                <span class="font-medium text-right max-w-[65%]">
                  {{ selectedFlight?.aircraft_flight_plan.route ?? 'Direkt nach ' + selectedFlight?.aircraft_flight_plan.arrival }}
                </span>
              </div>
              <div class="grid grid-cols-3 gap-2 text-xs text-white/60">
                <div>
                  <div class="text-white/50">DEP</div>
                  <div class="font-semibold text-white">{{ selectedFlight?.aircraft_flight_plan.departure }}</div>
                </div>
                <div>
                  <div class="text-white/50">ARR</div>
                  <div class="font-semibold text-white">{{ selectedFlight?.aircraft_flight_plan.arrival }}</div>
                </div>
                <div>
                  <div class="text-white/50">ALT</div>
                  <div class="font-semibold text-white">{{ selectedFlight?.aircraft_flight_plan.alternate ?? '—' }}</div>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <v-card variant="flat" class="rounded-3xl border border-white/10 bg-white/5">
            <v-card-title class="flex items-center justify-between">
              <span class="text-lg font-semibold">Frequenzen &amp; Radio Check</span>
              <v-chip size="small" variant="outlined" color="cyan" class="text-xs">
                {{ normalizedActiveFrequency }}
              </v-chip>
            </v-card-title>
            <v-card-text class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <v-text-field
                  v-model="activeFrequency"
                  label="Aktiv"
                  variant="solo"
                  color="primary"
                  bg-color="#0f1629"
                  inputmode="decimal"
                  prepend-inner-icon="mdi-broadcast"
                />
                <v-text-field
                  v-model="standbyFrequency"
                  label="Standby"
                  variant="solo"
                  color="primary"
                  bg-color="#0f1629"
                  inputmode="decimal"
                  prepend-inner-icon="mdi-radio-handheld"
                />
              </div>
              <div class="flex items-center gap-3">
                <v-btn color="primary" variant="tonal" class="rounded-2xl" @click="store.swapFrequencies">
                  <v-icon icon="mdi-swap-horizontal" class="mr-2" /> Swap
                </v-btn>
                <v-btn
                  color="primary"
                  class="rounded-2xl flex-1"
                  variant="flat"
                  @click="openRadioCheck"
                >
                  <v-icon icon="mdi-radio-tower" class="mr-2" /> Radio Check
                </v-btn>
                <v-chip v-if="store.radioCheckCompleted" color="success" size="small" variant="flat">
                  <v-icon icon="mdi-check" size="16" class="mr-1" /> Ready
                </v-chip>
              </div>
              <v-alert v-if="!store.isMicrophoneGranted" type="warning" variant="tonal" class="rounded-2xl">
                Mikrofon noch nicht freigegeben. Bitte Zugriffsanfrage bestätigen.
                <template #append>
                  <v-btn size="small" variant="text" color="primary" @click="store.requestMicrophoneAccess">
                    Jetzt erlauben
                  </v-btn>
                </template>
              </v-alert>
            </v-card-text>
          </v-card>

          <v-card variant="flat" class="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-[#0b152d] to-[#09142a]">
            <v-card-title class="text-lg font-semibold">Push To Talk</v-card-title>
            <v-card-text class="space-y-4">
              <div class="space-y-3">
                <v-btn
                  block
                  height="104"
                  class="ptt-button"
                  :class="{ 'ptt-active': currentPttChannel === 'atc' }"
                  @pointerdown.prevent="handlePttStart('atc')"
                  @touchstart.prevent="handlePttStart('atc')"
                >
                  <div class="flex flex-col items-center gap-1">
                    <span class="text-lg font-semibold">ATC</span>
                    <span class="text-xs text-white/70">Aktiv {{ store.frequency.active }} · {{ normalizedActiveFrequency }}</span>
                  </div>
                </v-btn>
                <v-btn
                  block
                  height="96"
                  class="ptt-button intercom"
                  :class="{ 'ptt-active': currentPttChannel === 'intercom' }"
                  @pointerdown.prevent="handlePttStart('intercom')"
                  @touchstart.prevent="handlePttStart('intercom')"
                >
                  <div class="flex flex-col items-center gap-1">
                    <span class="text-lg font-semibold">Intercom</span>
                    <span class="text-xs text-white/70">Crew Kommunikation &amp; Checklisten</span>
                  </div>
                </v-btn>
              </div>
              <div class="text-xs text-white/60">
                Halten, um zu sprechen · Loslassen, um zu senden. Status: {{ store.microphoneStatus }}
              </div>
            </v-card-text>
          </v-card>

          <v-card variant="flat" class="rounded-3xl border border-white/10 bg-white/5">
            <v-card-title class="flex items-center justify-between">
              <span class="text-lg font-semibold">Phasen &amp; Funkabläufe</span>
              <div class="flex items-center gap-2">
                <v-btn icon size="small" variant="text" @click="store.goToPreviousPhase">
                  <v-icon icon="mdi-chevron-left" />
                </v-btn>
                <v-btn icon size="small" variant="text" @click="store.goToNextPhase">
                  <v-icon icon="mdi-chevron-right" />
                </v-btn>
              </div>
            </v-card-title>
            <v-card-text class="space-y-4">
              <v-slide-group
                v-model="phaseModel"
                class="phase-slide"
                show-arrows="mobile"
                center-active
              >
                <v-slide-group-item
                  v-for="phase in store.availablePhases"
                  :key="phase.id"
                  :value="phase.id"
                >
                  <v-chip
                    class="mr-2 mb-2"
                    :color="phase.id === store.activePhaseId ? 'primary' : 'white'"
                    :variant="phase.id === store.activePhaseId ? 'flat' : 'outlined'"
                  >
                    {{ phase.title }}
                  </v-chip>
                </v-slide-group-item>
              </v-slide-group>
              <div class="text-xs text-white/60">{{ store.activePhase?.summary }}</div>
              <v-expansion-panels variant="accordion" class="bg-transparent">
                <v-expansion-panel
                  v-for="action in store.activePhaseActions"
                  :key="action.id"
                  class="bg-black/30 border border-white/5 rounded-2xl"
                >
                  <v-expansion-panel-title class="text-sm font-semibold flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <v-icon :icon="action.channel === 'atc' ? 'mdi-airplane-clock' : 'mdi-account-voice'" size="18" />
                      <span>{{ action.label }}</span>
                    </div>
                    <v-chip size="x-small" variant="outlined" color="white">
                      {{ action.channel === 'atc' ? 'ATC' : 'Intercom' }}
                    </v-chip>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text class="text-sm text-white/70 space-y-3">
                    <p>{{ action.description }}</p>
                    <div v-if="action.samplePhraseology?.length" class="space-y-2">
                      <div class="text-xs text-white/50 uppercase">Beispielphraseologie</div>
                      <div
                        v-for="(phrase, idx) in action.samplePhraseology"
                        :key="idx"
                        class="bg-black/40 rounded-xl p-3 font-mono text-xs"
                      >
                        {{ phrase }}
                      </div>
                    </div>
                    <div v-if="action.notes" class="text-xs text-white/50">{{ action.notes }}</div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card-text>
          </v-card>

          <v-card variant="flat" class="rounded-3xl border border-white/10 bg-white/5">
            <v-card-title class="flex items-center justify-between">
              <span class="text-lg font-semibold">METAR Snapshot</span>
              <v-progress-circular
                v-if="store.metarLoading"
                indeterminate
                color="cyan"
                size="22"
              />
            </v-card-title>
            <v-card-text class="space-y-3 text-sm text-white/80">
              <div
                v-for="(report, label) in metarEntries"
                :key="label"
                class="bg-black/30 rounded-2xl p-3"
              >
                <div class="flex items-center justify-between">
                  <span class="uppercase text-xs text-white/50">{{ label }}</span>
                  <span class="font-semibold">{{ report?.icao ?? '—' }}</span>
                </div>
                <div class="mt-2 text-xs whitespace-pre-wrap break-words text-white/70">
                  {{ report?.error ? 'Fehler: ' + report.error : report?.rawText ?? 'Keine Daten' }}
                </div>
              </div>
              <v-btn
                variant="tonal"
                color="primary"
                class="rounded-2xl"
                @click="store.fetchMetarsForSelectedFlight"
              >
                METAR aktualisieren
              </v-btn>
            </v-card-text>
          </v-card>

          <v-card variant="flat" class="rounded-3xl border border-white/10 bg-white/5">
            <v-card-title class="flex items-center justify-between">
              <span class="text-lg font-semibold">Checklisten</span>
              <v-btn
                v-if="store.hasChecklist"
                color="primary"
                variant="flat"
                class="rounded-2xl"
                @click="toggleChecklist"
              >
                Öffnen
              </v-btn>
            </v-card-title>
            <v-card-text class="text-sm text-white/70">
              <div v-if="store.hasChecklist">
                A320 Profil gefunden – Checklisten stehen über Intercom bereit.
              </div>
              <div v-else>
                Für dieses Luftfahrzeug liegen noch keine Checklisten vor.
              </div>
            </v-card-text>
          </v-card>

          <v-card variant="flat" class="rounded-3xl border border-white/10 bg-white/5">
            <v-card-title class="text-lg font-semibold">Transmissions</v-card-title>
            <v-card-text class="space-y-3">
              <div v-if="!transmissionsToShow.length" class="text-sm text-white/60">Noch keine Einträge.</div>
              <div
                v-for="entry in transmissionsToShow"
                :key="entry.id"
                class="bg-black/30 rounded-2xl p-3 text-sm"
              >
                <div class="flex items-center justify-between text-xs text-white/50">
                  <span>{{ entry.channel }}</span>
                  <span>{{ useDateTime(entry.timestamp) }}</span>
                </div>
                <div class="mt-2 text-white/80 font-medium">{{ entry.summary }}</div>
                <div v-if="entry.transcript" class="mt-1 text-xs text-white/60">{{ entry.transcript }}</div>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-container>
    </v-main>

    <v-bottom-sheet v-model="settingsSheet" inset>
      <v-card class="rounded-t-3xl bg-[#09142a] text-white">
        <v-card-title class="flex items-center justify-between">
          <span class="text-lg font-semibold">Einstellungen</span>
          <v-btn icon variant="text" @click="settingsSheet = false">
            <v-icon icon="mdi-close" />
          </v-btn>
        </v-card-title>
        <v-card-text class="space-y-4 text-sm text-white/80">
          <v-switch
            v-model="randomTaxi"
            color="primary"
            inset
            label="Taxi-Randomizer aktivieren"
            messages="Erzeugt alternative Taxiwege, um Funktraining abwechslungsreicher zu gestalten."
          />
          <v-btn
            variant="tonal"
            color="primary"
            class="rounded-2xl"
            href="https://data.vatsim.net/v3/vatsim-data.json"
            target="_blank"
          >
            VATSIM Datenhub öffnen
          </v-btn>
          <v-btn
            variant="text"
            color="white"
            class="rounded-2xl"
            @click="store.releaseMicrophone"
          >
            Mikrofon-Session zurücksetzen
          </v-btn>
        </v-card-text>
      </v-card>
    </v-bottom-sheet>

    <v-bottom-sheet v-model="checklistSheet" inset>
      <v-card class="rounded-t-3xl bg-[#09142a] text-white">
        <v-card-title class="flex items-center justify-between">
          <span class="text-lg font-semibold">A320 Checklisten</span>
          <v-btn icon variant="text" @click="closeChecklist">
            <v-icon icon="mdi-close" />
          </v-btn>
        </v-card-title>
        <v-card-text class="space-y-4 max-h-[60vh] overflow-y-auto">
          <div
            v-for="section in store.applicableChecklists"
            :key="section.id"
            class="bg-black/30 rounded-2xl p-4 space-y-2"
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm font-semibold">{{ section.title }}</div>
                <div class="text-xs text-white/60">Channel: {{ section.channel ?? 'Intercom' }}</div>
              </div>
            </div>
            <div v-if="section.description" class="text-xs text-white/60">{{ section.description }}</div>
            <div class="space-y-2">
              <div
                v-for="item in section.items"
                :key="item.id"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-white/70">{{ item.challenge }}</span>
                <span class="text-white font-semibold">{{ item.response }}</span>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-bottom-sheet>

    <v-dialog v-model="radioCheckDialog" max-width="420">
      <v-card class="bg-[#09142a] text-white">
        <v-card-title class="text-lg font-semibold">Radio Check</v-card-title>
        <v-card-text class="space-y-3 text-sm text-white/80">
          <v-alert type="info" variant="tonal" class="rounded-2xl text-xs">
            Stelle sicher, dass die aktive Frequenz korrekt ist und PTT gedrückt wird, während du sprichst.
          </v-alert>
          <v-text-field
            v-model="radioCheckFacility"
            label="Station"
            variant="solo"
            color="primary"
            bg-color="#0f1629"
            hint="z. B. West Palm Tower"
            persistent-hint
          />
          <v-text-field
            v-model="radioCheckResponse"
            label="Erwartete Antwort"
            variant="solo"
            color="primary"
            bg-color="#0f1629"
          />
          <div class="bg-black/30 rounded-2xl p-3 font-mono text-xs space-y-2">
            <div class="text-white/60 uppercase">Call</div>
            <div>{{ radioCheckCall }}</div>
            <div class="text-white/60 uppercase">Reply</div>
            <div>{{ radioCheckReply }}</div>
          </div>
        </v-card-text>
        <v-card-actions class="justify-between px-4 pb-4">
          <v-btn variant="text" class="text-white/70" @click="radioCheckDialog = false">Abbrechen</v-btn>
          <v-btn color="primary" class="rounded-2xl" @click="completeRadioCheck">
            Als bestanden markieren
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useHead } from '#imports'
import { applyRadioTemplate } from '~/composables/radioSpeechNormalizer'
import type { FlightPhaseId, FrequencyChannel } from '~/data/communications'
import { usePilotMonitoringStore } from '~/stores/pilotMonitoring'

useHead({
  title: 'Pilot Monitoring · OpenSquawk',
  meta: [
    { name: 'description', content: 'Mobile Pilot Monitoring Oberfläche mit PTT, Checklisten und VATSIM-Integration.' },
  ],
})

const store = usePilotMonitoringStore()

const step = ref(1)
const vatsimIdInput = ref(store.vatsimId)
const radioCheckDialog = ref(false)
const radioCheckFacility = ref('West Palm Tower')
const radioCheckResponse = ref('Read you five')
const settingsSheet = ref(false)
const currentPttChannel = ref<FrequencyChannel | null>(null)

const activeFrequency = computed({
  get: () => store.frequency.active,
  set: (value: string) => store.setFrequency('active', value),
})

const standbyFrequency = computed({
  get: () => store.frequency.standby,
  set: (value: string) => store.setFrequency('standby', value),
})

const randomTaxi = computed({
  get: () => store.randomTaxi,
  set: (value: boolean) => store.setRandomTaxi(value),
})

const checklistSheet = computed({
  get: () => store.checklistVisibility,
  set: (value: boolean) => store.toggleChecklistVisibility(value),
})

const phaseModel = computed({
  get: () => store.activePhaseId,
  set: (value: FlightPhaseId) => store.setPhase(value),
})

const selectedFlight = computed(() => store.selectedFlight)

const transmissionsToShow = computed(() => store.transmissions.slice(0, 10))

const normalizedActiveFrequency = computed(() => store.formattedActiveFrequency)

const sampleFlightRequest = computed(() => {
  const id = vatsimIdInput.value || '1857215'
  return `GET https://api.vatsim.net/v2/members/${id}/flightplans`
})

const sampleFlightResponse = `{
  "data": [
    {
      "id": 1234567,
      "callsign": "DLH4AB",
      "aircraft_flight_plan": {
        "aircraft": "A20N",
        "flight_rules": "I",
        "departure": "EDDF",
        "arrival": "EDDM",
        "alternate": "EDDS",
        "route": "TOBAK Y152 SULUS",
        "cruise_altitude": "36000"
      }
    }
  ]
}`

const radioCheckCall = computed(() => {
  const frequency = store.frequency.active || '118.500'
  const callsign = selectedFlight.value?.callsign ?? 'N123AB'
  return applyRadioTemplate('{{facility}}, {{callsign}}, radio check on {{frequency}}.', {
    facility: radioCheckFacility.value,
    callsign,
    frequency: { value: frequency, format: 'frequency' },
  })
})

const radioCheckReply = computed(() => {
  const callsign = selectedFlight.value?.callsign ?? 'N123AB'
  return `${callsign}, ${radioCheckFacility.value}, ${radioCheckResponse.value}`
})

const metarEntries = computed(() => ({
  Departure: store.metarReports.departure,
  Arrival: store.metarReports.arrival,
  Alternate: store.metarReports.alternate,
}))

watch(
  () => store.vatsimId,
  (value) => {
    if (value && !vatsimIdInput.value) {
      vatsimIdInput.value = value
    }
  },
  { immediate: true },
)

watch(
  vatsimIdInput,
  (value) => {
    store.vatsimId = value
  },
  { immediate: true },
)

watch(
  () => store.flights.length,
  (length) => {
    if (length > 0 && step.value === 1) {
      step.value = 2
    }
  },
  { immediate: true },
)

watch(
  () => store.selectedFlight,
  (plan) => {
    if (plan) {
      step.value = 3
    }
  },
  { immediate: true },
)

function useDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    }).format(new Date(value))
  } catch (error) {
    return value
  }
}

async function loadFlightPlans() {
  await store.fetchFlightPlansForMember(vatsimIdInput.value)
}

async function handleSelectFlight(planId: number) {
  await store.selectFlight(planId)
}

function openRadioCheck() {
  radioCheckDialog.value = true
}

function completeRadioCheck() {
  store.markRadioCheckCompleted(`${radioCheckCall.value} // ${radioCheckReply.value}`)
  radioCheckDialog.value = false
}

async function handlePttStart(channel: FrequencyChannel) {
  if (currentPttChannel.value) {
    return
  }
  const granted = await store.requestMicrophoneAccess()
  if (!granted) {
    return
  }
  currentPttChannel.value = channel
  store.beginTransmission(channel, channel === 'atc' ? 'ATC PTT' : 'Intercom PTT')
}

function stopPtt() {
  if (!currentPttChannel.value) {
    return
  }
  store.completeTransmission()
  currentPttChannel.value = null
}

function toggleChecklist() {
  store.toggleChecklistVisibility(true)
}

function closeChecklist() {
  store.toggleChecklistVisibility(false)
}

onMounted(() => {
  if (process.client) {
    window.addEventListener('pointerup', stopPtt)
    window.addEventListener('touchend', stopPtt)
    window.addEventListener('pointercancel', stopPtt)
    window.addEventListener('blur', stopPtt)
  }
  if (store.selectedFlight) {
    step.value = 3
  } else if (store.flights.length) {
    step.value = 2
  }
})

onBeforeUnmount(() => {
  if (process.client) {
    window.removeEventListener('pointerup', stopPtt)
    window.removeEventListener('touchend', stopPtt)
    window.removeEventListener('pointercancel', stopPtt)
    window.removeEventListener('blur', stopPtt)
  }
})
</script>

<style scoped>
.pilot-monitoring-page {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.ptt-button {
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.14), rgba(14, 165, 233, 0.08));
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #ffffff;
  text-transform: none;
  letter-spacing: 0.01em;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.ptt-button.intercom {
  background: linear-gradient(135deg, rgba(129, 140, 248, 0.18), rgba(79, 70, 229, 0.12));
}

.ptt-button:active {
  transform: scale(0.99);
}

.ptt-active {
  border-color: rgba(34, 211, 238, 0.9) !important;
  box-shadow: 0 12px 24px rgba(34, 211, 238, 0.25);
}

.phase-slide {
  padding-bottom: 0.5rem;
}

.phase-slide :deep(.v-slide-group__next),
.phase-slide :deep(.v-slide-group__prev) {
  color: rgba(255, 255, 255, 0.6);
}
</style>

