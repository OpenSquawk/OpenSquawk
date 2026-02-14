import type { Phase } from '../types'

export const taxiInPhase: Phase = {
  id: 'taxiIn',
  name: 'Ground Control (Arrival)',
  frequency: '121.700',
  unit: 'GND',
  nextPhase: null,
  interactions: [
    {
      id: 'contact_ground_arrival',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot contacts ground after vacating the runway',
      pilotExample: '{callsign}, runway {arrival_runway} vacated, request taxi to stand',
      atcResponse: '{callsign}, taxi to stand {arrival_stand} via {arrival_taxi_route}.',
      readback: {
        required: ['arrival_stand', 'arrival_taxi_route'],
        atcConfirm: 'Correct.',
        atcCorrect: 'Negative, taxi to stand {arrival_stand} via {arrival_taxi_route}.',
      },
    },
    {
      id: 'taxi_to_gate',
      type: 'atc_initiates',
      pilotIntent: 'ATC provides taxi instructions to the assigned stand',
      atcResponse: '{callsign}, taxi to stand {arrival_stand} via {arrival_taxi_route}.',
      readback: {
        required: ['arrival_stand', 'arrival_taxi_route'],
        atcConfirm: 'Correct.',
        atcCorrect: 'Negative, taxi to stand {arrival_stand} via {arrival_taxi_route}.',
      },
    },
    {
      id: 'report_at_gate',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot reports on stand with engines shut down',
      pilotExample: '{callsign}, on stand {arrival_stand}, engines shut down',
      atcResponse: '{callsign}, roger, welcome to {dest}. Frequency change approved.',
      updates: { session_complete: 'true' },
    },
  ],
}
