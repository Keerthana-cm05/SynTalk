import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const stack = [
  { category: 'Frontend', items: ['React.js', 'Tailwind CSS', 'Framer Motion', 'Three.js / R3F'] },
  { category: 'Machine Learning', items: ['TensorFlow.js', 'MediaPipe Hands', 'OpenCV', 'Custom CNN'] },
  { category: 'Hardware', items: ['Arduino Uno', 'Flex Sensors ×5', 'MPU6050 IMU', 'HM-10 BLE', 'LCD Display'] },
  { category: 'Backend & Auth', items: ['Node.js + Express', 'Firebase Auth', 'Firestore DB', 'Firebase Storage'] },
]

export default function TechnologySection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="relative py-24 px-6" id="technology">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(20, 55, 90, 0.15) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-accent/50" />
            <span className="text-xs font-mono text-text-accent tracking-widest uppercase">Technology</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-light text-text-primary">
            Built on a solid,{' '}
            <span className="italic text-text-secondary">full-stack foundation.</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stack.map((col, i) => (
            <motion.div
              key={col.category}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="glass-raised rounded-2xl p-6"
            >
              <div className="text-xs font-mono text-accent tracking-widest uppercase mb-4 pb-3 border-b border-white/5">
                {col.category}
              </div>
              <ul className="space-y-2.5">
                {col.items.map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <div className="w-1 h-1 rounded-full bg-accent/60 flex-shrink-0" />
                    <span className="text-sm text-text-secondary font-body">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}