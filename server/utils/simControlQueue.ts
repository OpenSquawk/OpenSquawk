/**
 * In-memory command queue for the frequency-sim-control channel (design doc
 * §4, `docs/plans/2026-07-14-frequency-sim-control-design.md`).
 *
 * Flow: /live-atc client → POST /api/bridge/command (enqueue) → this queue
 * → POST /api/bridge/data response `commands` field (bridge picks up) →
 * bridge executes → POST /api/bridge/command-result (resolve) → this queue
 * → GET /api/bridge/live response `commandResults` field (client announces).
 *
 * Keyed by bridge token, not userId: both ends of this channel authenticate
 * with the same x-bridge-token the telemetry channel already uses.
 */

import { randomUUID } from 'node:crypto'
import type { PendingCommand, SimControlCommand, SimControlCommandResult, SimControlCommandStatus } from '../../shared/utils/simControl'

type RecordStatus = 'pending' | 'delivered' | SimControlCommandStatus

interface CommandRecord {
  id: string
  token: string
  command: SimControlCommand
  issuedAt: number
  status: RecordStatus
  reason: string | null
  consumedByClient: boolean
}

export interface SimControlQueueOptions {
  /** Commands not delivered/resolved within this window are treated as expired. */
  ttlMs?: number
  /** Clock override for deterministic tests. */
  now?: () => number
}

export class SimControlQueue {
  private records = new Map<string, CommandRecord>()
  private pendingByToken = new Map<string, string[]>()
  private ttlMs: number
  private now: () => number

  constructor(opts: SimControlQueueOptions = {}) {
    this.ttlMs = opts.ttlMs ?? 30_000
    this.now = opts.now ?? Date.now
  }

  /** Enqueue a parsed command for the bridge behind this token to pick up. */
  enqueue(token: string, command: SimControlCommand): PendingCommand {
    const id = randomUUID()
    const issuedAt = this.now()
    const record: CommandRecord = { id, token, command, issuedAt, status: 'pending', reason: null, consumedByClient: false }
    this.records.set(id, record)
    const queue = this.pendingByToken.get(token) ?? []
    queue.push(id)
    this.pendingByToken.set(token, queue)
    return { id, issued_at: new Date(issuedAt).toISOString(), command }
  }

  /**
   * Called from POST /api/bridge/data: hand every still-pending command for
   * this token to the bridge and mark it delivered. Each command is handed
   * out exactly once — the caller does not re-poll for it.
   */
  drainPending(token: string): PendingCommand[] {
    this.sweepExpired()
    const ids = this.pendingByToken.get(token) ?? []
    this.pendingByToken.set(token, [])
    const out: PendingCommand[] = []
    for (const id of ids) {
      const record = this.records.get(id)
      if (!record || record.status !== 'pending') continue // expired while queued
      record.status = 'delivered'
      out.push({ id: record.id, issued_at: new Date(record.issuedAt).toISOString(), command: record.command })
    }
    return out
  }

  /**
   * Called from POST /api/bridge/command-result: the bridge reports the
   * outcome of a delivered command. Returns false if the id is unknown or
   * belongs to a different token (never trust the caller's own claim).
   */
  resolve(token: string, id: string, status: 'ok' | 'failed', reason?: string | null): boolean {
    const record = this.records.get(id)
    if (!record || record.token !== token) return false
    if (record.status !== 'pending' && record.status !== 'delivered') return false
    record.status = status
    record.reason = reason ?? null
    return true
  }

  /**
   * Called from GET /api/bridge/live: hand the client every terminal result
   * for this token it hasn't seen yet, then forget them (one-shot delivery,
   * same as drainPending on the bridge side).
   */
  drainResultsForClient(token: string): SimControlCommandResult[] {
    this.sweepExpired()
    const out: SimControlCommandResult[] = []
    for (const record of this.records.values()) {
      if (record.token !== token || record.consumedByClient) continue
      if (record.status === 'ok' || record.status === 'failed' || record.status === 'expired') {
        record.consumedByClient = true
        out.push({ id: record.id, command: record.command, status: record.status, reason: record.reason })
      }
    }
    for (const record of out) this.records.delete(record.id)
    return out
  }

  private sweepExpired() {
    const cutoff = this.now() - this.ttlMs
    for (const record of this.records.values()) {
      if ((record.status === 'pending' || record.status === 'delivered') && record.issuedAt < cutoff) {
        record.status = 'expired'
      }
    }
  }
}

// Singleton — shared across all server handlers, same pattern as flightlabTelemetryStore.
export const simControlQueue = new SimControlQueue()
