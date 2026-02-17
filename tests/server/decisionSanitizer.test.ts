import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  sanitizeAutoTrigger,
  sanitizeNodeCondition,
  sanitizeNodeTrigger,
  sanitizeTransition,
} from '~~/server/utils/decisionSanitizer'

describe('decisionSanitizer', () => {
  it('throws when transition has no target', () => {
    assert.throws(
      () => sanitizeTransition({ type: 'ok' }),
      /Transition target is required/
    )
  })

  it('normalizes transition defaults, timer and auto trigger payloads', () => {
    const transition = sanitizeTransition(
      {
        type: 'unknown',
        target: 'STATE_B',
        timer: {
          afterSeconds: '12',
          allowManualProceed: 'false',
        },
        autoTrigger: {
          type: 'telemetry',
          parameter: 'speed_kts',
          operator: '>=',
          value: '130',
          once: 'false',
        },
        metadata: {
          color: ' cyan ',
          notes: ' keep speed ',
        },
      },
      4
    )

    assert.equal(transition.type, 'next')
    assert.equal(transition.order, 4)
    assert.deepEqual(transition.timer, { afterSeconds: 12, allowManualProceed: false })
    assert.equal(transition.autoTrigger?.type, 'telemetry')
    assert.equal(transition.autoTrigger?.parameter, 'speed_kts')
    assert.equal(transition.autoTrigger?.operator, '>=')
    assert.equal(transition.autoTrigger?.value, 130)
    assert.equal(transition.autoTrigger?.once, false)
    assert.equal(transition.metadata?.color, 'cyan')
    assert.equal(transition.metadata?.notes, 'keep speed')
  })

  it('builds regex triggers and regex_not conditions', () => {
    const trigger = sanitizeNodeTrigger(
      {
        type: 'regex',
        pattern: 'roger',
        patternFlags: 'i',
      },
      2
    )
    const condition = sanitizeNodeCondition(
      {
        type: 'regex_not',
        pattern: 'hold short',
        patternFlags: 'i',
      },
      3
    )

    assert.equal(trigger.type, 'regex')
    assert.equal(trigger.pattern, 'roger')
    assert.equal(trigger.patternFlags, 'i')
    assert.equal(trigger.order, 2)
    assert.match(trigger.id, /^trigger_/)

    assert.equal(condition.type, 'regex_not')
    assert.equal(condition.pattern, 'hold short')
    assert.equal(condition.patternFlags, 'i')
    assert.equal(condition.order, 3)
    assert.match(condition.id, /^condition_/)
  })

  it('coerces variable auto trigger values', () => {
    const trigger = sanitizeAutoTrigger({
      type: 'variable',
      variable: 'is_ready',
      operator: '==',
      value: true,
      once: false,
    })

    assert.equal(trigger?.type, 'variable')
    assert.equal(trigger?.variable, 'is_ready')
    assert.equal(trigger?.value, 'true')
    assert.equal(trigger?.once, false)
  })
})
