import { useState, useRef, useEffect } from 'react'
import { useNavigate }      from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth }          from '../../context/AuthContext'
import { db }               from '../../firebase/config'
import { doc, updateDoc }   from 'firebase/firestore'
import { useMediaPipe }     from '../../hooks/useMediaPipe'
import { landmarksToFeatures } from '../../utils/knnClassifier'
import {
  Hand, ArrowRight, Camera, CheckCircle,
  Circle, Square, ChevronRight, Lock
} from 'lucide-react'
import { useGloveWebSocket } from '../../hooks/useGloveWebSocket'
import { useGloveConnect }   from '../../hooks/useGloveConnect'
import { sensorToFeatures }  from '../../utils/knnClassifier'

const SAMPLES_NEEDED = 30
const INTERVAL_MS    = 80

const STEPS = [
  { id:'intro',     title:'Welcome',              desc:'Set up your gesture authentication' },
  { id:'camera1',   title:'Camera Gesture 1',     desc:'Record a camera-based login gesture' },
  { id:'camera2',   title:'Camera Gesture 2',     desc:'Record a second camera gesture' },
  { id:'hardware',  title:'Hardware Gesture',     desc:'Record a glove-based login gesture' },
  { id:'done',      title:'All Set!',              desc:'Your gestures are saved' },
]

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2">
          <div style={{
            width: 28, height: 28, borderRadius:'50%',
            display:'flex', alignItems:'center', justifyContent:'center',
            background: i < current
              ? 'rgba(34,197,94,0.15)'
              : i === current
              ? 'rgba(74,127,165,0.20)'
              : 'rgba(255,255,255,0.05)',
            border: i < current
              ? '1px solid rgba(34,197,94,0.30)'
              : i === current
              ? '1px solid rgba(74,127,165,0.35)'
              : '1px solid var(--border)',
            transition: 'all 0.3s',
          }}>
            {i < current
              ? <CheckCircle size={13} style={{ color:'#4ade80' }}/>
              : <span style={{
                  fontSize:11, fontFamily:'JetBrains Mono',
                  color: i===current ? 'var(--accent-light)' : 'var(--text-muted)',
                }}>{i+1}</span>
            }
          </div>
          {i < STEPS.length - 1 && (
            <div style={{
              width:24, height:1,
              background: i < current
                ? 'rgba(34,197,94,0.4)'
                : 'var(--border)',
              transition:'background 0.3s',
            }}/>
          )}
        </div>
      ))}
    </div>
  )
}

function GestureRecordStep({ stepNum, onDone }) {
  const [phase,    setPhase]    = useState('idle')
  const [count,    setCount]    = useState(0)
  const [cd,       setCd]       = useState(3)
  const [camOn,    setCamOn]    = useState(false)
  const buf      = useRef([])
  const ticker   = useRef(null)
  const cdTimer  = useRef(null)

  const { videoRef, canvasRef, cameraReady, handVisible }
    = useMediaPipe({ onGesture: ()=>{}, enabled: camOn })

  function collect() {
    const lms = window.__syntalkLandmarks
    if (!lms) return
    const feat = landmarksToFeatures(lms)
    if (!feat) return
    buf.current.push(feat)
    setCount(buf.current.length)
    if (buf.current.length >= SAMPLES_NEEDED) finish()
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
    ticker.current = setInterval(collect, INTERVAL_MS)
  }

  function finish() {
    clearInterval(ticker.current)
    setPhase('done')
    onDone(buf.current)
  }

  function reset() {
    clearInterval(ticker.current)
    clearInterval(cdTimer.current)
    buf.current = []; setCount(0); setPhase('idle')
  }

  const pct = Math.min(100, (count / SAMPLES_NEEDED) * 100)

  return (
    <div className="flex flex-col gap-4">
      <div style={{
        padding:'12px 14px', borderRadius:12,
        background:'rgba(74,127,165,0.07)',
        border:'1px solid rgba(74,127,165,0.15)',
      }}>
        <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>
          Choose a unique gesture for <strong style={{ color:'var(--accent-light)' }}>
          Gesture {stepNum}</strong>. Hold it steady and click record.
          Use a gesture you can repeat consistently.
        </p>
      </div>

      {/* Camera */}
      {!camOn ? (
        <button onClick={() => setCamOn(true)} style={{
          width:'100%', padding:'20px 0', borderRadius:12, cursor:'pointer',
          background:'rgba(74,127,165,0.07)',
          border:'1px dashed rgba(74,127,165,0.28)',
          color:'var(--text-muted)', fontSize:13.5, fontFamily:'DM Sans',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        }}>
          <Camera size={16}/> Activate Camera
        </button>
      ) : (
        <div style={{ position:'relative', borderRadius:12, overflow:'hidden', aspectRatio:'4/3', background:'#000' }}>
          <video ref={videoRef} autoPlay playsInline muted
            style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)' }}/>
          <canvas ref={canvasRef} width={640} height={480}
            style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}/>
          <div style={{
            position:'absolute', top:8, right:8,
            display:'flex', alignItems:'center', gap:6,
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
      )}

      {/* Progress */}
      {(phase === 'recording' || phase === 'done') && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono', textTransform:'uppercase', letterSpacing:'0.1em' }}>
              {phase==='done' ? 'Complete' : 'Recording…'}
            </span>
            <span style={{ fontSize:11, color:'var(--accent-light)', fontFamily:'JetBrains Mono' }}>
              {count} / {SAMPLES_NEEDED}
            </span>
          </div>
          <div style={{ height:5, borderRadius:3, overflow:'hidden', background:'rgba(255,255,255,0.06)' }}>
            <motion.div
              animate={{ width:`${pct}%` }} transition={{ duration:0.1 }}
              style={{
                height:'100%', borderRadius:3,
                background: phase==='done'
                  ? 'linear-gradient(90deg,#22c55e,#4ade80)'
                  : 'linear-gradient(90deg,var(--accent),var(--accent-light))',
              }}/>
          </div>
        </div>
      )}

      <AnimatePresence>
        {phase === 'countdown' && (
          <motion.div initial={{ opacity:0, scale:0.7 }} animate={{ opacity:1, scale:1 }}
            exit={{ opacity:0 }} style={{ textAlign:'center', padding:'4px 0' }}>
            <span className="font-display text-gradient" style={{ fontSize:60, lineHeight:1 }}>
              {cd}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      {phase === 'idle' && (
        <button onClick={startCountdown} disabled={!camOn || !cameraReady} style={{
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          width:'100%', padding:'12px 0', borderRadius:12,
          background: (camOn && cameraReady) ? '#4a7fa5' : 'rgba(74,127,165,0.25)',
          color:'#fff', fontSize:14, fontFamily:'DM Sans', fontWeight:500,
          border:'none', cursor: (camOn && cameraReady) ? 'pointer' : 'not-allowed',
          boxShadow: (camOn && cameraReady) ? '0 4px 18px rgba(74,127,165,0.24)' : 'none',
        }}>
          <Circle size={13} fill="currentColor"/> Start Recording
        </button>
      )}

      {(phase === 'countdown' || phase === 'recording') && (
        <button onClick={reset} style={{
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          width:'100%', padding:'12px 0', borderRadius:12,
          background:'rgba(239,68,68,0.10)',
          border:'1px solid rgba(239,68,68,0.22)',
          color:'#fca5a5', fontSize:14, fontFamily:'DM Sans', cursor:'pointer',
        }}>
          <Square size={13} fill="currentColor"/> Cancel
        </button>
      )}

      {phase === 'done' && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            padding:'12px 0', borderRadius:12,
            background:'rgba(34,197,94,0.10)',
            border:'1px solid rgba(34,197,94,0.22)',
          }}>
            <CheckCircle size={15} style={{ color:'#4ade80' }}/>
            <span style={{ fontSize:14, color:'#86efac', fontFamily:'DM Sans' }}>
              {count} samples recorded!
            </span>
          </div>
          <button onClick={reset} style={{
            fontSize:12.5, color:'var(--text-muted)',
            textAlign:'center', background:'none', border:'none', cursor:'pointer',
          }}>
            Re-record
          </button>
        </div>
      )}
    </div>
  )
}

function HardwareSetupStep({ onDone }) {
  const glove   = useGloveWebSocket()
  const conn    = useGloveConnect()
  const [phase, setPhase] = useState('idle')
  const [count, setCount] = useState(0)
  const [cd,    setCd]    = useState(3)
  const buf     = useRef([])
  const ticker  = useRef(null)
  const cdTimer = useRef(null)

  useEffect(() => { conn.fetchPorts() }, [])

  function collect() {
    const feat = sensorToFeatures(glove.fingerData)
    if (!feat) return
    buf.current.push(feat)
    setCount(buf.current.length)
    if (buf.current.length >= 40) finish()
  }

  function startCountdown() {
    buf.current = []; setCount(0); setPhase('countdown')
    let n = 3; setCd(n)
    cdTimer.current = setInterval(() => {
      n--
      if (n <= 0) { clearInterval(cdTimer.current); startRecording() }
      else setCd(n)
    }, 1000)
  }

  function startRecording() {
    setPhase('recording')
    ticker.current = setInterval(collect, 60)
  }

  function finish() {
    clearInterval(ticker.current)
    setPhase('done')
    onDone(buf.current)
  }

  function cancel() {
    clearInterval(ticker.current); clearInterval(cdTimer.current)
    buf.current = []; setCount(0); setPhase('idle')
  }

  const pct = Math.min(100, (count/40)*100)
  const f   = glove.fingerData

  return (
    <div className="flex flex-col gap-3">
      {/* Glove connect */}
      {!glove.gloveConnected ? (
        <div className="glass rounded-xl p-4 flex flex-col gap-3"
          style={{ border:'1px solid var(--border)' }}>
          <p style={{ fontSize:13, color:'var(--text-secondary)' }}>
            Connect your glove to record a hardware gesture
          </p>
          <div style={{ display:'flex', gap:8 }}>
            <select
              value={conn.selectedPort}
              onChange={e => conn.setSelectedPort(e.target.value)}
              style={{
                flex:1, padding:'8px 12px', borderRadius:10, appearance:'none',
                background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)',
                color:'var(--text-primary)', fontSize:13, fontFamily:'JetBrains Mono', outline:'none',
              }}>
              {conn.ports.length===0
                ? <option>No ports found</option>
                : conn.ports.map(p => (
                    <option key={p.path} value={p.path}
                      style={{ background:'#13131a', color:'#eeeef2' }}>
                      {p.path}{p.isArduino?' ✓':''}
                    </option>
                  ))
              }
            </select>
            <button onClick={() => conn.connectGlove(conn.selectedPort)}
              disabled={conn.connecting}
              style={{
                padding:'8px 16px', borderRadius:10, cursor:'pointer',
                background:'#4a7fa5', color:'#fff', border:'none', fontSize:13,
              }}>
              {conn.connecting ? '…' : 'Connect'}
            </button>
          </div>
        </div>
      ) : (
        <div className="glass rounded-xl p-4"
          style={{ border:'1px solid rgba(74,239,128,0.2)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#4ade80', animation:'pulse 1s infinite' }}/>
            <span style={{ fontSize:13, color:'#86efac' }}>Glove connected — hold your gesture steady</span>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {[
              {label:'I',val:f[1]??0},{label:'M',val:f[2]??0},
              {label:'R',val:f[3]??0},{label:'P',val:f[4]??0},
            ].map(({label,val}) => (
              <div key={label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{ width:'100%', height:36, borderRadius:5, background:'rgba(255,255,255,0.06)', overflow:'hidden', position:'relative' }}>
                  <div style={{
                    position:'absolute', bottom:0, left:0, right:0,
                    height:`${Math.max(2,val*100)}%`,
                    background:'linear-gradient(180deg,var(--accent-light),var(--accent))',
                    borderRadius:5, transition:'height 0.06s',
                  }}/>
                </div>
                <span style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress */}
      {(phase==='recording'||phase==='done') && (
        <div className="flex flex-col gap-1.5">
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono', textTransform:'uppercase', letterSpacing:'0.1em' }}>
              {phase==='done'?'Complete':'Recording…'}
            </span>
            <span style={{ fontSize:11, color:'var(--accent-light)', fontFamily:'JetBrains Mono' }}>
              {count}/40
            </span>
          </div>
          <div style={{ height:5, borderRadius:3, overflow:'hidden', background:'rgba(255,255,255,0.06)' }}>
            <motion.div animate={{ width:`${pct}%` }} transition={{ duration:0.1 }}
              style={{
                height:'100%', borderRadius:3,
                background: phase==='done'
                  ? 'linear-gradient(90deg,#22c55e,#4ade80)'
                  : 'linear-gradient(90deg,var(--accent),var(--accent-light))',
              }}/>
          </div>
        </div>
      )}

      <AnimatePresence>
        {phase==='countdown' && (
          <motion.div initial={{opacity:0,scale:0.6}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
            style={{ textAlign:'center', padding:'4px 0' }}>
            <span className="font-display text-gradient" style={{ fontSize:56, lineHeight:1 }}>{cd}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {phase==='idle' && (
        <button onClick={startCountdown} disabled={!glove.gloveConnected}
          style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            width:'100%', padding:'12px 0', borderRadius:12,
            background: glove.gloveConnected ? '#4a7fa5' : 'rgba(74,127,165,0.28)',
            color:'#fff', fontSize:14, fontFamily:'DM Sans', fontWeight:500,
            border:'none', cursor: glove.gloveConnected ? 'pointer' : 'not-allowed',
          }}>
          <Circle size={13} fill="currentColor"/> Start Recording
        </button>
      )}

      {(phase==='countdown'||phase==='recording') && (
        <button onClick={cancel}
          style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            width:'100%', padding:'12px 0', borderRadius:12,
            background:'rgba(239,68,68,0.10)', border:'1px solid rgba(239,68,68,0.22)',
            color:'#fca5a5', fontSize:14, fontFamily:'DM Sans', cursor:'pointer',
          }}>
          <Square size={13} fill="currentColor"/> Cancel
        </button>
      )}

      {phase==='done' && (
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          padding:'12px 0', borderRadius:12,
          background:'rgba(34,197,94,0.10)', border:'1px solid rgba(34,197,94,0.22)',
        }}>
          <CheckCircle size={15} style={{ color:'#4ade80' }}/>
          <span style={{ fontSize:14, color:'#86efac' }}>{count} samples recorded ✓</span>
        </div>
      )}
    </div>
  )
}

export default function GestureSetupPage() {
  const { user, fetchUserProfile } = useAuth()
  const navigate     = useNavigate()
  const [step,       setStep]       = useState(0)
  const [gesture1,   setGesture1]   = useState(null)
  const [gesture2,   setGesture2]   = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [hwGesture,  setHwGesture]  = useState(null)
  
async function handleFinish() {
  if (!user) return
  setSaving(true)
  try {
    // Save hardware gesture to Firestore if recorded
    if (hwGesture && hwGesture.length > 0) {
      const { setDoc, doc } = await import('firebase/firestore')
      await setDoc(
        doc(db, 'users', user.uid, 'gestures', 'hardware_login_gesture'),
        {
          name:      'Login Gesture',
          samples:   hwGesture.map(v => ({ v: Array.from(v) })),
          source:    'hardware',
          count:     hwGesture.length,
          createdAt: (await import('firebase/firestore')).serverTimestamp(),
        }
      )
    }

    await updateDoc(doc(db, 'users', user.uid), {
      gestureSetupComplete: true,
      gestureSamplesCount: (gesture1?.length||0) + (gesture2?.length||0) + (hwGesture?.length||0),
    })

    await fetchUserProfile(user.uid)
    sessionStorage.removeItem('syntalk_welcomed')
    navigate('/dashboard')
  } catch (e) {
    console.error('handleFinish:', e)
  } finally {
    setSaving(false)
  }
}

  const firstName = user?.displayName?.split(' ')[0] || 'there'

  return (
    <div className="dashboard-bg noise min-h-screen flex items-center justify-center px-6 py-12">
      <div style={{ width:'100%', maxWidth:520 }}>

        {/* Logo */}
        <motion.div
          initial={{ opacity:0, y:-16 }}
          animate={{ opacity:1, y:0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2.5">
            <div style={{ position:'relative', width:36, height:36 }}>
              <div style={{ position:'absolute', inset:0, borderRadius:12, background:'rgba(74,127,165,0.20)' }}/>
              <div style={{
                position:'absolute', inset:3, borderRadius:9,
                background:'linear-gradient(135deg,#6a9fc5,#3a6f95)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <span style={{ color:'#fff', fontSize:11, fontWeight:'bold', fontFamily:'JetBrains Mono' }}>ST</span>
              </div>
            </div>
            <span className="font-display font-semibold tracking-wide"
              style={{ fontSize:22, color:'var(--text-primary)' }}>
              Syn<span style={{ color:'var(--accent-light)' }}>Talk</span>
            </span>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity:0, y:24, scale:0.97 }}
          animate={{ opacity:1, y:0, scale:1 }}
          transition={{ duration:0.7, ease:[0.22,1,0.36,1] }}
          className="glass-overlay rounded-2xl p-8"
          style={{ border:'1px solid rgba(255,255,255,0.09)' }}
        >
          <StepIndicator current={step}/>

          <AnimatePresence mode="wait">
            {/* Step 0 — Intro */}
            {step === 0 && (
              <motion.div key="intro"
                initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-20 }}
                className="flex flex-col gap-5"
              >
                <div className="text-center">
                  <div style={{
                    width:60, height:60, borderRadius:18,
                    background:'rgba(74,127,165,0.12)',
                    border:'1px solid rgba(74,127,165,0.22)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    margin:'0 auto 16px',
                  }}>
                    <Hand size={28} style={{ color:'var(--accent-light)' }}/>
                  </div>
                  <h1 className="font-display font-light"
                    style={{ fontSize:28, color:'var(--text-primary)', marginBottom:8 }}>
                    Welcome, {firstName}!
                  </h1>
                  <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.7 }}>
                    Let's set up your personalised gesture recognition.
                    You'll record two unique gestures that the system will learn.
                  </p>
                </div>

                <div style={{
                  padding:'14px 16px', borderRadius:12,
                  background:'rgba(255,255,255,0.03)',
                  border:'1px solid var(--border)',
                }}>
                  {[
                    { icon:<Camera size={14}/>,       text:'Camera-based gesture recognition' },
                    { icon:<Lock size={14}/>,          text:'Gestures saved securely to your account' },
                    { icon:<CheckCircle size={14}/>,   text:'30 samples per gesture for accuracy' },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display:'flex', alignItems:'center', gap:10,
                      padding:'8px 0',
                      borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                    }}>
                      <span style={{ color:'var(--accent-light)', flexShrink:0 }}>{item.icon}</span>
                      <span style={{ fontSize:13, color:'var(--text-secondary)', fontFamily:'DM Sans' }}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>

                <button onClick={() => setStep(1)} style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  width:'100%', padding:'13px 0', borderRadius:12,
                  background:'#4a7fa5', color:'#fff',
                  fontSize:14, fontFamily:'DM Sans', fontWeight:500,
                  border:'none', cursor:'pointer',
                  boxShadow:'0 4px 18px rgba(74,127,165,0.26)',
                }}>
                  Get Started <ArrowRight size={15}/>
                </button>

                <button
                  onClick={handleFinish}
                  style={{
                    fontSize:12.5, color:'var(--text-muted)',
                    textAlign:'center', background:'none', border:'none', cursor:'pointer',
                  }}>
                  Skip for now →
                </button>
              </motion.div>
            )}

            {/* Step 1 — Record gesture 1 */}
            {step === 1 && (
              <motion.div key="record1"
                initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-20 }}
                className="flex flex-col gap-4"
              >
                <div>
                  <h2 className="font-display font-light"
                    style={{ fontSize:22, color:'var(--text-primary)', marginBottom:4 }}>
                    Gesture 1 — Login Gesture
                  </h2>
                  <p style={{ fontSize:13, color:'var(--text-muted)' }}>
                    This gesture will be used to log in to SynTalk.
                  </p>
                </div>

                <GestureRecordStep stepNum={1} onDone={samples => setGesture1(samples)}/>

                {gesture1 && gesture1.length >= 10 && (
                  <button onClick={() => setStep(2)} style={{
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    width:'100%', padding:'13px 0', borderRadius:12,
                    background:'#4a7fa5', color:'#fff',
                    fontSize:14, fontFamily:'DM Sans', fontWeight:500,
                    border:'none', cursor:'pointer',
                    boxShadow:'0 4px 18px rgba(74,127,165,0.26)',
                  }}>
                    Next <ChevronRight size={15}/>
                  </button>
                )}
              </motion.div>
            )}

            {/* Step 2 — Record gesture 2 */}
            {step === 2 && (
              <motion.div key="record2"
                initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-20 }}
                className="flex flex-col gap-4"
              >
                <div>
                  <h2 className="font-display font-light"
                    style={{ fontSize:22, color:'var(--text-primary)', marginBottom:4 }}>
                    Gesture 2 — Backup Gesture
                  </h2>
                  <p style={{ fontSize:13, color:'var(--text-muted)' }}>
                    A different gesture as a backup login option.
                  </p>
                </div>

                <GestureRecordStep stepNum={2} onDone={samples => setGesture2(samples)}/>

                {gesture2 && gesture2.length >= 10 && (
                  <button onClick={() => setStep(3)} style={{
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    width:'100%', padding:'13px 0', borderRadius:12,
                    background:'#4a7fa5', color:'#fff',
                    fontSize:14, fontFamily:'DM Sans', fontWeight:500,
                    border:'none', cursor:'pointer',
                    boxShadow:'0 4px 18px rgba(74,127,165,0.26)',
                  }}>
                    Next <ChevronRight size={15}/>
                  </button>
                )}
              </motion.div>
            )}
{/* Step 3 — Hardware gesture */}
{step === 3 && (
  <motion.div key="hardware"
    initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
    exit={{ opacity:0, x:-20 }}
    className="flex flex-col gap-4"
  >
    <div>
      <h2 className="font-display font-light"
        style={{ fontSize:22, color:'var(--text-primary)', marginBottom:4 }}>
        Hardware Gesture Login
      </h2>
      <p style={{ fontSize:13, color:'var(--text-muted)' }}>
        Optional but recommended — use your glove to log in.
      </p>
    </div>

    <HardwareSetupStep onDone={samples => { setHwGesture(samples); setStep(4) }} />

    <button
      onClick={() => setStep(4)}
      style={{
        fontSize:13, color:'var(--text-muted)',
        textAlign:'center', background:'none', border:'none', cursor:'pointer',
      }}>
      Skip hardware setup →
    </button>
  </motion.div>
)}
            {/* Step 4 — Done */}
            {step === 4 && (
              <motion.div key="done"
                initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0 }}
                className="flex flex-col items-center gap-5 text-center"
              >
                <motion.div
                  initial={{ scale:0 }} animate={{ scale:1 }}
                  transition={{ delay:0.2, type:'spring', stiffness:200 }}
                  style={{
                    width:70, height:70, borderRadius:'50%',
                    background:'rgba(34,197,94,0.15)',
                    border:'2px solid rgba(34,197,94,0.35)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}
                >
                  <CheckCircle size={32} style={{ color:'#4ade80' }}/>
                </motion.div>

                <div>
                  <h2 className="font-display font-light"
                    style={{ fontSize:26, color:'var(--text-primary)', marginBottom:8 }}>
                    All set, {firstName}!
                  </h2>
                  <p style={{ fontSize:13.5, color:'var(--text-muted)', lineHeight:1.7 }}>
                    Your gestures have been recorded. You can retrain them anytime
                    from the Training page.
                  </p>
                </div>

                <div style={{
                  width:'100%', padding:'14px 16px', borderRadius:12,
                  background:'rgba(255,255,255,0.03)',
                  border:'1px solid var(--border)',
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:13, color:'var(--text-secondary)' }}>Gesture 1</span>
                    <span style={{ fontSize:12, color:'#4ade80', fontFamily:'JetBrains Mono' }}>
                      {gesture1?.length || 0} samples ✓
                    </span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:13, color:'var(--text-secondary)' }}>Gesture 2</span>
                    <span style={{ fontSize:12, color:'#4ade80', fontFamily:'JetBrains Mono' }}>
                      {gesture2?.length || 0} samples ✓
                    </span>
                  </div>
                </div>

                <button onClick={handleFinish} disabled={saving} style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  width:'100%', padding:'13px 0', borderRadius:12,
                  background: saving ? 'rgba(74,127,165,0.5)' : '#4a7fa5',
                  color:'#fff', fontSize:14, fontFamily:'DM Sans', fontWeight:500,
                  border:'none', cursor: saving ? 'wait' : 'pointer',
                  boxShadow:'0 4px 18px rgba(74,127,165,0.26)',
                  opacity: saving ? 0.8 : 1,
                }}>
                  {saving ? (
                    <><div style={{
                      width:15, height:15, borderRadius:'50%',
                      border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff',
                      animation:'spin 0.75s linear infinite',
                    }}/> Saving…</>
                  ) : (
                    <>Enter SynTalk <ArrowRight size={15}/></>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  )
}