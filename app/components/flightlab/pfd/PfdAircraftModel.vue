<template>
  <div ref="containerRef" class="pfd-aircraft-model" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps<{
  pitch: number
  bankAngle: number
  heading: number
  speed: number
  altitude: number
}>()

const containerRef = ref<HTMLDivElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let aircraft: THREE.Group | null = null
let cloudPlane: THREE.Mesh | null = null
let animFrameId: number | null = null
let resizeObserver: ResizeObserver | null = null

// Reactive targets for smooth interpolation
let targetPitchRad = 0
let targetBankRad = 0

function buildAircraft(): THREE.Group {
  // Three.js coords: X=right, Y=up, Z=toward viewer
  // Aircraft: nose toward -Z, wings along X, Y is up
  const group = new THREE.Group()

  const bodyColor = 0xdcdcdc
  const darkColor = 0x2a2a2a
  const engineColor = 0x555555

  // Fuselage — cylinder along Z axis (default cylinder is along Y, rotate to Z)
  const fuselageGeo = new THREE.CylinderGeometry(0.4, 0.35, 5, 12)
  const fuselageMat = new THREE.MeshStandardMaterial({ color: bodyColor })
  const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat)
  fuselage.rotation.x = Math.PI / 2 // rotate Y-cylinder to lie along Z
  group.add(fuselage)

  // Nose cone — pointing toward -Z (forward)
  const noseGeo = new THREE.ConeGeometry(0.35, 1, 12)
  const noseMat = new THREE.MeshStandardMaterial({ color: darkColor })
  const nose = new THREE.Mesh(noseGeo, noseMat)
  nose.rotation.x = Math.PI / 2 // cone tip points along -Z
  nose.position.set(0, 0, -3)
  group.add(nose)

  // Main wings — wide along X (wingspan), thin along Z (chord), very thin along Y
  const wingGeo = new THREE.BoxGeometry(4.5, 0.08, 0.6) // X=span, Y=thickness, Z=chord
  const wingMat = new THREE.MeshStandardMaterial({ color: bodyColor })
  const wings = new THREE.Mesh(wingGeo, wingMat)
  wings.position.set(0, 0, 0.2)
  group.add(wings)

  // Horizontal stabilizer — same orientation as wings, smaller
  const hStabGeo = new THREE.BoxGeometry(1.8, 0.06, 0.3) // X=span, Y=thick, Z=chord
  const hStabMat = new THREE.MeshStandardMaterial({ color: bodyColor })
  const hStab = new THREE.Mesh(hStabGeo, hStabMat)
  hStab.position.set(0, 0, 2.3)
  group.add(hStab)

  // Vertical stabilizer — tall along Y, along Z (chord)
  const vStabGeo = new THREE.BoxGeometry(0.06, 1.2, 0.6) // X=thin, Y=height, Z=chord
  const vStabMat = new THREE.MeshStandardMaterial({ color: bodyColor })
  const vStab = new THREE.Mesh(vStabGeo, vStabMat)
  vStab.position.set(0, 0.6, 2.1)
  group.add(vStab)

  // Engines (two, under each wing) — cylinders along Z
  const engineGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.8, 8)
  const engineMat = new THREE.MeshStandardMaterial({ color: engineColor })

  const engineLeft = new THREE.Mesh(engineGeo, engineMat)
  engineLeft.rotation.x = Math.PI / 2 // align along Z
  engineLeft.position.set(-1.5, -0.35, -0.2)
  group.add(engineLeft)

  const engineRight = new THREE.Mesh(engineGeo, engineMat)
  engineRight.rotation.x = Math.PI / 2 // align along Z
  engineRight.position.set(1.5, -0.35, -0.2)
  group.add(engineRight)

  return group
}

function initScene() {
  const container = containerRef.value
  if (!container) return

  const width = container.clientWidth
  const height = container.clientHeight

  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a5fb4)
  scene.fog = new THREE.Fog(0x62a0ea, 30, 80)

  // Camera — view from front-left, slightly above
  // Aircraft nose points -Z, so camera at +Z looks at front
  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200)
  camera.position.set(-4, 3, -6)
  camera.lookAt(0, 0, 0)

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 5)
  scene.add(directionalLight)

  // Aircraft
  aircraft = buildAircraft()
  scene.add(aircraft)

  // Cloud plane
  const cloudGeo = new THREE.PlaneGeometry(200, 200)
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  })
  cloudPlane = new THREE.Mesh(cloudGeo, cloudMat)
  cloudPlane.rotation.x = -Math.PI / 2
  cloudPlane.position.y = -8
  scene.add(cloudPlane)

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height)
  container.appendChild(renderer.domElement)

  // Resize observer
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width: w, height: h } = entry.contentRect
      if (w === 0 || h === 0) continue
      if (camera) {
        camera.aspect = w / h
        camera.updateProjectionMatrix()
      }
      renderer?.setSize(w, h)
    }
  })
  resizeObserver.observe(container)
}

function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor
}

function animate() {
  animFrameId = requestAnimationFrame(animate)

  if (aircraft) {
    // Aircraft: nose toward -Z, wings along X, Y is up
    // Pitch: rotate around X axis — positive pitch = nose up (rotates nose away from -Z toward +Y)
    aircraft.rotation.x = lerp(aircraft.rotation.x, targetPitchRad, 0.1)
    // Bank: rotate around Z axis — positive bank = right wing down
    aircraft.rotation.z = lerp(aircraft.rotation.z, -targetBankRad, 0.1)
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

function updateTargets() {
  targetPitchRad = (props.pitch * Math.PI) / 180
  targetBankRad = (props.bankAngle * Math.PI) / 180
}

watch(
  () => [props.pitch, props.bankAngle, props.heading, props.speed, props.altitude],
  () => {
    updateTargets()
  },
)

onMounted(() => {
  initScene()
  updateTargets()
  animate()
})

onBeforeUnmount(() => {
  // Cancel animation frame
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId)
    animFrameId = null
  }

  // Disconnect resize observer
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }

  // Dispose renderer
  if (renderer) {
    renderer.dispose()
    const canvas = renderer.domElement
    canvas.parentElement?.removeChild(canvas)
    renderer = null
  }

  // Dispose scene objects
  if (scene) {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => m.dispose())
        } else {
          object.material.dispose()
        }
      }
    })
    scene = null
  }

  camera = null
  aircraft = null
  cloudPlane = null
})
</script>

<style scoped>
.pfd-aircraft-model {
  width: 100%;
  height: 100%;
  min-height: 200px;
  overflow: hidden;
}
</style>
