<template>
  <v-app>
  <div class="min-h-screen bg-[#050910] text-white">
    <div class="flex h-screen overflow-hidden">
      <main class="flex flex-1 flex-col">
        <v-app-bar
          flat
          density="comfortable"
          color="rgba(7, 11, 21, 0.9)"
          class="shrink-0 border-b border-white/10 backdrop-blur-xl"
          height="64"
        >
          <div class="flex w-full flex-wrap items-center gap-4 px-3 lg:flex-nowrap lg:gap-6 lg:px-5">
            <div class="flex shrink-0 items-center gap-4">
              <a
                href="/"
                target="_blank"
                rel="noopener"
                class="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/10 transition hover:border-cyan-300 hover:bg-cyan-500/20"
              >
                <v-icon icon="mdi-radar" size="22" color="cyan" />
              </a>
              <div class="hidden h-10 w-px bg-white/10 lg:block" />
              <div class="flex min-w-0 items-center gap-2">
                <v-menu v-model="flowMenuOpen" transition="scale-transition" offset-y>
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      color="cyan"
                      variant="tonal"
                      prepend-icon="mdi-sitemap"
                      class="rounded-lg px-4 font-semibold tracking-wide text-white"
                      :loading="flowsLoading"
                    >
                      {{ currentFlowLabel }}
                    </v-btn>
                  </template>
                  <v-card class="w-[320px] border border-white/10 bg-[#050910]/95 backdrop-blur">
                    <v-card-text class="space-y-3">
                      <v-text-field
                        v-model="flowSearch"
                        density="compact"
                        variant="outlined"
                        hide-details
                        clearable
                        prepend-inner-icon="mdi-magnify"
                        placeholder="Flows durchsuchen"
                      />
                      <v-divider class="border-white/10" />
                      <v-list
                        v-if="filteredFlows.length"
                        density="compact"
                        class="max-h-[280px] overflow-auto"
                      >
                        <v-list-item
                          v-for="flow in filteredFlows"
                          :key="flow.slug"
                          :value="flow.slug"
                          class="rounded-lg"
                          @click="selectFlow(flow.slug); flowMenuOpen = false"
                        >
                          <template #title>
                            <div class="flex items-center justify-between gap-3">
                              <span class="font-medium">{{ flow.name }}</span>
                              <v-chip v-if="flow.nodeCount" size="x-small" color="cyan" variant="tonal">
                                {{ flow.nodeCount }}
                              </v-chip>
                            </div>
                          </template>
                          <template #subtitle>
                            <span class="text-xs text-white/60">Start: {{ flow.startState }}</span>
                          </template>
                        </v-list-item>
                      </v-list>
                      <p v-else class="py-6 text-center text-xs text-white/40">Keine Flows gefunden.</p>
                    </v-card-text>
                    <v-divider class="border-white/10" />
                    <v-card-actions class="flex flex-col gap-2 p-4">
                      <v-btn
                        block
                        color="cyan"
                        variant="flat"
                        prepend-icon="mdi-plus"
                        @click="flowMenuOpen = false; openCreateFlow()"
                      >
                        Flow hinzufügen
                      </v-btn>
                      <v-btn
                        block
                        color="purple"
                        variant="tonal"
                        prepend-icon="mdi-database-import"
                        :loading="importLoading"
                        @click="flowMenuOpen = false; runImport()"
                      >
                        Legacy Import
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-menu>
              </div>
            </div>
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <v-text-field
                v-model="nodeFilter.search"
                density="compact"
                variant="solo"
                hide-details
                clearable
                prepend-inner-icon="mdi-magnify"
                placeholder="Nodes durchsuchen"
                class="max-w-[260px] rounded-xl bg-white/5 text-sm text-white/80"
              />
              <v-menu v-model="filtersMenuOpen" transition="scale-transition" :close-on-content-click="false" offset-y>
                <template #activator="{ props }">
                  <v-badge
                    :content="activeFilterCount"
                    color="cyan"
                    offset-x="6"
                    offset-y="6"
                    :model-value="activeFilterCount > 0"
                  >
                    <v-btn
                      v-bind="props"
                      size="small"
                      variant="outlined"
                      color="cyan"
                      prepend-icon="mdi-tune"
                      class="rounded-lg border-white/20 text-xs font-semibold uppercase tracking-[0.3em]"
                    >
                      Filter
                    </v-btn>
                  </v-badge>
                </template>
                <v-card class="w-[320px] border border-white/10 bg-[#050910]/95 backdrop-blur">
                  <v-card-title class="flex items-center justify-between text-sm font-semibold text-white/90">
                    Node-Filter
                    <v-chip v-if="activeFilterCount > 0" color="cyan" size="x-small" variant="flat">
                      {{ activeFilterCount }}
                    </v-chip>
                  </v-card-title>
                  <v-divider class="border-white/10" />
                  <v-card-text class="space-y-4">
                    <v-select
                      v-model="nodeFilter.role"
                      :items="roleFilterOptions"
                      density="comfortable"
                      hide-details
                      label="Rolle"
                      color="cyan"
                    />
                    <v-select
                      v-model="nodeFilter.phase"
                      :items="phaseFilterOptions"
                      density="comfortable"
                      hide-details
                      label="Phase"
                      color="cyan"
                    />
                    <v-switch
                      v-model="nodeFilter.autopOnly"
                      hide-details
                      inset
                      color="amber"
                      class="text-sm text-white/70"
                      label="Nur Auto-Trigger anzeigen"
                    />
                  </v-card-text>
                  <v-divider class="border-white/10" />
                  <v-card-actions class="justify-between">
                    <v-btn variant="text" color="white" @click="resetNodeFilters">Zurücksetzen</v-btn>
                    <v-btn color="cyan" variant="flat" @click="filtersMenuOpen = false">Fertig</v-btn>
                  </v-card-actions>
                </v-card>
              </v-menu>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <transition name="autosave-fade">
                <v-icon
                  v-if="autosaveIndicator"
                  icon="mdi-check-circle"
                  size="20"
                  class="text-emerald-400"
                />
              </transition>
              <v-btn
                icon
                variant="tonal"
                color="white"
                class="rounded-lg border border-white/10 bg-white/5 text-white/80 hover:border-cyan-200"
                @click="inspectorOpen = !inspectorOpen"
              >
                <v-icon :icon="inspectorOpen ? 'mdi-dock-right' : 'mdi-dock-left'" />
              </v-btn>
              <v-btn
                color="white"
                variant="tonal"
                size="small"
                prepend-icon="mdi-auto-fix"
                class="rounded-lg px-4 font-semibold tracking-wide text-white"
                :disabled="!flowDetail"
                @click="autoLayoutNodes"
              >
                Auto-Layout
              </v-btn>
            </div>
          </div>
        </v-app-bar>
        <div class="border-b border-white/10 bg-[#070d1a]/70 px-4 py-2 backdrop-blur">
          <div class="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <div class="flex flex-1 items-center gap-3">
              <div class="flex shrink-0 items-center gap-2 text-[11px] uppercase tracking-[0.4em] text-white/40">
                <span class="text-white/70">Nodes</span>
                <v-chip v-if="flowDetail" size="x-small" color="cyan" variant="flat">
                  {{ nodeSelectorItems.length }}
                </v-chip>
              </div>
              <div class="flex-1 overflow-hidden">
                <v-slide-group
                  v-if="flowDetail"
                  v-model="selectedNodeId"
                  show-arrows
                  center-active
                  class="max-w-full"
                >
                  <v-slide-group-item
                    v-for="node in nodeSelectorItems"
                    :key="node.id"
                    :value="node.id"
                    v-slot="{ isSelected, toggle }"
                  >
                    <v-tooltip :text="`${node.id} — ${node.title || 'Ohne Titel'}`" location="bottom">
                      <template #activator="{ props }">
                        <span class="inline-flex">
                          <v-badge
                            v-if="node.autopCount > 0"
                            :content="node.autopCount"
                            color="amber"
                            floating
                            offset-x="8"
                            offset-y="8"
                            class="text-[10px]"
                          >
                            <v-btn
                              v-bind="props"
                              icon
                              variant="text"
                              :class="[
                                'h-9 w-9 rounded-xl transition-all',
                                isSelected
                                  ? 'bg-cyan-500/20 text-cyan-100'
                                  : 'text-white/70 hover:text-white',
                              ]"
                              @click="toggle(); selectNode(node.id)"
                            >
                              <v-icon
                                :icon="node.icon || roleIcons[node.role] || 'mdi-shape-outline'"
                                :color="isSelected ? roleColors[node.role] || 'cyan' : undefined"
                              />
                            </v-btn>
                          </v-badge>
                          <v-btn
                            v-else
                            v-bind="props"
                            icon
                            variant="text"
                            :class="[
                              'h-9 w-9 rounded-xl transition-all',
                              isSelected
                                ? 'bg-cyan-500/20 text-cyan-100'
                                : 'text-white/70 hover:text-white',
                            ]"
                            @click="toggle(); selectNode(node.id)"
                          >
                            <v-icon
                              :icon="node.icon || roleIcons[node.role] || 'mdi-shape-outline'"
                              :color="isSelected ? roleColors[node.role] || 'cyan' : undefined"
                            />
                          </v-btn>
                        </span>
                      </template>
                    </v-tooltip>
                  </v-slide-group-item>
                </v-slide-group>
                <p v-else class="truncate text-xs text-white/50">Kein Flow ausgewählt.</p>
              </div>
            </div>
            <div
              v-if="activeFilterBadges.length"
              class="flex shrink-0 flex-wrap items-center gap-1 text-[11px] uppercase tracking-widest text-white/50 md:justify-end"
            >
              <v-chip
                v-for="badge in activeFilterBadges"
                :key="badge.label"
                :color="badge.color"
                size="small"
                variant="tonal"
                class="bg-opacity-20 text-white/80"
              >
                {{ badge.label }}
              </v-chip>
            </div>
          </div>
        </div>
        <div
          v-if="flowsLoading || flowsError"
          class="border-b border-white/10 bg-[#0b1224]/75 px-4 py-2 backdrop-blur"
        >
          <v-progress-linear
            v-if="flowsLoading"
            indeterminate
            color="cyan"
            class="bg-white/10"
            height="3"
            rounded
          />
          <v-alert
            v-if="flowsError"
            type="warning"
            density="comfortable"
            class="mt-2 bg-amber-500/10 text-amber-200"
            border="start"
          >
            {{ flowsError }}
          </v-alert>
        </div>
        <div class="flex flex-1 overflow-hidden">
          <section class="relative flex-1 overflow-hidden bg-[#070d1a]">
            <DecisionNodeCanvas
              v-if="flowDetail"
              ref="canvasComponent"
              :nodes="canvasNodes"
              :zoom="canvasState.zoom"
              :pan="canvasState.pan"
              :role-colors="roleColors"
              @select="(stateId) => selectNode(stateId, { focus: false })"
              @navigate="(stateId) => selectNode(stateId, { focus: true })"
              @add-before="(stateId) => createNodeRelative(stateId, 'before')"
              @add-after="(stateId) => createNodeRelative(stateId, 'after')"
              @node-drag-start="onNodeDragStart"
              @node-move="onNodeMove"
              @node-drop="onNodeDrop"
              @update:pan="onUpdatePan"
              @update:zoom="onUpdateZoom"
            />
            <div v-else class="flex h-full items-center justify-center text-white/60">
              <div class="space-y-3 text-center">
                <v-progress-circular v-if="flowLoading" indeterminate color="cyan" class="mx-auto" />
                <p>{{ flowLoading ? 'Lade Entscheidungsbaum…' : 'Kein Entscheidungsbaum geladen' }}</p>
                <p v-if="flowError" class="text-xs text-amber-300">{{ flowError }}</p>
              </div>
            </div>
          </section>
          <transition name="inspector-slide">
            <aside
              v-if="inspectorOpen && flowDetail"
              class="w-[380px] shrink-0 overflow-y-auto border-l border-white/10 bg-[#0b1224]/85 backdrop-blur"
            >
              <div class="border-b border-white/10 px-5 py-4">
                <h2 class="text-lg font-semibold">Node Inspector</h2>
                <p class="text-xs text-white/50">
                  {{ nodeForm ? 'Bearbeite Knoten und Auto-Trigger' : 'Wähle einen Node auf der Canvas aus' }}
                </p>
              </div>
              <div v-if="nodeForm" class="space-y-5 px-5 py-5">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <p class="font-mono text-xs text-white/50">{{ nodeForm.stateId }}</p>
                      <v-chip color="cyan" size="x-small" variant="tonal">{{ nodeForm.role }}</v-chip>
                      <v-chip color="purple" size="x-small" variant="tonal">{{ nodeForm.phase }}</v-chip>
                    </div>
                    <h3 class="truncate text-xl font-semibold">{{ nodeForm.title || 'Unbenannter Node' }}</h3>
                  </div>
                  <v-menu location="bottom end">
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon
                        variant="text"
                        color="white"
                        class="-mr-2"
                      >
                        <v-icon icon="mdi-dots-vertical" />
                      </v-btn>
                    </template>
                    <v-list density="compact">
                      <v-list-item :disabled="nodeSaving" prepend-icon="mdi-content-save" @click="persistNodeNow">
                        <v-list-item-title>Node speichern</v-list-item-title>
                      </v-list-item>
                      <v-list-item :disabled="nodeSaving" prepend-icon="mdi-restore" @click="resetNode">
                        <v-list-item-title>Änderungen verwerfen</v-list-item-title>
                      </v-list-item>
                      <v-list-item class="text-red-300" prepend-icon="mdi-delete" @click="deleteNode">
                        <v-list-item-title>Node löschen</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </div>
                <v-text-field
                  v-model="nodeIdDraft"
                  label="Node Key"
                  hide-details
                  color="cyan"
                  prepend-inner-icon="mdi-identifier"
                  @keydown.enter.prevent="applyNodeRename"
                  @blur="applyNodeRename"
                />
                <v-tabs
                  v-model="inspectorTab"
                  class="rounded-xl border border-white/10 bg-white/5"
                  density="compact"
                  slider-color="cyan"
                  grow
                >
                  <v-tab value="general" :title="'Allgemein'">
                    <v-icon icon="mdi-tune" />
                  </v-tab>
                  <v-tab value="transitions" :title="'Transitions'">
                    <v-icon icon="mdi-transit-connection-variant" />
                  </v-tab>
                  <v-tab value="llm" :title="'LLM Template'">
                    <v-icon icon="mdi-brain" />
                  </v-tab>
                  <v-tab value="metadata" :title="'Metadata'">
                    <v-icon icon="mdi-tag-text-outline" />
                  </v-tab>
                </v-tabs>
              <v-window v-model="inspectorTab" class="rounded-xl border border-white/10 bg-white/5 p-4">
                <v-window-item value="general">
                  <div class="space-y-4">
                    <v-text-field v-model="nodeForm.title" label="Titel" hide-details color="cyan" />
                    <v-textarea v-model="nodeForm.summary" label="Kurzbeschreibung" rows="2" hide-details color="cyan" />
                    <div class="grid grid-cols-2 gap-3">
                      <v-select
                        v-model="nodeForm.role"
                        :items="roleOptions"
                        label="Rolle"
                        hide-details
                        density="comfortable"
                        color="cyan"
                      />
                      <v-combobox
                        v-model="nodeForm.phase"
                        :items="phaseFilterOptions"
                        label="Phase"
                        hide-details
                        density="comfortable"
                        color="cyan"
                        clearable
                      />
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                      <v-text-field
                        v-model.number="nodeForm.layout.x"
                        label="Position X"
                        type="number"
                        hide-details
                        density="comfortable"
                        color="cyan"
                        @change="syncNodeLayout"
                      />
                      <v-text-field
                        v-model.number="nodeForm.layout.y"
                        label="Position Y"
                        type="number"
                        hide-details
                        density="comfortable"
                        color="cyan"
                        @change="syncNodeLayout"
                      />
                    </div>
                    <v-text-field v-model="nodeForm.layout.color" label="Card-Farbe" hide-details color="cyan" />
                    <v-textarea v-model="nodeForm.sayTemplate" label="ATC Say Template" rows="2" hide-details color="cyan" />
                    <v-textarea v-model="nodeForm.utteranceTemplate" label="Pilot Utterance Template" rows="2" hide-details color="cyan" />
                    <v-textarea v-model="nodeForm.elseSayTemplate" label="Fallback Template" rows="2" hide-details color="cyan" />
                    <v-combobox
                      v-model="nodeForm.readbackRequired"
                      label="Readback Felder"
                      multiple
                      chips
                      hide-details
                      color="cyan"
                      :items="suggestedReadbackFields"
                    />
                    <div>
                      <label class="text-xs uppercase tracking-wider text-white/50">Actions (JSON)</label>
                      <v-textarea
                        v-model="nodeActionsText"
                        rows="4"
                        variant="outlined"
                        color="cyan"
                        hide-details
                        @blur="syncActionsFromText"
                      />
                      <p v-if="nodeActionsError" class="mt-1 text-xs text-amber-300">{{ nodeActionsError }}</p>
                    </div>
                  </div>
                </v-window-item>
                <v-window-item value="transitions">
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <h3 class="text-sm font-semibold uppercase tracking-widest text-white/70">Transitions</h3>
                      <div class="flex gap-2">
                        <v-btn size="small" color="cyan" variant="tonal" prepend-icon="mdi-plus" @click="addTransition()">
                          Transition
                        </v-btn>
                        <v-menu>
                          <template #activator="{ props: menuProps }">
                            <v-btn v-bind="menuProps" size="small" color="purple" variant="tonal" prepend-icon="mdi-flash">
                              Auto Presets
                            </v-btn>
                          </template>
                          <v-list density="compact">
                            <v-list-item v-for="preset in autoTriggerPresets" :key="preset.id" @click="applyAutoPreset(preset)">
                              <v-list-item-title>{{ preset.label }}</v-list-item-title>
                              <v-list-item-subtitle>{{ preset.description }}</v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-menu>
                      </div>
                    </div>
                    <v-expansion-panels variant="accordion" multiple>
                      <v-expansion-panel v-for="(transition, index) in nodeForm.transitions" :key="transition.key || index">
                        <v-expansion-panel-title>
                          <div class="flex w-full items-center justify-between text-sm">
                            <div class="flex items-center gap-2">
                              <span class="font-mono text-xs text-white/60">{{ transition.type.toUpperCase() }}</span>
                              <span class="font-semibold">→ {{ transition.target || 'Ziel wählen' }}</span>
                            </div>
                            <div class="flex items-center gap-2 text-xs text-white/40">
                              <span v-if="transition.autoTrigger">Auto</span>
                              <span v-if="transition.timer">Timer {{ transition.timer.afterSeconds }}s</span>
                              <v-btn size="x-small" icon variant="text" @click.stop="removeTransition(index)">
                                <v-icon icon="mdi-delete" size="16" />
                              </v-btn>
                            </div>
                          </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <div class="space-y-3">
                            <div class="grid grid-cols-2 gap-3">
                              <v-select v-model="transition.type" :items="transitionTypes" label="Typ" hide-details density="comfortable" color="cyan" />
                              <v-text-field v-model="transition.target" label="Zielstate" hide-details density="comfortable" color="cyan" />
                            </div>
                            <v-text-field v-model="transition.label" label="Label" hide-details density="comfortable" color="cyan" />
                            <v-textarea v-model="transition.description" label="Beschreibung" rows="2" hide-details color="cyan" />
                            <v-text-field v-model="transition.condition" label="Bedingung" hide-details density="comfortable" color="cyan" />
                            <v-text-field v-model="transition.guard" label="Guard" hide-details density="comfortable" color="cyan" />
                            <v-text-field v-model.number="transition.order" label="Reihenfolge" type="number" hide-details density="comfortable" color="cyan" />
                            <div v-if="transition.type === 'timer'" class="grid grid-cols-2 gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
                              <v-text-field v-model.number="transition.timer.afterSeconds" label="Timer Sekunden" type="number" hide-details density="comfortable" color="amber" />
                              <v-switch v-model="transition.timer.allowManualProceed" label="Manueller Proceed" hide-details inset density="compact" color="amber" />
                            </div>
                            <div class="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3">
                              <div class="flex items-center justify-between">
                                <h4 class="text-sm font-semibold text-white/80">Auto Trigger</h4>
                                <v-btn size="x-small" variant="text" color="cyan" @click="toggleAutoTrigger(index)">
                                  {{ transition.autoTrigger ? 'Entfernen' : 'Hinzufügen' }}
                                </v-btn>
                              </div>
                              <div v-if="transition.autoTrigger" class="space-y-3 pt-2">
                                <v-select v-model="transition.autoTrigger.type" :items="autoTriggerTypes" label="Trigger Typ" hide-details density="comfortable" color="cyan" />
                                <div v-if="transition.autoTrigger.type === 'telemetry'" class="grid grid-cols-2 gap-3">
                                  <v-select v-model="transition.autoTrigger.parameter" :items="telemetryParameters" label="Parameter" hide-details density="comfortable" color="cyan" />
                                  <v-select v-model="transition.autoTrigger.operator" :items="comparisonOperators" label="Operator" hide-details density="comfortable" color="cyan" />
                                  <v-text-field v-model.number="transition.autoTrigger.value" label="Wert" type="number" hide-details density="comfortable" color="cyan" />
                                  <v-text-field v-model="transition.autoTrigger.unit" label="Einheit" hide-details density="comfortable" color="cyan" />
                                </div>
                                <div v-else-if="transition.autoTrigger.type === 'variable'" class="grid grid-cols-2 gap-3">
                                  <v-text-field v-model="transition.autoTrigger.variable" label="Variablenpfad" hide-details density="comfortable" color="cyan" />
                                  <v-select v-model="transition.autoTrigger.operator" :items="comparisonOperators" label="Operator" hide-details density="comfortable" color="cyan" />
                                  <v-text-field v-model="transition.autoTrigger.value" label="Vergleichswert" hide-details density="comfortable" color="cyan" />
                                </div>
                                <v-textarea
                                  v-else
                                  v-model="transition.autoTrigger.expression"
                                  label="Bedingungsausdruck"
                                  rows="2"
                                  hide-details
                                  color="cyan"
                                />
                                <v-textarea v-model="transition.autoTrigger.description" label="Beschreibung" rows="2" hide-details color="cyan" />
                                <div class="grid grid-cols-2 gap-3">
                                  <v-text-field v-model.number="transition.autoTrigger.delayMs" label="Verzögerung (ms)" type="number" hide-details density="comfortable" color="cyan" />
                                  <v-switch v-model="transition.autoTrigger.once" label="Nur einmal" hide-details inset density="compact" color="cyan" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </div>
                </v-window-item>
                <v-window-item value="llm">
                  <div class="space-y-4">
                    <v-text-field v-model="nodeForm.llmTemplate.summary" label="LLM Kurzbeschreibung" hide-details color="cyan" />
                    <v-textarea v-model="nodeForm.llmTemplate.prompt" label="LLM Prompt" rows="4" hide-details color="cyan" />
                    <v-textarea v-model="nodeForm.llmTemplate.responseSchema" label="Antwortschema" rows="3" hide-details color="cyan" />
                    <div class="grid grid-cols-3 gap-3">
                      <v-text-field v-model.number="nodeForm.llmTemplate.temperature" label="Temp" type="number" hide-details density="comfortable" color="cyan" />
                      <v-text-field v-model.number="nodeForm.llmTemplate.topP" label="TopP" type="number" hide-details density="comfortable" color="cyan" />
                      <v-text-field v-model.number="nodeForm.llmTemplate.maxOutputTokens" label="Max Tokens" type="number" hide-details density="comfortable" color="cyan" />
                    </div>
                    <v-switch v-model="nodeForm.llmTemplate.autoProceed" label="Auto Proceed" hide-details inset density="comfortable" color="cyan" />
                    <v-combobox v-model="nodeForm.llmTemplate.guardrails" label="Guardrails" multiple chips hide-details color="cyan" />
                    <div class="space-y-2">
                      <div class="flex items-center justify-between">
                        <h4 class="text-sm font-semibold">Placeholders</h4>
                        <v-btn size="x-small" color="cyan" variant="tonal" prepend-icon="mdi-plus" @click="addPlaceholder">
                          Platzhalter
                        </v-btn>
                      </div>
                      <div v-if="nodeForm.llmTemplate.placeholders?.length" class="space-y-3">
                        <div
                          v-for="(placeholder, idx) in nodeForm.llmTemplate.placeholders"
                          :key="placeholder.key || idx"
                          class="rounded-xl border border-white/10 bg-white/5 p-3"
                        >
                          <div class="flex items-center justify-between gap-2">
                            <v-text-field v-model="placeholder.key" label="Key" hide-details density="comfortable" color="cyan" class="flex-1" />
                            <v-btn icon size="small" variant="text" color="red" @click="removePlaceholder(idx)">
                              <v-icon icon="mdi-close" />
                            </v-btn>
                          </div>
                          <v-text-field v-model="placeholder.label" label="Label" hide-details density="comfortable" color="cyan" />
                          <v-textarea v-model="placeholder.description" label="Beschreibung" rows="2" hide-details color="cyan" />
                          <div class="grid grid-cols-2 gap-3">
                            <v-text-field v-model="placeholder.example" label="Beispiel" hide-details density="comfortable" color="cyan" />
                            <v-text-field v-model="placeholder.defaultValue" label="Default" hide-details density="comfortable" color="cyan" />
                          </div>
                        </div>
                      </div>
                      <p v-else class="text-xs text-white/50">Keine Platzhalter definiert.</p>
                    </div>
                    <v-textarea v-model="nodeForm.llmTemplate.notes" label="Notizen" rows="2" hide-details color="cyan" />
                  </div>
                </v-window-item>
                <v-window-item value="metadata">
                  <div class="space-y-4">
                    <v-textarea v-model="nodeForm.metadata.notes" label="Notizen" rows="2" hide-details color="cyan" />
                    <v-combobox v-model="nodeForm.metadata.tags" label="Tags" multiple chips hide-details color="cyan" />
                    <v-select
                      v-model="nodeForm.metadata.complexity"
                      :items="['low', 'medium', 'high']"
                      label="Komplexität"
                      hide-details
                      density="comfortable"
                      color="cyan"
                    />
                    <v-switch v-model="nodeForm.metadata.pinned" label="Gepinnt" hide-details inset density="comfortable" color="cyan" />
                    <div class="grid grid-cols-2 gap-3">
                      <v-text-field v-model.number="nodeForm.layout.width" label="Breite" type="number" hide-details density="comfortable" color="cyan" />
                      <v-text-field v-model.number="nodeForm.layout.height" label="Höhe" type="number" hide-details density="comfortable" color="cyan" />
                    </div>
                    <v-text-field v-model="nodeForm.layout.icon" label="Icon" hide-details color="cyan" />
                  </div>
                </v-window-item>
              </v-window>
            </div>
            <div v-else class="px-5 py-8 text-sm text-white/50">
              Kein Node ausgewählt.
            </div>
          </aside>
          </transition>
        </div>
      </main>
    </div>
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>

    <v-dialog v-model="showCreateFlowDialog" max-width="420">
      <v-card class="bg-[#0b1224] text-white">
        <v-card-title>Neuen Entscheidungs-Flow anlegen</v-card-title>
        <v-card-text class="space-y-3">
          <v-text-field v-model="newFlowForm.slug" label="Slug" prepend-inner-icon="mdi-identifier" />
          <v-text-field v-model="newFlowForm.name" label="Name" prepend-inner-icon="mdi-file-tree" />
          <v-textarea v-model="newFlowForm.description" label="Beschreibung" rows="2" />
          <v-alert
            v-if="newFlowError"
            type="warning"
            density="compact"
            class="bg-amber-500/10 text-amber-200"
          >
            {{ newFlowError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="grey" @click="closeCreateFlow">Abbrechen</v-btn>
          <v-btn color="cyan" variant="flat" :loading="createFlowLoading" @click="createFlow">Anlegen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
  </v-app>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'
import DecisionNodeCanvas from '~/components/editor/DecisionNodeCanvas.vue'
import type {
  DecisionFlowModel,
  DecisionFlowSummary,
  DecisionNodeModel,
  DecisionNodeTransition,
  DecisionNodeLayout,
} from '~/shared/types/decision'

definePageMeta({ middleware: 'require-admin' })

const api = useApi()
const auth = useAuthStore()

interface CanvasNodeView {
  id: string
  model: DecisionNodeModel
  layout: DecisionNodeLayout
  role: string
  phase: string
  title?: string
  summary?: string
  selected: boolean
  highlight: boolean
  dimmed: boolean
  isStart: boolean
  isEnd: boolean
  autopCount: number
  accent: string
}

interface AutoPreset {
  id: string
  label: string
  description: string
  build: () => DecisionNodeTransition
}

interface FlowFormState {
  name: string
  description: string
  schemaVersion: string
  startState: string
  endStates: string[]
  roles: string[]
  phases: string[]
  variables: string
  flags: string
  policies: string
  hooks: string
}

const roleColors: Record<string, string> = {
  pilot: '#22d3ee',
  atc: '#f97316',
  system: '#a855f7',
}

const roleIcons: Record<string, string> = {
  pilot: 'mdi-account',
  atc: 'mdi-radar',
  system: 'mdi-robot',
}

const telemetryParameters = [
  'altitude_ft',
  'speed_kts',
  'groundspeed_kts',
  'vertical_speed_fpm',
  'heading_deg',
  'distance_nm',
]

const comparisonOperators = ['>', '>=', '<', '<=', '==', '!=']
const transitionTypes: DecisionNodeTransition['type'][] = ['next', 'ok', 'bad', 'timer', 'auto', 'interrupt', 'return']
const autoTriggerTypes = ['telemetry', 'variable', 'expression']
const roleOptions = ['pilot', 'atc', 'system']

const flows = ref<DecisionFlowSummary[]>([])
const flowsLoading = ref(false)
const flowsError = ref('')
const flowSearch = ref('')
const flowMenuOpen = ref(false)

const autosaveIndicator = ref(false)
const canvasComponent = ref<InstanceType<typeof DecisionNodeCanvas> | null>(null)

const inspectorOpen = ref(false)

const selectedFlowSlug = ref<string | null>(null)
const flowDetail = ref<{ flow: DecisionFlowModel; nodes: DecisionNodeModel[] } | null>(null)
const flowLoading = ref(false)
const flowError = ref('')
const flowSaveLoading = ref(false)
const importLoading = ref(false)

const flowForm = reactive<FlowFormState>({
  name: '',
  description: '',
  schemaVersion: '1.0',
  startState: '',
  endStates: [],
  roles: ['pilot', 'atc', 'system'],
  phases: [],
  variables: '{\n}\n',
  flags: '{\n}\n',
  policies: '{\n}\n',
  hooks: '{\n}\n',
})
const flowSnapshot = ref<FlowFormState | null>(null)

const canvasState = reactive({
  zoom: 1,
  pan: { x: 0, y: 0 },
})
let layoutSaveTimer: ReturnType<typeof setTimeout> | null = null

const nodeFilter = reactive({
  search: '',
  role: 'all',
  phase: 'all',
  autopOnly: false,
})

const filtersMenuOpen = ref(false)

const activeFilterCount = computed(() => {
  let count = 0
  if (nodeFilter.role !== 'all') count += 1
  if (nodeFilter.phase !== 'all') count += 1
  if (nodeFilter.autopOnly) count += 1
  return count
})

const activeFilterBadges = computed(() => {
  const badges: { label: string; color: string }[] = []
  if (nodeFilter.role !== 'all') {
    badges.push({ label: `Rolle: ${nodeFilter.role}`, color: 'cyan' })
  }
  if (nodeFilter.phase !== 'all') {
    badges.push({ label: `Phase: ${nodeFilter.phase}`, color: 'purple' })
  }
  if (nodeFilter.autopOnly) {
    badges.push({ label: 'Auto-Trigger', color: 'amber' })
  }
  return badges
})

const selectedNodeId = ref<string | null>(null)
const inspectorTab = ref<'general' | 'transitions' | 'llm' | 'metadata'>('general')
const nodeForm = ref<DecisionNodeModel | null>(null)
const nodeSnapshot = ref<DecisionNodeModel | null>(null)
const nodeSaving = ref(false)
const nodeActionsText = ref('[]')
const nodeActionsError = ref('')
const nodeIdDraft = ref('')

let lastTitleSuggestion = ''
let nodeRenaming = false

const showCreateFlowDialog = ref(false)
const newFlowForm = reactive({ slug: '', name: '', description: '' })
const newFlowError = ref('')
const createFlowLoading = ref(false)

const snackbar = reactive({ show: false, color: 'cyan', text: '' })

type HistoryEntry =
  | { type: 'node-update'; nodeId: string; before: DecisionNodeModel; after: DecisionNodeModel }
  | { type: 'node-layout'; nodeId: string; before: { x: number; y: number }; after: { x: number; y: number } }
  | { type: 'node-rename'; beforeId: string; afterId: string; before: DecisionNodeModel; after: DecisionNodeModel }

const historyEntries = ref<HistoryEntry[]>([])
const historyIndex = ref(-1)

let isApplyingHistory = false
let pendingNodeHistory: { nodeId: string; before: DecisionNodeModel } | null = null
let pendingLayoutHistory: { nodeId: string; start: { x: number; y: number } } | null = null

let flowInitializing = false
let nodeInitializing = false
let flowAutoSaveTimer: ReturnType<typeof setTimeout> | null = null
let nodeAutoSaveTimer: ReturnType<typeof setTimeout> | null = null
let autosaveIndicatorTimer: ReturnType<typeof setTimeout> | null = null
let lastFlowAutosaveError = ''
let lastNodeAutosaveError = ''

const filteredFlows = computed(() => {
  const query = flowSearch.value.trim().toLowerCase()
  if (!query) return flows.value
  return flows.value.filter((flow) =>
    [flow.name, flow.slug, flow.description].some((entry) => entry?.toLowerCase().includes(query))
  )
})

const currentFlowLabel = computed(() => flowDetail.value?.flow.name || 'Flow auswählen')

const roleFilterOptions = computed(() => {
  const unique = new Set<string>(['all', ...flowForm.roles, ...roleOptions])
  return Array.from(unique)
})

const phaseFilterOptions = computed(() => {
  const phases = new Set<string>(['all'])
  flowForm.phases.forEach((phase) => phases.add(phase))
  flowDetail.value?.nodes.forEach((node) => phases.add(node.phase))
  return Array.from(phases)
})

const nodeSelectorItems = computed(() => {
  if (!flowDetail.value) return []
  const query = nodeFilter.search.trim().toLowerCase()
  const role = nodeFilter.role
  const phase = nodeFilter.phase
  const autopOnly = nodeFilter.autopOnly
  return flowDetail.value.nodes
    .slice()
    .sort((a, b) => a.stateId.localeCompare(b.stateId))
    .map((node) => {
      const autopCount = (node.transitions || []).filter((t) => t.autoTrigger).length
      return {
        id: node.stateId,
        title: node.title,
        summary: node.summary,
        phase: node.phase,
        role: node.role,
        icon: node.layout?.icon,
        autopCount,
        matchesSearch:
          !query ||
          [node.stateId, node.title, node.summary]
            .filter(Boolean)
            .some((entry) => entry!.toLowerCase().includes(query)),
        matchesRole: role === 'all' || node.role === role,
        matchesPhase: phase === 'all' || node.phase === phase,
        matchesAuto: !autopOnly || autopCount > 0,
      }
    })
    .filter((node) => node.matchesSearch && node.matchesRole && node.matchesPhase && node.matchesAuto)
    .map(({ matchesSearch, matchesRole, matchesPhase, matchesAuto, ...rest }) => rest)
})

const canvasNodes = computed<CanvasNodeView[]>(() => {
  if (!flowDetail.value) return []
  const flow = flowDetail.value.flow
  const query = nodeFilter.search.trim().toLowerCase()
  return flowDetail.value.nodes.map((node) => {
    const autopCount = (node.transitions || []).filter((transition) => transition.autoTrigger).length
    const matchesRole = nodeFilter.role === 'all' || node.role === nodeFilter.role
    const matchesPhase = nodeFilter.phase === 'all' || node.phase === nodeFilter.phase
    const matchesAuto = !nodeFilter.autopOnly || autopCount > 0
    const matchesSearch =
      !query ||
      [node.stateId, node.title, node.summary]
        .filter(Boolean)
        .some((entry) => entry!.toLowerCase().includes(query))

    const dimmed = (nodeFilter.role !== 'all' && !matchesRole) ||
      (nodeFilter.phase !== 'all' && !matchesPhase) ||
      (nodeFilter.autopOnly && !matchesAuto)

    return {
      id: node.stateId,
      model: node,
      layout: node.layout || { x: 0, y: 0 },
      role: node.role,
      phase: node.phase,
      title: node.title,
      summary: node.summary,
      selected: selectedNodeId.value === node.stateId,
      highlight: matchesSearch,
      dimmed: dimmed && !matchesSearch,
      isStart: flow.startState === node.stateId,
      isEnd: flow.endStates?.includes(node.stateId) ?? false,
      autopCount,
      accent: node.layout?.color || roleColors[node.role] || '#22d3ee',
    }
  })
})

watch(selectedFlowSlug, (slug) => {
  if (slug) {
    void loadFlowDetail(slug)
  } else {
    flowDetail.value = null
  }
})

watch(
  () => flowDetail.value?.nodes.length,
  () => {
    if (!flowDetail.value) return
    if (!flowDetail.value.nodes.some((node) => node.stateId === selectedNodeId.value)) {
      selectedNodeId.value = flowDetail.value.flow.startState || flowDetail.value.nodes[0]?.stateId || null
    }
  }
)

watch(selectedNodeId, (stateId) => {
  if (!stateId || !flowDetail.value) {
    nodeForm.value = null
    nodeSnapshot.value = null
    nodeActionsText.value = '[]'
    nodeActionsError.value = ''
    nodeIdDraft.value = ''
    return
  }
  const source = flowDetail.value.nodes.find((node) => node.stateId === stateId)
  if (!source) {
    nodeForm.value = null
    nodeSnapshot.value = null
    nodeActionsText.value = '[]'
    nodeActionsError.value = ''
    nodeIdDraft.value = ''
    return
  }
  nodeInitializing = true
  inspectorOpen.value = true
  const clone = cloneNode(source)
  if (!clone.layout) clone.layout = { x: 0, y: 0 }
  if (!clone.readbackRequired) clone.readbackRequired = []
  if (!clone.transitions) clone.transitions = []
  if (!clone.metadata) clone.metadata = {}
  if (!clone.llmTemplate) clone.llmTemplate = { placeholders: [] }
  if (!clone.llmTemplate.placeholders) clone.llmTemplate.placeholders = []
  nodeForm.value = clone
  nodeSnapshot.value = cloneNode(clone)
  nodeActionsText.value = JSON.stringify(clone.actions ?? [], null, 2)
  nodeActionsError.value = ''
  nodeIdDraft.value = clone.stateId
  lastTitleSuggestion = buildNodeKeyFromText(clone.title || clone.stateId)
  pendingNodeHistory = null
  nextTick(() => {
    nodeInitializing = false
  })
})

watch(
  nodeForm,
  (value) => {
    if (!value || !flowDetail.value) return
    const index = flowDetail.value.nodes.findIndex((node) => node.stateId === value.stateId)
    if (index === -1) return
    flowDetail.value.nodes.splice(index, 1, cloneNode(value))
    if (nodeInitializing || isApplyingHistory) return
    if (!nodeSnapshot.value) return
    if (!pendingNodeHistory || pendingNodeHistory.nodeId !== value.stateId) {
      pendingNodeHistory = { nodeId: value.stateId, before: cloneNode(nodeSnapshot.value) }
    }
    scheduleNodeSave()
  },
  { deep: true }
)

watch(
  () => nodeForm.value?.title,
  (title) => {
    if (!nodeForm.value) return
    const suggestion = buildNodeKeyFromText(title || nodeForm.value.stateId)
    if (!nodeRenaming && nodeIdDraft.value === lastTitleSuggestion) {
      nodeIdDraft.value = suggestion
    }
    lastTitleSuggestion = suggestion
  }
)

watch(
  () => flowForm.startState,
  (start) => {
    if (!flowDetail.value) return
    flowDetail.value.flow.startState = start
    if (!flowInitializing) {
      scheduleFlowSave()
    }
  }
)

watch(
  () => flowForm.endStates,
  (states) => {
    if (!flowDetail.value) return
    flowDetail.value.flow.endStates = [...states]
    if (!flowInitializing) {
      scheduleFlowSave()
    }
  },
  { deep: true }
)

watch(
  flowForm,
  () => {
    if (flowInitializing) return
    scheduleFlowSave()
  },
  { deep: true }
)

watch(nodeActionsText, (value) => {
  if (!nodeForm.value) return
  try {
    nodeForm.value.actions = value.trim() ? JSON.parse(value) : []
    nodeActionsError.value = ''
  } catch (err) {
    nodeActionsError.value = 'JSON ungültig'
  }
})

onMounted(async () => {
  if (!auth.initialized) {
    await auth.fetchUser().catch(() => null)
  }
  window.addEventListener('keydown', onGlobalKeydown)
  await loadFlows()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  if (flowAutoSaveTimer) {
    clearTimeout(flowAutoSaveTimer)
  }
  if (nodeAutoSaveTimer) {
    clearTimeout(nodeAutoSaveTimer)
  }
  if (autosaveIndicatorTimer) {
    clearTimeout(autosaveIndicatorTimer)
  }
  if (layoutSaveTimer) {
    clearTimeout(layoutSaveTimer)
  }
})

function cloneNode<T>(node: T): T {
  return JSON.parse(JSON.stringify(node))
}

function safeParse(text: string, label: string) {
  const trimmed = text.trim()
  if (!trimmed) return {}
  try {
    return JSON.parse(trimmed)
  } catch (error) {
    throw new Error(`${label} enthält ungültiges JSON`)
  }
}

function showSnack(message: string, color = 'cyan') {
  snackbar.text = message
  snackbar.color = color
  snackbar.show = true
}

function flashAutosaveIndicator() {
  if (autosaveIndicatorTimer) {
    clearTimeout(autosaveIndicatorTimer)
  }
  autosaveIndicator.value = false
  nextTick(() => {
    autosaveIndicator.value = true
    autosaveIndicatorTimer = setTimeout(() => {
      autosaveIndicator.value = false
    }, 3000)
  })
}

function pushHistory(entry: HistoryEntry) {
  if (historyIndex.value < historyEntries.value.length - 1) {
    historyEntries.value = historyEntries.value.slice(0, historyIndex.value + 1)
  }
  historyEntries.value.push(entry)
  if (historyEntries.value.length > 50) {
    historyEntries.value.shift()
  }
  historyIndex.value = historyEntries.value.length - 1
}

async function undoHistory() {
  if (historyIndex.value < 0) return
  const entry = historyEntries.value[historyIndex.value]
  await applyHistory(entry, 'undo')
  historyIndex.value -= 1
}

async function redoHistory() {
  if (historyIndex.value + 1 >= historyEntries.value.length) return
  const entry = historyEntries.value[historyIndex.value + 1]
  await applyHistory(entry, 'redo')
  historyIndex.value += 1
}

async function applyHistory(entry: HistoryEntry, direction: 'undo' | 'redo') {
  if (!flowDetail.value) return
  isApplyingHistory = true
  pendingNodeHistory = null
  try {
    if (entry.type === 'node-update') {
      const target = direction === 'undo' ? entry.before : entry.after
      const index = flowDetail.value.nodes.findIndex((node) => node.stateId === target.stateId)
      if (index !== -1) {
        flowDetail.value.nodes.splice(index, 1, cloneNode(target))
      }
      if (selectedNodeId.value === target.stateId) {
        nodeInitializing = true
        nodeForm.value = cloneNode(target)
        nodeSnapshot.value = cloneNode(target)
        nodeActionsText.value = JSON.stringify(target.actions ?? [], null, 2)
        nodeIdDraft.value = target.stateId
        lastTitleSuggestion = buildNodeKeyFromText(target.title || target.stateId)
        nextTick(() => {
          nodeInitializing = false
        })
      }
      try {
        await api.put(`/api/editor/flows/${flowDetail.value.flow.slug}/nodes/${target.stateId}`, cloneNode(target))
        flashAutosaveIndicator()
        if (selectedNodeId.value === target.stateId) {
          nodeSnapshot.value = cloneNode(target)
        }
      } catch (error) {
        console.error('Failed to apply node history', error)
      }
    } else if (entry.type === 'node-layout') {
      const layout = direction === 'undo' ? entry.before : entry.after
      const target = flowDetail.value.nodes.find((node) => node.stateId === entry.nodeId)
      if (target) {
        target.layout = { ...(target.layout || {}), ...layout }
      }
      if (nodeForm.value?.stateId === entry.nodeId) {
        nodeForm.value.layout = { ...(nodeForm.value.layout || {}), ...layout }
        nodeSnapshot.value = cloneNode(nodeForm.value)
      }
      try {
        await api.request(`/api/editor/flows/${flowDetail.value.flow.slug}/nodes/${entry.nodeId}/layout`, {
          method: 'PATCH',
          body: layout,
        })
        flashAutosaveIndicator()
      } catch (error) {
        console.error('Failed to apply layout history', error)
      }
    } else if (entry.type === 'node-rename') {
      const fromId = direction === 'undo' ? entry.afterId : entry.beforeId
      const toId = direction === 'undo' ? entry.beforeId : entry.afterId
      await renameNode(fromId, toId, { recordHistory: false })
      if (direction === 'undo') {
        nodeSnapshot.value = cloneNode(entry.before)
      } else {
        nodeSnapshot.value = cloneNode(entry.after)
      }
    }
  } finally {
    isApplyingHistory = false
  }
}

function onGlobalKeydown(event: KeyboardEvent) {
  const isModifier = event.metaKey || event.ctrlKey
  if (!isModifier) return
  if (event.key.toLowerCase() === 'z') {
    event.preventDefault()
    if (event.shiftKey) {
      void redoHistory()
    } else {
      void undoHistory()
    }
  }
}

async function loadFlows() {
  flowsLoading.value = true
  flowsError.value = ''
  try {
    const response = await api.get<DecisionFlowSummary[]>('/api/editor/flows')
    flows.value = response
    if (!selectedFlowSlug.value && response.length) {
      selectedFlowSlug.value = response[0].slug
    }
  } catch (error) {
    console.error('Failed to load flows', error)
    flowsError.value = 'Flows konnten nicht geladen werden.'
  } finally {
    flowsLoading.value = false
  }
}

function selectFlow(slug: string) {
  if (selectedFlowSlug.value === slug) return
  selectedFlowSlug.value = slug
}

async function loadFlowDetail(slug: string) {
  flowLoading.value = true
  flowError.value = ''
  try {
    const data = await api.get<{ flow: DecisionFlowModel; nodes: DecisionNodeModel[] }>(`/api/editor/flows/${slug}`)
    flowDetail.value = data
    flowInitializing = true
    populateFlowForm(data.flow)
    flowSnapshot.value = cloneNode(flowForm)
    canvasState.zoom = data.flow.layout?.zoom ?? 1
    canvasState.pan = { x: data.flow.layout?.pan?.x ?? 0, y: data.flow.layout?.pan?.y ?? 0 }
    selectedNodeId.value = data.flow.startState || data.nodes[0]?.stateId || null
    historyEntries.value = []
    historyIndex.value = -1
    pendingNodeHistory = null
    pendingLayoutHistory = null
    nextTick(() => {
      flowInitializing = false
    })
  } catch (error) {
    console.error('Failed to load flow detail', error)
    flowError.value = 'Details konnten nicht geladen werden.'
    flowDetail.value = null
    flowInitializing = false
    selectedNodeId.value = null
  } finally {
    flowLoading.value = false
  }
}

function populateFlowForm(flow: DecisionFlowModel) {
  flowForm.name = flow.name
  flowForm.description = flow.description ?? ''
  flowForm.schemaVersion = flow.schemaVersion ?? '1.0'
  flowForm.startState = flow.startState
  flowForm.endStates = Array.isArray(flow.endStates) ? [...new Set(flow.endStates)] : []
  flowForm.roles = flow.roles?.length ? [...new Set(flow.roles)] : ['pilot', 'atc', 'system']
  flowForm.phases = flow.phases?.length ? [...new Set(flow.phases)] : []
  flowForm.variables = JSON.stringify(flow.variables ?? {}, null, 2)
  flowForm.flags = JSON.stringify(flow.flags ?? {}, null, 2)
  flowForm.policies = JSON.stringify(flow.policies ?? {}, null, 2)
  flowForm.hooks = JSON.stringify(flow.hooks ?? {}, null, 2)
}

function openCreateFlow() {
  newFlowForm.slug = ''
  newFlowForm.name = ''
  newFlowForm.description = ''
  newFlowError.value = ''
  showCreateFlowDialog.value = true
}

function closeCreateFlow() {
  showCreateFlowDialog.value = false
}

async function createFlow() {
  if (!newFlowForm.slug.trim() || !newFlowForm.name.trim()) {
    newFlowError.value = 'Slug und Name werden benötigt.'
    return
  }
  createFlowLoading.value = true
  newFlowError.value = ''
  try {
    const payload = {
      slug: newFlowForm.slug.trim(),
      name: newFlowForm.name.trim(),
      description: newFlowForm.description.trim(),
      startState: 'START',
    }
    const created = await api.post<DecisionFlowModel>('/api/editor/flows', payload)
    showSnack(`Flow "${created.name}" angelegt.`)
    showCreateFlowDialog.value = false
    await loadFlows()
    selectedFlowSlug.value = created.slug
  } catch (error: any) {
    console.error('Failed to create flow', error)
    newFlowError.value = error?.statusMessage || 'Flow konnte nicht erstellt werden.'
  } finally {
    createFlowLoading.value = false
  }
}

async function runImport() {
  importLoading.value = true
  try {
    const result = await api.post<{ flow: DecisionFlowModel; importedStates: number }>('/api/editor/flows/import', {})
    showSnack(`Legacy ATC Tree importiert (${result.importedStates} Nodes).`, 'cyan')
    await loadFlows()
    selectedFlowSlug.value = result.flow.slug
  } catch (error) {
    console.error('Import failed', error)
    showSnack('Import fehlgeschlagen.', 'red')
  } finally {
    importLoading.value = false
  }
}

function resetNodeFilters() {
  nodeFilter.role = 'all'
  nodeFilter.phase = 'all'
  nodeFilter.autopOnly = false
}

function selectNode(stateId: string | null, options: { focus?: boolean } = {}) {
  if (!stateId) {
    selectedNodeId.value = null
    return
  }
  inspectorOpen.value = true
  if (selectedNodeId.value !== stateId) {
    selectedNodeId.value = stateId
  }
  inspectorTab.value = 'general'
  if (options.focus !== false) {
    focusNodeOnCanvas(stateId)
  }
}

function focusNodeOnCanvas(stateId: string) {
  nextTick(() => {
    canvasComponent.value?.focusNode(stateId)
  })
}

function syncNodeLayout() {
  if (!nodeForm.value || !flowDetail.value) return
  const target = flowDetail.value.nodes.find((node) => node.stateId === nodeForm.value?.stateId)
  if (target) {
    target.layout = cloneNode(nodeForm.value.layout || { x: 0, y: 0 })
  }
}

function syncActionsFromText() {
  if (!nodeForm.value) return
  if (nodeActionsError.value) return
  try {
    nodeForm.value.actions = nodeActionsText.value.trim() ? JSON.parse(nodeActionsText.value) : []
  } catch (error) {
    nodeActionsError.value = 'JSON ungültig'
  }
}

async function persistFlow(options: { silent?: boolean } = {}) {
  if (!flowDetail.value) return
  const silent = options.silent ?? false
  if (flowAutoSaveTimer) {
    clearTimeout(flowAutoSaveTimer)
    flowAutoSaveTimer = null
  }
  flowSaveLoading.value = true
  let payload: Record<string, any>
  try {
    payload = {
      name: flowForm.name.trim(),
      description: flowForm.description,
      schemaVersion: flowForm.schemaVersion.trim(),
      startState: flowForm.startState.trim(),
      endStates: flowForm.endStates,
      roles: flowForm.roles,
      phases: flowForm.phases,
      layout: {
        zoom: canvasState.zoom,
        pan: canvasState.pan,
        groups: flowDetail.value.flow.layout?.groups ?? [],
      },
      variables: safeParse(flowForm.variables, 'Variablen'),
      flags: safeParse(flowForm.flags, 'Flags'),
      policies: safeParse(flowForm.policies, 'Policies'),
      hooks: safeParse(flowForm.hooks, 'Hooks'),
    }
    flowForm.name = payload.name
    flowForm.schemaVersion = payload.schemaVersion
    flowForm.startState = payload.startState
  } catch (error: any) {
    flowSaveLoading.value = false
    const message = error?.message || 'Flow konnte nicht gespeichert werden.'
    if (!silent || message !== lastFlowAutosaveError) {
      showSnack(message, 'red')
    }
    lastFlowAutosaveError = message
    return
  }

  try {
    const updated = await api.put<{ flow: DecisionFlowModel; nodes: DecisionNodeModel[] }>(
      `/api/editor/flows/${flowDetail.value.flow.slug}`,
      payload
    )
    if (flowDetail.value) {
      flowDetail.value.flow = updated.flow
      if (Array.isArray(updated.nodes)) {
        flowDetail.value.nodes = updated.nodes
      }
    }
    flowSnapshot.value = cloneNode(flowForm)
    lastFlowAutosaveError = ''

    if (silent) {
      const summaryIndex = flows.value.findIndex((flow) => flow.slug === updated.flow.slug)
      if (summaryIndex !== -1) {
        const previous = flows.value[summaryIndex]
        flows.value.splice(summaryIndex, 1, {
          ...previous,
          name: updated.flow.name,
          description: updated.flow.description,
          startState: updated.flow.startState,
          nodeCount: updated.nodes?.length ?? previous.nodeCount,
        })
      }
      flashAutosaveIndicator()
    } else {
      showSnack('Flow gespeichert.')
      await loadFlows()
    }
  } catch (error: any) {
    console.error('Failed to save flow', error)
    const message = error?.statusMessage || 'Flow konnte nicht gespeichert werden.'
    if (!silent || message !== lastFlowAutosaveError) {
      showSnack(message, 'red')
    }
    lastFlowAutosaveError = message
  } finally {
    flowSaveLoading.value = false
  }
}

async function persistNode(options: { silent?: boolean } = {}) {
  if (!flowDetail.value || !nodeForm.value) return
  const silent = options.silent ?? false
  if (nodeAutoSaveTimer) {
    clearTimeout(nodeAutoSaveTimer)
    nodeAutoSaveTimer = null
  }
  if (nodeActionsError.value) {
    const message = 'Actions JSON korrigieren.'
    if (!silent || message !== lastNodeAutosaveError) {
      showSnack(message, 'amber')
    }
    lastNodeAutosaveError = message
    return
  }

  nodeSaving.value = true
  try {
    const response = await api.put<DecisionNodeModel>(
      `/api/editor/flows/${flowDetail.value.flow.slug}/nodes/${nodeForm.value.stateId}`,
      nodeForm.value
    )
    const index = flowDetail.value.nodes.findIndex((node) => node.stateId === response.stateId)
    if (index !== -1) {
      flowDetail.value.nodes.splice(index, 1, response)
    }
    nodeSnapshot.value = cloneNode(response)
    nodeInitializing = true
    nodeForm.value = cloneNode(response)
    nodeActionsText.value = JSON.stringify(response.actions ?? [], null, 2)
    nodeIdDraft.value = response.stateId
    lastTitleSuggestion = buildNodeKeyFromText(response.title || response.stateId)
    if (pendingNodeHistory && pendingNodeHistory.nodeId === response.stateId) {
      const beforeSnapshot = JSON.stringify(pendingNodeHistory.before)
      const afterSnapshot = JSON.stringify(response)
      if (beforeSnapshot !== afterSnapshot) {
        pushHistory({
          type: 'node-update',
          nodeId: response.stateId,
          before: pendingNodeHistory.before,
          after: cloneNode(response),
        })
      }
    }
    pendingNodeHistory = null
    nextTick(() => {
      nodeInitializing = false
    })
    lastNodeAutosaveError = ''
    if (silent) {
      flashAutosaveIndicator()
    } else {
      showSnack('Node gespeichert.')
    }
  } catch (error: any) {
    console.error('Failed to save node', error)
    const message = error?.statusMessage || 'Node konnte nicht gespeichert werden.'
    if (!silent || message !== lastNodeAutosaveError) {
      showSnack(message, 'red')
    }
    lastNodeAutosaveError = message
  } finally {
    nodeSaving.value = false
  }
}

function persistNodeNow() {
  void persistNode({ silent: false })
}

function scheduleFlowSave() {
  if (!flowDetail.value) return
  if (flowAutoSaveTimer) {
    clearTimeout(flowAutoSaveTimer)
  }
  flowAutoSaveTimer = setTimeout(() => {
    flowAutoSaveTimer = null
    void persistFlow({ silent: true })
  }, 800)
}

function scheduleNodeSave() {
  if (!flowDetail.value || !nodeForm.value) return
  if (nodeActionsError.value) return
  if (nodeAutoSaveTimer) {
    clearTimeout(nodeAutoSaveTimer)
  }
  nodeAutoSaveTimer = setTimeout(() => {
    nodeAutoSaveTimer = null
    if (!nodeForm.value) return
    void persistNode({ silent: true })
  }, 800)
}

async function applyNodeRename() {
  if (!flowDetail.value || !nodeForm.value) return
  const draft = nodeIdDraft.value.trim()
  if (!draft) {
    nodeIdDraft.value = nodeForm.value.stateId
    return
  }
  const targetId = buildNodeKeyFromText(draft)
  if (targetId === nodeForm.value.stateId) {
    nodeIdDraft.value = targetId
    return
  }
  await renameNode(nodeForm.value.stateId, targetId, { recordHistory: true })
}

async function renameNode(oldId: string, newId: string, options: { recordHistory?: boolean } = {}) {
  if (!flowDetail.value || !newId) return
  const trimmedNewId = newId.trim().toUpperCase()
  if (!trimmedNewId || oldId === trimmedNewId) {
    nodeIdDraft.value = oldId
    return
  }
  nodeRenaming = true
  try {
    const previousIndex = flowDetail.value.nodes.findIndex((node) => node.stateId === oldId)
    const previousNode = previousIndex !== -1 ? cloneNode(flowDetail.value.nodes[previousIndex]) : null
    const response = await api.request<{
      node: DecisionNodeModel
      references: DecisionNodeModel[]
      flow: { startState: string; endStates: string[] }
    }>(`/api/editor/flows/${flowDetail.value.flow.slug}/nodes/${oldId}/rename`, {
      method: 'PATCH',
      body: { stateId: trimmedNewId },
    })

    if (previousIndex !== -1) {
      flowDetail.value.nodes.splice(previousIndex, 1, response.node)
    } else {
      flowDetail.value.nodes.push(response.node)
    }

    response.references.forEach((ref) => {
      const idx = flowDetail.value!.nodes.findIndex((node) => node.stateId === ref.stateId)
      if (idx !== -1) {
        flowDetail.value!.nodes.splice(idx, 1, ref)
      }
    })

    flowDetail.value.flow.startState = response.flow.startState
    flowDetail.value.flow.endStates = response.flow.endStates
    flowInitializing = true
    flowForm.startState = response.flow.startState
    flowForm.endStates = [...response.flow.endStates]
    nextTick(() => {
      flowInitializing = false
    })
    flowSnapshot.value = cloneNode(flowForm)

    const summaryIndex = flows.value.findIndex((flow) => flow.slug === flowDetail.value!.flow.slug)
    if (summaryIndex !== -1) {
      const previous = flows.value[summaryIndex]
      flows.value.splice(summaryIndex, 1, {
        ...previous,
        startState: response.flow.startState,
      })
    }

    nodeIdDraft.value = response.node.stateId
    lastTitleSuggestion = buildNodeKeyFromText(response.node.title || response.node.stateId)
    pendingNodeHistory = null

    if (options.recordHistory !== false && previousNode) {
      pushHistory({
        type: 'node-rename',
        beforeId: oldId,
        afterId: response.node.stateId,
        before: previousNode,
        after: cloneNode(response.node),
      })
    }

    selectedNodeId.value = response.node.stateId
    flashAutosaveIndicator()
  } catch (error: any) {
    console.error('Failed to rename node', error)
    showSnack(error?.statusMessage || 'Node konnte nicht umbenannt werden.', 'red')
    nodeIdDraft.value = oldId
  } finally {
    nodeRenaming = false
  }
}

async function createNodeRelative(referenceId: string, position: 'before' | 'after') {
  if (!flowDetail.value) return
  const reference = flowDetail.value.nodes.find((node) => node.stateId === referenceId)
  if (!reference) return

  const baseTitle = reference.title || reference.stateId
  const defaultTitle = position === 'after' ? `${baseTitle} Weiter` : `${baseTitle} Eingang`
  let candidateId = buildNodeKeyFromText(defaultTitle)
  let suffix = 1
  while (flowDetail.value.nodes.some((node) => node.stateId === candidateId)) {
    candidateId = `${buildNodeKeyFromText(defaultTitle)}_${suffix}`
    suffix += 1
  }

  const layoutY = (reference.layout?.y ?? 0) + (position === 'after' ? 220 : -220)
  const layout = {
    x: reference.layout?.x ?? 0,
    y: Math.max(0, layoutY),
  }

  const newNodePayload = {
    stateId: candidateId,
    title: 'Neuer Node',
    summary: '',
    role: reference.role || 'pilot',
    phase: reference.phase || 'general',
    transitions:
      position === 'before'
        ? [
            {
              key: generateKey('tr'),
              type: 'next' as const,
              target: reference.stateId,
              order: 0,
            },
          ]
        : [],
    layout,
  }

  try {
    const newNode = await api.post<DecisionNodeModel>(
      `/api/editor/flows/${flowDetail.value.flow.slug}/nodes`,
      newNodePayload
    )

    const referenceIndex = flowDetail.value.nodes.findIndex((node) => node.stateId === referenceId)
    if (referenceIndex !== -1) {
      const insertIndex = position === 'after' ? referenceIndex + 1 : referenceIndex
      flowDetail.value.nodes.splice(insertIndex, 0, newNode)
    } else {
      flowDetail.value.nodes.push(newNode)
    }

    if (position === 'after') {
      const transition = {
        key: generateKey('tr'),
        type: 'next' as const,
        target: newNode.stateId,
        order: (reference.transitions?.length ?? 0),
      }
      reference.transitions = [...(reference.transitions || []), transition]
      if (nodeForm.value?.stateId === reference.stateId) {
        nodeForm.value.transitions = cloneNode(reference.transitions)
      }
      try {
        await api.put(`/api/editor/flows/${flowDetail.value.flow.slug}/nodes/${reference.stateId}`, cloneNode(reference))
      } catch (error) {
        console.error('Failed to link new node', error)
      }
    }

    const summaryIndex = flows.value.findIndex((flow) => flow.slug === flowDetail.value!.flow.slug)
    if (summaryIndex !== -1) {
      const previous = flows.value[summaryIndex]
      flows.value.splice(summaryIndex, 1, {
        ...previous,
        nodeCount: previous.nodeCount + 1,
      })
    }

    selectedNodeId.value = newNode.stateId
    focusNodeOnCanvas(newNode.stateId)
    flashAutosaveIndicator()
  } catch (error: any) {
    console.error('Failed to create node', error)
    showSnack(error?.statusMessage || 'Node konnte nicht angelegt werden.', 'red')
  }
}

function resetNode() {
  if (!nodeSnapshot.value) return
  nodeForm.value = cloneNode(nodeSnapshot.value)
  nodeActionsText.value = JSON.stringify(nodeSnapshot.value.actions ?? [], null, 2)
  nodeActionsError.value = ''
  syncNodeLayout()
  pendingNodeHistory = null
}

async function deleteNode() {
  if (!flowDetail.value || !nodeForm.value) return
  const confirmed = confirm(`Node ${nodeForm.value.stateId} wirklich löschen?`)
  if (!confirmed) return
  try {
    await api.del(`/api/editor/flows/${flowDetail.value.flow.slug}/nodes/${nodeForm.value.stateId}`)
    flowDetail.value.nodes = flowDetail.value.nodes.filter((node) => node.stateId !== nodeForm.value?.stateId)
    showSnack('Node gelöscht.', 'amber')
    selectedNodeId.value = flowDetail.value.flow.startState || flowDetail.value.nodes[0]?.stateId || null
    const summaryIndex = flows.value.findIndex((flow) => flow.slug === flowDetail.value!.flow.slug)
    if (summaryIndex !== -1) {
      const previous = flows.value[summaryIndex]
      flows.value.splice(summaryIndex, 1, {
        ...previous,
        nodeCount: Math.max(0, previous.nodeCount - 1),
      })
    }
    flashAutosaveIndicator()
  } catch (error) {
    console.error('Failed to delete node', error)
    showSnack('Node konnte nicht gelöscht werden.', 'red')
  }
}

function autoLayoutNodes() {
  if (!flowDetail.value) return
  const nodes = flowDetail.value.nodes
  if (!nodes.length) return

  const nodeMap = new Map(nodes.map((node) => [node.stateId, node]))
  const adjacency = new Map<string, string[]>()
  for (const node of nodes) {
    const targets = (node.transitions || [])
      .map((transition) => transition.target)
      .filter((target) => nodeMap.has(target))
    adjacency.set(node.stateId, Array.from(new Set(targets)))
  }

  const startStateCandidate = flowDetail.value.flow.startState
  const startState = startStateCandidate && nodeMap.has(startStateCandidate)
    ? startStateCandidate
    : nodes[0]?.stateId

  const queue: string[] = []
  const depths = new Map<string, number>()
  const seen = new Set<string>()

  if (startState) {
    queue.push(startState)
    depths.set(startState, 0)
    seen.add(startState)
  }

  while (queue.length > 0) {
    const current = queue.shift()!
    const depth = depths.get(current) ?? 0
    const neighbours = adjacency.get(current) ?? []
    for (const target of neighbours) {
      const nextDepth = depth + 1
      const existing = depths.get(target)
      if (existing === undefined || nextDepth < existing) {
        depths.set(target, nextDepth)
      }
      if (!seen.has(target)) {
        queue.push(target)
        seen.add(target)
      }
    }
  }

  let maxDepth = depths.size ? Math.max(...Array.from(depths.values())) : -1
  const remaining = nodes
    .map((node) => node.stateId)
    .filter((stateId) => !depths.has(stateId))
    .sort((a, b) => a.localeCompare(b))

  for (const stateId of remaining) {
    maxDepth += 1
    depths.set(stateId, maxDepth)
  }

  const levels = new Map<number, DecisionNodeModel[]>()
  for (const node of nodes) {
    const depth = depths.get(node.stateId) ?? 0
    if (!levels.has(depth)) {
      levels.set(depth, [])
    }
    levels.get(depth)!.push(node)
  }

  const sortedDepths = Array.from(levels.keys()).sort((a, b) => a - b)
  let maxLevelWidth = 1
  for (const depth of sortedDepths) {
    const group = levels.get(depth)!
    group.sort((a, b) => a.stateId.localeCompare(b.stateId))
    if (group.length > maxLevelWidth) {
      maxLevelWidth = group.length
    }
  }

  const BASE_X = 160
  const BASE_Y = 80
  const COLUMN_SPACING = 340
  const ROW_SPACING = 240

  for (const depth of sortedDepths) {
    const group = levels.get(depth)!
    const offsetX = BASE_X + ((maxLevelWidth - group.length) * COLUMN_SPACING) / 2
    group.forEach((node, index) => {
      const x = Math.round(offsetX + index * COLUMN_SPACING)
      const y = Math.round(BASE_Y + depth * ROW_SPACING)
      const layout: DecisionNodeLayout = { ...(node.layout || {}), x, y }
      node.layout = layout
      if (nodeForm.value?.stateId === node.stateId) {
        nodeForm.value.layout = cloneNode(layout)
      }
      void api.request(`/api/editor/flows/${flowDetail.value.flow.slug}/nodes/${node.stateId}/layout`, {
        method: 'PATCH',
        body: layout,
      })
    })
  }

  showSnack('Auto-Layout angewendet.')
  flashAutosaveIndicator()
}

function onNodeDragStart(stateId: string) {
  if (!flowDetail.value) return
  const target = flowDetail.value.nodes.find((node) => node.stateId === stateId)
  if (!target) return
  const layout = target.layout || { x: 0, y: 0 }
  pendingLayoutHistory = {
    nodeId: stateId,
    start: { x: layout.x ?? 0, y: layout.y ?? 0 },
  }
}

function onNodeMove(payload: { stateId: string; x: number; y: number }) {
  if (!flowDetail.value) return
  const x = Math.max(0, Math.round(payload.x))
  const y = Math.max(0, Math.round(payload.y))
  const target = flowDetail.value.nodes.find((node) => node.stateId === payload.stateId)
  if (target) {
    target.layout = { ...(target.layout || { x: 0, y: 0 }), x, y }
  }
  if (nodeForm.value?.stateId === payload.stateId) {
    nodeForm.value.layout = { ...(nodeForm.value.layout || { x: 0, y: 0 }), x, y }
  }
}

async function onNodeDrop(payload: { stateId: string; x: number; y: number }) {
  if (!flowDetail.value) return
  const x = Math.max(0, Math.round(payload.x))
  const y = Math.max(0, Math.round(payload.y))
  onNodeMove({ ...payload, x, y })
  try {
    await api.request(`/api/editor/flows/${flowDetail.value.flow.slug}/nodes/${payload.stateId}/layout`, {
      method: 'PATCH',
      body: { x, y },
    })
    if (pendingLayoutHistory && pendingLayoutHistory.nodeId === payload.stateId) {
      const before = pendingLayoutHistory.start
      if (before.x !== x || before.y !== y) {
        pushHistory({
          type: 'node-layout',
          nodeId: payload.stateId,
          before,
          after: { x, y },
        })
      }
    }
    flashAutosaveIndicator()
  } catch (error) {
    console.error('Failed to persist node layout', error)
  }
  pendingLayoutHistory = null
}

function onUpdatePan(pan: { x: number; y: number }) {
  canvasState.pan = pan
  scheduleLayoutSave()
}

function onUpdateZoom(zoom: number) {
  canvasState.zoom = zoom
  scheduleLayoutSave()
}

function scheduleLayoutSave() {
  if (!flowDetail.value) return
  if (layoutSaveTimer) {
    clearTimeout(layoutSaveTimer)
  }
  layoutSaveTimer = setTimeout(async () => {
    try {
      await api.put(`/api/editor/flows/${flowDetail.value!.flow.slug}`, {
        layout: {
          zoom: canvasState.zoom,
          pan: canvasState.pan,
          groups: flowDetail.value!.flow.layout?.groups ?? [],
        },
      })
      flashAutosaveIndicator()
    } catch (error) {
      console.error('Failed to persist canvas transform', error)
    } finally {
      layoutSaveTimer = null
    }
  }, 500)
}

const autoTriggerPresets: AutoPreset[] = [
  {
    id: 'altitude-200',
    label: 'Alt > 200 ft',
    description: 'Geht automatisch weiter, wenn die Höhe 200ft überschreitet',
    build: () => ({
      key: generateKey('auto'),
      type: 'auto',
      target: '',
      order: 0,
      autoTrigger: {
        id: generateKey('trigger'),
        type: 'telemetry',
        parameter: 'altitude_ft',
        operator: '>',
        value: 200,
        description: 'Höhe über 200ft',
      },
    }),
  },
  {
    id: 'speed-60',
    label: 'Speed < 60 kts',
    description: 'Trigger wenn Geschwindigkeit unter 60 Knoten fällt',
    build: () => ({
      key: generateKey('auto'),
      type: 'auto',
      target: '',
      order: 0,
      autoTrigger: {
        id: generateKey('trigger'),
        type: 'telemetry',
        parameter: 'speed_kts',
        operator: '<',
        value: 60,
        description: 'Geschwindigkeit unter 60kts',
      },
    }),
  },
  {
    id: 'expression-stack',
    label: 'Expression Beispiel',
    description: 'Custom Expression für Flags oder Variablen',
    build: () => ({
      key: generateKey('auto'),
      type: 'auto',
      target: '',
      order: 0,
      autoTrigger: {
        id: generateKey('trigger'),
        type: 'expression',
        expression: 'flags.in_air === true && telemetry.altitude_ft > 500',
        description: 'Wenn in der Luft und über 500ft',
      },
    }),
  },
]

const suggestedReadbackFields = [
  'dest',
  'sid',
  'runway',
  'initial_altitude_ft',
  'squawk',
  'frequency',
]

function buildNodeKeyFromText(text: string) {
  return text
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase() || 'NODE'
}

function generateKey(prefix: string) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function addTransition(type: DecisionNodeTransition['type'] = 'next') {
  if (!nodeForm.value) return
  const transition: DecisionNodeTransition = {
    key: generateKey('tr'),
    type,
    target: '',
    order: nodeForm.value.transitions?.length || 0,
  }
  if (!nodeForm.value.transitions) nodeForm.value.transitions = []
  nodeForm.value.transitions.push(transition)
}

function removeTransition(index: number) {
  if (!nodeForm.value?.transitions) return
  nodeForm.value.transitions.splice(index, 1)
}

function toggleAutoTrigger(index: number) {
  if (!nodeForm.value?.transitions) return
  const transition = nodeForm.value.transitions[index]
  if (!transition) return
  if (transition.autoTrigger) {
    delete transition.autoTrigger
  } else {
    transition.autoTrigger = {
      id: generateKey('trigger'),
      type: 'telemetry',
      parameter: 'altitude_ft',
      operator: '>',
      value: 200,
      description: 'Auto Trigger',
    }
  }
}

function applyAutoPreset(preset: AutoPreset) {
  if (!nodeForm.value) return
  const newTransition = preset.build()
  nodeForm.value.transitions = nodeForm.value.transitions || []
  newTransition.order = nodeForm.value.transitions.length
  nodeForm.value.transitions.push(newTransition)
}

function addPlaceholder() {
  if (!nodeForm.value) return
  nodeForm.value.llmTemplate = nodeForm.value.llmTemplate || { placeholders: [] }
  nodeForm.value.llmTemplate.placeholders = nodeForm.value.llmTemplate.placeholders || []
  nodeForm.value.llmTemplate.placeholders.push({
    key: `field_${nodeForm.value.llmTemplate.placeholders.length + 1}`,
    label: 'Platzhalter',
    description: '',
  })
}

function removePlaceholder(index: number) {
  if (!nodeForm.value?.llmTemplate?.placeholders) return
  nodeForm.value.llmTemplate.placeholders.splice(index, 1)
}

</script>

<style scoped>
.autosave-fade-enter-active,
.autosave-fade-leave-active {
  transition: opacity 0.3s ease;
}

.autosave-fade-enter-from,
.autosave-fade-leave-to {
  opacity: 0;
}

.inspector-slide-enter-active,
.inspector-slide-leave-active {
  transition: transform 0.28s ease, opacity 0.28s ease;
}

.inspector-slide-enter-from,
.inspector-slide-leave-to {
  opacity: 0;
  transform: translateX(12px);
}

.sidebar-button {
  @apply w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:border-cyan-400;
}
</style>
