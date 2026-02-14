import type { Phase } from '../types'

export const approachPhase: Phase = {
  id: 'approach',
  name: 'Approach Control',
  frequency: '119.100',
  unit: 'APP',
  nextPhase: 'landing',
  interactions: [
    {
      id: 'contact_approach',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot makes initial contact with approach control',
      pilotExample: '{callsign}, descending flight level {flight_level}, information {atis_code}',
      atcResponse: '{callsign}, radar contact. Expect {approach_type} approach runway {arrival_runway}.',
    },
    {
      id: 'descend_instruction',
      type: 'atc_initiates',
      pilotIntent: 'ATC instructs pilot to descend to an assigned altitude',
      atcResponse: '{callsign}, descend altitude {assigned_alt} feet, QNH {qnh}.',
      readback: {
        required: ['assigned_alt', 'qnh'],
        atcConfirm: 'Correct.',
        atcCorrect: 'Negative, descend altitude {assigned_alt} feet, QNH {qnh}.',
      },
    },
    {
      id: 'cleared_approach',
      type: 'atc_initiates',
      pilotIntent: 'ATC clears pilot for the instrument approach',
      atcResponse: '{callsign}, cleared {approach_type} approach runway {arrival_runway}.',
      readback: {
        required: ['approach_type', 'arrival_runway'],
        atcConfirm: 'Correct. Contact tower on {tower_freq}.',
        atcCorrect: 'Negative, cleared {approach_type} approach runway {arrival_runway}.',
      },
      handoff: { toPhase: 'landing', say: 'Contact tower on {tower_freq}.' },
    },
    {
      id: 'request_alternate_approach',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot requests a different approach type than assigned',
      pilotExample: '{callsign}, request {requested_approach} approach runway {arrival_runway}',
      atcResponse: '{callsign}, approved, expect {requested_approach} approach runway {arrival_runway}.',
      updates: { approach_type: '{requested_approach}' },
    },
    {
      id: 'go_around',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot executes a go-around and reports to approach',
      pilotExample: '{callsign}, going around',
      atcResponse: '{callsign}, roger, climb altitude {initial_alt} feet, fly runway heading, contact approach on {approach_freq}.',
    },
    {
      id: 'speed_instruction',
      type: 'atc_initiates',
      pilotIntent: 'ATC instructs pilot to reduce or maintain a specific speed',
      atcResponse: '{callsign}, reduce speed {assigned_speed} knots.',
      readback: {
        required: ['assigned_speed'],
        atcConfirm: 'Correct.',
        atcCorrect: 'Negative, reduce speed {assigned_speed} knots.',
      },
    },
  ],
}
