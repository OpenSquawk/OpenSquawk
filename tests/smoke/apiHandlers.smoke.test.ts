/**
 * Smoke tests: verify that API handler files can be imported and export a
 * default function.  Catches broken imports, missing exports, and top-level
 * syntax/runtime errors without needing a running server or database.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('API handler imports — bug reports', async () => {
  it('POST /api/bug-reports exports a handler', async () => {
    const mod = await import('~~/server/api/bug-reports/index.post')
    assert.equal(typeof mod.default, 'function', 'handler must be a function')
  })

  it('GET /api/admin/bug-reports exports a handler', async () => {
    const mod = await import('~~/server/api/admin/bug-reports/index.get')
    assert.equal(typeof mod.default, 'function', 'handler must be a function')
  })

  it('GET /api/admin/bug-reports/[id] exports a handler', async () => {
    // dynamic import with bracket filename
    const mod = await import('~~/server/api/admin/bug-reports/[id].get')
    assert.equal(typeof mod.default, 'function', 'handler must be a function')
  })

  it('PATCH /api/admin/bug-reports/[id] exports a handler', async () => {
    const mod = await import('~~/server/api/admin/bug-reports/[id].patch')
    assert.equal(typeof mod.default, 'function', 'handler must be a function')
  })
})

describe('API handler imports — admin core', async () => {
  it('GET /api/admin/overview exports a handler', async () => {
    const mod = await import('~~/server/api/admin/overview.get')
    assert.equal(typeof mod.default, 'function')
  })

  it('GET /api/admin/users exports a handler', async () => {
    const mod = await import('~~/server/api/admin/users.get')
    assert.equal(typeof mod.default, 'function')
  })

  it('GET /api/admin/invitations exports a handler', async () => {
    const mod = await import('~~/server/api/admin/invitations.get')
    assert.equal(typeof mod.default, 'function')
  })
})
