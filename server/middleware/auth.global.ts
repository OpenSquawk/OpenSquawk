import { defineEventHandler, getRequestURL } from 'h3'
import { requireUserSession } from '../utils/auth'

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
  if (event.node.req.method === 'OPTIONS') {
    return
  }
  await requireUserSession(event)
})

