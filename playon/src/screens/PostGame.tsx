import { useEffect, useMemo, useState } from 'react'
import { Arrow, Button, cx, go, StarInput, useReducedMotion } from '../components/ui'
import { actions, getData, sortedSessions, uid } from '../lib/store'
import { BODIES, bodyLabel, ENERGY_WORDS, MOODS, RESULTS, resultLabel, STANDOUTS, socialLabel } from '../lib/meta'
import { avg, computeInsights, MIN_SESSIONS } from '../lib/insights'
import { MILESTONES, milestoneLabel } from '../lib/season'
import type { ActivitySession, BodyAfter, Mood, Result } from '../lib/types'
import type { Draft } from './Play'

const STEPS = ['intro', 'energy', 'mood', 'enjoyment', 'standout', 'reflect', 'done'] as const

export default function PostGame({ draft }: { draft: Draft }) {
  const reduced = useReducedMotion()
  const [i, setI] = useState(0)
  const [energyAfter, setEnergyAfter] = useState(draft.energyBefore)
  const [mood, setMood] = useState<Mood | null>(null)
  const [enjoyment, setEnjoyment] = useState(0)
  const [standouts, setStandouts] = useState<string[]>([])
  const [reflection, setReflection] = useState('')
  const [result, setResult] = useState<Result | undefined>(undefined)
  const [body, setBody] = useState<BodyAfter | undefined>(undefined)
  const isMatch = draft.sessionType === 'match'
  const [saved, setSaved] = useState<ActivitySession | null>(null)

  const step = STEPS[i]

  useEffect(() => {
    if (step !== 'intro') return
    const t = setTimeout(() => setI(1), reduced ? 1200 : 2600)
    return () => clearTimeout(t)
  }, [step, reduced])

  const finish = () => {
    const s: ActivitySession = {
      ...draft,
      id: uid(),
      userId: getData().user!.id,
      enjoyment,
      energyAfter,
      moodAfter: mood!,
      standouts,
      reflection: reflection.trim(),
      ...(isMatch && result ? { result } : {}),
      ...(body ? { bodyAfter: body } : {}),
    }
    actions.addSession(s)
    setSaved(s)
    setI(STEPS.indexOf('done'))
  }

  const canNext =
    step === 'energy' || (step === 'mood' && !!mood) || (step === 'enjoyment' && enjoyment > 0) || step === 'standout' || step === 'reflect'

  const next = () => {
    if (!canNext) return
    if (step === 'reflect') finish()
    else setI(i + 1)
  }

  const qIndex = i - 1
  const qCount = STEPS.length - 2

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-forest text-paper">
      <Rings step={i} />

      {step !== 'intro' && step !== 'done' && (
        <header className="relative z-10 mx-auto flex w-full max-w-3xl items-center justify-between px-6 pt-6">
          <button
            onClick={() => (i <= 1 ? go('play') : setI(i - 1))}
            className="press text-sm text-paper/70 hover:text-paper"
          >
            ← Back
          </button>
          <div className="flex gap-1.5" aria-label={`Question ${qIndex + 1} of ${qCount}`}>
            {Array.from({ length: qCount }).map((_, k) => (
              <span key={k} className={cx('h-1 w-6 rounded-full transition-colors duration-500', k <= qIndex ? 'bg-sage' : 'bg-paper/15')} />
            ))}
          </div>
          <span className="text-sm text-paper/60">
            {draft.sport} · {draft.duration}m
          </span>
        </header>
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-10">
        {step === 'intro' && (
          <button className="flex flex-1 flex-col items-start justify-center text-left" onClick={() => setI(1)} aria-label="Continue">
            <p className="eyebrow fade text-sage">
              {draft.sport} · {draft.duration} minutes
            </p>
            <h1 className="mt-6 font-serif text-[clamp(4rem,16vw,11rem)] font-light leading-[0.85] tracking-tight" aria-label="Game over.">
              {'GAME'.split('').map((c, k) => (
                <span key={k} className="letter" style={{ animationDelay: `${150 + k * 70}ms` }}>
                  {c}
                </span>
              ))}
              <br />
              {'OVER.'.split('').map((c, k) => (
                <span key={k} className="letter italic text-sage" style={{ animationDelay: `${480 + k * 70}ms` }}>
                  {c}
                </span>
              ))}
            </h1>
            <p className="rise mt-8 font-serif text-3xl font-light italic text-paper/85" style={{ animationDelay: '1100ms' }}>
              How did it feel?
            </p>
          </button>
        )}

        {step !== 'intro' && step !== 'done' && (
          <form
            key={step}
            className="rise flex flex-1 flex-col pt-14 sm:pt-20"
            onSubmit={(e) => {
              e.preventDefault()
              next()
            }}
          >
            <div className="flex-1">
              {step === 'energy' && (
                <>
                  <Label n="Energy" />
                  <H>How much energy do you have now?</H>
                  <p className="mt-10 font-serif text-4xl font-light italic text-sage" aria-live="polite">
                    {ENERGY_WORDS[energyAfter - 1]}
                  </p>
                  <div className="mt-6 max-w-xl">
                    <label htmlFor="energy" className="sr-only">
                      Energy now, 1 to 5
                    </label>
                    <input
                      id="energy"
                      type="range"
                      className="slider slider-dark"
                      min={1}
                      max={5}
                      value={energyAfter}
                      aria-valuetext={ENERGY_WORDS[energyAfter - 1]}
                      onChange={(e) => setEnergyAfter(Number(e.target.value))}
                    />
                    <div className="flex justify-between text-xs text-paper/60">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                    <p className="mt-6 text-sm text-paper/60">
                      Going in you said: {ENERGY_WORDS[draft.energyBefore - 1].toLowerCase()}.
                    </p>
                  </div>
                  <TapRow label="And your body?" options={BODIES} value={body} onChange={setBody} />
                </>
              )}

              {step === 'mood' && (
                <>
                  <Label n="Mood" />
                  <H>How do you feel?</H>
                  {isMatch && <TapRow label="The score" options={RESULTS} value={result} onChange={setResult} />}
                  <div className="mt-10 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Mood">
                    {MOODS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        role="radio"
                        aria-checked={mood === m.id}
                        onClick={() => setMood(m.id)}
                        className={cx(
                          'press flex items-center gap-3 rounded-2xl border px-4 py-4 text-left text-[15px] transition-all duration-300',
                          mood === m.id
                            ? 'scale-[1.04] border-sage bg-paper text-forest'
                            : 'border-paper/20 hover:border-paper/50 hover:bg-paper/5',
                        )}
                      >
                        <span className={cx('text-2xl transition-transform duration-300', mood === m.id && 'scale-125')} aria-hidden>
                          {m.glyph}
                        </span>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 'enjoyment' && (
                <>
                  <Label n="Enjoyment" />
                  <H>How much did you enjoy playing?</H>
                  <div className="mt-10 [&_p]:text-paper/80">
                    <StarInput value={enjoyment} onChange={setEnjoyment} />
                  </div>
                </>
              )}

              {step === 'standout' && (
                <>
                  <Label n="What stood out" />
                  <H>What stood out today?</H>
                  <p className="mt-3 text-paper/60">Pick any that fit. Or none.</p>
                  <div className="mt-8 flex max-w-2xl flex-wrap gap-2" role="group" aria-label="What stood out">
                    {STANDOUTS.map((s) => {
                      const on = standouts.includes(s)
                      return (
                        <button
                          key={s}
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          onClick={() => setStandouts((xs) => (on ? xs.filter((x) => x !== s) : [...xs, s]))}
                          className={cx(
                            'press rounded-full border px-5 py-3 text-[15px]',
                            on ? 'border-sage bg-paper text-forest' : 'border-paper/20 hover:border-paper/50',
                          )}
                        >
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {step === 'reflect' && (
                <>
                  <Label n="Reflection" />
                  <H>What do you want to remember?</H>
                  <label htmlFor="reflection" className="sr-only">
                    A short note (optional)
                  </label>
                  <textarea
                    id="reflection"
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    maxLength={280}
                    rows={3}
                    placeholder="A shot, a moment, a feeling… (optional)"
                    className="mt-10 w-full max-w-2xl resize-none border-0 border-b border-paper/25 bg-transparent pb-3 font-serif text-2xl font-light italic text-paper outline-none placeholder:text-paper/35 focus:border-sage sm:text-3xl"
                  />
                  <p className="mt-2 text-right text-xs text-paper/40 sm:max-w-2xl">{reflection.length}/280</p>
                </>
              )}
            </div>

            <div className="mt-10 flex items-center justify-end gap-4">
              {(step === 'standout' || step === 'reflect') && (
                <button type="submit" className="text-sm text-paper/60 underline underline-offset-4 hover:text-paper">
                  Skip
                </button>
              )}
              <Button type="submit" variant="light" size="lg" disabled={!canNext}>
                {step === 'reflect' ? 'Finish' : 'Next'} <Arrow />
              </Button>
            </div>
          </form>
        )}

        {step === 'done' && saved && <Complete s={saved} />}
      </div>
    </div>
  )
}

/** Optional single-tap row: tap to pick, tap again to clear. */
function TapRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { id: T; label: string }[]
  value: T | undefined
  onChange: (v: T | undefined) => void
}) {
  return (
    <fieldset className="mt-10">
      <legend className="eyebrow mb-3 text-paper/60">
        {label} <span className="normal-case tracking-normal text-paper/40">(optional)</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={value === o.id}
            onClick={() => onChange(value === o.id ? undefined : o.id)}
            className={cx(
              'press min-w-20 rounded-full border px-5 py-2.5 text-[15px]',
              value === o.id ? 'border-sage bg-paper text-forest' : 'border-paper/20 hover:border-paper/50',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function Label({ n }: { n: string }) {
  return <p className="eyebrow text-sage">{n}</p>
}
function H({ children }: { children: string }) {
  return <h1 className="mt-4 font-serif text-4xl font-light leading-[1.05] sm:text-6xl">{children}</h1>
}

function Complete({ s }: { s: ActivitySession }) {
  const note = useMemo(() => encouragement(s), [s])
  const leave = (to: 'home' | 'insights' | 'reset', param?: string) => go(to, param)
  const reset =
    s.moodAfter === 'frustrated' ? 'tough-game' : s.bodyAfter === 'sore' ? 'recovery' : s.moodAfter === 'drained' ? 'clear-head' : null

  return (
    <div className="flex flex-1 flex-col justify-center py-14">
      <p className="eyebrow rise text-sage">Session complete</p>
      <div className="rise mt-8 grid grid-cols-3 gap-4 border-y border-paper/15 py-8" style={{ animationDelay: '120ms' }}>
        <Stat big={`${s.duration}`} unit="min" label="Played" />
        <Stat big={s.sport} label={socialLabel(s.socialContext)} serif />
        <Stat big={`${s.enjoyment}`} unit="/5" label="Enjoyment" />
      </div>
      <Compare s={s} />
      <p className="rise mt-10 max-w-2xl font-serif text-3xl font-light leading-snug sm:text-4xl" style={{ animationDelay: '300ms' }}>
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
            {reset === 'recovery' ? 'Do some easy stretches' : 'Take a 60-second reset'}
          </Button>
        ) : (
          <Button size="lg" className="border border-paper/30 bg-transparent hover:bg-paper/5" onClick={() => leave('insights')}>
            See your Game Map
          </Button>
        )}
      </div>
    </div>
  )
}

/** Useful from game one: energy in vs out, and how this game compares with the last. */
function Compare({ s }: { s: ActivitySession }) {
  const prev = useMemo(
    () => sortedSessions(getData()).filter((x) => x.id !== s.id && x.date <= s.date).pop(),
    [s],
  )
  const d = s.energyAfter - s.energyBefore
  const word = (n: number) => ENERGY_WORDS[n - 1].toLowerCase()
  const diff = (a: number, b: number, unit: string) =>
    a === b ? `same as last time` : `${Math.abs(a - b)} ${unit}${Math.abs(a - b) === 1 ? '' : 's'} ${a > b ? 'more' : 'less'} than last time`
  const rows: [string, string][] = [
    ['Energy', `${word(s.energyBefore)} going in, ${word(s.energyAfter)} now${d ? ` (${d > 0 ? '+' : '−'}${Math.abs(d)})` : ', holding steady'}`],
  ]
  if (prev) {
    rows.push(['Enjoyment', `${s.enjoyment}/5, ${diff(s.enjoyment, prev.enjoyment, 'star')}`])
    const pd = prev.energyAfter - prev.energyBefore
    rows.push(['Energy change', d === pd ? 'same as last time' : `${d > pd ? 'better' : 'lower'} than last time (${pd >= 0 ? '+' : '−'}${Math.abs(pd)} then)`])
  }
  const extras = [s.result && resultLabel(s.result), s.bodyAfter && `body ${bodyLabel(s.bodyAfter).toLowerCase()}`].filter(Boolean)
  return (
    <div className="rise mt-8 max-w-2xl" style={{ animationDelay: '200ms' }}>
      <dl className="space-y-2 text-[15px]">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[120px_1fr] gap-3">
            <dt className="text-paper/55">{k}</dt>
            <dd className="text-paper/90">{v}</dd>
          </div>
        ))}
        {extras.length > 0 && (
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <dt className="text-paper/55">Also</dt>
            <dd className="text-paper/90">{extras.join(', ')}</dd>
          </div>
        )}
      </dl>
      {!prev && <p className="mt-3 text-sm text-paper/55">Your first game. Next time you'll see how it compares.</p>}
    </div>
  )
}

function Stat({ big, unit, label, serif }: { big: string; unit?: string; label: string; serif?: boolean }) {
  return (
    <div>
      <p className={cx('font-serif font-light leading-none', serif ? 'truncate text-2xl sm:text-4xl' : 'text-5xl sm:text-6xl')}>
        {big}
        {unit && <span className="text-xl text-paper/60">{unit}</span>}
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-paper/60">{label}</p>
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
      ? { headline: 'First game remembered. Your season has begun.', sub: 'Every game you log grows the landscape on your Season page, and teaches PLAY ON what keeps it fun.' }
      : {
          headline: `${milestoneLabel(n)}. A new landmark on your season.`,
          sub: n === MIN_SESSIONS ? 'That’s enough for your Game Map to start showing patterns, including the slow drift that makes a game stop feeling fun.' : undefined,
        }

  if (s.moodAfter === 'frustrated')
    return {
      headline: 'Tough ones count too.',
      sub: 'You showed up and you noticed how it felt. That’s the part that matters here. A short reset can help it settle.',
    }
  if (s.moodAfter === 'drained')
    return { headline: 'That took something out of you.', sub: 'Rest is part of the long game. Go easy on yourself tonight.' }

  if (lift >= 2) return { headline: `You came off court with more energy than you brought: up ${lift} points.` }

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
  if (ins[0]) return { headline: 'Logged. Your Game Map just got a little clearer.', sub: ins[0].headline }
  return { headline: s.enjoyment >= 4 ? 'Sounds like a good one.' : 'Logged. Thanks for noticing how it went.' }
}

function Rings({ step }: { step: number }) {
  return (
    <svg className="pointer-events-none absolute -right-40 -top-40 h-[720px] w-[720px] opacity-[0.12]" viewBox="0 0 400 400" aria-hidden>
      {[60, 100, 140, 180].map((r, k) => (
        <circle
          key={r}
          cx="200"
          cy="200"
          r={r}
          fill="none"
          stroke="var(--color-sage)"
          strokeWidth={k < step ? 1.6 : 0.8}
          style={{ transition: 'stroke-width 0.8s ease' }}
        />
      ))}
    </svg>
  )
}
