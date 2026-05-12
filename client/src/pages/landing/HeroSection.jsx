import { motion } from 'framer-motion'
import { ArrowRight, Wifi, Brain, Shield } from 'lucide-react'

const stagger = {
  animate: { transition: { staggerChildren: 0.12 } }
}

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }
}

const pill = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
}

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
      <motion.div
        className="max-w-5xl mx-auto text-center z-10 relative"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        {/* Badge */}
        <motion.div variants={pill} className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 border border-accent/20">
          <span className="w-2 h-2 rounded-full bg-accent-light animate-pulse" />
          <span className="text-xs font-mono text-text-accent tracking-widest uppercase">
            Final Year Project — ECE + AI
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          className="font-display text-6xl md:text-8xl font-light leading-[0.95] tracking-tight mb-6"
        >
          <span className="text-gradient">Speak Without</span>
          <br />
          <span className="text-text-primary italic font-light">Words.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={fadeUp}
          className="font-body text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-4 leading-relaxed font-light"
        >
          SynTalk bridges the communication gap between mute and non-mute people using
          smart wearable hardware, machine learning, and real-time gesture recognition.
        </motion.p>

        <motion.p
          variants={fadeUp}
          className="font-body text-sm text-text-muted max-w-xl mx-auto mb-10 leading-relaxed"
        >
          A sign language is not a limitation — it's a language. SynTalk makes it universally understood.
        </motion.p>

        {/* CTA Row */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="/signup"
            className="group flex items-center gap-2 bg-accent hover:bg-accent-light transition-all duration-300 text-white px-8 py-4 rounded-xl font-medium text-sm tracking-wide shadow-lg shadow-accent/20"
          >
            Begin Your Journey
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
          </a>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 glass hover:border-accent/30 transition-all duration-300 text-text-secondary hover:text-text-primary px-8 py-4 rounded-xl font-medium text-sm tracking-wide border border-white/8"
          >
            See How It Works
          </a>
        </motion.div>

        {/* Stat Row */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12"
        >
          {[
            { icon: <Wifi size={15} />, label: 'Real-time BLE', sub: 'Hardware mode' },
            { icon: <Brain size={15} />, label: 'MediaPipe ML', sub: 'Camera mode' },
            { icon: <Shield size={15} />, label: 'Emergency SOS', sub: 'Safety system' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-lg glass-raised flex items-center justify-center text-accent-light border border-accent/15 flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <div className="text-xs font-medium text-text-primary">{item.label}</div>
                <div className="text-xs text-text-muted">{item.sub}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Bottom scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-px h-12 bg-gradient-to-b from-transparent to-accent/40" />
        <div className="w-1 h-1 rounded-full bg-accent/50" />
      </motion.div>
    </section>
  )
}