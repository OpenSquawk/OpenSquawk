export interface RadioSessionResponse {
    session_id: string
    flow_slug: string
    current_state: string
    variables: Record<string, any>
    flags: Record<string, boolean>
    expected_pilot_template: string | null
}

export interface RadioTransmitResponse {
    session_id: string
    next_state_id: string
    active_flow: string
    controller_say_template: string | null
    controller_say_rendered: string | null
    expected_pilot_template: string | null
    variables: Record<string, any>
    flags: Record<string, boolean>
    trace: Array<{ type: string; message: string }>
    fallback_used: boolean
    fallback_reason: string | null
    auto_advanced_states?: string[]
    /** True when a telemetry tick actually fired a transition (vs. an idle poll). */
    telemetry_fired?: boolean
    /** True when the full chain is done — show the completion screen. */
    session_complete?: boolean
    /** Per-field readback diagnostic for the pilot state just evaluated. */
    readback_report?: ReadbackFieldDetail[]
}

/**
 * Sim-agnostic telemetry contract. The bridge layer (MSFS SimConnect today,
 * X-Plane datarefs later) is normalised to exactly these keys before it reaches
 * the backend, so the decision engine only ever compares plain scalars. Keep
 * this in lock-step with `TelemetryParameter` in the Python backend (models.py).
 */
export interface NormalizedTelemetry {
    altitude_ft?: number          // feet MSL
    ias_kts?: number              // indicated airspeed, knots
    gs_kts?: number               // groundspeed, knots
    vs_fpm?: number               // vertical speed, feet/min (+climb, -descent)
    heading_deg?: number          // magnetic heading, 0..360
    on_ground?: boolean           // wheels on the ground
    distance_to_dest_nm?: number  // great-circle nm to destination airport
    distance_to_dep_nm?: number   // great-circle nm from departure airport
}

export interface ReadbackFieldDetail {
    field: string
    expected: string
    matched: boolean
    /** Which accepted spoken form matched ("two five right", "icao_phonetic"), or null. */
    matched_via: string | null
    /** All spoken forms that would have matched this field. */
    accepted_forms: string[]
    note?: string | null
}

export function useRadioBackend() {
    const config = useRuntimeConfig()

    function baseUrl(): string {
        return (config.public.radioBackendUrl as string) || 'http://127.0.0.1:8000'
    }

    async function createSession(
        flowSlug: string,
        variables?: Record<string, any>,
        noChain: boolean = false,
        airportIcao?: string,
        destinationIcao?: string,
        aircraftPosition?: { lat: number; lon: number } | null,
    ): Promise<RadioSessionResponse> {
        return await $fetch<RadioSessionResponse>(`${baseUrl()}/api/radio/session`, {
            method: 'POST',
            body: {
                flow_slug: flowSlug,
                variables: variables ?? null,
                no_chain: noChain,
                // Lets the backend compute the real OSM taxi route for taxi flows.
                airport_icao: airportIcao ?? null,
                destination_icao: destinationIcao ?? null,
                // Bridge position: taxi route starts at the real parking spot.
                aircraft_lat: aircraftPosition?.lat ?? null,
                aircraft_lon: aircraftPosition?.lon ?? null,
            },
        })
    }

    async function transmit(sessionId: string, pilotUtterance: string): Promise<RadioTransmitResponse> {
        return await $fetch<RadioTransmitResponse>(
            `${baseUrl()}/api/radio/session/${sessionId}/transmissions`,
            {
                method: 'POST',
                body: { pilot_utterance: pilotUtterance },
            },
        )
    }

    /**
     * Forward a normalised telemetry tick. The backend fires any telemetry-gated
     * transition whose threshold is met and returns the same shape as transmit;
     * idle ticks come back with `telemetry_fired: false` and the state unchanged.
     */
    async function sendTelemetry(
        sessionId: string,
        telemetry: NormalizedTelemetry,
    ): Promise<RadioTransmitResponse> {
        return await $fetch<RadioTransmitResponse>(
            `${baseUrl()}/api/radio/session/${sessionId}/telemetry`,
            {
                method: 'POST',
                body: { telemetry },
            },
        )
    }

    async function deleteSession(sessionId: string): Promise<void> {
        await $fetch(`${baseUrl()}/api/radio/session/${sessionId}`, { method: 'DELETE' })
    }

    async function fetchFlows(): Promise<any> {
        return await $fetch(`${baseUrl()}/api/decision-flows/runtime`)
    }

    return { createSession, transmit, sendTelemetry, deleteSession, fetchFlows }
}
