import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Hand, ArrowRight } from 'lucide-react'

export default function GestureSetupPlaceholder() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const firstName  = user?.displayName?.split(' ')[0] || 'there'

  return (
    <div className="dashboard-bg noise min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity:0, y:24 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:.7, ease:[0.22,1,0.36,1] }}
        className="glass-raised rounded-2xl p-10 w-full text-center"
        style={{ maxWidth:420, border:'1px solid var(--border)' }}
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background:'rgba(74,127,165,0.1)', border:'1px solid rgba(74,127,165,0.2)' }}>
          <Hand size={24} style={{ color:'var(--accent-light)' }} />
        </div>

        <h1 className="font-display font-light mb-2"
          style={{ fontSize:28, color:'var(--text-primary)' }}>
          Welcome, {firstName}!
        </h1>
        <p style={{ fontSize:13.5, color:'var(--text-muted)', lineHeight:1.7, marginBottom:24 }}>
          Your account was created. Gesture setup will be configured in Step 3 of the build.
        </p>

        <div className="rounded-xl px-4 py-3 mb-6"
          style={{ background:'rgba(74,127,165,0.07)', border:'1px solid rgba(74,127,165,0.15)' }}>
          <p style={{ fontSize:12, color:'var(--text-muted)' }}>
            Gesture setup coming in <span style={{ color:'var(--accent-light)' }}>Step 3</span>
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="group w-full flex items-center justify-center gap-2 py-3.5
            rounded-xl font-body transition-all duration-300"
          style={{
            fontSize:14,
            background:'var(--accent)',
            color:'#fff',
            boxShadow:'0 4px 20px rgba(74,127,165,0.25)',
          }}
        >
          Continue to Dashboard
          <ArrowRight size={15} />
        </button>
      </motion.div>
    </div>
  )
}