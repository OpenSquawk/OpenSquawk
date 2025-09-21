import { createError, defineEventHandler, getQuery } from 'h3'

const SIMBRIEF_TIMEOUT_MS = 10000

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const rawId = (query.userId ?? query.userid ?? '').toString().trim()
  if (!rawId) {
    throw createError({ statusCode: 400, statusMessage: 'userId required' })
  }

  const url = new URL('https://www.simbrief.com/api/xml.fetcher.php')
  url.searchParams.set('userid', rawId)
  url.searchParams.set('json', '1')

  let response: Response
  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort()
  }, SIMBRIEF_TIMEOUT_MS)
  try {
    response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'OpenSquawk Mission Planner'
      },
      cache: 'no-store',
      signal: controller.signal
    })
  } catch (error: any) {
    const aborted = error?.name === 'AbortError'
    console.error(
      `[simbrief] Request failed for user ${rawId}${aborted ? ' (timeout)' : ''}`,
      error
    )
    throw createError({
      statusCode: 502,
      statusMessage: aborted ? 'SimBrief request timed out' : 'SimBrief request failed',
      data: { message: aborted ? 'Request timed out' : error?.message || 'Network error' }
    })
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const payload = await response.text().catch(() => '')
    console.error(
      `[simbrief] Request rejected for user ${rawId}: ${response.status} ${response.statusText}`,
      payload
    )
    throw createError({
      statusCode: response.status,
      statusMessage: 'SimBrief request rejected',
      data: { message: payload || response.statusText }
    })
  }

  try {
    const data = await response.json()
    return { data }
  } catch (error: any) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Invalid SimBrief response',
      data: { message: error?.message || 'Failed to parse JSON' }
    })
  }
})
