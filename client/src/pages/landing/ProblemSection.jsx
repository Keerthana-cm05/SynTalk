import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

function AnimatedStat({ value, label, delay }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      <div className="font-display text-5xl md:text-6xl font-light text-gradient mb-2">{value}</div>
      <div className="text-sm text-text-muted font-body max-w-[160px] mx-auto leading-relaxed">{label}</div>
    </motion.div>
  )
}

export default function ProblemSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="relative py-24 px-6" id="problem">
      <div className="max-w-6xl mx-auto">
        {/* Label */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, x: -20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex items-center gap-3 mb-12"
        >
          <div className="w-8 h-px bg-accent/50" />
          <span className="text-xs font-mono text-text-accent tracking-widest uppercase">The Problem</span>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-4xl md:text-5xl font-light leading-tight mb-6 text-text-primary"
            >
              70 million people sign.{' '}
              <span className="italic text-text-secondary">The world doesn't listen.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-text-secondary font-body text-base leading-relaxed mb-4"
            >
              Over 70 million deaf and mute individuals worldwide use sign language as their primary form of
              communication. Yet in everyday life — at hospitals, schools, workplaces, and public spaces —
              there is almost no real-time translation available.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-text-muted font-body text-sm leading-relaxed"
            >
              SynTalk eliminates this gap. Using a combination of smart glove hardware, on-device machine
              learning, and AI-powered sentence completion — gestures are instantly converted into
              natural spoken language.
            </motion.p>
          </div>

          {/* Right — stats */}
          <div className="grid grid-cols-2 gap-8">
            <AnimatedStat value="70M+" label="people use sign language globally" delay={0.2} />
            <AnimatedStat value="98%" label="lack access to real-time interpreters" delay={0.3} />
            <AnimatedStat value="3x" label="slower communication without assistive tech" delay={0.4} />
            <AnimatedStat value="0" label="mainstream real-time sign translation tools" delay={0.5} />
          </div>
        </div>
      </div>
    </section>
  )
}