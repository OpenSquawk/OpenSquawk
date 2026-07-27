/**
 * Build the variable payload the Python backend session is created with.
 *
 * The backend stores every key, so frequencies declared in downstream chained
 * flows (tower_freq for taxi-v1, departure_freq for tower-v1, …) are already
 * populated with real airport values by the time the session advances to them.
 *
 * Pure on purpose: the mapping is the part with real logic — fallback chains,
 * ATIS overrides, string coercion — and keeping it out of the composable is
 * what makes it testable.
 */

export type BackendVariableInputs = {
  /** The selected flight plan (VATSIM, demo, manual, or a restored snapshot). */
  flightPlan: Record<string, any>
  /** The local engine's variables, after initializeFlight() and the ATIS patch. */
  vars: Record<string, any>
  /** Runway from the resolved ATIS, when the airport publishes runway data. */
  atisRunway?: string | null
}

export function buildBackendVariables(
  { flightPlan, vars, atisRunway }: BackendVariableInputs
): Record<string, any> {
  const v = vars
  return {
    callsign:         v.callsign         || flightPlan.callsign || 'UNKNOWN',
    information:      v.atis_code        || 'K',
    destination:      v.dest             || flightPlan.arr || flightPlan.arrival || 'Unknown',
    stand:            v.stand            || 'A1',
    sid:              v.sid              || 'UNKNOWN1A',
    initial_altitude: String(v.initial_altitude_ft ?? 5000),
    squawk:           String(v.squawk ?? '2000'),
    // The filed enroute route. The backend derives the point where the SID
    // hands over to the enroute structure and grants it in the clearance;
    // demo and manual flights file none, and the flow keeps its no-route
    // wording. Always present so the payload shape does not vary by source.
    route:            flightPlan.route   || '',
    // Shared / arrival variables. The engine generates these, but they were not
    // being forwarded — so arrival flows (and taxi/tower on departure) fell back
    // to YAML defaults and ignored the selected flight. Names are mapped to the
    // backend flow conventions (qnh_hpa→qnh, acf_type→aircraft_type, …).
    runway:           atisRunway         || v.runway || '25R',
    qnh:              String(v.qnh_hpa ?? '1013'),
    surface_wind:     v.surface_wind     || '250/08',
    // taxi_route is intentionally NOT sent: the backend computes the real OSM
    // taxi route (and crossings) from airport_icao + stand/runway, and falls
    // back to the flow's YAML default on its own. Sending a placeholder here
    // would count as a caller override and suppress that computation.
    aircraft_type:    v.acf_type         || 'A320',
    cruise_level:     v.cruise_flight_level || 'FL360',
    assigned_squawk:  String(v.squawk ?? '2000'),
    // All airport frequencies — available to every flow in the chain.
    delivery_freq:    v.delivery_freq    || '121.950',
    ground_freq:      v.ground_freq      || '121.800',
    tower_freq:       v.tower_freq       || '118.700',
    departure_freq:   v.departure_freq   || '120.000',
    approach_freq:    v.approach_freq    || '119.000',
    handoff_freq:     v.handoff_freq     || '131.150',
  }
}
