/**
 * `/api/service/tools/*` forwards to the Python backend.
 *
 * These endpoints used to be a second, older implementation of the OSM
 * geocoding and taxi routing that the backend already owns — with its own
 * Overpass client, alias matching and scoring. The copy drifted: it still
 * asked Overpass for `out center tags`, so a runway resolved to the middle of
 * the strip rather than a threshold, which is the bug the backend fixed with
 * `origin_runway_point` / `dest_runway_point`.
 *
 * Forwarding is what keeps the two from drifting again, so what is pinned here
 * is that every parameter reaches the backend untouched — including the ones
 * the Nuxt copy never knew about — and that an upstream failure is reported as
 * a failure rather than smoothed over.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { backendToolUrl, radioBackendBaseUrl } from '~~/server/utils/radioBackend'

/** An h3 event carrying just the query string the handler reads. */
function createEvent(search: string) {
  return { path: `/api/service/tools/x?${search}`, node: { req: { url: `/x?${search}` } } } as any
}

/** Capture the URL the handler asks for, and answer with `response`. */
async function callHandler(modulePath: string, search: string, response: unknown = { ok: true }) {
  ;(globalThis as any).defineEventHandler = (handler: any) => handler
  const calls: string[] = []
  const original = (globalThis as any).$fetch
  ;(globalThis as any).$fetch = async (target: string) => {
    calls.push(target)
    if (response instanceof Error) throw response
    return response
  }
  try {
    const mod = await import(modulePath)
    const result = await mod.default(createEvent(search))
    return { calls, result }
  } finally {
    ;(globalThis as any).$fetch = original
  }
}

describe('backendToolUrl', () => {
  const build = (query: Record<string, any>, base = 'http://127.0.0.1:8000') =>
    new URL(backendToolUrl(base, '/api/service/tools/taxiroute', query))

  it('targets the backend path', () => {
    const url = build({ airport: 'EDDF' })
    assert.equal(url.origin, 'http://127.0.0.1:8000')
    assert.equal(url.pathname, '/api/service/tools/taxiroute')
  })

  it('forwards the documented parameters', () => {
    const url = build({
      airport: 'EDDF',
      origin_name: 'Gate A5',
      dest_name: 'RWY 25C',
      radius: '2500',
    })
    assert.equal(url.searchParams.get('airport'), 'EDDF')
    assert.equal(url.searchParams.get('origin_name'), 'Gate A5')
    assert.equal(url.searchParams.get('dest_name'), 'RWY 25C')
    assert.equal(url.searchParams.get('radius'), '2500')
  })

  it('forwards the runway endpoint parameters', () => {
    // The whole point of forwarding: the Nuxt copy could not express these.
    const url = build({
      airport: 'EDDF',
      origin_name: 'Gate A5',
      dest_name: 'RWY 25C',
      dest_runway_point: 'end',
      origin_runway_point: 'center',
    })
    assert.equal(url.searchParams.get('dest_runway_point'), 'end')
    assert.equal(url.searchParams.get('origin_runway_point'), 'center')
  })

  it('forwards parameters the proxy has never heard of', () => {
    // A whitelist would silently swallow anything the backend gains later.
    assert.equal(build({ include_connectors: 'true' }).searchParams.get('include_connectors'), 'true')
  })

  it('drops empty and absent values instead of sending blanks', () => {
    const url = build({ airport: 'EDDF', origin_name: '', dest_name: undefined, radius: null })
    assert.equal(url.searchParams.has('origin_name'), false)
    assert.equal(url.searchParams.has('dest_name'), false)
    assert.equal(url.searchParams.has('radius'), false)
  })

  it('takes the first value of a repeated parameter', () => {
    assert.equal(build({ airport: ['EDDF', 'EDDM'] }).searchParams.get('airport'), 'EDDF')
  })

  it('accepts a base URL with a trailing slash', () => {
    const url = build({ airport: 'EDDF' }, 'https://backend.example.com/')
    assert.equal(url.origin, 'https://backend.example.com')
    assert.equal(url.pathname, '/api/service/tools/taxiroute')
  })

  it('omits the query string entirely when there is nothing to send', () => {
    assert.equal(
      backendToolUrl('http://127.0.0.1:8000', '/api/service/tools/taxiroute', {}),
      'http://127.0.0.1:8000/api/service/tools/taxiroute'
    )
  })
})

describe('radioBackendBaseUrl', () => {
  it('reads the configured backend rather than assuming localhost', () => {
    // Silently falling back to 127.0.0.1 in production would take the public
    // endpoint down with a connection error and no hint why.
    const previous = process.env.NUXT_PUBLIC_RADIO_BACKEND_URL
    process.env.NUXT_PUBLIC_RADIO_BACKEND_URL = 'https://backend.example.com'
    try {
      assert.equal(radioBackendBaseUrl(), 'https://backend.example.com')
    } finally {
      if (previous === undefined) delete process.env.NUXT_PUBLIC_RADIO_BACKEND_URL
      else process.env.NUXT_PUBLIC_RADIO_BACKEND_URL = previous
    }
  })

  it('falls back to the dev backend when nothing is configured', () => {
    const previous = process.env.NUXT_PUBLIC_RADIO_BACKEND_URL
    delete process.env.NUXT_PUBLIC_RADIO_BACKEND_URL
    try {
      assert.equal(radioBackendBaseUrl(), 'http://127.0.0.1:8000')
    } finally {
      if (previous !== undefined) process.env.NUXT_PUBLIC_RADIO_BACKEND_URL = previous
    }
  })
})

describe('/api/service/tools/taxiroute handler', () => {
  it('forwards the request to the backend taxiroute endpoint', async () => {
    const { calls } = await callHandler(
      '~~/server/api/service/tools/taxiroute.get',
      'airport=EDDF&origin_name=Gate+A5&dest_name=RWY+25C&dest_runway_point=end'
    )
    assert.equal(calls.length, 1)
    const url = new URL(calls[0]!)
    assert.equal(url.pathname, '/api/service/tools/taxiroute')
    assert.equal(url.searchParams.get('airport'), 'EDDF')
    assert.equal(url.searchParams.get('dest_name'), 'RWY 25C')
    assert.equal(url.searchParams.get('dest_runway_point'), 'end')
  })

  it('returns the backend response unchanged', async () => {
    const payload = { airport: 'EDDF', names_collapsed: ['L7', 'N'] }
    const { result } = await callHandler(
      '~~/server/api/service/tools/taxiroute.get',
      'airport=EDDF',
      payload
    )
    assert.deepEqual(result, payload)
  })

  it('reports an upstream failure as a failure', async () => {
    // The old Nuxt copy answered every error with HTTP 200 and an error body.
    // Swallowing a 404 here would hide a failed lookup from the caller.
    const upstream = Object.assign(new Error('Not Found'), { statusCode: 404 })
    await assert.rejects(
      () =>
        callHandler('~~/server/api/service/tools/taxiroute.get', 'airport=EDDF', upstream),
      (error: any) => error?.statusCode === 404
    )
  })
})

describe('/api/service/tools/airport-geocode handler', () => {
  it('forwards the request to the backend airport-geocode endpoint', async () => {
    const { calls } = await callHandler(
      '~~/server/api/service/tools/airport-geocode.get',
      'airport=EDDF&origin_name=Stand+V155&origin_runway_point=end'
    )
    assert.equal(calls.length, 1)
    const url = new URL(calls[0]!)
    assert.equal(url.pathname, '/api/service/tools/airport-geocode')
    assert.equal(url.searchParams.get('origin_name'), 'Stand V155')
    assert.equal(url.searchParams.get('origin_runway_point'), 'end')
  })
})
