# ATIS-Phraseology Normalizer

## Problem
Mein ATIS-Loop sendet die rohe VATSIM-ATIS-Zeichenkette an TTS. Die TTS-Engine spricht Aviation-Abkürzungen wie `QNH`/`ILS` Buchstabe-für-Buchstabe aus und liest `WIND 030`, `TEMPERATURE 18`, `TIME 0620` wie englische Zahlwörter ("zero thirty", "eighteen", "six hundred twenty") statt ICAO-konform Ziffer-für-Ziffer ("zero three zero", "one eight", "zero six two zero").

Real-World VATSIM-ATIS (EDDM, 2026-05-28):
```
MUENCHEN INFORMATION A AUTOMATIC MET REPORT TIME 0620
RUNWAY 08L AND 08R RUNWAYS IN USE 08L AND 08R TRL 60
WIND 030 DEGREES 4 KNOTS VARIABLE BETWEEN 340 AND 060 DEGREES
CAVOK TEMPERATURE 18 DEW POINT 7 QNH 1024
TREND NOSIG MUENCHEN INFORMATION A OUT
```

## Lösung
Neue Funktion `normalizeAtisForSpeech(text)` in `shared/utils/radioSpeech.ts`, die ATIS-spezifische Regex-Transformationen auf bestehenden Helpers (`spellIcaoDigits`, `ICAO_LETTERS`, `METAR_CLOUD`) aufbaut. Output behält den ICAO-Phonetik-Stil (`wun zero too four`), der schon im Rest der App (`speakWithRadioEffects` mit `useNormalizedForTTS: true`) verwendet wird.

## Verworfene Alternativen
- **LLM (OpenAI) für die Normalisierung** — flexibler bei ungewöhnlichen Formaten, aber +500ms beim Cold-Cache, nondeterministisch, kostet pro unique ATIS. ICAO-Format ist standardisiert genug für Regeln.
- **Hybrid (Regel + LLM-Fallback)** — doppelte Komplexität ohne klaren Nutzen.

## Transformations-Regeln (in Reihenfolge anwenden — spezifisch → generisch)

| Eingabe | Ausgabe | Anmerkung |
|---|---|---|
| `INFORMATION A` | `INFORMATION Alfa` | NATO-Phonetic für Info-Letter |
| `TIME 0620` | `time zero six two zero` | 4-stellige Zulu-Zeit |
| `WIND 030 DEGREES` | `wind zero three zero degrees` | 3-stellige Windrichtung |
| `BETWEEN 340 AND 060 DEGREES` | `between three four zero and zero six zero degrees` | Wind-Variabilität |
| `4 KNOTS` / `15 KNOTS` | `four knots` / `one five knots` | Wind/Gust-Speed ziffernweise |
| `TEMPERATURE -5` | `temperature minus five` | Negative Temperaturen |
| `TEMPERATURE 18` | `temperature one eight` | Zweistellig ziffernweise |
| `DEW POINT 7` | `dew point seven` | Einstellig wortgenau |
| `TRL 60` / `TL 60` | `transition level six zero` | Transition-Level |
| `NOSIG` | `no significant change` | TREND-Code |
| `BKN030` | `broken three thousand` | Cloud-Layer, Höhe ×100 ft, ohne "feet" |
| `FEW005 CB` | `few five hundred cumulonimbus` | Cloud-Layer + Typ |
| `VIS 10 KM` | `visibility one zero kilometers` | Sicht in km |
| `VIS 5000 M` | `visibility five thousand meters` | Sicht in m |
| Bare `08L` / `08R` | `zero eight left` / `zero eight right` | Runway-Designator ohne `RUNWAY`-Prefix |
| Final: `normalizeRadioPhrase` über Ergebnis | — | Fängt `QNH 1024`, expliziter `RUNWAY 08L`, `FL250`, Frequenzen |

## Call-Site
In `pm.vue` → `startAtisLoop`, direkt vor dem TTS-Request:

```ts
const announcement = buildAtisAnnouncement({ ...entry, atisText: content })
const spoken = normalizeAtisForSpeech(announcement)
// then: text: spoken in api.post body
```

Der Disk-Cache in `say.post.ts` hasht den normalisierten Input — gleicher ATIS-Text → gleicher Cache-Key → unverändert effizient.

## Tests
Unit-Tests in `shared/utils/radioSpeech.test.ts` (falls vorhanden) mit den oben gelisteten Input/Output-Paaren als Fixtures.

## Out of Scope
- METAR-Wetter-Codes (`+TSRA`, `-FZRA`) — in VATSIM-ATIS meist ausgeschrieben
- Runway-Conditions (`WET`, `BRAKING ACTION POOR`) — wenn Feld auftaucht, erweitern
- Deutsche ATIS-Texte (selten in VATSIM)
- Spezielle Runway-Routing-Hinweise (`EXPECT VECTORS FOR INDEPENDENT PARALLEL ILS APPROACH`) — durchgereicht, TTS liest's leidlich
