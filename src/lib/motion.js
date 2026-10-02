// Background hand-tremor reader built on DeviceMotion.
//
// We keep a rolling buffer of linear-acceleration magnitudes (gravity removed)
// and report the RMS over a 5 second window. Screen taps jolt the phone, so
// samples around each tap are masked out before computing the RMS.
//
// Everything here fails silently: if motion is unsupported, denied, or never
// fires (most laptops), readings simply come back as null.

const BUFFER_MS = 15000
const TAP_MASK_BEFORE_MS = 120
const TAP_MASK_AFTER_MS = 400
const MIN_WINDOW_MS = 2000

// m/s² RMS thresholds for a phone held in the hand.
const STEADY_MAX = 0.18
const SLIGHT_MAX = 0.45

let samples = [] // { t, m }
let taps = []
let listening = false
let permission = 'unknown' // 'unknown' | 'granted' | 'denied' | 'unsupported'
let lastGravity = null

const now = () => performance.now()

function onMotion(e) {
  let x, y, z
  const a = e.acceleration
  if (a && a.x != null && a.y != null && a.z != null) {
    x = a.x
    y = a.y
    z = a.z
  } else {
    // Fallback for devices that only expose acceleration including gravity:
    // a simple low-pass estimate of gravity, subtracted out.
    const g = e.accelerationIncludingGravity
    if (!g || g.x == null) return
    if (!lastGravity) lastGravity = { x: g.x, y: g.y, z: g.z }
    const k = 0.9
    lastGravity = {
      x: k * lastGravity.x + (1 - k) * g.x,
      y: k * lastGravity.y + (1 - k) * g.y,
      z: k * lastGravity.z + (1 - k) * g.z,
    }
    x = g.x - lastGravity.x
    y = g.y - lastGravity.y
    z = g.z - lastGravity.z
  }
  const t = now()
  samples.push({ t, m: Math.sqrt(x * x + y * y + z * z) })
  if (samples.length > 0 && t - samples[0].t > BUFFER_MS) {
    const cutoff = t - BUFFER_MS
    let i = 0
    while (i < samples.length && samples[i].t < cutoff) i++
    samples = samples.slice(i)
    taps = taps.filter((tt) => tt > cutoff - TAP_MASK_AFTER_MS)
  }
}

function listen() {
  if (listening || typeof window === 'undefined') return
  window.addEventListener('devicemotion', onMotion)
  listening = true
}

/**
 * Call synchronously inside a user tap handler. On iOS this shows the
 * motion permission prompt; elsewhere it just starts listening.
 * Never throws and never blocks the caller.
 */
export function startMotion() {
  try {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
      permission = 'unsupported'
      return
    }
    const DME = window.DeviceMotionEvent
    if (typeof DME.requestPermission === 'function') {
      if (permission === 'granted') return listen()
      if (permission === 'denied') return
      DME.requestPermission()
        .then((state) => {
          permission = state === 'granted' ? 'granted' : 'denied'
          if (permission === 'granted') listen()
        })
        .catch(() => {
          permission = 'denied'
        })
    } else {
      permission = 'granted'
      listen()
    }
  } catch {
    permission = 'unsupported'
  }
}

export function stopMotion() {
  if (!listening) return
  window.removeEventListener('devicemotion', onMotion)
  listening = false
  samples = []
  taps = []
  lastGravity = null
}

/** Mark a screen tap so the jolt it causes is ignored. */
export function markTap() {
  taps.push(now())
}

/** Note a point in time; pass it to readTremor to only use later samples. */
export function motionMark() {
  return now()
}

/**
 * RMS of linear acceleration over the last 5 seconds (or since `since`),
 * excluding samples near taps. Returns null if there isn't enough data.
 */
export function readTremor(since = 0) {
  const end = now()
  const start = Math.max(end - 5000, since)
  const usable = samples.filter(
    (s) =>
      s.t >= start &&
      !taps.some((tt) => s.t >= tt - TAP_MASK_BEFORE_MS && s.t <= tt + TAP_MASK_AFTER_MS),
  )
  if (usable.length < 10) return null
  const span = usable[usable.length - 1].t - usable[0].t
  if (span < MIN_WINDOW_MS) return null
  const rms = Math.sqrt(usable.reduce((sum, s) => sum + s.m * s.m, 0) / usable.length)
  return { rms: Math.round(rms * 1000) / 1000, level: tremorLevel(rms) }
}

export function tremorLevel(rms) {
  if (rms < STEADY_MAX) return 'steady'
  if (rms < SLIGHT_MAX) return 'slight'
  return 'shaky'
}

export const TREMOR_LABEL = {
  steady: 'steady',
  slight: 'slightly shaky',
  shaky: 'shaky',
}
