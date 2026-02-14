/**
 * In-memory telemetry store that bridges the HTTP POST endpoint
 * with FlightLab WebSocket sessions.
 *
 * Flow: SimBridge → POST /api/bridge/data → telemetryStore → WS → Client
 */

type TelemetryListener = (userId: string, data: any) => void

class FlightLabTelemetryStore {
  /** Latest telemetry per userId */
  private data = new Map<string, any>()
  /** WebSocket listeners that get notified on new data */
  private listeners = new Set<TelemetryListener>()

  update(userId: string, telemetry: any) {
    this.data.set(userId, { ...telemetry, timestamp: Date.now() })
    // Notify all listeners (WebSocket handler subscribes here)
    for (const listener of this.listeners) {
      try { listener(userId, this.data.get(userId)) } catch {}
    }
  }

  get(userId: string) {
    return this.data.get(userId) ?? null
  }

  subscribe(listener: TelemetryListener) {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
}

// Singleton — shared across all server handlers
export const flightlabTelemetryStore = new FlightLabTelemetryStore()
