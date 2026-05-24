import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Dumbbell, Check,
  X, Camera, Cpu, BookOpen, Zap, AlertCircle
} from 'lucide-react'
import { useGestureTrainer } from '../../hooks/useGestureTrainer'
import { useGloveWebSocket } from '../../hooks/useGloveWebSocket'
import GestureRecorder from '../../components/ui/GestureRecorder'
import {
  gestureClassifier,
  cameraClassifier,
  hardwareClassifier,
  landmarksToFeatures,
  sensorToFeatures,
} from '../../utils/knnClassifier'
import { useMediaPipe } from '../../hooks/useMediaPipe'


// ── Single gesture card ──────────────────────────────────────────────
function GestureCard({ gesture, onDelete }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-raised rounded-xl p-4 group"
      style={{ border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-body font-medium"
              style={{ fontSize: 14, color: 'var(--text-primary)' }}>
              {gesture.name}
            </span>
            <span
              className="px-2 py-0.5 rounded-full font-mono"
              style={{
                fontSize: 10,
                background: gesture.source === 'camera'
                  ? 'rgba(59,130,246,0.12)' : 'rgba(34,197,94,0.12)',
                border: gesture.source === 'camera'
                  ? '1px solid rgba(59,130,246,0.22)' : '1px solid rgba(34,197,94,0.22)',
                color: gesture.source === 'camera' ? '#93c5fd' : '#86efac',
              }}
            >
              {gesture.source === 'camera' ? '📷 Camera' : '🤖 Hardware'}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
            {gesture.count} samples
          </p>
        </div>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg
              flex items-center justify-center transition-all duration-200"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.18)',
              color: '#fca5a5',
            }}
          >
            <Trash2 size={12} />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onDelete(gesture.name, gesture.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
            >
              <Check size={12} />
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Sample bar viz */}
      <div className="mt-3 flex items-end gap-0.5 h-5">
        {Array.from({ length: Math.min(gesture.count, 30) }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              background: 'rgba(74,127,165,0.4)',
              height: `${40 + Math.sin(i * 0.9) * 35 + 25}%`,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// ── Add gesture modal ────────────────────────────────────────────────
function AddGestureModal({ onClose, onSave, saving, fingerData, rawData })  {
  const [name,   setName]   = useState('')
  const [source, setSource] = useState('camera')
  const [error,  setError]  = useState('')

  // Use ref so handleSave always reads the latest samples
  const samplesRef  = useRef([])
  const [sampleCount, setSampleCount] = useState(0)

  function handleSamplesReady(s) {
    samplesRef.current = s
    setSampleCount(s.length)
  }

  function handleSave() {
    if (!name.trim()) {
      setError('Enter a gesture name')
      return
    }
    if (samplesRef.current.length < 10) {
      setError(`Need at least 10 samples — got ${samplesRef.current.length}. Re-record.`)
      return
    }
    setError('')
    onSave(name.trim(), samplesRef.current, source)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="glass-overlay rounded-2xl p-6 w-full overflow-y-auto"
        style={{ maxWidth: 500, maxHeight: '90vh', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-light"
              style={{ fontSize: 24, color: 'var(--text-primary)' }}>
              Train New Gesture
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Record samples to teach the AI your gesture
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Gesture name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Hello, Thank you, Water…"
              className="w-full rounded-xl px-4 py-3 outline-none font-body"
              style={{
                fontSize: 14,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(74,127,165,0.5)'}
              onBlur={e  => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Source */}
          <div>
            <label style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Input source
            </label>
            <div className="flex gap-2">
              {['camera', 'hardware'].map(s => (
                <button key={s} onClick={() => setSource(s)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-body"
                  style={{
                    fontSize: 13.5,
                    background: source === s ? 'rgba(74,127,165,0.15)' : 'rgba(255,255,255,0.04)',
                    border: source === s ? '1px solid rgba(74,127,165,0.3)' : '1px solid var(--border)',
                    color: source === s ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}>
                  {s === 'camera' ? <><Camera size={14} /> Camera</> : <><Cpu size={14} /> Hardware</>}
                </button>
              ))}
            </div>
          </div>

          {/* Hint */}
          <div className="rounded-xl px-3 py-2.5"
            style={{ background: 'rgba(74,127,165,0.07)', border: '1px solid rgba(74,127,165,0.15)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Hold your gesture still → click <strong style={{ color: 'var(--text-secondary)' }}>Start Recording</strong> →
              keep steady until <span style={{ color: 'var(--accent-light)' }}>30 samples</span> are collected.
            </p>
          </div>

          {/* Recorder — key changes when source changes so it remounts cleanly */}
          <GestureRecorder
  key={source}
  source={source}
  fingerData={fingerData}
  rawData={rawData}
  onSamplesReady={handleSamplesReady}
/>

          {/* Sample count feedback */}
          {sampleCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                background: sampleCount >= 30 ? 'rgba(34,197,94,0.08)' : 'rgba(74,127,165,0.08)',
                border: sampleCount >= 30 ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(74,127,165,0.2)',
              }}>
              <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: sampleCount >= 30 ? '#86efac' : 'var(--accent-light)' }}>
                {sampleCount} samples ready {sampleCount >= 30 ? '✓' : `(need ${30 - sampleCount} more)`}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2" style={{ color: '#f87171', fontSize: 13 }}>
              <AlertCircle size={13} /> {error}
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || sampleCount < 10}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl
              font-body transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              fontSize: 14,
              background: 'var(--accent)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(74,127,165,0.25)',
            }}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving to Firestore…
              </>
            ) : (
              <>
                <Dumbbell size={14} />
                Save Gesture ({sampleCount} samples)
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Test panel ───────────────────────────────────────────────────────
function TestPanel({ fingerData, modelReady, gestures }) {
  const [testActive,  setTestActive]  = useState(false)
  const [prediction,  setPrediction]  = useState(null)
  const [testSource,  setTestSource]  = useState('camera')

  // Camera test
  const { videoRef, canvasRef } = useMediaPipe({
    onGesture: () => {
      if (testSource !== 'camera') return
      const lms = window.__syntalkLandmarks
      if (!lms) return
      const features = landmarksToFeatures(lms)
      if (!features) return
      const result = cameraClassifier.predict(features)
      if (result) setPrediction({ ...result, source: 'camera' })
    },
    enabled: testActive && testSource === 'camera',
  })

  // Hardware test
  const testHardware = useCallback(() => {
    if (!fingerData || fingerData.length !== 5) return
    const features = sensorToFeatures(fingerData)
    if (!features) return
    const result = hardwareClassifier.predict(features)
    setPrediction(
      result
        ? { ...result, source: 'hardware' }
        : { label: 'No match', confidence: 0, source: 'hardware' }
    )
  }, [fingerData])

  // Auto-test hardware continuously when active
  useEffect(() => {
    if (testSource !== 'hardware' || !testActive) return
    const interval = setInterval(testHardware, 200)
    return () => clearInterval(interval)
  }, [testSource, testActive, testHardware])

  if (!modelReady) {
    return (
      <div className="glass-raised rounded-2xl p-6 text-center"
        style={{ border: '1px solid var(--border)' }}>
        <BookOpen size={20} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-2" />
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Train at least one gesture to enable testing
        </p>
      </div>
    )
  }

  const hasCameraGestures   = gestures.some(g => g.source === 'camera')
  const hasHardwareGestures = gestures.some(g => g.source === 'hardware')

  return (
    <div className="glass-raised rounded-2xl p-5 flex flex-col gap-4"
      style={{ border: '1px solid var(--border)' }}>
      <p style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Test Your Model
      </p>

      {/* Source selector */}
      <div className="flex gap-2">
        {[
          { id: 'camera',   label: 'Camera',   icon: Camera, disabled: !hasCameraGestures   },
          { id: 'hardware', label: 'Hardware',  icon: Cpu,    disabled: !hasHardwareGestures },
        ].map(({ id, label, icon: Icon, disabled }) => (
          <button
            key={id}
            onClick={() => { setTestSource(id); setTestActive(false); setPrediction(null) }}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-body
              transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              fontSize: 13,
              background: testSource === id ? 'rgba(74,127,165,0.15)' : 'rgba(255,255,255,0.04)',
              border: testSource === id ? '1px solid rgba(74,127,165,0.3)' : '1px solid var(--border)',
              color: testSource === id ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Start/Stop */}
      <button
        onClick={() => { setTestActive(a => !a); setPrediction(null) }}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-body transition-all duration-200"
        style={{
          fontSize: 13.5,
          background: testActive ? 'rgba(239,68,68,0.1)' : 'var(--accent)',
          border: testActive ? '1px solid rgba(239,68,68,0.2)' : 'none',
          color: testActive ? '#fca5a5' : '#fff',
          boxShadow: testActive ? 'none' : '0 4px 16px rgba(74,127,165,0.22)',
        }}
      >
        {testActive ? 'Stop Testing' : `Start ${testSource === 'camera' ? 'Camera' : 'Hardware'} Test`}
      </button>

      {/* Camera preview */}
      {testActive && testSource === 'camera' && (
        <div className="relative rounded-xl overflow-hidden bg-black"
          style={{ aspectRatio: '4/3' }}>
          <video ref={videoRef} autoPlay playsInline muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }} />
          <canvas ref={canvasRef} width={640} height={480}
            className="absolute inset-0 w-full h-full" />
        </div>
      )}

      {/* Hardware live values while testing */}
      {testActive && testSource === 'hardware' && (
        <div className="glass rounded-xl p-3"
          style={{ border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginBottom: 6 }}>
            LIVE SENSOR VALUES
          </p>
          <div className="flex items-end gap-3">
            {['Index', 'Middle', 'Ring', 'Pinky'].map((name, i) => {
              const val = fingerData?.[i + 1] ?? 0
              return (
                <div key={name} className="flex flex-col items-center gap-1 flex-1">
                  {/* Bar */}
                  <div className="w-full rounded overflow-hidden"
                    style={{ height: 40, background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
                    <motion.div
                      animate={{ height: `${val * 100}%` }}
                      transition={{ duration: 0.1 }}
                      style={{
                        position: 'absolute',
                        bottom: 0, left: 0, right: 0,
                        background: val > 0.6
                          ? 'linear-gradient(180deg,#4ade80,#22c55e)'
                          : val > 0.3
                          ? 'linear-gradient(180deg,var(--accent-light),var(--accent))'
                          : 'rgba(255,255,255,0.2)',
                        borderRadius: 2,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                    {val.toFixed(2)}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                    {name.slice(0, 3)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Prediction result */}
      <AnimatePresence mode="wait">
        {prediction && (
          <motion.div
            key={`${prediction.label}-${prediction.confidence}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4"
            style={{ border: '1px solid rgba(74,127,165,0.2)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-display font-light text-gradient" style={{ fontSize: 32 }}>
                {prediction.label}
              </p>
              <div className="flex flex-col items-end gap-1">
                <span style={{ fontSize: 13, color: 'var(--accent-light)', fontFamily: 'JetBrains Mono' }}>
                  {prediction.confidence}%
                </span>
                <span style={{
                  fontSize: 10, fontFamily: 'JetBrains Mono',
                  color: prediction.source === 'hardware' ? '#86efac' : '#93c5fd',
                }}>
                  {prediction.source}
                </span>
              </div>
            </div>
            <div className="w-full h-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${prediction.confidence}%` }}
                transition={{ duration: 0.5 }}
                style={{ background: 'linear-gradient(90deg,var(--accent),var(--accent-light))' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
// ── Main page ────────────────────────────────────────────────────────
export default function TrainingPage() {
  const {
    gestures, loading, saving, error,
    modelReady, saveGesture, deleteGesture,
  } = useGestureTrainer()

  const { fingerData, rawData, gloveConnected } = useGloveWebSocket()
  const [showModal, setShowModal] = useState(false)

  async function handleSave(name, samples, source) {
    await saveGesture(name, samples, source)
    setShowModal(false)
  }

  const totalSamples = gestures.reduce((a, g) => a + g.count, 0)

  return (
    <div className="p-6 flex flex-col gap-6 min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Personalized Learning
          </p>
          <h1 className="font-display font-light mt-1"
            style={{ fontSize: 30, color: 'var(--text-primary)' }}>
            Training Studio
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-body
            self-start sm:self-auto transition-all duration-200"
          style={{
            fontSize: 13.5,
            background: 'var(--accent)',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(74,127,165,0.25)',
          }}
        >
          <Plus size={15} /> Train New Gesture
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Trained',  value: gestures.length,                                          icon: <Dumbbell size={14} /> },
          { label: 'Samples',  value: totalSamples,                                             icon: <Zap size={14} /> },
          { label: 'Camera',   value: gestures.filter(g => g.source === 'camera').length,       icon: <Camera size={14} /> },
          { label: 'Hardware', value: gestures.filter(g => g.source === 'hardware').length,     icon: <Cpu size={14} /> },
        ].map(stat => (
          <div key={stat.label} className="glass-raised rounded-xl p-4"
            style={{ border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-1.5" style={{ color: 'var(--text-muted)' }}>
              {stat.icon}
              <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {stat.label}
              </span>
            </div>
            <p className="font-display font-light"
              style={{ fontSize: 34, color: 'var(--text-primary)', lineHeight: 1 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="flex flex-col xl:flex-row gap-5">

        {/* Gesture library */}
        <div className="flex-1 min-w-0">
          <p className="mb-3" style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Your Gesture Library
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--accent)' }} />
            </div>
          ) : gestures.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center"
              style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
              <Dumbbell size={24} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-3" />
              <h3 className="font-body font-medium mb-2"
                style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
                No gestures trained yet
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 280, margin: '0 auto 16px' }}>
                Click "Train New Gesture" to start teaching the AI your personal signs.
              </p>
              <button
                onClick={() => setShowModal(true)}
                style={{ fontSize: 13, color: 'var(--accent-light)', fontFamily: 'DM Sans' }}
              >
                + Train your first gesture →
              </button>
            </div>
          ) : (
            <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence>
                {gestures.map(g => (
                  <GestureCard key={g.id} gesture={g} onDelete={deleteGesture} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Right: test + glove status */}
        <div className="xl:w-80 flex flex-col gap-3 flex-shrink-0">
          <TestPanel fingerData={fingerData} modelReady={modelReady} gestures={gestures} />

          <div
            className="glass-raised rounded-xl p-3 flex items-center gap-2"
            style={{
              border: gloveConnected
                ? '1px solid rgba(74,239,128,0.2)'
                : '1px solid var(--border)',
            }}
          >
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${gloveConnected ? 'animate-pulse' : ''}`}
              style={{ background: gloveConnected ? '#4ade80' : 'var(--text-muted)' }}
            />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
              {gloveConnected
                ? 'Glove connected — hardware training ready'
                : 'Glove not connected'}
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <AddGestureModal
  onClose={() => setShowModal(false)}
  onSave={handleSave}
  saving={saving}
  fingerData={fingerData}
  rawData={rawData}
/>
        )}
      </AnimatePresence>
    </div>
  )
}