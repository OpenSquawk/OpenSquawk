import { ref, computed } from 'vue'
import { useApi } from '~/composables/useApi'
import useCommunicationsEngine from '../../shared/utils/communicationsEngine'
import { normalizeManualFreq, normalizedFrequencyValue } from '../../shared/utils/frequency'
import {
  offeredAirports,
  stationReachable,
  type AirportRole,
} from '../../shared/utils/stationAvailability'
import type { AtisReport, AtisStation } from '../../shared/utils/atisReport'

export type AirportFrequencyEntry = {
  type: string
  label: string
  frequency: string
  source: 'vatsim' | 'openaip'
  callsign?: string
  atisCode?: string
  atisText?: string
  lastUpdated?: string
}

export type DisplayAirportFrequencyEntry = AirportFrequencyEntry & {
  displayKey: string
  sourceList: Array<'vatsim' | 'openaip'>
  sourceLabel: string
  /** Which airport of the flight this station belongs to. */
  airportIcao?: string
  airportRole?: AirportRole
  /**
   * False only when the position proves the station is beyond VHF line of
   * sight. Unknown position means true — see stationAvailability.
   */
  reachable: boolean
}

export type FrequencyVariableUpdate = Partial<Record<'atis_freq' | 'delivery_freq' | 'ground_freq' | 'tower_freq' | 'departure_freq' | 'approach_freq' | 'handoff_freq', string>>

export type FrequencyPresetOption = {
  value: string
  label: string
  sublabel: string
  color: string
  sourceLabel: string
  callsign?: string
}

export const FREQUENCY_PLACEHOLDER = '---'

const FREQ_ROLE_ORDER = ['ATIS', 'DEL', 'CLD', 'GND', 'TWR', 'DEP', 'APP', 'CTR', 'ACC', 'FSS']
export const FREQ_ROLE_LABEL: Record<string, string> = {
  ATIS: 'ATIS', DEL: 'Delivery', CLD: 'Delivery', GND: 'Ground', TWR: 'Tower',
  DEP: 'Departure', APP: 'Approach', CTR: 'Center', ACC: 'Center', FSS: 'Radio',
}

const frequencyTypeMap: Record<string, keyof FrequencyVariableUpdate> = {
  ATIS: 'atis_freq',
  DEL: 'delivery_freq',
  CLD: 'delivery_freq',
  GND: 'ground_freq',
  TWR: 'tower_freq',
  DEP: 'departure_freq',
  APP: 'approach_freq',
  CTR: 'handoff_freq',
  ACC: 'handoff_freq',
  FSS: 'handoff_freq',
}

// Maps frequency_name from the flow state to the resolved airport frequency variable.
const FREQ_NAME_TO_VAR: Record<string, string> = {
  'clearance delivery': 'delivery_freq',
  'delivery':           'delivery_freq',
  'ground':             'ground_freq',
  'tower':              'tower_freq',
  'departure':          'departure_freq',
  'approach':           'approach_freq',
  'centre':             'handoff_freq',
  'center':             'handoff_freq',
  'radar':              'handoff_freq',
}


/** "Arrival" / "Departure" variant from the station callsign (EDDF_A_ATIS / EDDF_D_ATIS). */
export const atisVariantLabel = (entry: AirportFrequencyEntry): string => {
  const callsign = (entry.callsign || '').toUpperCase()
  if (callsign.includes('_A_')) return 'Arrival '
  if (callsign.includes('_D_')) return 'Departure '
  // Fallback: published station name (OpenAIP) sometimes carries the variant.
  const label = (entry.label || '').toLowerCase()
  if (label.includes('arr')) return 'Arrival '
  if (label.includes('dep')) return 'Departure '
  return ''
}

export function useFrequencyPresets(
  engine: ReturnType<typeof useCommunicationsEngine>,
  stopCurrentSpeech: () => void,
) {
  const { currentState, variables: vars, flags, updateFrequencyVariables } = engine
  const api = useApi()

  const frequencies = ref({
    active: '121.900',
    standby: '118.100',
  })

  const airportFrequencies = ref<AirportFrequencyEntry[]>([])
  const airportName = ref<string | undefined>(undefined)
  const airportFrequencyLoading = ref(false)
  const frequencySources = ref({ vatsim: false, openaip: false })
  // ICAO of the airport this session operates at (dep for departures, arr for
  // arrivals) — drives ATIS announcements, METAR fallback, and the periodic refetch.
  const activeAirportIcao = ref<string | undefined>(undefined)
  const swapAnimation = ref(false)
  const manualFreqActive = ref('')
  const manualFreqStandby = ref('')

  // Derived from the raw airport frequency list — always reflects the real airport
  // data regardless of which flow snapshot is active. Used by expectedFrequencyForState
  // so the wrong-frequency check is reliable across all flow transitions.
  const airportFreqMap = computed<Record<string, string>>(() => {
    const result: Record<string, string> = {}
    for (const entry of airportFrequencies.value) {
      const key = frequencyTypeMap[entry.type]
      if (key && entry.frequency && !result[key]) {
        result[key] = entry.frequency
      }
    }
    return result
  })

  function expectedFrequencyForState(): string | null {
    const freqName = (currentState.value as any)?.frequency_name as string | undefined
    if (!freqName) return null
    const varKey = FREQ_NAME_TO_VAR[freqName.toLowerCase()]
    if (!varKey) return null
    // airportFreqMap is the authoritative source — it comes from the live airport
    // data and is unaffected by flow-snapshot switches. Fall back to the engine
    // variable store for any edge-case where airport data is missing.
    return airportFreqMap.value[varKey] ?? ((vars as any).value[varKey] as string ?? null)
  }

  // All real frequencies published for a logical position. Some airports list
  // several for the same role (e.g. EDDM has two Tower frequencies, 118.700 and
  // 120.500) — the wrong-frequency gate accepts ANY of them, while
  // expectedFrequencyForState() still returns the primary one for the prompt.
  const airportFreqListMap = computed<Record<string, string[]>>(() => {
    const result: Record<string, string[]> = {}
    for (const entry of airportFrequencies.value) {
      const key = frequencyTypeMap[entry.type]
      if (key && entry.frequency) {
        (result[key] ||= []).push(entry.frequency)
      }
    }
    return result
  })

  function acceptedFrequenciesForState(): string[] {
    const freqName = (currentState.value as any)?.frequency_name as string | undefined
    if (!freqName) return []
    const varKey = FREQ_NAME_TO_VAR[freqName.toLowerCase()]
    if (!varKey) return []
    const all = [...(airportFreqListMap.value[varKey] ?? [])]
    const fromVars = (vars as any).value[varKey] as string | undefined
    if (fromVars) all.push(fromVars)
    return Array.from(new Set(all.map(normalizedFrequencyValue).filter(Boolean)))
  }

  // The resolved ATIS for this airport (see server/api/airports/[icao]/atis.get.ts).
  // Always carries an information letter, whether or not VATSIM has a station.
  const atisReport = ref<AtisReport | null>(null)

  /** The resolved broadcast belonging to a published ATIS frequency, if any. */
  const stationForEntry = (entry: AirportFrequencyEntry): AtisStation | undefined => {
    const stations = atisReport.value?.stations ?? []
    if (!stations.length) return undefined
    const byCallsign = entry.callsign
      && stations.find(station => station.callsign?.toUpperCase() === entry.callsign!.toUpperCase())
    if (byCallsign) return byCallsign
    const wanted = normalizedFrequencyValue(entry.frequency)
    const byFrequency = stations.find(station => normalizedFrequencyValue(station.frequency) === wanted)
    if (byFrequency) return byFrequency
    // A single broadcast belongs to the airport's single ATIS frequency.
    return stations.length === 1 ? stations[0] : undefined
  }

  // All ATIS stations at the airport. Large airports broadcast separate
  // Arrival and Departure ATIS on different frequencies (EDDF_A_ATIS /
  // EDDF_D_ATIS on VATSIM), each with its own info letter and text.
  //
  // The published frequency list only carries live text when a VATSIM
  // controller is online, so the resolved report backfills the letter and the
  // broadcast — that is what stops an ATIS from playing with no information
  // letter and no runway.
  const atisEntries = computed<AirportFrequencyEntry[]>(() =>
    airportFrequencies.value
      .filter(entry => entry.type === 'ATIS')
      .map((entry) => {
        const station = stationForEntry(entry)
        if (!station) return entry
        return {
          ...entry,
          atisCode: entry.atisCode || station.letter || atisReport.value?.letter || undefined,
          atisText: entry.atisText || station.text || undefined,
          lastUpdated: entry.lastUpdated || station.lastUpdated,
        }
      }))

  // Primary ATIS entry for the quick-play button — prefer one with live text.
  const atisFrequencyEntry = computed(() =>
    atisEntries.value.find(entry => (entry.atisText || '').trim()) || atisEntries.value[0])

  /** True when the ATIS is synthesised rather than a live VATSIM broadcast. */
  const atisIsSynthetic = computed(() =>
    Boolean(atisReport.value) && atisReport.value!.source !== 'vatsim')

  /**
   * Runway in use for the given kind, from the resolved report. Null only when
   * the airport has no usable runway data at all — callers keep their default.
   */
  const runwayInUse = (kind: 'dep' | 'arr'): string | null =>
    (kind === 'dep' ? atisReport.value?.runwayDep : atisReport.value?.runwayArr) ?? null

  /** Information letter for the given kind, or null before the report loads. */
  const informationLetter = (kind: 'dep' | 'arr'): string | null =>
    (kind === 'dep' ? atisReport.value?.letterDep : atisReport.value?.letterArr)
    ?? atisReport.value?.letter
    ?? null

  const frequencySourceLabels = computed(() => {
    const labels: string[] = []
    if (frequencySources.value.vatsim) labels.push('VATSIM')
    if (frequencySources.value.openaip) labels.push('OpenAIP')
    return labels
  })

  // The ATIS station matching the currently tuned frequency (if any). With
  // multiple ATIS stations, each frequency carries its own broadcast.
  const tunedAtisEntry = computed<AirportFrequencyEntry | null>(() => {
    const active = normalizedFrequencyValue(frequencies.value.active)
    if (!active) return null
    const matches = atisEntries.value.filter(entry =>
      entry.frequency
      && entry.frequency !== FREQUENCY_PLACEHOLDER
      && normalizedFrequencyValue(entry.frequency) === active,
    )
    if (!matches.length) return null
    // Two sources can list the same frequency — prefer the entry with live text.
    return matches.find(entry => (entry.atisText || '').trim()) || matches[0]!
  })

  const frequencyDisplayKey = (entry: AirportFrequencyEntry) =>
    [
      (entry.type || '').trim().toUpperCase(),
      normalizedFrequencyValue(entry.frequency),
    ].join('|')

  const sourceLabel = (sources: Array<'vatsim' | 'openaip'>) => {
    const hasVatsim = sources.includes('vatsim')
    const hasOpenAip = sources.includes('openaip')
    if (hasVatsim && hasOpenAip) return 'VATSIM + OpenAIP'
    if (hasVatsim) return 'VATSIM'
    if (hasOpenAip) return 'OpenAIP'
    return 'Source'
  }

  const displayAirportFrequencies = computed<DisplayAirportFrequencyEntry[]>(() => {
    const grouped = new Map<string, DisplayAirportFrequencyEntry>()

    // The airport being flown first, then the other end of the flight. Both are
    // listed: a pilot has to be able to dial ahead to the destination, and on
    // the way home the departure field's Ground is what they will need again.
    const home = activeAirportIcao.value?.trim().toUpperCase()
    const tagged: Array<{ entry: AirportFrequencyEntry; icao?: string; role?: AirportRole }> = [
      ...airportFrequencies.value.map(entry => ({
        entry, icao: home, role: 'departure' as AirportRole,
      })),
      ...destinationFrequencies.value.map(entry => ({
        entry, icao: destinationIcao.value, role: 'destination' as AirportRole,
      })),
    ]

    for (const { entry, icao, role } of tagged) {
      if (!entry.frequency || entry.frequency === FREQUENCY_PLACEHOLDER) continue

      const key = `${icao ?? ''}::${frequencyDisplayKey(entry)}`
      const existing = grouped.get(key)

      if (!existing) {
        grouped.set(key, {
          ...entry,
          displayKey: key,
          sourceList: [entry.source],
          sourceLabel: sourceLabel([entry.source]),
          airportIcao: icao,
          airportRole: role,
          reachable: stationReachable({
            distanceNm: role === 'destination'
              ? distanceToDestinationNm.value
              : distanceToDepartureNm.value,
            altitudeFt: altitudeFt.value,
          }),
        })
        continue
      }

      if (!existing.sourceList.includes(entry.source)) {
        existing.sourceList.push(entry.source)
      }
      existing.sourceLabel = sourceLabel(existing.sourceList)
      existing.callsign ||= entry.callsign
      existing.atisCode ||= entry.atisCode
      existing.atisText ||= entry.atisText
    }

    return [...grouped.values()].sort((a, b) => {
      // The airport being flown stays at the top; the far end follows.
      const aFar = a.airportRole === 'destination' ? 1 : 0
      const bFar = b.airportRole === 'destination' ? 1 : 0
      if (aFar !== bFar) return aFar - bFar
      const aRoleIndex = FREQ_ROLE_ORDER.includes(a.type) ? FREQ_ROLE_ORDER.indexOf(a.type) : Number.MAX_SAFE_INTEGER
      const bRoleIndex = FREQ_ROLE_ORDER.includes(b.type) ? FREQ_ROLE_ORDER.indexOf(b.type) : Number.MAX_SAFE_INTEGER
      const roleDiff = aRoleIndex - bRoleIndex
      if (roleDiff !== 0) return roleDiff
      return a.frequency.localeCompare(b.frequency)
    })
  })

  const toFrequencyVariableUpdate = (entry: AirportFrequencyEntry): FrequencyVariableUpdate | null => {
    if (!entry?.frequency) {
      return null
    }

    const targetKey = frequencyTypeMap[entry.type]
    if (!targetKey) {
      return null
    }

    return { [targetKey]: entry.frequency } as FrequencyVariableUpdate
  }

  const updateEngineFrequencyFromEntry = (entry: AirportFrequencyEntry) => {
    const update = toFrequencyVariableUpdate(entry)
    if (!update) {
      return
    }

    updateFrequencyVariables(update)
  }

  const syncLocalFrequenciesWithEngine = (updates: FrequencyVariableUpdate) => {
    const currentUnit = flags.value.current_unit
    if (currentUnit === 'DEL' && updates.delivery_freq) {
      frequencies.value.active = updates.delivery_freq
    } else if (currentUnit === 'GROUND' && updates.ground_freq) {
      frequencies.value.active = updates.ground_freq
    } else if (currentUnit === 'TOWER' && updates.tower_freq) {
      frequencies.value.active = updates.tower_freq
    } else if (currentUnit === 'DEP' && updates.departure_freq) {
      frequencies.value.active = updates.departure_freq
    } else if (currentUnit === 'APP' && updates.approach_freq) {
      frequencies.value.active = updates.approach_freq
    } else if (currentUnit === 'CTR' && updates.handoff_freq) {
      frequencies.value.active = updates.handoff_freq
    }

    if (updates.ground_freq) {
      frequencies.value.standby = updates.ground_freq
    }
  }

  const applyFrequencyVariablesFromList = (list: AirportFrequencyEntry[], options: { syncRadio?: boolean } = {}) => {
    if (!Array.isArray(list) || list.length === 0) {
      return
    }

    const prioritized = [...list].sort((a, b) => {
      if (a.source === b.source) return 0
      return a.source === 'vatsim' ? -1 : 1
    })

    const updates: FrequencyVariableUpdate = {}

    for (const entry of prioritized) {
      const targetKey = frequencyTypeMap[entry.type]
      if (!targetKey) continue
      if (updates[targetKey]) continue
      if (!entry.frequency) continue
      updates[targetKey] = entry.frequency
    }

    if (Object.keys(updates).length > 0) {
      updateFrequencyVariables(updates)
      if (options.syncRadio !== false) {
        syncLocalFrequenciesWithEngine(updates)
      }
    }
  }

  // The destination's stations are kept in their own list rather than merged
  // into airportFrequencies. Everything that resolves *which frequency this
  // phase expects* — airportFreqMap, expectedFrequencyForState, the
  // wrong-frequency gate, the ATIS wiring — reads the primary list, and folding
  // a second airport's Tower into it would let the gate accept the wrong field's
  // frequency. The two are only brought together for display.
  const destinationIcao = ref<string | undefined>(undefined)
  const destinationFrequencies = ref<AirportFrequencyEntry[]>([])

  // Position-derived values from the backend's telemetry response — it already
  // holds the airport coordinates, so the browser does not need its own copy.
  // Undefined without a bridge, which stationReachable reads as "range unknown"
  // and therefore reachable.
  const distanceToDepartureNm = ref<number | undefined>(undefined)
  const distanceToDestinationNm = ref<number | undefined>(undefined)
  const altitudeFt = ref<number | undefined>(undefined)

  /** Apply the derived_position block of a backend decision response. */
  const applyDerivedPosition = (derived: Record<string, number> | undefined | null) => {
    if (!derived) return
    const read = (key: string) => (typeof derived[key] === 'number' ? derived[key] : undefined)
    distanceToDepartureNm.value = read('distance_to_dep_nm')
    distanceToDestinationNm.value = read('distance_to_dest_nm')
    altitudeFt.value = read('altitude_ft')
  }

  const fetchDestinationFrequencies = async (icao: string | undefined) => {
    destinationIcao.value = icao?.trim().toUpperCase() || undefined
    destinationFrequencies.value = []
    if (!destinationIcao.value) return
    if (destinationIcao.value === activeAirportIcao.value?.trim().toUpperCase()) return
    try {
      const response = await api.get(`/api/airports/${encodeURIComponent(destinationIcao.value)}/frequencies`)
      destinationFrequencies.value = Array.isArray(response?.frequencies)
        ? response.frequencies as AirportFrequencyEntry[]
        : []
    } catch (err) {
      // Best-effort: the destination's stations are a convenience, and the
      // flight is entirely flyable without them.
      console.error('Failed to load destination frequencies:', err)
    }
  }

  const fetchAirportFrequencies = async (icao: string | undefined, options: { silent?: boolean } = {}) => {
    if (!icao) return

    // Silent mode (background refresh): keep the current list visible while
    // fetching and never retune the user's radio — only swap data when it arrives.
    if (!options.silent) {
      airportFrequencyLoading.value = true
      airportFrequencies.value = []
      airportName.value = undefined
      frequencySources.value = { vatsim: false, openaip: false }
    }

    try {
      // Both in flight together: the ATIS report backfills the letter and the
      // broadcast text onto the frequency entries, so a partial load would show
      // an ATIS station with no information letter.
      const [response, report] = await Promise.all([
        api.get(`/api/airports/${encodeURIComponent(icao)}/frequencies`),
        api.get(`/api/airports/${encodeURIComponent(icao)}/atis`).catch((err: unknown) => {
          console.error('Failed to load ATIS report:', err)
          return null
        }),
      ])
      const entries = Array.isArray(response?.frequencies) ? response.frequencies as AirportFrequencyEntry[] : []
      airportFrequencies.value = entries
      atisReport.value = (report as AtisReport | null) ?? null
      airportName.value = typeof response?.airportName === 'string' ? response.airportName : undefined
      frequencySources.value = {
        vatsim: Boolean(response?.sources?.vatsim),
        openaip: Boolean(response?.sources?.openaip),
      }

      applyFrequencyVariablesFromList(entries, { syncRadio: !options.silent })
    } catch (err) {
      console.error('Failed to load airport frequencies:', err)
      if (!options.silent) {
        airportFrequencies.value = []
        airportName.value = undefined
        atisReport.value = null
        frequencySources.value = { vatsim: false, openaip: false }
      }
    } finally {
      if (!options.silent) {
        airportFrequencyLoading.value = false
      }
    }
  }

  const setActiveFrequencyFromList = (entry: AirportFrequencyEntry) => {
    if (!entry) return
    const isPlaceholder = !entry.frequency || entry.frequency === FREQUENCY_PLACEHOLDER

    if (!isPlaceholder && frequencies.value.active !== entry.frequency) {
      // Tuning away from the current frequency — cut any in-progress ATC speech
      // so the pilot no longer "hears" the controller on the old channel.
      stopCurrentSpeech()
      frequencies.value.standby = frequencies.value.active
      frequencies.value.active = entry.frequency
    }

    updateEngineFrequencyFromEntry(entry)
  }

  const setStandbyFrequencyFromList = (entry: AirportFrequencyEntry) => {
    if (!entry) return
    const isPlaceholder = !entry.frequency || entry.frequency === FREQUENCY_PLACEHOLDER

    if (!isPlaceholder) {
      frequencies.value.standby = entry.frequency
    }

    updateEngineFrequencyFromEntry(entry)
  }

  const swapFrequencies = () => {
    swapAnimation.value = true

    // Swapping away from the active frequency — cut any in-progress speech
    // so the pilot no longer "hears" the controller on the old channel.
    if (frequencies.value.active !== frequencies.value.standby) {
      stopCurrentSpeech()
    }

    const temp = frequencies.value.active
    frequencies.value.active = frequencies.value.standby
    frequencies.value.standby = temp

    setTimeout(() => {
      swapAnimation.value = false
    }, 500)
  }

  // --- Frequency presets (for the hold-to-select gesture) ---------------------
  const frequencyPresets = computed<DisplayAirportFrequencyEntry[]>(() => {
    // Use the grouped overview list so every distinct frequency shows up in the dropdown
    // (deduped by type+frequency, with merged sources for tooltip).
    return displayAirportFrequencies.value
  })

  const presetKey = (entry: AirportFrequencyEntry | DisplayAirportFrequencyEntry) =>
    'displayKey' in entry ? entry.displayKey : `${entry.type}-${entry.frequency}`
  const presetLabel = (entry: AirportFrequencyEntry) => {
    // Distinguish multiple ATIS stations (Arrival ATIS / Departure ATIS).
    if (entry.type === 'ATIS') {
      const variant = atisVariantLabel(entry)
      if (variant) return `${variant}ATIS`
    }
    return FREQ_ROLE_LABEL[entry.type] || entry.type
  }

  const presetOptions = computed<FrequencyPresetOption[]>(() =>
    frequencyPresets.value.map((entry) => ({
      value: presetKey(entry),
      label: presetLabel(entry),
      sublabel: entry.type === 'ATIS' && entry.atisCode
        ? `${entry.frequency} · Info ${entry.atisCode}`
        : entry.frequency,
      color: entry.type === 'ATIS' ? '#f59e0b' : '#22d3ee',
      // A synthesised ATIS is not a VATSIM broadcast — say so rather than
      // crediting the source the frequency happens to come from.
      sourceLabel: entry.type === 'ATIS' && atisIsSynthetic.value
        ? 'Simulated ATIS'
        : entry.sourceLabel,
      callsign: entry.callsign,
    })),
  )

  const findPreset = (value: string | number) =>
    frequencyPresets.value.find((entry) => presetKey(entry) === value)

  const onPresetSelectActive = (opt: { value: string | number }) => {
    const entry = findPreset(opt.value)
    if (entry) setActiveFrequencyFromList(entry)
  }
  const onPresetSelectStandby = (opt: { value: string | number }) => {
    const entry = findPreset(opt.value)
    if (entry) setStandbyFrequencyFromList(entry)
  }

  // --- Manual frequency entry (free-tune any VHF airband channel) --------------
  function applyManualFrequency(target: 'active' | 'standby', close?: () => void) {
    const model = target === 'active' ? manualFreqActive : manualFreqStandby
    const freq = normalizeManualFreq(model.value)
    if (!freq) return

    if (target === 'active') {
      if (frequencies.value.active !== freq) {
        // Tuning away from the current frequency — cut any in-progress ATC speech
        // so the pilot no longer "hears" the controller on the old channel.
        stopCurrentSpeech()
        frequencies.value.standby = frequencies.value.active
        frequencies.value.active = freq
      }
    } else {
      frequencies.value.standby = freq
    }

    model.value = ''
    close?.()
  }

  return {
    frequencies,
    airportFrequencies,
    airportName,
    airportFrequencyLoading,
    frequencySources,
    activeAirportIcao,
    swapAnimation,
    manualFreqActive,
    manualFreqStandby,
    airportFreqMap,
    airportFreqListMap,
    expectedFrequencyForState,
    acceptedFrequenciesForState,
    atisEntries,
    atisFrequencyEntry,
    atisReport,
    atisIsSynthetic,
    runwayInUse,
    informationLetter,
    frequencySourceLabels,
    tunedAtisEntry,
    frequencyDisplayKey,
    displayAirportFrequencies,
    toFrequencyVariableUpdate,
    updateEngineFrequencyFromEntry,
    syncLocalFrequenciesWithEngine,
    applyFrequencyVariablesFromList,
    fetchAirportFrequencies,
    fetchDestinationFrequencies,
    destinationFrequencies,
    applyDerivedPosition,
    setActiveFrequencyFromList,
    setStandbyFrequencyFromList,
    swapFrequencies,
    frequencyPresets,
    presetKey,
    presetLabel,
    presetOptions,
    findPreset,
    onPresetSelectActive,
    onPresetSelectStandby,
    applyManualFrequency,
  }
}
