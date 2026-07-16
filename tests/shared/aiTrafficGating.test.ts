import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_READBACK_PROTECTION_MS,
  evaluateGate,
  gateOpen,
  readbackPending,
  type GateInput,
} from '~~/shared/utils/aiTraffic/gating'

const NOW = 1_000_000

/** A session in its natural resting state: open frequency, nothing pending. */
const openInput = (overrides: Partial<GateInput> = {}): GateInput => ({
  aiTrafficEnabled: true,
  isRecording: false,
  transmitInFlight: false,
  sessionActive: true,
  readback: {
    currentStateRole: 'atc',
    backendExpectedPhrase: null,
    lastControllerSpeechAtMs: null,
    nowMs: NOW,
  },
  ...overrides,
})

describe('readbackPending — the fresh-readback window', () => {
  const freshWindow = {
    currentStateRole: 'pilot' as const,
    backendExpectedPhrase: 'Cleared to land runway 25R, DLH39A',
    lastControllerSpeechAtMs: NOW,
    nowMs: NOW + 1000,
  }

  it('locks the frequency right after ATC issues an instruction', () => {
    assert.equal(readbackPending(freshWindow), true)
  })

  it('stays locked for the whole protection window', () => {
    assert.equal(
      readbackPending({ ...freshWindow, nowMs: NOW + DEFAULT_READBACK_PROTECTION_MS - 1 }),
      true,
    )
  })

  it('releases once the window lapses — a dawdling pilot must not mute the frequency forever', () => {
    assert.equal(
      readbackPending({ ...freshWindow, nowMs: NOW + DEFAULT_READBACK_PROTECTION_MS }),
      false,
    )
    assert.equal(readbackPending({ ...freshWindow, nowMs: NOW + 60_000 }), false)
  })

  it('does not lock on an ATC or system state, even with a phrase set', () => {
    assert.equal(readbackPending({ ...freshWindow, currentStateRole: 'atc' }), false)
    assert.equal(readbackPending({ ...freshWindow, currentStateRole: 'system' }), false)
    assert.equal(readbackPending({ ...freshWindow, currentStateRole: undefined }), false)
  })

  it('does not lock on a pilot state the backend expects nothing for', () => {
    assert.equal(readbackPending({ ...freshWindow, backendExpectedPhrase: null }), false)
    assert.equal(readbackPending({ ...freshWindow, backendExpectedPhrase: '' }), false)
  })

  it('does not lock before any ATC instruction has been spoken', () => {
    assert.equal(readbackPending({ ...freshWindow, lastControllerSpeechAtMs: null }), false)
  })

  it('supports the literal-strict reading via one parameter, not a second code path', () => {
    const strict = { ...freshWindow, nowMs: NOW + 3_600_000, readbackProtectionMs: Number.POSITIVE_INFINITY }
    assert.equal(readbackPending(strict), true)
  })

  it('supports a custom finite window', () => {
    const win = { ...freshWindow, readbackProtectionMs: 5000 }
    assert.equal(readbackPending({ ...win, nowMs: NOW + 4999 }), true)
    assert.equal(readbackPending({ ...win, nowMs: NOW + 5000 }), false)
  })
})

describe('evaluateGate — the chain', () => {
  it('opens on a quiet, active session', () => {
    assert.deepEqual(evaluateGate(openInput()), { open: true })
    assert.equal(gateOpen(openInput()), true)
  })

  it('is shut while the settings toggle is off', () => {
    assert.deepEqual(evaluateGate(openInput({ aiTrafficEnabled: false })), {
      open: false,
      reason: 'disabled',
    })
  })

  it('is shut while the user holds PTT — absolutely, no window', () => {
    assert.deepEqual(evaluateGate(openInput({ isRecording: true })), {
      open: false,
      reason: 'recording',
    })
  })

  it('is shut while a user transmission awaits the backend', () => {
    assert.deepEqual(evaluateGate(openInput({ transmitInFlight: true })), {
      open: false,
      reason: 'transmit_in_flight',
    })
  })

  it('is shut without an active session', () => {
    assert.deepEqual(evaluateGate(openInput({ sessionActive: false })), {
      open: false,
      reason: 'session_inactive',
    })
  })

  it('is shut inside the fresh readback window', () => {
    const input = openInput({
      readback: {
        currentStateRole: 'pilot',
        backendExpectedPhrase: 'Runway 25R, cleared to land, DLH39A',
        lastControllerSpeechAtMs: NOW,
        nowMs: NOW + 2000,
      },
    })
    assert.deepEqual(evaluateGate(input), { open: false, reason: 'readback_pending' })
  })

  it('reopens after the readback window lapses', () => {
    const input = openInput({
      readback: {
        currentStateRole: 'pilot',
        backendExpectedPhrase: 'Runway 25R, cleared to land, DLH39A',
        lastControllerSpeechAtMs: NOW,
        nowMs: NOW + DEFAULT_READBACK_PROTECTION_MS + 1,
      },
    })
    assert.equal(gateOpen(input), true)
  })

  it('reports the most specific reason when several block at once', () => {
    const everythingShut = openInput({
      aiTrafficEnabled: false,
      isRecording: true,
      transmitInFlight: true,
      sessionActive: false,
    })
    assert.equal(evaluateGate(everythingShut).reason, 'disabled')
    assert.equal(evaluateGate({ ...everythingShut, aiTrafficEnabled: true }).reason, 'recording')
    assert.equal(
      evaluateGate({ ...everythingShut, aiTrafficEnabled: true, isRecording: false }).reason,
      'transmit_in_flight',
    )
  })

  it('PTT outranks the readback window: the user speaking is never negotiable', () => {
    const input = openInput({
      isRecording: true,
      readback: {
        currentStateRole: 'pilot',
        backendExpectedPhrase: 'anything',
        lastControllerSpeechAtMs: NOW - 60_000, // window long lapsed
        nowMs: NOW,
      },
    })
    assert.equal(gateOpen(input), false)
  })
})

describe('evaluateGate — the two evaluation points', () => {
  // The chain is called before enqueuing AND again when the task starts playing.
  // Seconds pass in between; these are the cases that must differ across them.
  it('a gate that was open at enqueue time is shut at play time once PTT goes down', () => {
    const atEnqueue = openInput()
    assert.equal(gateOpen(atEnqueue), true)
    const atPlayback = { ...atEnqueue, isRecording: true }
    assert.equal(gateOpen(atPlayback), false)
  })

  it('a gate that was open at enqueue time is shut at play time once the toggle flips off', () => {
    // This is what makes "finish the current call, start nothing new" work
    // without touching the speech queue's mechanics.
    assert.equal(gateOpen(openInput()), true)
    assert.equal(gateOpen(openInput({ aiTrafficEnabled: false })), false)
  })

  it('a gate that was open at enqueue time is shut at play time once ATC issues an instruction', () => {
    assert.equal(gateOpen(openInput()), true)
    const afterAtcSpoke = openInput({
      readback: {
        currentStateRole: 'pilot',
        backendExpectedPhrase: 'Descend 4000 feet, DLH39A',
        lastControllerSpeechAtMs: NOW + 500,
        nowMs: NOW + 900,
      },
    })
    assert.equal(gateOpen(afterAtcSpoke), false)
  })

  it('a gate that was shut at enqueue time can be open at play time', () => {
    const duringPtt = openInput({ isRecording: true })
    assert.equal(gateOpen(duringPtt), false)
    assert.equal(gateOpen({ ...duringPtt, isRecording: false }), true)
  })
})
