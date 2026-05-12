import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Circle, Square, CheckCircle, AlertTriangle } from 'lucide-react'
import { useMediaPipe } from '../../hooks/useMediaPipe'
import { landmarksToFeatures, sensorToFeatures } from '../../utils/knnClassifier'

const SAMPLES_NEEDED  = 40
const SAMPLE_INTERVAL = 60   // faster sampling

export default function GestureRecorder({ source, fingerData, rawData, onSamplesReady }) {
  const [phase,     setPhase]     = useState('idle')
  const [count,     setCount]     = useState(0)
  const [cdNum,     setCdNum]     = useState(3)
  const [camActive, setCamActive] = useState(false)

  const samplesRef  = useRef([])
  const intervalRef = useRef(null)
  const cdRef       = useRef(null)

  const { videoRef, canvasRef, cameraReady, handVisible }
    = useMediaPipe({ onGesture: () => {}, enabled: source === 'camera' && camActive })

  function collectSample() {
    let feat = null

    if (source === 'camera') {
      const lms = window.__syntalkLandmarks
      if (lms) feat = landmarksToFeatures(lms)
    } else {
      // Hardware: use NORMALIZED fingerData (not raw)
      // fingerData = [0, idx, mid, rng, pky] all 0-1
      if (fingerData?.length === 5) {
        feat = sensorToFeatures(fingerData)  // [idx, mid, rng, pky]
      }
    }

    if (!feat) return
    samplesRef.current.push(feat)
    setCount(samplesRef.current.length)
    if (samplesRef.current.length >= SAMPLES_NEEDED) finishRecording()
  }

  function startCountdown() {
    samplesRef.current = []
    setCount(0)
    setPhase('countdown')
    let n = 3
    setCdNum(n)
    cdRef.current = setInterval(() => {
      n--
      if (n <= 0) { clearInterval(cdRef.current); startCapture() }
      else setCdNum(n)
    }, 1000)
  }

  function startCapture() {
    setPhase('recording')
    intervalRef.current = setInterval(collectSample, SAMPLE_INTERVAL)
  }

  function finishRecording() {
    clearInterval(intervalRef.current)
    setPhase('done')
    onSamplesReady?.(samplesRef.current)
  }

  function cancelRecording() {
    clearInterval(intervalRef.current)
    clearInterval(cdRef.current)
    samplesRef.current = []
    setCount(0)
    setPhase('idle')
  }

  useEffect(() => () => {
    clearInterval(intervalRef.current)
    clearInterval(cdRef.current)
  }, [])

  const progress  = Math.min(100, (count / SAMPLES_NEEDED) * 100)

  // Check if hardware data looks calibrated
  const isDataGood = source === 'hardware'
    ? fingerData?.some(v => v > 0.05 && v < 0.95)   // at least some variation
    : true

  const canRecord = source === 'hardware'
    ? fingerData?.length === 5
    : camActive && cameraReady

  return (
    <div className="flex flex-col gap-3">

      {/* Camera preview */}
      {source === 'camera' && (
        <div>
          {!camActive ? (
            <button onClick={() => setCamActive(true)}
              className="w-full py-6 rounded-xl text-center font-body"
              style={{
                fontSize: 13.5,
                background: 'rgba(74,127,165,0.07)',
                border: '1px dashed rgba(74,127,165,0.25)',
                color: 'var(--text-muted)',
              }}>
              Click to activate camera
            </button>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black"
              style={{ aspectRatio: '4/3' }}>
              <video ref={videoRef} autoPlay playsInline muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }} />
              <canvas ref={canvasRef} width={640} height={480}
                className="absolute inset-0 w-full h-full" />
              <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full"
                style={{
                  background: 'rgba(12,12,15,0.8)',
                  border: handVisible ? '1px solid rgba(74,239,128,0.3)' : '1px solid var(--border)',
                }}>
                <span className={`w-1.5 h-1.5 rounded-full ${handVisible ? 'animate-pulse' : ''}`}
                  style={{ background: handVisible ? '#4ade80' : 'var(--text-muted)' }} />
                <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono',
                  color: handVisible ? '#86efac' : 'var(--text-muted)' }}>
                  {handVisible ? 'detected' : 'no hand'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hardware status + live normalized values */}
      {source === 'hardware' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${fingerData?.length === 5 ? 'animate-pulse' : ''}`}
              style={{ background: fingerData?.length === 5 ? '#4ade80' : '#f87171' }} />
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                {fingerData?.length === 5 ? 'Glove connected — hold gesture still and record' : 'Connect glove first'}
              </p>
              {fingerData?.length === 5 && (
                <div className="flex items-center gap-3 mt-1.5">
                  {['I', 'M', 'R', 'P'].map((label, i) => {
                    const val = fingerData[i + 1] ?? 0
                    return (
                      <div key={label} className="flex flex-col items-center gap-0.5">
                        <div className="w-4 rounded overflow-hidden"
                          style={{ height: 20, background: 'rgba(255,255,255,0.06)', position: 'relative' }}>
                          <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            height: `${val * 100}%`,
                            background: 'linear-gradient(180deg,var(--accent-light),var(--accent))',
                            borderRadius: 2,
                            transition: 'height 0.1s',
                          }} />
                        </div>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                          {label}
                        </span>
                        <span style={{ fontSize: 9, color: 'var(--accent-light)', fontFamily: 'JetBrains Mono' }}>
                          {val.toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Warn if values look uncalibrated (all 0 or all 1) */}
          {fingerData?.length === 5 && !isDataGood && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
              <AlertTriangle size={13} style={{ color: '#fbbf24', flexShrink: 0 }} />
              <p style={{ fontSize: 11.5, color: '#fde68a' }}>
                Sensor values look off. Flex and release your fingers a few times to auto-calibrate, then record.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      {(phase === 'recording' || phase === 'done') && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {phase === 'done' ? 'Complete' : 'Recording…'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--accent-light)', fontFamily: 'JetBrains Mono' }}>
              {count} / {SAMPLES_NEEDED}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div className="h-full rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
              style={{
                background: phase === 'done'
                  ? 'linear-gradient(90deg,#22c55e,#4ade80)'
                  : 'linear-gradient(90deg,var(--accent),var(--accent-light))',
              }}
            />
          </div>
        </div>
      )}

      {/* Countdown */}
      <AnimatePresence>
        {phase === 'countdown' && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }} className="text-center py-1">
            <span className="font-display text-gradient" style={{ fontSize: 52, lineHeight: 1 }}>
              {cdNum}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      {phase === 'idle' && (
        <button onClick={startCountdown} disabled={!canRecord}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-body
            transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            fontSize: 14, background: 'var(--accent)', color: '#fff',
            boxShadow: '0 4px 20px rgba(74,127,165,0.22)',
          }}>
          <Circle size={13} fill="currentColor" /> Start Recording
        </button>
      )}

      {(phase === 'countdown' || phase === 'recording') && (
        <button onClick={cancelRecording}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-body"
          style={{
            fontSize: 14, background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5',
          }}>
          <Square size={13} fill="currentColor" /> Cancel
        </button>
      )}

      {phase === 'done' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-center gap-2 py-3 rounded-xl"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <CheckCircle size={15} style={{ color: '#4ade80' }} />
            <span style={{ fontSize: 14, color: '#86efac' }}>{count} samples ready</span>
          </div>
          <button onClick={cancelRecording}
            style={{ fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center' }}>
            Re-record
          </button>
        </div>
      )}
    </div>
  )
}