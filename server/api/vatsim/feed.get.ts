import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
    return await $fetch('https://data.vatsim.net/v3/vatsim-data.json')
})
