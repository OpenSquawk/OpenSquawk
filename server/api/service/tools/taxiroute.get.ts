import { defineEventHandler, getQuery } from 'h3'
import https from 'node:https'

export default defineEventHandler(async (event) => {
    const q = getQuery(event)
    const oLat = Number(q.origin_lat)
    const oLon = Number(q.origin_lng)
    const dLat = Number(q.dest_lat)
    const dLon = Number(q.dest_lng)
    const radius = Number(q.radius ?? 2000)

    const endpoint = 'https://overpass-api.de/api/interpreter'
    const overpassQ = `
[out:json][timeout:90];
(
  way["aeroway"="taxiway"](around:${radius},${oLat},${oLon});
  way["aeroway"="taxiway"](around:${radius},${dLat},${dLon});
);
(._;>;);
out body;
  `

    function fetchOverpass(query: string) {
        return new Promise<any>((resolve, reject) => {
            const req = https.request(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }, res => {
                let data = ''
                res.on('data', d => (data += d))
                res.on('end', () => {
                    if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`))
                    resolve(JSON.parse(data))
                })
            })
            req.on('error', reject)
            req.write('data=' + encodeURIComponent(query))
            req.end()
        })
    }

    function haversine(a: any, b: any) {
        const R = 6371000
        const toRad = (d: number) => d * Math.PI / 180
        const dLat = toRad(b.lat - a.lat)
        const dLon = toRad(b.lon - a.lon)
        const la1 = toRad(a.lat), la2 = toRad(b.lat)
        const s = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2
        return 2 * R * Math.asin(Math.sqrt(s))
    }

    function buildGraph(osm: any) {
        const nodes = new Map<number, any>()
        const edges: any[] = []

        for (const el of osm.elements) {
            if (el.type === 'node') nodes.set(el.id, { id: el.id, lat: el.lat, lon: el.lon })
        }
        for (const w of osm.elements.filter((e: any) => e.type === 'way')) {
            const name = w.tags?.name || w.tags?.ref || null
            for (let i = 0; i < w.nodes.length - 1; i++) {
                const a = nodes.get(w.nodes[i])
                const b = nodes.get(w.nodes[i + 1])
                if (!a || !b) continue
                const d = haversine(a, b)
                edges.push({ u: a.id, v: b.id, w: d, way_id: w.id, name })
                edges.push({ u: b.id, v: a.id, w: d, way_id: w.id, name })
            }
        }
        return { nodes: [...nodes.values()], edges }
    }

    const osm = await fetchOverpass(overpassQ)
    const graph = buildGraph(osm)

    return {
        origin: { lat: oLat, lon: oLon },
        dest: { lat: dLat, lon: dLon },
        graph
    }
})
