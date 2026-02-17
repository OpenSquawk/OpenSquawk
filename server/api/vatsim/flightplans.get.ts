import { createError, defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const rawCid = Array.isArray(query.cid) ? query.cid[0] : query.cid
    if (rawCid === undefined || rawCid === null) {
        throw createError({ statusCode: 400, statusMessage: 'cid required' })
    }
    const cid = String(rawCid).trim()
    if (!cid) {
        throw createError({ statusCode: 400, statusMessage: 'cid required' })
    }

    const url = `https://api.vatsim.net/v2/members/${encodeURIComponent(cid)}/flightplans`
    const fetcher = (globalThis as any).$fetch as (target: string, options?: Record<string, unknown>) => Promise<unknown>
    return await fetcher(url, { method: 'GET' })
})
