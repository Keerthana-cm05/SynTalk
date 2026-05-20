import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Camera, Bluetooth, BluetoothOff, CameraOff, WifiOff } from 'lucide-react'
import { useGloveWebSocket } from '../../../hooks/useGloveWebSocket'
import { useGloveConnect }   from '../../../hooks/useGloveConnect'
import { useMediaPipe }      from '../../../hooks/useMediaPipe'
import { useTTS }            from '../../../hooks/useTTS'
import Hand3DLive            from '../../../components/ui/Hand3DLive'
import { db }                from '../../../firebase/config'
import { useAuth }           from '../../../context/AuthContext'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export default function HybridMode({ onGestureOutput }) {
  const glove  = useGloveWebSocket()
  const conn   = useGloveConnect()
  const tts    = useTTS()
  const { user } = useAuth()

  const [mlActive,    setMlActive]    = useState(false)
  const [log,         setLog]         = useState([])
  const [lastGesture, setLastGesture] = useState(null)
  const spokenRef = useRef(null)

  useEffect(() => { conn.fetchPorts() }, [])

  const handleGesture = useCallback((g, source) => {
    const now = Date.now()
    if (spokenRef.current && now - spokenRef.current < 1200) return
    spokenRef.current = now

    const entry = { ...g, source, ts: now, id: now }
    setLastGesture(entry)
    setLog(p => [entry, ...p.slice(0, 6)])
    tts.speak(g.text)
    onGestureOutput?.(g.text)

    if (user) {
      addDoc(collection(db, 'users', user.uid, 'history'), {
        text:       g.text,
        confidence: g.confidence,
        mode:       'hybrid',
        createdAt:  serverTimestamp(),
      }).catch(() => {})
    }
  }, [tts, onGestureOutput, user])

  // Hardware gestures
  useEffect(() => {
    if (glove.lastGesture) handleGesture(glove.lastGesture, 'hardware')
  }, [glove.lastGesture])

  // ML gestures
  const handleML = useCallback((g) => handleGesture(g, 'camera'), [handleGesture])

  const { videoRef, canvasRef, loading: mlLoading, cameraReady, handVisible }
    = useMediaPipe({ onGesture: handleML, enabled: mlActive })

  useEffect(() => {
    if (!glove.gloveConnected && !mlActive) {
      setLog([]); onGestureOutput?.('')
    }
  }, [glove.gloveConnected, mlActive])

  const anyActive = glove.gloveConnected || mlActive

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Control bar */}
      <div className="glass-raised rounded-2xl p-4"
        style={{ border:'1px solid var(--border)' }}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Zap size={16} style={{ color:'var(--accent-light)' }}/>
            <span style={{ fontSize:14, color:'var(--text-primary)', fontFamily:'DM Sans' }}>
              Hybrid Mode
            </span>
            <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>
              · Hardware + Camera combined
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Glove */}
            {!glove.gloveConnected ? (
              <>
                <select
                  value={conn.selectedPort}
                  onChange={e => conn.setSelectedPort(e.target.value)}
                  style={{
                    appearance:'none', padding:'7px 12px', borderRadius:10,
                    background:'rgba(15,15,22,0.95)', border:'1px solid var(--border)',
                    color: conn.selectedPort ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize:12.5, fontFamily:'JetBrains Mono', outline:'none', cursor:'pointer',
                    minWidth:120,
                  }}
                >
                  {conn.ports.length===0
                    ? <option value="">No ports</option>
                    : conn.ports.map(p => (
                        <option key={p.path} value={p.path}
                          style={{ background:'#13131a', color:'#eeeef2' }}>
                          {p.path}{p.isArduino?' ✓':''}
                        </option>
                      ))
                  }
                </select>
                <button
                  onClick={() => conn.connectGlove(conn.selectedPort)}
                  disabled={conn.connecting || !conn.selectedPort}
                  style={{
                    display:'flex', alignItems:'center', gap:6,
                    padding:'7px 14px', borderRadius:10,
                    background:'rgba(74,127,165,0.15)',
                    border:'1px solid rgba(74,127,165,0.28)',
                    color:'var(--accent-light)', fontSize:13,
                    fontFamily:'DM Sans', cursor:'pointer',
                    opacity: conn.connecting ? 0.6 : 1,
                  }}>
                  {conn.connecting
                    ? <div style={{ width:12, height:12, borderRadius:'50%', border:'2px solid var(--accent-light)', borderTopColor:'transparent', animation:'spin 0.75s linear infinite' }}/>
                    : <Bluetooth size={13}/>
                  }
                  Glove
                </button>
              </>
            ) : (
              <button onClick={conn.disconnectGlove}
                style={{
                  display:'flex', alignItems:'center', gap:6,
                  padding:'7px 14px', borderRadius:10,
                  background:'rgba(74,127,165,0.12)',
                  border:'1px solid rgba(74,127,165,0.22)',
                  color:'var(--accent-light)', fontSize:13,
                  fontFamily:'DM Sans', cursor:'pointer',
                }}>
                <Bluetooth size={13}/>
                {conn.selectedPort || glove.glovePort}
              </button>
            )}

            {/* Camera */}
            <button
              onClick={() => setMlActive(a => !a)}
              disabled={mlLoading}
              style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'7px 14px', borderRadius:10,
                background: mlActive ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
                border: mlActive ? '1px solid rgba(34,197,94,0.25)' : '1px solid var(--border)',
                color: mlActive ? '#86efac' : 'var(--text-muted)',
                fontSize:13, fontFamily:'DM Sans', cursor:'pointer',
              }}>
              {mlLoading
                ? <div style={{ width:12, height:12, borderRadius:'50%', border:'2px solid currentColor', borderTopColor:'transparent', animation:'spin 0.75s linear infinite' }}/>
                : mlActive ? <Camera size={13}/> : <CameraOff size={13}/>
              }
              Camera
            </button>
          </div>
        </div>

        {/* Status badges */}
        {anyActive && (
          <div className="flex items-center gap-2 mt-3">
            {glove.gloveConnected && (
              <div style={{
                display:'flex', alignItems:'center', gap:5,
                padding:'3px 10px', borderRadius:20, fontSize:10,
                background:'rgba(74,127,165,0.12)',
                border:'1px solid rgba(74,127,165,0.22)',
                color:'var(--accent-light)', fontFamily:'JetBrains Mono',
              }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', display:'inline-block', animation:'pulse 2s infinite' }}/>
                Glove active
              </div>
            )}
            {mlActive && cameraReady && (
              <div style={{
                display:'flex', alignItems:'center', gap:5,
                padding:'3px 10px', borderRadius:20, fontSize:10,
                background:'rgba(34,197,94,0.10)',
                border:'1px solid rgba(34,197,94,0.22)',
                color:'#86efac', fontFamily:'JetBrains Mono',
              }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', display:'inline-block', animation:'pulse 2s infinite' }}/>
                Camera active
              </div>
            )}
            {glove.gloveConnected && mlActive && (
              <div style={{
                display:'flex', alignItems:'center', gap:5,
                padding:'3px 10px', borderRadius:20, fontSize:10,
                background:'rgba(168,85,247,0.10)',
                border:'1px solid rgba(168,85,247,0.22)',
                color:'#d8b4fe', fontFamily:'JetBrains Mono',
              }}>
                <Zap size={9}/> Hybrid boost
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main area */}
      <div className="flex gap-4 flex-1" style={{ minHeight:0 }}>

        {/* Left: 3D hand + camera PiP */}
        <div className="flex-1 glass-raised rounded-2xl overflow-hidden relative"
          style={{ border:'1px solid var(--border)', minHeight:320 }}>

          {!anyActive && (
            <div style={{
              position:'absolute', inset:0, zIndex:10,
              display:'flex', alignItems:'flex-end', justifyContent:'center',
              paddingBottom:20, pointerEvents:'none',
            }}>
              <div style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'10px 18px', borderRadius:12,
                background:'rgba(12,12,15,0.90)', border:'1px solid var(--border)',
              }}>
                <WifiOff size={13} style={{ color:'var(--text-muted)' }}/>
                <span style={{ fontSize:12.5, color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>
                  Activate glove or camera to begin
                </span>
              </div>
            </div>
          )}

          <Hand3DLive
            fingerData={glove.fingerData}
            isConnected={glove.gloveConnected}
          />

          {/* Camera PiP */}
          <AnimatePresence>
            {mlActive && (
              <motion.div
                initial={{ opacity:0, scale:0.8, y:20 }}
                animate={{ opacity:1, scale:1, y:0 }}
                exit={{ opacity:0, scale:0.8, y:20 }}
                style={{
                  position:'absolute', bottom:16, right:16,
                  width:160, height:120, borderRadius:10,
                  overflow:'hidden', border:'1px solid rgba(74,127,165,0.3)',
                  boxShadow:'0 4px 20px rgba(0,0,0,0.4)',
                }}>
                <video ref={videoRef} autoPlay playsInline muted
                  style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)' }}/>
                <canvas ref={canvasRef} width={640} height={480}
                  style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}/>
                <div style={{
                  position:'absolute', top:5, left:5,
                  display:'flex', alignItems:'center', gap:4,
                  padding:'2px 8px', borderRadius:20,
                  background:'rgba(12,12,15,0.85)',
                  border: handVisible ? '1px solid rgba(74,239,128,0.28)' : '1px solid var(--border)',
                }}>
                  <div style={{
                    width:5, height:5, borderRadius:'50%',
                    background: handVisible ? '#4ade80' : 'var(--text-muted)',
                  }}/>
                  <span style={{ fontSize:9, color: handVisible ? '#86efac' : 'var(--text-muted)', fontFamily:'JetBrains Mono' }}>
                    {handVisible ? 'detected' : 'scanning'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: recognised + log */}
        <div style={{ width:260, flexShrink:0, display:'flex', flexDirection:'column', gap:12 }}>
          <div className="glass-raised rounded-2xl p-5 flex flex-col gap-3"
            style={{ border:'1px solid var(--border)', flex:1 }}>
            <p style={{ fontSize:10.5, color:'var(--text-muted)', fontFamily:'JetBrains Mono', letterSpacing:'0.12em', textTransform:'uppercase' }}>
              Recognised
            </p>
            {!anyActive ? (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <p style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center' }}>
                  Activate an input source
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {lastGesture ? (
                  <motion.div key={lastGesture.ts}
                    initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                    style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    <p className="font-display font-light text-gradient"
                      style={{ fontSize:42, lineHeight:1.05 }}>
                      {lastGesture.text}
                    </p>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{
                        flex:1, height:3, borderRadius:2, overflow:'hidden',
                        background:'rgba(255,255,255,0.06)',
                      }}>
                        <motion.div
                          initial={{ width:0 }}
                          animate={{ width:`${lastGesture.confidence}%` }}
                          transition={{ duration:0.5 }}
                          style={{
                            height:'100%', borderRadius:2,
                            background:'linear-gradient(90deg,var(--accent),var(--accent-light))',
                          }}/>
                      </div>
                      <span style={{ fontSize:11, color:'var(--accent-light)', fontFamily:'JetBrains Mono' }}>
                        {lastGesture.confidence}%
                      </span>
                    </div>
                    <span style={{
                      fontSize:10, fontFamily:'JetBrains Mono',
                      padding:'2px 8px', borderRadius:20, alignSelf:'flex-start',
                      background: lastGesture.source==='hardware'
                        ? 'rgba(74,127,165,0.12)' : 'rgba(59,130,246,0.12)',
                      border: lastGesture.source==='hardware'
                        ? '1px solid rgba(74,127,165,0.22)' : '1px solid rgba(59,130,246,0.22)',
                      color: lastGesture.source==='hardware' ? 'var(--accent-light)' : '#93c5fd',
                    }}>
                      via {lastGesture.source}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div key="idle" initial={{ opacity:0 }} animate={{ opacity:1 }}
                    style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {[0,1,2].map(i => (
                      <motion.div key={i}
                        style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent-muted)' }}
                        animate={{ opacity:[0.3,1,0.3], y:[0,-5,0] }}
                        transition={{ duration:1, delay:i*0.22, repeat:Infinity }}/>
                    ))}
                    <span style={{ fontSize:13, color:'var(--text-muted)', fontFamily:'DM Sans' }}>
                      Reading…
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {log.length > 0 && (
            <div className="glass-raised rounded-2xl p-4"
              style={{ border:'1px solid var(--border)' }}>
              <p style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'JetBrains Mono', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10 }}>
                Session
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {log.map((g, i) => (
                  <motion.div key={g.id}
                    initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay:i*0.04 }}
                    style={{
                      fontSize:13, fontFamily:'DM Sans',
                      padding:'6px 10px', borderRadius:8,
                      background: i===0 ? 'rgba(74,127,165,0.13)' : 'transparent',
                      border: i===0 ? '1px solid rgba(74,127,165,0.20)' : '1px solid transparent',
                      color: i===0 ? 'var(--text-primary)' : 'var(--text-muted)',
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                    }}>
                    <span>{g.text}</span>
                    <span style={{
                      fontSize:9, fontFamily:'JetBrains Mono',
                      color: g.source==='hardware' ? 'var(--accent-light)' : '#93c5fd',
                      opacity:0.7,
                    }}>
                      {g.source?.slice(0,3)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin  { to { transform:rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  )
}