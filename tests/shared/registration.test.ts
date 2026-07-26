import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  generateGermanRegistration,
  germanRegistrationPrefix,
} from '../../shared/utils/registration.ts'

// German registrations encode a weight/type class in the first letter after
// "D-" (LuftVZO Anlage 1): D-A above 20 t, D-I multi-engine 2–5.7 t,
// D-E single-engine piston up to 2 t, D-H helicopters.

test('airliners get a D-A registration', () => {
  for (const type of ['A320', 'A319', 'A321', 'B738', 'B39M', 'A333', 'A359', 'B77W', 'B788', 'B744', 'A388', 'E190', 'CRJ9']) {
    assert.equal(germanRegistrationPrefix(type), 'A', `${type} should be a D-A registration`)
  }
})

test('single-engine light aircraft get a D-E registration', () => {
  for (const type of ['C172', 'PA28', 'DA40', 'C152', 'SR22', 'DR40', 'P28A']) {
    assert.equal(germanRegistrationPrefix(type), 'E', `${type} should be a D-E registration`)
  }
})

test('light twins get a D-I registration', () => {
  for (const type of ['BE58', 'PA34', 'C310', 'BE76']) {
    assert.equal(germanRegistrationPrefix(type), 'I', `${type} should be a D-I registration`)
  }
})

test('helicopters get a D-H registration', () => {
  for (const type of ['R44', 'R22', 'EC35', 'H125', 'AS50']) {
    assert.equal(germanRegistrationPrefix(type), 'H', `${type} should be a D-H registration`)
  }
})

test('an unknown type falls back to the light single class', () => {
  // VFR scenarios are overwhelmingly light aircraft, so that is the safe guess.
  assert.equal(germanRegistrationPrefix('ZZZZ'), 'E')
  assert.equal(germanRegistrationPrefix(''), 'E')
  assert.equal(germanRegistrationPrefix(undefined as unknown as string), 'E')
})

test('the type is matched case-insensitively and ignores a trailing variant', () => {
  assert.equal(germanRegistrationPrefix('a320'), 'A')
  assert.equal(germanRegistrationPrefix('A320/M'), 'A')
  assert.equal(germanRegistrationPrefix(' c172 '), 'E')
})

test('generateGermanRegistration produces a well-formed registration for the class', () => {
  for (let i = 0; i < 200; i++) {
    const { registration } = generateGermanRegistration('A320')
    assert.match(registration, /^D-A[A-Z]{3}$/, registration)
  }
  for (let i = 0; i < 200; i++) {
    const { registration } = generateGermanRegistration('C172')
    assert.match(registration, /^D-E[A-Z]{3}$/, registration)
  }
})

test('the abbreviated callsign is the first letter plus the last two', () => {
  // German ATC abbreviates D-EMIL to "D-IL" after first contact.
  const { registration, short } = generateGermanRegistration('C172')
  const letters = registration.slice(2)
  assert.equal(short, `D-${letters.slice(-2)}`)
  assert.match(short, /^D-[A-Z]{2}$/)
})

test('an A320 never gets the light-aircraft registration that prompted this', () => {
  for (let i = 0; i < 500; i++) {
    const { registration } = generateGermanRegistration('A320')
    assert.ok(!registration.startsWith('D-E'), `A320 got ${registration}`)
  }
})
