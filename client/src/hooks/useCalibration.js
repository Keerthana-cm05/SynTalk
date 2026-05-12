import { useRef, useState, useCallback } from 'react'

// Persists calibration to localStorage so it survives page refresh
const STORAGE_KEY = 'syntalk_calibration'

const DEFAULT_CAL = {
  min: [300, 300, 300, 300],
  max: [700, 700, 700, 700],
  trained: false,
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return { ...DEFAULT_CAL }
}

function saveToStorage(cal) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cal))
  } catch {}
}

export function useCalibration() {
  const [calibration, setCalibration] = useState(() => loadFromStorage())
  const [calibrating, setCalibrating] = useState(false)
  const [calPhase,    setCalPhase]    = useState('idle') // idle | open | close | done
  const openRef  = useRef([1023, 1023, 1023, 1023])
  const closeRef = useRef([0, 0, 0, 0])

  // Normalize raw value using current calibration
  const normalize = useCallback((raw) => {
    if (!Array.isArray(raw) || raw.length < 4) return [0, 0, 0, 0]
    const { min, max, trained } = calibration
    return raw.map((v, i) => {
      const lo = min[i]
      const hi = max[i]
      if (hi === lo) return 0
      return Math.max(0, Math.min(1, (v - lo) / (hi - lo)))
    })
  }, [calibration])

  // Update calibration min/max from live data (auto-expand range)
  const autoUpdate = useCallback((raw) => {
    if (!Array.isArray(raw) || raw.length < 4) return
    setCalibration(prev => {
      const newMin = prev.min.map((m, i) => Math.min(m, raw[i]))
      const newMax = prev.max.map((m, i) => Math.max(m, raw[i]))
      const updated = { ...prev, min: newMin, max: newMax, trained: true }
      saveToStorage(updated)
      return updated
    })
  }, [])

  // Manual calibration: Step 1 — capture open hand
  function startCalibrateOpen() {
    openRef.current  = [1023, 1023, 1023, 1023]
    closeRef.current = [0, 0, 0, 0]
    setCalPhase('open')
    setCalibrating(true)
  }

  // Called with raw values during open-hand capture
  function captureOpen(raw) {
    if (!Array.isArray(raw)) return
    openRef.current = raw.map((v, i) => Math.min(v, openRef.current[i]))
  }

  // Manual calibration: Step 2 — capture closed fist
  function startCalibrateClose() {
    setCalPhase('close')
  }

  function captureClose(raw) {
    if (!Array.isArray(raw)) return
    closeRef.current = raw.map((v, i) => Math.max(v, closeRef.current[i]))
  }

  // Finish — save calibration
  function finishCalibration() {
    const newCal = {
      min:     openRef.current.slice(),
      max:     closeRef.current.slice(),
      trained: true,
    }
    setCalibration(newCal)
    saveToStorage(newCal)
    setCalibrating(false)
    setCalPhase('done')
    console.log('✅ Calibration saved:', newCal)
  }

  function resetCalibration() {
    const reset = { ...DEFAULT_CAL }
    setCalibration(reset)
    saveToStorage(reset)
    setCalPhase('idle')
    setCalibrating(false)
  }

  return {
    calibration,
    calibrating,
    calPhase,
    normalize,
    autoUpdate,
    startCalibrateOpen,
    startCalibrateClose,
    captureOpen,
    captureClose,
    finishCalibration,
    resetCalibration,
  }
}