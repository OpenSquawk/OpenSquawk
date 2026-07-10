/**
 * Low-level speech interruption/queue primitives, split out from
 * useRadioSpeech so it has zero dependency on frequency/airport state.
 * useFrequencyPresets needs stopCurrentSpeech (tuning away cuts in-flight
 * ATC speech) while useRadioSpeech needs frequency state — instantiating
 * both from one composable would be circular, so this piece is
 * constructed first and threaded into both.
 */
export function useSpeechInterrupt() {
  let speechQueue: Promise<void> = Promise.resolve()

  // Tracks objects that must be torn down when frequency changes mid-speech.
  let _currentAudio: HTMLAudioElement | null = null
  let _currentPizzicatoSound: { stop: () => void } | null = null
  // All in-flight TTS requests (playback is serialized, but generation runs in
  // parallel so a reply's TTS doesn't wait for earlier speech to finish playing).
  const _pendingSpeechAborts = new Set<AbortController>()
  // Incremented on each stopCurrentSpeech() call so enqueued tasks can detect
  // they belong to a cancelled generation and exit early.
  let _speechGeneration = 0

  const getSpeechGeneration = () => _speechGeneration

  /** Immediately stop any in-flight TTS request and audio playback. */
  const stopCurrentSpeech = () => {
    _speechGeneration++
    for (const abort of _pendingSpeechAborts) {
      abort.abort()
    }
    _pendingSpeechAborts.clear()
    if (_currentPizzicatoSound) {
      try { _currentPizzicatoSound.stop() } catch (_) { /* ignore */ }
      _currentPizzicatoSound = null
    }
    if (_currentAudio) {
      _currentAudio.pause()
      _currentAudio.src = ''
      _currentAudio = null
    }
    // Drop queued tasks by resolving the queue immediately.
    speechQueue = Promise.resolve()
  }

  const enqueueSpeech = (task: () => Promise<void>) => {
    const generation = _speechGeneration
    speechQueue = speechQueue
      .then(() => {
        if (generation !== _speechGeneration) return // cancelled — skip
        return task()
      })
      .catch(err => {
        if (err?.name !== 'AbortError') console.error('Speech queue error:', err)
      })
    return speechQueue
  }

  const setCurrentAudio = (audio: HTMLAudioElement | null) => { _currentAudio = audio }
  const setCurrentPizzicatoSound = (sound: { stop: () => void } | null) => { _currentPizzicatoSound = sound }
  const addPendingAbort = (abort: AbortController) => { _pendingSpeechAborts.add(abort) }
  const deletePendingAbort = (abort: AbortController) => { _pendingSpeechAborts.delete(abort) }

  return {
    stopCurrentSpeech,
    enqueueSpeech,
    getSpeechGeneration,
    setCurrentAudio,
    setCurrentPizzicatoSound,
    addPendingAbort,
    deletePendingAbort,
  }
}
