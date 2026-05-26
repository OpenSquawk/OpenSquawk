// Map a Whisper transcription back onto lesson readback fields.
//
// Whisper returns natural ATC speech ("lufthansa three five niner runway two
// five right squawk seven five zero zero"), but the lesson fields store the
// canonical written form ("DLH359", "25R", "7500").  Matching purely on the
// raw transcription misses most fields.  We therefore build a *denormalized*
// view of the transcription where spoken digits/letters are folded back to
// their written tokens, and search both forms when looking for each field's
// expected value (or any alternative).

const SPOKEN_DIGIT: Record<string, string> = {
  zero: '0',
  one: '1', wun: '1',
  two: '2', too: '2',
  three: '3', tree: '3',
  four: '4', fower: '4',
  five: '5', fife: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9', niner: '9',
}

const SPOKEN_LETTER: Record<string, string> = {
  alfa: 'a', alpha: 'a',
  bravo: 'b',
  charlie: 'c',
  delta: 'd',
  echo: 'e',
  foxtrot: 'f',
  golf: 'g',
  hotel: 'h',
  india: 'i',
  juliett: 'j', juliet: 'j',
  kilo: 'k',
  lima: 'l',
  mike: 'm',
  november: 'n',
  oscar: 'o',
  papa: 'p',
  quebec: 'q',
  romeo: 'r',
  sierra: 's',
  tango: 't',
  uniform: 'u',
  victor: 'v',
  whiskey: 'w', whisky: 'w',
  xray: 'x',
  yankee: 'y',
  zulu: 'z',
}

const RUNWAY_SUFFIX: Record<string, string> = {
  left: 'l',
  right: 'r',
  center: 'c', centre: 'c',
}

const SCALE_WORDS: Record<string, string> = {
  hundred: '00',
  thousand: '000',
}

// Decorative words that should be stripped AFTER digit-collapse so they still
// act as a boundary while collapsing (otherwise "one one eight decimal seven"
// would fold to "1187" instead of the intended "118 7").
const DECORATION_RE = /\b(decimal|point|dash|and)\b/g

export function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Convert spoken ATC English back to written tokens (digits, runway letters,
 *  collapsed callsign codes).  Returned text is also `normalizeForMatch`-safe. */
export function denormalizeSpokenAtc(input: string): string {
  const cleaned = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/x[- ]?ray/g, 'xray')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return ''

  const tokens = cleaned.split(' ')
  const mapped: string[] = []
  for (const tok of tokens) {
    if (SPOKEN_DIGIT[tok] !== undefined) mapped.push(SPOKEN_DIGIT[tok]!)
    else if (SPOKEN_LETTER[tok] !== undefined) mapped.push(SPOKEN_LETTER[tok]!)
    else if (RUNWAY_SUFFIX[tok] !== undefined) mapped.push(RUNWAY_SUFFIX[tok]!)
    else if (SCALE_WORDS[tok] !== undefined) mapped.push(SCALE_WORDS[tok]!)
    else mapped.push(tok)
  }

  let result = mapped.join(' ')

  // "five thousand" → "5 000" → "5000"
  result = result.replace(/\b(\d)\s+(0{2,3})\b/g, (_m, d, z) => `${d}${z}`)

  // Collapse runs of single digits: "3 5 9" → "359"
  result = result.replace(/\b(\d(?:\s+\d)+)\b/g, m => m.replace(/\s+/g, ''))

  // Glue trailing runway letter to its numeric prefix: "25 r" → "25r"
  result = result.replace(/\b(\d{1,3})\s+([lrc])\b/g, '$1$2')

  // Glue single digit + single letter (SID/STAR suffix pattern): "7 s" → "7s"
  result = result.replace(/\b(\d)\s+([a-z])\b/g, '$1$2')

  // Glue runs of single letters into a callsign code, but only when followed
  // by digits or end-of-string so we don't crush ordinary words.
  // "d l h 359" → "dlh 359"
  result = result.replace(/\b([a-z](?:\s+[a-z]){1,4})\b(?=\s+\d|\s*$)/g, m => m.replace(/\s+/g, ''))

  // Strip decoration words now that the digit runs around them have been
  // collapsed and the boundary they provided is no longer needed.
  result = result.replace(DECORATION_RE, ' ')

  return result.replace(/\s+/g, ' ').trim()
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = new Array(n + 1).fill(0)
  for (let j = 0; j <= n; j++) dp[j] = j
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const temp = dp[j]
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost)
      prev = temp
    }
  }
  return dp[n]
}

function allowedDistance(length: number): number {
  if (length <= 12) return 0
  if (length <= 24) return 1
  if (length <= 36) return 2
  return 3
}

/** Loose substring search using a sliding Levenshtein window. */
export function fuzzyContains(haystack: string, needle: string, extraTolerance = 1): boolean {
  if (!needle) return false
  if (!haystack) return false
  if (haystack.includes(needle)) return true
  const tolerance = allowedDistance(needle.length) + extraTolerance
  const minLen = Math.max(3, needle.length - 2)
  const maxLen = needle.length + 3
  for (let start = 0; start + minLen <= haystack.length; start++) {
    for (let len = minLen; len <= maxLen; len++) {
      if (start + len > haystack.length) break
      const window = haystack.slice(start, start + len)
      if (levenshtein(window, needle) <= tolerance) return true
    }
  }
  return false
}

/** Split a callsign-style candidate ("lufthansa 359", "dlh 359", "baw27") into
 *  its alphabetic prefix and trailing digit run.  If either side is missing we
 *  return null and fall back to whole-string matching. */
function splitCallsignParts(candidate: string): { alpha: string; digits: string } | null {
  // Accept either "alpha digits" with a space or "alphaDigits" glued together.
  const spaced = candidate.match(/^([a-z][a-z ]*?)\s+(\d{1,5})[a-z]?$/i)
  if (spaced) {
    const alpha = spaced[1]!.trim()
    const digits = spaced[2]!
    if (alpha.length >= 3 && digits.length >= 2) return { alpha, digits }
  }
  const glued = candidate.match(/^([a-z]{2,})(\d{1,5})[a-z]?$/i)
  if (glued) {
    const alpha = glued[1]!
    const digits = glued[2]!
    if (alpha.length >= 3 && digits.length >= 2) return { alpha, digits }
  }
  return null
}

/** Callsign-tolerant match: try the candidate whole, then split into the
 *  airline prefix + flight number and require BOTH parts to appear (with fuzz)
 *  in the haystack.  This rescues common Whisper errors like:
 *    - "Loftansa three five niner"  → matches "Lufthansa 359"
 *    - "Speed bird 27"              → matches "Speedbird 27"
 *    - "Lufthana 359"               → matches "Lufthansa 359" (typo)
 *    - "easy 25"                    → matches "EZY25" via alts
 */
function callsignMatches(haystack: string, candidate: string): boolean {
  if (!candidate || !haystack) return false
  if (candidate.length >= 3 && haystack.includes(candidate)) return true
  // Generous whole-string fuzzy (alphabetic typos in airline name).
  if (fuzzyContains(haystack, candidate, 3)) return true

  const parts = splitCallsignParts(candidate)
  if (!parts) return false
  const { alpha, digits } = parts

  // Digit part is the strong anchor — it must be present, allowing a single
  // typo on longer flight numbers.
  const digitsOk = haystack.includes(digits)
    || (digits.length >= 3 && fuzzyContains(haystack, digits, 1))
  if (!digitsOk) return false

  // Alpha part may be misspelled by Whisper or split across whitespace; we
  // allow ~25% character distance plus the base allowance.
  const alphaCompact = alpha.replace(/\s+/g, '')
  const alphaTolerance = Math.max(2, Math.floor(alphaCompact.length / 4))
  if (haystack.includes(alpha)) return true
  if (alphaCompact.length >= 4 && haystack.replace(/\s+/g, '').includes(alphaCompact)) return true
  return fuzzyContains(haystack, alpha, alphaTolerance)
      || fuzzyContains(haystack.replace(/\s+/g, ''), alphaCompact, alphaTolerance)
}

export interface SttFieldDef {
  key: string
  expected: string
  alternatives?: string[]
  isCallsign?: boolean
}

export interface SttMatchResult {
  matches: Record<string, string>
  filled: number
  total: number
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Match a candidate string in the haystack. Short (1–2 char) candidates only
 *  hit when they appear as a standalone token — this prevents the digit "5"
 *  from matching anywhere inside a callsign like "359". */
function candidateMatches(haystack: string, candidate: string): boolean {
  if (!candidate || !haystack) return false
  if (candidate.length >= 3) return haystack.includes(candidate)
  const re = new RegExp(`(^|\\s)${escapeRegex(candidate)}(\\s|$)`)
  return re.test(haystack)
}

function pickLongestExpected(fields: SttFieldDef[]): SttFieldDef[] {
  // Longer expected values are more discriminating and should claim the
  // transcription substring before shorter ones. Stable for equal lengths.
  return fields
    .map((field, index) => ({ field, index, length: (field.expected || '').length }))
    .sort((a, b) => b.length - a.length || a.index - b.index)
    .map(entry => entry.field)
}

export function matchTranscriptionToFields(
  transcription: string,
  fields: SttFieldDef[],
): SttMatchResult {
  const normalized = normalizeForMatch(transcription)
  const denormalized = normalizeForMatch(denormalizeSpokenAtc(transcription))
  const matches: Record<string, string> = {}
  let filled = 0

  for (const field of pickLongestExpected(fields)) {
    const expectedRaw = (field.expected || '').trim()
    if (!expectedRaw) continue
    const altList = field.alternatives || []
    const candidates = Array.from(new Set([expectedRaw, ...altList]
      .map(c => (c || '').trim())
      .filter(Boolean)
      .map(normalizeForMatch)
      .filter(c => c.length >= 1)))

    let matched = false
    for (const cand of candidates) {
      if (!cand) continue
      if (candidateMatches(normalized, cand) || candidateMatches(denormalized, cand)) {
        matched = true
        break
      }
      if (field.isCallsign && cand.length >= 4) {
        if (callsignMatches(normalized, cand) || callsignMatches(denormalized, cand)) {
          matched = true
          break
        }
      }
    }
    if (matched) {
      matches[field.key] = expectedRaw
      filled++
    }
  }
  return { matches, filled, total: fields.length }
}

export function looksLikeCallsignKey(key: string, label?: string): boolean {
  const probe = `${key} ${label || ''}`.toLowerCase()
  return /\b(callsign|call sign|callup)\b/.test(probe)
    || /callsign$/.test(key)
    || /-callsign\b/.test(key)
}
