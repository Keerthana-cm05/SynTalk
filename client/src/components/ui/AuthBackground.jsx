import { motion } from 'framer-motion'

export default function AuthBackground() {
  return (
    <>
      {/* Base gradient */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(30, 60, 90, 0.45) 0%, transparent 70%)',
        }}
      />

      {/* Left orb */}
      <motion.div
        className="fixed pointer-events-none z-0 rounded-full"
        style={{
          width: 500,
          height: 500,
          top: '-100px',
          left: '-200px',
          background: 'radial-gradient(circle, rgba(30, 70, 110, 0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          y: [0, -25, 0],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Right orb */}
      <motion.div
        className="fixed pointer-events-none z-0 rounded-full"
        style={{
          width: 450,
          height: 450,
          bottom: '-50px',
          right: '-150px',
          background: 'radial-gradient(circle, rgba(20, 55, 90, 0.18) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }}
        animate={{
          y: [0, 20, 0],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />

      {/* Center glow */}
      <motion.div
        className="fixed pointer-events-none z-0 rounded-full"
        style={{
          width: 300,
          height: 300,
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(74, 127, 165, 0.06) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(10, 10, 11, 0.85) 100%)',
        }}
      />
    </>
  )
}