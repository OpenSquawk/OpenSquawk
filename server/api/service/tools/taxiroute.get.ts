import { defineEventHandler, getQuery } from 'h3'
import https from 'node:https'

export default defineEventHandler(async (event) => {
    const q = getQuery(event)
    const oLat = Number(q.origin_lat), oLon = Number(q.origin_lng)
    const dLat = Number(q.dest_lat),  dLon = Number(q.dest_lng)
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

    const startAttach = nearestNode(oLat,oLon)
    const endAttach   = nearestNode(dLat,dLon)

    if (!startAttach || !endAttach) {
        return { error: 'no_nodes_in_area', origin:{lat:oLat,lon:oLon}, dest:{lat:dLat,lon:dLon} }
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
            origin: { lat:oLat, lon:oLon },
            dest:   { lat:dLat, lon:dLon },
            start_attach: startAttach,
            end_attach:   endAttach,
            route: null,
            names: [],
            names_collapsed: []
        }
    }

    // names along path (drop null/unnamed); keep both raw sequence and collapsed variant
    const normalizeName = (value: string) => {
        const trimmed = value.trim()
        if (!trimmed) return null
        const match = trimmed.match(/^([A-Za-z]+)/)
        return (match ? match[1] : trimmed).toUpperCase()
    }
    const isPlainLetter = (value: string) => /^[A-Za-z]+$/.test(value.trim())

    const namesRaw: string[] = []
    const namesCollapsed: string[] = []
    const hasDigits = (value: string) => /\d/.test(value)
    for (let i=0;i<sp.path.length-1;i++){
        const u = sp.path[i], v = sp.path[i+1]
        const meta = edgeName.get(`${u}->${v}`) || edgeName.get(`${v}->${u}`)
        const nm = meta?.name?.trim()
        if (!nm) continue

        if (namesRaw.length === 0 || namesRaw[namesRaw.length-1] !== nm) namesRaw.push(nm)

        const normalized = normalizeName(nm)
        if (!normalized) continue

        const last = namesCollapsed[namesCollapsed.length-1]
        if (!last){
            namesCollapsed.push(nm)
            continue
        }

        const lastNormalized = normalizeName(last)
        if (lastNormalized === normalized){
            const lastHasDigits = hasDigits(last)
            const currentHasDigits = hasDigits(nm)

            if (currentHasDigits && lastHasDigits) {
                continue
            }

            if (isPlainLetter(nm) && !isPlainLetter(last)) namesCollapsed[namesCollapsed.length-1] = nm
            continue
        }

        namesCollapsed.push(nm)
    }

    return {
        origin: { lat:oLat, lon:oLon },
        dest:   { lat:dLat, lon:dLon },
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
