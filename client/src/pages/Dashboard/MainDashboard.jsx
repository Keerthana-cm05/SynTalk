import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth }         from '../../context/AuthContext'
import { Cpu, Camera, Zap } from 'lucide-react'
import HardwareMode        from './modes/HardwareMode'
import MLMode              from './modes/MLMode'
import HybridMode          from './modes/HybridMode'
import AIAssistantPanel    from '../../components/ui/AIAssistantPanel'

const MODES = [
  { id:'hardware', label:'Hardware',  icon: Cpu    },
  { id:'ml',       label:'ML Camera', icon: Camera },
  { id:'hybrid',   label:'Hybrid',    icon: Zap    },
]

export default function MainDashboard() {
  const { user }  = useAuth()
  const [mode, setMode]           = useState('hardware')
  const [gestureText, setGesture] = useState('')
  const firstName = user?.displayName?.split(' ')[0] || 'there'

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', padding:24, gap:20 }}>

      {/* Header */}
      <motion.div
        initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.5 }}
        style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}
      >
        <div>
          <p style={{
            fontSize:11, color:'var(--text-muted)',
            fontFamily:'JetBrains Mono', letterSpacing:'0.12em', textTransform:'uppercase',
          }}>
            Communication Dashboard
          </p>
          <h1 className="font-display font-light"
            style={{ fontSize:32, color:'var(--text-primary)', lineHeight:1.1, marginTop:4 }}>
            Hello, <span className="text-gradient italic">{firstName}</span>
          </h1>
        </div>

        {/* Mode switcher */}
        <div style={{
          display:'flex', alignItems:'center', gap:3,
          padding:4, borderRadius:14,
          background:'rgba(26,26,36,0.85)',
          border:'1px solid var(--border)',
        }}>
          {MODES.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setMode(id)}
              style={{
                position:'relative', display:'flex', alignItems:'center', gap:6,
                padding:'8px 14px', borderRadius:11, cursor:'pointer',
                fontSize:13, fontFamily:'DM Sans',
                color: mode===id ? 'var(--text-primary)' : 'var(--text-muted)',
                background: mode===id ? 'rgba(74,127,165,0.18)' : 'transparent',
                border: mode===id ? '1px solid rgba(74,127,165,0.28)' : '1px solid transparent',
                transition:'all 0.2s',
              }}>
              <Icon size={13}
                style={{ color: mode===id ? 'var(--accent-light)' : 'var(--text-muted)' }}/>
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Two-column layout */}
      <div style={{ display:'flex', gap:16, flex:1, minHeight:0 }}>

        {/* Left — mode panel */}
        <div style={{ flex:1, minWidth:0 }}>
          <AnimatePresence mode="wait">
            <motion.div key={mode}
              initial={{ opacity:0, y:14 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-14 }}
              transition={{ duration:0.28, ease:[0.22,1,0.36,1] }}
              style={{ height:'100%' }}
            >
              {mode==='hardware' && <HardwareMode onGestureOutput={setGesture}/>}
              {mode==='ml'       && <MLMode       onGestureOutput={setGesture}/>}
              {mode==='hybrid'   && <HybridMode   onGestureOutput={setGesture}/>}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right — AI assistant */}
        <motion.div
          initial={{ opacity:0, x:20 }}
          animate={{ opacity:1, x:0 }}
          transition={{ duration:0.5, delay:0.15 }}
          style={{ width:340, flexShrink:0 }}
        >
          <AIAssistantPanel gestureText={gestureText}/>
        </motion.div>
      </div>
    </div>
  )
}