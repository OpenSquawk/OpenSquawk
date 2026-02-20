<template>
  <div ref="containerRef" class="pfd-aircraft-model" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const props = defineProps<{
  pitch: number
  bankAngle: number
  heading: number
  speed: number
  altitude: number
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const modelUrls = ['/models/airplane-user.glb', '/models/Airplane.glb', '/models/a320.glb']
const cloudModelUrls = ['/models/cloud-user.glb', '/models/Cloud.glb']

const CLOUD_COUNT = 26
const CLOUD_AREA_X = 120
const CLOUD_AREA_Z = 150
const CLOUD_BASE_Y = -8

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let aircraft: THREE.Group | null = null
let cloudPlane: THREE.Mesh | null = null
let cloudField: THREE.Group | null = null
let animFrameId: number | null = null
let resizeObserver: ResizeObserver | null = null
let disposed = false
let lastFrameTime: number | null = null
let initialAltitude = props.altitude

// Reactive targets for smooth interpolation
let targetPitchRad = 0
let targetBankRad = 0

type CloudInstance = {
  object: THREE.Object3D
  baseY: number
  driftScale: number
}

const cloudInstances: CloudInstance[] = []

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

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function tuneCloudMaterial(material: THREE.Material) {
  if (
    material instanceof THREE.MeshStandardMaterial
    || material instanceof THREE.MeshPhongMaterial
    || material instanceof THREE.MeshLambertMaterial
    || material instanceof THREE.MeshBasicMaterial
  ) {
    material.transparent = true
    material.depthWrite = false
    material.opacity = Math.min(material.opacity, 0.74)
    material.color.multiplyScalar(1.05)
  }
}

function normalizeCloudModel(model: THREE.Object3D, targetSize = 10) {
  const box = new THREE.Box3().setFromObject(model)
  const size = new THREE.Vector3()
  box.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z)
  if (maxDim > 0) {
    model.scale.setScalar(targetSize / maxDim)
  }

  const centeredBox = new THREE.Box3().setFromObject(model)
  const center = new THREE.Vector3()
  centeredBox.getCenter(center)
  model.position.sub(center)

  model.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return
    if (Array.isArray(obj.material)) {
      obj.material.forEach(m => tuneCloudMaterial(m))
    } else {
      tuneCloudMaterial(obj.material)
    }
  })
}

function createFallbackCloudLayer() {
  if (!scene) return
  const cloudGeo = new THREE.PlaneGeometry(260, 260)
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  cloudPlane = new THREE.Mesh(cloudGeo, cloudMat)
  cloudPlane.rotation.x = -Math.PI / 2
  cloudPlane.position.y = CLOUD_BASE_Y
  scene.add(cloudPlane)
}

async function loadCloudField() {
  if (!scene || disposed) return

  const loader = new GLTFLoader()
  let cloudTemplate: THREE.Object3D | null = null

  for (const url of cloudModelUrls) {
    try {
      const gltf = await loader.loadAsync(url)
      cloudTemplate = gltf.scene
      break
    } catch {
      // Try next cloud model URL
    }
  }

  if (!cloudTemplate || disposed || !scene) {
    createFallbackCloudLayer()
    return
  }

  normalizeCloudModel(cloudTemplate, 10)
  cloudField = new THREE.Group()
  scene.add(cloudField)

  cloudInstances.length = 0
  for (let i = 0; i < CLOUD_COUNT; i++) {
    const cloud = cloudTemplate.clone(true)
    const baseY = CLOUD_BASE_Y + randomRange(-3.5, 8.5)
    const scale = randomRange(0.55, 1.45)
    cloud.scale.multiplyScalar(scale)
    cloud.position.set(
      randomRange(-CLOUD_AREA_X, CLOUD_AREA_X),
      baseY,
      randomRange(-CLOUD_AREA_Z, CLOUD_AREA_Z),
    )
    cloud.rotation.y = randomRange(0, Math.PI * 2)
    cloudField.add(cloud)
    cloudInstances.push({
      object: cloud,
      baseY,
      driftScale: randomRange(0.7, 1.55),
    })
  }
}

function centerAndScaleModel(model: THREE.Object3D, targetSize = 5) {
  const box = new THREE.Box3().setFromObject(model)
  const size = new THREE.Vector3()
  box.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z)
  if (maxDim > 0) {
    const scale = targetSize / maxDim
    model.scale.setScalar(scale)
  }

  const centeredBox = new THREE.Box3().setFromObject(model)
  const center = new THREE.Vector3()
  centeredBox.getCenter(center)
  model.position.sub(center)

  // glTF is usually +Z forward; our scene uses -Z as nose-forward.
  model.rotation.y = Math.PI
}

async function loadAircraftModel() {
  if (!aircraft || disposed) return

  const loader = new GLTFLoader()
  for (const url of modelUrls) {
    try {
      const gltf = await loader.loadAsync(url)
      if (!aircraft || disposed) return

      const model = gltf.scene
      centerAndScaleModel(model, 5)
      aircraft.clear()
      aircraft.add(model)
      return
    } catch {
      // Try next model URL
    }
  }

  if (!aircraft || disposed) return
  aircraft.clear()
  aircraft.add(buildAircraft())
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

  // Camera — chase-style view from behind and slightly above
  // Aircraft nose points -Z, so +Z is behind the aircraft
  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200)
  camera.position.set(0, 2.6, 8)
  camera.lookAt(0, 0.2, -2.2)

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 5)
  scene.add(directionalLight)

  // Aircraft (root group; model is loaded asynchronously)
  aircraft = new THREE.Group()
  scene.add(aircraft)

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

function updateCloudMotion(dt: number) {
  const speedFactor = Math.max(0.35, props.speed / 220)
  const driftSpeed = 9 * speedFactor
  const pitchRad = (props.pitch * Math.PI) / 180
  const verticalDrift = Math.sin(pitchRad) * driftSpeed * 0.4
  const altitudeOffset = (initialAltitude - props.altitude) * 0.008

  if (cloudInstances.length > 0) {
    for (const cloud of cloudInstances) {
      // Keep cloud flow always coming from ahead of the aircraft toward the viewer.
      cloud.object.position.z += driftSpeed * cloud.driftScale * dt

      const targetY = cloud.baseY + altitudeOffset
      cloud.object.position.y = lerp(cloud.object.position.y, targetY, 0.06)

      if (cloud.object.position.z > CLOUD_AREA_Z) {
        cloud.object.position.z = -CLOUD_AREA_Z
        cloud.object.position.x = randomRange(-CLOUD_AREA_X, CLOUD_AREA_X)
      }
    }
  } else if (cloudPlane) {
    cloudPlane.position.y = lerp(cloudPlane.position.y, CLOUD_BASE_Y + altitudeOffset, 0.05)
    cloudPlane.position.z += driftSpeed * dt * 0.25
    if (cloudPlane.position.z > 30) cloudPlane.position.z = -30
    cloudPlane.rotation.z += verticalDrift * dt * 0.002
  }
}

function animate(frameTime = 0) {
  animFrameId = requestAnimationFrame(animate)
  if (lastFrameTime === null) lastFrameTime = frameTime
  const dt = Math.min((frameTime - lastFrameTime) / 1000, 0.06)
  lastFrameTime = frameTime

  if (aircraft) {
    // Aircraft: nose toward -Z, wings along X, Y is up
    // Pitch: rotate around X axis — positive pitch = nose up (rotates nose away from -Z toward +Y)
    aircraft.rotation.x = lerp(aircraft.rotation.x, targetPitchRad, 0.1)
    // Bank: rotate around Z axis — positive bank = right wing down
    aircraft.rotation.z = lerp(aircraft.rotation.z, -targetBankRad, 0.1)
  }

  updateCloudMotion(dt)

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
  disposed = false
  lastFrameTime = null
  initialAltitude = props.altitude
  initScene()
  updateTargets()
  loadAircraftModel()
  loadCloudField()
  animate()
})

onBeforeUnmount(() => {
  disposed = true
  lastFrameTime = null
  cloudInstances.length = 0
  cloudField = null
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
