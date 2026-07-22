import { ref } from 'vue'

const PORTS = [8765, 8766, 8767, 8768, 8769, 8770]
const HEALTH_TIMEOUT_MS = 1200
const RECHECK_MS = 15_000

export async function probeLocalSpeech(ports: number[] = PORTS): Promise<string | null> {
  for (const port of ports) {
    const base = `http://127.0.0.1:${port}`
    try {
      const ctrl = new AbortController()
      const timeout = setTimeout(() => ctrl.abort(), HEALTH_TIMEOUT_MS)
      const response = await fetch(`${base}/health`, { signal: ctrl.signal })
      clearTimeout(timeout)
      if (!response.ok) continue
      const body = await response.json()
      if (body?.ok && body?.ready) return base
    } catch {
      // Port closed/refused: probe the next one.
    }
  }
  return null
}

const localBase = ref<string | null>(null)
let started = false

export function useLocalSpeechBridge() {
  const refresh = async () => {
    localBase.value = await probeLocalSpeech()
  }

  if (typeof window !== 'undefined' && !started) {
    started = true
    void refresh()
    setInterval(() => void refresh(), RECHECK_MS)
  }

  return {
    localBase,
    /** Absolute endpoint URL, or null while no ready local Bridge is found. */
    localUrl: (path: string) => (localBase.value ? localBase.value + path : null),
    refresh,
  }
}
