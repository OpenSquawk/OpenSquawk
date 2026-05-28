# ATIS Carrier-Noise Bed + Sample-Accurate Loop Seek

## Problem
1. Beim Tunen auf die ATIS-Frequenz vergeht eine spürbare Zeit zwischen Klick und ATIS-Audio (TTS-Synthese ~500–1500 ms beim Cold-Cache). In dieser Zeit ist Stille — der Pilot weiß nicht, ob die Frequenz richtig ist oder die App hängt.
2. Der Loop-Seek (`audio.currentTime = offset`) per HTMLAudioElement auf data: URLs ist nicht garantiert sample-accurate — Browser quantisieren je nach Format. Wir brauchen Evidenz, dass der berechnete Einstiegspunkt auch wirklich abgespielt wird.

## Lösung
Neue Helper-Klasse `createAtisAudioLoop()` in `shared/utils/atisAudioLoop.ts` mit Web-Audio-API-basierter Pipeline:

```
Carrier-Noise (looped BufferSource) → bandpass → gain ─┐
                                                       ├─→ destination
ATIS-Audio (looped BufferSource, start(0, offset)) → gain ─┘
```

- **Carrier startet sofort** beim Tunen (laute Stufe, gain 0.45), liefert sofortiges Feedback.
- **ATIS-Audio kommt asynchron** dazu, dann fade-down vom Carrier auf "bed"-Lautstärke (gain 0.12).
- Web Audio API `AudioBufferSourceNode.start(when, offset)` ist sample-accurate — der berechnete Einstiegspunkt stimmt garantiert.
- `getState()` und `window.__atisDebug` machen den aktuellen Zustand inspizierbar.

## Verworfene Alternativen
- **HTMLAudioElement behalten + nur Carrier dazu** — HTMLAudio-seek ist je nach Format/Browser ungenau, und wir können den Audio-Output nicht über ein gemeinsames AudioContext mit dem Carrier mixen. Doppelter Output-Pfad führt zu Sync-Drift und ungewollten Klick-Geräuschen beim Übergang.
- **Pizzicato-basierte Chain mit Radio-FX** — der bestehende `playAudioWithEffects`-Pfad ist auf One-Shot-PTT-Audio ausgelegt (Lowpass, Compression, Distortion). Real-World-ATIS ist eine stationäre Sendung mit anderem Klang, FX wären falsch. Carrier bleibt der einzige Effekt.

## Komponenten

### `createAtisAudioLoop()` (neu)
```ts
type AtisAudioLoop = {
  startLoading(level?: number): void          // Carrier sofort, loud-Stufe
  startBroadcast(opts: {                       // ATIS decodieren + starten
    audioBase64: string
    mime: string
    epochMs: number
  }): Promise<{ requestedOffset: number; duration: number }>
  stop(): void
  getState(): {
    phase: 'idle' | 'loading' | 'playing'
    requestedOffset?: number
    duration?: number
    startedAt?: number
  }
}
```

**Carrier-Noise:**
- 1-Sekunden-Buffer, weißes Rauschen, Bandpass 1500 Hz mit Q=1.0 (radio-Charakter)
- `BufferSource.loop = true`
- Gain-Stufen: `LOUD = 0.45`, `BED = 0.12`
- Übergänge via `gain.linearRampToValueAtTime` über 0.5 s
- Bleibt auch nach `startBroadcast` an, nur leiser → "subtiles Bett"

**ATIS-Audio:**
- `ctx.decodeAudioData(arrayBuffer)` → AudioBuffer
- `source.loop = true`
- `source.start(0, offset)` wobei `offset = ((Date.now() - epochMs) / 1000) % duration`
- Eigenes Gain-Node (gain 1.0)

### Verifikation
- `startBroadcast()` returnt `{ requestedOffset, duration }`. pm.vue loggt das via `pmLog.info`.
- `window.__atisDebug` exposed `{ ctx, source, requestedOffset, duration, startedAt }` für manuelles Console-Inspizieren — nur in dev / `import.meta.dev`.
- Da Web Audio API spec'd ist auf sample-accurate `start(when, offset)`, kann man die Korrektheit per `audioCtx.currentTime - startedAtCtx + offset` gegen die hörbare Position abgleichen.

### Wiring in pm.vue
- Refs `atisLoopAudio: HTMLAudioElement | null` → ersetzen durch `atisAudioLoop: AtisAudioLoop | null`
- `startAtisLoop(entry)`:
  - Sync: `loop.startLoading(level)` — Carrier sofort
  - Async: TTS-Request → bei Erfolg `loop.startBroadcast({ audioBase64, mime, epochMs })`
- `stopAtisLoop()` → `loop.stop()` + null aus

### Tests
Schwer unit-testbar (Web Audio API braucht jsdom-Mock oder echten Browser). Stattdessen:
- Manuelle Verifikation per `window.__atisDebug` im Browser-Console
- Log-Output prüfen: `requestedOffset > 0` beim Re-Tune

## Out of Scope
- Squelch-Klick-Effekte beim Frequenzwechsel
- Radio-FX-Chain auf ATIS-Audio (Lowpass/Distortion/Compression)
- Multi-Channel-Mix (Stereo-Verteilung Carrier vs. Voice)
- Volume-Slider im UI
