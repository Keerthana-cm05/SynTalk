import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

// Floating orb component
function Orb({ style, delay = 0, duration = 12 }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={style}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, 0],
        scale: [1, 1.08, 1],
        opacity: [style.opacity * 0.7, style.opacity, style.opacity * 0.7],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// Canvas particle system
function ParticleCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animFrameId
    let particles = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Create particles
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        radius: Math.random() * 1.2 + 0.3,
        opacity: Math.random() * 0.4 + 0.1,
        pulse: Math.random() * Math.PI * 2,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        // Update
        p.x += p.vx
        p.y += p.vy
        p.pulse += 0.012

        // Wrap
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        // Pulsing opacity
        const opacity = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse))

        // Draw
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(106, 159, 197, ${opacity})`
        ctx.fill()
      })

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(74, 127, 165, ${0.06 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animFrameId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  )
}

export default function AnimatedBackground() {
  return (
    <>
      {/* Deep base gradient */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(30, 60, 90, 0.5) 0%, transparent 70%)',
        }}
      />

      {/* Orbs */}
      <Orb
        delay={0}
        duration={14}
        style={{
          width: 600,
          height: 600,
          top: '-200px',
          left: '-150px',
          background: 'radial-gradient(circle, rgba(30, 70, 110, 0.22) 0%, transparent 70%)',
          opacity: 0.8,
          filter: 'blur(40px)',
        }}
      />
      <Orb
        delay={3}
        duration={18}
        style={{
          width: 500,
          height: 500,
          top: '30%',
          right: '-150px',
          background: 'radial-gradient(circle, rgba(20, 55, 90, 0.20) 0%, transparent 70%)',
          opacity: 0.7,
          filter: 'blur(50px)',
        }}
      />
      <Orb
        delay={6}
        duration={16}
        style={{
          width: 400,
          height: 400,
          bottom: '10%',
          left: '20%',
          background: 'radial-gradient(circle, rgba(40, 80, 120, 0.18) 0%, transparent 70%)',
          opacity: 0.6,
          filter: 'blur(60px)',
        }}
      />
      <Orb
        delay={2}
        duration={22}
        style={{
          width: 300,
          height: 300,
          top: '60%',
          left: '60%',
          background: 'radial-gradient(circle, rgba(74, 127, 165, 0.12) 0%, transparent 70%)',
          opacity: 0.5,
          filter: 'blur(40px)',
        }}
      />

      {/* Horizontal light bands */}
      <motion.div
        className="fixed pointer-events-none z-0"
        style={{
          width: '100%',
          height: '1px',
          top: '35%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(74, 127, 165, 0.08) 20%, rgba(74, 127, 165, 0.15) 50%, rgba(74, 127, 165, 0.08) 80%, transparent 100%)',
        }}
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="fixed pointer-events-none z-0"
        style={{
          width: '100%',
          height: '1px',
          top: '70%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(74, 127, 165, 0.05) 30%, rgba(74, 127, 165, 0.10) 50%, rgba(74, 127, 165, 0.05) 70%, transparent 100%)',
        }}
        animate={{ opacity: [0.5, 0.2, 0.5] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />

      {/* Particle canvas */}
      <ParticleCanvas />

      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(10, 10, 11, 0.7) 100%)',
        }}
      />
    </>
  )
}