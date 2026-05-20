import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bluetooth, BluetoothOff, RefreshCw,
  WifiOff, ChevronDown, AlertCircle,
} from 'lucide-react'
import Hand3DLive         from '../../../components/ui/Hand3DLive'
import { useGloveWebSocket } from '../../../hooks/useGloveWebSocket'
import { useGloveConnect }   from '../../../hooks/useGloveConnect'
import { useTTS }            from '../../../hooks/useTTS'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { useAuth } from '../../../context/AuthContext'

export default function HardwareMode({ onGestureOutput }) {
  const glove  = useGloveWebSocket()
  const conn   = useGloveConnect()
  const tts    = useTTS()
  const spoken = useRef(null)
  const [log, setLog] = useState([])
  const { user } = useAuth()

  useEffect(() => { 
    // Try to auto-connect to Arduino on load
    conn.fetchPorts(true) 
  }, [])

  // Speak + log recognised gesture
  useEffect(() => {
  if (!glove.lastGesture) return
  if (glove.lastGesture.ts === spoken.current) return
  spoken.current = glove.lastGesture.ts
  tts.speak(glove.lastGesture.text)
  setLog(p => [{ ...glove.lastGesture, id: glove.lastGesture.ts }, ...p.slice(0, 6)])
  onGestureOutput?.(glove.lastGesture.text)

  // Save to history
  if (user) {
    addDoc(collection(db, 'users', user.uid, 'history'), {
      text:       glove.lastGesture.text,
      confidence: glove.lastGesture.confidence,
      mode:       'hardware',
      createdAt:  serverTimestamp(),
    }).catch(() => {})
  }
}, [glove.lastGesture])
  useEffect(() => {
    if (!glove.gloveConnected) { setLog([]); onGestureOutput?.('') }
  }, [glove.gloveConnected])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, height:'100%' }}>

      {/* ── Connection bar ─────────────────────────────────────── */}
      <div className="glass-raised rounded-2xl"
        style={{ padding:'16px 20px', border:'1px solid var(--border)' }}>

        {glove.gloveConnected ? (
          /* Connected */
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{
                width:9, height:9, borderRadius:'50%',
                background:'#4ade80',
                boxShadow:'0 0 8px rgba(74,222,128,0.6)',
                animation:'glow 2s ease-in-out infinite',
              }}/>
              <span style={{ fontSize:14, color:'var(--text-primary)', fontFamily:'DM Sans', fontWeight:500 }}>
                Connected · {glove.glovePort}
              </span>
              <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>
                · live streaming
              </span>
            </div>

            <button
              onClick={() => conn.disconnectGlove()}
              style={{
                display:'flex', alignItems:'center', gap:7,
                padding:'7px 16px', borderRadius:10,
                background:'rgba(239,68,68,0.10)',
                border:'1px solid rgba(239,68,68,0.25)',
                color:'#fca5a5', fontSize:13.5,
                fontFamily:'DM Sans', cursor:'pointer',
              }}
            >
              <BluetoothOff size={14}/> Disconnect
            </button>
          </div>

        ) : (
          /* Disconnected */
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:10 }}>

              {/* Label */}
              <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
                <div style={{ width:9, height:9, borderRadius:'50%', background:'var(--text-muted)' }}/>
                <span style={{ fontSize:14, color:'var(--text-primary)', fontFamily:'DM Sans' }}>
                  Connect Glove
                </span>
                <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>
                  {glove.wsReady ? '· server ready' : '· connecting…'}
                </span>
              </div>

              {/* Port select */}
              <div style={{ position:'relative' }}>
                <select
                  value={conn.selectedPort}
                  onChange={e => conn.setSelectedPort(e.target.value)}
                  style={{
                    appearance:'none',
                    paddingLeft:12, paddingRight:30, paddingTop:8, paddingBottom:8,
                    borderRadius:10, outline:'none', cursor:'pointer',
                    fontSize:13, fontFamily:'JetBrains Mono',
                    background:'rgba(15,15,22,0.95)',
                    border:'1px solid var(--border)',
                    color: conn.selectedPort ? 'var(--text-primary)' : 'var(--text-muted)',
                    minWidth:140,
                  }}
                >
                  {conn.ports.length === 0
                    ? <option value="">No ports found</option>
                    : conn.ports.map(p => (
                        <option key={p.path} value={p.path}
                          style={{ background:'#13131a', color:'#eeeef2' }}>
                          {p.path}{p.isArduino ? ' ✓' : ''}
                        </option>
                      ))
                  }
                </select>
                <ChevronDown size={12} style={{
                  position:'absolute', right:10, top:'50%',
                  transform:'translateY(-50%)',
                  pointerEvents:'none', color:'var(--text-muted)',
                }}/>
              </div>

              {/* Refresh */}
              <button
                onClick={() => conn.fetchPorts()}
                disabled={conn.scanning}
                style={{
                  width:36, height:36, borderRadius:10, cursor:'pointer',
                  background:'rgba(255,255,255,0.04)',
                  border:'1px solid var(--border)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  opacity: conn.scanning ? 0.5 : 1,
                }}
              >
                <RefreshCw size={14} style={{ color:'var(--text-muted)' }}
                  className={conn.scanning ? 'animate-spin' : ''}/>
              </button>

              {/* CONNECT */}
              <button
                onClick={async () => {
                  if (!conn.selectedPort) { await conn.fetchPorts(); return }
                  await conn.connectGlove(conn.selectedPort)
                }}
                disabled={conn.connecting || conn.scanning}
                style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'8px 22px', borderRadius:10,
                  background: conn.connecting ? 'rgba(74,127,165,0.55)' : '#4a7fa5',
                  color:'#fff', fontSize:14, fontFamily:'DM Sans', fontWeight:500,
                  border:'none', outline:'none', cursor: conn.connecting ? 'wait' : 'pointer',
                  boxShadow:'0 4px 18px rgba(74,127,165,0.30)',
                  opacity: conn.connecting ? 0.75 : 1,
                  transition:'all 0.2s',
                }}
              >
                {conn.connecting
                  ? <><div style={{
                      width:14, height:14, borderRadius:'50%',
                      border:'2px solid rgba(255,255,255,0.35)',
                      borderTopColor:'#fff',
                      animation:'spin 0.75s linear infinite',
                    }}/> Opening…</>
                  : <><Bluetooth size={14}/> Connect</>
                }
              </button>
            </div>

            {conn.error && (
              <div style={{ display:'flex', alignItems:'center', gap:7, color:'#f87171', fontSize:12.5 }}>
                <AlertCircle size={13}/> {conn.error}
              </div>
            )}

            {conn.ports.length === 0 && !conn.scanning && (
              <p style={{ fontSize:11.5, color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>
                Plug Arduino via USB → Refresh. Close Arduino Serial Monitor if open.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Main: 3D hand + output ─────────────────────────────── */}
      <div style={{ display:'flex', gap:16, flex:1, minHeight:0 }}>

        {/* 3D Hand */}
        <div className="glass-raised rounded-2xl overflow-hidden"
          style={{ flex:1, border:'1px solid var(--border)', minHeight:360, position:'relative' }}>

          {/* Idle overlay */}
          {!glove.gloveConnected && (
            <div style={{
              position:'absolute', inset:0, zIndex:10,
              display:'flex', alignItems:'flex-end', justifyContent:'center',
              paddingBottom:24, pointerEvents:'none',
            }}>
              <div style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'10px 18px', borderRadius:12,
                background:'rgba(12,12,15,0.90)',
                border:'1px solid var(--border)',
              }}>
                <WifiOff size={13} style={{ color:'var(--text-muted)' }}/>
                <span style={{ fontSize:12.5, color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>
                  Waiting for hardware connection…
                </span>
              </div>
            </div>
          )}

          {/* Live badge */}
          {glove.gloveConnected && (
            <div style={{
              position:'absolute', top:14, left:14, zIndex:10,
              display:'flex', alignItems:'center', gap:7,
              padding:'5px 12px', borderRadius:20,
              background:'rgba(12,12,15,0.85)',
              border:'1px solid rgba(74,239,128,0.28)',
            }}>
              <div style={{
                width:7, height:7, borderRadius:'50%',
                background:'#4ade80',
                animation:'glow 2s ease-in-out infinite',
              }}/>
              <span style={{
                fontSize:10, color:'#86efac',
                fontFamily:'JetBrains Mono', letterSpacing:'0.12em',
              }}>
                LIVE
              </span>
            </div>
          )}

          <Hand3DLive
            fingerData={glove.fingerData}
            isConnected={glove.gloveConnected}
          />
        </div>

        {/* Right: recognised + session */}
        <div style={{ width:260, flexShrink:0, display:'flex', flexDirection:'column', gap:12 }}>

          {/* Recognised */}
          <div className="glass-raised rounded-2xl"
            style={{ padding:'20px', border:'1px solid var(--border)', flex:1, display:'flex', flexDirection:'column', gap:12 }}>
            <p style={{
              fontSize:10.5, color:'var(--text-muted)',
              fontFamily:'JetBrains Mono', letterSpacing:'0.12em', textTransform:'uppercase',
            }}>
              Recognised
            </p>

            {!glove.gloveConnected ? (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <p style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center', fontFamily:'DM Sans' }}>
                  Connect glove to start
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {glove.lastGesture ? (
                  <motion.div key={glove.lastGesture.ts}
                    initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                    style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    <p className="font-display font-light text-gradient"
                      style={{ fontSize:46, lineHeight:1.0 }}>
                      {glove.lastGesture.text}
                    </p>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{
                        flex:1, height:4, borderRadius:2, overflow:'hidden',
                        background:'rgba(255,255,255,0.06)',
                      }}>
                        <motion.div
                          initial={{ width:0 }}
                          animate={{ width:`${glove.lastGesture.confidence}%` }}
                          transition={{ duration:0.5 }}
                          style={{
                            height:'100%', borderRadius:2,
                            background:'linear-gradient(90deg,var(--accent),var(--accent-light))',
                          }}
                        />
                      </div>
                      <span style={{ fontSize:11, color:'var(--accent-light)', fontFamily:'JetBrains Mono' }}>
                        {glove.lastGesture.confidence}%
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="idle"
                    initial={{ opacity:0 }} animate={{ opacity:1 }}
                    style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {[0,1,2].map(i => (
                      <motion.div key={i}
                        style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent-muted)' }}
                        animate={{ opacity:[0.3,1,0.3], y:[0,-5,0] }}
                        transition={{ duration:1.0, delay:i*0.22, repeat:Infinity }}
                      />
                    ))}
                    <span style={{ fontSize:13, color:'var(--text-muted)', fontFamily:'DM Sans' }}>
                      Reading gesture…
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Session log */}
          {log.length > 0 && (
            <div className="glass-raised rounded-2xl"
              style={{ padding:'14px 16px', border:'1px solid var(--border)' }}>
              <p style={{
                fontSize:10, color:'var(--text-muted)',
                fontFamily:'JetBrains Mono', letterSpacing:'0.12em',
                textTransform:'uppercase', marginBottom:10,
              }}>
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
                    }}>
                    {g.text}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes glow {
          0%,100% { box-shadow: 0 0 6px rgba(74,222,128,0.5) }
          50%      { box-shadow: 0 0 14px rgba(74,222,128,0.9) }
        }
      `}</style>
    </div>
  )
}