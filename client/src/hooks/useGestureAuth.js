import { useCallback, useRef, useState } from 'react'
import { db }           from '../firebase/config'
import { collection, getDocs } from 'firebase/firestore'
import {
  cameraClassifier,
  hardwareClassifier,
  landmarksToFeatures,
  sensorToFeatures,
} from '../utils/knnClassifier'

// Loads a user's gesture auth samples into a temporary classifier
// Returns { match: true/false, confidence }
export function useGestureAuth() {
  const [checking, setChecking]     = useState(false)
  const [authError, setAuthError]   = useState('')
  const tempClassifier              = useRef(null)

  // Load gesture auth data for a specific uid
  const loadUserGestures = useCallback(async (uid) => {
    try {
      const ref  = collection(db, 'users', uid, 'gestures')
      const snap = await getDocs(ref)

      // Build temp classifiers from saved gestures
      const camGestures = []
      const hwGestures  = []

      snap.forEach(doc => {
        const data    = doc.data()
        const samples = (data.samples || []).map(s =>
          Array.isArray(s) ? s : (s?.v || [])
        ).filter(v => v.length > 0)

        if (data.source === 'camera')   camGestures.push({ name: data.name, samples })
        if (data.source === 'hardware') hwGestures.push({ name: data.name, samples })
      })

      return { camGestures, hwGestures }
    } catch (e) {
      console.error('loadUserGestures:', e)
      return { camGestures: [], hwGestures: [] }
    }
  }, [])

  // Check if landmarks match any stored gesture for this user
  const verifyCamera = useCallback(async (uid, landmarks) => {
    setChecking(true)
    setAuthError('')
    try {
      const { camGestures } = await loadUserGestures(uid)
      if (camGestures.length === 0) return { match: false, reason: 'No camera gestures set up' }

      const features = landmarksToFeatures(landmarks)
      if (!features) return { match: false, reason: 'No landmarks detected' }

      // Try each gesture
      for (const g of camGestures) {
        // Simple KNN check against this gesture's samples
        const match = checkSamples(features, g.samples, 0.72)
        if (match.match) return { match: true, name: g.name, confidence: match.confidence }
      }

      return { match: false, reason: 'Gesture not recognised' }
    } catch (e) {
      return { match: false, reason: e.message }
    } finally {
      setChecking(false)
    }
  }, [loadUserGestures])

  // Check if hardware finger data matches stored gesture
  const verifyHardware = useCallback(async (uid, fingerData) => {
    setChecking(true)
    setAuthError('')
    try {
      const { hwGestures } = await loadUserGestures(uid)
      if (hwGestures.length === 0) return { match: false, reason: 'No hardware gestures set up' }

      const features = sensorToFeatures(fingerData)
      if (!features) return { match: false, reason: 'No sensor data' }

      for (const g of hwGestures) {
        const match = checkSamples(features, g.samples, 0.68)
        if (match.match) return { match: true, name: g.name, confidence: match.confidence }
      }

      return { match: false, reason: 'Gesture not recognised' }
    } catch (e) {
      return { match: false, reason: e.message }
    } finally {
      setChecking(false)
    }
  }, [loadUserGestures])

  return { verifyCamera, verifyHardware, checking, authError }
}

// KNN cosine similarity check
function checkSamples(features, samples, threshold = 0.72) {
  if (!samples || samples.length === 0) return { match: false }

  let bestSim = 0
  for (const s of samples) {
    const sim = cosineSim(features, s)
    if (sim > bestSim) bestSim = sim
  }

  return {
    match:      bestSim >= threshold,
    confidence: Math.round(bestSim * 100),
  }
}

function cosineSim(a, b) {
  if (!a || !b || a.length !== b.length) return 0
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na  += a[i] * a[i]
    nb  += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}