import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { PilotProfile } from '~~/server/models/PilotProfile'

describe('PilotProfile model', () => {
  it('is importable without a DB connection', () => {
    assert.ok(PilotProfile, 'PilotProfile model must be importable')
  })

  it('schema defines the expected fields', () => {
    const paths = PilotProfile.schema.paths
    for (const field of [
      'user', 'simulator', 'os', 'hardware', 'radioConfidence', 'radioPainPoint',
      'networkExperience', 'toolkit', 'toolkitDuration', 'topFeatures',
      'pricingPreference', 'resultCallsign', 'completedAt', 'skippedAt',
    ]) {
      assert.ok(field in paths, `schema must have ${field}`)
    }
  })

  it('user reference is required and unique', () => {
    const userPath = PilotProfile.schema.path('user') as any
    assert.equal(userPath?.options?.required, true)
    assert.equal(userPath?.options?.unique, true)
  })

  it('radioConfidence is bounded 1-5', () => {
    const path = PilotProfile.schema.path('radioConfidence') as any
    assert.equal(path?.options?.min, 1)
    assert.equal(path?.options?.max, 5)
  })
})
