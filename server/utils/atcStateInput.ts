import mongoose from 'mongoose'

const validTransitionKinds = new Set(['next', 'ok_next', 'bad_next', 'timer', 'auto', 'interrupt', 'stack', 'custom'])

function sanitizeAuto(auto: any) {
  if (!auto || typeof auto !== 'object') return undefined
  const result: Record<string, any> = {}

  if (typeof auto.mode === 'string') result.mode = auto.mode
  if (typeof auto.expression === 'string') result.expression = auto.expression
  if (typeof auto.variable === 'string') result.variable = auto.variable
  if (typeof auto.operator === 'string') result.operator = auto.operator
  if (Object.prototype.hasOwnProperty.call(auto, 'value')) result.value = auto.value
  if (Object.prototype.hasOwnProperty.call(auto, 'secondValue')) result.secondValue = auto.secondValue
  if (typeof auto.unit === 'string') result.unit = auto.unit

  if (auto.holdForMs !== undefined && auto.holdForMs !== null) {
    const hold = Number(auto.holdForMs)
    if (!Number.isNaN(hold)) result.holdForMs = hold
  }

  if (auto.sampleWindowMs !== undefined && auto.sampleWindowMs !== null) {
    const windowMs = Number(auto.sampleWindowMs)
    if (!Number.isNaN(windowMs)) result.sampleWindowMs = windowMs
  }

  if (typeof auto.description === 'string') result.description = auto.description
  if (typeof auto.controllerSayTpl === 'string') result.controllerSayTpl = auto.controllerSayTpl

  if (auto.updates && typeof auto.updates === 'object') result.updates = auto.updates
  if (auto.flags && typeof auto.flags === 'object') result.flags = auto.flags

  result.allowDuringLLM = typeof auto.allowDuringLLM === 'boolean' ? auto.allowDuringLLM : true
  result.allowDuringPilotSpeech = typeof auto.allowDuringPilotSpeech === 'boolean' ? auto.allowDuringPilotSpeech : true
  result.allowDuringControllerSpeech = typeof auto.allowDuringControllerSpeech === 'boolean' ? auto.allowDuringControllerSpeech : true

  return result
}

function sanitizeAutoFill(autoFill: any) {
  if (!autoFill || typeof autoFill !== 'object') return undefined
  const result: Record<string, any> = {}
  if (typeof autoFill.source === 'string') result.source = autoFill.source
  if (typeof autoFill.path === 'string') result.path = autoFill.path
  if (typeof autoFill.literal === 'string') result.literal = autoFill.literal
  if (typeof autoFill.expression === 'string') result.expression = autoFill.expression
  return result
}

function sanitizePlaceholders(placeholders: any[]): any[] {
  if (!Array.isArray(placeholders)) return []
  return placeholders
    .filter(ph => ph && typeof ph.key === 'string' && ph.key.trim().length)
    .map(ph => ({
      key: ph.key.trim(),
      label: typeof ph.label === 'string' ? ph.label : undefined,
      description: typeof ph.description === 'string' ? ph.description : undefined,
      example: typeof ph.example === 'string' ? ph.example : undefined,
      required: typeof ph.required === 'boolean' ? ph.required : undefined,
      defaultValue: Object.prototype.hasOwnProperty.call(ph, 'defaultValue') ? ph.defaultValue : undefined,
      autoFill: sanitizeAutoFill(ph.autoFill)
    }))
}

function sanitizeTemplates(templates: any[]): any[] {
  if (!Array.isArray(templates)) return []
  return templates
    .filter(tpl => tpl && typeof tpl.name === 'string' && tpl.name.trim().length)
    .map(tpl => ({
      id: typeof tpl.id === 'string' && tpl.id.trim().length ? tpl.id.trim() : new mongoose.Types.ObjectId().toString(),
      name: tpl.name.trim(),
      description: typeof tpl.description === 'string' ? tpl.description : undefined,
      systemPrompt: typeof tpl.systemPrompt === 'string' ? tpl.systemPrompt : undefined,
      userPrompt: typeof tpl.userPrompt === 'string' ? tpl.userPrompt : undefined,
      responseFormat: tpl.responseFormat && typeof tpl.responseFormat === 'object' ? tpl.responseFormat : undefined,
      sampleResponse: typeof tpl.sampleResponse === 'string' ? tpl.sampleResponse : undefined,
      hints: typeof tpl.hints === 'string' ? tpl.hints : undefined,
      placeholders: sanitizePlaceholders(tpl.placeholders),
      metadata: tpl.metadata && typeof tpl.metadata === 'object' ? tpl.metadata : undefined,
      autoApplyWhen: typeof tpl.autoApplyWhen === 'string' ? tpl.autoApplyWhen : undefined
    }))
}

function sanitizeTimer(timer: any) {
  if (!timer || typeof timer !== 'object') return { after_s: 0 }
  const after = Number(timer.after_s ?? timer.afterS ?? timer.afterSeconds ?? 0)
  return { after_s: Number.isFinite(after) ? after : 0 }
}

export function sanitizeTransitions(stateId: string, transitions: any[]): any[] {
  if (!Array.isArray(transitions)) return []

  return transitions
    .filter(t => t && typeof t.to === 'string' && t.to.trim().length)
    .map((t, index) => {
      const kindRaw = typeof t.kind === 'string' ? t.kind : 'next'
      const kind = validTransitionKinds.has(kindRaw) ? kindRaw : 'next'
      const timerInput = t.timer ?? (kind === 'timer' ? t : undefined)

      return {
        id: typeof t.id === 'string' && t.id.trim().length ? t.id.trim() : new mongoose.Types.ObjectId().toString(),
        kind,
        to: t.to.trim(),
        label: typeof t.label === 'string' ? t.label : undefined,
        description: typeof t.description === 'string' ? t.description : undefined,
        when: typeof t.when === 'string' ? t.when : undefined,
        guard: typeof t.guard === 'string' ? t.guard : undefined,
        priority: typeof t.priority === 'number' ? t.priority : index,
        timer: kind === 'timer' ? sanitizeTimer(timerInput) : undefined,
        auto: kind === 'auto' ? sanitizeAuto(t.auto) : undefined,
        metadata: t.metadata && typeof t.metadata === 'object' ? t.metadata : undefined
      }
    })
}

function sanitizeUI(ui: any) {
  if (!ui || typeof ui !== 'object') return undefined
  const result: Record<string, any> = {}
  if (typeof ui.x === 'number' && Number.isFinite(ui.x)) result.x = ui.x
  if (typeof ui.y === 'number' && Number.isFinite(ui.y)) result.y = ui.y
  if (typeof ui.lane === 'string') result.lane = ui.lane
  if (typeof ui.color === 'string') result.color = ui.color
  if (typeof ui.icon === 'string') result.icon = ui.icon
  if (typeof ui.width === 'number' && Number.isFinite(ui.width)) result.width = ui.width
  if (Array.isArray(ui.collapsedPanels)) result.collapsedPanels = ui.collapsedPanels.filter((p: any) => typeof p === 'string' && p.trim().length)
  return result
}

export function sanitizeStateInput(stateId: string, body: Record<string, any>) {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid state payload')
  }

  const role = typeof body.role === 'string' ? body.role.trim() : ''
  const phase = typeof body.phase === 'string' ? body.phase.trim() : ''

  if (!role) throw new Error('role is required')
  if (!phase) throw new Error('phase is required')

  const payload: Record<string, any> = {
    stateId,
    role,
    phase
  }

  if (typeof body.title === 'string') payload.title = body.title
  if (typeof body.sayTpl === 'string') payload.sayTpl = body.sayTpl
  if (typeof body.utteranceTpl === 'string') payload.utteranceTpl = body.utteranceTpl
  if (typeof body.elseSayTpl === 'string') payload.elseSayTpl = body.elseSayTpl
  if (Array.isArray(body.readbackRequired)) payload.readbackRequired = body.readbackRequired.filter(Boolean)
  if (typeof body.auto === 'string') payload.auto = body.auto
  if (Array.isArray(body.actions)) payload.actions = body.actions
  if (typeof body.condition === 'string') payload.condition = body.condition
  if (typeof body.guard === 'string') payload.guard = body.guard
  if (typeof body.trigger === 'string') payload.trigger = body.trigger
  if (typeof body.frequency === 'string') payload.frequency = body.frequency
  if (typeof body.frequencyName === 'string') payload.frequencyName = body.frequencyName

  if (body.handoff && typeof body.handoff === 'object' && typeof body.handoff.to === 'string') {
    payload.handoff = {
      to: body.handoff.to,
      freq: typeof body.handoff.freq === 'string' ? body.handoff.freq : undefined
    }
  }

  payload.transitions = sanitizeTransitions(stateId, Array.isArray(body.transitions) ? body.transitions : [])
  payload.llmTemplates = sanitizeTemplates(Array.isArray(body.llmTemplates) ? body.llmTemplates : [])

  if (body.metadata && typeof body.metadata === 'object') payload.metadata = body.metadata
  if (typeof body.notes === 'string') payload.notes = body.notes

  const ui = sanitizeUI(body.ui)
  if (ui) payload.ui = ui

  return payload
}

export function sanitizeStateUiPayload(body: Record<string, any>) {
  const ui = sanitizeUI(body)
  if (!ui) throw new Error('No valid UI fields provided')
  return ui
}
