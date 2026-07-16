<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import type { Map as LeafletMap, Marker, Polyline } from 'leaflet'

const props = defineProps<{
  lat: number
  lon: number
  heading: number
}>()

const mapEl = ref<HTMLElement | null>(null)
let map: LeafletMap | null = null
let marker: Marker | null = null
let trail: Polyline | null = null
const trailPoints: [number, number][] = []

function updateMarkerRotation() {
  const el = marker?.getElement()
  const arrow = el?.querySelector<HTMLElement>('.websim-plane-arrow')
  if (arrow) arrow.style.transform = `rotate(${props.heading}deg)`
}

onMounted(async () => {
  const L = await import('leaflet')
  if (!mapEl.value) return

  map = L.map(mapEl.value, { attributionControl: false, zoomControl: true }).setView([props.lat, props.lon], 11)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    subdomains: 'abc',
  }).addTo(map)

  const icon = L.divIcon({
    className: 'websim-plane-icon',
    html: '<div class="websim-plane-arrow"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
  marker = L.marker([props.lat, props.lon], { icon }).addTo(map)
  trail = L.polyline([], { color: '#22d3ee', weight: 2, opacity: 0.55 }).addTo(map)
  updateMarkerRotation()
})

watch(
  () => [props.lat, props.lon, props.heading] as const,
  ([lat, lon]) => {
    if (!map || !marker) return
    const latlng: [number, number] = [lat, lon]
    marker.setLatLng(latlng)
    updateMarkerRotation()
    if (!map.getBounds().contains(latlng)) {
      map.panTo(latlng, { animate: false })
    }
    trailPoints.push(latlng)
    if (trailPoints.length > 400) trailPoints.shift()
    trail?.setLatLngs(trailPoints)
  },
)

onBeforeUnmount(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div ref="mapEl" class="w-full h-full" />
</template>

<style>
.websim-plane-icon {
  background: transparent;
  border: none;
}
.websim-plane-arrow {
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-bottom: 16px solid #22d3ee;
  transform-origin: 50% 60%;
  filter: drop-shadow(0 0 3px rgba(34, 211, 238, 0.8));
}
</style>
