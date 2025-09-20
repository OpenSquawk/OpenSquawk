import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
    // Body einlesen
    const body = await readBody(event)

    // Alles in der Server-Konsole ausgeben
    console.log('MSFS Telemetry:', body)

    // Leere 204-Antwort zurückgeben
    event.node.res.statusCode = 204
})
