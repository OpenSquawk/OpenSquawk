// composables/communicationsEngine.ts
import { ref, computed } from 'vue'

export interface CommunicationStep {
    id: string
    phase: string
    frequency: string
    frequencyName: string
    action: string
    trigger: 'pilot' | 'atc' | 'automatic' | 'callback'
    pilot?: string
    atc?: string
    pilotResponse?: string
    atcResponse?: string
    variables?: Record<string, any>
    nextStep?: string
    conditions?: Array<{
        type: 'contains' | 'equals' | 'timeout'
        value: string | number
        nextStep: string
    }>
    callback?: () => void
    audioEffects?: {
        static?: number // 0-100
        distortion?: number // 0-100
        volume?: number // 0-100
    }
}

export interface FlightContext {
    callsign: string
    aircraft: string
    departure: string
    arrival: string
    gate: string
    runway: string
    squawk: string
    atis: string
    sid: string
    flightLevel: string
    groundFreq: string
    towerFreq: string
    departureFreq: string
    approachFreq: string
    taxiRoute: string[]
    phase: string
    lastTransmission?: string
    awaitingResponse?: boolean
}

// ICAO Phonetic and Number Normalization
const NATO_PHONETIC: Record<string, string> = {
    'A': 'Alpha', 'B': 'Bravo', 'C': 'Charlie', 'D': 'Delta', 'E': 'Echo', 'F': 'Foxtrot',
    'G': 'Golf', 'H': 'Hotel', 'I': 'India', 'J': 'Juliett', 'K': 'Kilo', 'L': 'Lima',
    'M': 'Mike', 'N': 'November', 'O': 'Oscar', 'P': 'Papa', 'Q': 'Quebec', 'R': 'Romeo',
    'S': 'Sierra', 'T': 'Tango', 'U': 'Uniform', 'V': 'Victor', 'W': 'Whiskey',
    'X': 'X-ray', 'Y': 'Yankee', 'Z': 'Zulu'
}

const ICAO_NUMBERS: Record<string, string> = {
    '0': 'zero', '1': 'wun', '2': 'too', '3': 'tree', '4': 'fower',
    '5': 'fife', '6': 'six', '7': 'seven', '8': 'eight', '9': 'niner'
}

// Comprehensive Communication Steps for Complete Flight
export const COMMUNICATION_STEPS: CommunicationStep[] = [
    // Phase 1: Clearance Delivery
    {
        id: 'clearance_request',
        phase: 'clearance',
        frequency: '121.700',
        frequencyName: 'Clearance Delivery',
        action: 'Request IFR Clearance',
        trigger: 'pilot',
        pilot: '${airport} Delivery, good day, ${callsign} at stand ${gate}, with information ${atis}, requesting IFR clearance to ${arrival}',
        atc: '${callsign}, ${airport} Delivery, good day, cleared to ${arrival}, ${sid} departure, runway ${runway}, squawk ${squawk}, departure frequency ${departureFreq}',
        pilotResponse: 'Cleared to ${arrival}, ${sid} departure, runway ${runway}, squawk ${squawk}, departure ${departureFreq}, ${callsign}',
        atcResponse: '${callsign}, readback correct, report ready for startup',
        nextStep: 'startup_request',
        audioEffects: { static: 15, distortion: 5, volume: 85 }
    },

    // Phase 2: Startup
    {
        id: 'startup_request',
        phase: 'clearance',
        frequency: '121.700',
        frequencyName: 'Clearance Delivery',
        action: 'Ready for Startup',
        trigger: 'pilot',
        pilot: '${callsign} ready for startup',
        atc: '${callsign}, startup approved, for pushback contact Ground on ${groundFreq}',
        pilotResponse: 'Startup approved, Ground ${groundFreq}, ${callsign}',
        nextStep: 'pushback_request',
        audioEffects: { static: 12, distortion: 3, volume: 88 }
    },

    // Phase 3: Ground - Pushback
    {
        id: 'pushback_request',
        phase: 'ground',
        frequency: '121.900',
        frequencyName: 'Ground Control',
        action: 'Request Pushback',
        trigger: 'pilot',
        pilot: '${airport} Ground, good day, ${callsign} at stand ${gate}, requesting pushback',
        atc: '${callsign}, ${airport} Ground, good day, pushback approved, facing ${direction}',
        pilotResponse: 'Pushback approved, facing ${direction}, ${callsign}',
        atcResponse: '${callsign}, pushback complete, start engines when ready',
        nextStep: 'taxi_request',
        callback: () => console.log('Pushback phase completed'),
        audioEffects: { static: 18, distortion: 7, volume: 82 }
    },

    // Phase 4: Ground - Taxi
    {
        id: 'taxi_request',
        phase: 'ground',
        frequency: '121.900',
        frequencyName: 'Ground Control',
        action: 'Request Taxi',
        trigger: 'pilot',
        pilot: '${callsign} request taxi',
        atc: '${callsign}, taxi to runway ${runway} via ${taxiRoute}, hold short of runway ${runway}',
        pilotResponse: 'Taxi to runway ${runway} via ${taxiRoute}, hold short of runway ${runway}, ${callsign}',
        nextStep: 'tower_handoff',
        conditions: [
            { type: 'contains', value: 'give way', nextStep: 'give_way' }
        ],
        audioEffects: { static: 20, distortion: 8, volume: 80 }
    },

    // Ground - Give Way (Optional)
    {
        id: 'give_way',
        phase: 'ground',
        frequency: '121.900',
        frequencyName: 'Ground Control',
        action: 'Traffic Instruction',
        trigger: 'atc',
        atc: '${callsign}, give way to the ${trafficType} from your ${direction}',
        pilotResponse: 'Give way to ${trafficType} from ${direction}, ${callsign}',
        nextStep: 'taxi_continue',
        audioEffects: { static: 22, distortion: 10, volume: 78 }
    },

    {
        id: 'taxi_continue',
        phase: 'ground',
        frequency: '121.900',
        frequencyName: 'Ground Control',
        action: 'Continue Taxi',
        trigger: 'atc',
        atc: '${callsign}, continue taxi',
        pilotResponse: 'Continue taxi, ${callsign}',
        nextStep: 'tower_handoff',
        audioEffects: { static: 18, distortion: 6, volume: 85 }
    },

    // Phase 5: Tower Handoff
    {
        id: 'tower_handoff',
        phase: 'ground',
        frequency: '121.900',
        frequencyName: 'Ground Control',
        action: 'Tower Handoff',
        trigger: 'atc',
        atc: '${callsign}, at holding point contact Tower on ${towerFreq}',
        pilotResponse: 'Contact Tower ${towerFreq}, ${callsign}',
        nextStep: 'tower_checkin',
        callback: () => console.log('Switching to Tower frequency'),
        audioEffects: { static: 15, distortion: 5, volume: 88 }
    },

    // Phase 6: Tower - Check In
    {
        id: 'tower_checkin',
        phase: 'tower',
        frequency: '119.100',
        frequencyName: 'Tower',
        action: 'Tower Check-in',
        trigger: 'pilot',
        pilot: '${airport} Tower, good day, ${callsign} at holding point runway ${runway}, ready for departure',
        atc: '${callsign}, ${airport} Tower, good day, line up and wait runway ${runway}',
        pilotResponse: 'Line up and wait runway ${runway}, ${callsign}',
        nextStep: 'takeoff_clearance',
        audioEffects: { static: 10, distortion: 3, volume: 90 }
    },

    // Phase 7: Tower - Takeoff
    {
        id: 'takeoff_clearance',
        phase: 'tower',
        frequency: '119.100',
        frequencyName: 'Tower',
        action: 'Takeoff Clearance',
        trigger: 'atc',
        atc: '${callsign}, wind ${wind}, runway ${runway}, cleared for takeoff',
        pilotResponse: 'Cleared for takeoff runway ${runway}, ${callsign}',
        nextStep: 'departure_handoff',
        conditions: [
            { type: 'timeout', value: 30000, nextStep: 'departure_handoff' }
        ],
        audioEffects: { static: 8, distortion: 2, volume: 92 }
    },

    // Phase 8: Departure Handoff
    {
        id: 'departure_handoff',
        phase: 'tower',
        frequency: '119.100',
        frequencyName: 'Tower',
        action: 'Departure Handoff',
        trigger: 'atc',
        atc: '${callsign}, contact ${airport} Departure ${departureFreq}',
        pilotResponse: 'Contact ${airport} Departure ${departureFreq}, ${callsign}',
        nextStep: 'departure_checkin',
        callback: () => console.log('Switching to Departure frequency'),
        audioEffects: { static: 12, distortion: 4, volume: 88 }
    },

    // Phase 9: Departure Control
    {
        id: 'departure_checkin',
        phase: 'departure',
        frequency: '123.800',
        frequencyName: 'Departure Control',
        action: 'Departure Check-in',
        trigger: 'pilot',
        pilot: '${airport} Departure, good day, ${callsign}, passing ${altitude} for ${flightLevel}, ${sid}',
        atc: '${callsign}, ${airport} Departure, radar contact, climb flight level ${flightLevel}',
        pilotResponse: 'Climb flight level ${flightLevel}, ${callsign}',
        nextStep: 'enroute_handoff',
        audioEffects: { static: 15, distortion: 6, volume: 85 }
    },

    // Phase 10: Enroute
    {
        id: 'enroute_handoff',
        phase: 'departure',
        frequency: '123.800',
        frequencyName: 'Departure Control',
        action: 'Enroute Handoff',
        trigger: 'atc',
        atc: '${callsign}, contact ${centerName} ${centerFreq}',
        pilotResponse: 'Contact ${centerName} ${centerFreq}, ${callsign}',
        nextStep: 'flight_complete',
        callback: () => console.log('Flight handed off to enroute control'),
        audioEffects: { static: 20, distortion: 8, volume: 82 }
    }
]

// Text Normalization for Proper ATC Pronunciation
export function normalizeATCText(text: string, context: FlightContext): string {
    let normalized = text

    // Replace variables with context values
    Object.keys(context).forEach(key => {
        const value = (context as any)[key]
        if (value) {
            normalized = normalized.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value)
        }
    })

    // Normalize runway callouts (e.g., "25L" -> "two five left")
    normalized = normalized.replace(/runway\s+(\d{1,2})([LRC]?)/gi, (match, num, suffix) => {
        const normalizedNum = num.split('').map((digit: string) => ICAO_NUMBERS[digit] || digit).join(' ')
        const normalizedSuffix = suffix === 'L' ? ' left' : suffix === 'R' ? ' right' : suffix === 'C' ? ' center' : ''
        return `runway ${normalizedNum}${normalizedSuffix}`
    })

    // Normalize flight levels (e.g., "FL350" -> "flight level three five zero")
    normalized = normalized.replace(/FL(\d{3})/gi, (match, level) => {
        const normalizedLevel = level.split('').map((digit: string) => ICAO_NUMBERS[digit] || digit).join(' ')
        return `flight level ${normalizedLevel}`
    })

    // Normalize altitudes (e.g., "5000" -> "five thousand")
    normalized = normalized.replace(/\b(\d{1,5})\s*(?:feet?|ft)\b/gi, (match, alt) => {
        return normalizeAltitude(parseInt(alt))
    })

    // Normalize frequencies (e.g., "121.9" -> "wun too wun decimal niner")
    normalized = normalized.replace(/(\d{3})\.(\d{1,3})/g, (match, before, after) => {
        const normalizedBefore = before.split('').map((digit: string) => ICAO_NUMBERS[digit] || digit).join(' ')
        const normalizedAfter = after.split('').map((digit: string) => ICAO_NUMBERS[digit] || digit).join(' ')
        return `${normalizedBefore} decimal ${normalizedAfter}`
    })

    // Normalize squawk codes (e.g., "4567" -> "fower fife six seven")
    normalized = normalized.replace(/squawk\s+(\d{4})/gi, (match, code) => {
        const normalizedCode = code.split('').map((digit: string) => ICAO_NUMBERS[digit] || digit).join(' ')
        return `squawk ${normalizedCode}`
    })

    // Normalize headings (e.g., "270" -> "heading two seven zero")
    normalized = normalized.replace(/heading\s+(\d{3})/gi, (match, heading) => {
        const normalizedHeading = heading.split('').map((digit: string) => ICAO_NUMBERS[digit] || digit).join(' ')
        return `heading ${normalizedHeading}`
    })

    // Normalize taxi instructions (e.g., "via A, B, C" -> "via Alpha, Bravo, Charlie")
    normalized = normalized.replace(/via\s+([A-Z](?:\d+)?(?:\s*,\s*[A-Z](?:\d+)?)*)/gi, (match, route) => {
        const normalizedRoute = route.split(/\s*,\s*/).map((segment: string) => {
            return segment.replace(/([A-Z])(\d+)?/g, (segMatch, letter, number) => {
                const normalizedLetter = NATO_PHONETIC[letter] || letter
                const normalizedNumber = number ? number.split('').map((digit: string) => ICAO_NUMBERS[digit] || digit).join(' ') : ''
                return normalizedLetter + (normalizedNumber ? ' ' + normalizedNumber : '')
            })
        }).join(', ')
        return `via ${normalizedRoute}`
    })

    // Normalize single taxiway references (e.g., "A5" -> "Alpha five")
    normalized = normalized.replace(/\b([A-Z])(\d+)\b/g, (match, letter, number) => {
        const normalizedLetter = NATO_PHONETIC[letter] || letter
        const normalizedNumber = number.split('').map((digit: string) => ICAO_NUMBERS[digit] || digit).join(' ')
        return `${normalizedLetter} ${normalizedNumber}`
    })

    // Normalize wind callouts (e.g., "280/15" -> "two eight zero at wun fife")
    normalized = normalized.replace(/(\d{3})\/(\d{1,2})/g, (match, direction, speed) => {
        const normalizedDirection = direction.split('').map((digit: string) => ICAO_NUMBERS[digit] || digit).join(' ')
        const normalizedSpeed = speed.split('').map((digit: string) => ICAO_NUMBERS[digit] || digit).join(' ')
        return `${normalizedDirection} at ${normalizedSpeed}`
    })

    return normalized
}

function normalizeAltitude(altitude: number): string {
    if (altitude >= 1000) {
        const thousands = Math.floor(altitude / 1000)
        const remainder = altitude % 1000
        let result = `${ICAO_NUMBERS[thousands.toString()]} thousand`
        if (remainder > 0) {
            result += ` ${remainder}`
        }
        return result
    }
    return altitude.toString()
}

// Communication Engine Composable
export default function useCommunicationsEngine() {
    const currentStep = ref<CommunicationStep | null>(null)
    const flightContext = ref<FlightContext>({
        callsign: '',
        aircraft: '',
        departure: '',
        arrival: '',
        gate: '',
        runway: '',
        squawk: '',
        atis: '',
        sid: '',
        flightLevel: '',
        groundFreq: '121.900',
        towerFreq: '119.100',
        departureFreq: '123.800',
        approachFreq: '119.300',
        taxiRoute: [],
        phase: 'clearance'
    })

    const communicationLog = ref<Array<{
        timestamp: Date
        frequency: string
        speaker: 'pilot' | 'atc'
        message: string
        normalized: string
        step: string
    }>>([])

    const initializeFlight = (flightPlan: any) => {
        flightContext.value = {
            callsign: flightPlan.callsign,
            aircraft: flightPlan.aircraft?.split('/')[0] || 'Unknown',
            departure: flightPlan.dep,
            arrival: flightPlan.arr,
            gate: generateGate(flightPlan.dep),
            runway: generateRunway(flightPlan.dep),
            squawk: flightPlan.assignedsquawk || generateSquawk(),
            atis: generateATIS(),
            sid: generateSID(flightPlan.route),
            flightLevel: `FL${Math.floor(parseInt(flightPlan.altitude) / 100).toString().padStart(3, '0')}`,
            groundFreq: '121.900',
            towerFreq: '119.100',
            departureFreq: '123.800',
            approachFreq: '119.300',
            taxiRoute: generateTaxiRoute(),
            phase: 'clearance'
        }

        currentStep.value = COMMUNICATION_STEPS[0]
    }

    const processUserTransmission = (transcription: string): string | null => {
        if (!currentStep.value) return null

        const normalized = normalizeATCText(transcription, flightContext.value)

        // Log user transmission
        communicationLog.value.push({
            timestamp: new Date(),
            frequency: currentStep.value.frequency,
            speaker: 'pilot',
            message: transcription,
            normalized,
            step: currentStep.value.id
        })

        // Generate ATC response
        const response = generateATCResponse(currentStep.value, transcription)

        if (response) {
            const normalizedResponse = normalizeATCText(response, flightContext.value)

            // Log ATC response
            communicationLog.value.push({
                timestamp: new Date(),
                frequency: currentStep.value.frequency,
                speaker: 'atc',
                message: response,
                normalized: normalizedResponse,
                step: currentStep.value.id
            })

            // Move to next step if applicable
            if (currentStep.value.nextStep) {
                moveToStep(currentStep.value.nextStep)
            }

            // Execute callback if present
            if (currentStep.value.callback) {
                currentStep.value.callback()
            }

            return normalizedResponse
        }

        return null
    }

    const generateATCResponse = (step: CommunicationStep, pilotMessage: string): string | null => {
        // Check if this step expects a pilot transmission
        if (step.trigger !== 'pilot' && !step.atc) return null

        // Return appropriate ATC response based on step
        if (step.atcResponse) {
            return step.atcResponse
        } else if (step.atc) {
            return step.atc
        }

        return null
    }

    const moveToStep = (stepId: string) => {
        const nextStep = COMMUNICATION_STEPS.find(s => s.id === stepId)
        if (nextStep) {
            currentStep.value = nextStep
            flightContext.value.phase = nextStep.phase

            // Auto-trigger ATC communications
            if (nextStep.trigger === 'atc' && nextStep.atc) {
                setTimeout(() => {
                    const normalizedMessage = normalizeATCText(nextStep.atc!, flightContext.value)

                    communicationLog.value.push({
                        timestamp: new Date(),
                        frequency: nextStep.frequency,
                        speaker: 'atc',
                        message: nextStep.atc!,
                        normalized: normalizedMessage,
                        step: nextStep.id
                    })
                }, 1500)
            }
        }
    }

    // Utility functions for flight data generation
    const generateGate = (airport: string): string => {
        const gates = ['A12', 'B15', 'C23', 'D8', 'E41', 'F18', 'G7', 'H33']
        return gates[Math.floor(Math.random() * gates.length)]
    }

    const generateRunway = (airport: string): string => {
        const runways = ['25L', '25R', '07L', '07R', '18', '36', '09', '27']
        return runways[Math.floor(Math.random() * runways.length)]
    }

    const generateSquawk = (): string => {
        return Math.floor(Math.random() * 8000 + 1000).toString()
    }

    const generateATIS = (): string => {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        return letters[Math.floor(Math.random() * letters.length)]
    }

    const generateSID = (route: string): string => {
        const sids = ['SULUS5S', 'TOBAK2E', 'MARUN7F', 'CINDY1A', 'HELEN4B']
        return sids[Math.floor(Math.random() * sids.length)]
    }

    const generateTaxiRoute = (): string[] => {
        const taxiways = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo']
        const count = Math.floor(Math.random() * 3) + 1
        return taxiways.slice(0, count)
    }

    return {
        currentStep: readonly(currentStep),
        flightContext: readonly(flightContext),
        communicationLog: readonly(communicationLog),
        initializeFlight,
        processUserTransmission,
        moveToStep,
        normalizeATCText
    }
}
