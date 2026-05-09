export interface RadioSessionResponse {
    session_id: string
    flow_slug: string
    current_state: string
    variables: Record<string, any>
    flags: Record<string, boolean>
}

export interface RadioTransmitResponse {
    session_id: string
    next_state_id: string
    controller_say_template: string | null
    controller_say_rendered: string | null
    expected_pilot_template: string | null
    variables: Record<string, any>
    flags: Record<string, boolean>
    trace: Array<{ type: string; message: string }>
    fallback_used: boolean
    fallback_reason: string | null
    auto_advanced_states?: string[]
}

export function useRadioBackend() {
    const config = useRuntimeConfig()

    function baseUrl(): string {
        return (config.public.radioBackendUrl as string) || 'http://127.0.0.1:8000'
    }

    async function createSession(flowSlug: string): Promise<RadioSessionResponse> {
        return await $fetch<RadioSessionResponse>(`${baseUrl()}/api/radio/session`, {
            method: 'POST',
            body: { flow_slug: flowSlug },
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

    async function deleteSession(sessionId: string): Promise<void> {
        await $fetch(`${baseUrl()}/api/radio/session/${sessionId}`, { method: 'DELETE' })
    }

    async function fetchFlows(): Promise<any> {
        return await $fetch(`${baseUrl()}/api/decision-flows/runtime`)
    }

    return { createSession, transmit, deleteSession, fetchFlows }
}
