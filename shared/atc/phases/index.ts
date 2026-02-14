import type { Phase } from '../types'
import { clearancePhase } from './clearance'
import { groundPhase } from './ground'
import { towerPhase } from './tower'
import { departurePhase } from './departure'
import { enroutePhase } from './enroute'
import { approachPhase } from './approach'
import { landingPhase } from './landing'
import { taxiInPhase } from './taxiIn'
import { emergencyPhase } from './emergency'

const phases: Phase[] = [
  clearancePhase,
  groundPhase,
  towerPhase,
  departurePhase,
  enroutePhase,
  approachPhase,
  landingPhase,
  taxiInPhase,
  emergencyPhase,
]

const phaseMap = new Map<string, Phase>(phases.map(p => [p.id, p]))

export function getPhase(id: string): Phase | undefined {
  return phaseMap.get(id)
}

export function getPhaseOrder(): string[] {
  return phases.filter(p => p.id !== 'emergency').map(p => p.id)
}

export function getAllPhases(): Phase[] {
  return [...phases]
}

export {
  clearancePhase,
  groundPhase,
  towerPhase,
  departurePhase,
  enroutePhase,
  approachPhase,
  landingPhase,
  taxiInPhase,
  emergencyPhase,
}
