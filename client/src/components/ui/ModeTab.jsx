import { motion } from 'framer-motion'

export default function ModeTab({ modes, active, onChange }) {
  return (
    <div className="relative flex items-center glass rounded-xl p-1 border border-white/5 w-fit">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onChange(mode.id)}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body transition-colors duration-200 z-10 ${
            active === mode.id ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          {active === mode.id && (
            <motion.div
              layoutId="mode-tab-bg"
              className="absolute inset-0 bg-accent/20 border border-accent/25 rounded-lg"
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {mode.icon && <span className={active === mode.id ? 'text-accent-light' : ''}>{mode.icon}</span>}
            {mode.label}
          </span>
        </button>
      ))}
    </div>
  )
}