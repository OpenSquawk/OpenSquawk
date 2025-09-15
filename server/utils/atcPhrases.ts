// server/utils/atcPhrases.ts
export interface ATCPhrase {
    id: string;
    moduleId: string;
    lessonId: string;
    type: 'instruction' | 'clearance' | 'information' | 'request';
    template: string;
    variables?: Record<string, string[]>;
    context?: {
        airport?: string;
        runway?: string;
        frequency?: string;
        callsign?: string;
    };
}

export const ATC_PHRASES: ATCPhrase[] = [
    // ICAO Alphabet Module
    {
        id: 'icao_alpha_drill',
        moduleId: 'icao',
        lessonId: 'alpha',
        type: 'instruction',
        template: 'Spell your callsign using phonetic alphabet from {start} to {end}',
        variables: {
            start: ['Alpha', 'Bravo', 'Charlie'],
            end: ['Lima', 'Mike', 'November']
        }
    },
    {
        id: 'icao_numbers_drill',
        moduleId: 'icao',
        lessonId: 'numbers',
        type: 'instruction',
        template: 'Read back transponder code {squawk}',
        variables: {
            squawk: ['1234', '4567', '7321', '2156', '6543']
        }
    },
    {
        id: 'icao_callsign_spell',
        moduleId: 'icao',
        lessonId: 'callsign-icao',
        type: 'instruction',
        template: '{callsign}, spell your callsign',
        variables: {
            callsign: ['DLH123', 'BAW456', 'AFR789', 'KLM321', 'RYR654']
        }
    },

    // Basics Module
    {
        id: 'ground_checkin',
        moduleId: 'basics',
        lessonId: 'checkin',
        type: 'clearance',
        template: '{callsign}, {ground_station}, stand {stand} available, taxi when ready',
        variables: {
            callsign: ['DLH123', 'BAW456', 'AFR789'],
            ground_station: ['Frankfurt Ground', 'Munich Ground', 'Berlin Ground'],
            stand: ['A12', 'B24', 'C15', 'V155', 'G23']
        },
        context: {
            airport: 'EDDF'
        }
    },
    {
        id: 'basic_readback',
        moduleId: 'basics',
        lessonId: 'readback',
        type: 'instruction',
        template: '{callsign}, contact Tower on {frequency}',
        variables: {
            callsign: ['DLH123', 'BAW456', 'AFR789'],
            frequency: ['118.500', '119.900', '121.700', '124.850']
        }
    },

    // Ground Operations
    {
        id: 'taxi_clearance_simple',
        moduleId: 'ground',
        lessonId: 'taxi1',
        type: 'clearance',
        template: '{callsign}, taxi to runway {runway} via {taxiway}, hold short runway {runway}',
        variables: {
            callsign: ['DLH123', 'BAW456', 'AFR789', 'EZY234'],
            runway: ['25R', '25L', '07R', '07L', '18', '36'],
            taxiway: ['A A5 B2', 'C C3 A', 'A A7 N N4', 'B B1 A3']
        }
    },
    {
        id: 'taxi_clearance_complex',
        moduleId: 'ground',
        lessonId: 'taxi1',
        type: 'clearance',
        template: '{callsign}, taxi to runway {runway} via {route}, hold short runway {hold_runway}',
        variables: {
            callsign: ['DLH359', 'BAW12A', 'AFR567'],
            runway: ['25R', '25L', '07R'],
            route: ['A A3 B B1', 'C C5 A A7', 'M M1 A A5 B'],
            hold_runway: ['25R', '25L', '07R', '18']
        }
    },
    {
        id: 'handoff_tower',
        moduleId: 'ground',
        lessonId: 'handoff',
        type: 'instruction',
        template: '{callsign}, contact Tower on {frequency}',
        variables: {
            callsign: ['DLH123', 'BAW456', 'AFR789'],
            frequency: ['118.500', '119.900', '121.700', '124.850', '132.025']
        }
    },

    // Departure Operations
    {
        id: 'lineup_wait',
        moduleId: 'departure',
        lessonId: 'lineup',
        type: 'clearance',
        template: '{callsign}, line up and wait runway {runway}',
        variables: {
            callsign: ['DLH123', 'BAW456', 'AFR789'],
            runway: ['25R', '25L', '07R', '07L', '18', '36']
        }
    },
    {
        id: 'takeoff_clearance',
        moduleId: 'departure',
        lessonId: 'lineup',
        type: 'clearance',
        template: '{callsign}, runway {runway}, cleared for takeoff',
        variables: {
            callsign: ['DLH123', 'BAW456', 'AFR789'],
            runway: ['25R', '25L', '07R', '07L']
        }
    },
    {
        id: 'departure_instructions',
        moduleId: 'departure',
        lessonId: 'lineup',
        type: 'instruction',
        template: '{callsign}, after takeoff turn {direction} heading {heading}, contact Departure on {frequency}',
        variables: {
            callsign: ['DLH123', 'BAW456', 'AFR789'],
            direction: ['left', 'right'],
            heading: ['090', '180', '270', '360', '045', '135', '225', '315'],
            frequency: ['121.200', '125.750', '127.275', '135.725']
        }
    },

    // Arrival Operations
    {
        id: 'landing_clearance',
        moduleId: 'arrival',
        lessonId: 'vacate',
        type: 'clearance',
        template: '{callsign}, runway {runway}, cleared to land',
        variables: {
            callsign: ['DLH123', 'BAW456', 'AFR789'],
            runway: ['25R', '25L', '07R', '07L']
        }
    },
    {
        id: 'vacate_instruction',
        moduleId: 'arrival',
        lessonId: 'vacate',
        type: 'instruction',
        template: '{callsign}, vacate runway {runway} via {taxiway}, contact Ground on {frequency}',
        variables: {
            callsign: ['DLH123', 'BAW456', 'AFR789'],
            runway: ['25R', '25L', '07R', '07L'],
            taxiway: ['A6', 'A7', 'B3', 'C4', 'N2'],
            frequency: ['121.800', '121.900', '129.725']
        }
    },

    // VATSIM Operations
    {
        id: 'ifr_clearance',
        moduleId: 'vatsim',
        lessonId: 'checkin',
        type: 'clearance',
        template: '{callsign}, cleared to {destination} via {sid}, initial climb {altitude}, squawk {squawk}',
        variables: {
            callsign: ['DLH359', 'BAW12A', 'AFR567'],
            destination: ['EHAM', 'EGLL', 'LFPG', 'LEMD', 'LIRF'],
            sid: ['MARUN7F', 'BIBTI7F', 'CHA7F', 'SOBRA7F'],
            altitude: ['5000 feet', '6000 feet', 'FL070', 'FL080'],
            squawk: ['4723', '1234', '5647', '7321']
        }
    },
    {
        id: 'startup_clearance',
        moduleId: 'vatsim',
        lessonId: 'checkin',
        type: 'clearance',
        template: '{callsign}, startup approved, {atis_info} current, expect runway {runway}',
        variables: {
            callsign: ['DLH359', 'BAW12A', 'AFR567'],
            atis_info: ['information Alpha', 'information Bravo', 'information Charlie'],
            runway: ['25R', '25L', '07R', '07L']
        }
    },

    // Emergency/Special Situations
    {
        id: 'traffic_info',
        moduleId: 'ground',
        lessonId: 'taxi1',
        type: 'information',
        template: '{callsign}, traffic {direction}, {aircraft_type} {distance}',
        variables: {
            callsign: ['DLH123', 'BAW456', 'AFR789'],
            direction: ['ahead', 'behind', 'left', 'right', 'crossing'],
            aircraft_type: ['A320', 'B737', 'A380', 'B777'],
            distance: ['100 meters', '200 meters', '500 meters']
        }
    },
    {
        id: 'hold_position',
        moduleId: 'ground',
        lessonId: 'taxi1',
        type: 'instruction',
        template: '{callsign}, hold position, traffic crossing',
        variables: {
            callsign: ['DLH123', 'BAW456', 'AFR789']
        }
    }
];

// Hilfsfunktionen für Template-Verarbeitung
export function generateATCPhrase(phraseId: string, customVariables?: Record<string, string>): string {
    const phrase = ATC_PHRASES.find(p => p.id === phraseId);
    if (!phrase) {
        throw new Error(`ATC phrase with id "${phraseId}" not found`);
    }

    let result = phrase.template;
    const variables = phrase.variables || {};

    // Ersetze Variablen im Template
    for (const [key, values] of Object.entries(variables)) {
        const placeholder = `{${key}}`;
        if (result.includes(placeholder)) {
            // Verwende custom value oder wähle zufällig
            const value = customVariables?.[key] || values[Math.floor(Math.random() * values.length)];
            result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        }
    }

    return result;
}

export function getPhrasesForLesson(moduleId: string, lessonId: string): ATCPhrase[] {
    return ATC_PHRASES.filter(p => p.moduleId === moduleId && p.lessonId === lessonId);
}

export function getRandomPhraseForLesson(moduleId: string, lessonId: string): string {
    const phrases = getPhrasesForLesson(moduleId, lessonId);
    if (phrases.length === 0) {
        throw new Error(`No phrases found for module "${moduleId}", lesson "${lessonId}"`);
    }

    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    return generateATCPhrase(randomPhrase.id);
}
