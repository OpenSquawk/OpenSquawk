import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeOnboardingUpdate, computeResultCallsign } from '~~/server/utils/onboardingProfile'

describe('sanitizeOnboardingUpdate', () => {
  it('accepts a valid simulator value', () => {
    const result = sanitizeOnboardingUpdate({ simulator: 'msfs2024' })
    assert.equal(result.simulator, 'msfs2024')
  })

  it('drops an unknown simulator value', () => {
    const result = sanitizeOnboardingUpdate({ simulator: 'flightgear' })
    assert.equal('simulator' in result, false)
  })

  it('keeps os for non-Windows-only simulators (other, xplane12)', () => {
    const withOther = sanitizeOnboardingUpdate({ simulator: 'other', os: 'linux' })
    assert.equal(withOther.os, 'linux')
    const withXplane = sanitizeOnboardingUpdate({ simulator: 'xplane12', os: 'mac' })
    assert.equal(withXplane.os, 'mac')
    const withMsfs = sanitizeOnboardingUpdate({ simulator: 'msfs2024', os: 'linux' })
    assert.equal('os' in withMsfs, false)
  })

  it('dedupes and filters hardware to known values', () => {
    const result = sanitizeOnboardingUpdate({ hardware: ['hotas', 'hotas', 'jetpack'] })
    assert.deepEqual(result.hardware, ['hotas'])
  })

  it('clamps radioConfidence to 1-5', () => {
    assert.equal(sanitizeOnboardingUpdate({ radioConfidence: 9 }).radioConfidence, 5)
    assert.equal(sanitizeOnboardingUpdate({ radioConfidence: 0 }).radioConfidence, 1)
    assert.equal(sanitizeOnboardingUpdate({ radioConfidence: 3.7 }).radioConfidence, 4)
  })

  it('caps topFeatures at MAX_FEATURE_WISHES', () => {
    const result = sanitizeOnboardingUpdate({
      topFeatures: ['live_ai_atc', 'more_airports', 'voice_packs'],
    })
    assert.equal(result.topFeatures?.length, 2)
  })

  it('only keeps toolkitDuration entries for tools present in toolkit', () => {
    const result = sanitizeOnboardingUpdate({
      toolkit: ['navigraph'],
      toolkitDuration: { navigraph: 'six_plus_months', sayintentions: 'trying' },
    })
    assert.deepEqual(result.toolkitDuration, { navigraph: 'six_plus_months' })
  })

  it('sets completedAt/skippedAt flags to true when requested', () => {
    assert.equal(sanitizeOnboardingUpdate({ completed: true }).completed, true)
    assert.equal(sanitizeOnboardingUpdate({ skipped: true }).skipped, true)
  })

  it('ignores unknown top-level fields', () => {
    const result = sanitizeOnboardingUpdate({ notAField: 'x' } as any)
    assert.equal('notAField' in result, false)
  })
})

describe('computeResultCallsign', () => {
  it('returns Subscription-Ready Power User for long-term paid-tool users choosing monthly', () => {
    const callsign = computeResultCallsign({
      toolkit: ['sayintentions'],
      toolkitDuration: { sayintentions: 'cant_fly_without' },
      pricingPreference: 'monthly',
    } as any)
    assert.equal(callsign, 'Subscription-Ready Power User')
  })

  it('returns Freeware Purist for free_self_host preference', () => {
    const callsign = computeResultCallsign({ pricingPreference: 'free_self_host' } as any)
    assert.equal(callsign, 'Freeware Purist')
  })

  it('returns Weekend VATSIM Learner for low-confidence network flyers', () => {
    const callsign = computeResultCallsign({
      networkExperience: ['vatsim'],
      radioConfidence: 2,
    } as any)
    assert.equal(callsign, 'Weekend VATSIM Learner')
  })

  it('falls back to a neutral default', () => {
    const callsign = computeResultCallsign({} as any)
    assert.equal(callsign, 'Cleared for Takeoff')
  })
})
