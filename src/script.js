import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { Pane } from 'tweakpane'
import * as dat from 'dat.gui'
import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl'
import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'
/**
 * Canvas
 */
const canvas = document.querySelector('canvas.webgl')
/**
 * Loader 
 */
// Debug
const debugObject = {}
const gui = new dat.GUI({
    width: 400
})

// Texture Loader 
const textureLoader = new THREE.TextureLoader()
// Draco Loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')
// GLTF Loader
const glftLoader = new GLTFLoader()
glftLoader.setDRACOLoader(dracoLoader)

/**
 * Textures
 */
const bakedTexture = textureLoader.load('resources/baked.jpg')
bakedTexture.flipY = false
bakedTexture.encoding = THREE.sRGBEncoding

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
camera.position.z = 2
camera.position.y = 1
/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
/**
 * Scene
 */
const scene = new THREE.Scene()
/**
 * Light
 */
const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
scene.add(directionalLight)
/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding

debugObject.clearColor = '#2f2927'
renderer.setClearColor(debugObject.clearColor)
gui.addColor(debugObject, 'clearColor').onChange(() =>
{
    renderer.setClearColor(debugObject.clearColor)
})

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update aspect ratio of the screen
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Update fireflies
    firefliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Model & Object
 */
/**
 * Fireflies
 */
// Geometry
const firefliesGeometry = new THREE.BufferGeometry()
const firefliesCount = 30
const positionArray = new Float32Array(firefliesCount * 3)
const scaleArray = new Float32Array(firefliesCount)

for(let i = 0;i < firefliesCount; i++)
{
    positionArray[i * 3 + 0] = (Math.random() - 0.5) * 8
    positionArray[i * 3 + 1] = Math.random() * 1.5
    positionArray[i * 3 + 2] = (Math.random() - 0.5) * 8

    scaleArray[i] = Math.random()
}

firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3))
firefliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1))

// Material
const firefliesMaterial = new THREE.ShaderMaterial({
    depthWrite: false,  // ทำให้ไม่ทับกัน
    blending: THREE.AdditiveBlending,
    transparent: true,
    uniforms: 
    {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 100 }
    },
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragmentShader     
})
gui.add(firefliesMaterial.uniforms.uSize, 'value').min(0).max(500).step(1).name('firefliesSize')

// Points
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial)
scene.add(fireflies)



/**
 * Materials
 */
// Baked material
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })




// Portal Light material
debugObject.portalColorStart = '#7d9d45'
debugObject.portalColorEnd = '#19340d'

gui.addColor(debugObject, 'portalColorStart')
.onChange(() =>
{
    portalLightMaterial.uniforms.uColorStart.value.set(debugObject.portalColorStart)
})
gui.addColor(debugObject, 'portalColorEnd')
.onChange(() =>
{
    portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd)
})

const portalLightMaterial = new THREE.ShaderMaterial({
    uniforms: 
    {
        uTime: { value: 0 },
        uColorStart: { value: new THREE.Color(debugObject.portalColorStart) },
        uColorEnd: { value: new THREE.Color(debugObject.portalColorEnd)}
    },
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader
})



// Pole light material
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5 })

// model GLTF
glftLoader.load('resources/portal.glb', (gltf) => 
{
    const bakedMesh = gltf.scene.children.find(child => child.name === 'baked')
    const portalLightMesh = gltf.scene.children.find(child => child.name === 'portal')
    const poleLightAMesh = gltf.scene.children.find(child => child.name === 'poleLightA')
    const poleLightBMesh = gltf.scene.children.find(child => child.name === 'poleLightB')

    bakedMesh.material = bakedMaterial
    portalLightMesh.material = portalLightMaterial
    poleLightAMesh.material = poleLightMaterial
    poleLightBMesh.material = poleLightMaterial

    scene.add(gltf.scene);
})



const clock = new THREE.Clock() // Uses 'performance.now' similar to Date.now but much accurate

function frameAnimateLoop()
{
    const elapsedTime = clock.getElapsedTime()

    // update materials 
    firefliesMaterial.uniforms.uTime.value = elapsedTime
    
    // update portal
    portalLightMaterial.uniforms.uTime.value = elapsedTime


    // Renderer scene & camera
    renderer.render(scene, camera)

    // OrbitControls
    controls.update()

    // Use instead of window.requestAnimationFrame
    renderer.setAnimationLoop(frameAnimateLoop)
}

frameAnimateLoop()