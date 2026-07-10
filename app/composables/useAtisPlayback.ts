import { ref, watch, type Ref } from 'vue'
import { useApi } from '~/composables/useApi'
import useCommunicationsEngine from '../../shared/utils/communicationsEngine'
import { normalizeAtisForSpeech } from '../../shared/utils/radioSpeech'
import { createAtisAudioLoop, type AtisAudioLoop } from '../../shared/utils/atisAudioLoop'
import { pmLog } from '../../shared/utils/pmLog'
import {
  FREQUENCY_PLACEHOLDER,
  normalizedFrequencyValue,
  atisVariantLabel,
  type AirportFrequencyEntry,
  type useFrequencyPresets,
} from '~/composables/useFrequencyPresets'

export function useAtisPlayback(
  engine: ReturnType<typeof useCommunicationsEngine>,
  freq: ReturnType<typeof useFrequencyPresets>,
  currentScreen: Ref<string>,
  signalStrength: Ref<number>,
  setLastTransmission: (text: string) => void,
) {
  const { flightContext, sessionId: engineSessionId, flags } = engine
  const {
    activeAirportIcao, airportName, atisEntries, atisFrequencyEntry,
    setActiveFrequencyFromList, fetchAirportFrequencies,
  } = freq
  const api = useApi()

  const atisPlaybackLoading = ref(false)
  const atisLoopKey = ref<string | null>(null)
  let atisAudioLoop: AtisAudioLoop | null = null
  let atisLoopActive = false
  let atisLoopSeq = 0
  // Virtual ATIS start times per loop key. Keeps the broadcast position stable
  // across tune-out/tune-in: re-tuning resumes where the loop would be if it
  // had been playing continuously.
  const atisEpochByKey = new Map<string, number>()
  // Airport-data refresh scheduling. VATSIM ATIS regenerates from real-world
  // METARs, which publish at :20/:50 — the new info letter shows up on the
  // datafeed a couple of minutes later, so refetch at :23 and :53. When no
  // ATIS is on the feed yet (station may log on mid-session), poll more often.
  let airportDataRefreshTimer: ReturnType<typeof setTimeout> | null = null
  const ATIS_REFRESH_MINUTES = [23, 53]
  const ATIS_RETRY_NO_DATA_MS = 5 * 60 * 1000

  const cancelAirportDataRefresh = () => {
    if (airportDataRefreshTimer) {
      clearTimeout(airportDataRefreshTimer)
      airportDataRefreshTimer = null
    }
  }

  const msUntilNextAtisSlot = (): number => {
    const now = new Date()
    let best = Infinity
    for (const hourOffset of [0, 1]) {
      for (const minute of ATIS_REFRESH_MINUTES) {
        const candidate = new Date(now)
        candidate.setHours(now.getHours() + hourOffset, minute, 0, 0)
        const delta = candidate.getTime() - now.getTime()
        if (delta > 0 && delta < best) best = delta
      }
    }
    return best
  }

  const scheduleAirportDataRefresh = () => {
    cancelAirportDataRefresh()
    const hasAtisData = Boolean(atisFrequencyEntry.value?.atisText)
    const slotDelay = msUntilNextAtisSlot()
    // With live ATIS data wait for the next METAR slot; without it, also retry
    // sooner in case the ATIS station logs on mid-session.
    const delay = hasAtisData ? slotDelay : Math.min(slotDelay, ATIS_RETRY_NO_DATA_MS)
    airportDataRefreshTimer = setTimeout(async () => {
      airportDataRefreshTimer = null
      if (currentScreen.value === 'monitor' && activeAirportIcao.value) {
        await fetchAirportFrequencies(activeAirportIcao.value, { silent: true })
        // Pre-generate audio for a changed info letter so the loop restart
        // (triggered by the key change) plays without a generation gap.
        prefetchAtisAudio()
      }
      if (currentScreen.value === 'monitor') {
        scheduleAirportDataRefresh()
      }
    }, delay)
  }

  const fetchMetarText = async (icao: string | undefined): Promise<string | null> => {
    if (!icao) return null

    try {
      const response = await api.get('/api/vatsim/metar', { query: { id: icao } })
      if (typeof response === 'string') {
        const trimmed = response.trim()
        return trimmed.length ? trimmed : null
      }
    } catch (err) {
      console.error('Failed to fetch METAR:', err)
    }

    return null
  }

  const buildAtisAnnouncement = (entry: AirportFrequencyEntry, fallback?: string): string => {
    const parts: string[] = []
    const icao = activeAirportIcao.value || flightContext.value.dep
    const variant = atisVariantLabel(entry)
    const location = icao ? `${icao} ${variant}ATIS` : `${variant}ATIS`
    parts.push(location)

    if (entry.atisCode) {
      parts.push(`Information ${entry.atisCode}`)
    }

    if (entry.atisText) {
      parts.push(entry.atisText)
    } else if (fallback) {
      parts.push(fallback)
    }

    if (!entry.frequency || entry.frequency === FREQUENCY_PLACEHOLDER) {
      parts.push('Frequency unavailable')
    } else {
      parts.push(`Frequency ${entry.frequency}`)
    }

    return parts
      .map(segment => segment.trim())
      .filter(Boolean)
      .join('. ')
      .replace(/\s+/g, ' ')
  }

  const buildAtisLoopKey = (entry: AirportFrequencyEntry): string => {
    const icao = (activeAirportIcao.value || flightContext.value.dep || 'XXXX').toUpperCase()
    // Station identity: with separate Arrival/Departure ATIS, each station
    // gets its own loop (own content, own virtual-clock epoch).
    const station = (entry.callsign || normalizedFrequencyValue(entry.frequency) || '-').toUpperCase()
    const code = entry.atisCode || '-'
    const text = (entry.atisText || '').trim()
    return `${icao}|${station}|${code}|${text.length}`
  }

  const resolveAtisEpoch = (entry: AirportFrequencyEntry): number => {
    if (entry.lastUpdated) {
      const parsed = Date.parse(entry.lastUpdated)
      if (Number.isFinite(parsed)) return parsed
    }
    // No timestamp from VATSIM — pin a stable epoch per ATIS content so that
    // tuning away and back resumes mid-broadcast instead of restarting at zero.
    const key = buildAtisLoopKey(entry)
    const cached = atisEpochByKey.get(key)
    if (cached) return cached
    const epoch = Date.now()
    atisEpochByKey.set(key, epoch)
    return epoch
  }

  const ensureAtisAudioLoop = (): AtisAudioLoop => {
    if (!atisAudioLoop) {
      atisAudioLoop = createAtisAudioLoop()
    }
    return atisAudioLoop
  }

  const stopAtisLoop = () => {
    atisLoopSeq += 1
    atisLoopActive = false
    atisLoopKey.value = null
    if (atisAudioLoop) {
      try {
        atisAudioLoop.stop()
      } catch (err) {
        pmLog.warn('ATIS loop stop failed', err)
      }
    }
  }

  // TTS audio cache per ATIS broadcast (keyed by loop key + signal level) so
  // tune-in is instant when the audio was prefetched or heard before.
  const atisAudioRequestCache = new Map<string, Promise<any | null>>()

  /** Request (or reuse) the TTS audio for an ATIS broadcast. Deduped by content. */
  const requestAtisAudio = (entry: AirportFrequencyEntry, content: string): { announcement: string; promise: Promise<any | null> } => {
    const announcement = buildAtisAnnouncement({ ...entry, atisText: content })
    const cacheKey = `${buildAtisLoopKey(entry)}|${signalStrength.value}`

    let promise = atisAudioRequestCache.get(cacheKey)
    if (!promise) {
      const spokenAnnouncement = normalizeAtisForSpeech(announcement, {
        airportIcao: activeAirportIcao.value || flightContext.value.dep,
        airportName: airportName.value,
      })
      promise = api.post('/api/atc/say', {
        text: spokenAnnouncement,
        preNormalized: true,
        level: signalStrength.value,
        voice: 'verse',
        speed: 0.9,
        moduleId: 'pilot-monitoring',
        lessonId: 'atis',
        tag: 'atis',
        sessionId: engineSessionId.value || flags.value.session_id || undefined,
      }).catch((err: any) => {
        // Drop failed requests from the cache so a retune retries.
        atisAudioRequestCache.delete(cacheKey)
        pmLog.error('ATIS TTS failed', err)
        return null
      })
      atisAudioRequestCache.set(cacheKey, promise)
    }

    return { announcement, promise }
  }

  /** Pre-generate TTS for all ATIS broadcasts so the first tune-in plays instantly. */
  const prefetchAtisAudio = () => {
    for (const entry of atisEntries.value) {
      const content = (entry.atisText || '').trim()
      if (!content) continue
      requestAtisAudio(entry, content)
    }
  }

  const startAtisLoop = async (entry: AirportFrequencyEntry) => {
    if (!entry) return

    const desiredKey = buildAtisLoopKey(entry)
    if (atisLoopActive && atisLoopKey.value === desiredKey) {
      return
    }

    stopAtisLoop()

    // Carrier-Noise SOFORT — user gets feedback before TTS is back
    const loop = ensureAtisAudioLoop()
    try {
      loop.startLoading()
    } catch (err) {
      pmLog.warn('ATIS carrier start failed', err)
    }
    atisLoopActive = true
    atisLoopKey.value = desiredKey

    let content = (entry.atisText || '').trim()
    if (!content) {
      const metar = await fetchMetarText(activeAirportIcao.value || flightContext.value.dep)
      if (metar) {
        content = `METAR ${metar}`
      }
    }

    if (!content) {
      setLastTransmission('ATIS: No current information available')
      // Lass den Carrier laufen — Pilot hört dass die Frequenz aktiv ist, nur keine Ansage
      return
    }

    const { announcement, promise } = requestAtisAudio(entry, content)
    const epoch = resolveAtisEpoch(entry)
    const requestSeq = ++atisLoopSeq
    atisPlaybackLoading.value = true

    try {
      const response = await promise

      if (requestSeq !== atisLoopSeq) return
      if (!response?.success || !response.audio) {
        pmLog.warn('ATIS loop TTS returned no audio')
        atisLoopActive = false
        atisLoopKey.value = null
        return
      }

      const result = await loop.startBroadcast({
        audioBase64: response.audio.base64,
        mime: response.audio.mime,
        epochMs: epoch,
      })

      if (requestSeq !== atisLoopSeq) return
      if (!result) {
        pmLog.warn('ATIS loop broadcast start returned null (decode failed?)')
        // Mark inactive so a retune triggers a fresh attempt instead of being
        // swallowed by the "already active on this key" early-return.
        atisLoopActive = false
        atisLoopKey.value = null
        return
      }

      pmLog.info('ATIS loop start', {
        icao: activeAirportIcao.value || flightContext.value.dep,
        atisCode: entry.atisCode,
        duration: result.duration,
        requestedOffset: result.requestedOffset,
        epochAgeSec: (Date.now() - epoch) / 1000,
      })

      setLastTransmission(`ATIS: ${announcement}`)
    } catch (err) {
      pmLog.error('ATIS loop start failed', err)
      if (requestSeq === atisLoopSeq) {
        atisLoopActive = false
        atisLoopKey.value = null
      }
    } finally {
      if (requestSeq === atisLoopSeq) {
        atisPlaybackLoading.value = false
      }
    }
  }

  const playAtisBroadcast = async () => {
    const atisEntry = atisFrequencyEntry.value
    if (!atisEntry) return
    setActiveFrequencyFromList(atisEntry)
    await startAtisLoop(atisEntry)
  }

  // Background airport-data refresh while monitoring, aligned to METAR
  // publication slots (:23/:53 — see ATIS_REFRESH_MINUTES). The silent fetch
  // never blanks the list or retunes the radio; when the info letter changes,
  // the ATIS-loop watcher below sees a new key and restarts the broadcast.
  watch(currentScreen, (screen) => {
    if (screen === 'monitor') {
      scheduleAirportDataRefresh()
    } else {
      cancelAirportDataRefresh()
    }
  }, { immediate: true })

  // ATIS loop: start when any ATIS frequency is tuned (arrival/departure ATIS
  // are separate stations with own content), stop when tuned away, restart on
  // info-letter change or when switching between ATIS stations.
  watch(
    () => {
      const entry = freq.tunedAtisEntry.value
      if (!entry) return null
      return {
        entry,
        key: buildAtisLoopKey(entry),
      }
    },
    (next, prev) => {
      if (!next) {
        if (atisLoopActive) stopAtisLoop()
        return
      }
      if (prev && prev.key === next.key && atisLoopActive) return
      startAtisLoop(next.entry)
    },
    { immediate: true },
  )

  return {
    atisPlaybackLoading,
    atisLoopKey,
    cancelAirportDataRefresh,
    scheduleAirportDataRefresh,
    fetchMetarText,
    buildAtisAnnouncement,
    buildAtisLoopKey,
    stopAtisLoop,
    startAtisLoop,
    playAtisBroadcast,
    prefetchAtisAudio,
  }
}
