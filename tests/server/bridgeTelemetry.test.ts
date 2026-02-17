import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { getBridgeLog, logBridgeEvent } from '~~/server/utils/bridgeLog'
import { getBridgeTokenFromHeader, normalizeBridgeToken } from '~~/server/utils/bridge'
import { flightlabTelemetryStore } from '~~/server/utils/flightlabTelemetry'

describe('bridge token handling', () => {
  it('normalizes valid tokens and rejects invalid inputs', () => {
    assert.equal(normalizeBridgeToken('  bridge-token-123  '), 'bridge-token-123')
    assert.equal(normalizeBridgeToken('abc'), null)
    assert.equal(normalizeBridgeToken(' '.repeat(10)), null)
    assert.equal(normalizeBridgeToken(1234), null)
    assert.equal(normalizeBridgeToken('x'.repeat(257)), null)
  })

  it('reads and normalizes x-bridge-token from request headers', () => {
    const event = {
      node: {
        req: {
          headers: {
            'x-bridge-token': '  live-bridge-token  ',
          },
        },
      },
    } as any

    assert.equal(getBridgeTokenFromHeader(event), 'live-bridge-token')
  })
})

describe('bridge log store', () => {
  it('keeps only the latest 200 entries and supports since filtering', () => {
    const token = `tok-${Date.now()}-${Math.random().toString(36).slice(2)}`

    for (let i = 0; i < 205; i++) {
      logBridgeEvent(token, {
        endpoint: '/api/bridge/data',
        method: 'POST',
        statusCode: 200,
        color: 'green',
        summary: `entry-${i}`,
      })
    }

    const all = getBridgeLog(token)
    assert.equal(all.length, 200)
    assert.equal(all[0]!.summary, 'entry-5')
    assert.equal(all[199]!.summary, 'entry-204')
    assert.equal(all[0]!.id < all[199]!.id, true)

    const sinceId = all[149]!.id
    const sinceEntries = getBridgeLog(token, sinceId)
    assert.equal(sinceEntries.length, 50)
    assert.equal(sinceEntries.every((entry) => entry.id > sinceId), true)
  })
})

describe('flightlab telemetry store', () => {
  it('stores latest telemetry and notifies listeners', () => {
    const userId = `user-${Date.now()}`
    const received: any[] = []

    const unsubscribe = flightlabTelemetryStore.subscribe((incomingUserId, data) => {
      if (incomingUserId === userId) {
        received.push(data)
      }
    })

    flightlabTelemetryStore.update(userId, { IAS: 121, ALT: 4500 })
    const latest = flightlabTelemetryStore.get(userId)

    assert.equal(latest?.IAS, 121)
    assert.equal(latest?.ALT, 4500)
    assert.equal(typeof latest?.timestamp, 'number')
    assert.equal(received.length, 1)

    const callsBeforeUnsubscribe = received.length
    unsubscribe()
    flightlabTelemetryStore.update(userId, { IAS: 130 })

    assert.equal(flightlabTelemetryStore.get(userId)?.IAS, 130)
    assert.equal(received.length, callsBeforeUnsubscribe)
  })
})
