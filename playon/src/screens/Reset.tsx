import { useEffect, useRef, useState } from 'react'
import { Arrow, Button, cx, go, PageHeader, useReducedMotion } from '../components/ui'
import { actions, sortedSessions, uid, useData } from '../lib/store'
import { moodLabel } from '../lib/meta'
import { shortDate } from '../lib/dates'
import type { Mood } from '../lib/types'

type ExerciseId = 'pre-game' | 'tough-game' | 'clear-head' | 'capture' | 'recovery'

interface Exercise {
  id: ExerciseId
  when: string
  title: string
  length: string
  blurb: string
  nudge: string
  tone: string
}

const EXERCISES: Exercise[] = [
  {
    id: 'pre-game',
    when: 'If you’re nervous before playing',
    title: 'Settle pre-game nerves',
    length: '60 seconds',
    blurb: 'Long, slow breaths out to calm your body before you start.',
    nudge: 'Nerves mean you care. A minute of slow breathing can take the edge off.',
    tone: 'bg-sky-soft',
  },
  {
    id: 'tough-game',
    when: 'If you’re frustrated',
    title: 'Reset after a tough game',
    length: '60 seconds',
    blurb: 'Slow breathing, then one honest question.',
    nudge: 'A frustrating game sticks around less when you give it a minute.',
    tone: 'bg-ember-soft',
  },
  {
    id: 'clear-head',
    when: 'If you’re mentally drained',
    title: 'Clear your head',
    length: '90 seconds',
    blurb: 'Box breathing. Nothing to think about but the square.',
    nudge: 'Ninety seconds of slow breathing might help.',
    tone: 'bg-lavender-soft',
  },
  {
    id: 'capture',
    when: 'If you’re energized',
    title: 'Capture the moment',
    length: '30 seconds',
    blurb: 'Write down one thing that made today good.',
    nudge: 'Good days are worth writing down.',
    tone: 'bg-sage-soft',
  },
  {
    id: 'recovery',
    when: 'If you’re physically tired',
    title: 'Recovery mode',
    length: '2½ minutes',
    blurb: 'Five gentle stretches, thirty seconds each.',
    nudge: 'Your body might like a gentle stretch.',
    tone: 'bg-[#ebe4d4]',
  },
]

export const exerciseById = (id: ExerciseId) => EXERCISES.find((e) => e.id === id)!

export function suggestionFor(mood?: Mood): Exercise {
  const id: ExerciseId =
    mood === 'frustrated'
      ? 'tough-game'
      : mood === 'energized' || mood === 'happy'
        ? 'capture'
        : mood === 'calm'
          ? 'recovery'
          : 'clear-head'
  return EXERCISES.find((e) => e.id === id)!
}

export default function Reset({ exercise }: { exercise?: string }) {
  const ex = EXERCISES.find((e) => e.id === exercise)
  if (ex) return <ExerciseScreen ex={ex} />
  return <RoomIndex />
}

function RoomIndex() {
  const data = useData()
  const latest = [...data.checkins].sort((a, b) => a.date.localeCompare(b.date)).pop()
  const lastSession = sortedSessions(data).pop()
  const mood = latest && (!lastSession || latest.date > lastSession.date) ? latest.mood : lastSession?.moodAfter
  const rec = suggestionFor(mood)

  return (
    <div className="space-y-8">
      <PageHeader title="Calm" sub="Short exercises for your mind. Before a game, after one, or any time you need a minute." />

      <ul className="grid gap-3 sm:grid-cols-2">
        {[rec, ...EXERCISES.filter((e) => e.id !== rec.id)].map((e) => (
          <li key={e.id}>
            <button
              onClick={() => go('reset', e.id)}
              className={cx('press group flex h-full w-full flex-col rounded-3xl border p-5 text-left hover:border-forest', e.tone, e.id === rec.id ? 'border-forest' : 'border-transparent')}
            >
              <span className="flex w-full items-center justify-between gap-2 text-sm text-ink-3">
                {e.when}
                {e.id === rec.id && <span className="rounded-full bg-forest px-2.5 py-0.5 text-xs font-medium text-paper">Suggested</span>}
              </span>
              <span className="mt-3 text-xl font-bold">{e.title}</span>
              <span className="mt-1 text-sm text-ink-2">{e.blurb}</span>
              <span className="mt-4 flex items-center gap-2 text-sm font-medium text-forest">
                {e.length}
                <Arrow className="transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {mood && <p className="-mt-4 text-sm text-ink-3">Suggested because you last said you felt {moodLabel(mood).toLowerCase()}.</p>}

      {data.moments.length > 0 && (
        <section aria-labelledby="h-moments">
          <h2 id="h-moments" className="font-semibold">
            Moments you've saved
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {[...data.moments].reverse().slice(0, 6).map((m) => (
              <li key={m.id} className="border-l-2 border-ember pl-3">
                <p>“{m.text}”</p>
                <p className="mt-1 text-xs text-ink-3">{shortDate(m.date)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <SupportCard />
    </div>
  )
}

/** Shown wherever someone might need more than a breathing exercise. */
export function SupportCard() {
  return (
    <section aria-labelledby="h-support" className="rounded-3xl border border-line bg-paper p-5 sm:p-6">
      <h2 id="h-support" className="font-semibold">
        Need to talk to someone?
      </h2>
      <p className="mt-1 max-w-xl text-sm text-ink-2">
        If it's more than a tough game, you don't have to handle it alone. Tele-MANAS is India's free mental health line,
        open 24 hours in many languages.
      </p>
      <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <a href="tel:14416" className="select-all text-2xl font-bold tabular text-forest">
          14416
        </a>
        <span className="select-all text-sm text-ink-2 tabular">or 1-800-891-4416</span>
      </p>
      <p className="mt-3 text-xs text-ink-3">In an emergency, call 112. PLAY ON is not a substitute for professional care.</p>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function ExerciseScreen({ ex }: { ex: Exercise }) {
  const [done, setDone] = useState(false)
  const dark = ex.id === 'clear-head' || ex.id === 'tough-game' || ex.id === 'pre-game'
  return (
    <div className={cx('relative flex min-h-dvh flex-col', dark ? 'bg-forest text-paper' : 'bg-cream text-ink')}>
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 pt-6">
        <button onClick={() => go('reset')} className={cx('press text-sm', dark ? 'text-paper/70 hover:text-paper' : 'text-ink-2 hover:text-ink')}>
          ← Calm
        </button>
        <span className={cx('text-sm', dark ? 'text-paper/60' : 'text-ink-3')}>{ex.length}</span>
      </header>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-12 pt-10">
        {done ? (
          <Finished ex={ex} dark={dark} />
        ) : ex.id === 'pre-game' ? (
          <PreGame onDone={() => setDone(true)} />
        ) : ex.id === 'tough-game' ? (
          <ToughGame onDone={() => setDone(true)} />
        ) : ex.id === 'clear-head' ? (
          <BoxBreath onDone={() => setDone(true)} />
        ) : ex.id === 'capture' ? (
          <Capture onDone={() => setDone(true)} />
        ) : (
          <Recovery onDone={() => setDone(true)} />
        )}
      </div>
    </div>
  )
}

function Finished({ ex, dark }: { ex: Exercise; dark: boolean }) {
  const lines: Record<ExerciseId, string> = {
    'pre-game': 'You’re ready enough. Go and enjoy it.',
    'tough-game': 'Game’s over. You don’t have to keep playing it.',
    'clear-head': 'A little more room up there.',
    capture: 'Saved. It’ll be here when you need a reminder.',
    recovery: 'Your body will thank you tomorrow.',
  }
  return (
    <div className="rise flex flex-1 flex-col justify-center">
      <p className={cx('eyebrow', dark && 'text-sage')}>{ex.title}</p>
      <p className="mt-5 text-4xl font-bold leading-tight">{lines[ex.id]}</p>
      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Button variant={dark ? 'light' : 'primary'} size="lg" onClick={() => go('home')}>
          Back home
        </Button>
        <Button
          size="lg"
          variant={dark ? 'primary' : 'ghost'}
          className={dark ? 'border border-paper/30 bg-transparent hover:bg-paper/5' : ''}
          onClick={() => go('reset')}
        >
          More exercises
        </Button>
      </div>
    </div>
  )
}

/* ---------- breathing ---------- */

function useTimer(totalSec: number, running: boolean) {
  const [elapsed, setElapsed] = useState(0)
  const t0 = useRef<number | null>(null)
  useEffect(() => {
    if (!running) return
    t0.current = performance.now() - elapsed * 1000
    let raf = 0
    const tick = () => {
      const e = (performance.now() - t0.current!) / 1000
      setElapsed(Math.min(totalSec, e))
      if (e < totalSec) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running, totalSec]) // eslint-disable-line react-hooks/exhaustive-deps
  return elapsed
}

/** phases: [label, seconds, targetScale] */
type Phase = [string, number, number]

function Breather({ phases, total, onDone, intro }: { phases: Phase[]; total: number; onDone: () => void; intro: string }) {
  const [running, setRunning] = useState(false)
  const reduced = useReducedMotion()
  const elapsed = useTimer(total, running)
  const cycle = phases.reduce((a, p) => a + p[1], 0)
  let t = elapsed % cycle
  let idx = 0
  while (t >= phases[idx][1]) {
    t -= phases[idx][1]
    idx++
  }
  const [label, len, target] = phases[idx]
  const prevTarget = phases[(idx - 1 + phases.length) % phases.length][2]
  const p = t / len
  const ease = 0.5 - Math.cos(Math.PI * p) / 2
  const scale = prevTarget + (target - prevTarget) * ease
  const remaining = Math.ceil(total - elapsed)

  useEffect(() => {
    if (elapsed >= total) onDone()
  }, [elapsed, total, onDone])

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      {!running ? (
        <div className="rise">
          <p className="mx-auto max-w-md text-3xl font-bold leading-snug">{intro}</p>
          <Button variant="light" size="lg" className="mt-10" onClick={() => setRunning(true)}>
            Start breathing
          </Button>
        </div>
      ) : (
        <>
          <div className="relative grid h-72 w-72 place-items-center sm:h-80 sm:w-80" aria-hidden>
            <span className="absolute inset-0 rounded-full border border-paper/15" />
            <span
              className="absolute inset-0 rounded-full bg-sage/25"
              style={reduced ? { opacity: 0.25 + scale * 0.5 } : { transform: `scale(${0.4 + scale * 0.6})` }}
            />
            <span
              className="absolute inset-[22%] rounded-full bg-sage/40"
              style={reduced ? { opacity: 0.2 + scale * 0.6 } : { transform: `scale(${0.5 + scale * 0.5})` }}
            />
          </div>
          <p className="mt-10 text-4xl font-bold" aria-live="polite">
            {label}
          </p>
          <p className="mt-3 text-sm text-paper/60 tabular">{remaining}s</p>
          <button onClick={onDone} className="mt-8 text-xs text-paper/50 underline underline-offset-4 hover:text-paper">
            Finish early
          </button>
        </>
      )}
    </div>
  )
}

function BoxBreath({ onDone }: { onDone: () => void }) {
  return (
    <Breather
      intro="Breathe in for four, hold for four, out for four, hold for four. Follow the circle."
      phases={[
        ['Breathe in', 4, 1],
        ['Hold', 4, 1],
        ['Breathe out', 4, 0],
        ['Hold', 4, 0],
      ]}
      total={90}
      onDone={onDone}
    />
  )
}

function PreGame({ onDone }: { onDone: () => void }) {
  return (
    <Breather
      intro="Nerves mean you care. Breathe in for four, out for six, and let your shoulders drop."
      phases={[
        ['Breathe in', 4, 1],
        ['Breathe out', 6, 0],
      ]}
      total={60}
      onDone={onDone}
    />
  )
}

function ToughGame({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState<'breathe' | 'reflect'>('breathe')
  const [text, setText] = useState('')
  if (stage === 'breathe')
    return (
      <Breather
        intro="Long breath out. Let the last point go. In for four, out for six."
        phases={[
          ['Breathe in', 4, 1],
          ['Breathe out', 6, 0],
        ]}
        total={50}
        onDone={() => setStage('reflect')}
      />
    )
  return (
    <form
      className="rise flex flex-1 flex-col pt-10"
      onSubmit={(e) => {
        e.preventDefault()
        if (text.trim()) actions.addMoment({ id: uid(), date: new Date().toISOString(), text: text.trim() })
        onDone()
      }}
    >
      <p className="eyebrow text-sage">One question</p>
      <label htmlFor="tg" className="mt-4 block text-3xl font-bold leading-tight sm:text-4xl">
        What would you say to a friend who just played that game?
      </label>
      <textarea
        id="tg"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={240}
        placeholder="Optional"
        className="mt-10 w-full resize-none border-0 border-b border-paper/25 bg-transparent pb-3 text-2xl font-bold outline-none placeholder:text-paper/35 focus:border-sage"
      />
      <div className="mt-auto flex justify-end gap-4 pt-10">
        <Button type="submit" variant="light" size="lg">
          {text.trim() ? 'Keep this' : 'Done'}
        </Button>
      </div>
    </form>
  )
}

/* ---------- capture ---------- */

function Capture({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState('')
  return (
    <form
      className="rise flex flex-1 flex-col pt-6"
      onSubmit={(e) => {
        e.preventDefault()
        if (!text.trim()) return
        actions.addMoment({ id: uid(), date: new Date().toISOString(), text: text.trim() })
        onDone()
      }}
    >
      <p className="eyebrow">Capture the moment</p>
      <label htmlFor="cap" className="mt-4 block text-3xl font-bold leading-tight sm:text-4xl">
        Write one thing that made today enjoyable.
      </label>
      <textarea
        id="cap"
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={240}
        placeholder="The rally that wouldn't end…"
        className="mt-10 w-full resize-none border-0 border-b border-line-2 bg-transparent pb-3 text-2xl font-bold outline-none placeholder:text-ink-3/50 focus:border-forest sm:text-3xl"
      />
      <div className="mt-auto flex justify-end pt-10">
        <Button type="submit" size="lg" disabled={!text.trim()}>
          Save the moment
        </Button>
      </div>
    </form>
  )
}

/* ---------- recovery ---------- */

const STRETCHES = [
  ['Calf stretch', 'Hands on a wall, one leg back, heel down. Switch halfway.'],
  ['Hip flexor lunge', 'Low lunge, back knee down, hips gently forward. Switch halfway.'],
  ['Hamstring fold', 'Soft knees, fold forward, let your head hang heavy.'],
  ['Shoulder cross-body', 'Draw one arm across your chest. Switch halfway.'],
  ['Child’s pose', 'Knees wide, arms long, forehead down. Just breathe.'],
] as const

function Recovery({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(-1)
  const next = () => (i >= STRETCHES.length - 1 ? onDone() : setI(i + 1))

  if (i < 0)
    return (
      <div className="rise flex flex-1 flex-col justify-center">
        <p className="eyebrow">Recovery mode</p>
        <h1 className="mt-4 text-4xl font-bold leading-tight">Five easy stretches.</h1>
        <p className="mt-4 max-w-md text-ink-2">
          Thirty seconds each. Ease in and never push into pain. If anything hurts, stop.
        </p>
        <ol className="mt-8 space-y-1 text-ink-2">
          {STRETCHES.map(([n], k) => (
            <li key={n}>
              <span className="tabular text-ink-3">0{k + 1}</span> {n}
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <Button size="lg" onClick={() => setI(0)}>
            Start
          </Button>
        </div>
      </div>
    )

  return <Stretch key={i} i={i} onNext={next} />
}

function Stretch({ i, onNext }: { i: number; onNext: () => void }) {
  const [running, setRunning] = useState(true)
  const elapsed = useTimer(30, running)
  useEffect(() => {
    if (elapsed >= 30) onNext()
  }, [elapsed, onNext])

  const [name, how] = STRETCHES[i]
  return (
    <div className="rise flex flex-1 flex-col justify-center">
      <p className="eyebrow">
        Stretch {i + 1} of {STRETCHES.length}
      </p>
      <h1 className="mt-4 text-4xl font-bold">{name}</h1>
      <p className="mt-4 max-w-md text-lg text-ink-2">{how}</p>
      <div className="mt-12 h-1 w-full max-w-md rounded-full bg-line" aria-hidden>
        <div className="h-1 rounded-full bg-forest" style={{ width: `${(elapsed / 30) * 100}%` }} />
      </div>
      <p className="mt-3 text-sm text-ink-3 tabular">{Math.ceil(30 - elapsed)}s</p>
      <div className="mt-10 flex gap-4">
        <Button variant="ghost" onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : 'Resume'}
        </Button>
        <Button variant="quiet" onClick={onNext}>
          {i >= STRETCHES.length - 1 ? 'Finish' : 'Next stretch'}
        </Button>
      </div>
    </div>
  )
}
