import type {RadioMode, VatsimFlightPlan} from '~/stores/pilotMonitoring'
import {renderAtcPhrase} from '~/utils/phraseology'

export type StepTrigger = 'pilot' | 'atc' | 'system'

export interface CommunicationContext {
  callsign?: string
  departure?: string
  arrival?: string
  alternate?: string
  runway?: string
  squawk?: string
  sid?: string
  star?: string
  transition?: string
  cruiseAltitude?: string | number
  requestedAltitude?: string | number
  frequency?: string | number
  nextFrequency?: string | number
  handoffController?: string
  taxiRoute?: string
  wind?: string
  fix?: string
}

export interface CommunicationStep {
  id: string
  speaker: 'pilot' | 'atc'
  summary: string
  template: string
  trigger: StepTrigger
  requiresPtt?: RadioMode
  contextKeys?: (keyof CommunicationContext)[]
  autoAdvance?: boolean
  expectation?: string
  help?: string
}

export interface CommunicationPhase {
  id: string
  title: string
  description: string
  defaultMode: RadioMode
  defaultFrequencyHint?: string
  checklistTag?: string
  steps: CommunicationStep[]
}

function makeContext(plan?: VatsimFlightPlan | null): CommunicationContext {
  return {
    callsign: plan?.callsign,
    departure: plan?.departure.icao,
    arrival: plan?.arrival.icao,
    alternate: plan?.alternate?.icao,
  }
}

export function renderStepText(
  step: CommunicationStep,
  plan: VatsimFlightPlan | null | undefined,
  additional: Partial<CommunicationContext> = {},
): string {
  const context = {...makeContext(plan), ...additional}
  return renderAtcPhrase(step.template, context)
}

export const communicationPlaybook: CommunicationPhase[] = [
  {
    id: 'startup',
    title: 'Startup & Clearance',
    description:
      'Check-In beim Delivery/ Ground für Clearance, Transponder und erste Frequenz.',
    defaultMode: 'atc',
    defaultFrequencyHint: 'Delivery / Ground',
    checklistTag: 'before-start',
    steps: [
      {
        id: 'startup-contact',
        speaker: 'pilot',
        summary: 'Initialer Call beim Delivery',
        template:
          "{{callsign|callsign}}, at stand, IFR to {{arrival}}, request clearance.",
        trigger: 'pilot',
        requiresPtt: 'atc',
        expectation:
          'Lieferung/Delivery antwortet mit Clearance, Squawk und ggf. SID.',
      },
      {
        id: 'startup-clearance',
        speaker: 'atc',
        summary: 'Clearance Erteilung',
        template:
          '{{callsign|callsign}} cleared to {{arrival}} via {{sid}} SID, climb {{cruiseAltitude|altitude}}, squawk {{squawk|squawk}}.',
        trigger: 'atc',
        expectation: 'Pilot readback vollständig.',
      },
      {
        id: 'startup-readback',
        speaker: 'pilot',
        summary: 'Clearance Readback',
        template:
          '{{callsign|callsign}} cleared {{sid}}, climb {{cruiseAltitude|altitude}}, squawk {{squawk|squawk}}.',
        trigger: 'pilot',
        requiresPtt: 'atc',
      },
      {
        id: 'startup-taxi-request',
        speaker: 'pilot',
        summary: 'Push & Start / Taxi request',
        template:
          '{{callsign|callsign}} request push and start.',
        trigger: 'pilot',
        requiresPtt: 'atc',
        expectation: 'ATC erteilt push/start und taxi instructions.',
      },
    ],
  },
  {
    id: 'taxi',
    title: 'Taxi',
    description: 'Taxi-Instruktionen, progressive Readbacks und Randomizer für Trainings.',
    defaultMode: 'atc',
    defaultFrequencyHint: 'Ground',
    checklistTag: 'taxi',
    steps: [
      {
        id: 'taxi-request',
        speaker: 'pilot',
        summary: 'Taxi Request',
        template:
          '{{callsign|callsign}} ready to taxi.',
        trigger: 'pilot',
        requiresPtt: 'atc',
      },
      {
        id: 'taxi-clearance',
        speaker: 'atc',
        summary: 'Taxi Clearance',
        template:
          '{{callsign|callsign}} taxi to holding point {{runway|runway}} via {{taxiRoute}}.',
        trigger: 'atc',
        expectation: 'Pilot liest Route, Runway, Hold Short zurück.',
      },
      {
        id: 'taxi-readback',
        speaker: 'pilot',
        summary: 'Taxi Readback',
        template:
          '{{callsign|callsign}} taxi {{runway|runway}} via {{taxiRoute}}.',
        trigger: 'pilot',
        requiresPtt: 'atc',
      },
      {
        id: 'taxi-holdshort',
        speaker: 'pilot',
        summary: 'Holding short melden',
        template:
          '{{callsign|callsign}} holding short runway {{runway|runway}}.',
        trigger: 'pilot',
        requiresPtt: 'atc',
      },
    ],
  },
  {
    id: 'departure',
    title: 'Departure',
    description: 'Takeoff Clearance, initial climb und Departure Hand-off.',
    defaultMode: 'atc',
    defaultFrequencyHint: 'Tower / Departure',
    checklistTag: 'before-takeoff',
    steps: [
      {
        id: 'departure-lineup',
        speaker: 'pilot',
        summary: 'Line-Up erbitten',
        template:
          '{{callsign|callsign}} ready for departure runway {{runway|runway}}.',
        trigger: 'pilot',
        requiresPtt: 'atc',
      },
      {
        id: 'departure-clearance',
        speaker: 'atc',
        summary: 'Takeoff Clearance',
        template:
          '{{callsign|callsign}} wind {{wind}}, cleared for takeoff runway {{runway|runway}}.',
        trigger: 'atc',
        expectation: 'Pilot readback + rolling.',
      },
      {
        id: 'departure-rolling',
        speaker: 'pilot',
        summary: 'Rolling',
        template:
          '{{callsign|callsign}} rolling runway {{runway|runway}}.',
        trigger: 'pilot',
        requiresPtt: 'atc',
      },
      {
        id: 'departure-handoff',
        speaker: 'atc',
        summary: 'Handoff zu Departure',
        template:
          '{{callsign|callsign}} contact departure on {{nextFrequency|frequency}}.',
        trigger: 'atc',
        expectation: 'Pilot bestätigt, wechselt Frequenz und checkt in.',
      },
      {
        id: 'departure-checkin',
        speaker: 'pilot',
        summary: 'Check-In bei Departure',
        template:
          '{{handoffController}} departure, {{callsign|callsign}}, passing {{altitude|altitude}} for {{cruiseAltitude|altitude}}.',
        trigger: 'pilot',
        requiresPtt: 'atc',
      },
    ],
  },
  {
    id: 'cruise',
    title: 'Enroute',
    description: 'Monitoring, Frequency Changes, Re-Routes.',
    defaultMode: 'atc',
    defaultFrequencyHint: 'Center',
    checklistTag: 'cruise',
    steps: [
      {
        id: 'cruise-checkin',
        speaker: 'pilot',
        summary: 'Initialer Center Call',
        template:
          '{{handoffController}} control, {{callsign|callsign}}, flight level {{cruiseAltitude|altitude}}.',
        trigger: 'pilot',
        requiresPtt: 'atc',
      },
      {
        id: 'cruise-altitude-change',
        speaker: 'pilot',
        summary: 'Altitude change request',
        template:
          '{{callsign|callsign}} request climb to {{requestedAltitude|altitude}}.',
        trigger: 'pilot',
        requiresPtt: 'atc',
      },
    ],
  },
  {
    id: 'descent',
    title: 'Descent & Arrival',
    description: 'STAR, Approach Briefing, Transition.',
    defaultMode: 'atc',
    defaultFrequencyHint: 'Approach',
    checklistTag: 'descent',
    steps: [
      {
        id: 'descent-initial',
        speaker: 'atc',
        summary: 'Initial descent',
        template:
          '{{callsign|callsign}} descend via {{star}} arrival, be level {{altitude|altitude}} by {{fix}}.',
        trigger: 'atc',
        expectation: 'Pilot readback + descent management.',
      },
      {
        id: 'descent-readback',
        speaker: 'pilot',
        summary: 'Descent readback',
        template:
          '{{callsign|callsign}} descend via {{star}}, level {{altitude|altitude}} by {{fix}}.',
        trigger: 'pilot',
        requiresPtt: 'atc',
      },
      {
        id: 'descent-handoff',
        speaker: 'atc',
        summary: 'Handoff Approach → Tower',
        template:
          '{{callsign|callsign}} contact tower {{nextFrequency|frequency}}.',
        trigger: 'atc',
      },
    ],
  },
  {
    id: 'approach',
    title: 'Approach & Landing',
    description: 'Final Approach, Landing clearance & Rollout.',
    defaultMode: 'atc',
    defaultFrequencyHint: 'Tower',
    checklistTag: 'landing',
    steps: [
      {
        id: 'approach-final',
        speaker: 'pilot',
        summary: 'Final call',
        template:
          '{{callsign|callsign}} on final runway {{runway|runway}}.',
        trigger: 'pilot',
        requiresPtt: 'atc',
      },
      {
        id: 'approach-landing-clearance',
        speaker: 'atc',
        summary: 'Landing clearance',
        template:
          '{{callsign|callsign}} wind {{wind}}, cleared to land runway {{runway|runway}}.',
        trigger: 'atc',
      },
      {
        id: 'approach-rollout',
        speaker: 'pilot',
        summary: 'Vacate runway',
        template:
          '{{callsign|callsign}} runway vacated.',
        trigger: 'pilot',
        requiresPtt: 'atc',
      },
    ],
  },
  {
    id: 'shutdown',
    title: 'After Landing & Shutdown',
    description: 'Taxi to Gate, Parking, Secure aircraft.',
    defaultMode: 'atc',
    defaultFrequencyHint: 'Ground / Apron',
    checklistTag: 'shutdown',
    steps: [
      {
        id: 'shutdown-taxi',
        speaker: 'pilot',
        summary: 'Taxi to stand',
        template:
          '{{callsign|callsign}} request taxi to stand.',
        trigger: 'pilot',
        requiresPtt: 'atc',
      },
      {
        id: 'shutdown-stand',
        speaker: 'pilot',
        summary: 'On stand',
        template:
          '{{callsign|callsign}} on stand, shutting down.',
        trigger: 'pilot',
        requiresPtt: 'atc',
      },
    ],
  },
]

export type CommunicationPhaseId = (typeof communicationPlaybook)[number]['id']

export function getPhaseById(id: string): CommunicationPhase | undefined {
  return communicationPlaybook.find((phase) => phase.id === id)
}
