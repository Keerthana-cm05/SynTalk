import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bluetooth, BluetoothOff, RefreshCw,
  WifiOff, Usb, ChevronDown, AlertCircle
} from 'lucide-react'
import Hand3DLive from '../../../components/ui/Hand3DLive'
import { useGloveWebSocket } from '../../../hooks/useGloveWebSocket'
import { useGloveConnect } from '../../../hooks/useGloveConnect'
import { useTTS } from '../../../hooks/useTTS'

export default function HardwareMode({ onGestureOutput }) {
  const {
    wsReady, gloveConnected,
    fingerData, accelData,
    lastGesture, error: wsError,
  } = useGloveWebSocket()

  const {
    ports, fetchPorts, scanning,
    selectedPort, setSelectedPort,
    connecting, connectGlove, disconnectGlove,
    error: connectError,
  } = useGloveConnect()

  const tts       = useTTS()
  const spokenRef = useRef(null)
  const [log, setLog] = useState([])

  useEffect(() => { fetchPorts() }, [])

  useEffect(() => {
    if (!lastGesture) return
    if (lastGesture.ts === spokenRef.current) return
    spokenRef.current = lastGesture.ts
    tts.speak(lastGesture.text)
    setLog(p => [{ ...lastGesture, id: lastGesture.ts }, ...p.slice(0,6)])
    onGestureOutput?.(lastGesture.text)
  }, [lastGesture])

  useEffect(() => {
    if (!gloveConnected) { setLog([]); onGestureOutput?.('') }
  }, [gloveConnected])

  const err = connectError || wsError

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ── Top bar: connection ───────────────────────────────── */}
      <div className="glass-raised rounded-2xl px-5 py-4"
        style={{ border:'1px solid var(--border)' }}>
        <div className="flex flex-wrap items-center gap-3">

          {/* Status dot + label */}
          <div className="flex items-center gap-2 mr-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${gloveConnected ? 'animate-pulse' : ''}`}
              style={{ background: gloveConnected ? '#4ade80' : 'var(--text-muted)' }} />
            <span className="font-body"
              style={{ fontSize:14, color:'var(--text-primary)' }}>
              {gloveConnected ? `Connected · ${selectedPort}` : 'SynTalk Glove'}
            </span>
            {!gloveConnected && (
              <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>
                {wsReady ? '· Server ready' : '· Connecting to server…'}
              </span>
            )}
          </div>

          {/* Port picker — compact, inline */}
          {!gloveConnected && (
            <>
              <div className="relative flex-shrink-0">
                <select
                  value={selectedPort}
                  onChange={e => setSelectedPort(e.target.value)}
                  className="appearance-none pr-7 pl-3 py-2 rounded-xl font-mono
                    outline-none cursor-pointer transition-colors"
                  style={{
                    fontSize:12.5,
                    background:'rgba(20,20,28,0.9)',
                    border:'1px solid var(--border)',
                    color: selectedPort ? 'var(--text-primary)' : 'var(--text-muted)',
                    minWidth: 130,
                  }}
                >
                  {ports.length === 0
                    ? <option value="">No ports found</option>
                    : ports.map(p => (
                        <option key={p.path} value={p.path}
                          style={{ background:'#13131a', color:'#eeeef2' }}>
                          {p.path}{p.isArduino ? ' ✓' : ''}
                        </option>
                      ))
                  }
                </select>
                <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color:'var(--text-muted)' }} />
              </div>

              <button onClick={fetchPorts} disabled={scanning}
                className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors"
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)' }}>
                <RefreshCw size={13} style={{ color:'var(--text-muted)' }}
                  className={scanning ? 'animate-spin' : ''} />
              </button>

              <button
                onClick={() => connectGlove(selectedPort)}
                disabled={connecting || !selectedPort}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-body
                  transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  fontSize:13.5,
                  background:'var(--accent)',
                  color:'#fff',
                  boxShadow:'0 4px 20px rgba(74,127,165,0.25)',
                }}
              >
                {connecting
                  ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Bluetooth size={13} />
                }
                {connecting ? 'Opening…' : 'Connect'}
              </button>
            </>
          )}

          {gloveConnected && (
            <button onClick={disconnectGlove}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-body
                transition-all duration-200 ml-auto"
              style={{
                fontSize:13.5,
                background:'rgba(239,68,68,0.1)',
                border:'1px solid rgba(239,68,68,0.2)',
                color:'#fca5a5',
              }}>
              <BluetoothOff size={13} /> Disconnect
            </button>
          )}

          {err && (
            <div className="flex items-center gap-1.5 ml-2"
              style={{ color:'#f87171', fontSize:12 }}>
              <AlertCircle size={12} /> {err}
            </div>
          )}
        </div>

        {/* Arduino hint */}
        {!gloveConnected && ports.length === 0 && !scanning && (
          <p className="mt-2.5 font-mono"
            style={{ fontSize:11, color:'var(--text-muted)' }}>
            Plug in your Arduino via USB then click refresh.
            Close Arduino IDE Serial Monitor if open.
          </p>
        )}
      </div>

      {/* ── Main: 3D hand + output side by side ──────────────── */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* 3D Hand — large, centrepiece */}
        <div className="flex-1 glass-raised rounded-2xl overflow-hidden relative"
          style={{ border:'1px solid var(--border)', minHeight:380 }}>

          {/* Idle overlay */}
          <AnimatePresence>
            {!gloveConnected && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-6 pointer-events-none">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                  style={{ background:'rgba(19,19,26,0.85)', border:'1px solid var(--border)' }}>
                  <WifiOff size={13} style={{ color:'var(--text-muted)' }} />
                  <span style={{ fontSize:12.5, color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>
                    Waiting for hardware connection…
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live badge */}
          <AnimatePresence>
            {gloveConnected && (
              <motion.div initial={{ opacity:0, scale:.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background:'rgba(19,19,26,0.85)', border:'1px solid rgba(74,239,128,0.22)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background:'#4ade80' }} />
                <span style={{ fontSize:10, color:'#86efac', fontFamily:'JetBrains Mono', letterSpacing:'0.1em' }}>
                  LIVE
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <Hand3DLive
            fingerData={fingerData}
            accelData={accelData}
            isConnected={gloveConnected}
          />
        </div>

        {/* Right column: recognised + log */}
        <div className="w-64 flex flex-col gap-3 flex-shrink-0">

          {/* Recognised gesture */}
          <div className="glass-raised rounded-2xl p-5 flex flex-col gap-3"
            style={{ border:'1px solid var(--border)', flex:1 }}>
            <p style={{ fontSize:10.5, color:'var(--text-muted)', fontFamily:'JetBrains Mono', letterSpacing:'0.12em', textTransform:'uppercase' }}>
              Recognised
            </p>

            {!gloveConnected ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-center font-body"
                  style={{ fontSize:13, color:'var(--text-muted)' }}>
                  Connect glove to start recognition
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
                    {[0,1,2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                        style={{ background:'var(--accent-muted)' }}
                        animate={{ opacity:[0.3,1,0.3], y:[0,-4,0] }}
                        transition={{ duration:1, delay:i*0.2, repeat:Infinity }}
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
            <div className="glass-raised rounded-2xl p-4"
              style={{ border:'1px solid var(--border)' }}>
              <p className="mb-2.5" style={{ fontSize:10.5, color:'var(--text-muted)', fontFamily:'JetBrains Mono', letterSpacing:'0.12em', textTransform:'uppercase' }}>
                Session
              </p>
              <div className="flex flex-col gap-1">
                {log.map((g, i) => (
                  <motion.div key={g.id}
                    initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay:i*0.04 }}
                    className="px-2.5 py-1.5 rounded-lg font-body"
                    style={{
                      fontSize: 13,
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