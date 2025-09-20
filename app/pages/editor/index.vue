<template>
  <div class="editor-page h-screen flex flex-col bg-slate-950 text-white">
    <header class="border-b border-white/10 bg-slate-950/90 backdrop-blur px-6 py-4 flex flex-wrap items-center gap-4">
      <div>
        <h1 class="text-2xl font-semibold">ATC Decision Tree</h1>
        <p class="text-xs text-white/60">Visualise, edit and validate the controller flow in real time.</p>
        <div class="mt-1 flex flex-wrap gap-2 text-[11px] text-white/40">
          <span>Slug: {{ working.tree.slug }}</span>
          <span>•</span>
          <span>Start state: {{ working.tree.startState || '—' }}</span>
          <span>•</span>
          <span>Nodes: {{ working.nodes.length }}</span>
          <span v-if="loadedVersion" class="hidden sm:inline">• Last saved: {{ formatTimestamp(loadedVersion) }}</span>
        </div>
      </div>
      <div class="flex items-center gap-2 ml-auto">
        <v-btn
            size="small"
            color="cyan"
            variant="text"
            prepend-icon="mdi-vector-polyline"
            :disabled="working.nodes.length === 0"
            @click="autoLayout"
        >
          Auto layout
        </v-btn>
        <v-btn
            size="small"
            color="white"
            variant="text"
            prepend-icon="mdi-refresh"
            :loading="loadingTree"
            @click="refreshTree()"
        >
          Reload
        </v-btn>
        <v-btn
            size="small"
            color="white"
            variant="text"
            :disabled="!dirty || saving"
            @click="resetWorkingCopy"
        >
          Discard
        </v-btn>
        <v-btn
            size="small"
            color="cyan"
            class="text-slate-950"
            :loading="saving"
            :disabled="saving || !dirty"
            prepend-icon="mdi-content-save"
            @click="saveChanges"
        >
          Save changes
        </v-btn>
      </div>
    </header>

    <div v-if="treeErrorMessage" class="px-6 py-3 bg-red-500/10 text-red-300 text-sm">
      {{ treeErrorMessage }}
    </div>
    <div v-else-if="saveError" class="px-6 py-3 bg-red-500/10 text-red-300 text-sm">
      {{ saveError }}
    </div>
    <div v-else-if="saveSuccess" class="px-6 py-3 bg-emerald-500/10 text-emerald-300 text-sm">
      Decision tree saved successfully.
    </div>

    <div class="flex flex-1 overflow-hidden">
      <section class="flex-1 relative">
        <FlowCanvas
            ref="canvasRef"
            class="decision-flow"
            :nodes="flowNodes"
            :edges="flowEdges"
            :selected-node-id="selectedNodeId"
            @node-selected="onNodeSelected"
            @node-position-changed="onNodePositionChanged"
        />

        <div class="absolute top-4 left-4 flex flex-wrap items-center gap-3 bg-slate-900/80 px-4 py-3 rounded-xl shadow-lg max-w-3xl">
          <v-text-field
              v-model="searchTerm"
              density="comfortable"
              variant="outlined"
              color="cyan"
              label="Search nodes"
              hide-details
              prepend-inner-icon="mdi-magnify"
              class="w-56"
          />
          <v-select
              v-model="roleFilter"
              :items="roleOptions"
              item-title="label"
              item-value="value"
              density="comfortable"
              variant="outlined"
              hide-details
              label="Role"
              class="w-40"
          />
          <v-select
              v-model="phaseFilter"
              :items="phaseOptions"
              item-title="label"
              item-value="value"
              density="comfortable"
              variant="outlined"
              hide-details
              label="Phase"
              class="w-44"
          />
        </div>

        <div v-if="loadingTree" class="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div class="flex flex-col items-center gap-2">
            <v-progress-circular indeterminate color="cyan" size="40" />
            <span class="text-sm text-white/60">Loading decision tree…</span>
          </div>
        </div>
      </section>
      <aside class="w-[420px] border-l border-white/10 bg-[#090f1c] overflow-y-auto">
        <div class="p-6 space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Node inspector</h2>
            <v-btn
                v-if="selectedNode"
                size="small"
                variant="text"
                color="red"
                prepend-icon="mdi-delete"
                @click="deleteSelectedNode"
            >
              Delete
            </v-btn>
          </div>

          <div v-if="!selectedNode" class="text-sm text-white/60">
            <p>Select a node from the canvas to edit its configuration. Use the toolbar to search, filter and create new states.</p>
            <v-btn
                class="mt-4"
                color="cyan"
                block
                prepend-icon="mdi-plus"
                @click="createNode"
            >
              Add node
            </v-btn>
          </div>

          <div v-else class="space-y-6">
            <section class="space-y-4">
              <header class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">Basics</h3>
                  <p class="text-xs text-white/40">Edit identifiers, role assignments and metadata.</p>
                </div>
                <v-btn size="small" color="cyan" variant="text" prepend-icon="mdi-content-copy" @click="duplicateSelectedNode">
                  Duplicate
                </v-btn>
              </header>
              <div class="space-y-3">
                <v-text-field v-model="selectedNode.id" label="Node ID" density="comfortable" hide-details />
                <v-text-field v-model="selectedNode.title" label="Title" density="comfortable" hide-details />
                <v-textarea v-model="selectedNode.summary" label="Summary" rows="2" hide-details auto-grow />
                <div class="grid grid-cols-2 gap-3">
                  <v-select
                      v-model="selectedNode.data.role"
                      :items="roleOptions"
                      item-title="label"
                      item-value="value"
                      label="Role"
                      density="comfortable"
                      hide-details
                  />
                  <v-select
                      v-model="selectedNode.data.phase"
                      :items="phaseOptions"
                      item-title="label"
                      item-value="value"
                      label="Phase"
                      density="comfortable"
                      hide-details
                  />
                </div>
                <v-combobox
                    v-model="selectedNode.tags"
                    multiple
                    chips
                    hide-details
                    label="Tags"
                    density="comfortable"
                />
              </div>
            </section>

            <section class="space-y-4">
              <header>
                <h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">Templates</h3>
                <p class="text-xs text-white/40">Controller speech, pilot expectation and prompts.</p>
              </header>
              <div class="space-y-3">
                <v-textarea v-model="selectedNode.data.say_tpl" label="Controller say template" auto-grow hide-details rows="2" />
                <v-textarea v-model="selectedNode.data.utterance_tpl" label="Pilot utterance template" auto-grow hide-details rows="2" />
                <v-textarea v-model="selectedNode.data.prompt_out" label="Prompt summary" auto-grow hide-details rows="2" />
                <v-combobox
                    v-model="selectedNode.data.readback_required"
                    :items="variableSuggestions"
                    multiple
                    hide-details
                    chips
                    label="Required readback keys"
                />
              </div>
              <div class="bg-white/5 rounded-lg p-3 space-y-3">
                <div class="flex items-center justify-between">
                  <h4 class="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">LLM template</h4>
                  <v-btn size="x-small" variant="text" color="cyan" @click="ensureLlmTemplate">Ensure</v-btn>
                </div>
                <div v-if="selectedNode.llmTemplates" class="space-y-3">
                  <v-textarea v-model="selectedNode.llmTemplates.decisionPrompt" label="Decision prompt" auto-grow hide-details rows="3" />
                  <v-textarea v-model="selectedNode.llmTemplates.controllerSayTemplate" label="Controller response template" auto-grow hide-details rows="2" />
                  <v-textarea v-model="selectedNode.llmTemplates.guidelines" label="Guidelines" auto-grow hide-details rows="2" />
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs uppercase tracking-[0.2em] text-white/40">Placeholders</span>
                      <v-btn size="x-small" variant="text" color="cyan" @click="addPlaceholder">Add</v-btn>
                    </div>
                    <div v-if="selectedNode.llmTemplates.placeholders?.length" class="space-y-2">
                      <div
                          v-for="(placeholder, index) in selectedNode.llmTemplates.placeholders"
                          :key="placeholder.key + index"
                          class="rounded-lg border border-white/10 p-2 space-y-2"
                      >
                        <div class="flex items-center gap-2">
                          <v-text-field v-model="placeholder.key" label="Key" density="comfortable" hide-details />
                          <v-btn icon="mdi-delete" variant="text" color="red" @click="removePlaceholder(index)" />
                        </div>
                        <v-text-field v-model="placeholder.description" label="Description" density="comfortable" hide-details />
                        <v-text-field v-model="placeholder.example" label="Example" density="comfortable" hide-details />
                      </div>
                    </div>
                    <p v-else class="text-xs text-white/50">Define placeholder keys to guide the prompt builder.</p>
                  </div>
                </div>
                <p v-else class="text-xs text-white/50">
                  No dedicated LLM template configured. Click “Ensure” to bootstrap an editable template.
                </p>
              </div>
            </section>

            <section class="space-y-3">
              <header class="flex items-center justify-between">
                <h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">Next states</h3>
                <v-btn size="x-small" color="cyan" variant="text" prepend-icon="mdi-plus" @click="addTransition('next')">
                  Candidate
                </v-btn>
              </header>
              <div class="space-y-3">
                <div
                    v-for="(transition, index) in selectedNode.data.next"
                    :key="`next-${index}`"
                    class="rounded-lg border border-white/10 p-3 space-y-2"
                >
                  <div class="flex items-center gap-2">
                    <v-text-field v-model="transition.to" label="Target state" density="comfortable" hide-details />
                    <v-btn icon="mdi-delete" variant="text" color="red" @click="removeTransition('next', index)" />
                  </div>
                  <v-text-field v-model="transition.when" label="Condition (when)" density="comfortable" hide-details />
                </div>
                <p v-if="!selectedNode.data.next?.length" class="text-xs text-white/50">Define LLM candidates that the router may choose from.</p>
              </div>
            </section>

            <section class="space-y-3">
              <header class="flex items-center justify-between">
                <h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">Positive outcomes</h3>
                <v-btn size="x-small" color="cyan" variant="text" prepend-icon="mdi-plus" @click="addTransition('ok_next')">
                  Add
                </v-btn>
              </header>
              <div class="space-y-3">
                <div
                    v-for="(transition, index) in selectedNode.data.ok_next"
                    :key="`ok-${index}`"
                    class="rounded-lg border border-white/10 p-3 space-y-2"
                >
                  <div class="flex items-center gap-2">
                    <v-text-field v-model="transition.to" label="Target" density="comfortable" hide-details />
                    <v-btn icon="mdi-delete" variant="text" color="red" @click="removeTransition('ok_next', index)" />
                  </div>
                  <v-text-field v-model="transition.when" label="Condition" density="comfortable" hide-details />
                </div>
              </div>
            </section>

            <section class="space-y-3">
              <header class="flex items-center justify-between">
                <h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">Fallback routes</h3>
                <v-btn size="x-small" color="cyan" variant="text" prepend-icon="mdi-plus" @click="addTransition('bad_next')">
                  Add
                </v-btn>
              </header>
              <div class="space-y-3">
                <div
                    v-for="(transition, index) in selectedNode.data.bad_next"
                    :key="`bad-${index}`"
                    class="rounded-lg border border-white/10 p-3 space-y-2"
                >
                  <div class="flex items-center gap-2">
                    <v-text-field v-model="transition.to" label="Target" density="comfortable" hide-details />
                    <v-btn icon="mdi-delete" variant="text" color="red" @click="removeTransition('bad_next', index)" />
                  </div>
                  <v-text-field v-model="transition.when" label="Condition" density="comfortable" hide-details />
                </div>
              </div>
            </section>

            <section class="space-y-3">
              <header class="flex items-center justify-between">
                <h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">Timed routes</h3>
                <v-btn size="x-small" color="cyan" variant="text" prepend-icon="mdi-plus" @click="addTimerTransition">
                  Add timer
                </v-btn>
              </header>
              <div class="space-y-3">
                <div
                    v-for="(transition, index) in selectedNode.data.timer_next"
                    :key="`timer-${index}`"
                    class="rounded-lg border border-white/10 p-3 space-y-2"
                >
                  <div class="grid grid-cols-2 gap-2">
                    <v-text-field v-model="transition.to" label="Target" density="comfortable" hide-details />
                    <v-text-field v-model.number="transition.after_s" type="number" label="After (s)" density="comfortable" hide-details />
                  </div>
                  <div class="flex items-center justify-between">
                    <v-text-field v-model="transition.description" label="Description" density="comfortable" hide-details />
                    <v-btn icon="mdi-delete" variant="text" color="red" @click="removeTimerTransition(index)" />
                  </div>
                </div>
              </div>
            </section>

            <section class="space-y-3">
              <header class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">Auto transitions</h3>
                  <p class="text-xs text-white/40">Rules that skip LLM decisions based on telemetry or variables.</p>
                </div>
                <v-btn size="x-small" color="cyan" variant="text" prepend-icon="mdi-plus" @click="addAutoTransition">
                  Add auto
                </v-btn>
              </header>
              <div class="space-y-3">
                <div
                    v-for="(transition, index) in selectedNodeAutoTransitions"
                    :key="transition.id"
                    class="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3 space-y-2"
                >
                  <div class="flex items-center gap-2">
                    <v-text-field v-model="transition.name" label="Name" density="comfortable" hide-details />
                    <v-btn icon="mdi-delete" variant="text" color="red" @click="removeAutoTransition(index)" />
                  </div>
                  <v-text-field v-model="transition.next" label="Next state" density="comfortable" hide-details />
                  <v-textarea v-model="transition.condition" label="Condition" rows="2" auto-grow hide-details />
                  <div class="grid grid-cols-3 gap-2">
                    <v-text-field v-model.number="transition.priority" type="number" label="Priority" density="comfortable" hide-details />
                    <v-switch v-model="transition.autopilot" color="cyan" inset label="Autopilot" hide-details />
                    <v-switch v-model="transition.allowRepeat" color="cyan" inset label="Allow repeat" hide-details />
                  </div>
                  <v-combobox
                      v-model="transition.watch"
                      :items="watchSuggestions"
                      multiple
                      chips
                      hide-details
                      label="Watched keys"
                  />
                </div>
                <p v-if="!selectedNodeAutoTransitions.length" class="text-xs text-white/50">No auto transitions configured.</p>
              </div>
            </section>

            <section class="space-y-3">
              <h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">Notes</h3>
              <v-textarea v-model="selectedNode.notes" label="Internal notes" auto-grow hide-details rows="2" />
            </section>

            <section class="space-y-3">
              <h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">Helper links</h3>
              <div class="space-y-2">
                <div
                    v-for="(link, index) in selectedNode.helperLinks || (selectedNode.helperLinks = [])"
                    :key="`link-${index}`"
                    class="flex items-center gap-2"
                >
                  <v-text-field v-model="link.label" label="Label" density="comfortable" hide-details />
                  <v-text-field v-model="link.url" label="URL" density="comfortable" hide-details />
                  <v-btn icon="mdi-delete" variant="text" color="red" @click="removeHelperLink(index)" />
                </div>
              </div>
              <v-btn size="small" variant="text" color="cyan" prepend-icon="mdi-plus" @click="addHelperLink">
                Add link
              </v-btn>
            </section>
          </div>

          <div class="border-t border-white/10 pt-4">
            <v-btn block color="cyan" prepend-icon="mdi-plus" @click="createNode">
              Create new node
            </v-btn>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import FlowCanvas, { type FlowCanvasNode, type FlowCanvasEdge } from '~/components/editor/FlowCanvas.vue'
import type { DecisionTreeDTO, DecisionTreeNode, DecisionNodeAutoTransition, DecisionNodeLLMTemplate } from '~/shared/types/decisionTree'
import { useApi } from '~/composables/useApi'

definePageMeta({ middleware: 'require-admin' })

const api = useApi()

const { data: initialTreeResponse, pending: loadingTree, refresh: refreshTree, error: treeError } =
  await useAsyncData('editor-tree-icao', () => $fetch<DecisionTreeDTO>('/api/editor/decision-trees/icao_atc'))

const working = reactive<{ tree: DecisionTreeDTO['tree']; nodes: DecisionTreeNode[] }>({
  tree: initialTreeResponse.value ? clone(initialTreeResponse.value.tree) : createEmptyTreeCore(),
  nodes: initialTreeResponse.value ? initialTreeResponse.value.nodes.map((node) => clone(node)) : [],
})

const canvasRef = ref<InstanceType<typeof FlowCanvas> | null>(null)

const flowNodes = ref<FlowCanvasNode[]>([])
const flowEdges = ref<FlowCanvasEdge[]>([])

const selectedNodeId = ref<string | null>(working.nodes[0]?.id ?? null)
const loadedVersion = ref<string | null>(initialTreeResponse.value?.updatedAt ?? null)
const metadata = ref(initialTreeResponse.value?.metadata)
const dirty = ref(false)
const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)
let suppressDirty = false

const searchTerm = ref('')
const roleFilter = ref<'all' | string>('all')
const phaseFilter = ref<'all' | string>('all')

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? null))
}

function createEmptyTreeCore(): DecisionTreeDTO['tree'] {
  return {
    slug: 'icao_atc_decision_tree',
    title: 'ICAO ATC Decision Tree',
    description: '',
    schemaVersion: '1.0',
    startState: '',
    endStates: [],
    variables: {},
    flags: {},
    policies: {},
    hooks: {},
    roles: ['pilot', 'atc', 'system'],
    phases: [],
    telemetrySchema: [],
  }
}

function applyDto(dto: DecisionTreeDTO) {
  suppressDirty = true
  Object.assign(working.tree, clone(dto.tree))
  working.nodes.splice(0, working.nodes.length, ...dto.nodes.map((node) => clone(node)))
  loadedVersion.value = dto.updatedAt
  metadata.value = dto.metadata
  selectedNodeId.value = working.nodes[0]?.id ?? null
  suppressDirty = false
  dirty.value = false
  rebuildGraph()
  nextTick(() => canvasRef.value?.fitView())
}

if (initialTreeResponse.value) {
  applyDto(initialTreeResponse.value)
}

watch(initialTreeResponse, (dto) => {
  if (dto) applyDto(dto)
})

watch(
  () => working.nodes,
  () => {
    if (!suppressDirty) dirty.value = true
    rebuildGraph()
  },
  { deep: true },
)

watch(
  () => working.tree,
  () => {
    if (!suppressDirty) dirty.value = true
  },
  { deep: true },
)

watch(selectedNodeId, () => {
  rebuildGraph()
})

const selectedNode = computed(() => {
  if (!selectedNodeId.value) return null
  return working.nodes.find((node) => node.id === selectedNodeId.value) || null
})

watch(selectedNode, (node) => {
  if (node) ensureNodeDefaults(node)
})

watch([searchTerm, roleFilter, phaseFilter], () => rebuildGraph())

function ensureNodeDefaults(node: DecisionTreeNode) {
  node.data = node.data || ({} as DecisionTreeNode['data'])
  if (!node.data.role) node.data.role = 'system'
  if (!node.data.phase) node.data.phase = 'Clearance'
  if (!Array.isArray(node.data.next)) node.data.next = []
  if (!Array.isArray(node.data.ok_next)) node.data.ok_next = []
  if (!Array.isArray(node.data.bad_next)) node.data.bad_next = []
  if (!Array.isArray(node.data.timer_next)) node.data.timer_next = []
  if (!Array.isArray(node.data.readback_required)) node.data.readback_required = []
  if (!Array.isArray(node.autoTransitions)) node.autoTransitions = []
  if (!node.llmTemplates && node.data.llm_templates) node.llmTemplates = clone(node.data.llm_templates as DecisionNodeLLMTemplate)
}

function matchesFilters(node: DecisionTreeNode) {
  const term = searchTerm.value.trim().toLowerCase()
  if (roleFilter.value !== 'all' && node.data.role !== roleFilter.value) return false
  if (phaseFilter.value !== 'all' && node.data.phase !== phaseFilter.value) return false
  if (term) {
    const text = [node.id, node.title, node.summary, node.data.say_tpl, node.data.utterance_tpl]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return text.includes(term)
  }
  return true
}

function rebuildGraph() {
  const nodes: FlowCanvasNode[] = []
  const edges: FlowCanvasEdge[] = []

  for (const node of working.nodes) {
    ensureNodeDefaults(node)
    const matches = matchesFilters(node)
    nodes.push({
      id: node.id,
      position: { x: node.ui?.x ?? 0, y: node.ui?.y ?? 0 },
      data: {
        label: node.title || node.id,
        role: node.data.role,
        phase: node.data.phase,
        autopilot: (node.autoTransitions?.length ?? 0) + (node.data.auto_transitions?.length ?? 0),
      },
      className: [
        'dt-node',
        `dt-node-role-${node.data.role || 'system'}`,
        node.id === selectedNodeId.value ? 'is-selected' : '',
        matches ? '' : 'is-dimmed',
      ]
        .filter(Boolean)
        .join(' '),
    })

    for (const transition of node.data.next ?? []) addEdge(edges, node.id, transition.to, 'next', transition.when)
    for (const transition of node.data.ok_next ?? []) addEdge(edges, node.id, transition.to, 'ok', transition.when)
    for (const transition of node.data.bad_next ?? []) addEdge(edges, node.id, transition.to, 'bad', transition.when)
    for (const transition of node.data.timer_next ?? []) {
      const label = transition.after_s ? `${transition.after_s}s` : undefined
      addEdge(edges, node.id, transition.to, 'timer', label)
    }
    const autos = node.autoTransitions ?? (node.data.auto_transitions as DecisionNodeAutoTransition[]) ?? []
    for (const transition of autos) addEdge(edges, node.id, transition.next, 'auto', transition.condition)
  }

  flowNodes.value = nodes
  flowEdges.value = edges
}

function addEdge(edges: FlowCanvasEdge[], source: string, target: string, kind: string, label?: string) {
  const palette: Record<string, string> = {
    next: '#22d3ee',
    ok: '#22c55e',
    bad: '#ef4444',
    timer: '#f59e0b',
    auto: '#a855f7',
  }
  const color = palette[kind] || '#64748b'
  edges.push({
    id: `${source}-${target}-${kind}-${edges.length}`,
    source,
    target,
    label,
    color,
    kind,
    animated: kind === 'auto',
  })
}

function onNodeSelected(nodeId: string) {
  selectedNodeId.value = nodeId
  nextTick(() => canvasRef.value?.focusNode(nodeId))
}

function onNodePositionChanged(event: { id: string; position: { x: number; y: number } }) {
  const target = working.nodes.find((entry) => entry.id === event.id)
  if (target) {
    target.ui = target.ui || { x: 0, y: 0 }
    target.ui.x = event.position.x
    target.ui.y = event.position.y
  }
}

function createLocalId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 6)
  return `${prefix}_${Date.now().toString(36)}_${random}`
}

function createNode() {
  const id = createLocalId('NODE').toUpperCase()
  const node: DecisionTreeNode = {
    id,
    title: 'New node',
    summary: '',
    data: {
      role: 'system',
      phase: working.tree.phases[0] || 'Clearance',
      next: [],
      ok_next: [],
      bad_next: [],
      timer_next: [],
      readback_required: [],
    },
    autoTransitions: [],
    helperLinks: [],
    checklists: [],
    ui: { x: 40, y: 40 },
  }
  working.nodes.push(node)
  selectedNodeId.value = node.id
  rebuildGraph()
  nextTick(() => canvasRef.value?.focusNode(node.id))
}

function duplicateSelectedNode() {
  if (!selectedNode.value) return
  const cloneNode = clone(selectedNode.value)
  cloneNode.id = createLocalId(selectedNode.value.id)
  cloneNode.title = `${cloneNode.title || cloneNode.id} copy`
  if (cloneNode.ui) {
    cloneNode.ui.x += 40
    cloneNode.ui.y += 40
  }
  working.nodes.push(cloneNode)
  selectedNodeId.value = cloneNode.id
  rebuildGraph()
  nextTick(() => canvasRef.value?.focusNode(cloneNode.id))
}

function deleteSelectedNode() {
  if (!selectedNode.value) return
  const id = selectedNode.value.id
  const index = working.nodes.findIndex((node) => node.id === id)
  if (index !== -1) {
    working.nodes.splice(index, 1)
    for (const node of working.nodes) {
      node.data.next = (node.data.next || []).filter((transition) => transition.to !== id)
      node.data.ok_next = (node.data.ok_next || []).filter((transition) => transition.to !== id)
      node.data.bad_next = (node.data.bad_next || []).filter((transition) => transition.to !== id)
      node.data.timer_next = (node.data.timer_next || []).filter((transition) => transition.to !== id)
      node.autoTransitions = (node.autoTransitions || []).filter((transition) => transition.next !== id)
    }
    selectedNodeId.value = working.nodes[index]?.id ?? working.nodes[index - 1]?.id ?? null
    rebuildGraph()
  }
}

function addTransition(kind: 'next' | 'ok_next' | 'bad_next') {
  if (!selectedNode.value) return
  ;(selectedNode.value.data as any)[kind].push({ to: '', when: '' })
}

function removeTransition(kind: 'next' | 'ok_next' | 'bad_next', index: number) {
  if (!selectedNode.value) return
  ;(selectedNode.value.data as any)[kind].splice(index, 1)
  rebuildGraph()
}

function addTimerTransition() {
  if (!selectedNode.value) return
  selectedNode.value.data.timer_next?.push({ to: '', after_s: 0 })
}

function removeTimerTransition(index: number) {
  if (!selectedNode.value) return
  selectedNode.value.data.timer_next?.splice(index, 1)
  rebuildGraph()
}

const selectedNodeAutoTransitions = computed(() => selectedNode.value?.autoTransitions ?? [])

function addAutoTransition() {
  if (!selectedNode.value) return
  if (!Array.isArray(selectedNode.value.autoTransitions)) selectedNode.value.autoTransitions = []
  selectedNode.value.autoTransitions.push({
    id: createLocalId('auto'),
    name: 'Auto transition',
    condition: 'telemetry.altitude_ft > 0',
    next: working.tree.startState || selectedNode.value.id,
    description: '',
    priority: 0,
    requireConfirmation: false,
    allowRepeat: false,
    autopilot: true,
    watch: [],
  })
  rebuildGraph()
}

function removeAutoTransition(index: number) {
  if (!selectedNode.value) return
  selectedNode.value.autoTransitions?.splice(index, 1)
  rebuildGraph()
}

function ensureLlmTemplate() {
  if (!selectedNode.value) return
  if (!selectedNode.value.llmTemplates) {
    selectedNode.value.llmTemplates = {
      decisionPrompt: '',
      controllerSayTemplate: selectedNode.value.data.say_tpl || '',
      guidelines: '',
      placeholders: [],
    }
  }
}

function addPlaceholder() {
  if (!selectedNode.value?.llmTemplates) ensureLlmTemplate()
  selectedNode.value!.llmTemplates!.placeholders = selectedNode.value!.llmTemplates!.placeholders || []
  selectedNode.value!.llmTemplates!.placeholders!.push({ key: '', description: '', example: '' })
}

function removePlaceholder(index: number) {
  selectedNode.value?.llmTemplates?.placeholders?.splice(index, 1)
}

function addHelperLink() {
  if (!selectedNode.value) return
  selectedNode.value.helperLinks = selectedNode.value.helperLinks || []
  selectedNode.value.helperLinks.push({ label: '', url: '' })
}

function removeHelperLink(index: number) {
  selectedNode.value?.helperLinks?.splice(index, 1)
}

const roleOptions = computed(() => {
  const options = new Set<string>(['all', ...(working.tree.roles || [])])
  return Array.from(options).map((value) => ({ value, label: value === 'all' ? 'All roles' : value }))
})

const phaseOptions = computed(() => {
  const phases = new Set<string>(['all', ...(working.tree.phases || [])])
  return Array.from(phases).map((value) => ({ value, label: value === 'all' ? 'All phases' : value }))
})

const variableSuggestions = computed(() => Object.keys(working.tree.variables || {}))

const watchSuggestions = computed(() => {
  const telemetryKeys = (working.tree.telemetrySchema || []).map((field) => `telemetry.${field.key}`)
  const variableKeys = Object.keys(working.tree.variables || {}).map((key) => `variables.${key}`)
  const flagKeys = Object.keys(working.tree.flags || {}).map((key) => `flags.${key}`)
  return [...telemetryKeys, ...variableKeys, ...flagKeys]
})

function prepareNodesForSave(nodes: DecisionTreeNode[]) {
  return nodes.map((node) => {
    const copy = clone(node)
    if (Array.isArray(copy.autoTransitions)) {
      copy.data.auto_transitions = copy.autoTransitions.map((transition) => ({
        id: transition.id || createLocalId('auto'),
        name: transition.name,
        condition: transition.condition,
        next: transition.next,
        description: transition.description,
        priority: typeof transition.priority === 'number' ? transition.priority : 0,
        requireConfirmation: Boolean(transition.requireConfirmation),
        allowRepeat: Boolean(transition.allowRepeat),
        autopilot: transition.autopilot !== false,
        watch: Array.isArray(transition.watch) ? transition.watch.filter(Boolean) : [],
      }))
    }
    if (copy.llmTemplates) {
      copy.data.llm_templates = clone(copy.llmTemplates)
    }
    return copy
  })
}

async function saveChanges() {
  if (saving.value) return
  saveError.value = ''
  saveSuccess.value = false
  saving.value = true
  try {
    const payload: DecisionTreeDTO = {
      tree: clone(working.tree),
      nodes: prepareNodesForSave(working.nodes),
      updatedAt: new Date().toISOString(),
      metadata: metadata.value,
    }
    const response = await api.put<DecisionTreeDTO>(`/api/editor/decision-trees/${working.tree.slug}`, payload)
    applyDto(response)
    saveSuccess.value = true
    setTimeout(() => (saveSuccess.value = false), 2500)
  } catch (error: any) {
    saveError.value = error?.data?.message || error?.message || 'Could not save decision tree.'
  } finally {
    saving.value = false
  }
}

function resetWorkingCopy() {
  if (initialTreeResponse.value) {
    applyDto(initialTreeResponse.value)
  }
}

function autoLayout() {
  const phases = working.tree.phases || []
  const laneIndex = new Map<string, number>()
  phases.forEach((phase, idx) => laneIndex.set(phase, idx))
  const laneRow = new Map<string, number>()
  const xSpacing = 420
  const ySpacing = 160

  for (const node of working.nodes) {
    const phase = node.data.phase || 'General'
    const lane = laneIndex.has(phase) ? laneIndex.get(phase)! : phases.length
    const row = laneRow.get(phase) ?? 0
    laneRow.set(phase, row + 1)
    node.ui = node.ui || { x: 0, y: 0 }
    node.ui.x = lane * xSpacing
    node.ui.y = row * ySpacing
    node.ui.lane = phase
  }
  rebuildGraph()
  nextTick(() => canvasRef.value?.fitView())
}

const treeErrorMessage = computed(() => {
  const err = treeError.value
  return err ? err.message || 'Failed to load decision tree.' : ''
})

function formatTimestamp(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

onBeforeRouteLeave((to, from, next) => {
  if (dirty.value && !saving.value) {
    if (!confirm('You have unsaved changes. Leave the editor?')) {
      return next(false)
    }
  }
  next()
})

if (process.client) {
  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!dirty.value) return
    event.preventDefault()
    event.returnValue = ''
  }
  window.addEventListener('beforeunload', onBeforeUnload)
  onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
}

rebuildGraph()
</script>
<style scoped>
.editor-page {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.decision-flow {
  background: radial-gradient(circle at top, rgba(34, 211, 238, 0.05), transparent 45%), #050b1a;
}

.dt-node {
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(12, 18, 33, 0.95);
  color: #e2e8f0;
  font-size: 12px;
  font-weight: 500;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  box-shadow: 0 12px 30px -18px rgba(34, 211, 238, 0.55);
}

.dt-node-role-pilot {
  border-color: rgba(34, 197, 94, 0.65);
}

.dt-node-role-atc {
  border-color: rgba(14, 165, 233, 0.65);
}

.dt-node-role-system {
  border-color: rgba(168, 85, 247, 0.65);
}

.dt-node.is-selected {
  border-color: #22d3ee;
  box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.35), 0 16px 40px -20px rgba(34, 211, 238, 0.6);
}

.dt-node.is-dimmed {
  opacity: 0.35;
}

.dt-edge-next path {
  stroke-dasharray: 4 1.5;
}

.dt-edge-auto path {
  stroke-dasharray: 6 2;
}

.dt-edge-timer path {
  stroke-dasharray: 2 2;
}

.v-field--variant-outlined .v-field__outline__start,
.v-field--variant-outlined .v-field__outline__end,
.v-field--variant-outlined .v-field__outline__notch {
  border-color: rgba(148, 163, 184, 0.25);
}

.v-btn {
  text-transform: none;
  letter-spacing: 0.01em;
}
</style>
