import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CameraOff, Eye, EyeOff, Scan } from 'lucide-react'
import { useMediaPipe } from '../../../hooks/useMediaPipe'
import { useTTS } from '../../../hooks/useTTS'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { useAuth } from '../../../context/AuthContext'


export default function MLMode({ onGestureOutput }) {
  const [active,     setActive]     = useState(false)
  const [log,        setLog]        = useState([])
  const [lastGesture,setLastGesture]= useState(null)
  const [showVideo,  setShowVideo]  = useState(true)
  const spokenRef = useRef(null)
  const tts = useTTS()
  const { user } = useAuth()

  const handleGesture = useCallback((g) => {
    const now = Date.now()
    if (spokenRef.current && now - spokenRef.current < 1800) return
    spokenRef.current = now
    setLastGesture({ ...g, ts: now })
    setLog(p => [{ ...g, id: now }, ...p.slice(0,6)])
    tts.speak(g.text)
    if (user) {
  addDoc(collection(db, 'users', user.uid, 'history'), {
    text:       g.text,
    confidence: g.confidence,
    mode:       'camera',
    createdAt:  serverTimestamp(),
  }).catch(() => {})
}
    onGestureOutput?.(g.text)
  }, [tts, onGestureOutput])

  const { videoRef, canvasRef, loading, cameraReady, handVisible, error }
    = useMediaPipe({ onGesture: handleGesture, enabled: active })

  useEffect(() => {
    if (!active) { setLog([]); setLastGesture(null); onGestureOutput?.('') }
  }, [active])

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Top bar */}
      <div className="glass-raised rounded-2xl px-5 py-4"
        style={{ border:'1px solid var(--border)' }}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cameraReady ? 'animate-pulse' : ''}`}
              style={{ background: cameraReady ? '#4ade80' : 'var(--text-muted)' }} />
            <span className="font-body"
              style={{ fontSize:14, color:'var(--text-primary)' }}>
              {cameraReady ? 'Camera active' : 'ML Camera Mode'}
            </span>
            <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>
              {loading ? '· Loading MediaPipe…' : cameraReady ? '· MediaPipe Hands' : '· No hardware needed'}
            </span>
          </div>

          {cameraReady && (
            <button onClick={() => setShowVideo(v => !v)}
              className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)' }}>
              {showVideo ? <EyeOff size={13} style={{ color:'var(--text-muted)' }} />
                         : <Eye   size={13} style={{ color:'var(--text-muted)' }} />}
            </button>
          )}

          <button onClick={() => setActive(a => !a)} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-body
              transition-all duration-200 disabled:opacity-40 ml-auto"
            style={{
              fontSize:13.5,
              background: active
                ? 'rgba(239,68,68,0.1)'
                : 'var(--accent)',
              border: active ? '1px solid rgba(239,68,68,0.2)' : 'none',
              color: active ? '#fca5a5' : '#fff',
              boxShadow: active ? 'none' : '0 4px 20px rgba(74,127,165,0.25)',
            }}>
            {loading
              ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : active ? <CameraOff size={13} /> : <Camera size={13} />
            }
            {loading ? 'Loading…' : active ? 'Stop' : 'Start Camera'}
          </button>

          {error && (
            <p style={{ fontSize:12, color:'#f87171', fontFamily:'JetBrains Mono', width:'100%' }}>
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Camera canvas */}
        <div className="flex-1 glass-raised rounded-2xl overflow-hidden relative"
          style={{ border:'1px solid var(--border)', minHeight:380 }}>

          {!active ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background:'rgba(74,127,165,0.1)', border:'1px solid rgba(74,127,165,0.2)' }}>
                <Camera size={26} style={{ color:'var(--accent-light)' }} />
              </div>
              <div>
                <h3 className="font-body font-medium mb-1"
                  style={{ fontSize:15, color:'var(--text-primary)' }}>
                  Camera mode
                </h3>
                <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6, maxWidth:280 }}>
                  MediaPipe Hands detects and classifies your sign language gestures in real time.
                  No glove needed.
                </p>
              </div>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted
                className="w-full h-full object-cover transition-opacity duration-300"
                style={{
                  transform:'scaleX(-1)',
                  opacity: showVideo ? 1 : 0,
                }}
              />
              <canvas ref={canvasRef} width={640} height={480}
  className="absolute inset-0 w-full h-full"
/>

              {!showVideo && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background:'rgba(12,12,15,0.95)' }}>
                  <p style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>
                    Skeleton-only mode
                  </p>
                </div>
              )}

              {/* Loading */}
              <AnimatePresence>
                {loading && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                    style={{ background:'rgba(12,12,15,0.85)', backdropFilter:'blur(8px)' }}>
                    <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor:'var(--accent)' }} />
                    <p style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>
                      Initializing MediaPipe…
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background:'rgba(12,12,15,0.85)', border:'1px solid rgba(74,239,128,0.22)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background:'#4ade80' }} />
                <span style={{ fontSize:10, color:'#86efac', fontFamily:'JetBrains Mono', letterSpacing:'0.1em' }}>
                  LIVE
                </span>
              </div>

              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300"
                style={{
                  background:'rgba(12,12,15,0.85)',
                  border: handVisible
                    ? '1px solid rgba(74,127,165,0.3)'
                    : '1px solid var(--border)',
                }}>
                <Scan size={11} style={{ color: handVisible ? 'var(--accent-light)' : 'var(--text-muted)' }} />
                <span style={{ fontSize:10, fontFamily:'JetBrains Mono', letterSpacing:'0.08em',
                  color: handVisible ? 'var(--accent-light)' : 'var(--text-muted)' }}>
                  {handVisible ? 'Hand detected' : 'No hand'}
                </span>
              </div>

              {/* Scanning line */}
              <AnimatePresence>
                {handVisible && (
                  <motion.div
                    className="absolute left-0 right-0 h-px pointer-events-none"
                    animate={{ top:['0%','100%','0%'], opacity:[0,0.7,0] }}
                    transition={{ duration:2.5, repeat:Infinity, ease:'easeInOut' }}
                    style={{ background:'linear-gradient(90deg,transparent,rgba(74,127,165,0.85),transparent)' }}
                  />
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Right column */}
        <div className="w-64 flex flex-col gap-3 flex-shrink-0">
          <div className="glass-raised rounded-2xl p-5 flex flex-col gap-3"
            style={{ border:'1px solid var(--border)', flex:1 }}>
            <p style={{ fontSize:10.5, color:'var(--text-muted)', fontFamily:'JetBrains Mono', letterSpacing:'0.12em', textTransform:'uppercase' }}>
              Recognised
            </p>
            {!active ? (
              <div className="flex-1 flex items-center justify-center">
                <p style={{ fontSize:13, color:'var(--text-muted)' }}>
                  Start camera to begin
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {lastGesture ? (
                  <motion.div key={lastGesture.ts}
                    initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                    className="flex flex-col gap-3">
                    <p className="font-display font-light text-gradient"
                      style={{ fontSize:42, lineHeight:1.05 }}>
                      {lastGesture.text}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full overflow-hidden"
                        style={{ background:'rgba(255,255,255,0.06)' }}>
                        <motion.div className="h-full rounded-full"
                          initial={{ width:0 }}
                          animate={{ width:`${lastGesture.confidence}%` }}
                          transition={{ duration:.6 }}
                          style={{ background:'linear-gradient(90deg,var(--accent),var(--accent-light))' }}
                        />
                      </div>
                      <span style={{ fontSize:11, color:'var(--accent-light)', fontFamily:'JetBrains Mono' }}>
                        {lastGesture.confidence}%
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="idle" initial={{ opacity:0 }} animate={{ opacity:1 }}
                    className="flex items-center gap-2">
                    {handVisible ? (
                      <>
                        {[0,1,2].map(i => (
                          <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                            style={{ background:'var(--accent-muted)' }}
                            animate={{ opacity:[0.3,1,0.3], y:[0,-4,0] }}
                            transition={{ duration:1, delay:i*0.2, repeat:Infinity }}
                          />
                        ))}
                        <span style={{ fontSize:13, color:'var(--text-muted)' }}>Reading…</span>
                      </>
                    ) : (
                      <span style={{ fontSize:13, color:'var(--text-muted)' }}>
                        Show your hand
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {log.length > 0 && (
            <div className="glass-raised rounded-2xl p-4"
              style={{ border:'1px solid var(--border)' }}>
              <p className="mb-2.5" style={{ fontSize:10.5, color:'var(--text-muted)', fontFamily:'JetBrains Mono', letterSpacing:'0.12em', textTransform:'uppercase' }}>
                Session
              </p>
              <div className="flex flex-col gap-1">
                {log.map((g,i) => (
                  <motion.div key={g.id}
                    initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay:i*0.04 }}
                    className="px-2.5 py-1.5 rounded-lg font-body"
                    style={{
                      fontSize:13,
                      background: i===0 ? 'rgba(74,127,165,0.12)' : 'transparent',
                      border: i===0 ? '1px solid rgba(74,127,165,0.18)' : '1px solid transparent',
                      color: i===0 ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}>
                    {g.text}
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