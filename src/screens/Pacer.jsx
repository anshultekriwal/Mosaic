import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion, vibrate } from '../lib/device.js'

const TARGET_IN = 4
const TARGET_OUT = 6
const RAMP_S = 120
const MIN_CYCLE_S = 2 // never pace faster than 30 breaths a minute
const easeInOut = (p) => 0.5 - Math.cos(Math.PI * p) / 2

/**
 * Breathing pacer. Starts at `startBpm` and slows over ~2 minutes to
 * 4s in / 6s out, then holds there for `holdCycles` breaths and calls onDone.
 * With `startBpm` null (or slower than target) it starts at the target pace.
 */
export default function Pacer({ startBpm, holdCycles = 3, onDone }) {
  const [phase, setPhase] = useState({ name: 'ready', dur: 1.5 })
  const reduced = useRef(prefersReducedMotion()).current
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    const cycle0 = startBpm ? Math.max(MIN_CYCLE_S, 60 / startBpm) : TARGET_IN + TARGET_OUT
    const ramp = cycle0 < TARGET_IN + TARGET_OUT
    const in0 = cycle0 * 0.45
    const out0 = cycle0 * 0.55
    let start = null
    let held = 0
    let timer

    function durations() {
      if (!ramp) return [TARGET_IN, TARGET_OUT, true]
      const t = (performance.now() - start) / 1000
      const p = Math.min(1, t / RAMP_S)
      const e = easeInOut(p)
      return [in0 + (TARGET_IN - in0) * e, out0 + (TARGET_OUT - out0) * e, p >= 1]
    }

    function breathe() {
      if (start === null) start = performance.now()
      const [inS, outS, atTarget] = durations()
      if (atTarget) {
        if (held >= holdCycles) return onDoneRef.current()
        held++
      }
      setPhase({ name: 'in', dur: inS })
      vibrate(70)
      timer = setTimeout(() => {
        setPhase({ name: 'out', dur: outS })
        vibrate([30, 90, 30])
        timer = setTimeout(breathe, outS * 1000)
      }, inS * 1000)
    }

    timer = setTimeout(breathe, 1500)
    return () => clearTimeout(timer)
  }, [startBpm, holdCycles])

  const expanded = phase.name === 'in'
  const label = { ready: 'Follow the circle', in: 'Breathe in', out: 'Breathe out' }[phase.name]

  const circleStyle = reduced
    ? {
        transform: 'scale(0.8)',
        opacity: expanded ? 1 : 0.55,
        transition: `opacity ${phase.dur}s ease-in-out`,
      }
    : {
        transform: `scale(${expanded ? 1 : 0.5})`,
        transition: `transform ${phase.dur}s cubic-bezier(0.45, 0, 0.55, 1)`,
      }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8">
      <div className="relative aspect-square w-[min(80vw,48vh)]">
        <div className="absolute inset-0 rounded-full border border-calm/20" />
        <div className="absolute inset-[-6%] rounded-full bg-calm/10 blur-2xl" style={circleStyle} />
        <div
          className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_40%,var(--color-calm)_0%,var(--color-calm-deep)_75%)]"
          style={circleStyle}
        />
      </div>
      <p className="text-5xl font-semibold" aria-live="polite">
        {label}
      </p>
    </div>
  )
}
