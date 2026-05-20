import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../firebase/config'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import {
  Settings, Type, Globe, Volume2,
  Hand, Sliders, Contrast, Save, CheckCircle
} from 'lucide-react'

const LANGUAGES = [
  { code:'en',  label:'English' },
  { code:'hi',  label:'Hindi' },
  { code:'ta',  label:'Tamil' },
  { code:'te',  label:'Telugu' },
  { code:'kn',  label:'Kannada' },
]

function SettingRow({ icon, label, description, children }) {
  return (
    <div style={{
      display:'flex', alignItems:'flex-start', justifyContent:'space-between',
      gap:16, padding:'16px 0',
      borderBottom:'1px solid var(--border)',
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12, flex:1 }}>
        <div style={{
          width:34, height:34, borderRadius:10, flexShrink:0,
          background:'rgba(74,127,165,0.10)',
          border:'1px solid rgba(74,127,165,0.18)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'var(--accent-light)',
        }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize:14, color:'var(--text-primary)', fontFamily:'DM Sans', fontWeight:500 }}>
            {label}
          </p>
          <p style={{ fontSize:12.5, color:'var(--text-muted)', marginTop:2 }}>
            {description}
          </p>
        </div>
      </div>
      <div style={{ flexShrink:0 }}>
        {children}
      </div>
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width:44, height:24, borderRadius:12, cursor:'pointer',
        background: value ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
        border:'none', position:'relative', transition:'background 0.2s',
        flexShrink:0,
      }}
    >
      <div style={{
        width:18, height:18, borderRadius:'50%', background:'#fff',
        position:'absolute', top:3,
        left: value ? 23 : 3,
        transition:'left 0.2s',
        boxShadow:'0 1px 4px rgba(0,0,0,0.3)',
      }}/>
    </button>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        appearance:'none', padding:'7px 28px 7px 12px', borderRadius:10,
        background:'rgba(255,255,255,0.05)',
        border:'1px solid var(--border)',
        color:'var(--text-primary)', fontSize:13,
        fontFamily:'DM Sans', outline:'none', cursor:'pointer',
        minWidth:130,
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}
          style={{ background:'#13131a', color:'#eeeef2' }}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function Slider({ value, onChange, min=0, max=100, step=1, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width:120, accentColor:'var(--accent)', cursor:'pointer' }}
      />
      <span style={{ fontSize:12, color:'var(--accent-light)', fontFamily:'JetBrains Mono', minWidth:30 }}>
        {value}{label||''}
      </span>
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()

  const [settings, setSettings] = useState({
    fontSize:        16,
    language:        'en',
    handMode:        'right',
    voiceSpeed:      95,
    voicePitch:      100,
    sensitivity:     70,
    highContrast:    false,
    autoSpeak:       true,
    showConfidence:  true,
    gestureHold:     4,
  })

  const [loading, setLoading]   = useState(true)
  const [saving,  setSaving]    = useState(false)
  const [saved,   setSaved]     = useState(false)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    getDoc(doc(db, 'users', user.uid, 'settings', 'preferences'))
      .then(snap => {
        if (snap.exists()) setSettings(prev => ({ ...prev, ...snap.data() }))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  function update(key, val) {
    setSettings(prev => ({ ...prev, [key]: val }))
  }

  async function save() {
    if (!user) return
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'users', user.uid, 'settings', 'preferences'),
        settings
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)

      // Apply font size immediately
      document.documentElement.style.fontSize = `${settings.fontSize}px`
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const s = settings

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor:'var(--accent)' }}/>
    </div>
  )

  return (
    <div className="p-6 flex flex-col gap-6 min-h-screen">

      {/* Header */}
      <div>
        <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono', letterSpacing:'0.12em', textTransform:'uppercase' }}>
          Preferences
        </p>
        <h1 className="font-display font-light mt-1"
          style={{ fontSize:30, color:'var(--text-primary)' }}>
          Accessibility &amp; Settings
        </h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">

        {/* Display */}
        <div className="glass-raised rounded-2xl p-5"
          style={{ border:'1px solid var(--border)' }}>
          <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:4 }}>
            Display
          </p>

          <SettingRow icon={<Type size={15}/>} label="Font Size"
            description="Adjust text size across the dashboard">
            <Slider value={s.fontSize} onChange={v => update('fontSize', v)}
              min={12} max={22} step={1} label="px"/>
          </SettingRow>

          <SettingRow icon={<Contrast size={15}/>} label="High Contrast"
            description="Increase contrast for better visibility">
            <Toggle value={s.highContrast} onChange={v => update('highContrast', v)}/>
          </SettingRow>

          <SettingRow icon={<Globe size={15}/>} label="Language"
            description="Interface and TTS language">
            <Select
              value={s.language}
              onChange={v => update('language', v)}
              options={LANGUAGES.map(l => ({ value:l.code, label:l.label }))}
            />
          </SettingRow>
        </div>

        {/* Voice */}
        <div className="glass-raised rounded-2xl p-5"
          style={{ border:'1px solid var(--border)' }}>
          <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:4 }}>
            Voice &amp; Speech
          </p>

          <SettingRow icon={<Volume2 size={15}/>} label="Auto Speak"
            description="Automatically speak recognised gestures">
            <Toggle value={s.autoSpeak} onChange={v => update('autoSpeak', v)}/>
          </SettingRow>

          <SettingRow icon={<Volume2 size={15}/>} label="Voice Speed"
            description="Speech rate for text-to-speech">
            <Slider value={s.voiceSpeed} onChange={v => update('voiceSpeed', v)}
              min={50} max={150} step={5} label="%"/>
          </SettingRow>

          <SettingRow icon={<Volume2 size={15}/>} label="Voice Pitch"
            description="Pitch of the TTS voice">
            <Slider value={s.voicePitch} onChange={v => update('voicePitch', v)}
              min={50} max={150} step={5} label="%"/>
          </SettingRow>
        </div>

        {/* Hardware */}
        <div className="glass-raised rounded-2xl p-5"
          style={{ border:'1px solid var(--border)' }}>
          <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:4 }}>
            Hardware &amp; Gestures
          </p>

          <SettingRow icon={<Hand size={15}/>} label="Hand Mode"
            description="Which hand you wear the glove on">
            <Select
              value={s.handMode}
              onChange={v => update('handMode', v)}
              options={[
                { value:'right', label:'Right Hand' },
                { value:'left',  label:'Left Hand'  },
              ]}
            />
          </SettingRow>

          <SettingRow icon={<Sliders size={15}/>} label="Gesture Hold Time"
            description="Frames to hold before gesture is recognised">
            <Slider value={s.gestureHold} onChange={v => update('gestureHold', v)}
              min={2} max={10} step={1} label=" frames"/>
          </SettingRow>

          <SettingRow icon={<Sliders size={15}/>} label="Sensitivity"
            description="How sensitive gesture detection is">
            <Slider value={s.sensitivity} onChange={v => update('sensitivity', v)}
              min={30} max={100} step={5} label="%"/>
          </SettingRow>
        </div>

        {/* Recognition */}
        <div className="glass-raised rounded-2xl p-5"
          style={{ border:'1px solid var(--border)' }}>
          <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:4 }}>
            Recognition
          </p>

          <SettingRow icon={<Settings size={15}/>} label="Show Confidence"
            description="Display confidence percentage on recognised gestures">
            <Toggle value={s.showConfidence} onChange={v => update('showConfidence', v)}/>
          </SettingRow>

          {/* Preview */}
          <div style={{
            marginTop:16, padding:'14px 16px', borderRadius:12,
            background:'rgba(74,127,165,0.06)',
            border:'1px solid rgba(74,127,165,0.14)',
          }}>
            <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
              Preview
            </p>
            <p style={{ fontSize: s.fontSize, color:'var(--text-primary)', fontFamily:'DM Sans', lineHeight:1.5 }}>
              Hello — gesture recognised
            </p>
            {s.showConfidence && (
              <p style={{ fontSize:11, color:'var(--accent-light)', fontFamily:'JetBrains Mono' }}>
                88% confidence
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Save */}
      <button onClick={save} disabled={saving}
        style={{
          display:'flex', alignItems:'center', gap:8,
          padding:'12px 32px', borderRadius:12, cursor: saving ? 'wait' : 'pointer',
          background: saved ? 'rgba(34,197,94,0.15)' : '#4a7fa5',
          border: saved ? '1px solid rgba(34,197,94,0.3)' : 'none',
          color: saved ? '#86efac' : '#fff',
          fontSize:14, fontFamily:'DM Sans', fontWeight:500,
          alignSelf:'flex-start',
          boxShadow: saved ? 'none' : '0 4px 18px rgba(74,127,165,0.25)',
          opacity: saving ? 0.7 : 1, transition:'all 0.3s',
        }}>
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