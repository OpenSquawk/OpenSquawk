import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { lessonVariantSignature } from './variantSignature'
import type { Lesson, Scenario } from './types'

function lessonWithFields(keys: string[]): Pick<Lesson, 'fields'> {
  return {
    fields: keys.map(key => ({
      key,
      label: key,
      expected: (scenario: Scenario) => String((scenario as unknown as Record<string, unknown>)[key] ?? ''),
    })),
  }
}

const scenarioA = { runway: '25L', squawk: '4711' } as unknown as Scenario
const scenarioB = { runway: '07R', squawk: '4711' } as unknown as Scenario

describe('lessonVariantSignature', () => {
  it('is stable for the same scenario', () => {
    const lesson = lessonWithFields(['runway', 'squawk'])
    assert.equal(
      lessonVariantSignature(lesson, scenarioA),
      lessonVariantSignature(lesson, scenarioA),
    )
  })

  it('differs when an expected answer differs', () => {
    const lesson = lessonWithFields(['runway', 'squawk'])
    assert.notEqual(
      lessonVariantSignature(lesson, scenarioA),
      lessonVariantSignature(lesson, scenarioB),
    )
  })

  it('ignores scenario values the lesson never asks for', () => {
    const lesson = lessonWithFields(['squawk'])
    assert.equal(
      lessonVariantSignature(lesson, scenarioA),
      lessonVariantSignature(lesson, scenarioB),
    )
  })

  it('returns a non-empty token for a lesson without fields', () => {
    assert.ok(lessonVariantSignature(lessonWithFields([]), scenarioA).length > 0)
  })

  it('survives a field whose expected() throws', () => {
    const lesson = {
      fields: [{ key: 'boom', label: 'boom', expected: () => { throw new Error('nope') } }],
    } as unknown as Pick<Lesson, 'fields'>
    assert.ok(lessonVariantSignature(lesson, scenarioA).length > 0)
  })
})
