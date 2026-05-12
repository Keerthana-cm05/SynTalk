// ── KNN Classifier ────────────────────────────────────────────────────
class KNNGestureClassifier {
  constructor(name) {
    this.name      = name
    this.classes   = {}
    this.k         = 5
    this.threshold = 0.70
  }

  addExample(label, features) {
    const vec = Array.from(features)
    if (vec.length === 0) return
    if (!this.classes[label]) this.classes[label] = []
    this.classes[label].push(vec)
  }

  removeClass(label) {
    delete this.classes[label]
  }

  get numClasses() {
    return Object.keys(this.classes).length
  }

  getClassCounts() {
    const out = {}
    for (const [l, ex] of Object.entries(this.classes)) out[l] = ex.length
    return out
  }

  _cosineSim(a, b) {
    if (!a || !b || a.length !== b.length) return 0
    let dot = 0, normA = 0, normB = 0
    for (let i = 0; i < a.length; i++) {
      dot   += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    if (normA === 0 || normB === 0) return 0
    return dot / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  predict(features) {
    const vec    = Array.from(features)
    const labels = Object.keys(this.classes)
    if (labels.length === 0) return null

    const distances = []
    for (const label of labels) {
      for (const ex of this.classes[label]) {
        if (ex.length !== vec.length) continue  // skip incompatible vectors
        const sim = this._cosineSim(vec, ex)
        distances.push({ label, sim })
      }
    }

    if (distances.length === 0) return null
    distances.sort((a, b) => b.sim - a.sim)

    const topK  = distances.slice(0, Math.min(this.k, distances.length))
    const votes = {}
    for (const { label, sim } of topK) {
      votes[label] = (votes[label] || 0) + sim
    }

    let bestLabel = null, bestScore = -Infinity
    for (const [label, score] of Object.entries(votes)) {
      if (score > bestScore) { bestScore = score; bestLabel = label }
    }

    if (topK[0].sim < this.threshold) return null
    return { label: bestLabel, confidence: Math.round(topK[0].sim * 100) }
  }

  clear() { this.classes = {} }
}

// ── TWO separate classifiers — never mix camera and hardware features ──
export const cameraClassifier   = new KNNGestureClassifier('camera')
export const hardwareClassifier = new KNNGestureClassifier('hardware')

// Keep this export for backward compat — points to camera classifier
export const gestureClassifier  = cameraClassifier

// ── Feature extractors ────────────────────────────────────────────────

// Camera: MediaPipe 21 landmarks → 63 floats
export function landmarksToFeatures(landmarks) {
  if (!landmarks || landmarks.length < 21) return null
  const wrist = landmarks[0]
  const out   = []
  for (const lm of landmarks) {
    out.push(lm.x - wrist.x)
    out.push(lm.y - wrist.y)
    out.push(lm.z - wrist.z)
  }
  return out  // length = 63
}

// Hardware: 4 flex values normalized → 4 floats only
// fingers array = [thumb(0.0), index, middle, ring, pinky]
// We use fingers[1..4] — the actual 4 sensors
// Hardware: fingerData = [thumb(0), index, middle, ring, pinky] normalized 0-1
// Use index 1..4 for features
export function sensorToFeatures(fingerData) {
  if (!fingerData || fingerData.length < 5) return null
  return [
    fingerData[1],  // index
    fingerData[2],  // middle
    fingerData[3],  // ring
    fingerData[4],  // pinky
  ]
}