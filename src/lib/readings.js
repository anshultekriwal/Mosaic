import { TREMOR_LABEL } from './motion.js'

// Breaths per minute from tap timestamps (ms). 4 taps → 3 intervals.
export function rateFromTaps(times) {
  if (times.length < 2) return null
  const span = times[times.length - 1] - times[0]
  if (span <= 0) return null
  const perMin = ((times.length - 1) / span) * 60000
  return Math.round(Math.min(60, Math.max(3, perMin)))
}

export function breathLevel(bpm) {
  if (bpm == null) return null
  if (bpm > 20) return 'fast'
  if (bpm > 16) return 'quick'
  return 'steady'
}

/** One plain sentence built from the first readings. */
export function reflection(reading) {
  const breath = breathLevel(reading?.bpm)
  const tremor = reading?.tremor?.level ?? null
  const fast = breath === 'fast' || breath === 'quick'
  const shaking = tremor === 'shaky' || tremor === 'slight'

  const breathPart = breath === 'fast' ? 'Your breathing is fast' : 'Your breathing is a little quick'
  const handPart = tremor === 'shaky' ? 'your hands are shaking' : 'your hands are a little shaky'

  if (fast && shaking) {
    return `${breathPart} and ${handPart}. These are signs of a panic response. They pass.`
  }
  if (fast) {
    return `${breathPart}. That is a sign of a panic response. It passes.`
  }
  if (shaking) {
    const h = handPart.charAt(0).toUpperCase() + handPart.slice(1)
    return `${h}. That can be a sign of a panic response. It passes.`
  }
  if (breath === 'steady') {
    return 'Your breathing is steady. Let’s slow it down a little more, together.'
  }
  return 'Let’s breathe together for a while. This feeling passes.'
}

export function tremorText(t) {
  return t ? TREMOR_LABEL[t.level] : null
}
