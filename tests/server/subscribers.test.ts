import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { UpdateSubscriber } from '~~/server/models/UpdateSubscriber'
import { registerUpdateSubscriber } from '~~/server/utils/subscribers'

describe('registerUpdateSubscriber', () => {
  it('creates new subscriber when none exists', async () => {
    const originalFindOne = (UpdateSubscriber as any).findOne
    const originalCreate = (UpdateSubscriber as any).create
    const createdPayloads: any[] = []

    ;(UpdateSubscriber as any).findOne = async () => null
    ;(UpdateSubscriber as any).create = async (payload: any) => {
      createdPayloads.push(payload)
      return { _id: 'sub-1', ...payload }
    }

    try {
      const result = await registerUpdateSubscriber({
        email: 'new@example.com',
        name: 'New User',
        source: 'landing',
        consentPrivacy: true,
        consentMarketing: true,
      })

      assert.equal(result.created, true)
      assert.equal(createdPayloads.length, 1)
      assert.equal(createdPayloads[0].email, 'new@example.com')
      assert.equal(createdPayloads[0].source, 'landing')
      assert.equal(createdPayloads[0].consentPrivacy, true)
      assert.equal(createdPayloads[0].consentMarketing, true)
    } finally {
      ;(UpdateSubscriber as any).findOne = originalFindOne
      ;(UpdateSubscriber as any).create = originalCreate
    }
  })

  it('updates existing subscriber and preserves existing true consent flags', async () => {
    const originalFindOne = (UpdateSubscriber as any).findOne
    const originalCreate = (UpdateSubscriber as any).create
    let saveCalls = 0

    const existing = {
      email: 'exists@example.com',
      name: 'Existing Name',
      source: 'old-source',
      consentPrivacy: true,
      consentMarketing: false,
      save: async () => {
        saveCalls += 1
      },
    }

    ;(UpdateSubscriber as any).findOne = async () => existing
    ;(UpdateSubscriber as any).create = async () => {
      throw new Error('create must not be called for existing records')
    }

    try {
      const result = await registerUpdateSubscriber({
        email: 'exists@example.com',
        name: '',
        source: 'new-source',
        consentPrivacy: false,
        consentMarketing: true,
      })

      assert.equal(result.created, false)
      assert.equal(saveCalls, 1)
      assert.equal(existing.name, 'Existing Name')
      assert.equal(existing.source, 'new-source')
      assert.equal(existing.consentPrivacy, true)
      assert.equal(existing.consentMarketing, true)
      assert.equal(existing.lastUpdatedAt instanceof Date, true)
    } finally {
      ;(UpdateSubscriber as any).findOne = originalFindOne
      ;(UpdateSubscriber as any).create = originalCreate
    }
  })
})
