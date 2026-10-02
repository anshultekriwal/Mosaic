import { useState, type ReactNode } from 'react'
import { Arrow, Button, Chips, cx, PageHeader, StarInput } from '../components/ui'
import { actions, getData, uid, useData } from '../lib/store'
import { addDays, toLocalInput } from '../lib/dates'
import { ENERGY_WORDS, INTENSITIES, MOODS, SESSION_TYPES, SOCIALS, socialLabel } from '../lib/meta'
import type { ActivitySession, Intensity, Mood, SessionType, Social } from '../lib/types'
import { Complete } from './PostGame'

const DURATIONS = [30, 45, 60, 75, 90, 120]
const snap = (m: number) => DURATIONS.reduce((a, d) => (Math.abs(d - m) < Math.abs(a - m) ? d : a))
const fmtDuration = (d: number) => (d < 60 ? `${d} min` : d % 60 ? `${Math.floor(d / 60)}h ${d % 60}` : `${d / 60}h`)

// Said back as soon as someone names a feeling, before anything else is asked.
const AFTER: Partial<Record<Mood, string>> = {
  frustrated: 'That’s a normal way to feel after a game. Let’s note it, then you can let it go.',
  drained: 'Sounds like it took a lot out of you. Be gentle with yourself tonight.',
  neutral: 'Not every game has to be a big one.',
}

export default function Play() {
  const data = useData()
  const user = data.user!
  const sports = [...new Set([...user.sports, ...data.sessions.map((s) => s.sport)])]
  const lastOf = (sp: string) => [...getData().sessions].reverse().find((s) => s.sport === sp)
  const prev = lastOf(user.primarySport)

  // How it felt
  const [mood, setMood] = useState<Mood | null>(null)
  const [note, setNote] = useState('')
  const [enjoyment, setEnjoyment] = useState(0)
  const [energyBefore, setEnergyBefore] = useState(3)
  const [energyAfter, setEnergyAfter] = useState(3)

  // The game, pre-filled from last time
  const [editing, setEditing] = useState(false)
  const [sport, setSport] = useState(user.primarySport)
  const [other, setOther] = useState('')
  const [duration, setDuration] = useState(snap(prev?.duration ?? 60))
  const [social, setSocial] = useState<Social>(prev?.socialContext ?? 'friends')
  const [type, setType] = useState<SessionType>('match')
  const [intensity, setIntensity] = useState<Intensity>('moderate')
  const [day, setDay] = useState<'today' | 'yesterday' | 'other'>('today')
  const [otherDate, setOtherDate] = useState(toLocalInput(addDays(new Date(), -2)))

  const [saved, setSaved] = useState<ActivitySession | null>(null)

  const finalSport = sport === '__other' ? other.trim() : sport
  const ready = !!mood && enjoyment > 0 && finalSport.length > 0

  if (saved) return <Complete s={saved} />

  const save = () => {
    if (!ready) return
    let date = new Date()
    if (day === 'yesterday') {
      date = addDays(date, -1)
      date.setHours(18, 0, 0, 0)
    } else if (day === 'other') {
      const [y, m, d] = otherDate.split('-').map(Number)
      date = new Date(y, m - 1, d, 18)
    }
    const s: ActivitySession = {
      id: uid(),
      userId: user.id,
      sport: finalSport,
      date: date.toISOString(),
      duration,
      sessionType: type,
      intensity,
      socialContext: social,
      enjoyment,
      energyBefore,
      energyAfter,
      moodAfter: mood!,
      standouts: [],
      reflection: note.trim(),
    }
    actions.addSession(s)
    setSaved(s)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="How did playing feel?" sub="Take a moment. Start with how you feel; the game details come last." />

      <form
        className="mt-8 space-y-9"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <Q label="How do you feel right now?">
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="How you feel">
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={mood === m.id}
                onClick={() => setMood(m.id)}
                className={cx(
                  'press flex flex-col items-center gap-1 rounded-2xl border py-3 text-sm',
                  mood === m.id ? 'border-forest bg-sage-soft' : 'border-line bg-paper/60 hover:border-ink-3',
                )}
              >
                <span className="text-2xl" aria-hidden>
                  {m.glyph}
                </span>
                {m.label}
              </button>
            ))}
          </div>
          {mood && AFTER[mood] && (
            <p className="rise mt-3 text-sm text-ink-2" aria-live="polite">
              {AFTER[mood]}
            </p>
          )}
        </Q>

        <Q label="What's on your mind?" hint="Optional. Only you will see this.">
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={280}
            rows={3}
            placeholder="A moment you liked, a worry, something you’re proud of…"
            className="w-full resize-none rounded-2xl border border-line-2 bg-paper/60 px-4 py-3 outline-none focus:border-forest"
          />
        </Q>

        <Q label="Did you enjoy it?">
          <StarInput value={enjoyment} onChange={setEnjoyment} />
        </Q>

        <Q label="Your energy, before and after">
          <div className="space-y-2">
            <EnergyRow label="Before" value={energyBefore} onChange={setEnergyBefore} />
            <EnergyRow label="After" value={energyAfter} onChange={setEnergyAfter} />
          </div>
        </Q>

        <Q label="The game">
          <div className="rounded-2xl border border-line bg-paper/60">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <p className="min-w-0 text-ink-2">
                <span className="font-semibold text-ink">{finalSport || 'Something else'}</span> · {fmtDuration(duration)} ·{' '}
                {social === 'solo' ? 'solo' : `with ${socialLabel(social).toLowerCase()}`} · {day === 'other' ? 'earlier' : day}
              </p>
              <button
                type="button"
                aria-expanded={editing}
                onClick={() => setEditing((x) => !x)}
                className="shrink-0 text-sm font-medium text-forest underline underline-offset-4"
              >
                {editing ? 'Done' : 'Change'}
              </button>
            </div>
            {editing && (
              <div className="rise space-y-6 border-t border-line px-4 py-5">
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
                    <input
                      id="other-sport"
                      aria-label="Activity name"
                      autoFocus
                      value={other}
                      onChange={(e) => setOther(e.target.value)}
                      placeholder="e.g. Bouldering"
                      className="rise mt-3 h-11 w-full max-w-sm rounded-full border border-line-2 bg-paper px-5 outline-none focus:border-forest"
                    />
                  )}
                </div>
                <Chips
                  label="How long?"
                  options={DURATIONS.map((d) => ({ id: String(d), label: fmtDuration(d) }))}
                  value={String(duration)}
                  onChange={(d) => setDuration(Number(d))}
                />
                <Chips label="Who with?" options={SOCIALS.map((s) => ({ id: s.id, label: s.label }))} value={social} onChange={setSocial} />
                <div>
                  <Chips
                    label="When?"
                    options={[
                      { id: 'today', label: 'Today' },
                      { id: 'yesterday', label: 'Yesterday' },
                      { id: 'other', label: 'Earlier' },
                    ]}
                    value={day}
                    onChange={setDay}
                  />
                  {day === 'other' && (
                    <input
                      type="date"
                      aria-label="Date played"
                      value={otherDate}
                      max={toLocalInput(new Date())}
                      onChange={(e) => setOtherDate(e.target.value)}
                      className="rise mt-3 h-10 rounded-full border border-line-2 bg-transparent px-4 text-sm outline-none focus:border-forest"
                    />
                  )}
                </div>
                <Chips label="Type" options={SESSION_TYPES} value={type} onChange={setType} />
                <Chips label="Intensity" options={INTENSITIES.map((i) => ({ id: i.id, label: i.label }))} value={intensity} onChange={setIntensity} />
              </div>
            )}
          </div>
        </Q>

        <div>
          <Button type="submit" size="lg" disabled={!ready} className="w-full sm:w-auto">
            Save reflection <Arrow />
          </Button>
          {!ready && <p className="mt-3 text-xs text-ink-3">Choose how you feel and whether you enjoyed it to save.</p>}
        </div>
      </form>
    </div>
  )
}

function Q({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3">
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-sm text-ink-3">{hint}</span>}
      </legend>
      {children}
    </fieldset>
  )
}

function EnergyRow({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="grid grid-cols-[56px_1fr] items-center gap-3">
      <span className="text-sm text-ink-2">{label}</span>
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
              value === k + 1 ? 'border-forest bg-forest text-paper' : 'border-line-2 bg-paper/60 hover:border-ink-3',
            )}
          >
            {k + 1}
          </button>
        ))}
      </div>
    </div>
  )
}
