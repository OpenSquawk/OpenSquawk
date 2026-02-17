export interface BridgeLogEntry {
  id: number
  timestamp: number
  endpoint: string
  method: string
  statusCode: number
  color: string
  summary: string
  data?: Record<string, unknown>
}

const MAX_ENTRIES = 200
let nextId = 1

const logStore = new Map<string, BridgeLogEntry[]>()

export function logBridgeEvent(
  token: string,
  entry: Omit<BridgeLogEntry, 'id' | 'timestamp'>,
) {
  let entries = logStore.get(token)
  if (!entries) {
    entries = []
    logStore.set(token, entries)
  }

  entries.push({
    ...entry,
    id: nextId++,
    timestamp: Date.now(),
  })

  // Ring buffer: keep only the last MAX_ENTRIES
  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES)
  }
}

export function getBridgeLog(token: string, since = 0): BridgeLogEntry[] {
  const entries = logStore.get(token)
  if (!entries) return []
  if (since <= 0) return entries.slice()
  return entries.filter(e => e.id > since)
}
