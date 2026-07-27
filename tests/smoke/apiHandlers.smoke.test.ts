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
})
