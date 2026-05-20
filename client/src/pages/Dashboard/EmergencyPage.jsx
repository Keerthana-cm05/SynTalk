import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../firebase/config'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import {
  ShieldAlert, Phone, User, Save,
  AlertTriangle, X, CheckCircle
} from 'lucide-react'

export default function EmergencyPage() {
  const { user } = useAuth()

  const [contacts,   setContacts]   = useState([
    { name: '', phone: '' },
    { name: '', phone: '' },
  ])
  const [gesture,    setGesture]    = useState('fist-fist')
  const [message,    setMessage]    = useState("I need help. This is an emergency.")
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [loading,    setLoading]    = useState(true)

  // Emergency countdown simulation
  const [sosActive,  setSosActive]  = useState(false)
  const [countdown,  setCountdown]  = useState(10)
  const countRef = useRef(null)

  useEffect(() => {
    loadSettings()
  }, [user])

  async function loadSettings() {
    if (!user) return
    setLoading(true)
    try {
      const ref  = doc(db, 'users', user.uid, 'settings', 'emergency')
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const d = snap.data()
        if (d.contacts) setContacts(d.contacts)
        if (d.gesture)  setGesture(d.gesture)
        if (d.message)  setMessage(d.message)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    if (!user) return
    setSaving(true)
    try {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'emergency'), {
        contacts,
        gesture,
        message,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  function triggerSOS() {
    setSosActive(true)
    setCountdown(10)
    countRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countRef.current)
          setSosActive(false)
          return 10
        }
        return prev - 1
      })
    }, 1000)
  }

  function cancelSOS() {
    clearInterval(countRef.current)
    setSosActive(false)
    setCountdown(10)
  }

  useEffect(() => () => clearInterval(countRef.current), [])

  return (
    <div className="p-6 flex flex-col gap-6 min-h-screen relative">

      {/* Emergency countdown overlay */}
      <AnimatePresence>
        {sosActive && (
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)' }}
          >
            <motion.div
              initial={{ scale:0.8, opacity:0 }}
              animate={{ scale:1,   opacity:1 }}
              exit={{ scale:0.8,    opacity:0 }}
              className="text-center"
              style={{ maxWidth:400, padding:40 }}
            >
              {/* Pulsing alert icon */}
              <motion.div
                animate={{ scale:[1,1.15,1] }}
                transition={{ duration:0.8, repeat:Infinity }}
                style={{
                  width:80, height:80, borderRadius:'50%',
                  background:'rgba(239,68,68,0.15)',
                  border:'2px solid rgba(239,68,68,0.4)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  margin:'0 auto 24px',
                }}
              >
                <ShieldAlert size={36} style={{ color:'#f87171' }}/>
              </motion.div>

              <h2 className="font-display font-light mb-2"
                style={{ fontSize:32, color:'#f87171' }}>
                Emergency SOS
              </h2>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.6)', marginBottom:24 }}>
                Alerting emergency contacts in...
              </p>

              {/* Countdown */}
              <div style={{
                fontSize:80, fontFamily:'JetBrains Mono', fontWeight:300,
                color:'#f87171', lineHeight:1, marginBottom:32,
              }}>
                {countdown}
              </div>

              {/* Progress ring */}
              <svg width={120} height={120}
                style={{ position:'absolute', top:'50%', left:'50%',
                  transform:'translate(-50%,-200px)', opacity:0.3 }}>
                <circle cx={60} cy={60} r={54}
                  fill="none" stroke="#f87171" strokeWidth={3}
                  strokeDasharray={339.3}
                  strokeDashoffset={339.3 * (1 - countdown/10)}
                  style={{ transition:'stroke-dashoffset 1s linear',
                    transform:'rotate(-90deg)', transformOrigin:'60px 60px' }}
                />
              </svg>

              <button
                onClick={cancelSOS}
                style={{
                  padding:'14px 40px', borderRadius:12, cursor:'pointer',
                  background:'rgba(239,68,68,0.15)',
                  border:'1px solid rgba(239,68,68,0.3)',
                  color:'#fca5a5', fontSize:15, fontFamily:'DM Sans',
                }}
              >
                Cancel SOS
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono', letterSpacing:'0.12em', textTransform:'uppercase' }}>
            Safety System
          </p>
          <h1 className="font-display font-light mt-1"
            style={{ fontSize:30, color:'var(--text-primary)' }}>
            Emergency &amp; SOS
          </h1>
        </div>

        {/* Test SOS button */}
        <button
          onClick={triggerSOS}
          style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'10px 20px', borderRadius:12, cursor:'pointer',
            background:'rgba(239,68,68,0.10)',
            border:'1px solid rgba(239,68,68,0.25)',
            color:'#fca5a5', fontSize:13.5, fontFamily:'DM Sans',
          }}
        >
          <AlertTriangle size={14}/> Test SOS Alert
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor:'var(--accent)' }}/>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">

          {/* Emergency contacts */}
          <div className="glass-raised rounded-2xl p-5"
            style={{ border:'1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Phone size={16} style={{ color:'var(--accent-light)' }}/>
              <h2 style={{ fontSize:15, color:'var(--text-primary)', fontFamily:'DM Sans', fontWeight:500 }}>
                Emergency Contacts
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              {contacts.map((c, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono', letterSpacing:'0.1em', textTransform:'uppercase' }}>
                    Contact {i + 1}
                  </p>
                  <div className="flex gap-2">
                    <div style={{ position:'relative', flex:1 }}>
                      <User size={13} style={{
                        position:'absolute', left:12, top:'50%',
                        transform:'translateY(-50%)', color:'var(--text-muted)',
                      }}/>
                      <input
                        type="text"
                        placeholder="Full name"
                        value={c.name}
                        onChange={e => {
                          const copy = [...contacts]
                          copy[i] = { ...copy[i], name: e.target.value }
                          setContacts(copy)
                        }}
                        style={{
                          width:'100%', paddingLeft:32, paddingRight:12,
                          paddingTop:9, paddingBottom:9, borderRadius:10,
                          background:'rgba(255,255,255,0.04)',
                          border:'1px solid var(--border)',
                          color:'var(--text-primary)', fontSize:13.5,
                          fontFamily:'DM Sans', outline:'none',
                        }}
                        onFocus={e => e.target.style.borderColor='rgba(74,127,165,0.45)'}
                        onBlur={e  => e.target.style.borderColor='var(--border)'}
                      />
                    </div>
                    <div style={{ position:'relative', flex:1 }}>
                      <Phone size={13} style={{
                        position:'absolute', left:12, top:'50%',
                        transform:'translateY(-50%)', color:'var(--text-muted)',
                      }}/>
                      <input
                        type="tel"
                        placeholder="Phone number"
                        value={c.phone}
                        onChange={e => {
                          const copy = [...contacts]
                          copy[i] = { ...copy[i], phone: e.target.value }
                          setContacts(copy)
                        }}
                        style={{
                          width:'100%', paddingLeft:32, paddingRight:12,
                          paddingTop:9, paddingBottom:9, borderRadius:10,
                          background:'rgba(255,255,255,0.04)',
                          border:'1px solid var(--border)',
                          color:'var(--text-primary)', fontSize:13.5,
                          fontFamily:'DM Sans', outline:'none',
                        }}
                        onFocus={e => e.target.style.borderColor='rgba(74,127,165,0.45)'}
                        onBlur={e  => e.target.style.borderColor='var(--border)'}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency message + gesture */}
          <div className="flex flex-col gap-4">

            {/* Message */}
            <div className="glass-raised rounded-2xl p-5"
              style={{ border:'1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert size={16} style={{ color:'#f87171' }}/>
                <h2 style={{ fontSize:15, color:'var(--text-primary)', fontFamily:'DM Sans', fontWeight:500 }}>
                  Emergency Message
                </h2>
              </div>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                style={{
                  width:'100%', padding:'10px 12px', borderRadius:10,
                  background:'rgba(255,255,255,0.04)',
                  border:'1px solid var(--border)',
                  color:'var(--text-primary)', fontSize:13.5,
                  fontFamily:'DM Sans', outline:'none', resize:'none',
                  lineHeight:1.6,
                }}
                onFocus={e => e.target.style.borderColor='rgba(239,68,68,0.4)'}
                onBlur={e  => e.target.style.borderColor='var(--border)'}
              />
              <p style={{ fontSize:11.5, color:'var(--text-muted)', marginTop:6 }}>
                This message will be sent to your emergency contacts when SOS is triggered.
              </p>
            </div>

            {/* Trigger gesture */}
            <div className="glass-raised rounded-2xl p-5"
              style={{ border:'1px solid var(--border)' }}>
              <h2 style={{ fontSize:15, color:'var(--text-primary)', fontFamily:'DM Sans', fontWeight:500, marginBottom:12 }}>
                Emergency Gesture
              </h2>
              <div className="flex flex-col gap-2">
                {[
                  { value:'fist-fist',   label:'Double Fist — close all fingers twice' },
                  { value:'pinky-pinky', label:'Pinky out — pinky extended, rest closed' },
                  { value:'custom',      label:'Custom trained gesture' },
                ].map(opt => (
                  <button key={opt.value}
                    onClick={() => setGesture(opt.value)}
                    style={{
                      display:'flex', alignItems:'center', gap:10,
                      padding:'10px 14px', borderRadius:10, cursor:'pointer',
                      background: gesture===opt.value ? 'rgba(239,68,68,0.10)' : 'rgba(255,255,255,0.03)',
                      border: gesture===opt.value ? '1px solid rgba(239,68,68,0.25)' : '1px solid var(--border)',
                      color: gesture===opt.value ? '#fca5a5' : 'var(--text-muted)',
                      textAlign:'left',
                    }}>
                    <div style={{
                      width:16, height:16, borderRadius:'50%', flexShrink:0,
                      border: gesture===opt.value ? '2px solid #f87171' : '2px solid var(--text-muted)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      {gesture===opt.value && (
                        <div style={{ width:7, height:7, borderRadius:'50%', background:'#f87171' }}/>
                      )}
                    </div>
                    <span style={{ fontSize:13, fontFamily:'DM Sans' }}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save button */}
      <button
        onClick={saveSettings}
        disabled={saving}
        style={{
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          padding:'12px 32px', borderRadius:12, cursor: saving ? 'wait' : 'pointer',
          background: saved ? 'rgba(34,197,94,0.15)' : '#4a7fa5',
          border: saved ? '1px solid rgba(34,197,94,0.3)' : 'none',
          color: saved ? '#86efac' : '#fff',
          fontSize:14, fontFamily:'DM Sans', fontWeight:500,
          alignSelf:'flex-start',
          boxShadow: saved ? 'none' : '0 4px 18px rgba(74,127,165,0.25)',
          opacity: saving ? 0.7 : 1,
          transition:'all 0.3s',
        }}
      >
        {saving ? (
          <><div style={{
            width:15, height:15, borderRadius:'50%',
            border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff',
            animation:'spin 0.75s linear infinite',
          }}/> Saving…</>
        ) : saved ? (
          <><CheckCircle size={15}/> Saved!</>
        ) : (
          <><Save size={15}/> Save Settings</>
        )}
      </button>

      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  )
}