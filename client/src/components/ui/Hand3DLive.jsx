import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function FingerChain({ bendAmount, origin, spreadAngle, thickness = 0.055 }) {
  const seg1Ref    = useRef()
  const seg2Ref    = useRef()
  const seg3Ref    = useRef()
  const current    = useRef(0)
  const targetRef  = useRef(0)  // ← ref so useFrame always reads latest prop

  // Sync prop into ref every render
  targetRef.current = bendAmount

  useFrame(() => {
    // Lerp toward the latest target (read from ref, not stale closure)
    current.current = THREE.MathUtils.lerp(
      current.current,
      targetRef.current,
      0.25  // increased from 0.18 — snappier response
    )

    const b       = current.current
    const maxBend = Math.PI * 0.85  // increased from 0.78 — fuller bend

    if (seg1Ref.current) seg1Ref.current.rotation.x = b * maxBend * 0.42
    if (seg2Ref.current) seg2Ref.current.rotation.x = b * maxBend * 0.38
    if (seg3Ref.current) seg3Ref.current.rotation.x = b * maxBend * 0.20
  })

  const skin = '#c4956a'
  const mat  = <meshStandardMaterial color={skin} roughness={0.42} metalness={0.06} />
  const h1 = 0.26, h2 = 0.22, h3 = 0.18

  return (
    <group position={origin} rotation={[0, 0, spreadAngle]}>
      <mesh>
        <sphereGeometry args={[thickness * 1.05, 8, 8]} />
        {mat}
      </mesh>
      <group ref={seg1Ref}>
        <mesh position={[0, h1 / 2, 0]}>
          <capsuleGeometry args={[thickness, h1, 4, 8]} />
          {mat}
        </mesh>
        <group position={[0, h1, 0]}>
          <mesh><sphereGeometry args={[thickness * 0.95, 8, 8]} />{mat}</mesh>
          <group ref={seg2Ref}>
            <mesh position={[0, h2 / 2, 0]}>
              <capsuleGeometry args={[thickness * 0.88, h2, 4, 8]} />
              {mat}
            </mesh>
            <group position={[0, h2, 0]}>
              <mesh><sphereGeometry args={[thickness * 0.80, 8, 8]} />{mat}</mesh>
              <group ref={seg3Ref}>
                <mesh position={[0, h3 / 2, 0]}>
                  <capsuleGeometry args={[thickness * 0.72, h3, 4, 8]} />
                  {mat}
                </mesh>
                <mesh position={[0, h3, 0]}>
                  <sphereGeometry args={[thickness * 0.65, 8, 8]} />
                  {mat}
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}
function LiveHand({ fingerData, isConnected }) {
  const handRef = useRef()

  // fingers = [thumb(0.0 always), index(A0), middle(A1), ring(A2), pinky(A3)]
  const f = Array.isArray(fingerData) && fingerData.length === 5
    ? fingerData
    : [0, 0, 0, 0, 0]

  const FINGERS = [
    { bend: 0.15,  x: -0.30, spread:  0.50, thick: 0.060 }, // thumb — fixed, no sensor
    { bend: f[1],  x: -0.13, spread:  0.08, thick: 0.058 }, // index  ← A0
    { bend: f[2],  x:  0.00, spread:  0.00, thick: 0.058 }, // middle ← A1
    { bend: f[3],  x:  0.13, spread: -0.08, thick: 0.055 }, // ring   ← A2
    { bend: f[4],  x:  0.24, spread: -0.20, thick: 0.048 }, // pinky  ← A3
  ]

  useFrame((state) => {
    if (!handRef.current) return
    const t = state.clock.getElapsedTime()
    if (!isConnected) {
      handRef.current.position.y = Math.sin(t * 0.8) * 0.05
      handRef.current.rotation.y = Math.sin(t * 0.4) * 0.15
      handRef.current.rotation.z = Math.sin(t * 0.5) * 0.04
    } else {
      handRef.current.position.y = THREE.MathUtils.lerp(handRef.current.position.y, 0, 0.1)
      handRef.current.rotation.y = THREE.MathUtils.lerp(handRef.current.rotation.y, 0, 0.1)
      handRef.current.rotation.z = THREE.MathUtils.lerp(handRef.current.rotation.z, 0, 0.1)
    }
  })

  const palm = '#be8d61'
  const skin = '#c4956a'

  return (
    <group ref={handRef} position={[0, -0.1, 0]}>
      <mesh>
        <boxGeometry args={[0.62, 0.52, 0.16]} />
        <meshStandardMaterial color={palm} roughness={0.5} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <boxGeometry args={[0.58, 0.1, 0.14]} />
        <meshStandardMaterial color={skin} roughness={0.45} metalness={0.05} />
      </mesh>
      <mesh position={[0, -0.36, 0]}>
        <cylinderGeometry args={[0.22, 0.24, 0.24, 16]} />
        <meshStandardMaterial color={skin} roughness={0.5} metalness={0.04} />
      </mesh>
      {FINGERS.map((def, i) => (
        <FingerChain
          key={i}
          bendAmount={def.bend}
          origin={[def.x, 0.30, 0]}
          spreadAngle={def.spread}
          thickness={def.thick}
        />
      ))}
    </group>
  )
}

function Scene({ fingerData, isConnected }) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 6, 4]}   intensity={1.4} color="#f0e8d8" />
      <directionalLight position={[-4, 2, -3]} intensity={0.35} color="#4a7fa5" />
      <pointLight       position={[0, 4, 3]}   intensity={0.7}  color="#6a9fc5" />
      <pointLight       position={[0, -3, 2]}  intensity={0.2}  color="#c4956a" />
      <LiveHand fingerData={fingerData} isConnected={isConnected} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI * 0.75}
        rotateSpeed={0.5}
      />
    </>
  )
}

export default function Hand3DLive({ fingerData, accelData, isConnected }) {
  // f[1..4] are the actual sensor fingers
  const f = Array.isArray(fingerData) && fingerData.length === 5 ? fingerData : [0,0,0,0,0]

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0.5, 3.2], fov: 36 }}
        shadows={false}
        style={{ background: 'transparent' }}
      >
        <Scene fingerData={fingerData} isConnected={isConnected} />
      </Canvas>

      {/* Live finger value overlay — helps debug calibration */}
      {isConnected && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3"
          style={{
            background: 'rgba(12,12,15,0.75)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10,
            padding: '6px 14px',
          }}>
          {['I', 'M', 'R', 'P'].map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className="w-1.5 rounded-full"
                style={{
                  height: 24,
                  background: 'rgba(255,255,255,0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${(f[i + 1] || 0) * 100}%`,
                  background: 'linear-gradient(180deg, var(--accent-light), var(--accent))',
                  borderRadius: 4,
                  transition: 'height 0.1s',
                }} />
              </div>
              <span style={{
                fontSize: 9,
                fontFamily: 'JetBrains Mono',
                color: 'var(--text-muted)',
              }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}