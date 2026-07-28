import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import { flightlabTelemetryStore } from '~~/server/utils/flightlabTelemetry'
import handler from '~~/server/api/service/flightlab-telemetry.get'

const originalSecret = process.env.SERVICE_SECRET

function createEvent(subject: string | null, headers: Record<string, string> = {}) {
  const path = subject === null
    ? '/api/service/flightlab-telemetry'
    : `/api/service/flightlab-telemetry?subject=${encodeURIComponent(subject)}`

  return {
    path,
    node: { req: { headers, url: path } },
    context: {},
  } as any
}

describe('/api/service/flightlab-telemetry handler', () => {
  beforeEach(() => {
    delete process.env.SERVICE_SECRET
  })

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.SERVICE_SECRET
    else process.env.SERVICE_SECRET = originalSecret
  })

  it('refuses to run at all when no service secret is configured', async () => {
    // Fail closed: bridge telemetry is user data and must never be readable
    // just because an env var was forgotten.
    await assert.rejects(
      async () => handler(createEvent('507f1f77bcf86cd799439011')),
      (error: any) => error?.statusCode === 503,
    )
  })

  it('rejects a wrong secret', async () => {
    process.env.SERVICE_SECRET = 'the-real-secret'

    await assert.rejects(
      async () => handler(createEvent('507f1f77bcf86cd799439011', { 'x-service-secret': 'nope' })),
      (error: any) => error?.statusCode === 401,
    )
  })

  it('requires a subject', async () => {
    process.env.SERVICE_SECRET = 'the-real-secret'

    await assert.rejects(
      async () => handler(createEvent(null, { 'x-service-secret': 'the-real-secret' })),
      (error: any) => error?.statusCode === 400,
    )
  })

  it('returns the latest telemetry the bridge posted for that subject', async () => {
    process.env.SERVICE_SECRET = 'the-real-secret'
    const subject = '507f1f77bcf86cd799439011'
    flightlabTelemetryStore.update(subject, { AIRSPEED_INDICATED: 142 })

    const result: any = await handler(createEvent(subject, { 'x-service-secret': 'the-real-secret' }))

    assert.equal(result.telemetry.AIRSPEED_INDICATED, 142)
    assert.equal(typeof result.timestamp, 'number')
    assert.equal(result.timestamp, result.telemetry.timestamp)
  })

  it('answers with null for a subject whose bridge never sent anything', async () => {
    process.env.SERVICE_SECRET = 'the-real-secret'

    const result: any = await handler(
      createEvent('507f1f77bcf86cd799439099', { 'x-service-secret': 'the-real-secret' }),
    )

    assert.deepEqual(result, { telemetry: null, timestamp: null })
  })
})
