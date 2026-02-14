import type { Phase } from '../types'

export const departurePhase: Phase = {
  id: 'departure',
  name: 'Departure Control',
  frequency: '125.100',
  unit: 'DEP',
  nextPhase: 'enroute',
  autoAdvance: {
    parameter: 'altitude_ft',
    operator: '>=',
    value: 18000,
  },
  interactions: [
    {
      id: 'contact_departure',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot makes initial contact with departure after handoff from tower',
      pilotExample: '{callsign}, passing {altitude} feet, climbing {initial_alt}',
      atcResponse: '{callsign}, radar contact. Climb flight level {flight_level}.',
      readback: {
        required: ['flight_level'],
        atcConfirm: 'Correct.',
        atcCorrect: 'Negative, climb flight level {flight_level}.',
      },
    },
    {
      id: 'climb_instruction',
      type: 'atc_initiates',
      pilotIntent: 'ATC instructs pilot to climb to a new flight level',
      atcResponse: '{callsign}, climb flight level {assigned_fl}.',
      readback: {
        required: ['assigned_fl'],
        atcConfirm: 'Correct.',
        atcCorrect: 'Negative, climb flight level {assigned_fl}.',
      },
    },
    {
      id: 'turn_instruction',
      type: 'atc_initiates',
      pilotIntent: 'ATC instructs pilot to turn to a specific heading',
      atcResponse: '{callsign}, turn {turn_direction} heading {assigned_heading}.',
      readback: {
        required: ['turn_direction', 'assigned_heading'],
        atcConfirm: 'Correct.',
        atcCorrect: 'Negative, turn {turn_direction} heading {assigned_heading}.',
      },
    },
    {
      id: 'direct_to',
      type: 'atc_initiates',
      pilotIntent: 'ATC clears pilot to proceed direct to a waypoint',
      atcResponse: '{callsign}, proceed direct {waypoint}.',
      readback: {
        required: ['waypoint'],
        atcConfirm: 'Correct.',
        atcCorrect: 'Negative, proceed direct {waypoint}.',
      },
    },
  ],
}
