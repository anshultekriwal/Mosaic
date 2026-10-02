import { useMemo } from 'react'
import { Button, go } from '../components/ui'
import { getData, sortedSessions } from '../lib/store'
import { moodGlyph, moodLabel, socialLabel } from '../lib/meta'
import { computeInsights, MIN_SESSIONS } from '../lib/insights'
import { MILESTONES, milestoneLabel } from '../lib/season'
import type { ActivitySession } from '../lib/types'
import { SupportCard } from './Reset'

/** Shown right after a reflection is saved: a kind word, never a scorecard. */
export function Complete({ s }: { s: ActivitySession }) {
  const note = useMemo(() => encouragement(s), [s])
  const hard = s.moodAfter === 'frustrated' || s.moodAfter === 'drained'
  const reset = s.moodAfter === 'frustrated' ? 'tough-game' : s.moodAfter === 'drained' ? 'clear-head' : null

  return (
    <div className="mx-auto max-w-2xl py-6">
      <p className="rise text-sm font-medium text-ink-3">
        Saved · {s.sport}, feeling {moodGlyph(s.moodAfter)} {moodLabel(s.moodAfter).toLowerCase()}
      </p>
      <h1 className="rise mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl" style={{ animationDelay: '100ms' }}>
        {note.headline}
      </h1>
      {note.sub && (
        <p className="rise mt-3 max-w-xl text-lg text-ink-2" style={{ animationDelay: '200ms' }}>
          {note.sub}
        </p>
      )}
      {s.reflection && (
        <p className="rise mt-6 border-l-2 border-ember pl-4 text-ink-2" style={{ animationDelay: '260ms' }}>
          “{s.reflection}”
        </p>
      )}
      <div className="rise mt-10 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: '320ms' }}>
        {reset ? (
          <>
            <Button size="lg" onClick={() => go('reset', reset)}>
              Take a minute to let it go
            </Button>
            <Button size="lg" variant="ghost" onClick={() => go('home')}>
              Not now
            </Button>
          </>
        ) : (
          <>
            <Button size="lg" onClick={() => go('home')}>
              Done
            </Button>
            <Button size="lg" variant="ghost" onClick={() => go('reset', 'capture')}>
              Save a good moment
            </Button>
          </>
        )}
      </div>
      {hard && (
        <div className="rise mt-12" style={{ animationDelay: '400ms' }}>
          <SupportCard />
        </div>
      )}
    </div>
  )
}

/** One kind, honest line, drawn from what was just saved. */
function encouragement(s: ActivitySession): { headline: string; sub?: string } {
  const all = sortedSessions(getData())
  const n = all.length
  const lift = s.energyAfter - s.energyBefore

  // Feelings come first; a milestone never talks over a hard day.
  if (s.moodAfter === 'frustrated')
    return {
      headline: 'Tough games count too.',
      sub: 'You noticed how it felt, and that matters more than the result. The game is over; you don’t have to keep replaying it.',
    }
  if (s.moodAfter === 'drained')
    return { headline: 'That took something out of you.', sub: 'Rest is part of playing. Go easy on yourself tonight.' }

  if (MILESTONES.includes(n))
    return n === 1
      ? { headline: 'Your first reflection. Thank you for taking the moment.', sub: 'Each one plants a tree on your Season page.' }
      : {
          headline: `${milestoneLabel(n)} reflected on. That’s a real habit of noticing.`,
          sub: n === MIN_SESSIONS ? 'You can now see what seems to lift your mood on the Patterns page.' : undefined,
        }

  if (lift >= 2) return { headline: 'You came off court with more energy than you took on.', sub: 'Worth remembering on a low day.' }

  if (s.moodAfter === 'calm') return { headline: 'Playing left you calm. That’s a good thing to know about yourself.' }

  const ins = computeInsights(all)
  if (ins[0]) return { headline: 'Thanks for checking in with yourself.', sub: ins[0].headline }
  return {
    headline: s.enjoyment >= 4 ? 'Sounds like a good one.' : 'Thanks for noticing how it went.',
    sub: s.socialContext === 'solo' ? undefined : `Time ${s.socialContext === 'tournament' ? 'at a tournament' : `with ${socialLabel(s.socialContext).toLowerCase()}`} counts for your head too.`,
  }
}
