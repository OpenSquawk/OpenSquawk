// shared/composables/flightlab/useFlightLabAudio.ts
import { ref } from 'vue'
import type { FlightLabSound } from '../../data/flightlab/types'
import { getReadabilityProfile, createNoiseGenerators } from '../../utils/radioEffects'

export function useFlightLabAudio() {
  const isSpeaking = ref(false)
  const audioContext = ref<AudioContext | null>(null)
  const activeSounds = ref<Map<string, { source: AudioBufferSourceNode; gain: GainNode }>>(new Map())
  const masterGain = ref<GainNode | null>(null)
  const soundBuffers = ref<Map<string, AudioBuffer>>(new Map())
  let speechQueue: Promise<void> = Promise.resolve()
  let pizzicato: any = null

  function getContext(): AudioContext {
    if (!audioContext.value) {
      audioContext.value = new AudioContext()
      masterGain.value = audioContext.value.createGain()
      masterGain.value.gain.value = 1.0
      masterGain.value.connect(audioContext.value.destination)
    }
    return audioContext.value
  }

  async function loadPizzicato() {
    if (!pizzicato) {
      const mod = await import('../../utils/pizzicatoLite')
      pizzicato = await (mod.loadPizzicatoLite || mod.default)()
    }
    return pizzicato
  }

  async function preloadSounds(soundIds: string[]) {
    const ctx = getContext()
    await Promise.all(
      soundIds.map(async (id) => {
        if (soundBuffers.value.has(id)) return
        try {
          const res = await fetch(`/audio/flightlab/${id}.mp3`)
          const buf = await res.arrayBuffer()
          const decoded = await ctx.decodeAudioData(buf)
          soundBuffers.value.set(id, decoded)
        } catch (e) {
          console.warn(`[FlightLabAudio] Could not load sound: ${id}`, e)
        }
      })
    )
  }

  function playAmbientSound(id: string, volume = 0.3, loop = true) {
    const ctx = getContext()
    const buffer = soundBuffers.value.get(id)
    if (!buffer || !masterGain.value) return

    // Stop existing instance of this sound
    stopAmbientSound(id)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = loop

    const gain = ctx.createGain()
    gain.gain.value = volume
    source.connect(gain)
    gain.connect(masterGain.value)
    source.start(0)

    activeSounds.value.set(id, { source, gain })

    if (!loop) {
      source.onended = () => { activeSounds.value.delete(id) }
    }
  }

  function stopAmbientSound(id: string) {
    const s = activeSounds.value.get(id)
    if (s) {
      try { s.source.stop() } catch {}
      activeSounds.value.delete(id)
    }
  }

  function crossfadeSound(id: string, targetVolume: number, durationMs = 1500) {
    const ctx = getContext()
    const s = activeSounds.value.get(id)
    if (s) {
      s.gain.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + durationMs / 1000)
      if (targetVolume === 0) {
        setTimeout(() => stopAmbientSound(id), durationMs + 100)
      }
    }
  }

  function handlePhaseSounds(sounds: FlightLabSound[]) {
    for (const s of sounds) {
      switch (s.action) {
        case 'play':
          playAmbientSound(s.id, s.volume ?? 0.3, s.loop ?? false)
          break
        case 'stop':
          stopAmbientSound(s.id)
          break
        case 'crossfade':
          crossfadeSound(s.id, s.volume ?? 0)
          break
      }
    }
  }

  async function speakAtcMessage(text: string, options?: { speed?: number; readability?: number }): Promise<void> {
    return new Promise((resolve) => {
      speechQueue = speechQueue.then(async () => {
        isSpeaking.value = true
        try {
          // Call the existing TTS API
          const res = await $fetch('/api/atc/say', {
            method: 'POST',
            body: {
              text,
              level: options?.readability ?? 5,
              speed: options?.speed ?? 0.9,
              tag: 'flightlab',
            },
          })

          if (res.success && res.audio?.base64) {
            await playWithRadioEffects(res.audio.base64, res.audio.mime, options?.readability ?? 5)
          }
        } catch (e) {
          console.error('[FlightLabAudio] TTS error:', e)
        } finally {
          isSpeaking.value = false
          resolve()
        }
      }).catch(() => {
        isSpeaking.value = false
        resolve()
      })
    })
  }

  async function playWithRadioEffects(base64: string, mime: string, readability: number) {
    const pz = await loadPizzicato()
    const ctx = getContext()
    const profile = getReadabilityProfile(readability)

    const sound = await pz.createSoundFromBase64(ctx, base64)

    // Apply radio filter chain
    sound.addEffect(new pz.Effects.HighPassFilter(ctx, { frequency: profile.eq.highpass, q: profile.eq.highpassQ }))
    sound.addEffect(new pz.Effects.LowPassFilter(ctx, { frequency: profile.eq.lowpass, q: profile.eq.lowpassQ }))

    if (profile.eq.bandpass) {
      sound.addEffect(new pz.Effects.BandPassFilter(ctx, { frequency: profile.eq.bandpass.frequency, q: profile.eq.bandpass.q }))
    }
    if (profile.presence) {
      sound.addEffect(new pz.Effects.PeakingFilter(ctx, { frequency: profile.presence.frequency, q: profile.presence.q, gain: profile.presence.gain }))
    }

    sound.addEffect(new pz.Effects.Compressor(ctx, profile.compressor))

    for (const d of profile.distortions) {
      sound.addEffect(new pz.Effects.Distortion(ctx, { amount: d }))
    }

    if (profile.tremolos) {
      for (const t of profile.tremolos) {
        sound.addEffect(new pz.Effects.Tremolo(ctx, t))
      }
    }

    sound.setVolume(profile.gain)

    const stopNoise = createNoiseGenerators(ctx, sound.duration, profile, readability)

    await sound.play()
    stopNoise.forEach((fn: () => void) => fn())
  }

  function stopAllSounds() {
    for (const [id] of activeSounds.value) {
      stopAmbientSound(id)
    }
    isSpeaking.value = false
  }

  function setMasterVolume(vol: number) {
    if (masterGain.value) {
      masterGain.value.gain.value = Math.max(0, Math.min(1, vol))
    }
  }

  function dispose() {
    stopAllSounds()
    audioContext.value?.close()
    audioContext.value = null
  }

  return {
    isSpeaking,
    preloadSounds,
    speakAtcMessage,
    handlePhaseSounds,
    playAmbientSound,
    stopAmbientSound,
    crossfadeSound,
    stopAllSounds,
    setMasterVolume,
    dispose,
  }
}
