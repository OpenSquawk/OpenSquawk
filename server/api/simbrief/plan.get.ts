import {defineEventHandler, getQuery, createError} from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const userId = String(query.userId || query.userid || query.pilotId || '').trim()
  if (!userId) {
    throw createError({statusCode: 400, statusMessage: 'userId required'})
  }

  const endpoint = `https://www.simbrief.com/api/xml.fetcher.php?userid=${encodeURIComponent(userId)}&json=1`

  try {
    return await $fetch(endpoint, {
      method: 'GET',
      headers: {
        'User-Agent': 'OpenSquawk SimBrief Proxy'
      }
    })
  } catch (error: any) {
    const status = error?.response?.status ?? 502
    const statusMessage = error?.response?.statusText || 'Failed to fetch SimBrief plan'
    throw createError({
      statusCode: status,
      statusMessage,
      data: error?.response?._data ?? {message: error?.message || 'Unknown error'}
    })
  }
})
