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
  tremolos?: Array<{ depth: number; speed: number; type?: OscillatorType }>
  gain: number
  compressor: Partial<{ threshold: number; knee: number; ratio: number; attack: number; release: number }>
  noise: { amplitude: number; bandFrequency: number; bandQ: number; crackle?: boolean }
}

const readabilityProfiles: Record<number, ReadabilityProfile> = {
  1: {
    eq: { highpass: 520, highpassQ: 1.1, lowpass: 1700, lowpassQ: 0.85, bandpass: { frequency: 1100, q: 2.6 } },
    presence: { frequency: 1300, q: 2.1, gain: 4 },
    distortions: [420, 260],
    tremolos: [
      { depth: 0.92, speed: 7.6, type: 'square' },
      { depth: 0.38, speed: 5.1 }
    ],
    gain: 0.84,
    compressor: { threshold: -32, ratio: 14, attack: 0.004, release: 0.3 },
    noise: { amplitude: 0.12, bandFrequency: 1500, bandQ: 1.6, crackle: true }
  },
  2: {
    eq: { highpass: 440, highpassQ: 0.95, lowpass: 2100, lowpassQ: 0.9, bandpass: { frequency: 1650, q: 1.9 } },
    presence: { frequency: 1700, q: 1.2, gain: 2.5 },
    distortions: [320],
    tremolos: [{ depth: 0.24, speed: 5.2 }],
    gain: 0.88,
    compressor: { threshold: -30, ratio: 13, attack: 0.0035, release: 0.28 },
    noise: { amplitude: 0.085, bandFrequency: 1800, bandQ: 1.4, crackle: true }
  },
  3: {
    eq: { highpass: 360, highpassQ: 0.8, lowpass: 2600, lowpassQ: 0.9, bandpass: { frequency: 1850, q: 1.5 } },
    presence: { frequency: 2100, q: 1.3, gain: 1.8 },
    distortions: [220],
    tremolos: [{ depth: 0.14, speed: 4.5 }],
    gain: 0.9,
    compressor: { threshold: -28, ratio: 12, attack: 0.003, release: 0.26 },
    noise: { amplitude: 0.055, bandFrequency: 1900, bandQ: 1.2 }
  },
  4: {
    eq: { highpass: 310, highpassQ: 0.7, lowpass: 3050, lowpassQ: 0.85, bandpass: { frequency: 2000, q: 1.2 } },
    presence: { frequency: 2300, q: 1.4, gain: 1.4 },
    distortions: [140],
    tremolos: [{ depth: 0.08, speed: 3.6 }],
    gain: 0.93,
    compressor: { threshold: -27, ratio: 11, attack: 0.0028, release: 0.23 },
    noise: { amplitude: 0.035, bandFrequency: 2000, bandQ: 1.1 }
  },
  5: {
    eq: { highpass: 280, highpassQ: 0.65, lowpass: 3300, lowpassQ: 0.8, bandpass: { frequency: 2150, q: 1.1 } },
    presence: { frequency: 2450, q: 1.5, gain: 1.1 },
    distortions: [90],
    tremolos: [{ depth: 0.05, speed: 3 }],
    gain: 0.96,
    compressor: { threshold: -26, ratio: 10, attack: 0.0025, release: 0.2 },
    noise: { amplitude: 0.02, bandFrequency: 2100, bandQ: 1 }
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
