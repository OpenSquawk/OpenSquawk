// A320 SOP Timeline – Cold & Dark bis Handoff nach Takeoff
// Quellen: Airbus A320 FCOM/FCTM Standard Procedures + VATSIM/IRL ATC Phraseology
// Hinweis: Vereinfacht für Sim-/VATSIM-Nutzung. Immer aktuelle FCOM/Charts checken.

export type Actor = 'pf' | 'pm' | 'atc' | 'pilot' | 'system' | 'cabin'

export interface SopStep {
    id: string
    actor: Actor
    label: string            // kurz – wird im Timeline-Card oben angezeigt
    callout?: string         // wörtlicher Funkspruch / Callout
    detail?: string          // Erläuterung / wo hinschauen
    look?: string            // Wo der Blick hingeht (für Eyeflow-Hinweis)
    inputKeys?: string[]     // Felder im Scratchpad, die hier relevant sind
    /** Variant-Branches (horizontale Slides), z. B. "External Power" vs "APU"  */
    variants?: { id: string; title: string; steps: SopStep[] }[]
}

export interface SopPhase {
    id: string
    title: string
    subtitle?: string
    color: string            // Tailwind-Farbtoken
    steps: SopStep[]
}

export interface SopAircraftProfile {
    id: string
    name: string
    phases: SopPhase[]
}

const a320Phases: SopPhase[] = [
    {
        id: 'cockpit-prep',
        title: 'Cockpit Preparation',
        subtitle: 'Cold & Dark → Pre-Flight ready',
        color: 'cyan',
        steps: [
            {
                id: 'safety-exterior',
                actor: 'pf',
                label: 'Safety Exterior / Receive Aircraft',
                detail: 'Gear pins, chocks in place, GPU/APU plan klären.',
                look: 'Außenbereich · Fahrwerk · GPU-Status',
            },
            {
                id: 'batteries',
                actor: 'pf',
                label: 'Batteries → ON',
                detail: 'BAT 1 + BAT 2 ON. Voltage check >25.5V.',
                look: 'Overhead · ELEC Panel',
                variants: [
                    {
                        id: 'gpu',
                        title: 'External Power verfügbar',
                        steps: [
                            {id: 'ext-pwr', actor: 'pf', label: 'EXT PWR → ON', detail: 'AVAIL Light grün, dann ON drücken.'},
                        ],
                    },
                    {
                        id: 'apu-only',
                        title: 'Nur APU',
                        steps: [
                            {id: 'apu-master', actor: 'pf', label: 'APU MASTER → ON, dann START', detail: 'AVAIL nach ~50 s. APU GEN auto.'},
                        ],
                    },
                ],
            },
            {
                id: 'ext-lts',
                actor: 'pf',
                label: 'NAV & LOGO Lights → ON',
                detail: 'Signal nach außen: cockpit besetzt.',
                look: 'Overhead · EXT LT',
            },
            {
                id: 'cockpit-prep-flow',
                actor: 'pf',
                label: 'Cockpit Preparation Flow',
                detail: 'Overhead von links oben nach rechts unten: ADIRS NAV (3x), Fuel Pumps ON, Anti-ICE OFF, Probes auto, Cabin Press auto, Air Cond auto.',
                look: 'Overhead Panel · Flow',
            },
            {
                id: 'fmgs-init',
                actor: 'pf',
                label: 'FMGS · INIT A',
                detail: 'CO RTE laden ODER FROM/TO + ALTN, FLT NBR, COST INDEX, CRZ FL setzen.',
                look: 'MCDU · INIT A',
                inputKeys: ['departure', 'destination', 'altn', 'flightNumber', 'costIndex', 'crzFL'],
            },
            {
                id: 'fmgs-fpln',
                actor: 'pf',
                label: 'FMGS · F-PLN',
                detail: 'SID, Enroute, STAR/Approach. Discontinuities clearen.',
                look: 'MCDU · F-PLN',
                inputKeys: ['sid', 'route'],
            },
            {
                id: 'fmgs-init-b',
                actor: 'pf',
                label: 'FMGS · INIT B (Fuel Pred)',
                detail: 'ZFW/ZFWCG aus Loadsheet, BLOCK fuel.',
                look: 'MCDU · INIT B',
                inputKeys: ['zfw', 'zfwcg', 'blockFuel'],
            },
            {
                id: 'fmgs-perf',
                actor: 'pf',
                label: 'FMGS · PERF TAKEOFF',
                detail: 'V1 / VR / V2, FLEX TEMP, THR RED / ACC ALT, TRANS ALT.',
                look: 'MCDU · PERF · TAKEOFF',
                inputKeys: ['v1', 'vr', 'v2', 'flexTemp', 'thrRed', 'accAlt'],
            },
            {
                id: 'atis',
                actor: 'pilot',
                label: 'ATIS holen (D-ATIS / Voice)',
                detail: 'Letter, Wind, Vis, RWY, QNH, Trans Level notieren.',
                inputKeys: ['atisLetter', 'wind', 'qnh', 'rwy', 'transLevel'],
            },
        ],
    },
    {
        id: 'clearance',
        title: 'Clearance Delivery',
        subtitle: 'IFR-Freigabe einholen',
        color: 'sky',
        steps: [
            {
                id: 'init-call',
                actor: 'pilot',
                label: 'Initial Call',
                callout: '«[Station] Delivery, [Callsign], stand [XX], request IFR clearance to [DEST], information [ATIS], ready to copy.»',
                inputKeys: ['callsign', 'stand', 'destination', 'atisLetter'],
            },
            {
                id: 'clearance-rx',
                actor: 'atc',
                label: 'Clearance erhalten',
                callout: '«[Callsign], cleared to [DEST] via [SID], runway [RWY], climb initially [ALT], squawk [SQK].»',
                detail: 'CRAFT-Schema mitschreiben.',
                inputKeys: ['sid', 'initialClimb', 'squawk'],
            },
            {
                id: 'readback',
                actor: 'pilot',
                label: 'Readback',
                callout: '«Cleared to [DEST] via [SID], runway [RWY], climb [ALT], squawk [SQK], [Callsign].»',
            },
            {
                id: 'xpdr-set',
                actor: 'pf',
                label: 'XPDR Code setzen, FCU ALT prüfen',
                look: 'Pedestal · ATC · FCU',
            },
        ],
    },
    {
        id: 'pushback-start',
        title: 'Pushback & Engine Start',
        color: 'indigo',
        steps: [
            {
                id: 'before-start-flow',
                actor: 'pf',
                label: 'Before Start Flow',
                detail: 'Windows/Doors closed, Beacon ON, Park Brake set, Thrust Levers IDLE, ENG MODE selector NORM.',
            },
            {
                id: 'request-start',
                actor: 'pilot',
                label: 'Pushback & Startup anfordern',
                callout: '«[Station] Ground, [Callsign], stand [XX], request pushback and startup.»',
                inputKeys: ['callsign', 'stand'],
            },
            {
                id: 'pushback-clr',
                actor: 'atc',
                label: 'Push & Start approved',
                callout: '«[Callsign], pushback and startup approved, face [direction].»',
            },
            {
                id: 'cabin-secure',
                actor: 'cabin',
                label: 'Cabin secure / Doors closed',
                detail: 'PA: «Cabin crew, doors on automatic, cross-check.»',
            },
            {
                id: 'beacon-on',
                actor: 'pf',
                label: 'BEACON → ON',
                look: 'Overhead · EXT LT',
            },
            {
                id: 'eng-start',
                actor: 'pf',
                label: 'Engine Start',
                detail: 'ENG MODE selector → IGN/START. ENG MASTER 2 → ON, abwarten bis stabil, dann ENG MASTER 1 → ON. N1, EGT, N2, FF überwachen.',
                look: 'ECAM ENG · Pedestal',
            },
            {
                id: 'after-start-flow',
                actor: 'pf',
                label: 'After Start Flow',
                detail: 'ENG MODE → NORM, APU BLEED OFF (wenn Pack ON kommt), Anti-ICE wie nötig, Pitch Trim setzen, RUDDER Trim 0, Flaps CONF 1+F oder 2 (perf-abhängig), Spoilers ARM, ECAM Status check.',
                inputKeys: ['flapsConfig', 'pitchTrim'],
            },
            {
                id: 'flight-controls',
                actor: 'pf',
                label: 'Flight Controls Check',
                callout: '«Full left … full right … neutral … full forward … full back … neutral.»',
                detail: 'PM bestätigt jede Bewegung über ECAM F/CTL Page.',
            },
        ],
    },
    {
        id: 'taxi',
        title: 'Taxi',
        color: 'emerald',
        steps: [
            {
                id: 'request-taxi',
                actor: 'pilot',
                label: 'Taxi request',
                callout: '«[Station] Ground, [Callsign], request taxi.»',
            },
            {
                id: 'taxi-clr',
                actor: 'atc',
                label: 'Taxi clearance',
                callout: '«[Callsign], taxi to holding point [RWY] via [TWY A, B, C].»',
                inputKeys: ['taxiRoute', 'holdingPoint'],
            },
            {
                id: 'taxi-readback',
                actor: 'pilot',
                label: 'Readback',
                callout: '«Taxi to holding point [RWY] via [TWY], [Callsign].»',
            },
            {
                id: 'taxi-lights',
                actor: 'pf',
                label: 'NOSE Light → TAXI, Brakes check',
                detail: 'PM: «Brakes checked.» max 30 kts gerade, max 10 kts in Kurven.',
            },
            {
                id: 'before-tko-checklist',
                actor: 'pm',
                label: 'Before Takeoff Checklist (down to the line)',
                detail: 'Flaps · Pitch Trim · Flight Controls · ECAM Memo: T.O. NO BLUE.',
            },
            {
                id: 'takeoff-briefing',
                actor: 'pf',
                label: 'Takeoff Briefing',
                detail: 'Standard: dep RWY [XX], SID [..], engine failure plan, return gates, MSA, weather.',
            },
        ],
    },
    {
        id: 'lineup-tko',
        title: 'Line-Up & Takeoff',
        color: 'amber',
        steps: [
            {
                id: 'handoff-twr',
                actor: 'atc',
                label: 'Handoff Tower',
                callout: '«[Callsign], contact Tower [FREQ].»',
                inputKeys: ['twrFreq'],
            },
            {
                id: 'twr-call',
                actor: 'pilot',
                label: 'Tower Call',
                callout: '«[Station] Tower, [Callsign], holding short [RWY].»',
            },
            {
                id: 'lineup',
                actor: 'atc',
                label: 'Line-up clearance',
                callout: '«[Callsign], line up runway [RWY] and wait.»',
            },
            {
                id: 'before-tko-line',
                actor: 'pf',
                label: 'Below-the-line Items',
                detail: 'Cabin Crew advised, Packs/Anti-Ice per perf, T.O. CONFIG TEST gedrückt, Strobes ON, TCAS TA/RA, Landing Lights ON, NOSE Light → T.O.',
                callout: 'Cabin: «Cabin crew, takeoff.»',
            },
            {
                id: 'cleared-tko',
                actor: 'atc',
                label: 'Cleared for Takeoff',
                callout: '«[Callsign], wind [..], runway [RWY], cleared for takeoff.»',
            },
            {
                id: 'tko-roll',
                actor: 'pf',
                label: 'Takeoff Roll',
                detail: 'Thrust Levers 50 % N1, stabil, dann FLEX/TOGA. PF hand auf Thrust bis V1.',
            },
            {
                id: 'thrust-set',
                actor: 'pm',
                label: 'Callout: «Thrust set»',
                callout: '«Thrust set, FMA: MAN FLEX [TEMP] / SRS / RWY.»',
                look: 'PFD · FMA',
            },
            {
                id: 'kts-100',
                actor: 'pm',
                label: '«100 knots»',
                callout: '«100 knots.»',
                look: 'PFD · Speed Tape',
                detail: 'PF antwortet «checked».',
            },
            {
                id: 'v1',
                actor: 'pm',
                label: '«V1»',
                callout: '«V1.»',
                detail: 'PF nimmt Hand vom Thrust Lever.',
            },
            {
                id: 'rotate',
                actor: 'pm',
                label: '«Rotate»',
                callout: '«Rotate.»',
                detail: 'PF: smooth pitch up zu 12.5° → ca. 15° Initial.',
            },
            {
                id: 'positive-climb',
                actor: 'pm',
                label: '«Positive climb»',
                callout: 'PM: «Positive climb.» — PF: «Gear up.»',
                look: 'PFD · V/S, Altitude',
            },
        ],
    },
    {
        id: 'after-tko',
        title: 'After Takeoff & Handoff',
        color: 'rose',
        steps: [
            {
                id: 'thr-red',
                actor: 'system',
                label: 'THR RED ALT erreicht',
                detail: 'FMA: CLB. Thrust Levers in CL detent.',
                look: 'PFD · FMA',
                inputKeys: ['thrRed'],
            },
            {
                id: 'acc-alt',
                actor: 'system',
                label: 'ACC ALT erreicht',
                detail: 'Auto-Beschleunigung auf Green-Dot. Flap-Retraction-Schedule beginnt.',
                inputKeys: ['accAlt'],
            },
            {
                id: 'flap-1',
                actor: 'pf',
                label: '«Flaps 1» bei F-Speed',
                callout: 'PF: «Flaps 1.» PM: «Speed checked, flaps 1.»',
            },
            {
                id: 'flap-0',
                actor: 'pf',
                label: '«Flaps 0» bei S-Speed',
                callout: 'PF: «Flaps 0.» PM: «Speed checked, flaps 0.»',
            },
            {
                id: 'after-tko-flow',
                actor: 'pf',
                label: 'After Takeoff Flow',
                detail: 'Gear UP & off, Spoilers disarm, Flaps 0, Packs ON falls vorher off, APU MASTER OFF wenn nicht mehr benötigt, Anti-ICE wie nötig, Landing Lts AUTO/OFF (>10.000 ft), NOSE Light OFF, Seatbelts wie nötig.',
            },
            {
                id: 'after-tko-checklist',
                actor: 'pm',
                label: 'After Takeoff / Climb Checklist',
                detail: 'Landing Gear UP · Flaps 0 · Packs ON · Baro: bei TRANS ALT auf STD.',
            },
            {
                id: 'handoff-dep',
                actor: 'atc',
                label: 'Handoff Departure / Center',
                callout: '«[Callsign], contact Departure [FREQ], good day.»',
                inputKeys: ['depFreq'],
            },
            {
                id: 'dep-call',
                actor: 'pilot',
                label: 'Initial Call Departure',
                callout: '«[Station] Departure, [Callsign], passing [ALT] for [CLEARED ALT], [SID].»',
            },
        ],
    },
]

export const a320Profile: SopAircraftProfile = {
    id: 'a320',
    name: 'Airbus A320 (CEO/NEO)',
    phases: a320Phases,
}

export const sopProfiles: SopAircraftProfile[] = [a320Profile]

/** Felder für den Scratchpad – gruppiert. */
export interface ScratchField {
    key: string
    label: string
    placeholder?: string
    group: 'flight' | 'perf' | 'atc' | 'fuel' | 'env'
}

export const scratchFields: ScratchField[] = [
    {key: 'callsign', label: 'Callsign', placeholder: 'DLH4AB', group: 'flight'},
    {key: 'flightNumber', label: 'Flight Nbr', placeholder: 'DLH441', group: 'flight'},
    {key: 'aircraftReg', label: 'Aircraft Reg', placeholder: 'D-AIZA', group: 'flight'},
    {key: 'departure', label: 'Departure', placeholder: 'EDDF', group: 'flight'},
    {key: 'destination', label: 'Destination', placeholder: 'LEMD', group: 'flight'},
    {key: 'altn', label: 'Alternate', placeholder: 'LEBL', group: 'flight'},
    {key: 'route', label: 'Route', placeholder: 'TOBAK Y163 ...', group: 'flight'},
    {key: 'crzFL', label: 'CRZ FL', placeholder: 'FL360', group: 'flight'},
    {key: 'costIndex', label: 'Cost Index', placeholder: '30', group: 'flight'},
    {key: 'stand', label: 'Stand / Gate', placeholder: 'V152', group: 'flight'},

    {key: 'atisLetter', label: 'ATIS', placeholder: 'D', group: 'env'},
    {key: 'wind', label: 'Wind', placeholder: '250/08', group: 'env'},
    {key: 'qnh', label: 'QNH', placeholder: '1013', group: 'env'},
    {key: 'rwy', label: 'RWY', placeholder: '25C', group: 'env'},
    {key: 'transLevel', label: 'Trans Level', placeholder: 'FL70', group: 'env'},
    {key: 'transAlt', label: 'Trans Alt', placeholder: '5000', group: 'env'},

    {key: 'sid', label: 'SID', placeholder: 'OBOKA1L', group: 'atc'},
    {key: 'initialClimb', label: 'Initial Climb', placeholder: '5000 ft', group: 'atc'},
    {key: 'squawk', label: 'Squawk', placeholder: '1000', group: 'atc'},
    {key: 'taxiRoute', label: 'Taxi Route', placeholder: 'N, L, M', group: 'atc'},
    {key: 'holdingPoint', label: 'Holding Point', placeholder: 'S4', group: 'atc'},
    {key: 'twrFreq', label: 'Tower', placeholder: '119.905', group: 'atc'},
    {key: 'depFreq', label: 'Departure', placeholder: '120.150', group: 'atc'},

    {key: 'zfw', label: 'ZFW (t)', placeholder: '60.5', group: 'fuel'},
    {key: 'zfwcg', label: 'ZFWCG (%)', placeholder: '27.5', group: 'fuel'},
    {key: 'blockFuel', label: 'Block Fuel (t)', placeholder: '12.4', group: 'fuel'},
    {key: 'tripFuel', label: 'Trip Fuel (t)', placeholder: '8.7', group: 'fuel'},

    {key: 'flapsConfig', label: 'Flaps T/O', placeholder: '1+F', group: 'perf'},
    {key: 'flexTemp', label: 'FLEX TEMP', placeholder: '52', group: 'perf'},
    {key: 'v1', label: 'V1', placeholder: '142', group: 'perf'},
    {key: 'vr', label: 'VR', placeholder: '146', group: 'perf'},
    {key: 'v2', label: 'V2', placeholder: '150', group: 'perf'},
    {key: 'thrRed', label: 'THR RED', placeholder: '1500', group: 'perf'},
    {key: 'accAlt', label: 'ACC ALT', placeholder: '1500', group: 'perf'},
    {key: 'pitchTrim', label: 'Pitch Trim', placeholder: 'DN 1.2', group: 'perf'},
]
