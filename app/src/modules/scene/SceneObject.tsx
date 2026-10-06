import { Component, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, type ReactNode } from 'react'
import { ThreeEvent, useFrame } from '@react-three/fiber'
import { PositionalAudio } from '@react-three/drei'
import { CuboidCollider, RigidBody, useRapier, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { ObjectRenderMode, type WorldObjectAsset, type WorldObjectPhysics } from '../../types/world'
import { useAudioStore } from '../../store/audio'
import { useSceneObjectVisual } from './useSceneObjectVisual'
import { WORLD_COLLIDER_QUERY_TAG } from '../collider/WorldCollider'

export const OBJECT_SCALE = 0.5
const OBJECT_AUTO_ROTATE_Y_SPEED = 0.35

const COLLIDER_WIREFRAME_COLOR = 0x00aaff

type PointerHandler = (event: ThreeEvent<PointerEvent>) => boolean
type HoverHandler = (event: ThreeEvent<PointerEvent>, objectId: string, hovering: boolean) => void
type ClickHandler = (worldPos: THREE.Vector3) => void

const _rotation = new THREE.Quaternion()
const _cameraDelta = new THREE.Vector3()
const _runtimeFocusOffset = new THREE.Vector3()
// Enable temporarily when inspecting gg01 follower ground-hit decisions.
const GG01_FOLLOWER_TELEMETRY_ENABLED = false
const TELEMETRY_INTERVAL_SECONDS = 0.5
const TELEMETRY_MOVEMENT_DISTANCE_SQ = 0.0025
// Probe from 0.5 above the current feet to 0.5 below them.
const TELEMETRY_RAY_HEIGHT_ABOVE_FEET = 0.5
const TELEMETRY_RAY_LENGTH = 1
const FOLLOWER_MIN_SURFACE_NORMAL_Y = 0.9
const FOLLOWER_MAX_HEIGHT_DIFFERENCE = 0.3
export const SCENE_OBJECT_INSTANCE_ID_KEY = 'sceneObjectInstanceId'

export interface SceneObjectHandle {
  id: string
  rigidBody: RapierRigidBody | null
  initialPosition: THREE.Vector3
  initialRotation: THREE.Quaternion
  bounds: THREE.Box3
  getFocusPoint: (target: THREE.Vector3) => THREE.Vector3
  playInteractionSfx: () => void
}

interface Props {
  object: WorldObjectAsset
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
  physics?: WorldObjectPhysics
  runtimeCameraFollow?: boolean
  renderMode: ObjectRenderMode
  autoRotateY?: boolean
  onHover: HoverHandler
  onClick?: ClickHandler
  onPointerDown?: PointerHandler
  onPointerMove?: PointerHandler
  onPointerUp?: PointerHandler
  onPointerCancel?: PointerHandler
}

interface SfxLoadErrorBoundaryProps {
  url: string
  children: ReactNode
}

interface SfxLoadErrorBoundaryState {
  hasError: boolean
}

class SfxLoadErrorBoundary extends Component<SfxLoadErrorBoundaryProps, SfxLoadErrorBoundaryState> {
  state: SfxLoadErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): SfxLoadErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.warn(`Skipping object SFX "${this.props.url}" because it failed to load.`, error)
  }

  componentDidUpdate(prevProps: SfxLoadErrorBoundaryProps) {
    if (prevProps.url !== this.props.url && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

export const SceneObject = forwardRef<SceneObjectHandle, Props>(function SceneObject(
  {
    object,
    position,
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
    physics = 'rigidbody',
    runtimeCameraFollow = false,
    renderMode,
    autoRotateY = false,
    onHover,
    onClick,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  },
  ref,
) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const runtimeGroupRef = useRef<THREE.Group>(null)
  const visualGroupRef = useRef<THREE.Group>(null)
  const colliderProxyRef = useRef<THREE.Mesh>(null)
  const sfxRefs = useRef<Array<THREE.PositionalAudio | null>>([])
  const lastSfxIndexRef = useRef<number | null>(null)
  const previousCameraPositionRef = useRef<THREE.Vector3 | null>(null)
  const lastTelemetryTimeRef = useRef(0)
  const lastTelemetryPositionRef = useRef<THREE.Vector3 | null>(null)
  const muted = useAudioStore((s) => s.muted)
  const { rapier, world } = useRapier()
  const isStatic = physics === 'static' || physics === 'ghost'
  const usesBoxCollider = physics === 'rigidbody' || physics === 'static'
  const initialPosition = useMemo(() => new THREE.Vector3(...position), [position])
  const initialRotation = useMemo(() => new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)), [rotation])
  const { scene, wireframeOverlayScene, offset, size, bounds } = useSceneObjectVisual({
    asset: object,
    renderMode,
  })
  const colliderCenter = useMemo(
    () => new THREE.Vector3(0, (size.y * OBJECT_SCALE) / 2, 0),
    [size],
  )
  const colliderUserData = useMemo(() => ({
    [SCENE_OBJECT_INSTANCE_ID_KEY]: object.id,
  }), [object.id])
  const colliderHalfExtents = useMemo(
    () => new THREE.Vector3(
      Math.max((size.x * OBJECT_SCALE) / 2, 0.01),
      Math.max((size.y * OBJECT_SCALE) / 2, 0.01),
      Math.max((size.z * OBJECT_SCALE) / 2, 0.01),
    ),
    [size],
  )
  const colliderWireframeMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: COLLIDER_WIREFRAME_COLOR,
    wireframe: true,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    fog: false,
  }), [])

  useFrame((state, delta) => {
    if (runtimeCameraFollow && runtimeGroupRef.current) {
      const previousCameraPosition = previousCameraPositionRef.current
      if (previousCameraPosition) {
        runtimeGroupRef.current.position.add(_cameraDelta.subVectors(state.camera.position, previousCameraPosition).setY(0))
      }
      if (previousCameraPosition) previousCameraPosition.copy(state.camera.position)
      else previousCameraPositionRef.current = state.camera.position.clone()

      const runtimePosition = runtimeGroupRef.current.position
      const girlYBefore = runtimePosition.y
      const elapsed = state.clock.elapsedTime
      const lastTelemetryPosition = lastTelemetryPositionRef.current
      const movedSinceLastLog = !lastTelemetryPosition
        || runtimePosition.distanceToSquared(lastTelemetryPosition) >= TELEMETRY_MOVEMENT_DISTANCE_SQ
      const rayOrigin = {
        x: runtimePosition.x,
        y: runtimePosition.y + TELEMETRY_RAY_HEIGHT_ABOVE_FEET,
        z: runtimePosition.z,
      }
      const hit = world.castRayAndGetNormal(
        new rapier.Ray(rayOrigin, { x: 0, y: -1, z: 0 }),
        TELEMETRY_RAY_LENGTH,
        false,
        undefined,
        undefined,
        undefined,
        undefined,
        (collider) => {
          const userData = collider.parent()?.userData as Record<string, unknown> | undefined
          return userData?.[WORLD_COLLIDER_QUERY_TAG] === true
        },
      )
      const hitY = hit ? rayOrigin.y - hit.timeOfImpact : null
      const heightDifference = hitY === null ? null : hitY - girlYBefore
      const rejectionReason = !hit
        ? 'no-world-collider-hit'
        : !Number.isFinite(hitY) || !Number.isFinite(hit.normal.y)
          ? 'non-finite-hit'
          : hit.normal.y < FOLLOWER_MIN_SURFACE_NORMAL_Y
            ? 'surface-not-upward-enough'
            : Math.abs(heightDifference!) > FOLLOWER_MAX_HEIGHT_DIFFERENCE
              ? 'height-difference-too-large'
              : null
      const accepted = rejectionReason === null && hitY !== null
      if (accepted) runtimePosition.y = hitY
      if (GG01_FOLLOWER_TELEMETRY_ENABLED && movedSinceLastLog && elapsed - lastTelemetryTimeRef.current >= TELEMETRY_INTERVAL_SECONDS) {
        console.info('[gg01 follower telemetry]', {
          girlX: runtimePosition.x,
          girlY: runtimePosition.y,
          girlYBefore,
          girlZ: runtimePosition.z,
          cameraY: state.camera.position.y,
          hitY,
          heightDifference,
          accepted,
          adoptedY: accepted ? hitY : null,
          rejectionReason,
          surfaceNormal: hit ? { x: hit.normal.x, y: hit.normal.y, z: hit.normal.z } : null,
          hitColliderHandle: hit?.collider.handle ?? null,
          rayOriginY: rayOrigin.y,
          rayLength: TELEMETRY_RAY_LENGTH,
          queryTarget: 'WorldCollider only',
        })
        lastTelemetryTimeRef.current = elapsed
        lastTelemetryPositionRef.current = runtimePosition.clone()
      }
    }
    if (autoRotateY && visualGroupRef.current) {
      visualGroupRef.current.rotation.y += delta * OBJECT_AUTO_ROTATE_Y_SPEED
    }
  })

  useEffect(() => {
    previousCameraPositionRef.current = null
  }, [runtimeCameraFollow])

  useEffect(() => {
    colliderWireframeMaterial.opacity = 0
    colliderWireframeMaterial.transparent = true
    colliderWireframeMaterial.depthTest = false
    colliderWireframeMaterial.depthWrite = false
    colliderWireframeMaterial.needsUpdate = true
  }, [colliderWireframeMaterial])

  useEffect(() => {
    sfxRefs.current.length = object.sfxUrls.length
  }, [object.sfxUrls.length])

  useEffect(() => {
    if (!muted) return
    sfxRefs.current.forEach((sound) => {
      if (!sound) return
      sound.setVolume(0)
      if (sound.isPlaying) sound.stop()
    })
  }, [muted])

  const playRandomSfx = useCallback(() => {
    if (muted || object.sfxUrls.length === 0) return

    const lastIndex = lastSfxIndexRef.current
    let nextIndex = 0
    if (object.sfxUrls.length > 1) {
      nextIndex = Math.floor(Math.random() * (object.sfxUrls.length - 1))
      if (lastIndex !== null && nextIndex >= lastIndex) nextIndex += 1
    }

    const sound = sfxRefs.current[nextIndex]
    if (!sound) return

    lastSfxIndexRef.current = nextIndex
    sound.setVolume(1)
    if (sound.isPlaying) sound.stop()

    const play = () => sound.play()
    if (sound.context.state === 'suspended') {
      sound.context.resume().then(play).catch(() => {})
      return
    }
    play()
  }, [muted, object.sfxUrls.length])

  useEffect(() => {
    const body = rigidBodyRef.current
    if (!body) return
    body.setTranslation({ x: position[0], y: position[1], z: position[2] }, true)
    _rotation.setFromEuler(new THREE.Euler(...rotation))
    body.setRotation({ x: _rotation.x, y: _rotation.y, z: _rotation.z, w: _rotation.w }, true)
    body.setLinvel({ x: 0, y: 0, z: 0 }, true)
    body.setAngvel({ x: 0, y: 0, z: 0 }, true)
    body.wakeUp()
  }, [position, rotation, scale])

  useEffect(() => {
    return () => {
      colliderWireframeMaterial.dispose()
    }
  }, [colliderWireframeMaterial])

  useImperativeHandle(
    ref,
    () => ({
      id: object.id,
      get rigidBody() {
        return rigidBodyRef.current
      },
      initialPosition,
      initialRotation,
      bounds,
      getFocusPoint: (target) => {
        if (runtimeGroupRef.current) {
          return runtimeGroupRef.current.getWorldPosition(target).add(_runtimeFocusOffset.set(
            colliderCenter.x * scale[0],
            colliderCenter.y * scale[1],
            colliderCenter.z * scale[2],
          ))
        }
        if (colliderProxyRef.current) return colliderProxyRef.current.getWorldPosition(target)
        return target.copy(initialPosition).add(colliderCenter)
      },
      playInteractionSfx: playRandomSfx,
    }),
    [bounds, colliderCenter, initialPosition, initialRotation, object.id, playRandomSfx, scale],
  )

  const visualContent = (
    <group ref={visualGroupRef} scale={[OBJECT_SCALE * scale[0], OBJECT_SCALE * scale[1], OBJECT_SCALE * scale[2]]}>
      <primitive object={scene} position={offset} dispose={null} />
      {renderMode === ObjectRenderMode.ShadedWireframe && (
        <primitive object={wireframeOverlayScene} position={offset} dispose={null} />
      )}
      {object.sfxUrls.map((url, index) => (
        <SfxLoadErrorBoundary key={url} url={url}>
          <PositionalAudio
            ref={(audio) => {
              sfxRefs.current[index] = audio
            }}
            url={url}
            distance={2}
            loop={false}
          />
        </SfxLoadErrorBoundary>
      ))}
    </group>
  )

  if (runtimeCameraFollow) {
    return (
      <group ref={runtimeGroupRef} position={position} rotation={rotation}>
        {visualContent}
      </group>
    )
  }

  return (
    <RigidBody
      ref={rigidBodyRef}
      type={isStatic ? 'fixed' : 'dynamic'}
      colliders={false}
      position={position}
      rotation={rotation}
      linearDamping={0.45}
      angularDamping={0.35}
      additionalSolverIterations={4}
      ccd
      canSleep
    >
      {usesBoxCollider && (
        <CuboidCollider
          args={[
            colliderHalfExtents.x * scale[0],
            colliderHalfExtents.y * scale[1],
            colliderHalfExtents.z * scale[2],
          ]}
          position={[colliderCenter.x * scale[0], colliderCenter.y * scale[1], colliderCenter.z * scale[2]]}
        />
      )}
      <mesh
        ref={colliderProxyRef}
        position={[colliderCenter.x * scale[0], colliderCenter.y * scale[1], colliderCenter.z * scale[2]]}
        material={colliderWireframeMaterial}
        renderOrder={10000}
        userData={colliderUserData}
        onPointerOver={(event) => {
          event.stopPropagation()
          onHover(event, object.id, true)
        }}
        onPointerOut={(event) => {
          event.stopPropagation()
          onHover(event, object.id, false)
        }}
        onClick={(event) => {
          event.stopPropagation()
          onClick?.(event.point.clone())
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return
          event.stopPropagation()
          if (!onPointerDown?.(event)) playRandomSfx()
        }}
        onPointerMove={(event) => {
          onHover(event, object.id, true)
          onPointerMove?.(event)
        }}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <boxGeometry args={[
          colliderHalfExtents.x * scale[0] * 2,
          colliderHalfExtents.y * scale[1] * 2,
          colliderHalfExtents.z * scale[2] * 2,
        ]} />
      </mesh>
      {visualContent}
    </RigidBody>
  )
})
