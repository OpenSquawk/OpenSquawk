import { ref, type Ref } from 'vue'
import { useApi } from '~/composables/useApi'
import useCommunicationsEngine from '../../shared/utils/communicationsEngine'
import { encodeWav } from '../../shared/utils/wavEncoder'
import { pmLog } from '../../shared/utils/pmLog'
import { postWithLocalFallback, useLocalSpeechBridge } from './useLocalSpeechBridge'

export interface PttRecordingDeps {
  stopCurrentSpeech: () => void
  speakWithRadioEffects: (tpl: string, options?: Record<string, any>) => void
  radioEffectsEnabled: Ref<boolean>
  inputMode: Ref<'voice' | 'text'>
  backendSessionId: Ref<string | null>
  backendExpectedPhrase: Ref<string | null>
  setLastTransmission: (text: string) => void
  handlePilotTransmission: (message: string, source: 'text' | 'ptt') => Promise<void>
}

/** Maximum PTT hold time in ms. Auto-stops and submits the recording when exceeded. */
export const PTT_MAX_DURATION_MS = 30_000 // 30 s — long enough for any realistic transmission

export function usePttRecording(
  engine: ReturnType<typeof useCommunicationsEngine>,
  deps: PttRecordingDeps,
) {
  const { currentState, variables: vars } = engine
  const api = useApi()
  const { localUrl } = useLocalSpeechBridge()
  const {
    stopCurrentSpeech, speakWithRadioEffects, radioEffectsEnabled, inputMode,
    backendSessionId, backendExpectedPhrase, setLastTransmission, handlePilotTransmission,
  } = deps

  const isRecording = ref(false)
  const micPermission = ref(false)
  const prerecEnabled = ref(true)
  const prerecSeconds = ref(1.0)

  const mediaRecorder = ref<MediaRecorder | null>(null)
  const audioChunks = ref<Blob[]>([])
  let pttMaxDurationTimer: ReturnType<typeof setTimeout> | null = null

  const requestMicAccess = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      micPermission.value = true
    } catch (err) {
      console.error('Microphone permission denied:', err)
      micPermission.value = false
    }
  }

  // ---------------------------------------------------------------------------
  // Pre-recording: continuously capture mic into a PCM ring buffer so the start
  // of a PTT transmission isn't clipped. On PTT release we prepend the rolling
  // buffer to the actively-captured frames and ship as WAV.
  // ---------------------------------------------------------------------------
  let prerecCtx: AudioContext | null = null
  let prerecStream: MediaStream | null = null
  let prerecSource: MediaStreamAudioSourceNode | null = null
  let prerecNode: ScriptProcessorNode | null = null
  let prerecSampleRate = 16000
  let prerecRing: Float32Array | null = null
  let prerecRingWrite = 0
  let prerecRingFilled = false
  let prerecLiveChunks: Float32Array[] = []
  let prerecLiveCapture = false
  let prerecLiveIntercom = false
  let prerecStarting = false
  let prerecLivePrebuffer: Float32Array = new Float32Array(0)

  const snapshotPrerecPCM = (): Float32Array => {
    if (!prerecRing) return new Float32Array(0)
    const rb = prerecRing
    if (!prerecRingFilled) return rb.slice(0, prerecRingWrite)
    const out = new Float32Array(rb.length)
    const tail = rb.length - prerecRingWrite
    out.set(rb.subarray(prerecRingWrite), 0)
    out.set(rb.subarray(0, prerecRingWrite), tail)
    return out
  }

  const stopPrerecCapture = () => {
    prerecLiveCapture = false
    prerecLiveChunks = []
    try { prerecNode?.disconnect() } catch {}
    try { prerecSource?.disconnect() } catch {}
    if (prerecCtx) {
      try { void prerecCtx.close() } catch {}
    }
    if (prerecStream) {
      prerecStream.getTracks().forEach(t => t.stop())
    }
    prerecCtx = null
    prerecStream = null
    prerecSource = null
    prerecNode = null
    prerecRing = null
    prerecRingWrite = 0
    prerecRingFilled = false
  }

  const startPrerecCapture = async () => {
    if (typeof window === 'undefined') return
    if (prerecCtx || prerecStarting) return
    if (!prerecEnabled.value) return
    if (inputMode.value !== 'voice') return
    if (!micPermission.value) return

    prerecStarting = true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      const AC = window.AudioContext || (window as any).webkitAudioContext
      if (!AC) {
        stream.getTracks().forEach(t => t.stop())
        return
      }
      const ctx = new AC()
      prerecCtx = ctx
      prerecStream = stream
      prerecSampleRate = ctx.sampleRate
      prerecSource = ctx.createMediaStreamSource(stream)
      const node = ctx.createScriptProcessor(2048, 1, 1)
      prerecNode = node
      const ringSize = Math.max(1, Math.ceil(prerecSampleRate * Math.max(0.2, prerecSeconds.value)))
      prerecRing = new Float32Array(ringSize)
      prerecRingWrite = 0
      prerecRingFilled = false
      prerecLiveChunks = []
      prerecLiveCapture = false

      node.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0)
        const rb = prerecRing
        if (!rb) return
        const len = input.length
        for (let i = 0; i < len; i++) {
          rb[prerecRingWrite++] = input[i]
          if (prerecRingWrite >= rb.length) {
            prerecRingWrite = 0
            prerecRingFilled = true
          }
        }
        if (prerecLiveCapture) {
          prerecLiveChunks.push(new Float32Array(input))
        }
      }

      prerecSource.connect(node)
      // ScriptProcessor only emits events while connected to destination.
      // Mute via a zero-gain node so we don't echo mic to speakers.
      const muteGain = ctx.createGain()
      muteGain.gain.value = 0
      node.connect(muteGain)
      muteGain.connect(ctx.destination)
    } catch (err) {
      console.warn('[PM] prerec capture failed', err)
      stopPrerecCapture()
    } finally {
      prerecStarting = false
    }
  }

  const restartPrerecCapture = async () => {
    stopPrerecCapture()
    await startPrerecCapture()
  }

  /** Restart the pre-recording capture only if it's currently active — used
   *  when the lead-in duration setting changes so a new ring buffer size takes
   *  effect immediately, without starting capture when it wasn't running. */
  const restartPrerecCaptureIfActive = () => {
    if (prerecCtx) {
      void restartPrerecCapture()
    }
  }

  /** A backgrounded tab can suspend the prerec AudioContext; resume it so the
   *  ring buffer + live capture are running before a remote (SimBridge) PTT
   *  edge starts a recording. */
  const resumePrerecIfSuspended = async () => {
    if (prerecCtx && prerecCtx.state === 'suspended') {
      try { await prerecCtx.resume() } catch {}
    }
  }

  /** Clear any pending PTT auto-stop timer. */
  const clearPttTimer = () => {
    if (pttMaxDurationTimer !== null) {
      clearTimeout(pttMaxDurationTimer)
      pttMaxDurationTimer = null
    }
  }

  const playPTTBeep = (start: boolean) => {
    if (!radioEffectsEnabled.value) return

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(start ? 800 : 600, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (err) {
      // Audio context may not be available
    }
  }

  /** Start the PTT auto-stop safety timer. Fires stopRecording() if the user
   *  holds PTT longer than PTT_MAX_DURATION_MS.  Without this, very long
   *  recordings produce blobs too large to base64-encode synchronously. */
  const startPttTimer = () => {
    clearPttTimer()
    pttMaxDurationTimer = setTimeout(() => {
      pmLog.warn(`PTT auto-stop: exceeded ${PTT_MAX_DURATION_MS / 1000}s limit`)
      stopRecording()
    }, PTT_MAX_DURATION_MS)
  }

  /**
   * Convert an ArrayBuffer to a base64 string without blowing the call stack.
   *
   * The naive approach — btoa(String.fromCharCode(...new Uint8Array(buf))) —
   * spreads every byte as a separate function argument. For recordings longer
   * than a few seconds the argument count exceeds the JS engine limit (~65 k –
   * 131 k args) and throws RangeError: Maximum call stack size exceeded,
   * silently aborting the PTT request before it is ever sent.
   *
   * Processing in 8 KB chunks keeps argument count well within safe limits
   * regardless of recording length.
   */
  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    const chunkSize = 8192
    let binary = ''
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)))
    }
    return btoa(binary)
  }

  // Build the Whisper-prompt seed for the current state: the expected pilot
  // phrase plus the active variable values (callsign, SID, squawk, runway,
  // frequencies…). The server expands these to spoken ICAO form and appends them
  // to the bias prompt so Whisper is steered toward exactly what's expected.
  function buildSttExpected(): { phrase?: string; tokens: string[] } {
    const phrase = backendExpectedPhrase.value?.trim() || undefined
    const dict = ((vars as any).value ?? {}) as Record<string, unknown>
    const tokens: string[] = []
    for (const val of Object.values(dict)) {
      if (typeof val === 'number') { tokens.push(String(val)); continue }
      if (typeof val === 'string') {
        const t = val.trim()
        if (t && t.length <= 24) tokens.push(t)
      }
    }
    return { phrase, tokens }
  }

  const processTransmission = async (audioBlob: Blob, isIntercom: boolean, format: 'wav' | 'webm' = 'webm') => {
    const channel = isIntercom ? 'INTERCOM' : 'RADIO'
    pmLog.info(`PTT ▶ ${channel}  blob=${(audioBlob.size / 1024).toFixed(1)}KB  fmt=${format}  session=${backendSessionId.value?.slice(0, 8) ?? 'none'}`)
    try {
      const arrayBuffer = await audioBlob.arrayBuffer()
      const base64Audio = arrayBufferToBase64(arrayBuffer)

      if (isIntercom) {
        const payload = {
          audio: base64Audio,
          moduleId: 'pilot-monitoring-intercom',
          lessonId: 'intercom',
          format,
          sessionId: backendSessionId.value || undefined,
        }
        const result = await postWithLocalFallback(
          localUrl('/api/atc/ptt'),
          payload,
          () => api.post('/api/atc/ptt', payload),
        )

        if (result.success) {
          pmLog.info('PTT ✓ INTERCOM  transcription:', result.transcription)
          setLastTransmission(`INTERCOM: ${result.transcription}`)
          const transcription = result.transcription.toLowerCase()
          if (transcription.includes('checklist') || transcription.includes('check list')) {
            speakWithRadioEffects('Checklist functionality available in advanced mode', {
              delayMs: 600,
              updateLastTransmission: false,
              tag: 'system-info',
              useNormalizedForTTS: true,
            })
          }
        }
      } else {
        const payload = {
          audio: base64Audio,
          moduleId: 'pilot-monitoring',
          lessonId: currentState.value?.id || 'general',
          format,
          sessionId: backendSessionId.value || undefined,
          expected: buildSttExpected(),
        }
        const result = await postWithLocalFallback(
          localUrl('/api/atc/ptt'),
          payload,
          () => api.post('/api/atc/ptt', payload),
        )

        if (result.success) {
          pmLog.info('PTT ✓ RADIO  transcription:', result.transcription)
          await handlePilotTransmission(result.transcription, 'ptt')
        } else {
          pmLog.warn('PTT ✗ RADIO  Whisper returned no transcription', result)
        }
      }
    } catch (err) {
      pmLog.error(`PTT ✗ ${channel}  error:`, err)
      console.error('Error processing transmission:', err)
      setLastTransmission('Error processing audio')
    }
  }

  const startRecording = async (isIntercom = false) => {
    if (!micPermission.value) {
      await requestMicAccess()
      return
    }

    // Barge-in: keying the mic cuts any ATC speech still playing, mirroring a real
    // half-duplex radio where transmitting overrides the controller's output.
    stopCurrentSpeech()

    // Pre-recording path: ring buffer + active capture, encoded to WAV on release
    if (prerecEnabled.value) {
      if (!prerecCtx) {
        await startPrerecCapture()
      }
      if (prerecCtx && prerecNode) {
        prerecLivePrebuffer = snapshotPrerecPCM()
        prerecLiveChunks = []
        prerecLiveIntercom = isIntercom
        prerecLiveCapture = true
        isRecording.value = true
        startPttTimer()
        if (radioEffectsEnabled.value) {
          playPTTBeep(true)
        }
        return
      }
      // Fall through to MediaRecorder if prerec init failed
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      mediaRecorder.value = new MediaRecorder(stream)
      audioChunks.value = []

      mediaRecorder.value.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.value.push(event.data)
        }
      }

      mediaRecorder.value.onstop = () => {
        const audioBlob = new Blob(audioChunks.value, { type: 'audio/wav' })
        processTransmission(audioBlob, isIntercom, 'webm')
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.value.start()
      isRecording.value = true
      startPttTimer()

      if (radioEffectsEnabled.value) {
        playPTTBeep(true)
      }
    } catch (err) {
      console.error('Failed to start recording:', err)
    }
  }

  const stopRecording = () => {
    // Always clear the safety timer, regardless of which recording path is active.
    clearPttTimer()

    if (prerecLiveCapture) {
      prerecLiveCapture = false
      isRecording.value = false
      if (radioEffectsEnabled.value) {
        playPTTBeep(false)
      }
      const prebuffer = prerecLivePrebuffer
      const liveLen = prerecLiveChunks.reduce((sum, c) => sum + c.length, 0)
      const combined = new Float32Array(prebuffer.length + liveLen)
      combined.set(prebuffer, 0)
      let off = prebuffer.length
      for (const c of prerecLiveChunks) {
        combined.set(c, off)
        off += c.length
      }
      prerecLiveChunks = []
      prerecLivePrebuffer = new Float32Array(0)
      if (combined.length === 0) return
      const blob = encodeWav(combined, prerecSampleRate)
      processTransmission(blob, prerecLiveIntercom, 'wav')
      return
    }

    if (mediaRecorder.value && isRecording.value) {
      mediaRecorder.value.stop()
      isRecording.value = false

      if (radioEffectsEnabled.value) {
        playPTTBeep(false)
      }
    }
  }

  return {
    isRecording,
    micPermission,
    prerecEnabled,
    prerecSeconds,
    requestMicAccess,
    stopPrerecCapture,
    startPrerecCapture,
    restartPrerecCapture,
    restartPrerecCaptureIfActive,
    resumePrerecIfSuspended,
    startRecording,
    stopRecording,
    processTransmission,
  }
}
