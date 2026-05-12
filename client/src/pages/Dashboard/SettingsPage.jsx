import { motion } from 'framer-motion'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="p-6 min-h-screen">
      <div className="mb-6">
        <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono', letterSpacing:'0.12em', textTransform:'uppercase' }}>
          Preferences
        </p>
        <h1 className="font-display font-light mt-1"
          style={{ fontSize:30, color:'var(--text-primary)' }}>
          Accessibility &amp; Settings
        </h1>
      </div>
      <motion.div
        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
        className="glass rounded-2xl p-16 text-center"
        style={{ border:'1px dashed rgba(255,255,255,0.08)' }}
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background:'rgba(74,127,165,0.1)', border:'1px solid rgba(74,127,165,0.2)' }}>
          <Settings size={22} style={{ color:'var(--accent-light)' }} />
        </div>
        <h3 className="font-display font-light mb-2"
          style={{ fontSize:22, color:'var(--text-primary)' }}>
          Settings
        </h3>
        <p style={{ fontSize:13, color:'var(--text-muted)', maxWidth:320, margin:'0 auto' }}>
          Font size, language, voice, hand mode, sensitivity — coming in Step 10.
        </p>
      </motion.div>
    </div>
  )
}