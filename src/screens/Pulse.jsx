import { useEffect, useRef, useState } from 'react'
import { markTap } from '../lib/motion.js'
import { QuietLink } from '../components/ui.jsx'

const DURATION_MS = 15000
const MIN_GAP_MS = 250 // 240 bpm ceiling

/** Optional: tap along with the heartbeat for 15 seconds. */
export default function Pulse({ onDone }) {
  const [times, setTimes] = useState([])
  const [left, setLeft] = useState(DURATION_MS)
  const [pulse, setPulse] = useState(0)
  const startRef = useRef(null)
  const timesRef = useRef([])
  const finished = useRef(false)

  useEffect(() => {
    if (!times.length) return
    const id = setInterval(() => {
      const remaining = DURATION_MS - (performance.now() - startRef.current)
      if (remaining > 0) return setLeft(remaining)
      clearInterval(id)
      setLeft(0)
      finish()
    }, 200)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [times.length > 0])

  function finish() {
    if (finished.current) return
    finished.current = true
    const t = timesRef.current
    let bpm = null
    if (t.length >= 6) {
      bpm = Math.round(((t.length - 1) / (t[t.length - 1] - t[0])) * 60000)
      if (bpm < 35 || bpm > 220) bpm = null
    }
    setTimeout(() => onDone(bpm), 600)
  }

  function tap(e) {
    e.preventDefault()
    if (finished.current) return
    markTap()
    const t = performance.now()
    const prev = timesRef.current
    if (prev.length && t - prev[prev.length - 1] < MIN_GAP_MS) return
    if (!prev.length) startRef.current = t
    timesRef.current = [...prev, t]
    setTimes(timesRef.current)
    setPulse(t)
  }

  const started = times.length > 0
  const progress = 1 - left / DURATION_MS

  return (
    <div className="flex h-full w-full flex-col items-center justify-between py-4 text-center short:py-1">
      <div>
        <h1 className="text-4xl leading-tight font-semibold short:text-3xl">Tap in time with your heartbeat.</h1>
        <p className="mt-3 text-lg text-haze">
          {started ? `${Math.ceil(left / 1000)} seconds` : 'Feel it at your wrist or neck.'}
        </p>
      </div>

      <button
        type="button"
        onPointerDown={tap}
        aria-label="Heartbeat tap"
        className="relative my-6 aspect-square w-[min(68vw,40vh)] short:my-3 short:w-[min(60vw,30vh)] select-none rounded-full bg-tide/70"
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="var(--color-calm)"
            strokeWidth="1.5"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={1 - progress}
            opacity={started ? 0.9 : 0}
          />
        </svg>
        {pulse > 0 && <span key={pulse} className="ripple absolute inset-0 rounded-full bg-ember/40" />}
        <span className="relative text-2xl">{left === 0 ? 'Thank you' : 'Tap'}</span>
      </button>

      <QuietLink onClick={() => !finished.current && ((finished.current = true), onDone(null))}>
        Skip
      </QuietLink>
    </div>
  )
}
