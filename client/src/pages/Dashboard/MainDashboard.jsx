import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { Cpu, Camera, Zap } from 'lucide-react'
import HardwareMode from './modes/HardwareMode'
import MLMode from './modes/MLMode'
import HybridMode from './modes/HybridMode'

const MODES = [
  { id: 'hardware', label: 'Hardware',  icon: Cpu    },
  { id: 'ml',       label: 'ML Camera', icon: Camera },
  { id: 'hybrid',   label: 'Hybrid',    icon: Zap    },
]

export default function MainDashboard() {
  const { user } = useAuth()
  const [mode, setMode] = useState('hardware')
  const firstName = user?.displayName?.split(' ')[0] || 'there'

  return (
    <div className="flex flex-col min-h-screen p-6 gap-5">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-end justify-between flex-wrap gap-3"
      >
        <div>
          <p style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            Communication Dashboard
          </p>
          <h1
            className="font-display font-light mt-1"
            style={{ fontSize: 32, color: 'var(--text-primary)', lineHeight: 1.1 }}
          >
            Hello,{' '}
            <span className="text-gradient italic">{firstName}</span>
          </h1>
        </div>

        {/* Mode switcher */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl flex-shrink-0"
          style={{
            background: 'rgba(26,26,36,0.8)',
            border: '1px solid var(--border)',
          }}
        >
          {MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg
                transition-colors duration-150 font-body"
              style={{
                fontSize: 13,
                color: mode === id ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {mode === id && (
                <motion.div
                  layoutId="mode-bg"
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background: 'rgba(74,127,165,0.18)',
                    border: '1px solid rgba(74,127,165,0.28)',
                  }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              <Icon
                size={13}
                className="relative z-10"
                style={{ color: mode === id ? 'var(--accent-light)' : undefined }}
              />
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Mode content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1"
        >
          {mode === 'hardware' && <HardwareMode />}
          {mode === 'ml'       && <MLMode />}
          {mode === 'hybrid'   && <HybridMode />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}