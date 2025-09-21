import { randomUUID } from 'node:crypto'
import type {
  DecisionComparisonOperator,
  DecisionNodeAutoTrigger,
  DecisionNodeCondition,
  DecisionNodeLayout,
  DecisionNodeLLMPlaceholder,
  DecisionNodeLLMTemplate,
  DecisionNodeMetadata,
  DecisionNodeTrigger,
  DecisionNodeTransition,
} from '~~/shared/types/decision'

const TRANSITION_TYPES = new Set(['next', 'ok', 'bad', 'timer', 'auto', 'interrupt', 'return'])
const AUTO_TRIGGER_TYPES = new Set(['telemetry', 'variable', 'expression'])
const NODE_TRIGGER_TYPES = new Set(['auto_time', 'auto_variable', 'regex', 'none'])
const NODE_CONDITION_TYPES = new Set(['variable_value', 'regex', 'regex_not'])
const COMPARISON_OPERATORS = new Set(['>', '>=', '<', '<=', '==', '!='])
const TELEMETRY_PARAMETERS = new Set([
  'altitude_ft',
  'speed_kts',
  'groundspeed_kts',
  'vertical_speed_fpm',
  'heading_deg',
  'distance_nm',
])

function asTrimmedString(input: any): string | undefined {
  if (typeof input === 'string') {
    const trimmed = input.trim()
    return trimmed.length ? trimmed : undefined
  }
  return undefined
}

function asNumber(input: any): number | undefined {
  if (typeof input === 'number' && Number.isFinite(input)) {
    return input
  }
  if (typeof input === 'string' && input.trim()) {
    const parsed = Number(input)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return undefined
}

function asBoolean(input: any, fallback: boolean): boolean {
  if (typeof input === 'boolean') return input
  if (typeof input === 'string') {
    const normalized = input.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  return fallback
}

function asComparisonOperatorValue(input: any, fallback: DecisionComparisonOperator = '=='): DecisionComparisonOperator {
  const operator = asTrimmedString(input)
  if (operator && COMPARISON_OPERATORS.has(operator)) {
    return operator as DecisionComparisonOperator
  }
  return fallback
}

function asTelemetryParameter(
  input: any,
  fallback: NonNullable<DecisionNodeAutoTrigger['parameter']> = 'altitude_ft'
): NonNullable<DecisionNodeAutoTrigger['parameter']> {
  const parameter = asTrimmedString(input)
  if (parameter && TELEMETRY_PARAMETERS.has(parameter)) {
    return parameter as NonNullable<DecisionNodeAutoTrigger['parameter']>
  }
  return fallback
}

function asTelemetryValue(input: any, fallback: number | string = 0): number | string {
  const numeric = asNumber(input)
  if (typeof numeric === 'number') return numeric
  const stringValue = asTrimmedString(input)
  if (stringValue !== undefined) return stringValue
  return fallback
}

function asVariableValue(input: any, fallback: number | string | boolean = ''): number | string | boolean {
  const numeric = asNumber(input)
  if (typeof numeric === 'number') return numeric
  if (typeof input === 'boolean') return input
  const stringValue = asTrimmedString(input)
  if (stringValue !== undefined) return stringValue
  return fallback
}

export function sanitizeLayout(raw: any): DecisionNodeLayout | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const x = asNumber(raw.x) ?? 0
  const y = asNumber(raw.y) ?? 0
  const layout: DecisionNodeLayout = { x, y }
  const width = asNumber(raw.width)
  const height = asNumber(raw.height)
  if (typeof width === 'number') layout.width = width
  if (typeof height === 'number') layout.height = height
  const color = asTrimmedString(raw.color)
  if (color) layout.color = color
  const icon = asTrimmedString(raw.icon)
  if (icon) layout.icon = icon
  if (typeof raw.locked === 'boolean') {
    layout.locked = raw.locked
  }
  return layout
}

export function sanitizeMetadata(raw: any): DecisionNodeMetadata | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const metadata: DecisionNodeMetadata = {}
  if (Array.isArray(raw.tags)) {
    metadata.tags = raw.tags
      .map((tag: any) => asTrimmedString(tag))
      .filter((tag): tag is string => Boolean(tag))
  }
  const notes = asTrimmedString(raw.notes)
  if (notes) metadata.notes = notes
  if (typeof raw.pinned === 'boolean') metadata.pinned = raw.pinned
  const complexity = asTrimmedString(raw.complexity)
  if (complexity && ['low', 'medium', 'high'].includes(complexity)) {
    metadata.complexity = complexity as DecisionNodeMetadata['complexity']
  }
  return Object.keys(metadata).length ? metadata : undefined
}

function sanitizeLLMPlaceholder(raw: any): DecisionNodeLLMPlaceholder | null {
  if (!raw || typeof raw !== 'object') return null
  const key = asTrimmedString(raw.key)
  const label = asTrimmedString(raw.label)
  if (!key || !label) return null
  const placeholder: DecisionNodeLLMPlaceholder = { key, label }
  const description = asTrimmedString(raw.description)
  if (description) placeholder.description = description
  if (typeof raw.required === 'boolean') placeholder.required = raw.required
  const example = asTrimmedString(raw.example)
  if (example) placeholder.example = example
  const defaultValue = asTrimmedString(raw.defaultValue)
  if (defaultValue !== undefined) placeholder.defaultValue = defaultValue
  const type = asTrimmedString(raw.type)
  if (type && ['text', 'number', 'choice'].includes(type)) {
    placeholder.type = type as DecisionNodeLLMPlaceholder['type']
  }
  return placeholder
}

export function sanitizeLLMTemplate(raw: any): DecisionNodeLLMTemplate | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const template: DecisionNodeLLMTemplate = {}
  const summary = asTrimmedString(raw.summary)
  if (summary) template.summary = summary
  const prompt = asTrimmedString(raw.prompt)
  if (prompt) template.prompt = prompt
  const schema = asTrimmedString(raw.responseSchema)
  if (schema) template.responseSchema = schema
  if (raw.autoProceed !== undefined) template.autoProceed = asBoolean(raw.autoProceed, false)
  const temperature = asNumber(raw.temperature)
  if (typeof temperature === 'number') template.temperature = temperature
  const topP = asNumber(raw.topP)
  if (typeof topP === 'number') template.topP = topP
  const maxOutputTokens = asNumber(raw.maxOutputTokens)
  if (typeof maxOutputTokens === 'number') template.maxOutputTokens = maxOutputTokens
  if (Array.isArray(raw.guardrails)) {
    template.guardrails = raw.guardrails
      .map((item: any) => asTrimmedString(item))
      .filter((item): item is string => Boolean(item))
  }
  const notes = asTrimmedString(raw.notes)
  if (notes) template.notes = notes
  if (Array.isArray(raw.placeholders)) {
    const placeholders = raw.placeholders
      .map((item: any) => sanitizeLLMPlaceholder(item))
      .filter((item): item is DecisionNodeLLMPlaceholder => Boolean(item))
    template.placeholders = placeholders
  }
  return Object.keys(template).length ? template : undefined
}

export function sanitizeAutoTrigger(raw: any): DecisionNodeAutoTrigger | undefined {
  const payload = raw && typeof raw === 'object' ? raw : {}
  const type = asTrimmedString(payload.type)
  const normalizedType =
    type && AUTO_TRIGGER_TYPES.has(type) ? (type as DecisionNodeAutoTrigger['type']) : 'expression'

  const trigger: DecisionNodeAutoTrigger = {
    id: asTrimmedString(payload.id) || `auto_${randomUUID()}`,
    type: normalizedType,
  }

  if (normalizedType === 'expression') {
    trigger.expression = asTrimmedString(payload.expression) ?? ''
  } else if (normalizedType === 'telemetry') {
    trigger.parameter = asTelemetryParameter(payload.parameter)
    trigger.operator = asComparisonOperatorValue(payload.operator)
    trigger.value = asTelemetryValue(payload.value, 0)
    const unit = asTrimmedString(payload.unit)
    if (unit) trigger.unit = unit
  } else if (normalizedType === 'variable') {
    trigger.variable = asTrimmedString(payload.variable) ?? ''
    trigger.operator = asComparisonOperatorValue(payload.operator)
    trigger.value = asVariableValue(payload.value, '')
  }

  trigger.once = asBoolean(payload.once, true)
  const delayMs = asNumber(payload.delayMs)
  if (typeof delayMs === 'number') trigger.delayMs = delayMs
  const description = asTrimmedString(payload.description)
  if (description) trigger.description = description

  return trigger
}

export function sanitizeNodeTrigger(raw: any, index = 0): DecisionNodeTrigger {
  const payload = raw && typeof raw === 'object' ? raw : {}
  const type = asTrimmedString(payload.type)
  const normalizedType =
    type && NODE_TRIGGER_TYPES.has(type) ? (type as DecisionNodeTrigger['type']) : 'none'

  const trigger: DecisionNodeTrigger = {
    id: asTrimmedString(payload.id) || `trigger_${randomUUID()}`,
    type: normalizedType,
    order: typeof payload.order === 'number' ? payload.order : index,
  }

  if (trigger.type === 'auto_time') {
    trigger.delaySeconds = asNumber(payload.delaySeconds) ?? 0
  } else if (trigger.type === 'auto_variable') {
    trigger.variable = asTrimmedString(payload.variable) ?? ''
    trigger.operator = asComparisonOperatorValue(payload.operator)
    trigger.value = asVariableValue(payload.value, '')
  } else if (trigger.type === 'regex') {
    trigger.pattern = asTrimmedString(payload.pattern) ?? ''
    trigger.patternFlags = asTrimmedString(payload.patternFlags) ?? ''
  }

  const description = asTrimmedString(payload.description)
  if (description) trigger.description = description

  return trigger
}

export function sanitizeNodeCondition(raw: any, index = 0): DecisionNodeCondition {
  const payload = raw && typeof raw === 'object' ? raw : {}
  const type = asTrimmedString(payload.type)
  const normalizedType =
    type && NODE_CONDITION_TYPES.has(type)
      ? (type as DecisionNodeCondition['type'])
      : 'variable_value'

  const condition: DecisionNodeCondition = {
    id: asTrimmedString(payload.id) || `condition_${randomUUID()}`,
    type: normalizedType,
    order: typeof payload.order === 'number' ? payload.order : index,
  }

  const description = asTrimmedString(payload.description)
  if (description) condition.description = description

  if (condition.type === 'variable_value') {
    condition.variable = asTrimmedString(payload.variable) ?? ''
    condition.operator = asComparisonOperatorValue(payload.operator)
    condition.value = asVariableValue(payload.value, '')
  } else {
    condition.pattern = asTrimmedString(payload.pattern) ?? ''
    condition.patternFlags = asTrimmedString(payload.patternFlags) ?? ''
  }

  return condition
}

export function sanitizeTransition(raw: any, index = 0): DecisionNodeTransition {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid transition payload')
  }
  const key = asTrimmedString(raw.key) || `tr_${randomUUID()}`
  const type = asTrimmedString(raw.type)
  const normalizedType = type && TRANSITION_TYPES.has(type) ? type : 'next'
  const target = asTrimmedString(raw.target)
  if (!target) {
    throw new Error('Transition target is required')
  }

  const transition: DecisionNodeTransition = {
    key,
    type: normalizedType as DecisionNodeTransition['type'],
    target,
    order: typeof raw.order === 'number' ? raw.order : index,
  }

  const label = asTrimmedString(raw.label)
  if (label) transition.label = label
  const description = asTrimmedString(raw.description)
  if (description) transition.description = description
  const condition = asTrimmedString(raw.condition)
  if (condition) transition.condition = condition
  const guard = asTrimmedString(raw.guard)
  if (guard) transition.guard = guard

  if (raw.timer && typeof raw.timer === 'object') {
    const timerValue = asNumber(raw.timer.afterSeconds)
    if (typeof timerValue === 'number') {
      transition.timer = {
        afterSeconds: timerValue,
        allowManualProceed: asBoolean(raw.timer.allowManualProceed, true),
      }
    }
  }

  if (raw.autoTrigger) {
    transition.autoTrigger = sanitizeAutoTrigger(raw.autoTrigger)
  }

  if (raw.metadata && typeof raw.metadata === 'object') {
    const color = asTrimmedString(raw.metadata.color)
    const icon = asTrimmedString(raw.metadata.icon)
    const notes = asTrimmedString(raw.metadata.notes)
    const previewTemplate = asTrimmedString(raw.metadata.previewTemplate)
    const metadata: DecisionNodeTransition['metadata'] = {}
    if (color) metadata.color = color
    if (icon) metadata.icon = icon
    if (notes) metadata.notes = notes
    if (previewTemplate) metadata.previewTemplate = previewTemplate
    if (Object.keys(metadata).length) {
      transition.metadata = metadata
    }
  }

  return transition
}
