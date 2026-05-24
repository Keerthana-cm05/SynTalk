import { useEffect, useRef, useState, useCallback } from 'react'
import { hardwareClassifier, sensorToFeatures } from '../utils/knnClassifier'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws'

// ── Per-finger calibration ────────────────────────────────────────────
// Start with wide defaults that guarantee visible movement immediately
// Real range will auto-narrow as data flows in
const cal = {
  min:   [0, 0, 0, 0],
  max:   [40, 40, 40, 40],
  count: [0, 0, 0, 0],
}

function loadCal() {
  try {
    const s = localStorage.getItem('syntalk_cal_v4')
    if (s) {
      const c = JSON.parse(s)
      if (Array.isArray(c.min) && c.min.length === 4) {
        // Only load if we have meaningful range
        const hasRange = c.min.some((v, i) => c.max[i] - v > 50)
        if (hasRange) {
          cal.min   = [...c.min]
          cal.max   = [...c.max]
          cal.count = [30, 30, 30, 30]
          console.log('✅ Loaded calibration:', c)
        }
      }
    }
  } catch {}
}
loadCal()

let saveTimer = null
function saveCal() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem('syntalk_cal_v4', JSON.stringify({
        min: [...cal.min], max: [...cal.max],
      }))
    } catch {}
  }, 1000)
}

// Normalize a single raw value for finger i
function normalizeOne(v, i) {
  const lo   = cal.min[i]
  const hi   = cal.max[i]
  const span = hi - lo

  // Auto-expand range as new extremes are seen
  let changed = false
  if (v < lo) { cal.min[i] = v; changed = true }
  if (v > hi) { cal.max[i] = v; changed = true }
  if (changed) saveCal()

  if (span < 10) return 0.5  // not enough data yet

  return Math.max(0, Math.min(1, (v - cal.min[i]) / (cal.max[i] - cal.min[i])))
}

// Normalize all 4 fingers
function processRaw(raw, alreadyNorm) {
  if (!raw || raw.length < 4) return [0, 0, 0, 0]

  if (alreadyNorm) {
    // Values are 0-1000 scaled — just divide
    return raw.map(v => Math.max(0, Math.min(1, v / 1000)))
  }

  return raw.map((v, i) => normalizeOne(v, i))
}

// ── Gesture debounce ──────────────────────────────────────────────────
let gCand = null, gCount = 0, gLast = 0
const HOLD = 4, COOL = 1200

function debounce(g) {
  const now = Date.now()
  if (now - gLast < COOL) return null
  if (!g) { gCand = null; gCount = 0; return null }
  if (g.text === gCand) gCount++
  else { gCand = g.text; gCount = 1 }
  if (gCount >= HOLD) {
    gCount = 0; gCand = null; gLast = now; return g
  }
  return null
}

// ── Rule-based classifier ─────────────────────────────────────────────
function classify(norm) {
  const [a, b, c, d] = norm
  const O = v => v < 0.35
  const C = v => v > 0.60
  if (O(a)&&O(b)&&O(c)&&O(d)) return { text:'Hello',       confidence:88 }
  if (C(a)&&C(b)&&C(c)&&C(d)) return { text:'Yes',         confidence:88 }
  if (O(a)&&O(b)&&C(c)&&C(d)) return { text:'No',          confidence:87 }
  if (O(a)&&C(b)&&C(c)&&C(d)) return { text:'Water',       confidence:85 }
  if (O(a)&&C(b)&&C(c)&&O(d)) return { text:'I need help', confidence:85 }
  if (C(a)&&C(b)&&C(c)&&O(d)) return { text:'Good',        confidence:87 }
  if (C(a)&&O(b)&&O(c)&&C(d)) return { text:'Thank you',   confidence:85 }
  return null
}

// ── Hook ──────────────────────────────────────────────────────────────
export function useGloveWebSocket() {
  const wsRef      = useRef(null)
  const retryRef   = useRef(null)
  const mountedRef = useRef(true)
  const firstRef   = useRef(true)

  const [wsReady,        setWsReady]        = useState(false)
  const [gloveConnected, setGloveConnected] = useState(false)
  const [glovePort,      setGlovePort]      = useState(null)
  const [fingerData,     setFingerData]     = useState([0, 0, 0, 0, 0])
  const [normData,       setNormData]       = useState([0, 0, 0, 0])
  const [rawData,        setRawData]        = useState([0, 0, 0, 0])
  const [lastGesture,    setLastGesture]    = useState(null)
  const [error,          setError]          = useState(null)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const connectWS = useCallback(() => {
    const s = wsRef.current?.readyState
    if (s === WebSocket.OPEN || s === WebSocket.CONNECTING) return

    let ws
    try { ws = new WebSocket(WS_URL) }
    catch (e) {
      retryRef.current = setTimeout(connectWS, 3000)
      return
    }
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) return
      console.log('✅ WebSocket connected')
      setWsReady(true)
      setError(null)
      clearTimeout(retryRef.current)
    }

    ws.onmessage = evt => {
      if (!mountedRef.current) return
      try {
        const msg = JSON.parse(evt.data)

        if (msg.type === 'status') {
          setGloveConnected(msg.connected)
          setGlovePort(msg.port || null)
          if (msg.connected) {
            console.log('✅ Glove connected:', msg.port)
          } else {
            setFingerData([0, 0, 0, 0, 0])
            setNormData([0, 0, 0, 0])
            setRawData([0, 0, 0, 0])
            gCand = null; gCount = 0
          }
        }

        if (msg.type === 'frame') {
          const raw  = msg.raw                              // [idx,mid,rng,pky]
          const norm = processRaw(raw, msg.alreadyNorm)    // [0-1, 0-1, 0-1, 0-1]
          const fd   = [0, norm[0], norm[1], norm[2], norm[3]]

          // Log first frame
          if (firstRef.current) {
            firstRef.current = false
            console.log('🖐 First frame! raw:', raw, 'norm:', norm.map(v=>v.toFixed(3)))
            console.log('  cal.min:', cal.min, 'cal.max:', cal.max)
          }

          setRawData(raw)
          setNormData(norm)
          setFingerData(fd)

          // Classify
          let gesture = null
          if (hardwareClassifier.numClasses > 0) {
            const feat = sensorToFeatures(fd)
            if (feat) {
              const r = hardwareClassifier.predict(feat)
              if (r) gesture = { text: r.label, confidence: r.confidence }
            }
          }
          if (!gesture) gesture = classify(norm)

          const emitted = debounce(gesture)
          if (emitted) setLastGesture({ ...emitted, ts: Date.now() })
        }

        if (msg.type === 'error') setError(msg.message)
      } catch {}
    }

    ws.onclose = evt => {
      if (!mountedRef.current) return
      setWsReady(false)
      if (evt.code !== 1000)
        retryRef.current = setTimeout(connectWS, 2500)
    }

    ws.onerror = () => ws.close()
  }, [])

  useEffect(() => {
    const t = setTimeout(connectWS, 400)
    return () => {
      clearTimeout(t)
      clearTimeout(retryRef.current)
      mountedRef.current = false
      wsRef.current?.close(1000, 'unmount')
    }
  }, [connectWS])

  const resetCal = useCallback(() => {
    cal.min   = [200, 200, 200, 200]
    cal.max   = [800, 800, 800, 800]
    cal.count = [0, 0, 0, 0]
    firstRef.current = true
    try { localStorage.removeItem('syntalk_cal_v4') } catch {}
    console.log('Calibration reset')
  }, [])

  return {
    wsReady, gloveConnected, glovePort,
    fingerData, normData, rawData,
    lastGesture, error, resetCal,
  }
}