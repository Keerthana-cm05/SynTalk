import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Hand, Camera, Cpu, MessageCircle, ShieldAlert,
  Settings, BarChart3, Languages
} from 'lucide-react'

const features = [
  {
    icon: <Hand size={18} />,
    title: 'Smart Glove Hardware',
    description: 'Flex sensors on all 5 fingers + MPU6050 accelerometer for 3D wrist tracking. Captures subtle movement that cameras miss.',
    tag: 'Hardware',
  },
  {
    icon: <Camera size={18} />,
    title: 'Camera ML Mode',
    description: 'MediaPipe Hands + TensorFlow.js for completely hardware-free gesture recognition directly in-browser. No installation required.',
    tag: 'ML',
  },
  {
    icon: <Cpu size={18} />,
    title: 'Hybrid Mode',
    description: 'Combine both hardware and camera predictions for significantly higher accuracy and redundancy. Best of both worlds.',
    tag: 'AI',
  },
  {
    icon: <MessageCircle size={18} />,
    title: 'AI Sentence Completion',
    description: 'AI predicts and completes sentences from partial gestures. Reduces signing effort by up to 60% in natural conversation.',
    tag: 'AI',
  },
  {
    icon: <ShieldAlert size={18} />,
    title: 'Emergency SOS System',
    description: 'Configure a secret emergency gesture. On detection, a 10-second countdown triggers and automatically alerts emergency contacts.',
    tag: 'Safety',
  },
  {
    icon: <Settings size={18} />,
    title: 'Personalized Training',
    description: 'Train the system on your own gestures. Custom gesture mapping saves your unique signing style and adapts to you.',
    tag: 'ML',
  },
  {
    icon: <BarChart3 size={18} />,
    title: 'Real-time Analytics',
    description: 'Live sensor graphs, prediction confidence scores, historical accuracy trends, and conversation replays.',
    tag: 'Data',
  },
  {
    icon: <Languages size={18} />,
    title: 'Multi-language Support',
    description: 'Support for ISL (Indian Sign Language), ASL, BSL and more. Language packs expand the recognition vocabulary.',
    tag: 'Accessibility',
  },
]

const tagColors = {
  Hardware: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  ML: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  AI: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  Safety: 'bg-red-500/10 text-red-300 border-red-500/20',
  Data: 'bg-green-500/10 text-green-300 border-green-500/20',
  Accessibility: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
}

export default function FeaturesSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="relative py-24 px-6" id="features">
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
            <span className="text-xs font-mono text-text-accent tracking-widest uppercase">Features</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-light text-text-primary max-w-lg">
            Every layer working{' '}
            <span className="italic text-text-secondary">in concert.</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="glass rounded-xl p-5 group hover:border-accent/25 hover:bg-surface-raised/50 transition-all duration-300 border border-white/5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-light group-hover:bg-accent/15 transition-colors duration-300">
                  {feat.icon}
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${tagColors[feat.tag]}`}>
                  {feat.tag}
                </span>
              </div>
              <h3 className="font-body font-medium text-text-primary text-sm mb-1.5">{feat.title}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{feat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}