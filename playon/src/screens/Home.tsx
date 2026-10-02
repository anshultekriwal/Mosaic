import { Arrow, Button, Card, cx, go, LinkArrow, Stars } from '../components/ui'
import { actions, sortedSessions, uid, useData } from '../lib/store'
import { daysBetween, greeting, relativeDay } from '../lib/dates'
import { MOODS, moodLabel, socialLabel } from '../lib/meta'
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
  const insight = computeInsights(sessions)[0]
  const since = daysSinceLastSession(data)
  const today = [...data.checkins].reverse().find((c) => daysBetween(new Date(c.date), new Date()) === 0)
  const toGo = MIN_SESSIONS - sessions.length

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-ink-3">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          {greeting()}, {user.name}
        </h1>
        {since != null && since >= 7 && (
          <p className="mt-2 text-ink-2">Welcome back. Your season is right where you left it.</p>
        )}
      </header>

      <CheckIn mood={today?.mood} />

      {/* the one main action */}
      <button
        onClick={() => go('play')}
        className="press group flex w-full items-center justify-between gap-4 rounded-3xl bg-forest px-6 py-5 text-left text-paper hover:bg-forest-2"
      >
        <span>
          <span className="block text-xl font-semibold">Just played?</span>
          <span className="mt-0.5 block text-sm text-paper/75">Log it in about thirty seconds.</span>
        </span>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paper text-forest transition-transform group-hover:translate-x-1">
          <Arrow />
        </span>
      </button>

      <div className="grid gap-6 md:grid-cols-2">
        {summary && (
          <Card>
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold">This week</h2>
              <span className="text-xs text-ink-3">Week {summary.weekNumber} of 12</span>
            </div>
            <p className="mt-4 text-5xl font-bold leading-none tabular">
              {summary.thisWeek}
              <span className="text-2xl font-semibold text-ink-3"> / {summary.season.weeklyGoal}</span>
            </p>
            <WeekTiles done={summary.thisWeek} goal={summary.season.weeklyGoal} />
            <p className="mt-3 text-sm text-ink-2">
              {summary.thisWeek >= summary.season.weeklyGoal
                ? 'Intention met. Anything more is a bonus.'
                : summary.thisWeek === 0
                  ? 'A fresh week. No rush.'
                  : `${summary.season.weeklyGoal - summary.thisWeek} more would meet your intention.`}
            </p>
            <LinkArrow className="mt-4" onClick={() => go('season')}>
              See your season
            </LinkArrow>
          </Card>
        )}

        <Card>
          <h2 className="font-semibold">Something we've noticed</h2>
          {insight ? (
            <>
              <p className="mt-4 text-xl font-semibold leading-snug">{insight.headline}</p>
              <LinkArrow className="mt-4" onClick={() => go('insights')}>
                See your insights
              </LinkArrow>
            </>
          ) : (
            <>
              <p className="mt-4 text-xl font-semibold leading-snug text-ink-2">
                {toGo > 0
                  ? `${toGo} more session${toGo === 1 ? '' : 's'} until patterns show up.`
                  : 'Nothing stands out yet. Your sessions look pretty even.'}
              </p>
              {toGo > 0 && <ProgressDots n={sessions.length} of={MIN_SESSIONS} />}
            </>
          )}
        </Card>
      </div>

      {last && (
        <Card>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-semibold">Last time you played</h2>
            <span className="text-xs text-ink-3">{relativeDay(last.date)}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-ink-2">
              <span className="font-semibold text-ink">{last.sport}</span> · {last.duration} min · {socialLabel(last.socialContext)} · felt{' '}
              {moodLabel(last.moodAfter).toLowerCase()}
            </p>
            <Stars value={last.enjoyment} />
          </div>
          {last.reflection && <p className="mt-3 border-l-2 border-ember pl-3 text-sm text-ink-2">“{last.reflection}”</p>}
        </Card>
      )}
    </div>
  )
}

/** One tap: pick a mood, get one suggestion. */
function CheckIn({ mood }: { mood?: Mood }) {
  const pick = (m: Mood) =>
    actions.addCheckIn({ id: uid(), userId: '', date: new Date().toISOString(), mood: m, energy: 3, stress: 2, note: '' })

  if (mood) {
    const s = suggestionFor(mood)
    return (
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <p>
          <span className="text-ink-3">Today you feel </span>
          <span className="font-semibold">
            {MOODS.find((m) => m.id === mood)?.glyph} {moodLabel(mood).toLowerCase()}
          </span>
          <button className="ml-3 text-sm text-ink-3 underline underline-offset-4 hover:text-ink" onClick={() => actions.undoCheckInToday()}>
            Change
          </button>
        </p>
        <Button variant="ghost" onClick={() => go('reset', s.id)}>
          {s.title} · {s.length}
        </Button>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="font-semibold">How are you feeling today?</h2>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6" role="group" aria-label="How are you feeling?">
        {MOODS.map((m) => (
          <button
            key={m.id}
            onClick={() => pick(m.id)}
            className="press flex flex-col items-center gap-1 rounded-2xl border border-line py-3 text-sm hover:border-forest hover:bg-sage-soft"
          >
            <span className="text-2xl" aria-hidden>
              {m.glyph}
            </span>
            {m.label}
          </button>
        ))}
      </div>
    </Card>
  )
}

function WeekTiles({ done, goal }: { done: number; goal: number }) {
  const n = Math.max(goal, done)
  return (
    <div className="mt-4 flex gap-1.5" aria-hidden>
      {Array.from({ length: n }).map((_, i) => (
        <span
          key={i}
          className={cx(
            'grow h-2.5 flex-1 rounded-full',
            i < done ? (i < goal ? 'bg-forest' : 'bg-sage') : 'border border-dashed border-line-2',
          )}
          style={{ animationDelay: `${i * 90}ms` }}
        />
      ))}
    </div>
  )
}

function ProgressDots({ n, of }: { n: number; of: number }) {
  return (
    <div className="mt-4 flex items-center gap-2" aria-label={`${n} of ${of} sessions logged`}>
      {Array.from({ length: of }).map((_, i) => (
        <span key={i} className={cx('h-2.5 w-2.5 rounded-full', i < n ? 'bg-forest' : 'bg-line-2')} />
      ))}
    </div>
  )
}
