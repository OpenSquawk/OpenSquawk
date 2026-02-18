import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { resolveDomeLightMode } from '~~/server/api/bridge/data.post'

describe('bridge dome light mode mapping', () => {
  it('maps all dome/nav combinations to expected mode', () => {
    assert.equal(resolveDomeLightMode({ dome_light: false, nav_logo_lights: false }), 'off')
    assert.equal(resolveDomeLightMode({ dome_light: false, nav_logo_lights: true }), 'off')
    assert.equal(resolveDomeLightMode({ dome_light: true, nav_logo_lights: false }), 'amber')
    assert.equal(resolveDomeLightMode({ dome_light: true, nav_logo_lights: true }), 'white')
  })

  it('supports numeric and string boolean payloads', () => {
    assert.equal(resolveDomeLightMode({ dome_light: 1, nav_logo_lights: 0 }), 'amber')
    assert.equal(resolveDomeLightMode({ dome_light: '1', nav_logo_lights: '1' }), 'white')
    assert.equal(resolveDomeLightMode({ dome_light: 'false', nav_logo_lights: 'true' }), 'off')
  })

  it('returns null when dome_light is missing or invalid', () => {
    assert.equal(resolveDomeLightMode({ nav_logo_lights: true }), null)
    assert.equal(resolveDomeLightMode({ dome_light: 'invalid', nav_logo_lights: true }), null)
  })
})
