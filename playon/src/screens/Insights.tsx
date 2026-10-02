import { useEffect, useMemo, useRef, useState } from 'react'
import { Arrow, Button, cx, go, PageHeader, Rule } from '../components/ui'
import { sortedSessions, useData } from '../lib/store'
import {
  computeInsights,
  fmt1,
  headlineStats,
  lift,
  MIN_SESSIONS,
  strongestPattern,
  type Insight,
} from '../lib/insights'
import { moodLabel, socialColor, socialLabel, SOCIALS, intensityLabel } from '../lib/meta'
import { shortDate } from '../lib/dates'
import { ask, SUGGESTED, type Answer } from '../lib/ask'
import type { ActivitySession, Social } from '../lib/types'

export default function Insights({ focus }: { focus?: string }) {
  const data = useData()
  const sessions = sortedSessions(data)
  const insights = useMemo(() => computeInsights(sessions), [sessions])
  const [selected, setSelected] = useState<string | null>(focus ?? null)
  const mapRef = useRef<HTMLElement>(null)

  if (sessions.length < MIN_SESSIONS) return <NotYet n={sessions.length} />

  const stats = headlineStats(sessions)
  const strongest = strongestPattern(insights)
  const sel = insights.find((i) => i.id === selected) ?? null

  const showEvidence = (id: string) => {
    setSelected(id)
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-10">
      <PageHeader title="Patterns" sub={`What seems to lift your mood and what wears you down, from ${stats.count} reflections.`} />

      {strongest && (
        <section aria-labelledby="h-strong" className="rounded-3xl bg-forest p-6 text-paper sm:p-8">
          <h2 id="h-strong" className="text-sm font-semibold text-sage">
            What seems to help you most
          </h2>
          <p className="rise mt-3 text-2xl font-bold leading-snug sm:text-3xl">{strongest}</p>
          <button
            onClick={() => showEvidence(insights[0].id)}
            className="press mt-5 inline-flex items-center gap-2 text-sm font-medium text-paper/85 underline underline-offset-4 hover:text-paper"
          >
            Show me the sessions <Arrow className="rotate-90" />
          </button>
        </section>
      )}

      <section aria-labelledby="h-patterns">
        <h2 id="h-patterns" className="text-xl font-bold">
          Everything we've noticed
        </h2>
        <p className="mt-1 text-sm text-ink-3">Tap one to see where it comes from.</p>
        <Rule className="mt-4" />
        {insights.length ? (
          <ul>
            {insights.map((ins) => (
              <PatternRow key={ins.id} ins={ins} active={ins.id === selected} onShow={() => showEvidence(ins.id)} />
            ))}
          </ul>
        ) : (
          <p className="py-8 text-lg text-ink-2">Nothing stands out yet. Your sessions feel pretty even.</p>
        )}
      </section>

      <section ref={mapRef} aria-labelledby="h-map" className="scroll-mt-20">
        <MapChart sessions={sessions} insight={sel} onClear={() => setSelected(null)} />
      </section>

      <AskSection sessions={sessions} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* The map: every session as a dot on a court.                        */
/* x = minutes played, y = enjoyment or energy change, colour = who.   */
/* ------------------------------------------------------------------ */

type YMode = 'enjoyment' | 'lift'

function MapChart({ sessions, insight, onClear }: { sessions: ActivitySession[]; insight: Insight | null; onClear: () => void }) {
  const [yMode, setYMode] = useState<YMode>('enjoyment')
  const [hidden, setHidden] = useState<Social[]>([])
  const [hover, setHover] = useState<ActivitySession | null>(null)
  const [table, setTable] = useState(false)

  const narrow = useNarrow()
  const W = narrow ? 400 : 960
  const H = narrow ? 420 : 440
  const P = narrow ? { l: 34, r: 14, t: 24, b: 48 } : { l: 56, r: 24, t: 24, b: 48 }
  const maxMin = Math.max(120, ...sessions.map((s) => s.duration))
  const xs = (m: number) => P.l + ((m - 0) / (maxMin + 10)) * (W - P.l - P.r)
  const yRange = yMode === 'enjoyment' ? [0.5, 5.5] : [-4.5, 4.5]
  const ys = (v: number) => P.t + (1 - (v - yRange[0]) / (yRange[1] - yRange[0])) * (H - P.t - P.b)
  const yVal = (s: ActivitySession) => (yMode === 'enjoyment' ? s.enjoyment : lift(s))

  const present = SOCIALS.filter((so) => sessions.some((s) => s.socialContext === so.id))
  const highlightIds = new Set(insight?.groups.filter((g) => g.highlight).flatMap((g) => g.sessions.map((s) => s.id)) ?? [])

  // gentle deterministic jitter so stacked sessions don't hide each other
  const placed = useMemo(() => {
    const seen = new Map<string, number>()
    return sessions.map((s) => {
      const key = `${Math.round(s.duration / 10)}:${yVal(s)}`
      const k = seen.get(key) ?? 0
      seen.set(key, k + 1)
      const angle = k * 2.4
      const rad = k ? 9 + k * 3 : 0
      return { s, x: xs(s.duration) + Math.cos(angle) * rad, y: ys(yVal(s)) + Math.sin(angle) * rad * 0.8 }
    })
  }, [sessions, yMode, narrow]) // eslint-disable-line react-hooks/exhaustive-deps

  const yTicks = yMode === 'enjoyment' ? [1, 2, 3, 4, 5] : [-4, -2, 0, 2, 4]
  const xTicks = (narrow ? [0, 60, 120, 180] : [0, 30, 60, 90, 120, 180]).filter((t) => t <= maxMin + 10)
  const r = (s: ActivitySession) => (s.intensity === 'hard' ? 10 : s.intensity === 'moderate' ? 8 : 6.5)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 id="h-map" className="text-xl font-bold">
            How each game felt
          </h2>
          <p className="mt-1 max-w-md text-sm text-ink-3">One dot per session. Bigger dots were harder.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-line-2 p-1 text-sm" role="radiogroup" aria-label="Vertical axis">
            {(
              [
                ['enjoyment', 'Enjoyment'],
                ['lift', 'Energy change'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                role="radio"
                aria-checked={yMode === id}
                onClick={() => setYMode(id)}
                className={cx('press rounded-full px-4 py-1.5', yMode === id ? 'bg-forest text-paper' : 'text-ink-2 hover:text-ink')}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setTable((t) => !t)}
            aria-pressed={table}
            className="press rounded-full border border-line-2 px-4 py-2 text-sm text-ink-2 hover:border-ink-3"
          >
            {table ? 'Show map' : 'View as table'}
          </button>
        </div>
      </div>

      {/* legend = filter */}
      <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Who you played with. Toggle to filter.">
        {present.map((so) => {
          const off = hidden.includes(so.id)
          return (
            <button
              key={so.id}
              aria-pressed={!off}
              onClick={() => setHidden((h) => (off ? h.filter((x) => x !== so.id) : [...h, so.id]))}
              className={cx(
                'press flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm',
                off ? 'border-dashed border-line-2 text-ink-3' : 'border-line-2 bg-paper text-ink',
              )}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: off ? 'transparent' : so.color, outline: `1.5px solid ${so.color}` }} aria-hidden />
              {so.label}
            </button>
          )
        })}
        {insight && (
          <span className="fade ml-auto flex items-center gap-2 rounded-full bg-ember-soft px-3 py-1.5 text-sm text-[#7a3410]">
            Highlighting: {insight.groups.filter((g) => g.highlight).map((g) => g.label).join(', ')}
            <button onClick={onClear} className="ml-1 underline underline-offset-2" aria-label="Clear highlight">
              clear
            </button>
          </span>
        )}
      </div>

      {table ? (
        <SessionTable sessions={sessions.filter((s) => !hidden.includes(s.socialContext))} />
      ) : (
        <div className="relative mt-4 overflow-hidden rounded-3xl border border-line bg-paper">
          <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={`Scatter of ${sessions.length} sessions: minutes played against ${yMode === 'enjoyment' ? 'enjoyment' : 'energy change'}. Use View as table for the data.`}>
            {/* court markings as the plot frame */}
            <rect x={P.l} y={P.t} width={W - P.l - P.r} height={H - P.t - P.b} fill="none" stroke="var(--color-line)" strokeWidth="1.5" />
            <line x1={xs(60)} x2={xs(60)} y1={P.t} y2={H - P.b} stroke="var(--color-line)" strokeWidth="1.5" />
            <line x1={xs(90)} x2={xs(90)} y1={P.t} y2={H - P.b} stroke="var(--color-line)" strokeDasharray="3 5" />
            {yTicks.map((t) => (
              <g key={t}>
                <line x1={P.l} x2={W - P.r} y1={ys(t)} y2={ys(t)} stroke={t === 0 && yMode === 'lift' ? 'var(--color-line-2)' : 'var(--color-line)'} strokeWidth={t === 0 && yMode === 'lift' ? 1.5 : 0.7} />
                <text x={P.l - 12} y={ys(t) + 4} fontSize="12" textAnchor="end" fill="var(--color-ink-3)">
                  {yMode === 'lift' && t > 0 ? `+${t}` : t}
                </text>
              </g>
            ))}
            {xTicks.map((t) => (
              <text key={t} x={xs(t)} y={H - P.b + 22} fontSize="12" textAnchor="middle" fill="var(--color-ink-3)">
                {t}
              </text>
            ))}
            <text x={W - P.r} y={H - 8} fontSize="11" textAnchor="end" fill="var(--color-ink-3)" letterSpacing="1.5">
              MINUTES PLAYED →
            </text>
            <text x={P.l + 8} y={P.t + 16} fontSize="11" fill="var(--color-ink-3)" letterSpacing="1.5">
              {yMode === 'enjoyment' ? '↑ MORE ENJOYED' : '↑ MORE ENERGY AFTER'}
            </text>
            <text x={(xs(0) + xs(60)) / 2} y={H - P.b - 10} fontSize="11" textAnchor="middle" fontFamily="inherit" fill="var(--color-ink-3)">
              up to an hour
            </text>
            <text x={(xs(90) + W - P.r) / 2} y={H - P.b - 10} fontSize="11" textAnchor="middle" fontFamily="inherit" fill="var(--color-ink-3)">
              the long ones
            </text>

            {placed.map(({ s, x, y }, i) => {
              const off = hidden.includes(s.socialContext)
              const dim = insight ? !highlightIds.has(s.id) : false
              if (off) return null
              return (
                <g
                  key={s.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`${shortDate(s.date)}, ${s.sport}, ${s.duration} minutes with ${socialLabel(s.socialContext)}, enjoyment ${s.enjoyment} of 5, energy ${s.energyBefore} to ${s.energyAfter}`}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover((h) => (h?.id === s.id ? null : h))}
                  onFocus={() => setHover(s)}
                  onBlur={() => setHover((h) => (h?.id === s.id ? null : h))}
                  onClick={() => setHover(s)}
                  className="cursor-pointer outline-none"
                  style={{
                    transition: 'transform 0.7s var(--ease-out-soft), opacity 0.4s ease',
                    transform: `translate(${x}px, ${y}px)`,
                    opacity: dim ? 0.15 : 1,
                  }}
                >
                  <circle r={22} fill="transparent" />
                  <circle
                    className="fade"
                    style={{ animationDelay: `${i * 45}ms` }}
                    r={r(s)}
                    fill={socialColor(s.socialContext)}
                    stroke={hover?.id === s.id ? 'var(--color-ink)' : 'var(--color-paper)'}
                    strokeWidth={2}
                  />
                </g>
              )
            })}
          </svg>
          {hover && <DotCard s={hover} pos={placed.find((p) => p.s.id === hover.id)!} W={W} H={H} />}
        </div>
      )}
    </div>
  )
}

function DotCard({ s, pos, W, H }: { s: ActivitySession; pos: { x: number; y: number }; W: number; H: number }) {
  const left = (pos.x / W) * 100
  const top = (pos.y / H) * 100
  const below = top < 45
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 w-56 rounded-2xl border border-line bg-paper/95 p-4 text-sm shadow-[0_18px_40px_-18px_rgba(30,58,45,0.35)] backdrop-blur"
      style={{
        left: `clamp(8px, calc(${left}% - 112px), calc(100% - 232px))`,
        top: below ? `calc(${top}% + 20px)` : undefined,
        bottom: below ? undefined : `calc(${100 - top}% + 20px)`,
      }}
    >
      <p className="flex items-center gap-2 text-xs text-ink-3">
        <span className="h-2 w-2 rounded-full" style={{ background: socialColor(s.socialContext) }} aria-hidden />
        {socialLabel(s.socialContext)} · {shortDate(s.date)}
      </p>
      <p className="mt-1 text-lg font-semibold">
        {s.sport} · {s.duration}m
      </p>
      <dl className="mt-2 grid grid-cols-2 gap-1 text-xs text-ink-2">
        <dt>Enjoyment</dt>
        <dd className="text-right text-ink tabular">{s.enjoyment}/5</dd>
        <dt>Energy</dt>
        <dd className="text-right text-ink tabular">
          {s.energyBefore} → {s.energyAfter}
        </dd>
        <dt>Felt</dt>
        <dd className="text-right text-ink">{moodLabel(s.moodAfter)}</dd>
        <dt>Intensity</dt>
        <dd className="text-right text-ink">{intensityLabel(s.intensity)}</dd>
      </dl>
      {s.reflection && <p className="mt-2 border-t border-line pt-2 text-ink-2">“{s.reflection}”</p>}
    </div>
  )
}

function SessionTable({ sessions }: { sessions: ActivitySession[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-3xl border border-line bg-paper">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">All logged sessions</caption>
        <thead className="text-xs uppercase tracking-wider text-ink-3">
          <tr className="border-b border-line">
            {['Date', 'Sport', 'Min', 'With', 'Intensity', 'Enjoy', 'Energy', 'Felt'].map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...sessions].reverse().map((s) => (
            <tr key={s.id} className="border-b border-line last:border-0">
              <td className="px-4 py-3 text-ink-2">{shortDate(s.date)}</td>
              <td className="px-4 py-3">{s.sport}</td>
              <td className="px-4 py-3 tabular">{s.duration}</td>
              <td className="px-4 py-3">{socialLabel(s.socialContext)}</td>
              <td className="px-4 py-3">{intensityLabel(s.intensity)}</td>
              <td className="px-4 py-3 tabular">{s.enjoyment}/5</td>
              <td className="px-4 py-3 tabular">
                {s.energyBefore}→{s.energyAfter}
              </td>
              <td className="px-4 py-3">{moodLabel(s.moodAfter)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- pattern rows with their evidence ---------- */

function PatternRow({ ins, active, onShow }: { ins: Insight; active: boolean; onShow: () => void }) {
  const [open, setOpen] = useState(active)
  const metricMax = ins.metric === 'lift' ? 4 : 5
  return (
    <li className={cx('border-b border-line transition-colors', active && 'bg-paper/70')}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="press flex w-full items-start justify-between gap-6 py-5 text-left"
      >
        <span className="text-lg font-semibold leading-snug">{ins.headline}</span>
        <span className={cx('mt-2 shrink-0 text-ink-3 transition-transform duration-300', open && 'rotate-45')} aria-hidden>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M9 2v14M2 9h14" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="rise grid gap-8 pb-8 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-sm font-semibold">Where this comes from</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">{ins.basis}</p>
            <Button variant="ghost" className="mt-4" onClick={onShow}>
              Show on the chart
            </Button>
          </div>
          <div className="space-y-3" role="list" aria-label={`${ins.metric === 'lift' ? 'Average energy change' : 'Average enjoyment'} by group`}>
            {ins.groups.map((g) => {
              const v = ins.metric === 'lift' ? g.lift : g.enjoyment
              const pct = ins.metric === 'lift' ? (Math.abs(v) / metricMax) * 50 : (v / metricMax) * 100
              return (
                <div key={g.key} role="listitem" className="grid grid-cols-[110px_1fr_64px] items-center gap-3 text-sm">
                  <span className={cx(g.highlight ? 'font-medium text-ink' : 'text-ink-2')}>{g.label}</span>
                  <span className="relative h-3">
                    {ins.metric === 'lift' && <span className="absolute left-1/2 top-[-4px] h-5 w-px bg-line-2" aria-hidden />}
                    <span
                      className={cx('fade absolute top-0 h-3 rounded-[4px]', g.highlight ? 'bg-forest' : 'bg-sage')}
                      style={{
                        width: `${Math.max(1.5, pct)}%`,
                        left: ins.metric === 'lift' ? (v >= 0 ? '50%' : `${50 - pct}%`) : 0,
                      }}
                    />
                  </span>
                  <span className="text-right tabular text-ink">
                    {ins.metric === 'lift' ? `${v >= 0 ? '+' : '−'}${fmt1(Math.abs(v))}` : fmt1(v)}
                    <span className="ml-1 text-xs text-ink-3">n={g.sessions.length}</span>
                  </span>
                </div>
              )
            })}
            <p className="pt-1 text-xs text-ink-3">
              {ins.metric === 'lift' ? 'Average change in energy, before → after (points on a 1–5 scale).' : 'Average enjoyment out of 5.'} n = number of sessions.
            </p>
          </div>
        </div>
      )}
    </li>
  )
}

/* ---------- Ask PLAY ON ---------- */

function AskSection({ sessions }: { sessions: ActivitySession[] }) {
  const [q, setQ] = useState('')
  const [answer, setAnswer] = useState<(Answer & { q: string }) | null>(null)
  const run = (text: string) => {
    if (!text.trim()) return
    setAnswer({ ...ask(text, sessions), q: text })
    setQ('')
  }
  return (
    <section aria-labelledby="h-ask" className="rounded-3xl bg-sky-soft/70 p-5 sm:p-6">
      <h2 id="h-ask" className="text-xl font-bold">
        Ask PLAY ON
      </h2>
      <p className="mt-1 text-sm text-ink-2">Ask about how playing affects you. Answers come only from your own reflections.</p>
      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          run(q)
        }}
      >
        <label htmlFor="ask" className="sr-only">
          Your question
        </label>
        <input
          id="ask"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="When do I feel best after playing?"
          className="h-12 min-w-0 flex-1 rounded-full border border-line-2 bg-paper px-5 text-sm outline-none focus:border-forest"
        />
        <Button type="submit" disabled={!q.trim()} className="h-12">
          Ask
        </Button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTED.map((s) => (
          <button key={s} onClick={() => run(s)} className="press rounded-full border border-line-2 bg-paper/60 px-3 py-1.5 text-xs text-ink-2 hover:border-ink-3 hover:text-ink">
            {s}
          </button>
        ))}
      </div>
      {answer && (
        <div key={answer.q} className="rise mt-8 border-t border-line-2 pt-6" aria-live="polite">
          <p className="font-semibold text-ink-2">“{answer.q}”</p>
          <div className="mt-4 space-y-3 text-[15px] leading-relaxed">
            {answer.lines.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </div>
          <p className="mt-5 text-xs text-ink-3">
            Based on {answer.basedOn} reflection{answer.basedOn === 1 ? '' : 's'}. This is an observation, not medical or coaching advice.
          </p>
        </div>
      )}
    </section>
  )
}

/* ---------- not enough data yet ---------- */

function NotYet({ n }: { n: number }) {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
        {n === 0 ? 'Your map starts with one session.' : `${MIN_SESSIONS - n} more session${MIN_SESSIONS - n === 1 ? '' : 's'} to go.`}
      </h1>
      <p className="mt-3 max-w-xl text-ink-2">
        Insights show when you enjoy playing most, what lifts your energy and who you like playing with. We won't invent
        patterns, so they appear once you've logged {MIN_SESSIONS} sessions.
      </p>
      <div className="mt-8 flex items-center gap-2" aria-label={`${n} of ${MIN_SESSIONS} sessions logged`}>
        {Array.from({ length: MIN_SESSIONS }).map((_, i) => (
          <span key={i} className={cx('grid h-11 w-11 place-items-center rounded-full border font-semibold', i < n ? 'border-forest bg-forest text-paper' : 'border-dashed border-line-2 text-ink-3')}>
            {i + 1}
          </span>
        ))}
      </div>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={() => go('play')}>
          Log a session <Arrow />
        </Button>
      </div>
    </div>
  )
}

function useNarrow() {
  const q = '(max-width: 640px)'
  const [n, setN] = useState(() => window.matchMedia?.(q).matches ?? false)
  useEffect(() => {
    const m = window.matchMedia?.(q)
    if (!m) return
    const on = () => setN(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return n
}
