import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { SimControlQueue } from '~~/server/utils/simControlQueue'

const HEADING: any = { type: 'set_heading', heading_deg: 270 }
const ALTITUDE: any = { type: 'set_altitude', altitude_ft: 8000 }

function clock(startMs = 0) {
  let t = startMs
  return { now: () => t, advance: (ms: number) => { t += ms } }
}

describe('SimControlQueue — enqueue / drainPending', () => {
  it('delivers a pending command exactly once', () => {
    const q = new SimControlQueue()
    const pending = q.enqueue('tok-a', HEADING)
    assert.equal(typeof pending.id, 'string')
    assert.ok(pending.id.length > 0)
    assert.deepEqual(pending.command, HEADING)

    const first = q.drainPending('tok-a')
    assert.equal(first.length, 1)
    assert.equal(first[0]!.id, pending.id)

    const second = q.drainPending('tok-a')
    assert.equal(second.length, 0)
  })

  it('keeps queues isolated per token', () => {
    const q = new SimControlQueue()
    q.enqueue('tok-a', HEADING)
    q.enqueue('tok-b', ALTITUDE)

    const forA = q.drainPending('tok-a')
    assert.equal(forA.length, 1)
    assert.deepEqual(forA[0]!.command, HEADING)

    const forB = q.drainPending('tok-b')
    assert.equal(forB.length, 1)
    assert.deepEqual(forB[0]!.command, ALTITUDE)
  })

  it('drainPending on an unknown token returns empty, not an error', () => {
    const q = new SimControlQueue()
    assert.deepEqual(q.drainPending('never-enqueued'), [])
  })
})

describe('SimControlQueue — resolve', () => {
  it('resolves a delivered command and the client can read the result once', () => {
    const q = new SimControlQueue()
    const pending = q.enqueue('tok-a', HEADING)
    q.drainPending('tok-a') // bridge picks it up → status 'delivered'

    const resolved = q.resolve('tok-a', pending.id, 'ok')
    assert.equal(resolved, true)

    const results = q.drainResultsForClient('tok-a')
    assert.equal(results.length, 1)
    assert.equal(results[0]!.id, pending.id)
    assert.equal(results[0]!.status, 'ok')
    assert.equal(results[0]!.reason, null)

    // One-shot: a second poll sees nothing more for this id.
    assert.deepEqual(q.drainResultsForClient('tok-a'), [])
  })

  it('carries a failure reason through to the client', () => {
    const q = new SimControlQueue()
    const pending = q.enqueue('tok-a', HEADING)
    q.drainPending('tok-a')
    q.resolve('tok-a', pending.id, 'failed', 'aircraft on ground')

    const [result] = q.drainResultsForClient('tok-a')
    assert.equal(result!.status, 'failed')
    assert.equal(result!.reason, 'aircraft on ground')
  })

  it('rejects a resolve for a mismatched token (cannot resolve another bridge\'s command)', () => {
    const q = new SimControlQueue()
    const pending = q.enqueue('tok-a', HEADING)
    q.drainPending('tok-a')

    const resolved = q.resolve('tok-b', pending.id, 'ok')
    assert.equal(resolved, false)
    // The command is still awaiting resolution under the real token.
    assert.deepEqual(q.drainResultsForClient('tok-a'), [])
  })

  it('rejects a resolve for an unknown id', () => {
    const q = new SimControlQueue()
    assert.equal(q.resolve('tok-a', 'no-such-id', 'ok'), false)
  })

  it('allows resolving a command still pending (not yet drained by the bridge)', () => {
    const q = new SimControlQueue()
    const pending = q.enqueue('tok-a', HEADING)
    assert.equal(q.resolve('tok-a', pending.id, 'ok'), true)
  })
})

describe('SimControlQueue — TTL expiry', () => {
  it('expires a command that was never delivered before the TTL', () => {
    const c = clock()
    const q = new SimControlQueue({ ttlMs: 1000, now: c.now })
    q.enqueue('tok-a', HEADING)

    c.advance(1001)
    assert.deepEqual(q.drainPending('tok-a'), []) // expired before the bridge ever polled

    const results = q.drainResultsForClient('tok-a')
    assert.equal(results.length, 1)
    assert.equal(results[0]!.status, 'expired')
  })

  it('expires a delivered command the bridge never resolved', () => {
    const c = clock()
    const q = new SimControlQueue({ ttlMs: 1000, now: c.now })
    const pending = q.enqueue('tok-a', HEADING)
    q.drainPending('tok-a') // delivered at t=0

    c.advance(1001)
    const results = q.drainResultsForClient('tok-a')
    assert.equal(results.length, 1)
    assert.equal(results[0]!.status, 'expired')

    // A late result from the bridge can no longer land on an already-expired command.
    assert.equal(q.resolve('tok-a', pending.id, 'ok'), false)
  })

  it('does not expire a command resolved within the TTL', () => {
    const c = clock()
    const q = new SimControlQueue({ ttlMs: 1000, now: c.now })
    const pending = q.enqueue('tok-a', HEADING)
    q.drainPending('tok-a')
    c.advance(500)
    assert.equal(q.resolve('tok-a', pending.id, 'ok'), true)
    c.advance(600) // past the original TTL, but already resolved
    const results = q.drainResultsForClient('tok-a')
    assert.equal(results.length, 1)
    assert.equal(results[0]!.status, 'ok')
  })
})
