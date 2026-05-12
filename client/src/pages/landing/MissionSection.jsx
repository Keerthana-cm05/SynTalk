import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Heart } from 'lucide-react'

export default function MissionSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="relative py-28 px-6" id="mission">
      {/* Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[600px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(74, 127, 165, 0.07) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl glass-raised border border-accent/20 mb-8 mx-auto">
            <Heart size={20} className="text-accent-light" />
          </div>

          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-px bg-accent/50" />
            <span className="text-xs font-mono text-text-accent tracking-widest uppercase">Our Mission</span>
            <div className="w-8 h-px bg-accent/50" />
          </div>

          <h2 className="font-display text-4xl md:text-6xl font-light leading-tight text-text-primary mb-6">
            Technology should adapt{' '}
            <br />
            <span className="italic text-text-secondary">to people.</span>
          </h2>

          <p className="text-text-secondary font-body text-base leading-relaxed mb-4">
            SynTalk was built with one belief: no one should feel isolated because of how they communicate.
            Sign language is rich, expressive, and deeply human. Our platform exists to translate
            that richness into any language, in real time — without requiring anyone to change
            the way they speak.
          </p>

          <p className="text-text-muted font-body text-sm leading-relaxed">
            Built by an Electronics and Communication Engineering student with a vision to combine
            hardware, AI, and human-centered design — for the people who need it most.
          </p>
        </motion.div>
      </div>
    </section>
  )
}