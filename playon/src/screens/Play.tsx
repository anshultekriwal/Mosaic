import { useEffect, useState } from 'react'
import { Arrow, Button, Chips, cx, go, Scale } from '../components/ui'
import { actions, getData, sortedSessions, useData } from '../lib/store'
import { addDays, toLocalInput } from '../lib/dates'
import { ENERGY_WORDS, INTENSITIES, PRE_FEELINGS, SESSION_TYPES, SOCIALS } from '../lib/meta'
import type { ActivitySession, Intensity, SessionType, Social } from '../lib/types'
import PostGame from './PostGame'
import TimeDial from '../components/TimeDial'
import { fmtElapsed, LiveGameCard, STALE_MS } from '../components/LiveGame'

export type Draft = Pick<
  ActivitySession,
  'sport' | 'date' | 'duration' | 'sessionType' | 'intensity' | 'socialContext' | 'energyBefore' | 'feelingsBefore'
> & {
  /** Set when the draft comes from a live game, so saving it closes that game. */
  fromLive?: boolean
}

// Survives the hop from the form to the full-screen reflection.
let pending: Draft | null = null

const DURATIONS = [30, 45, 60, 75, 90, 120]

export default function Play({ step }: { step?: string }) {
  if (step === 'reflect') return <Reflect />
  if (step === 'finish') return <FinishGame />
  return <LogForm startLive={step === 'start'} />
}

/* ---------- finishing a live game ---------- */

function FinishGame() {
  const data = useData()
  const game = data.active
  useEffect(() => {
    if (!game) go('play')
  }, [game])
  const [startedMs] = useState(() => (game ? Date.now() - new Date(game.startedAt).getTime() : 0))
  const stale = startedMs > STALE_MS
  const last = sortedSessions(data).pop()
  // The clock stops when you tap Finish and its minutes become the game length. Only a
  // timer left running for hours (forgotten) asks for the real length instead.
  const [duration, setDuration] = useState(() => (stale ? (last?.duration ?? 60) : Math.max(1, Math.round(startedMs / 60000))))
  const [intensity, setIntensity] = useState<Intensity | null>(() => game?.intensity ?? null)
  if (!game) return null

  const reflect = () => {
    if (!intensity) return
    pending = {
      sport: game.sport,
      date: game.startedAt,
      duration,
      sessionType: game.sessionType,
      intensity,
      socialContext: game.socialContext,
      energyBefore: game.energyBefore,
      ...(game.feelingsBefore.length ? { feelingsBefore: game.feelingsBefore } : {}),
      fromLive: true,
    }
    go('play', 'reflect')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow">Finish your game</p>
      <h1 className="mt-3 font-serif text-5xl font-light leading-tight sm:text-6xl">
        {game.sport}
        <span className="block italic text-ink-2">{stale ? 'How long did you actually play?' : 'Game over.'}</span>
      </h1>
      {stale ? (
        <p className="mt-4 max-w-lg text-ink-2">
          This game was started {fmtMinutes(Math.round(startedMs / 60000))} ago, so the clock probably kept running. Pick the real
          length below.
        </p>
      ) : (
        <div className="mt-8 flex items-end gap-4 border-y border-line py-6">
          <p className="font-serif text-6xl font-light leading-none tabular sm:text-7xl">{fmtElapsed(startedMs)}</p>
          <p className="pb-1 text-sm text-ink-2">
            Clock stopped. Saved as
            <br />
            your game length: <span className="font-medium text-ink">{fmtMinutes(duration)}</span>
          </p>
        </div>
      )}
      <div className="mt-10 space-y-10">
        {stale && <DurationPicker value={duration} onChange={setDuration} />}
        <Chips
          label="How hard was it?"
          options={INTENSITIES.map((i) => ({ id: i.id, label: i.label, sub: i.hint }))}
          value={intensity}
          onChange={setIntensity}
        />
      </div>
      <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button size="lg" disabled={duration <= 0 || !intensity} onClick={reflect}>
          Game over. Reflect <Arrow />
        </Button>
        <Button variant="quiet" onClick={() => go('home')}>
          Not finished yet
        </Button>
      </div>
    </div>
  )
}

const fmtMinutes = (m: number) => (m < 60 ? `${m} minute${m === 1 ? '' : 's'}` : m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m / 60} hour${m === 60 ? '' : 's'}`)

function DurationPicker({ value, onChange }: { value: number; onChange: (m: number) => void }) {
  return (
    <fieldset>
      <legend className="eyebrow mb-3">How long</legend>
      <div className="flex flex-wrap items-center gap-2">
        {DURATIONS.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={value === d}
            onClick={() => onChange(d)}
            className={cx(
              'press h-12 min-w-16 rounded-full border px-4 text-[15px] tabular',
              value === d ? 'border-forest bg-forest text-paper' : 'border-line-2 bg-paper/60 hover:border-ink-3',
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
            value={value}
            onChange={(e) => onChange(Math.max(0, Math.min(480, Number(e.target.value) || 0)))}
            className="h-12 w-20 rounded-full border border-line-2 bg-transparent text-center tabular outline-none focus:border-forest"
          />
          min
        </label>
      </div>
    </fieldset>
  )
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

function LogForm({ startLive }: { startLive: boolean }) {
  const data = useData()
  // "About to play" opens a live game; "Already played" logs one straight away.
  const [mode, setMode] = useState<'before' | 'after'>(startLive && !data.active ? 'before' : 'after')
  const [feelings, setFeelings] = useState<string[]>([])
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
  const valid = finalSport.length > 0 && (mode === 'before' || duration > 0)

  const submit = () => {
    if (!valid) return
    if (mode === 'before') {
      actions.startGame({
        sport: finalSport,
        startedAt: new Date().toISOString(),
        sessionType: type,
        socialContext: social,
        energyBefore,
        feelingsBefore: feelings,
      })
      go('home')
      return
    }
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
      {data.active && (
        <div className="mb-10">
          <LiveGameCard game={data.active} />
        </div>
      )}
      <div className="flex rounded-full border border-line-2 bg-paper/60 p-1 text-sm sm:inline-flex" role="radiogroup" aria-label="When are you logging?">
        {(
          [
            ['before', 'About to play'],
            ['after', 'Already played'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={mode === id}
            disabled={id === 'before' && !!data.active}
            onClick={() => setMode(id)}
            className={cx(
              'press flex-1 rounded-full px-5 py-2 disabled:cursor-not-allowed disabled:opacity-40',
              mode === id ? 'bg-forest text-paper' : 'text-ink-2 hover:text-ink',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="eyebrow mt-8">{mode === 'before' ? 'Start a game' : 'Log a game'}</p>
      <h1 className="mt-3 font-serif text-5xl font-light leading-tight sm:text-6xl">
        {mode === 'before' ? 'What are you about to play?' : 'What did you play?'}
      </h1>
      {mode === 'before' && (
        <p className="mt-3 max-w-lg text-ink-2">
          Answer a few quick things now. A live game opens on Home, and when you finish you add how it felt.
        </p>
      )}

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

        {mode === 'after' && <DurationPicker value={duration} onChange={setDuration} />}

        <div className="grid gap-10 sm:grid-cols-2">
          <Chips label="Type" options={SESSION_TYPES} value={type} onChange={setType} />
          <Chips label="Played with" options={SOCIALS.map((s) => ({ id: s.id, label: s.label }))} value={social} onChange={setSocial} />
        </div>

        {/* For a live game, intensity is asked when it ends: you only know how hard it was afterwards. */}
        {mode === 'after' && (
          <Chips
            label="Intensity"
            options={INTENSITIES.map((i) => ({ id: i.id, label: i.label, sub: i.hint }))}
            value={intensity}
            onChange={setIntensity}
          />
        )}

        <div className="max-w-md">
          <Scale label="Energy going in" value={energyBefore} onChange={setEnergyBefore} words={ENERGY_WORDS} />
        </div>

        {mode === 'before' && (
          <Chips
            label="How are you feeling going in? (optional, pick any)"
            multi
            options={PRE_FEELINGS.map((f) => ({ id: f, label: f }))}
            value={feelings}
            onChange={(f) => setFeelings((xs) => (xs.includes(f) ? xs.filter((x) => x !== f) : [...xs, f]))}
          />
        )}

        {mode === 'after' && (
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
        )}

        <div className="sticky bottom-24 z-10 flex justify-end lg:bottom-6">
          <Button type="submit" size="lg" disabled={!valid} className="shadow-[0_10px_30px_-10px_rgba(30,58,45,0.5)]">
            {mode === 'before' ? 'Start game' : 'Game over. Reflect'} <Arrow />
          </Button>
        </div>
      </form>
    </div>
  )
}
