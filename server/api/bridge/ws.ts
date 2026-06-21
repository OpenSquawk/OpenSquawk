// server/api/bridge/ws.ts
//
// Low-latency push channel for push-to-talk. A /pm tab opens this socket and
// sends { type: 'subscribe', token } using its `?token=` bridge link. The
// Bridge POSTs key edges to /api/bridge/ptt, which drives pttBus; we relay each
// edge to every peer subscribed to that token.
import { defineWebSocketHandler } from 'h3'
import { normalizeBridgeToken } from '../../utils/bridge'
import { pttBus } from '../../utils/pttBus'

// token → set of connected /pm peers
const subscribers = new Map<string, Set<any>>()
// peerId → token, so close() can clean up without scanning every set
const peerTokens = new Map<string, string>()

function peerId(peer: any): string {
  return peer?.id ?? String(peer)
}

// Relay every PTT edge to the peers listening on that token.
pttBus.subscribe((token, state) => {
  const peers = subscribers.get(token)
  if (!peers) return
  const payload = JSON.stringify({ type: 'ptt', state })
  for (const peer of peers) {
    try { peer.send(payload) } catch {}
  }
})

function unsubscribe(peer: any) {
  const id = peerId(peer)
  const token = peerTokens.get(id)
  if (!token) return
  peerTokens.delete(id)
  const peers = subscribers.get(token)
  if (!peers) return
  peers.delete(peer)
  if (peers.size === 0) subscribers.delete(token)
}

export default defineWebSocketHandler({
  message(peer, msg) {
    let data: any
    try {
      data = JSON.parse(typeof msg === 'string' ? msg : msg.toString())
    } catch {
      peer.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }))
      return
    }

    if (data.type === 'subscribe') {
      const token = normalizeBridgeToken(data.token)
      if (!token) {
        peer.send(JSON.stringify({ type: 'error', message: 'Invalid token' }))
        return
      }
      // A peer only ever listens to one token; drop any previous binding.
      unsubscribe(peer)
      let peers = subscribers.get(token)
      if (!peers) {
        peers = new Set()
        subscribers.set(token, peers)
      }
      peers.add(peer)
      peerTokens.set(peerId(peer), token)
      peer.send(JSON.stringify({ type: 'subscribed' }))
    }
  },

  close(peer) {
    unsubscribe(peer)
  },

  error(peer) {
    unsubscribe(peer)
  },
})
