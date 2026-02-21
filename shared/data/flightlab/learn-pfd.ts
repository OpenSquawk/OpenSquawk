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
        atcMessage: 'Das hier ist der künstliche Horizont. Blau ist der Himmel, braun ist der Boden. Genau wie draußen. Beweg jetzt den Stick ganz sanft nach links — nur ein kleines bisschen. Im echten Flugzeug macht man immer nur kleine, sanfte Bewegungen.',
        explanation: 'Der künstliche Horizont zeigt dir die Lage des Flugzeugs im Raum.',
        visibleElements: ['attitude'],
        layoutMode: 'model-focus',
        interactionGoal: { parameter: 'bankAngle', target: -10, tolerance: 8, holdMs: 1500 },
        goalTimeoutMs: 20000,
        goalHint: 'Drück den Stick ganz leicht nach links. Nur ein kleiner Ausschlag reicht.',
        autoAdvanceAfterTTS: false,
        buttons: [
            { id: 'skip_horizon', label: 'Weiter', icon: 'mdi-arrow-right', next: 'pitch_intro', type: 'primary' },
        ],
    },

    // --- Phase 3: Horizon Roll Right ---
    {
        id: 'horizon_roll_right',
        atcMessage: 'Perfekt! Jetzt ganz sanft in die andere Richtung — Stick leicht nach rechts.',
        visibleElements: ['attitude'],
        layoutMode: 'model-focus',
        interactionGoal: { parameter: 'bankAngle', target: 10, tolerance: 8, holdMs: 1500 },
        goalTimeoutMs: 15000,
        goalHint: 'Stick ganz leicht nach rechts. Kleine, sanfte Bewegungen.',
        buttons: [
            { id: 'skip_roll', label: 'Weiter', icon: 'mdi-arrow-right', next: 'pitch_intro', type: 'primary' },
        ],
    },

    // --- Phase 4: Pitch Intro (pitch up) ---
    {
        id: 'pitch_intro',
        atcMessage: 'Jetzt kommt was Wichtiges. Zieh den Stick ganz leicht nach hinten. Nur ein kleines bisschen. Das Besondere beim Airbus: Wenn du loslässt, hält er die Lage. Und das Flugzeug reagiert langsam — du musst immer vorausdenken.',
        explanation: 'Beim Airbus steuert der Stick nicht direkt die Ruder, sondern wie stark das Flugzeug steigen oder sinken soll.',
        visibleElements: ['attitude'],
        layoutMode: 'model-focus',
        interactionGoal: { parameter: 'pitch', target: 4, tolerance: 3, holdMs: 2000 },
        goalTimeoutMs: 20000,
        goalHint: 'Zieh den Stick nur ganz leicht nach hinten. Beim echten Airbus macht man nur minimale Bewegungen.',
        buttons: [
            { id: 'skip_pitch', label: 'Weiter', icon: 'mdi-arrow-right', next: 'pitch_down', type: 'primary' },
        ],
    },

    // --- Phase 5: Pitch Down ---
    {
        id: 'pitch_down',
        atcMessage: 'Gut gemacht! Jetzt drück den Stick ganz leicht nach vorne. Auch hier gilt: kleine Bewegungen, und Geduld — das Flugzeug braucht ein paar Sekunden bis es reagiert.',
        visibleElements: ['attitude'],
        layoutMode: 'model-focus',
        interactionGoal: { parameter: 'pitch', target: -3, tolerance: 3, holdMs: 1500 },
        goalTimeoutMs: 15000,
        goalHint: 'Stick ganz leicht nach vorne drücken und warten. Das Flugzeug reagiert mit Verzögerung.',
        buttons: [
            { id: 'skip_pitch_down', label: 'Weiter', icon: 'mdi-arrow-right', next: 'speed_intro', type: 'primary' },
        ],
    },

    // --- Phase 6: Speed Intro (set throttle) ---
    {
        id: 'speed_intro',
        atcMessage: 'Links erscheint jetzt das Speed Tape. Erster Schritt: Setz den Schubhebel sauber auf siebzig Prozent.',
        explanation: 'Wir stabilisieren zuerst den Schub auf 70%, bevor wir Geschwindigkeit über Pitch kontrollieren.',
        visibleElements: ['attitude', 'speedTape'],
        layoutMode: 'split',
        interactionGoal: { parameter: 'throttlePercent', target: 70, tolerance: 4, holdMs: 1500 },
        goalTimeoutMs: 20000,
        goalHint: 'Schubhebel auf die 70%-Marke setzen und kurz halten.',
        buttons: [
            { id: 'skip_speed', label: 'Weiter', icon: 'mdi-arrow-right', next: 'speed_explain', type: 'primary' },
        ],
    },

    // --- Phase 7a: Speed Explain ---
    {
        id: 'speed_explain',
        atcMessage: 'Bevor wir loslegen, eine wichtige Regel: Beim Airbus kontrollierst du die Geschwindigkeit mit der Nase. Nase hoch — du wirst langsamer. Nase runter — du wirst schneller. Der Schub bleibt dabei immer gleich. Das nennt man Energie-Management.',
        explanation: 'Im echten Flug hält der Autopilot den Schub konstant. Der Pilot steuert die Geschwindigkeit über den Pitch.',
        visibleElements: ['attitude', 'speedTape'],
        layoutMode: 'split',
        buttons: [
            { id: 'understood', label: 'Verstanden', icon: 'mdi-check', next: 'speed_hold_coarse', type: 'primary' },
        ],
    },

    // --- Phase 7b: Speed Hold Coarse ---
    {
        id: 'speed_hold_coarse',
        atcMessage: 'Gut, Schub steht. Jetzt versuch die Geschwindigkeit in den türkisen Bereich zu bringen. Nase ganz leicht hoch oder runter — und dann warten. Das Flugzeug braucht mehrere Sekunden bis sich die Speed ändert.',
        explanation: 'Erste Annäherung: Bringe die Speed grob in den Zielbereich.',
        visibleElements: ['attitude', 'speedTape'],
        layoutMode: 'split',
        interactionGoal: { parameter: 'speed', target: 225, tolerance: 10, holdMs: 5000 },
        speedTargetRange: { min: 215, max: 235 },
        goalTimeoutMs: 30000,
        goalHint: 'Korrigiere nur mit ganz kleinen Pitch-Bewegungen. Die Speed ändert sich langsam — hab Geduld.',
        autoAdvanceAfterTTS: false,
        buttons: [
            { id: 'skip_coarse', label: 'Weiter', icon: 'mdi-arrow-right', next: 'speed_hold_fine', type: 'primary' },
        ],
    },

    // --- Phase 7c: Speed Hold Fine ---
    {
        id: 'speed_hold_fine',
        atcMessage: 'Sehr gut! Jetzt genauer. Halte die Geschwindigkeit möglichst exakt auf 225 Knoten. Nur winzige Korrekturen — und immer ein paar Sekunden warten bevor du nachkorrigierst.',
        explanation: 'Feinsteuerung: Präzise Speed-Kontrolle mit minimalen Pitch-Änderungen.',
        visibleElements: ['attitude', 'speedTape'],
        layoutMode: 'split',
        interactionGoal: { parameter: 'speed', target: 225, tolerance: 5, holdMs: 8000 },
        speedTargetRange: { min: 220, max: 230 },
        goalTimeoutMs: 40000,
        goalHint: 'Ganz kleine Pitch-Korrekturen. Warte nach jeder Korrektur 3-4 Sekunden bevor du nachjustierst.',
        autoAdvanceAfterTTS: false,
        buttons: [
            { id: 'skip_fine', label: 'Weiter', icon: 'mdi-arrow-right', next: 'alt_intro', type: 'primary' },
        ],
    },

    // --- Phase 8: Altitude Intro ---
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

    // --- Phase 9: Vertical Speed Intro ---
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

    // --- Phase 10: Heading Intro ---
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

    // --- Phase 11: Combined ---
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

    // --- Phase 12: Free Practice ---
    {
        id: 'free_practice',
        atcMessage: 'Du hast das PFD verstanden. Ab jetzt kannst du frei üben. Experimentier mit dem Stick und dem Schubhebel. Schau dir an, wie alles zusammenhängt.',
        visibleElements: ['attitude', 'speedTape', 'altitudeTape', 'verticalSpeed', 'heading'],
        layoutMode: 'pfd-focus',
        buttons: [
            { id: 'finish', label: 'Fertig!', icon: 'mdi-check-circle', next: 'end', type: 'primary' },
        ],
    },

    // --- Phase 13: End ---
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
