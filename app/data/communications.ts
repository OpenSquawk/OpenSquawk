export type FrequencyChannel = 'atc' | 'intercom'

export type FlightPhaseId =
    | 'startup'
    | 'pushback'
    | 'taxi'
    | 'departure'
    | 'enroute'
    | 'arrival'
    | 'landing'
    | 'shutdown'

export interface PhaseFrequency {
    facility: string
    value: string
    channel: FrequencyChannel
    notes?: string
    autoTune?: boolean
}

export type TriggerEvent = 'onPilotTransmission' | 'onAtcInstruction' | 'onExternalTrigger' | 'onChecklistComplete'

export interface TriggerDefinition {
    id: string
    label: string
    when: TriggerEvent
    description?: string
    handoffPhaseId?: FlightPhaseId
    waitForPtt?: boolean
}

export interface ProcedureAction {
    id: string
    label: string
    type: 'pilot' | 'atc' | 'system'
    channel: FrequencyChannel
    description: string
    notes?: string
    samplePhraseology?: string[]
    triggers?: TriggerDefinition[]
    expectsReadback?: boolean
    defaultVariables?: Record<string, string>
    metadata?: Record<string, string>
}

export interface FlightPhaseDefinition {
    id: FlightPhaseId
    title: string
    summary: string
    defaultFrequencies: PhaseFrequency[]
    actions: ProcedureAction[]
}

export const flightPhases: FlightPhaseDefinition[] = [
    {
        id: 'startup',
        title: 'Start-Up & Clearance',
        summary:
            'Nach dem Prefile den Funkkanal prüfen, Clearance holen und Crew auf den Flug einstimmen. Intercom für Checklisten, ATC für Clearance und Radio Check.',
        defaultFrequencies: [
            {
                facility: 'Delivery / Tower',
                value: '118.500',
                channel: 'atc',
                notes: 'Beispielwert – später durch Facility-Daten ersetzen.',
            },
            {
                facility: 'Intercom',
                value: 'INTERCOM',
                channel: 'intercom',
                notes: 'Für Crew-Koordination und Checklisten.',
            },
        ],
        actions: [
            {
                id: 'radio-check',
                label: 'Radio Check',
                type: 'pilot',
                channel: 'atc',
                description:
                    'Nach dem Verbinden mit der Delivery/Tower-Frequenz einen Radio Check durchführen, um Audio und PTT-Kette zu prüfen.',
                samplePhraseology: [
                    '{{callsign}}, {{facility}}, radio check ({{frequency}}).',
                    '{{facility}}, {{callsign}}, read you five.',
                ],
                triggers: [
                    {
                        id: 'radioCheckAcknowledged',
                        label: 'ATC bestätigt Lesbarkeit',
                        when: 'onAtcInstruction',
                        description:
                            'Schaltet den Radio-Check-Status auf completed und ermöglicht Clearance Request.',
                    },
                ],
            },
            {
                id: 'clearance-request',
                label: 'IFR/VFR Clearance anfordern',
                type: 'pilot',
                channel: 'atc',
                description:
                    'Die Clearance entsprechend dem eingereichten Flugplan anfragen. Enthält optional bereits Squawk/Departure-Informationen.',
                samplePhraseology: [
                    '{{facility}}, {{callsign}}, IFR to {{arrival}} ready to copy clearance.',
                ],
                expectsReadback: true,
                triggers: [
                    {
                        id: 'clearanceDelivered',
                        label: 'ATC liest Clearance vor',
                        when: 'onAtcInstruction',
                        description: 'Startet automatische Analyse durch LLM und löst Readback-Check aus.',
                    },
                ],
            },
            {
                id: 'clearance-readback',
                label: 'Clearance Readback',
                type: 'pilot',
                channel: 'atc',
                description:
                    'Clearance vollständig zurücklesen. Enthält Route, Squawk, initiale Höhe und sonstige Einschränkungen. LLM vergleicht Readback mit Clearance.',
                samplePhraseology: [
                    '{{callsign}} cleared to {{arrival}} via {{sid}}, squawk {{squawk}}.',
                ],
                triggers: [
                    {
                        id: 'clearanceReadbackAccepted',
                        label: 'ATC bestätigt Readback',
                        when: 'onAtcInstruction',
                        description: 'Phase wechselt zu Pushback/Engine Start.',
                        handoffPhaseId: 'pushback',
                    },
                ],
            },
            {
                id: 'before-start-checklist',
                label: 'Before Start Checklist (Intercom)',
                type: 'system',
                channel: 'intercom',
                description:
                    'Crew führt die Before Start Checklist über Intercom durch. Die Items werden aus dem Flugzeug-spezifischen Datensatz geladen.',
                notes: 'Kann parallel zu ATC-Funk vorbereitet werden.',
                triggers: [
                    {
                        id: 'beforeStartChecklistDone',
                        label: 'Checklist Complete',
                        when: 'onChecklistComplete',
                        description: 'Erlaubt Pushback request.',
                    },
                ],
            },
        ],
    },
    {
        id: 'pushback',
        title: 'Pushback & Engine Start',
        summary:
            'Koordination mit Ground für Pushback/Start, Intercom für Engine-Flow. Auf Wunsch Follow-Me oder Stand-Informationen bereitstellen.',
        defaultFrequencies: [
            {
                facility: 'Ground',
                value: '121.900',
                channel: 'atc',
                notes: 'Standard-Ground-Frequenz (Platzhalter).',
            },
            {
                facility: 'Intercom',
                value: 'INTERCOM',
                channel: 'intercom',
            },
        ],
        actions: [
            {
                id: 'pushback-request',
                label: 'Pushback anfordern',
                type: 'pilot',
                channel: 'atc',
                description: 'Pushback mit Ausrichtung und ggf. Start-Freigabe anfragen.',
                samplePhraseology: [
                    '{{facility}}, {{callsign}} stand {{stand}}, request pushback facing {{direction}}.',
                ],
                triggers: [
                    {
                        id: 'pushbackApproved',
                        label: 'Ground genehmigt Pushback',
                        when: 'onAtcInstruction',
                        description: 'Starte Timer für Pushback, optional Follow-Me.',
                    },
                ],
            },
            {
                id: 'engine-start-flow',
                label: 'Engine Start Flow',
                type: 'system',
                channel: 'intercom',
                description:
                    'Checkliste/Flows für Engine Start laufen über Intercom inklusive gegenseitiger Bestätigungen.',
            },
            {
                id: 'after-start-checklist',
                label: 'After Start Checklist',
                type: 'system',
                channel: 'intercom',
                description: 'Standard After-Start Items (Flaps, Flight Controls, Flight Instruments).',
                triggers: [
                    {
                        id: 'afterStartChecklistDone',
                        label: 'Checklist Complete',
                        when: 'onChecklistComplete',
                        description: 'Bereitet Taxi Request vor.',
                    },
                ],
            },
        ],
    },
    {
        id: 'taxi',
        title: 'Taxi',
        summary:
            'Taxi Clearance einholen, Randomizer optional aktivieren, um ungewohnte Routen zu üben. Unterstützt Progressive Taxi und Hold-Short Calls.',
        defaultFrequencies: [
            {
                facility: 'Ground',
                value: '121.900',
                channel: 'atc',
            },
        ],
        actions: [
            {
                id: 'taxi-request',
                label: 'Taxi anfordern',
                type: 'pilot',
                channel: 'atc',
                description: 'Taxi Clearance inklusive Runway und Hold Short erbitten.',
                notes: 'Randomizer kann alternative Taxiways erzeugen.',
                samplePhraseology: [
                    '{{facility}}, {{callsign}} ready to taxi.',
                ],
                triggers: [
                    {
                        id: 'taxiClearanceIssued',
                        label: 'Ground gibt Taxi Clearance',
                        when: 'onAtcInstruction',
                        description: 'LLM extrahiert Taxi Route und stellt progressive Hilfe bereit.',
                    },
                ],
            },
            {
                id: 'hold-short',
                label: 'Hold Short / Crossing',
                type: 'atc',
                channel: 'atc',
                description:
                    'ATC-Instruction für Hold Short, Crossing oder Give Way. System erwartet korrektes Readback.',
                expectsReadback: true,
            },
            {
                id: 'before-takeoff-checklist',
                label: 'Before Takeoff Checklist',
                type: 'system',
                channel: 'intercom',
                description: 'Finale Konfiguration vor Takeoff – Flaps, Cabin, TCAS, Lights.',
            },
        ],
    },
    {
        id: 'departure',
        title: 'Departure & Initial Climb',
        summary:
            'Takeoff Clearance, Departure Roll und erste Steigphase inkl. SID-Kommunikation. Beinhaltet Handoff zu Departure/Approach.',
        defaultFrequencies: [
            {
                facility: 'Tower',
                value: '119.100',
                channel: 'atc',
            },
        ],
        actions: [
            {
                id: 'takeoff-clearance',
                label: 'Takeoff Clearance',
                type: 'atc',
                channel: 'atc',
                description: 'Tower gibt Takeoff Clearance inklusive Windinformationen.',
                expectsReadback: true,
            },
            {
                id: 'handoff-departure',
                label: 'Handoff zu Departure',
                type: 'atc',
                channel: 'atc',
                description: 'Tower weist neue Frequenz zu. System prüft Frequency Change Workflow.',
                triggers: [
                    {
                        id: 'contactDeparture',
                        label: 'Pilot meldet sich bei Departure',
                        when: 'onPilotTransmission',
                        description: 'Aktualisiert aktive Frequenz und startet Departure-Dialog.',
                    },
                ],
            },
            {
                id: 'climb-instruction',
                label: 'Climb / Heading Instruction',
                type: 'atc',
                channel: 'atc',
                description:
                    'Departure überträgt Steigfreigabe, Heading oder Speed. Pilot bestätigt via Readback.',
                expectsReadback: true,
            },
        ],
    },
    {
        id: 'enroute',
        title: 'Enroute & Cruise',
        summary:
            'Monitoring von Center-Frequenzen, mögliche Directs, Altitude Changes und Anfragen an ATC. Intercom für Cruise-Checkliste.',
        defaultFrequencies: [
            {
                facility: 'Center',
                value: '125.550',
                channel: 'atc',
            },
        ],
        actions: [
            {
                id: 'cruise-checklist',
                label: 'Cruise Checklist (Intercom)',
                type: 'system',
                channel: 'intercom',
                description: 'Kurzcheck für Systeme, Treibstoff, ETAs.',
            },
            {
                id: 'direct-request',
                label: 'Direct Request / Altitude Change',
                type: 'pilot',
                channel: 'atc',
                description: 'Optionaler Request an Center für Direktroute oder neue Reiseflughöhe.',
            },
        ],
    },
    {
        id: 'arrival',
        title: 'Arrival & Approach',
        summary:
            'STAR Briefing, Descent Clearance und Approach Prep. METAR/ATIS werden überwacht, Intercom für Approach Checklist.',
        defaultFrequencies: [
            {
                facility: 'Approach',
                value: '120.800',
                channel: 'atc',
            },
        ],
        actions: [
            {
                id: 'descent-clearance',
                label: 'Descent Clearance',
                type: 'atc',
                channel: 'atc',
                description: 'Approach gibt Sinkflugfreigabe, altitudes werden über Speech-Normalizer geprüft.',
                expectsReadback: true,
            },
            {
                id: 'approach-briefing',
                label: 'Approach Briefing (Intercom)',
                type: 'system',
                channel: 'intercom',
                description: 'Crew bespricht Verfahren, Minima und Missed Approach.',
            },
            {
                id: 'approach-checklist',
                label: 'Approach Checklist',
                type: 'system',
                channel: 'intercom',
            },
        ],
    },
    {
        id: 'landing',
        title: 'Landing & Rollout',
        summary:
            'Landing Clearance, Rollout Calls und evtl. Exit/Backtrack Koordination. Enthält mögliche Missed Approach Trigger.',
        defaultFrequencies: [
            {
                facility: 'Tower',
                value: '118.300',
                channel: 'atc',
            },
        ],
        actions: [
            {
                id: 'landing-clearance',
                label: 'Landing Clearance',
                type: 'atc',
                channel: 'atc',
                description: 'Tower gibt Landing Clearance inkl. Wind. Readback erforderlich.',
                expectsReadback: true,
            },
            {
                id: 'runway-exit',
                label: 'Runway Exit / Contact Ground',
                type: 'atc',
                channel: 'atc',
                description: 'Tower weist Rollweg/Frequenz zu Ground zu.',
                triggers: [
                    {
                        id: 'contactGroundAfterLanding',
                        label: 'Pilot meldet sich bei Ground',
                        when: 'onPilotTransmission',
                        description: 'Phase wechselt zu Shutdown/Taxi-In.',
                        handoffPhaseId: 'shutdown',
                    },
                ],
            },
            {
                id: 'after-landing-checklist',
                label: 'After Landing Checklist',
                type: 'system',
                channel: 'intercom',
            },
        ],
    },
    {
        id: 'shutdown',
        title: 'Taxi-In & Shutdown',
        summary:
            'Taxi zur Parkposition, Triebwerke abstellen, Flug nachbereiten. Enthält Parking Checklist und Debrief.',
        defaultFrequencies: [
            {
                facility: 'Ground / Ramp',
                value: '121.725',
                channel: 'atc',
                notes: 'Placeholder für Apron/Ramp.',
            },
        ],
        actions: [
            {
                id: 'taxi-in',
                label: 'Taxi to Stand',
                type: 'atc',
                channel: 'atc',
                description: 'Taxi-Anweisung zum Gate oder Stand, optional Follow-Me.',
            },
            {
                id: 'parking-checklist',
                label: 'Parking Checklist',
                type: 'system',
                channel: 'intercom',
            },
            {
                id: 'postflight-notes',
                label: 'Debrief & Notes',
                type: 'system',
                channel: 'intercom',
                description: 'Kommentare für Nachbereitung, Logbuch oder VATSIM Feedback.',
            },
        ],
    },
]

export const defaultPhaseOrder: FlightPhaseId[] = flightPhases.map((phase) => phase.id)

export function getPhaseById(id: FlightPhaseId): FlightPhaseDefinition | undefined {
    return flightPhases.find((phase) => phase.id === id)
}

export function getDefaultFrequencyForPhase(
    phaseId: FlightPhaseId,
    channel: FrequencyChannel,
): PhaseFrequency | undefined {
    const phase = getPhaseById(phaseId)
    if (!phase) {
        return undefined
    }
    return phase.defaultFrequencies.find((freq) => freq.channel === channel)
}

