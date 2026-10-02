import { useEffect, useState } from 'react'
import { Arrow, Button, Chips, cx, go, PageHeader } from '../components/ui'
import { getData, useData } from '../lib/store'
import { addDays, toLocalInput } from '../lib/dates'
import { INTENSITIES, SESSION_TYPES, SOCIALS } from '../lib/meta'
import type { ActivitySession, Intensity, SessionType, Social } from '../lib/types'
import PostGame from './PostGame'

export type Draft = Pick<
  ActivitySession,
  'sport' | 'date' | 'duration' | 'sessionType' | 'intensity' | 'socialContext'
>

// Survives the hop from the form to the full-screen reflection.
let pending: Draft | null = null

const DURATIONS = [30, 45, 60, 75, 90, 120]
const snap = (m: number) => DURATIONS.reduce((a, d) => (Math.abs(d - m) < Math.abs(a - m) ? d : a))

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
  const lastOf = (sp: string) => [...getData().sessions].reverse().find((s) => s.sport === sp)

  const [sport, setSport] = useState(user.primarySport)
  const [other, setOther] = useState('')
  const [duration, setDuration] = useState(snap(lastOf(user.primarySport)?.duration ?? 60))
  const [type, setType] = useState<SessionType>('match')
  const [social, setSocial] = useState<Social>(lastOf(user.primarySport)?.socialContext ?? 'friends')
  const [intensity, setIntensity] = useState<Intensity>('moderate')
  const [day, setDay] = useState<'today' | 'yesterday' | 'other'>('today')
  const [otherDate, setOtherDate] = useState(toLocalInput(addDays(new Date(), -2)))

  const finalSport = sport === '__other' ? other.trim() : sport
  const valid = finalSport.length > 0 && duration > 0

  const submit = () => {
    if (!valid) return
    let date = new Date()
    if (day === 'yesterday') {
      date = addDays(date, -1)
      date.setHours(18, 0, 0, 0)
    } else if (day === 'other') {
      const [y, m, d] = otherDate.split('-').map(Number)
      date = new Date(y, m - 1, d, 18)
    }
    pending = {
      sport: finalSport,
      date: date.toISOString(),
      duration,
      sessionType: type,
      intensity,
      socialContext: social,
    }
    go('play', 'reflect')
  }

  const [more, setMore] = useState(false)

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Log a session" sub="Four quick taps, then tell us how it felt." />

      <form
        className="mt-8 space-y-8"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div>
          <Chips
            label="What did you play?"
            options={[...sports.map((s) => ({ id: s, label: s })), { id: '__other', label: '+ Other' }]}
            value={sport}
            onChange={(s) => {
              setSport(s)
              const l = lastOf(s)
              if (l) {
                setDuration(snap(l.duration))
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
                className="h-11 w-full rounded-full border border-line-2 bg-paper/60 px-5 outline-none focus:border-forest"
              />
            </div>
          )}
        </div>

        <Chips
          label="How long?"
          options={DURATIONS.map((d) => ({ id: String(d), label: d < 60 ? `${d} min` : d % 60 ? `${Math.floor(d / 60)}h ${d % 60}` : `${d / 60}h` }))}
          value={String(duration)}
          onChange={(d) => setDuration(Number(d))}
        />

        <Chips label="Who with?" options={SOCIALS.map((s) => ({ id: s.id, label: s.label }))} value={social} onChange={setSocial} />

        <fieldset>
          <legend className="eyebrow mb-3">When?</legend>
          <div className="flex flex-wrap items-center gap-2">
            {(['today', 'yesterday', 'other'] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={day === d}
                onClick={() => setDay(d)}
                className={cx(
                  'press rounded-full border px-4 py-2 text-sm capitalize',
                  day === d ? 'border-forest bg-forest text-paper' : 'border-line-2 bg-paper/60 hover:border-ink-3',
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
        </fieldset>

        <div className="rounded-2xl border border-line">
          <button
            type="button"
            aria-expanded={more}
            onClick={() => setMore((m) => !m)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-ink-2"
          >
            <span>
              More details <span className="font-normal text-ink-3">· {SESSION_TYPES.find((t) => t.id === type)?.label}, {INTENSITIES.find((i) => i.id === intensity)?.label.toLowerCase()}</span>
            </span>
            <span className={cx('transition-transform', more && 'rotate-45')} aria-hidden>
              +
            </span>
          </button>
          {more && (
            <div className="rise space-y-6 border-t border-line px-4 py-5">
              <Chips label="Type" options={SESSION_TYPES} value={type} onChange={setType} />
              <Chips label="Intensity" options={INTENSITIES.map((i) => ({ id: i.id, label: i.label }))} value={intensity} onChange={setIntensity} />
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={!valid} className="w-full sm:w-auto">
            Next: how did it feel? <Arrow />
          </Button>
        </div>
      </form>
    </div>
  )
}
