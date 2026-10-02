import { useState, type ReactNode } from 'react'
import { Arrow, Button, cx, DemoBadge, go, LinkArrow, Rule, Scale, Stars } from '../components/ui'
import { actions, sortedSessions, uid, useData } from '../lib/store'
import { daysBetween, greeting, relativeDay } from '../lib/dates'
import { ENERGY_WORDS, MOODS, moodLabel, resultLabel, socialLabel, sessionTypeLabel } from '../lib/meta'
import { computeInsights, daysSinceLastSession, earlyWarning, MIN_SESSIONS, orderInsights } from '../lib/insights'
import { seasonSummary } from '../lib/season'
import { suggestionFor } from './Reset'
import { LiveGameCard } from '../components/LiveGame'
import type { ActivitySession, BodyAfter, Mood } from '../lib/types'

export default function Home() {
  const data = useData()
  const user = data.user!
  const sessions = sortedSessions(data)
  const last = sessions[sessions.length - 1]
  const summary = seasonSummary(data)
  const insights = orderInsights(computeInsights(sessions), user.playerType)
  const warning = earlyWarning(insights, sessions)
  // Don't repeat the warning's pattern in "Something we've noticed".
  const noticed = insights.find((i) => i.id !== warning?.insight.id)
  const since = daysSinceLastSession(data)
  const todayCheckIn = [...data.checkins].reverse().find((c) => daysBetween(new Date(c.date), new Date()) === 0)

  return (
    <div className="space-y-14 lg:space-y-20">
      {data.active && <LiveGameCard game={data.active} />}

      {since != null && since >= 7 && (
        <section className="rise rounded-3xl bg-lavender-soft px-6 py-7 sm:px-10" aria-label="Welcome back">
          <p className="text-3xl">Welcome back.</p>
          <p className="mt-2 max-w-lg text-ink-2">
            Sometimes the best part of the long game is coming back. Your season is still here. Pick up wherever feels
            right.
          </p>
        </section>
      )}

      {/* greeting + check-in */}
      <section className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-end">
        <div>
          <div className="flex items-center gap-3">
            <p className="eyebrow">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {user.isDemo && (
              <span className="hidden lg:block">
                <DemoBadge />
              </span>
            )}
          </div>
          <h1 className="mt-4 text-5xl leading-[1.02]">
            {greeting()}, {user.name}.
            <span className="block text-ink-2">How are you feeling today?</span>
          </h1>
        </div>
        <CheckInPanel existing={todayCheckIn?.mood} existingEnergy={todayCheckIn?.energy} />
      </section>

      {/* Log CTA: hidden while a game is live, since the card above covers it */}
      {!data.active && (
      <section className="relative overflow-hidden rounded-[2rem] bg-forest px-7 py-8 text-paper sm:px-10 sm:py-10">
        <svg className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 opacity-20" viewBox="0 0 200 200" aria-hidden>
          <circle cx="100" cy="100" r="90" fill="none" stroke="var(--color-sage)" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="var(--color-sage)" />
          <path d="M10 120c50-25 130-25 180 0" fill="none" stroke="var(--color-ember)" strokeWidth="2" />
        </svg>
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow text-sage">About to play, or just played?</p>
            <p className="mt-3 text-3xl sm:text-4xl">Remember how it felt.</p>
            <p className="mt-2 max-w-md text-sm text-paper/70">
              Start a game now and we'll ask how you feel going in, then how it went when you finish. Or log one you've already
              played. About thirty seconds, mostly taps.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <Button variant="light" size="lg" onClick={() => go('play', 'start')}>
              Start a game <Arrow />
            </Button>
            <Button size="lg" className="border border-paper/30 bg-transparent hover:bg-paper/5" onClick={() => go('play')}>
              Log a past game
            </Button>
          </div>
        </div>
      </section>
      )}

      {warning && (
        <section aria-labelledby="h-warn" className="rise rounded-[2rem] border border-ember/25 bg-ember-soft/50 px-6 py-8 sm:px-10">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:gap-12">
            <div>
              <h2 id="h-warn" className="eyebrow flex items-center gap-2 text-[#8a3a12]">
                <span className="h-1.5 w-1.5 rounded-full bg-ember" aria-hidden />
                Worth noticing
              </h2>
              <p className="mt-4 text-3xl leading-snug sm:text-4xl">{warning.title}</p>
              <p className="mt-3 text-sm text-ink-2">{warning.insight.basis}</p>
              {warning.bounce && <p className="mt-2 text-sm font-medium text-forest">{warning.bounce}</p>}
            </div>
            <div className="rounded-2xl bg-paper/80 p-5">
              <p className="eyebrow text-sm">One thing to try</p>
              <p className="mt-2 text-xl leading-snug">{warning.suggestion}</p>
              <LinkArrow className="mt-4" onClick={() => go('insights', warning.insight.id, 'period=all')}>
                See the games behind this
              </LinkArrow>
            </div>
          </div>
        </section>
      )}

      <LastGame last={last} />

      <div className="grid gap-14 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-16">
        {/* season */}
        {summary && (
          <section aria-labelledby="h-season">
            <div className="flex items-baseline justify-between">
              <h2 id="h-season" className="eyebrow">
                Your season
              </h2>
              <span className="text-xs text-ink-3">
                {summary.season.name} · Week {summary.weekNumber} of 12
              </span>
            </div>
            <Rule className="mt-3" />
            <div className="mt-6 flex items-end gap-6">
              <p className="text-7xl leading-none tabular">
                {summary.thisWeek}
                <span className="text-3xl text-ink-3"> / {summary.season.weeklyGoal}</span>
              </p>
              <p className="pb-2 text-sm text-ink-2">
                sessions
                <br />
                this week
              </p>
            </div>
            <WeekTiles done={summary.thisWeek} goal={summary.season.weeklyGoal} />
            <p className="mt-4 text-sm text-ink-2">
              {summary.thisWeek >= summary.season.weeklyGoal
                ? 'Intention met. Anything else this week is a bonus.'
                : summary.thisWeek === 0
                  ? 'A fresh week. No rush, whenever you get on court.'
                  : `${summary.season.weeklyGoal - summary.thisWeek} more would meet your intention. Or not. It's your season.`}
            </p>
            <LinkArrow className="mt-5" onClick={() => go('season')}>
              View season
            </LinkArrow>
          </section>
        )}

        {/* noticed */}
        <section aria-labelledby="h-noticed" className="lg:col-span-1">
          <h2 id="h-noticed" className="eyebrow">
            Something we've noticed
          </h2>
          <Rule className="mt-3" />
          {noticed ? (
            <>
              <p className="mt-6 text-3xl leading-snug">{noticed.headline}</p>
              <p className="mt-3 text-sm text-ink-2">{noticed.basis}</p>
              <LinkArrow className="mt-5" onClick={() => go('insights', noticed.id, 'period=all')}>
                Explore your patterns
              </LinkArrow>
            </>
          ) : (
            <>
              {sessions.length < MIN_SESSIONS ? (
                <>
                  <p className="mt-6 text-3xl leading-snug">
                    {sessions.length} of {MIN_SESSIONS} games logged.
                  </p>
                  <p className="mt-3 text-sm text-ink-2">
                    Your first patterns unlock at {MIN_SESSIONS}. We only point out what is really in your log, so until then we stay quiet.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-6 text-3xl leading-snug text-ink-2">Nothing stands out yet. Your games look pretty even.</p>
                  <p className="mt-3 text-sm text-ink-2">We only point out patterns that are really in your log.</p>
                </>
              )}
              {sessions.length < MIN_SESSIONS && <ProgressDots n={sessions.length} of={MIN_SESSIONS} />}
            </>
          )}
        </section>

        {/* reset */}
        <section aria-labelledby="h-reset">
          <h2 id="h-reset" className="eyebrow">
            Need a reset?
          </h2>
          <Rule className="mt-3" />
          <ResetTeaser mood={todayCheckIn?.mood ?? last?.moodAfter} body={todayCheckIn ? undefined : last?.bodyAfter} />
        </section>
      </div>
    </div>
  )
}

/** The most recent game, given room: centred, with its key numbers as tiles. */
function LastGame({ last }: { last?: ActivitySession }) {
  if (!last)
    return (
      <section aria-labelledby="h-last" className="rounded-[2rem] border border-line bg-paper px-6 py-10 text-center sm:px-10">
        <h2 id="h-last" className="eyebrow">
          Last time you played
        </h2>
        <p className="mt-4 text-3xl text-ink-2">Nothing logged yet.</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">Log your first game and PLAY ON starts remembering how it felt.</p>
      </section>
    )
  const lift = last.energyAfter - last.energyBefore
  const tiles: { label: string; value: ReactNode }[] = [
    { label: 'Played', value: <span className="tabular">{last.duration} min</span> },
    {
      label: 'Enjoyment',
      value: (
        <span className="inline-flex flex-col items-center gap-1">
          <Stars value={last.enjoyment} size={18} />
          <span className="tabular">{last.enjoyment}/5</span>
        </span>
      ),
    },
    {
      label: 'Energy',
      value: (
        <span className="tabular">
          {last.energyBefore} → {last.energyAfter}
          <span className="text-ink-3"> ({lift > 0 ? '+' : lift < 0 ? '−' : '±'}{Math.abs(lift)})</span>
        </span>
      ),
    },
    { label: 'Left feeling', value: <span>{moodLabel(last.moodAfter)}</span> },
  ]
  return (
    <section aria-labelledby="h-last" className="rounded-[2rem] border border-line bg-paper px-5 py-10 text-center sm:px-10 lg:py-12">
      <h2 id="h-last" className="eyebrow">
        Last time you played · {relativeDay(last.date)}
      </h2>
      <button
        onClick={() => go('game', last.id)}
        className="press group mt-4 inline-flex items-center gap-3 rounded-2xl px-3 py-1 hover:bg-cream"
        aria-label={`${last.sport}: see everything about this game`}
      >
        <span className="text-4xl underline decoration-line-2 decoration-2 underline-offset-[10px] group-hover:decoration-forest">{last.sport}</span>
        <span className="grid h-10 w-10 place-items-center rounded-full border border-line-2 text-forest transition-colors group-hover:border-forest group-hover:bg-forest group-hover:text-paper">
          <Arrow />
        </span>
      </button>
      <p className="mt-2 text-ink-2">
        {sessionTypeLabel(last.sessionType)} · {socialLabel(last.socialContext)}
        {last.result && <> · {resultLabel(last.result)}</>}
      </p>
      <dl className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-cream/70 px-3 py-5">
            <dt className="text-xs text-ink-3">{t.label}</dt>
            <dd className="text-xl">{t.value}</dd>
          </div>
        ))}
      </dl>
      {last.reflection && (
        <blockquote className="mx-auto mt-8 max-w-xl text-lg text-ink-2">
          <span className="text-ember" aria-hidden>
            “
          </span>
          {last.reflection}
          <span className="text-ember" aria-hidden>
            ”
          </span>
        </blockquote>
      )}
      <LinkArrow className="mt-8" onClick={() => go('game', last.id)}>
        See everything about this game
      </LinkArrow>
    </section>
  )
}

function ResetTeaser({ mood, body }: { mood?: Mood; body?: BodyAfter }) {
  const s = suggestionFor(mood, body)
  return (
    <div className="mt-6">
      <p className="text-3xl">{s.title}</p>
      <p className="mt-2 text-sm text-ink-2">
        {s.length} · {s.blurb}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="ghost" onClick={() => go('reset', s.id)}>
          Start now
        </Button>
        <Button variant="quiet" onClick={() => go('reset')}>
          Open Reset Room
        </Button>
      </div>
    </div>
  )
}

function WeekTiles({ done, goal }: { done: number; goal: number }) {
  const n = Math.max(goal, done)
  return (
    <div className="mt-6 flex gap-2" aria-hidden>
      {Array.from({ length: n }).map((_, i) => (
        <span
          key={i}
          className={cx(
            'grow h-10 flex-1 rounded-md border',
            i < done ? (i < goal ? 'border-forest bg-forest' : 'border-sage bg-sage') : 'border-dashed border-line-2',
          )}
          style={{ animationDelay: `${i * 90}ms` }}
        />
      ))}
    </div>
  )
}

function ProgressDots({ n, of }: { n: number; of: number }) {
  return (
    <div className="mt-5 flex items-center gap-2" role="img" aria-label={`${n} of ${of} games logged`}>
      {Array.from({ length: of }).map((_, i) => (
        <span key={i} className={cx('h-2.5 w-2.5 rounded-full', i < n ? 'bg-forest' : 'bg-line-2')} />
      ))}
    </div>
  )
}

function CheckInPanel({ existing, existingEnergy }: { existing?: Mood; existingEnergy?: number }) {
  const [mood, setMood] = useState<Mood | null>(null)
  const [energy, setEnergy] = useState(3)
  const [stress, setStress] = useState(2)
  const [note, setNote] = useState('')
  const [editing, setEditing] = useState(false)

  if (existing && !editing) {
    const s = suggestionFor(existing)
    return (
      <div className="rise rounded-3xl border border-line bg-paper p-6" aria-live="polite">
        <p className="eyebrow">Today's check-in</p>
        <p className="mt-3 text-2xl">
          {MOODS.find((m) => m.id === existing)?.glyph} {moodLabel(existing)}
          {existingEnergy && <span className="text-ink-3"> · energy {ENERGY_WORDS[existingEnergy - 1].toLowerCase()}</span>}
        </p>
        <p className="mt-3 text-sm text-ink-2">
          Thanks for noticing. {s.nudge}{' '}
          <button className="font-medium text-forest underline underline-offset-4" onClick={() => go('reset', s.id)}>
            {s.title}
          </button>
        </p>
        <button className="mt-4 text-xs text-ink-3 underline underline-offset-4" onClick={() => setEditing(true)}>
          Check in again
        </button>
      </div>
    )
  }

  const save = () => {
    if (!mood) return
    actions.addCheckIn({ id: uid(), userId: '', date: new Date().toISOString(), mood, energy, stress, note: note.trim() })
    setEditing(false)
    setMood(null)
    setNote('')
  }

  return (
    <div className="rounded-3xl border border-line bg-paper p-5 sm:p-6">
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="How are you feeling?">
        {MOODS.map((m) => (
          <button
            key={m.id}
            role="radio"
            aria-checked={mood === m.id}
            onClick={() => setMood(m.id)}
            className={cx(
              'press flex flex-col items-center gap-1 rounded-2xl border py-3 text-sm',
              mood === m.id ? 'scale-[1.03] border-forest bg-sage-soft' : 'border-transparent hover:bg-cream',
            )}
          >
            <span className={cx('text-2xl transition-transform duration-300', mood === m.id && 'scale-125')} aria-hidden>
              {m.glyph}
            </span>
            {m.label}
          </button>
        ))}
      </div>
      {mood && (
        <div className="rise mt-5 space-y-5 border-t border-line pt-5">
          <Scale label="Energy" value={energy} onChange={setEnergy} words={ENERGY_WORDS} />
          <fieldset>
            <legend className="eyebrow mb-2">Stress</legend>
            <div className="flex gap-2" role="radiogroup" aria-label="Stress">
              {['Light', 'Some', 'A lot'].map((l, i) => (
                <button
                  key={l}
                  role="radio"
                  aria-checked={stress === i + 1}
                  onClick={() => setStress(i + 1)}
                  className={cx(
                    'press flex-1 rounded-full border py-2 text-sm',
                    stress === i + 1 ? 'border-forest bg-forest text-paper' : 'border-line-2 hover:border-ink-3',
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="ci-note" className="eyebrow">
              Anything on your mind? <span className="normal-case tracking-normal text-ink-3">(optional)</span>
            </label>
            <input
              id="ci-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-line-2 bg-transparent px-3 text-sm outline-none focus:border-forest"
            />
          </div>
          <Button className="w-full" onClick={save}>
            Check in
          </Button>
        </div>
      )}
    </div>
  )
}
