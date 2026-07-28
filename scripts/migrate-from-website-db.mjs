#!/usr/bin/env node
/**
 * One-time migration: carry the app's own data out of the old monolith database
 * into this instance's database.
 *
 * The repo split gave the app its own MongoDB. Four things live app-side and
 * would otherwise be gone on day one: every user's classroom progress, their
 * pilot profile, their bridge pairings, and the identity mirror those three
 * reference. Everything else — users, invitations, waitlist, telemetry history —
 * stays on the website and is deliberately NOT copied.
 *
 * `appusers` is derived, not copied: the mirror keeps `_id` identical to the
 * website's `User._id` (see server/models/AppUser.ts), which is exactly why the
 * LearnProfile/PilotProfile/BridgeToken references survive untouched.
 *
 * Safe to re-run: every write is an upsert keyed on `_id`. Nothing is ever
 * deleted, and the source database is only ever read.
 *
 * Usage:
 *   node scripts/migrate-from-website-db.mjs            # dry run, reports only
 *   node scripts/migrate-from-website-db.mjs --apply    # actually writes
 *
 *   SOURCE_MONGODB_URI  the monolith / website database (read-only here)
 *   TARGET_MONGODB_URI  this app instance's database
 */
import { MongoClient } from 'mongodb'

const APPLY = process.argv.includes('--apply')
const BATCH = 500

/** Copied verbatim, keyed on _id. */
const COPY_COLLECTIONS = ['learnprofiles', 'pilotprofiles', 'bridgetokens']

function readUri(name) {
  const value = (process.env[name] || '').trim()
  if (!value) {
    console.error(`✗ ${name} is not set.`)
    process.exit(1)
  }
  return value
}

/** host+db, so we can refuse to migrate a database onto itself. */
function identity(client) {
  const db = client.db()
  const hosts = (client.options?.hosts || []).map((h) => `${h.host}:${h.port}`).sort().join(',')
  return `${hosts}/${db.databaseName}`
}

async function countExisting(collection, ids) {
  if (ids.length === 0) return 0
  return collection.countDocuments({ _id: { $in: ids } })
}

async function upsertAll(collection, documents) {
  let written = 0
  for (let i = 0; i < documents.length; i += BATCH) {
    const chunk = documents.slice(i, i + BATCH)
    const result = await collection.bulkWrite(
      chunk.map((doc) => {
        const { _id, ...rest } = doc
        return { updateOne: { filter: { _id }, update: { $set: rest }, upsert: true } }
      }),
      { ordered: false },
    )
    written += result.upsertedCount + result.modifiedCount
  }
  return written
}

/**
 * The website's User row reduced to what the app is allowed to know: an id, a
 * subject, and the contact fields the app shows. Password hashes, tokens, terms
 * timestamps and admin notes stay on the website — the app has no business
 * holding them.
 */
function toAppUser(user) {
  // The raw driver bypasses Mongoose casting, so apply the schema's own
  // `lowercase`/`trim` here — otherwise a migrated row would differ from the
  // exact same row written through the app.
  const name = typeof user.name === 'string' ? user.name.trim() : ''
  return {
    _id: user._id,
    ssoSubject: String(user._id),
    email: String(user.email || '').trim().toLowerCase(),
    ...(name ? { name } : {}),
    role: user.role || 'user',
    createdAt: user.createdAt || new Date(),
    // Derived from the source row, not from "now" — otherwise a second run
    // would rewrite every mirror document and report phantom changes.
    updatedAt: user.updatedAt || user.createdAt || new Date(),
  }
}

async function main() {
  const source = new MongoClient(readUri('SOURCE_MONGODB_URI'))
  const target = new MongoClient(readUri('TARGET_MONGODB_URI'))

  await source.connect()
  await target.connect()

  try {
    if (identity(source) === identity(target)) {
      console.error('✗ Source and target are the same database — nothing to migrate.')
      process.exitCode = 1
      return
    }

    const sourceDb = source.db()
    const targetDb = target.db()
    console.log(`source: ${identity(source)}  (read-only)`)
    console.log(`target: ${identity(target)}`)
    console.log(APPLY ? 'mode:   APPLY\n' : 'mode:   dry run — pass --apply to write\n')

    const present = new Set((await sourceDb.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name))
    const rows = []

    // Identity mirror, derived from the website's users.
    if (!present.has('users')) {
      console.warn('! source has no `users` collection — skipping the identity mirror')
    } else {
      const users = await sourceDb.collection('users').find({}).toArray()
      const appUsers = users.map(toAppUser)
      const ids = appUsers.map((u) => u._id)
      const already = await countExisting(targetDb.collection('appusers'), ids)
      const written = APPLY ? await upsertAll(targetDb.collection('appusers'), appUsers) : 0
      rows.push({ collection: 'appusers (derived from users)', source: users.length, already, written })
    }

    for (const name of COPY_COLLECTIONS) {
      if (!present.has(name)) {
        rows.push({ collection: name, source: 0, already: 0, written: 0, note: 'not in source' })
        continue
      }
      const documents = await sourceDb.collection(name).find({}).toArray()
      const ids = documents.map((d) => d._id)
      const already = await countExisting(targetDb.collection(name), ids)
      const written = APPLY ? await upsertAll(targetDb.collection(name), documents) : 0
      rows.push({ collection: name, source: documents.length, already, written })
    }

    const pad = (s, n) => String(s).padEnd(n)
    console.log(`${pad('collection', 32)}${pad('in source', 12)}${pad('already there', 15)}${APPLY ? 'written' : ''}`)
    for (const r of rows) {
      console.log(
        pad(r.collection, 32) + pad(r.source, 12) + pad(r.already, 15) +
        (APPLY ? String(r.written) : '') + (r.note ? `  (${r.note})` : ''),
      )
    }

    if (!APPLY) console.log('\nNothing was written. Re-run with --apply once the numbers look right.')
  } finally {
    await source.close()
    await target.close()
  }
}

main().catch((error) => {
  console.error('✗ migration failed:', error?.message || error)
  process.exit(1)
})
