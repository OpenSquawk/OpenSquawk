<script setup lang="ts">
// Very simple abstract "look outside" view: sky, ground, and a runway strip
// when the aircraft is close to one. No real airport geometry — see
// docs/plans/2026-07-16-websim-design.md (explicitly out of scope for v1).

const props = defineProps<{
  pitch: number
  bank: number
  nearRunway: boolean
  /** Signed degrees the runway centerline sits left(-)/right(+) of the nose. */
  runwayOffsetDeg: number
}>()

const canvasEl = ref<HTMLElement | null>(null)
let renderer: any = null
let scene: any = null
let camera: any = null
let runwayMesh: any = null
let animFrame: number | null = null
let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  const THREE = await import('three')
  const el = canvasEl.value
  if (!el) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#5b9bd5')

  camera = new THREE.PerspectiveCamera(65, el.clientWidth / Math.max(1, el.clientHeight), 0.1, 20000)
  camera.position.set(0, 0, 0)

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

  runwayMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 3000),
    new THREE.MeshBasicMaterial({ color: '#4a4a52' }),
  )
  runwayMesh.rotation.x = -Math.PI / 2
  runwayMesh.position.set(0, -1.69, -1500)
  runwayMesh.visible = false
  scene.add(runwayMesh)

  const haze = new THREE.Mesh(
    new THREE.SphereGeometry(15000, 16, 16),
    new THREE.MeshBasicMaterial({ color: '#5b9bd5', side: THREE.BackSide, transparent: true, opacity: 0.6 }),
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

    if (runwayMesh) {
      runwayMesh.visible = props.nearRunway
      const lateralOffset = Math.tan((props.runwayOffsetDeg * Math.PI) / 180) * 1500
      runwayMesh.position.x = -lateralOffset
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
