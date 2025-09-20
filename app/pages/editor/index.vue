<template>
  <div class="min-h-screen bg-[#050910] text-white">
    <div class="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
      <header class="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-3">
          <p class="text-xs uppercase tracking-[0.4em] text-cyan-300/70">Decision Engine</p>
          <h1 class="text-3xl font-semibold">ATC Flow Editor</h1>
          <p class="max-w-xl text-sm text-white/70">
            Craft, debug and publish the full ATC decision tree with instant feedback. Drag nodes, wire transitions and enrich
            LLM templates without leaving the browser.
          </p>
          <div v-if="tree" class="flex flex-wrap gap-4 text-xs text-white/50">
            <span>Schema {{ tree.schema_version }}</span>
            <span>Start state <strong class="font-mono text-white">{{ tree.start_state }}</strong></span>
            <span>States {{ Object.keys(tree.states || {}).length }}</span>
            <span v-if="tree.updatedAt">Updated {{ formatRelativeTime(tree.updatedAt) }}</span>
          </div>
        </div>
        <div class="flex flex-col gap-4">
          <div class="flex flex-wrap gap-3">
            <input
              v-model="searchTerm"
              type="search"
              placeholder="Search state or template"
              class="w-64 rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
            />
            <select
              v-model="newNodeRole"
              class="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
            >
              <option value="atc">New ATC node</option>
              <option value="pilot">New pilot node</option>
              <option value="system">New system node</option>
            </select>
            <button
              class="rounded-2xl border border-cyan-400/60 px-4 py-2 text-sm text-cyan-200 transition hover:border-cyan-300 hover:text-white disabled:opacity-50"
              :disabled="loadingTree || !tree"
              @click="createNode"
            >
              Add node
            </button>
          </div>
          <div class="flex flex-wrap gap-3 text-sm">
            <button
              class="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 transition hover:border-cyan-400 hover:text-cyan-200 disabled:opacity-50"
              :disabled="loadingTree"
              @click="refreshTree"
            >
              <span v-if="loadingTree">Refreshing…</span>
              <span v-else>Refresh tree</span>
            </button>
            <button
              class="rounded-2xl border border-purple-400/60 bg-purple-500/10 px-4 py-2 transition hover:border-purple-300 hover:text-purple-100 disabled:opacity-60"
              :disabled="importRunning"
              @click="triggerImport"
            >
              <span v-if="importRunning">Importing…</span>
              <span v-else>Import from source file</span>
            </button>
            <span v-if="saveError" class="self-center text-xs text-rose-300">{{ saveError }}</span>
            <span v-else-if="saveStatus === 'saved'" class="self-center text-xs text-emerald-300">Node saved</span>
          </div>
        </div>
      </header>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div ref="canvasWrapperRef" class="relative h-[720px] overflow-auto">
            <div ref="canvasRef" class="relative min-h-[1200px] min-w-[1600px]">
              <svg class="pointer-events-none absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" fill="currentColor">
                    <path d="M0,0 L6,3 L0,6 z" />
                  </marker>
                </defs>
                <g>
                  <path
                    v-for="connection in connections"
                    :key="connection.id"
                    :d="connection.path"
                    fill="none"
                    :stroke="connectionColor(connection.type)"
                    stroke-width="2"
                    marker-end="url(#arrowhead)"
                    class="opacity-70"
                  />
                </g>
              </svg>
              <div
                v-for="node in nodes"
                :key="node.id"
                :ref="el => registerNodeRef(node.id, el)"
                :style="nodeStyle(node)"
                class="absolute w-64 cursor-pointer rounded-2xl border bg-black/60 p-4 shadow-lg transition"
                :class="[
                  selectedNodeId === node.id ? 'border-cyan-400/70 shadow-cyan-500/30' : 'border-white/10 shadow-black/40',
                  isNodeHighlighted(node.id) ? 'opacity-100' : 'opacity-40',
                ]"
                @click.stop="selectNode(node.id)"
              >
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="text-xs uppercase tracking-[0.3em] text-white/40">{{ node.role }}</p>
                    <h3 class="text-lg font-semibold leading-tight">{{ node.state.label || node.id }}</h3>
                    <p class="text-xs text-white/40">{{ node.id }}</p>
                  </div>
                  <span class="rounded-full px-2 py-1 text-xs font-medium" :style="{ backgroundColor: roleBadge(node.role) }">
                    {{ node.state.phase }}
                  </span>
                </div>
                <div class="mt-3 space-y-2 text-xs text-white/60">
                  <p v-if="node.state.say_tpl" class="line-clamp-2 font-mono text-[11px] text-cyan-200/80">
                    {{ node.state.say_tpl }}
                  </p>
                  <p v-if="node.state.utterance_tpl" class="line-clamp-2 font-mono text-[11px] text-emerald-200/70">
                    {{ node.state.utterance_tpl }}
                  </p>
                  <div class="flex flex-wrap gap-2 text-[11px]">
                    <span v-if="node.state.next?.length" class="rounded-full bg-cyan-500/20 px-2 py-[2px] text-cyan-200/80">
                      {{ node.state.next.length }} next
                    </span>
                    <span v-if="node.state.auto_transitions?.length" class="rounded-full bg-purple-500/20 px-2 py-[2px] text-purple-200/80">
                      {{ node.state.auto_transitions.length }} auto
                    </span>
                    <span v-if="node.state.readback_required?.length" class="rounded-full bg-amber-500/20 px-2 py-[2px] text-amber-200/80">
                      Readback
                    </span>
                  </div>
                </div>
                <div
                  class="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60"
                  @pointerdown.stop.prevent="beginDrag($event, node)"
                >
                  <span class="font-mono">{{ Math.round(node.layout.x) }}, {{ Math.round(node.layout.y) }}</span>
                  <span class="cursor-grab text-white/50">Drag</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside class="flex h-full flex-col gap-4">
          <div v-if="tree && selectedNode && editableNode" class="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-xs uppercase tracking-[0.3em] text-white/40">Node inspector</p>
                <h2 class="text-xl font-semibold">{{ editableNode.label || selectedNode.id }}</h2>
                <p class="text-xs text-white/40">{{ selectedNode.id }}</p>
              </div>
              <div class="flex gap-2">
                <button
                  class="rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-xs transition hover:border-rose-400 hover:text-rose-200"
                  @click="deleteNode"
                >
                  Delete
                </button>
                <button
                  class="rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-xs transition hover:border-white/40"
                  @click="duplicateNode"
                >
                  Duplicate
                </button>
              </div>
            </div>

            <div class="grid gap-3">
              <label class="text-xs uppercase tracking-[0.3em] text-white/40">Label</label>
              <input
                v-model="editableNode.label"
                type="text"
                placeholder="Readable node name"
                class="rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
              />
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs uppercase tracking-[0.3em] text-white/40">Role</label>
                  <select
                    v-model="editableNode.role"
                    class="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
                  >
                    <option value="pilot">Pilot</option>
                    <option value="atc">ATC</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs uppercase tracking-[0.3em] text-white/40">Phase</label>
                  <select
                    v-model="editableNode.phase"
                    class="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
                  >
                    <option v-for="phase in phaseOptions" :key="phase" :value="phase">{{ phase }}</option>
                  </select>
                </div>
              </div>
              <div class="grid gap-2">
                <label class="text-xs uppercase tracking-[0.3em] text-white/40">Controller say template</label>
                <textarea
                  v-model="editableNode.say_tpl"
                  rows="3"
                  placeholder="{callsign}, cleared to …"
                  class="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white/90 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
                />
              </div>
              <div class="grid gap-2">
                <label class="text-xs uppercase tracking-[0.3em] text-white/40">Pilot utterance template</label>
                <textarea
                  v-model="editableNode.utterance_tpl"
                  rows="3"
                  placeholder="{callsign}, ready for push…"
                  class="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white/90 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
                />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs uppercase tracking-[0.3em] text-white/40">Auto</label>
                  <input
                    v-model="editableNode.auto"
                    type="text"
                    placeholder="check_readback"
                    class="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
                  />
                </div>
                <div>
                  <label class="text-xs uppercase tracking-[0.3em] text-white/40">Trigger</label>
                  <input
                    v-model="editableNode.trigger"
                    type="text"
                    placeholder="no_reply"
                    class="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
                  />
                </div>
              </div>
              <div class="grid gap-2">
                <label class="text-xs uppercase tracking-[0.3em] text-white/40">Guard expression</label>
                <input
                  v-model="editableNode.guard"
                  type="text"
                  placeholder="variables.cleared === true"
                  class="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
                />
              </div>

              <section class="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-white/80">Transitions</h3>
                  <div class="flex gap-2 text-xs">
                    <button class="rounded-lg border border-white/10 px-2 py-1 hover:border-cyan-400" @click="addTransition('next')">
                      + Next
                    </button>
                    <button class="rounded-lg border border-white/10 px-2 py-1 hover:border-emerald-400" @click="addTransition('ok_next')">
                      + OK
                    </button>
                    <button class="rounded-lg border border-white/10 px-2 py-1 hover;border-rose-400" @click="addTransition('bad_next')">
                      + Bad
                    </button>
                  </div>
                </div>
                <div class="space-y-3">
                  <div v-for="(transition, index) in editableNode.next" :key="`next-${index}`" class="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-xs">
                    <div class="flex gap-2">
                      <input v-model="transition.to" placeholder="Target state" class="w-full rounded-lg bg-black/40 px-2 py-1 font-mono" />
                      <button class="rounded-lg bg-black/40 px-2" @click="removeTransition('next', index)">×</button>
                    </div>
                    <input
                      v-model="transition.when"
                      placeholder="Condition (optional)"
                      class="mt-2 w-full rounded-lg bg-black/40 px-2 py-1 font-mono"
                    />
                    <input v-model="transition.label" placeholder="Label" class="mt-2 w-full rounded-lg bg-black/40 px-2 py-1" />
                  </div>
                  <div v-for="(transition, index) in editableNode.ok_next" :key="`ok-${index}`" class="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs">
                    <div class="flex gap-2">
                      <input v-model="transition.to" placeholder="OK target" class="w-full rounded-lg bg-black/40 px-2 py-1 font-mono" />
                      <button class="rounded-lg bg-black/40 px-2" @click="removeTransition('ok_next', index)">×</button>
                    </div>
                    <input v-model="transition.label" placeholder="Label" class="mt-2 w-full rounded-lg bg-black/40 px-2 py-1" />
                  </div>
                  <div v-for="(transition, index) in editableNode.bad_next" :key="`bad-${index}`" class="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-xs">
                    <div class="flex gap-2">
                      <input v-model="transition.to" placeholder="Bad target" class="w-full rounded-lg bg-black/40 px-2 py-1 font-mono" />
                      <button class="rounded-lg bg-black/40 px-2" @click="removeTransition('bad_next', index)">×</button>
                    </div>
                    <input v-model="transition.label" placeholder="Label" class="mt-2 w-full rounded-lg bg-black/40 px-2 py-1" />
                  </div>
                  <div class="space-y-3">
                    <div class="flex items-center justify-between text-xs">
                      <h4 class="font-semibold text-white/70">Timer transitions</h4>
                      <button class="rounded-lg border border-white/10 px-2 py-1 hover:border-amber-400" @click="addTimerTransition">+ Timer</button>
                    </div>
                    <div v-for="(transition, index) in editableNode.timer_next" :key="`timer-${index}`" class="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs">
                      <div class="flex gap-2">
                        <input
                          v-model.number="transition.after_s"
                          type="number"
                          placeholder="After seconds"
                          class="w-20 rounded-lg bg-black/40 px-2 py-1 text-right"
                        />
                        <input v-model="transition.to" placeholder="Target" class="w-full rounded-lg bg-black/40 px-2 py-1 font-mono" />
                        <button class="rounded-lg bg-black/40 px-2" @click="removeTimerTransition(index)">×</button>
                      </div>
                      <input v-model="transition.label" placeholder="Label" class="mt-2 w-full rounded-lg bg-black/40 px-2 py-1" />
                    </div>
                  </div>
                </div>
              </section>

              <section class="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-white/80">Actions</h3>
                  <div class="flex gap-2 text-xs">
                    <button class="rounded-lg border border-white/10 px-2 py-1 hover:border-sky-400" @click="addActionObject">+ Rule</button>
                    <button class="rounded-lg border border-white/10 px-2 py-1 hover;border-sky-400" @click="addActionKeyword">+ Keyword</button>
                  </div>
                </div>
                <div v-if="!editableNode.actions || !editableNode.actions.length" class="text-xs text-white/40">No actions</div>
                <div v-for="(action, index) in editableNode.actions" :key="`action-${index}`" class="rounded-xl border border-white/10 bg-black/40 p-3 text-xs">
                  <template v-if="typeof action === 'string'">
                    <div class="flex items-center gap-2">
                      <input v-model="editableNode.actions[index]" placeholder="Action keyword" class="w-full rounded-lg bg-black/60 px-2 py-1 font-mono" />
                      <button class="rounded-lg bg-black/60 px-2" @click="removeAction(index)">×</button>
                    </div>
                  </template>
                  <template v-else>
                    <div class="flex gap-2">
                      <input v-model="action.set" placeholder="flags.current_unit" class="w-full rounded-lg bg-black/60 px-2 py-1 font-mono" />
                      <button class="rounded-lg bg-black/60 px-2" @click="removeAction(index)">×</button>
                    </div>
                    <input v-model="action.to" placeholder="APP" class="mt-2 w-full rounded-lg bg-black/60 px-2 py-1 font-mono" />
                    <input v-model="action.if" placeholder="Condition (optional)" class="mt-2 w-full rounded-lg bg-black/60 px-2 py-1 font-mono" />
                  </template>
                </div>
              </section>

              <section class="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <h3 class="text-sm font-semibold text-white/80">Auto transitions</h3>
                    <p class="text-xs text-white/40">Define telemetry triggers or expressions to skip LLM calls.</p>
                  </div>
                  <button class="rounded-lg border border-white/10 px-2 py-1 text-xs hover:border-purple-400" @click="addAutoTransition">
                    + Auto
                  </button>
                </div>
                <div v-if="!editableNode.auto_transitions || !editableNode.auto_transitions.length" class="text-xs text-white/40">
                  No automatic transitions defined.
                </div>
                <div
                  v-for="(auto, index) in editableNode.auto_transitions"
                  :key="`auto-${auto.id || index}`"
                  class="space-y-3 rounded-xl border border-purple-400/30 bg-purple-500/10 p-3 text-xs"
                >
                  <div class="flex gap-2">
                    <input v-model="auto.label" placeholder="Label" class="w-full rounded-lg bg-black/40 px-2 py-1" />
                    <button class="rounded-lg bg-black/40 px-2" @click="removeAutoTransition(index)">×</button>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <input v-model="auto.to" placeholder="Target state" class="rounded-lg bg-black/40 px-2 py-1 font-mono" />
                    <input v-model.number="auto.priority" type="number" placeholder="Priority" class="rounded-lg bg-black/40 px-2 py-1" />
                  </div>
                  <select v-model="auto.conditionType" class="w-full rounded-lg bg-black/40 px-2 py-1">
                    <option value="expression">Expression</option>
                    <option value="telemetry">Telemetry</option>
                  </select>
                  <div v-if="auto.conditionType === 'telemetry'" class="grid grid-cols-3 gap-2">
                    <select v-model="auto.telemetryKey" class="rounded-lg bg-black/40 px-2 py-1">
                      <option value="altitude_ft">Altitude ft</option>
                      <option value="speed_kt">Speed kt</option>
                      <option value="vertical_speed_fpm">Vertical speed</option>
                      <option value="latitude">Latitude</option>
                      <option value="longitude">Longitude</option>
                    </select>
                    <select v-model="auto.comparator" class="rounded-lg bg-black/40 px-2 py-1">
                      <option value=">">&gt;</option>
                      <option value=">=">≥</option>
                      <option value="<">&lt;</option>
                      <option value="<=">≤</option>
                      <option value="===">=</option>
                      <option value="!==">≠</option>
                    </select>
                    <input v-model.number="auto.value" type="number" placeholder="Value" class="rounded-lg bg-black/40 px-2 py-1" />
                  </div>
                  <div v-else class="space-y-2">
                    <textarea
                      v-model="auto.expression"
                      rows="2"
                      placeholder="flags.in_air && variables.altitude_ft > 200"
                      class="w-full rounded-lg bg-black/40 px-2 py-1 font-mono"
                    />
                    <div class="flex flex-wrap gap-2 text-[11px]">
                      <button class="rounded-lg border border-purple-300/40 px-2 py-1 hover:border-purple-200" @click="applyAutoPreset(auto, 'altitude')">
                        Altitude &gt; 200
                      </button>
                      <button class="rounded-lg border border-purple-300/40 px-2 py-1 hover:border-purple-200" @click="applyAutoPreset(auto, 'speed')">
                        Speed &lt; 60
                      </button>
                      <button class="rounded-lg border border-purple-300/40 px-2 py-1 hover:border-purple-200" @click="applyAutoPreset(auto, 'gear')">
                        flags.gear_down === true
                      </button>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-3">
                    <label class="flex items-center gap-1">
                      <input type="checkbox" value="state-entry" v-model="auto.runOn" />
                      <span>On entry</span>
                    </label>
                    <label class="flex items-center gap-1">
                      <input type="checkbox" value="telemetry-update" v-model="auto.runOn" />
                      <span>On telemetry</span>
                    </label>
                    <label class="flex items-center gap-1">
                      <input type="checkbox" value="decision-applied" v-model="auto.runOn" />
                      <span>After LLM</span>
                    </label>
                    <label class="flex items-center gap-1">
                      <input type="checkbox" v-model="auto.enabled" true-value="true" false-value="false" />
                      <span>Enabled</span>
                    </label>
                  </div>
                </div>
              </section>

              <section class="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                <h3 class="text-sm font-semibold text-white/80">LLM templates</h3>
                <div class="space-y-3">
                  <div class="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-xs">
                    <h4 class="text-sm font-semibold text-white/80">Decision prompt</h4>
                    <input v-model="editableNode.llm_templates.decision.title" placeholder="Title" class="mt-2 w-full rounded-lg bg-black/40 px-2 py-1" />
                    <textarea
                      v-model="editableNode.llm_templates.decision.system_prompt"
                      rows="2"
                      placeholder="System prompt"
                      class="mt-2 w-full rounded-lg bg-black/40 px-2 py-1 font-mono"
                    />
                    <textarea
                      v-model="editableNode.llm_templates.decision.user_prompt"
                      rows="2"
                      placeholder="User prompt"
                      class="mt-2 w-full rounded-lg bg-black/40 px-2 py-1 font-mono"
                    />
                    <input
                      v-model="editableNode.llm_templates.decision.placeholders"
                      placeholder="Placeholders comma-separated"
                      class="mt-2 w-full rounded-lg bg-black/40 px-2 py-1"
                    />
                  </div>
                  <div class="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs">
                    <h4 class="text-sm font-semibold text-white/80">Readback prompt</h4>
                    <textarea
                      v-model="editableNode.llm_templates.readback.system_prompt"
                      rows="2"
                      placeholder="System prompt"
                      class="mt-2 w-full rounded-lg bg-black/40 px-2 py-1 font-mono"
                    />
                    <textarea
                      v-model="editableNode.llm_templates.readback.user_prompt"
                      rows="2"
                      placeholder="User prompt"
                      class="mt-2 w-full rounded-lg bg-black/40 px-2 py-1 font-mono"
                    />
                  </div>
                </div>
              </section>

              <div class="flex items-center justify-between pt-2">
                <button
                  class="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.3em] text-white/60 hover:border-white/30"
                  :disabled="!hasUnsavedChanges"
                  @click="resetEditableNode"
                >
                  Reset
                </button>
                <button
                  class="rounded-xl border border-cyan-400/60 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300 hover:text-white disabled:opacity-40"
                  :disabled="!hasUnsavedChanges || saveStatus === 'saving'"
                  @click="saveNode"
                >
                  <span v-if="saveStatus === 'saving'">Saving…</span>
                  <span v-else>Save changes</span>
                </button>
              </div>
            </div>
          </div>

          <div v-else-if="tree" class="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div>
              <p class="text-xs uppercase tracking-[0.3em] text-white/40">Tree overview</p>
              <h2 class="text-xl font-semibold">{{ tree.name }}</h2>
              <p class="text-sm text-white/60">Configure default behaviour and lifecycle hooks.</p>
            </div>
            <div class="space-y-3 text-sm text-white/70">
              <label class="text-xs uppercase tracking-[0.3em] text-white/40">Description</label>
              <textarea
                v-model="treeSettings.description"
                rows="3"
                class="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
              />
              <label class="text-xs uppercase tracking-[0.3em] text-white/40">Start state</label>
              <input
                v-model="treeSettings.start_state"
                class="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
              />
              <label class="text-xs uppercase tracking-[0.3em] text-white/40">End states</label>
              <input
                v-model="treeSettings.end_states"
                placeholder="FLOW_COMPLETE, OTHER_STATE"
                class="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
              />
              <button
                class="rounded-xl border border-cyan-400/60 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100 transition hover:border-cyan-300 hover:text-white disabled:opacity-50"
                :disabled="savingSettings"
                @click="saveTreeSettings"
              >
                <span v-if="savingSettings">Saving…</span>
                <span v-else>Save settings</span>
              </button>
            </div>
            <div class="space-y-1 text-xs text-white/40">
              <p>Roles: {{ tree.roles.join(', ') }}</p>
              <p>Phases: {{ tree.phases.join(', ') }}</p>
              <p>Import via /api/editor/decision-tree/import once after updating the source file.</p>
            </div>
          </div>

          <div v-else class="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
            <p>Loading decision tree…</p>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useApi } from '~/composables/useApi'
import type { DecisionTreeRecord, DecisionTreeState, AutoTransition } from '~/types/decision-tree'

type Role = DecisionTreeState['role']

definePageMeta({ middleware: 'require-admin' })
useHead({ title: 'ATC Editor • OpenSquawk' })

const api = useApi()

const tree = ref<DecisionTreeRecord | null>(null)
const loadingTree = ref(false)
const importRunning = ref(false)
const saveStatus = ref<'idle' | 'saving' | 'saved'>('idle')
const saveError = ref<string | null>(null)
const savingSettings = ref(false)

const searchTerm = ref('')
const newNodeRole = ref<Role>('atc')
const selectedNodeId = ref<string | null>(null)
const editableNode = ref<(DecisionTreeState & { id: string }) | null>(null)
const originalSnapshot = ref('')

const treeSettings = reactive({ description: '', start_state: '', end_states: '' })

const canvasWrapperRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLElement | null>(null)
const nodeMap = new Map<string, HTMLElement>()
const connections = ref<EditorConnection[]>([])
let connectionRaf: number | null = null

const dragState = ref<{ id: string; startX: number; startY: number; originX: number; originY: number } | null>(null)

interface EditorNode {
  id: string
  state: DecisionTreeState
  layout: { x: number; y: number }
  role: Role
}

interface EditorConnection {
  id: string
  from: string
  to: string
  path: string
  type: 'default' | 'ok' | 'bad' | 'timer' | 'auto'
}

const nodes = computed<EditorNode[]>(() => {
  if (!tree.value) return []
  return Object.entries(tree.value.states || {}).map(([id, state]) => {
    const layout = state.layout || { x: 80, y: 80 }
    return {
      id,
      state,
      layout: { x: layout.x ?? 0, y: layout.y ?? 0 },
      role: state.role,
    }
  })
})

const phaseOptions = computed(() => tree.value?.phases || ['Clearance', 'PushStart', 'TaxiOut', 'Departure', 'Climb', 'Enroute', 'Approach', 'Landing'])

const matchingNodeIds = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return new Set<string>()
  const ids = new Set<string>()
  nodes.value.forEach((node) => {
    const state = node.state
    if (
      node.id.toLowerCase().includes(term) ||
      (state.label && state.label.toLowerCase().includes(term)) ||
      (state.say_tpl && state.say_tpl.toLowerCase().includes(term)) ||
      (state.utterance_tpl && state.utterance_tpl.toLowerCase().includes(term))
    ) {
      ids.add(node.id)
    }
  })
  return ids
})

const selectedNode = computed(() => {
  if (!tree.value || !selectedNodeId.value) return null
  return tree.value.states[selectedNodeId.value] ? { id: selectedNodeId.value, state: tree.value.states[selectedNodeId.value] } : null
})

const hasUnsavedChanges = computed(() => {
  if (!editableNode.value || !originalSnapshot.value) return false
  return JSON.stringify(buildStatePayload(editableNode.value)) !== originalSnapshot.value
})

function registerNodeRef(id: string, el: HTMLElement | null) {
  if (el) {
    nodeMap.set(id, el)
  } else {
    nodeMap.delete(id)
  }
  requestConnectionUpdate()
}

function nodeStyle(node: EditorNode) {
  return {
    left: `${node.layout.x}px`,
    top: `${node.layout.y}px`,
    borderColor: roleBorder(node.role),
  }
}

function roleBorder(role: Role) {
  switch (role) {
    case 'pilot':
      return 'rgba(59,130,246,0.6)'
    case 'system':
      return 'rgba(148,163,184,0.6)'
    default:
      return 'rgba(251,191,36,0.6)'
  }
}

function roleBadge(role: Role) {
  switch (role) {
    case 'pilot':
      return '#1d4ed8'
    case 'system':
      return '#4b5563'
    default:
      return '#ca8a04'
  }
}

function isNodeHighlighted(id: string) {
  const matches = matchingNodeIds.value
  return matches.size === 0 || matches.has(id)
}

function connectionColor(type: EditorConnection['type']) {
  switch (type) {
    case 'ok':
      return '#34d399'
    case 'bad':
      return '#f87171'
    case 'timer':
      return '#fb923c'
    case 'auto':
      return '#a855f7'
    default:
      return '#38bdf8'
  }
}

function formatRelativeTime(iso?: string) {
  if (!iso) return 'never'
  const date = new Date(iso)
  const now = new Date()
  const diff = (date.getTime() - now.getTime()) / 1000
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ]
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [unit, seconds] of units) {
    if (Math.abs(diff) >= seconds || unit === 'second') {
      return rtf.format(Math.round(diff / seconds), unit)
    }
  }
  return rtf.format(0, 'second')
}

function randomId(length = 8) {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return result
}

async function loadTree(force = false) {
  if (loadingTree.value && !force) return
  loadingTree.value = true
  saveError.value = null
  try {
    const response = await api.get<{ tree: DecisionTreeRecord }>('/api/editor/decision-tree', { query: force ? { ts: Date.now() } : undefined })
    tree.value = response.tree
    treeSettings.description = response.tree.description || ''
    treeSettings.start_state = response.tree.start_state
    treeSettings.end_states = response.tree.end_states.join(', ')
    if (!selectedNodeId.value || !response.tree.states[selectedNodeId.value]) {
      const defaultId = response.tree.start_state || Object.keys(response.tree.states || {})[0] || null
      selectedNodeId.value = defaultId
    }
    await nextTick()
    requestConnectionUpdate()
  } catch (err: any) {
    console.error('Failed to load decision tree', err)
    saveError.value = err?.data?.statusMessage || err?.message || 'Failed to load decision tree'
  } finally {
    loadingTree.value = false
  }
}

async function refreshTree() {
  await loadTree(true)
}

async function triggerImport() {
  importRunning.value = true
  try {
    await api.post('/api/editor/decision-tree/import')
    await loadTree(true)
  } catch (err: any) {
    console.error('Import failed', err)
    saveError.value = err?.data?.statusMessage || err?.message || 'Import failed'
  } finally {
    importRunning.value = false
  }
}

function selectNode(id: string) {
  selectedNodeId.value = id
}

function createEditableState(id: string, state: DecisionTreeState) {
  const clone = JSON.parse(JSON.stringify(state || {})) as DecisionTreeState
  clone.next = Array.isArray(clone.next) ? clone.next : []
  clone.ok_next = Array.isArray(clone.ok_next) ? clone.ok_next : []
  clone.bad_next = Array.isArray(clone.bad_next) ? clone.bad_next : []
  clone.timer_next = Array.isArray(clone.timer_next) ? clone.timer_next : []
  clone.auto_transitions = Array.isArray(clone.auto_transitions) ? clone.auto_transitions : []
  clone.auto_transitions.forEach((auto: AutoTransition) => {
    if (!Array.isArray(auto.runOn) || !auto.runOn.length) {
      auto.runOn = ['state-entry']
    }
  })
  clone.readback_required = Array.isArray(clone.readback_required) ? clone.readback_required : []
  clone.actions = Array.isArray(clone.actions) ? clone.actions : []
  clone.llm_templates = clone.llm_templates || { decision: {}, readback: {} }
  clone.llm_templates.decision = clone.llm_templates.decision || {}
  clone.llm_templates.readback = clone.llm_templates.readback || {}
  if (Array.isArray(clone.llm_templates.decision.placeholders)) {
    clone.llm_templates.decision.placeholders = clone.llm_templates.decision.placeholders.join(', ')
  }
  return reactive({ id, ...clone }) as DecisionTreeState & { id: string }
}

watch([selectedNodeId, tree], ([id, currentTree]) => {
  if (!id || !currentTree?.states[id]) {
    editableNode.value = null
    originalSnapshot.value = ''
    return
  }
  editableNode.value = createEditableState(id, currentTree.states[id])
  originalSnapshot.value = JSON.stringify(buildStatePayload(editableNode.value))
})

async function createNode() {
  if (!tree.value) return
  const phase = tree.value.phases?.[0] || 'Clearance'
  const payload: DecisionTreeState = {
    role: newNodeRole.value,
    phase,
    label: 'New node',
    next: [],
    ok_next: [],
    bad_next: [],
    timer_next: [],
    auto_transitions: [],
    readback_required: [],
  }
  try {
    const response = await api.post<{ tree: DecisionTreeRecord; node: { id: string } }>('/api/editor/decision-tree/nodes', { state: payload })
    tree.value = response.tree
    selectedNodeId.value = response.node.id
    await nextTick()
    requestConnectionUpdate()
  } catch (err: any) {
    console.error('Failed to create node', err)
    saveError.value = err?.data?.statusMessage || err?.message || 'Node creation failed'
  }
}

async function duplicateNode() {
  if (!editableNode.value) return
  const payload = buildStatePayload(editableNode.value)
  payload.label = `${payload.label || editableNode.value.id} copy`
  try {
    const response = await api.post<{ tree: DecisionTreeRecord; node: { id: string } }>('/api/editor/decision-tree/nodes', {
      state: payload,
    })
    tree.value = response.tree
    selectedNodeId.value = response.node.id
    await nextTick()
    requestConnectionUpdate()
  } catch (err: any) {
    console.error('Failed to duplicate node', err)
    saveError.value = err?.data?.statusMessage || err?.message || 'Duplicate failed'
  }
}

async function deleteNode() {
  if (!selectedNodeId.value) return
  if (!confirm(`Delete state ${selectedNodeId.value}?`)) return
  try {
    const response = await api.del<{ tree: DecisionTreeRecord }>('/api/editor/decision-tree/nodes/' + selectedNodeId.value)
    tree.value = response.tree
    selectedNodeId.value = response.tree.start_state || Object.keys(response.tree.states || {})[0] || null
    await nextTick()
    requestConnectionUpdate()
  } catch (err: any) {
    console.error('Failed to delete node', err)
    saveError.value = err?.data?.statusMessage || err?.message || 'Delete failed'
  }
}

function buildStatePayload(state: { id: string } & DecisionTreeState) {
  const { id, ...rest } = JSON.parse(JSON.stringify(state)) as DecisionTreeState & { id: string }
  if (rest.llm_templates?.decision?.placeholders && typeof rest.llm_templates.decision.placeholders === 'string') {
    rest.llm_templates.decision.placeholders = rest.llm_templates.decision.placeholders
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return rest
}

async function saveNode() {
  if (!editableNode.value || !selectedNodeId.value) return
  saveStatus.value = 'saving'
  saveError.value = null
  try {
    const response = await api.put<{ tree: DecisionTreeRecord }>('/api/editor/decision-tree/nodes/' + selectedNodeId.value, {
      state: buildStatePayload(editableNode.value),
    })
    tree.value = response.tree
    saveStatus.value = 'saved'
    setTimeout(() => (saveStatus.value = 'idle'), 2000)
  } catch (err: any) {
    console.error('Failed to save node', err)
    saveError.value = err?.data?.statusMessage || err?.message || 'Save failed'
    saveStatus.value = 'idle'
  }
}

function resetEditableNode() {
  if (!selectedNode.value) return
  editableNode.value = createEditableState(selectedNode.value.id, selectedNode.value.state)
  originalSnapshot.value = JSON.stringify(buildStatePayload(editableNode.value))
}

function addTransition(key: 'next' | 'ok_next' | 'bad_next') {
  if (!editableNode.value) return
  if (!Array.isArray(editableNode.value[key])) editableNode.value[key] = []
  editableNode.value[key].push({ to: '', when: '', label: '' })
}

function removeTransition(key: 'next' | 'ok_next' | 'bad_next', index: number) {
  if (!editableNode.value?.[key]) return
  editableNode.value[key].splice(index, 1)
}

function addTimerTransition() {
  if (!editableNode.value) return
  if (!Array.isArray(editableNode.value.timer_next)) editableNode.value.timer_next = []
  editableNode.value.timer_next.push({ to: '', after_s: 5, label: '' })
}

function removeTimerTransition(index: number) {
  editableNode.value?.timer_next?.splice(index, 1)
}

function addActionObject() {
  if (!editableNode.value) return
  if (!Array.isArray(editableNode.value.actions)) editableNode.value.actions = []
  editableNode.value.actions.push({ set: '', to: '' })
}

function addActionKeyword() {
  if (!editableNode.value) return
  if (!Array.isArray(editableNode.value.actions)) editableNode.value.actions = []
  editableNode.value.actions.push('')
}

function removeAction(index: number) {
  editableNode.value?.actions?.splice(index, 1)
}

function ensureAutoRunOn(auto: AutoTransition) {
  if (!Array.isArray(auto.runOn) || !auto.runOn.length) {
    auto.runOn = ['state-entry']
  }
}

function addAutoTransition() {
  if (!editableNode.value) return
  if (!Array.isArray(editableNode.value.auto_transitions)) editableNode.value.auto_transitions = []
  editableNode.value.auto_transitions.push({
    id: randomId(8),
    to: '',
    label: 'Auto',
    conditionType: 'expression',
    expression: '',
    runOn: ['state-entry'],
    enabled: true,
    priority: 0,
  })
}

function removeAutoTransition(index: number) {
  editableNode.value?.auto_transitions?.splice(index, 1)
}

function applyAutoPreset(auto: AutoTransition, preset: 'altitude' | 'speed' | 'gear') {
  ensureAutoRunOn(auto)
  if (preset === 'altitude') {
    auto.conditionType = 'telemetry'
    auto.telemetryKey = 'altitude_ft'
    auto.comparator = '>'
    auto.value = 200
  } else if (preset === 'speed') {
    auto.conditionType = 'telemetry'
    auto.telemetryKey = 'speed_kt'
    auto.comparator = '<'
    auto.value = 60
  } else {
    auto.conditionType = 'expression'
    auto.expression = 'flags.gear_down === true'
  }
}

async function saveTreeSettings() {
  if (!tree.value) return
  savingSettings.value = true
  try {
    const payload = {
      description: treeSettings.description,
      start_state: treeSettings.start_state,
      end_states: treeSettings.end_states
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    }
    const response = await api.put<{ tree: DecisionTreeRecord }>('/api/editor/decision-tree', { tree: payload })
    tree.value = response.tree
  } catch (err: any) {
    console.error('Failed to save settings', err)
    saveError.value = err?.data?.statusMessage || err?.message || 'Saving settings failed'
  } finally {
    savingSettings.value = false
  }
}

function requestConnectionUpdate() {
  if (connectionRaf !== null) return
  connectionRaf = requestAnimationFrame(() => {
    connectionRaf = null
    computeConnections()
  })
}

function computeConnections() {
  if (!canvasRef.value || !tree.value) {
    connections.value = []
    return
  }
  const canvasRect = canvasRef.value.getBoundingClientRect()
  const list: EditorConnection[] = []
  nodes.value.forEach((node) => {
    const fromEl = nodeMap.get(node.id)
    if (!fromEl) return
    const fromRect = fromEl.getBoundingClientRect()
    const startX = fromRect.left - canvasRect.left + fromRect.width
    const startY = fromRect.top - canvasRect.top + fromRect.height / 2

    const add = (to: string, type: EditorConnection['type']) => {
      const targetEl = nodeMap.get(to)
      if (!targetEl) return
      const toRect = targetEl.getBoundingClientRect()
      const endX = toRect.left - canvasRect.left
      const endY = toRect.top - canvasRect.top + toRect.height / 2
      const deltaX = endX - startX
      const curve = deltaX >= 0 ? Math.max(deltaX / 2, 40) : 40
      const path = `M${startX},${startY} C${startX + curve},${startY} ${endX - curve},${endY} ${endX},${endY}`
      list.push({ id: `${node.id}-${to}-${type}-${list.length}`, from: node.id, to, path, type })
    }

    node.state.next?.forEach((nxt) => add(nxt.to, 'default'))
    node.state.ok_next?.forEach((nxt) => add(nxt.to, 'ok'))
    node.state.bad_next?.forEach((nxt) => add(nxt.to, 'bad'))
    node.state.timer_next?.forEach((nxt) => add(nxt.to, 'timer'))
    node.state.auto_transitions?.forEach((nxt) => add(nxt.to, 'auto'))
  })
  connections.value = list
}

function beginDrag(event: PointerEvent, node: EditorNode) {
  if (!tree.value) return
  dragState.value = {
    id: node.id,
    startX: event.clientX,
    startY: event.clientY,
    originX: node.state.layout?.x ?? 0,
    originY: node.state.layout?.y ?? 0,
  }
  window.addEventListener('pointermove', continueDrag)
  window.addEventListener('pointerup', endDrag)
}

function continueDrag(event: PointerEvent) {
  if (!dragState.value || !tree.value) return
  const dx = event.clientX - dragState.value.startX
  const dy = event.clientY - dragState.value.startY
  const x = Math.round(dragState.value.originX + dx)
  const y = Math.round(dragState.value.originY + dy)
  const state = tree.value.states[dragState.value.id]
  if (!state) return
  if (!state.layout) state.layout = { x, y }
  else {
    state.layout.x = x
    state.layout.y = y
  }
  requestConnectionUpdate()
}

async function endDrag() {
  window.removeEventListener('pointermove', continueDrag)
  window.removeEventListener('pointerup', endDrag)
  const drag = dragState.value
  dragState.value = null
  if (!drag || !tree.value?.states[drag.id]) return
  const layout = tree.value.states[drag.id].layout || { x: 0, y: 0 }
  try {
    await api.patch('/api/editor/decision-tree/nodes/' + drag.id, { state: { layout } })
  } catch (err) {
    console.warn('Failed to persist layout', err)
  }
}

onMounted(() => {
  loadTree()
  window.addEventListener('resize', requestConnectionUpdate)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', requestConnectionUpdate)
  window.removeEventListener('pointermove', continueDrag)
  window.removeEventListener('pointerup', endDrag)
  if (connectionRaf !== null) cancelAnimationFrame(connectionRaf)
})

watch(nodes, () => {
  nextTick(() => requestConnectionUpdate())
})
</script>

<style scoped>
::-webkit-scrollbar {
  height: 10px;
  width: 10px;
}
::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 9999px;
}
</style>
