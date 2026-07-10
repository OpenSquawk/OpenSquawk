// Accepts inputs like "121.5", "121,500" or "118" and normalises to a valid
// VHF airband frequency string (118.000–136.975). Returns null when invalid so
// callers/UI can disable the action.
export function normalizeManualFreq(input: string): string | null {
  const raw = input.trim().replace(',', '.')
  if (!raw) return null
  const num = Number(raw)
  if (!Number.isFinite(num) || num < 118 || num >= 137) return null
  return num.toFixed(3)
}
