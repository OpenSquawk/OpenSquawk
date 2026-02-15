import type { Phase } from '../types'

export const groundPhase: Phase = {
  id: 'ground',
  name: 'Ground Control',
  frequency: '121.700',
  unit: 'GND',
  nextPhase: 'tower',
  interactions: [
    {
      id: 'request_pushback',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot requests pushback and start-up clearance',
      pilotExample: '{callsign}, stand {stand}, request pushback and start-up',
      atcResponse: '{callsign}, pushback approved, face {push_direction}.',
      readback: {
        required: ['push_direction'],
        atcConfirm: 'Correct.',
        atcCorrect: 'Negative, pushback approved, face {push_direction}.',
      },
      updates: { pushback_approved: 'true' },
    },
    {
      id: 'request_taxi',
      type: 'pilot_initiates',
      when: 'pushback_approved',
      pilotIntent: 'Pilot requests taxi clearance to the runway',
      pilotExample: '{callsign}, request taxi',
      atcResponse: '{callsign}, taxi to holding point {runway} via {taxi_route}.',
      readback: {
        required: ['runway', 'taxi_route'],
        atcConfirm: 'Correct.',
        atcCorrect: 'Negative, taxi to holding point {runway} via {taxi_route}.',
      },
      updates: { taxi_clearance_received: 'true' },
    },
    {
      id: 'report_holding_short',
      type: 'pilot_initiates',
      when: 'taxi_clearance_received',
      pilotIntent: 'Pilot reports holding short of the runway',
      pilotExample: '{callsign}, holding short runway {runway}',
      atcResponse: '{callsign}, contact tower on {tower_freq}.',
      handoff: { toPhase: 'tower', say: 'Contact tower on {tower_freq}.' },
    },
    {
      id: 'request_cross_runway',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot requests permission to cross an active runway',
      pilotExample: '{callsign}, request cross runway {cross_runway}',
      atcResponse: '{callsign}, cross runway {cross_runway}, report vacated.',
      readback: {
        required: ['cross_runway'],
        atcConfirm: 'Correct.',
        atcCorrect: 'Negative, cross runway {cross_runway}, report vacated.',
      },
    },
  ],
}
