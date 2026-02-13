// shared/composables/flightlab/useFlightLabSync.ts
import { ref } from 'vue'
import type { FlightLabRole, FlightLabSessionState } from '../../data/flightlab/types'

export function useFlightLabSync() {
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const role = ref<FlightLabRole | null>(null)
  const sessionCode = ref<string | null>(null)
  const remoteState = ref<FlightLabSessionState | null>(null)

  const callbacks = {
    onStateChange: [] as Array<(state: FlightLabSessionState, action?: any) => void>,
    onInstructorMessage: [] as Array<(text: string, withRadioEffect: boolean) => void>,
    onPeerJoined: [] as Array<(peerRole: FlightLabRole) => void>,
    onPeerLeft: [] as Array<(peerRole: FlightLabRole) => void>,
    onError: [] as Array<(msg: string) => void>,
  }

  function connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const url = `${proto}//${window.location.host}/api/flightlab/ws`
      ws.value = new WebSocket(url)

      ws.value.onopen = () => {
        isConnected.value = true
        resolve()
      }

      ws.value.onclose = () => {
        isConnected.value = false
        ws.value = null
      }

      ws.value.onerror = () => {
        reject(new Error('WebSocket connection failed'))
      }

      ws.value.onmessage = (event) => {
        let data: any
        try { data = JSON.parse(event.data) } catch { return }
        handleMessage(data)
      }
    })
  }

  function handleMessage(data: any) {
    switch (data.type) {
      case 'session-created':
        sessionCode.value = data.code
        role.value = 'instructor'
        remoteState.value = data.state
        break
      case 'session-joined':
        role.value = data.role
        remoteState.value = data.state
        sessionCode.value = data.state.sessionCode
        break
      case 'state-change':
        remoteState.value = data.state
        callbacks.onStateChange.forEach(cb => cb(data.state, data.action))
        break
      case 'instructor-message':
        callbacks.onInstructorMessage.forEach(cb => cb(data.text, data.withRadioEffect))
        break
      case 'peer-joined':
        callbacks.onPeerJoined.forEach(cb => cb(data.role))
        break
      case 'peer-left':
        callbacks.onPeerLeft.forEach(cb => cb(data.role))
        break
      case 'error':
        callbacks.onError.forEach(cb => cb(data.message))
        break
    }
  }

  function send(data: any) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(data))
    }
  }

  async function createSession(scenarioId = 'takeoff-eddf') {
    await connect()
    send({ type: 'create-session', scenarioId })
  }

  async function joinSession(code: string, joinRole: FlightLabRole = 'participant') {
    await connect()
    send({ type: 'join-session', code: code.toUpperCase(), role: joinRole })
  }

  function sendParticipantAction(phaseId: string, buttonId: string, nextPhaseId: string) {
    send({ type: 'participant-action', phaseId, buttonId, nextPhaseId })
  }

  function sendInstructorCommand(command: string, targetPhaseId?: string) {
    send({ type: 'instructor-command', command, targetPhaseId })
  }

  function sendInstructorMessage(text: string, withRadioEffect = true) {
    send({ type: 'instructor-message', text, withRadioEffect })
  }

  function disconnect() {
    ws.value?.close()
    ws.value = null
    isConnected.value = false
    role.value = null
    sessionCode.value = null
    remoteState.value = null
  }

  function onStateChange(cb: (state: FlightLabSessionState, action?: any) => void) { callbacks.onStateChange.push(cb) }
  function onInstructorMessage(cb: (text: string, withRadioEffect: boolean) => void) { callbacks.onInstructorMessage.push(cb) }
  function onPeerJoined(cb: (role: FlightLabRole) => void) { callbacks.onPeerJoined.push(cb) }
  function onPeerLeft(cb: (role: FlightLabRole) => void) { callbacks.onPeerLeft.push(cb) }
  function onError(cb: (msg: string) => void) { callbacks.onError.push(cb) }

  return {
    isConnected,
    role,
    sessionCode,
    remoteState,
    createSession,
    joinSession,
    sendParticipantAction,
    sendInstructorCommand,
    sendInstructorMessage,
    disconnect,
    onStateChange,
    onInstructorMessage,
    onPeerJoined,
    onPeerLeft,
    onError,
  }
}
