import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Cpu, Radio, Zap, MessageSquare } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: <Cpu size={20} />,
    title: 'Wear the Glove',
    description: 'Flex sensors embedded in each finger measure precise bend angles. An MPU6050 accelerometer captures wrist orientation and movement dynamics in real time.',
  },
  {
    number: '02',
    icon: <Radio size={20} />,
    title: 'Transmit via Bluetooth',
    description: 'The HM-10 BLE module wirelessly streams raw sensor data to the SynTalk web platform. Latency is under 50ms — fast enough for natural conversation.',
  },
  {
    number: '03',
    icon: <Zap size={20} />,
    title: 'Recognize & Predict',
    description: 'Gesture data is processed through a trained neural network. MediaPipe handles skeletal hand tracking when using camera mode. Both modes can run simultaneously.',
  },
  {
    number: '04',
    icon: <MessageSquare size={20} />,
    title: 'Communicate',
    description: 'Recognized gestures are instantly converted to text and speech. AI sentence completion predicts what comes next — reducing the effort of full gesture sequences.',
  },
]

export default function HowItWorksSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="relative py-24 px-6" id="how-it-works">
      {/* Subtle bg line */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-px h-full bg-gradient-to-b from-transparent via-accent/8 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-px bg-accent/50" />
            <span className="text-xs font-mono text-text-accent tracking-widest uppercase">How It Works</span>
            <div className="w-8 h-px bg-accent/50" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-light text-text-primary">
            From gesture to voice —
            <br />
            <span className="italic text-text-secondary">in milliseconds.</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="glass-raised rounded-2xl p-6 relative group hover:border-accent/25 transition-all duration-300"
            >
              {/* Step number */}
              <div className="font-mono text-5xl font-light text-accent/10 absolute top-4 right-5 select-none leading-none">
                {step.number}
              </div>

              {/* Icon */}
              <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-accent-light border border-accent/20 mb-4">
                {step.icon}
              </div>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 -right-3 w-6 h-px bg-gradient-to-r from-accent/30 to-transparent z-10" />
              )}

              <h3 className="font-body font-medium text-text-primary mb-2 text-sm">{step.title}</h3>
              <p className="text-xs text-text-muted leading-relaxed font-body">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}