import {defineEventHandler, getRouterParam} from 'h3'

export default defineEventHandler(async (event) => {
    const {cid} = getQuery(event)
    if (!cid) throw createError({statusCode: 400, statusMessage: 'cid required'})

    const url = `https://api.vatsim.net/v2/members/${encodeURIComponent(cid)}/flightplans`
    return await $fetch(url, {method: 'GET'})
})
