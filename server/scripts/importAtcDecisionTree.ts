import mongoose from 'mongoose'
import atcDecisionTree from '../../shared/data/atcDecisionTree'
import { AtcFlow } from '../models/AtcFlow'
import { AtcState } from '../models/AtcState'

interface RawTransition {
  to: string
  when?: string
  label?: string
  description?: string
  after_s?: number
  auto?: Record<string, any>
  priority?: number
}

function buildTransitionId(stateId: string, kind: string, index: number, target: string) {
  const safeTarget = target?.replace(/[^A-Za-z0-9_-]+/g, '-') || 'target'
  return `${stateId}-${kind}-${index}-${safeTarget}`
}

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/opensquawk'
  await mongoose.connect(uri)
  console.log(`[import] Connected to ${uri}`)

  const existing = await AtcFlow.findOne({ name: atcDecisionTree.name })
  if (existing) {
    console.log(`[import] Existing flow found (${existing._id}), replacing states and metadata...`)
    await AtcState.deleteMany({ flow: existing._id })
    await existing.deleteOne()
  }

  const flowDoc = await AtcFlow.create({
    name: atcDecisionTree.name,
    schemaVersion: atcDecisionTree.schema_version,
    description: atcDecisionTree.description,
    startState: atcDecisionTree.start_state,
    endStates: atcDecisionTree.end_states,
    variables: atcDecisionTree.variables,
    flags: atcDecisionTree.flags,
    policies: atcDecisionTree.policies,
    hooks: atcDecisionTree.hooks,
    roles: atcDecisionTree.roles,
    phases: atcDecisionTree.phases
  })

  const stateEntries = Object.entries(atcDecisionTree.states || {})

  const docs = stateEntries.map(([stateId, rawState]) => {
    const toTransition = (kind: string, value: any, index: number): any => {
      return {
        id: buildTransitionId(stateId, kind, index, value.to),
        kind,
        to: value.to,
        label: value.label ?? undefined,
        description: value.description ?? undefined,
        when: value.when ?? undefined,
        guard: value.guard ?? undefined,
        priority: typeof value.priority === 'number' ? value.priority : index,
        timer: kind === 'timer' ? { after_s: value.after_s ?? 0 } : undefined,
        auto: kind === 'auto' ? value.auto ?? undefined : undefined,
        metadata: value.metadata ?? undefined
      }
    }

    const transitions: any[] = []

    ;(rawState.next || []).forEach((t: RawTransition, idx: number) => transitions.push(toTransition('next', t, idx)))
    ;(rawState.ok_next || []).forEach((t: RawTransition, idx: number) => transitions.push(toTransition('ok_next', t, idx)))
    ;(rawState.bad_next || []).forEach((t: RawTransition, idx: number) => transitions.push(toTransition('bad_next', t, idx)))
    ;(rawState.timer_next || []).forEach((t: RawTransition, idx: number) => transitions.push(toTransition('timer', t, idx)))
    ;(rawState.auto_next || []).forEach((t: RawTransition, idx: number) => transitions.push(toTransition('auto', t, idx)))

    return {
      flow: flowDoc._id,
      stateId,
      title: rawState.title,
      role: rawState.role,
      phase: rawState.phase,
      sayTpl: rawState.say_tpl,
      utteranceTpl: rawState.utterance_tpl,
      elseSayTpl: rawState.else_say_tpl,
      readbackRequired: rawState.readback_required || [],
      auto: rawState.auto,
      actions: rawState.actions || [],
      condition: rawState.condition,
      guard: rawState.guard,
      trigger: rawState.trigger,
      frequency: rawState.frequency,
      frequencyName: rawState.frequencyName,
      handoff: rawState.handoff || undefined,
      transitions,
      llmTemplates: rawState.llm_templates || [],
      metadata: rawState.metadata || undefined,
      notes: rawState.notes || undefined,
      ui: rawState.ui || undefined
    }
  })

  if (docs.length) {
    await AtcState.insertMany(docs)
  }

  console.log(`[import] Imported ${docs.length} states for flow "${flowDoc.name}"`)

  await mongoose.disconnect()
  console.log('[import] Done.')
}

run().catch((err) => {
  console.error('[import] Failed:', err)
  process.exitCode = 1
  mongoose.disconnect().catch(() => null)
})
