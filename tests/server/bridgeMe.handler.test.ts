import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { BridgeToken } from '~~/server/models/BridgeToken'
import { getBridgeLog } from '~~/server/utils/bridgeLog'

function createEvent(headers: Record<string, string> = {}) {
  return {
    node: {
      req: { headers },
    },
    context: {},
  } as any
}

describe('/api/bridge/me handler', () => {
  it('returns 401 when token header is missing', async () => {
    ;(globalThis as any).defineEventHandler = (handler: any) => handler
    const mod = await import('~~/server/api/bridge/me.get')
    const handler = mod.default

    await assert.rejects(
      () => handler(createEvent()),
      (error: any) =>
        error?.statusCode === 401 &&
        error?.statusMessage === 'Unauthorized' &&
        error?.message === 'x-bridge-token header fehlt oder ist ungültig.'
    )
  })

  it('returns disconnected status when token has no linked user', async () => {
    ;(globalThis as any).defineEventHandler = (handler: any) => handler
    const mod = await import('~~/server/api/bridge/me.get')
    const handler = mod.default

    const originalFindOne = (BridgeToken as any).findOne
    ;(BridgeToken as any).findOne = () => ({
      populate: async () => ({
        token: 'bridge-token-abc',
        user: null,
        connectedAt: new Date('2025-01-01T10:00:00.000Z'),
        lastStatusAt: null,
      }),
    })

    try {
      const result = await handler(createEvent({ 'x-bridge-token': 'bridge-token-abc' }))
      assert.equal(result.connected, false)
      assert.equal(result.user, null)
      assert.equal(result.simConnected, false)
      assert.equal(result.flightActive, false)
      assert.equal(result.connectedAt, '2025-01-01T10:00:00.000Z')

      const logs = getBridgeLog('bridge-token-abc')
      assert.equal(logs.length > 0, true)
      assert.match(logs[logs.length - 1]!.summary, /not connected/i)
    } finally {
      ;(BridgeToken as any).findOne = originalFindOne
    }
  })

  it('returns connected status with mapped user fields', async () => {
    ;(globalThis as any).defineEventHandler = (handler: any) => handler
    const mod = await import('~~/server/api/bridge/me.get')
    const handler = mod.default

    const originalFindOne = (BridgeToken as any).findOne
    ;(BridgeToken as any).findOne = () => ({
      populate: async () => ({
        token: 'bridge-token-live',
        user: {
          _id: '507f1f77bcf86cd799439055',
          email: 'pilot@example.com',
          name: 'Pilot',
        },
        simConnected: true,
        flightActive: true,
        connectedAt: undefined,
        updatedAt: new Date('2025-01-01T11:00:00.000Z'),
        lastStatusAt: new Date('2025-01-01T11:02:00.000Z'),
      }),
    })

    try {
      const result = await handler(createEvent({ 'x-bridge-token': 'bridge-token-live' }))
      assert.equal(result.connected, true)
      assert.equal(result.user.id, '507f1f77bcf86cd799439055')
      assert.equal(result.user.email, 'pilot@example.com')
      assert.equal(result.user.name, 'Pilot')
      assert.equal(result.simConnected, true)
      assert.equal(result.flightActive, true)
      assert.equal(result.connectedAt, '2025-01-01T11:00:00.000Z')
      assert.equal(result.lastStatusAt, '2025-01-01T11:02:00.000Z')
    } finally {
      ;(BridgeToken as any).findOne = originalFindOne
    }
  })
})
