import type { Phase } from '../types'

export const landingPhase: Phase = {
  id: 'landing',
  name: 'Tower (Landing)',
  frequency: '118.500',
  unit: 'TWR',
  nextPhase: 'taxiIn',
  autoAdvance: {
    parameter: 'on_ground',
    operator: '==',
    value: 1,
  },
  interactions: [
    {
      id: 'report_established',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot reports established on the final approach',
      pilotExample: '{callsign}, established {approach_type} runway {arrival_runway}',
      atcResponse: '{callsign}, roger, continue approach runway {arrival_runway}.',
    },
    {
      id: 'cleared_land',
      type: 'atc_initiates',
      pilotIntent: 'ATC clears pilot to land',
      atcResponse: '{callsign}, wind {wind}, runway {arrival_runway}, cleared to land.',
      readback: {
        required: ['arrival_runway'],
        atcConfirm: 'Correct.',
        atcCorrect: 'Negative, runway {arrival_runway}, cleared to land.',
      },
    },
    {
      id: 'go_around_instruction',
      type: 'atc_initiates',
      pilotIntent: 'ATC instructs pilot to go around due to traffic or runway obstruction',
      atcResponse: '{callsign}, go around, I say again go around. Climb altitude {go_around_alt} feet, fly runway heading.',
      readback: {
        required: ['go_around_alt'],
        atcConfirm: 'Correct, contact approach on {approach_freq}.',
        atcCorrect: 'Negative, go around, climb altitude {go_around_alt} feet, fly runway heading.',
      },
    },
  ],
}
