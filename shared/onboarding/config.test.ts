import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  SIMULATOR_OPTIONS,
  OS_OPTIONS,
  HARDWARE_OPTIONS,
  RADIO_PAIN_POINT_OPTIONS,
  TOOLKIT_OPTIONS,
  PAID_TOOLKIT_VALUES,
  TOOLKIT_DURATION_OPTIONS,
  FEATURE_WISH_OPTIONS,
  PRICING_PREFERENCE_OPTIONS,
  ONBOARDING_TOTAL_STEPS,
  createDefaultOnboardingProfile,
} from '~~/shared/onboarding/config'

describe('onboarding config', () => {
  it('every option list has unique, non-empty values', () => {
    for (const list of [
      SIMULATOR_OPTIONS, OS_OPTIONS, HARDWARE_OPTIONS, RADIO_PAIN_POINT_OPTIONS,
      TOOLKIT_OPTIONS, TOOLKIT_DURATION_OPTIONS, FEATURE_WISH_OPTIONS, PRICING_PREFERENCE_OPTIONS,
    ]) {
      const values = list.map(o => o.value)
      assert.equal(new Set(values).size, values.length, 'duplicate option value found')
      assert.ok(values.every(v => typeof v === 'string' && v.length > 0))
    }
  })

  it('PAID_TOOLKIT_VALUES is a subset of TOOLKIT_OPTIONS values', () => {
    const toolkitValues = new Set(TOOLKIT_OPTIONS.map(o => o.value))
    for (const paid of PAID_TOOLKIT_VALUES) {
      assert.ok(toolkitValues.has(paid), `${paid} must be a valid toolkit option`)
    }
  })

  it('ONBOARDING_TOTAL_STEPS matches the number of required screens', () => {
    assert.equal(ONBOARDING_TOTAL_STEPS, 7)
  })

  it('createDefaultOnboardingProfile returns empty/undefined fields and no completion timestamps', () => {
    const profile = createDefaultOnboardingProfile()
    assert.equal(profile.completedAt, null)
    assert.equal(profile.skippedAt, null)
    assert.deepEqual(profile.hardware, [])
    assert.deepEqual(profile.networkExperience, [])
    assert.deepEqual(profile.toolkit, [])
    assert.deepEqual(profile.topFeatures, [])
    assert.deepEqual(profile.toolkitDuration, {})
  })
})
