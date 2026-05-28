/**
 * ATIS audio loop with carrier-noise bed. Web Audio API based so the loop
 * seek is sample-accurate (`source.start(when, offset)`), unlike
 * HTMLAudioElement.currentTime which browsers can quantize.
 *
 * Two BufferSources fed through gain nodes into a shared AudioContext:
 *   1. Carrier noise (1s buffer, looped, bandpass-filtered) — starts on
 *      tune, stays running. Loud gain while ATIS is loading, quiet "bed"
 *      gain while ATIS plays.
 *   2. ATIS audio — decoded from TTS base64, looped, started at the
 *      virtual-clock offset.
 */

export type AtisLoopPhase = 'idle' | 'loading' | 'playing'

export interface AtisLoopState {
    phase: AtisLoopPhase
    requestedOffset?: number
    duration?: number
    startedAt?: number
    startedAtCtx?: number
    epochMs?: number
}

export interface AtisAudioLoop {
    startLoading(): void
    startBroadcast(opts: {
        audioBase64: string
        mime?: string
        epochMs: number
    }): Promise<{ requestedOffset: number; duration: number } | null>
    stop(): void
    getState(): AtisLoopState
}

const CARRIER_GAIN_LOUD = 0.45
const CARRIER_GAIN_BED = 0.12
const CARRIER_FADE_S = 0.5
const CARRIER_BANDPASS_HZ = 1500
const CARRIER_BANDPASS_Q = 1.0

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes.buffer
}

export function createAtisAudioLoop(): AtisAudioLoop {
    if (typeof window === 'undefined') {
        // SSR safety — return a no-op stub
        return {
            startLoading() {},
            async startBroadcast() { return null },
            stop() {},
            getState() { return { phase: 'idle' } }
        }
    }

    let ctx: AudioContext | null = null
    let carrierSource: AudioBufferSourceNode | null = null
    let carrierGain: GainNode | null = null
    let atisSource: AudioBufferSourceNode | null = null
    let atisGain: GainNode | null = null

    const state: AtisLoopState = { phase: 'idle' }

    const ensureCtx = (): AudioContext => {
        if (ctx && ctx.state !== 'closed') {
            // Some browsers auto-suspend the context — resume on demand.
            if (ctx.state === 'suspended') ctx.resume().catch(() => {})
            return ctx
        }
        const Ctor: typeof AudioContext = window.AudioContext
            // @ts-expect-error: webkitAudioContext for older Safari
            ?? window.webkitAudioContext
        ctx = new Ctor()
        return ctx
    }

    const buildCarrierBuffer = (): AudioBuffer => {
        const c = ensureCtx()
        // 1-second buffer, looped. White noise, light high-pass tilt.
        const length = c.sampleRate
        const buffer = c.createBuffer(1, length, c.sampleRate)
        const ch = buffer.getChannelData(0)
        let prev = 0
        for (let i = 0; i < length; i++) {
            const white = Math.random() * 2 - 1
            // simple 1-sample tilt to take off the bass weight
            const sample = white * 0.9 - prev * 0.5
            prev = white
            ch[i] = sample
        }
        return buffer
    }

    const stopCarrier = () => {
        if (carrierSource) {
            try { carrierSource.stop() } catch { /* already stopped */ }
            try { carrierSource.disconnect() } catch {}
            carrierSource = null
        }
        if (carrierGain) {
            try { carrierGain.disconnect() } catch {}
            carrierGain = null
        }
    }

    const stopAtis = () => {
        if (atisSource) {
            try { atisSource.stop() } catch {}
            try { atisSource.disconnect() } catch {}
            atisSource = null
        }
        if (atisGain) {
            try { atisGain.disconnect() } catch {}
            atisGain = null
        }
    }

    const exposeDebug = () => {
        if (typeof window !== 'undefined') {
            ;(window as any).__atisDebug = {
                ctx,
                carrierSource,
                carrierGain,
                atisSource,
                atisGain,
                state: { ...state }
            }
        }
    }

    const startLoading = () => {
        const c = ensureCtx()
        if (carrierSource) {
            // Already running. Ramp back up to loud in case we were in bed mode.
            if (carrierGain) {
                const now = c.currentTime
                carrierGain.gain.cancelScheduledValues(now)
                carrierGain.gain.setValueAtTime(carrierGain.gain.value, now)
                carrierGain.gain.linearRampToValueAtTime(CARRIER_GAIN_LOUD, now + CARRIER_FADE_S)
            }
            state.phase = state.phase === 'playing' ? 'playing' : 'loading'
            exposeDebug()
            return
        }

        const buffer = buildCarrierBuffer()
        const source = c.createBufferSource()
        source.buffer = buffer
        source.loop = true

        const bandpass = c.createBiquadFilter()
        bandpass.type = 'bandpass'
        bandpass.frequency.value = CARRIER_BANDPASS_HZ
        bandpass.Q.value = CARRIER_BANDPASS_Q

        const gain = c.createGain()
        gain.gain.value = 0
        const now = c.currentTime
        gain.gain.linearRampToValueAtTime(CARRIER_GAIN_LOUD, now + CARRIER_FADE_S)

        source.connect(bandpass)
        bandpass.connect(gain)
        gain.connect(c.destination)
        source.start()

        carrierSource = source
        carrierGain = gain
        state.phase = 'loading'
        exposeDebug()
    }

    const startBroadcast = async ({ audioBase64, mime: _mime, epochMs }: {
        audioBase64: string
        mime?: string
        epochMs: number
    }) => {
        const c = ensureCtx()
        let audioBuffer: AudioBuffer
        try {
            const arrayBuffer = base64ToArrayBuffer(audioBase64)
            audioBuffer = await c.decodeAudioData(arrayBuffer)
        } catch (err) {
            console.warn('[ATIS] decodeAudioData failed', err)
            return null
        }

        // Stop any previous broadcast — we're switching ATIS sources.
        stopAtis()

        const duration = audioBuffer.duration
        const elapsed = (Date.now() - epochMs) / 1000
        const requestedOffset = ((elapsed % duration) + duration) % duration

        const source = c.createBufferSource()
        source.buffer = audioBuffer
        source.loop = true

        const gain = c.createGain()
        gain.gain.value = 1.0

        source.connect(gain)
        gain.connect(c.destination)

        const startedAtCtx = c.currentTime
        source.start(0, requestedOffset)

        // Fade carrier down to "bed" level
        if (carrierGain) {
            const now = c.currentTime
            carrierGain.gain.cancelScheduledValues(now)
            carrierGain.gain.setValueAtTime(carrierGain.gain.value, now)
            carrierGain.gain.linearRampToValueAtTime(CARRIER_GAIN_BED, now + CARRIER_FADE_S)
        }

        atisSource = source
        atisGain = gain
        state.phase = 'playing'
        state.requestedOffset = requestedOffset
        state.duration = duration
        state.startedAt = Date.now()
        state.startedAtCtx = startedAtCtx
        state.epochMs = epochMs

        exposeDebug()
        return { requestedOffset, duration }
    }

    const stop = () => {
        // Quick fade out the carrier then stop both sources
        if (ctx && carrierGain) {
            const now = ctx.currentTime
            try {
                carrierGain.gain.cancelScheduledValues(now)
                carrierGain.gain.setValueAtTime(carrierGain.gain.value, now)
                carrierGain.gain.linearRampToValueAtTime(0, now + 0.15)
            } catch {}
        }
        // Schedule stops slightly in the future so the fade completes audibly
        const stopDelay = 200
        setTimeout(() => {
            stopAtis()
            stopCarrier()
            state.phase = 'idle'
            state.requestedOffset = undefined
            state.duration = undefined
            state.startedAt = undefined
            state.startedAtCtx = undefined
            state.epochMs = undefined
            exposeDebug()
        }, stopDelay)
    }

    const getState = (): AtisLoopState => ({ ...state })

    return { startLoading, startBroadcast, stop, getState }
}
