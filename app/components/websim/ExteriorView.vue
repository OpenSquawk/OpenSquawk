<script setup lang="ts">
// Very simple abstract "look outside" view: sky, ground, and a runway strip
// when the aircraft is close to one. No real airport geometry — see
// docs/plans/2026-07-16-websim-design.md (explicitly out of scope for v1).
//
// docs/plans/2026-07-16-codex-fixes-live-atc-loop-websim.md WP2 Fix 5: the
// horizon now reacts to altitude, the runway sits at its real distance/offset
// instead of a fixed spot, and the sky uses a gradient + fog instead of a flat
// two-color split.

const props = defineProps<{
  pitch: number
  bank: number
  /** Feet MSL. Drives how high the camera sits above the ground plane. */
  altitudeFt: number
  /** Feet MSL — the target runway's threshold elevation, 0 if none is targeted. */
  fieldElevationFt: number
  nearRunway: boolean
  /** Nautical miles to the target runway threshold, Infinity if none is targeted. */
  distanceToRunwayNm: number
  /** Signed degrees the runway centerline sits left(-)/right(+) of the nose. */
  runwayOffsetDeg: number
}>()

const RUNWAY_LENGTH_M = 3000
// Real runway width (~50m) is sub-pixel from the 9-12 NM distance this is
// meant to be visible from (a 50m-wide strip 18km away spans under 2px in a
// ~500px-wide panel) — widened well past scale for visibility, matching the
// "abstract, not real airport geometry" brief (docs/plans/2026-07-16-websim-design.md).
const RUNWAY_WIDTH_M = 300
const NM_TO_M = 1852
// Abstract cap: WebSim only ever spawns near an airport, but a robust clamp
// keeps the viewpoint sane even if altitude/fieldElevation data is momentarily
// out of sync (e.g. right after a reposition).
const MAX_CAMERA_HEIGHT_M = 2000

const canvasEl = ref<HTMLElement | null>(null)
let renderer: any = null
let scene: any = null
let camera: any = null
let runwayGroup: any = null
let animFrame: number | null = null
let resizeObserver: ResizeObserver | null = null

function makeSkyGradientTexture(THREE: typeof import('three')) {
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 256)
    gradient.addColorStop(0, '#1e5fa8')
    gradient.addColorStop(0.7, '#5b9bd5')
    gradient.addColorStop(1, '#bcd9ee')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 2, 256)
  }
  return new THREE.CanvasTexture(canvas)
}

function buildRunwayGroup(THREE: typeof import('three')) {
  const group = new THREE.Group()

  const surface = new THREE.Mesh(
    new THREE.PlaneGeometry(RUNWAY_WIDTH_M, RUNWAY_LENGTH_M),
    new THREE.MeshBasicMaterial({ color: '#7a7680' }),
  )
  surface.rotation.x = -Math.PI / 2
  group.add(surface)

  // Threshold bar — the near edge, at local z = +length/2 (group origin sits
  // at the runway's midpoint; the group's world position is set so this edge
  // lands at the real distance-to-threshold each frame).
  const thresholdBar = new THREE.Mesh(
    new THREE.PlaneGeometry(RUNWAY_WIDTH_M * 0.8, 30),
    new THREE.MeshBasicMaterial({ color: '#f5f5f5' }),
  )
  thresholdBar.rotation.x = -Math.PI / 2
  thresholdBar.position.set(0, 0.02, RUNWAY_LENGTH_M / 2 - 40)
  group.add(thresholdBar)

  // Centerline dashes.
  const dashCount = 10
  const dashLength = 60
  const spacing = RUNWAY_LENGTH_M / dashCount
  for (let i = 0; i < dashCount; i++) {
    const dash = new THREE.Mesh(
      new THREE.PlaneGeometry(10, dashLength),
      new THREE.MeshBasicMaterial({ color: '#f5f5f5' }),
    )
    dash.rotation.x = -Math.PI / 2
    dash.position.set(0, 0.03, RUNWAY_LENGTH_M / 2 - i * spacing - spacing / 2)
    group.add(dash)
  }

  return group
}

onMounted(async () => {
  const THREE = await import('three')
  const el = canvasEl.value
  if (!el) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#5b9bd5')
  // Fades far geometry into the sky color instead of a hard cutoff at the
  // haze sphere's radius — reads as atmospheric depth rather than a flat
  // backdrop. far/camera-far/haze-radius all sit past the runway's furthest
  // visible distance (nearRunway gate is 12 NM ≈ 22.2 km + half the runway
  // mesh's own length) — otherwise it renders faded-to-nothing or gets
  // clipped by the camera's far plane entirely. near/far spread wide enough
  // that the runway is still >60% visible (not fogged into the sky) at 12 NM.
  scene.fog = new THREE.Fog('#5b9bd5', 5000, 40000)

  camera = new THREE.PerspectiveCamera(65, el.clientWidth / Math.max(1, el.clientHeight), 0.1, 42000)
  camera.position.set(0, 0, 0)
  // Pitch (X) and bank/roll (Z) only — no simulated heading/yaw for this
  // abstract view. 'ZXY' applies roll about the forward axis first, then
  // pitch about the already-rolled lateral axis, matching how a banked
  // aircraft's own pitch axis reads on screen.
  camera.rotation.order = 'ZXY'

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(el.clientWidth, el.clientHeight)
  el.appendChild(renderer.domElement)

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40000, 40000),
    new THREE.MeshBasicMaterial({ color: '#3f6b3f' }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -1.7
  scene.add(ground)

  runwayGroup = buildRunwayGroup(THREE)
  runwayGroup.position.y = -1.69
  runwayGroup.visible = false
  scene.add(runwayGroup)

  const haze = new THREE.Mesh(
    new THREE.SphereGeometry(40000, 16, 16),
    new THREE.MeshBasicMaterial({ map: makeSkyGradientTexture(THREE), side: THREE.BackSide }),
  )
  scene.add(haze)

  resizeObserver = new ResizeObserver(() => {
    if (!el || !renderer || !camera) return
    const w = Math.max(1, el.clientWidth)
    const h = Math.max(1, el.clientHeight)
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  })
  resizeObserver.observe(el)

  function render() {
    if (!renderer || !scene || !camera) return
    camera.rotation.z = (-props.bank * Math.PI) / 180
    camera.rotation.x = (props.pitch * Math.PI) / 180

    const heightAboveField = (props.altitudeFt - props.fieldElevationFt) * 0.3048
    camera.position.y = Math.min(MAX_CAMERA_HEIGHT_M, Math.max(0, heightAboveField))

    if (runwayGroup) {
      runwayGroup.visible = props.nearRunway
      if (props.nearRunway && Number.isFinite(props.distanceToRunwayNm)) {
        const distanceM = Math.max(0, props.distanceToRunwayNm) * NM_TO_M
        const lateralOffset = Math.tan((props.runwayOffsetDeg * Math.PI) / 180) * distanceM
        runwayGroup.position.x = -lateralOffset
        runwayGroup.position.z = -(distanceM + RUNWAY_LENGTH_M / 2)
      }
    }

    renderer.render(scene, camera)
    animFrame = requestAnimationFrame(render)
  }
  animFrame = requestAnimationFrame(render)
})

onBeforeUnmount(() => {
  if (animFrame !== null) cancelAnimationFrame(animFrame)
  resizeObserver?.disconnect()
  renderer?.dispose()
})
</script>

<template>
  <div ref="canvasEl" class="w-full h-full" />
</template>
