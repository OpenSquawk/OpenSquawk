import { defineEventHandler, getQuery } from 'h3'

type Node = { id: number; lat: number; lon: number }
type Edge = { from: number; to: number; len: number; ref: string; wayId?: number }
type Way  = { id: number; geometry: Array<{ lat: number; lon: number }>; label: string }
type Segment = { aId: number; bId: number; a: Node; b: Node; ref: string; wayId: number }

const m = (a:{lat:number;lon:number}, b:{lat:number;lon:number})=>{
    const lat0=(a.lat+b.lat)*0.5, kx=Math.cos(lat0*Math.PI/180)*111320, ky=110540
    const dx=(b.lon-a.lon)*kx, dy=(b.lat-a.lat)*ky
    return Math.hypot(dx,dy)
}
const overpassAround = (lat:number, lon:number, radius:number) => `
[out:json][timeout:60];
(
  way["aeroway"="taxiway"](around:${radius},${lat},${lon});
  way["highway"="service"]["service"="taxiway"](around:${radius},${lat},${lon});
);
out tags geom;
`
const buildWays = (els:any[]): Way[] =>
  (els||[])
    .filter((el:any)=>el.type==='way' && el.geometry?.length>=2)
    .map((el:any)=>({ id: el.id, geometry: el.geometry, label: (el.tags?.ref || el.tags?.name || `TWY-${el.id}`) }))

function buildGraph(ways: Way[]){
    const nodes=new Map<number,Node>(), adj=new Map<number,Edge[]>(), segments: Segment[]=[]
    let nid=1
    const push=(e:Edge)=>{ if(!adj.has(e.from)) adj.set(e.from,[]); adj.get(e.from)!.push(e) }
    for(const w of ways){
        let prevId:number|undefined, prev:Node|undefined
        for(const p of w.geometry){
            const id=nid++, n:Node={id,lat:p.lat,lon:p.lon}; nodes.set(id,n)
            if(prevId && prev){
                const len=m(prev,n)
                push({from:prevId,to:id,len,ref:w.label,wayId:w.id})
                push({from:id,to:prevId,len,ref:w.label,wayId:w.id})
                segments.push({aId:prevId,bId:id,a:prev,b:n,ref:w.label,wayId:w.id})
            }
            prevId=id; prev=n
        }
    }
    return { nodes, adj, segments, nextId: Math.max(...nodes.keys())+1 }
}

function connectClose(nodes:Map<number,Node>, adj:Map<number,Edge[]>, maxDist:number){
    if(maxDist<=0) return
    const arr=Array.from(nodes.values()); const N=arr.length; if(N>9000) return
    const push=(e:Edge)=>{ if(!adj.has(e.from)) adj.set(e.from,[]); adj.get(e.from)!.push(e) }
    for(let i=0;i<N;i++) for(let j=i+1;j<N;j++){
        const a=arr[i], b=arr[j], d=m(a,b)
        if(d>0 && d<=maxDist){ push({from:a.id,to:b.id,len:d,ref:'stitch'}); push({from:b.id,to:a.id,len:d,ref:'stitch'}) }
    }
}

function proj(p:{lat:number;lon:number}, a:Node, b:Node){
    const lat0=(a.lat+b.lat)*0.5, kx=Math.cos(lat0*Math.PI/180)*111320, ky=110540
    const bx=(b.lon-a.lon)*kx, by=(b.lat-a.lat)*ky
    const px=(p.lon-a.lon)*kx, py=(p.lat-a.lat)*ky
    const seg2=bx*bx+by*by
    let t= seg2===0?0:(px*bx+py*by)/seg2; t=Math.max(0,Math.min(1,t))
    const qx=bx*t, qy=by*t
    return { q:{lat:a.lat+qy/ky, lon:a.lon+qx/kx}, dist:Math.hypot(px-qx,py-qy) }
}

function snapToOSMSegment(p:{lat:number;lon:number}, g:{nodes:Map<number,Node>,adj:Map<number,Edge[]>,segments:Segment[],nextId:number}){
    let best:null|{seg:Segment,q:{lat:number;lon:number},dist:number}=null
    for(const s of g.segments){ const pr=proj(p,s.a,s.b); if(!best||pr.dist<best.dist) best={seg:s,q:pr.q,dist:pr.dist} }
    const idVirt=g.nextId++; const virt:Node={id:idVirt,lat:p.lat,lon:p.lon}; g.nodes.set(idVirt,virt)
    if(!best) return { virtualId:idVirt, midId:null, attachLabel:'snap', attachDist:null, attachCoord:null }
    const idMid=g.nextId++; const mid:Node={id:idMid,lat:best.q.lat,lon:best.q.lon}; g.nodes.set(idMid,mid)
    const push=(e:Edge)=>{ if(!g.adj.has(e.from)) g.adj.set(e.from,[]); g.adj.get(e.from)!.push(e) }
    const remove=(from:number,to:number)=>{
        const L=g.adj.get(from); if(!L) return
        for(let i=L.length-1;i>=0;i--) if(L[i].from===from && L[i].to===to && L[i].ref!=='stitch' && L[i].ref!=='snap') L.splice(i,1)
    }
    const {aId,bId,a,b,ref,wayId}=best.seg
    remove(aId,bId); remove(bId,aId)
    const lenAM=m(a,mid), lenMB=m(mid,b), lenPM=m(virt,mid)
    push({from:aId,to:idMid,len:lenAM,ref,wayId})
    push({from:idMid,to:aId,len:lenAM,ref,wayId})
    push({from:idMid,to:bId,len:lenMB,ref,wayId})
    push({from:bId,to:idMid,len:lenMB,ref,wayId})
    push({from:idVirt,to:idMid,len:lenPM,ref:'snap'})
    push({from:idMid,to:idVirt,len:lenPM,ref:'snap'})
    const idx=g.segments.findIndex(s=>s.aId===aId && s.bId===bId)
    if(idx>=0) g.segments.splice(idx,1,{aId, bId:idMid, a, b:mid, ref, wayId},{aId:idMid, bId, a:mid, b, ref, wayId})
    return { virtualId:idVirt, midId:idMid, attachLabel:ref, attachDist:Math.round(lenPM), attachCoord:{lat:mid.lat,lon:mid.lon} }
}

function astar(start:number, goal:number, adj:Map<number,Edge[]>, nodes:Map<number,Node>){
    const h=(x:number)=> m(nodes.get(x)!, nodes.get(goal)!)
    const open: Array<[number,number]> = []
    const g=new Map<number,number>(), came=new Map<number,{node:number;edge:Edge}>()
    const push=(f:number,n:number)=>{ open.push([f,n]); open.sort((a,b)=>a[0]-b[0]) }
    g.set(start,0); push(h(start), start)
    const seen=new Set<number>()
    while(open.length){
        const [,u]=open.shift()!
        if(u===goal) break
        if(seen.has(u)) continue; seen.add(u)
        for(const e of (adj.get(u)||[])){
            const v=e.to, tentative=(g.get(u)??Infinity)+e.len
            if(tentative < (g.get(v)??Infinity)){
                g.set(v,tentative); came.set(v,{node:u,edge:e}); push(tentative + h(v), v)
            }
        }
    }
    if(!came.has(goal)) return null
    const nodesPath=[goal], edges:Edge[]=[]
    for(let cur=goal; cur!==start; ){ const p=came.get(cur)!; edges.push(p.edge); nodesPath.push(p.node); cur=p.node }
    nodesPath.reverse(); edges.reverse()
    return { nodes: nodesPath, edges, distance: Math.round(g.get(goal)!) }
}

export default defineEventHandler(async (event)=>{
    const q=getQuery(event)
    const oLat=Number(q.origin_lat), oLon=Number(q.origin_lng)
    const dLat=Number(q.dest_lat),   dLon=Number(q.dest_lng)
    const radius=Math.max(1200,Math.min(15000,Number(q.radius)||7000))
    let connect=Math.max(0,Math.min(50,Number(q.connect)||12))
    const connectMax=Math.max(connect, Math.min(80, Number(q.connect_max)||48))
    const connectStep=Math.max(4, Math.min(20, Number(q.connect_step)||8))

    if(!isFinite(oLat)||!isFinite(oLon)||!isFinite(dLat)||!isFinite(dLon))
        return { ok:false, message:'params missing', distance_straight_m:null }

    const straight=Math.round(m({lat:oLat,lon:oLon},{lat:dLat,lon:dLon}))

    const [r1,r2]=await Promise.all([
        fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(overpassAround(oLat,oLon,radius))}),
        fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(overpassAround(dLat,dLon,radius))})
    ])
    if(!r1.ok||!r2.ok){
        const t1=r1.ok?'':await r1.text().catch(()=>''), t2=r2.ok?'':await r2.text().catch(()=>'')

        return { ok:false, message:`overpass ${r1.status}/${r2.status}`, distance_straight_m: straight, error: (t1||t2) }
    }
    const ways=[...buildWays((await r1.json()).elements), ...buildWays((await r2.json()).elements)]
    if(!ways.length) return { ok:false, message:'no taxiways found', distance_straight_m: straight, nodes_with_distance: [] }

    const g=buildGraph(ways)
    const s=snapToOSMSegment({lat:oLat,lon:oLon}, g)
    const d=snapToOSMSegment({lat:dLat,lon:dLon}, g)

    let path=null
    while(connect<=connectMax && !path){
        connectClose(g.nodes, g.adj, connect)
        path=astar(s.virtualId!, d.virtualId!, g.adj, g.nodes)
        if(!path) connect += connectStep
    }

    const nodes_with_distance = Array.from(g.nodes.values()).map(n=>({
        id:n.id, lat:n.lat, lon:n.lon,
        label: (g.adj.get(n.id)?.[0]?.ref) || 'stitch/snap',
        d_from_start_m: Math.round(m({lat:oLat,lon:oLon}, n)),
        d_from_dest_m:  Math.round(m({lat:dLat,lon:dLon}, n)),
    }))

    if(!path){
        return {
            ok:false,
            message:'no path found (after segment-snap/A*)',
            distance_straight_m: straight,
            chosen: {
                start_attach: { label: s.attachLabel, distance_m: s.attachDist, coord: s.attachCoord },
                dest_attach:  { label: d.attachLabel, distance_m: d.attachDist, coord: d.attachCoord }
            },
            nodes_with_distance
        }
    }

    const coords = path.nodes.map(id=>{ const n=g.nodes.get(id)!; return [n.lon,n.lat] as [number,number] })
    const steps: Array<{ref:string; length_m:number}> = []
    for(let i=0;i<path.edges.length;){
        const ref=path.edges[i].ref; let len=0, j=i
        for(; j<path.edges.length && path.edges[j].ref===ref; j++) len+=path.edges[j].len
        steps.push({ref, length_m: Math.round(len)}); i=j
    }
    const instructions = steps.map((s,idx)=> (idx===0?'Taxi':'Continue on') + ` ${s.ref} for ${s.length_m} m`)

    return {
        ok:true,
        message:'route found',
        distance_straight_m: straight,
        chosen: {
            start_attach: { label: s.attachLabel, distance_m: s.attachDist, coord: s.attachCoord },
            dest_attach:  { label: d.attachLabel, distance_m: d.attachDist, coord: d.attachCoord }
        },
        distance_m: path.distance,
        steps, instructions,
        nodes_with_distance,
        path: { type:'Feature', properties:{ distance_m: path.distance }, geometry:{ type:'LineString', coordinates: coords } }
    }
})
