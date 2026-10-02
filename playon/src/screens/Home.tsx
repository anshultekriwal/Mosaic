import { useState } from 'react'
import { Arrow, Button, cx, DemoBadge, go, LinkArrow, Rule, Scale, Stars } from '../components/ui'
import { actions, sortedSessions, uid, useData } from '../lib/store'
import { daysBetween, greeting, relativeDay } from '../lib/dates'
import { ENERGY_WORDS, MOODS, moodLabel, socialLabel, sessionTypeLabel } from '../lib/meta'
import { computeInsights, daysSinceLastSession, MIN_SESSIONS } from '../lib/insights'
import { seasonSummary } from '../lib/season'
import { suggestionFor } from './Reset'
import type { Mood } from '../lib/types'

export default function Home() {
  const data = useData()
  const user = data.user!
  const sessions = sortedSessions(data)
  const last = sessions[sessions.length - 1]
  const summary = seasonSummary(data)
  const insights = computeInsights(sessions)
  const since = daysSinceLastSession(data)
  const todayCheckIn = [...data.checkins].reverse().find((c) => daysBetween(new Date(c.date), new Date()) === 0)

  return (
    <div className="space-y-14 lg:space-y-20">
      {since != null && since >= 7 && (
        <section className="rise rounded-3xl bg-lavender-soft px-6 py-7 sm:px-10" aria-label="Welcome back">
          <p className="font-serif text-3xl font-light">Welcome back.</p>
          <p className="mt-2 max-w-lg text-ink-2">
            Sometimes the best part of the long game is coming back. Your season is still here — pick up wherever feels
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
          <h1 className="mt-4 font-serif text-[clamp(2.6rem,6vw,4.5rem)] font-light leading-[1.02]">
            {greeting()}, {user.name}.
            <span className="block italic text-ink-2">How are you feeling today?</span>
          </h1>
        </div>
        <CheckInPanel existing={todayCheckIn?.mood} existingEnergy={todayCheckIn?.energy} />
      </section>

      {/* Log CTA */}
      <section className="relative overflow-hidden rounded-[2rem] bg-forest px-7 py-8 text-paper sm:px-10 sm:py-10">
        <svg className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 opacity-20" viewBox="0 0 200 200" aria-hidden>
          <circle cx="100" cy="100" r="90" fill="none" stroke="var(--color-sage)" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="var(--color-sage)" />
          <path d="M10 120c50-25 130-25 180 0" fill="none" stroke="var(--color-ember)" strokeWidth="2" />
        </svg>
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow text-sage">Just played?</p>
            <p className="mt-3 font-serif text-3xl font-light sm:text-4xl">Tell us how it felt.</p>
            <p className="mt-2 text-sm text-paper/70">About thirty seconds. No scores, no judgement.</p>
          </div>
          <Button variant="light" size="lg" onClick={() => go('play')}>
            Log a session <Arrow />
          </Button>
        </div>
      </section>

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
              <p className="font-serif text-7xl font-light leading-none tabular">
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
                  ? 'A fresh week. No rush — whenever you get on court.'
                  : `${summary.season.weeklyGoal - summary.thisWeek} more would meet your intention. Or not — it's your season.`}
            </p>
            <LinkArrow className="mt-5" onClick={() => go('season')}>
              View season
            </LinkArrow>
          </section>
        )}

        {/* last session */}
        <section aria-labelledby="h-last">
          <h2 id="h-last" className="eyebrow">
            Last time you played
          </h2>
          <Rule className="mt-3" />
          {last ? (
            <div className="mt-6">
              <p className="font-serif text-4xl font-light">{last.sport}</p>
              <p className="mt-2 text-ink-2">
                {last.duration} min · {sessionTypeLabel(last.sessionType)} · {socialLabel(last.socialContext)} ·{' '}
                {relativeDay(last.date)}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-ink-3">Enjoyment</span>
                  <Stars value={last.enjoyment} />
                </span>
                <span>
                  <span className="text-ink-3">Left feeling </span>
                  {moodLabel(last.moodAfter).toLowerCase()}
                </span>
              </div>
              {last.reflection && (
                <blockquote className="mt-5 border-l-2 border-ember pl-4 font-serif text-lg italic text-ink-2">
                  “{last.reflection}”
                </blockquote>
              )}
            </div>
          ) : (
            <div className="mt-6">
              <p className="font-serif text-3xl font-light text-ink-2">Nothing logged yet.</p>
              <p className="mt-2 text-sm text-ink-2">Your first session plants the first tree in your season.</p>
            </div>
          )}
        </section>

        {/* noticed */}
        <section aria-labelledby="h-noticed" className="lg:col-span-1">
          <h2 id="h-noticed" className="eyebrow">
            Something we've noticed
          </h2>
          <Rule className="mt-3" />
          {insights[0] ? (
            <>
              <p className="mt-6 font-serif text-3xl font-light leading-snug">{insights[0].headline}</p>
              <p className="mt-3 text-sm text-ink-2">{insights[0].basis}</p>
              <LinkArrow className="mt-5" onClick={() => go('insights')}>
                Explore your patterns
              </LinkArrow>
            </>
          ) : (
            <>
              <p className="mt-6 font-serif text-3xl font-light leading-snug text-ink-2">
                {sessions.length === 0
                  ? 'Patterns appear after a few sessions.'
                  : sessions.length < MIN_SESSIONS
                    ? `${MIN_SESSIONS - sessions.length} more session${MIN_SESSIONS - sessions.length === 1 ? '' : 's'} until your Game Map opens.`
                    : 'Nothing stands out yet — your sessions look pretty even.'}
              </p>
              <p className="mt-3 text-sm text-ink-2">
                We only point out patterns that are actually in your data. Until then, we'll stay quiet.
              </p>
              <ProgressDots n={Math.min(sessions.length, MIN_SESSIONS)} of={MIN_SESSIONS} />
            </>
          )}
        </section>

        {/* reset */}
        <section aria-labelledby="h-reset">
          <h2 id="h-reset" className="eyebrow">
            Need a reset?
          </h2>
          <Rule className="mt-3" />
          <ResetTeaser mood={todayCheckIn?.mood ?? last?.moodAfter} />
        </section>
      </div>
    </div>
  )
}

function ResetTeaser({ mood }: { mood?: Mood }) {
  const s = suggestionFor(mood)
  return (
    <div className="mt-6">
      <p className="font-serif text-3xl font-light">{s.title}</p>
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
    <div className="mt-5 flex items-center gap-2" aria-label={`${n} of ${of} sessions logged`}>
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
        <p className="mt-3 font-serif text-2xl">
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
