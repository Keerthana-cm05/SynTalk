import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { db } from '../firebase/config'
import {
  collection, doc, setDoc, getDocs,
  deleteDoc, serverTimestamp
} from 'firebase/firestore'
import { cameraClassifier, hardwareClassifier } from '../utils/knnClassifier'

// ── Firestore helpers ─────────────────────────────────────────────────
function samplesToFirestore(samples) {
  return samples.map(vec => ({ v: Array.from(vec) }))
}

function samplesFromFirestore(stored) {
  if (!stored || !Array.isArray(stored)) return []
  return stored.map(item => {
    if (Array.isArray(item))           return item
    if (item && Array.isArray(item.v)) return item.v
    return []
  }).filter(v => v.length > 0)
}

function getClassifier(source) {
  return source === 'hardware' ? hardwareClassifier : cameraClassifier
}

// ── Global preload ────────────────────────────────────────────────────
let _globalLoaded = false

export async function preloadGestureModel(uid) {
  if (_globalLoaded || !uid) return
  try {
    const ref  = collection(db, 'users', uid, 'gestures')
    const snap = await getDocs(ref)

    cameraClassifier.clear()
    hardwareClassifier.clear()

    snap.forEach(docSnap => {
      const data    = docSnap.data()
      const samples = samplesFromFirestore(data.samples)
      const clf     = getClassifier(data.source)
      for (const vec of samples) {
        clf.addExample(data.name, vec)
      }
    })

    _globalLoaded = true
    console.log('✅ Camera classifier:', cameraClassifier.numClasses, 'classes', cameraClassifier.getClassCounts())
    console.log('✅ Hardware classifier:', hardwareClassifier.numClasses, 'classes', hardwareClassifier.getClassCounts())
  } catch (err) {
    console.error('preloadGestureModel error:', err)
  }
}

// ── Hook ──────────────────────────────────────────────────────────────
export function useGestureTrainer() {
  const { user }                    = useAuth()
  const [gestures,   setGestures]   = useState([])
  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [modelReady, setModelReady] = useState(false)

  const loadGestures = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const ref  = collection(db, 'users', user.uid, 'gestures')
      const snap = await getDocs(ref)
      const list = []

      cameraClassifier.clear()
      hardwareClassifier.clear()
      _globalLoaded = false

      snap.forEach(docSnap => {
        const data    = docSnap.data()
        const samples = samplesFromFirestore(data.samples)
        const clf     = getClassifier(data.source)

        list.push({
          id:        docSnap.id,
          name:      data.name,
          source:    data.source,
          count:     samples.length,
          createdAt: data.createdAt,
        })

        for (const vec of samples) {
          clf.addExample(data.name, vec)
        }
      })

      _globalLoaded = true
      setGestures(list)
      setModelReady(list.length > 0)

      console.log('✅ Camera:', cameraClassifier.numClasses, 'classes')
      console.log('✅ Hardware:', hardwareClassifier.numClasses, 'classes')
    } catch (err) {
      console.error('loadGestures error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { loadGestures() }, [loadGestures])

  const saveGesture = useCallback(async (name, samples, source) => {
    if (!user || !name.trim() || !samples || samples.length === 0) return
    setSaving(true)
    setError('')
    try {
      // ── Unique doc ID includes source so camera+hardware don't overwrite ──
      const id  = `${source}_${name.trim().toLowerCase().replace(/\s+/g, '_')}`
      const ref = doc(db, 'users', user.uid, 'gestures', id)

      await setDoc(ref, {
        name:      name.trim(),
        samples:   samplesToFirestore(samples),
        source,
        count:     samples.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Update in-memory classifier immediately
      const clf = getClassifier(source)
      clf.removeClass(name.trim())
      for (const vec of samples) {
        clf.addExample(name.trim(), vec)
      }

      await loadGestures()
    } catch (err) {
      console.error('saveGesture error:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }, [user, loadGestures])

  const deleteGesture = useCallback(async (name, id, source) => {
    if (!user) return
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'gestures', id))
      const clf = getClassifier(source)
      clf.removeClass(name)
      await loadGestures()
    } catch (err) {
      console.error('deleteGesture error:', err)
      setError(err.message)
    }
  }, [user, loadGestures])

  return {
    gestures, loading, saving, error, modelReady,
    loadGestures, saveGesture, deleteGesture,
  }
}