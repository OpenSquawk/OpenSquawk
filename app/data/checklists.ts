export interface ChecklistItem {
  id: string
  challenge: string
  response: string
  notes?: string
}

export interface ChecklistSection {
  id: string
  phase: string
  title: string
  type: 'normal' | 'memory'
  items: ChecklistItem[]
}

export type ChecklistDictionary = Record<string, ChecklistSection[]>

export const a320Checklist: ChecklistSection[] = [
  {
    id: 'a320-before-start',
    phase: 'before-start',
    title: 'Before Start',
    type: 'normal',
    items: [
      {id: 'ckl-ext-power', challenge: 'EXT PWR / APU', response: 'ON / AVAIL'},
      {id: 'ckl-doors', challenge: 'Doors & Windows', response: 'CLOSED'},
      {id: 'ckl-seatbelts', challenge: 'Seat Belts', response: 'ON'},
      {id: 'ckl-adirs', challenge: 'ADIRS', response: 'NAV'},
      {id: 'ckl-takeoff-data', challenge: 'Takeoff Data', response: 'SET'},
    ],
  },
  {
    id: 'a320-after-start',
    phase: 'taxi',
    title: 'After Start',
    type: 'normal',
    items: [
      {id: 'ckl-flaps', challenge: 'Flaps', response: 'SET'},
      {id: 'ckl-pitch-trim', challenge: 'Pitch Trim', response: 'SET'},
      {id: 'ckl-anti-ice', challenge: 'Anti-Ice', response: 'AS REQ'},
      {id: 'ckl-ecam-status', challenge: 'ECAM Status', response: 'CHECKED'},
    ],
  },
  {
    id: 'a320-before-takeoff',
    phase: 'before-takeoff',
    title: 'Before Takeoff',
    type: 'normal',
    items: [
      {id: 'ckl-brake-temp', challenge: 'Brake Temp', response: 'CHECK'},
      {id: 'ckl-fma', challenge: 'FMA', response: 'CHECK'},
      {id: 'ckl-cabin', challenge: 'Cabin', response: 'READY'},
      {id: 'ckl-ecam-memo', challenge: 'ECAM Memo', response: 'NO BLUE'},
    ],
  },
  {
    id: 'a320-cruise',
    phase: 'cruise',
    title: 'Cruise',
    type: 'normal',
    items: [
      {id: 'ckl-systems', challenge: 'Systems', response: 'CHECK'},
      {id: 'ckl-fuel', challenge: 'Fuel', response: 'MONITOR'},
      {id: 'ckl-nav', challenge: 'Navigation', response: 'UPDATE / CHECK'},
    ],
  },
  {
    id: 'a320-descent',
    phase: 'descent',
    title: 'Descent',
    type: 'normal',
    items: [
      {id: 'ckl-briefing', challenge: 'Approach Briefing', response: 'CONFIRMED'},
      {id: 'ckl-minima', challenge: 'Minimums', response: 'SET'},
      {id: 'ckl-ecam-descent', challenge: 'ECAM Status', response: 'CHECKED'},
    ],
  },
  {
    id: 'a320-landing',
    phase: 'landing',
    title: 'Landing',
    type: 'normal',
    items: [
      {id: 'ckl-gear', challenge: 'Landing Gear', response: 'DOWN / 3 GREEN'},
      {id: 'ckl-flaps-landing', challenge: 'Flaps', response: 'CONFIG FULL'},
      {id: 'ckl-autobrake', challenge: 'Autobrake', response: 'SET'},
    ],
  },
  {
    id: 'a320-shutdown',
    phase: 'shutdown',
    title: 'Shutdown',
    type: 'normal',
    items: [
      {id: 'ckl-parking-brake', challenge: 'Parking Brake', response: 'SET'},
      {id: 'ckl-beacon', challenge: 'Beacon', response: 'OFF'},
      {id: 'ckl-fuel-pumps', challenge: 'Fuel Pumps', response: 'OFF'},
      {id: 'ckl-ir-off', challenge: 'ADIRS', response: 'OFF'},
    ],
  },
]

export const checklistLibrary: ChecklistDictionary = {
  a320: a320Checklist,
}

export function getChecklist(aircraft: string): ChecklistSection[] {
  return checklistLibrary[aircraft.toLowerCase()] || []
}

export function getChecklistForPhase(aircraft: string, phase: string): ChecklistSection[] {
  return getChecklist(aircraft).filter((section) => section.phase === phase)
}
