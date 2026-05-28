# ATIS/METAR Comprehensive Inline Normalizer

## Problem
Die erste Pass-Implementation deckt nur die "expanded ATIS"-Form (z.B. EDDM mit `WIND 030 DEGREES 4 KNOTS`) ab. Real auftretende ATIS-Texte sind oft METAR-codiert (z.B. EDDF: `METAR EDDF 281050Z AUTO 02008KT 320V070 CAVOK 24/02 Q1025 NOSIG`). Diese werden vom TTS Buchstabe-für-Buchstabe gelesen. Zusätzlich liest die TTS-Engine Akronyme wie `ATIS`, `METAR`, `EDDF` als Einzelbuchstaben.

## Lösung
Erweiterung des bestehenden `normalizeAtisForSpeech` um:
1. Inline-METAR-Token-Expansion (alle gängigen WMO-Code-Form-FM-15-XV-Patterns)
2. ICAO-Airport-Code → City-Name via OpenAIP (Endpoint liefert den Namen schon mit)
3. Akronym-Lowercasing (`ATIS` → `atis`) damit TTS sie als Wort spricht statt zu spellen

## Backend — Airport-Name in FrequencyResponse

`server/api/airports/[icao]/frequencies.get.ts`:
- Extrahiere `airport.name` (oder Fallback `airport.municipality`) aus OpenAIP-Response
- Füge `airportName?: string` zu `FrequencyResponse`
- pm.vue speichert das in einer neuen Ref `airportNameForFreq` analog zu `airportFrequencies`

## Frontend — Erweiterte Normalizer-Pipeline

Neue Reihenfolge in `normalizeAtisForSpeech(text, opts?: { airportIcao, airportName })`:

```
1. ICAO-Airport-Code-Substitution
   - Wenn opts.airportIcao + opts.airportName gesetzt: \b{icao}\b → {name}
2. METAR-Token-Expansion (inline, siehe Tabelle unten)
3. ATIS-spezifische Regeln (bestehend — info-letter, expanded wind/temp/time)
4. normalizeRadioPhrase (bestehend — QNH/RWY/FL/freq)
5. Bare-Runway-Designators (bestehend)
6. Akronym-Lowercase: ATIS/METAR/SPECI → atis/metar/speci
7. Whitespace-Cleanup
```

### METAR-Token-Regeln (Schritt 2)

| Pattern | Output | Notizen |
|---|---|---|
| `\d{6}Z` | "on the {day} at {hours} {minutes} zulu" | DDHHMMZ |
| `\bAUTO\b` | "automatic observation" | |
| `\bCOR\b` | "correction" | |
| `(VRB\|\d{3})(\d{2,3})(G\d{2,3})?KT` | "wind {dir} degrees at {spd} knots[, gusting {gust} knots]" | VRB→"variable" |
| `\b00000KT\b` | "wind calm" | Special case |
| `(\d{3})V(\d{3})` | "variable between {a} and {b} degrees" | Wind-Variabilität |
| `R(\d{2}[LCR]?)/[MP]?\d{4}[UDN]?` | "runway {rwy} visibility [less/more than] {dist} meters[, increasing/decreasing]" | RVR |
| `\bCAVOK\b` | (bleibt — TTS spricht 'kavok' korrekt) | |
| `\b9999\b` | "visibility wun zero kilometers or more" | Max-Vis-Marker |
| `\bNSC\b` / `\bSKC\b` / `\bCLR\b` | "no significant cloud" / "sky clear" | |
| `\bNCD\b` | "no cloud detected" | Auto-Stationen |
| `\bVV(\d{3})\b` | "vertical visibility {alt}" | |
| Weather codes | "[light/heavy/in the vicinity] [descriptor] [type]" | Tabelle in code |
| `\bRE(\w+)\b` | "recent {phenomenon}" | |
| `\bWS\s+R(\d{2}[LCR]?)\b` | "wind shear runway {rwy}" | |
| `(M?\d{2})/(M?\d{2})` | "temperature {temp}, dewpoint {dew}" | M→"minus" |
| `\bQ(\d{4})\b` | "QNH {digits}" | hPa, ICAO |
| `\bA(\d{4})\b` | "altimeter {digits}" | inches Hg, US |
| `\bNOSIG\b` | "no significant change" | |
| `\bBECMG\b` | "becoming" | |
| `\bTEMPO\b` | "temporary" | |
| `\b(FM\|TL\|AT)(\d{4})\b` | "from/until/at {hhmm} zulu" | |

### Weather Codes (vollständige Tabelle)

**Intensität-Präfix:** `-` → "light", `+` → "heavy", `VC` → "in the vicinity"
**Descriptor:** `MI` (shallow), `BC` (patches), `DR` (low drifting), `BL` (blowing), `SH` (shower), `TS` (thunderstorm), `FZ` (freezing), `PR` (partial)
**Precipitation:** `DZ` (drizzle), `RA` (rain), `SN` (snow), `SG` (snow grains), `IC` (ice crystals), `PL` (ice pellets), `GR` (hail), `GS` (small hail), `UP` (unknown)
**Obscuration:** `BR` (mist), `FG` (fog), `FU` (smoke), `VA` (volcanic ash), `DU` (dust), `SA` (sand), `HZ` (haze)
**Other:** `PO` (dust devil), `SQ` (squall), `FC` (funnel cloud / tornado), `SS` (sandstorm), `DS` (duststorm)

### Akronym-Behandlung (Schritt 6)

**Lowercase (TTS liest als Wort):** `ATIS`, `METAR`, `SPECI`
**Bleiben uppercase (Pilots SPELLEN):** `QNH`, `ILS`, `VOR`, `DME`, `LOC`, `NDB`, `GP`, `RNAV`, `RNP`
**Begründung:** Wenn Pilots im echten Funk "ILS" sagen, dann spellen sie es ("I-L-S"). Bei ATIS und METAR sagen sie es als Wort.

## Wiring in pm.vue

```ts
// startAtisLoop:
const spokenAnnouncement = normalizeAtisForSpeech(announcement, {
  airportIcao: flightContext.value.dep,
  airportName: airportNameForFreq.value || undefined,
})
```

## Tests

Neue Unit-Tests in `tests/shared/radioSpeech.test.ts`:
1. EDDF METAR-Form (User-Beispiel): `METAR EDDF 281050Z AUTO 02008KT 320V070 CAVOK 24/02 Q1025 NOSIG` mit airportName=Frankfurt
2. Wind-Edge-Cases: VRB, calm, gusts
3. Visibility-Edge-Cases: 9999, 0800, RVR
4. Weather-Codes: -RA, +TSRA, FZRA, VCSH
5. Akronym-Lowercase: ATIS, METAR
6. Bestehendes EDDM-Test bleibt grün

## Out of Scope

- Cross-airport ICAO-Lookups (z.B. ATIS erwähnt Diversion-Flughafen)
- Runway-State-Codes `R25/0/0/0/00` (komplex, selten in VATSIM-ATIS)
- Sea state, military codes, NOTAM-Style-Codes
- Statute-Miles Vis (`5SM`) — selten in europäischen ATIS
- SSML-basierte TTS-Pronunciation (engine-spezifisch)
