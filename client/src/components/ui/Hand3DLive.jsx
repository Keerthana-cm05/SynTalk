import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function Finger({ targetRef, px, pz, spread, r }) {
  const j1  = useRef()
  const j2  = useRef()
  const j3  = useRef()
  const cur = useRef(0)

  useFrame(() => {
    // Read target from ref — always fresh, no stale prop issue
    cur.current = THREE.MathUtils.lerp(cur.current, targetRef.current, 0.20)
    const b = cur.current * (Math.PI * 0.80)   // up to ~144°

    if (j1.current) j1.current.rotation.x = b * 0.42
    if (j2.current) j2.current.rotation.x = b * 0.36
    if (j3.current) j3.current.rotation.x = b * 0.22
  })

  const skin = '#c4956a'
  const mat  = <meshStandardMaterial color={skin} roughness={0.4} metalness={0.05}/>

  return (
    <group position={[px, pz, 0]} rotation={[0, 0, spread]}>
      <mesh><sphereGeometry args={[r*1.1, 8, 8]}/>{mat}</mesh>
      <group ref={j1}>
        <mesh position={[0, 0.13, 0]}><capsuleGeometry args={[r, 0.25, 4, 8]}/>{mat}</mesh>
        <group position={[0, 0.26, 0]}>
          <mesh><sphereGeometry args={[r*0.92, 8, 8]}/>{mat}</mesh>
          <group ref={j2}>
            <mesh position={[0, 0.11, 0]}><capsuleGeometry args={[r*0.86, 0.21, 4, 8]}/>{mat}</mesh>
            <group position={[0, 0.22, 0]}>
              <mesh><sphereGeometry args={[r*0.78, 8, 8]}/>{mat}</mesh>
              <group ref={j3}>
                <mesh position={[0, 0.09, 0]}><capsuleGeometry args={[r*0.68, 0.17, 4, 8]}/>{mat}</mesh>
                <mesh position={[0, 0.17, 0]}><sphereGeometry args={[r*0.60, 8, 8]}/>{mat}</mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

function HandScene({ fingerData, connected }) {
  const root = useRef()

  // ── Write bend targets to refs every render ────────────────────────
  // This is the key — React props update refs synchronously,
  // useFrame reads them fresh. No stale closure. No lag.
  const f = Array.isArray(fingerData) && fingerData.length === 5
    ? fingerData : [0, 0, 0, 0, 0]

  // One ref per finger
  const T = [useRef(0), useRef(0), useRef(0), useRef(0), useRef(0)]
  T[0].current = 0.12          // thumb — fixed, no sensor
  T[1].current = f[1]          // index  ← A0
  T[2].current = f[2]          // middle ← A1
  T[3].current = f[3]          // ring   ← A2
  T[4].current = f[4]          // pinky  ← A3

  useFrame(({ clock }) => {
    if (!root.current) return
    const t = clock.getElapsedTime()
    if (!connected) {
      root.current.position.y = Math.sin(t * 0.85) * 0.055
      root.current.rotation.y = Math.sin(t * 0.40) * 0.12
    } else {
      root.current.position.y = THREE.MathUtils.lerp(root.current.position.y, 0, 0.08)
      root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, 0, 0.08)
    }
  })

  return (
    <group ref={root} position={[0, -0.15, 0]}>
      {/* Palm */}
      <mesh>
        <boxGeometry args={[0.60, 0.50, 0.14]}/>
        <meshStandardMaterial color="#be8d61" roughness={0.5} metalness={0.04}/>
      </mesh>
      {/* Knuckle row */}
      <mesh position={[0, 0.23, 0]}>
        <boxGeometry args={[0.56, 0.10, 0.12]}/>
        <meshStandardMaterial color="#c4956a" roughness={0.45} metalness={0.05}/>
      </mesh>
      {/* Wrist */}
      <mesh position={[0, -0.33, 0]}>
        <cylinderGeometry args={[0.20, 0.22, 0.22, 16]}/>
        <meshStandardMaterial color="#c4956a" roughness={0.5} metalness={0.04}/>
      </mesh>

      {/* Thumb  — position=[palmX, palmY, 0], spread=rotation on Z */}
      <Finger targetRef={T[0]} px={-0.28} pz={0.08} spread={ 0.68} r={0.057}/>
      {/* Index */}
      <Finger targetRef={T[1]} px={-0.15} pz={0.28} spread={ 0.08} r={0.055}/>
      {/* Middle */}
      <Finger targetRef={T[2]} px={-0.03} pz={0.29} spread={ 0.00} r={0.055}/>
      {/* Ring */}
      <Finger targetRef={T[3]} px={ 0.09} pz={0.28} spread={-0.08} r={0.052}/>
      {/* Pinky */}
      <Finger targetRef={T[4]} px={ 0.20} pz={0.25} spread={-0.17} r={0.045}/>
    </group>
  )
}

export default function Hand3DLive({ fingerData, isConnected }) {
  const f = Array.isArray(fingerData) && fingerData.length === 5
    ? fingerData : [0, 0, 0, 0, 0]

  return (
    <div style={{ position:'relative', width:'100%', height:'100%' }}>
      <Canvas
        camera={{ position:[0, 0.3, 2.8], fov:40 }}
        shadows={false}
        style={{ background:'transparent' }}
      >
        <ambientLight intensity={0.55}/>
        <directionalLight position={[3,6,4]}   intensity={1.4} color="#f0e8d8"/>
        <directionalLight position={[-4,2,-3]} intensity={0.36} color="#4a7fa5"/>
        <pointLight        position={[0,4,3]}  intensity={0.65} color="#6a9fc5"/>

        <HandScene fingerData={fingerData} connected={isConnected}/>

        <OrbitControls
          enablePan={false} enableZoom={false}
          minPolarAngle={Math.PI/4} maxPolarAngle={Math.PI*0.75}
          rotateSpeed={0.45}
        />
      </Canvas>

      {/* Finger bars overlay */}
      {isConnected && (
        <div style={{
          position:'absolute', bottom:12, left:'50%',
          transform:'translateX(-50%)',
          display:'flex', alignItems:'flex-end', gap:8,
          padding:'8px 14px', borderRadius:12,
          background:'rgba(8,8,12,0.82)',
          border:'1px solid rgba(255,255,255,0.08)',
          pointerEvents:'none',
        }}>
          {[
            { label:'I', val:f[1] },
            { label:'M', val:f[2] },
            { label:'R', val:f[3] },
            { label:'P', val:f[4] },
          ].map(({ label, val }) => (
            <div key={label}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
              {/* Track */}
              <div style={{
                width:13, height:36, borderRadius:4,
                background:'rgba(255,255,255,0.07)',
                position:'relative', overflow:'hidden',
              }}>
                {/* Fill — grows from bottom */}
                <div style={{
                  position:'absolute',
                  bottom:0, left:0, right:0,
                  height:`${Math.max(3, val * 100)}%`,
                  background: val > 0.6
                    ? 'linear-gradient(180deg,#4ade80,#22c55e)'
                    : val > 0.25
                    ? 'linear-gradient(180deg,#6a9fc5,#4a7fa5)'
                    : 'rgba(255,255,255,0.20)',
                  borderRadius:4,
                  transition:'height 0.05s linear',
                }}/>
              </div>
              <span style={{
                fontSize:9, fontFamily:'JetBrains Mono',
                color:'rgba(255,255,255,0.35)',
                letterSpacing:'0.04em',
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}