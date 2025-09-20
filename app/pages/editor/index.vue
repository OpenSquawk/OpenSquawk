
<template>
  <div class="min-h-screen bg-[#050910] text-white">
    <div class="grid h-screen w-full grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section class="flex h-screen flex-col overflow-hidden">
        <header class="border-b border-white/10 bg-white/[0.04] px-8 py-6 backdrop-blur">
          <div class="flex flex-col gap-6">
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div class="space-y-2">
                <p class="text-xs uppercase tracking-[0.4em] text-cyan-300/70">Decision Engine</p>
                <div class="flex flex-wrap items-baseline gap-3">
                  <h1 class="text-3xl font-semibold leading-tight">ATC Flow Editor</h1>
                  <span
                    v-if="tree?.updatedAt"
                    class="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60"
                  >
                    Updated {{ formatRelativeTime(tree.updatedAt) }}
                  </span>
                </div>
                <p class="max-w-3xl text-sm text-white/60">
                  Manage the ATC decision tree with a searchable flow overview and deep inspector controls for every state.
                </p>
              </div>
              <div v-if="tree" class="flex flex-wrap items-center gap-3 text-xs text-white/50">
                <span>Schema {{ tree.schema_version }}</span>
                <span>States {{ Object.keys(tree.states || {}).length }}</span>
                <span>Phases {{ tree.phases.length }}</span>
                <span>End states {{ tree.end_states.length }}</span>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <div class="min-w-[220px] flex-1">
                <label class="sr-only" for="editor-search">Search</label>
                <input
                  id="editor-search"
                  v-model="searchTerm"
                  type="search"
                  placeholder="Search state or template"
                  class="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
                />
              </div>
              <div class="flex items-center gap-2">
                <label class="text-[10px] uppercase tracking-[0.3em] text-white/40">Role</label>
                <select
                  v-model="newNodeRole"
                  class="rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
                >
                  <option value="atc">ATC</option>
                  <option value="pilot">Pilot</option>
                  <option value="system">System</option>
                </select>
              </div>
              <button
                class="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm transition hover:border-cyan-400 hover:text-cyan-200 disabled:opacity-50"
                :disabled="loadingTree"
                @click="refreshTree"
              >
                <span v-if="loadingTree">Refreshing…</span>
                <span v-else>Refresh</span>
              </button>
              <button
                class="rounded-2xl border border-purple-400/60 bg-purple-500/10 px-4 py-2 text-sm transition hover:border-purple-300 hover:text-purple-100 disabled:opacity-60"
                :disabled="importRunning"
                @click="triggerImport"
              >
                <span v-if="importRunning">Importing…</span>
                <span v-else>Import source</span>
              </button>
            </div>
            <div
              v-if="saveError"
              class="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs text-rose-200"
            >
              {{ saveError }}
            </div>
            <div
              v-else-if="saveStatus === 'saved'"
              class="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200"
            >
              Node saved
            </div>
          </div>
        </header>

        <div class="flex-1 overflow-y-auto px-8 py-8">
          <div class="space-y-8">
            <section v-if="tree" class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div class="flex flex-wrap items-start justify-between gap-6">
                <div class="space-y-2">
                  <p class="text-xs uppercase tracking-[0.3em] text-white/40">Flow overview</p>
                  <h2 class="text-2xl font-semibold leading-tight">{{ tree.name }}</h2>
                  <p class="max-w-3xl text-sm text-white/60">
                    Nodes flow vertically while alternative outcomes sit side by side. Hover a node to insert a new state directly above or below.
                  </p>
                </div>
                <div class="flex flex-col gap-2 text-xs text-white/50">
                  <span><span class="text-white/40">Start state</span> <span class="font-mono text-white">{{ tree.start_state }}</span></span>
                  <span><span class="text-white/40">End states</span> {{ tree.end_states.join(', ') || '—' }}</span>
                  <span><span class="text-white/40">Phases</span> {{ tree.phases.join(', ') || '—' }}</span>
                </div>
              </div>
            </section>

            <div v-if="tree && flowSections.length" class="space-y-10">
              <div v-for="section in flowSections" :key="section.phase" class="space-y-4">
                <div class="flex items-center gap-3">
                  <div class="h-px flex-1 bg-white/10"></div>
                  <p class="text-xs uppercase tracking-[0.3em] text-white/40">{{ section.phase }}</p>
                  <div class="h-px flex-1 bg-white/10"></div>
                </div>

                <div class="space-y-6">
                  <div v-for="node in section.nodes" :key="node.id" class="relative group pb-12">
                    <article
                      class="cursor-pointer rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-lg transition hover:border-cyan-400/40"
                      :class="[
                        selectedNodeId === node.id ? 'border-cyan-400/70 shadow-cyan-500/30' : 'shadow-black/20',
                        isNodeHighlighted(node.id) ? 'opacity-100' : 'opacity-40',
                      ]"
                      :style="{ borderColor: selectedNodeId === node.id ? 'rgba(34,211,238,0.6)' : roleBorder(node.role) }"
                      @click="selectNode(node.id)"
                    >
                      <div class="flex flex-wrap items-start justify-between gap-4">
                        <div class="space-y-2">
                          <div class="flex flex-wrap items-center gap-2 text-xs text-white/60">
                            <span
                              class="rounded-full px-2 py-[2px] font-medium uppercase tracking-[0.2em]"
                              :style="{ backgroundColor: roleBadge(node.role) }"
                            >
                              {{ node.role }}
                            </span>
                            <span class="rounded-full border border-white/10 px-2 py-[2px]">{{ node.state.phase }}</span>
                            <span
                              v-if="tree.start_state === node.id"
                              class="rounded-full border border-cyan-300/60 px-2 py-[2px] text-cyan-200"
                            >
                              Start
                            </span>
                            <span
                              v-if="tree.end_states.includes(node.id)"
                              class="rounded-full border border-emerald-300/60 px-2 py-[2px] text-emerald-200"
                            >
                              End
                            </span>
                          </div>
                          <h3 class="text-2xl font-semibold leading-tight">
                            {{ node.state.label || node.id }}
                          </h3>
                          <p class="font-mono text-xs text-white/40">{{ node.id }}</p>
                          <div class="flex flex-wrap gap-2 text-[11px] text-white/60">
                            <span v-if="node.state.auto" class="rounded-lg bg-white/10 px-2 py-[2px] font-mono">auto: {{ node.state.auto }}</span>
                            <span v-if="node.state.trigger" class="rounded-lg bg-white/10 px-2 py-[2px] font-mono">trigger: {{ node.state.trigger }}</span>
                            <span v-if="node.state.guard" class="rounded-lg bg-white/10 px-2 py-[2px] font-mono">guard: {{ node.state.guard }}</span>
                            <span
                              v-if="node.state.readback_required?.length"
                              class="rounded-lg bg-amber-500/20 px-2 py-[2px] text-amber-100"
                            >
                              Readback ×{{ node.state.readback_required.length }}
                            </span>
                            <span v-if="node.state.actions?.length" class="rounded-lg bg-sky-500/20 px-2 py-[2px] text-sky-100">
                              {{ node.state.actions.length }} actions
                            </span>
                          </div>
                        </div>
                        <div class="flex flex-col items-end gap-1 text-right text-xs text-white/50">
                          <span>Transitions {{ totalTransitionCount(node.state) }}</span>
                          <span v-if="node.state.auto_transitions?.length">Auto {{ node.state.auto_transitions.length }}</span>
                          <span v-if="node.state.timer_next?.length">Timer {{ node.state.timer_next.length }}</span>
                        </div>
                      </div>

                      <div class="mt-4 grid gap-4 md:grid-cols-2">
                        <div v-if="node.state.say_tpl" class="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
                          <p class="text-xs uppercase tracking-[0.3em] text-white/50">Say template</p>
                          <p class="mt-2 font-mono text-sm text-cyan-100">{{ node.state.say_tpl }}</p>
                        </div>
                        <div v-if="node.state.utterance_tpl" class="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                          <p class="text-xs uppercase tracking-[0.3em] text-white/50">Pilot template</p>
                          <p class="mt-2 font-mono text-sm text-emerald-100">{{ node.state.utterance_tpl }}</p>
                        </div>
                      </div>

                      <div v-if="stateTransitionGroups(node.state).length" class="mt-6 space-y-3">
                        <p class="text-xs uppercase tracking-[0.3em] text-white/40">Branches</p>
                        <div class="grid gap-5 [grid-template-columns:repeat(auto-fit,_minmax(420px,_1fr))]">
                          <div
                            v-for="group in stateTransitionGroups(node.state)"
                            :key="group.key"
                            class="rounded-2xl border p-4"
                            :class="[group.borderClass, group.backgroundClass]"
                          >
                            <div class="flex items-center justify-between text-xs">
                              <span :class="group.textClass">{{ group.label }}</span>
                              <span class="text-white/50">{{ group.items.length }}</span>
                            </div>
                            <div class="mt-3 space-y-3">
                              <div
                                v-for="(transition, index) in group.items"
                                :key="`${group.key}-${index}`"
                                class="rounded-xl bg-black/40 p-3 text-xs text-white/70"
                              >
                                <template v-if="group.key === 'timer_next'">
                                  <p class="font-mono text-sm text-white">→ {{ transition.to || '—' }}</p>
                                  <p class="mt-1 text-white/60">After {{ transition.after_s }}s</p>
                                  <p v-if="transition.label" class="mt-1 text-white/40">{{ transition.label }}</p>
                                  <p v-if="transition.description" class="mt-1 text-white/50">{{ transition.description }}</p>
                                </template>
                                <template v-else-if="group.key === 'auto_transitions'">
                                  <p class="font-mono text-sm text-white">→ {{ transition.to || '—' }}</p>
                                  <p class="mt-1 text-white/60">{{ describeAutoTransition(transition) }}</p>
                                  <div class="mt-2 flex flex-wrap gap-2 text-[10px] text-white/50">
                                    <span v-if="transition.priority !== undefined" class="rounded-full bg-white/10 px-2 py-[2px]">
                                      Priority {{ transition.priority }}
                                    </span>
                                    <span v-if="transition.runOn?.length" class="rounded-full bg-white/10 px-2 py-[2px]">
                                      {{ transition.runOn.join(', ') }}
                                    </span>
                                    <span v-if="transition.enabled === false" class="rounded-full bg-white/10 px-2 py-[2px]">
                                      Disabled
                                    </span>
                                  </div>
                                </template>
                                <template v-else>
                                  <p class="font-mono text-sm text-white">→ {{ transition.to || '—' }}</p>
                                  <p v-if="transition.when" class="mt-1 text-white/60">{{ transition.when }}</p>
                                  <p v-if="transition.label" class="mt-1 text-white/40">{{ transition.label }}</p>
                                  <p v-if="transition.description" class="mt-1 text-white/50">{{ transition.description }}</p>
                                </template>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div v-if="node.state.notes" class="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/60">
                        {{ node.state.notes }}
                      </div>
                    </article>

                    <div
                      class="pointer-events-none absolute inset-x-0 -bottom-3 flex justify-center opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100"
                    >
                      <div class="flex items-center gap-2 rounded-full border border-white/20 bg-black/70 px-4 py-2 text-xs text-white/70 shadow-xl backdrop-blur">
                        <span class="text-white/40">Insert</span>
                        <button
                          class="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] transition hover:bg-cyan-500/20"
                          @click.stop="createNode({ anchorId: node.id, position: 'before' })"
                        >
                          Above
                        </button>
                        <button
                          class="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] transition hover:bg-cyan-500/20"
                          @click.stop="createNode({ anchorId: node.id, position: 'after' })"
                        >
                          Below
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-else-if="tree"
              class="rounded-3xl border border-dashed border-white/20 bg-white/5 p-8 text-sm text-white/60"
            >
              <p>No decision states available yet.</p>
              <button
                class="mt-4 rounded-2xl border border-cyan-400/60 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300 hover:text-white disabled:opacity-50"
                :disabled="importRunning"
                @click="createNode()"
              >
                Create first node
              </button>
            </div>

            <div v-else class="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
              <p>Loading decision tree…</p>
            </div>
          </div>
        </div>
      </section>


      <aside class="hidden h-screen overflow-hidden border-t border-white/10 bg-white/5 backdrop-blur xl:flex xl:flex-col xl:border-l xl:border-t-0">
        <div class="flex h-full flex-col gap-6 overflow-y-auto px-6 py-8">
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
              <label class="text-xs uppercase tracking-[0.3em] text-white/40">State ID</label>
              <input
                v-model="editableNode.id"
                type="text"
                class="rounded-2xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
              />
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
                    <button class="rounded-lg border border-white/10 px-2 py-1 hover:border-rose-400" @click="addTransition('bad_next')">
                      + Bad
                    </button>
                  </div>
                </div>
                <div class="space-y-3">
                  <div
                    v-for="(transition, index) in editableNode.next"
                    :key="`next-${index}`"
                    class="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-xs"
                  >
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
                  <div
                    v-for="(transition, index) in editableNode.ok_next"
                    :key="`ok-${index}`"
                    class="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs"
                  >
                    <div class="flex gap-2">
                      <input v-model="transition.to" placeholder="OK target" class="w-full rounded-lg bg-black/40 px-2 py-1 font-mono" />
                      <button class="rounded-lg bg-black/40 px-2" @click="removeTransition('ok_next', index)">×</button>
                    </div>
                    <input v-model="transition.label" placeholder="Label" class="mt-2 w-full rounded-lg bg-black/40 px-2 py-1" />
                  </div>
                  <div
                    v-for="(transition, index) in editableNode.bad_next"
                    :key="`bad-${index}`"
                    class="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-xs"
                  >
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
                    <div
                      v-for="(transition, index) in editableNode.timer_next"
                      :key="`timer-${index}`"
                      class="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs"
                    >
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
                    <button class="rounded-lg border border-white/10 px-2 py-1 hover:border-sky-400" @click="addActionKeyword">+ Keyword</button>
                  </div>
                </div>
                <div v-if="!editableNode.actions || !editableNode.actions.length" class="text-xs text-white/40">No actions</div>
                <div
                  v-for="(action, index) in editableNode.actions"
                  :key="`action-${index}`"
                  class="rounded-xl border border-white/10 bg-black/40 p-3 text-xs"
                >
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
        </div>
      </aside>
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useApi } from '~/composables/useApi'
import type { AutoTransition, DecisionTreeRecord, DecisionTreeState } from '~/types/decision-tree'

type Role = DecisionTreeState['role']
type TransitionGroupKey = 'next' | 'ok_next' | 'bad_next' | 'timer_next' | 'auto_transitions'

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
const pendingRename = ref<{ from: string; to: string } | null>(null)

const treeSettings = reactive({ description: '', start_state: '', end_states: '' })

interface EditorNode {
  id: string
  state: DecisionTreeState
  layout: { x: number; y: number }
  role: Role
}

interface TransitionGroupDescriptor {
  key: TransitionGroupKey
  label: string
  items: any[]
  borderClass: string
  backgroundClass: string
  textClass: string
}

const transitionPalette: Record<TransitionGroupKey, { label: string; borderClass: string; backgroundClass: string; textClass: string }> = {
  next: { label: 'Next', borderClass: 'border-cyan-400/40', backgroundClass: 'bg-cyan-500/10', textClass: 'text-cyan-100' },
  ok_next: { label: 'OK', borderClass: 'border-emerald-400/40', backgroundClass: 'bg-emerald-500/10', textClass: 'text-emerald-100' },
  bad_next: { label: 'Bad', borderClass: 'border-rose-400/40', backgroundClass: 'bg-rose-500/10', textClass: 'text-rose-100' },
  timer_next: { label: 'Timer', borderClass: 'border-amber-400/40', backgroundClass: 'bg-amber-500/10', textClass: 'text-amber-100' },
  auto_transitions: { label: 'Auto', borderClass: 'border-purple-400/40', backgroundClass: 'bg-purple-500/10', textClass: 'text-purple-100' },
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
  return createSnapshot(editableNode.value) !== originalSnapshot.value
})

const flowNodes = computed<EditorNode[]>(() => {
  if (!tree.value) return []
  const map = new Map<string, EditorNode>()
  nodes.value.forEach((node) => map.set(node.id, node))
  const visited = new Set<string>()
  const enqueued = new Set<string>()
  const ordered: EditorNode[] = []
  const queue: string[] = []

  const enqueue = (id?: string) => {
    if (!id) return
    if (!map.has(id)) return
    if (visited.has(id) || enqueued.has(id)) return
    enqueued.add(id)
    queue.push(id)
  }

  enqueue(tree.value.start_state)
  if (!queue.length) {
    const sorted = [...map.keys()].sort()
    sorted.forEach((id) => enqueue(id))
  }

  const pushNeighbors = (state: DecisionTreeState) => {
    const pushList = (list?: { to: string }[]) => {
      list?.forEach((transition) => {
        if (transition.to) enqueue(transition.to)
      })
    }
    pushList(state.next)
    pushList(state.ok_next)
    pushList(state.bad_next)
    state.timer_next?.forEach((transition) => enqueue(transition.to))
    state.auto_transitions?.forEach((transition) => enqueue(transition.to))
  }

  while (queue.length) {
    const id = queue.shift()!
    enqueued.delete(id)
    if (visited.has(id)) continue
    const node = map.get(id)
    if (!node) continue
    visited.add(id)
    ordered.push(node)
    pushNeighbors(node.state)
  }

  const leftovers = nodes.value.filter((node) => !visited.has(node.id))
  leftovers.sort((a, b) => {
    const dy = (a.layout.y ?? 0) - (b.layout.y ?? 0)
    if (dy !== 0) return dy
    const dx = (a.layout.x ?? 0) - (b.layout.x ?? 0)
    if (dx !== 0) return dx
    return a.id.localeCompare(b.id)
  })
  ordered.push(...leftovers)

  return ordered
})

const flowSections = computed(() => {
  if (!tree.value) return [] as { phase: string; nodes: EditorNode[] }[]
  const groups = new Map<string, EditorNode[]>()
  flowNodes.value.forEach((node) => {
    const phase = node.state.phase || 'Unassigned'
    if (!groups.has(phase)) groups.set(phase, [])
    groups.get(phase)!.push(node)
  })
  const sections: { phase: string; nodes: EditorNode[] }[] = []
  const knownPhases = tree.value.phases || []
  knownPhases.forEach((phase) => {
    const phaseNodes = groups.get(phase)
    if (phaseNodes?.length) {
      sections.push({ phase, nodes: phaseNodes })
      groups.delete(phase)
    }
  })
  groups.forEach((phaseNodes, phase) => {
    sections.push({ phase, nodes: phaseNodes })
  })
  return sections
})

function stateTransitionGroups(state: DecisionTreeState): TransitionGroupDescriptor[] {
  const groups: TransitionGroupDescriptor[] = []
  const pushGroup = (key: TransitionGroupKey, items?: any[]) => {
    if (!items || !items.length) return
    const palette = transitionPalette[key]
    groups.push({
      key,
      label: palette.label,
      items,
      borderClass: palette.borderClass,
      backgroundClass: palette.backgroundClass,
      textClass: palette.textClass,
    })
  }
  pushGroup('next', state.next)
  pushGroup('ok_next', state.ok_next)
  pushGroup('bad_next', state.bad_next)
  pushGroup('timer_next', state.timer_next)
  pushGroup('auto_transitions', state.auto_transitions)
  return groups
}

function totalTransitionCount(state: DecisionTreeState) {
  return (
    (state.next?.length || 0) +
    (state.ok_next?.length || 0) +
    (state.bad_next?.length || 0) +
    (state.timer_next?.length || 0) +
    (state.auto_transitions?.length || 0)
  )
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

function resolveAnchorLayout(anchorId?: string, position?: 'before' | 'after') {
  if (!anchorId) return null
  const anchor = nodes.value.find((node) => node.id === anchorId)
  if (!anchor) return null
  const baseX = anchor.layout?.x ?? 0
  const baseY = anchor.layout?.y ?? 0
  const offset = position === 'before' ? -220 : 220
  return { x: baseX, y: baseY + offset }
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

function createSnapshot(state: { id: string } & DecisionTreeState) {
  return JSON.stringify({ id: state.id, payload: buildStatePayload(state) })
}

watch([selectedNodeId, tree], ([id, currentTree]) => {
  if (!id || !currentTree?.states) {
    editableNode.value = null
    originalSnapshot.value = ''
    return
  }
  if (!currentTree.states[id]) {
    if (pendingRename.value?.from === id && pendingRename.value?.to) {
      const nextId = pendingRename.value.to
      pendingRename.value = null
      selectedNodeId.value = nextId
      return
    }
    editableNode.value = null
    originalSnapshot.value = ''
    return
  }
  editableNode.value = createEditableState(id, currentTree.states[id])
  originalSnapshot.value = createSnapshot(editableNode.value)
})

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

async function createNode(options?: { anchorId?: string; position?: 'before' | 'after' }) {
  if (!tree.value) return
  const anchorId = options?.anchorId
  const anchorState = anchorId ? tree.value.states[anchorId] : null
  const phase = anchorState?.phase || tree.value.phases?.[0] || 'Clearance'
  const layout = resolveAnchorLayout(anchorId, options?.position)
  const payload: DecisionTreeState = {
    role: newNodeRole.value,
    phase,
    label: anchorState ? `${anchorState.label || anchorId} – new` : 'New node',
    next: [],
    ok_next: [],
    bad_next: [],
    timer_next: [],
    auto_transitions: [],
    readback_required: [],
    layout: layout ? { x: layout.x, y: layout.y } : undefined,
  }
  try {
    const response = await api.post<{ tree: DecisionTreeRecord; node: { id: string } }>('/api/editor/decision-tree/nodes', {
      state: payload,
      anchorId,
      position: options?.position,
    })
    tree.value = response.tree
    selectedNodeId.value = response.node.id
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
  } catch (err: any) {
    console.error('Failed to duplicate node', err)
    saveError.value = err?.data?.statusMessage || err?.message || 'Duplicate failed'
  }
}

async function deleteNode() {
  if (!selectedNodeId.value) return
  if (!confirm(`Delete state ${selectedNodeId.value}?`)) return
  try {
    const response = await api.del<{ tree: DecisionTreeRecord }>(`/api/editor/decision-tree/nodes/${selectedNodeId.value}`)
    tree.value = response.tree
    selectedNodeId.value = response.tree.start_state || Object.keys(response.tree.states || {})[0] || null
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
  const desiredId = editableNode.value.id?.trim()
  if (!desiredId) {
    saveError.value = 'State id cannot be empty'
    return
  }
  saveStatus.value = 'saving'
  saveError.value = null
  try {
    const payload = buildStatePayload(editableNode.value)
    const trimmedLabel = payload.label?.trim()
    if (trimmedLabel) {
      payload.label = trimmedLabel
    } else if (desiredId !== selectedNodeId.value) {
      payload.label = selectedNodeId.value
    } else {
      payload.label = undefined
    }
    const response = await api.put<{ tree: DecisionTreeRecord; node: { id: string } }>(`/api/editor/decision-tree/nodes/${selectedNodeId.value}`, {
      state: payload,
      id: desiredId,
    })
    if (desiredId !== selectedNodeId.value) {
      pendingRename.value = { from: selectedNodeId.value, to: response.node.id }
    }
    tree.value = response.tree
    selectedNodeId.value = response.node.id
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
  originalSnapshot.value = createSnapshot(editableNode.value)
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

function describeAutoTransition(auto: AutoTransition | undefined) {
  if (!auto) return '—'
  if (auto.conditionType === 'telemetry' && auto.telemetryKey && auto.comparator && auto.value !== undefined) {
    return `${auto.telemetryKey} ${auto.comparator} ${auto.value}`
  }
  if (auto.expression) {
    return auto.expression
  }
  return 'No condition configured'
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

onMounted(() => {
  loadTree()
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
