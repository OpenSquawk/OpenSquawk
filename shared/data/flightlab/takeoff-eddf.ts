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
      simConditions: {
        conditions: [
          { variable: 'TURB_ENG_N1_1', operator: '>=', value: 85 },
          { variable: 'TURB_ENG_N1_2', operator: '>=', value: 85 },
          { variable: 'BRAKE_PARKING_POSITION', operator: '==', value: false },
        ],
        logic: 'AND',
      },
      simConditionTimeoutMs: 20000,
      simConditionHelpMessage: 'Schub-Hebel nach vorne schieben bis N1 bei etwa 85 Prozent. Dann die Parkbremse loesen.',
      simConditionNextPhase: 'takeoff_roll',
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
      simConditions: {
        conditions: [
          { variable: 'AIRSPEED_INDICATED', operator: '>=', value: 140 },
          { variable: 'SIM_ON_GROUND', operator: '==', value: true },
        ],
        logic: 'AND',
      },
      simConditionTimeoutMs: 45000,
      simConditionHelpMessage: 'Warte bis die Geschwindigkeit 140 Knoten erreicht. Schau auf den Speed-Tape links am Display.',
      simConditionNextPhase: 'rotation',
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
      simConditions: {
        conditions: [
          { variable: 'SIM_ON_GROUND', operator: '==', value: false },
          { variable: 'PLANE_PITCH_DEGREES', operator: '>', value: 5 },
        ],
        logic: 'AND',
      },
      simConditionTimeoutMs: 15000,
      simConditionHelpMessage: 'Sidestick sanft nach hinten ziehen bis die Nase hochgeht.',
      simConditionNextPhase: 'gear_retract',
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
      simConditions: {
        conditions: [
          { variable: 'GEAR_HANDLE_POSITION', operator: '==', value: false },
        ],
        logic: 'AND',
      },
      simConditionTimeoutMs: 10000,
      simConditionHelpMessage: 'Fahrwerk-Hebel nach oben schieben. Der Hebel ist links neben dem Mitteldisplay.',
      simConditionNextPhase: 'climb',
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
      simConditions: {
        conditions: [
          { variable: 'PLANE_ALTITUDE', operator: '>', value: 2000 },
          { variable: 'VERTICAL_SPEED', operator: '>', value: 1000 },
        ],
        logic: 'AND',
      },
      simConditionTimeoutMs: 30000,
      simConditionHelpMessage: 'Steigrate erhoehen auf etwa 2000 Fuss pro Minute. Sidestick leicht nach hinten halten.',
      simConditionNextPhase: 'climb_high',
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
      simConditions: {
        conditions: [
          { variable: 'PLANE_ALTITUDE', operator: '>=', value: 9800 },
        ],
        logic: 'AND',
      },
      simConditionTimeoutMs: 60000,
      simConditionHelpMessage: 'Weiter steigen bis 10.000 Fuss. Halte die Nase leicht oben.',
      simConditionNextPhase: 'leveloff',
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
      simConditions: {
        conditions: [
          { variable: 'VERTICAL_SPEED', operator: '<', value: 500 },
          { variable: 'VERTICAL_SPEED', operator: '>', value: -500 },
          { variable: 'PLANE_ALTITUDE', operator: '>=', value: 9500 },
        ],
        logic: 'AND',
      },
      simConditionTimeoutMs: 20000,
      simConditionHelpMessage: 'Nase etwas senken zum Geradeausflug. Steigrate auf nahe Null bringen.',
      simConditionNextPhase: 'debrief',
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
