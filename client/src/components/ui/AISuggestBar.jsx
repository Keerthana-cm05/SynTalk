import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2 } from 'lucide-react'

export default function AISuggestBar({ suggestions, loading, onSelect, partial }) {
  const show = loading || suggestions.length > 0

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: 8, height: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="glass rounded-xl p-3 border border-accent/15 flex flex-col gap-2">
            {/* Header */}
            <div className="flex items-center gap-2">
              {loading ? (
                <>
                  <Loader2 size={11} className="text-accent animate-spin" />
                  <span className="text-[10px] font-mono text-text-muted tracking-widest uppercase">
                    AI thinking...
                  </span>
                  {/* Thinking dots */}
                  <div className="flex items-center gap-0.5 ml-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1 h-1 rounded-full bg-accent/60"
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                        transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <Sparkles size={11} className="text-accent-light" />
                  <span className="text-[10px] font-mono text-text-muted tracking-widest uppercase">
                    AI suggests
                  </span>
                </>
              )}
            </div>

            {/* Suggestion chips */}
            {!loading && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25, delay: i * 0.05 }}
                    onClick={() => onSelect(s)}
                    className="px-3 py-1.5 rounded-lg text-xs font-body
                      glass-raised border border-accent/20 text-text-secondary
                      hover:border-accent/40 hover:text-text-primary hover:bg-accent/10
                      transition-all duration-200 text-left"
                  >
                    <span className="text-text-muted mr-1 font-mono text-[10px]">
                      {partial.trim()}
                    </span>
                    {s}
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}