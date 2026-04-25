// A320 SOP Timeline – Cold & Dark bis Handoff nach Takeoff
// Quellen: Airbus A320 FCOM/FCTM Standard Procedures + VATSIM/IRL ATC Phraseology
// Fokus: Flugsimulator-Nutzung (VATSIM, MSFS / X-Plane / Fenix / FlyByWire / ToLiss).

export type Actor = 'pf' | 'pm' | 'atc' | 'pilot' | 'system' | 'cabin'

export interface SopStep {
    id: string
    actor: Actor
    label: string            // Kurztitel
    callout?: string         // Wörtlicher Funkspruch / Callout (mit [PLACEHOLDER])
    detail?: string          // Erklärung was zu tun ist
    why?: string             // Warum macht man das (Hintergrund / Lerneffekt)
    look?: string            // Wo schauen / welches Panel
    inputKeys?: string[]     // Felder im Scratchpad, die hier relevant sind
    simNote?: string         // Sim-spezifischer Hinweis (z. B. Tastatur-Shortcut, Add-on)
    /** Variant-Branches (horizontale Slides), z. B. "External Power" vs "APU"  */
    variants?: { id: string; title: string; steps: SopStep[] }[]
}

export interface SopPhase {
    id: string
    title: string
    subtitle?: string
    accent: 'cyan' | 'sky' | 'indigo' | 'emerald' | 'amber' | 'rose'
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
        subtitle: 'Cold & Dark → flugbereit',
        accent: 'cyan',
        steps: [
            {
                id: 'safety-exterior',
                actor: 'pf',
                label: 'Safety Exterior · Gear Pins / Chocks',
                detail: 'Sicherstellen, dass Gear Pins gezogen, Chocks und GPU-Status klar sind.',
                why: 'Im Sim oft per Ground-Service-Menü (EFB / FlyByWire Ground Services). Gear Pins müssen vor Pushback raus, sonst Warnungen beim Gear-Up.',
                look: 'EFB · Ground Services',
                simNote: 'FlyByWire/Fenix EFB → Ground Services → Gear Pins · Wheel Chocks',
            },
            {
                id: 'batteries',
                actor: 'pf',
                label: 'Batteries → ON',
                detail: 'BAT 1 + BAT 2 ON. Voltage check ≥ 25.5 V.',
                why: 'Erste Stromversorgung der Bus-Bars. Unter 25.5 V deutet das auf eine schwache Batterie – im Sim selten kritisch, IRL Bodencheck nötig.',
                look: 'Overhead · ELEC Panel',
            },
            {
                id: 'power-source',
                actor: 'pf',
                label: 'Strom-Quelle wählen',
                detail: 'Entweder External Power (GPU) oder APU.',
                why: 'GPU spart APU-Kraftstoff und schont das Triebwerk. Auf Gates mit verfügbarer GPU bevorzugt.',
                variants: [
                    {
                        id: 'gpu',
                        title: 'External Power (GPU)',
                        steps: [
                            {
                                id: 'ext-pwr',
                                actor: 'pf',
                                label: 'EXT PWR → ON',
                                detail: 'Wenn AVAIL leuchtet (grün), Knopf drücken bis ON.',
                                why: 'Versorgt alle AC-Busse vom Boden. APU bleibt aus → leiser, sparsamer.',
                                simNote: 'Im EFB/Ground Services GPU connecten, dann im Cockpit ON.',
                            },
                        ],
                    },
                    {
                        id: 'apu-only',
                        title: 'APU Start',
                        steps: [
                            {
                                id: 'apu-master',
                                actor: 'pf',
                                label: 'APU MASTER SW → ON',
                                detail: 'Anschließend APU START drücken. AVAIL nach ~50 s.',
                                why: 'APU liefert elektrischen Strom und Bleed Air zum Klimatisieren und für den Engine Start (Crossbleed-Start).',
                                look: 'Overhead · APU Panel',
                            },
                            {
                                id: 'apu-bleed',
                                actor: 'pf',
                                label: 'APU BLEED → ON (sobald AVAIL)',
                                detail: 'Erlaubt Klimatisierung der Kabine und späteren Engine Start.',
                            },
                        ],
                    },
                ],
            },
            {
                id: 'ext-lts',
                actor: 'pf',
                label: 'NAV & LOGO Lights → ON',
                detail: 'Tagsüber NAV ON, nachts zusätzlich LOGO ON.',
                why: 'Signal nach außen: Cockpit ist besetzt, Flugzeug "im Dienst". Hilft Bodenpersonal & VATSIM-Controllern beim Visuell-Identifizieren.',
                look: 'Overhead · EXT LT',
            },
            {
                id: 'cockpit-prep-flow',
                actor: 'pf',
                label: 'Overhead Flow (oben links → unten rechts)',
                detail: 'ADIRS 1/2/3 → NAV · Fuel Pumps → ON · Anti-Ice → OFF · Probes → AUTO · Cabin Press → AUTO · Air Cond → AUTO.',
                why: 'Standardisierter Eyeflow verhindert vergessene Schalter. ADIRS brauchen ~10 min für volle Alignment, deshalb sehr früh starten.',
                look: 'Overhead Panel · von links oben nach rechts unten',
            },
            {
                id: 'fmgs-init-a',
                actor: 'pf',
                label: 'MCDU · INIT A',
                detail: 'CO RTE laden ODER FROM/TO setzen, ALTN, FLT NBR, COST INDEX, CRZ FL, TROPO eintragen.',
                why: 'INIT A definiert den Flug für das FMGS – ohne diese Daten keine Performance- und Treibstoffberechnung.',
                look: 'MCDU · INIT-Page',
                inputKeys: ['departure', 'destination', 'altn', 'flightNumber', 'costIndex', 'crzFL'],
                simNote: 'Bei SimBrief: oben links "INIT REQUEST*" drücken um Wind/Zeiten automatisch zu laden.',
            },
            {
                id: 'fmgs-fpln',
                actor: 'pf',
                label: 'MCDU · F-PLN',
                detail: 'SID auswählen, Enroute prüfen, STAR/Approach setzen. Discontinuities clearen.',
                why: 'Discontinuities = Lücken in der Lateral Navigation. NAV Mode würde dort aussteigen.',
                look: 'MCDU · F-PLN',
                inputKeys: ['sid', 'route'],
            },
            {
                id: 'fmgs-init-b',
                actor: 'pf',
                label: 'MCDU · INIT B (Fuel Prediction)',
                detail: 'ZFW/ZFWCG aus Loadsheet eintragen, dann BLOCK Fuel.',
                why: 'Die FMGS braucht Gewicht & Schwerpunkt für korrekte V-Speeds und Reichweiten-Prognose. INIT B ist nur vor Engine Start zugänglich.',
                look: 'MCDU · INIT B (vor Engine Start)',
                inputKeys: ['zfw', 'zfwcg', 'blockFuel'],
            },
            {
                id: 'fmgs-perf',
                actor: 'pf',
                label: 'MCDU · PERF TAKEOFF',
                detail: 'V1 / VR / V2, FLEX TEMP, THR RED / ACC ALT, TRANS ALT setzen.',
                why: 'V-Speeds werden vom FMGS aus Gewicht/Config nicht automatisch errechnet – kommen aus FlySmart/Loadsheet/SimBrief. THR RED ist die Höhe, an der der Schub von TOGA/FLEX auf CLB zurückgenommen wird.',
                look: 'MCDU · PERF · TAKEOFF',
                inputKeys: ['v1', 'vr', 'v2', 'flexTemp', 'thrRed', 'accAlt'],
            },
            {
                id: 'atis',
                actor: 'pilot',
                label: 'ATIS abrufen',
                detail: 'Letter, Wind, Vis, RWY, QNH, TRANS LEVEL, Bemerkungen mitschreiben.',
                why: 'ATIS-Letter musst du der Clearance-Stelle mitteilen, damit der Controller weiß, dass du die aktuelle Info hast.',
                inputKeys: ['atisLetter', 'wind', 'qnh', 'rwy', 'transLevel'],
                simNote: 'VATSIM: D-ATIS in vPilot/SwiftLive Tab oder über AFV-Frequenz.',
            },
        ],
    },
    {
        id: 'clearance',
        title: 'Clearance Delivery',
        subtitle: 'IFR-Freigabe einholen',
        accent: 'sky',
        steps: [
            {
                id: 'init-call',
                actor: 'pilot',
                label: 'Initial Call Delivery',
                callout: '[Station] Delivery, [Callsign], stand [STAND], request IFR clearance to [DEST], information [ATIS].',
                why: 'Sender-Empfänger-Reihenfolge: Wer wird gerufen → Wer ruft → Position → Anliegen. Standardisiertes ICAO-Format.',
                inputKeys: ['callsign', 'stand', 'destination', 'atisLetter'],
            },
            {
                id: 'clearance-rx',
                actor: 'atc',
                label: 'Clearance entgegennehmen (CRAFT)',
                callout: '[Callsign], cleared to [DEST] via [SID], runway [RWY], climb initially [INIT_ALT], squawk [SQK].',
                detail: 'CRAFT-Schema mitschreiben: Clearance limit · Route · Altitude · Frequency · Transponder.',
                why: 'CRAFT ist eine Eselsbrücke: alle 5 Pflicht-Bestandteile einer IFR-Clearance. Wenn etwas fehlt → nachfragen.',
                inputKeys: ['sid', 'initialClimb', 'squawk'],
            },
            {
                id: 'readback',
                actor: 'pilot',
                label: 'Readback',
                callout: 'Cleared to [DEST] via [SID], runway [RWY], climb [INIT_ALT], squawk [SQK], [Callsign].',
                why: 'Vollständiger Readback ist Pflicht für Clearance-, Runway- und Höhenitems. Fehler hier = häufige Quelle für Loss-of-Separation.',
            },
            {
                id: 'xpdr-set',
                actor: 'pf',
                label: 'XPDR Code & FCU ALT setzen',
                detail: 'Squawk in ATC-Panel eintragen, Initial Climb in FCU ALT.',
                why: 'Falsche FCU-ALT = Bust nach Takeoff (Zahlen-Dreher!). Doppelt prüfen lassen vom anderen Piloten / Cross-Check.',
                look: 'Pedestal · ATC · FCU',
                inputKeys: ['squawk', 'initialClimb'],
            },
        ],
    },
    {
        id: 'pushback-start',
        title: 'Pushback & Engine Start',
        subtitle: 'Triebwerke anlassen, Cabin secure',
        accent: 'indigo',
        steps: [
            {
                id: 'before-start-flow',
                actor: 'pf',
                label: 'Before Start Flow',
                detail: 'Windows/Doors closed · Beacon ON · Park Brake SET · Thrust Levers IDLE · ENG MODE selector NORM.',
                why: 'Beacon ON ist das Signal für Bodenpersonal "Triebwerke gleich an" – jet blast Gefahr.',
            },
            {
                id: 'request-start',
                actor: 'pilot',
                label: 'Pushback & Startup anfordern',
                callout: '[Station] Ground, [Callsign], stand [STAND], request pushback and startup.',
                inputKeys: ['callsign', 'stand'],
                simNote: 'Auf VATSIM oft auch nur "Push and Start" – manche Controller verlangen vorher Startup, dann Pushback separat.',
            },
            {
                id: 'pushback-clr',
                actor: 'atc',
                label: 'Push & Start approved',
                callout: '[Callsign], pushback and startup approved, face [DIRECTION].',
                why: '"Face" gibt die Endausrichtung des Flugzeugs nach dem Push an (z. B. "facing south") – wichtig fürs Bodenpersonal/Tug.',
            },
            {
                id: 'cabin-secure',
                actor: 'cabin',
                label: 'Cabin secure / Doors automatic',
                detail: 'PA/Callout: «Cabin crew, doors on automatic, cross-check.»',
                why: 'Bei "automatic" wird der Notrutsch-Mechanismus aktiviert, damit beim Öffnen im Notfall die Slide ausfährt.',
                simNote: 'Im Sim ohne FA optional – aber für Realismus (PMDG/Fenix haben FA-Soundsets) sinnvoll.',
            },
            {
                id: 'beacon-on',
                actor: 'pf',
                label: 'BEACON → ON',
                look: 'Overhead · EXT LT',
                why: 'Letzte Warnung an Ground: gleich startet ein Triebwerk.',
            },
            {
                id: 'eng-start',
                actor: 'pf',
                label: 'Engine Start (2 → 1)',
                detail: 'ENG MODE → IGN/START · ENG MASTER 2 → ON · abwarten bis stabil · ENG MASTER 1 → ON.',
                why: 'ENG 2 zuerst, weil diese hydraulisch das gelbe System & Park Brake versorgt – und beim Crossbleed Start aus APU näher dran ist.',
                look: 'ECAM ENG · Pedestal',
            },
            {
                id: 'after-start-flow',
                actor: 'pf',
                label: 'After Start Flow',
                detail: 'ENG MODE → NORM · APU BLEED → OFF · Anti-ICE wie nötig · Pitch Trim setzen · Rudder Trim 0 · Flaps CONF 1+F oder 2 · Spoilers ARM · ECAM Status.',
                why: 'APU Bleed off, sobald Pack-Versorgung über Engines möglich – verlängert APU-Lebensdauer und reduziert Lärm.',
                inputKeys: ['flapsConfig', 'pitchTrim'],
            },
            {
                id: 'flight-controls',
                actor: 'pf',
                label: 'Flight Controls Check',
                callout: 'Full left … full right … neutral … full forward … full back … neutral.',
                detail: 'PM bestätigt jede Bewegung über ECAM F/CTL-Page.',
                why: 'Stellt sicher, dass alle drei Hydrauliksysteme arbeiten und keine FCU/PRIM/SEC-Computer ausgefallen sind.',
                look: 'ECAM · F/CTL Page',
            },
        ],
    },
    {
        id: 'taxi',
        title: 'Taxi',
        subtitle: 'Rollen zur Runway',
        accent: 'emerald',
        steps: [
            {
                id: 'request-taxi',
                actor: 'pilot',
                label: 'Taxi request',
                callout: '[Station] Ground, [Callsign], request taxi.',
            },
            {
                id: 'taxi-clr',
                actor: 'atc',
                label: 'Taxi clearance',
                callout: '[Callsign], taxi to holding point [HOLDING], runway [RWY], via [TAXI_ROUTE].',
                detail: 'Taxi-Route auf Chart mitstreichen.',
                why: 'Holding Point ist die Position kurz vor der Runway. "Hold short" = nicht überfahren ohne Freigabe.',
                inputKeys: ['taxiRoute', 'holdingPoint'],
            },
            {
                id: 'taxi-readback',
                actor: 'pilot',
                label: 'Readback',
                callout: 'Taxi to holding point [HOLDING] runway [RWY] via [TAXI_ROUTE], [Callsign].',
            },
            {
                id: 'taxi-lights',
                actor: 'pf',
                label: 'NOSE Light → TAXI · Brakes Check',
                detail: 'Beim ersten Anrollen: kurz Bremse antippen. PM: «Brakes checked.»',
                why: 'Brake Check früh erkennt verstopfte Bremsleitungen oder fehlerhafte Antiskid – besser jetzt als bei 140 kts auf der Bahn.',
                look: 'BRK PRESS Indicator',
            },
            {
                id: 'taxi-speed',
                actor: 'pf',
                label: 'Taxi Speed Management',
                detail: 'Geradeaus max ~30 kts, in Kurven max ~10 kts.',
                why: 'Höhere Kurvengeschwindigkeit überlastet die Bug-Fahrwerks-Strebe und ist unangenehm für die Kabine.',
            },
            {
                id: 'before-tko-checklist',
                actor: 'pm',
                label: 'Before Takeoff Checklist (above the line)',
                detail: 'Flaps · Pitch Trim · Flight Controls · Briefing · ECAM Memo (T.O. NO BLUE).',
                why: '"Above the line" = alles was vor Line-up erledigt sein muss. "Below the line" sind nur Strobes/Cabin Crew kurz vor Takeoff.',
            },
            {
                id: 'takeoff-briefing',
                actor: 'pf',
                label: 'Takeoff Briefing',
                detail: 'Departure RWY · SID · Engine-Failure-Plan · Return Gates · MSA · Wetter / NOTAMs.',
                why: 'Mentale Vorbereitung auf Engine-Failure ist der wichtigste Teil. Bei single-pilot Sim-Flügen sich selbst kurz "vorlesen".',
            },
        ],
    },
    {
        id: 'lineup-tko',
        title: 'Line-Up & Takeoff',
        subtitle: 'Auf die Bahn, Power set',
        accent: 'amber',
        steps: [
            {
                id: 'handoff-twr',
                actor: 'atc',
                label: 'Handoff Tower',
                callout: '[Callsign], contact Tower [TWR_FREQ].',
                inputKeys: ['twrFreq'],
            },
            {
                id: 'twr-call',
                actor: 'pilot',
                label: 'Tower Call',
                callout: '[Station] Tower, [Callsign], holding short [RWY].',
                why: 'Position-Report beim ersten Call, damit der Controller dich auf seinem Strip / EuroScope wiederfindet.',
            },
            {
                id: 'lineup',
                actor: 'atc',
                label: 'Line-up clearance',
                callout: '[Callsign], line up runway [RWY] and wait.',
                why: '"Line up and wait" ist nicht "Cleared for takeoff". Kein Schub setzen!',
            },
            {
                id: 'before-tko-line',
                actor: 'pf',
                label: 'Below-the-line Items (Line-up Flow)',
                detail: 'PACKs (perf-abhängig) · T.O. CONFIG TEST · Strobes ON · TCAS TA/RA · Landing Lights ON · NOSE Light → T.O. · Cabin notify.',
                callout: 'Cabin: «Cabin crew, takeoff.»',
                why: 'T.O. CONFIG TEST simuliert TOGA-Schub und prüft, ob alle Konfigurations-Warnungen ausbleiben würden – sicherer als später ein Config Warning beim Roll.',
            },
            {
                id: 'cleared-tko',
                actor: 'atc',
                label: 'Cleared for Takeoff',
                callout: '[Callsign], wind [WIND], runway [RWY], cleared for takeoff.',
            },
            {
                id: 'tko-roll',
                actor: 'pf',
                label: 'Takeoff Roll · Thrust Set',
                detail: 'Thrust Levers auf 50 % N1 stabil, dann FLEX/TOGA. Hand auf Thrust bis V1.',
                why: 'Stabilisierung bei 50 % stellt sicher, dass beide Triebwerke gleich hochlaufen. Asymmetrie früh erkennen!',
            },
            {
                id: 'thrust-set',
                actor: 'pm',
                label: '«Thrust set, FMA checked»',
                callout: 'Thrust set, FMA: MAN FLEX [FLEX_TEMP] / SRS / RWY.',
                detail: 'FMA-Modes ablesen und ansagen.',
                why: 'FMA-Verifikation = "weiß das Flugzeug, was es tun soll?" – Modefehler hier ist die häufigste Ursache für Takeoff-Anomalien.',
                look: 'PFD · FMA Top-Line',
            },
            {
                id: 'kts-100',
                actor: 'pm',
                label: '«100 knots»',
                callout: 'PM: 100 knots. — PF: checked.',
                detail: 'Speedtape kreuzt 100 kt.',
                why: 'Cross-Check der Speed-Anzeige zwischen beiden Seiten. Bei Diskrepanz → Reject Takeoff.',
                look: 'PFD · Speed Tape',
            },
            {
                id: 'v1',
                actor: 'pm',
                label: '«V1»',
                callout: 'V1.',
                detail: 'PF nimmt die Hand vom Thrust Lever.',
                why: 'Ab V1 wird der Takeoff fortgesetzt – nicht mehr abbrechen. Hand weg = mentale & physische Bestätigung.',
            },
            {
                id: 'rotate',
                actor: 'pm',
                label: '«Rotate»',
                callout: 'Rotate.',
                detail: 'PF: smooth pitch up zu ~12.5°, danach ~15° initial.',
                why: 'Zu schnelles Rotieren → Tail Strike. Zu langsam → längerer Rollweg, evtl. Hindernis.',
                look: 'PFD · Pitch / Bird',
            },
            {
                id: 'positive-climb',
                actor: 'pm',
                label: '«Positive climb» → «Gear up»',
                callout: 'PM: Positive climb. — PF: Gear up.',
                why: 'Erst wenn V/S positiv UND Höhenmesser steigt, das Fahrwerk einfahren – um bei sofortigem Sink (Windshear) noch Boden-Kontakt zu haben.',
                look: 'PFD · V/S, Altitude',
            },
        ],
    },
    {
        id: 'after-tko',
        title: 'After Takeoff & Handoff',
        subtitle: 'Clean-up, Frequenzwechsel',
        accent: 'rose',
        steps: [
            {
                id: 'thr-red',
                actor: 'system',
                label: 'THR RED ALT erreicht',
                detail: 'FMA wechselt von SRS zu CLB. Thrust Levers in CL Detent setzen.',
                why: 'CL Detent = Auto-Thrust übernimmt. Wenn man FLEX/TOGA stehen lässt, übernimmt A/THR nicht und Triebwerke bleiben am Limit.',
                look: 'PFD · FMA / Thrust Levers',
                inputKeys: ['thrRed'],
            },
            {
                id: 'acc-alt',
                actor: 'system',
                label: 'ACC ALT erreicht',
                detail: 'Auto-Beschleunigung Richtung Green-Dot. Flap-Retraction-Schedule beginnt.',
                why: 'Bis ACC ALT wird mit V2+10 geklettert (Steep Climb für Hindernisse). Danach beschleunigen, weil Flaps belastet sind.',
                inputKeys: ['accAlt'],
            },
            {
                id: 'flap-1',
                actor: 'pf',
                label: '«Flaps 1» bei F-Speed',
                callout: 'PF: Flaps 1. — PM: Speed checked, flaps 1.',
                why: 'F-Speed = Mindestgeschwindigkeit für nächste Stufe. PM verifiziert, dass die Speed wirklich passt – Schutz vor Stall.',
            },
            {
                id: 'flap-0',
                actor: 'pf',
                label: '«Flaps 0» bei S-Speed',
                callout: 'PF: Flaps 0. — PM: Speed checked, flaps 0.',
            },
            {
                id: 'after-tko-flow',
                actor: 'pf',
                label: 'After Takeoff Flow',
                detail: 'Gear UP & off · Spoilers disarm · Flaps 0 · Packs ON falls vorher off · APU MASTER OFF · Anti-ICE wie nötig · Landing Lts > FL100 OFF · NOSE Light OFF · Seatbelts wie nötig.',
                why: 'Konfiguration zurück auf Reise-Setup. APU aus spart Treibstoff. Landing Lights ab 10.000 ft aus = ICAO-Empfehlung.',
            },
            {
                id: 'after-tko-checklist',
                actor: 'pm',
                label: 'After Takeoff / Climb Checklist',
                detail: 'Landing Gear UP · Flaps 0 · Packs ON · Baro: bei TRANS ALT auf STD.',
                why: 'STD = Standard-Druck 1013 hPa. Über TRANS ALT fliegt jeder mit gleichem Referenzdruck → konsistente Flugflächen.',
            },
            {
                id: 'handoff-dep',
                actor: 'atc',
                label: 'Handoff Departure / Center',
                callout: '[Callsign], contact Departure [DEP_FREQ], good day.',
                inputKeys: ['depFreq'],
            },
            {
                id: 'dep-call',
                actor: 'pilot',
                label: 'Initial Call Departure',
                callout: '[Station] Departure, [Callsign], passing [PASSING_ALT] for [INIT_ALT], [SID] departure.',
                why: '"Passing X for Y" gibt aktuelle und freigegebene Höhe – Standard für Initial Calls auf neuer Frequenz.',
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
    {key: 'initialClimb', label: 'Initial Climb', placeholder: '5000', group: 'atc'},
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

/** Glossar – Begriffe, die im Text als Pill markiert werden. */
export interface GlossaryEntry {
    term: string
    short: string             // 1-Zeilen-Erklärung
    long?: string             // detailliertere Erklärung
}

export const glossary: GlossaryEntry[] = [
    {term: 'V1', short: 'Decision Speed – ab hier wird der Start nicht mehr abgebrochen.'},
    {term: 'VR', short: 'Rotation Speed – Pitch-Up beginnt bei dieser Geschwindigkeit.'},
    {term: 'V2', short: 'Takeoff Safety Speed – Mindestgeschwindigkeit nach Engine Failure bis 35 ft.'},
    {term: 'THR RED', short: 'Thrust Reduction Altitude – ab hier von TOGA/FLEX auf CLB-Schub.', long: 'Schalter-Höhe (AGL) im FMGS, an der die Auto-Thrust den Schub von Takeoff-Power auf Climb-Power zurücknimmt. Standard: 1500 ft AGL.'},
    {term: 'ACC ALT', short: 'Acceleration Altitude – ab hier beschleunigen & Flaps einfahren.', long: 'Höhe, an der die SRS-Mode (Speed Reference System) endet und das Flugzeug auf Green-Dot beschleunigt. Meist gleich THR RED, in Noise-Abatement-Procedures höher.'},
    {term: 'TRANS ALT', short: 'Transition Altitude – Wechsel von QNH auf STD (1013) beim Steigen.'},
    {term: 'TRANS LEVEL', short: 'Transition Level – Wechsel zurück von STD auf QNH beim Sinken.'},
    {term: 'FMA', short: 'Flight Mode Annunciator – die Modus-Zeile oben am PFD.', long: 'Zeigt aktive und armed Modes für A/THR, Vertikal-Mode, Lateral-Mode, Approach und A/P/FD-Status. Cross-Check ist Pflicht bei jedem Mode-Wechsel.'},
    {term: 'FCU', short: 'Flight Control Unit – Glareshield-Panel mit Speed/Heading/Altitude-Knöpfen.'},
    {term: 'MCDU', short: 'Multipurpose Control Display Unit – das FMS-Tastatur-Display zwischen den Piloten.'},
    {term: 'FMGS', short: 'Flight Management & Guidance System – das "Hirn" der A320: Navigation + Performance + Auto-Pilot-Logik.'},
    {term: 'ECAM', short: 'Electronic Centralised Aircraft Monitor – Systeme & Warnungen, mittlere Bildschirme.'},
    {term: 'SID', short: 'Standard Instrument Departure – vorgeschriebene Abflugroute.'},
    {term: 'STAR', short: 'Standard Terminal Arrival Route – vorgeschriebene Anflugroute.'},
    {term: 'CRAFT', short: 'Eselsbrücke: Clearance limit · Route · Altitude · Frequency · Transponder.'},
    {term: 'QNH', short: 'Druck auf Meeresspiegelhöhe – setzt den Höhenmesser im unteren Bereich.'},
    {term: 'STD', short: 'Standard-Druck 1013.25 hPa – über TRANS ALT immer eingestellt.'},
    {term: 'ZFW', short: 'Zero Fuel Weight – Leergewicht inkl. Pax & Cargo, ohne Treibstoff.'},
    {term: 'ZFWCG', short: 'Zero Fuel Weight CG – Schwerpunkt in % MAC ohne Treibstoff.'},
    {term: 'CG', short: 'Center of Gravity – Schwerpunkt, beeinflusst Trim & Stabilität.'},
    {term: 'MAC', short: 'Mean Aerodynamic Chord – Referenz-Profilsehne des Flügels.'},
    {term: 'ADIRS', short: 'Air Data / Inertial Reference System – Lage- und Geschwindigkeitsdaten.', long: 'Drei redundante Einheiten. Brauchen ~10 Minuten Alignment im NAV-Modus, daher früh anschalten.'},
    {term: 'APU', short: 'Auxiliary Power Unit – Hilfstriebwerk im Heck für Strom & Bleed Air.'},
    {term: 'GPU', short: 'Ground Power Unit – externer Strom-Wagen am Gate.'},
    {term: 'FLEX', short: 'Flexible Takeoff – reduzierter Schub via fiktiver Außentemperatur, schont das Triebwerk.'},
    {term: 'TOGA', short: 'Takeoff/Go-Around – maximaler Schub.'},
    {term: 'CL', short: 'Climb Detent – Auto-Thrust-Position der Thrust Lever im Steigflug & Reise.'},
    {term: 'SRS', short: 'Speed Reference System – Pitch-Mode beim Takeoff/Go-Around, hält V2+10.'},
    {term: 'PF', short: 'Pilot Flying – steuert das Flugzeug aktiv.'},
    {term: 'PM', short: 'Pilot Monitoring – überwacht, callouts, Funk, Checkliste.'},
    {term: 'TCAS', short: 'Traffic Collision Avoidance System – Verkehrswarnsystem.'},
    {term: 'TA/RA', short: 'Traffic Advisory / Resolution Advisory – TCAS-Warnstufen.'},
    {term: 'FL', short: 'Flight Level – Höhe in 100 ft auf STD (z. B. FL360 = 36.000 ft auf 1013 hPa).'},
    {term: 'AGL', short: 'Above Ground Level – Höhe über Grund.'},
    {term: 'MSA', short: 'Minimum Safe Altitude – Sicherheitshöhe, garantiert Hindernisfreiheit.'},
    {term: 'NOTAM', short: 'Notice to Airmen – aktuelle Hinweise (geschlossene Bahnen, etc.).'},
    {term: 'ATIS', short: 'Automatic Terminal Information Service – aktuelle Wetter-/Bahn-/QNH-Info per Funk.'},
    {term: 'F-PLN', short: 'Flight Plan Page der MCDU – Lateral Route mit Wegpunkten.'},
]
