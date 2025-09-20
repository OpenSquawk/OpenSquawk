import mongoose from 'mongoose'
import type {
  DecisionNodeAutoTransition,
  DecisionTreeDTO,
  DecisionTreeNode,
  DecisionTelemetryField,
} from '../../shared/types/decisionTree'
import type { DecisionTreeDocument } from '../models/DecisionTree'

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? null))
}

function normalizeTransitionList(list?: Array<{ to?: string; when?: string; label?: string; description?: string }>) {
  if (!Array.isArray(list)) return []
  return list
    .map((entry) => ({
      to: typeof entry?.to === 'string' ? entry.to.trim() : '',
      when: typeof entry?.when === 'string' ? entry.when.trim() : undefined,
      label: typeof entry?.label === 'string' ? entry.label.trim() : undefined,
      description: typeof entry?.description === 'string' ? entry.description.trim() : undefined,
    }))
    .filter((entry) => entry.to.length > 0)
}

function normalizeTimerList(list?: Array<{ to?: string; after_s?: number; description?: string; once?: boolean }>) {
  if (!Array.isArray(list)) return []
  return list
    .map((entry) => ({
      to: typeof entry?.to === 'string' ? entry.to.trim() : '',
      after_s: Number(entry?.after_s ?? 0) || 0,
      description: typeof entry?.description === 'string' ? entry.description.trim() : undefined,
      once: Boolean(entry?.once),
    }))
    .filter((entry) => entry.to.length > 0)
}

function normalizeAutoTransitions(list?: DecisionNodeAutoTransition[]): DecisionNodeAutoTransition[] {
  if (!Array.isArray(list)) return []
  return list
    .filter((item) => item && typeof item.next === 'string' && item.next.trim().length)
    .map((item) => ({
      id: item.id?.trim() || new mongoose.Types.ObjectId().toString(),
      name: item.name?.trim() || item.next.trim(),
      condition: item.condition?.trim() || 'false',
      next: item.next.trim(),
      description: item.description?.trim(),
      priority: typeof item.priority === 'number' ? item.priority : 0,
      requireConfirmation: Boolean(item.requireConfirmation),
      allowRepeat: Boolean(item.allowRepeat),
      autopilot: item.autopilot !== false,
      watch: Array.isArray(item.watch) ? item.watch.map((entry) => entry?.trim()).filter(Boolean) : [],
    }))
}

function normalizeHelperLinks(list?: Array<{ label?: string; url?: string }>) {
  if (!Array.isArray(list)) return []
  return list
    .map((link) => ({
      label: typeof link?.label === 'string' ? link.label.trim() : '',
      url: typeof link?.url === 'string' ? link.url.trim() : '',
    }))
    .filter((link) => link.label.length > 0 && link.url.length > 0)
}

function normalizeTelemetrySchema(list?: DecisionTelemetryField[]) {
  if (!Array.isArray(list)) return []
  return list
    .filter((entry) => entry && typeof entry.key === 'string' && entry.key.trim().length)
    .map((entry) => ({
      ...entry,
      key: entry.key.trim(),
      label: typeof entry.label === 'string' ? entry.label.trim() : entry.key.trim(),
      unit: entry.unit?.trim(),
      description: entry.description?.trim(),
      hint: entry.hint?.trim(),
    }))
}

function ensureStateData(node: DecisionTreeNode) {
  const data = deepClone(node.data || {}) as Record<string, any>
  if (typeof data.role !== 'string' || !data.role.trim()) {
    data.role = 'system'
  }
  if (typeof data.phase !== 'string' || !data.phase.trim()) {
    data.phase = 'Clearance'
  }
  if (Array.isArray(data.readback_required)) {
    data.readback_required = data.readback_required.map((item: any) => String(item || '').trim()).filter((item: string) => item)
  }
  data.next = normalizeTransitionList(data.next)
  data.ok_next = normalizeTransitionList(data.ok_next)
  data.bad_next = normalizeTransitionList(data.bad_next)
  data.timer_next = normalizeTimerList(data.timer_next)
  const autoTransitions = normalizeAutoTransitions(node.autoTransitions || data.auto_transitions)
  if (autoTransitions.length) {
    data.auto_transitions = autoTransitions.map((entry) => ({ ...entry }))
  } else {
    delete data.auto_transitions
  }
  if (node.llmTemplates) {
    data.llm_templates = deepClone(node.llmTemplates)
  } else if (data.llm_templates) {
    data.llm_templates = deepClone(data.llm_templates)
  }
  return { data, autoTransitions }
}

function sanitizeNode(node: DecisionTreeNode) {
  const id = node.id?.trim()
  if (!id) {
    throw new Error('Node id is required')
  }
  const title = node.title?.trim() || id
  const summary = node.summary?.trim()
  const { data, autoTransitions } = ensureStateData(node)

  return {
    id,
    title,
    summary,
    tags: Array.isArray(node.tags) ? node.tags.filter((tag) => typeof tag === 'string' && tag.trim().length).map((tag) => tag.trim()) : [],
    data,
    llmTemplates: node.llmTemplates ? deepClone(node.llmTemplates) : data.llm_templates ? deepClone(data.llm_templates) : undefined,
    autoTransitions,
    ui: node.ui ? deepClone(node.ui) : undefined,
    notes: typeof node.notes === 'string' ? node.notes.trim() : undefined,
    helperLinks: normalizeHelperLinks(node.helperLinks),
    checklists: Array.isArray(node.checklists)
      ? node.checklists.map((item) => (typeof item === 'string' ? item.trim() : '')).filter((item) => item.length > 0)
      : [],
  }
}

export function mapDecisionTreeDocument(doc: DecisionTreeDocument): DecisionTreeDTO {
  return {
    tree: {
      slug: doc.slug,
      title: doc.title,
      description: doc.description || undefined,
      schemaVersion: doc.schemaVersion || '1.0',
      startState: doc.startState,
      endStates: Array.isArray(doc.endStates) ? [...doc.endStates] : [],
      variables: deepClone(doc.variables || {}),
      flags: deepClone(doc.flags || {}),
      policies: deepClone(doc.policies || {}),
      hooks: deepClone(doc.hooks || {}),
      roles: Array.isArray(doc.roles) ? [...doc.roles] : ['pilot', 'atc', 'system'],
      phases: Array.isArray(doc.phases) ? [...doc.phases] : [],
      telemetrySchema: deepClone(doc.telemetrySchema || []),
    },
    nodes: (doc.states || []).map((node) => ({
      id: node.id,
      title: node.title,
      summary: node.summary || undefined,
      tags: Array.isArray(node.tags) ? [...node.tags] : [],
      data: deepClone(node.data || {}),
      llmTemplates: node.llmTemplates ? deepClone(node.llmTemplates) : undefined,
      autoTransitions: normalizeAutoTransitions((node.autoTransitions as DecisionNodeAutoTransition[]) || (node.data?.auto_transitions as DecisionNodeAutoTransition[]) || []),
      ui: node.ui ? deepClone(node.ui) : undefined,
      notes: node.notes || undefined,
      helperLinks: normalizeHelperLinks(node.helperLinks as any),
      checklists: Array.isArray(node.checklists) ? [...node.checklists] : [],
    })),
    updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
    metadata: doc.metadata
      ? {
          lastImportedFrom: doc.metadata.lastImportedFrom,
          lastImportedAt: doc.metadata.lastImportedAt ? doc.metadata.lastImportedAt.toISOString() : undefined,
          lastEditor: doc.metadata.lastEditor
            ? {
                id: doc.metadata.lastEditor.id,
                email: doc.metadata.lastEditor.email,
                name: doc.metadata.lastEditor.name,
              }
            : undefined,
        }
      : undefined,
  }
}

export function applyDecisionTreePayload(
  doc: DecisionTreeDocument,
  payload: DecisionTreeDTO,
  editor?: { id?: string; email: string; name?: string },
) {
  const core = payload.tree
  doc.slug = core.slug?.trim() || doc.slug
  doc.title = core.title?.trim() || doc.title
  doc.description = core.description?.trim() || undefined
  doc.schemaVersion = core.schemaVersion?.trim() || '1.0'
  doc.startState = core.startState?.trim() || doc.startState
  doc.endStates = Array.isArray(core.endStates) ? core.endStates.map((item) => item?.trim()).filter(Boolean) : []
  doc.variables = deepClone(core.variables || {})
  doc.flags = deepClone(core.flags || {})
  doc.policies = deepClone(core.policies || {})
  doc.hooks = deepClone(core.hooks || {})
  doc.roles = Array.isArray(core.roles) ? core.roles.filter((item) => typeof item === 'string' && item.trim().length).map((item) => item.trim()) : []
  doc.phases = Array.isArray(core.phases) ? core.phases.filter((item) => typeof item === 'string' && item.trim().length).map((item) => item.trim()) : []
  doc.telemetrySchema = normalizeTelemetrySchema(core.telemetrySchema)

  const sanitizedNodes = (payload.nodes || []).map(sanitizeNode)
  doc.states = sanitizedNodes as any

  doc.markModified('variables')
  doc.markModified('flags')
  doc.markModified('policies')
  doc.markModified('hooks')
  doc.markModified('telemetrySchema')
  doc.markModified('states')

  if (!doc.metadata) doc.metadata = {}
  if (editor) {
    doc.metadata.lastEditor = {
      id: editor.id,
      email: editor.email,
      name: editor.name,
    }
  }
}
