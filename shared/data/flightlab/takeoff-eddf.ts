// shared/data/flightlab/takeoff-eddf.ts
import type {FlightLabScenario} from './types'

export const takeoffEddf: FlightLabScenario = {
    id: 'takeoff-eddf',
    title: 'Dein erster Start',
    description: 'Gemeinsam vom Rollfeld in Frankfurt bis auf 10.000 Fuß - Schritt für Schritt, in deinem Tempo.',
    icon: 'mdi-airplane-takeoff',
    aircraft: 'Airbus A320',
    airport: 'Frankfurt (EDDF)',
    runway: '25C',
    callsign: 'Lufthansa 39 Alpha',
    phases: [
        // --- Phase 0: Welcome ---
        {
            id: 'welcome',
            atcMessage: 'Hey! Willkommen im Cockpit. Ich bin dein Co-Pilot heute und führe dich durch deinen ersten Start. Schau dich ruhig erstmal um. Sieht nach vielen Knöpfen aus, oder? Keine Sorge, ich sag dir genau welche du wann anfassen musst. Den Rest ignorieren wir einfach.',
            explanation: 'Du sitzt auf dem linken Sitz - dem Captain-Sitz. Rechts neben dir wäre normalerweise der Co-Pilot.',
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
            atcMessage: 'Klar, nimm dir einen Moment. Direkt vor dir hast du zwei große Bildschirme. Der linke zeigt Geschwindigkeit und Höhe, der rechte zeigt die Navigation. In der Mitte zwischen den Sitzen sind die Schubhebel, mit denen steuerst du die Triebwerke. Und links neben deinem Sitz ist der Sidestick, das ist quasi das Lenkrad. Wenn du soweit bist, gehts los.',
            explanation: 'PFD links, ND rechts, Schubhebel in der Mitte, Sidestick links.',
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
                    label: 'Was ist der Sidestick?',
                    icon: 'mdi-timer-sand',
                    next: 'welcome_comfort_2',
                    type: 'comfort'
                },
            ],
            sounds: [],
        },
        {
            id: 'welcome_comfort_2',
            atcMessage: 'Der Sidestick ist der kleine Steuerknüppel links neben deinem Sitz. Damit steuerst du das Flugzeug - nach hinten ziehen heißt Nase hoch, nach vorne drücken Nase runter, und seitlich für Kurven. Im Gegensatz zu Boeing hat Airbus kein großes Steuerhorn vor dir, sondern diesen kompakten Stick. Fass ihn ruhig mal an, du merkst dass er sich in alle Richtungen bewegen lässt.',
            explanation: 'Sidestick = Steuerknüppel links. Hinten = Nase hoch, vorne = Nase runter.',
            instructorNote: 'Sidestick-Erklärung. Teilnehmer soll ihn mal anfassen.',
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
            atcMessage: 'Ganz kurz von links nach rechts: Links die großen Displays sind deine Fluginstrumente - Geschwindigkeit, Höhe, Lage. In der Mitte oben das ist das Overhead Panel mit Schaltern für Systeme wie Klimaanlage und Hydraulik, das lassen wir heute in Ruhe. Zwischen den Sitzen die zwei Hebel sind die Schubhebel für die Triebwerke. Und das Pedestal darunter hat Funk und Transponder. Für den Start brauchst du eigentlich nur Schubhebel, Sidestick und den Fahrwerk-Hebel.',
            explanation: 'Für den Start relevant: Schubhebel, Sidestick, Fahrwerk-Hebel.',
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
            atcMessage: 'Der Fahrwerk-Hebel ist rechts vorne, direkt neben dem unteren Bildschirm in der Mitte. Der sieht aus wie ein kleines Rad. Den brauchst du nachher erst wenn wir in der Luft sind. Aber keine Sorge, ich sag dir genau wann.',
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
            atcMessage: 'Bevor wir loslegen, schalten wir ganz am Anfang die Seat Belt Signs ein. Schau oben aufs Overhead-Panel und stell den Schalter auf ON. Das ist unser Start-Setup, damit alle angeschnallt bleiben.',
            explanation: 'Seat Belt Signs vor dem Start auf ON setzen.',
            instructorNote: 'Seat Belt Signs vor dem Briefing einschalten lassen.',
            buttons: [
                {
                    id: 'seatbelt_on_done',
                    label: 'Seat Belt Signs sind EIN (warte auf Bestätigung)',
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
            simConditionHelpMessage: 'Seat Belt Signs am Overhead-Panel auf ON stellen.',
            simConditionNextPhase: 'briefing',
        },

        // --- Phase 1: Briefing ---
        {
            id: 'briefing',
            atcMessage: 'Okay, kurzes Briefing. Wir stehen auf der Startbahn 25 Center in Frankfurt, einer der längsten Bahnen Europas. Unser Plan: Du schiebst die Schubhebel nach vorne, wir beschleunigen, bei 140 Knoten ziehst du den Sidestick nach hinten und wir heben ab. Dann Fahrwerk einfahren und auf 10.000 Fuß steigen. Ich sag dir jeden Handgriff vorher an, du musst dir nichts merken.',
            explanation: 'Startbahn 25C, Frankfurt. Ziel: 10.000 Fuß (ca. 3 km Höhe).',
            instructorNote: 'Briefing Phase. Zusammenfassung der Schritte.',
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
            atcMessage: 'Der Start selbst dauert nur ein paar Minuten. Mit Erklärungen rechne so mit 10 bis 15 Minuten insgesamt. Wir gehen in deinem Tempo, kein Stress.',
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
            atcMessage: 'Gar kein Problem! Wir sind im Simulator, hier kann nichts kaputtgehen. Wenn du was falsch machst, korrigieren wir es einfach. Im schlimmsten Fall starten wir die Situation nochmal. Das ist ja genau der Sinn vom Simulator, üben ohne Risiko.',
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
            atcMessage: 'So, wir stehen auf der Startbahn. Schau mal auf den linken Bildschirm vor dir, das ist dein Primary Flight Display. Die gelbe Bandanzeige links zeigt die Geschwindigkeit in Knoten, rechts die Höhe in Fuß. In der Mitte siehst du den künstlichen Horizont, der zeigt dir die Fluglage. Gerade steht alles auf Null, logisch, wir stehen ja noch. Jetzt leg mal deine rechte Hand auf die Schubhebel in der Mitte.',
            explanation: 'PFD: Speed-Tape links, Altitude rechts, Fluglage in der Mitte. Hand an die Schubhebel.',
            instructorNote: 'Teilnehmer soll die Instrumente lesen und die Schubhebel finden.',
            buttons: [
                {
                    id: 'see_runway',
                    label: 'Hand liegt auf den Hebeln',
                    icon: 'mdi-hand-pointing-right',
                    next: 'engines_pre',
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
            atcMessage: 'Die Schubhebel sind die zwei Hebel zwischen den Sitzen, auf dem Mittelpedestal. Sie stehen gerade auf Leerlauf, also ganz hinten. Gleich schiebst du sie nach vorne. Leg mal eine Hand drauf, damit du weißt wie sie sich anfühlen.',
            buttons: [
                {
                    id: 'see_now',
                    label: 'Hab sie, weiter!',
                    icon: 'mdi-hand-pointing-right',
                    next: 'engines_pre',
                    type: 'primary'
                },
            ],
            sounds: [],
        },

        // --- Phase 3: Engine Spool Up ---
        {
            id: 'engines_pre',
            atcMessage: 'Gut. Jetzt zum Schub setzen. Du schiebst gleich die Schubhebel zügig nach vorne bis etwa zur Hälfte des Wegs. Schau dabei auf den Bildschirm oben in der Mitte, da siehst du die N1-Anzeige. Das ist die Drehzahl der Triebwerke in Prozent. Wir brauchen ungefähr 65 Prozent für den Start. Bereit?',
            explanation: 'Schubhebel nach vorne schieben. Ziel: N1 ca. 65%.',
            instructorNote: 'Vor Schub-Erhöhung. Erklären wo N1 abzulesen ist.',
            buttons: [
                {
                    id: 'engines_ready',
                    label: 'Bereit, Schub setzen!',
                    icon: 'mdi-engine',
                    next: 'engines_spool',
                    type: 'primary'
                },
                {
                    id: 'engines_nervous',
                    label: 'Was ist N1?',
                    icon: 'mdi-help-circle',
                    next: 'engines_loud_info',
                    type: 'info'
                },
            ],
            sounds: [],
        },
        {
            id: 'engines_loud_info',
            atcMessage: 'N1 ist die Drehzahl des vorderen Fans im Triebwerk, angegeben in Prozent der maximalen Drehzahl. Bei 85 Prozent haben wir genug Schub für den Start. Du siehst die Anzeige auf dem oberen mittleren Display, zwei runde Anzeigen für das linke und rechte Triebwerk. Wenn du die Hebel nach vorne schiebst, steigen die Werte.',
            buttons: [
                {
                    id: 'engines_ok',
                    label: 'Verstanden, Schub setzen!',
                    icon: 'mdi-engine',
                    next: 'engines_spool',
                    type: 'primary'
                },
            ],
            sounds: [],
        },
        {
            id: 'engines_spool',
            atcMessage: 'Los, schieb die Hebel jetzt nach vorne! Schön zügig. Schau auf die N1-Anzeige oben... die Werte steigen. Wir wollen so auf 85 Prozent kommen. Wenn der Schub steht, lösen wir die Parkbremse. Die Parkbremse ist der Hebel mit dem P unten am Pedestal, den ziehst du raus.',
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
            simConditionHelpMessage: 'Schub-Hebel nach vorne schieben bis N1 bei etwa 65 Prozent. Dann die Parkbremse lösen.',
            simConditionNextPhase: 'takeoff_roll',
        },
        {
            id: 'engines_loud_comfort',
            atcMessage: 'Die Parkbremse ist unten am Pedestal, zwischen den Sitzen, etwas weiter vorne. Ein kleiner Hebel mit einem P drauf. Den ziehst du einfach raus oder drückst ihn, je nach Sim-Modell. Sobald die Bremse gelöst ist, rollt das Flugzeug los.',
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
            atcMessage: 'Kein Stress, machen wir Schritt für Schritt. Erstens: Schubhebel nach vorne bis die N1 auf etwa 85 steht. Zweitens: Parkbremse lösen. Mehr ist es nicht. Probier es in Ruhe.',
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
            atcMessage: 'Wir rollen! Das Flugzeug beschleunigt jetzt auf der Bahn. Schau auf das Speed-Tape links auf deinem Display, die Geschwindigkeit steigt. Halte das Flugzeug mit den Ruderpedalen auf der Mittellinie. Die Pedale unten an deinen Füßen, links und rechts. Leichte Korrekturen reichen. Bei 140 Knoten sage ich dir Bescheid, dann ziehst du den Sidestick.',
            explanation: 'Ruderpedal für Richtung halten. Bei 140 Knoten rotieren.',
            instructorNote: 'Startlauf. Teilnehmer hält Richtung mit Pedalen. Speed-Tape beobachten.',
            buttons: [
                {
                    id: 'roll_continue',
                    label: 'Speed steigt!',
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
            simConditionHelpMessage: 'Warte bis die Geschwindigkeit 140 Knoten erreicht. Schau auf den Speed-Tape links am Display.',
            simConditionNextPhase: 'rotation',
        },
        {
            id: 'roll_rumble_explain',
            atcMessage: 'Die Ruderpedal sind die zwei Pedale unten am Boden bei deinen Füßen. Die funktionieren wie beim Auto-Lenken, nur mit den Füßen. Linkes Pedal drücken lenkt nach links, rechtes nach rechts. Beim Rollen auf der Bahn halten die das Bugrad gerade. Nur sanfte Korrekturen, nicht treten!',
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
            atcMessage: 'Das ist normal am Anfang. Nur ganz leicht gegentreten, kleine Bewegungen reichen. Nicht ruckartig, sondern sanft. Das Flugzeug reagiert mit etwas Verzögerung. Schau geradeaus auf die Mittellinie der Bahn und halte die Pedale ruhig. Überkorrekturen sind der typische Anfängerfehler.',
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
            atcMessage: 'Okay, ganz einfach: Füße locker auf die Pedale, Blick geradeaus auf die Mittelmarkierung der Bahn. Wenn die Nase nach links zieht, rechtes Pedal ein klein bisschen drücken. Und umgekehrt. So hältst du die Richtung auf der Bahn.',
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
            atcMessage: 'Rotate! Jetzt den Sidestick sanft nach hinten ziehen! Nicht ruckartig, sondern gleichmäßig. Schau auf den Horizont auf deinem Display, die Nase geht hoch. Wir wollen etwa 15 Grad Pitch, das siehst du an der gelben Markierung über dem Horizont. Gut so, wir heben ab!',
            explanation: 'Sidestick nach hinten ziehen. Ziel: ca. 15° Pitch (Nase hoch).',
            instructorNote: 'Rotation. Teilnehmer zieht Sidestick. Pitch-Guidance beachten.',
            buttons: [
                {id: 'rotation_wow', label: 'Wir fliegen!', icon: 'mdi-star', next: 'gear_retract', type: 'primary'},
                {
                    id: 'rotation_belly',
                    label: 'Wie viel Pitch?',
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
                    // und auf 1500ft sein einfach um mehr zeit zu haben
                    {variable: 'PLANE_ALTITUDE', operator: '>', value: 1500},
                ],
                logic: 'AND',
            },
            simConditionTimeoutMs: 15000,
            simConditionHelpMessage: 'Sidestick sanft nach hinten ziehen bis die Nase hochgeht.',
            simConditionNextPhase: 'gear_retract',
        },
        {
            id: 'rotation_belly_explain',
            atcMessage: 'Auf deinem PFD siehst du den künstlichen Horizont in der Mitte. Da sind Linien mit Zahlen dran, die zeigen den Pitch-Winkel. 15 Grad heißt die Flugzeugmarkierung steht zwei Striche über dem Horizont. Zu viel Pitch und wir werden zu langsam, zu wenig und wir steigen kaum. 15 Grad ist der Sweet Spot für den A320.',
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
            atcMessage: 'Sehr gut, wir sind in der Luft! Jetzt brauchen wir die Räder nicht mehr. Siehst du den Fahrwerk-Hebel rechts neben dem unteren Display in der Mitte? Der mit dem kleinen Rad-Symbol? Den schiebst du jetzt nach oben auf UP. Damit fahren die Räder in den Rumpf ein und wir haben weniger Luftwiderstand.',
            explanation: 'Fahrwerk-Hebel auf UP. Reduziert Luftwiderstand im Steigflug.',
            instructorNote: 'Fahrwerk einfahren. Teilnehmer betätigt Gear-Lever.',
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
                    instructorAlert: 'Teilnehmer findet Gear-Lever nicht'
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
            simConditionHelpMessage: 'Fahrwerk-Hebel nach oben schieben. Der Hebel ist links neben dem Mitteldisplay.',
            simConditionNextPhase: 'climb',
        },
        {
            id: 'gear_explain',
            atcMessage: 'Der Fahrwerk-Hebel ist am Instrumentenpanel in der Mitte, rechts neben dem unteren Bildschirm. Sieht aus wie ein kleines Rad an einem Hebel. Drei Positionen: DOWN unten, OFF Mitte, UP oben. Schieb ihn ganz nach oben auf UP. Du hörst dann ein Rumpeln, das sind die Räder die einfahren und die Klappen die sich schließen.',
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
            atcMessage: 'Perfekt, Fahrwerk ist drin. Jetzt steigen wir weiter. Halte den Sidestick so, dass der Pitch bei etwa 15 Grad bleibt. Schau auf dein Speed-Tape links, wir wollen die Geschwindigkeit bei etwa 200 Knoten halten. Wenn die Speed zu hoch wird, Nase etwas höher. Wenn sie zu niedrig wird, Nase etwas senken. Das ist das Grundprinzip vom Fliegen: Pitch kontrolliert die Geschwindigkeit.',
            explanation: 'Pitch halten für ca. 200 Knoten. Pitch hoch = langsamer, Pitch runter = schneller.',
            instructorNote: 'Steigflug. Teilnehmer lernt Pitch-Speed-Zusammenhang.',
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
                    label: 'Die Speed schwankt stark',
                    icon: 'mdi-swap-vertical',
                    next: 'climb_queasy_comfort',
                    type: 'comfort',
                    instructorAlert: 'Teilnehmer hat Probleme mit Speed-Kontrolle'
                },
            ],
            sounds: [
                {id: 'engine-cruise', action: 'crossfade', volume: 0.3},
                {id: 'wind-high', action: 'crossfade', volume: 0.25},
            ],
            simConditions: {
                conditions: [
                    {variable: 'PLANE_ALTITUDE', operator: '>', value: 5000},
                    {variable: 'VERTICAL_SPEED', operator: '>', value: 1000},
                ],
                logic: 'AND',
            },
            simConditionTimeoutMs: 30000,
            simConditionHelpMessage: 'Steigrate erhöhen auf etwa 2000 Fuß pro Minute. Sidestick leicht nach hinten halten.',
            simConditionNextPhase: 'climb_high',
        },
        {
            id: 'climb_height_info',
            atcMessage: 'Schau auf das Altitude-Tape rechts auf deinem PFD. Da siehst du die aktuelle Höhe in Fuß. Wir wollen auf 10.000 Fuß, also noch ein Stück. Oben rechts siehst du auch den vorgewählten Zielwert. Einfach weiter steigen!',
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
            atcMessage: 'Das ist völlig normal am Anfang. Der Trick ist: Nicht ständig am Sidestick korrigieren. Stell den Pitch ein und lass ihn stehen. Kleine Schwankungen gleicht das Flugzeug selbst aus. Wenn die Speed 10 Knoten daneben liegt, dann eine kleine Korrektur. Weniger ist mehr beim Fliegen.',
            instructorNote: 'Speed-Kontrolle Probleme. Auf Over-Controlling hinweisen.',
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
            atcMessage: 'Also, das Grundprinzip: Der Schub ist fest eingestellt und bleibt wo er ist. Mit dem Sidestick steuerst du den Pitch, also wie steil die Nase nach oben zeigt. Mehr Pitch bedeutet mehr Steigrate, aber die Geschwindigkeit sinkt. Weniger Pitch bedeutet weniger Steigrate, dafür wird die Geschwindigkeit höher. Deine Aufgabe ist den Pitch so zu halten, dass die Speed bei ungefähr 200 Knoten bleibt.',
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
            atcMessage: 'Sehr gut, wir kommen unserem Ziel näher! Schau auf den Höhenmesser rechts. Noch ein paar Tausend Fuß. Halte den Pitch stabil, die Speed passt. Gleich bei 10.000 Fuß drückst du die Nase langsam nach vorne in den Geradeausflug.',
            explanation: 'Weiter steigen bis 10.000 Fuß. Dann Nase senken für Reiseflug.',
            instructorNote: 'Kurz vor Level-off. Nächste Aktion ankündigen.',
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
            atcMessage: '10.000 Fuß! Jetzt drückst du den Sidestick langsam nach vorne bis die Steigrate auf dem Variometer auf Null steht. Das Variometer ist die vertikale Geschwindigkeitsanzeige rechts neben dem Altitude-Tape. Wir wollen jetzt geradeaus fliegen, nicht mehr steigen. Gut so! Du fliegst jetzt einen Airbus A320 auf 10.000 Fuß. Sobald wir stabil sind, schalten wir gleich die Seat Belt Signs wieder aus.',
            explanation: 'Level-off: Sidestick nach vorne bis Vertical Speed nahe Null.',
            instructorNote: 'Level-off erreicht. Teilnehmer bringt V/S auf Null.',
            buttons: [
                {
                    id: 'debrief_cool',
                    label: 'Das war genial!',
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
                {id: 'debrief_again', label: 'Nochmal!', icon: 'mdi-refresh', next: 'seatbelt_off', type: 'info'},
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
            atcMessage: 'Perfekt, wir cruisen stabil auf 10.000 Fuß. Jetzt kannst du die Seat Belt Signs wieder ausschalten. Schalter auf OFF, dann geht es in die Nachbesprechung.',
            explanation: 'Nach stabilem Cruise auf 10.000 Fuß Seat Belt Signs auf OFF setzen.',
            instructorNote: 'Nach erfolgreichem 10.000-Fuß-Level-off Seat Belt Signs ausschalten lassen.',
            buttons: [
                {
                    id: 'seatbelt_off_done',
                    label: 'Seat Belt Signs sind AUS (warte auf Bestätigung)',
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
            simConditionHelpMessage: 'Seat Belt Signs am Overhead-Panel wieder auf OFF stellen.',
            simConditionNextPhase: 'debrief',
        },
        {
            id: 'debrief',
            atcMessage: 'Stark! Du hast gerade einen kompletten Takeoff im A320 geflogen. Schub gesetzt, beschleunigt, rotiert, abgehoben, Fahrwerk eingefahren und auf 10.000 Fuß gestiegen. Das ist genau die Prozedur die echte Piloten bei jedem Start durchführen. Jetzt weißt du was vorne im Cockpit passiert wenn du als Passagier einsteigst.',
            explanation: 'Takeoff-Prozedur abgeschlossen. Schub, Rotation, Gear, Climb, Level-off.',
            instructorNote: 'Debriefing. Zusammenfassung der Schritte. Nachbesprechung im Raum.',
            buttons: [
                {id: 'restart', label: 'Nochmal von vorne', icon: 'mdi-refresh', next: 'welcome', type: 'info'},
                {id: 'finish', label: 'Fertig - danke!', icon: 'mdi-check-circle', next: 'end', type: 'primary'},
            ],
            sounds: [],
        },
        {
            id: 'debrief_restart',
            atcMessage: 'Sehr gerne! Beim zweiten Mal achtest du schon viel mehr auf die Details. Viele Profis sagen: Beim ersten Mal verstehst du was du tust, beim zweiten Mal lernst du es richtig.',
            buttons: [
                {id: 'yes_restart', label: 'Ja, nochmal!', icon: 'mdi-refresh', next: 'welcome', type: 'primary'},
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
            atcMessage: 'Klar, gönn dir ne Minute. War viel auf einmal. Das Flugzeug fliegt jetzt von alleine geradeaus, du kannst loslassen.',
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
                    label: 'Nochmal starten',
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
            atcMessage: 'Super Session! Du hast heute gelernt wie ein Startvorgang im A320 funktioniert: Schub setzen, auf der Bahn halten, bei 140 Knoten rotieren, Fahrwerk einfahren, steigen, und auf Reiseflughöhe leveln. Genau so machen es die Profis. Bis zum nächsten Mal!',
            explanation: 'Szenario beendet. Du kannst jederzeit nochmal üben.',
            instructorNote: 'Szenario beendet. Nachbesprechung im Raum.',
            buttons: [
                {id: 'restart_final', label: 'Nochmal starten', icon: 'mdi-refresh', next: 'welcome', type: 'info'},
            ],
            sounds: [
                {id: 'engine-cruise', action: 'stop'},
                {id: 'wind-high', action: 'stop'},
            ],
        },
    ],
}
