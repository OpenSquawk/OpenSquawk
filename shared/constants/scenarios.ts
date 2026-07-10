/**
 * Scenario catalogue for /live-atc: the flows a pilot can fly, and how the
 * single-phase practice scenarios map onto the complete journey chains.
 */

export interface Scenario {
  id: string
  name: string
  subtitle: string
  icon: string
  startFlow: string
  /** Display-only chain label, e.g. "Clearance → Taxi → Tower → Departure" */
  chain: string
  isComplete: boolean
  /** When true, backend will NOT follow next_flow links (single-phase practice). */
  noChain: boolean
  /**
   * Which airport from the flight plan to use for frequency lookups.
   * 'dep' = departure airport, 'arr' = arrival/destination airport.
   */
  airport: 'dep' | 'arr'
}

export const SCENARIOS: Scenario[] = [
  // ── Complete chains ──────────────────────────────────────────────────────
  {
    id: 'ifr-departure',
    name: 'IFR Departure',
    subtitle: 'Clearance → Taxi → Tower → Departure',
    chain: 'clearance-v1 → taxi-v1 → tower-v1 → departure-v1',
    icon: 'mdi-airplane-takeoff',
    startFlow: 'clearance-v1',
    isComplete: true,
    noChain: false,
    airport: 'dep',
  },
  {
    id: 'vfr-arrival',
    name: 'VFR Arrival',
    subtitle: 'Approach → Circuit → Landing → Taxi-in',
    chain: 'vfr-arrival-v1 → vfr-circuit-landing-v1 → taxi-in-v1',
    icon: 'mdi-airplane-landing',
    startFlow: 'vfr-arrival-v1',
    isComplete: true,
    noChain: false,
    airport: 'arr',
  },
  {
    id: 'ifr-arrival',
    name: 'IFR Arrival',
    subtitle: 'Enroute → Approach → Landing → Taxi-in',
    chain: 'ifr-enroute-arrival-v1 → ifr-arrival-v1 → ifr-tower-landing-v1 → taxi-in-v1',
    icon: 'mdi-airplane-landing',
    startFlow: 'ifr-enroute-arrival-v1',
    isComplete: true,
    noChain: false,
    airport: 'arr',
  },
  // ── Individual phases ────────────────────────────────────────────────────
  {
    id: 'clearance',
    name: 'Clearance',
    subtitle: 'Request IFR clearance',
    chain: 'clearance-v1',
    icon: 'mdi-file-document-outline',
    startFlow: 'clearance-v1',
    isComplete: false,
    noChain: true,
    airport: 'dep',
  },
  {
    id: 'taxi',
    name: 'Startup & Taxi',
    subtitle: 'Startup → Pushback → Taxi',
    chain: 'taxi-v1',
    icon: 'mdi-car-side',
    startFlow: 'taxi-v1',
    isComplete: false,
    noChain: true,
    airport: 'dep',
  },
  {
    id: 'tower',
    name: 'Tower',
    subtitle: 'Line-up and takeoff',
    chain: 'tower-v1',
    icon: 'mdi-tower-fire',
    startFlow: 'tower-v1',
    isComplete: false,
    noChain: true,
    airport: 'dep',
  },
  {
    id: 'departure',
    name: 'Departure',
    subtitle: 'Initial climb check-in',
    chain: 'departure-v1',
    icon: 'mdi-radar',
    startFlow: 'departure-v1',
    isComplete: false,
    noChain: true,
    airport: 'dep',
  },
  {
    id: 'vfr-approach',
    name: 'VFR Approach',
    subtitle: 'Initial contact & joining',
    chain: 'vfr-arrival-v1',
    icon: 'mdi-binoculars',
    startFlow: 'vfr-arrival-v1',
    isComplete: false,
    noChain: true,
    airport: 'arr',
  },
  {
    id: 'circuit-landing',
    name: 'Circuit & Landing',
    subtitle: 'Traffic circuit and landing',
    chain: 'vfr-circuit-landing-v1',
    icon: 'mdi-airport',
    startFlow: 'vfr-circuit-landing-v1',
    isComplete: false,
    noChain: true,
    airport: 'arr',
  },
  {
    id: 'ifr-enroute',
    name: 'Enroute Descent',
    subtitle: 'Area Control stepped descent',
    chain: 'ifr-enroute-arrival-v1',
    icon: 'mdi-arrow-down-bold-circle-outline',
    startFlow: 'ifr-enroute-arrival-v1',
    isComplete: false,
    noChain: true,
    airport: 'arr',
  },
  {
    id: 'ifr-approach',
    name: 'IFR Approach',
    subtitle: 'STAR, vectors & ILS',
    chain: 'ifr-arrival-v1',
    icon: 'mdi-radar',
    startFlow: 'ifr-arrival-v1',
    isComplete: false,
    noChain: true,
    airport: 'arr',
  },
  {
    id: 'ifr-landing',
    name: 'IFR Landing',
    subtitle: 'Established, land and vacate',
    chain: 'ifr-tower-landing-v1',
    icon: 'mdi-airport',
    startFlow: 'ifr-tower-landing-v1',
    isComplete: false,
    noChain: true,
    airport: 'arr',
  },
  {
    id: 'taxi-in',
    name: 'Taxi-in',
    subtitle: 'Post-landing ground movement',
    chain: 'taxi-in-v1',
    icon: 'mdi-parking',
    startFlow: 'taxi-in-v1',
    isComplete: false,
    noChain: true,
    airport: 'arr',
  },
  // ── Drills (standalone, not part of a journey chain) ─────────────────────
  {
    id: 'rto',
    name: 'Rejected Take-Off',
    subtitle: 'Tower cancels takeoff — reject and stop',
    chain: 'rto-v1',
    icon: 'mdi-airplane-alert',
    startFlow: 'rto-v1',
    isComplete: false,
    noChain: true,
    airport: 'dep',
  },
  {
    id: 'info-arrival',
    name: 'Uncontrolled Field (Info)',
    subtitle: 'Self-announce arrival, no clearances',
    chain: 'info-arrival-v1',
    icon: 'mdi-account-voice',
    startFlow: 'info-arrival-v1',
    isComplete: false,
    noChain: true,
    airport: 'arr',
  },
]

// ---------------------------------------------------------------------------
// Chooser layout: each complete chain is shown as a flow of its phases, so it's
// clear which single-phase practice maps to which segment of which journey.
// ---------------------------------------------------------------------------
export interface ChainDef {
  category: 'Departure' | 'Arrival'
  completeId: string   // the isComplete scenario that flies the whole chain
  segmentIds: string[] // individual-phase scenario ids, in order
}

export const CHAIN_DEFS: ChainDef[] = [
  { category: 'Departure', completeId: 'ifr-departure', segmentIds: ['clearance', 'taxi', 'tower', 'departure'] },
  { category: 'Arrival',   completeId: 'ifr-arrival',   segmentIds: ['ifr-enroute', 'ifr-approach', 'ifr-landing', 'taxi-in'] },
  { category: 'Arrival',   completeId: 'vfr-arrival',   segmentIds: ['vfr-approach', 'circuit-landing', 'taxi-in'] },
]

// Standalone drills shown in their own section, separate from the journey chains.
export const DRILL_IDS = ['rto', 'info-arrival']
/** Standalone drills, resolved once — the source arrays are module constants. */
export const DRILL_SCENARIOS: Scenario[] = DRILL_IDS
  .map(id => SCENARIOS.find(s => s.id === id))
  .filter((s): s is Scenario => !!s)

function buildChainGroups() {
  const byCategory = new Map<string, Array<{ id: string; complete: Scenario; segments: Scenario[] }>>()
  for (const def of CHAIN_DEFS) {
    const complete = SCENARIOS.find(s => s.id === def.completeId)
    if (!complete) continue
    const segments = def.segmentIds
      .map(id => SCENARIOS.find(s => s.id === id))
      .filter((s): s is Scenario => !!s)
    if (!byCategory.has(def.category)) byCategory.set(def.category, [])
    byCategory.get(def.category)!.push({ id: def.completeId, complete, segments })
  }
  return Array.from(byCategory, ([category, chains]) => ({ category, chains }))
}

export const CHAIN_GROUPS = buildChainGroups()
