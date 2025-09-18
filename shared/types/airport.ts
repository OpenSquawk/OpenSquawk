export interface AirportFrequency {
  /** ICAO facility type or shorthand (ATIS, DEL, GND, TWR, etc.) */
  type: string
  /** Frequency in ICAO format (e.g. 121.800) */
  frequency: string
  /** Optional human readable name, e.g. "Ground" */
  name?: string
  /** Optional additional description or usage remarks */
  description?: string
}
