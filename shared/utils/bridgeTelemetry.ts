import type { NormalizedTelemetry } from '../../app/composables/useRadioBackend'

export function normalizeSimFreq(value: unknown): string | null {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num) || num < 118 || num >= 137) return null
  return num.toFixed(3)
}

// Map the raw bridge telemetry (SimConnect-style field names) to the
// sim-agnostic contract the backend understands. distance_to_*_nm are omitted
// until pm.vue has a reliable airport-coordinate source to compute them from;
// heading is currently true (bridge only reports true) — magnetic correction is
// needed before any localizer/heading trigger can rely on it.
export function normalizeBridgeTelemetry(raw: any): NormalizedTelemetry | null {
  if (!raw || typeof raw !== 'object') return null
  const num = (v: unknown): number | undefined => {
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isFinite(n) ? n : undefined
  }
  return {
    altitude_ft: num(raw.PLANE_ALTITUDE),
    ias_kts: num(raw.AIRSPEED_INDICATED),
    gs_kts: num(raw.GROUND_VELOCITY),
    vs_fpm: num(raw.VERTICAL_SPEED),
    heading_deg: num(raw.PLANE_HEADING_DEGREES_TRUE),
    on_ground: typeof raw.SIM_ON_GROUND === 'boolean' ? raw.SIM_ON_GROUND : undefined,
  }
}

// Only forward telemetry that meaningfully changed, so idle cruise doesn't POST
// an identical tick every poll. Rounded so tiny jitter doesn't count as change.
export function telemetrySignature(t: NormalizedTelemetry): string {
  const r = (v: number | undefined, step: number) => (v === undefined ? '_' : Math.round(v / step))
  return [
    r(t.altitude_ft, 100), r(t.ias_kts, 5), r(t.gs_kts, 5),
    r(t.vs_fpm, 100), r(t.heading_deg, 5), t.on_ground ? 'G' : 'A',
  ].join('|')
}
