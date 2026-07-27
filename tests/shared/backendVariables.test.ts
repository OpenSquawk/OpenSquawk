import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { buildBackendVariables } from '~~/shared/utils/backendVariables'

/** A VATSIM flight plan and the engine variables a session starts from. */
const build = (
  flightPlan: Record<string, any> = {},
  vars: Record<string, any> = {},
  atisRunway: string | null = null
) =>
  buildBackendVariables({
    flightPlan: { callsign: 'DLH39A', dep: 'EDDF', arr: 'EDDM', ...flightPlan },
    vars: { callsign: 'DLH39A', dest: 'EDDM', sid: 'BIBAX1N', ...vars },
    atisRunway,
  })

describe('buildBackendVariables — the filed route', () => {
  it('forwards the route so the clearance can grant it', () => {
    // Without this the backend never sees the route and the clearance stops
    // at the SID.
    assert.equal(
      build({ route: 'SULUS5S SULUS Y101 ARMUT' }).route,
      'SULUS5S SULUS Y101 ARMUT'
    )
  })

  it('sends an empty route for a flight that filed none', () => {
    // Demo and manual flights. The backend keeps the flow defaults, which are
    // the wording without a route.
    assert.equal(build().route, '')
  })

  it('sends an empty route rather than dropping the key', () => {
    // A missing key and an empty one are the same to the backend, but the key
    // being present keeps the payload shape stable across flight sources.
    assert.ok('route' in build())
  })
})

describe('buildBackendVariables — flight plan mapping', () => {
  it('prefers the engine callsign over the plan', () => {
    assert.equal(build({ callsign: 'DLH1' }, { callsign: 'DLH39A' }).callsign, 'DLH39A')
  })

  it('falls back to the plan callsign when the engine has none', () => {
    assert.equal(build({ callsign: 'DLH1' }, { callsign: '' }).callsign, 'DLH1')
  })

  it('uses the ATIS runway over the engine one', () => {
    assert.equal(build({}, { runway: '07C' }, '25R').runway, '25R')
  })

  it('falls back to the engine runway when the ATIS gives none', () => {
    assert.equal(build({}, { runway: '07C' }).runway, '07C')
  })

  it('sends numeric values as strings', () => {
    const payload = build({}, { squawk: 2341, initial_altitude_ft: 6000, qnh_hpa: 1015 })
    assert.equal(payload.squawk, '2341')
    assert.equal(payload.initial_altitude, '6000')
    assert.equal(payload.qnh, '1015')
  })

  it('leaves taxi_route out so the backend computes the real one', () => {
    assert.ok(!('taxi_route' in build()))
  })
})
