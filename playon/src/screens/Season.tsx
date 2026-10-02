import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, cx, PageHeader, Stars } from '../components/ui'
import { actions, useData } from '../lib/store'
import { seasonSummary, MILESTONES, milestoneLabel, type WeekSlot } from '../lib/season'
import { moodLabel, socialLabel } from '../lib/meta'
import { shortDate } from '../lib/dates'
import type { ActivitySession } from '../lib/types'

export default function Season() {
  const data = useData()
  const summary = seasonSummary(data)
  if (!summary) return null
  const { season, weeks } = summary
  const ended = new Date(season.endDate).getTime() < Date.now()

  return (
    <div className="space-y-8">
      <PageHeader
        title={ended ? 'Season complete' : `Week ${summary.weekNumber} of 12`}
        sub={`Your ${season.name}. Every game you reflect on plants a tree. Quiet weeks are part of the landscape too, and nothing here can be broken.`}
      />


      <Landscape weeks={weeks} />

      <section aria-labelledby="h-weeks" className="space-y-4">
        <div>
          <h2 id="h-weeks" className="text-xl font-bold">
            Week by week
          </h2>
          <p className="mt-1 text-sm text-ink-2">
            Played in {summary.playedWeeks} of {Math.min(summary.weekNumber, 12)} weeks. Context, not a score.
          </p>
          {ended && (
            <Button className="mt-6" onClick={() => actions.startNewSeason()}>
              Start a new season
            </Button>
          )}
        </div>
        <Timeline weeks={weeks} goal={season.weeklyGoal} />
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Landscape: weeks are stretches of ground, sessions are trees,       */
/* milestones are flags, quiet weeks are meadows.                      */
/* ------------------------------------------------------------------ */

const W = 1200
const H = 360
const BASE = 300
const COL = W / 12

function Landscape({ weeks }: { weeks: WeekSlot[] }) {
  const scroller = useRef<HTMLDivElement>(null)
  const [focus, setFocus] = useState<{ s: ActivitySession; x: number; y: number; n: number } | null>(null)

  // ground height per week: gentle hills that rise with activity
  const heights = weeks.map((w) => (w.isFuture ? 0 : Math.min(70, w.sessions.length * 20)))
  const pts = heights.map((h, i) => [i * COL + COL / 2, BASE - h] as const)
  const ground = useMemo(() => {
    const all = [[0, BASE - heights[0]] as const, ...pts, [W, BASE - heights[11]] as const]
    let d = `M${all[0][0]},${all[0][1]}`
    for (let i = 1; i < all.length; i++) {
      const [x0, y0] = all[i - 1]
      const [x1, y1] = all[i]
      const mx = (x0 + x1) / 2
      d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`
    }
    return d
  }, [heights.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  const groundY = (x: number) => {
    // linear interpolation between week centres is close enough for placement
    const i = Math.max(0, Math.min(10, Math.floor((x - COL / 2) / COL)))
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    const t = Math.max(0, Math.min(1, (x - x0) / (x1 - x0)))
    const e = t * t * (3 - 2 * t)
    return y0 + (y1 - y0) * e
  }

  const currentIdx = weeks.findIndex((w) => w.isCurrent)
  const lastPast = currentIdx >= 0 ? currentIdx : weeks.filter((w) => !w.isFuture).length - 1
  const pastEdge = (lastPast + 1) * COL

  let count = 0
  const trees: { s: ActivitySession; x: number; y: number; n: number }[] = []
  weeks.forEach((w) => {
    const k = w.sessions.length
    w.sessions.forEach((s, j) => {
      count++
      const x = w.index * COL + (COL * (j + 1)) / (k + 1) + (j % 2 ? 4 : -4)
      trees.push({ s, x, y: groundY(x), n: count })
    })
  })

  useEffect(() => {
    const el = scroller.current
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = Math.max(0, (pastEdge / W) * el.scrollWidth - el.clientWidth * 0.7)
  }, [pastEdge])

  return (
    <section aria-labelledby="h-land" className="relative -mx-5 sm:mx-0">
      <h2 id="h-land" className="sr-only">
        Season landscape
      </h2>
      <div ref={scroller} className="no-scrollbar overflow-x-auto px-5 sm:px-0">
        <div className="relative min-w-[880px] overflow-hidden rounded-3xl border border-line bg-paper">
          <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={`Season landscape with ${count} sessions across ${lastPast + 1} weeks`}>
            <defs>
              <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f3efe4" />
                <stop offset="1" stopColor="#fbf8f1" />
              </linearGradient>
              <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-line-2)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={W} height={H} fill="url(#sky)" />
            {/* distant ridge */}
            <path d={`M0,230 C200,190 320,215 480,200 S820,170 960,195 S1140,205 1200,190 V${H} H0Z`} fill="#ece6d6" />
            {/* sun = season progress */}
            <circle cx={Math.max(60, pastEdge - 40)} cy={70} r={22} fill="var(--color-ember-soft)" />
            <circle cx={Math.max(60, pastEdge - 40)} cy={70} r={10} fill="var(--color-ember)" opacity="0.85" />

            {/* ground */}
            <clipPath id="past">
              <rect x="0" y="0" width={pastEdge} height={H} />
            </clipPath>
            <clipPath id="future">
              <rect x={pastEdge} y="0" width={W - pastEdge} height={H} />
            </clipPath>
            <path d={`${ground} V${H} H0Z`} fill="var(--color-sage-soft)" clipPath="url(#past)" />
            <path className="draw" d={ground} fill="none" stroke="var(--color-forest)" strokeWidth="1.5" clipPath="url(#past)" />
            <path d={`${ground} V${H} H0Z`} fill="url(#hatch)" opacity="0.5" clipPath="url(#future)" />
            <path d={ground} fill="none" stroke="var(--color-line-2)" strokeWidth="1.2" strokeDasharray="4 6" clipPath="url(#future)" />

            {/* week dividers + labels */}
            {weeks.map((w) => (
              <g key={w.index}>
                <text x={w.index * COL + COL / 2} y={H - 18} textAnchor="middle" fontSize="11" fill={w.isCurrent ? 'var(--color-ink)' : 'var(--color-ink-3)'} fontWeight={w.isCurrent ? 600 : 400} letterSpacing="1.5">
                  {w.isCurrent ? 'NOW' : `WK ${w.index + 1}`}
                </text>
                {!w.isFuture && w.sessions.length === 0 && <Meadow x={w.index * COL + COL / 2} y={groundY(w.index * COL + COL / 2)} />}
              </g>
            ))}

            {/* current week marker */}
            {currentIdx >= 0 && (
              <line x1={pastEdge} x2={pastEdge} y1={110} y2={H - 36} stroke="var(--color-ink-3)" strokeWidth="1" strokeDasharray="2 4" />
            )}

            {/* trees */}
            {trees.map((t, k) => (
              <Tree
                key={t.s.id}
                t={t}
                delay={k * 70}
                active={focus?.s.id === t.s.id}
                onFocus={() => setFocus(t)}
                onBlur={() => setFocus((f) => (f?.s.id === t.s.id ? null : f))}
              />
            ))}

            {/* milestone flags */}
            {trees
              .filter((t) => MILESTONES.includes(t.n) && t.n > 1)
              .map((t) => (
                <g key={`m${t.n}`} className="fade" style={{ animationDelay: `${t.n * 70 + 400}ms` }}>
                  <line x1={t.x + 14} x2={t.x + 14} y1={t.y} y2={t.y - 92} stroke="var(--color-ink)" strokeWidth="1" />
                  <path d={`M${t.x + 14},${t.y - 92} l18,6 l-18,6z`} fill="var(--color-ember)" />
                  <text x={t.x + 12} y={t.y - 98} fontSize="11" fill="var(--color-ink-2)" fontFamily="inherit">
                    {milestoneLabel(t.n)}
                  </text>
                </g>
              ))}

            {count === 0 && (
              <text x={W / 2} y={150} textAnchor="middle" fontFamily="inherit" fontSize="26" fill="var(--color-ink-3)">
                Your first session plants the first tree.
              </text>
            )}
          </svg>

          {focus && <TreeCard f={focus} />}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 px-5 text-xs text-ink-3 sm:px-0">
        <span className="flex items-center gap-2">
          <svg width="12" height="16" aria-hidden>
            <line x1="6" x2="6" y1="16" y2="6" stroke="var(--color-forest)" />
            <ellipse cx="6" cy="6" rx="5" ry="6" fill="var(--color-forest)" />
          </svg>
          A game. Taller means more enjoyed
        </span>
        <span className="flex items-center gap-2">
          <svg width="12" height="12" aria-hidden>
            <path d="M2,0 l10,3 l-10,3z" fill="var(--color-ember)" />
          </svg>
          Milestone
        </span>
        <span className="flex items-center gap-2">
          <svg width="16" height="10" aria-hidden>
            <path d="M2 10 l2 -6 M7 10 l1 -8 M12 10 l-1 -6" stroke="var(--color-sage)" strokeWidth="1.2" />
          </svg>
          Rest week
        </span>
        <span>Tap a tree for details</span>
      </div>
    </section>
  )
}

function Tree({
  t,
  delay,
  active,
  onFocus,
  onBlur,
}: {
  t: { s: ActivitySession; x: number; y: number }
  delay: number
  active: boolean
  onFocus: () => void
  onBlur: () => void
}) {
  const { s, x, y } = t
  const h = 26 + s.enjoyment * 11
  const r = 9 + s.enjoyment * 1.6
  const fill = s.enjoyment >= 5 ? 'var(--color-forest)' : s.enjoyment >= 4 ? 'var(--color-forest-2)' : s.enjoyment >= 3 ? 'var(--color-sage)' : '#c9cfbf'
  return (
    <g
      tabIndex={0}
      role="button"
      aria-label={`${shortDate(s.date)}: ${s.sport}, ${s.duration} minutes, enjoyment ${s.enjoyment} of 5`}
      onMouseEnter={onFocus}
      onMouseLeave={onBlur}
      onFocus={onFocus}
      onBlur={onBlur}
      onClick={onFocus}
      className="grow cursor-pointer outline-none"
      style={{ animationDelay: `${delay}ms` }}
    >
      <rect x={x - 16} y={y - h - r} width={32} height={h + r + 4} fill="transparent" />
      <line x1={x} x2={x} y1={y + 2} y2={y - h + r} stroke="var(--color-forest)" strokeWidth="1.4" />
      <ellipse
        cx={x}
        cy={y - h}
        rx={r * 0.78}
        ry={r}
        fill={fill}
        stroke={active ? 'var(--color-ember)' : 'var(--color-paper)'}
        strokeWidth={active ? 2.5 : 2}
      />
      {s.reflection && <circle cx={x + r * 0.55} cy={y - h - r * 0.6} r={2.5} fill="var(--color-ember)" />}
    </g>
  )
}

function Meadow({ x, y }: { x: number; y: number }) {
  return (
    <g aria-hidden className="fade">
      {[-26, -14, -4, 8, 20, 30].map((dx, i) => (
        <path key={i} d={`M${x + dx},${y + 2} q${i % 2 ? 2 : -2},-6 ${i % 2 ? 1 : -1},-${10 + (i % 3) * 3}`} stroke="var(--color-sage)" strokeWidth="1.2" fill="none" />
      ))}
      <text x={x} y={y + 22} textAnchor="middle" fontSize="10.5" fontFamily="inherit" fill="var(--color-ink-3)">
        rest
      </text>
    </g>
  )
}

function TreeCard({ f }: { f: { s: ActivitySession; x: number; y: number; n: number } }) {
  const { s } = f
  const left = (f.x / W) * 100
  return (
    <div
      className="fade pointer-events-none absolute top-4 w-60 rounded-2xl border border-line bg-paper/95 p-4 text-sm shadow-[0_18px_40px_-18px_rgba(30,58,45,0.35)] backdrop-blur"
      style={{ left: `clamp(12px, calc(${left}% - 120px), calc(100% - 252px))` }}
      role="status"
    >
      <p className="text-xs text-ink-3">
        Session {f.n} · {shortDate(s.date)}
      </p>
      <p className="mt-1 text-lg font-semibold">{s.sport}</p>
      <p className="text-ink-2">
        {s.duration} min · {socialLabel(s.socialContext)}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <Stars value={s.enjoyment} size={14} />
        <span className="text-xs text-ink-2">{moodLabel(s.moodAfter)}</span>
      </div>
      {s.reflection && <p className="mt-2 border-t border-line pt-2 text-ink-2">“{s.reflection}”</p>}
    </div>
  )
}

/* ---------- editorial timeline ---------- */

function Timeline({ weeks, goal }: { weeks: WeekSlot[]; goal: number }) {
  const shown = weeks.filter((w) => !w.isFuture).reverse()
  let cumulative = weeks.filter((w) => !w.isFuture).reduce((a, w) => a + w.sessions.length, 0)
  return (
    <ol className="border-t border-line">
      {shown.map((w) => {
        const endCount = cumulative
        cumulative -= w.sessions.length
        const startCount = cumulative
        const ms = MILESTONES.filter((m) => m > startCount && m <= endCount)
        return (
          <li key={w.index} className="grid grid-cols-[84px_1fr] gap-4 border-b border-line py-4 sm:grid-cols-[110px_1fr_auto]">
            <div>
              <p className="font-semibold">{w.isCurrent ? 'This week' : `Week ${w.index + 1}`}</p>
              <p className="text-xs text-ink-3">{w.start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
            </div>
            <div className="min-w-0">
              {w.sessions.length ? (
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {w.sessions.map((s) => (
                    <li key={s.id} className="text-ink-2">
                      <span className="text-ink">{s.sport}</span> · {s.duration}m ·{' '}
                      <span className="tabular">{s.enjoyment}★</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-3">
                  {w.isCurrent ? 'Nothing yet, and there’s plenty of week left.' : 'A rest week. Recovery is part of the season.'}
                </p>
              )}
              {ms.map((m) => (
                <p key={m} className="mt-2 inline-flex items-center gap-2 text-xs text-ink-2">
                  <span className="h-2 w-2 rotate-45 bg-ember" aria-hidden /> {milestoneLabel(m)}
                </p>
              ))}
            </div>
            <div className="col-span-2 flex gap-1 sm:col-span-1 sm:pt-1" aria-label={`${w.sessions.length} of ${goal} intended sessions`}>
              {Array.from({ length: Math.max(goal, w.sessions.length) }).map((_, i) => (
                <span
                  key={i}
                  className={cx(
                    'h-2 w-6 rounded-full',
                    i < w.sessions.length ? 'bg-forest' : 'border border-dashed border-line-2',
                  )}
                />
              ))}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
