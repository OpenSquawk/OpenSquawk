import { defineEventHandler, getQuery } from 'h3'
import https from 'node:https'

type LatLon = { lat:number; lon:number }
type NodeRec = { id:number; lat:number; lon:number }
type WayRec  = { id:number; nodes:number[]; tags?:Record<string,string> }

const endpoint = 'https://overpass-api.de/api/interpreter'
const toRad = (d:number)=>d*Math.PI/180
const haversine = (a:LatLon,b:LatLon)=>{
  const R=6371000,dLat=toRad(b.lat-a.lat),dLon=toRad(b.lon-a.lon),la1=toRad(a.lat),la2=toRad(b.lat)
  const s=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2
  return 2*R*Math.asin(Math.sqrt(s))
}

function parseTarget(s:string){
  const t=s?.trim(); if(!t) return null as const
  if(t.startsWith('coord:'))     return {kind:'coord',     value:t.slice(6).trim()} as const
  if(t.startsWith('threshold:')) return {kind:'threshold', value:t.slice(10).trim()} as const
  if(t.startsWith('gate:'))      return {kind:'gate',      value:t.slice(5).trim()} as const
  if(t.startsWith('stand:'))     return {kind:'stand',     value:t.slice(6).trim()} as const
  return null as const
}

function selectorFor(kind:'threshold'|'gate'|'stand', ref:string, alias:string){
  if(kind==='gate')  return `node(area.a)["aeroway"="gate"]["ref"="${ref}"]->.${alias};`
  if(kind==='stand') return `node(area.a)["aeroway"="parking_position"]["ref"="${ref}"]->.${alias};`
  // Threshold robust (versch. Tagging-Schemata)
  return `
  (
    node(area.a)["runway"="threshold"]["ref"="${ref}"];
    node(area.a)["aeroway"="runway"]["runway"="threshold"]["ref"="${ref}"];
    node(area.a)["aeroway"="threshold"]["ref"="${ref}"];
  )->.${alias};`
}

function buildOverpassQuery(airport:string, o:any, d:any, includeRunways=true){
  const net = includeRunways ? '^(taxiway|runway)$' : '^taxiway$'
  const selO = o && o.kind!=='coord' ? selectorFor(o.kind, o.value, 'OSEL') : ''
  const selD = d && d.kind!=='coord' ? selectorFor(d.kind, d.value, 'DSEL') : ''
  return `
[out:json][timeout:90];
// Aerodrome → Area
rel["aeroway"="aerodrome"]["icao"="${airport}"];
map_to_area->.a;

// Netz laden
way(area.a)["aeroway"~"${net}"]->.w;
( .w; >; ); out body;

// Features laden (optional)
${selO}
${selD}
${(selO||selD) ? '( .OSEL; .DSEL; ); out body;' : ''}
`.trim()
}

function fetchOverpass(query:string){
  return new Promise<any>((resolve, reject) => {
    const req = https.request(endpoint, {
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'}
    }, res => {
      let data=''; res.on('data', d => data += d)
      res.on('end', () => {
        if(res.statusCode!==200){
          return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0,300)}`))
        }
        try{ resolve(JSON.parse(data)) } catch{ reject(new Error('Bad JSON from Overpass')) }
      })
    })
    req.on('error', reject)
    req.write('data=' + encodeURIComponent(query))
    req.end()
  })
}

export default defineEventHandler(async (event)=>{
  const q=getQuery(event)
  const airport=String(q.airport||'EDDF').toUpperCase()
  const originRaw=String(q.origin||'').trim()
  const destRaw  =String(q.dest||'').trim()
  const includeRunways = String(q.include_runways||'1')!=='0'

  const oT = parseTarget(originRaw)
  const dT = parseTarget(destRaw)

  const osm = await fetchOverpass(buildOverpassQuery(airport, oT, dT, includeRunways))

  const nodes = new Map<number,NodeRec>()
  const ways:WayRec[]=[]
  for(const el of osm.elements){
    if(el.type==='node') nodes.set(el.id, {id:el.id, lat:el.lat, lon:el.lon})
    else if(el.type==='way') ways.push({id:el.id, nodes:el.nodes, tags:el.tags})
  }

  type Edge = {u:number; v:number; w:number; way_id:number; name:string|null}
  const edges:Edge[]=[]
  for(const w of ways){
    const name = w.tags?.ref || w.tags?.name || null
    for(let i=0;i<w.nodes.length-1;i++){
      const a=nodes.get(w.nodes[i]); const b=nodes.get(w.nodes[i+1]); if(!a||!b) continue
      const dist=haversine({lat:a.lat,lon:a.lon},{lat:b.lat,lon:b.lon})
      edges.push({u:a.id,v:b.id,w:dist,way_id:w.id,name})
      edges.push({u:b.id,v:a.id,w:dist,way_id:w.id,name})
    }
  }

  const adj = new Map<number, Array<{to:number,w:number}>>()
  const edgeMeta = new Map<string,{name:string|null, way_id:number}>()
  for(const e of edges){
    if(!adj.has(e.u)) adj.set(e.u,[])
    adj.get(e.u)!.push({to:e.v,w:e.w})
    edgeMeta.set(`${e.u}->${e.v}`, {name:e.name, way_id:e.way_id})
  }

  function nearestNode(lat:number, lon:number){
    let best:NodeRec|undefined, dBest=Infinity
    for(const n of nodes.values()){
      const d=haversine({lat,lon},{lat:n.lat,lon:n.lon})
      if(d<dBest){dBest=d; best=n}
    }
    if(!best) return null
    return {node_id:best.id, lat:best.lat, lon:best.lon, distance_m:dBest}
  }

  // Feature-/Koordinatenpunkt → Attach
  function resolvePoint(t:ReturnType<typeof parseTarget>){
    if(!t) return null
    if(t.kind==='coord'){
      const [latS,lonS]=t.value.split(',').map(x=>x.trim())
      const lat=Number(latS), lon=Number(lonS); if(!Number.isFinite(lat)||!Number.isFinite(lon)) return null
      const attach=nearestNode(lat,lon); if(!attach) return null
      return {point:{lat,lon}, attach}
    }
    const hits=(osm.elements as any[]).filter(e=>{
      if(e.type!=='node') return false
      const refOk = e.tags?.ref===t.value
      if(t.kind==='gate')      return refOk && e.tags?.aeroway==='gate'
      if(t.kind==='stand')     return refOk && e.tags?.aeroway==='parking_position'
      // threshold: mehrere Taggingvarianten
      return refOk && (e.tags?.runway==='threshold' || e.tags?.aeroway==='threshold' ||
        (e.tags?.aeroway==='runway' && e.tags?.runway==='threshold'))
    })
    if(!hits.length) return null
    const p={lat:hits[0].lat, lon:hits[0].lon}
    const attach=nearestNode(p.lat,p.lon); if(!attach) return null
    return {point:p, attach}
  }

  const oRes=resolvePoint(oT)
  const dRes=resolvePoint(dT)
  if(!oRes || !dRes){
    return { airport, error:'feature_not_found_or_attach_failed', origin_query:originRaw, dest_query:destRaw }
  }

  function dijkstra(src: number, dst: number) {
    const dist = new Map<number, number>()
    const prev = new Map<number, number>()
    const done = new Set<number>()
    const pq: Array<{ id: number; d: number }> = []
    const push = (id: number, d: number) => { pq.push({ id, d }); pq.sort((a, b) => a.d - b.d) }

    for (const id of nodes.keys()) dist.set(id, Infinity)
    dist.set(src, 0); push(src, 0)

    while (pq.length) {
      const { id: u } = pq.shift()!
      if (done.has(u)) continue
      done.add(u)
      if (u === dst) break

      const nb = adj.get(u)
      if (!nb) continue

      for (const { to: v, w: cost } of nb) {
        const alt = dist.get(u)! + cost
        if (alt < dist.get(v)!) {
          dist.set(v, alt)
          prev.set(v, u)
          push(v, alt)
        }
      }
    }

    if (!prev.has(dst) && src !== dst) return null
    const path: number[] = []
    let u = dst
    path.push(u)
    while (u !== src) {
      const p = prev.get(u)
      if (p === undefined) break
      u = p
      path.push(u)
    }
    path.reverse()
    return { path, total_m: dist.get(dst)! }
  }



  const sp=dijkstra(oRes.attach.node_id, dRes.attach.node_id)

  const names:string[]=[]
  if(sp && sp.path.length>1){
    for(let i=0;i<sp.path.length-1;i++){
      const u=sp.path[i], v=sp.path[i+1]
      const m=edgeMeta.get(`${u}->${v}`)||edgeMeta.get(`${v}->${u}`)
      const nm=(m?.name||'').trim()
      if(nm && (names.length===0 || names[names.length-1]!==nm)) names.push(nm)
    }
  }

  return {
    airport,
    origin:{ query:originRaw, point:oRes.point, attach:oRes.attach },
    dest:  { query:destRaw,   point:dRes.point, attach:dRes.attach },
    route: sp ? { node_ids:sp.path, total_distance_m:sp.total_m } : null,
    names
  }
})
