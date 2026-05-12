import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Volume2, VolumeX, ChevronDown } from 'lucide-react'

export default function TTSControls({ tts, text }) {
  useEffect(() => {
    tts.loadVoices()
  }, [])

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Speak button */}
      <button
        onClick={() => tts.speaking ? tts.stop() : tts.speak(text)}
        disabled={!text.trim()}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
          transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
          ${tts.speaking
            ? 'bg-red-500/15 border border-red-500/25 text-red-300 hover:bg-red-500/20'
            : 'bg-accent/15 border border-accent/25 text-accent-light hover:bg-accent/20'
          }`}
      >
        {tts.speaking ? (
          <>
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              <VolumeX size={14} />
            </motion.div>
            Stop
          </>
        ) : (
          <>
            <Volume2 size={14} />
            Speak
          </>
        )}
      </button>

      {/* Voice selector */}
      {tts.voices.length > 0 && (
        <div className="relative">
          <select
            value={tts.selectedVoice?.name || ''}
            onChange={(e) => {
              const v = tts.voices.find(x => x.name === e.target.value)
              tts.setSelectedVoice(v)
            }}
            className="glass border border-white/8 rounded-xl px-3 py-2 text-xs
              font-body text-text-secondary appearance-none pr-7 cursor-pointer
              focus:outline-none focus:border-accent/30 bg-transparent"
          >
            {tts.voices
              .filter(v => v.lang.startsWith('en'))
              .map(v => (
                <option key={v.name} value={v.name}
                  style={{ background: '#16161a', color: '#f0f0f2' }}>
                  {v.name.replace(/Microsoft |Google /, '')}
                </option>
              ))
            }
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>
      )}

      {/* Speaking wave */}
      {tts.speaking && (
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 3, 2, 1].map((h, i) => (
            <motion.div
              key={i}
              className="w-0.5 bg-accent-light rounded-full"
              animate={{ height: [h * 2, h * 5, h * 2] }}
              transition={{ duration: 0.5, delay: i * 0.07, repeat: Infinity }}
            />
          ))}
        </div>
      )}
    </div>
  )
}