import { useEffect, useRef, useState, useCallback } from 'react'
import { cameraClassifier, landmarksToFeatures } from '../utils/knnClassifier'

// ── Rule-based fallback classifier ──────────────────────────────────
function ruleBasedClassify(landmarks) {
  if (!landmarks || landmarks.length < 21) return null

  const lm = (i) => landmarks[i]

  function isExtended(tipIdx, pipIdx) {
    return lm(tipIdx).y < lm(pipIdx).y
  }
  function isThumbExtended() {
    return Math.abs(lm(4).x - lm(2).x) > 0.08
  }

  const thumb  = isThumbExtended()
  const index  = isExtended(8,  6)
  const middle = isExtended(12, 10)
  const ring   = isExtended(16, 14)
  const pinky  = isExtended(20, 18)

  const thumbTip  = lm(4)
  const indexTip  = lm(8)
  const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y)

  if (thumb && index && middle && ring && pinky)   return { text: 'Hello',       confidence: 88 }
  if (!thumb && !index && !middle && !ring && !pinky) return { text: 'Yes',      confidence: 88 }
  if (!thumb && index && middle && !ring && !pinky)   return { text: 'No',       confidence: 88 }
  if (thumb && !index && !middle && !ring && !pinky)  return { text: 'Good',     confidence: 88 }
  if (!thumb && index && !middle && !ring && !pinky)  return { text: 'Water',    confidence: 85 }
  if (thumb && !index && !middle && !ring && pinky)   return { text: 'I need help', confidence: 85 }
  if (!thumb && index && middle && ring && !pinky)    return { text: 'Thank you', confidence: 85 }
  if (pinchDist < 0.06 && !middle && !ring && !pinky) return { text: 'Okay',    confidence: 88 }

  return null
}

// ── Unified classifier: KNN trained model first, rule-based fallback ─
function classifyGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return null

  // 1. Try trained KNN model first
  if (cameraClassifier.numClasses > 0) {
  const features = landmarksToFeatures(landmarks)
  if (features) {
    const result = cameraClassifier.predict(features)
    if (result) {
      return { text: result.label, confidence: result.confidence }
    }
  } }

  // 2. Fall back to rule-based
  return ruleBasedClassify(landmarks)
}

// ── Debounce: require gesture stable for N frames ────────────────────
// Faster = fewer frames needed
let holdCandidate = null
let holdCount     = 0
let lastEmitTime  = 0
const HOLD_FRAMES  = 4      // ~200ms at 20fps — fast enough for real use
const COOLDOWN_MS  = 1200   // 1.2s between emissions

function debounceGesture(gesture) {
  const now = Date.now()
  if (now - lastEmitTime < COOLDOWN_MS) return null

  if (!gesture) {
    holdCandidate = null
    holdCount     = 0
    return null
  }

  if (gesture.text === holdCandidate) {
    holdCount++
  } else {
    holdCandidate = gesture.text
    holdCount     = 1
  }

  if (holdCount >= HOLD_FRAMES) {
    holdCount     = 0
    holdCandidate = null
    lastEmitTime  = now
    return gesture
  }
  return null
}

// ── Draw skeleton on canvas ──────────────────────────────────────────
function drawSkeleton(ctx, landmarks, W, H) {
  if (!landmarks || !W || !H) return

  const CONNECTIONS = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [5,9],[9,10],[10,11],[11,12],
    [9,13],[13,14],[14,15],[15,16],
    [13,17],[17,18],[18,19],[19,20],
    [0,17],
  ]

  // Video is CSS mirrored (scaleX -1) — mirror landmarks to match
  const px = (lm) => (1 - lm.x) * W
  const py = (lm) => lm.y * H

  ctx.lineWidth   = 2.5
  ctx.strokeStyle = 'rgba(74,127,165,0.85)'
  for (const [a, b] of CONNECTIONS) {
    const lA = landmarks[a]
    const lB = landmarks[b]
    if (!lA || !lB) continue
    ctx.beginPath()
    ctx.moveTo(px(lA), py(lA))
    ctx.lineTo(px(lB), py(lB))
    ctx.stroke()
  }

  const TIPS = [4, 8, 12, 16, 20]
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i]
    if (!lm) continue
    const x = px(lm)
    const y = py(lm)
    const r = TIPS.includes(i) ? 6 : 4

    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = TIPS.includes(i)
      ? 'rgba(106,159,197,1)'
      : 'rgba(74,127,165,0.95)'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(10,10,14,0.8)'
    ctx.lineWidth   = 1.5
    ctx.stroke()
  }
}

// ── Main hook ────────────────────────────────────────────────────────
export function useMediaPipe({ onGesture, enabled }) {
  const videoRef     = useRef(null)
  const canvasRef    = useRef(null)
  const streamRef    = useRef(null)
  const handsRef     = useRef(null)
  const animFrameRef = useRef(null)
  const runningRef   = useRef(false)

  const [loading,     setLoading]     = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [handVisible, setHandVisible] = useState(false)
  const [error,       setError]       = useState('')

  // ── Frame processor ────────────────────────────────────────────
  function processFrame() {
    if (!runningRef.current) return
    const video  = videoRef.current
    const hands  = handsRef.current
    if (video && hands && video.readyState >= 2) {
      hands.send({ image: video }).catch(() => {})
    }
    animFrameRef.current = requestAnimationFrame(processFrame)
  }

  // ── Start ──────────────────────────────────────────────────────
  const start = useCallback(async () => {
    setLoading(true)
    setError('')

    // Reset debounce state on each start
    holdCandidate = null
    holdCount     = 0
    lastEmitTime  = 0

    // 1. Get camera
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      })
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError'  ? 'Camera permission denied. Please allow and retry.' :
        err.name === 'NotFoundError'    ? 'No camera found on this device.' :
        `Camera error: ${err.message}`
      setError(msg)
      setLoading(false)
      return
    }

    streamRef.current = stream
    const video = videoRef.current
    if (!video) { stream.getTracks().forEach(t => t.stop()); setLoading(false); return }

    video.srcObject = stream
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = () => video.play().then(resolve).catch(reject)
      video.onerror          = reject
    })

    // 2. Size canvas — wait for real dimensions
    const canvas = canvasRef.current
    await new Promise(resolve => {
      const check = () => {
        if (video.videoWidth > 0) {
          canvas.width  = video.videoWidth
          canvas.height = video.videoHeight
          resolve()
        } else {
          setTimeout(check, 50)
        }
      }
      check()
    })

    // 3. Init MediaPipe from global (loaded via CDN in index.html)
    if (!window.Hands) {
      setError('MediaPipe not loaded. Check internet connection and refresh.')
      setLoading(false)
      return
    }

    const hands = new window.Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    })

    hands.setOptions({
      maxNumHands:             1,
      modelComplexity:         1,
      minDetectionConfidence:  0.65,  // lower = faster detection
      minTrackingConfidence:   0.55,  // lower = smoother tracking
    })

    hands.onResults((results) => {
      const ctx = canvas.getContext('2d')
      const W   = canvas.width
      const H   = canvas.height

      ctx.clearRect(0, 0, W, H)

      if (results.multiHandLandmarks?.length > 0) {
        const lms = results.multiHandLandmarks[0]
        setHandVisible(true)

        // Expose globally for GestureRecorder + TestPanel
        window.__syntalkLandmarks = lms

        // Draw skeleton
        drawSkeleton(ctx, lms, W, H)

        // Classify — trained model first, rule-based fallback
        const gesture = classifyGesture(lms)
        const emitted = debounceGesture(gesture)
        if (emitted) onGesture?.(emitted)

      } else {
        setHandVisible(false)
        window.__syntalkLandmarks = null
        debounceGesture(null)
      }
    })

    await hands.initialize()
    handsRef.current  = hands
    runningRef.current = true
    setCameraReady(true)
    setLoading(false)
    processFrame()
  }, [onGesture])

  // ── Stop ───────────────────────────────────────────────────────
  const stop = useCallback(() => {
    runningRef.current = false

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (handsRef.current) {
      try { handsRef.current.close() } catch {}
      handsRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }

    setCameraReady(false)
    setHandVisible(false)
    setLoading(false)

    // Reset debounce
    holdCandidate = null
    holdCount     = 0
  }, [])

  useEffect(() => {
    if (enabled) start()
    else stop()
    return () => stop()
  }, [enabled])

  return { videoRef, canvasRef, loading, cameraReady, handVisible, error, start, stop }
}