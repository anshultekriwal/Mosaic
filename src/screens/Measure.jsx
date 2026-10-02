import { useEffect, useRef, useState } from 'react'
import { markTap, motionMark, readTremor } from '../lib/motion.js'
import { rateFromTaps } from '../lib/readings.js'
import { QuietLink } from '../components/ui.jsx'

const TAPS = 4
const MIN_GAP_MS = 500 // ignore accidental double taps

/**
 * "Tap each time you breathe in." Four taps give a breathing rate; the
 * motion reader runs in the background for the hand-tremor reading.
 */
export default function Measure({ title = 'Tap each time you breathe in.', onDone }) {
  const [times, setTimes] = useState([])
  const [ripples, setRipples] = useState([])
  const since = useRef(motionMark())
  const done = useRef(false)

  useEffect(() => {
    if (times.length < TAPS || done.current) return
    done.current = true
    const id = setTimeout(() => {
      onDone({ bpm: rateFromTaps(times), tremor: readTremor(since.current) })
    }, 700)
    return () => clearTimeout(id)
  }, [times, onDone])

  function tap(e) {
    e.preventDefault()
    if (times.length >= TAPS) return
    markTap()
    const t = performance.now()
    if (times.length && t - times[times.length - 1] < MIN_GAP_MS) return
    setTimes((prev) => [...prev, t])
    setRipples((prev) => [...prev.slice(-2), t])
  }

  function skip() {
    if (done.current) return
    done.current = true
    onDone({ bpm: times.length >= 3 ? rateFromTaps(times) : null, tremor: readTremor(since.current) })
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-between py-4 short:py-1">
      <h1 className="max-w-sm text-center text-4xl leading-tight font-semibold short:text-3xl">{title}</h1>

      <button
        type="button"
        onPointerDown={tap}
        aria-label={`Breath tap ${Math.min(times.length + 1, TAPS)} of ${TAPS}`}
        className="relative my-6 aspect-square w-[min(72vw,42vh)] short:my-3 short:w-[min(64vw,32vh)] select-none rounded-full bg-tide/70 outline-none"
      >
        <span className="glow absolute inset-0 rounded-full border-2 border-calm/50" />
        {ripples.map((r) => (
          <span key={r} className="ripple absolute inset-0 rounded-full bg-calm/40" />
        ))}
        <span className="relative text-2xl text-mist/90">{times.length >= TAPS ? 'Thank you' : 'Tap'}</span>
      </button>

      <div className="flex flex-col items-center gap-3 short:gap-1">
        <div className="flex gap-4" aria-hidden="true">
          {Array.from({ length: TAPS }, (_, i) => (
            <span
              key={i}
              className={`h-4 w-4 rounded-full transition-colors duration-500 ${
                i < times.length ? 'bg-calm' : 'bg-tide'
              }`}
            />
          ))}
        </div>
        <QuietLink onClick={skip}>Skip</QuietLink>
      </div>
    </div>
  )
}
