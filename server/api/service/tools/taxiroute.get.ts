import { defineEventHandler, getQuery } from 'h3'
import https from 'node:https'

import { fetchAirportFeatures, resolveFeature, toGeocodePayload } from './airportGeocode'

function parseCoordinate(value: unknown) {
  if (value === undefined || value === null) return null
  if (typeof value === 'string' && value.trim() === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

export default defineEventHandler(async (event) => {
    const q = getQuery(event)

    const airport = typeof q.airport === 'string' ? q.airport.trim().toUpperCase() : ''

    const originName = typeof q.origin_name === 'string' ? q.origin_name.trim() : ''
    const destName = typeof q.dest_name === 'string' ? q.dest_name.trim() : ''

    let oLat: number | null = parseCoordinate(q.origin_lat)
    let oLon: number | null = parseCoordinate(q.origin_lng ?? q.origin_lon)
    let dLat: number | null = parseCoordinate(q.dest_lat)
    let dLon: number | null = parseCoordinate(q.dest_lng ?? q.dest_lon)

    const radius = parseCoordinate(q.radius) ?? 5000

    const originCoordsProvided = oLat !== null && oLon !== null
    const destCoordsProvided = dLat !== null && dLon !== null

    if (!originCoordsProvided && !originName) {
        return { error: 'missing_origin', details: 'provide origin coordinates or name', airport: airport || null }
    }

    if (!destCoordsProvided && !destName) {
        return { error: 'missing_destination', details: 'provide destination coordinates or name', airport: airport || null }
    }

    const requiresGeocode = (!originCoordsProvided && !!originName) || (!destCoordsProvided && !!destName)

    let features: Awaited<ReturnType<typeof fetchAirportFeatures>> | null = null

    const ensureFeatures = async () => {
        if (!features) {
            if (!airport) {
                throw Object.assign(new Error('missing airport for geocode'), { code: 'missing_airport' })
            }
            features = await fetchAirportFeatures(airport)
        }
        return features
    }

    let originMatch: ReturnType<typeof resolveFeature> = null
    let destMatch: ReturnType<typeof resolveFeature> = null

    try {
        if (requiresGeocode) {
            await ensureFeatures()
        }
    } catch (error) {
        const err = error as Error & { code?: string }
        if (err.code === 'missing_airport') {
            return { error: 'missing_airport', details: 'airport is required when using feature names' }
        }
        return { error: 'overpass_error', airport, details: err.message }
    }

    if (!originCoordsProvided && originName) {
        const match = resolveFeature(features!, { name: originName })
        if (!match) {
            return { error: 'origin_not_found', airport, origin: { name: originName } }
        }
        originMatch = match
        oLat = match.feature.lat
        oLon = match.feature.lon
    }

    if (!destCoordsProvided && destName) {
        const match = resolveFeature(features!, { name: destName })
        if (!match) {
            return { error: 'dest_not_found', airport, dest: { name: destName } }
        }
        destMatch = match
        dLat = match.feature.lat
        dLon = match.feature.lon
    }

    if (originCoordsProvided && originName && airport) {
        try {
            const match = resolveFeature(features ?? (await ensureFeatures()), { name: originName })
            if (match) originMatch = match
        } catch {
            // ignore lookup failures when coordinates are already provided
        }
    }

    if (destCoordsProvided && destName && airport) {
        try {
            const match = resolveFeature(features ?? (await ensureFeatures()), { name: destName })
            if (match) destMatch = match
        } catch {
            // ignore lookup failures when coordinates are already provided
        }
    }

    if (oLat === null || oLon === null || dLat === null || dLon === null) {
        return {
            error: 'missing_coordinates',
            airport: airport || null,
            origin: { lat: oLat, lon: oLon, name: originName || null },
            dest: { lat: dLat, lon: dLon, name: destName || null }
        }
    }

    const oLatNum = oLat as number
    const oLonNum = oLon as number
    const dLatNum = dLat as number
    const dLonNum = dLon as number

    const originQuerySummary = {
        name: originName || null,
        lat: originCoordsProvided ? oLatNum : null,
        lon: originCoordsProvided ? oLonNum : null
    }

    const destQuerySummary = {
        name: destName || null,
        lat: destCoordsProvided ? dLatNum : null,
        lon: destCoordsProvided ? dLonNum : null
    }

    const originFeaturePayload = originMatch ? toGeocodePayload(originMatch) : null
    const destFeaturePayload = destMatch ? toGeocodePayload(destMatch) : null

    const endpoint = 'https://overpass-api.de/api/interpreter'
    const overpassQ = `
[out:json][timeout:90];
(
  way["aeroway"="taxiway"](around:${radius},${oLatNum},${oLonNum});
  way["aeroway"="taxiway"](around:${radius},${dLatNum},${dLonNum});
);
(._;>;);
out body;
  `

    // --- utils ---
    const toRad = (d:number)=>d*Math.PI/180
    function haversine(a:{lat:number,lon:number}, b:{lat:number,lon:number}){
        const R=6371000
        const dLat=toRad(b.lat-a.lat), dLon=toRad(b.lon-a.lon)
        const la1=toRad(a.lat), la2=toRad(b.lat)
        const s=Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2
        return 2*R*Math.asin(Math.sqrt(s))
    }
    function fetchOverpass(query: string) {
        return new Promise<any>((resolve, reject) => {
            const req = https.request(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }, res => {
                let data = ''
                res.on('data', d => (data += d))
                res.on('end', () => {
                    if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0,200)}`))
                    resolve(JSON.parse(data))
                })
            })
            req.on('error', reject)
            req.write('data=' + encodeURIComponent(query))
            req.end()
        })
    }

    // --- build graph from OSM ---
    const osm = await fetchOverpass(overpassQ)

    const nodes = new Map<number, {id:number,lat:number,lon:number}>()
    const ways: Array<any> = []
    for (const el of osm.elements) {
        if (el.type === 'node') nodes.set(el.id, { id: el.id, lat: el.lat, lon: el.lon })
        else if (el.type === 'way') ways.push(el)
    }

    type Edge = { u:number, v:number, w:number, way_id:number, name:string|null }
    const edges: Edge[] = []
    for (const w of ways) {
        const name: string | null = w.tags?.name || w.tags?.ref || null
        for (let i=0;i<w.nodes.length-1;i++){
            const a = nodes.get(w.nodes[i])
            const b = nodes.get(w.nodes[i+1])
            if (!a || !b) continue
            const dist = haversine(a,b)
            edges.push({ u:a.id, v:b.id, w:dist, way_id:w.id, name })
            edges.push({ u:b.id, v:a.id, w:dist, way_id:w.id, name })
        }
    }

    // --- adjacency + quick edge lookup ---
    const adj = new Map<number, Array<{to:number, w:number}>>()
    const edgeName = new Map<string, {name:string|null, way_id:number}>()
    for (const e of edges){
        if (!adj.has(e.u)) adj.set(e.u, [])
        adj.get(e.u)!.push({ to:e.v, w:e.w })
        edgeName.set(`${e.u}->${e.v}`, { name:e.name, way_id:e.way_id })
    }

    // --- nearest node to a coordinate ---
    function nearestNode(lat:number, lon:number){
        let bestId:number|undefined, bestD=Infinity
        for (const n of nodes.values()){
            const d = haversine({lat,lon},{lat:n.lat,lon:n.lon})
            if (d<bestD){ bestD=d; bestId=n.id }
        }
        if (bestId===undefined) return null
        const nn = nodes.get(bestId)!
        return { node_id: bestId, lat: nn.lat, lon: nn.lon, distance_m: bestD }
    }

    const startAttach = nearestNode(oLatNum,oLonNum)
    const endAttach   = nearestNode(dLatNum,dLonNum)

    if (!startAttach || !endAttach) {
        return {
            error: 'no_nodes_in_area',
            airport: airport || null,
            origin: { lat:oLatNum, lon:oLonNum, query: originQuerySummary, feature: originFeaturePayload },
            dest:   { lat:dLatNum, lon:dLonNum, query: destQuerySummary, feature: destFeaturePayload }
        }
    }

    // --- dijkstra shortest path (meters) ---
    function dijkstra(src:number, dst:number){
        const dist = new Map<number, number>()
        const prev = new Map<number, number>()
        const visited = new Set<number>()
        const pq: Array<{id:number, d:number}> = []

        const push = (id:number, d:number)=>{
            pq.push({id,d})
            // simple binary heap-free: insertion sort-ish
            pq.sort((a,b)=>a.d-b.d)
        }

        for (const id of nodes.keys()) dist.set(id, Infinity)
        dist.set(src, 0); push(src,0)

        while (pq.length){
            const {id:u} = pq.shift()!
            if (visited.has(u)) continue
            visited.add(u)
            if (u===dst) break
            const lst = adj.get(u); if (!lst) continue
            for (const {to:v, w} of lst){
                const alt = dist.get(u)! + w
                if (alt < dist.get(v)!){
                    dist.set(v, alt)
                    prev.set(v, u)
                    push(v, alt)
                }
            }
        }

        if (!prev.has(dst) && src!==dst) return null
        const path:number[] = []
        let u = dst
        path.push(u)
        while (u !== src){
            const p = prev.get(u)
            if (p===undefined){ break }
            u = p
            path.push(u)
        }
        path.reverse()
        const total_m = dist.get(dst)!
        return { path, total_m }
    }

    const sp = dijkstra(startAttach.node_id, endAttach.node_id)
    if (!sp) {
        return {
            airport: airport || null,
            origin: { lat:oLatNum, lon:oLonNum, query: originQuerySummary, feature: originFeaturePayload },
            dest:   { lat:dLatNum, lon:dLonNum, query: destQuerySummary, feature: destFeaturePayload },
            start_attach: startAttach,
            end_attach:   endAttach,
            route: null,
            names: [],
            names_collapsed: []
        }
    }

    // names along path (drop null/unnamed); keep both raw sequence and collapsed variant
    const namesRaw: string[] = []
    const hasDigits = (value: string) => /\d/.test(value)
    for (let i=0;i<sp.path.length-1;i++){
        const u = sp.path[i], v = sp.path[i+1]
        const meta = edgeName.get(`${u}->${v}`) || edgeName.get(`${v}->${u}`)
        const nm = meta?.name?.trim()
        if (!nm) continue

        if (namesRaw.length === 0 || namesRaw[namesRaw.length-1] !== nm) namesRaw.push(nm)
    }

    const namesCollapsed: string[] = []
    for (const nm of namesRaw) {
        const last = namesCollapsed[namesCollapsed.length - 1]
        if (last === nm) continue

        const lastNormalized = last?.replace(/\s+/g, '').match(/^([A-Za-z]+)/)?.[1]?.toUpperCase()
        const currentNormalized = nm.replace(/\s+/g, '').match(/^([A-Za-z]+)/)?.[1]?.toUpperCase()
        const lastHasDigits = last ? hasDigits(last) : false

        if (
            lastNormalized &&
            currentNormalized &&
            lastNormalized === currentNormalized &&
            lastHasDigits &&
            hasDigits(nm)
        ) {
            continue
        }

        namesCollapsed.push(nm)
    }

    return {
        airport: airport || null,
        origin: { lat:oLatNum, lon:oLonNum, query: originQuerySummary, feature: originFeaturePayload },
        dest:   { lat:dLatNum, lon:dLonNum, query: destQuerySummary, feature: destFeaturePayload },
        start_attach: startAttach,
        end_attach:   endAttach,
        route: {
            node_ids: sp.path,
            total_distance_m: sp.total_m
        },
        names: namesRaw,
        names_collapsed: namesCollapsed
    }
})
