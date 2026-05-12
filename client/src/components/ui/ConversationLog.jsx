import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, Clock } from 'lucide-react'

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ConversationLog({ entries, onSpeak }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  return (
    <div className="flex flex-col gap-3 overflow-y-auto max-h-72 pr-1
      scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
      <AnimatePresence initial={false}>
        {entries.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <p className="text-text-muted text-xs font-body">
              Your conversation will appear here
            </p>
          </motion.div>
        )}
        {entries.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="group glass-raised rounded-xl px-4 py-3 border border-white/5
              hover:border-accent/15 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-body text-sm text-text-primary leading-relaxed flex-1">
                {entry.text}
              </p>
              <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                <button
                  onClick={() => onSpeak(entry.text)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity
                    w-6 h-6 rounded-md glass border border-white/8 flex items-center
                    justify-center text-text-muted hover:text-accent-light"
                >
                  <Volume2 size={11} />
                </button>
                <div className="flex items-center gap-1 text-[10px] font-mono text-text-muted">
                  <Clock size={9} />
                  {formatTime(entry.timestamp)}
                </div>
              </div>
            </div>
            {entry.confidence > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-16 h-0.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent/60 rounded-full"
                    style={{ width: `${entry.confidence}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-text-muted">
                  {entry.confidence}% confidence
                </span>
                <span className="text-[10px] font-mono text-text-muted">
                  · {entry.mode}
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  )
}