import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import * as THREE from 'three'

// ── Animated 3D Hand built from primitives ──────────────────────────
function Finger({ position, rotation, bendAmount, color, delay }) {
  const meshRef = useRef()
  const tipRef = useRef()

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (meshRef.current) {
      meshRef.current.rotation.x = bendAmount * Math.sin(t * 0.8 + delay) * 0.3
    }
    if (tipRef.current) {
      tipRef.current.rotation.x = bendAmount * Math.sin(t * 0.8 + delay) * 0.4
    }
  })

  return (
    <group position={position} rotation={rotation}>
      {/* Base knuckle */}
      <mesh ref={meshRef}>
        <capsuleGeometry args={[0.06, 0.22, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
        {/* Middle segment */}
        <group position={[0, 0.2, 0]}>
          <mesh ref={tipRef}>
            <capsuleGeometry args={[0.055, 0.18, 4, 8]} />
            <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
            {/* Tip */}
            <group position={[0, 0.18, 0]}>
              <mesh>
                <capsuleGeometry args={[0.048, 0.14, 4, 8]} />
                <meshStandardMaterial color={color} roughness={0.35} metalness={0.1} />
              </mesh>
            </group>
          </mesh>
        </group>
      </mesh>
    </group>
  )
}

function Hand3D() {
  const groupRef = useRef()
  const [phase, setPhase] = useState(0) // 0=rising, 1=waving, 2=open

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1200)
    const t2 = setTimeout(() => setPhase(2), 3200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()

    if (phase === 0) {
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y, -0.5, 0.04
      )
    } else if (phase === 1) {
      // Wave: rotate back and forth
      groupRef.current.rotation.z = Math.sin(t * 3) * 0.35
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y, 0, 0.05
      )
    } else {
      // Settle open
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z, 0, 0.06
      )
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y, 0, 0.05
      )
      // Gentle float
      groupRef.current.position.y += Math.sin(t * 1.2) * 0.003
    }
  })

  const skinColor = '#c4956a'
  const fingers = [
    { pos: [-0.22, 0.38, 0], rot: [0, 0, 0.18], bend: 0.3, delay: 0 },
    { pos: [-0.08, 0.42, 0], rot: [0, 0, 0.06], bend: 0.2, delay: 0.3 },
    { pos: [0.06, 0.40, 0],  rot: [0, 0, -0.06], bend: 0.25, delay: 0.5 },
    { pos: [0.20, 0.36, 0],  rot: [0, 0, -0.18], bend: 0.35, delay: 0.7 },
  ]

  return (
    <group ref={groupRef} position={[0, -2.5, 0]}>
      {/* Palm */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.55, 0.5, 0.14]} />
        <meshStandardMaterial color={skinColor} roughness={0.45} metalness={0.05} />
      </mesh>

      {/* Thumb */}
      <group position={[-0.32, 0.05, 0]} rotation={[0, 0, 0.7]}>
        <mesh>
          <capsuleGeometry args={[0.065, 0.18, 4, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} metalness={0.1} />
        </mesh>
        <group position={[0, 0.17, 0]}>
          <mesh>
            <capsuleGeometry args={[0.055, 0.14, 4, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.35} metalness={0.1} />
          </mesh>
        </group>
      </group>

      {/* Fingers */}
      {fingers.map((f, i) => (
        <Finger
          key={i}
          position={f.pos}
          rotation={f.rot}
          bendAmount={f.bend}
          color={skinColor}
          delay={f.delay}
        />
      ))}

      {/* Wrist */}
      <mesh position={[0, -0.34, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.2, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.5} metalness={0.05} />
      </mesh>
    </group>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} color="#e8d5c0" />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#4a7fa5" />
      <pointLight position={[0, 3, 2]} intensity={0.8} color="#6a9fc5" />
      <Hand3D />
    </>
  )
}

// ── Main WelcomeScreen component ─────────────────────────────────────
export default function WelcomeScreen({ userName, onComplete }) {
  const [stage, setStage] = useState(0)
  // stage 0 = black, 1 = hand rising, 2 = name appear, 3 = fade out

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 300)
    const t2 = setTimeout(() => setStage(2), 2500)
    const t3 = setTimeout(() => setStage(3), 4500)
    const t4 = setTimeout(() => onComplete(), 5400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onComplete])

  return (
    <AnimatePresence>
      {stage < 3 && (
        <motion.div
          key="welcome"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] bg-charcoal-950 flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background glow */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: stage >= 1 ? 1 : 0 }}
            transition={{ duration: 2 }}
            style={{
              background: 'radial-gradient(ellipse 60% 60% at 50% 60%, rgba(74, 127, 165, 0.12) 0%, transparent 70%)',
            }}
          />

          {/* 3D Hand Canvas */}
          <motion.div
            className="w-72 h-72 md:w-80 md:h-80"
            initial={{ opacity: 0 }}
            animate={{ opacity: stage >= 1 ? 1 : 0 }}
            transition={{ duration: 1 }}
          >
            <Canvas camera={{ position: [0, 0.5, 3], fov: 40 }}>
              <Scene />
            </Canvas>
          </motion.div>

          {/* Name + greeting */}
          <motion.div
            className="text-center mt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: stage >= 2 ? 1 : 0, y: stage >= 2 ? 0 : 20 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-text-muted text-sm font-mono tracking-widest uppercase mb-2">
              Welcome back
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-light text-gradient">
              {userName || 'there'}
            </h1>
          </motion.div>

          {/* Subtle loading bar */}
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 w-32 h-px bg-white/5 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: stage >= 1 ? 1 : 0 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-transparent via-accent to-transparent rounded-full"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}