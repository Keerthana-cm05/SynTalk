import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence }     from 'framer-motion'
import { Canvas, useFrame }            from '@react-three/fiber'
import * as THREE                      from 'three'

function Finger({ targetRef, origin, spread, r }) {
  const j1  = useRef(), j2 = useRef(), j3 = useRef()
  const cur = useRef(0)

  useFrame(() => {
    cur.current = THREE.MathUtils.lerp(cur.current, targetRef.current, 0.18)
    const b = cur.current * (Math.PI * 0.80)
    if (j1.current) j1.current.rotation.x = b * 0.42
    if (j2.current) j2.current.rotation.x = b * 0.36
    if (j3.current) j3.current.rotation.x = b * 0.22
  })

  const skin = '#c4956a'
  const mat  = <meshStandardMaterial color={skin} roughness={0.40} metalness={0.06}/>

  return (
    <group position={origin} rotation={[0,0,spread]}>
      <mesh><sphereGeometry args={[r*1.1,8,8]}/>{mat}</mesh>
      <group ref={j1}>
        <mesh position={[0,0.13,0]}><capsuleGeometry args={[r,0.25,4,8]}/>{mat}</mesh>
        <group position={[0,0.26,0]}>
          <mesh><sphereGeometry args={[r*0.92,8,8]}/>{mat}</mesh>
          <group ref={j2}>
            <mesh position={[0,0.11,0]}><capsuleGeometry args={[r*0.86,0.21,4,8]}/>{mat}</mesh>
            <group position={[0,0.22,0]}>
              <mesh><sphereGeometry args={[r*0.78,8,8]}/>{mat}</mesh>
              <group ref={j3}>
                <mesh position={[0,0.09,0]}><capsuleGeometry args={[r*0.68,0.17,4,8]}/>{mat}</mesh>
                <mesh position={[0,0.17,0]}><sphereGeometry args={[r*0.60,8,8]}/>{mat}</mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

function WelcomeHand({ phase }) {
  const root   = useRef()
  const elTime = useRef(0)

  // Targets for each finger
  const T = [
    useRef(0.15),  // thumb
    useRef(0),     // index
    useRef(0),     // middle
    useRef(0),     // ring
    useRef(0),     // pinky
  ]

  useEffect(() => {
    if (phase === 'wave') {
      // Wave animation — fingers open/close sequentially
    }
  }, [phase])

  useFrame((_, delta) => {
    if (!root.current) return
    elTime.current += delta

    const t = elTime.current

    if (phase === 'rising') {
      root.current.position.y = THREE.MathUtils.lerp(root.current.position.y, -0.1, 0.04)
    } else if (phase === 'wave') {
      root.current.position.y = THREE.MathUtils.lerp(root.current.position.y, 0.05, 0.05)
      // Wave fingers sequentially
      root.current.rotation.z = Math.sin(t * 3.5) * 0.3
      T[1].current = 0.5 + 0.5 * Math.sin(t * 4.0 + 0.0)
      T[2].current = 0.5 + 0.5 * Math.sin(t * 4.0 + 0.3)
      T[3].current = 0.5 + 0.5 * Math.sin(t * 4.0 + 0.6)
      T[4].current = 0.5 + 0.5 * Math.sin(t * 4.0 + 0.9)
    } else if (phase === 'open') {
      root.current.position.y = THREE.MathUtils.lerp(root.current.position.y, 0, 0.05)
      root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, 0, 0.06)
      T[1].current = 0
      T[2].current = 0
      T[3].current = 0
      T[4].current = 0
      // Gentle float
      root.current.position.y += Math.sin(t * 1.2) * 0.003
    }
  })

  return (
    <group ref={root} position={[0,-3,0]}>
      {/* Palm */}
      <mesh>
        <boxGeometry args={[0.60,0.50,0.14]}/>
        <meshStandardMaterial color="#be8d61" roughness={0.5} metalness={0.04}/>
      </mesh>
      <mesh position={[0,0.23,0]}>
        <boxGeometry args={[0.56,0.10,0.12]}/>
        <meshStandardMaterial color="#c4956a" roughness={0.45} metalness={0.05}/>
      </mesh>
      <mesh position={[0,-0.33,0]}>
        <cylinderGeometry args={[0.20,0.22,0.22,16]}/>
        <meshStandardMaterial color="#c4956a" roughness={0.5} metalness={0.04}/>
      </mesh>

      <Finger targetRef={T[0]} origin={[-0.28,0.08,0]} spread={ 0.68} r={0.057}/>
      <Finger targetRef={T[1]} origin={[-0.15,0.28,0]} spread={ 0.08} r={0.055}/>
      <Finger targetRef={T[2]} origin={[-0.03,0.29,0]} spread={ 0.00} r={0.055}/>
      <Finger targetRef={T[3]} origin={[ 0.09,0.28,0]} spread={-0.08} r={0.052}/>
      <Finger targetRef={T[4]} origin={[ 0.20,0.25,0]} spread={-0.17} r={0.045}/>
    </group>
  )
}

export default function WelcomeScreen({ userName, onComplete }) {
  const [phase,    setPhase]    = useState('rising')
  const [showName, setShowName] = useState(false)
  const [exiting,  setExiting]  = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('wave'),  1200)
    const t2 = setTimeout(() => { setPhase('open'); setShowName(true) }, 3000)
    const t3 = setTimeout(() => setExiting(true),   5200)
    const t4 = setTimeout(() => onComplete(),        6200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onComplete])

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      style={{ background:'#0c0c0f' }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 1.0, ease:[0.22,1,0.36,1] }}
    >
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity:0 }}
        animate={{ opacity: exiting ? 0 : 0.85 }}
        transition={{ duration:2.5, delay:0.5 }}
        style={{
          background:'radial-gradient(ellipse 55% 55% at 50% 65%, rgba(74,127,165,0.16) 0%, transparent 70%)',
        }}
      />

      {/* Shimmer lines */}
      {[0,1,2].map(i => (
        <motion.div key={i}
          className="absolute w-full h-px pointer-events-none"
          style={{ top:`${28 + i*18}%` }}
          initial={{ scaleX:0, opacity:0 }}
          animate={{ scaleX:1, opacity:[0,0.10,0] }}
          transition={{ duration:3, delay:0.8+i*0.3, repeat:Infinity, repeatDelay:2 }}>
          <div className="w-full h-full"
            style={{ background:'linear-gradient(90deg,transparent,rgba(74,127,165,0.5),transparent)' }}/>
        </motion.div>
      ))}

      {/* 3D Hand */}
      <motion.div
        className="w-72 h-72 md:w-80 md:h-80"
        initial={{ opacity:0 }} animate={{ opacity:1 }}
        transition={{ duration:0.8, delay:0.2 }}
      >
        <Canvas
          camera={{ position:[0,0.4,3.2], fov:38 }}
          shadows={false}
          style={{ background:'transparent' }}
        >
          <ambientLight intensity={0.55}/>
          <directionalLight position={[3,6,4]}   intensity={1.4} color="#f0e8d8"/>
          <directionalLight position={[-4,2,-3]} intensity={0.36} color="#4a7fa5"/>
          <pointLight       position={[0,4,3]}   intensity={0.7}  color="#6a9fc5"/>
          <WelcomeHand phase={phase}/>
        </Canvas>
      </motion.div>

      {/* Name reveal */}
      <motion.div
        className="text-center mt-2 select-none"
        initial={{ opacity:0, y:20 }}
        animate={{ opacity: showName ? 1 : 0, y: showName ? 0 : 20 }}
        transition={{ duration:1.0, ease:[0.22,1,0.36,1] }}
      >
        <p style={{
          fontSize:11, color:'var(--text-muted)',
          fontFamily:'JetBrains Mono', letterSpacing:'0.3em',
          textTransform:'uppercase', marginBottom:12,
        }}>
          Welcome back
        </p>
        <h1 className="font-display font-light text-gradient"
          style={{ fontSize:56, lineHeight:1 }}>
          {userName || 'there'}
        </h1>
      </motion.div>

      {/* Progress shimmer */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-36 h-0.5 rounded-full overflow-hidden"
        style={{ background:'rgba(255,255,255,0.05)' }}
        initial={{ opacity:0 }} animate={{ opacity:1 }}
        transition={{ delay:0.6 }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background:'linear-gradient(90deg,transparent,var(--accent-light),transparent)' }}
          initial={{ x:'-100%' }} animate={{ x:'200%' }}
          transition={{ duration:1.8, repeat:Infinity, ease:'easeInOut' }}
        />
      </motion.div>

      {/* Skip button */}
      <motion.button
        className="absolute bottom-10 right-8 font-mono tracking-widest transition-colors"
        style={{
          fontSize:11, color:'var(--text-muted)',
          background:'none', border:'none', cursor:'pointer',
        }}
        initial={{ opacity:0 }} animate={{ opacity:0.5 }}
        transition={{ delay:1.5 }}
        onClick={() => { setExiting(true); setTimeout(onComplete, 600) }}
        onMouseEnter={e => e.currentTarget.style.color='var(--text-secondary)'}
        onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}
      >
        SKIP →
      </motion.button>
    </motion.div>
  )
}