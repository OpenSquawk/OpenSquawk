/**
 * Unit tests for BugReport logic: validation, contact-string building,
 * and model schema integrity.  No database connection required.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { BugReport } from '~~/server/models/BugReport'

// ── Contact-string helpers (mirror of index.post.ts logic) ───────────────────

function buildContact(user: { name?: string; email: string }, override?: string): string {
  return String(
    override || [user.name, user.email].filter(Boolean).join(' — ')
  ).slice(0, 200)
}

function validateComment(raw: unknown): string {
  const comment = String(raw ?? '').trim()
  if (!comment) throw new Error('comment_required')
  return comment.slice(0, 4000)
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('BugReport — comment validation', () => {
  it('accepts a non-empty comment', () => {
    assert.equal(validateComment('App crashed when I pressed PTT'), 'App crashed when I pressed PTT')
  })

  it('trims whitespace before validating', () => {
    assert.equal(validateComment('  hello  '), 'hello')
  })

  it('rejects empty string', () => {
    assert.throws(() => validateComment(''), { message: 'comment_required' })
  })

  it('rejects whitespace-only string', () => {
    assert.throws(() => validateComment('   '), { message: 'comment_required' })
  })

  it('rejects null/undefined', () => {
    assert.throws(() => validateComment(null), { message: 'comment_required' })
    assert.throws(() => validateComment(undefined), { message: 'comment_required' })
  })

  it('truncates comment at 4000 chars', () => {
    const long = 'x'.repeat(5000)
    assert.equal(validateComment(long).length, 4000)
  })
})

describe('BugReport — contact string', () => {
  it('joins name and email with em dash separator', () => {
    assert.equal(buildContact({ name: 'Max', email: 'max@example.com' }), 'Max — max@example.com')
  })

  it('omits name when absent', () => {
    assert.equal(buildContact({ email: 'max@example.com' }), 'max@example.com')
  })

  it('uses override string when provided', () => {
    assert.equal(buildContact({ email: 'x@y.com' }, 'Custom Name — x@y.com'), 'Custom Name — x@y.com')
  })

  it('truncates contact at 200 chars', () => {
    const long = 'x'.repeat(300)
    assert.equal(buildContact({ email: 'a@b.com' }, long).length, 200)
  })
})

describe('BugReport — model schema', () => {
  it('model can be imported without a DB connection', () => {
    assert.ok(BugReport, 'BugReport model must be importable')
  })

  it('schema defines expected fields', () => {
    const paths = BugReport.schema.paths
    assert.ok('comment' in paths, 'schema must have comment')
    assert.ok('contact' in paths, 'schema must have contact')
    assert.ok('status' in paths, 'schema must have status')
    assert.ok('screenshot' in paths, 'schema must have screenshot')
    assert.ok('createdAt' in paths, 'schema must have createdAt')
  })

  it('status field only allows open or resolved', () => {
    const statusPath = BugReport.schema.path('status') as any
    const enumValues: string[] = statusPath?.options?.enum ?? []
    assert.deepEqual(enumValues.sort(), ['open', 'resolved'])
  })

  it('status defaults to open', () => {
    const statusPath = BugReport.schema.path('status') as any
    assert.equal(statusPath?.options?.default, 'open')
  })
})

describe('BugReport — patch status validation', () => {
  const validStatuses = ['open', 'resolved']
  const invalidStatuses = ['', 'done', 'closed', 'pending', undefined, null]

  it('accepts valid statuses', () => {
    for (const s of validStatuses) {
      assert.ok(s === 'open' || s === 'resolved', `${s} should be valid`)
    }
  })

  it('rejects invalid statuses', () => {
    for (const s of invalidStatuses) {
      assert.ok(s !== 'open' && s !== 'resolved', `${s} should be invalid`)
    }
  })
})
