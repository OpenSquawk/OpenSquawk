import type { FrequencyChannel } from '~/data/communications'

export interface ChecklistItem {
    id: string
    challenge: string
    response: string
    optional?: boolean
    voiceHint?: string
}

export interface ChecklistSection {
    id: string
    title: string
    description?: string
    channel?: FrequencyChannel
    items: ChecklistItem[]
}

const a320Checklist: ChecklistSection[] = [
    {
        id: 'before-start',
        title: 'Before Start',
        channel: 'intercom',
        description: 'Electrical Power, FMS Init, Takeoff Data.',
        items: [
            { id: 'batt', challenge: 'Batteries', response: 'On' },
            { id: 'adirs', challenge: 'ADIRS', response: 'NAV' },
            { id: 'fuel', challenge: 'Fuel Pumps', response: 'On' },
            { id: 'fms', challenge: 'FMS / Flight Plan', response: 'Initialized' },
            { id: 'takeoff-data', challenge: 'Takeoff Data', response: 'Set' },
        ],
    },
    {
        id: 'after-start',
        title: 'After Start',
        channel: 'intercom',
        items: [
            { id: 'apu', challenge: 'APU Bleed', response: 'Off' },
            { id: 'anti-ice', challenge: 'Anti Ice', response: 'As Required', optional: true },
            { id: 'controls', challenge: 'Flight Controls', response: 'Check' },
            { id: 'pitch-trim', challenge: 'Pitch Trim', response: 'Set' },
            { id: 'ecam-status', challenge: 'ECAM Status', response: 'Checked' },
        ],
    },
    {
        id: 'before-takeoff',
        title: 'Before Takeoff',
        channel: 'intercom',
        items: [
            { id: 'cabins', challenge: 'Cabin', response: 'Ready' },
            { id: 'autobrake', challenge: 'Autobrake', response: 'Max / RTO' },
            { id: 'tcas', challenge: 'TCAS', response: 'TA/RA' },
            { id: 'lights', challenge: 'Exterior Lights', response: 'On' },
            { id: 'runway', challenge: 'Runway', response: 'Confirmed' },
        ],
    },
    {
        id: 'after-takeoff',
        title: 'After Takeoff',
        channel: 'intercom',
        items: [
            { id: 'landing-gear', challenge: 'Landing Gear', response: 'Up' },
            { id: 'flaps', challenge: 'Flaps', response: 'Retracted' },
            { id: 'climb-thrust', challenge: 'Climb Thrust', response: 'Set' },
            { id: 'packs', challenge: 'Packs', response: 'On' },
        ],
    },
    {
        id: 'approach',
        title: 'Approach',
        channel: 'intercom',
        items: [
            { id: 'briefing', challenge: 'Approach Briefing', response: 'Completed' },
            { id: 'minima', challenge: 'Minimums', response: 'Set' },
            { id: 'autobrake-landing', challenge: 'Autobrake', response: 'Set' },
            { id: 'landing-data', challenge: 'Landing Data', response: 'Computed' },
        ],
    },
    {
        id: 'landing',
        title: 'Landing',
        channel: 'intercom',
        items: [
            { id: 'gear', challenge: 'Landing Gear', response: 'Down' },
            { id: 'flaps-landing', challenge: 'Flaps', response: 'Configured' },
            { id: 'cabin-crew', challenge: 'Cabin Crew', response: 'Advised' },
        ],
    },
    {
        id: 'shutdown',
        title: 'Shutdown',
        channel: 'intercom',
        items: [
            { id: 'parking-brake', challenge: 'Parking Brake', response: 'Set' },
            { id: 'engines', challenge: 'Engines', response: 'Shut Down' },
            { id: 'beacon', challenge: 'Beacon', response: 'Off' },
            { id: 'seatbelt', challenge: 'Seat Belts', response: 'Off' },
        ],
    },
]

export const checklistLibrary: Record<string, ChecklistSection[]> = {
    A320: a320Checklist,
}

export function findChecklistByIcao(aircraftIcao: string | undefined | null): ChecklistSection[] {
    if (!aircraftIcao) {
        return []
    }
    const value = aircraftIcao.toUpperCase()
    if (value.startsWith('A20') || value.startsWith('A21') || value.startsWith('A32')) {
        return checklistLibrary.A320
    }
    return []
}

