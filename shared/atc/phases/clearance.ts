import type { Phase } from '../types'

export const clearancePhase: Phase = {
  id: 'clearance',
  name: 'Clearance Delivery',
  frequency: '121.900',
  unit: 'DEL',
  nextPhase: 'ground',
  interactions: [
    {
      id: 'request_clearance',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot requests IFR clearance to destination',
      pilotExample: '{callsign}, request IFR clearance to {dest}, information {atis_code}',
      atcResponse: '{callsign}, cleared to {dest} via {sid} departure, runway {runway}, climb initially {initial_alt} feet, expect flight level {flight_level}, squawk {squawk}',
      readback: {
        required: ['dest', 'sid', 'runway', 'squawk', 'initial_alt'],
        atcConfirm: 'Readback correct. Contact ground on {ground_freq}.',
        atcCorrect: 'Negative, I say again: cleared to {dest} via {sid}, runway {runway}, climb initially {initial_alt} feet, squawk {squawk}.',
      },
      updates: { clearance_received: 'true' },
      handoff: { toPhase: 'ground', say: 'Contact ground on {ground_freq}.' },
    },
    {
      id: 'request_information',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot requests ATIS information or QNH',
      pilotExample: '{callsign}, request ATIS information',
      atcResponse: 'Information {atis_code} is current, QNH {qnh}.',
    },
  ],
}
