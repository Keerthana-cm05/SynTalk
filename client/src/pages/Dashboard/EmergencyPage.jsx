import { motion } from 'framer-motion'
import { ShieldAlert } from 'lucide-react'

export default function EmergencyPage() {
  return (
    <div className="p-6 min-h-screen">
      <div className="mb-6">
        <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono', letterSpacing:'0.12em', textTransform:'uppercase' }}>
          Safety System
        </p>
        <h1 className="font-display font-light mt-1"
          style={{ fontSize:30, color:'var(--text-primary)' }}>
          Emergency &amp; SOS
        </h1>
      </div>
      <motion.div
        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
        className="glass rounded-2xl p-16 text-center"
        style={{ border:'1px dashed rgba(239,68,68,0.15)' }}
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.18)' }}>
          <ShieldAlert size={22} style={{ color:'#fca5a5' }} />
        </div>
        <h3 className="font-display font-light mb-2"
          style={{ fontSize:22, color:'var(--text-primary)' }}>
          Emergency System
        </h3>
        <p style={{ fontSize:13, color:'var(--text-muted)', maxWidth:320, margin:'0 auto' }}>
          Emergency gesture setup, countdown UI, and contact alerts — coming in Step 9.
        </p>
      </motion.div>
    </div>
  )
}