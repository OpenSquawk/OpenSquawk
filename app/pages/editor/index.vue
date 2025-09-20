<template>
  <div class="min-h-screen bg-[#050910] text-white">
    <div class="flex h-screen flex-col">
      <header class="border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-xs uppercase tracking-[0.35em] text-cyan-300/70">OpenSquawk</p>
            <h1 class="text-2xl font-semibold">ATC Decision Tree Editor</h1>
            <div class="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/60">
              <span v-if="currentFlow">
                Active flow:
                <strong class="text-white/80">{{ currentFlow.name }}</strong>
                <span class="ml-2 text-white/40">Updated {{ formatRelativeTime(currentFlow.updatedAt) }}</span>
              </span>
              <span v-if="flowStats.total">
                States: {{ flowStats.total }} · Autopilot: {{ flowStats.autop }} · Templates: {{ flowStats.llm }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-3 text-sm text-white/70">
            <v-chip v-if="auth.user" size="small" color="cyan" variant="outlined">
              {{ auth.user?.email }} · {{ auth.user?.role?.toUpperCase() }}
            </v-chip>
            <v-btn color="cyan" variant="tonal" prepend-icon="mdi-cog" :disabled="!currentFlow" @click="openFlowSettings">
              Flow settings
            </v-btn>
            <v-btn variant="outlined" color="cyan" size="small" :loading="flowsLoading || flowLoading" @click="refreshAll">
              <v-icon start>mdi-refresh</v-icon>
              Refresh
            </v-btn>
          </div>
        </div>
      </header>

      <main class="flex flex-1 overflow-hidden">
        <!-- Sidebar -->
        <aside class="flex w-80 flex-col border-r border-white/10 bg-white/5/40">
          <div class="border-b border-white/10 p-4">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-lg font-semibold">Flows</h2>
              <v-btn icon size="small" color="cyan" variant="tonal" @click="() => { resetNewFlowForm(); newFlowDialog = true }">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </div>
            <v-text-field
              v-model="flowSearch"
              label="Search flows"
              density="compact"
              variant="outlined"
              prepend-inner-icon="mdi-magnify"
              hide-details
              class="mt-3"
            />
            <v-alert
              v-if="flowsError"
              class="mt-3"
              type="warning"
              variant="tonal"
              density="comfortable"
            >
              {{ flowsError }}
            </v-alert>
            <div class="mt-4 space-y-2 overflow-y-auto pr-1" style="max-height: 200px">
              <template v-if="flowsLoading">
                <v-skeleton-loader type="article" class="rounded-2xl border border-white/10 bg-white/10" />
                <v-skeleton-loader type="article" class="rounded-2xl border border-white/10 bg-white/10" />
              </template>
              <v-card
                v-for="flow in filteredFlows"
                :key="flow.id"
                class="cursor-pointer border border-white/10 bg-white/5 transition hover:border-cyan-400"
                :class="flow.id === activeFlowId ? 'border-cyan-400 bg-cyan-500/10' : ''"
                @click="openFlow(flow.id)"
              >
                <v-card-text class="space-y-1">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <div class="text-sm font-semibold">{{ flow.name }}</div>
                      <div class="text-xs text-white/50 truncate">{{ flow.description || '—' }}</div>
                    </div>
                    <div class="text-right text-[11px] text-white/50">
                      <div>{{ flow.stateCount || 0 }} nodes</div>
                      <div>Updated {{ formatRelativeTime(flow.lastStateUpdate) }}</div>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
              <div v-if="!flowsLoading && !filteredFlows.length" class="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/50">
                No flows found.
              </div>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-5">
            <div class="space-y-3">
              <div class="flex items-center justify-between gap-3">
                <h2 class="text-lg font-semibold">Nodes</h2>
                <v-btn color="cyan" variant="outlined" size="small" prepend-icon="mdi-shape-plus" @click="startCreateState">
                  New node
                </v-btn>
              </div>
              <v-text-field
                v-model="stateSearch"
                label="Search nodes"
                density="comfortable"
                variant="outlined"
                prepend-inner-icon="mdi-magnify"
                hide-details
              />
              <div class="flex flex-wrap gap-2">
                <v-chip
                  v-for="lane in laneOptions"
                  :key="lane"
                  size="small"
                  :color="laneFilter === lane ? 'cyan' : ''"
                  variant="outlined"
                  @click="laneFilter = laneFilter === lane ? null : lane"
                >
                  {{ lane }}
                </v-chip>
              </div>
              <div class="flex flex-wrap gap-2">
                <v-chip
                  v-for="roleOption in availableRoles"
                  :key="roleOption.value"
                  size="small"
                  :color="roleFilter === roleOption.value ? 'cyan' : ''"
                  variant="outlined"
                  @click="roleFilter = roleFilter === roleOption.value ? null : (roleOption.value as any)"
                >
                  {{ roleOption.label }}
                </v-chip>
                <v-chip
                  size="small"
                  :color="showAutopilotOnly ? 'purple' : ''"
                  variant="outlined"
                  @click="showAutopilotOnly = !showAutopilotOnly"
                >
                  Autopilot
                </v-chip>
              </div>
            </div>

            <div class="space-y-2">
              <div v-if="flowLoading" class="space-y-2">
                <v-skeleton-loader type="article" class="rounded-xl border border-white/10 bg-white/10" />
                <v-skeleton-loader type="article" class="rounded-xl border border-white/10 bg-white/10" />
              </div>
              <v-alert
                v-else-if="!flowStates.length"
                type="info"
                variant="tonal"
                density="comfortable"
                class="bg-white/10 text-white/70"
              >
                Select a flow to load its nodes.
              </v-alert>
              <div
                v-for="state in filteredStates"
                :key="state.stateId"
                class="cursor-pointer rounded-2xl border border-white/10 bg-black/40 p-3 transition hover:border-cyan-400"
                :class="selectedStateId === state.stateId ? 'border-cyan-400 bg-cyan-500/10' : ''"
                @click="selectState(state.stateId, { center: true })"
              >
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <div class="font-mono text-xs tracking-widest text-cyan-300">{{ state.stateId }}</div>
                    <div class="truncate text-sm font-semibold">{{ state.title || state.sayTpl || 'Untitled node' }}</div>
                  </div>
                  <div class="flex flex-col items-end gap-1 text-[11px] text-white/50">
                    <v-chip size="x-small" color="cyan" variant="outlined">{{ state.phase }}</v-chip>
                    <span>{{ state.role.toUpperCase() }}</span>
                  </div>
                </div>
                <div class="mt-2 flex flex-wrap gap-2 text-[11px] text-white/50">
                  <span v-if="state.auto" class="rounded-full bg-purple-500/20 px-2 py-1 text-purple-100">
                    Auto trigger
                  </span>
                  <span
                    v-if="(state.transitions ?? []).some(t => t.kind === 'auto')"
                    class="rounded-full bg-purple-500/20 px-2 py-1 text-purple-100"
                  >
                    {{ (state.transitions ?? []).filter(t => t.kind === 'auto').length }} autopilot
                  </span>
                  <span
                    v-if="(state.llmTemplates ?? []).length"
                    class="rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-100"
                  >
                    {{ (state.llmTemplates ?? []).length }} template
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- Canvas -->
        <section class="relative flex-1 overflow-hidden bg-[#04070f]">
          <div
            v-if="flowError"
            class="pointer-events-none absolute left-1/2 top-4 z-40 flex w-full max-w-xl -translate-x-1/2 justify-center px-4"
          >
            <v-alert
              type="error"
              variant="tonal"
              class="pointer-events-auto w-full border border-red-500/40 bg-red-500/20 text-red-100 backdrop-blur"
              closable
              @click:close="flowError = null"
            >
              <div class="flex items-center justify-between gap-3">
                <span>{{ flowError }}</span>
                <v-btn size="small" variant="text" color="red" prepend-icon="mdi-refresh" @click="refreshAll">
                  Retry
                </v-btn>
              </div>
            </v-alert>
          </div>

          <div
            class="pointer-events-auto absolute left-4 top-4 z-30 flex max-w-3xl flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/60 p-3 text-xs shadow-lg backdrop-blur"
          >
            <div class="flex flex-wrap items-center gap-2">
              <v-btn
                size="small"
                variant="tonal"
                color="cyan"
                prepend-icon="mdi-chart-sankey"
                :disabled="!flowStates.length"
                @click="autoLayout('phase')"
              >
                Layout by phase
              </v-btn>
              <v-btn
                size="small"
                variant="tonal"
                color="cyan"
                prepend-icon="mdi-view-column"
                :disabled="!flowStates.length"
                @click="autoLayout('lane')"
              >
                Layout by lane
              </v-btn>
              <v-btn
                size="small"
                variant="outlined"
                color="cyan"
                prepend-icon="mdi-content-save"
                :disabled="!flowStates.length"
                :loading="savingLayout"
                @click="persistLayoutForVisible()"
              >
                Save layout
              </v-btn>
              <div class="h-6 w-px bg-white/20" />
              <v-btn
                size="small"
                variant="text"
                color="cyan"
                prepend-icon="mdi-target"
                :disabled="!currentFlow?.startState"
                @click="currentFlow?.startState && centerOnState(currentFlow.startState)"
              >
                Focus start
              </v-btn>
              <v-btn
                size="small"
                variant="text"
                color="cyan"
                prepend-icon="mdi-crosshairs-gps"
                :disabled="!selectedStateId"
                @click="selectedStateId && centerOnState(selectedStateId)"
              >
                Focus selection
              </v-btn>
              <div class="h-6 w-px bg-white/20" />
              <v-btn
                size="small"
                variant="outlined"
                :color="snapToGrid ? 'purple' : 'grey'"
                prepend-icon="mdi-grid"
                @click="snapToGrid = !snapToGrid"
              >
                {{ snapToGrid ? 'Snap on' : 'Snap off' }}
              </v-btn>
            </div>
          </div>

          <div
            v-if="flowLoading"
            class="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <div class="flex flex-col items-center gap-3 text-sm text-white/70">
              <v-progress-circular color="cyan" indeterminate size="40" />
              <span>Loading flow…</span>
            </div>
          </div>

          <div ref="canvasScrollRef" class="h-full w-full overflow-auto">
            <div
              ref="canvasInnerRef"
              class="relative"
              :style="{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px` }"
            >
              <div class="pointer-events-none absolute inset-0 bg-[size:40px_40px] bg-[linear-gradient(90deg,rgba(148,163,184,0.1)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.1)_1px,transparent_1px)]"></div>

              <svg class="pointer-events-none absolute inset-0" :width="canvasSize.width" :height="canvasSize.height">
                <defs>
                  <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="strokeWidth">
                    <path d="M 0 0 L 8 4 L 0 8 z" fill="rgba(56,189,248,0.6)" />
                  </marker>
                </defs>
                <g>
                  <path
                    v-for="segment in connectors"
                    :key="segment.id"
                    :d="connectorPath(segment)"
                    :stroke="connectorColor(segment.kind)"
                    stroke-width="2"
                    fill="none"
                    marker-end="url(#arrowhead)"
                    opacity="0.75"
                  />
                  <text
                    v-for="segment in connectors"
                    :key="segment.id + '-label'"
                    :x="(segment.from.x + segment.to.x) / 2"
                    :y="(segment.from.y + segment.to.y) / 2 - 4"
                    class="text-[11px] fill-white/60"
                  >
                    {{ segment.label }}
                  </text>
                </g>
              </svg>

              <div
                v-for="state in flowStates"
                :key="state.stateId"
                class="absolute"
                :style="nodeStyle(state)"
                :ref="(el) => registerNodeEl(state.stateId, el)"
              >
                <div
                  class="group rounded-2xl border backdrop-blur transition-shadow"
                  :class="[
                    selectedStateId === state.stateId
                      ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
                      : visibleStateIds.has(state.stateId)
                        ? 'border-white/10 bg-white/5 shadow-sm'
                        : 'border-white/5 bg-white/5/30 opacity-40',
                  ]"
                  @click.stop="selectState(state.stateId)"
                >
                  <div
                    class="flex items-start justify-between gap-3 rounded-t-2xl border-b border-white/10 bg-white/10 px-4 py-3"
                    @pointerdown.stop="(event) => onNodePointerDown(event, state.stateId)"
                  >
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-xs tracking-[0.4em] text-cyan-300">
                          {{ state.stateId }}
                        </span>
                        <v-chip
                          size="x-small"
                          :color="state.role === 'pilot' ? 'orange' : state.role === 'system' ? 'purple' : 'cyan'"
                          variant="tonal"
                        >
                          {{ state.role.toUpperCase() }}
                        </v-chip>
                      </div>
                      <div class="truncate text-sm font-semibold leading-tight">
                        {{ state.title || state.sayTpl || 'Untitled node' }}
                      </div>
                      <div class="text-xs text-white/60">{{ state.phase }}</div>
                    </div>
                    <div class="flex flex-col items-end gap-1 text-xs text-white/50">
                      <v-btn
                        size="x-small"
                        icon
                        variant="text"
                        @click.stop="centerOnState(state.stateId)"
                        @pointerdown.stop
                      >
                        <v-icon size="18">mdi-crosshairs-gps</v-icon>
                      </v-btn>
                      <v-btn
                        size="x-small"
                        icon
                        variant="text"
                        @click.stop="duplicateState(state.stateId)"
                        @pointerdown.stop
                      >
                        <v-icon size="18">mdi-content-copy</v-icon>
                      </v-btn>
                    </div>
                  </div>

                  <div class="space-y-3 px-4 py-3 text-xs">
                    <div class="flex flex-wrap gap-2">
                      <span v-if="state.auto" class="rounded-full bg-purple-500/20 px-2 py-1 text-purple-100">
                        Auto trigger
                      </span>
                      <span
                        v-if="(state.transitions ?? []).some(t => t.kind === 'auto')"
                        class="rounded-full bg-purple-500/20 px-2 py-1 text-purple-100"
                      >
                        {{ (state.transitions ?? []).filter(t => t.kind === 'auto').length }} autopilot
                      </span>
                      <span
                        v-if="(state.llmTemplates ?? []).length"
                        class="rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-100"
                      >
                        {{ (state.llmTemplates ?? []).length }} template
                      </span>
                    </div>

                    <div class="rounded-xl bg-black/30 p-2 text-[11px] leading-relaxed text-white/70">
                      <div v-if="state.sayTpl" class="line-clamp-3">
                        “{{ state.sayTpl }}”
                      </div>
                      <div v-else-if="state.utteranceTpl" class="line-clamp-3">
                        Pilot: {{ state.utteranceTpl }}
                      </div>
                      <div v-else class="text-white/40">
                        No radio prompt configured.
                      </div>
                    </div>

                    <div class="flex flex-wrap gap-2 text-[11px] text-white/50">
                      <span
                        v-for="kind in transitionKindOptions"
                        :key="state.stateId + kind.value"
                        v-if="(state.transitions ?? []).some(t => t.kind === kind.value)"
                        class="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1"
                      >
                        <v-icon size="14" :icon="kind.value === 'timer' ? 'mdi-timer-outline' : kind.value === 'auto' ? 'mdi-robot' : 'mdi-arrow-right-bold'" />
                        {{ kind.label }} · {{ (state.transitions ?? []).filter(t => t.kind === kind.value).length }}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center justify-between gap-2 rounded-b-2xl border-t border-white/10 bg-white/5 px-4 py-2 text-[11px] text-white/50">
                    <span>Updated {{ formatRelativeTime(state.updatedAt) }}</span>
                    <span v-if="savingPositionId === state.stateId" class="flex items-center gap-1 text-cyan-200">
                      <v-progress-circular indeterminate size="14" width="2" color="cyan" />
                      saving…
                    </span>
                    <span v-else-if="positionErrors[state.stateId]" class="text-red-300">
                      {{ positionErrors[state.stateId] }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Inspector -->
        <aside class="w-[420px] border-l border-white/10 bg-white/5/30">
          <div class="flex h-full flex-col overflow-y-auto p-6">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-lg font-semibold">Inspector</h2>
              <div class="flex items-center gap-2">
                <v-btn size="small" color="cyan" variant="outlined" prepend-icon="mdi-shape-plus" @click="startCreateState">
                  New node
                </v-btn>
                <v-btn
                  size="small"
                  variant="text"
                  color="cyan"
                  :disabled="!selectedStateId"
                  @click="selectedStateId && centerOnState(selectedStateId)"
                >
                  Focus
                </v-btn>
              </div>
            </div>

            <v-alert
              v-if="inspectorError"
              class="mt-4"
              type="warning"
              variant="tonal"
              density="comfortable"
            >
              {{ inspectorError }}
            </v-alert>
            <v-alert
              v-if="inspectorNotice"
              class="mt-4"
              type="success"
              variant="tonal"
              density="comfortable"
            >
              {{ inspectorNotice }}
            </v-alert>

            <div class="mt-6 flex-1 space-y-6 text-sm">
              <div v-if="!currentFlow" class="text-white/60">
                Select or create a flow to begin editing nodes.
              </div>

              <div v-else-if="!editingState">
                <div v-if="isCreatingNewState" class="text-white/60">
                  Configure the new node and press save to add it to the flow.
                </div>
                <div v-else class="text-white/60">
                  Pick a node from the canvas or list to view its configuration.
                </div>
              </div>

              <template v-else>
                <section class="space-y-4">
                  <div class="grid grid-cols-2 gap-3">
                    <v-text-field v-model="editingState.stateId" label="State ID" variant="outlined" density="comfortable" />
                    <v-text-field v-model="editingState.title" label="Title" variant="outlined" density="comfortable" />
                    <v-select
                      v-model="editingState.role"
                      :items="availableRoles"
                      label="Role"
                      item-title="label"
                      item-value="value"
                      density="comfortable"
                      variant="outlined"
                    />
                    <v-combobox
                      v-model="editingState.phase"
                      :items="phases"
                      label="Phase"
                      density="comfortable"
                      variant="outlined"
                    />
                    <v-text-field v-model="editingState.ui.lane" label="Lane" variant="outlined" density="comfortable" />
                    <v-text-field v-model="editingState.ui.color" label="Color" variant="outlined" density="comfortable" />
                    <v-text-field v-model="editingState.ui.icon" label="Icon" variant="outlined" density="comfortable" />
                    <v-text-field
                      v-model.number="editingState.ui.width"
                      type="number"
                      label="Width"
                      variant="outlined"
                      density="comfortable"
                    />
                  </div>
                  <div class="flex flex-wrap gap-3">
                    <v-btn color="cyan" variant="flat" prepend-icon="mdi-content-save" :loading="savingState" @click="saveState">
                      Save node
                    </v-btn>
                    <v-btn
                      color="grey"
                      variant="text"
                      prepend-icon="mdi-undo"
                      :disabled="!editingOriginalStateId"
                      @click="editingOriginalStateId && selectState(editingOriginalStateId)"
                    >
                      Reset
                    </v-btn>
                    <v-spacer />
                    <v-btn
                      v-if="editingOriginalStateId"
                      color="red"
                      variant="text"
                      prepend-icon="mdi-delete"
                      @click="() => { deleteTargetId = editingOriginalStateId; deleteDialog = true }"
                    >
                      Delete
                    </v-btn>
                  </div>
                </section>

                <section class="space-y-3">
                  <h3 class="text-sm font-semibold text-white/80">Radio prompts</h3>
                  <v-textarea v-model="editingState.sayTpl" label="Controller say template" variant="outlined" rows="3" />
                  <v-textarea v-model="editingState.utteranceTpl" label="Pilot expectation template" variant="outlined" rows="3" />
                  <v-textarea v-model="editingState.elseSayTpl" label="Fallback response" variant="outlined" rows="3" />
                  <v-combobox
                    v-model="editingState.readbackRequired"
                    label="Readback required"
                    multiple
                    chips
                    clearable
                    variant="outlined"
                    density="comfortable"
                  />
                </section>

                <section class="space-y-3">
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm font-semibold text-white/80">Transitions</h3>
                    <div class="flex items-center gap-2 text-xs text-white/60">
                      <v-btn
                        v-for="preset in autopilotPresets"
                        :key="preset.label"
                        size="small"
                        variant="text"
                        color="purple"
                        @click="addAutopPreset(preset)"
                      >
                        {{ preset.label }}
                      </v-btn>
                      <v-btn size="small" color="cyan" variant="outlined" prepend-icon="mdi-plus" @click="addTransition('next')">
                        Add transition
                      </v-btn>
                    </div>
                  </div>

                  <div
                    v-for="(transition, index) in editingState.transitions"
                    :key="transition.id"
                    class="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <div class="flex items-center gap-3">
                        <v-select
                          v-model="transition.kind"
                          :items="transitionKindOptions"
                          item-title="label"
                          item-value="value"
                          label="Kind"
                          variant="outlined"
                          density="compact"
                          class="w-36"
                          @update:modelValue="(value) => onTransitionKindChange(transition, value as EditableTransition['kind'])"
                        />
                        <v-select
                          v-model="transition.to"
                          :items="availableStateOptions"
                          item-title="label"
                          item-value="value"
                          label="Target"
                          variant="outlined"
                          density="compact"
                          clearable
                          class="w-48"
                        />
                      </div>
                      <div class="flex items-center gap-1">
                        <v-btn icon size="small" variant="text" @click="moveTransition(index, -1)">
                          <v-icon>mdi-arrow-up</v-icon>
                        </v-btn>
                        <v-btn icon size="small" variant="text" @click="moveTransition(index, 1)">
                          <v-icon>mdi-arrow-down</v-icon>
                        </v-btn>
                        <v-btn icon size="small" variant="text" color="red" @click="removeTransition(index)">
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <v-text-field v-model="transition.label" label="Label" variant="outlined" density="compact" />
                      <v-text-field v-model="transition.description" label="Description" variant="outlined" density="compact" />
                      <v-text-field v-model="transition.when" label="When expression" variant="outlined" density="compact" />
                      <v-text-field v-model="transition.guard" label="Guard" variant="outlined" density="compact" />
                      <v-text-field
                        v-model.number="transition.priority"
                        type="number"
                        label="Priority"
                        variant="outlined"
                        density="compact"
                      />
                    </div>

                    <div v-if="transition.kind === 'timer'" class="grid grid-cols-2 gap-3">
                      <v-text-field
                        v-model.number="transition.timer!.after_s"
                        type="number"
                        label="After seconds"
                        variant="outlined"
                        density="compact"
                      />
                    </div>

                    <div v-if="transition.kind === 'auto'" class="space-y-3 rounded-xl border border-purple-500/30 bg-purple-500/10 p-3">
                      <div class="grid grid-cols-2 gap-3">
                        <v-select
                          v-model="transition.auto!.mode"
                          :items="autopModeOptions"
                          item-title="label"
                          item-value="value"
                          label="Mode"
                          density="compact"
                          variant="outlined"
                        />
                        <v-select
                          v-model="transition.auto!.operator"
                          :items="autopOperatorOptions"
                          item-title="label"
                          item-value="value"
                          label="Operator"
                          density="compact"
                          variant="outlined"
                        />
                        <v-text-field v-model="transition.auto!.variable" label="Variable" density="compact" variant="outlined" />
                        <v-text-field v-model="transition.auto!.value" label="Value" density="compact" variant="outlined" />
                        <v-text-field v-model="transition.auto!.secondValue" label="Second value" density="compact" variant="outlined" />
                        <v-text-field v-model="transition.auto!.unit" label="Unit" density="compact" variant="outlined" />
                        <v-text-field
                          v-model.number="transition.auto!.holdForMs"
                          type="number"
                          label="Hold (ms)"
                          density="compact"
                          variant="outlined"
                        />
                        <v-text-field
                          v-model.number="transition.auto!.sampleWindowMs"
                          type="number"
                          label="Sample window (ms)"
                          density="compact"
                          variant="outlined"
                        />
                      </div>
                      <v-text-field
                        v-model="transition.auto!.description"
                        label="Description"
                        density="compact"
                        variant="outlined"
                      />
                      <v-text-field
                        v-model="transition.auto!.controllerSayTpl"
                        label="Controller say template"
                        density="compact"
                        variant="outlined"
                      />
                      <div class="grid grid-cols-2 gap-3">
                        <v-switch
                          v-model="transition.auto!.allowDuringLLM"
                          label="Allow during LLM call"
                          density="compact"
                        />
                        <v-switch
                          v-model="transition.auto!.allowDuringPilotSpeech"
                          label="Allow during pilot speech"
                          density="compact"
                        />
                        <v-switch
                          v-model="transition.auto!.allowDuringControllerSpeech"
                          label="Allow during ATC speech"
                          density="compact"
                        />
                      </div>
                      <v-textarea
                        v-model="transition.auto!.updatesText"
                        label="Variable updates (JSON)"
                        variant="outlined"
                        rows="2"
                      />
                      <v-textarea
                        v-model="transition.auto!.flagsText"
                        label="Flag updates (JSON)"
                        variant="outlined"
                        rows="2"
                      />
                    </div>

                    <v-textarea
                      v-model="transition.metadataText"
                      label="Transition metadata (JSON)"
                      variant="outlined"
                      rows="2"
                    />
                  </div>
                </section>

                <section class="space-y-3">
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm font-semibold text-white/80">LLM templates</h3>
                    <div class="flex items-center gap-2 text-xs text-white/60">
                      <v-btn
                        v-for="preset in llmTemplatePresets"
                        :key="preset.id"
                        size="small"
                        variant="text"
                        color="emerald"
                        @click="addTemplatePreset(preset)"
                      >
                        {{ preset.name }}
                      </v-btn>
                      <v-btn size="small" color="cyan" variant="outlined" prepend-icon="mdi-plus" @click="editingState.llmTemplates.push({ id: createId(), name: 'Untitled template', description: '', systemPrompt: '', userPrompt: '', responseFormatText: '', metadataText: '', placeholders: [] })">
                        Add template
                      </v-btn>
                    </div>
                  </div>

                  <v-expansion-panels multiple>
                    <v-expansion-panel
                      v-for="(template, tplIndex) in editingState.llmTemplates"
                      :key="template.id"
                    >
                      <v-expansion-panel-title>
                        <div class="flex items-center justify-between gap-3 w-full">
                          <div class="truncate">
                            {{ template.name || 'Untitled template' }}
                          </div>
                          <v-btn icon size="small" variant="text" color="red" @click.stop="removeTemplate(tplIndex)">
                            <v-icon>mdi-delete</v-icon>
                          </v-btn>
                        </div>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text class="space-y-3">
                        <v-text-field v-model="template.name" label="Name" variant="outlined" density="compact" />
                        <v-text-field v-model="template.description" label="Description" variant="outlined" density="compact" />
                        <v-textarea v-model="template.systemPrompt" label="System prompt" rows="3" variant="outlined" />
                        <v-textarea v-model="template.userPrompt" label="User prompt" rows="3" variant="outlined" />
                        <v-textarea v-model="template.responseFormatText" label="Response format (JSON)" rows="3" variant="outlined" />
                        <v-textarea v-model="template.metadataText" label="Template metadata (JSON)" rows="2" variant="outlined" />
                        <v-text-field v-model="template.sampleResponse" label="Sample response" variant="outlined" density="compact" />
                        <v-text-field v-model="template.hints" label="Hints" variant="outlined" density="compact" />
                        <v-text-field v-model="template.autoApplyWhen" label="Auto apply when" variant="outlined" density="compact" />
                        <div class="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                          <div class="flex items-center justify-between">
                            <h4 class="text-xs font-semibold uppercase tracking-widest text-white/60">Placeholders</h4>
                            <v-btn size="small" variant="text" color="cyan" @click="addPlaceholder(template)">
                              Add placeholder
                            </v-btn>
                          </div>
                          <div
                            v-for="(placeholder, phIndex) in template.placeholders"
                            :key="template.id + '-placeholder-' + phIndex"
                            class="rounded-lg border border-white/10 bg-black/40 p-3 space-y-2"
                          >
                            <div class="grid grid-cols-2 gap-3">
                              <v-text-field v-model="placeholder.key" label="Key" variant="outlined" density="compact" />
                              <v-text-field v-model="placeholder.label" label="Label" variant="outlined" density="compact" />
                              <v-text-field v-model="placeholder.example" label="Example" variant="outlined" density="compact" />
                              <v-switch v-model="placeholder.required" label="Required" density="compact" />
                            </div>
                            <v-textarea v-model="placeholder.description" label="Description" variant="outlined" rows="2" />
                            <div class="grid grid-cols-2 gap-3">
                              <v-text-field v-model="placeholder.autoFill.source" label="Auto fill source" variant="outlined" density="compact" />
                              <v-text-field v-model="placeholder.autoFill.path" label="Auto fill path" variant="outlined" density="compact" />
                              <v-text-field v-model="placeholder.autoFill.literal" label="Auto fill literal" variant="outlined" density="compact" />
                              <v-text-field v-model="placeholder.autoFill.expression" label="Auto fill expression" variant="outlined" density="compact" />
                            </div>
                            <div class="text-right">
                              <v-btn size="x-small" variant="text" color="red" @click="removePlaceholder(template, phIndex)">
                                Remove
                              </v-btn>
                            </div>
                          </div>
                        </div>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </section>

                <section class="space-y-3">
                  <h3 class="text-sm font-semibold text-white/80">Metadata</h3>
                  <v-textarea
                    v-model="editingState.actionsText"
                    label="Actions (JSON array)"
                    variant="outlined"
                    rows="3"
                  />
                  <v-textarea
                    v-model="editingState.metadataText"
                    label="State metadata (JSON)"
                    variant="outlined"
                    rows="3"
                  />
                  <div class="grid grid-cols-2 gap-3">
                    <v-text-field v-model="editingState.handoffTo" label="Handoff to" variant="outlined" density="compact" />
                    <v-text-field v-model="editingState.handoffFreq" label="Handoff frequency" variant="outlined" density="compact" />
                  </div>
                </section>
              </template>
            </div>
          </div>
        </aside>
      </main>

      <v-dialog v-model="flowSettingsDialog" max-width="980">
        <v-card class="bg-[#0b1528] text-white">
          <v-card-title class="flex items-start justify-between gap-4">
            <div>
              <div class="text-xl font-semibold">Flow settings</div>
              <div v-if="currentFlow" class="mt-1 text-xs text-white/60">
                Last updated {{ formatRelativeTime(currentFlow.updatedAt) }}
                <span v-if="currentFlow.createdAt">· Created {{ formatDate(currentFlow.createdAt) }}</span>
              </div>
            </div>
            <v-btn icon="mdi-close" variant="text" color="white" @click="flowSettingsDialog = false" />
          </v-card-title>
          <v-divider class="border-white/10" />
          <v-card-text class="space-y-6 text-sm">
            <v-alert
              v-if="flowSettingsError"
              type="warning"
              variant="tonal"
              class="border border-amber-400/40 bg-amber-500/20 text-amber-100"
            >
              {{ flowSettingsError }}
            </v-alert>

            <div class="grid gap-4 md:grid-cols-2">
              <v-text-field v-model="flowSettingsForm.name" label="Name" variant="outlined" density="comfortable" />
              <v-text-field
                v-model="flowSettingsForm.schemaVersion"
                label="Schema version"
                variant="outlined"
                density="comfortable"
              />
              <v-text-field
                v-model="flowSettingsForm.description"
                label="Description"
                variant="outlined"
                density="comfortable"
                class="md:col-span-2"
              />
              <v-combobox
                v-model="flowSettingsForm.startState"
                :items="availableStateOptions"
                item-title="label"
                item-value="value"
                label="Start state"
                variant="outlined"
                density="comfortable"
                clearable
              />
              <v-combobox
                v-model="flowSettingsForm.endStates"
                :items="availableStateOptions"
                item-title="label"
                item-value="value"
                label="End states"
                multiple
                chips
                variant="outlined"
                density="comfortable"
                clearable
              />
              <v-select
                v-model="flowSettingsForm.roles"
                :items="availableRoles"
                item-title="label"
                item-value="value"
                label="Roles"
                multiple
                chips
                variant="outlined"
                density="comfortable"
              />
              <v-combobox
                v-model="flowSettingsForm.phases"
                :items="phases"
                label="Phases"
                multiple
                chips
                variant="outlined"
                density="comfortable"
              />
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <v-textarea
                v-model="flowSettingsForm.variablesText"
                label="Variables (JSON)"
                rows="4"
                variant="outlined"
              />
              <v-textarea v-model="flowSettingsForm.flagsText" label="Flags (JSON)" rows="4" variant="outlined" />
              <v-textarea
                v-model="flowSettingsForm.policiesText"
                label="Policies (JSON)"
                rows="4"
                variant="outlined"
                class="md:col-span-2"
              />
              <v-textarea v-model="flowSettingsForm.hooksText" label="Hooks (JSON)" rows="4" variant="outlined" class="md:col-span-2" />
              <v-textarea v-model="flowSettingsForm.metadataText" label="Metadata (JSON)" rows="3" variant="outlined" class="md:col-span-2" />
            </div>
          </v-card-text>
          <v-divider class="border-white/10" />
          <v-card-actions class="justify-between gap-3 px-6 py-4">
            <div v-if="currentFlow" class="text-xs text-white/40">
              Flow ID: <span class="font-mono text-white/60">{{ currentFlow.id }}</span>
            </div>
            <div class="flex items-center gap-2">
              <v-btn variant="text" color="white" @click="flowSettingsDialog = false">Cancel</v-btn>
              <v-btn
                color="cyan"
                variant="flat"
                prepend-icon="mdi-content-save"
                :loading="flowSettingsSaving"
                @click="saveFlowSettings"
              >
                Save changes
              </v-btn>
            </div>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="newFlowDialog" max-width="520">
        <v-card class="bg-[#0b1528] text-white">
          <v-card-title class="flex items-center justify-between gap-4">
            <span class="text-lg font-semibold">Create flow</span>
            <v-btn icon="mdi-close" variant="text" color="white" @click="newFlowDialog = false" />
          </v-card-title>
          <v-divider class="border-white/10" />
          <v-card-text class="space-y-4 text-sm">
            <v-alert
              v-if="newFlowError"
              type="warning"
              variant="tonal"
              class="border border-amber-400/40 bg-amber-500/20 text-amber-100"
            >
              {{ newFlowError }}
            </v-alert>
            <v-text-field v-model="newFlowForm.name" label="Name" variant="outlined" density="comfortable" />
            <v-textarea v-model="newFlowForm.description" label="Description" variant="outlined" rows="3" />
            <v-combobox
              v-model="newFlowForm.startState"
              :items="availableStateOptions"
              item-title="label"
              item-value="value"
              label="Start state"
              variant="outlined"
              density="comfortable"
              clearable
            />
            <v-text-field v-model="newFlowForm.schemaVersion" label="Schema version" variant="outlined" density="comfortable" />
          </v-card-text>
          <v-divider class="border-white/10" />
          <v-card-actions class="justify-end gap-2 px-6 py-4">
            <v-btn variant="text" color="white" @click="newFlowDialog = false; resetNewFlowForm()">Cancel</v-btn>
            <v-btn color="cyan" variant="flat" prepend-icon="mdi-plus" :loading="creatingFlow" @click="createFlow">
              Create
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog
        v-model="deleteDialog"
        max-width="420"
        @update:modelValue="(value) => { if (!value) deleteTargetId = null }"
      >
        <v-card class="bg-[#140911] text-white">
          <v-card-title class="flex items-center gap-3">
            <v-icon color="red" class="mr-2">mdi-alert</v-icon>
            Delete node
          </v-card-title>
          <v-card-text class="space-y-3 text-sm text-white/70">
            <p>
              Are you sure you want to delete node
              <span class="font-mono text-white">{{ deleteTargetId }}</span>
              from flow <span class="font-semibold">{{ currentFlow?.name }}</span>?
            </p>
            <p class="text-white/50">This action cannot be undone and transitions pointing to this node will need review.</p>
          </v-card-text>
          <v-card-actions class="justify-end gap-2 px-6 py-4">
            <v-btn variant="text" color="white" @click="deleteDialog = false; deleteTargetId = null">Cancel</v-btn>
            <v-btn color="red" variant="flat" prepend-icon="mdi-delete" :loading="deletingState" @click="confirmDeleteState">
              Delete
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useHead } from '#imports'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'
import type {
  AtcAutopilotCondition,
  AtcFlow,
  AtcLlmTemplate,
  AtcState,
  AtcTemplatePlaceholder,
  AtcTransition
} from '~/shared/types/atc'

definePageMeta({ middleware: ['require-admin'] })

useHead({ title: 'ATC Decision Tree Editor · OpenSquawk' })

const auth = useAuthStore()
const api = useApi()

interface FlowSummary extends AtcFlow {
  stateCount?: number
  lastStateUpdate?: string
}

interface FlowWithStates {
  flow: AtcFlow
  states: AtcState[]
}

interface EditableAutopilot extends AtcAutopilotCondition {
  updatesText?: string
  flagsText?: string
}

interface EditableTransition extends Omit<AtcTransition, 'auto'> {
  timer?: { after_s?: number }
  auto?: EditableAutopilot
  metadataText?: string
}

interface EditablePlaceholder extends Omit<AtcTemplatePlaceholder, 'autoFill'> {
  autoFill: {
    source?: string
    path?: string
    literal?: string
    expression?: string
  }
}

interface EditableTemplate extends Omit<AtcLlmTemplate, 'placeholders' | 'responseFormat' | 'metadata'> {
  placeholders: EditablePlaceholder[]
  responseFormatText?: string
  metadataText?: string
}

interface EditableStateForm {
  stateId: string
  title?: string
  role: AtcState['role']
  phase: string
  sayTpl?: string
  utteranceTpl?: string
  elseSayTpl?: string
  readbackRequired: string[]
  auto?: string
  actionsText: string
  condition?: string
  guard?: string
  trigger?: string
  frequency?: string
  frequencyName?: string
  handoffTo?: string
  handoffFreq?: string
  transitions: EditableTransition[]
  llmTemplates: EditableTemplate[]
  metadataText: string
  notes?: string
  ui: {
    lane?: string
    color?: string
    icon?: string
    width?: number
  }
}

interface ConnectorSegment {
  id: string
  kind: EditableTransition['kind']
  label?: string
  from: { x: number; y: number }
  to: { x: number; y: number }
}

const flows = ref<FlowSummary[]>([])
const flowsLoading = ref(false)
const flowsError = ref<string | null>(null)

const activeFlowId = ref<string | null>(null)
const flowLoading = ref(false)
const flowError = ref<string | null>(null)
const flowData = ref<FlowWithStates | null>(null)
const flowStates = ref<AtcState[]>([])

const selectedStateId = ref<string | null>(null)
const editingState = ref<EditableStateForm | null>(null)
const editingOriginalStateId = ref<string | null>(null)
const isCreatingNewState = ref(false)

const statePositions = reactive<Record<string, { x: number; y: number }>>({})
const connectors = ref<ConnectorSegment[]>([])

const stateSearch = ref('')
const laneFilter = ref<string | null>(null)
const roleFilter = ref<string | null>(null)
const showAutopilotOnly = ref(false)

const canvasScrollRef = ref<HTMLElement | null>(null)
const canvasInnerRef = ref<HTMLElement | null>(null)

const dragging = reactive({
  id: null as string | null,
  pointerId: 0,
  originX: 0,
  originY: 0,
  startX: 0,
  startY: 0
})

const snapToGrid = ref(true)
const gridSize = 24

interface AutopilotPreset {
  label: string
  variable: string
  operator: AtcAutopilotCondition['operator']
  value: number | string
  description?: string
}

const autopilotPresets: AutopilotPreset[] = [
  { label: 'Altitude ≥ 2000 ft', variable: 'variables.altitude_ft', operator: '>=', value: 2000, description: 'Climb complete once above 2000 ft' },
  { label: 'Altitude ≤ 500 ft', variable: 'variables.altitude_ft', operator: '<=', value: 500, description: 'Approach trigger when descending' },
  { label: 'Speed < 60 kt', variable: 'variables.groundspeed_kt', operator: '<', value: 60, description: 'Detect taxi speed without LLM' },
  { label: 'Vertical speed changes sign', variable: 'variables.vertical_speed_fpm', operator: 'changes', value: 0, description: 'Fire when climb/descent direction changes' }
]

const llmTemplatePresets: EditableTemplate[] = [
  {
    id: 'preset-standard-decision',
    name: 'Standard decision',
    description: 'Evaluate the pilot reply, decide the next state and optionally speak as ATC.',
    systemPrompt: 'You are an experienced ATC assistant. Evaluate pilot replies and pick the most appropriate next controller state. Always return valid JSON.',
    userPrompt: 'Current state: {{state_id}}\nPilot said: {{pilot_utterance}}\nCandidate states:\n{{#each candidates as |c|}}{{c.id}}: {{c.state.title}}\n{{/each}}',
    responseFormatText: JSON.stringify({
      type: 'object',
      properties: {
        next_state: { type: 'string' },
        controller_say_tpl: { type: 'string' },
        updates: { type: 'object', additionalProperties: true },
        flags: { type: 'object', additionalProperties: true }
      },
      required: ['next_state']
    }, null, 2),
    metadataText: '',
    placeholders: [
      {
        key: 'state_id',
        label: 'State ID',
        description: 'Identifier of the ATC state currently active',
        required: true,
        autoFill: {}
      },
      {
        key: 'pilot_utterance',
        label: 'Pilot utterance',
        description: 'Transcript of what the pilot said',
        required: true,
        autoFill: {}
      },
      {
        key: 'candidates',
        label: 'Candidate states',
        description: 'JSON array of candidate transitions with reasons',
        required: true,
        autoFill: {}
      }
    ]
  },
  {
    id: 'preset-readback-check',
    name: 'Readback verification',
    description: 'Classify whether the pilot read back all mandatory elements and highlight missing ones.',
    systemPrompt: 'Check the pilot readback for correctness. Provide structured JSON describing the status.',
    userPrompt: 'Expected items: {{expected_items}}\nPilot said: {{pilot_utterance}}',
    responseFormatText: JSON.stringify({
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'missing', 'incorrect', 'uncertain'] },
        missing: { type: 'array', items: { type: 'string' } },
        incorrect: { type: 'array', items: { type: 'string' } },
        controller_say_tpl: { type: 'string' }
      },
      required: ['status']
    }, null, 2),
    metadataText: '',
    placeholders: [
      {
        key: 'pilot_utterance',
        label: 'Pilot utterance',
        required: true,
        autoFill: {}
      },
      {
        key: 'expected_items',
        label: 'Expected readback items',
        description: 'Comma separated list of required readback tokens',
        required: true,
        autoFill: {}
      }
    ]
  }
]

const availableRoles = [
  { value: 'atc', label: 'ATC' },
  { value: 'pilot', label: 'Pilot' },
  { value: 'system', label: 'System' }
]

const transitionKindOptions: Array<{ value: EditableTransition['kind']; label: string }> = [
  { value: 'next', label: 'Next' },
  { value: 'ok_next', label: 'Positive next' },
  { value: 'bad_next', label: 'Deviation next' },
  { value: 'timer', label: 'Timer' },
  { value: 'auto', label: 'Autopilot' },
  { value: 'interrupt', label: 'Interrupt' },
  { value: 'stack', label: 'Stack push' },
  { value: 'custom', label: 'Custom handler' }
]

const autopModeOptions = [
  { value: 'expression', label: 'Expression' },
  { value: 'threshold', label: 'Threshold' },
  { value: 'delta', label: 'Delta change' }
]

const autopOperatorOptions: Array<{ value: AtcAutopilotCondition['operator']; label: string }> = [
  { value: '>', label: '>' },
  { value: '>=', label: '>=' },
  { value: '<', label: '<' },
  { value: '<=', label: '<=' },
  { value: '==', label: '==' },
  { value: '!=', label: '!=' },
  { value: 'changes', label: 'Changes' },
  { value: 'rises_above', label: 'Rises above' },
  { value: 'drops_below', label: 'Drops below' }
]

const flowSearch = ref('')

const inspectorError = ref<string | null>(null)
const inspectorNotice = ref<string | null>(null)
const savingState = ref(false)
const savingLayout = ref(false)

const deleteDialog = ref(false)
const deleteTargetId = ref<string | null>(null)
const deletingState = ref(false)

const flowSettingsDialog = ref(false)
const flowSettingsForm = reactive({
  name: '',
  description: '',
  schemaVersion: '',
  startState: '',
  endStates: [] as string[],
  roles: [] as string[],
  phases: [] as string[],
  variablesText: '',
  flagsText: '',
  policiesText: '',
  hooksText: '',
  metadataText: ''
})
const flowSettingsError = ref<string | null>(null)
const flowSettingsSaving = ref(false)

const newFlowDialog = ref(false)
const newFlowForm = reactive({
  name: '',
  description: '',
  startState: 'START',
  schemaVersion: '1.0'
})
const newFlowError = ref<string | null>(null)
const creatingFlow = ref(false)

const nodeElements = new Map<string, HTMLElement>()
const positionErrors = reactive<Record<string, string | null>>({})
const savingPositionId = ref<string | null>(null)

const currentFlow = computed(() => flowData.value?.flow ?? null)
const phases = computed(() => currentFlow.value?.phases ?? [])

const flowStats = computed(() => {
  const states = flowStates.value
  const autop = states.filter((state) => state.auto || (state.transitions ?? []).some((t) => t.kind === 'auto')).length
  const llm = states.filter((state) => (state.llmTemplates ?? []).length > 0).length
  return {
    total: states.length,
    autop,
    llm
  }
})

const filteredFlows = computed(() => {
  const term = flowSearch.value.trim().toLowerCase()
  if (!term) return flows.value
  return flows.value.filter((flow) => {
    return [flow.name, flow.description].some((val) => val?.toLowerCase().includes(term))
  })
})

const filteredStates = computed(() => {
  const term = stateSearch.value.trim().toLowerCase()
  return flowStates.value.filter((state) => {
    if (term) {
      const haystack = [state.stateId, state.title, state.sayTpl, state.phase, state.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(term)) {
        return false
      }
    }
    if (laneFilter.value) {
      const lane = state.ui?.lane || state.phase
      if (lane !== laneFilter.value) return false
    }
    if (roleFilter.value && state.role !== roleFilter.value) return false
    if (showAutopilotOnly.value) {
      if (!state.auto && !(state.transitions ?? []).some((t) => t.kind === 'auto')) return false
    }
    return true
  })
})

const visibleStateIds = computed(() => new Set(filteredStates.value.map((state) => state.stateId)))

const laneOptions = computed(() => {
  const lanes = new Set<string>()
  flowStates.value.forEach((state) => {
    if (state.ui?.lane) lanes.add(state.ui.lane)
    if (state.phase) lanes.add(state.phase)
  })
  return Array.from(lanes).sort()
})

const availableStateOptions = computed(() =>
  flowStates.value.map((state) => ({
    value: state.stateId,
    label: `${state.stateId} — ${state.title || state.phase}`
  }))
)

const canvasSize = computed(() => {
  let width = 1400
  let height = 900
  for (const [stateId, pos] of Object.entries(statePositions)) {
    const state = flowStates.value.find((item) => item.stateId === stateId)
    const nodeWidth = state?.ui?.width ?? 320
    const element = nodeElements.get(stateId)
    const nodeHeight = element?.offsetHeight ?? 220
    width = Math.max(width, pos.x + nodeWidth + 320)
    height = Math.max(height, pos.y + nodeHeight + 320)
  }
  return { width, height }
})

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

function cloneDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? null))
}

function safeStringify(value: any, fallback = '') {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return fallback
  }
}

function parseJsonField(label: string, text: string | undefined | null, errors: string[]) {
  if (!text || !text.trim()) return undefined
  try {
    return JSON.parse(text)
  } catch (err: any) {
    errors.push(`${label}: ${err?.message || 'invalid JSON'}`)
    return undefined
  }
}

function ensureStatePosition(state: AtcState, index: number) {
  if (statePositions[state.stateId]) return
  const baseX = typeof state.ui?.x === 'number' ? state.ui.x : 160 + (index % 4) * 360
  const baseY = typeof state.ui?.y === 'number' ? state.ui.y : 140 + Math.floor(index / 4) * 240
  statePositions[state.stateId] = { x: baseX, y: baseY }
}

function updateStatePositionsFromStates(states: AtcState[]) {
  const seen = new Set<string>()
  states.forEach((state, index) => {
    ensureStatePosition(state, index)
    seen.add(state.stateId)
  })
  Object.keys(statePositions).forEach((key) => {
    if (!seen.has(key)) {
      delete statePositions[key]
    }
  })
}

function registerNodeEl(stateId: string, el: Element | null) {
  const htmlEl = el as HTMLElement | null
  if (htmlEl) {
    nodeElements.set(stateId, htmlEl)
  } else {
    nodeElements.delete(stateId)
  }
  nextTick(() => {
    recomputeConnectors()
  })
}

function recomputeConnectors() {
  const segments: ConnectorSegment[] = []
  const states = flowStates.value
  for (const state of states) {
    const fromEl = nodeElements.get(state.stateId)
    if (!fromEl) continue
    const fromPoint = {
      x: fromEl.offsetLeft + fromEl.offsetWidth,
      y: fromEl.offsetTop + fromEl.offsetHeight / 2
    }
    for (const transition of state.transitions ?? []) {
      const toEl = nodeElements.get(transition.to)
      if (!toEl) continue
      segments.push({
        id: `${state.stateId}-${transition.id}`,
        kind: transition.kind,
        label: transition.label,
        from: fromPoint,
        to: {
          x: toEl.offsetLeft,
          y: toEl.offsetTop + toEl.offsetHeight / 2
        }
      })
    }
  }
  connectors.value = segments
}

function nodeStyle(state: AtcState) {
  const position = statePositions[state.stateId] || { x: 0, y: 0 }
  const width = state.ui?.width ?? 320
  return {
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${width}px`
  }
}

function connectorPath(segment: ConnectorSegment) {
  const { from, to } = segment
  const deltaX = Math.max((to.x - from.x) / 2, 60)
  const c1x = from.x + deltaX
  const c2x = to.x - deltaX
  return `M ${from.x} ${from.y} C ${c1x} ${from.y} ${c2x} ${to.y} ${to.x} ${to.y}`
}

function connectorColor(kind: ConnectorSegment['kind']) {
  switch (kind) {
    case 'ok_next':
      return '#22c55e'
    case 'bad_next':
      return '#f97316'
    case 'timer':
      return '#fbbf24'
    case 'auto':
      return '#a855f7'
    case 'interrupt':
      return '#f43f5e'
    case 'stack':
      return '#38bdf8'
    case 'custom':
      return '#94a3b8'
    default:
      return '#38bdf8'
  }
}

function resetInspectorMessages() {
  inspectorError.value = null
  inspectorNotice.value = null
}

function createEditableState(source?: AtcState): EditableStateForm {
  const transitions: EditableTransition[] = (source?.transitions ?? []).map((transition) => {
    const auto = transition.kind === 'auto' && transition.auto
      ? {
          ...cloneDeep(transition.auto),
          updatesText: transition.auto?.updates ? safeStringify(transition.auto.updates) : '',
          flagsText: transition.auto?.flags ? safeStringify(transition.auto.flags) : ''
        }
      : undefined
    return {
      ...cloneDeep(transition),
      timer: transition.timer ? { after_s: transition.timer.after_s } : undefined,
      auto,
      metadataText: transition.metadata ? safeStringify(transition.metadata) : ''
    }
  })

  const templates: EditableTemplate[] = (source?.llmTemplates ?? []).map((tpl) => ({
    ...cloneDeep(tpl),
    placeholders:
      tpl.placeholders?.map((ph) => {
        const placeholder = cloneDeep(ph) as EditablePlaceholder
        placeholder.autoFill = placeholder.autoFill ? { ...placeholder.autoFill } : {}
        return placeholder
      }) ?? [],
    responseFormatText: tpl.responseFormat ? safeStringify(tpl.responseFormat) : '',
    metadataText: tpl.metadata ? safeStringify(tpl.metadata) : ''
  }))

  return reactive({
    stateId: source?.stateId ?? '',
    title: source?.title ?? '',
    role: source?.role ?? 'atc',
    phase: source?.phase ?? (currentFlow.value?.phases?.[0] ?? 'Clearance'),
    sayTpl: source?.sayTpl ?? '',
    utteranceTpl: source?.utteranceTpl ?? '',
    elseSayTpl: source?.elseSayTpl ?? '',
    readbackRequired: source?.readbackRequired ? [...source.readbackRequired] : [],
    auto: source?.auto ?? '',
    actionsText: source?.actions?.length ? safeStringify(source.actions) : '',
    condition: source?.condition ?? '',
    guard: source?.guard ?? '',
    trigger: source?.trigger ?? '',
    frequency: source?.frequency ?? '',
    frequencyName: source?.frequencyName ?? '',
    handoffTo: source?.handoff?.to ?? '',
    handoffFreq: source?.handoff?.freq ?? '',
    transitions,
    llmTemplates: templates,
    metadataText: source?.metadata ? safeStringify(source.metadata) : '',
    notes: source?.notes ?? '',
    ui: {
      lane: source?.ui?.lane ?? '',
      color: source?.ui?.color ?? '',
      icon: source?.ui?.icon ?? '',
      width: source?.ui?.width
    }
  })
}

function selectState(stateId: string | null, options: { center?: boolean } = {}) {
  if (!stateId) {
    selectedStateId.value = null
    editingState.value = null
    editingOriginalStateId.value = null
    isCreatingNewState.value = false
    return
  }

  const state = flowStates.value.find((item) => item.stateId === stateId)
  if (!state) return

  resetInspectorMessages()
  selectedStateId.value = stateId
  editingOriginalStateId.value = state.stateId
  editingState.value = createEditableState(state)
  isCreatingNewState.value = false

  if (options.center) {
    nextTick(() => centerOnState(stateId))
  }
}

function suggestStateId(base = 'STATE') {
  let index = flowStates.value.length + 1
  let candidate = `${base}_${index}`
  const existing = new Set(flowStates.value.map((state) => state.stateId))
  while (existing.has(candidate)) {
    index += 1
    candidate = `${base}_${index}`
  }
  return candidate
}

function startCreateState() {
  resetInspectorMessages()
  const form = createEditableState()
  form.stateId = suggestStateId('NODE')
  form.role = 'atc'
  form.phase = currentFlow.value?.phases?.[0] ?? 'Clearance'
  editingState.value = form
  editingOriginalStateId.value = null
  selectedStateId.value = null
  isCreatingNewState.value = true
}

function duplicateState(stateId: string) {
  const source = flowStates.value.find((state) => state.stateId === stateId)
  if (!source) return
  const form = createEditableState(source)
  form.stateId = suggestStateId(`${source.stateId}_COPY`)
  editingState.value = form
  editingOriginalStateId.value = null
  selectedStateId.value = null
  isCreatingNewState.value = true
  inspectorNotice.value = 'Duplicating state. Adjust the ID and save to create a new node.'
}

function defaultAutopilot(): EditableAutopilot {
  return {
    mode: 'threshold',
    variable: '',
    operator: '>=',
    value: 0,
    allowDuringLLM: true,
    allowDuringPilotSpeech: true,
    allowDuringControllerSpeech: true,
    updatesText: '',
    flagsText: ''
  }
}

function addTransition(kind: EditableTransition['kind'] = 'next') {
  if (!editingState.value) return
  const transition: EditableTransition = {
    id: createId(),
    kind,
    to: '',
    label: '',
    description: '',
    when: '',
    guard: '',
    priority: editingState.value.transitions.length,
    timer: kind === 'timer' ? { after_s: 5 } : undefined,
    auto: kind === 'auto' ? defaultAutopilot() : undefined,
    metadataText: ''
  }
  editingState.value.transitions.push(transition)
}

function removeTransition(index: number) {
  if (!editingState.value) return
  editingState.value.transitions.splice(index, 1)
  editingState.value.transitions.forEach((transition, idx) => {
    transition.priority = idx
  })
}

function moveTransition(index: number, direction: number) {
  if (!editingState.value) return
  const list = editingState.value.transitions
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= list.length) return
  const [item] = list.splice(index, 1)
  list.splice(newIndex, 0, item)
  list.forEach((transition, idx) => {
    transition.priority = idx
  })
}

function onTransitionKindChange(transition: EditableTransition, kind: EditableTransition['kind']) {
  transition.kind = kind
  if (kind === 'timer') {
    transition.timer = transition.timer || { after_s: 5 }
    transition.auto = undefined
  } else if (kind === 'auto') {
    transition.auto = transition.auto || defaultAutopilot()
    transition.timer = undefined
  } else {
    transition.timer = undefined
    transition.auto = undefined
  }
}

function addAutopPreset(preset: AutopilotPreset) {
  if (!editingState.value) return
  const transition: EditableTransition = {
    id: createId(),
    kind: 'auto',
    to: '',
    label: preset.label,
    description: preset.description,
    priority: editingState.value.transitions.length,
    auto: {
      ...defaultAutopilot(),
      mode: 'threshold',
      variable: preset.variable,
      operator: preset.operator,
      value: preset.value,
      description: preset.description ?? '',
      updatesText: '',
      flagsText: ''
    },
    metadataText: ''
  }
  editingState.value.transitions.push(transition)
  inspectorNotice.value = `Autopilot transition “${preset.label}” added – set the target state to finish.`
}

function addTemplatePreset(preset: EditableTemplate) {
  if (!editingState.value) return
  const clone = cloneDeep(preset)
  clone.id = createId()
  clone.placeholders = clone.placeholders
    ? clone.placeholders.map((placeholder) => ({
        ...placeholder,
        autoFill: placeholder.autoFill ? { ...placeholder.autoFill } : {}
      }))
    : []
  editingState.value.llmTemplates.push(clone)
  inspectorNotice.value = `Template preset “${preset.name}” added. Adjust prompts and placeholders as needed.`
}

function addPlaceholder(template: EditableTemplate) {
  template.placeholders.push({
    key: `field_${template.placeholders.length + 1}`,
    label: '',
    description: '',
    example: '',
    required: false,
    autoFill: {}
  })
}

function removePlaceholder(template: EditableTemplate, index: number) {
  template.placeholders.splice(index, 1)
}

function removeTemplate(index: number) {
  if (!editingState.value) return
  editingState.value.llmTemplates.splice(index, 1)
}

function centerOnState(stateId: string) {
  const scrollEl = canvasScrollRef.value
  const nodeEl = nodeElements.get(stateId)
  if (!scrollEl || !nodeEl) return
  const left = nodeEl.offsetLeft - scrollEl.clientWidth / 2 + nodeEl.offsetWidth / 2
  const top = nodeEl.offsetTop - scrollEl.clientHeight / 2 + nodeEl.offsetHeight / 2
  scrollEl.scrollTo({ left, top, behavior: 'smooth' })
}

function autoLayout(groupBy: 'phase' | 'lane' = 'phase') {
  const states = flowStates.value
  if (!states.length) return
  const groups = new Map<string, AtcState[]>()
  states.forEach((state) => {
    const key = groupBy === 'lane' ? state.ui?.lane || state.phase || 'General' : state.phase || 'General'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(state)
  })
  const keys = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b))
  const columnWidth = 360
  const rowHeight = 240
  keys.forEach((key, column) => {
    const items = groups.get(key) || []
    items.sort((a, b) => {
      const ay = statePositions[a.stateId]?.y ?? 0
      const by = statePositions[b.stateId]?.y ?? 0
      return ay - by
    })
    items.forEach((state, row) => {
      statePositions[state.stateId] = {
        x: 160 + column * columnWidth,
        y: 140 + row * rowHeight
      }
    })
  })
  nextTick(() => recomputeConnectors())
}

async function persistNodePosition(stateId: string) {
  if (!activeFlowId.value) return
  const position = statePositions[stateId]
  if (!position) return
  savingPositionId.value = stateId
  positionErrors[stateId] = null
  try {
    await api.request(`/api/admin/atc/flows/${encodeURIComponent(activeFlowId.value)}/states/${encodeURIComponent(stateId)}/ui`, {
      method: 'PATCH',
      body: { x: position.x, y: position.y }
    })
    const state = flowStates.value.find((item) => item.stateId === stateId)
    if (state) {
      state.ui = { ...(state.ui || {}), x: position.x, y: position.y }
    }
  } catch (err: any) {
    positionErrors[stateId] = err?.data?.message || err?.message || 'Failed to persist position'
  } finally {
    savingPositionId.value = null
  }
}

async function persistLayoutForVisible() {
  if (!activeFlowId.value) return
  savingLayout.value = true
  try {
    for (const state of flowStates.value) {
      await persistNodePosition(state.stateId)
    }
    inspectorNotice.value = 'State positions saved to the database.'
  } finally {
    savingLayout.value = false
  }
}

function onNodePointerDown(event: PointerEvent, stateId: string) {
  const position = statePositions[stateId] || { x: 0, y: 0 }
  dragging.id = stateId
  dragging.pointerId = event.pointerId
  dragging.originX = position.x
  dragging.originY = position.y
  dragging.startX = event.clientX
  dragging.startY = event.clientY
  const target = event.currentTarget as HTMLElement
  try {
    target.setPointerCapture(event.pointerId)
  } catch {
    /* noop */
  }
  event.preventDefault()
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.id) return
  const dx = event.clientX - dragging.startX
  const dy = event.clientY - dragging.startY
  let x = dragging.originX + dx
  let y = dragging.originY + dy
  if (snapToGrid.value) {
    x = Math.round(x / gridSize) * gridSize
    y = Math.round(y / gridSize) * gridSize
  }
  statePositions[dragging.id] = { x, y }
  requestAnimationFrame(() => recomputeConnectors())
}

function onPointerUp(event: PointerEvent) {
  if (!dragging.id || event.pointerId !== dragging.pointerId) return
  const stateId = dragging.id
  dragging.id = null
  nextTick(() => {
    void persistNodePosition(stateId)
  })
}

function formatRelativeTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const diffMs = Date.now() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  if (diffSeconds < 60) return `${diffSeconds}s ago`
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 5) return `${diffWeeks}w ago`
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `${diffMonths}mo ago`
  const diffYears = Math.floor(diffDays / 365)
  return `${diffYears}y ago`
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

function buildAutopilotPayload(transition: EditableTransition, index: number, errors: string[]) {
  const auto = transition.auto
  if (!auto) {
    errors.push(`Transition ${index + 1}: autopilot configuration missing`)
    return undefined
  }
  const payload: Record<string, any> = {}
  if (auto.mode) payload.mode = auto.mode
  if (auto.expression) payload.expression = auto.expression
  if (auto.variable) payload.variable = auto.variable
  if (auto.operator) payload.operator = auto.operator
  if (auto.value !== undefined && auto.value !== null) payload.value = auto.value
  if (auto.secondValue !== undefined && auto.secondValue !== null) payload.secondValue = auto.secondValue
  if (auto.unit) payload.unit = auto.unit
  if (auto.holdForMs !== undefined && auto.holdForMs !== null) payload.holdForMs = Number(auto.holdForMs) || 0
  if (auto.sampleWindowMs !== undefined && auto.sampleWindowMs !== null) payload.sampleWindowMs = Number(auto.sampleWindowMs) || 0
  if (auto.description) payload.description = auto.description
  if (auto.controllerSayTpl) payload.controllerSayTpl = auto.controllerSayTpl
  payload.allowDuringLLM = auto.allowDuringLLM !== false
  payload.allowDuringPilotSpeech = auto.allowDuringPilotSpeech !== false
  payload.allowDuringControllerSpeech = auto.allowDuringControllerSpeech !== false
  const updates = parseJsonField(`Transition ${index + 1} autopilot updates`, auto.updatesText, errors)
  if (updates !== undefined) payload.updates = updates
  const flags = parseJsonField(`Transition ${index + 1} autopilot flags`, auto.flagsText, errors)
  if (flags !== undefined) payload.flags = flags
  return payload
}

function buildStatePayload(form: EditableStateForm) {
  const errors: string[] = []
  const stateId = form.stateId.trim()
  if (!stateId) errors.push('State ID is required')
  if (!form.role) errors.push('Role is required')
  if (!form.phase) errors.push('Phase is required')

  const payload: Record<string, any> = {
    stateId,
    role: form.role,
    phase: form.phase,
    title: form.title?.trim() || undefined,
    sayTpl: form.sayTpl?.trim() || undefined,
    utteranceTpl: form.utteranceTpl?.trim() || undefined,
    elseSayTpl: form.elseSayTpl?.trim() || undefined,
    auto: form.auto?.trim() || undefined,
    condition: form.condition?.trim() || undefined,
    guard: form.guard?.trim() || undefined,
    trigger: form.trigger?.trim() || undefined,
    frequency: form.frequency?.trim() || undefined,
    frequencyName: form.frequencyName?.trim() || undefined,
    notes: form.notes?.trim() || undefined
  }

  payload.readbackRequired = form.readbackRequired
    .map((value) => value?.trim())
    .filter((value) => Boolean(value))

  if (form.handoffTo?.trim()) {
    payload.handoff = {
      to: form.handoffTo.trim(),
      freq: form.handoffFreq?.trim() || undefined
    }
  }

  const actions = parseJsonField('Actions', form.actionsText, errors)
  if (actions !== undefined) payload.actions = actions

  const metadata = parseJsonField('State metadata', form.metadataText, errors)
  if (metadata !== undefined) payload.metadata = metadata

  if (form.ui.lane || form.ui.color || form.ui.icon || form.ui.width !== undefined) {
    const ui: Record<string, any> = {}
    if (form.ui.lane?.trim()) ui.lane = form.ui.lane.trim()
    if (form.ui.color?.trim()) ui.color = form.ui.color.trim()
    if (form.ui.icon?.trim()) ui.icon = form.ui.icon.trim()
    if (typeof form.ui.width === 'number' && Number.isFinite(form.ui.width)) ui.width = form.ui.width
    payload.ui = ui
  }

  payload.transitions = form.transitions.map((transition, index) => {
    const to = transition.to?.trim()
    if (!to) {
      errors.push(`Transition ${index + 1} is missing a target state`)
    }
    const base: Record<string, any> = {
      id: transition.id || createId(),
      kind: transition.kind || 'next',
      to: to || '',
      label: transition.label?.trim() || undefined,
      description: transition.description?.trim() || undefined,
      when: transition.when?.trim() || undefined,
      guard: transition.guard?.trim() || undefined,
      priority: typeof transition.priority === 'number' ? transition.priority : index
    }
    if (transition.kind === 'timer') {
      base.timer = { after_s: Number(transition.timer?.after_s ?? 0) }
    }
    if (transition.kind === 'auto') {
      base.auto = buildAutopilotPayload(transition, index, errors)
    }
    const metadataText = transition.metadataText
    if (metadataText) {
      const parsed = parseJsonField(`Transition ${index + 1} metadata`, metadataText, errors)
      if (parsed !== undefined) base.metadata = parsed
    }
    return base
  })

  payload.llmTemplates = form.llmTemplates
    .map((tpl, index) => {
      const name = tpl.name?.trim()
      if (!name) {
        errors.push(`Template ${index + 1} requires a name`)
        return null
      }
      const result: Record<string, any> = {
        id: tpl.id || createId(),
        name,
        description: tpl.description?.trim() || undefined,
        systemPrompt: tpl.systemPrompt?.trim() || undefined,
        userPrompt: tpl.userPrompt?.trim() || undefined,
        sampleResponse: tpl.sampleResponse?.trim() || undefined,
        hints: tpl.hints?.trim() || undefined,
        autoApplyWhen: tpl.autoApplyWhen?.trim() || undefined
      }
      const responseFormat = parseJsonField(`Template ${name} response format`, tpl.responseFormatText, errors)
      if (responseFormat !== undefined) result.responseFormat = responseFormat
      const metadata = parseJsonField(`Template ${name} metadata`, tpl.metadataText, errors)
      if (metadata !== undefined) result.metadata = metadata
      result.placeholders = tpl.placeholders
        .map((placeholder) => {
          const key = placeholder.key?.trim()
          if (!key) return null
          const entry: Record<string, any> = {
            key,
            label: placeholder.label?.trim() || undefined,
            description: placeholder.description?.trim() || undefined,
            example: placeholder.example?.trim() || undefined,
            required: placeholder.required || false
          }
          if (placeholder.defaultValue !== undefined) {
            entry.defaultValue = placeholder.defaultValue
          }
          if (placeholder.autoFill) {
            const autoFill = { ...placeholder.autoFill }
            if (!autoFill.source && !autoFill.path && !autoFill.literal && !autoFill.expression) {
              entry.autoFill = undefined
            } else {
              entry.autoFill = autoFill
            }
          }
          return entry
        })
        .filter(Boolean)
      return result
    })
    .filter(Boolean)

  if (errors.length) {
    throw new Error(errors.join('\n'))
  }

  return payload
}

function mergeState(updated: AtcState, originalId?: string | null) {
  const list = [...flowStates.value]
  const identifier = originalId || updated.stateId
  const index = list.findIndex((state) => state.stateId === identifier)
  if (index >= 0) {
    list.splice(index, 1, updated)
  } else {
    list.push(updated)
  }
  if (originalId && originalId !== updated.stateId) {
    const duplicateIndex = list.findIndex((state, idx) => state.stateId === updated.stateId && idx !== index)
    if (duplicateIndex >= 0) {
      list.splice(duplicateIndex, 1)
    }
  }
  flowStates.value = list
  if (flowData.value) {
    flowData.value = { flow: flowData.value.flow, states: list }
  }
  ensureStatePosition(updated, list.findIndex((state) => state.stateId === updated.stateId))
  nextTick(() => {
    recomputeConnectors()
  })
}

function removeStateLocally(stateId: string) {
  const list = flowStates.value.filter((state) => state.stateId !== stateId)
  flowStates.value = list
  if (flowData.value) {
    flowData.value = { flow: flowData.value.flow, states: list }
  }
  delete statePositions[stateId]
  nextTick(() => recomputeConnectors())
}

function applyFlowData(data: FlowWithStates) {
  flowData.value = data
  flowStates.value = data.states
  updateStatePositionsFromStates(data.states)
  nextTick(() => {
    recomputeConnectors()
  })
}

async function saveState() {
  if (!editingState.value || !activeFlowId.value) return
  resetInspectorMessages()
  let payload: any
  try {
    payload = buildStatePayload(editingState.value)
  } catch (err: any) {
    inspectorError.value = err?.message || 'Please resolve validation errors before saving.'
    return
  }

  savingState.value = true
  try {
    let result: AtcState
    if (isCreatingNewState.value || !editingOriginalStateId.value) {
      result = await api.post(`/api/admin/atc/flows/${encodeURIComponent(activeFlowId.value)}/states`, payload)
    } else {
      result = await api.put(
        `/api/admin/atc/flows/${encodeURIComponent(activeFlowId.value)}/states/${encodeURIComponent(editingOriginalStateId.value)}`,
        payload
      )
    }
    mergeState(result, editingOriginalStateId.value || payload.stateId)
    editingState.value = createEditableState(result)
    editingOriginalStateId.value = result.stateId
    selectedStateId.value = result.stateId
    isCreatingNewState.value = false
    inspectorNotice.value = 'State saved successfully.'
  } catch (err: any) {
    inspectorError.value = err?.data?.message || err?.message || 'Saving state failed.'
  } finally {
    savingState.value = false
  }
}

async function deleteState(stateId: string) {
  if (!activeFlowId.value) return
  resetInspectorMessages()
  try {
    await api.del(`/api/admin/atc/flows/${encodeURIComponent(activeFlowId.value)}/states/${encodeURIComponent(stateId)}`)
    removeStateLocally(stateId)
    inspectorNotice.value = `State ${stateId} deleted.`
    if (selectedStateId.value === stateId) {
      selectedStateId.value = null
      editingState.value = null
      editingOriginalStateId.value = null
      isCreatingNewState.value = false
    }
  } catch (err: any) {
    inspectorError.value = err?.data?.message || err?.message || 'Failed to delete state.'
  }
}

async function confirmDeleteState() {
  if (!deleteTargetId.value) return
  deletingState.value = true
  try {
    await deleteState(deleteTargetId.value)
    deleteDialog.value = false
    deleteTargetId.value = null
  } finally {
    deletingState.value = false
  }
}

async function loadFlows() {
  flowsLoading.value = true
  flowsError.value = null
  try {
    const result = await api.get<FlowSummary[]>('/api/admin/atc/flows')
    flows.value = result
    if (!activeFlowId.value && result.length) {
      const preferred = result.find((flow) => flow.name === 'icao_atc_decision_tree') || result[0]
      await openFlow(preferred.id)
    }
  } catch (err: any) {
    flowsError.value = err?.data?.message || err?.message || 'Failed to load flows.'
  } finally {
    flowsLoading.value = false
  }
}

async function openFlow(flowId: string, options: { force?: boolean } = {}) {
  if (!flowId) return
  if (!options.force && flowId === activeFlowId.value && flowData.value) return

  flowLoading.value = true
  flowError.value = null
  try {
    const result = await api.get<FlowWithStates>(`/api/admin/atc/flows/${encodeURIComponent(flowId)}`, {
      query: { states: 1 }
    })
    activeFlowId.value = result.flow.id
    applyFlowData(result)
    const targetState = result.flow.startState || result.states[0]?.stateId || null
    if (targetState) {
      selectState(targetState, { center: true })
    } else {
      selectState(null)
    }
  } catch (err: any) {
    flowError.value = err?.data?.message || err?.message || 'Failed to load flow.'
  } finally {
    flowLoading.value = false
  }
}

async function refreshAll() {
  await Promise.all([
    loadFlows(),
    activeFlowId.value ? openFlow(activeFlowId.value, { force: true }) : Promise.resolve()
  ])
}

function prepareFlowSettingsForm() {
  const flow = currentFlow.value
  if (!flow) return
  flowSettingsForm.name = flow.name
  flowSettingsForm.description = flow.description || ''
  flowSettingsForm.schemaVersion = flow.schemaVersion || '1.0'
  flowSettingsForm.startState = flow.startState
  flowSettingsForm.endStates = [...(flow.endStates || [])]
  flowSettingsForm.roles = [...(flow.roles || [])]
  flowSettingsForm.phases = [...(flow.phases || [])]
  flowSettingsForm.variablesText = safeStringify(flow.variables || {})
  flowSettingsForm.flagsText = safeStringify(flow.flags || {})
  flowSettingsForm.policiesText = safeStringify(flow.policies || {})
  flowSettingsForm.hooksText = safeStringify(flow.hooks || {})
  flowSettingsForm.metadataText = flow.metadata ? safeStringify(flow.metadata) : ''
  flowSettingsError.value = null
}

function openFlowSettings() {
  if (!currentFlow.value) return
  prepareFlowSettingsForm()
  flowSettingsDialog.value = true
}

async function saveFlowSettings() {
  if (!currentFlow.value || !activeFlowId.value) return
  flowSettingsError.value = null
  const payload: Record<string, any> = {}

  if (flowSettingsForm.name.trim() && flowSettingsForm.name.trim() !== currentFlow.value.name) {
    payload.name = flowSettingsForm.name.trim()
  }
  if (flowSettingsForm.description !== (currentFlow.value.description || '')) {
    payload.description = flowSettingsForm.description || null
  }
  if (flowSettingsForm.schemaVersion.trim() && flowSettingsForm.schemaVersion.trim() !== (currentFlow.value.schemaVersion || '')) {
    payload.schemaVersion = flowSettingsForm.schemaVersion.trim()
  }
  if (flowSettingsForm.startState.trim() && flowSettingsForm.startState.trim() !== currentFlow.value.startState) {
    payload.startState = flowSettingsForm.startState.trim()
  }
  payload.endStates = flowSettingsForm.endStates.filter(Boolean)
  payload.roles = flowSettingsForm.roles.filter(Boolean)
  payload.phases = flowSettingsForm.phases.filter(Boolean)

  const errors: string[] = []
  const variables = parseJsonField('Variables', flowSettingsForm.variablesText, errors)
  if (variables !== undefined) payload.variables = variables
  const flags = parseJsonField('Flags', flowSettingsForm.flagsText, errors)
  if (flags !== undefined) payload.flags = flags
  const policies = parseJsonField('Policies', flowSettingsForm.policiesText, errors)
  if (policies !== undefined) payload.policies = policies
  const hooks = parseJsonField('Hooks', flowSettingsForm.hooksText, errors)
  if (hooks !== undefined) payload.hooks = hooks
  const metadata = parseJsonField('Metadata', flowSettingsForm.metadataText, errors)
  if (metadata !== undefined) payload.metadata = metadata

  if (errors.length) {
    flowSettingsError.value = errors.join('\n')
    return
  }

  flowSettingsSaving.value = true
  try {
    const result = await api.put(`/api/admin/atc/flows/${encodeURIComponent(activeFlowId.value)}`, payload)
    if (flowData.value) {
      flowData.value = { flow: result as any, states: flowData.value.states }
    }
    flowSettingsDialog.value = false
    await loadFlows()
    inspectorNotice.value = 'Flow settings updated.'
  } catch (err: any) {
    flowSettingsError.value = err?.data?.message || err?.message || 'Failed to save flow settings.'
  } finally {
    flowSettingsSaving.value = false
  }
}

function resetNewFlowForm() {
  newFlowForm.name = ''
  newFlowForm.description = ''
  newFlowForm.startState = 'START'
  newFlowForm.schemaVersion = '1.0'
  newFlowError.value = null
}

async function createFlow() {
  if (creatingFlow.value) return
  newFlowError.value = null
  const name = newFlowForm.name.trim()
  const startState = newFlowForm.startState.trim()
  if (!name || !startState) {
    newFlowError.value = 'Name and start state are required.'
    return
  }
  creatingFlow.value = true
  try {
    const result = await api.post<AtcFlow>('/api/admin/atc/flows', {
      name,
      description: newFlowForm.description?.trim() || undefined,
      startState,
      schemaVersion: newFlowForm.schemaVersion?.trim() || '1.0'
    })
    newFlowDialog.value = false
    resetNewFlowForm()
    await loadFlows()
    await openFlow(result.id, { force: true })
    inspectorNotice.value = `Flow “${result.name}” created.`
  } catch (err: any) {
    newFlowError.value = err?.data?.message || err?.message || 'Failed to create flow.'
  } finally {
    creatingFlow.value = false
  }
}

watch(flowStates, (states) => {
  updateStatePositionsFromStates(states)
  if (selectedStateId.value && !states.some((state) => state.stateId === selectedStateId.value)) {
    selectState(null)
  }
}, { deep: true })

watch(statePositions, () => {
  nextTick(() => recomputeConnectors())
}, { deep: true })

onMounted(() => {
  loadFlows()
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
})

</script>

<style scoped>
</style>
