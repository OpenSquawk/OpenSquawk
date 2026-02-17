import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
    const fetcher = (globalThis as any).$fetch as (url: string, options?: Record<string, unknown>) => Promise<unknown>
    return await fetcher('https://data.vatsim.net/v3/vatsim-data.json')
})
