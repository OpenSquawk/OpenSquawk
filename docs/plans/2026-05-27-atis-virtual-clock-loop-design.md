# ATIS Virtual-Clock Loop

## Problem
Heute spielt der "Play ATIS"-Button die VATSIM-ATIS-Ansage genau einmal ab. In der Realität läuft ATIS dauerhaft; wer auf die Frequenz tuned, steigt mitten im Satz ein und hört dann durch bis zum Wiederanfang. Das wollen wir nachbilden, ohne den TTS-Stack komplexer zu machen.

## Lösung
Vollständige ATIS-Ansage einmal synthetisieren, im Frontend als `<audio>`-Element loopen, und beim Tunen den `currentTime`-Offset aus einer virtuellen Uhr ableiten.

```
offset_seconds = ((Date.now() - epoch_ms) / 1000) % audio.duration
```

`epoch_ms` = `Date.parse(entry.lastUpdated)` von der VATSIM-ATIS (Fallback `Date.now()`). Damit sind alle Clients, die gleichzeitig tunen, phasensynchron — und beim ATIS-Update (neuer Info-Letter) startet die Phase neu, was sich richtig anfühlt.

## Verworfene Alternativen
- **Server schneidet Audio passend** — bricht TTS-Caching, geht nicht mit Black-Box-TTS (OpenAI), unnötiger Komplexitätszuwachs.
- **Client-Epoch statt VATSIM-Epoch** — funktioniert, verliert aber Multi-Client-Sync ohne Gewinn.

## Backend
- `server/api/atc/say.post.ts`: `tag: 'atis'` aktiviert dieselbe Disk-Cache-Logik wie `tag: 'flightlab'`. Cache-Key = sha256 über normalisiertem Text + Voice/Speed/Provider. So wird identische ATIS-Ansage nicht jedes Mal neu synthetisiert.
- Kein neuer Endpoint. Der ATIS-Text kommt weiterhin aus `GET /api/airports/[icao]/frequencies`.

## Frontend (`app/pages/pm.vue`)
**Neue State-Refs**
- `atisLoopAudio: Ref<HTMLAudioElement | null>` — aktives Loop-Element
- `atisLoopKey: Ref<string | null>` — `${icao}:${atisCode}` zum Erkennen, ob Restart nötig
- `atisLoopSeq` — Monotoner Counter gegen Race-Conditions (TTS-Response trifft nach Weg-Tunen ein)

**Neue Funktionen**
- `startAtisLoop(entry)` — Idempotent. Wenn schon der gleiche Key läuft, nichts tun. Sonst: POST `/api/atc/say` mit `tag: 'atis'`, Audio-Element bauen, im `loadedmetadata`-Handler Offset setzen, `play()`.
- `stopAtisLoop()` — Pause + `src` lösen + Refs nullen.

**Trigger**
- Watcher: wenn aktive Frequenz ATIS ist (`atisFrequencyEntry` matched aktive Freq), `startAtisLoop`. Sonst `stopAtisLoop`.
- Watcher auf `atisFrequencyEntry.atisCode` — bei Wechsel Restart.
- Bestehender Button (`playAtisBroadcast`) ruft `startAtisLoop` (idempotent, falls Auto-Trigger das schon gemacht hat).

**Keine Radio-FX**
Der Pizzicato-Effekt-Chain ist auf One-Shot-Wiedergabe ausgelegt und passt nicht zum Loop. ATIS klingt im echten Funk sowieso anders (stationäre Sendung statt komprimierter ATC-TX). Radio-FX im Loop wäre ein separates Follow-up.

## Edge Cases
- Kein `atisText` → Loop startet nicht.
- TTS-Fehler → Loop startet nicht, keine UI-Eskalation.
- Weg-Tunen während TTS-Request läuft → `atisLoopSeq`-Check verwirft die Response.
- ATIS-Code-Wechsel → Stop & Restart mit neuem Audio.
- Tab-Background / Browser-Throttling → kein Sondercode; `audio.loop = true` läuft weiter.

## Out of Scope
- Radio-FX im Loop
- ATIS-Lautstärke unabhängig vom ATC-TX
- Cross-fade beim ATIS-Update
