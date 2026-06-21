/**
 * In-memory push-to-talk event bus.
 *
 * Flow: Bridge → POST /api/bridge/ptt → pttBus → WS (/api/bridge/ws) → /pm
 *
 * Keyed by bridge token: the Bridge POSTs with its token, and the /pm tab
 * subscribes over WebSocket with the same token (from its `?token=` link), so
 * an edge is delivered only to the matching browser.
 */

export type PttState = 'down' | 'up'

type PttListener = (token: string, state: PttState) => void

class PttBus {
  private listeners = new Set<PttListener>()

  publish(token: string, state: PttState) {
    for (const listener of this.listeners) {
      try { listener(token, state) } catch {}
    }
  }

  subscribe(listener: PttListener) {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
}

// Singleton — shared across all server handlers
export const pttBus = new PttBus()
