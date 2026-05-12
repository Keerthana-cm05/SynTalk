import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function CTASection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="relative py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="glass-raised rounded-3xl p-12 md:p-16 text-center relative overflow-hidden border border-accent/12"
        >
          {/* Inner glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse, rgba(74, 127, 165, 0.12) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />

          <div className="relative z-10">
            <h2 className="font-display text-4xl md:text-5xl font-light text-text-primary mb-4 leading-tight">
              Ready to close the gap?
            </h2>
            <p className="text-text-secondary font-body text-base mb-10 max-w-lg mx-auto leading-relaxed">
              Join the SynTalk platform and experience gesture-first communication designed around
              the people who need it most.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/signup"
                className="group flex items-center gap-2 bg-accent hover:bg-accent-light transition-all duration-300 text-white px-8 py-4 rounded-xl font-medium text-sm tracking-wide shadow-lg shadow-accent/20"
              >
                Create Free Account
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="/login"
                className="text-text-secondary hover:text-text-primary transition-colors text-sm font-body"
              >
                Already have an account? Sign in →
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}