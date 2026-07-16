// shared/data/websim/spawnPresets.ts
//
// Airport reference points, one hardcoded runway/STAR per airport, and the
// four WebSim spawn presets (design doc: docs/plans/2026-07-16-websim-design.md).
//
// Coordinates are approximate real-world reference points (public knowledge —
// airport lat/lon, elevation, runway orientation) rounded for simplicity.
// They are for flight-simulation testing only, not for navigation.

import { bearingDeg, destinationPoint, normalizeHeading } from '../../utils/geo'
import type { WebSimAirport, WebSimSpawnPreset } from './types'

const NM_TO_FT = 6076.12
const GLIDE_ANGLE_DEG = 3

/** Altitude above a runway's elevation for a stabilized N-degree glidepath at `distanceNm` from the threshold. */
function glideAltitudeFt(elevationFt: number, distanceNm: number, glideAngleDeg = GLIDE_ANGLE_DEG): number {
  return Math.round(elevationFt + distanceNm * NM_TO_FT * Math.tan((glideAngleDeg * Math.PI) / 180))
}

// --- EDDF (Frankfurt) ---------------------------------------------------

const eddfArp = { lat: 50.0333, lon: 8.5706 }
const eddfElevationFt = 364
const eddfRunway25C = {
  id: '25C',
  thresholdLat: 50.04,
  thresholdLon: 8.581,
  course_deg: 250,
  elevation_ft: eddfElevationFt,
}

export const EDDF: WebSimAirport = {
  icao: 'EDDF',
  name: 'Frankfurt',
  arpLat: eddfArp.lat,
  arpLon: eddfArp.lon,
  elevation_ft: eddfElevationFt,
  runways: [eddfRunway25C],
  gate: { lat: 50.045, lon: 8.57, heading_deg: 90 },
  star: [],
}

// --- EDDS (Stuttgart) ----------------------------------------------------

const eddsArp = { lat: 48.69, lon: 9.2219 }
const eddsElevationFt = 1276
const eddsRunway25 = {
  id: '25',
  thresholdLat: 48.682,
  thresholdLon: 9.214,
  course_deg: 249,
  elevation_ft: eddsElevationFt,
}

// STAR: three waypoints funneling onto the ILS, each off the previous leg's
// bearing so NAV mode has to actually turn the aircraft — not just fly a
// straight line down the extended centerline.
const inboundCourseReciprocal = normalizeHeading(eddsRunway25.course_deg + 180)
const eddsIaf = {
  id: 'IAF',
  ...destinationPoint(eddsRunway25.thresholdLat, eddsRunway25.thresholdLon, normalizeHeading(inboundCourseReciprocal - 70), 30),
  altitude_ft: 7000,
}
const eddsIf = {
  id: 'IF',
  ...destinationPoint(eddsRunway25.thresholdLat, eddsRunway25.thresholdLon, normalizeHeading(inboundCourseReciprocal - 35), 18),
  altitude_ft: 5000,
}
const eddsFaf = {
  id: 'FAF',
  ...destinationPoint(eddsRunway25.thresholdLat, eddsRunway25.thresholdLon, inboundCourseReciprocal, 8),
  altitude_ft: glideAltitudeFt(eddsElevationFt, 8),
}

export const EDDS: WebSimAirport = {
  icao: 'EDDS',
  name: 'Stuttgart',
  arpLat: eddsArp.lat,
  arpLon: eddsArp.lon,
  elevation_ft: eddsElevationFt,
  runways: [eddsRunway25],
  gate: { lat: 48.688, lon: 9.219, heading_deg: 180 },
  star: [eddsIaf, eddsIf, eddsFaf],
}

export const WEBSIM_AIRPORTS: Record<string, WebSimAirport> = { EDDF, EDDS }

// --- Spawn presets ---------------------------------------------------------

const eddf10nmFinal = destinationPoint(
  eddfRunway25C.thresholdLat,
  eddfRunway25C.thresholdLon,
  normalizeHeading(eddfRunway25C.course_deg + 180),
  10,
)

export const WEBSIM_SPAWN_PRESETS: WebSimSpawnPreset[] = [
  {
    id: 'eddf-10nm-final',
    label: 'EDDF – 10 NM Final',
    description: 'Bereits auf dem ILS für 25C eingefangen (APPR captured), Landung ~10 NM voraus.',
    icao: 'EDDF',
    runwayId: eddfRunway25C.id,
    initialState: {
      lat: eddf10nmFinal.lat,
      lon: eddf10nmFinal.lon,
      heading_deg: eddfRunway25C.course_deg,
      altitude_ft: glideAltitudeFt(eddfElevationFt, 10),
      ias_kts: 180,
      on_ground: false,
      engineState: 'RUNNING',
      gearDown: true,
      flapsIndex: 2,
      parkingBrake: false,
      apMode: 'APPR_CAPTURED',
      activeWaypointIndex: 0,
      target_ias: 180,
      target_hdg: eddfRunway25C.course_deg,
      target_alt: eddfElevationFt,
      com_active: 119.9,
      com_standby: 121.9,
      transponder_code: 2000,
    },
  },
  {
    id: 'edds-30nm-star',
    label: 'EDDS – 30 NM STAR',
    description: 'Auf dem STAR-Anflug, 30 NM raus und abseits der Centerline — NAV muss die Kurven fliegen, bevor APPR das ILS einfängt.',
    icao: 'EDDS',
    runwayId: eddsRunway25.id,
    initialState: {
      lat: eddsIaf.lat,
      lon: eddsIaf.lon,
      heading_deg: bearingDeg(eddsIaf.lat, eddsIaf.lon, eddsIf.lat, eddsIf.lon),
      altitude_ft: eddsIaf.altitude_ft,
      ias_kts: 250,
      on_ground: false,
      engineState: 'RUNNING',
      gearDown: false,
      flapsIndex: 0,
      parkingBrake: false,
      apMode: 'NAV',
      activeWaypointIndex: 1, // spawns at IAF (index 0), flying toward IF (index 1)
      target_ias: 220,
      target_hdg: bearingDeg(eddsIaf.lat, eddsIaf.lon, eddsIf.lat, eddsIf.lon),
      target_alt: eddsIf.altitude_ft,
      com_active: 118.5,
      com_standby: 121.9,
      transponder_code: 2000,
    },
  },
  {
    id: 'eddf-gate-cold-dark',
    label: 'EDDF – Gate (Cold & Dark)',
    description: 'Am Gate, Triebwerke aus, Parkbremse gesetzt. Triebwerke starten und rausrollen.',
    icao: 'EDDF',
    runwayId: eddfRunway25C.id,
    initialState: {
      lat: EDDF.gate.lat,
      lon: EDDF.gate.lon,
      heading_deg: EDDF.gate.heading_deg,
      altitude_ft: eddfElevationFt,
      ias_kts: 0,
      on_ground: true,
      engineState: 'OFF',
      gearDown: true,
      flapsIndex: 0,
      parkingBrake: true,
      apMode: 'OFF',
      activeWaypointIndex: 0,
      target_ias: 0,
      target_hdg: EDDF.gate.heading_deg,
      target_alt: eddfElevationFt,
      com_active: 121.9,
      com_standby: 118.5,
      transponder_code: 2000,
    },
  },
  {
    id: 'eddf-runway-ready',
    label: 'EDDF – Startbahn (Ready for Takeoff)',
    description: 'Aufgereiht auf 25C, Triebwerke laufen, bereit zum Start.',
    icao: 'EDDF',
    runwayId: eddfRunway25C.id,
    initialState: {
      lat: eddfRunway25C.thresholdLat,
      lon: eddfRunway25C.thresholdLon,
      heading_deg: eddfRunway25C.course_deg,
      altitude_ft: eddfElevationFt,
      ias_kts: 0,
      on_ground: true,
      engineState: 'RUNNING',
      gearDown: true,
      flapsIndex: 1,
      parkingBrake: false,
      apMode: 'OFF',
      activeWaypointIndex: 0,
      target_ias: 250,
      target_hdg: eddfRunway25C.course_deg,
      target_alt: 5000,
      com_active: 119.9,
      com_standby: 121.9,
      transponder_code: 2000,
    },
  },
]
