import { useRef, useState, useCallback } from 'react'

const KEY = 'syntalk_cal_v3'

function load() {
  try {
    const s = localStorage.getItem(KEY)
    if (s) {
      const c = JSON.parse(s)
      // Validate it has real data
      if (c.min && c.max && c.min.some((v,i) => c.max[i] - v > 20))
        return c
    }
  } catch {}
  return null  // no valid calibration
}

export function useCalibration() {
  // Use refs for min/max so they update EVERY frame without React re-render lag
  const minRef = useRef([1023, 1023, 1023, 1023])
  const maxRef = useRef([0,    0,    0,    0   ])

  // Load saved calibration into refs immediately
  const saved = load()
  if (saved && minRef.current[0] === 1023) {
    minRef.current = [...saved.min]
    maxRef.current = [...saved.max]
  }

  // Track if we have enough range to normalize properly
  const [ready, setReady] = useState(() => {
    if (!saved) return false
    return saved.min.some((v, i) => saved.max[i] - v > 30)
  })

  // Called every frame with raw [i,m,r,p] integers
  // Expands observed range and returns normalized [0-1] values immediately
  const process = useCallback((raw) => {
    if (!raw || raw.length < 4) return [0, 0, 0, 0]

    let changed = false
    const norm = raw.map((v, i) => {
      // Expand range
      if (v < minRef.current[i]) { minRef.current[i] = v; changed = true }
      if (v > maxRef.current[i]) { maxRef.current[i] = v; changed = true }

      const lo   = minRef.current[i]
      const hi   = maxRef.current[i]
      const span = hi - lo

      // Not enough range yet — show raw proportion assuming 300-700 typical range
      if (span < 20) {
        return Math.max(0, Math.min(1, (v - 200) / 600))
      }

      return Math.max(0, Math.min(1, (v - lo) / span))
    })

    // Save to localStorage periodically (not every frame — too expensive)
    if (changed) {
      const isReady = minRef.current.some((v, i) => maxRef.current[i] - v > 40)
      if (isReady) {
        setReady(true)
        // Throttle saves
        if (!process._saveTimer) {
          process._saveTimer = setTimeout(() => {
            try {
              localStorage.setItem(KEY, JSON.stringify({
                min: [...minRef.current],
                max: [...maxRef.current],
              }))
            } catch {}
            process._saveTimer = null
          }, 1000)
        }
      }
    }

    return norm
  }, [])

  const reset = useCallback(() => {
    minRef.current = [1023, 1023, 1023, 1023]
    maxRef.current = [0,    0,    0,    0   ]
    setReady(false)
    try { localStorage.removeItem(KEY) } catch {}
  }, [])

  // Get current observed range for display
  const getRange = useCallback(() => ({
    min: [...minRef.current],
    max: [...maxRef.current],
    ready,
  }), [ready])

  return { process, reset, ready, getRange }
}