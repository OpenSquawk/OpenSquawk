# FlightLab Guided Takeoff - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a guided A320 takeoff experience for flight-anxious people, with scripted phases, TTS with radio effects, cockpit sounds, WebSocket instructor sync, and tablet-optimized UI matching the OpenSquawk design.

**Architecture:** Composable-based Vue 3 SFC with scripted scenario data in TypeScript. WebSocket via H3 for instructor-participant sync. Reuses existing TTS pipeline (`/api/atc/say`) and radio effects (`radioEffects.ts`, `pizzicatoLite.ts`). No MongoDB, no auth - pure in-memory demo.

**Tech Stack:** Nuxt 4, Vue 3, Vuetify 3.9, Tailwind CSS, H3 WebSocket, OpenAI TTS, Web Audio API

**Design Doc:** `docs/plans/2025-02-13-flightlab-takeoff-design.md`

---

## Task 1: FlightLab Type Definitions

**Files:**
- Create: `shared/data/flightlab/types.ts`

**Step 1: Create the types file**

```ts
// shared/data/flightlab/types.ts

export interface FlightLabSound {
  id: string
  action: 'play' | 'stop' | 'crossfade'
  volume?: number
  loop?: boolean
}

export interface FlightLabButton {
  id: string
  label: string
  icon?: string
  next: string
  type?: 'primary' | 'comfort' | 'info'
  instructorAlert?: string
}

export interface FlightLabPhase {
  id: string
  atcMessage: string
  explanation?: string
  buttons: FlightLabButton[]
  sounds?: FlightLabSound[]
  instructorNote?: string
  autoAdvanceAfterTTS?: boolean
}

export interface FlightLabScenario {
  id: string
  title: string
  description: string
  icon: string
  aircraft: string
  airport: string
  runway: string
  callsign: string
  phases: FlightLabPhase[]
}

export type FlightLabRole = 'instructor' | 'participant'

export interface FlightLabSessionState {
  sessionCode: string
  scenarioId: string
  currentPhaseId: string
  isPaused: boolean
  startedAt: number
  participantConnected: boolean
  history: Array<{
    phaseId: string
    buttonId: string
    timestamp: number
  }>
}

export type FlightLabWSEvent =
  | { type: 'state-change'; state: FlightLabSessionState }
  | { type: 'instructor-message'; text: string; withRadioEffect: boolean }
  | { type: 'instructor-command'; command: 'pause' | 'resume' | 'restart' | 'skip' | 'back'; targetPhaseId?: string }
  | { type: 'participant-action'; buttonId: string; phaseId: string }
  | { type: 'session-joined'; role: FlightLabRole }
  | { type: 'error'; message: string }
```

**Step 2: Commit**

```bash
git add shared/data/flightlab/types.ts
git commit -m "feat(flightlab): add type definitions for FlightLab scenario engine"
```

---

## Task 2: Takeoff Scenario Data

**Files:**
- Create: `shared/data/flightlab/takeoff-eddf.ts`

**Step 1: Create the scenario file with all phases**

This is the full scripted scenario. Each phase has the warm, empathetic ATC companion voice text (in German), buttons with comfort branches, sound cues, and instructor notes.

```ts
// shared/data/flightlab/takeoff-eddf.ts
import type { FlightLabScenario } from './types'

export const takeoffEddf: FlightLabScenario = {
  id: 'takeoff-eddf',
  title: 'Dein erster Start',
  description: 'Gemeinsam vom Rollfeld in Frankfurt bis auf 10.000 Fuss - Schritt fuer Schritt, in deinem Tempo.',
  icon: 'mdi-airplane-takeoff',
  aircraft: 'Airbus A320',
  airport: 'Frankfurt (EDDF)',
  runway: '25C',
  callsign: 'Lufthansa 39 Alpha',
  phases: [
    // --- Phase 0: Welcome ---
    {
      id: 'welcome',
      atcMessage: 'Hey! Willkommen im Cockpit. Ich bin dein Begleiter heute, du kannst mich jederzeit alles fragen. Erstmal, sitz bequem? Kopfhoerer passen gut? Schau dich ruhig mal um. Sieht wild aus mit den ganzen Knoepfen, oder? Keine Sorge, wir brauchen heute fast nichts davon. Ich sag dir genau was du anfassen musst.',
      explanation: 'Du sitzt im Cockpit eines Airbus A320 am Flughafen Frankfurt. Nimm dir Zeit, dich umzuschauen.',
      instructorNote: 'Teilnehmer ist gerade angekommen. Koerpersprache beobachten. Bei sichtbarer Anspannung ggf. eingreifen.',
      buttons: [
        { id: 'ready', label: 'Ja, bin bereit!', icon: 'mdi-check-circle', next: 'briefing', type: 'primary' },
        { id: 'nervous', label: 'Mir ist etwas mulmig', icon: 'mdi-emoticon-neutral', next: 'welcome_comfort', type: 'comfort', instructorAlert: 'Teilnehmer ist nervoes' },
        { id: 'tellmore', label: 'Erzaehl mir erstmal mehr', icon: 'mdi-information', next: 'welcome_detail', type: 'info' },
      ],
      sounds: [],
    },
    {
      id: 'welcome_comfort',
      atcMessage: 'Das ist voellig okay, und total normal! Jeder der hier zum ersten Mal sitzt, dem gehts genauso. Weisst du was, lass uns kurz zusammen durchatmen. Einmal tief einatmen... und langsam wieder aus. Nochmal. Gut so. Wir machen hier alles in deinem Tempo. Du bestimmst wann es weitergeht, okay?',
      explanation: 'Atme ruhig ein und aus. Es gibt keinen Zeitdruck.',
      instructorNote: 'Teilnehmer hat Nervositaet signalisiert. Aufmerksam bleiben.',
      buttons: [
        { id: 'ready_after_comfort', label: 'Okay, ich bin bereit', icon: 'mdi-check-circle', next: 'briefing', type: 'primary' },
        { id: 'still_nervous', label: 'Noch einen Moment', icon: 'mdi-timer-sand', next: 'welcome_comfort_2', type: 'comfort' },
      ],
      sounds: [],
    },
    {
      id: 'welcome_comfort_2',
      atcMessage: 'Kein Problem, nimm dir alle Zeit die du brauchst. Wusstest du, dass dieser Flieger hier einer der sichersten der Welt ist? Der A320 fliegt seit ueber 35 Jahren und Millionen Menschen fliegen jeden Tag damit. Und heute sitzt du vorne drin, das ist doch was, oder?',
      instructorNote: 'Zweite Nervositaets-Runde. Bei Bedarf muendlich im Raum eingreifen.',
      buttons: [
        { id: 'ready_after_comfort_2', label: 'Okay, starten wir!', icon: 'mdi-check-circle', next: 'briefing', type: 'primary' },
      ],
      sounds: [],
    },
    {
      id: 'welcome_detail',
      atcMessage: 'Klar! Also, wir sitzen hier in einem echten Airbus A320 Cockpit. Das ist der Flugzeugtyp, mit dem du wahrscheinlich schon mal als Passagier geflogen bist. All die Knoepfe und Schalter, die sehen erst ueberwältigend aus, aber die meisten brauchen wir heute gar nicht. Wir machen heute einen Start, von hier auf der Startbahn bis auf 3 Kilometer Hoehe. Ich erklaer dir alles Schritt fuer Schritt.',
      buttons: [
        { id: 'ready_after_detail', label: 'Alles klar, weiter!', icon: 'mdi-check-circle', next: 'briefing', type: 'primary' },
        { id: 'questions', label: 'Ich hab noch Fragen', icon: 'mdi-help-circle', next: 'welcome_questions', type: 'info' },
      ],
      sounds: [],
    },
    {
      id: 'welcome_questions',
      atcMessage: 'Frag ruhig! Wenn du was ueber einen bestimmten Knopf wissen willst, zeig einfach drauf, oder frag mich einfach. Wir haben alle Zeit der Welt.',
      buttons: [
        { id: 'ready_after_questions', label: 'Okay, bin bereit!', icon: 'mdi-check-circle', next: 'briefing', type: 'primary' },
      ],
      sounds: [],
    },

    // --- Phase 1: Briefing ---
    {
      id: 'briefing',
      atcMessage: 'Okay, ich erklaer dir kurz was wir heute machen. Wir stehen hier auf der Startbahn 25 Center in Frankfurt. Das ist eine der laengsten Startbahnen in Europa, ueber 4 Kilometer lang. Wir werden gemeinsam starten und ganz gemuetlich auf 10.000 Fuss steigen, das sind ungefaehr 3 Kilometer Hoehe. Ich sag dir jeden einzelnen Schritt vorher an. Du musst nichts wissen und nichts auswendig koennen. Ich bin die ganze Zeit da.',
      explanation: 'Startbahn 25C, Frankfurt. Ziel: 10.000 Fuss (ca. 3 km Hoehe).',
      instructorNote: 'Briefing Phase. Teilnehmer sollte aufmerksam zuhoeren.',
      buttons: [
        { id: 'lets_go', label: 'Okay, los gehts!', icon: 'mdi-play-circle', next: 'runway', type: 'primary' },
        { id: 'how_long', label: 'Wie lange dauert das?', icon: 'mdi-clock', next: 'briefing_duration', type: 'info' },
        { id: 'what_if', label: 'Was wenn was schiefgeht?', icon: 'mdi-shield-check', next: 'briefing_safety', type: 'info' },
      ],
      sounds: [],
    },
    {
      id: 'briefing_duration',
      atcMessage: 'Das Ganze dauert ungefaehr 10 bis 15 Minuten, aber wie gesagt, wir gehen in deinem Tempo. Wenn du irgendwo eine Pause brauchst, sag einfach Bescheid.',
      buttons: [
        { id: 'go_after_duration', label: 'Gut, los gehts!', icon: 'mdi-play-circle', next: 'runway', type: 'primary' },
      ],
      sounds: [],
    },
    {
      id: 'briefing_safety',
      atcMessage: 'Gute Frage! Erstens: Wir sind hier in einem Simulator, es kann wirklich ueberhaupt nichts passieren. Zweitens: Im echten Flugzeug gibt es fuer alles doppelte und dreifache Sicherheitssysteme. Die Piloten trainieren genau solche Situationen regelmaessig. Aber heute hier ist alles sicher, versprochen.',
      buttons: [
        { id: 'go_after_safety', label: 'Okay, dann los!', icon: 'mdi-play-circle', next: 'runway', type: 'primary' },
      ],
      sounds: [],
    },

    // --- Phase 2: On the Runway ---
    {
      id: 'runway',
      atcMessage: 'So, wir stehen jetzt auf der Startbahn. Schau mal nach vorne durch die Scheibe. Siehst du die Lichter auf der Bahn? Die gruenen und die weissen? Da entlang gehts gleich. Links und rechts ist Gras, vor uns die lange Bahn. Die Bahn ist fast so breit wie eine Autobahn. Alles ganz sicher hier.',
      explanation: 'Schau nach vorne - die Lichter zeigen die Startbahn.',
      instructorNote: 'Teilnehmer orientiert sich auf der Bahn. Sicherstellen dass er/sie nach vorne schaut.',
      buttons: [
        { id: 'see_runway', label: 'Ja, ich seh die Bahn!', icon: 'mdi-eye', next: 'engines_pre', type: 'primary' },
        { id: 'where_look', label: 'Wo genau soll ich hinschauen?', icon: 'mdi-help-circle', next: 'runway_help', type: 'info' },
      ],
      sounds: [
        { id: 'engine-idle', action: 'play', volume: 0.15, loop: true },
      ],
    },
    {
      id: 'runway_help',
      atcMessage: 'Schau geradeaus durch die grosse Scheibe vor dir. Du siehst einen langen grauen Streifen, das ist die Startbahn. Darauf sind weisse Striche und am Rand gruene Lichter. Ganz am Ende siehst du vielleicht Baeume oder Gebaeude, da ist das Ende der Bahn.',
      buttons: [
        { id: 'see_now', label: 'Ah ja, jetzt seh ichs!', icon: 'mdi-eye', next: 'engines_pre', type: 'primary' },
      ],
      sounds: [],
    },

    // --- Phase 3: Engine Spool Up ---
    {
      id: 'engines_pre',
      atcMessage: 'Okay, jetzt kommt der spannende Teil! Gleich werden die Triebwerke hochgefahren. Das wird lauter, aber das ist voellig normal. Die Triebwerke sind die zwei grossen runden Duesen unter den Fluegeln. Das Geraeusch kennst du vom Fliegen als Passagier, nur hoerst du es jetzt von vorne. Bist du bereit?',
      explanation: 'Gleich wird es lauter - die Triebwerke werden hochgefahren.',
      instructorNote: 'Vor Schub-Erhoehung. Auf Anspannung achten.',
      buttons: [
        { id: 'engines_ready', label: 'Ja, Triebwerke an!', icon: 'mdi-engine', next: 'engines_spool', type: 'primary' },
        { id: 'engines_nervous', label: 'Wird das sehr laut?', icon: 'mdi-volume-high', next: 'engines_loud_info', type: 'info' },
      ],
      sounds: [],
    },
    {
      id: 'engines_loud_info',
      atcMessage: 'Es wird deutlich lauter, ja. Ungefaehr so wie wenn du auf der Autobahn das Fenster aufmachst. Deine Kopfhoerer daempfen das etwas. Und du wirst merken, nach ein paar Sekunden gewoehnt man sich daran. Das Geraeusch ist Power, die Triebwerke arbeiten fuer uns.',
      buttons: [
        { id: 'engines_ok', label: 'Okay, mach die Triebwerke an', icon: 'mdi-engine', next: 'engines_spool', type: 'primary' },
      ],
      sounds: [],
    },
    {
      id: 'engines_spool',
      atcMessage: 'Schub wird gesetzt! Hoerst du wie es lauter wird? Das Pfeifen und Brummen, das sind die Triebwerke die auf volle Leistung gehen. Spuerst du wie es dich ganz leicht in den Sitz drueckt? Das ist die Kraft der Triebwerke. Alles voellig normal.',
      explanation: 'Die Triebwerke laufen auf voller Leistung. Du spuerst den Schub.',
      instructorNote: 'Schub gesetzt. Engine Sound laeuft. Auf Reaktion achten.',
      buttons: [
        { id: 'engines_continue', label: 'Okay, weiter!', icon: 'mdi-arrow-right-circle', next: 'takeoff_roll', type: 'primary' },
        { id: 'engines_loud', label: 'Das ist ganz schoen laut!', icon: 'mdi-volume-high', next: 'engines_loud_comfort', type: 'comfort' },
        { id: 'engines_pause', label: 'Kurz pausieren', icon: 'mdi-pause-circle', next: 'engines_pause_phase', type: 'comfort', instructorAlert: 'Teilnehmer braucht Pause bei Triebwerk-Phase' },
      ],
      sounds: [
        { id: 'engine-idle', action: 'stop' },
        { id: 'engine-spool', action: 'play', volume: 0.5, loop: false },
        { id: 'engine-cruise', action: 'play', volume: 0.4, loop: true },
      ],
    },
    {
      id: 'engines_loud_comfort',
      atcMessage: 'Ja, das ist ordentlich Power! Aber weisst du was cool ist? Das Geraeusch bedeutet dass alles perfekt laeuft. Wenn die Triebwerke leise waeren, dann wuerde was fehlen. Laut heisst hier: alles gut, wir haben Schub. Du machst das super!',
      buttons: [
        { id: 'continue_after_loud', label: 'Stimmt, weiter gehts!', icon: 'mdi-arrow-right-circle', next: 'takeoff_roll', type: 'primary' },
      ],
      sounds: [],
    },
    {
      id: 'engines_pause_phase',
      atcMessage: 'Kein Problem! Wir machen eine kurze Pause. Atme ein paar Mal tief durch. Wir rollen hier nicht weg, versprochen. Wenn du bereit bist, gehts weiter.',
      instructorNote: 'Pause angefordert. Ggf. muendlich nachfragen ob alles okay ist.',
      buttons: [
        { id: 'resume_after_pause', label: 'Okay, weiter', icon: 'mdi-play-circle', next: 'takeoff_roll', type: 'primary' },
      ],
      sounds: [],
    },

    // --- Phase 4: Takeoff Roll ---
    {
      id: 'takeoff_roll',
      atcMessage: 'Wir rollen jetzt los! Du spuerst wie es dich staerker in den Sitz drueckt. Das ist nur die Beschleunigung, wie bei einem richtig schnellen Auto. Die Bahn rumpelt ein bisschen unter uns, das sind die Fugen im Beton. Wir werden jetzt schnell schneller. Schau nach vorne auf die Bahn!',
      explanation: 'Der Startlauf beginnt. Das Rumpeln sind die Fugen in der Startbahn.',
      instructorNote: 'Startlauf beginnt. Kritische Phase fuer Angstpatienten. Aufmerksam bleiben.',
      buttons: [
        { id: 'roll_continue', label: 'Weiter!', icon: 'mdi-arrow-right-circle', next: 'rotation', type: 'primary' },
        { id: 'roll_rumble', label: 'Es rumpelt so!', icon: 'mdi-vibrate', next: 'roll_rumble_explain', type: 'info' },
        { id: 'roll_afraid', label: 'Ich hab Angst', icon: 'mdi-emoticon-sad', next: 'roll_afraid_comfort', type: 'comfort', instructorAlert: 'ANGST - Teilnehmer hat Angst beim Startlauf' },
      ],
      sounds: [
        { id: 'runway-rumble', action: 'play', volume: 0.5, loop: true },
        { id: 'wind-low', action: 'play', volume: 0.3, loop: true },
      ],
    },
    {
      id: 'roll_rumble_explain',
      atcMessage: 'Das Rumpeln kommt von den Radern auf der Betonbahn. Die Bahn ist aus einzelnen Betonplatten und dazwischen sind kleine Fugen. Genau wie wenn du mit dem Auto ueber Kopfsteinpflaster faehrst. Das hoert sofort auf wenn wir in der Luft sind, versprochen!',
      buttons: [
        { id: 'rumble_ok', label: 'Alles klar, weiter!', icon: 'mdi-arrow-right-circle', next: 'rotation', type: 'primary' },
      ],
      sounds: [],
    },
    {
      id: 'roll_afraid_comfort',
      atcMessage: 'Hey, das ist voellig okay. Du bist absolut sicher hier. Das Rumpeln hoert gleich auf, sobald wir in der Luft sind. Atme einmal tief ein... und langsam wieder aus. Gut so. Du machst das grossartig. Das was du gerade spuerst, das ist Adrenalin. Das ist dein Koerper der sagt hey, das ist aufregend. Wollen wir weitermachen?',
      instructorNote: 'ANGST-Reaktion beim Startlauf. Muendlich unterstuetzen falls noetig.',
      buttons: [
        { id: 'afraid_continue', label: 'Ja, weiter', icon: 'mdi-check-circle', next: 'rotation', type: 'primary' },
        { id: 'afraid_stop', label: 'Ich brauch noch einen Moment', icon: 'mdi-pause-circle', next: 'roll_pause', type: 'comfort' },
      ],
      sounds: [],
    },
    {
      id: 'roll_pause',
      atcMessage: 'Nimm dir alle Zeit. Du bestimmst das Tempo. Und denk dran: Es ist alles nur Simulation, du bist hier sicher. Wenn du soweit bist, gehts weiter.',
      buttons: [
        { id: 'pause_continue', label: 'Okay, ich bin bereit', icon: 'mdi-play-circle', next: 'rotation', type: 'primary' },
      ],
      sounds: [],
    },

    // --- Phase 5: Rotation ---
    {
      id: 'rotation',
      atcMessage: 'Und jetzt... wir heben ab! Spuerst du das? Das Rumpeln hoert auf! Wir sind in der Luft! Das leichte Kribbeln im Bauch, das kennt jeder, das ist wie bei einer Achterbahn. Schau mal nach rechts oder links raus wenn du magst, du siehst wie der Boden kleiner wird. Frankfurt von oben!',
      explanation: 'Wir haben abgehoben! Das Kribbeln im Bauch ist voellig normal.',
      instructorNote: 'Abheben. Oft emotionaler Moment. Positiv verstaerken.',
      buttons: [
        { id: 'rotation_wow', label: 'Wow!', icon: 'mdi-star', next: 'gear_retract', type: 'primary' },
        { id: 'rotation_belly', label: 'Das Kribbeln im Bauch...', icon: 'mdi-emoticon-neutral', next: 'rotation_belly_explain', type: 'info' },
        { id: 'rotation_continue', label: 'Weiter', icon: 'mdi-arrow-right-circle', next: 'gear_retract', type: 'primary' },
      ],
      sounds: [
        { id: 'runway-rumble', action: 'stop' },
        { id: 'wind-low', action: 'crossfade', volume: 0.0 },
        { id: 'wind-high', action: 'play', volume: 0.35, loop: true },
      ],
    },
    {
      id: 'rotation_belly_explain',
      atcMessage: 'Das Kribbeln kommt daher, dass sich der Winkel aendert. Die Nase geht hoch und du spuerst kurz so eine Leichtigkeit, wie in einem Aufzug der schnell anfaehrt. Das dauert nur ein paar Sekunden und hoert dann auf. Jeder hat das, sogar die Piloten spueren das noch.',
      buttons: [
        { id: 'belly_ok', label: 'Okay, weiter!', icon: 'mdi-arrow-right-circle', next: 'gear_retract', type: 'primary' },
      ],
      sounds: [],
    },

    // --- Phase 6: Gear Retraction ---
    {
      id: 'gear_retract',
      atcMessage: 'Jetzt fahren wir die Raeder ein. Gleich hoerst du ein Geraeusch unter dir. Ein Rumpeln, ein Klacken und dann ein Bumm wenn die Klappen zugehen. Das sind die Raeder die in den Bauch vom Flugzeug hochfahren. Genau das Geraeusch was du als Passagier auch immer hoerst, kurz nach dem Start. Jetzt weisst du was es ist!',
      explanation: 'Die Raeder werden eingefahren. Das Geraeusch ist das Fahrwerk.',
      instructorNote: 'Fahrwerk wird eingefahren. Geraeusch kann ueberraschen.',
      buttons: [
        { id: 'gear_know', label: 'Ah, das kenne ich!', icon: 'mdi-lightbulb', next: 'climb', type: 'primary' },
        { id: 'gear_what', label: 'Was war das?!', icon: 'mdi-alert-circle', next: 'gear_explain', type: 'comfort', instructorAlert: 'Teilnehmer erschrocken bei Fahrwerk' },
        { id: 'gear_continue', label: 'Weiter', icon: 'mdi-arrow-right-circle', next: 'climb', type: 'primary' },
      ],
      sounds: [
        { id: 'gear-retract', action: 'play', volume: 0.6, loop: false },
      ],
    },
    {
      id: 'gear_explain',
      atcMessage: 'Keine Sorge! Das waren nur die Raeder. Die werden nach dem Start eingeklappt damit das Flugzeug schneller fliegen kann. Stell dir vor du faehrst Fahrrad und klappst die Stuetzraeder hoch. Genau das Gleiche, nur groesser. Das Geraeusch kommt von der Hydraulik und den Klappen die sich schliessen.',
      buttons: [
        { id: 'gear_explained', label: 'Okay, verstanden!', icon: 'mdi-check-circle', next: 'climb', type: 'primary' },
      ],
      sounds: [],
    },

    // --- Phase 7: Climb ---
    {
      id: 'climb',
      atcMessage: 'Wir steigen jetzt ganz gemuetlich weiter hoch. Alles laeuft perfekt. Hoerst du wie die Triebwerke etwas leiser werden? Das ist normal, wir brauchen jetzt weniger Schub als beim Start. Wie ein Auto das vom ersten in den dritten Gang schaltet. Wir sind jetzt schon auf ueber 3.000 Fuss.',
      explanation: 'Steigflug laeuft. Die Triebwerke werden leiser - das ist normal.',
      instructorNote: 'Steigflug. Teilnehmer sollte sich jetzt etwas entspannen.',
      buttons: [
        { id: 'climb_height', label: 'Wie hoch sind wir?', icon: 'mdi-altimeter', next: 'climb_height_info', type: 'info' },
        { id: 'climb_continue', label: 'Weiter steigen', icon: 'mdi-arrow-up-circle', next: 'climb_high', type: 'primary' },
        { id: 'climb_queasy', label: 'Mir wird etwas komisch', icon: 'mdi-emoticon-sad', next: 'climb_queasy_comfort', type: 'comfort', instructorAlert: 'Unwohlsein beim Steigflug' },
      ],
      sounds: [
        { id: 'engine-cruise', action: 'crossfade', volume: 0.3 },
        { id: 'wind-high', action: 'crossfade', volume: 0.25 },
      ],
    },
    {
      id: 'climb_height_info',
      atcMessage: 'Wir sind gerade auf ungefaehr 5.000 Fuss, das sind 1.500 Meter. Noch die Haelfte bis zu unserem Ziel. Wenn du nach unten schaust, siehst du die Autobahnen und Haeuser ganz klein werden. Ziemlich cool, oder?',
      buttons: [
        { id: 'height_continue', label: 'Weiter hoch!', icon: 'mdi-arrow-up-circle', next: 'climb_high', type: 'primary' },
      ],
      sounds: [],
    },
    {
      id: 'climb_queasy_comfort',
      atcMessage: 'Das kann passieren. Schau am besten geradeaus nach vorne, nicht nach unten. Atme langsam und gleichmaessig. Das leichte Schaukeln kommt von den Luftstroemungen, das ist wie Wellen auf einem See. Ganz normal. Es wird gleich ruhiger wenn wir hoeher sind.',
      instructorNote: 'Unwohlsein. Ggf. muendlich eingreifen oder Pause anbieten.',
      buttons: [
        { id: 'queasy_continue', label: 'Geht schon, weiter', icon: 'mdi-arrow-up-circle', next: 'climb_high', type: 'primary' },
        { id: 'queasy_pause', label: 'Kurze Pause bitte', icon: 'mdi-pause-circle', next: 'climb_pause', type: 'comfort' },
      ],
      sounds: [],
    },
    {
      id: 'climb_pause',
      atcMessage: 'Klar, machen wir Pause. Alles fliegt von alleine weiter, keine Sorge. Atme ruhig und wenn du bereit bist, gehts weiter.',
      buttons: [
        { id: 'pause_done', label: 'Weiter gehts', icon: 'mdi-play-circle', next: 'climb_high', type: 'primary' },
      ],
      sounds: [],
    },
    {
      id: 'climb_high',
      atcMessage: 'Wir kommen unserem Ziel naeher! 8.000 Fuss... 9.000 Fuss... Gleich sind wir da. Du machst das wirklich super. Noch ein kleines Stueck...',
      explanation: 'Fast da! Noch etwas steigen bis 10.000 Fuss.',
      instructorNote: 'Kurz vor Level-off. Positiv verstaerken.',
      buttons: [
        { id: 'almost_there', label: 'Fast geschafft!', icon: 'mdi-flag-checkered', next: 'leveloff', type: 'primary' },
      ],
      sounds: [],
    },

    // --- Phase 8: Level-off & Debrief ---
    {
      id: 'leveloff',
      atcMessage: '10.000 Fuss! Wir sind da! Ich nehme die Nase jetzt etwas runter und wir fliegen geradeaus. Spuerst du wie es ruhiger wird? Kein Steigen mehr, einfach geradeaus gleiten. Du hast gerade einen kompletten Start hingelegt. Von der Startbahn bis hier hoch. Wie fuehlst du dich?',
      explanation: 'Geschafft! 10.000 Fuss erreicht. Wir fliegen jetzt geradeaus.',
      instructorNote: 'Level-off erreicht! Emotionaler Moment. Abwarten was kommt.',
      buttons: [
        { id: 'debrief_cool', label: 'Das war cool!', icon: 'mdi-party-popper', next: 'debrief', type: 'primary' },
        { id: 'debrief_relief', label: 'Ich bin erleichtert', icon: 'mdi-emoticon-happy', next: 'debrief', type: 'primary' },
        { id: 'debrief_again', label: 'Nochmal!', icon: 'mdi-refresh', next: 'debrief_restart', type: 'info' },
        { id: 'debrief_pause', label: 'Ich brauch eine Pause', icon: 'mdi-pause-circle', next: 'debrief_pause', type: 'comfort' },
      ],
      sounds: [
        { id: 'engine-cruise', action: 'crossfade', volume: 0.2 },
        { id: 'wind-high', action: 'crossfade', volume: 0.15 },
        { id: 'chime', action: 'play', volume: 0.3, loop: false },
      ],
    },
    {
      id: 'debrief',
      atcMessage: 'Du hast heute was richtig Tolles gemacht. All die Geraeusche die dich als Passagier vielleicht verunsichert haben, jetzt weisst du was sie bedeuten. Das Rumpeln auf der Bahn, das Kribbeln beim Abheben, das Klacken vom Fahrwerk, die Triebwerke die lauter und leiser werden. Alles ganz normal und alles ganz sicher. Du kannst stolz auf dich sein!',
      explanation: 'Du hast es geschafft! Alle Geraeusche haben eine normale Erklaerung.',
      instructorNote: 'Debriefing. Ggf. im Raum nachbesprechen. Emotionen zulassen.',
      buttons: [
        { id: 'restart', label: 'Nochmal von vorne', icon: 'mdi-refresh', next: 'welcome', type: 'info' },
        { id: 'finish', label: 'Fertig - danke!', icon: 'mdi-check-circle', next: 'end', type: 'primary' },
      ],
      sounds: [],
    },
    {
      id: 'debrief_restart',
      atcMessage: 'Ha, das hoer ich gern! Wollen wir nochmal von vorne anfangen? Beim zweiten Mal ist es meistens schon viel entspannter!',
      buttons: [
        { id: 'yes_restart', label: 'Ja, nochmal!', icon: 'mdi-refresh', next: 'welcome', type: 'primary' },
        { id: 'no_finish', label: 'Nee, reicht fuer heute', icon: 'mdi-check-circle', next: 'debrief', type: 'primary' },
      ],
      sounds: [],
    },
    {
      id: 'debrief_pause',
      atcMessage: 'Natuerlich. Nimm dir alle Zeit. Das war viel fuer einen Tag. Wenn du magst, koennen wir spaeter nochmal.',
      buttons: [
        { id: 'end_after_pause', label: 'Danke, das reicht', icon: 'mdi-check-circle', next: 'end', type: 'primary' },
        { id: 'continue_after_pause', label: 'Nochmal starten', icon: 'mdi-refresh', next: 'welcome', type: 'info' },
      ],
      sounds: [],
    },

    // --- End ---
    {
      id: 'end',
      atcMessage: 'Danke, dass du heute mitgemacht hast. Du hast einen echten Start erlebt und weisst jetzt was all die Geraeusche und Gefuehle bedeuten. Das naechste Mal wenn du als Passagier im Flieger sitzt, wirst du vieles wiedererkennen. Machs gut!',
      explanation: 'Das Szenario ist beendet. Du kannst jederzeit nochmal starten.',
      instructorNote: 'Szenario beendet. Nachbesprechung im Raum.',
      buttons: [
        { id: 'restart_final', label: 'Nochmal starten', icon: 'mdi-refresh', next: 'welcome', type: 'info' },
      ],
      sounds: [
        { id: 'engine-cruise', action: 'stop' },
        { id: 'wind-high', action: 'stop' },
      ],
    },
  ],
}
```

**Step 2: Commit**

```bash
git add shared/data/flightlab/takeoff-eddf.ts
git commit -m "feat(flightlab): add complete takeoff EDDF scenario with all phases and comfort branches"
```

---

## Task 3: FlightLab Engine Composable

**Files:**
- Create: `shared/composables/flightlab/useFlightLabEngine.ts`

**Step 1: Create the scenario engine composable**

```ts
// shared/composables/flightlab/useFlightLabEngine.ts
import { ref, computed } from 'vue'
import type { FlightLabPhase, FlightLabScenario, FlightLabButton } from '../../data/flightlab/types'

export function useFlightLabEngine(scenario: FlightLabScenario) {
  const currentPhaseId = ref(scenario.phases[0]?.id ?? '')
  const isPaused = ref(false)
  const history = ref<Array<{ phaseId: string; buttonId: string; timestamp: number }>>([])
  const startedAt = ref(Date.now())

  const phasesMap = computed(() => {
    const map = new Map<string, FlightLabPhase>()
    for (const phase of scenario.phases) {
      map.set(phase.id, phase)
    }
    return map
  })

  const currentPhase = computed(() => phasesMap.value.get(currentPhaseId.value) ?? null)

  // Count only main phases (not comfort/info branches) for progress
  const mainPhaseIds = ['welcome', 'briefing', 'runway', 'engines_pre', 'engines_spool', 'takeoff_roll', 'rotation', 'gear_retract', 'climb', 'climb_high', 'leveloff', 'debrief', 'end']

  const progress = computed(() => {
    const idx = mainPhaseIds.indexOf(currentPhaseId.value)
    if (idx === -1) {
      // We're in a sub-phase, find the closest main phase from history
      for (let i = history.value.length - 1; i >= 0; i--) {
        const mainIdx = mainPhaseIds.indexOf(history.value[i].phaseId)
        if (mainIdx !== -1) return Math.round((mainIdx / (mainPhaseIds.length - 1)) * 100)
      }
      return 0
    }
    return Math.round((idx / (mainPhaseIds.length - 1)) * 100)
  })

  const isFinished = computed(() => currentPhaseId.value === 'end')

  function selectOption(button: FlightLabButton) {
    if (isPaused.value) return
    history.value.push({
      phaseId: currentPhaseId.value,
      buttonId: button.id,
      timestamp: Date.now(),
    })
    goToPhase(button.next)
    return button
  }

  function goToPhase(phaseId: string) {
    if (phasesMap.value.has(phaseId)) {
      currentPhaseId.value = phaseId
    }
  }

  function restart() {
    currentPhaseId.value = scenario.phases[0]?.id ?? ''
    isPaused.value = false
    history.value = []
    startedAt.value = Date.now()
  }

  function pause() { isPaused.value = true }
  function resume() { isPaused.value = false }

  function skipForward() {
    const idx = mainPhaseIds.indexOf(currentPhaseId.value)
    if (idx >= 0 && idx < mainPhaseIds.length - 1) {
      goToPhase(mainPhaseIds[idx + 1])
    }
  }

  function skipBack() {
    const idx = mainPhaseIds.indexOf(currentPhaseId.value)
    if (idx > 0) {
      goToPhase(mainPhaseIds[idx - 1])
    }
  }

  return {
    // State
    currentPhaseId,
    currentPhase,
    isPaused,
    history,
    progress,
    isFinished,
    startedAt,
    scenario,
    // Actions
    selectOption,
    goToPhase,
    restart,
    pause,
    resume,
    skipForward,
    skipBack,
  }
}
```

**Step 2: Commit**

```bash
git add shared/composables/flightlab/useFlightLabEngine.ts
git commit -m "feat(flightlab): add scenario engine composable with phase navigation and progress tracking"
```

---

## Task 4: FlightLab Audio Composable

**Files:**
- Create: `shared/composables/flightlab/useFlightLabAudio.ts`

**Step 1: Create the audio composable**

This composable handles TTS with radio effects (reusing existing pipeline) and cockpit ambient sounds.

```ts
// shared/composables/flightlab/useFlightLabAudio.ts
import { ref } from 'vue'
import type { FlightLabSound } from '../../data/flightlab/types'
import { getReadabilityProfile, createNoiseGenerators } from '../../utils/radioEffects'

export function useFlightLabAudio() {
  const isSpeaking = ref(false)
  const audioContext = ref<AudioContext | null>(null)
  const activeSounds = ref<Map<string, { source: AudioBufferSourceNode; gain: GainNode }>>(new Map())
  const masterGain = ref<GainNode | null>(null)
  const soundBuffers = ref<Map<string, AudioBuffer>>(new Map())
  let speechQueue: Promise<void> = Promise.resolve()
  let pizzicato: any = null

  function getContext(): AudioContext {
    if (!audioContext.value) {
      audioContext.value = new AudioContext()
      masterGain.value = audioContext.value.createGain()
      masterGain.value.gain.value = 1.0
      masterGain.value.connect(audioContext.value.destination)
    }
    return audioContext.value
  }

  async function loadPizzicato() {
    if (!pizzicato) {
      const mod = await import('../../utils/pizzicatoLite')
      pizzicato = await (mod.loadPizzicatoLite || mod.default)()
    }
    return pizzicato
  }

  async function preloadSounds(soundIds: string[]) {
    const ctx = getContext()
    await Promise.all(
      soundIds.map(async (id) => {
        if (soundBuffers.value.has(id)) return
        try {
          const res = await fetch(`/audio/flightlab/${id}.mp3`)
          const buf = await res.arrayBuffer()
          const decoded = await ctx.decodeAudioData(buf)
          soundBuffers.value.set(id, decoded)
        } catch (e) {
          console.warn(`[FlightLabAudio] Could not load sound: ${id}`, e)
        }
      })
    )
  }

  function playAmbientSound(id: string, volume = 0.3, loop = true) {
    const ctx = getContext()
    const buffer = soundBuffers.value.get(id)
    if (!buffer || !masterGain.value) return

    // Stop existing instance of this sound
    stopAmbientSound(id)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = loop

    const gain = ctx.createGain()
    gain.gain.value = volume
    source.connect(gain)
    gain.connect(masterGain.value)
    source.start(0)

    activeSounds.value.set(id, { source, gain })

    if (!loop) {
      source.onended = () => { activeSounds.value.delete(id) }
    }
  }

  function stopAmbientSound(id: string) {
    const s = activeSounds.value.get(id)
    if (s) {
      try { s.source.stop() } catch {}
      activeSounds.value.delete(id)
    }
  }

  function crossfadeSound(id: string, targetVolume: number, durationMs = 1500) {
    const ctx = getContext()
    const s = activeSounds.value.get(id)
    if (s) {
      s.gain.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + durationMs / 1000)
      if (targetVolume === 0) {
        setTimeout(() => stopAmbientSound(id), durationMs + 100)
      }
    }
  }

  function handlePhaseSounds(sounds: FlightLabSound[]) {
    for (const s of sounds) {
      switch (s.action) {
        case 'play':
          playAmbientSound(s.id, s.volume ?? 0.3, s.loop ?? false)
          break
        case 'stop':
          stopAmbientSound(s.id)
          break
        case 'crossfade':
          crossfadeSound(s.id, s.volume ?? 0)
          break
      }
    }
  }

  async function speakAtcMessage(text: string, options?: { speed?: number; readability?: number }): Promise<void> {
    return new Promise((resolve) => {
      speechQueue = speechQueue.then(async () => {
        isSpeaking.value = true
        try {
          // Call the existing TTS API
          const res = await $fetch('/api/atc/say', {
            method: 'POST',
            body: {
              text,
              level: options?.readability ?? 5,
              speed: options?.speed ?? 0.9,
              tag: 'flightlab',
            },
          })

          if (res.success && res.audio?.base64) {
            await playWithRadioEffects(res.audio.base64, res.audio.mime, options?.readability ?? 5)
          }
        } catch (e) {
          console.error('[FlightLabAudio] TTS error:', e)
        } finally {
          isSpeaking.value = false
          resolve()
        }
      }).catch(() => {
        isSpeaking.value = false
        resolve()
      })
    })
  }

  async function playWithRadioEffects(base64: string, mime: string, readability: number) {
    const pz = await loadPizzicato()
    const ctx = getContext()
    const profile = getReadabilityProfile(readability)

    const sound = await pz.createSoundFromBase64(ctx, base64)

    // Apply radio filter chain
    sound.addEffect(new pz.Effects.HighPassFilter(ctx, { frequency: profile.eq.highpass, q: profile.eq.highpassQ }))
    sound.addEffect(new pz.Effects.LowPassFilter(ctx, { frequency: profile.eq.lowpass, q: profile.eq.lowpassQ }))

    if (profile.eq.bandpass) {
      sound.addEffect(new pz.Effects.BandPassFilter(ctx, { frequency: profile.eq.bandpass.frequency, q: profile.eq.bandpass.q }))
    }
    if (profile.presence) {
      sound.addEffect(new pz.Effects.PeakingFilter(ctx, { frequency: profile.presence.frequency, q: profile.presence.q, gain: profile.presence.gain }))
    }

    sound.addEffect(new pz.Effects.Compressor(ctx, profile.compressor))

    for (const d of profile.distortions) {
      sound.addEffect(new pz.Effects.Distortion(ctx, { amount: d }))
    }

    if (profile.tremolos) {
      for (const t of profile.tremolos) {
        sound.addEffect(new pz.Effects.Tremolo(ctx, t))
      }
    }

    sound.setVolume(profile.gain)

    const stopNoise = createNoiseGenerators(ctx, sound.duration, profile, readability)

    await sound.play()
    stopNoise.forEach((fn: () => void) => fn())
  }

  function stopAllSounds() {
    for (const [id] of activeSounds.value) {
      stopAmbientSound(id)
    }
    isSpeaking.value = false
  }

  function setMasterVolume(vol: number) {
    if (masterGain.value) {
      masterGain.value.gain.value = Math.max(0, Math.min(1, vol))
    }
  }

  function dispose() {
    stopAllSounds()
    audioContext.value?.close()
    audioContext.value = null
  }

  return {
    isSpeaking,
    preloadSounds,
    speakAtcMessage,
    handlePhaseSounds,
    playAmbientSound,
    stopAmbientSound,
    crossfadeSound,
    stopAllSounds,
    setMasterVolume,
    dispose,
  }
}
```

**Step 2: Commit**

```bash
git add shared/composables/flightlab/useFlightLabAudio.ts
git commit -m "feat(flightlab): add audio composable with TTS radio effects and ambient cockpit sounds"
```

---

## Task 5: WebSocket Server for Session Sync

**Files:**
- Create: `server/api/flightlab/ws.ts`

**Step 1: Check how H3 handles WebSockets in this Nuxt version**

Read `nuxt.config.ts` and check if `experimental.websocket` is needed. In Nuxt 4 with H3, WebSocket support requires `nitro.experimental.websocket: true`.

**Step 2: Update nuxt config to enable WebSocket**

In `nuxt.config.ts`, add under the existing config:
```ts
nitro: {
  experimental: {
    websocket: true,
  },
},
```

**Step 3: Create the WebSocket handler**

```ts
// server/api/flightlab/ws.ts
import { defineWebSocketHandler } from 'h3'

interface FlightLabSession {
  code: string
  scenarioId: string
  currentPhaseId: string
  isPaused: boolean
  startedAt: number
  participantConnected: boolean
  instructorConnected: boolean
  history: Array<{ phaseId: string; buttonId: string; timestamp: number }>
  peers: Map<string, { role: 'instructor' | 'participant'; peer: any }>
}

const sessions = new Map<string, FlightLabSession>()

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No I,O,0,1 for readability
  let code = ''
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return sessions.has(code) ? generateCode() : code
}

function broadcastToSession(session: FlightLabSession, event: any, excludePeerId?: string) {
  for (const [id, p] of session.peers) {
    if (id !== excludePeerId) {
      try { p.peer.send(JSON.stringify(event)) } catch {}
    }
  }
}

function getSessionState(session: FlightLabSession) {
  return {
    sessionCode: session.code,
    scenarioId: session.scenarioId,
    currentPhaseId: session.currentPhaseId,
    isPaused: session.isPaused,
    startedAt: session.startedAt,
    participantConnected: session.participantConnected,
    history: session.history,
  }
}

export default defineWebSocketHandler({
  open(peer) {
    // Connection opened, wait for join/create message
  },

  message(peer, msg) {
    let data: any
    try {
      data = JSON.parse(typeof msg === 'string' ? msg : msg.toString())
    } catch {
      peer.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }))
      return
    }

    const peerId = (peer as any).id ?? String(peer)

    switch (data.type) {
      case 'create-session': {
        const code = generateCode()
        const session: FlightLabSession = {
          code,
          scenarioId: data.scenarioId ?? 'takeoff-eddf',
          currentPhaseId: 'welcome',
          isPaused: false,
          startedAt: Date.now(),
          participantConnected: false,
          instructorConnected: true,
          history: [],
          peers: new Map([[peerId, { role: 'instructor', peer }]]),
        }
        sessions.set(code, session)
        peer.send(JSON.stringify({ type: 'session-created', code, state: getSessionState(session) }))
        break
      }

      case 'join-session': {
        const session = sessions.get(data.code?.toUpperCase())
        if (!session) {
          peer.send(JSON.stringify({ type: 'error', message: 'Session nicht gefunden' }))
          return
        }
        const role = data.role ?? 'participant'
        session.peers.set(peerId, { role, peer })
        if (role === 'participant') session.participantConnected = true
        peer.send(JSON.stringify({ type: 'session-joined', role, state: getSessionState(session) }))
        broadcastToSession(session, { type: 'peer-joined', role }, peerId)
        break
      }

      case 'participant-action': {
        const session = findSessionByPeer(peerId)
        if (!session) return
        session.history.push({ phaseId: data.phaseId, buttonId: data.buttonId, timestamp: Date.now() })
        session.currentPhaseId = data.nextPhaseId
        broadcastToSession(session, {
          type: 'state-change',
          state: getSessionState(session),
          action: { buttonId: data.buttonId, phaseId: data.phaseId },
        })
        break
      }

      case 'instructor-command': {
        const session = findSessionByPeer(peerId)
        if (!session) return
        const peerInfo = session.peers.get(peerId)
        if (peerInfo?.role !== 'instructor') return

        switch (data.command) {
          case 'pause':
            session.isPaused = true
            break
          case 'resume':
            session.isPaused = false
            break
          case 'restart':
            session.currentPhaseId = 'welcome'
            session.isPaused = false
            session.history = []
            session.startedAt = Date.now()
            break
          case 'goto':
            if (data.targetPhaseId) session.currentPhaseId = data.targetPhaseId
            break
        }
        broadcastToSession(session, { type: 'state-change', state: getSessionState(session) })
        break
      }

      case 'instructor-message': {
        const session = findSessionByPeer(peerId)
        if (!session) return
        broadcastToSession(session, {
          type: 'instructor-message',
          text: data.text,
          withRadioEffect: data.withRadioEffect ?? true,
        }, peerId)
        break
      }
    }
  },

  close(peer) {
    const peerId = (peer as any).id ?? String(peer)
    for (const [code, session] of sessions) {
      const peerInfo = session.peers.get(peerId)
      if (peerInfo) {
        session.peers.delete(peerId)
        if (peerInfo.role === 'participant') session.participantConnected = false
        if (peerInfo.role === 'instructor') session.instructorConnected = false
        broadcastToSession(session, { type: 'peer-left', role: peerInfo.role })
        // Clean up empty sessions
        if (session.peers.size === 0) sessions.delete(code)
        break
      }
    }
  },
})

function findSessionByPeer(peerId: string): FlightLabSession | undefined {
  for (const session of sessions.values()) {
    if (session.peers.has(peerId)) return session
  }
}
```

**Step 4: Commit**

```bash
git add server/api/flightlab/ws.ts nuxt.config.ts
git commit -m "feat(flightlab): add WebSocket handler for instructor-participant session sync"
```

---

## Task 6: WebSocket Sync Composable

**Files:**
- Create: `shared/composables/flightlab/useFlightLabSync.ts`

**Step 1: Create the sync composable**

```ts
// shared/composables/flightlab/useFlightLabSync.ts
import { ref, computed } from 'vue'
import type { FlightLabRole, FlightLabSessionState } from '../../data/flightlab/types'

export function useFlightLabSync() {
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const role = ref<FlightLabRole | null>(null)
  const sessionCode = ref<string | null>(null)
  const remoteState = ref<FlightLabSessionState | null>(null)

  const callbacks = {
    onStateChange: [] as Array<(state: FlightLabSessionState, action?: any) => void>,
    onInstructorMessage: [] as Array<(text: string, withRadioEffect: boolean) => void>,
    onPeerJoined: [] as Array<(peerRole: FlightLabRole) => void>,
    onPeerLeft: [] as Array<(peerRole: FlightLabRole) => void>,
    onError: [] as Array<(msg: string) => void>,
  }

  function connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const url = `${proto}//${window.location.host}/api/flightlab/ws`
      ws.value = new WebSocket(url)

      ws.value.onopen = () => {
        isConnected.value = true
        resolve()
      }

      ws.value.onclose = () => {
        isConnected.value = false
        ws.value = null
      }

      ws.value.onerror = () => {
        reject(new Error('WebSocket connection failed'))
      }

      ws.value.onmessage = (event) => {
        let data: any
        try { data = JSON.parse(event.data) } catch { return }
        handleMessage(data)
      }
    })
  }

  function handleMessage(data: any) {
    switch (data.type) {
      case 'session-created':
        sessionCode.value = data.code
        role.value = 'instructor'
        remoteState.value = data.state
        break
      case 'session-joined':
        role.value = data.role
        remoteState.value = data.state
        sessionCode.value = data.state.sessionCode
        break
      case 'state-change':
        remoteState.value = data.state
        callbacks.onStateChange.forEach(cb => cb(data.state, data.action))
        break
      case 'instructor-message':
        callbacks.onInstructorMessage.forEach(cb => cb(data.text, data.withRadioEffect))
        break
      case 'peer-joined':
        callbacks.onPeerJoined.forEach(cb => cb(data.role))
        break
      case 'peer-left':
        callbacks.onPeerLeft.forEach(cb => cb(data.role))
        break
      case 'error':
        callbacks.onError.forEach(cb => cb(data.message))
        break
    }
  }

  function send(data: any) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(data))
    }
  }

  async function createSession(scenarioId = 'takeoff-eddf') {
    await connect()
    send({ type: 'create-session', scenarioId })
  }

  async function joinSession(code: string, joinRole: FlightLabRole = 'participant') {
    await connect()
    send({ type: 'join-session', code: code.toUpperCase(), role: joinRole })
  }

  function sendParticipantAction(phaseId: string, buttonId: string, nextPhaseId: string) {
    send({ type: 'participant-action', phaseId, buttonId, nextPhaseId })
  }

  function sendInstructorCommand(command: string, targetPhaseId?: string) {
    send({ type: 'instructor-command', command, targetPhaseId })
  }

  function sendInstructorMessage(text: string, withRadioEffect = true) {
    send({ type: 'instructor-message', text, withRadioEffect })
  }

  function disconnect() {
    ws.value?.close()
    ws.value = null
    isConnected.value = false
    role.value = null
    sessionCode.value = null
    remoteState.value = null
  }

  function onStateChange(cb: (state: FlightLabSessionState, action?: any) => void) { callbacks.onStateChange.push(cb) }
  function onInstructorMessage(cb: (text: string, withRadioEffect: boolean) => void) { callbacks.onInstructorMessage.push(cb) }
  function onPeerJoined(cb: (role: FlightLabRole) => void) { callbacks.onPeerJoined.push(cb) }
  function onPeerLeft(cb: (role: FlightLabRole) => void) { callbacks.onPeerLeft.push(cb) }
  function onError(cb: (msg: string) => void) { callbacks.onError.push(cb) }

  return {
    isConnected,
    role,
    sessionCode,
    remoteState,
    createSession,
    joinSession,
    sendParticipantAction,
    sendInstructorCommand,
    sendInstructorMessage,
    disconnect,
    onStateChange,
    onInstructorMessage,
    onPeerJoined,
    onPeerLeft,
    onError,
  }
}
```

**Step 2: Commit**

```bash
git add shared/composables/flightlab/useFlightLabSync.ts
git commit -m "feat(flightlab): add WebSocket sync composable for instructor-participant sessions"
```

---

## Task 7: FlightLab Landing Page

**Files:**
- Create: `app/pages/flightlab/index.vue`

**Step 1: Create the landing page**

This is the `/flightlab` page - a scenario selection grid matching OpenSquawk's dark glass morphism design. For now, only one scenario card (takeoff).

The page should:
- Use the OpenSquawk dark theme (`bg-[#070d1a]`, cyan accents, glass cards)
- Show a hero section with FlightLab branding
- Show scenario cards in a grid
- Each card links to the scenario (participant view)
- Have a small "Instructor" link/button on each card

**Design reference:** Follow the patterns from `classroom-introduction.vue` - glass cards with `border border-white/10 bg-[#0b1328]/90`, cyan accent icons, rounded corners, backdrop-blur.

**UI Elements:**
- Header: "FlightLab" title + airplane icon + subtitle about overcoming flight anxiety
- Scenario card for "Dein erster Start" with icon, description, aircraft/airport info
- "Starten" button (links to `/flightlab/takeoff`)
- Small "Instructor" link (links to `/flightlab/takeoff/instructor`)

Use Vuetify (`v-btn`, `v-icon`, `v-card`) + Tailwind utilities. Full code for this Vue SFC will be provided by the frontend-design skill.

**Step 2: Commit**

```bash
git add app/pages/flightlab/index.vue
git commit -m "feat(flightlab): add landing page with scenario selection grid"
```

---

## Task 8: Participant View Page

**Files:**
- Create: `app/pages/flightlab/takeoff.vue`

**Step 1: Create the participant page**

This is the core experience page (`/flightlab/takeoff`). Tablet-optimized, full-screen dark layout.

**Layout (top to bottom):**
1. **Header bar** (thin): Session code input OR connected indicator, progress dots/bar
2. **ATC message area** (center, large): The spoken text, large readable font
3. **Explanation area** (below ATC): Smaller muted text with additional context
4. **Button area** (bottom): Large touch-friendly buttons (min 56px), spaced well
5. **Input area** (very bottom): Text input + mic button for free-form input
6. **Restart button** (top-right corner, small, with confirmation)

**Functionality:**
- On mount: Initialize `useFlightLabEngine` with `takeoffEddf` scenario
- On mount: Initialize `useFlightLabAudio`, preload all cockpit sounds
- On mount: Show session join dialog (optional - can skip for solo mode)
- When phase changes: Speak ATC message via TTS with radio effects, handle phase sounds
- When button pressed: `selectOption()`, if connected send via WebSocket, advance phase
- When instructor message received: Speak it via TTS
- When instructor command received: Execute (pause/resume/goto/restart)

**Session Join Flow:**
- Show small input at top: "Session-Code eingeben" with 4 char input
- Or "Solo starten" button to skip WebSocket
- Once joined, show green "Verbunden" indicator

**Important patterns to reuse from pm.vue:**
- Speech queue pattern (enqueue TTS to prevent overlap)
- Radio effects chain (PizzicatoLite + filters + noise)
- PTT recording (MediaRecorder → base64 → /api/atc/ptt)

Use Vuetify + Tailwind. Dark glass morphism. Full Vue SFC with `<script setup>` and `<template>`.

**Step 2: Commit**

```bash
git add app/pages/flightlab/takeoff.vue
git commit -m "feat(flightlab): add participant view with scripted phases, TTS, and session sync"
```

---

## Task 9: Instructor View Page

**Files:**
- Create: `app/pages/flightlab/takeoff/instructor.vue`

**Step 1: Create the instructor page**

This is the instructor control panel (`/flightlab/takeoff/instructor`).

**Layout (split):**
- **Left panel (60%):** Mirror of participant view (current phase, ATC text, buttons - read-only)
- **Right panel (40%):** Instructor controls

**Right panel sections:**
1. **Session Code** - Large display of 4-char code + "Warte auf Teilnehmer..." / "Teilnehmer verbunden" indicator
2. **Status** - Current phase name, progress bar, elapsed time, paused indicator
3. **Phase Control** - Skip forward/back buttons, phase dropdown to jump to any phase
4. **Pause/Resume** toggle button
5. **Restart** button (with confirmation)
6. **Custom Message** - Text input + "Senden" button + toggle "Mit Funkeffekt" checkbox
7. **Anxiety Monitor** - Highlighted alerts when participant presses comfort buttons (from history)
8. **Participant Log** - Scrollable timeline of all actions with timestamps

**Functionality:**
- On mount: Create WebSocket session → display code
- Listen for participant joining
- Mirror all state changes in real-time
- Send commands via WebSocket
- Custom messages: POST to `/api/atc/say` for TTS, send audio event to participant via WebSocket

**Step 2: Commit**

```bash
git add app/pages/flightlab/takeoff/instructor.vue
git commit -m "feat(flightlab): add instructor control panel with full scenario control"
```

---

## Task 10: Placeholder Audio Files

**Files:**
- Create: `public/audio/flightlab/` directory with placeholder files

**Step 1: Create placeholder audio directory**

Since we don't have real cockpit sound recordings yet, create a small utility that generates simple sine-wave / white-noise placeholder audio files using Web Audio API + OfflineAudioContext. Alternatively, create empty mp3 files as placeholders so the app doesn't crash.

For the demo, create a simple script or just ensure the audio composable handles missing files gracefully (the `preloadSounds` function already has try/catch and `console.warn`).

```bash
mkdir -p public/audio/flightlab
```

Create a simple README in the directory:

```md
# FlightLab Audio Files

Place cockpit sound effects here:
- engine-idle.mp3 - A320 engine at idle thrust
- engine-spool.mp3 - Engine spooling up to takeoff power
- engine-cruise.mp3 - Engine at cruise/climb power (loop)
- runway-rumble.mp3 - Wheels on runway concrete (loop)
- wind-low.mp3 - Low-speed wind noise (loop)
- wind-high.mp3 - High-speed wind noise (loop)
- gear-retract.mp3 - Landing gear retraction sounds
- chime.mp3 - Seatbelt/no-smoking chime

Recommended: Use royalty-free aviation sound effects or record from simulator.
```

**Step 2: Commit**

```bash
git add public/audio/flightlab/
git commit -m "feat(flightlab): add audio directory with README for cockpit sound effects"
```

---

## Task 11: Integration Testing & Polish

**Step 1: Run dev server**

```bash
bun run dev
```

**Step 2: Test participant flow**

1. Navigate to `http://localhost:3000/flightlab`
2. Click "Starten" on takeoff scenario card
3. Verify all phases work: Welcome → Briefing → Runway → Engines → Takeoff → Rotation → Gear → Climb → Level-off → Debrief
4. Test comfort branches (click "Mir ist mulmig", "Ich hab Angst" etc.)
5. Verify TTS speaks with radio effects
6. Verify progress indicator updates

**Step 3: Test instructor flow**

1. Open `/flightlab/takeoff/instructor` in a second browser tab
2. Note the session code
3. Enter session code on participant page
4. Verify real-time sync:
   - Participant button press → reflected on instructor panel
   - Instructor pause → participant sees pause
   - Instructor skip → participant jumps to phase
   - Instructor message → participant hears TTS
   - Instructor restart → both reset

**Step 4: Test tablet layout**

1. Open Chrome DevTools → Device toolbar → iPad
2. Verify participant view is usable on tablet
3. Buttons should be large and touch-friendly
4. Text should be readable in dim light

**Step 5: Fix any issues found**

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat(flightlab): polish and integration fixes"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Type definitions | `shared/data/flightlab/types.ts` |
| 2 | Takeoff scenario data | `shared/data/flightlab/takeoff-eddf.ts` |
| 3 | Engine composable | `shared/composables/flightlab/useFlightLabEngine.ts` |
| 4 | Audio composable | `shared/composables/flightlab/useFlightLabAudio.ts` |
| 5 | WebSocket server | `server/api/flightlab/ws.ts` |
| 6 | Sync composable | `shared/composables/flightlab/useFlightLabSync.ts` |
| 7 | Landing page | `app/pages/flightlab/index.vue` |
| 8 | Participant view | `app/pages/flightlab/takeoff.vue` |
| 9 | Instructor view | `app/pages/flightlab/takeoff/instructor.vue` |
| 10 | Audio placeholders | `public/audio/flightlab/` |
| 11 | Integration test | Manual testing + fixes |

**Dependencies:** Tasks 1-6 are foundational (composables + data). Tasks 7-9 are UI pages that use them. Task 10 is independent. Task 11 is final.

**Recommended order:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11
