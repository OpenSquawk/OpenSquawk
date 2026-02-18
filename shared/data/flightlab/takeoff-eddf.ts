// shared/data/flightlab/takeoff-eddf.ts
import type {FlightLabScenario} from './types'

export const takeoffEddf: FlightLabScenario = {
    id: 'takeoff-eddf',
    title: 'Dein erster Start',
    description: 'Gemeinsam von der Startbahn in Frankfurt auf 10.000 Fuß - Schritt für Schritt in deinem Tempo.',
    icon: 'mdi-airplane-takeoff',
    aircraft: 'Airbus A320',
    airport: 'Frankfurt (EDDF)',
    runway: '25C',
    callsign: 'Lufthansa 39 Alpha',
    phases: [
        // --- Phase 0: Welcome ---
        {
            id: 'welcome',
            atcMessage: 'Willkommen im Flugdeck. Ich begleite dich heute bei deinem ersten Start. Schau dich kurz um. Es gibt viele Knöpfe, aber ich sage dir genau, was wann wichtig ist. Alles andere lassen wir weg.',
            explanation: 'Du sitzt links auf dem Sitz des Kapitäns. Rechts sitzt sonst der Kopilot.',
            instructorNote: 'Teilnehmer ist gerade angekommen. Kurz orientieren lassen.',
            buttons: [
                {
                    id: 'ready',
                    label: 'Bin bereit, los gehts!',
                    icon: 'mdi-check-circle',
                    next: 'seatbelt_on',
                    type: 'primary'
                },
                {
                    id: 'nervous',
                    label: 'Erstmal orientieren',
                    icon: 'mdi-emoticon-neutral',
                    next: 'welcome_comfort',
                    type: 'comfort',
                    instructorAlert: 'Teilnehmer möchte sich erstmal orientieren'
                },
                {
                    id: 'tellmore',
                    label: 'Was ist das hier alles?',
                    icon: 'mdi-information',
                    next: 'welcome_detail',
                    type: 'info'
                },
            ],
            sounds: [],
        },
        {
            id: 'welcome_comfort',
            atcMessage: 'Klar, nimm dir kurz Zeit. Vor dir sind zwei große Anzeigen: links Geschwindigkeit und Höhe, rechts die Strecke. In der Mitte zwischen den Sitzen sind die Schubhebel für die Triebwerke. Links neben deinem Sitz ist der Steuerknüppel. Wenn du bereit bist, starten wir.',
            explanation: 'Hauptanzeige links, Streckenanzeige rechts, Schubhebel in der Mitte, Steuerknüppel links.',
            instructorNote: 'Teilnehmer orientiert sich. Zeit lassen.',
            buttons: [
                {
                    id: 'ready_after_comfort',
                    label: 'Okay, hab den Überblick',
                    icon: 'mdi-check-circle',
                    next: 'seatbelt_on',
                    type: 'primary'
                },
                {
                    id: 'still_nervous',
                    label: 'Was ist der Steuerknüppel?',
                    icon: 'mdi-timer-sand',
                    next: 'welcome_comfort_2',
                    type: 'comfort'
                },
            ],
            sounds: [],
        },
        {
            id: 'welcome_comfort_2',
            atcMessage: 'Der Steuerknüppel sitzt links neben deinem Sitz. Ziehst du ihn nach hinten, geht die Nase hoch. Drückst du ihn nach vorn, geht sie runter. Seitlich steuerst du Kurven. Beim Airbus gibt es statt Steuerhorn diesen kleinen Knüppel. Fass ihn kurz an und bewege ihn leicht.',
            explanation: 'Steuerknüppel links. Hinten = Nase hoch, vorne = Nase runter.',
            instructorNote: 'Erklärung zum Steuerknüppel. Teilnehmer soll ihn kurz anfassen.',
            buttons: [
                {
                    id: 'ready_after_comfort_2',
                    label: 'Verstanden, weiter!',
                    icon: 'mdi-check-circle',
                    next: 'seatbelt_on',
                    type: 'primary'
                },
            ],
            sounds: [],
        },
        {
            id: 'welcome_detail',
            atcMessage: 'Kurz von links nach rechts: Links sind die Fluginstrumente für Geschwindigkeit, Höhe und Lage. Oben in der Mitte ist das Deckenfeld mit Schaltern für Systeme, das lassen wir heute in Ruhe. Zwischen den Sitzen sind die Schubhebel. Darunter sind Funk und Transponder. Für den Start brauchen wir nur Schubhebel, Steuerknüppel und Fahrwerkshebel.',
            explanation: 'Für den Start wichtig: Schubhebel, Steuerknüppel, Fahrwerkshebel.',
            buttons: [
                {
                    id: 'ready_after_detail',
                    label: 'Alles klar, weiter!',
                    icon: 'mdi-check-circle',
                    next: 'seatbelt_on',
                    type: 'primary'
                },
                {
                    id: 'questions',
                    label: 'Wo ist der Fahrwerk-Hebel?',
                    icon: 'mdi-help-circle',
                    next: 'welcome_questions',
                    type: 'info'
                },
            ],
            sounds: [],
        },
        {
            id: 'welcome_questions',
            atcMessage: 'Der Fahrwerkshebel ist vorn rechts neben dem unteren Mittelschirm. Er sieht wie ein kleines Rad aus. Du brauchst ihn erst nach dem Abheben. Ich sage dir genau wann.',
            buttons: [
                {
                    id: 'ready_after_questions',
                    label: 'Okay, starten wir!',
                    icon: 'mdi-check-circle',
                    next: 'seatbelt_on',
                    type: 'primary'
                },
            ],
            sounds: [],
        },
        {
            id: 'seatbelt_on',
            atcMessage: 'Bevor wir loslegen, schalten wir die Anschnallzeichen ein. Schau oben auf das Deckenfeld und stell den Schalter auf EIN. So bleiben alle angeschnallt.',
            explanation: 'Anschnallzeichen vor dem Start auf EIN setzen.',
            instructorNote: 'Anschnallzeichen vor der Einweisung einschalten lassen.',
            buttons: [
                {
                    id: 'seatbelt_on_done',
                    label: 'Anschnallzeichen sind EIN (warte auf Bestätigung)',
                    icon: 'mdi-seatbelt',
                    next: 'seatbelt_on',
                    type: 'primary'
                },
            ],
            sounds: [
                {id: 'chime', action: 'play', volume: 0.3, loop: false},
            ],
            simConditions: {
                conditions: [
                    {variable: 'SEAT_BELT_SIGNS', operator: '==', value: true},
                ],
                logic: 'AND',
            },
            simConditionTimeoutMs: 15000,
            simConditionHelpMessage: 'Anschnallzeichen am Deckenfeld auf EIN stellen.',
            simConditionNextPhase: 'briefing',
        },

        // --- Phase 1: Briefing ---
        {
            id: 'briefing',
            atcMessage: 'Kurze Einweisung: Ich erkläre dir erstmal nur den Plan, wir machen noch nichts. Wir stehen auf Bahn 25 Mitte in Frankfurt. Du schiebst die Schubhebel vor, wir beschleunigen, bei 140 Knoten ziehst du den Steuerknüppel sanft nach hinten. Dann Fahrwerk einfahren und auf 10.000 Fuß steigen. Ich kündige jeden Schritt an.',
            explanation: 'Startbahn 25C, Frankfurt. Ziel: 10.000 Fuß (ca. 3 km Höhe).',
            instructorNote: 'Einweisungsphase. Schritte zusammenfassen.',
            buttons: [
                {
                    id: 'lets_go',
                    label: 'Verstanden, los gehts!',
                    icon: 'mdi-play-circle',
                    next: 'runway',
                    type: 'primary'
                },
                {
                    id: 'how_long',
                    label: 'Wie lange dauert das?',
                    icon: 'mdi-clock',
                    next: 'briefing_duration',
                    type: 'info'
                },
                {
                    id: 'what_if',
                    label: 'Was ist wenn ich was falsch mache?',
                    icon: 'mdi-shield-check',
                    next: 'briefing_safety',
                    type: 'info'
                },
            ],
            sounds: [],
        },
        {
            id: 'briefing_duration',
            atcMessage: 'Der Start dauert nur wenige Minuten. Mit Erklärungen sind es etwa 10 bis 15 Minuten. Wir gehen in deinem Tempo.',
            buttons: [
                {
                    id: 'go_after_duration',
                    label: 'Gut, los gehts!',
                    icon: 'mdi-play-circle',
                    next: 'runway',
                    type: 'primary'
                },
            ],
            sounds: [],
        },
        {
            id: 'briefing_safety',
            atcMessage: 'Kein Problem. Wir sind im Flugsimulator, hier geht nichts kaputt. Fehler korrigieren wir sofort, notfalls starten wir neu. Genau dafür üben wir hier.',
            buttons: [
                {
                    id: 'go_after_safety',
                    label: 'Okay, dann los!',
                    icon: 'mdi-play-circle',
                    next: 'runway',
                    type: 'primary'
                },
            ],
            sounds: [],
        },

        // --- Phase 2: On the Runway ---
        {
            id: 'runway',
            atcMessage: 'Wir stehen auf der Startbahn. Schau auf die linke Hauptanzeige vor dir. Links siehst du die Geschwindigkeit in Knoten, rechts die Höhe in Fuß. In der Mitte ist der künstliche Horizont für die Lage. Jetzt leg die rechte Hand auf die Schubhebel.',
            explanation: 'Hauptanzeige: Geschwindigkeit links, Höhe rechts, Lage in der Mitte. Hand an die Schubhebel.',
            instructorNote: 'Teilnehmer soll die Instrumente lesen und die Schubhebel finden.',
            buttons: [
                {
                    id: 'see_runway',
                    label: 'Hand liegt auf den Hebeln',
                    icon: 'mdi-hand-pointing-right',
                    next: 'engines_spool',
                    type: 'primary'
                },
                {
                    id: 'where_look',
                    label: 'Wo sind die Schubhebel?',
                    icon: 'mdi-help-circle',
                    next: 'runway_help',
                    type: 'info'
                },
            ],
            sounds: [
                {id: 'engine-idle', action: 'play', volume: 0.15, loop: true},
            ],
        },
        {
            id: 'runway_help',
            atcMessage: 'Die Schubhebel sind die zwei Hebel zwischen den Sitzen auf der Mittelkonsole. Sie stehen im Leerlauf ganz hinten. Gleich schiebst du sie nach vorn. Leg eine Hand darauf.',
            buttons: [
                {
                    id: 'see_now',
                    label: 'Hab sie, weiter!',
                    icon: 'mdi-hand-pointing-right',
                    next: 'engines_spool',
                    type: 'primary'
                },
            ],
            sounds: [],
        },

        // --- Phase 3: Schub setzen ---
        {
            id: 'engines_spool',
            atcMessage: 'Los, schieb die Hebel jetzt zügig nach vorn. Die N1-Werte steigen, Ziel sind etwa 65 Prozent. Wenn der Schub steht, löse die Parkbremse. Das ist der Hebel mit dem P unten an der Mittelkonsole.',
            explanation: 'Schubhebel nach vorne auf 85% N1. Dann Parkbremse lösen.',
            instructorNote: 'Schub wird gesetzt. Teilnehmer bedient die Hebel selbst.',
            buttons: [
                {
                    id: 'engines_continue',
                    label: 'Schub steht, Bremse gelöst!',
                    icon: 'mdi-arrow-right-circle',
                    next: 'takeoff_roll',
                    type: 'primary'
                },
                {
                    id: 'engines_loud',
                    label: 'Wo ist die Parkbremse?',
                    icon: 'mdi-help-circle',
                    next: 'engines_loud_comfort',
                    type: 'comfort'
                },
                {
                    id: 'engines_pause',
                    label: 'Moment, ich komm nicht mit',
                    icon: 'mdi-pause-circle',
                    next: 'engines_pause_phase',
                    type: 'comfort',
                    instructorAlert: 'Teilnehmer braucht Unterstützung beim Schub setzen'
                },
            ],
            sounds: [
                {id: 'engine-idle', action: 'stop'},
                {id: 'engine-spool', action: 'play', volume: 0.5, loop: false},
                {id: 'engine-cruise', action: 'play', volume: 0.4, loop: true},
            ],
            simConditions: {
                conditions: [
                    {variable: 'TURB_ENG_N1_1', operator: '>=', value: 55},
                    {variable: 'TURB_ENG_N1_2', operator: '>=', value: 55},
                    {variable: 'BRAKE_PARKING_POSITION', operator: '==', value: false},
                ],
                logic: 'AND',
            },
            simConditionTimeoutMs: 20000,
            simConditionHelpMessage: 'Schubhebel nach vorn schieben bis N1 bei etwa 85 Prozent. Dann die Parkbremse lösen.',
            simConditionNextPhase: 'takeoff_roll',
        },
        {
            id: 'engines_loud_comfort',
            atcMessage: 'Die Parkbremse ist unten an der Mittelkonsole zwischen den Sitzen, etwas weiter vorn. Zieh oder drück ihn, je nach Simulationsmodell. Sobald die Bremse gelöst ist, rollt das Flugzeug los.',
            buttons: [
                {
                    id: 'continue_after_loud',
                    label: 'Gefunden, Bremse gelöst!',
                    icon: 'mdi-arrow-right-circle',
                    next: 'takeoff_roll',
                    type: 'primary'
                },
            ],
            sounds: [],
        },
        {
            id: 'engines_pause_phase',
            atcMessage: 'Kein Stress, Schritt für Schritt: Erst Schubhebel nach vorn bis N1 etwa 65. Dann Parkbremse lösen. Mehr ist es nicht. Probier es in Ruhe.',
            instructorNote: 'Teilnehmer braucht Hilfe. Ggf. mündlich die Hebel zeigen.',
            buttons: [
                {
                    id: 'resume_after_pause',
                    label: 'Okay, hab es',
                    icon: 'mdi-play-circle',
                    next: 'takeoff_roll',
                    type: 'primary'
                },
            ],
            sounds: [],
        },

        // --- Phase 4: Takeoff Roll ---
        {
            id: 'takeoff_roll',
            atcMessage: 'Wir rollen. Das Flugzeug beschleunigt auf der Bahn. Schau links auf das Geschwindigkeitsband, die Zahl steigt. Halte mit den Ruderpedalen die Mittellinie. Kleine Korrekturen reichen. Bei 140 Knoten ziehst du den Steuerknüppel.',
            explanation: 'Ruderpedale halten die Richtung. Bei 140 Knoten abheben.',
            instructorNote: 'Startlauf. Teilnehmer hält Richtung mit Pedalen. Geschwindigkeitsband beobachten.',
            buttons: [
                {
                    id: 'roll_continue',
                    label: 'Geschwindigkeit steigt!',
                    icon: 'mdi-arrow-right-circle',
                    next: 'rotation',
                    type: 'primary'
                },
                {
                    id: 'roll_rumble',
                    label: 'Welche Pedale?',
                    icon: 'mdi-help-circle',
                    next: 'roll_rumble_explain',
                    type: 'info'
                },
                {
                    id: 'roll_afraid',
                    label: 'Es zieht nach links/rechts!',
                    icon: 'mdi-swap-horizontal',
                    next: 'roll_afraid_comfort',
                    type: 'comfort',
                    instructorAlert: 'Teilnehmer hat Probleme mit Richtungskontrolle'
                },
            ],
            sounds: [
                {id: 'runway-rumble', action: 'play', volume: 0.5, loop: true},
                {id: 'wind-low', action: 'play', volume: 0.3, loop: true},
            ],
            simConditions: {
                conditions: [
                    {variable: 'AIRSPEED_INDICATED', operator: '>=', value: 130},
                    {variable: 'SIM_ON_GROUND', operator: '==', value: true},
                ],
                logic: 'AND',
            },
            simConditionTimeoutMs: 45000,
            simConditionHelpMessage: 'Warte bis die Geschwindigkeit 140 Knoten erreicht. Schau links auf das Geschwindigkeitsband.',
            simConditionNextPhase: 'rotation',
        },
        {
            id: 'roll_rumble_explain',
            atcMessage: 'Die Ruderpedale sind unten bei deinen Füßen. Mit ihnen lenkst du am Boden. Linkes Pedal lenkt nach links, rechtes nach rechts. Beim Startlauf hältst du damit das Bugrad auf der Linie. Nur sanft drücken.',
            buttons: [
                {
                    id: 'rumble_ok',
                    label: 'Verstanden, ich halte die Richtung',
                    icon: 'mdi-arrow-right-circle',
                    next: 'rotation',
                    type: 'primary'
                },
            ],
            sounds: [],
        },
        {
            id: 'roll_afraid_comfort',
            atcMessage: 'Das ist am Anfang normal. Drück nur leicht gegen, kleine Bewegungen reichen. Das Flugzeug reagiert etwas verzögert. Schau auf die Mittellinie und halte die Pedale ruhig. Zu starke Gegenbewegungen machen es unruhig.',
            instructorNote: 'Richtungsprobleme beim Startlauf. Ggf. mündlich korrigieren.',
            buttons: [
                {
                    id: 'afraid_continue',
                    label: 'Passt jetzt besser',
                    icon: 'mdi-check-circle',
                    next: 'rotation',
                    type: 'primary'
                },
                {
                    id: 'afraid_stop',
                    label: 'Nochmal erklären',
                    icon: 'mdi-pause-circle',
                    next: 'roll_pause',
                    type: 'comfort'
                },
            ],
            sounds: [],
        },
        {
            id: 'roll_pause',
            atcMessage: 'Ganz einfach: Füße locker auf die Pedale, Blick auf die Mittelmarkierung. Zieht die Nase nach links, drückst du leicht rechts. Und umgekehrt. So hältst du die Richtung.',
            buttons: [
                {
                    id: 'pause_continue',
                    label: 'Verstanden, weiter',
                    icon: 'mdi-play-circle',
                    next: 'rotation',
                    type: 'primary'
                },
            ],
            sounds: [],
        },

        // --- Phase 5: Rotation ---
        {
            id: 'rotation',
            atcMessage: 'Jetzt ziehst du den Steuerknüppel sanft an dich ran, bis der künstliche Horizont zwischen 10 und 20 steht.',
            explanation: 'Steuerknüppel nach hinten ziehen. Ziel: etwa 15 Grad Nicklage.',
            instructorNote: 'Abheben. Teilnehmer zieht den Steuerknüppel. Auf die Nicklage achten.',
            buttons: [
                {id: 'rotation_wow', label: 'Wir fliegen!', icon: 'mdi-star', next: 'gear_retract', type: 'primary'},
                {
                    id: 'rotation_belly',
                    label: 'Wie viel Nicklage?',
                    icon: 'mdi-angle-acute',
                    next: 'rotation_belly_explain',
                    type: 'info'
                },
                {
                    id: 'rotation_continue',
                    label: 'Weiter',
                    icon: 'mdi-arrow-right-circle',
                    next: 'gear_retract',
                    type: 'primary'
                },
            ],
            sounds: [
                {id: 'runway-rumble', action: 'stop'},
                {id: 'wind-low', action: 'crossfade', volume: 0.0},
                {id: 'wind-high', action: 'play', volume: 0.35, loop: true},
            ],
            simConditions: {
                conditions: [
                    {variable: 'SIM_ON_GROUND', operator: '==', value: false},
                    {variable: 'PLANE_PITCH_DEGREES', operator: '>', value: 5},
                    // Höhe als Zusatzkriterium für stabilen Übergang
                    {variable: 'PLANE_ALTITUDE', operator: '>', value: 2000},
                ],
                logic: 'AND',
            },
            simConditionTimeoutMs: 15000,
            simConditionHelpMessage: 'Steuerknüppel sanft nach hinten ziehen, bis die Nase hochgeht.',
            simConditionNextPhase: 'gear_retract',
        },
        {
            id: 'rotation_belly_explain',
            atcMessage: 'In der Hauptanzeige siehst du den künstlichen Horizont mit Linien und Zahlen. Daran liest du die Nicklage ab. 15 Grad heißt: die Flugzeugmarke steht etwa zwei Striche über dem Horizont. Zu viel macht uns zu langsam, zu wenig lässt uns kaum steigen. 15 Grad passt für den A320.',
            buttons: [
                {
                    id: 'belly_ok',
                    label: 'Verstanden, weiter!',
                    icon: 'mdi-arrow-right-circle',
                    next: 'gear_retract',
                    type: 'primary'
                },
            ],
            sounds: [],
        },

        // --- Phase 6: Gear Retraction ---
        {
            id: 'gear_retract',
            atcMessage: 'Sehr gut, wir sind in der Luft. Jetzt brauchen wir die Räder nicht mehr. Rechts neben dem unteren Mittelschirm ist der Fahrwerkshebel mit kleinem Radsymbol. Schieb ihn nach vorne. So fahren die Räder in den Rumpf und der Luftwiderstand sinkt.',
            explanation: 'Fahrwerkshebel auf OBEN. Verringert den Luftwiderstand im Steigflug.',
            instructorNote: 'Fahrwerk einfahren. Teilnehmer betätigt den Fahrwerkshebel.',
            buttons: [
                {
                    id: 'gear_know',
                    label: 'Fahrwerk ist oben!',
                    icon: 'mdi-check-circle',
                    next: 'climb',
                    type: 'primary'
                },
                {
                    id: 'gear_what',
                    label: 'Welchen Hebel genau?',
                    icon: 'mdi-help-circle',
                    next: 'gear_explain',
                    type: 'comfort',
                    instructorAlert: 'Teilnehmer findet den Fahrwerkshebel nicht'
                },
                {
                    id: 'gear_continue',
                    label: 'Erledigt',
                    icon: 'mdi-arrow-right-circle',
                    next: 'climb',
                    type: 'primary'
                },
            ],
            sounds: [
                {id: 'gear-retract', action: 'play', volume: 0.6, loop: false},
            ],
            simConditions: {
                conditions: [
                    {variable: 'GEAR_HANDLE_POSITION', operator: '==', value: false},
                ],
                logic: 'AND',
            },
            simConditionTimeoutMs: 10000,
            simConditionHelpMessage: 'Fahrwerkshebel nach oben schieben. Der Hebel ist rechts neben dem unteren Mittelschirm.',
            simConditionNextPhase: 'climb',
        },
        {
            id: 'gear_explain',
            atcMessage: 'Der Fahrwerkshebel ist vorn an der Mittelkonsole, rechts neben dem unteren Schirm. Er sieht wie ein kleines Rad aus. Drei Stellungen: UNTEN, MITTE, OBEN. Schieb ihn ganz nach OBEN. Dann hörst du ein Rumpeln, weil Räder und Klappen einfahren.',
            buttons: [
                {
                    id: 'gear_explained',
                    label: 'Hab ihn, Fahrwerk oben!',
                    icon: 'mdi-check-circle',
                    next: 'climb',
                    type: 'primary'
                },
            ],
            sounds: [],
        },

        // --- Phase 7: Climb ---
        {
            id: 'climb',
            atcMessage: 'Perfekt, Fahrwerk ist drin. Jetzt steigen wir weiter. Halte die Nicklage bei etwa 15 Grad. Links auf dem Geschwindigkeitsband wollen wir rund 200 Knoten. Wird die Geschwindigkeit zu hoch, nimm die Nase etwas höher. Wird sie zu niedrig, senke die Nase leicht. So steuerst du den Steigflug.',
            explanation: 'Nicklage halten für etwa 200 Knoten. Nase hoch = langsamer, Nase runter = schneller.',
            instructorNote: 'Steigflug. Teilnehmer lernt den Zusammenhang von Nicklage und Geschwindigkeit.',
            buttons: [
                {
                    id: 'climb_height',
                    label: 'Wie hoch sind wir?',
                    icon: 'mdi-altimeter',
                    next: 'climb_height_info',
                    type: 'info'
                },
                {
                    id: 'climb_continue',
                    label: 'Passt, weiter steigen',
                    icon: 'mdi-arrow-up-circle',
                    next: 'climb_high',
                    type: 'primary'
                },
                {
                    id: 'climb_queasy',
                    label: 'Die Geschwindigkeit schwankt stark',
                    icon: 'mdi-swap-vertical',
                    next: 'climb_queasy_comfort',
                    type: 'comfort',
                    instructorAlert: 'Teilnehmer hat Probleme mit der Geschwindigkeitskontrolle'
                },
            ],
            sounds: [
                {id: 'engine-cruise', action: 'crossfade', volume: 0.3},
                {id: 'wind-high', action: 'crossfade', volume: 0.25},
            ],
            simConditions: {
                conditions: [
                    {variable: 'PLANE_ALTITUDE', operator: '>', value: 7000},
                    {variable: 'VERTICAL_SPEED', operator: '>', value: 1000},
                ],
                logic: 'AND',
            },
            simConditionTimeoutMs: 30000,
            simConditionHelpMessage: 'Steigrate auf etwa 2000 Fuß pro Minute erhöhen. Steuerknüppel leicht nach hinten halten.',
            simConditionNextPhase: 'climb_high',
        },
        {
            id: 'climb_height_info',
            atcMessage: 'Schau rechts auf das Höhenband der Hauptanzeige. Dort steht die aktuelle Höhe in Fuß. Ziel sind 10.000 Fuß, also noch ein Stück. Oben rechts siehst du auch den eingestellten Zielwert.',
            buttons: [
                {
                    id: 'height_continue',
                    label: 'Weiter steigen!',
                    icon: 'mdi-arrow-up-circle',
                    next: 'climb_high',
                    type: 'primary'
                },
            ],
            sounds: [],
        },
        {
            id: 'climb_queasy_comfort',
            atcMessage: 'Das ist am Anfang normal. Korrigiere nicht ständig am Steuerknüppel. Stell die Nicklage ein und lass sie kurz stehen. Kleine Schwankungen gleicht das Flugzeug selbst aus. Erst bei etwa 10 Knoten Abweichung leicht nachsteuern.',
            instructorNote: 'Probleme mit der Geschwindigkeitskontrolle. Auf zu häufiges Korrigieren hinweisen.',
            buttons: [
                {
                    id: 'queasy_continue',
                    label: 'Okay, weniger korrigieren',
                    icon: 'mdi-arrow-up-circle',
                    next: 'climb_high',
                    type: 'primary'
                },
                {
                    id: 'queasy_pause',
                    label: 'Nochmal den Zusammenhang erklären',
                    icon: 'mdi-help-circle',
                    next: 'climb_pause',
                    type: 'comfort'
                },
            ],
            sounds: [],
        },
        {
            id: 'climb_pause',
            atcMessage: 'Grundprinzip: Der Schub bleibt eingestellt. Mit dem Steuerknüppel regelst du die Nicklage, also wie steil die Nase steigt. Mehr Nicklage heißt mehr Steigen, aber weniger Geschwindigkeit. Weniger Nicklage heißt weniger Steigen, dafür mehr Geschwindigkeit. Halte so ungefähr 200 Knoten.',
            buttons: [
                {
                    id: 'pause_done',
                    label: 'Verstanden, weiter',
                    icon: 'mdi-play-circle',
                    next: 'climb_high',
                    type: 'primary'
                },
            ],
            sounds: [],
        },
        {
            id: 'climb_high',
            atcMessage: 'Sehr gut, wir kommen dem Ziel näher. Schau auf den Höhenmesser rechts. Noch ein paar Tausend Fuß. Halte die Nicklage stabil, die Geschwindigkeit passt. Bei 10.000 Fuß drückst du die Nase langsam nach vorn in den Geradeausflug.',
            explanation: 'Weiter steigen bis 10.000 Fuß. Dann Nase senken für Reiseflug.',
            instructorNote: 'Kurz vor dem Geradeausflug. Nächste Aktion ankündigen.',
            buttons: [
                {
                    id: 'almost_there',
                    label: 'Fast auf 10.000!',
                    icon: 'mdi-flag-checkered',
                    next: 'leveloff',
                    type: 'primary'
                },
            ],
            sounds: [],
            simConditions: {
                conditions: [
                    {variable: 'PLANE_ALTITUDE', operator: '>=', value: 9800},
                ],
                logic: 'AND',
            },
            simConditionTimeoutMs: 60000,
            simConditionHelpMessage: 'Weiter steigen bis 10.000 Fuß. Halte die Nase leicht oben.',
            simConditionNextPhase: 'leveloff',
        },

        // --- Phase 8: Level-off & Debrief ---
        {
            id: 'leveloff',
            atcMessage: '10.000 Fuß. Drück den Steuerknüppel langsam nach vorn, bis die Steigrate am Variometer nahe null ist. Das Variometer ist rechts neben dem Höhenband. Jetzt gehen wir in den Geradeausflug. Sehr gut, du fliegst einen A320 auf 10.000 Fuß. Wenn wir stabil sind, schalten wir die Anschnallzeichen aus.',
            explanation: 'Geradeausflug: Steuerknüppel leicht nach vorn bis Steigrate nahe null.',
            instructorNote: 'Geradeausflug erreicht. Teilnehmer bringt die Steigrate nahe null.',
            buttons: [
                {
                    id: 'debrief_cool',
                    label: 'Das war stark!',
                    icon: 'mdi-party-popper',
                    next: 'seatbelt_off',
                    type: 'primary'
                },
                {
                    id: 'debrief_relief',
                    label: 'Geschafft!',
                    icon: 'mdi-emoticon-happy',
                    next: 'seatbelt_off',
                    type: 'primary'
                },
                {id: 'debrief_again', label: 'Noch einmal!', icon: 'mdi-refresh', next: 'seatbelt_off', type: 'info'},
                {
                    id: 'debrief_pause',
                    label: 'Kurz durchatmen',
                    icon: 'mdi-pause-circle',
                    next: 'seatbelt_off',
                    type: 'comfort'
                },
            ],
            sounds: [
                {id: 'engine-cruise', action: 'crossfade', volume: 0.2},
                {id: 'wind-high', action: 'crossfade', volume: 0.15},
            ],
            simConditions: {
                conditions: [
                    {variable: 'VERTICAL_SPEED', operator: '<', value: 500},
                    {variable: 'VERTICAL_SPEED', operator: '>', value: -500},
                    {variable: 'PLANE_ALTITUDE', operator: '>=', value: 9500},
                ],
                logic: 'AND',
            },
            simConditionTimeoutMs: 20000,
            simConditionHelpMessage: 'Nase etwas senken zum Geradeausflug. Steigrate auf nahe Null bringen.',
            simConditionNextPhase: 'seatbelt_off',
        },
        {
            id: 'seatbelt_off',
            atcMessage: 'Perfekt, wir fliegen stabil auf 10.000 Fuß. Jetzt kannst du die Anschnallzeichen ausschalten. Schalter auf AUS, dann geht es in die Nachbesprechung.',
            explanation: 'Nach stabilem Reiseflug auf 10.000 Fuß Anschnallzeichen auf AUS setzen.',
            instructorNote: 'Nach stabilem Flug auf 10.000 Fuß die Anschnallzeichen ausschalten lassen.',
            buttons: [
                {
                    id: 'seatbelt_off_done',
                    label: 'Anschnallzeichen sind AUS (warte auf Bestätigung)',
                    icon: 'mdi-seatbelt',
                    next: 'seatbelt_off',
                    type: 'primary'
                },
            ],
            sounds: [
                {id: 'chime', action: 'play', volume: 0.3, loop: false},
            ],
            simConditions: {
                conditions: [
                    {variable: 'SEAT_BELT_SIGNS', operator: '==', value: false},
                ],
                logic: 'AND',
            },
            simConditionTimeoutMs: 20000,
            simConditionHelpMessage: 'Anschnallzeichen am Deckenfeld wieder auf AUS stellen.',
            simConditionNextPhase: 'debrief',
        },
        {
            id: 'debrief',
            atcMessage: 'Stark. Du bist gerade einen kompletten Start im A320 geflogen: Schub gesetzt, beschleunigt, abgehoben, Fahrwerk eingefahren und auf 10.000 Fuß gestiegen. Genau so läuft die Abfolge auch im echten Betrieb. Jetzt weißt du, was vorne auf dem Flugdeck passiert.',
            explanation: 'Startablauf abgeschlossen: Schub, Abheben, Fahrwerk, Steigflug, Geradeausflug.',
            instructorNote: 'Nachbesprechung. Schritte zusammenfassen. Besprechung im Raum.',
            buttons: [
                {id: 'restart', label: 'Noch einmal von vorn', icon: 'mdi-refresh', next: 'welcome', type: 'info'},
                {id: 'finish', label: 'Fertig - danke!', icon: 'mdi-check-circle', next: 'end', type: 'primary'},
            ],
            sounds: [],
        },
        {
            id: 'debrief_restart',
            atcMessage: 'Sehr gerne. Beim zweiten Durchgang fallen dir schon viel mehr Details auf. Erst versteht man die Schritte, dann sitzt der Ablauf.',
            buttons: [
                {id: 'yes_restart', label: 'Ja, noch einmal!', icon: 'mdi-refresh', next: 'welcome', type: 'primary'},
                {
                    id: 'no_finish',
                    label: 'Reicht für heute',
                    icon: 'mdi-check-circle',
                    next: 'debrief',
                    type: 'primary'
                },
            ],
            sounds: [],
        },
        {
            id: 'debrief_pause',
            atcMessage: 'Klar, gönn dir eine Minute. Das war viel auf einmal. Das Flugzeug fliegt jetzt stabil geradeaus, du kannst loslassen.',
            buttons: [
                {
                    id: 'end_after_pause',
                    label: 'Danke, das reicht',
                    icon: 'mdi-check-circle',
                    next: 'end',
                    type: 'primary'
                },
                {
                    id: 'continue_after_pause',
                    label: 'Noch einmal starten',
                    icon: 'mdi-refresh',
                    next: 'welcome',
                    type: 'info'
                },
            ],
            sounds: [],
        },

        // --- End ---
        {
            id: 'end',
            atcMessage: 'Starke Übung. Du hast heute den Start im A320 gelernt: Schub setzen, auf der Bahn bleiben, bei 140 Knoten abheben, Fahrwerk einfahren, steigen und in den Geradeausflug gehen. Genau so arbeiten auch die Profis. Bis zum nächsten Mal.',
            explanation: 'Szenario beendet. Du kannst jederzeit nochmal üben.',
            instructorNote: 'Szenario beendet. Nachbesprechung im Raum.',
            buttons: [
                {id: 'restart_final', label: 'Noch einmal starten', icon: 'mdi-refresh', next: 'welcome', type: 'info'},
            ],
            sounds: [
                {id: 'engine-cruise', action: 'stop'},
                {id: 'wind-high', action: 'stop'},
            ],
        },
    ],
}
