import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../lib/device.js'
import { BigButton, Page, QuietLink } from '../components/ui.jsx'

const TICK_MS = 1000
const WINDOW = 40 // samples shown
const RESTING_TICKS = 10
const RISE_TICKS = 12
const ALERT_BPM = 110
const W = 320
const H = 120
const Y_MIN = 50
const Y_MAX = 140

// Simulated watch feed: resting, then a climb while the wearer stays still.
function simulatedBpm(tick) {
  const noise = (Math.random() - 0.5) * 3
  if (tick < RESTING_TICKS) return 68 + noise
  const p = Math.min(1, (tick - RESTING_TICKS) / RISE_TICKS)
  return 68 + (124 - 68) * (1 - (1 - p) ** 2) + noise
}

export default function Wearable({ onBack, onStart }) {
  const [run, setRun] = useState(0)
  const [series, setSeries] = useState([])
  const [alert, setAlert] = useState(false)
  const alertRef = useRef(null)

  useEffect(() => {
    if (alert) alertRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' })
  }, [alert])

  useEffect(() => {
    let tick = 0
    let high = 0
    setSeries([])
    setAlert(false)
    const id = setInterval(() => {
      const bpm = simulatedBpm(tick++)
      setSeries((s) => [...s.slice(-(WINDOW - 1)), bpm])
      high = bpm >= ALERT_BPM ? high + 1 : 0
      if (high >= 3) {
        setAlert(true)
        clearInterval(id)
      }
    }, TICK_MS)
    return () => clearInterval(id)
  }, [run])

  const current = series.length ? Math.round(series[series.length - 1]) : null
  const x = (i) => (i / (WINDOW - 1)) * W
  const y = (v) => H - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * H
  const points = series.map((v, i) => `${x(i)},${y(v)}`).join(' ')

  return (
    <Page title="Wearable preview" onBack={onBack}>
      <p className="mb-6 inline-block rounded-full border border-ember/60 px-4 py-1.5 text-base text-ember">
        Preview with simulated data
      </p>
      <p className="mb-6 text-lg text-haze">
        How Steady could check in when a watch notices your heart rate rising while you’re resting.
      </p>

      <div className="rounded-3xl bg-deep p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg text-haze">Heart rate</h2>
          <span className="text-base text-haze">Movement: still</span>
        </div>
        <p className="mt-1 text-5xl font-semibold tabular-nums">
          {current ?? '—'}
          <span className="ml-2 text-xl font-normal text-haze">bpm</span>
        </p>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mt-4 w-full overflow-visible"
          role="img"
          aria-label={`Simulated heart rate, currently ${current ?? 'loading'} beats per minute`}
        >
          {[60, 100, 140].map((v) => (
            <g key={v}>
              <line x1="0" x2={W} y1={y(v)} y2={y(v)} stroke="var(--color-tide)" strokeWidth="1" />
              <text x={W} y={y(v) - 4} textAnchor="end" fontSize="11" fill="var(--color-haze)">
                {v}
              </text>
            </g>
          ))}
          {series.length > 1 && (
            <polyline
              points={points}
              fill="none"
              stroke="var(--color-calm)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {series.length > 0 && (
            <circle cx={x(series.length - 1)} cy={y(series[series.length - 1])} r="4" fill="var(--color-calm)" stroke="var(--color-deep)" strokeWidth="2" />
          )}
        </svg>
        <p className="mt-2 text-sm text-haze">Last {WINDOW} seconds</p>
      </div>

      {alert && (
        <div ref={alertRef} role="alert" className="settle mt-6 flex flex-col items-center gap-4 rounded-3xl border border-calm/40 bg-tide/60 p-6 text-center">
          <p className="text-2xl leading-snug font-medium">
            Your heart rate jumped while you were resting. Are you okay?
          </p>
          <BigButton onClick={onStart}>Breathe with me</BigButton>
          <QuietLink onClick={() => setRun((r) => r + 1)}>I’m okay</QuietLink>
        </div>
      )}
    </Page>
  )
}
