import { useEffect, useState } from 'react'
import { Arrow, Button, Chips, cx, go, Scale } from '../components/ui'
import { getData, sortedSessions, useData } from '../lib/store'
import { addDays, toLocalInput } from '../lib/dates'
import { ENERGY_WORDS, INTENSITIES, SESSION_TYPES, SOCIALS } from '../lib/meta'
import type { ActivitySession, Intensity, SessionType, Social } from '../lib/types'
import PostGame from './PostGame'
import TimeDial from '../components/TimeDial'

export type Draft = Pick<
  ActivitySession,
  'sport' | 'date' | 'duration' | 'sessionType' | 'intensity' | 'socialContext' | 'energyBefore'
>

// Survives the hop from the form to the full-screen reflection.
let pending: Draft | null = null

const DURATIONS = [30, 45, 60, 75, 90, 120]

export default function Play({ step }: { step?: string }) {
  return step === 'reflect' ? <Reflect /> : <LogForm />
}

function Reflect() {
  // Take the draft once; clearing it means Back/refresh can't log the same session twice.
  const [draft] = useState(() => {
    const d = pending
    pending = null
    return d
  })
  useEffect(() => {
    if (!draft) go('play')
  }, [draft])
  return draft ? <PostGame draft={draft} /> : null
}

function LogForm() {
  const data = useData()
  const user = data.user!
  const sports = [...new Set([...user.sports, ...data.sessions.map((s) => s.sport)])]
  const lastOf = (sp: string) => sortedSessions(getData()).reverse().find((s) => s.sport === sp)
  // Most games repeat the last one: start from the last sport, partners and length.
  const [last] = useState(() => sortedSessions(getData()).pop())
  const startSport = last?.sport ?? user.primarySport

  const [sport, setSport] = useState(startSport)
  const [other, setOther] = useState('')
  const [duration, setDuration] = useState(last?.duration ?? 60)
  const [type, setType] = useState<SessionType>('match')
  const [social, setSocial] = useState<Social>(last?.socialContext ?? 'friends')
  const [intensity, setIntensity] = useState<Intensity>('moderate')
  const [energyBefore, setEnergyBefore] = useState(3)
  const [day, setDay] = useState<'today' | 'yesterday' | 'other'>('today')
  const [otherDate, setOtherDate] = useState(toLocalInput(addDays(new Date(), -2)))
  // Until the dial is touched, guess the start: today it's "now minus the game length",
  // for an earlier day it's the time of the last game (or 6:30 pm).
  const [pickedStart, setPickedStart] = useState<number | null>(null)
  const lastStart = last ? new Date(last.date).getHours() * 60 + Math.floor(new Date(last.date).getMinutes() / 15) * 15 : 18 * 60 + 30
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  const start = pickedStart ?? (day === 'today' ? Math.max(0, Math.floor((nowMin - duration) / 15) * 15) : lastStart)

  const finalSport = sport === '__other' ? other.trim() : sport
  const valid = finalSport.length > 0 && duration > 0

  const submit = () => {
    if (!valid) return
    let date = new Date()
    if (day === 'yesterday') date = addDays(date, -1)
    else if (day === 'other') {
      const [y, m, d] = otherDate.split('-').map(Number)
      date = new Date(y, m - 1, d)
    }
    date.setHours(Math.floor(start / 60), start % 60, 0, 0)
    pending = {
      sport: finalSport,
      date: date.toISOString(),
      duration,
      sessionType: type,
      intensity,
      socialContext: social,
      energyBefore,
    }
    go('play', 'reflect')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow">Log a game</p>
      <h1 className="mt-3 font-serif text-5xl font-light leading-tight sm:text-6xl">What did you play?</h1>

      <form
        className="mt-10 space-y-10"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div>
          <Chips
            label="Sport"
            size="lg"
            options={[...sports.map((s) => ({ id: s, label: s })), { id: '__other', label: '+ Something else' }]}
            value={sport}
            onChange={(s) => {
              setSport(s)
              const l = lastOf(s)
              if (l) {
                setDuration(l.duration)
                setSocial(l.socialContext)
              }
            }}
          />
          {sport === '__other' && (
            <div className="rise mt-3 max-w-sm">
              <label htmlFor="other-sport" className="sr-only">
                Activity name
              </label>
              <input
                id="other-sport"
                autoFocus
                value={other}
                onChange={(e) => setOther(e.target.value)}
                placeholder="e.g. Bouldering"
                className="h-12 w-full rounded-full border border-line-2 bg-paper/60 px-5 outline-none focus:border-forest"
              />
            </div>
          )}
        </div>

        <fieldset>
          <legend className="eyebrow mb-3">How long</legend>
          <div className="flex flex-wrap items-center gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={duration === d}
                onClick={() => setDuration(d)}
                className={cx(
                  'press h-12 min-w-16 rounded-full border px-4 text-[15px] tabular',
                  duration === d ? 'border-forest bg-forest text-paper' : 'border-line-2 bg-paper/60 hover:border-ink-3',
                )}
              >
                {d < 60 ? `${d}m` : d % 60 ? `${Math.floor(d / 60)}h ${d % 60}` : `${d / 60}h`}
              </button>
            ))}
            <label className="ml-1 flex items-center gap-2 text-sm text-ink-2">
              <span className="sr-only">Custom minutes</span>
              <input
                type="number"
                min={5}
                max={480}
                inputMode="numeric"
                value={duration}
                onChange={(e) => setDuration(Math.max(0, Math.min(480, Number(e.target.value) || 0)))}
                className="h-12 w-20 rounded-full border border-line-2 bg-transparent text-center tabular outline-none focus:border-forest"
              />
              min
            </label>
          </div>
        </fieldset>

        <div className="grid gap-10 sm:grid-cols-2">
          <Chips label="Type" options={SESSION_TYPES} value={type} onChange={setType} />
          <Chips label="Played with" options={SOCIALS.map((s) => ({ id: s.id, label: s.label }))} value={social} onChange={setSocial} />
        </div>

        <Chips
          label="Intensity"
          options={INTENSITIES.map((i) => ({ id: i.id, label: i.label, sub: i.hint }))}
          value={intensity}
          onChange={setIntensity}
        />

        <div className="max-w-md">
          <Scale label="Energy going in" value={energyBefore} onChange={setEnergyBefore} words={ENERGY_WORDS} />
        </div>

        <fieldset>
          <legend className="eyebrow mb-3">When</legend>
          <div className="flex flex-wrap items-center gap-2">
            {(['today', 'yesterday', 'other'] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={day === d}
                onClick={() => setDay(d)}
                className={cx(
                  'press rounded-full border px-4 py-2 text-sm capitalize',
                  day === d ? 'border-forest bg-forest text-paper' : 'border-line-2 hover:border-ink-3',
                )}
              >
                {d === 'other' ? 'Earlier' : d}
              </button>
            ))}
            {day === 'other' && (
              <label className="rise">
                <span className="sr-only">Date played</span>
                <input
                  type="date"
                  value={otherDate}
                  max={toLocalInput(new Date())}
                  onChange={(e) => setOtherDate(e.target.value)}
                  className="h-10 rounded-full border border-line-2 bg-transparent px-4 text-sm outline-none focus:border-forest"
                />
              </label>
            )}
          </div>
          <div className="mt-6">
            <TimeDial value={start} onChange={setPickedStart} />
          </div>
        </fieldset>

        <div className="sticky bottom-24 z-10 flex justify-end lg:bottom-6">
          <Button type="submit" size="lg" disabled={!valid} className="shadow-[0_10px_30px_-10px_rgba(30,58,45,0.5)]">
            Game over. Reflect <Arrow />
          </Button>
        </div>
      </form>
    </div>
  )
}
