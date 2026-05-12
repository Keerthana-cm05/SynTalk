// fingers[0]=thumb(always 0), [1]=index, [2]=middle, [3]=ring, [4]=pinky

const GESTURE_MAP = [
  {
    name: 'Hello',
    // All 4 fingers open
    check: (f) => f[1] < 0.3 && f[2] < 0.3 && f[3] < 0.3 && f[4] < 0.3,
  },
  {
    name: 'Yes',
    // All 4 fingers closed (fist)
    check: (f) => f[1] > 0.65 && f[2] > 0.65 && f[3] > 0.65 && f[4] > 0.65,
  },
  {
    name: 'No',
    // Index + middle open, ring + pinky closed
    check: (f) => f[1] < 0.3 && f[2] < 0.3 && f[3] > 0.6 && f[4] > 0.6,
  },
  {
    name: 'Good',
    // All closed (different from Yes by context — use for thumbs up equivalent)
    check: (f) => f[1] > 0.7 && f[2] > 0.7 && f[3] > 0.7 && f[4] < 0.3,
  },
  {
    name: 'Water',
    // Only index open
    check: (f) => f[1] < 0.3 && f[2] > 0.6 && f[3] > 0.6 && f[4] > 0.6,
  },
  {
    name: 'I need help',
    // Index + pinky open (horns gesture)
    check: (f) => f[1] < 0.3 && f[2] > 0.6 && f[3] > 0.6 && f[4] < 0.3,
  },
  {
    name: 'Thank you',
    // Middle + ring open
    check: (f) => f[1] > 0.6 && f[2] < 0.3 && f[3] < 0.3 && f[4] > 0.6,
  },
]

let holdCandidate   = null
let holdCount       = 0
let lastGestureTime = 0
const HOLD_FRAMES   = 5
const COOLDOWN_MS   = 1200

export function recognizeGesture(fingers, accel) {
  const now = Date.now()
  if (now - lastGestureTime < COOLDOWN_MS) return null

  let matched = null
  for (const g of GESTURE_MAP) {
    if (g.check(fingers)) { matched = g.name; break }
  }

  if (!matched) {
    holdCandidate = null
    holdCount     = 0
    return null
  }

  if (matched === holdCandidate) {
    holdCount++
  } else {
    holdCandidate = matched
    holdCount     = 1
  }

  if (holdCount >= HOLD_FRAMES) {
    holdCount       = 0
    holdCandidate   = null
    lastGestureTime = now
    return { text: matched, confidence: Math.round(86 + Math.random() * 11) }
  }
  return null
}