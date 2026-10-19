import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { getDestinationVector } from '../utils/globe'

const categoryColors = {
  natureza: 0x65d6b0,
  praia: 0x4dd8f0,
  cultura: 0xf6bd60,
  cidade: 0x9eabff,
  aventura: 0xff8e72,
}

function disposeGroup(group) {
  group.traverse((object) => {
    object.geometry?.dispose()
    if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose())
    else object.material?.dispose()
  })
  group.clear()
}

export default function GlobeCanvas({ destinations, allDestinations, selectedDestinationId, routeDestinationIds, autoRotate, onSelectDestination, onStatus, controlsRef }) {
  const hostRef = useRef(null)
  const onSelectRef = useRef(onSelectDestination)
  const onStatusRef = useRef(onStatus)
  const selectedIdRef = useRef(selectedDestinationId)
  const routeIdsRef = useRef(routeDestinationIds)
  const autoRotateRef = useRef(autoRotate)
  const destinationsRef = useRef(destinations)
  const allDestinationsRef = useRef(allDestinations)
  const scenePartsRef = useRef(null)

  useEffect(() => {
    onSelectRef.current = onSelectDestination
    onStatusRef.current = onStatus
    selectedIdRef.current = selectedDestinationId
    routeIdsRef.current = routeDestinationIds
    autoRotateRef.current = autoRotate
    destinationsRef.current = destinations
    allDestinationsRef.current = allDestinations
  }, [allDestinations, autoRotate, destinations, onSelectDestination, onStatus, routeDestinationIds, selectedDestinationId])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    let renderer
    let animationFrame
    let resizeObserver
    let texture
    let disposed = false
    let dragging = false
    let didDrag = false
    let pinching = false
    let previousX = 0
    let previousY = 0
    let lastFocusedId = null
    let resetting = false
    let lastRouteSignature = ''
    let targetCameraZ = 6.8
    let pinchStartDistance = 0
    let pinchStartZoom = 6.8
    const activePointers = new Map()
    const pointer = new THREE.Vector2()
    const raycaster = new THREE.Raycaster()
    const targetQuaternion = new THREE.Quaternion()
    const worldUp = new THREE.Vector3(0, 1, 0)
    const front = new THREE.Vector3(0, 0, 1)
    let previousFrameTime = performance.now()
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
      renderer.setSize(host.clientWidth, host.clientHeight)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15
      renderer.domElement.className = 'globe-canvas'
      renderer.domElement.setAttribute('aria-label', 'Globo terrestre tridimensional interativo. Arraste para girar e use a roda do mouse para aproximar.')
      renderer.domElement.setAttribute('role', 'img')
      host.appendChild(renderer.domElement)
    } catch {
      onStatusRef.current?.('Seu navegador não conseguiu iniciar o WebGL. A lista de destinos continua disponível abaixo.')
      return undefined
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, host.clientWidth / Math.max(host.clientHeight, 1), 0.1, 100)
    camera.position.set(0, 0, 6.8)
    const world = new THREE.Group()
    const markers = new THREE.Group()
    const routes = new THREE.Group()
    scene.add(world)
    world.add(markers, routes)
    scenePartsRef.current = { world, markers, routes, camera }

    const ambient = new THREE.HemisphereLight(0x9acbff, 0x101b38, 1.35)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.25)
    keyLight.position.set(-4, 2.5, 5)
    const fillLight = new THREE.DirectionalLight(0x53a9ff, 0.62)
    fillLight.position.set(4, -2, -4)
    scene.add(ambient, keyLight, fillLight)

    const earthGeometry = new THREE.SphereGeometry(2, 96, 64)
    const earthMaterial = new THREE.MeshPhongMaterial({ color: 0x416e8b, shininess: 14, specular: new THREE.Color(0x18344a) })
    const earth = new THREE.Mesh(earthGeometry, earthMaterial)
    earth.userData.isEarth = true
    world.add(earth)

    const atmosphereGeometry = new THREE.SphereGeometry(2.08, 64, 48)
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: 'varying vec3 vNormal; varying vec3 vViewPosition; void main(){ vNormal=normalize(normalMatrix*normal); vec4 mvPosition=modelViewMatrix*vec4(position,1.0); vViewPosition=-mvPosition.xyz; gl_Position=projectionMatrix*mvPosition; }',
      fragmentShader: 'varying vec3 vNormal; varying vec3 vViewPosition; void main(){ float intensity=pow(0.72-dot(normalize(vNormal),normalize(vViewPosition)),2.2); gl_FragColor=vec4(0.18,0.58,1.0,intensity*0.42); }',
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
    world.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial))

    const loader = new THREE.TextureLoader()
    loader.load('/textures/earth-topography.jpg', (loadedTexture) => {
      if (disposed) {
        loadedTexture.dispose()
        return
      }
      texture = loadedTexture
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4)
      earthMaterial.map = texture
      earthMaterial.color.set(0xffffff)
      earthMaterial.needsUpdate = true
      onStatusRef.current?.('ready')
    }, undefined, () => {
      if (!disposed) onStatusRef.current?.('A textura detalhada não pôde ser carregada. Exibindo uma esfera simplificada; os destinos continuam interativos.')
    })

    function syncRoutes() {
      const ids = routeIdsRef.current
      const signature = ids.join('|')
      if (signature === lastRouteSignature) return
      lastRouteSignature = signature
      disposeGroup(routes)
      const routeDestinations = ids.map((id) => allDestinationsRef.current.find((destination) => destination.id === id)).filter(Boolean)
      if (routeDestinations.length < 2) return
      for (let index = 0; index < routeDestinations.length - 1; index += 1) {
        const start = new THREE.Vector3(...getDestinationVector(routeDestinations[index].latitude, routeDestinations[index].longitude, 2.02))
        const end = new THREE.Vector3(...getDestinationVector(routeDestinations[index + 1].latitude, routeDestinations[index + 1].longitude, 2.02))
        const middle = start.clone().add(end).normalize().multiplyScalar(2.45 + start.angleTo(end) * 0.18)
        const curve = new THREE.QuadraticBezierCurve3(start, middle, end)
        const geometry = new THREE.TubeGeometry(curve, 48, 0.012, 6, false)
        const material = new THREE.MeshBasicMaterial({ color: 0x55e6e6, transparent: true, opacity: 0.86 })
        routes.add(new THREE.Mesh(geometry, material))
      }
    }

    function focusDestination(destination) {
      if (!destination) return
      resetting = false
      const [x, y, z] = getDestinationVector(destination.latitude, destination.longitude, 1)
      const currentDirection = new THREE.Vector3(x, y, z).applyQuaternion(world.quaternion).normalize()
      const correction = new THREE.Quaternion().setFromUnitVectors(currentDirection, front)
      targetQuaternion.copy(correction.multiply(world.quaternion.clone()))
      lastFocusedId = destination.id
    }

    if (controlsRef) {
      controlsRef.current = {
        zoom: (amount) => { targetCameraZ = THREE.MathUtils.clamp(targetCameraZ + amount, 5.2, 9.2) },
        reset: () => {
          targetCameraZ = 6.8
          targetQuaternion.identity()
          resetting = true
          lastFocusedId = null
          selectedIdRef.current = null
        },
        focus: focusDestination,
      }
    }

    function onPointerDown(event) {
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (activePointers.size >= 2) {
        const points = [...activePointers.values()]
        pinchStartDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
        pinchStartZoom = targetCameraZ
        pinching = true
        dragging = false
        didDrag = true
        renderer.domElement.setPointerCapture(event.pointerId)
        return
      }
      dragging = true
      didDrag = false
      previousX = event.clientX
      previousY = event.clientY
      renderer.domElement.setPointerCapture(event.pointerId)
    }

    function onPointerMove(event) {
      if (activePointers.has(event.pointerId)) activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (pinching && activePointers.size >= 2) {
        const points = [...activePointers.values()]
        const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
        targetCameraZ = THREE.MathUtils.clamp(pinchStartZoom * pinchStartDistance / Math.max(distance, 1), 5.2, 9.2)
        return
      }
      if (!dragging) return
      const dx = event.clientX - previousX
      const dy = event.clientY - previousY
      if (Math.abs(dx) + Math.abs(dy) > 2) didDrag = true
      const yaw = new THREE.Quaternion().setFromAxisAngle(worldUp, dx * 0.006)
      const pitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * 0.006)
      world.quaternion.premultiply(yaw).premultiply(pitch).normalize()
      previousX = event.clientX
      previousY = event.clientY
    }

    function onPointerUp(event) {
      activePointers.delete(event.pointerId)
      if (pinching) {
        if (activePointers.size < 2) pinching = false
        dragging = false
        return
      }
      if (!dragging) return
      dragging = false
      if (didDrag) return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects([...markers.children, earth], false)[0]
      if (hit?.object.userData.destination) onSelectRef.current?.(hit.object.userData.destination)
    }

    function onWheel(event) {
      event.preventDefault()
      targetCameraZ = THREE.MathUtils.clamp(targetCameraZ + event.deltaY * 0.004, 5.2, 9.2)
    }

    function onContextLost(event) {
      event.preventDefault()
      onStatusRef.current?.('A sessão gráfica foi interrompida. Atualize a página para tentar novamente; a lista de destinos permanece acessível.')
    }

    const canvas = renderer.domElement
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('webglcontextlost', onContextLost)

    function resize() {
      if (!host.clientWidth || !host.clientHeight) return
      camera.aspect = host.clientWidth / host.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(host.clientWidth, host.clientHeight)
    }
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)

    function animate() {
      animationFrame = requestAnimationFrame(animate)
      const currentFrameTime = performance.now()
      const delta = Math.min((currentFrameTime - previousFrameTime) / 1000, 0.05)
      previousFrameTime = currentFrameTime
      if (document.hidden) return
      camera.position.z += (targetCameraZ - camera.position.z) * (1 - Math.exp(-delta * 8))
      syncRoutes()
      if (selectedIdRef.current && selectedIdRef.current !== lastFocusedId) {
        const destination = destinationsRef.current.find((item) => item.id === selectedIdRef.current)
        if (destination) focusDestination(destination)
      }
      if (!selectedIdRef.current) lastFocusedId = null
      if (selectedIdRef.current || resetting) {
        if (reduceMotion) world.quaternion.copy(targetQuaternion)
        else world.quaternion.slerp(targetQuaternion, 1 - Math.exp(-delta * 2.6))
        if (resetting && Math.abs(world.quaternion.dot(targetQuaternion)) > 0.9999) resetting = false
      }
      if (autoRotateRef.current && !dragging && !selectedIdRef.current && !resetting && !reduceMotion) {
        world.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(worldUp, delta * 0.035))
      }
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(animationFrame)
      resizeObserver?.disconnect()
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      texture?.dispose()
      if (controlsRef) controlsRef.current = null
      disposeGroup(world)
      renderer.dispose()
      renderer.domElement.remove()
      scenePartsRef.current = null
    }
  }, [controlsRef])

  useEffect(() => {
    const parts = scenePartsRef.current
    if (!parts) return
    disposeGroup(parts.markers)
    destinations.forEach((destination) => {
      const selected = destination.id === selectedDestinationId
      const color = categoryColors[destination.categoria] || 0x5de0e6
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(selected ? 0.075 : 0.055, 16, 12),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: selected ? 0.95 : 0.48, roughness: 0.35 }),
      )
      marker.position.set(...getDestinationVector(destination.latitude, destination.longitude, 2.025))
      marker.userData.destination = destination
      parts.markers.add(marker)
      const halo = new THREE.Mesh(new THREE.SphereGeometry(selected ? 0.12 : 0.09, 12, 10), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: selected ? 0.19 : 0.09, depthWrite: false }))
      halo.position.copy(marker.position)
      halo.userData.destination = destination
      parts.markers.add(halo)
    })
  }, [destinations, selectedDestinationId])

  return <div ref={hostRef} className="globe-stage" />
}
