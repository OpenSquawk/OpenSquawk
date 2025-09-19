// Minimal client-side audio helper inspired by Pizzicato.js for radio processing.
// This is not a full implementation of the original library, but exposes a similar
// API surface for the features we need (filters, distortion and tremolo) so that we
// can build complex chains on the client without an external dependency.

export type SupportedEffect =
  | HighPassFilterEffect
  | LowPassFilterEffect
  | BandPassFilterEffect
  | PeakingFilterEffect
  | CompressorEffect
  | DistortionEffect
  | TremoloEffect

export interface PizzicatoLite {
  createSoundFromBase64(context: AudioContext, base64: string): Promise<PizzicatoSound>
  Effects: {
    HighPassFilter: typeof HighPassFilterEffect
    LowPassFilter: typeof LowPassFilterEffect
    BandPassFilter: typeof BandPassFilterEffect
    PeakingFilter: typeof PeakingFilterEffect
    Compressor: typeof CompressorEffect
    Distortion: typeof DistortionEffect
    Tremolo: typeof TremoloEffect
  }
}

interface EffectNode {
  inputNode: AudioNode
  outputNode: AudioNode
  onActivate?(): void
  onDeactivate?(): void
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const createDistortionCurve = (amount: number, context: AudioContext) => {
  const samples = 44100
  const curve = new Float32Array(samples)
  const deg = Math.PI / 180
  const scaled = clamp(amount, 0, 1000)
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1
    curve[i] = ((3 + scaled) * x * 20 * deg) / (Math.PI + scaled * Math.abs(x))
  }
  return curve
}

class PizzicatoSound {
  private context: AudioContext
  private buffer: AudioBuffer
  private outputNode: GainNode
  private sourceNode: AudioBufferSourceNode | null = null
  private effects: EffectNode[] = []
  private isPlaying = false

  constructor(context: AudioContext, buffer: AudioBuffer) {
    this.context = context
    this.buffer = buffer
    this.outputNode = context.createGain()
    this.outputNode.gain.value = 1
    this.outputNode.connect(this.context.destination)
  }

  get duration() {
    return this.buffer.duration
  }

  addEffect(effect: EffectNode) {
    this.effects.push(effect)
  }

  clearEffects() {
    this.effects.forEach(effect => effect.onDeactivate?.())
    this.effects = []
  }

  setVolume(value: number) {
    this.outputNode.gain.value = clamp(value, 0, 2)
  }

  async play(): Promise<void> {
    if (this.isPlaying) {
      this.stop()
    }

    const source = this.context.createBufferSource()
    source.buffer = this.buffer

    const connectedNodes: AudioNode[] = []

    let currentNode: AudioNode = source
    for (const effect of this.effects) {
      connectedNodes.push(currentNode)
      currentNode.connect(effect.inputNode)
      currentNode = effect.outputNode
      effect.onActivate?.()
    }

    connectedNodes.push(currentNode)
    currentNode.connect(this.outputNode)

    this.sourceNode = source
    this.isPlaying = true

    return new Promise((resolve) => {
      source.onended = () => {
        this.isPlaying = false
        connectedNodes.forEach(node => {
          try {
            node.disconnect()
          } catch {
            // ignore disconnect errors
          }
        })
        this.effects.forEach(effect => effect.onDeactivate?.())
        this.sourceNode = null
        resolve()
      }

      try {
        source.start(0)
      } catch {
        // If start fails we still resolve to avoid blocking playback queue
        resolve()
      }
    })
  }

  stop() {
    if (!this.isPlaying || !this.sourceNode) {
      return
    }

    try {
      this.sourceNode.stop()
    } catch {
      // ignore stop errors
    }
  }
}

abstract class FilterEffect implements EffectNode {
  protected context: AudioContext
  protected filter: BiquadFilterNode
  inputNode: AudioNode
  outputNode: AudioNode

  constructor(context: AudioContext, type: BiquadFilterType, options: { frequency?: number; q?: number; gain?: number }) {
    this.context = context
    this.filter = context.createBiquadFilter()
    this.filter.type = type
    if (typeof options.frequency === 'number') {
      this.filter.frequency.value = options.frequency
    }
    if (typeof options.q === 'number') {
      this.filter.Q.value = options.q
    }
    if (typeof options.gain === 'number') {
      this.filter.gain.value = options.gain
    }
    this.inputNode = this.filter
    this.outputNode = this.filter
  }

  onActivate() {}
  onDeactivate() {}
}

class HighPassFilterEffect extends FilterEffect {
  constructor(context: AudioContext, options: { frequency?: number; q?: number } = {}) {
    super(context, 'highpass', options)
    if (!options.frequency) {
      this.filter.frequency.value = 300
    }
    if (!options.q) {
      this.filter.Q.value = 0.7
    }
  }
}

class LowPassFilterEffect extends FilterEffect {
  constructor(context: AudioContext, options: { frequency?: number; q?: number } = {}) {
    super(context, 'lowpass', options)
    if (!options.frequency) {
      this.filter.frequency.value = 3200
    }
    if (!options.q) {
      this.filter.Q.value = 0.8
    }
  }
}

class BandPassFilterEffect extends FilterEffect {
  constructor(context: AudioContext, options: { frequency?: number; q?: number } = {}) {
    super(context, 'bandpass', options)
    if (!options.frequency) {
      this.filter.frequency.value = 1500
    }
    if (!options.q) {
      this.filter.Q.value = 1
    }
  }
}

class PeakingFilterEffect extends FilterEffect {
  constructor(context: AudioContext, options: { frequency?: number; q?: number; gain?: number } = {}) {
    super(context, 'peaking', options)
    if (!options.frequency) {
      this.filter.frequency.value = 2200
    }
    if (!options.q) {
      this.filter.Q.value = 1.1
    }
    if (!options.gain) {
      this.filter.gain.value = 2
    }
  }
}

class CompressorEffect implements EffectNode {
  private compressor: DynamicsCompressorNode
  inputNode: AudioNode
  outputNode: AudioNode

  constructor(context: AudioContext, options: Partial<{ threshold: number; knee: number; ratio: number; attack: number; release: number }> = {}) {
    this.compressor = context.createDynamicsCompressor()
    this.compressor.threshold.value = options.threshold ?? -28
    this.compressor.knee.value = options.knee ?? 30
    this.compressor.ratio.value = options.ratio ?? 12
    this.compressor.attack.value = options.attack ?? 0.003
    this.compressor.release.value = options.release ?? 0.25
    this.inputNode = this.compressor
    this.outputNode = this.compressor
  }

  onActivate() {}
  onDeactivate() {}
}

class DistortionEffect implements EffectNode {
  private shaper: WaveShaperNode
  inputNode: AudioNode
  outputNode: AudioNode

  constructor(context: AudioContext, options: { amount?: number } = {}) {
    this.shaper = context.createWaveShaper()
    const amount = options.amount ?? 180
    this.shaper.curve = createDistortionCurve(amount, context)
    this.shaper.oversample = '4x'
    this.inputNode = this.shaper
    this.outputNode = this.shaper
  }

  setAmount(context: AudioContext, amount: number) {
    this.shaper.curve = createDistortionCurve(amount, context)
  }

  onActivate() {}
  onDeactivate() {}
}

class TremoloEffect implements EffectNode {
  private context: AudioContext
  private input: GainNode
  private output: GainNode
  private oscillator: OscillatorNode
  private modulationGain: GainNode
  private started = false
  private depth: number

  inputNode: AudioNode
  outputNode: AudioNode

  constructor(context: AudioContext, options: { speed?: number; depth?: number; type?: OscillatorType } = {}) {
    this.context = context
    this.input = context.createGain()
    this.output = context.createGain()
    this.modulationGain = context.createGain()

    this.depth = clamp(options.depth ?? 0.4, 0, 0.99)
    const base = 1 - this.depth / 2
    this.output.gain.value = base
    this.modulationGain.gain.value = this.depth / 2

    this.oscillator = context.createOscillator()
    this.oscillator.type = options.type ?? 'sine'
    this.oscillator.frequency.value = options.speed ?? 5

    this.input.connect(this.output)
    this.oscillator.connect(this.modulationGain)
    this.modulationGain.connect(this.output.gain)

    this.inputNode = this.input
    this.outputNode = this.output
  }

  onActivate() {
    if (this.started) return
    try {
      this.oscillator.start()
      this.started = true
    } catch {
      // oscillator already started
    }
  }

  onDeactivate() {
    if (!this.started) return
    try {
      this.oscillator.stop(this.context.currentTime + 0.05)
    } catch {
      // ignore stop errors
    }
    this.started = false
  }
}

const decodeBase64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64)
  const len = binary.length
  const buffer = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    buffer[i] = binary.charCodeAt(i)
  }
  return buffer.buffer
}

let cachedInstance: PizzicatoLite | null = null

export const loadPizzicatoLite = async (): Promise<PizzicatoLite | null> => {
  if (typeof window === 'undefined') return null
  if (cachedInstance) return cachedInstance

  const instance: PizzicatoLite = {
    async createSoundFromBase64(context: AudioContext, base64: string) {
      const arrayBuffer = decodeBase64ToArrayBuffer(base64)
      const audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0))
      return new PizzicatoSound(context, audioBuffer)
    },
    Effects: {
      HighPassFilter: HighPassFilterEffect,
      LowPassFilter: LowPassFilterEffect,
      BandPassFilter: BandPassFilterEffect,
      PeakingFilter: PeakingFilterEffect,
      Compressor: CompressorEffect,
      Distortion: DistortionEffect,
      Tremolo: TremoloEffect
    }
  }

  cachedInstance = instance
  return instance
}

export type { PizzicatoSound }
