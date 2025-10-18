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
    eq: { highpass: 250, highpassQ: 0.6, lowpass: 4200, lowpassQ: 0.78, bandpass: { frequency: 2400, q: 1.05 } },
    presence: { frequency: 2700, q: 1.18, gain: 2.6 },
    distortions: [60],
    tremolos: [{ depth: 0.05, speed: 2.6, type: 'sine' }],
    gain: 0.99,
    compressor: { threshold: -25, ratio: 9, attack: 0.0024, release: 0.19 },
    noise: { amplitude: 0.018, bandFrequency: 2150, bandQ: 1 }
  },
  5: {
    eq: { highpass: 220, highpassQ: 0.5, lowpass: 4800, lowpassQ: 0.72, bandpass: { frequency: 2550, q: 0.95 } },
    presence: { frequency: 3000, q: 1.05, gain: 2.4 },
    distortions: [35],
    tremolos: [{ depth: 0.025, speed: 1.9, type: 'sine' }],
    gain: 1.04,
    compressor: { threshold: -23, ratio: 8, attack: 0.0022, release: 0.16 },
    noise: { amplitude: 0.009, bandFrequency: 2250, bandQ: 0.9 }
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
