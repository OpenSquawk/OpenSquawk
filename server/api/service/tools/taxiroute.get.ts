import { defineEventHandler, getQuery } from 'h3'
import https from 'node:https'

/**
 * Taxi-Route API (EDDF o.ä.)
 * - Overpass: Taxiway/optional Runway Netz aus Aerodrome-Area
 * - Start/Ziel: coord:, threshold:, gate:, stand: → Punkt
 * - Snap auf nächsten Netz-Knoten
 * - Kürzeste Route (Dijkstra)
 * - Label-Segmente mit Distanzen
 * - A-B-A → A, falls Label-Only-Verbindung existiert (mit Distanz)
 */

type LatLon = { lat: number; lon: number }
type NodeRec = { id: number; lat: number; lon: number }
type WayRec  = { id: number; nodes: number[]; tags?: Record<string, string> }

const endpoint = 'https://overpass-api.de/api/interpreter'

const toRad = (d: number) => d * Math.PI / 180
const haversine = (a: LatLon, b: LatLon) => {
  const R = 6371000
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const la1 = toRad(a.lat), la2 = toRad(b.lat)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

// Label normalisieren, z.B. " n 3 " → "N3"
const normalizeLabel = (s?: string | null) => (s ?? '').trim().replace(/\s+/g, '').toUpperCase()

function parseTarget(s: string) {
  const t = s?.trim()
  if (!t) return null as const
  if (t.startsWith('coord:'))     return { kind: 'coord',     value: t.slice(6).trim() } as const
  if (t.startsWith('threshold:')) return { kind: 'threshold', value: t.slice(10).trim() } as const
  if (t.startsWith('gate:'))      return { kind: 'gate',      value: t.slice(5).trim() } as const
  if (t.startsWith('stand:'))     return { kind: 'stand',     value: t.slice(6).trim() } as const
  return null as const
}

function selectorFor(kind: 'threshold' | 'gate' | 'stand', ref: string, alias: string) {
  if (kind === 'gate')  return `node(area.a)["aeroway"="gate"]["ref"="${ref}"]->.${alias};`
  if (kind === 'stand') return `node(area.a)["aeroway"="parking_position"]["ref"="${ref}"]->.${alias};`
  // Threshold robust
  return `
  (
    node(area.a)["runway"="threshold"]["ref"="${ref}"];
    node(area.a)["aeroway"="runway"]["runway"="threshold"]["ref"="${ref}"];
    node(area.a)["aeroway"="threshold"]["ref"="${ref}"];
  )->.${alias};`
}

function buildOverpassQuery(airport: string, o: any, d: any, includeRunways = true) {
  const net = includeRunways ? '^(taxiway|runway)$' : '^taxiway$'
  const selO = o && o.kind !== 'coord' ? selectorFor(o.kind, o.value, 'OSEL') : ''
  const selD = d && d.kind !== 'coord' ? selectorFor(d.kind, d.value, 'DSEL') : ''
  return `
[out:json][timeout:90];
rel["aeroway"="aerodrome"]["icao"="${airport}"];
map_to_area->.a;

way(area.a)["aeroway"~"${net}"]->.w;
( .w; >; ); out body;

${selO}
${selD}
${(selO || selD) ? '( .OSEL; .DSEL; ); out body;' : ''}
`.trim()
}

function fetchOverpass(query: string) {
  return new Promise<any>((resolve, reject) => {
    const req = https.request(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, res => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 300)}`))
        }
        try { resolve(JSON.parse(data)) } catch { reject(new Error('Bad JSON from Overpass')) }
      })
    })
    req.on('error', reject)
    req.write('data=' + encodeURIComponent(query))
    req.end()
  })
}

// ----- Util: Label-Parsing aus Way-Tags -----
function parseLabelsFromTags(tags?: Record<string, string>): string[] {
  if (!tags) return []
  const raw: string[] = []
  if (tags.ref) raw.push(tags.ref)
  if (tags.name && tags.name !== tags.ref) raw.push(tags.name)
  const out = new Set<string>()
  for (const r of raw) {
    for (const t of r.split(/[;,\s/]+/)) {
      const lab = normalizeLabel(t)
      if (lab) out.add(lab)
    }
  }
  return Array.from(out)
}

// Für Segmentwahl: „schönes“ Label bestimmen
function pickCanonicalLabel(cands: Set<string>, prefer?: string): string {
  if (prefer && cands.has(prefer)) return prefer
  const arr = Array.from(cands)
  // Bevorzuge A, A1, A12 Muster
  const fmt = arr.filter(x => /^[A-Z]\d{0,2}$/.test(x))
  if (fmt.length) return fmt.sort()[0]
  return arr.sort()[0] ?? ''
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const airport = String(q.airport || 'EDDF').toUpperCase()
  const originRaw = String(q.origin || '').trim()
  const destRaw   = String(q.dest   || '').trim()
  const includeRunways = String(q.include_runways || '1') !== '0'

  const oT = parseTarget(originRaw)
  const dT = parseTarget(destRaw)

  const overpassQ = buildOverpassQuery(airport, oT, dT, includeRunways)
  const osm = await fetchOverpass(overpassQ)

  // --- Graph ---
  const nodes = new Map<number, NodeRec>()
  const ways: WayRec[] = []
  const featureNodes: Array<{ id: number, lat: number, lon: number, tags?: any }> = []

  for (const el of osm.elements as any[]) {
    if (el.type === 'node') {
      nodes.set(el.id, { id: el.id, lat: el.lat, lon: el.lon })
      if (el.tags?.aeroway || el.tags?.runway) featureNodes.push(el)
    } else if (el.type === 'way') {
      ways.push({ id: el.id, nodes: el.nodes, tags: el.tags })
    }
  }

  type Edge = { u: number; v: number; w: number; way_id: number }

  const edges: Edge[] = []
  const wayNodeIds = new Set<number>()

  // Label-Speicher:
  // - edgeLabels: u->v → Menge Labels (vereint alle parallelen Ways)
  // - edgeLabelCost: Label → (u->v → minimaler w für Kanten mit diesem Label)
  const edgeLabels = new Map<string, Set<string>>()
  const edgeLabelCost = new Map<string, Map<string, number>>()

  const addEdgeLabels = (u: number, v: number, labels: string[], w: number) => {
    const key = `${u}->${v}`
    if (!edgeLabels.has(key)) edgeLabels.set(key, new Set<string>())
    const set = edgeLabels.get(key)!
    for (const L of labels) set.add(L)

    for (const L of labels) {
      if (!edgeLabelCost.has(L)) edgeLabelCost.set(L, new Map())
      const m = edgeLabelCost.get(L)!
      const prev = m.get(key)
      if (prev === undefined || w < prev) m.set(key, w)
    }
  }

  for (const w of ways) {
    const labelsForWay = parseLabelsFromTags(w.tags)
    for (let i = 0; i < w.nodes.length - 1; i++) {
      const aId = w.nodes[i], bId = w.nodes[i + 1]
      const a = nodes.get(aId), b = nodes.get(bId)
      if (!a || !b) continue
      wayNodeIds.add(aId); wayNodeIds.add(bId)
      const dist = haversine({ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon })
      edges.push({ u: a.id, v: b.id, w: dist, way_id: w.id })
      edges.push({ u: b.id, v: a.id, w: dist, way_id: w.id })
      // Label-Mengen pro Richtung pflegen
      if (labelsForWay.length) {
        addEdgeLabels(a.id, b.id, labelsForWay, dist)
        addEdgeLabels(b.id, a.id, labelsForWay, dist)
      }
    }
  }

  const adj = new Map<number, Array<{ to: number, w: number }>>()
  for (const e of edges) {
    if (!adj.has(e.u)) adj.set(e.u, [])
    adj.get(e.u)!.push({ to: e.v, w: e.w })
  }

  // --- Snap ---
  function nearestNode(lat: number, lon: number, onlyNet = false) {
    let best: NodeRec | undefined, dBest = Infinity
    for (const n of nodes.values()) {
      if (onlyNet && !wayNodeIds.has(n.id)) continue
      const d = haversine({ lat, lon }, { lat: n.lat, lon: n.lon })
      if (d < dBest) { dBest = d; best = n }
    }
    if (!best) return null
    return { node_id: best.id, lat: best.lat, lon: best.lon, distance_m: dBest }
  }

  function nearestCandidates(lat: number, lon: number, k = 5, onlyNet = true) {
    const arr: Array<{ node_id: number, lat: number, lon: number, distance_m: number }> = []
    for (const n of nodes.values()) {
      if (onlyNet && !wayNodeIds.has(n.id)) continue
      arr.push({ node_id: n.id, lat: n.lat, lon: n.lon, distance_m: haversine({ lat, lon }, { lat: n.lat, lon: n.lon }) })
    }
    arr.sort((a, b) => a.distance_m - b.distance_m)
    return arr.slice(0, k)
  }

  function resolvePoint(t: ReturnType<typeof parseTarget>) {
    if (!t) return null
    if (t.kind === 'coord') {
      const [latS, lonS] = t.value.split(',').map(x => x.trim())
      const lat = Number(latS), lon = Number(lonS)
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
      const raw = nearestNode(lat, lon, false)
      const net = nearestNode(lat, lon, true)
      return { point: { lat, lon }, attach_raw: raw, attach_net: net }
    }
    // Feature aus Overpass
    const hits = (osm.elements as any[]).filter(e => {
      if (e.type !== 'node') return false
      const refOk = e.tags?.ref === t.value
      if (t.kind === 'gate')  return refOk && e.tags?.aeroway === 'gate'
      if (t.kind === 'stand') return refOk && e.tags?.aeroway === 'parking_position'
      // threshold
      return refOk && (e.tags?.runway === 'threshold' || e.tags?.aeroway === 'threshold' ||
        (e.tags?.aeroway === 'runway' && e.tags?.runway === 'threshold'))
    })
    if (!hits.length) return null
    const p = { lat: hits[0].lat, lon: hits[0].lon }
    const raw = nearestNode(p.lat, p.lon, false)
    const net = nearestNode(p.lat, p.lon, true)
    return { point: p, attach_raw: raw, attach_net: net }
  }

  const oTRes = resolvePoint(oT)
  const dTRes = resolvePoint(dT)
  if (!oTRes || !dTRes) {
    return { airport, error: 'feature_not_found_or_attach_failed', origin_query: originRaw, dest_query: destRaw }
  }

  const oAttach = (oTRes.attach_raw && wayNodeIds.has(oTRes.attach_raw.node_id)) ? oTRes.attach_raw : oTRes.attach_net
  const dAttach = (dTRes.attach_raw && wayNodeIds.has(dTRes.attach_raw.node_id)) ? dTRes.attach_raw : dTRes.attach_net

  // --- Dijkstra (Gesamtnetz) ---
  function dijkstra(src: number, dst: number) {
    const dist = new Map<number, number>()
    const prev = new Map<number, number>()
    const done = new Set<number>()
    const pq: Array<{ id: number, d: number }> = []
    const push = (id: number, d: number) => { pq.push({ id, d }); pq.sort((a, b) => a.d - b.d) }

    for (const id of wayNodeIds) dist.set(id, Infinity)
    if (!dist.has(src) || !dist.has(dst)) return null
    dist.set(src, 0); push(src, 0)

    while (pq.length) {
      const { id: u } = pq.shift()!
      if (done.has(u)) continue
      done.add(u)
      if (u === dst) break
      const nb = adj.get(u); if (!nb) continue
      for (const { to: v, w: cost } of nb) {
        const alt = dist.get(u)! + cost
        if (alt < dist.get(v)!) { dist.set(v, alt); prev.set(v, u); push(v, alt) }
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

  const sp = (oAttach && dAttach) ? dijkstra(oAttach.node_id, dAttach.node_id) : null

  // --- Segmente (contiguous je Label) ---
  type Seg = {
    name: string      // gewählte Canonical-Anzeige
    label: string     // normalisiert
    distance_m: number
    from: number; to: number
    start_idx: number; end_idx: number
  }

  const segments: Seg[] = []
  if (sp && sp.path.length > 1) {
    let cur: Seg | null = null
    for (let i = 0; i < sp.path.length - 1; i++) {
      const u = sp.path[i], v = sp.path[i + 1]
      const key = `${u}->${v}`
      const rev = `${v}->${u}`
      const labelsSet: Set<string> = edgeLabels.get(key) || edgeLabels.get(rev) || new Set()
      const chosen = pickCanonicalLabel(labelsSet, cur?.label)
      const w = haversine(nodes.get(u)!, nodes.get(v)!)
      if (!chosen) {
        if (cur) { cur.end_idx = i + 1; cur.to = v }
        continue
      }
      if (!cur || cur.label !== chosen) {
        if (cur) segments.push(cur)
        cur = { name: chosen, label: chosen, distance_m: 0, from: u, to: v, start_idx: i, end_idx: i + 1 }
      } else {
        cur.to = v
        cur.end_idx = i + 1
      }
      cur.distance_m += w
    }
    if (cur) segments.push(cur)
  }

  // --- Label-Dijkstra: nur Kanten, die Label tragen ---
  function dijkstraWithinLabel(label: string, starts: number[], targets: Set<number>) {
    const dist = new Map<number, number>()
    const done = new Set<number>()
    const pq: Array<{ id: number, d: number }> = []
    const push = (id: number, d: number) => { pq.push({ id, d }); pq.sort((a, b) => a.d - b.d) }

    for (const id of wayNodeIds) dist.set(id, Infinity)
    for (const s of starts) if (dist.has(s)) { dist.set(s, 0); push(s, 0) }

    while (pq.length) {
      const { id: u } = pq.shift()!
      if (done.has(u)) continue
      done.add(u)
      if (targets.has(u)) return { reachable: true, distance_m: dist.get(u)! }

      const nb = adj.get(u); if (!nb) continue
      for (const { to: v } of nb) {
        const key = `${u}->${v}`
        const m = edgeLabelCost.get(label)
        const cost = m?.get(key)
        if (cost === undefined) continue // diese Kante trägt das Label nicht
        const alt = dist.get(u)! + cost
        if (alt < dist.get(v)!) { dist.set(v, alt); push(v, alt) }
      }
    }
    return { reachable: false, distance_m: null as unknown as number }
  }

  // --- A-B-A → A Prüfung & Sanitize ---
  type PatternCheck = {
    i: number,
    a: string, a_label: string,
    b: string, b_label: string,
    connectable: boolean,
    label_path_m: number | null,
    from_nodes: number[], to_nodes: number[]
  }
  const pattern_checks: PatternCheck[] = []

  function sanitizeABA(input: Seg[]) {
    const out: Seg[] = []
    let i = 0
    while (i < input.length) {
      if (i + 2 < input.length) {
        const A1 = input[i], B = input[i + 1], A2 = input[i + 2]
        if (A1.label === A2.label && B.label !== A1.label) {
          const a1Nodes = sp!.path.slice(A1.start_idx, A1.end_idx + 1)
          const a2Nodes = sp!.path.slice(A2.start_idx, A2.end_idx + 1)
          const r = dijkstraWithinLabel(A1.label, a1Nodes, new Set(a2Nodes))
          pattern_checks.push({
            i,
            a: A1.name, a_label: A1.label,
            b: B.name,  b_label: B.label,
            connectable: r.reachable,
            label_path_m: r.reachable ? Math.round(r.distance_m) : null,
            from_nodes: a1Nodes, to_nodes: a2Nodes
          })
          if (r.reachable) {
            out.push({
              name: A1.name,
              label: A1.label,
              distance_m: A1.distance_m + B.distance_m + A2.distance_m,
              from: A1.from,
              to: A2.to,
              start_idx: A1.start_idx,
              end_idx: A2.end_idx
            })
            i += 3
            continue
          }
        }
      }
      out.push(input[i]); i++
    }
    return out
  }

  const segments_sanitized = sanitizeABA(segments)

  // Backwards-kompatibel + Distanzen
  const names = segments.map(s => s.name)
  const names_sanitized = segments_sanitized.map(s => s.name)
  const names_segments = segments.map(s => ({
    name: s.name, label: s.label, distance_m: Math.round(s.distance_m), from: s.from, to: s.to
  }))
  const names_segments_sanitized = segments_sanitized.map(s => ({
    name: s.name, label: s.label, distance_m: Math.round(s.distance_m), from: s.from, to: s.to
  }))

  // Debug
  const originCandidates = nearestCandidates(oTRes.point.lat, oTRes.point.lon, 5, true)
  const destCandidates   = nearestCandidates(dTRes.point.lat, dTRes.point.lon, 5, true)

  return {
    airport,
    origin: {
      query: originRaw,
      point: oTRes.point,
      attach_raw: oTRes.attach_raw,
      attach_net: oAttach,
      net_candidates_top5: originCandidates
    },
    dest: {
      query: destRaw,
      point: dTRes.point,
      attach_raw: dTRes.attach_raw,
      attach_net: dAttach,
      net_candidates_top5: destCandidates
    },
    route: sp ? { node_ids: sp.path, total_distance_m: Math.round(sp.total_m) } : null,

    names_segments,
    names_segments_sanitized,
    names,
    names_sanitized,
    pattern_checks,

    debug: {
      overpass_bytes: JSON.stringify(osm).length,
      stats: {
        nodes_total: nodes.size,
        ways_total: ways.length,
        edges_total: edges.length,
        net_nodes: wayNodeIds.size
      }
    }
  }
})
