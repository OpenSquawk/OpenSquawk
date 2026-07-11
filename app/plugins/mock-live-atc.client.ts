/**
 * DEV-ONLY, OPT-IN mock for driving /live-atc without real auth/OpenAI.
 *
 * The authoritative decision engine (the Python backend on :8000) is expected to
 * be running for real — this plugin does NOT touch those calls. It only stubs the
 * Nuxt-side endpoints that would otherwise need a login, VATSIM, or OpenAI:
 *   auth (/api/auth/me, refresh), airport frequencies, METAR, TTS, STT.
 *
 * Activate by visiting any URL with `?mock=1` once; the flag persists in
 * localStorage for the session. Everything is guarded by import.meta.dev so it
 * is stripped from production builds. Not committed as a feature — a throwaway
 * verification aid.
 */
export default defineNuxtPlugin(() => {
  if (!import.meta.dev) return

  const params = new URLSearchParams(window.location.search)
  if (params.get('mock') === '1') localStorage.setItem('mockLiveAtc', '1')
  if (params.get('mock') === '0') localStorage.removeItem('mockLiveAtc')
  if (localStorage.getItem('mockLiveAtc') !== '1') return

  // Seed a session so the page's auth guard passes (store reads this on init).
  localStorage.setItem('os_access_token', 'mock-token')

  const MOCK_USER = {
    id: 'mock-pilot',
    email: 'mock@opensquawk.dev',
    name: 'Mock Pilot',
    role: 'dev',
    emailVerified: true,
  }

  const FREQS = {
    airportName: 'Frankfurt am Main (MOCK)',
    sources: { vatsim: false, openaip: true },
    frequencies: [
      { type: 'ATIS', label: 'ATIS', frequency: '118.025', source: 'openaip', atisCode: 'K', atisText: 'EDDF ATIS K' },
      { type: 'DEL', label: 'Delivery', frequency: '121.950', source: 'openaip' },
      { type: 'GND', label: 'Ground', frequency: '121.800', source: 'openaip' },
      { type: 'TWR', label: 'Tower', frequency: '119.900', source: 'openaip' },
      { type: 'APP', label: 'Approach', frequency: '120.150', source: 'openaip' },
    ],
  }

  const METAR = 'EDDF 101950Z 25008KT 9999 FEW040 18/12 Q1013 NOSIG'

  const json = (data: unknown) => data

  // Return a canned response for a mocked Nuxt path, or the sentinel MISS.
  const MISS = Symbol('miss')
  function handle(url: string, opts: any): unknown {
    const path = url.split('?')[0]

    if (path === '/api/auth/me') return json(MOCK_USER)
    if (path === '/api/service/auth/refresh') return json({ accessToken: 'mock-token' })
    if (path === '/api/auth/login') return json({ accessToken: 'mock-token', user: MOCK_USER })

    if (/^\/api\/airports\/[^/]+\/frequencies$/.test(path)) return json(FREQS)
    if (path === '/api/vatsim/metar') return METAR
    if (path === '/api/vatsim/flightplans') return json({ flightplans: [] })

    // TTS: report "no audio" so nothing plays but the text flow (log,
    // expected-comm) is unaffected — those come from the backend transmit reply.
    if (path === '/api/atc/say') return json({ success: false })

    // STT: we cannot transcribe here. Echo the expected phrase the caller sent so
    // a PTT press behaves as a correct readback against the real backend.
    if (path === '/api/atc/ptt') {
      const expected = opts?.body?.expected
      const transcription = (Array.isArray(expected) ? expected[0] : expected) || 'say again'
      return json({ success: true, transcription })
    }

    return MISS
  }

  const realFetch = globalThis.$fetch
  const patched = ((url: any, opts: any) => {
    if (typeof url === 'string') {
      const result = handle(url, opts)
      if (result !== MISS) return Promise.resolve(result)
    }
    return realFetch(url, opts)
  }) as typeof globalThis.$fetch
  // ofetch helpers (.raw/.create) — keep them pointing at the real impl.
  Object.assign(patched, realFetch)
  globalThis.$fetch = patched

  // eslint-disable-next-line no-console
  console.info('[mock-live-atc] active — auth/freq/metar/TTS/STT stubbed; backend :8000 is real')
})
