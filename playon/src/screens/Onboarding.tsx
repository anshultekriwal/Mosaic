import { useState } from 'react'
import { Wordmark } from '../App'
import { Arrow, Button, cx, go } from '../components/ui'
import { SPORTS } from '../lib/meta'
import { actions, uid } from '../lib/store'
import { seasonNameFor } from '../lib/dates'

const STEPS = ['name', 'sport', 'intention', 'ready'] as const

export default function Onboarding() {
  const [i, setI] = useState(0)
  const [name, setName] = useState('')
  const [sports, setSports] = useState<string[]>([])
  const [custom, setCustom] = useState('')
  const [weekly, setWeekly] = useState(2)

  const step = STEPS[i]
  const canNext =
    (step === 'name' && name.trim().length > 0) ||
    (step === 'sport' && sports.length > 0) ||
    step === 'intention' ||
    step === 'ready'

  const next = () => {
    if (!canNext) return
    if (step === 'ready') {
      actions.startFresh({
        id: uid(),
        name: name.trim(),
        primarySport: sports[0],
        sports,
        experienceLevel: 'casual',
        currentFrequency: '',
        weeklyGoal: weekly,
        wellnessGoal: [],
        createdAt: new Date().toISOString(),
        isDemo: false,
      })
      go('home')
      return
    }
    setI(i + 1)
  }

  const toggleSport = (s: string) =>
    setSports((xs) => (xs.includes(s) ? xs.filter((x) => x !== s) : [...xs, s]))

  const season = seasonNameFor(new Date())
  const allSports = [...SPORTS, ...sports.filter((s) => !SPORTS.includes(s))]

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 pt-6">
        <button onClick={() => (i === 0 ? go('welcome') : setI(i - 1))} className="press text-sm text-ink-2 hover:text-ink">
          ← {i === 0 ? 'Back' : 'Previous'}
        </button>
        <Wordmark small />
        <span className="w-14 text-right text-xs text-ink-3 tabular">
          {Math.min(i + 1, STEPS.length - 1)} / {STEPS.length - 1}
        </span>
      </header>
      <div className="mx-auto mt-4 h-px w-full max-w-3xl bg-line px-6" aria-hidden>
        <div className="h-px bg-forest transition-all duration-700" style={{ width: `${(i / (STEPS.length - 1)) * 100}%` }} />
      </div>

      <form
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-10 pt-12 sm:pt-20"
        onSubmit={(e) => {
          e.preventDefault()
          next()
        }}
      >
        <div key={step} className="rise flex-1">
          {step === 'name' && (
            <>
              <Q eyebrow="Let's begin" title="What should we call you?" />
              <label className="sr-only" htmlFor="name">
                Your first name
              </label>
              <input
                id="name"
                autoFocus
                autoComplete="given-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your first name"
                className="mt-10 w-full border-0 border-b border-line-2 bg-transparent pb-3 text-4xl font-bold outline-none placeholder:text-ink-3/50 focus:border-forest sm:text-5xl"
              />
            </>
          )}

          {step === 'sport' && (
            <>
              <Q
                eyebrow={`Nice to meet you, ${name.trim()}`}
                title="What do you love to play?"
                sub="Pick everything you play. Your first pick becomes your main sport."
              />
              <div className="mt-10 flex flex-wrap gap-2" role="group" aria-label="Sports">
                {allSports.map((s) => {
                  const idx = sports.indexOf(s)
                  return (
                    <button
                      key={s}
                      type="button"
                      role="checkbox"
                      aria-checked={idx >= 0}
                      onClick={() => toggleSport(s)}
                      className={cx(
                        'press rounded-full border px-5 py-3 text-[15px]',
                        idx >= 0 ? 'border-forest bg-forest text-paper' : 'border-line-2 bg-paper/60 hover:border-ink-3',
                      )}
                    >
                      {s}
                      {idx === 0 && <span className="ml-2 text-xs text-sage">main</span>}
                    </button>
                  )
                })}
              </div>
              <div className="mt-6 flex max-w-sm items-center gap-2">
                <label htmlFor="custom" className="sr-only">
                  Add another activity
                </label>
                <input
                  id="custom"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (custom.trim()) {
                        toggleSport(custom.trim())
                        setCustom('')
                      }
                    }
                  }}
                  placeholder="Something else? Type it here"
                  className="h-11 flex-1 rounded-full border border-line-2 bg-paper/60 px-4 text-sm outline-none focus:border-forest"
                />
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!custom.trim()}
                  onClick={() => {
                    toggleSport(custom.trim())
                    setCustom('')
                  }}
                >
                  Add
                </Button>
              </div>
            </>
          )}

          {step === 'intention' && (
            <>
              <Q
                eyebrow="Your weekly intention"
                title="How many times a week would feel good?"
                sub="An intention, not a rule. Miss it and nothing breaks. Your season carries on."
              />
              <div className="mt-12 flex items-center gap-6">
                <div className="flex gap-2" role="radiogroup" aria-label="Sessions per week">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={weekly === n}
                      aria-label={`${n} per week`}
                      onClick={() => setWeekly(n)}
                      className={cx(
                        'press grid h-16 w-14 place-items-center rounded-2xl border text-2xl sm:h-20 sm:w-16 sm:text-3xl',
                        weekly === n ? 'border-forest bg-forest text-paper' : 'border-line-2 bg-paper/60 hover:border-ink-3',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <span className="text-sm text-ink-2">
                  time{weekly > 1 ? 's' : ''}
                  <br />a week
                </span>
              </div>
            </>
          )}

          {step === 'ready' && (
            <div className="pt-6">
              <p className="eyebrow">You're all set</p>
              <h1 className="mt-5 text-[clamp(2.4rem,6vw,4rem)] tracking-tight font-bold leading-[1.05]">
                Your {season} Season
                <span className="block text-forest-2">starts now.</span>
              </h1>
              <dl className="mt-12 grid max-w-xl grid-cols-2 gap-y-6 border-t border-line pt-6 text-sm">
                <div>
                  <dt className="text-ink-3">Playing</dt>
                  <dd className="mt-1 text-xl">{sports.join(' · ')}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Intention</dt>
                  <dd className="mt-1 text-xl">{weekly}× a week</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Season length</dt>
                  <dd className="mt-1 text-xl">12 weeks</dd>
                </div>
              </dl>
              <p className="mt-10 max-w-md text-ink-2">
                After you play, take a moment to notice how it felt. Feeling nervous or flat? The Calm tab is always one
                tap away.
              </p>
            </div>
          )}
        </div>

        <div className="mt-12 flex justify-end">
          <Button type="submit" size="lg" disabled={!canNext}>
            {step === 'ready' ? 'Begin' : 'Continue'} <Arrow />
          </Button>
        </div>
      </form>
    </div>
  )
}

function Q({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{title}</h1>
      {sub && <p className="mt-4 max-w-lg text-ink-2">{sub}</p>}
    </>
  )
}
