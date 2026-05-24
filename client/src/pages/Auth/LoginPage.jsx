import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate }       from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Lock, ArrowRight, AlertCircle,
  Camera, Cpu, ChevronDown,
} from 'lucide-react'
import { useAuth }           from '../../context/AuthContext'
import { db }                from '../../firebase/config'
import { collection, getDocs } from 'firebase/firestore'
import AuthBackground        from '../../components/ui/AuthBackground'
import InputField            from '../../components/ui/InputField'
import { useMediaPipe }      from '../../hooks/useMediaPipe'
import { useGloveWebSocket } from '../../hooks/useGloveWebSocket'
import { useGloveConnect }   from '../../hooks/useGloveConnect'
import {
  landmarksToFeatures,
  sensorToFeatures,
} from '../../utils/knnClassifier'

// ── Cosine similarity ─────────────────────────────────────────────
function cosineSim(a, b) {
  if (!a || !b || a.length !== b.length) return 0
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na  += a[i] * a[i]
    nb  += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

function matchGesture(features, samples, threshold = 0.70) {
  if (!samples?.length) return { match: false, confidence: 0 }
  let best = 0
  for (const s of samples) {
    const vec = Array.isArray(s) ? s : (s?.v || [])
    if (vec.length === 0) continue
    const sim = cosineSim(features, vec)
    if (sim > best) best = sim
  }
  return { match: best >= threshold, confidence: Math.round(best * 100) }
}

// ── Load gestures after auth ──────────────────────────────────────
// IMPORTANT: User must be signed in before calling this
async function loadUserGestures(uid, source) {
  const ref  = collection(db, 'users', uid, 'gestures')
  const snap = await getDocs(ref)
  const gestures = []
  snap.forEach(docSnap => {
    const d = docSnap.data()
    if (d.source === source) {
      const samples = (d.samples || []).map(s =>
        Array.isArray(s) ? s : (s?.v || [])
      ).filter(v => v.length > 0)
      if (samples.length > 0) gestures.push({ name: d.name, samples })
    }
  })
  return gestures
}

// ── Tab definitions ───────────────────────────────────────────────
const TABS = [
  { id: 'email',    label: 'Email',    icon: Mail   },
  { id: 'camera',   label: 'Camera',   icon: Camera },
  { id: 'hardware', label: 'Hardware', icon: Cpu    },
]

// ═══════════════════════════════════════════════════════════════════
// EMAIL LOGIN
// ═══════════════════════════════════════════════════════════════════
function EmailLogin({ onSuccess }) {
  const { login }               = useAuth()
  const [form,      setForm]    = useState({ email: '', password: '' })
  const [errors,    setErrors]  = useState({})
  const [authError, setAuth]    = useState('')
  const [loading,   setLoading] = useState(false)

  function validate() {
    const e = {}
    if (!form.email.trim()) e.email    = 'Email required'
    if (!form.password)     e.password = 'Password required'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    setAuth('')
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await login(form.email, form.password)
      onSuccess()
    } catch (err) {
      const MAP = {
        'auth/user-not-found':    'No account with this email.',
        'auth/wrong-password':    'Incorrect password.',
        'auth/invalid-email':     'Invalid email address.',
        'auth/invalid-credential':'Invalid email or password.',
        'auth/too-many-requests': 'Too many attempts. Please wait.',
      }
      setAuth(MAP[err.code] || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {authError && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background:'rgba(239,68,68,0.10)', border:'1px solid rgba(239,68,68,0.20)' }}>
          <AlertCircle size={15} style={{ color:'#f87171', flexShrink:0 }}/>
          <p style={{ fontSize:13.5, color:'#fca5a5' }}>{authError}</p>
        </div>
      )}

      <InputField
        label="Email address" type="email"
        value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })}
        placeholder="you@example.com"
        icon={<Mail size={15}/>}
        error={errors.email}
        autoComplete="email"
        disabled={loading}
      />

      <InputField
        label="Password" type="password"
        value={form.password}
        onChange={e => setForm({ ...form, password: e.target.value })}
        placeholder="Enter your password"
        icon={<Lock size={15}/>}
        error={errors.password}
        autoComplete="current-password"
        disabled={loading}
      />

      <button type="submit" disabled={loading}
        style={{
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          width:'100%', padding:'13px 0', borderRadius:12,
          background: loading ? 'rgba(74,127,165,0.6)' : '#4a7fa5',
          color:'#fff', border:'none',
          cursor: loading ? 'wait' : 'pointer',
          fontSize:14, fontFamily:'DM Sans', fontWeight:500,
          boxShadow:'0 4px 20px rgba(74,127,165,0.25)',
        }}>
        {loading ? (
          <><div style={{ width:16, height:16, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', animation:'spin 0.75s linear infinite' }}/> Signing in…</>
        ) : (
          <>Sign In <ArrowRight size={15}/></>
        )}
      </button>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════
// CAMERA GESTURE LOGIN
// Strategy: Sign in with email+password first (silently),
//           then immediately verify gesture.
//           This ensures Firestore auth is valid.
// ═══════════════════════════════════════════════════════════════════
function CameraLogin({ onSuccess }) {
  const { login }                     = useAuth()
  const [step,      setStep]          = useState('credentials') // credentials | scan
  const [email,     setEmail]         = useState('')
  const [password,  setPassword]      = useState('')
  const [status,    setStatus]        = useState('')
  const [error,     setError]         = useState('')
  const [logging,   setLogging]       = useState(false)
  const [gestures,  setGestures]      = useState([])
  const verifiedRef                   = useRef(false)

  // Only mount MediaPipe when on scan step
  const { videoRef, canvasRef, cameraReady, handVisible }
    = useMediaPipe({ onGesture: () => {}, enabled: step === 'scan' })

  // Check landmarks against gestures every 200ms
  useEffect(() => {
    if (step !== 'scan' || gestures.length === 0) return
    if (verifiedRef.current) return

    const interval = setInterval(() => {
      const lms = window.__syntalkLandmarks
      if (!lms) return

      const features = landmarksToFeatures(lms)
      if (!features) return

      for (const g of gestures) {
        const result = matchGesture(features, g.samples, 0.70)
        if (result.match) {
          verifiedRef.current = true
          clearInterval(interval)
          setStatus(`✓ Gesture matched (${result.confidence}%) — Welcome!`)
          setTimeout(() => onSuccess(), 600)
          return
        }
      }

      setStatus(handVisible ? 'Hand detected — hold your gesture steady…' : 'Show your registered gesture')
    }, 200)

    return () => clearInterval(interval)
  }, [step, gestures, handVisible, onSuccess])

  async function handleContinue(ev) {
    ev.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Enter both email and password')
      return
    }
    setError('')
    setLogging(true)

    try {
      // Sign in first — this gives us auth context for Firestore
      const result = await login(email, password)
      const uid    = result.user.uid

      // Now load gestures — user is authenticated so rules allow it
      const userGestures = await loadUserGestures(uid, 'camera')

      if (userGestures.length === 0) {
        setError('No camera gestures found. Train gestures in Training page first.')
        setLogging(false)
        // Sign out since we only wanted to load gestures
        const { signOut } = await import('firebase/auth')
        const { auth }    = await import('../../firebase/config')
        await signOut(auth)
        return
      }

      setGestures(userGestures)
      setStep('scan')
      setStatus('Show your registered gesture to the camera')
    } catch (err) {
      const MAP = {
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/user-not-found':     'No account with this email.',
        'auth/wrong-password':     'Incorrect password.',
      }
      setError(MAP[err.code] || err.message)
    } finally {
      setLogging(false)
    }
  }

  if (step === 'credentials') {
    return (
      <form onSubmit={handleContinue} className="flex flex-col gap-4">
        <div className="rounded-xl px-4 py-3"
          style={{ background:'rgba(74,127,165,0.07)', border:'1px solid rgba(74,127,165,0.15)' }}>
          <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>
            Enter your credentials, then verify your identity using your registered camera gesture.
          </p>
        </div>

        <InputField
          label="Email" type="email"
          value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com" icon={<Mail size={15}/>}
          autoComplete="email"
        />
        <InputField
          label="Password" type="password"
          value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Your password" icon={<Lock size={15}/>}
          autoComplete="current-password"
        />

        {error && (
          <div className="flex items-center gap-2"
            style={{ color:'#f87171', fontSize:13 }}>
            <AlertCircle size={13}/> {error}
          </div>
        )}

        <button type="submit" disabled={logging}
          style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            width:'100%', padding:'13px 0', borderRadius:12,
            background: logging ? 'rgba(74,127,165,0.55)' : '#4a7fa5',
            color:'#fff', border:'none',
            cursor: logging ? 'wait' : 'pointer',
            fontSize:14, fontFamily:'DM Sans', fontWeight:500,
            boxShadow:'0 4px 20px rgba(74,127,165,0.25)',
          }}>
          {logging ? (
            <><div style={{ width:16, height:16, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', animation:'spin 0.75s linear infinite' }}/> Loading gestures…</>
          ) : (
            <>Continue to Camera <ArrowRight size={15}/></>
          )}
        </button>
      </form>
    )
  }

  // Scan step
  return (
    <div className="flex flex-col gap-4">
      <div style={{ position:'relative', borderRadius:14, overflow:'hidden', aspectRatio:'4/3', background:'#000' }}>
        <video ref={videoRef} autoPlay playsInline muted
          style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)' }}/>
        <canvas ref={canvasRef} width={640} height={480}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}/>

        {/* Status bar */}
        <div style={{
          position:'absolute', bottom:10, left:'50%', transform:'translateX(-50%)',
          padding:'7px 16px', borderRadius:20, whiteSpace:'nowrap',
          background:'rgba(10,10,14,0.88)',
          border: handVisible
            ? '1px solid rgba(74,239,128,0.3)'
            : '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{
              width:7, height:7, borderRadius:'50%',
              background: status.startsWith('✓') ? '#4ade80' : handVisible ? '#4ade80' : 'var(--text-muted)',
              animation: handVisible ? 'pulse 1s infinite' : 'none',
            }}/>
            <span style={{
              fontSize:12, fontFamily:'JetBrains Mono',
              color: status.startsWith('✓') ? '#86efac' : handVisible ? '#86efac' : 'var(--text-muted)',
            }}>
              {status || 'Show your registered gesture'}
            </span>
          </div>
        </div>

        {/* Scanning line */}
        <AnimatePresence>
          {handVisible && !status.startsWith('✓') && (
            <motion.div
              className="absolute left-0 right-0 h-px pointer-events-none"
              animate={{ top:['0%','100%','0%'], opacity:[0,0.75,0] }}
              transition={{ duration:2.5, repeat:Infinity, ease:'easeInOut' }}
              style={{ background:'linear-gradient(90deg,transparent,rgba(74,127,165,0.9),transparent)' }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Gesture list hint */}
      <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)' }}>
        <p style={{ fontSize:11.5, color:'var(--text-muted)', fontFamily:'DM Sans' }}>
          Trained gestures: {gestures.map(g => g.name).join(', ')}
        </p>
      </div>

      <button onClick={() => { setStep('credentials'); verifiedRef.current = false }}
        style={{ fontSize:13, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', textAlign:'center' }}>
        ← Back
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// HARDWARE GESTURE LOGIN
// Same strategy — sign in first, then verify with glove
// ═══════════════════════════════════════════════════════════════════
function HardwareLogin({ onSuccess }) {
  const { login }                     = useAuth()
  const glove                         = useGloveWebSocket()
  const conn                          = useGloveConnect()
  const [step,      setStep]          = useState('credentials')
  const [email,     setEmail]         = useState('')
  const [password,  setPassword]      = useState('')
  const [status,    setStatus]        = useState('')
  const [error,     setError]         = useState('')
  const [logging,   setLogging]       = useState(false)
  const [gestures,  setGestures]      = useState([])
  const verifiedRef                   = useRef(false)

  useEffect(() => { conn.fetchPorts() }, [])

  // Check hardware gesture on every frame
  useEffect(() => {
    if (step !== 'scan' || !glove.gloveConnected || gestures.length === 0) return
    if (verifiedRef.current) return

    const features = sensorToFeatures(glove.fingerData)
    if (!features) return

    for (const g of gestures) {
      const result = matchGesture(features, g.samples, 0.68)
      if (result.match) {
        verifiedRef.current = true
        setStatus(`✓ Gesture matched (${result.confidence}%) — Welcome!`)
        setTimeout(() => onSuccess(), 600)
        return
      }
    }
  }, [glove.fingerData, step, gestures, onSuccess, glove.gloveConnected])

  async function handleContinue(ev) {
    ev.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Enter both email and password')
      return
    }
    setError('')
    setLogging(true)

    try {
      const result       = await login(email, password)
      const uid          = result.user.uid
      const userGestures = await loadUserGestures(uid, 'hardware')

      if (userGestures.length === 0) {
        setError('No hardware gestures trained. Go to Training page and add hardware gestures.')
        setLogging(false)
        const { signOut } = await import('firebase/auth')
        const { auth }    = await import('../../firebase/config')
        await signOut(auth)
        return
      }

      setGestures(userGestures)
      setStep('scan')
      setStatus('Connect your glove, then make your registered gesture')
    } catch (err) {
      const MAP = {
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/user-not-found':     'No account found.',
        'auth/wrong-password':     'Incorrect password.',
      }
      setError(MAP[err.code] || err.message)
    } finally {
      setLogging(false)
    }
  }

  if (step === 'credentials') {
    return (
      <form onSubmit={handleContinue} className="flex flex-col gap-4">
        <div className="rounded-xl px-4 py-3"
          style={{ background:'rgba(74,127,165,0.07)', border:'1px solid rgba(74,127,165,0.15)' }}>
          <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>
            Enter your credentials, then verify your identity using your hardware glove gesture.
          </p>
        </div>

        <InputField
          label="Email" type="email"
          value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com" icon={<Mail size={15}/>}
          autoComplete="email"
        />
        <InputField
          label="Password" type="password"
          value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Your password" icon={<Lock size={15}/>}
          autoComplete="current-password"
        />

        {error && (
          <div className="flex items-center gap-2" style={{ color:'#f87171', fontSize:13 }}>
            <AlertCircle size={13}/> {error}
          </div>
        )}

        <button type="submit" disabled={logging}
          style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            width:'100%', padding:'13px 0', borderRadius:12,
            background: logging ? 'rgba(74,127,165,0.55)' : '#4a7fa5',
            color:'#fff', border:'none',
            cursor: logging ? 'wait' : 'pointer',
            fontSize:14, fontFamily:'DM Sans', fontWeight:500,
            boxShadow:'0 4px 20px rgba(74,127,165,0.25)',
          }}>
          {logging ? (
            <><div style={{ width:16, height:16, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', animation:'spin 0.75s linear infinite' }}/> Loading gestures…</>
          ) : (
            <>Continue to Glove <ArrowRight size={15}/></>
          )}
        </button>
      </form>
    )
  }

  // Scan step
  const f = glove.fingerData

  return (
    <div className="flex flex-col gap-4">
      {/* Connect glove */}
      {!glove.gloveConnected ? (
        <div className="glass rounded-xl p-4 flex flex-col gap-3"
          style={{ border:'1px solid var(--border)' }}>
          <p style={{ fontSize:13, color:'var(--text-secondary)', fontFamily:'DM Sans' }}>
            Connect your glove
          </p>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ position:'relative', flex:1 }}>
              <select
                value={conn.selectedPort}
                onChange={e => conn.setSelectedPort(e.target.value)}
                style={{
                  width:'100%', appearance:'none',
                  padding:'8px 28px 8px 12px', borderRadius:10,
                  background:'rgba(255,255,255,0.05)',
                  border:'1px solid var(--border)',
                  color: conn.selectedPort ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize:13, fontFamily:'JetBrains Mono', outline:'none', cursor:'pointer',
                }}>
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
              <ChevronDown size={11} style={{
                position:'absolute', right:10, top:'50%',
                transform:'translateY(-50%)', pointerEvents:'none',
                color:'var(--text-muted)',
              }}/>
            </div>
            <button
              onClick={() => conn.connectGlove(conn.selectedPort)}
              disabled={conn.connecting || !conn.selectedPort}
              style={{
                padding:'8px 18px', borderRadius:10, cursor:'pointer',
                background:'#4a7fa5', color:'#fff', border:'none',
                fontSize:13.5, fontFamily:'DM Sans', fontWeight:500,
                opacity: conn.connecting ? 0.7 : 1,
              }}>
              {conn.connecting ? '…' : 'Connect'}
            </button>
          </div>
          {conn.error && (
            <p style={{ fontSize:12, color:'#f87171', fontFamily:'JetBrains Mono' }}>
              {conn.error}
            </p>
          )}
        </div>
      ) : (
        /* Glove connected — show live bars */
        <div className="glass rounded-xl p-4"
          style={{ border:'1px solid rgba(74,239,128,0.22)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#4ade80', animation:'pulse 1s infinite' }}/>
            <span style={{ fontSize:13, color:'#86efac', fontFamily:'DM Sans' }}>
              {status.startsWith('✓') ? status : 'Make your registered gesture now'}
            </span>
          </div>

          {/* Finger bars */}
          <div style={{ display:'flex', gap:8 }}>
            {[
              { label:'Index',  val: f[1] ?? 0 },
              { label:'Middle', val: f[2] ?? 0 },
              { label:'Ring',   val: f[3] ?? 0 },
              { label:'Pinky',  val: f[4] ?? 0 },
            ].map(({ label, val }) => (
              <div key={label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{
                  width:'100%', height:44, borderRadius:6, overflow:'hidden',
                  background:'rgba(255,255,255,0.06)', position:'relative',
                }}>
                  <div style={{
                    position:'absolute', bottom:0, left:0, right:0,
                    height:`${Math.max(2, val * 100)}%`,
                    background: val > 0.6
                      ? 'linear-gradient(180deg,#4ade80,#22c55e)'
                      : 'linear-gradient(180deg,var(--accent-light),var(--accent))',
                    borderRadius:6, transition:'height 0.06s linear',
                  }}/>
                  <div style={{
                    position:'absolute', inset:0,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <span style={{
                      fontSize:9, fontFamily:'JetBrains Mono',
                      color: val > 0.45 ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)',
                    }}>
                      {Math.round(val * 100)}%
                    </span>
                  </div>
                </div>
                <span style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>
                  {label.slice(0, 3).toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gesture hint */}
      {gestures.length > 0 && (
        <div style={{
          padding:'10px 14px', borderRadius:10,
          background:'rgba(255,255,255,0.03)',
          border:'1px solid var(--border)',
        }}>
          <p style={{ fontSize:11.5, color:'var(--text-muted)', fontFamily:'DM Sans' }}>
            Registered gestures: {gestures.map(g => g.name).join(', ')}
          </p>
        </div>
      )}

      <button
        onClick={() => { setStep('credentials'); verifiedRef.current = false }}
        style={{
          fontSize:13, color:'var(--text-muted)',
          background:'none', border:'none',
          cursor:'pointer', textAlign:'center',
        }}>
        ← Back
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN LOGIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function LoginPage() {
  const navigate              = useNavigate()
  const [activeTab, setTab]   = useState('email')

  function handleSuccess() {
    navigate('/dashboard')
  }

  return (
    <div className="dashboard-bg noise min-h-screen flex items-center justify-center px-6 py-12">
      <AuthBackground/>

      <div className="relative z-10 w-full" style={{ maxWidth: 460 }}>

        {/* Logo */}
        <motion.div
          initial={{ opacity:0, y:-16 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.7 }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-flex items-center gap-2.5">
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
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity:0, y:24, scale:0.97 }}
          animate={{ opacity:1, y:0, scale:1 }}
          transition={{ duration:0.7, ease:[0.22,1,0.36,1] }}
          className="glass-overlay rounded-2xl p-7"
          style={{ border:'1px solid rgba(255,255,255,0.09)' }}
        >
          <div className="mb-6">
            <h1 className="font-display font-light"
              style={{ fontSize:26, color:'var(--text-primary)', marginBottom:4 }}>
              Welcome back
            </h1>
            <p style={{ fontSize:13.5, color:'var(--text-muted)' }}>
              Sign in using email or gesture authentication
            </p>
          </div>

          {/* Tabs */}
          <div style={{
            display:'flex', gap:3, padding:4, borderRadius:12, marginBottom:22,
            background:'rgba(255,255,255,0.04)',
            border:'1px solid var(--border)',
          }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id}
                onClick={() => setTab(id)}
                style={{
                  flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  padding:'8px 0', borderRadius:9, cursor:'pointer',
                  fontSize:12.5, fontFamily:'DM Sans',
                  background: activeTab===id ? 'rgba(74,127,165,0.18)' : 'transparent',
                  border: activeTab===id ? '1px solid rgba(74,127,165,0.28)' : '1px solid transparent',
                  color: activeTab===id ? 'var(--text-primary)' : 'var(--text-muted)',
                  transition:'all 0.15s',
                }}>
                <Icon size={13} style={{ color: activeTab===id ? 'var(--accent-light)' : undefined }}/>
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity:0, y:10 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-10 }}
              transition={{ duration:0.18 }}
            >
              {activeTab === 'email'    && <EmailLogin    onSuccess={handleSuccess}/>}
              {activeTab === 'camera'   && <CameraLogin   onSuccess={handleSuccess}/>}
              {activeTab === 'hardware' && <HardwareLogin onSuccess={handleSuccess}/>}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Sign up link */}
        <motion.p
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
          className="text-center mt-5"
          style={{ fontSize:13.5, color:'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color:'var(--accent-light)' }}>
            Create one free
          </Link>
        </motion.p>
      </div>

      <style>{`
        @keyframes spin  { to { transform:rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
      `}</style>
    </div>
  )
}