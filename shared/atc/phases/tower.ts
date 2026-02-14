import type { Phase } from '../types'

export const towerPhase: Phase = {
  id: 'tower',
  name: 'Tower',
  frequency: '118.500',
  unit: 'TWR',
  nextPhase: 'departure',
  autoAdvance: {
    parameter: 'altitude_ft',
    operator: '>=',
    value: 1000,
  },
  interactions: [
    {
      id: 'report_ready_departure',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot reports ready for departure',
      pilotExample: '{callsign}, ready for departure runway {runway}',
      atcResponse: '{callsign}, hold position, standby.',
    },
    {
      id: 'lineup_and_wait',
      type: 'atc_initiates',
      pilotIntent: 'ATC instructs pilot to line up on the runway and wait',
      atcResponse: '{callsign}, runway {runway}, line up and wait.',
      readback: {
        required: ['runway'],
        atcConfirm: 'Correct.',
        atcCorrect: 'Negative, runway {runway}, line up and wait.',
      },
    },
    {
      id: 'cleared_takeoff',
      type: 'atc_initiates',
      pilotIntent: 'ATC clears pilot for takeoff',
      atcResponse: '{callsign}, wind {wind}, runway {runway}, cleared for takeoff.',
      readback: {
        required: ['runway'],
        atcConfirm: 'Correct, contact departure on {departure_freq} when airborne.',
        atcCorrect: 'Negative, runway {runway}, cleared for takeoff.',
      },
      updates: { takeoff_clearance: 'true' },
      handoff: { toPhase: 'departure', say: 'Contact departure on {departure_freq}.' },
    },
    {
      id: 'cancel_takeoff',
      type: 'atc_initiates',
      pilotIntent: 'ATC cancels takeoff clearance',
      atcResponse: '{callsign}, cancel takeoff, I say again cancel takeoff. Hold position.',
      readback: {
        required: [],
        atcConfirm: 'Correct, hold position.',
        atcCorrect: 'Negative, cancel takeoff, hold position.',
      },
      updates: { takeoff_clearance: 'false' },
    },
  ],
}
