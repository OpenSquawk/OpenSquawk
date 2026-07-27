import {defineEventHandler, getRequestURL} from 'h3'
import {requireUserSession} from '../utils/auth'

export default defineEventHandler(async (event) => {
    const url = getRequestURL(event)
    if (!url.pathname.startsWith('/api/')) {
        return
    }
    if (url.pathname.startsWith('/api/service/')) {
        return
    }
    if (url.pathname.startsWith('/api/bridge/')) {
        return
    }
    if (url.pathname.startsWith('/api/copilot/')) {
        return
    }
    if (url.pathname.startsWith('/api/dev/')) {
        return
    }
    // Establishing a session cannot itself require one: /api/auth/refresh trades
    // an existing cookie for a bearer token, /api/auth/sso/* redeems a one-time
    // code, and /api/auth/logout must work even once the session is gone.
    if (url.pathname === '/api/auth/refresh' || url.pathname === '/api/auth/logout') {
        return
    }
    if (url.pathname.startsWith('/api/auth/sso/')) {
        return
    }
    if (event.node.req.method === 'OPTIONS') {
        return
    }
    await requireUserSession(event)
})

