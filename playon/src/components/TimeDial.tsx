import { useId, useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { cx } from './ui'
import { timeOfDay, timeLabel, TIMES, type TimeOfDay } from '../lib/derive'

const STEP = 15 // minutes
const DAY = 24 * 60

export const fmtTime = (m: number) => {
  const h = Math.floor(m / 60) % 24
  const mm = String(m % 60).padStart(2, '0')
  return `${h % 12 || 12}:${mm} ${h < 12 ? 'am' : 'pm'}`
}

const bandOf = (m: number): TimeOfDay => {
  const d = new Date()
  d.setHours(Math.floor(m / 60), m % 60, 0, 0)
  return timeOfDay({ date: d.toISOString() })
}

/** Quick picks for the common case: one tap, then fine-tune on the dial if needed. */
const PRESETS: { id: TimeOfDay; minutes: number }[] = [
  { id: 'morning', minutes: 8 * 60 },
  { id: 'afternoon', minutes: 14 * 60 },
  { id: 'evening', minutes: 18 * 60 + 30 },
  { id: 'night', minutes: 21 * 60 + 30 },
]

// The bands drawn round the dial match how the Game Map groups time of day.
const BANDS: { id: TimeOfDay; from: number; to: number; color: string }[] = [
  { id: 'night', from: 21, to: 29, color: 'var(--color-lavender)' },
  { id: 'morning', from: 5, to: 12, color: 'var(--color-sky)' },
  { id: 'afternoon', from: 12, to: 17, color: 'var(--color-sage)' },
  { id: 'evening', from: 17, to: 21, color: 'var(--color-ember-soft)' },
]

const C = 120 // centre
const R = 92 // ring radius

const point = (minutes: number, r: number) => {
  const a = (minutes / DAY) * Math.PI * 2 - Math.PI / 2 // midnight at the top
  return [C + Math.cos(a) * r, C + Math.sin(a) * r] as const
}

function arc(fromH: number, toH: number, r: number) {
  const [x0, y0] = point(fromH * 60, r)
  const [x1, y1] = point(toH * 60, r)
  const large = toH - fromH > 12 ? 1 : 0
  return `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1}`
}

/**
 * A 24-hour dial for the time a game started. Drag (or tap) round the ring, use the
 * arrow keys in 15-minute steps, or tap a part of the day.
 */
export default function TimeDial({ value, onChange, label = 'Time you started' }: { value: number; onChange: (m: number) => void; label?: string }) {
  const svg = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const labelId = useId()
  const band = bandOf(value)
  const [hx, hy] = point(value, R)

  const fromPointer = (e: PointerEvent) => {
    const box = svg.current!.getBoundingClientRect()
    const x = ((e.clientX - box.left) / box.width) * 240 - C
    const y = ((e.clientY - box.top) / box.height) * 240 - C
    let a = Math.atan2(y, x) + Math.PI / 2
    if (a < 0) a += Math.PI * 2
    const m = Math.round(((a / (Math.PI * 2)) * DAY) / STEP) * STEP
    onChange(m % DAY)
  }

  const onKey = (e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowRight: STEP, ArrowUp: STEP, ArrowLeft: -STEP, ArrowDown: -STEP, PageUp: 60, PageDown: -60 }
    if (e.key in map) {
      e.preventDefault()
      onChange((value + map[e.key] + DAY) % DAY)
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      onChange(e.key === 'Home' ? 0 : DAY - STEP)
    }
  }

  return (
    <fieldset>
      <legend id={labelId} className="eyebrow mb-3">
        {label}
      </legend>
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-8">
        <svg
          ref={svg}
          viewBox="0 0 240 240"
          className="h-56 w-56 shrink-0 cursor-pointer touch-none select-none rounded-full"
          role="slider"
          tabIndex={0}
          aria-labelledby={labelId}
          aria-valuemin={0}
          aria-valuemax={DAY - STEP}
          aria-valuenow={value}
          aria-valuetext={`${fmtTime(value)}, ${timeLabel(band).toLowerCase()}`}
          onKeyDown={onKey}
          onPointerDown={(e) => {
            dragging.current = true
            ;(e.target as Element).setPointerCapture?.(e.pointerId)
            fromPointer(e)
          }}
          onPointerMove={(e) => dragging.current && fromPointer(e)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
        >
          <circle cx={C} cy={C} r={R + 18} fill="var(--color-paper)" stroke="var(--color-line)" />
          {BANDS.map((b) => (
            <path
              key={b.id}
              d={arc(b.from, b.to, R)}
              fill="none"
              stroke={b.color}
              strokeWidth={b.id === band ? 16 : 10}
              opacity={b.id === band ? 1 : 0.55}
              style={{ transition: 'stroke-width 0.3s ease, opacity 0.3s ease' }}
            />
          ))}
          {Array.from({ length: 24 }).map((_, h) => {
            const [x0, y0] = point(h * 60, R - 14)
            const [x1, y1] = point(h * 60, R - (h % 6 ? 18 : 22))
            return <line key={h} x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--color-ink-3)" strokeWidth={h % 6 ? 0.8 : 1.4} />
          })}
          {[
            [0, '12am'],
            [6, '6am'],
            [12, '12pm'],
            [18, '6pm'],
          ].map(([h, t]) => {
            const [x, y] = point((h as number) * 60, R - 44)
            return (
              <text key={t} x={x} y={y + 4} textAnchor="middle" fontSize="10.5" fill="var(--color-ink-3)" letterSpacing="0.5">
                {t}
              </text>
            )
          })}
          <line x1={C} y1={C} x2={hx} y2={hy} stroke="var(--color-forest)" strokeWidth="1.5" />
          <circle cx={C} cy={C} r={3.5} fill="var(--color-forest)" />
          <circle cx={hx} cy={hy} r={13} fill="var(--color-forest)" stroke="var(--color-paper)" strokeWidth="3" />
          <circle cx={hx} cy={hy} r={4} fill="var(--color-ember)" />
        </svg>

        <div>
          <p className="text-4xl tabular" aria-hidden>
            {fmtTime(value)}
          </p>
          <p className="mt-1 text-sm text-ink-2">{timeLabel(band)}. Drag the dial or tap a time of day.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={band === p.id}
                onClick={() => onChange(p.minutes)}
                className={cx(
                  'press rounded-full border px-4 py-2 text-sm',
                  band === p.id ? 'border-forest bg-forest text-paper' : 'border-line-2 bg-paper/60 hover:border-ink-3',
                )}
              >
                {TIMES.find((t) => t.id === p.id)!.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </fieldset>
  )
}
