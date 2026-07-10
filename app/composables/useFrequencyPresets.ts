import { ref, computed } from 'vue'
import { useApi } from '~/composables/useApi'
import useCommunicationsEngine from '../../shared/utils/communicationsEngine'
import { normalizeManualFreq } from '../../shared/utils/frequency'

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

export const normalizedFrequencyValue = (value: string | undefined) =>
  (value || '').trim().replace(/\s+/g, '').replace(',', '.')

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

  // All ATIS stations at the airport. Large airports broadcast separate
  // Arrival and Departure ATIS on different frequencies (EDDF_A_ATIS /
  // EDDF_D_ATIS on VATSIM), each with its own info letter and text.
  const atisEntries = computed(() => airportFrequencies.value.filter(entry => entry.type === 'ATIS'))

  // Primary ATIS entry for the quick-play button — prefer one with live text.
  const atisFrequencyEntry = computed(() =>
    atisEntries.value.find(entry => (entry.atisText || '').trim()) || atisEntries.value[0])

  /**
   * Extract the runway in use from live ATIS text ("DEP RWY 25C", "EXPECT ILS
   * APPROACH RUNWAY 25L", "RUNWAY IN USE 07"). Prefers a phrase matching the
   * requested kind (departure/arrival); falls back to any runway mention.
   * Returns null when no ATIS text carries a runway — callers keep their default.
   */
  const extractAtisRunway = (kind: 'dep' | 'arr'): string | null => {
    const RWY = String.raw`(?:RWY|RUNWAY)S?\s*([0-3]?\d\s*[LRC]?)\b`
    const kindPatterns = kind === 'dep'
      ? [new RegExp(String.raw`DEP(?:ARTURE)?S?[^.]{0,40}?${RWY}`, 'i')]
      : [
          new RegExp(String.raw`(?:ARR(?:IVAL)?S?|LANDING)[^.]{0,40}?${RWY}`, 'i'),
          new RegExp(String.raw`EXPECT[^.]{0,60}?APPROACH[^.]{0,20}?${RWY}`, 'i'),
        ]
    const genericPattern = new RegExp(RWY, 'i')

    const texts = atisEntries.value
      .map(entry => (entry.atisText || '').trim())
      .filter(Boolean)

    for (const patterns of [kindPatterns, [genericPattern]]) {
      for (const text of texts) {
        for (const pattern of patterns) {
          const match = pattern.exec(text)
          if (match?.[1]) {
            const designator = match[1].replace(/\s+/g, '').toUpperCase()
            // Normalise "7L" -> "07L" so it matches OSM runway refs.
            return /^\d[LRC]?$/.test(designator) ? `0${designator}` : designator
          }
        }
      }
    }
    return null
  }

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

    for (const entry of airportFrequencies.value) {
      if (!entry.frequency || entry.frequency === FREQUENCY_PLACEHOLDER) continue

      const key = frequencyDisplayKey(entry)
      const existing = grouped.get(key)

      if (!existing) {
        grouped.set(key, {
          ...entry,
          displayKey: key,
          sourceList: [entry.source],
          sourceLabel: sourceLabel([entry.source]),
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
      const response = await api.get(`/api/airports/${encodeURIComponent(icao)}/frequencies`)
      const entries = Array.isArray(response?.frequencies) ? response.frequencies as AirportFrequencyEntry[] : []
      airportFrequencies.value = entries
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
      sourceLabel: entry.sourceLabel,
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
    extractAtisRunway,
    frequencySourceLabels,
    tunedAtisEntry,
    frequencyDisplayKey,
    displayAirportFrequencies,
    toFrequencyVariableUpdate,
    updateEngineFrequencyFromEntry,
    syncLocalFrequenciesWithEngine,
    applyFrequencyVariablesFromList,
    fetchAirportFrequencies,
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
