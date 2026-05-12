import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Camera, Bluetooth, BluetoothOff, CameraOff } from 'lucide-react'
import { useGloveWebSocket } from '../../../hooks/useGloveWebSocket'
import { useGloveConnect } from '../../../hooks/useGloveConnect'
import { useMediaPipe } from '../../../hooks/useMediaPipe'
import { useTTS } from '../../../hooks/useTTS'
import Hand3DLive from '../../../components/ui/Hand3DLive'

export default function HybridMode({ onGestureOutput }) {
  const {
    gloveConnected, fingerData, accelData, lastGesture: hwGesture,
  } = useGloveWebSocket()

  const {
    ports, fetchPorts, selectedPort, setSelectedPort,
    connecting, connectGlove, disconnectGlove,
  } = useGloveConnect()

  const [mlActive,     setMlActive]     = useState(false)
  const [recognized,   setRecognized]   = useState([])
  const [lastGesture,  setLastGesture]  = useState(null)
  const [fusedConfidence, setFusedConfidence] = useState(0)
  const spokenRef = useRef(null)
  const tts = useTTS()

  // Fuse gesture from either source
  const handleGesture = useCallback((gesture, source) => {
    const now = Date.now()
    if (spokenRef.current && now - spokenRef.current < 1800) return
    spokenRef.current = now

    // Boost confidence slightly in hybrid mode (both sources agree)
    const boosted = Math.min(99, gesture.confidence + (source === 'both' ? 5 : 0))
    const entry = {
      text:       gesture.text,
      confidence: boosted,
      source,
      ts:         now,
      id:         now,
    }

    setLastGesture(entry)
    setFusedConfidence(boosted)
    setRecognized(prev => [entry, ...prev.slice(0, 7)])
    tts.speak(gesture.text)
    onGestureOutput?.(gesture.text)
  }, [tts, onGestureOutput])

  // Hardware gesture pipe
  useEffect(() => {
    if (hwGesture) handleGesture(hwGesture, 'hardware')
  }, [hwGesture])

  // ML gesture pipe
  const handleMLGesture = useCallback((g) => {
    handleGesture(g, 'camera')
  }, [handleGesture])

  const {
    videoRef, canvasRef, loading, cameraReady, handVisible,
  } = useMediaPipe({ onGesture: handleMLGesture, enabled: mlActive })

  useEffect(() => { fetchPorts() }, [])

  const anythingActive = gloveConnected || mlActive

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ── Control bar ──────────────────────────────────────── */}
      <div className="glass-raised rounded-2xl px-5 py-4 border border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            {/* Hardware status */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-body ${
              gloveConnected
                ? 'bg-green-500/8 border-green-500/20 text-green-300'
                : 'glass border-white/8 text-text-muted'
            }`}>
              {gloveConnected
                ? <Bluetooth size={13} />
                : <BluetoothOff size={13} />
              }
              {gloveConnected ? 'Glove' : 'No glove'}
            </div>

            <div className="text-text-muted text-xs font-mono">+</div>

            {/* Camera status */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-body ${
              cameraReady
                ? 'bg-green-500/8 border-green-500/20 text-green-300'
                : 'glass border-white/8 text-text-muted'
            }`}>
              {cameraReady
                ? <Camera size={13} />
                : <CameraOff size={13} />
              }
              {cameraReady ? 'Camera' : 'No camera'}
            </div>

            {gloveConnected && cameraReady && (
              <div className="flex items-center gap-1.5 glass rounded-full px-3 py-1 border border-accent/20">
                <Zap size={11} className="text-accent-light" />
                <span className="text-[10px] font-mono text-accent-light">Hybrid active</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Glove connect */}
            {!gloveConnected && (
              <select
                value={selectedPort}
                onChange={e => setSelectedPort(e.target.value)}
                className="glass border border-white/8 rounded-xl px-3 py-2 text-xs
                  font-mono text-text-secondary appearance-none cursor-pointer
                  focus:outline-none bg-transparent"
              >
                {ports.length === 0
                  ? <option value="">No ports</option>
                  : ports.map(p => (
                      <option key={p.path} value={p.path}
                        style={{ background: '#16161a', color: '#f0f0f2' }}>
                        {p.path}
                      </option>
                    ))
                }
              </select>
            )}

            <button
              onClick={() => gloveConnected ? disconnectGlove() : connectGlove(selectedPort)}
              disabled={connecting}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs
                font-medium transition-all duration-300
                ${gloveConnected
                  ? 'glass border border-red-500/20 text-red-300 hover:bg-red-500/10'
                  : 'bg-accent/80 hover:bg-accent text-white'
                } disabled:opacity-50`}
            >
              {connecting
                ? <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                : gloveConnected ? <BluetoothOff size={12} /> : <Bluetooth size={12} />
              }
              {gloveConnected ? 'Disconnect' : 'Glove'}
            </button>

            <button
              onClick={() => setMlActive(a => !a)}
              disabled={loading}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs
                font-medium transition-all duration-300
                ${mlActive
                  ? 'glass border border-red-500/20 text-red-300 hover:bg-red-500/10'
                  : 'glass border border-accent/20 text-accent-light hover:bg-accent/10'
                } disabled:opacity-50`}
            >
              {loading
                ? <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                : mlActive ? <CameraOff size={12} /> : <Camera size={12} />
              }
              {mlActive ? 'Stop cam' : 'Camera'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main area ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1">

        {/* Left: 3D hand + camera pip */}
        <div className="flex-1 relative">
          {/* 3D hand */}
          <div className="glass-raised rounded-2xl border border-white/5 overflow-hidden min-h-[300px] h-full relative">
            {!anythingActive && (
              <div className="absolute inset-0 z-10 flex items-end justify-center pb-6 pointer-events-none">
                <div className="glass rounded-xl px-4 py-2.5 border border-white/8 flex items-center gap-2">
                  <Zap size={13} className="text-text-muted" />
                  <span className="text-xs font-mono text-text-muted">
                    Connect glove or start camera
                  </span>
                </div>
              </div>
            )}
            {gloveConnected && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2
                glass rounded-full px-3 py-1.5 border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] font-mono text-green-300 uppercase tracking-widest">Live</span>
              </div>
            )}
            <Hand3DLive
              fingerData={fingerData}
              accelData={accelData}
              isConnected={gloveConnected}
            />
          </div>

          {/* Camera PiP — bottom right when active */}
          <AnimatePresence>
            {mlActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="absolute bottom-4 right-4 w-44 h-32 rounded-xl overflow-hidden
                  border border-accent/20 shadow-xl"
              >
                <video
                  ref={videoRef}
                  autoPlay playsInline muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <canvas
  ref={canvasRef}
  width={640} height={480}
  className="absolute inset-0 w-full h-full"
/>
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1
                  bg-black/60 rounded-full px-2 py-0.5">
                  <span className={`w-1 h-1 rounded-full ${handVisible ? 'bg-green-400 animate-pulse' : 'bg-white/30'}`} />
                  <span className="text-[9px] font-mono text-white/70">
                    {handVisible ? 'detected' : 'scanning'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: output */}
        <div className="lg:w-72 flex flex-col gap-3">
          {/* Recognized */}
          <div className="glass-raised rounded-2xl p-4 border border-white/5 flex-1 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
                Recognized
              </p>
              {lastGesture && (
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                  lastGesture.source === 'hardware'
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                    : lastGesture.source === 'both'
                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-300'
                    : 'bg-green-500/10 border-green-500/20 text-green-300'
                }`}>
                  {lastGesture.source}
                </span>
              )}
            </div>

            {!anythingActive ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-text-muted text-center font-body">
                  Activate at least one input source
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {lastGesture ? (
                  <motion.div
                    key={lastGesture.ts}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-2"
                  >
                    <p className="font-display text-4xl font-light text-text-primary leading-tight">
                      {lastGesture.text}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${fusedConfidence}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-accent-light">
                        {fusedConfidence}%
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <motion.div key={i}
                          className="w-1 h-1 rounded-full bg-accent/40"
                          animate={{ opacity: [0.3,1,0.3], y:[0,-3,0] }}
                          transition={{ duration:1, delay:i*0.2, repeat:Infinity }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-text-muted font-body">Reading…</p>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* History */}
          {recognized.length > 0 && (
            <div className="glass-raised rounded-2xl p-4 border border-white/5">
              <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-3">
                Session log
              </p>
              <div className="flex flex-col gap-1.5">
                {recognized.map((g, i) => (
                  <motion.div key={g.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center justify-between text-xs font-body
                      px-2 py-1.5 rounded-lg ${
                      i === 0
                        ? 'text-text-primary bg-accent/10 border border-accent/15'
                        : 'text-text-muted'
                    }`}
                  >
                    <span>{g.text}</span>
                    <span className="text-[9px] font-mono opacity-50">{g.source}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}