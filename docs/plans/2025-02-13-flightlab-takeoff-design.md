# FlightLab - Guided Takeoff Experience

## Overview

A new standalone feature area under `/flightlab` that provides guided, immersive cockpit experiences for people with flight anxiety or zero aviation knowledge. The first scenario guides a participant through an A320 takeoff from EDDF runway to 10,000ft with a warm, patient ATC companion voice.

**Target audience:** People with flight anxiety, aviation newcomers, curious individuals who want to understand what happens during takeoff - NOT pilot students.

**Setting:** Full-size A320 cockpit (physical simulator), tablet mounted in cockpit, headphones + microphone connected. Instructor may be in separate room or nearby with their own device.

---

## Design Principles

### Tone & Philosophy
- **The ATC is a warm companion, not a controller.** Like a patient friend on the radio.
- **Zero jargon.** Not "retract flaps" but "push that lever up".
- **Every sound explained before it happens.** "You'll hear a rumbling now - that's just the wheels on the runway joints."
- **Feelings acknowledged.** "That flutter in your stomach is totally normal."
- **No time pressure.** Everything waits for the participant. "We only go when you're ready."
- **Normalizing.** "Everyone finds this overwhelming at first. 1000 buttons, but we only need 5 today."
- **ATC voice:** Slow, clear, warm. Light radio effect (readability 4-5) for authenticity but still very understandable.

---

## Routing Structure

```
/flightlab                         → Landing page (scenario selection grid)
/flightlab/takeoff                 → Participant view (tablet in cockpit)
/flightlab/takeoff/instructor      → Instructor full-control panel
```

Not linked from main navigation. Direct URL access only (for now).

---

## Scenario: First Takeoff (EDDF → FL100)

### Flight Context
- **Aircraft:** Airbus A320
- **Airport:** Frankfurt (EDDF)
- **Runway:** 25C (or 07C depending on wind)
- **Callsign:** Lufthansa 39 Alpha (DLH39A)
- **Reason:** Training flight for anxiety management / familiarization
- **Destination:** Not relevant - we level off at FL100 and debrief

### Phase Structure

Each phase is a scripted step with:
- `id` - unique identifier
- `atcMessage` - what the companion says (TTS with radio effect)
- `explanation` - optional on-screen explanatory text (no radio effect, just text)
- `buttons` - response options (large, touch-friendly)
- `sounds` - ambient/cockpit sounds to play
- `instructorNote` - what the instructor sees as guidance
- `comfortBranch` - optional branch for anxiety responses

#### Phase 0: Welcome & Settle In
> "Hey! Willkommen im Cockpit. Ich bin dein Begleiter heute - du kannst mich jederzeit alles fragen. Erstmal - sitz bequem? Kopfhoehrer passen gut? ... Schau dich ruhig um. Sieht wild aus mit den ganzen Knoepfen, oder? Keine Sorge - wir brauchen heute fast nichts davon. Ich sag dir genau was du anfassen musst."

Buttons: `Ja, bin bereit!` / `Mir ist etwas mulmig` / `Erzaehl mir erstmal mehr`

On "mulmig": Comfort branch with breathing exercise, extra reassurance, then back to main flow.

#### Phase 1: Briefing - What Will Happen
> "Okay, ich erklaer dir kurz was wir heute machen: Wir stehen hier auf der Startbahn in Frankfurt. Wir werden gemeinsam starten und ganz gemuetlich auf 10.000 Fuss steigen - das sind ungefaehr 3 Kilometer Hoehe. Ich sag dir jeden einzelnen Schritt vorher an. Du musst nichts wissen, nichts auswendig koennen. Ich bin die ganze Zeit da."

Buttons: `Okay, los gehts!` / `Wie lange dauert das?` / `Was wenn was schiefgeht?`

#### Phase 2: On the Runway
> "So, wir stehen jetzt auf der Startbahn. Schau mal nach vorne durch die Scheibe - siehst du die Lichter auf der Bahn? Da entlang gehts gleich. Links und rechts Gras, vor uns die lange Bahn. Alles sicher."

Buttons: `Ja, ich seh die Bahn` / `Wo genau soll ich hinschauen?`

#### Phase 3: Engines Spool Up
> "Jetzt wird es gleich lauter. Die Triebwerke werden hochgefahren - das sind die zwei grossen Duesen unter den Fluegeln. [Pause] Hoerst du wie es lauter wird? Das ist genau wie beim Fliegen als Passagier, nur dass du es jetzt von vorne hoerst. Ganz normal."

Sounds: Engine spool-up (gradual), low rumble
Buttons: `Okay, weiter!` / `Das ist ganz schoen laut!` / `Kurz pausieren`

#### Phase 4: Takeoff Roll
> "Wir rollen jetzt los. Du spuerst wie es dich leicht in den Sitz drueckt - das ist nur die Beschleunigung. Die Bahn rumpelt ein bisschen unter uns, das sind die Fugen im Beton. Wir werden jetzt schnell schneller..."

Sounds: Runway rumble, increasing wind, engine at takeoff power
Buttons: `Weiter!` / `Es rumpelt so!` / `Ich hab Angst`

On "Ich hab Angst": "Das ist voellig okay. Du bist sicher. Das Rumpeln hoert gleich auf sobald wir in der Luft sind. Atme einmal tief ein... und aus. Wollen wir weitermachen?"

#### Phase 5: Rotation (Liftoff)
> "Und... wir heben ab! Spuerst du wie das Rumpeln aufhoert? Wir sind jetzt in der Luft. Das leichte Kribbeln im Bauch - das ist normal, das hat jeder. Schau mal nach rechts raus wenn du magst - da siehst du Frankfurt."

Sounds: Rumble stops abruptly, steady wind + engine, slight tone change
Buttons: `Wow!` / `Das Kribbeln im Bauch...` / `Weiter`

#### Phase 6: Gear Retraction
> "Jetzt fahren wir die Raeder ein. Gleich hoerst du ein Geraeusch unter uns - ein Rumpeln und Klacken. Das sind die Raeder die in den Bauch vom Flugzeug hochfahren. Genau das Geraeusch was du als Passagier auch hoerst kurz nach dem Start."

Sounds: Hydraulic whirr, mechanical clunk, gear doors
Buttons: `Ah, das kenne ich!` / `Was war das?!` / `Weiter`

#### Phase 7: Climb
> "Wir steigen jetzt ganz gemuetlich weiter hoch. Alles laeuft perfekt. Hoerst du wie die Triebwerke etwas leiser werden? Das ist normal - wir brauchen jetzt weniger Schub als beim Start. Wie ein Auto das vom ersten in den zweiten Gang schaltet."

Sounds: Engine slightly quieter, steady wind
Buttons: `Wie hoch sind wir?` / `Weiter steigen` / `Mir wird etwas komisch`

#### Phase 8: Level-off & Debrief
> "10.000 Fuss! Wir sind da. Ich nehme jetzt die Nase etwas runter, wir fliegen jetzt geradeaus. Spuerst du wie es ruhiger wird? ... Du hast gerade einen kompletten Start hingelegt. Von der Startbahn bis hier hoch. Wie fuehlst du dich?"

Buttons: `Das war cool!` / `Ich bin erleichtert` / `Nochmal!` / `Ich brauch eine Pause`

> "Du hast heute was richtig Tolles gemacht. All die Geraeusche die dich als Passagier vielleicht verunsichert haben - jetzt weisst du was sie bedeuten. Das Rumpeln, das Kribbeln, die Geraeusche - alles normal und alles sicher."

Buttons: `Zurueck zum Start` / `Fertig`

---

## Technical Architecture

### Approach: Composable-based with Shared State
Follows existing OpenSquawk patterns (Vue 3 Composition API, Pinia-style composables).

### Composables

#### `useFlightLabEngine()`
Core scenario state machine:
- `currentPhase` - reactive ref to current phase object
- `phases` - all phases for current scenario
- `progress` - percentage through scenario
- `selectOption(buttonId)` - user picks a button, triggers transition
- `goToPhase(phaseId)` - jump to specific phase (instructor use)
- `restart()` - reset to phase 0
- `pause()` / `resume()` - pause scenario
- `isPaused` - reactive pause state

#### `useFlightLabSync()`
WebSocket session management:
- `createSession()` → returns session code (4 chars)
- `joinSession(code)` → connect to existing session
- `sessionState` - shared reactive state (synced via WebSocket)
- `sendInstructorMessage(text)` - instructor sends custom message
- `onStateChange(callback)` - react to remote state changes
- Role detection: `isInstructor` / `isParticipant`

#### `useFlightLabAudio()`
Sound management:
- `playAtcMessage(text, options)` - TTS with radio effects (reuse existing `/api/atc/say` + `radioEffects.ts`)
- `playSound(soundId)` - cockpit ambient sounds (engine, gear, rumble, wind)
- `stopAllSounds()` - silence everything
- `setAmbientLevel(level)` - master volume for ambient sounds
- Sound crossfading between phases

### WebSocket Server
New H3 WebSocket handler at `/api/flightlab/ws`:
- Session registry (in-memory, Map<code, Session>)
- Session has: participants[], instructorId, currentState, history
- Events: `state-change`, `instructor-message`, `instructor-command`, `participant-action`
- Commands: `pause`, `resume`, `skip`, `back`, `restart`, `send-message`

### Scenario Data Structure

```ts
interface FlightLabPhase {
  id: string
  atcMessage: string                    // spoken via TTS
  explanation?: string                  // on-screen text (not spoken)
  buttons: FlightLabButton[]
  sounds?: FlightLabSound[]             // ambient sounds for this phase
  instructorNote?: string               // shown on instructor panel
  autoAdvanceAfterTTS?: boolean         // auto-move after ATC finishes speaking
}

interface FlightLabButton {
  id: string
  label: string                         // button text
  icon?: string                         // mdi icon
  next: string                          // target phase id
  type?: 'primary' | 'comfort' | 'info' // styling hint
  instructorAlert?: string              // notify instructor when pressed
}

interface FlightLabSound {
  id: string                            // 'engine-spool' | 'rumble' | 'gear' | 'wind' | etc.
  action: 'play' | 'stop' | 'crossfade'
  volume?: number
  loop?: boolean
}
```

Scenarios stored as TypeScript files in `/shared/data/flightlab/`:
- `takeoff-eddf.ts` - the first takeoff scenario
- Easy to add more scenarios later

### Instructor Panel Features

| Feature | Description |
|---------|-------------|
| **Status Dashboard** | Current phase, participant progress bar, time elapsed |
| **Live View** | See exactly what participant sees (mirrored) |
| **Phase Control** | Skip forward/back, jump to any phase |
| **Pause/Resume** | Halt scenario at any point |
| **Custom Message** | Type free text → TTS to participant (with/without radio effect) |
| **Anxiety Monitor** | Highlighted when participant presses comfort buttons |
| **Restart** | Full scenario reset |
| **Session Code** | Displayed prominently for participant to join |
| **Participant Log** | Timeline of all button presses and interactions |

### UI Design

**Visual style:** Matches OpenSquawk dark theme (`opensquawkDark`):
- Background: `#0b1020` (dark navy)
- Accent: `#22d3ee` (cyan)
- Glass morphism cards (backdrop-blur, subtle borders)
- Vuetify 3 components + Tailwind utilities

**Participant view (tablet-optimized):**
- Full-screen dark layout, no distracting chrome
- Top: Small progress indicator (phase dots or thin bar)
- Center: Large ATC message text (readable in dim cockpit)
- Below: Explanation text (smaller, muted color)
- Bottom: Large touch buttons (min 56px height, good spacing)
- Restart button: Small, corner, with confirmation dialog
- Text input field + mic button at bottom for free-text/speech input

**Instructor view:**
- Split layout: Left = participant mirror view, Right = controls
- Control panel with all instructor actions
- Session code displayed large at top
- Real-time participant action log at bottom
- Responsive but optimized for tablet/laptop

### Audio Pipeline

```
ATC Messages:  Text → /api/atc/say (TTS) → radioEffects.ts (readability 4-5) → speaker
Cockpit Sounds: Pre-recorded audio files → Web Audio API → speaker
Instructor Msg: Text → /api/atc/say (TTS) → optional radio effect → speaker
```

Sound files stored in `/public/audio/flightlab/`:
- `engine-idle.mp3`, `engine-spool.mp3`, `engine-cruise.mp3`
- `runway-rumble.mp3`
- `wind-low.mp3`, `wind-high.mp3`
- `gear-retract.mp3`
- `chime.mp3`

### Speech-to-Text (Optional Input)
Reuse existing PTT / speech-to-text from `/api/atc/ptt.post.ts`. Participant can speak instead of pressing buttons. Simple keyword matching to map speech to button actions (no LLM needed for scripted scenario).

### Future Extensibility
- **Local plugin endpoint** (TODO): External system calls `/api/flightlab/checkpoint` to report simulator state (altitude, speed, position) → can auto-advance phases based on real telemetry
- **More scenarios**: Landing, turbulence experience, night flight, crosswind
- **Scenario editor**: Admin page to create/edit scenarios visually
- **Progress tracking**: Save participant sessions to MongoDB for analysis

---

## File Structure (New Files)

```
app/pages/
  flightlab/
    index.vue                          # Landing page with scenario grid
    takeoff.vue                        # Participant view
    takeoff/
      instructor.vue                   # Instructor panel

shared/
  data/flightlab/
    takeoff-eddf.ts                    # Takeoff scenario definition
    types.ts                           # FlightLab type definitions

  composables/flightlab/
    useFlightLabEngine.ts              # Scenario state machine
    useFlightLabSync.ts                # WebSocket session management
    useFlightLabAudio.ts               # Sound + TTS management

server/
  api/flightlab/
    ws.ts                              # WebSocket handler
    session.post.ts                    # Create session
    session.get.ts                     # Get session info

public/
  audio/flightlab/
    engine-idle.mp3
    engine-spool.mp3
    engine-cruise.mp3
    runway-rumble.mp3
    wind-low.mp3
    wind-high.mp3
    gear-retract.mp3
    chime.mp3
```

---

## Non-Goals (for this iteration)
- No authentication required (demo mode)
- No MongoDB persistence (session state in-memory only)
- No simulator bridge integration (future)
- No scenario editor (scenarios are TypeScript files)
- No link from main navigation
- No multi-language support
