import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
    const { id } = getQuery(event)
    if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
    const url = `https://metar.vatsim.net/metar.php?id=${encodeURIComponent(String(id))}`
    const text = await $fetch<string>(url, { responseType: 'text' })
    return text
})
