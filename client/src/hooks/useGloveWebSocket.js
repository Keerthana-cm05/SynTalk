import { useEffect, useRef, useState, useCallback } from 'react'
import { hardwareClassifier, sensorToFeatures } from '../utils/knnClassifier'
import { useCalibration } from './useCalibration'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws'

// Debounce — same timing as ML mode
let hwHoldCandidate = null
let hwHoldCount     = 0
let hwLastEmitTime  = 0
const HW_HOLD_FRAMES = 4
const HW_COOLDOWN_MS = 1200

function debounceHwGesture(gesture) {
  const now = Date.now()
  if (now - hwLastEmitTime < HW_COOLDOWN_MS) return null
  if (!gesture) { hwHoldCandidate = null; hwHoldCount = 0; return null }
  if (gesture.text === hwHoldCandidate) { hwHoldCount++ }
  else { hwHoldCandidate = gesture.text; hwHoldCount = 1 }
  if (hwHoldCount >= HW_HOLD_FRAMES) {
    hwHoldCount = 0; hwHoldCandidate = null; hwLastEmitTime = now
    return gesture
  }
  return null
}

// Rule-based fallback — same as ML rules but for 4 flex fingers
// normalized: [index, middle, ring, pinky] all 0.0-1.0
function ruleBasedHardware(norm) {
  if (!norm || norm.length < 4) return null
  const [idx, mid, rng, pky] = norm
  if (idx < 0.35 && mid < 0.35 && rng < 0.35 && pky < 0.35)
    return { text: 'Hello',       confidence: 88 }
  if (idx > 0.60 && mid > 0.60 && rng > 0.60 && pky > 0.60)
    return { text: 'Yes',         confidence: 88 }
  if (idx < 0.35 && mid < 0.35 && rng > 0.55 && pky > 0.55)
    return { text: 'No',          confidence: 87 }
  if (idx < 0.35 && mid > 0.55 && rng > 0.55 && pky > 0.55)
    return { text: 'Water',       confidence: 85 }
  if (idx < 0.35 && mid > 0.55 && rng > 0.55 && pky < 0.35)
    return { text: 'I need help', confidence: 85 }
  if (idx > 0.60 && mid > 0.60 && rng > 0.60 && pky < 0.35)
    return { text: 'Good',        confidence: 87 }
  if (idx > 0.55 && mid < 0.35 && rng < 0.35 && pky > 0.55)
    return { text: 'Thank you',   confidence: 85 }
  return null
}

export function useGloveWebSocket() {
  const wsRef        = useRef(null)
  const reconnectRef = useRef(null)
  const mountedRef   = useRef(true)
  const cal          = useCalibration()

  const [wsReady,        setWsReady]        = useState(false)
  const [gloveConnected, setGloveConnected] = useState(false)
  const [glovePort,      setGlovePort]      = useState(null)
  const [fingerData,     setFingerData]     = useState([0, 0, 0, 0, 0])
  const [rawData,        setRawData]        = useState([0, 0, 0, 0])
  const [lastGesture,    setLastGesture]    = useState(null)
  const [error,          setError]          = useState(null)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const connect = useCallback(() => {
    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) return

    let ws
    try { ws = new WebSocket(WS_URL) }
    catch { reconnectRef.current = setTimeout(connect, 3000); return }

    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) return
      setWsReady(true)
      setError(null)
      clearTimeout(reconnectRef.current)
    }

    ws.onmessage = evt => {
      if (!mountedRef.current) return
      try {
        const msg = JSON.parse(evt.data)

        if (msg.type === 'status') {
          setGloveConnected(msg.connected)
          setGlovePort(msg.port || null)
          if (!msg.connected) {
            setFingerData([0, 0, 0, 0, 0])
            setRawData([0, 0, 0, 0])
            hwHoldCandidate = null
            hwHoldCount     = 0
          }
        }

        if (msg.type === 'frame') {
          const raw  = msg.raw    // [index, middle, ring, pinky] raw integers
          const isN  = msg.isNorm // already normalized?

          setRawData(raw)

          // Auto-expand calibration range as data comes in
          if (!isN) cal.autoUpdate(raw)

          // Normalize: convert raw → 0.0-1.0
          let norm
          if (isN) {
            // Already normalized (came as JSON with 0-1 values)
            norm = raw.map(v => v / 1000)
          } else {
            norm = cal.normalize(raw)
          }

          // Build fingerData array: [thumb=0, index, middle, ring, pinky]
          const fd = [0, norm[0], norm[1], norm[2], norm[3]]
          setFingerData(fd)

          // ── Classify — same pipeline as ML mode ────────────────
          let gesture = null

          // 1. Trained KNN model (hardwareClassifier)
          if (hardwareClassifier.numClasses > 0) {
            const features = sensorToFeatures(fd)  // [idx, mid, rng, pky]
            if (features) {
              const result = hardwareClassifier.predict(features)
              if (result) gesture = { text: result.label, confidence: result.confidence }
            }
          }

          // 2. Rule-based fallback using normalized values
          if (!gesture) gesture = ruleBasedHardware(norm)

          const emitted = debounceHwGesture(gesture)
          if (emitted) setLastGesture({ ...emitted, ts: Date.now() })
        }

        if (msg.type === 'error') setError(msg.message)
      } catch { /* ignore */ }
    }

    ws.onclose = evt => {
      if (!mountedRef.current) return
      setWsReady(false)
      if (evt.code !== 1000) {
        reconnectRef.current = setTimeout(connect, 2500)
      }
    }

    ws.onerror = () => ws.close()
  }, [cal])

  useEffect(() => {
    const t = setTimeout(connect, 500)
    return () => {
      clearTimeout(t)
      clearTimeout(reconnectRef.current)
      mountedRef.current = false
      wsRef.current?.close(1000, 'unmount')
    }
  }, [connect])

  return {
    wsReady, gloveConnected, glovePort,
    fingerData, rawData, lastGesture, error,
    calibration: cal,
  }
}