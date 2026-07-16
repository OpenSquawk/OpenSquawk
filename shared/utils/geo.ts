// Spherical-earth geo helpers for the WebSim flight model (position
// integration, STAR/ILS geometry) and for generating the hardcoded spawn
// preset coordinates from a runway threshold + bearing/distance instead of
// hand-typing derived lat/lons.

const EARTH_RADIUS_NM = 3440.065

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

/** Wrap any degree value into [0, 360). */
export function normalizeHeading(deg: number): number {
  return ((deg % 360) + 360) % 360
}

/** Smallest signed difference `to - from`, in (-180, 180]. */
export function angleDiffDeg(from: number, to: number): number {
  return ((((to - from) % 360) + 540) % 360) - 180
}

/** Great-circle distance in nautical miles. */
export function distanceNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = toRad(lat1)
  const phi2 = toRad(lat2)
  const dPhi = toRad(lat2 - lat1)
  const dLambda = toRad(lon2 - lon1)
  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2
  return EARTH_RADIUS_NM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Initial bearing (degrees true, 0-360) from point 1 to point 2. */
export function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = toRad(lat1)
  const phi2 = toRad(lat2)
  const dLambda = toRad(lon2 - lon1)
  const y = Math.sin(dLambda) * Math.cos(phi2)
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda)
  return normalizeHeading(toDeg(Math.atan2(y, x)))
}

/** Point reached from (lat, lon) heading `bearing` degrees for `distanceNm` nautical miles. */
export function destinationPoint(
  lat: number,
  lon: number,
  bearing: number,
  distance: number,
): { lat: number; lon: number } {
  const delta = distance / EARTH_RADIUS_NM
  const theta = toRad(bearing)
  const phi1 = toRad(lat)
  const lambda1 = toRad(lon)

  const phi2 = Math.asin(
    Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta),
  )
  const lambda2 =
    lambda1 +
    Math.atan2(
      Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
      Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2),
    )

  return { lat: toDeg(phi2), lon: normalizeLon(toDeg(lambda2)) }
}

function normalizeLon(deg: number): number {
  return ((deg + 540) % 360) - 180
}
