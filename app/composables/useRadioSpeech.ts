import { computed, type Ref } from 'vue'
import { useApi } from '~/composables/useApi'
import useCommunicationsEngine from '../../shared/utils/communicationsEngine'
import { loadPizzicatoLite } from '../../shared/utils/pizzicatoLite'
import type { PizzicatoLite } from '../../shared/utils/pizzicatoLite'
import { createNoiseGenerators, getReadabilityProfile } from '../../shared/utils/radioEffects'
import { pmLog } from '../../shared/utils/pmLog'
import { useSpeechInterrupt } from '~/composables/useSpeechInterrupt'
import {
  FREQUENCY_PLACEHOLDER,
  FREQ_ROLE_LABEL,
  normalizedFrequencyValue,
  type useFrequencyPresets,
} from '~/composables/useFrequencyPresets'

export type PreparedSpeech = {
  template: string
  plain: string
  normalized: string
}

export type SpeechOptions = {
  voice?: string
  tag?: string
  updateLastTransmission?: boolean
  lastTransmissionLabel?: string
  delayMs?: number
  useNormalizedForTTS?: boolean
  speed?: number
  lessonId?: string
}

export interface RadioSpeechDeps {
  setLastTransmission: (text: string) => void
  handlePilotTransmission: (message: string, source: 'text' | 'ptt') => Promise<void>
  lastControllerSay: Ref<string | null>
  signalStrength: Ref<number>
  speechSpeed: Ref<number>
  radioCheckLoading: Ref<boolean>
  radioEffectsEnabled: Ref<boolean>
  readbackEnabled: Ref<boolean>
}

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

export function useRadioSpeech(
  engine: ReturnType<typeof useCommunicationsEngine>,
  freq: ReturnType<typeof useFrequencyPresets>,
  speechInterrupt: ReturnType<typeof useSpeechInterrupt>,
  deps: RadioSpeechDeps,
) {
  const { variables: vars, flags, flightContext, currentState, sessionId: engineSessionId, appendLogEntry, renderATCMessage, normalizeATCText } = engine
  const { frequencies, airportFrequencies, airportName } = freq
  const {
    stopCurrentSpeech, enqueueSpeech, getSpeechGeneration,
    setCurrentAudio, setCurrentPizzicatoSound, addPendingAbort, deletePendingAbort,
  } = speechInterrupt
  const {
    setLastTransmission, handlePilotTransmission, lastControllerSay,
    signalStrength, speechSpeed, radioCheckLoading, radioEffectsEnabled, readbackEnabled,
  } = deps
  const api = useApi()

  let audioContext: AudioContext | null = null
  let pizzicatoLite: PizzicatoLite | null = null

  const radioQuality = computed(() => {
    const strength = signalStrength.value
    if (strength >= 5) return { color: 'success', text: 'EXCELLENT' }
    if (strength >= 4) return { color: 'success', text: 'GOOD' }
    if (strength >= 3) return { color: 'warning', text: 'FAIR' }
    if (strength >= 2) return { color: 'orange', text: 'POOR' }
    return { color: 'error', text: 'WEAK' }
  })

  const speechSpeedLabel = computed(() => `${speechSpeed.value.toFixed(2)}x`)

  const prepareSpeech = (tpl: string): PreparedSpeech => {
    const plain = renderATCMessage(tpl)
    const normalized = normalizeATCText(tpl, { ...vars.value, ...flags.value })
    return { template: tpl, plain, normalized }
  }

  const ensureAudioContext = async (): Promise<AudioContext | null> => {
    if (typeof window === 'undefined') return null

    if (!audioContext) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext
      if (!Ctx) return null
      audioContext = new Ctx()
    }

    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume()
      } catch (err) {
        console.warn('AudioContext resume failed', err)
      }
    }

    return audioContext
  }

  const ensurePizzicato = async (ctx: AudioContext | null): Promise<PizzicatoLite | null> => {
    if (!ctx) return null
    if (!pizzicatoLite) {
      pizzicatoLite = await loadPizzicatoLite()
    }
    return pizzicatoLite
  }

  const playAudioWithEffects = async (base64: string, mime = 'audio/wav') => {
    if (typeof window === 'undefined') return

    const dataUrl = `data:${mime || 'audio/wav'};base64,${base64}`

    const playWithoutEffects = () =>
      new Promise<void>((resolve) => {
        const audio = new Audio(dataUrl)
        setCurrentAudio(audio)
        audio.onended = () => { setCurrentAudio(null); resolve() }
        audio.onerror = () => { setCurrentAudio(null); resolve() }
        audio.play().catch(() => { setCurrentAudio(null); resolve() })
      })

    if (!radioEffectsEnabled.value) {
      await playWithoutEffects()
      return
    }

    try {
      const ctx = await ensureAudioContext()
      const pizzicato = await ensurePizzicato(ctx)
      if (!ctx || !pizzicato) throw new Error('Audio engine unavailable')

      const sound = await pizzicato.createSoundFromBase64(ctx, base64)
      const readability = Math.max(1, Math.min(5, signalStrength.value))
      const profile = getReadabilityProfile(readability)

      const { Effects } = pizzicato

      const highpass = new Effects.HighPassFilter(ctx, {
        frequency: profile.eq.highpass,
        q: profile.eq.highpassQ,
      })
      const lowpass = new Effects.LowPassFilter(ctx, {
        frequency: profile.eq.lowpass,
        q: profile.eq.lowpassQ,
      })
      sound.addEffect(highpass)
      sound.addEffect(lowpass)

      if (profile.eq.bandpass) {
        sound.addEffect(
          new Effects.BandPassFilter(ctx, {
            frequency: profile.eq.bandpass.frequency,
            q: profile.eq.bandpass.q,
          }),
        )
      }

      if (profile.presence) {
        sound.addEffect(new Effects.PeakingFilter(ctx, profile.presence))
      }

      profile.distortions.forEach((amount) => {
        sound.addEffect(new Effects.Distortion(ctx, { amount }))
      })

      sound.addEffect(new Effects.Compressor(ctx, profile.compressor))

      if (profile.tremolos) {
        profile.tremolos.forEach((tremolo) => {
          sound.addEffect(new Effects.Tremolo(ctx, tremolo))
        })
      }

      sound.setVolume(profile.gain)

      const stopNoiseGenerators = createNoiseGenerators(ctx, sound.duration, profile, readability)

      setCurrentPizzicatoSound(sound)
      try {
        await sound.play()
      } finally {
        setCurrentPizzicatoSound(null)
        stopNoiseGenerators.forEach((stop) => stop())
        sound.clearEffects()
      }
    } catch (err) {
      console.error('Failed to apply radio effect', err)
      await playWithoutEffects()
    }
  }

  /** Kick off TTS generation immediately (parallel to whatever is playing). */
  const fetchSpeechAudio = (prepared: PreparedSpeech, options: SpeechOptions = {}): Promise<any | null> => {
    const abort = new AbortController()
    addPendingAbort(abort)
    return (async () => {
      try {
        const speed = options.speed ?? speechSpeed.value
        const usesNormalized = options.useNormalizedForTTS !== false
        const response = await api.post('/api/atc/say', {
          text: usesNormalized ? prepared.normalized : prepared.plain,
          // The normalized variant already went through the client-side
          // radiotelephony normalizer — the server must not normalize again.
          preNormalized: usesNormalized,
          level: signalStrength.value,
          voice: options.voice || 'alloy',
          speed,
          moduleId: 'pilot-monitoring',
          lessonId: currentState.value?.id || 'general',
          tag: options.tag || 'controller-reply',
          sessionId: engineSessionId.value || flags.value.session_id || undefined,
        }, { signal: abort.signal })
        if (abort.signal.aborted) return null // frequency changed while in flight
        return response
      } catch (err: any) {
        if (err?.name === 'AbortError' || abort.signal.aborted) {
          pmLog.info('TTS cancelled (frequency change)')
          return null
        }
        pmLog.error('TTS FAILED', err)
        console.error('TTS failed:', err)
        return null
      } finally {
        deletePendingAbort(abort)
      }
    })()
  }

  const speakPrepared = async (
    prepared: PreparedSpeech,
    options: SpeechOptions = {},
    audioPromise?: Promise<any | null>,
  ) => {
    pmLog.info('TTS ▶', prepared.plain.slice(0, 100))
    const response = await (audioPromise ?? fetchSpeechAudio(prepared, options))
    if (!response) return

    if (response.success && response.audio) {
      pmLog.debug('TTS ✓  provider=%s  size=%dB', response.meta?.ttsProvider, response.audio.size)
      if (options.updateLastTransmission !== false) {
        setLastTransmission(options.lastTransmissionLabel || `ATC: ${prepared.plain}`)
      }
      await playAudioWithEffects(response.audio.base64, response.audio.mime)
    } else {
      pmLog.warn('TTS ✗  unexpected response', response)
    }
  }

  const speakWithRadioEffects = (tpl: string, options: SpeechOptions = {}) => {
    const prepared = prepareSpeech(tpl)
    const delay = options.delayMs ?? 0
    // Start TTS generation NOW — it overlaps queued speech and the artificial
    // controller delay instead of adding to them, so the audible latency is
    // max(generation, delay) rather than the sum of everything in the queue.
    const audioPromise = fetchSpeechAudio(prepared, options)
    enqueueSpeech(async () => {
      const generation = getSpeechGeneration()
      if (delay > 0) {
        await wait(delay)
      }
      if (generation !== getSpeechGeneration()) return // stopped while waiting
      await speakPrepared(prepared, options, audioPromise)
    })
  }

  const speakPlainText = (text: string, options: SpeechOptions = {}) => {
    const trimmed = text.trim()
    if (!trimmed) {
      return Promise.resolve()
    }

    const speed = options.speed ?? speechSpeed.value
    const lessonId = options.lessonId || currentState.value?.id || 'general'

    return enqueueSpeech(async () => {
      try {
        const response = await api.post('/api/atc/say', {
          text: trimmed,
          level: signalStrength.value,
          voice: options.voice || 'alloy',
          speed,
          moduleId: 'pilot-monitoring',
          lessonId,
          tag: options.tag || 'announcement',
          sessionId: engineSessionId.value || flags.value.session_id || undefined,
        })

        if (response.success && response.audio) {
          if (options.updateLastTransmission !== false) {
            setLastTransmission(options.lastTransmissionLabel || trimmed)
          }
          await playAudioWithEffects(response.audio.base64, response.audio.mime)
        }
      } catch (err) {
        console.error('TTS failed:', err)
      }
    })
  }

  const scheduleControllerSpeech = (tpl: string) => {
    const plain = renderATCMessage(tpl)
    speakWithRadioEffects(tpl, {
      delayMs: 800 + Math.random() * 2000,
      tag: 'controller-reply',
      updateLastTransmission: true,
      useNormalizedForTTS: true,
      lastTransmissionLabel: `ATC: ${plain}`,
    })
  }

  const speakPilotReadback = (text: string) => {
    speakWithRadioEffects(text, {
      delayMs: 400,
      voice: 'verse',
      tag: 'pilot-readback',
      updateLastTransmission: false,
      useNormalizedForTTS: true,
    })
  }

  const RADIO_CHECK_RE = /\b(radio|signal)\s*check\b|how do you read/i
  // Pilot asking ATC to repeat its last transmission.
  const SAY_AGAIN_RE = /\b(say again|come again|repeat( that| your last)?)\b|please\s+say\s+again|pls\s+say\s+again/i
  // Bare sign-off / pleasantry (no substantive content alongside).
  const FAREWELL_RE = /\b(good\s?bye|bye[\s-]?bye|tsch(ü|ue)ss|servus|good day|cheerio|auf\s?wieder|thank you|thanks|danke)\b/i

  /** Spoken readability per signal-strength level (1–5). */
  const READABILITY_PHRASE: Record<number, string> = {
    5: 'read you 5, loud and clear',
    4: 'read you 4',
    3: 'read you 3, readable with difficulty',
    2: 'read you 2, say again',
    1: 'read you 1, unreadable',
  }

  /** Whichever station owns the currently tuned frequency, if any. */
  const tunedStationEntry = () => {
    const active = normalizedFrequencyValue(frequencies.value.active)
    if (!active) return null
    return airportFrequencies.value.find(entry =>
      entry.frequency
      && entry.frequency !== FREQUENCY_PLACEHOLDER
      && normalizedFrequencyValue(entry.frequency) === active,
    ) ?? null
  }

  const answerRadioCheck = (transcript: string) => {
    const callsign = (vars as any).value?.callsign || flightContext.value.callsign || ''
    const entry = tunedStationEntry()

    // ATIS is a broadcast, and an unknown frequency is unstaffed — no reply.
    if (!entry || entry.type === 'ATIS') {
      pmLog.info('RADIO CHECK — no station on', frequencies.value.active)
      setLastTransmission(`Pilot: ${transcript} — no reply on ${frequencies.value.active}`)
      appendLogEntry('system', `No reply on ${frequencies.value.active}`, currentState.value?.id ?? '', {
        radioCheck: true,
        frequency: frequencies.value.active,
      })
      return
    }

    const role = FREQ_ROLE_LABEL[entry.type] || entry.type
    const station = airportName.value ? `${airportName.value} ${role}` : role
    const readability = READABILITY_PHRASE[signalStrength.value] || `read you ${signalStrength.value}`
    const reply = callsign
      ? `${callsign}, ${station}, ${readability}`
      : `Station calling, ${station}, ${readability}`

    pmLog.info('RADIO CHECK', { station, freq: frequencies.value.active, readability: signalStrength.value })
    lastControllerSay.value = reply
    scheduleControllerSpeech(reply)
    appendLogEntry('atc', reply, currentState.value?.id ?? '', {
      radioCheck: true,
      frequency: frequencies.value.active,
    })
  }

  const performRadioCheck = async () => {
    if (!flightContext.value.callsign) return

    radioCheckLoading.value = true

    const station = tunedStationEntry()
    const stationName = station && station.type !== 'ATIS'
      ? (airportName.value ? `${airportName.value} ${FREQ_ROLE_LABEL[station.type] || station.type}` : FREQ_ROLE_LABEL[station.type] || station.type)
      : frequencies.value.active
    const message = `${stationName}, ${flightContext.value.callsign}, radio check`

    try {
      await handlePilotTransmission(message, 'text')
    } catch (err) {
      console.error('Radio check failed:', err)
    } finally {
      radioCheckLoading.value = false
    }
  }

  // Readability / signal strength quick-select (top bar)
  const readabilityOptions = [
    { value: 5, label: 'Excellent', sublabel: 'Readability 5', color: '#22c55e' },
    { value: 4, label: 'Good', sublabel: 'Readability 4', color: '#22c55e' },
    { value: 3, label: 'Fair', sublabel: 'Readability 3', color: '#eab308' },
    { value: 2, label: 'Poor', sublabel: 'Readability 2', color: '#f97316' },
    { value: 1, label: 'Weak', sublabel: 'Readability 1', color: '#ef4444' },
  ]
  const onReadabilitySelect = (opt: { value: string | number }) => {
    signalStrength.value = Number(opt.value)
  }

  return {
    signalStrength,
    speechSpeed,
    radioCheckLoading,
    radioEffectsEnabled,
    readbackEnabled,
    radioQuality,
    speechSpeedLabel,
    RADIO_CHECK_RE,
    SAY_AGAIN_RE,
    FAREWELL_RE,
    speakWithRadioEffects,
    speakPlainText,
    scheduleControllerSpeech,
    speakPilotReadback,
    answerRadioCheck,
    performRadioCheck,
    readabilityOptions,
    onReadabilitySelect,
  }
}
