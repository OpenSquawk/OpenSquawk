So läuft unser Endpoint (TODO: auf englisch übersetzen).

# Request (Client → LLM-Router)

**HTTP**

```
POST /route/next-state
Content-Type: application/json
```

**Body**

```json
{
  "system_prompt": "You are an ATC state router. Given (1) the aircraft's current operational context, (2) a set of possible next states with short applicability notes, and (3) the pilot's transmission, choose exactly ONE next_state_key from the provided candidates. Respond ONLY in the specified JSON schema.",
  "current_state_text": "Short English sentence describing the aircraft's current situation.",
  "candidate_next_states": [
    { "key": "REQUEST_DESCENT", "description": "Pilot asks to descend to a lower FL/altitude." },
    { "key": "REQUEST_VECTORING", "description": "Pilot asks for radar vectors." },
    { "key": "RADIO_CHECK", "description": "Pilot asks for readability/strength check." }
  ],
  "pilot_utterance": "Exact pilot transmission in English (as heard/STT)."
}
```

Felder:

* `system_prompt` (string): Kurz, fixiert die Aufgabe + Ausgabeschema.
* `current_state_text` (string): Aktueller Zustand als 1 knapper englischer Satz.
* `candidate_next_states[]` (array): Liste erlaubter Ziele.

    * `key` (string): **Eindeutiger State-Key** (euer interner Bezeichner).
    * `description` (string): Wann dieser State passt (englisch, 1 Zeile).
* `pilot_utterance` (string): Funkspruch (roh oder normalisiert).

# Verlangtes Output (LLM → Router)

**Striktes JSON, exakt diese 3 Felder, keine Zusätze:**

```json
{
  "pilot_intent": "What the pilot intended, in one short English clause.",
  "rationale": "Brief reasoning using current_state_text + pilot_utterance + matching candidate description(s).",
  "next_state_key": "One of the provided candidate keys"
}
```

* `pilot_intent` (string, **erstes Feld**): Kurzfassung der Absicht des Piloten.
* `rationale` (string): Knappes Warum (Bezug auf Wortlaute/Trigger).
* `next_state_key` (string): **Genau einer** der `candidate_next_states[*].key`.

# Minimaler System-Prompt (empfohlen)

```
ROLE: ATC State Router
TASK: From current_state_text, candidate_next_states, and pilot_utterance, return EXACTLY the JSON schema below. Pick exactly ONE next_state_key from the candidates.

RESPONSE JSON SHAPE:
{
  "pilot_intent": "<short clause>",
  "rationale": "<1-3 concise sentences>",
  "next_state_key": "<one candidate key>"
}

RULES:
- Output ONLY valid JSON. No prose, no markdown.
- Do not invent keys. Choose from candidate_next_states only.
- If ambiguous, pick the best fit and say why in 'rationale'.
```

# Beispiel

**Request**

```json
{
  "system_prompt": "You are an ATC state router ...",
  "current_state_text": "A320 holding short RWY 25R at EDDL, IFR, ready for departure.",
  "candidate_next_states": [
    { "key": "REQUEST_TAKEOFF", "description": "Pilot requests takeoff clearance from holding short." },
    { "key": "RADIO_CHECK", "description": "Pilot asks for readability/strength check." },
    { "key": "REQUEST_DEPARTURE_INSTRUCTIONS", "description": "Pilot asks for initial heading/altitude after departure." }
  ],
  "pilot_utterance": "Düsseldorf Tower, DLH123 ready for departure runway two five right."
}
```

**Response**

```json
{
  "pilot_intent": "Request takeoff clearance",
  "rationale": "Pilot states 'ready for departure' while holding short RWY 25R. This matches the applicability note for REQUEST_TAKEOFF and not a radio check or a request for departure instructions.",
  "next_state_key": "REQUEST_TAKEOFF"
}
```

# Validierung (Server-seitig, optional aber sinnvoll)

* Prüfe: `next_state_key ∈ {keys der candidates}`.
* Leere/fehlende Felder → 400.
* Strict JSON parse (keine Anhängsel/Markdown).
