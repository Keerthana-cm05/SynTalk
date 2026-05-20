import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Circle, Square, CheckCircle } from 'lucide-react'
import { useMediaPipe }                  from '../../hooks/useMediaPipe'
import { landmarksToFeatures, sensorToFeatures } from '../../utils/knnClassifier'

const NEED     = 40
const INTERVAL = 60   // ms

export default function GestureRecorder({ source, fingerData, onSamplesReady }) {
  const [phase, setPhase] = useState('idle')   // idle | countdown | recording | done
  const [count, setCount] = useState(0)
  const [cd,    setCd]    = useState(3)
  const [camOn, setCamOn] = useState(false)

  const buf      = useRef([])
  const ticker   = useRef(null)
  const cdTimer  = useRef(null)

  const { videoRef, canvasRef, cameraReady, handVisible }
    = useMediaPipe({ onGesture: () => {}, enabled: source === 'camera' && camOn })

  function collect() {
    let feat = null
    if (source === 'camera') {
      const lms = window.__syntalkLandmarks
      if (lms) feat = landmarksToFeatures(lms)
    } else {
      if (fingerData?.length === 5) feat = sensorToFeatures(fingerData)
    }
    if (!feat) return
    buf.current.push(feat)
    setCount(buf.current.length)
    if (buf.current.length >= NEED) finish()
  }

  function startCountdown() {
    buf.current = []; setCount(0)
    let n = 3; setCd(n); setPhase('countdown')
    cdTimer.current = setInterval(() => {
      n--
      if (n <= 0) { clearInterval(cdTimer.current); startRecording() }
      else setCd(n)
    }, 1000)
  }

  function startRecording() {
    setPhase('recording')
    ticker.current = setInterval(collect, INTERVAL)
  }

  function finish() {
    clearInterval(ticker.current)
    setPhase('done')
    onSamplesReady?.(buf.current)
  }

  function cancel() {
    clearInterval(ticker.current)
    clearInterval(cdTimer.current)
    buf.current = []; setCount(0); setPhase('idle')
  }

  useEffect(() => () => {
    clearInterval(ticker.current)
    clearInterval(cdTimer.current)
  }, [])

  const pct    = Math.min(100, (count / NEED) * 100)
  const canRec = source === 'hardware'
    ? fingerData?.length === 5
    : camOn && cameraReady

  const f = fingerData || [0, 0, 0, 0, 0]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

      {/* ── Camera preview ─────────────────────────────── */}
      {source === 'camera' && (
        !camOn ? (
          <button onClick={() => setCamOn(true)} style={{
            width:'100%', padding:'22px 0', borderRadius:12, cursor:'pointer',
            background:'rgba(74,127,165,0.07)',
            border:'1px dashed rgba(74,127,165,0.28)',
            color:'var(--text-muted)', fontSize:13.5, fontFamily:'DM Sans',
          }}>
            Click to activate camera
          </button>
        ) : (
          <div style={{ position:'relative', borderRadius:12, overflow:'hidden', aspectRatio:'4/3', background:'#000' }}>
            <video ref={videoRef} autoPlay playsInline muted
              style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)' }}/>
            <canvas ref={canvasRef} width={640} height={480}
              style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}/>
            <div style={{
              position:'absolute', top:8, right:8, display:'flex', alignItems:'center', gap:6,
              padding:'4px 10px', borderRadius:20,
              background:'rgba(12,12,15,0.85)',
              border: handVisible ? '1px solid rgba(74,239,128,0.3)' : '1px solid var(--border)',
            }}>
              <div style={{
                width:7, height:7, borderRadius:'50%',
                background: handVisible ? '#4ade80' : 'var(--text-muted)',
              }}/>
              <span style={{ fontSize:10, fontFamily:'JetBrains Mono',
                color: handVisible ? '#86efac' : 'var(--text-muted)' }}>
                {handVisible ? 'Hand detected' : 'No hand'}
              </span>
            </div>
          </div>
        )
      )}

      {/* ── Hardware: live finger bars ──────────────────── */}
      {source === 'hardware' && (
        <div style={{
          padding:'14px 16px', borderRadius:12,
          background:'rgba(255,255,255,0.03)',
          border:'1px solid var(--border)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div style={{
              width:8, height:8, borderRadius:'50%', flexShrink:0,
              background: fingerData?.length===5 ? '#4ade80' : '#f87171',
            }}/>
            <p style={{ fontSize:12.5, color:'var(--text-secondary)', fontFamily:'DM Sans' }}>
              {fingerData?.length===5
                ? 'Glove active — hold your gesture still, then record'
                : 'Connect your glove in Dashboard → Hardware mode first'}
            </p>
          </div>

          {/* Finger bars */}
          {fingerData?.length === 5 && (
            <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
              {[
                { label:'Index',  val: f[1] },
                { label:'Middle', val: f[2] },
                { label:'Ring',   val: f[3] },
                { label:'Pinky',  val: f[4] },
              ].map(({ label, val }) => (
                <div key={label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  {/* Bar track */}
                  <div style={{
                    width:'100%', height:52,
                    borderRadius:6, overflow:'hidden',
                    background:'rgba(255,255,255,0.06)',
                    position:'relative',
                  }}>
                    {/* Fill */}
                    <div style={{
                      position:'absolute', bottom:0, left:0, right:0,
                      height:`${Math.max(2, val*100)}%`,
                      background: val > 0.6
                        ? 'linear-gradient(180deg,#4ade80,#22c55e)'
                        : 'linear-gradient(180deg,var(--accent-light),var(--accent))',
                      borderRadius:6,
                      transition:'height 0.06s linear',
                    }}/>
                    {/* Value label */}
                    <div style={{
                      position:'absolute', inset:0,
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <span style={{
                        fontSize:9, fontFamily:'JetBrains Mono',
                        color: val > 0.45 ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)',
                      }}>
                        {Math.round(val*100)}%
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>
                    {label.slice(0,3).toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* All-zero warning */}
          {fingerData?.length===5 && f[1]===0 && f[2]===0 && f[3]===0 && f[4]===0 && (
            <p style={{ fontSize:11.5, color:'#fde68a', marginTop:10 }}>
              ⚠ All bars are 0. Open and close your fingers a few times to auto-calibrate.
            </p>
          )}
        </div>
      )}

      {/* ── Progress ────────────────────────────────────── */}
      {(phase === 'recording' || phase === 'done') && (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono', letterSpacing:'0.1em', textTransform:'uppercase' }}>
              {phase === 'done' ? 'Complete' : 'Recording…'}
            </span>
            <span style={{ fontSize:11, color:'var(--accent-light)', fontFamily:'JetBrains Mono' }}>
              {count} / {NEED}
            </span>
          </div>
          <div style={{ height:5, borderRadius:3, overflow:'hidden', background:'rgba(255,255,255,0.06)' }}>
            <motion.div
              animate={{ width:`${pct}%` }} transition={{ duration:0.08 }}
              style={{
                height:'100%', borderRadius:3,
                background: phase==='done'
                  ? 'linear-gradient(90deg,#22c55e,#4ade80)'
                  : 'linear-gradient(90deg,var(--accent),var(--accent-light))',
              }}/>
          </div>
        </div>
      )}

      {/* ── Countdown ───────────────────────────────────── */}
      <AnimatePresence>
        {phase === 'countdown' && (
          <motion.div initial={{ opacity:0, scale:0.6 }} animate={{ opacity:1, scale:1 }}
            exit={{ opacity:0 }} style={{ textAlign:'center', padding:'4px 0' }}>
            <span className="font-display text-gradient" style={{ fontSize:60, lineHeight:1 }}>
              {cd}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Buttons ─────────────────────────────────────── */}
      {phase === 'idle' && (
        <button onClick={startCountdown} disabled={!canRec} style={{
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          width:'100%', padding:'13px 0', borderRadius:12,
          background: canRec ? '#4a7fa5' : 'rgba(74,127,165,0.28)',
          color:'#fff', fontSize:14, fontFamily:'DM Sans', fontWeight:500,
          border:'none', cursor: canRec ? 'pointer' : 'not-allowed',
          boxShadow: canRec ? '0 4px 18px rgba(74,127,165,0.24)' : 'none',
        }}>
          <Circle size={14} fill="currentColor"/> Start Recording
        </button>
      )}

      {(phase === 'countdown' || phase === 'recording') && (
        <button onClick={cancel} style={{
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          width:'100%', padding:'13px 0', borderRadius:12,
          background:'rgba(239,68,68,0.10)',
          border:'1px solid rgba(239,68,68,0.22)',
          color:'#fca5a5', fontSize:14, fontFamily:'DM Sans', cursor:'pointer',
        }}>
          <Square size={14} fill="currentColor"/> Cancel
        </button>
      )}

      {phase === 'done' && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            padding:'13px 0', borderRadius:12,
            background:'rgba(34,197,94,0.10)',
            border:'1px solid rgba(34,197,94,0.22)',
          }}>
            <CheckCircle size={16} style={{ color:'#4ade80' }}/>
            <span style={{ fontSize:14, color:'#86efac', fontFamily:'DM Sans' }}>
              {count} samples ready — save below
            </span>
          </div>
          <button onClick={cancel} style={{
            fontSize:12.5, color:'var(--text-muted)',
            textAlign:'center', background:'none', border:'none', cursor:'pointer',
          }}>
            Re-record
          </button>
        </div>
      )}

      <style>{`@keyframes pulse-dot { 0%,100%{opacity:1}50%{opacity:0.35} }`}</style>
    </div>
  )
}