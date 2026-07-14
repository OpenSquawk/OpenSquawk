# 1 — STT-Fuzzy-Matching härten (höchster Yield)

Warum Priorität 1: kleiner Umfang (eine Datei), aber jede falsch kalibrierte
Toleranz erzeugt sofort spürbare False-Positive/Negative-Readbacks im gesamten
Produkt. Kein Rearchitecting nötig, nur präzises Reasoning über Kanten- und
Verwechslungsfälle.

Diese Datei enthält bereits einen **verifizierten, reproduzierbaren Bug** (nicht
nur eine Vermutung) samt Root-Cause-Analyse, damit Fable die Zeit nicht mit
Suchen verbringt, sondern direkt mit Fixen. Zwei ursprünglich vermutete
Problemfelder wurden geprüft und als nicht relevant ausgeschlossen — siehe
"Bereits geprüft, kein Problem" unten, damit Fable dort keine Zeit investiert.

---

## Verifizierter Bug: Callsign-Verwechslung durch zu großzügigen Whole-String-Fuzzy-Fallback

**Fundstelle:** `callsignMatches()` in `shared/utils/sttMatch.ts:199-223`.

Reihenfolge im Code:
```ts
function callsignMatches(haystack: string, candidate: string): boolean {
  if (candidate.length >= 3 && haystack.includes(candidate)) return true
  if (fuzzyContains(haystack, candidate, 3)) return true   // <-- läuft VOR der Digit-genauen Prüfung
  const parts = splitCallsignParts(candidate)
  // ... digit-verankerte Prüfung erst danach
}
```

`fuzzyContains(haystack, candidate, 3)` erlaubt Toleranz
`allowedDistance(candidate.length) + 3`. Für einen typischen Callsign-Kandidaten
wie `"lufthansa 359"` (Länge 13) ist `allowedDistance(13) = 1`, macht `4`.

**Reproduktion (noch kein Test dafür vorhanden):**
- Erwarteter Callsign: `DLH359` (Alternative `"Lufthansa 359"`)
- Tatsächliche Transkription: `"Lufthansa three five zero"` → denormalisiert
  `"lufthansa 350"` (ein anderer Flug, Ziffer 9→0 vertauscht)
- Levenshtein-Distanz `"lufthansa 350"` vs. `"lufthansa 359"` = 1 (nur letzte
  Ziffer unterscheidet sich) → `1 <= 4` → **matcht fälschlich**, obwohl die
  Flugnummer objektiv falsch ist.

Das ist real sicherheitsrelevant für den Trainingszweck: Callsign-Verwechslung
zwischen ähnlichen Flugnummern ist genau die Art Fehler, die ein
ATC-Funktrainer eigentlich einüben/verhindern soll, nicht selbst produzieren.

**Root Cause:** der großzügige Whole-String-Fuzzy-Fallback läuft *vor* bzw.
*statt* der digit-verankerten Prüfung (`splitCallsignParts` + `digitsOk`
weiter unten in derselben Funktion), die genau dafür gebaut wurde, Ziffern
strikt zu verlangen und nur den Alpha-Teil (Airline-Name) tolerant zu behandeln.
Der Whole-String-Fallback umgeht diese Absicherung komplett, weil er auf der
gesamten Zeichenkette rechnet statt getrennt auf Alpha- und Digit-Teil.

**Nicht kaputt machen:** bestehende Tests in `tests/shared/sttMatch.test.ts`
decken bereits Airline-Namens-Tippfehler ab (`"Loftansa"`, `"Lufthana"`,
`"Speed bird"` getrennt, `"Easy 25"` → `EZY25`) — bei all diesen bleiben die
Ziffern unverändert korrekt, nur der Alpha-Teil hat Tippfehler. Der Fix darf
diese Fälle nicht regressieren; er muss nur verhindern, dass sich *falsche*
Ziffern durch die generelle Toleranz schmuggeln.

**Verwandter, wahrscheinlich gleiche-Ursache-Fall:** Callsigns mit einstelliger
Flugnummer (z. B. `"DLH4"`, `"RYR1"`) scheitern an
`splitCallsignParts()`s Anforderung `digits.length >= 2` und landen dadurch
*ebenfalls* ungeschützt im selben Whole-String-Fallback — vermutlich vom selben
Fix mit abgedeckt, sollte aber explizit mitgetestet werden.

## Bereits geprüft, kein Problem (nicht erneut untersuchen)

- **Squawk-Verwechslung (z. B. "7500" vs. "7000") durch Fuzzy-Toleranz:** kein
  Risiko. `squawk`-Felder sind nicht `isCallsign`, laufen daher nur durch
  `candidateMatches()`, welches **keinen** Levenshtein-Fuzzy nutzt (nur exaktes
  `includes()` bzw. Wortgrenzen-Regex bei <3 Zeichen). `fuzzyContains` wird nur
  aus `callsignMatches()` heraus aufgerufen.
- **Deutsche Runway-Suffixe ("links"/"rechts") fehlen in `RUNWAY_SUFFIX`:**
  kein Bug — ICAO-Standardphraseologie ist im gesamten Produkt Englisch, auch
  bei deutschen Flughäfen/Nutzern (siehe Scenario-Daten). Deutsche Wörter sind
  im erwarteten Funkspruch-Vokabular nicht vorgesehen, daher irrelevant.

## Prompt (copy-paste)

Kontext: OpenSquawk (Nuxt/TS ATC-Funktrainer). `shared/utils/sttMatch.ts` matched
Whisper-Transkripte gegen erwartete Readback-Felder (Callsign, Runway, Squawk etc.)
via Levenshtein-Fuzzy-Matching + spoken→written Normalisierung. Ein konkreter,
reproduzierbarer Bug ist oben in dieser Datei bereits verifiziert und mit
Root-Cause-Analyse dokumentiert — nutze das direkt, es muss nicht neu hergeleitet
werden.

Aufgabe:
1. Fixe den dokumentierten Bug in `callsignMatches()`
   (`shared/utils/sttMatch.ts:199-223`): die Ziffern eines Callsign-Kandidaten
   müssen exakt (oder mit sehr enger, längenabhängiger Toleranz) übereinstimmen,
   *bevor* eine großzügige Fuzzy-Toleranz auf den Airline-Namen angewendet
   werden darf. Der Whole-String-Fallback darf nicht mehr als alleiniger,
   ungeschützter erster Check laufen, wenn der Kandidat Ziffern enthält.
2. Stelle sicher, dass einstellige Flugnummern (`"DLH4"`, `"RYR1"`) korrekt und
   mit dem gleichen Sicherheitsniveau behandelt werden wie mehrstellige.
3. Alle bestehenden Tests in `tests/shared/sttMatch.test.ts` müssen weiter grün
   bleiben (siehe "Nicht kaputt machen" oben).

Liefere: den Fix als Diff, plus neue Testfälle in `tests/shared/sttMatch.test.ts`,
die mindestens abdecken:
- Der oben reproduzierte Fall ("Lufthansa 350" darf NICHT als "DLH359" matchen)
- Ein bis zwei benachbarte-Zahlen-Verwechslungsfälle mehr (z. B. "BAW271" vs.
  Transkript "BAW217" — Ziffern vertauscht, nicht nur eine falsch)
- Einstellige Flugnummer, korrekt und falsch
- Mindestens einer der bestehenden "soll matchen trotz Tippfehler"-Fälle bleibt
  grün (Regressionsschutz)

Nicht anfassen: die öffentliche API (`matchTranscriptionToFields`-Signatur bleibt
gleich) — das ist Vertrag für den Rest des Codes.

## Referenzdateien

`shared/utils/sttMatch.ts`, `tests/shared/sttMatch.test.ts` (bestehende Coverage
vorher lesen, nicht duplizieren).
