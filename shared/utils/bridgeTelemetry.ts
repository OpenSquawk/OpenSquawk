import type { NormalizedTelemetry } from '../../app/composables/useRadioBackend'

export function normalizeSimFreq(value: unknown): string | null {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num) || num < 118 || num >= 137) return null
  return num.toFixed(3)
}

// Map the raw bridge telemetry (SimConnect-style field names) to the
// sim-agnostic contract the backend understands. The raw lat/lon position is
// forwarded so the backend can derive distance_to_dep_nm / distance_to_dest_nm
// (it has the airport coordinates via the session's ICAO codes); heading is
// currently true (bridge only reports true) — magnetic correction is needed
// before any localizer/heading trigger can rely on it.
export function normalizeBridgeTelemetry(raw: any): NormalizedTelemetry | null {
  if (!raw || typeof raw !== 'object') return null
  const num = (v: unknown): number | undefined => {
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isFinite(n) ? n : undefined
  }
  const lat = num(raw.PLANE_LATITUDE)
  const lon = num(raw.PLANE_LONGITUDE)
  // 0/0 is the bridge's "no GPS data" default — don't forward it as a position.
  const hasPosition =
    lat !== undefined && lon !== undefined && (Math.abs(lat) > 0.1 || Math.abs(lon) > 0.1)
  return {
    altitude_ft: num(raw.PLANE_ALTITUDE),
    ias_kts: num(raw.AIRSPEED_INDICATED),
    gs_kts: num(raw.GROUND_VELOCITY),
    vs_fpm: num(raw.VERTICAL_SPEED),
    heading_deg: num(raw.PLANE_HEADING_DEGREES_TRUE),
    on_ground: typeof raw.SIM_ON_GROUND === 'boolean' ? raw.SIM_ON_GROUND : undefined,
    ...(hasPosition ? { lat, lon } : {}),
  }
}

// Only forward telemetry that meaningfully changed, so idle cruise doesn't POST
// an identical tick every poll. Rounded so tiny jitter doesn't count as change.
// Position rounds at ~0.01° (≈0.6 nm) so a moving aircraft keeps ticking the
// backend's distance triggers without spamming while parked.
export function telemetrySignature(t: NormalizedTelemetry): string {
  const r = (v: number | undefined, step: number) => (v === undefined ? '_' : Math.round(v / step))
  return [
    r(t.altitude_ft, 100), r(t.ias_kts, 5), r(t.gs_kts, 5),
    r(t.vs_fpm, 100), r(t.heading_deg, 5), t.on_ground ? 'G' : 'A',
    r(t.lat, 0.01), r(t.lon, 0.01),
  ].join('|')
}
