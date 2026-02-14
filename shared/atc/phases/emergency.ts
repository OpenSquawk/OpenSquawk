import type { Phase } from '../types'

/**
 * Emergency phase -- can be activated from ANY other phase.
 *
 * When the engine detects a MAYDAY or PAN PAN call it should:
 *   1. Save `flags.previousPhase` with the current phase id
 *   2. Set `flags.emergencyActive = true`
 *   3. Transition to this phase
 *
 * When the emergency is cancelled the engine should:
 *   1. Set `flags.emergencyActive = false`
 *   2. Restore `currentPhase` to `flags.previousPhase`
 *   3. Clear `flags.previousPhase`
 */
export const emergencyPhase: Phase = {
  id: 'emergency',
  name: 'Emergency',
  frequency: '121.500',
  unit: 'EMG',
  nextPhase: null,
  interactions: [
    {
      id: 'declare_mayday',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot declares a MAYDAY emergency (distress)',
      pilotExample: 'MAYDAY MAYDAY MAYDAY, {callsign}, {emergency_nature}, {pob} persons on board, fuel remaining {fuel_remaining} minutes',
      atcResponse: '{callsign}, MAYDAY acknowledged. Roger {emergency_nature}. All stations, stop transmitting, MAYDAY in progress. {callsign}, say intentions.',
      updates: { emergency_type: 'mayday', emergency_active: 'true' },
    },
    {
      id: 'declare_panpan',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot declares a PAN PAN (urgency)',
      pilotExample: 'PAN PAN PAN PAN PAN PAN, {callsign}, {emergency_nature}',
      atcResponse: '{callsign}, PAN PAN acknowledged. Roger {emergency_nature}. Say intentions.',
      updates: { emergency_type: 'panpan', emergency_active: 'true' },
    },
    {
      id: 'cancel_emergency',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot cancels the emergency, situation resolved',
      pilotExample: '{callsign}, cancel {emergency_type}, situation resolved',
      atcResponse: '{callsign}, roger, {emergency_type} cancelled. Resume normal operations. Contact {resume_freq}.',
      updates: { emergency_active: 'false' },
    },
    {
      id: 'emergency_landing',
      type: 'atc_initiates',
      pilotIntent: 'ATC provides vectors for an emergency landing',
      atcResponse: '{callsign}, turn {turn_direction} heading {assigned_heading}, vectors for {arrival_runway}. Cleared {approach_type} approach runway {arrival_runway}, emergency services standing by.',
      readback: {
        required: ['assigned_heading', 'arrival_runway'],
        atcConfirm: 'Correct, emergency services standing by.',
        atcCorrect: 'Negative, turn {turn_direction} heading {assigned_heading}, vectors for {arrival_runway}.',
      },
    },
    {
      id: 'souls_on_board',
      type: 'atc_initiates',
      pilotIntent: 'ATC requests souls on board and fuel remaining for emergency coordination',
      atcResponse: '{callsign}, say souls on board and fuel remaining.',
    },
  ],
}
