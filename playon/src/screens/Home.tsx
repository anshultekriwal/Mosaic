import { Arrow, Button, Card, cx, go, LinkArrow } from '../components/ui'
import { actions, sortedSessions, uid, useData } from '../lib/store'
import { daysBetween, greeting, relativeDay } from '../lib/dates'
import { MOODS, moodLabel } from '../lib/meta'
import { computeInsights, daysSinceLastSession, MIN_SESSIONS } from '../lib/insights'
import { seasonSummary } from '../lib/season'
import { exerciseById, suggestionFor } from './Reset'
import type { Mood } from '../lib/types'

// A kind word for each answer. Nothing here judges how someone feels.
const REPLIES: Record<Mood, string> = {
  happy: 'Good to hear. Hold on to whatever made today feel that way.',
  calm: 'A calm mind is a good place to play from.',
  energized: 'Nice. Enjoy that energy, on court or off it.',
  neutral: 'An ordinary day is completely fine.',
  frustrated: 'That sounds heavy to carry. A minute of slow breathing can help you put some of it down.',
  drained: 'Running low happens. Go easy on yourself today; rest counts too.',
}

const THOUGHTS = [
  'You don’t have to play well to have played well.',
  'One bad game is one game. It says nothing final about you.',
  'Rest is part of playing, not a break from it.',
  'Nerves mean you care. They don’t mean you aren’t ready.',
  'Enjoying it is a good enough reason to play.',
  'Notice how you feel, not just how you scored.',
  'Showing up is something to be proud of.',
]

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
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 864e5)
  const preGame = exerciseById('pre-game')

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-ink-3">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          {greeting()}, {user.name}
        </h1>
        {since != null && since >= 7 && <p className="mt-2 text-ink-2">Welcome back. There's nothing to catch up on.</p>}
      </header>

      <CheckIn mood={today?.mood} />

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => go('reset', preGame.id)}
          className="press group flex items-center justify-between gap-4 rounded-3xl bg-sky-soft px-5 py-5 text-left hover:bg-sky-soft/70"
        >
          <span>
            <span className="block font-semibold">Nervous before a game?</span>
            <span className="mt-0.5 block text-sm text-ink-2">60 seconds to settle your mind.</span>
          </span>
          <Arrow className="shrink-0 transition-transform group-hover:translate-x-1" />
        </button>
        <button
          onClick={() => go('play')}
          className="press group flex items-center justify-between gap-4 rounded-3xl bg-forest px-5 py-5 text-left text-paper hover:bg-forest-2"
        >
          <span>
            <span className="block font-semibold">Just played?</span>
            <span className="mt-0.5 block text-sm text-paper/75">Take a moment to notice how it felt.</span>
          </span>
          <Arrow className="shrink-0 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      <figure className="px-1 py-2">
        <blockquote className="text-xl font-semibold leading-snug text-forest-2 sm:text-2xl">
          {THOUGHTS[dayOfYear % THOUGHTS.length]}
        </blockquote>
        <figcaption className="mt-1 text-xs text-ink-3">A thought for today</figcaption>
      </figure>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="font-semibold">What seems to help you</h2>
          {insight ? (
            <>
              <p className="mt-3 text-lg font-semibold leading-snug">{insight.headline}</p>
              <LinkArrow className="mt-4" onClick={() => go('insights')}>
                See your patterns
              </LinkArrow>
            </>
          ) : (
            <>
              <p className="mt-3 text-ink-2">
                {toGo > 0
                  ? `After ${toGo} more reflection${toGo === 1 ? '' : 's'}, we'll start to show what lifts your mood and what wears you down.`
                  : 'Nothing stands out yet. Your games seem to feel fairly even.'}
              </p>
              {toGo > 0 && <ProgressDots n={sessions.length} of={MIN_SESSIONS} />}
            </>
          )}
        </Card>

        {summary && (
          <Card>
            <h2 className="font-semibold">This week</h2>
            <p className="mt-3 text-ink-2">
              {summary.thisWeek === 0
                ? 'You haven’t played yet this week, and that’s okay.'
                : `You’ve played ${summary.thisWeek === 1 ? 'once' : summary.thisWeek === 2 ? 'twice' : `${summary.thisWeek} times`} this week.`}{' '}
              {last && `Last time was ${relativeDay(last.date).toLowerCase()}, and you left feeling ${moodLabel(last.moodAfter).toLowerCase()}.`}
            </p>
            <LinkArrow className="mt-4" onClick={() => go('season')}>
              See your season
            </LinkArrow>
          </Card>
        )}
      </div>
    </div>
  )
}

/** One tap: pick a mood, get a kind reply and one thing to try. */
function CheckIn({ mood }: { mood?: Mood }) {
  const pick = (m: Mood) =>
    actions.addCheckIn({ id: uid(), userId: '', date: new Date().toISOString(), mood: m, energy: 3, stress: 2, note: '' })

  if (mood) {
    const s = suggestionFor(mood)
    return (
      <Card tone="bg-sage-soft/60">
        <p className="text-sm text-ink-3">
          Today you feel {MOODS.find((m) => m.id === mood)?.glyph} {moodLabel(mood).toLowerCase()}
          <button className="ml-3 underline underline-offset-4 hover:text-ink" onClick={() => actions.undoCheckInToday()}>
            Change
          </button>
        </p>
        <p className="mt-2 text-lg font-semibold leading-snug">{REPLIES[mood]}</p>
        <Button className="mt-4" onClick={() => go('reset', s.id)}>
          {s.title}
        </Button>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold">How's your head today?</h2>
      <p className="mt-0.5 text-sm text-ink-3">There's no wrong answer.</p>
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

function ProgressDots({ n, of }: { n: number; of: number }) {
  return (
    <div className="mt-4 flex items-center gap-2" aria-label={`${n} of ${of} reflections so far`}>
      {Array.from({ length: of }).map((_, i) => (
        <span key={i} className={cx('h-2.5 w-2.5 rounded-full', i < n ? 'bg-forest' : 'bg-line-2')} />
      ))}
    </div>
  )
}
