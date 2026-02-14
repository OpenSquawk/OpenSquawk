import type { Phase } from '../types'

export const enroutePhase: Phase = {
  id: 'enroute',
  name: 'Center / En-Route Control',
  frequency: '132.600',
  unit: 'CTR',
  nextPhase: 'approach',
  interactions: [
    {
      id: 'contact_center',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot makes initial contact with center after handoff from departure',
      pilotExample: '{callsign}, flight level {flight_level}',
      atcResponse: '{callsign}, radar contact. Maintain flight level {flight_level}.',
    },
    {
      id: 'maintain_level',
      type: 'atc_initiates',
      pilotIntent: 'ATC instructs pilot to maintain current flight level',
      atcResponse: '{callsign}, maintain flight level {flight_level}.',
      readback: {
        required: ['flight_level'],
        atcConfirm: 'Correct.',
        atcCorrect: 'Negative, maintain flight level {flight_level}.',
      },
    },
    {
      id: 'request_level_change',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot requests a different flight level due to weather or ride comfort',
      pilotExample: '{callsign}, request flight level {requested_fl}',
      atcResponse: '{callsign}, climb flight level {requested_fl}.',
      readback: {
        required: ['requested_fl'],
        atcConfirm: 'Correct.',
        atcCorrect: 'Negative, climb flight level {requested_fl}.',
      },
      alternatives: [
        {
          intent: 'Request denied due to traffic',
          atcResponse: '{callsign}, unable flight level {requested_fl} due traffic. Maintain flight level {flight_level}.',
        },
      ],
    },
    {
      id: 'position_report',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot reports current position over a waypoint or fix',
      pilotExample: '{callsign}, position {waypoint}, flight level {flight_level}, estimating {next_waypoint} at {est_time}',
      atcResponse: '{callsign}, roger, report {next_waypoint}.',
    },
  ],
}
