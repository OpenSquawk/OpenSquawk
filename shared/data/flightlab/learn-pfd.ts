// shared/data/flightlab/learn-pfd.ts
import type { LearnPfdScenario, LearnPfdPhase } from './types'

const phases: LearnPfdPhase[] = [
    // --- Phase 1: Welcome ---
    {
        id: 'welcome',
        atcMessage: 'Willkommen. Vor dir ist der Bildschirm, den echte Piloten sehen. Das Primary Flight Display. Noch ist alles dunkel. Aber gleich zeige ich dir Stück für Stück, was hier passiert.',
        visibleElements: [],
        layoutMode: 'model-focus',
        buttons: [
            { id: 'start', label: 'Los gehts!', icon: 'mdi-play', next: 'horizon_intro', type: 'primary' },
        ],
    },

    // --- Phase 2: Horizon Intro (bank left) ---
    {
        id: 'horizon_intro',
        atcMessage: 'Das hier ist der künstliche Horizont. Blau ist der Himmel, braun ist der Boden. Genau wie draußen. Beweg jetzt den Stick nach links — und schau was passiert.',
        explanation: 'Der künstliche Horizont zeigt dir die Lage des Flugzeugs im Raum.',
        visibleElements: ['attitude'],
        layoutMode: 'model-focus',
        interactionGoal: { parameter: 'bankAngle', target: -20, tolerance: 15, holdMs: 1500 },
        goalTimeoutMs: 20000,
        goalHint: 'Versuch den Stick nach links zu drücken. Du solltest sehen, wie sich der Horizont dreht.',
        autoAdvanceAfterTTS: false,
        buttons: [
            { id: 'skip_horizon', label: 'Weiter', icon: 'mdi-arrow-right', next: 'pitch_intro', type: 'primary' },
        ],
    },

    // --- Phase 3: Horizon Roll Right ---
    {
        id: 'horizon_roll_right',
        atcMessage: 'Perfekt! Du hast das Flugzeug nach links geneigt. Jetzt andersrum — Stick nach rechts.',
        visibleElements: ['attitude'],
        layoutMode: 'model-focus',
        interactionGoal: { parameter: 'bankAngle', target: 20, tolerance: 15, holdMs: 1500 },
        goalTimeoutMs: 15000,
        goalHint: 'Stick nach rechts drücken, bis der Horizont sich nach links neigt.',
        buttons: [
            { id: 'skip_roll', label: 'Weiter', icon: 'mdi-arrow-right', next: 'pitch_intro', type: 'primary' },
        ],
    },

    // --- Phase 4: Pitch Intro (pitch up) ---
    {
        id: 'pitch_intro',
        atcMessage: 'Jetzt kommt was Wichtiges. Zieh den Stick leicht nach hinten. Die Nase geht hoch. Und das Besondere beim Airbus: Wenn du loslässt, hält er die Lage. Probier es aus.',
        explanation: 'Beim Airbus steuert der Stick nicht direkt die Ruder, sondern wie stark das Flugzeug steigen oder sinken soll.',
        visibleElements: ['attitude'],
        layoutMode: 'model-focus',
        interactionGoal: { parameter: 'pitch', target: 10, tolerance: 5, holdMs: 2000 },
        goalTimeoutMs: 20000,
        goalHint: 'Zieh den Stick langsam nach hinten. Du siehst die braune Fläche größer werden — das heißt, die Nase zeigt nach oben.',
        buttons: [
            { id: 'skip_pitch', label: 'Weiter', icon: 'mdi-arrow-right', next: 'pitch_down', type: 'primary' },
        ],
    },

    // --- Phase 5: Pitch Down ---
    {
        id: 'pitch_down',
        atcMessage: 'Gut gemacht! Jetzt drück den Stick leicht nach vorne. Die Nase geht runter.',
        visibleElements: ['attitude'],
        layoutMode: 'model-focus',
        interactionGoal: { parameter: 'pitch', target: -5, tolerance: 5, holdMs: 1500 },
        goalTimeoutMs: 15000,
        goalHint: 'Stick nach vorne drücken. Die blaue Fläche wird größer.',
        buttons: [
            { id: 'skip_pitch_down', label: 'Weiter', icon: 'mdi-arrow-right', next: 'speed_intro', type: 'primary' },
        ],
    },

    // --- Phase 6: Speed Intro ---
    {
        id: 'speed_intro',
        atcMessage: 'Links erscheint jetzt das Speed Tape. Das zeigt dir wie schnell du fliegst, in Knoten. Schieb den Schubhebel nach vorne — und schau was mit der Geschwindigkeit passiert.',
        explanation: 'Das Speed Tape zeigt die angezeigte Fluggeschwindigkeit (IAS) in Knoten.',
        visibleElements: ['attitude', 'speedTape'],
        layoutMode: 'split',
        interactionGoal: { parameter: 'speed', target: 280, tolerance: 30, holdMs: 2000 },
        goalTimeoutMs: 20000,
        goalHint: 'Schieb den Schubhebel weiter nach vorne. Die Zahl auf dem Speed Tape sollte steigen.',
        buttons: [
            { id: 'skip_speed', label: 'Weiter', icon: 'mdi-arrow-right', next: 'alt_intro', type: 'primary' },
        ],
    },

    // --- Phase 7: Altitude Intro ---
    {
        id: 'alt_intro',
        atcMessage: 'Rechts kommt jetzt das Altitude Tape. Das zeigt deine Höhe in Fuß. Zieh den Stick leicht nach hinten — du steigst, und die Höhe nimmt zu.',
        explanation: 'Das Altitude Tape zeigt die aktuelle Flughöhe über dem Meeresspiegel.',
        visibleElements: ['attitude', 'speedTape', 'altitudeTape'],
        layoutMode: 'split',
        interactionGoal: { parameter: 'altitude', target: 7000, tolerance: 500, holdMs: 2000 },
        goalTimeoutMs: 25000,
        goalHint: 'Zieh den Stick nach hinten, damit die Nase hoch geht. Dann steigst du und die Höhe nimmt zu.',
        buttons: [
            { id: 'skip_alt', label: 'Weiter', icon: 'mdi-arrow-right', next: 'vs_intro', type: 'primary' },
        ],
    },

    // --- Phase 8: Vertical Speed Intro ---
    {
        id: 'vs_intro',
        atcMessage: 'Neben der Höhe siehst du jetzt die Vertical Speed Anzeige. Die zeigt dir, wie schnell du steigst oder sinkst. Plus heißt steigen, minus heißt sinken. Probier beides aus.',
        explanation: 'Die Vertical Speed zeigt die Steig- oder Sinkrate in Fuß pro Minute.',
        visibleElements: ['attitude', 'speedTape', 'altitudeTape', 'verticalSpeed'],
        layoutMode: 'split',
        interactionGoal: { parameter: 'verticalSpeed', target: 1500, tolerance: 500, holdMs: 2000 },
        goalTimeoutMs: 20000,
        goalHint: 'Zieh den Stick etwas nach hinten. Die VS-Anzeige sollte nach oben ausschlagen.',
        buttons: [
            { id: 'skip_vs', label: 'Weiter', icon: 'mdi-arrow-right', next: 'heading_intro', type: 'primary' },
        ],
    },

    // --- Phase 9: Heading Intro ---
    {
        id: 'heading_intro',
        atcMessage: 'Unten erscheint jetzt das Heading. Das ist dein Kompass — es zeigt in welche Richtung du fliegst. Neig das Flugzeug nach rechts und beobachte, wie sich das Heading ändert.',
        explanation: 'Das Heading Band zeigt die aktuelle Flugrichtung als Kompasskurs.',
        visibleElements: ['attitude', 'speedTape', 'altitudeTape', 'verticalSpeed', 'heading'],
        layoutMode: 'pfd-focus',
        interactionGoal: { parameter: 'heading', target: 90, tolerance: 20, holdMs: 2000 },
        goalTimeoutMs: 30000,
        goalHint: 'Neig den Stick nach rechts und halte ihn. Das Heading sollte sich langsam ändern.',
        buttons: [
            { id: 'skip_heading', label: 'Weiter', icon: 'mdi-arrow-right', next: 'combined', type: 'primary' },
        ],
    },

    // --- Phase 10: Combined ---
    {
        id: 'combined',
        atcMessage: 'Sehr gut! Jetzt hast du alle Instrumente vor dir. Das ist das komplette PFD. Nimm dir einen Moment und spiel damit. Steig auf 8000 Fuß.',
        visibleElements: ['attitude', 'speedTape', 'altitudeTape', 'verticalSpeed', 'heading'],
        layoutMode: 'pfd-focus',
        interactionGoal: { parameter: 'altitude', target: 8000, tolerance: 300, holdMs: 3000 },
        goalTimeoutMs: 40000,
        goalHint: 'Zieh den Stick nach hinten und halte etwas Schub. Die Höhe sollte langsam auf 8000 Fuß steigen.',
        buttons: [
            { id: 'skip_combined', label: 'Weiter', icon: 'mdi-arrow-right', next: 'free_practice', type: 'primary' },
        ],
    },

    // --- Phase 11: Free Practice ---
    {
        id: 'free_practice',
        atcMessage: 'Du hast das PFD verstanden. Ab jetzt kannst du frei üben. Experimentier mit dem Stick und dem Schubhebel. Schau dir an, wie alles zusammenhängt.',
        visibleElements: ['attitude', 'speedTape', 'altitudeTape', 'verticalSpeed', 'heading'],
        layoutMode: 'pfd-focus',
        buttons: [
            { id: 'finish', label: 'Fertig!', icon: 'mdi-check-circle', next: 'end', type: 'primary' },
        ],
    },

    // --- Phase 12: End ---
    {
        id: 'end',
        atcMessage: 'Fantastisch! Du kannst jetzt das PFD eines Airbus A320 lesen. Horizont, Geschwindigkeit, Höhe, Steigrate und Heading — alles klar.',
        visibleElements: ['attitude', 'speedTape', 'altitudeTape', 'verticalSpeed', 'heading'],
        layoutMode: 'pfd-focus',
        buttons: [],
    },
]

export const learnPfd: LearnPfdScenario = {
    id: 'learn-pfd',
    title: 'PFD verstehen',
    description: 'Lerne Schritt für Schritt das Primary Flight Display des Airbus A320 zu lesen.',
    icon: 'mdi-gauge',
    phases,
}
