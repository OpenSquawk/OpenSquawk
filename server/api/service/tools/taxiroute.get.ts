import { defineEventHandler, getQuery } from 'h3'

type Node = { id: number; lat: number; lon: number }
type Edge = { from: number; to: number; len: number; ref: string; wayId?: number }
type Way  = { id: number; geometry: Array<{ lat: number; lon: number }>; label: string }

const meters = (a:{lat:number;lon:number}, b:{lat:number;lon:number})=>{
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

function buildWays(osm:any[]): Way[] {
    return (osm||[])
        .filter((el:any)=>el.type==='way' && el.geometry && el.geometry.length>=2)
        .map((el:any)=>({
            id: el.id,
            geometry: el.geometry,
            label: (el.tags?.ref || el.tags?.name || `TWY-${el.id}`) as string
        }))
}

function buildGraph(ways: Way[]) {
    const nodes=new Map<number,Node>(), adj=new Map<number,Edge[]>(), nodeRefs=new Map<number,string[]>()
    let nid=1
    const push=(e:Edge)=>{ if(!adj.has(e.from)) adj.set(e.from,[]); adj.get(e.from)!.push(e); if(e.ref){ if(!nodeRefs.has(e.from)) nodeRefs.set(e.from,[]); if(!nodeRefs.has(e.to)) nodeRefs.set(e.to,[]); nodeRefs.get(e.from)!.push(e.ref); nodeRefs.get(e.to)!.push(e.ref) } }
    for (const w of ways){
        let prev:number|undefined
        for (const p of w.geometry){
            const id=nid++, n:Node={id,lat:p.lat,lon:p.lon}; nodes.set(id,n)
            if(prev!==undefined){
                const a=nodes.get(prev)!, b=n, len=meters(a,b)
                push({from:a.id,to:b.id,len,ref:w.label,wayId:w.id})
                push({from:b.id,to:a.id,len,ref:w.label,wayId:w.id})
            }
            prev=id
        }
    }
    return {nodes,adj,nodeRefs,nid}
}

function connectClose(nodes:Map<number,Node>, adj:Map<number,Edge[]>, maxDist:number){
    if(maxDist<=0) return
    const arr=Array.from(nodes.values()), N=arr.length
    if(N>8000) return
    const push=(e:Edge)=>{ if(!adj.has(e.from)) adj.set(e.from,[]); adj.get(e.from)!.push(e) }
    for(let i=0;i<N;i++){
        for(let j=i+1;j<N;j++){
            const a=arr[i], b=arr[j], d=meters(a,b)
            if(d>0 && d<=maxDist){
                push({from:a.id,to:b.id,len:d,ref:'stitch'})
                push({from:b.id,to:a.id,len:d,ref:'stitch'})
            }
        }
    }
}

function projectPointToSegment(p:{lat:number;lon:number}, a:{lat:number;lon:number}, b:{lat:number;lon:number}){
    const lat0=(a.lat+b.lat)*0.5, kx=Math.cos(lat0*Math.PI/180)*111320, ky=110540
    const ax=0, ay=0
    const bx=(b.lon-a.lon)*kx, by=(b.lat-a.lat)*ky
    const px=(p.lon-a.lon)*kx, py=(p.lat-a.lat)*ky
    const seg2=bx*bx+by*by
    let t = seg2===0?0: (px*bx+py*by)/seg2
    t = Math.max(0, Math.min(1,t))
    const qx=bx*t, qy=by*t
    const qlon=a.lon + qx/kx, qlat=a.lat + qy/ky
    const dist=Math.hypot(px-qx, py-qy)
    return { t, q:{lat:qlat, lon:qlon}, dist }
}

function snapPointAsVirtualNode(p:{lat:number;lon:number}, nodes:Map<number,Node>, adj:Map<number,Edge[]>, nextId:number){
    let best:any=null
    const edges:Edge[]=[]
    for (const from of adj.keys()){
        for (const e of adj.get(from)!){
            if (e.from!==from) continue
            const A=nodes.get(e.from)!, B=nodes.get(e.to)!
            const pr=projectPointToSegment(p, A, B)
            if(!best || pr.dist<best.dist) best={e, A, B, pr}
        }
    }
    const id=nextId, n:Node={id,lat:p.lat,lon:p.lon}; nodes.set(id,n)
    if(best){
        const {e,A,B,pr}=best
        const midId=nextId+1, mid:Node={id:midId,lat:pr.q.lat,lon:pr.q.lon}; nodes.set(midId, mid)
        const lenAM=meters(A,mid), lenMB=meters(mid,B), lenPN=meters(n,mid)
        const replFrom = (list:Edge[], oldFrom:number, oldTo:number)=> {
            for(let i=list.length-1;i>=0;i--){
                const x=list[i]; if(x.from===oldFrom && x.to===oldTo){ list.splice(i,1) }
            }
        }
        replFrom(adj.get(A.id)!, A.id, B.id)
        replFrom(adj.get(B.id)!, B.id, A.id)
        const push=(ed:Edge)=>{ if(!adj.has(ed.from)) adj.set(ed.from,[]); adj.get(ed.from)!.push(ed) }
        push({from:A.id,to:mid.id,len:lenAM,ref:e.ref,wayId:e.wayId})
        push({from:mid.id,to:A.id,len:lenAM,ref:e.ref,wayId:e.wayId})
        push({from:mid.id,to:B.id,len:lenMB,ref:e.ref,wayId:e.wayId})
        push({from:B.id,to:mid.id,len:lenMB,ref:e.ref,wayId:e.wayId})
        push({from:n.id,to:mid.id,len:lenPN,ref:'snap'})
        push({from:mid.id,to:n.id,len:lenPN,ref:'snap'})
        return { virtualId: id, attachId: mid.id, attachLabel: e.ref, attachDist: Math.round(lenPN), nextId: mid.id+1 }
    } else {
        return { virtualId: id, attachId: null, attachLabel: 'snap', attachDist: null, nextId: id+1 }
    }
}

function dijkstra(start:number, goal:number, adj:Map<number,Edge[]>) {
    const dist=new Map<number,number>(), prev=new Map<number,{node:number;edge:Edge}>(), pq:Array<[number,number]>=[]
    const push=(d:number,n:number)=>{ pq.push([d,n]); pq.sort((a,b)=>a[0]-b[0]) }
    dist.set(start,0); push(0,start)
    while(pq.length){
        const [d,u]=pq.shift()!
        if(u===goal) break
        if(d!==dist.get(u)) continue
        for(const e of (adj.get(u)||[])){
            const v=e.to, nd=d+e.len
            if(nd < (dist.get(v) ?? Infinity)){
                dist.set(v, nd); prev.set(v,{node:u,edge:e}); push(nd,v)
            }
        }
    }
    if(!prev.has(goal)) return null
    const nodes=[goal], edges:Edge[]=[]
    for(let cur=goal; cur!==start; ){ const p=prev.get(cur)!; edges.push(p.edge); nodes.push(p.node); cur=p.node }
    nodes.reverse(); edges.reverse()
    return { nodes, edges, distance: dist.get(goal)! }
}

export default defineEventHandler(async (event)=>{
    const q=getQuery(event)
    const oLat=Number(q.origin_lat), oLon=Number(q.origin_lng)
    const dLat=Number(q.dest_lat),   dLon=Number(q.dest_lng)
    const radius=Math.max(1000,Math.min(15000,Number(q.radius)||6000))
    const connectInit=Math.max(0,Math.min(40,Number(q.connect)||12))
    const connectMax=Math.max(connectInit, Math.min(80, Number(q.connect_max)||40))

    if(!isFinite(oLat)||!isFinite(oLon)||!isFinite(dLat)||!isFinite(dLon)){
        return { ok:false, message:'params missing', distance_straight_m:null }
    }

    const straight=Math.round(meters({lat:oLat,lon:oLon},{lat:dLat,lon:dLon}))

    const req1 = fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(overpassAround(oLat,oLon,radius))})
    const req2 = fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(overpassAround(dLat,dLon,radius))})
    const [r1,r2]=await Promise.all([req1,req2])
    if(!r1.ok||!r2.ok){
        const txt1= r1.ok? '' : await r1.text().catch(()=>''), txt2= r2.ok? '' : await r2.text().catch(()=> '')
        return { ok:false, message:`overpass ${r1.status}/${r2.status}`, distance_straight_m: straight, error: (txt1||txt2) }
    }
    const j1=await r1.json(), j2=await r2.json()
    const ways = [...buildWays(j1.elements), ...buildWays(j2.elements)]
    if(!ways.length){
        return { ok:false, message:'no taxiways found', distance_straight_m: straight, nodes_with_distance: [] }
    }

    const {nodes,adj,nodeRefs,nid}=buildGraph(ways)
    let nextId=nid

    let startInfo = snapPointAsVirtualNode({lat:oLat,lon:oLon}, nodes, adj, nextId); nextId=startInfo.nextId
    let destInfo  = snapPointAsVirtualNode({lat:dLat,lon:dLon}, nodes, adj, nextId); nextId=destInfo.nextId

    let connect=connectInit, path=null
    while(connect<=connectMax && !path){
        connectClose(nodes, adj, connect)
        path=dijkstra(startInfo.virtualId, destInfo.virtualId, adj)
        if(!path) connect += 6
    }
    if(!path){
        const nodes_with_distance = Array.from(nodes.values()).map(n=>({
            id:n.id, lat:n.lat, lon:n.lon,
            label:(nodeRefs.get(n.id)||[]).sort((a,b)=>0).length? (nodeRefs.get(n.id)![0]) : 'stitch/snap',
            d_from_start_m: Math.round(meters({lat:oLat,lon:oLon}, n)),
            d_from_dest_m:  Math.round(meters({lat:dLat,lon:dLon}, n)),
        }))
        return {
            ok:false,
            message:'no path found (after segment-snap/adaptive-connect)',
            distance_straight_m: straight,
            chosen: {
                start_attach: { attach_node: startInfo.attachId, label: startInfo.attachLabel, distance_m: startInfo.attachDist },
                dest_attach:  { attach_node: destInfo.attachId,  label: destInfo.attachLabel,  distance_m: destInfo.attachDist }
            },
            nodes_with_distance
        }
    }

    const coords = path.nodes.map(id=>{ const n=nodes.get(id)!; return [n.lon,n.lat] as [number,number] })
    const steps: Array<{ref:string; length_m:number}> = []
    let i=0
    while(i<path.edges.length){
        const ref=path.edges[i].ref
        let len=0, j=i
        for(; j<path.edges.length && path.edges[j].ref===ref; j++) len+=path.edges[j].len
        steps.push({ref, length_m: Math.round(len)})
        i=j
    }
    const instructions = steps.map((s,idx)=> (idx===0?'Taxi':'Continue on') + ` ${s.ref} for ${s.length_m} m`)
    const nodes_with_distance = Array.from(nodes.values()).map(n=>({
        id:n.id, lat:n.lat, lon:n.lon,
        label:( (nodeRefs.get(n.id)||[])[0] ) || 'stitch/snap',
        d_from_start_m: Math.round(meters({lat:oLat,lon:oLon}, n)),
        d_from_dest_m:  Math.round(meters({lat:dLat,lon:dLon}, n)),
    }))

    return {
        ok:true,
        message:'route found',
        distance_straight_m: straight,
        chosen: {
            start_attach: { attach_node: startInfo.attachId, label: startInfo.attachLabel, distance_m: startInfo.attachDist },
            dest_attach:  { attach_node: destInfo.attachId,  label: destInfo.attachLabel,  distance_m: destInfo.attachDist }
        },
        distance_m: Math.round(path.distance),
        steps, instructions,
        nodes_with_distance,
        path: { type:'Feature', properties:{ distance_m: Math.round(path.distance) }, geometry:{ type:'LineString', coordinates: coords } }
    }
})
