export type ReadabilityProfile = {
  eq: {
    highpass: number
    highpassQ: number
    lowpass: number
    lowpassQ: number
    bandpass?: { frequency: number; q: number }
  }
  presence?: { frequency: number; q: number; gain: number }
  distortions: number[]
  tremolos?: Array<{ depth: number; speed: number; type?: OscillatorType; offset?: number; randomizePhase?: boolean }>
  gain: number
  compressor: Partial<{ threshold: number; knee: number; ratio: number; attack: number; release: number }>
  noise: { amplitude: number; bandFrequency: number; bandQ: number; crackle?: boolean }
}

const readabilityProfiles: Record<number, ReadabilityProfile> = {
  1: {
    eq: { highpass: 540, highpassQ: 1.2, lowpass: 1600, lowpassQ: 0.8, bandpass: { frequency: 1150, q: 2.8 } },
    presence: { frequency: 1350, q: 2.4, gain: 5 },
    distortions: [360, 240],
    tremolos: [
      { depth: 0.7, speed: 4.9, type: 'sine' },
      { depth: 0.28, speed: 9.4, type: 'triangle' },
      { depth: 0.2, speed: 2.6, type: 'sine' }
    ],
    gain: 0.82,
    compressor: { threshold: -33, ratio: 16, attack: 0.004, release: 0.32 },
    noise: { amplitude: 0.13, bandFrequency: 1500, bandQ: 1.6, crackle: true }
  },
  2: {
    eq: { highpass: 470, highpassQ: 1, lowpass: 2100, lowpassQ: 0.85, bandpass: { frequency: 1700, q: 2 } },
    presence: { frequency: 1750, q: 1.3, gain: 3 },
    distortions: [280, 160],
    tremolos: [
      { depth: 0.42, speed: 5.6, type: 'sine' },
      { depth: 0.24, speed: 3.3, type: 'triangle' }
    ],
    gain: 0.86,
    compressor: { threshold: -30, ratio: 14, attack: 0.0038, release: 0.3 },
    noise: { amplitude: 0.09, bandFrequency: 1850, bandQ: 1.35, crackle: true }
  },
  3: {
    eq: { highpass: 380, highpassQ: 0.85, lowpass: 2600, lowpassQ: 0.88, bandpass: { frequency: 1900, q: 1.5 } },
    presence: { frequency: 2150, q: 1.3, gain: 2 },
    distortions: [210],
    tremolos: [{ depth: 0.18, speed: 4.2, type: 'sine' }],
    gain: 0.9,
    compressor: { threshold: -28, ratio: 12, attack: 0.0032, release: 0.26 },
    noise: { amplitude: 0.055, bandFrequency: 1950, bandQ: 1.2 }
  },
  4: {
    eq: { highpass: 280, highpassQ: 0.65, lowpass: 3600, lowpassQ: 0.8, bandpass: { frequency: 2200, q: 1.15 } },
    presence: { frequency: 2500, q: 1.25, gain: 2.2 },
    distortions: [90],
    tremolos: [{ depth: 0.06, speed: 2.9, type: 'sine' }],
    gain: 0.97,
    compressor: { threshold: -26, ratio: 9.5, attack: 0.0025, release: 0.2 },
    noise: { amplitude: 0.024, bandFrequency: 2100, bandQ: 1.05 }
  },
  5: {
    eq: { highpass: 240, highpassQ: 0.6, lowpass: 4100, lowpassQ: 0.76, bandpass: { frequency: 2350, q: 1 } },
    presence: { frequency: 2750, q: 1.1, gain: 2 },
    distortions: [45],
    tremolos: [{ depth: 0.03, speed: 2.1, type: 'sine' }],
    gain: 1.02,
    compressor: { threshold: -24, ratio: 8.5, attack: 0.0023, release: 0.17 },
    noise: { amplitude: 0.012, bandFrequency: 2200, bandQ: 0.95 }
  }
}

export const clampReadability = (level: number) => Math.max(1, Math.min(5, level))

export const getReadabilityProfile = (level: number): ReadabilityProfile => {
  const clamped = clampReadability(level)
  return readabilityProfiles[clamped] || readabilityProfiles[3]
}

export const createNoiseGenerators = (
  ctx: AudioContext,
  duration: number,
  profile: ReadabilityProfile,
  level: number
): Array<() => void> => {
  const stops: Array<() => void> = []
  const bufferLength = Math.max(1, Math.ceil((duration + 0.2) * ctx.sampleRate))
  const noiseBuffer = ctx.createBuffer(1, bufferLength, ctx.sampleRate)
  const channel = noiseBuffer.getChannelData(0)
  const amplitude = profile.noise.amplitude
  const crackle = profile.noise.crackle

  for (let i = 0; i < channel.length; i++) {
    if (crackle && Math.random() < 0.002) {
      const burstLength = Math.min(Math.floor(ctx.sampleRate * 0.02), channel.length - i)
      for (let j = 0; j < burstLength; j++, i++) {
        channel[i] = (Math.random() * 2 - 1) * amplitude * 3.2
      }
      i--
      continue
    }

    channel[i] = (Math.random() * 2 - 1) * amplitude
  }

  const noiseSource = ctx.createBufferSource()
  noiseSource.buffer = noiseBuffer

  const bandPass = ctx.createBiquadFilter()
  bandPass.type = 'bandpass'
  bandPass.frequency.value = profile.noise.bandFrequency
  bandPass.Q.value = profile.noise.bandQ

  const noiseGain = ctx.createGain()
  noiseGain.gain.value = amplitude

  noiseSource.connect(bandPass)
  bandPass.connect(noiseGain)
  noiseGain.connect(ctx.destination)

  try {
    noiseSource.start()
  } catch (err) {
    console.warn('Noise source start failed', err)
  }

  stops.push(() => {
    try {
      noiseSource.stop()
    } catch {
      // ignore stop failure
    }
    noiseSource.disconnect()
    bandPass.disconnect()
    noiseGain.disconnect()
  })

  if (level <= 3) {
    const hissBuffer = ctx.createBuffer(1, bufferLength, ctx.sampleRate)
    const hissChannel = hissBuffer.getChannelData(0)
    const hissAmplitude = amplitude * (level === 1 ? 0.9 : 0.6)
    for (let i = 0; i < hissChannel.length; i++) {
      hissChannel[i] = (Math.random() * 2 - 1) * hissAmplitude
    }
    const hissSource = ctx.createBufferSource()
    hissSource.buffer = hissBuffer
    const highPass = ctx.createBiquadFilter()
    highPass.type = 'highpass'
    highPass.frequency.value = 2800
    const hissGain = ctx.createGain()
    hissGain.gain.value = hissAmplitude * 0.6
    hissSource.connect(highPass)
    highPass.connect(hissGain)
    hissGain.connect(ctx.destination)
    try {
      hissSource.start()
    } catch (err) {
      console.warn('Hiss source start failed', err)
    }
    stops.push(() => {
      try {
        hissSource.stop()
      } catch {
        // ignore
      }
      hissSource.disconnect()
      highPass.disconnect()
      hissGain.disconnect()
    })
  }

  return stops
}
