// server/api/flightlab/ws.ts
import { defineWebSocketHandler } from 'h3'

interface FlightLabSession {
  code: string
  scenarioId: string
  currentPhaseId: string
  isPaused: boolean
  startedAt: number
  participantConnected: boolean
  instructorConnected: boolean
  history: Array<{ phaseId: string; buttonId: string; timestamp: number }>
  peers: Map<string, { role: 'instructor' | 'participant'; peer: any }>
}

const sessions = new Map<string, FlightLabSession>()

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No I,O,0,1 for readability
  let code = ''
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return sessions.has(code) ? generateCode() : code
}

function broadcastToSession(session: FlightLabSession, event: any, excludePeerId?: string) {
  for (const [id, p] of session.peers) {
    if (id !== excludePeerId) {
      try { p.peer.send(JSON.stringify(event)) } catch {}
    }
  }
}

function getSessionState(session: FlightLabSession) {
  return {
    sessionCode: session.code,
    scenarioId: session.scenarioId,
    currentPhaseId: session.currentPhaseId,
    isPaused: session.isPaused,
    startedAt: session.startedAt,
    participantConnected: session.participantConnected,
    history: session.history,
  }
}

export default defineWebSocketHandler({
  open(peer) {
    // Connection opened, wait for join/create message
  },

  message(peer, msg) {
    let data: any
    try {
      data = JSON.parse(typeof msg === 'string' ? msg : msg.toString())
    } catch {
      peer.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }))
      return
    }

    const peerId = (peer as any).id ?? String(peer)

    switch (data.type) {
      case 'create-session': {
        const code = generateCode()
        const session: FlightLabSession = {
          code,
          scenarioId: data.scenarioId ?? 'takeoff-eddf',
          currentPhaseId: 'welcome',
          isPaused: false,
          startedAt: Date.now(),
          participantConnected: false,
          instructorConnected: true,
          history: [],
          peers: new Map([[peerId, { role: 'instructor', peer }]]),
        }
        sessions.set(code, session)
        peer.send(JSON.stringify({ type: 'session-created', code, state: getSessionState(session) }))
        break
      }

      case 'join-session': {
        const session = sessions.get(data.code?.toUpperCase())
        if (!session) {
          peer.send(JSON.stringify({ type: 'error', message: 'Session nicht gefunden' }))
          return
        }
        const role = data.role ?? 'participant'
        session.peers.set(peerId, { role, peer })
        if (role === 'participant') session.participantConnected = true
        peer.send(JSON.stringify({ type: 'session-joined', role, state: getSessionState(session) }))
        broadcastToSession(session, { type: 'peer-joined', role }, peerId)
        break
      }

      case 'participant-action': {
        const session = findSessionByPeer(peerId)
        if (!session) return
        session.history.push({ phaseId: data.phaseId, buttonId: data.buttonId, timestamp: Date.now() })
        session.currentPhaseId = data.nextPhaseId
        broadcastToSession(session, {
          type: 'state-change',
          state: getSessionState(session),
          action: { buttonId: data.buttonId, phaseId: data.phaseId },
        })
        break
      }

      case 'instructor-command': {
        const session = findSessionByPeer(peerId)
        if (!session) return
        const peerInfo = session.peers.get(peerId)
        if (peerInfo?.role !== 'instructor') return

        switch (data.command) {
          case 'pause':
            session.isPaused = true
            break
          case 'resume':
            session.isPaused = false
            break
          case 'restart':
            session.currentPhaseId = 'welcome'
            session.isPaused = false
            session.history = []
            session.startedAt = Date.now()
            break
          case 'goto':
            if (data.targetPhaseId) session.currentPhaseId = data.targetPhaseId
            break
        }
        broadcastToSession(session, { type: 'state-change', state: getSessionState(session) })
        break
      }

      case 'instructor-message': {
        const session = findSessionByPeer(peerId)
        if (!session) return
        broadcastToSession(session, {
          type: 'instructor-message',
          text: data.text,
          withRadioEffect: data.withRadioEffect ?? true,
        }, peerId)
        break
      }
    }
  },

  close(peer) {
    const peerId = (peer as any).id ?? String(peer)
    for (const [code, session] of sessions) {
      const peerInfo = session.peers.get(peerId)
      if (peerInfo) {
        session.peers.delete(peerId)
        if (peerInfo.role === 'participant') session.participantConnected = false
        if (peerInfo.role === 'instructor') session.instructorConnected = false
        broadcastToSession(session, { type: 'peer-left', role: peerInfo.role })
        // Clean up empty sessions
        if (session.peers.size === 0) sessions.delete(code)
        break
      }
    }
  },
})

function findSessionByPeer(peerId: string): FlightLabSession | undefined {
  for (const session of sessions.values()) {
    if (session.peers.has(peerId)) return session
  }
}
