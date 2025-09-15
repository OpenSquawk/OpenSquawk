// composables/radioTtsNew.ts
import { ref, computed } from 'vue'

interface TTSOptions {
    level?: number
    voice?: string
    speed?: number
    moduleId?: string
    lessonId?: string
    tag?: string
}

interface GenerateOptions {
    moduleId: string
    lessonId: string
    phraseId?: string
    customVariables?: Record<string, string>
    type?: 'instruction' | 'clearance' | 'information' | 'request'
    count?: number
}

interface PTTOptions {
    expectedText: string
    moduleId: string
    lessonId: string
    format?: 'wav' | 'mp3' | 'ogg' | 'webm'
}

interface AudioCache {
    [key: string]: {
        blob: Blob
        url: string
        timestamp: number
    }
}

export default function useRadioTTS() {
    const isLoading = ref(false)
    const isRecording = ref(false)
    const error = ref<string | null>(null)
    const audioCache = ref<AudioCache>({})

    let currentAudio: HTMLAudioElement | null = null
    let mediaRecorder: MediaRecorder | null = null
    let recordedChunks: Blob[] = []

    // Cache Management
    const cacheKey = (text: string, options: TTSOptions) =>
        `${text}-${options.level || 4}-${options.voice || 'alloy'}-${options.speed || 1.0}`

    const getCachedAudio = (key: string) => {
        const cached = audioCache.value[key]
        if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
            return cached
        }
        if (cached) {
            URL.revokeObjectURL(cached.url)
            delete audioCache.value[key]
        }
        return null
    }

    const setCachedAudio = (key: string, blob: Blob) => {
        const url = URL.createObjectURL(blob)
        audioCache.value[key] = {
            blob,
            url,
            timestamp: Date.now()
        }
        return url
    }

    // Enhanced Server TTS with caching
    const speakServer = async (text: string, options: TTSOptions = {}) => {
        error.value = null

        const key = cacheKey(text, options)
        const cached = getCachedAudio(key)

        if (cached) {
            return playAudio(cached.url)
        }

        isLoading.value = true

        try {
            const response = await $fetch('/api/atc/say', {
                method: 'POST',
                body: {
                    text,
                    level: options.level || 4,
                    voice: options.voice || 'alloy',
                    speed: options.speed || 1.0,
                    moduleId: options.moduleId,
                    lessonId: options.lessonId,
                    tag: options.tag
                }
            })

            if (!response.success) {
                throw new Error('TTS generation failed')
            }

            // Convert base64 to blob and cache
            const audioData = atob(response.audio.base64)
            const audioArray = new Uint8Array(audioData.length)
            for (let i = 0; i < audioData.length; i++) {
                audioArray[i] = audioData.charCodeAt(i)
            }
            const blob = new Blob([audioArray], { type: response.audio.mime })

            const audioUrl = setCachedAudio(key, blob)
            await playAudio(audioUrl)

            return response

        } catch (err) {
            error.value = err instanceof Error ? err.message : 'TTS failed'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // Browser TTS (fallback)
    const speakBrowser = (text: string, options: { voice?: string; rate?: number; pitch?: number } = {}) => {
        if (!window.speechSynthesis) {
            error.value = 'Browser TTS not supported'
            return
        }

        stop() // Stop any current speech

        const utterance = new SpeechSynthesisUtterance(text)

        if (options.voice) {
            const voices = speechSynthesis.getVoices()
            const voice = voices.find(v => v.name.includes(options.voice!))
            if (voice) utterance.voice = voice
        }

        utterance.rate = options.rate || 0.9
        utterance.pitch = options.pitch || 1.0
        utterance.volume = 1.0

        utterance.onerror = (event) => {
            error.value = `TTS error: ${event.error}`
        }

        speechSynthesis.speak(utterance)
    }

    // Generate ATC phrases
    const generatePhrase = async (options: GenerateOptions) => {
        error.value = null
        isLoading.value = true

        try {
            const response = await $fetch('/api/atc/generate', {
                method: 'POST',
                body: options
            })

            if (!response.success) {
                throw new Error('Phrase generation failed')
            }

            return response

        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Phrase generation failed'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // PTT (Push-to-Talk) Recording
    const startRecording = async () => {
        if (isRecording.value) return

        error.value = null
        recordedChunks = []

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            })

            mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            })

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data)
                }
            }

            mediaRecorder.start()
            isRecording.value = true

        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Recording failed'
            throw err
        }
    }

    const stopRecording = async (): Promise<Blob | null> => {
        if (!isRecording.value || !mediaRecorder) return null

        return new Promise((resolve) => {
            mediaRecorder!.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'audio/webm' })

                // Stop all tracks
                mediaRecorder!.stream.getTracks().forEach(track => track.stop())
                mediaRecorder = null
                isRecording.value = false

                resolve(blob)
            }

            mediaRecorder!.stop()
        })
    }

    // Submit PTT for evaluation
    const submitPTT = async (audioBlob: Blob, options: PTTOptions) => {
        error.value = null
        isLoading.value = true

        try {
            // Convert blob to base64
            const arrayBuffer = await audioBlob.arrayBuffer()
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

            const response = await $fetch('/api/atc/ptt', {
                method: 'POST',
                body: {
                    audio: base64,
                    expectedText: options.expectedText,
                    moduleId: options.moduleId,
                    lessonId: options.lessonId,
                    format: options.format || 'webm'
                }
            })

            if (!response.success) {
                throw new Error('PTT evaluation failed')
            }

            return response

        } catch (err) {
            error.value = err instanceof Error ? err.message : 'PTT evaluation failed'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // Audio playback
    const playAudio = async (audioUrl: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            stop() // Stop any current audio

            currentAudio = new Audio(audioUrl)
            currentAudio.volume = 1.0

            currentAudio.addEventListener('ended', () => resolve())
            currentAudio.addEventListener('error', (e) => {
                error.value = 'Audio playback failed'
                reject(e)
            })

            currentAudio.play().catch(reject)
        })
    }

    const stop = () => {
        // Stop TTS
        if (window.speechSynthesis) {
            speechSynthesis.cancel()
        }

        // Stop audio playback
        if (currentAudio) {
            currentAudio.pause()
            currentAudio.currentTime = 0
            currentAudio = null
        }

        // Stop recording
        if (isRecording.value && mediaRecorder) {
            mediaRecorder.stop()
        }
    }

    // Cleanup
    const cleanup = () => {
        stop()

        // Clear cache URLs
        Object.values(audioCache.value).forEach(cached => {
            URL.revokeObjectURL(cached.url)
        })
        audioCache.value = {}
    }

    // Auto-cleanup on unmount
    onUnmounted(() => {
        cleanup()
    })

    return {
        // State
        isLoading: readonly(isLoading),
        isRecording: readonly(isRecording),
        error: readonly(error),

        // TTS Methods
        speakServer,
        speakBrowser,

        // Phrase Generation
        generatePhrase,

        // PTT Methods
        startRecording,
        stopRecording,
        submitPTT,

        // Control
        stop,
        cleanup,

        // Utilities
        playAudio
    }
}
