import { useMemo, useState, type ReactNode } from 'react'
import { Arrow, Button, cx, go, StarInput } from '../components/ui'
import { actions, getData, sortedSessions, uid } from '../lib/store'
import { ENERGY_WORDS, MOODS, socialLabel } from '../lib/meta'
import { avg, computeInsights, MIN_SESSIONS } from '../lib/insights'
import { MILESTONES, milestoneLabel } from '../lib/season'
import type { ActivitySession, Mood } from '../lib/types'
import type { Draft } from './Play'

export default function PostGame({ draft }: { draft: Draft }) {
  const [mood, setMood] = useState<Mood | null>(null)
  const [enjoyment, setEnjoyment] = useState(0)
  const [energyBefore, setEnergyBefore] = useState(3)
  const [energyAfter, setEnergyAfter] = useState(3)
  const [reflection, setReflection] = useState('')
  const [saved, setSaved] = useState<ActivitySession | null>(null)

  const ready = !!mood && enjoyment > 0

  const finish = () => {
    if (!ready) return
    const s: ActivitySession = {
      ...draft,
      id: uid(),
      userId: getData().user!.id,
      enjoyment,
      energyBefore,
      energyAfter,
      moodAfter: mood!,
      standouts: [],
      reflection: reflection.trim(),
    }
    actions.addSession(s)
    setSaved(s)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-forest text-paper">
      <Rings />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-6 pb-10">
        {saved ? (
          <Complete s={saved} />
        ) : (
          <form
            className="rise flex flex-1 flex-col"
            onSubmit={(e) => {
              e.preventDefault()
              finish()
            }}
          >
            <header className="flex items-center justify-between pt-6">
              <button type="button" onClick={() => go('play')} className="press text-sm text-paper/70 hover:text-paper">
                ← Back
              </button>
              <span className="text-sm text-paper/60">
                {draft.sport} · {draft.duration} min
              </span>
            </header>

            <h1 className="mt-10 text-4xl font-bold tracking-tight sm:text-5xl">
              Game over. <span className="text-sage">How did it feel?</span>
            </h1>

            <div className="mt-10 space-y-9">
              <Q label="How do you feel now?">
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Mood">
                  {MOODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={mood === m.id}
                      onClick={() => setMood(m.id)}
                      className={cx(
                        'press flex flex-col items-center gap-1 rounded-2xl border py-3 text-sm',
                        mood === m.id ? 'border-sage bg-paper text-forest' : 'border-paper/20 hover:border-paper/50',
                      )}
                    >
                      <span className="text-2xl" aria-hidden>
                        {m.glyph}
                      </span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </Q>

              <Q label="How much did you enjoy it?">
                <div className="[&_p]:text-paper/80">
                  <StarInput value={enjoyment} onChange={setEnjoyment} />
                </div>
              </Q>

              <Q label="Energy">
                <div className="space-y-3">
                  <EnergyRow label="Before" value={energyBefore} onChange={setEnergyBefore} />
                  <EnergyRow label="After" value={energyAfter} onChange={setEnergyAfter} />
                </div>
              </Q>

              <Q label="Anything to remember? (optional)">
                <input
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  maxLength={280}
                  aria-label="A short note (optional)"
                  placeholder="A shot, a moment, a feeling…"
                  className="h-12 w-full rounded-xl border border-paper/25 bg-transparent px-4 text-paper outline-none placeholder:text-paper/40 focus:border-sage"
                />
              </Q>
            </div>

            <div className="mt-10">
              <Button type="submit" variant="light" size="lg" disabled={!ready} className="w-full sm:w-auto">
                Save session <Arrow />
              </Button>
              {!ready && <p className="mt-3 text-xs text-paper/55">Pick a mood and a star rating to save.</p>}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function Q({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 font-semibold text-paper/90">{label}</legend>
      {children}
    </fieldset>
  )
}

function EnergyRow({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="grid grid-cols-[56px_1fr] items-center gap-3">
      <span className="text-sm text-paper/70">{label}</span>
      <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={`Energy ${label.toLowerCase()}, 1 to 5`}>
        {ENERGY_WORDS.map((w, k) => (
          <button
            key={w}
            type="button"
            role="radio"
            aria-checked={value === k + 1}
            aria-label={w}
            title={w}
            onClick={() => onChange(k + 1)}
            className={cx(
              'press h-10 rounded-xl border text-sm tabular',
              value === k + 1 ? 'border-sage bg-paper text-forest' : 'border-paper/20 text-paper/80 hover:border-paper/50',
            )}
          >
            {k + 1}
          </button>
        ))}
      </div>
    </div>
  )
}

function Complete({ s }: { s: ActivitySession }) {
  const note = useMemo(() => encouragement(s), [s])
  const leave = (to: 'home' | 'insights' | 'reset', param?: string) => go(to, param)
  const reset = s.moodAfter === 'frustrated' ? 'tough-game' : s.moodAfter === 'drained' ? 'clear-head' : null

  return (
    <div className="flex flex-1 flex-col justify-center py-14">
      <p className="rise font-semibold text-sage">Session saved</p>
      <div className="rise mt-8 grid grid-cols-3 gap-4 border-y border-paper/15 py-8" style={{ animationDelay: '120ms' }}>
        <Stat big={`${s.duration}`} unit="min" label="Played" />
        <Stat big={s.sport} label={socialLabel(s.socialContext)} serif />
        <Stat big={`${s.enjoyment}`} unit="/5" label="Enjoyment" />
      </div>
      <p className="rise mt-10 max-w-2xl text-2xl font-bold leading-snug sm:text-3xl" style={{ animationDelay: '300ms' }}>
        {note.headline}
      </p>
      {note.sub && (
        <p className="rise mt-3 max-w-xl text-paper/70" style={{ animationDelay: '380ms' }}>
          {note.sub}
        </p>
      )}
      <div className="rise mt-12 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: '480ms' }}>
        <Button variant="light" size="lg" onClick={() => leave('home')}>
          Done
        </Button>
        {reset ? (
          <Button size="lg" className="border border-paper/30 bg-transparent hover:bg-paper/5" onClick={() => leave('reset', reset)}>
            Take a short reset
          </Button>
        ) : (
          <Button size="lg" className="border border-paper/30 bg-transparent hover:bg-paper/5" onClick={() => leave('insights')}>
            See your insights
          </Button>
        )}
      </div>
    </div>
  )
}

function Stat({ big, unit, label, serif }: { big: string; unit?: string; label: string; serif?: boolean }) {
  return (
    <div>
      <p className={cx('font-bold leading-none', serif ? 'break-words text-xl sm:text-3xl' : 'text-4xl sm:text-5xl')}>
        {big}
        {unit && <span className="text-xl text-paper/60">{unit}</span>}
      </p>
      <p className="mt-2 text-sm text-paper/60">{label}</p>
    </div>
  )
}

/** One honest line after a session, drawn from what was just logged. */
function encouragement(s: ActivitySession): { headline: string; sub?: string } {
  const all = sortedSessions(getData())
  const n = all.length
  const prior = all.filter((x) => x.id !== s.id)
  const lift = s.energyAfter - s.energyBefore

  if (MILESTONES.includes(n))
    return n === 1
      ? { headline: 'First tree planted. Your season has begun.', sub: 'Every session you log grows the landscape on your Season page.' }
      : {
          headline: `${milestoneLabel(n)}. A new landmark on your season.`,
          sub: n === MIN_SESSIONS ? 'That’s enough for your insights to start showing patterns.' : undefined,
        }

  if (s.moodAfter === 'frustrated')
    return {
      headline: 'Tough ones count too.',
      sub: 'You showed up and you noticed how it felt — that’s the part that matters here. A short reset can help it settle.',
    }
  if (s.moodAfter === 'drained')
    return { headline: 'That took something out of you.', sub: 'Rest is part of the long game. Go easy on yourself tonight.' }

  if (lift >= 2) return { headline: `You came off court with more energy than you brought — up ${lift} points.` }

  if (prior.length >= 3) {
    const ctx = prior.filter((x) => x.socialContext === s.socialContext)
    if (ctx.length >= 2 && s.enjoyment >= 4) {
      return {
        headline: `${s.enjoyment >= avg(ctx.map((x) => x.enjoyment)) ? 'Right in line with' : 'Close to'} how you usually feel playing ${s.socialContext === 'solo' ? 'solo' : `with ${socialLabel(s.socialContext).toLowerCase()}`}.`,
        sub: `Your ${ctx.length} previous sessions like this averaged ${avg(ctx.map((x) => x.enjoyment)).toFixed(1)}/5.`,
      }
    }
  }

  const ins = computeInsights(all)
  if (ins[0]) return { headline: 'Logged. Your insights just got a little clearer.', sub: ins[0].headline }
  return { headline: s.enjoyment >= 4 ? 'Sounds like a good one.' : 'Logged — thanks for noticing how it went.' }
}

function Rings() {
  return (
    <svg className="pointer-events-none absolute -right-40 -top-40 h-[720px] w-[720px] opacity-[0.1]" viewBox="0 0 400 400" aria-hidden>
      {[60, 100, 140, 180].map((r) => (
        <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="var(--color-sage)" strokeWidth="1" />
      ))}
    </svg>
  )
}
