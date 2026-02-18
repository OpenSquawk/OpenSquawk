import {createError, defineEventHandler, readBody} from 'h3'
import {BridgeToken} from '../../models/BridgeToken'
import {getBridgeTokenFromHeader} from '../../utils/bridge'
import {logBridgeEvent} from '../../utils/bridgeLog'
import {flightlabTelemetryStore} from '../../utils/flightlabTelemetry'
import type {FlightLabTelemetryState} from '../../../shared/data/flightlab/types'

type DomeLightMode = 'off' | 'white' | 'amber'

const DOME_LIGHT_WEBHOOK_FALLBACK_URL = 'https://home.io.faktorxmensch.com/api/webhook/lidl_stab_3modi_8492'
const DOME_LIGHT_ON_MODES: DomeLightMode[] = ['white', 'amber']

const nextDomeLightOnModeIndexByToken = new Map<string, number>()
const lastDomeLightStateByToken = new Map<string, boolean | null>()

/**
 * Receives telemetry data from an external bridge application.
 *
 * The bridge sends raw SimConnect-style fields which are mapped to the
 * FlightLabTelemetryState format before storage.
 *
 * POST /api/bridge/data
 * x-bridge-token: <bridge-token>
 */

/** Map raw bridge field names to FlightLabTelemetryState keys */
function mapBridgeTelemetry(raw: Record<string, any>): FlightLabTelemetryState {
    return {
        AIRSPEED_INDICATED: raw.ias_kt ?? raw.AIRSPEED_INDICATED ?? 0,
        AIRSPEED_TRUE: raw.tas_kt ?? raw.AIRSPEED_TRUE ?? 0,
        GROUND_VELOCITY: raw.groundspeed_kt ?? raw.GROUND_VELOCITY ?? 0,
        VERTICAL_SPEED: raw.vertical_speed_fpm ?? raw.VERTICAL_SPEED ?? 0,
        PLANE_ALTITUDE: raw.altitude_ft_indicated ?? raw.altitude_ft_true ?? raw.PLANE_ALTITUDE ?? 0,
        PLANE_PITCH_DEGREES: raw.pitch_deg ?? raw.PLANE_PITCH_DEGREES ?? 0,
        TURB_ENG_N1_1: raw.n1_pct ?? raw.TURB_ENG_N1_1 ?? 0,
        TURB_ENG_N1_2: raw.n1_pct_2 ?? raw.TURB_ENG_N1_2 ?? 0,
        ENG_COMBUSTION: !!(raw.eng_on ?? raw.ENG_COMBUSTION ?? false),
        SIM_ON_GROUND: !!(raw.on_ground ?? raw.SIM_ON_GROUND ?? false),
        GEAR_HANDLE_POSITION: !!(raw.gear_handle ?? raw.GEAR_HANDLE_POSITION ?? false),
        FLAPS_HANDLE_INDEX: raw.flaps_index ?? raw.FLAPS_HANDLE_INDEX ?? 0,
        BRAKE_PARKING_POSITION: !!(raw.parking_brake ?? raw.BRAKE_PARKING_POSITION ?? false),
        AUTOPILOT_MASTER: !!(raw.autopilot_master ?? raw.AUTOPILOT_MASTER ?? false),
        TRANSPONDER_CODE: raw.transponder_code ?? raw.TRANSPONDER_CODE ?? 0,
        ADF_ACTIVE_FREQUENCY: raw.adf_active_freq ?? raw.ADF_ACTIVE_FREQUENCY ?? 0,
        ADF_STANDBY_FREQUENCY: raw.adf_standby_freq_hz ?? raw.ADF_STANDBY_FREQUENCY ?? 0,
    }
}

function resolveDomeLightValue(raw: Record<string, any>): boolean | null {
    const value = raw.dome_light ?? raw.DOME_LIGHT

    if (typeof value === 'boolean') return value
    if (typeof value === 'number') {
        if (value === 1) return true
        if (value === 0) return false
    }
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase()
        if (normalized === 'true' || normalized === '1') return true
        if (normalized === 'false' || normalized === '0') return false
    }

    return null
}

async function forwardDomeLightToWebhook(raw: Record<string, any>, webhookUrl: string, stateKey: string) {
    const domeLight = resolveDomeLightValue(raw)
    const lastDomeLightState = lastDomeLightStateByToken.get(stateKey) ?? null

    if (domeLight === null) return
    if (lastDomeLightState === domeLight) return

    let nextDomeLightOnModeIndex = nextDomeLightOnModeIndexByToken.get(stateKey) ?? 0

    const mode: DomeLightMode = domeLight
        ? DOME_LIGHT_ON_MODES[nextDomeLightOnModeIndex % DOME_LIGHT_ON_MODES.length]!
        : 'off'

    if (domeLight) {
        nextDomeLightOnModeIndex = (nextDomeLightOnModeIndex + 1) % DOME_LIGHT_ON_MODES.length
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({mode}),
        })

        if (!response.ok) {
            const responseBody = await response.text().catch(() => '')
            console.error(
                `\x1b[31m[bridge:dome]\x1b[0m webhook failed status=\x1b[91m${response.status}\x1b[0m mode=\x1b[93m${mode}\x1b[0m body=${responseBody.slice(0, 180)}`,
            )
        } else {
            console.info(
                `\x1b[36m[bridge:dome]\x1b[0m dome_light=\x1b[92m${String(domeLight)}\x1b[0m mode=\x1b[93m${mode}\x1b[0m`,
            )
        }
    } catch (error) {
        console.error(
            `\x1b[31m[bridge:dome]\x1b[0m webhook request failed mode=\x1b[93m${mode}\x1b[0m`,
            error,
        )
    } finally {
        lastDomeLightStateByToken.set(stateKey, domeLight)
        if (domeLight) {
            nextDomeLightOnModeIndexByToken.set(stateKey, nextDomeLightOnModeIndex)
        }
    }
}

export default defineEventHandler(async (event) => {
    const bridgeToken = getBridgeTokenFromHeader(event)
    if (!bridgeToken) {
        throw createError({statusCode: 401, statusMessage: 'x-bridge-token header fehlt oder ist ungültig.'})
    }

    const bridgeDocument = await BridgeToken.findOne({token: bridgeToken}).select('user')
    const userId = bridgeDocument?.user?.toString() ?? null
    if (!userId) {
        throw createError({statusCode: 401, statusMessage: 'Bridge-Token ist nicht mit einem Nutzer verknüpft.'})
    }

    const body = await readBody(event)
    const telemetry = body && typeof body === 'object' ? (body as Record<string, any>) : {}
    const telemetryKeys = Object.keys(telemetry)
    console.info(`\x1b[35m[bridge:data]\x1b[0m token=\x1b[96m${bridgeToken.slice(0, 6)}...\x1b[0m user=\x1b[92m${userId}\x1b[0m telemetryKeys=\x1b[92m${telemetryKeys.length}\x1b[0m`)
    // console.table( telemetryKeys.reduce((acc, key) => { acc[key] = telemetry[key]; return acc }, {} as Record<string, any>) )

    const runtimeConfig = useRuntimeConfig()
    const domeLightWebhookUrl = String(runtimeConfig.domeLightWebhookUrl || '').trim() || DOME_LIGHT_WEBHOOK_FALLBACK_URL
    await forwardDomeLightToWebhook(telemetry, domeLightWebhookUrl, bridgeToken)

    // Map raw bridge fields to FlightLab format and store
    const mapped = mapBridgeTelemetry(telemetry)
    flightlabTelemetryStore.update(userId, mapped)

    logBridgeEvent(bridgeToken, {
        endpoint: '/api/bridge/data',
        method: 'POST',
        statusCode: 200,
        color: '#d946ef',
        summary: `Telemetry ${telemetryKeys.length} keys — IAS ${mapped.AIRSPEED_INDICATED.toFixed(0)}kt ALT ${mapped.PLANE_ALTITUDE.toFixed(0)}ft`,
        data: mapped as unknown as Record<string, unknown>,
    })

    return {
        // n1_pct: (mapped.TURB_ENG_N1_1 ?? 0) + 10,
        // n1_pct_2: (mapped.TURB_ENG_N1_2 ?? 0) + 10,
        // gear und parking break togglen
        // gear_handle: !mapped.GEAR_HANDLE_POSITION,
        parking_brake: !mapped.BRAKE_PARKING_POSITION,
    }
})
