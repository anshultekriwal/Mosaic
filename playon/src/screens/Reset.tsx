import { useEffect, useRef, useState } from 'react'
import { Arrow, Button, cx, go, useReducedMotion } from '../components/ui'
import { actions, sortedSessions, uid, useData } from '../lib/store'
import { moodLabel } from '../lib/meta'
import { shortDate } from '../lib/dates'
import type { BodyAfter, Mood } from '../lib/types'

type ExerciseId = 'tough-game' | 'clear-head' | 'capture' | 'recovery'

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
    when: 'Any time you need a pause',
    title: 'Clear your head',
    length: '90 seconds',
    blurb: 'Box breathing. Nothing to think about but the square.',
    nudge: 'Ninety seconds of slow breathing is here whenever you want it.',
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
    when: 'If your body feels tired or sore',
    title: 'Recovery mode',
    length: '2½ minutes',
    blurb: 'Five gentle stretches, thirty seconds each.',
    nudge: 'Your body might like a gentle stretch.',
    tone: 'bg-sky-soft',
  },
]

// The room is kept focused. Capture stays in the code but is no longer reachable.
const IN_ROOM: ExerciseId[] = ['tough-game', 'clear-head', 'recovery']
const ROOM = EXERCISES.filter((e) => IN_ROOM.includes(e.id))

export function suggestionFor(mood?: Mood, body?: BodyAfter): Exercise {
  const id: ExerciseId =
    mood === 'frustrated' ? 'tough-game' : body === 'sore' || body === 'tired' || mood === 'calm' ? 'recovery' : 'clear-head'
  return EXERCISES.find((e) => e.id === id)!
}

export default function Reset({ exercise }: { exercise?: string }) {
  const ex = ROOM.find((e) => e.id === exercise)
  if (ex) return <ExerciseScreen ex={ex} />
  return <RoomIndex />
}

function RoomIndex() {
  const data = useData()
  const latest = [...data.checkins].sort((a, b) => a.date.localeCompare(b.date)).pop()
  const lastSession = sortedSessions(data).pop()
  const fromCheckIn = latest && (!lastSession || latest.date > lastSession.date)
  const mood = fromCheckIn ? latest.mood : lastSession?.moodAfter
  const rec = suggestionFor(mood, fromCheckIn ? undefined : lastSession?.bodyAfter)

  return (
    <div className="space-y-14">
      <header className="max-w-3xl">
        <p className="eyebrow">Reset Room</p>
        <h1 className="mt-4 font-serif text-[clamp(2.6rem,6vw,4.5rem)] font-light leading-[1.02]">
          A minute for yourself.
          <span className="block italic text-ink-2">That's all this takes.</span>
        </h1>
        <p className="mt-5 max-w-xl text-ink-2">
          A few short things to do after a game, or any time. Not therapy, not training. Just a short pause.
        </p>
      </header>

      <section aria-labelledby="h-rec" className={cx('rounded-[2rem] p-7 sm:p-10', rec.tone)}>
        <p id="h-rec" className="eyebrow">
          {mood ? `You last said you felt ${moodLabel(mood).toLowerCase()}` : 'A good place to start'}
        </p>
        <p className="mt-4 font-serif text-4xl font-light sm:text-5xl">{rec.title}</p>
        <p className="mt-3 text-ink-2">
          {rec.length} · {rec.blurb}
        </p>
        <Button size="lg" className="mt-8" onClick={() => go('reset', rec.id)}>
          Begin <Arrow />
        </Button>
      </section>

      <section aria-labelledby="h-all">
        <h2 id="h-all" className="eyebrow">
          In the room
        </h2>
        <ul className="mt-4 border-t border-line">
          {ROOM.map((e) => (
            <li key={e.id} className="border-b border-line">
              <button onClick={() => go('reset', e.id)} className="press group grid w-full gap-1 py-6 text-left sm:grid-cols-[220px_1fr_auto] sm:items-center sm:gap-6">
                <span className="text-sm text-ink-3">{e.when}</span>
                <span>
                  <span className="block font-serif text-2xl sm:text-3xl">{e.title}</span>
                  <span className="text-sm text-ink-2">{e.blurb}</span>
                </span>
                <span className="flex items-center gap-3 text-sm text-ink-2">
                  {e.length}
                  <Arrow className="transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="h-stretches">
        <h2 id="h-stretches" className="eyebrow">
          The five stretches
        </h2>
        <p className="mt-2 max-w-xl text-sm text-ink-2">
          What Recovery mode walks you through. Tap an arrow to watch how each one is done (videos open on YouTube).
        </p>
        <ol className="mt-4 grid border-t border-line sm:grid-cols-2 sm:gap-x-10">
          {STRETCHES.map(([n, how, url], k) => (
            <li key={n} className="flex items-center justify-between gap-4 border-b border-line py-4">
              <span className="min-w-0">
                <span className="block font-serif text-xl">
                  <span className="mr-2 font-sans text-sm tabular text-ink-3">0{k + 1}</span>
                  {n}
                </span>
                <span className="mt-0.5 block text-sm text-ink-2">{how}</span>
              </span>
              <TutorialLink name={n} url={url} />
            </li>
          ))}
        </ol>
      </section>

      {data.moments.length > 0 && (
        <section aria-labelledby="h-moments">
          <h2 id="h-moments" className="eyebrow">
            Moments you've captured
          </h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2">
            {[...data.moments].reverse().map((m) => (
              <li key={m.id} className="border-l-2 border-ember pl-4">
                <p className="font-serif text-xl italic">“{m.text}”</p>
                <p className="mt-1 text-xs text-ink-3">{shortDate(m.date)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="max-w-xl text-xs text-ink-3">
        If you're struggling with more than a tough game, please talk to someone you trust or a professional. PLAY ON
        isn't a substitute for care.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function ExerciseScreen({ ex }: { ex: Exercise }) {
  const [done, setDone] = useState(false)
  const dark = ex.id === 'clear-head' || ex.id === 'tough-game'
  return (
    <div className={cx('relative flex min-h-dvh flex-col', dark ? 'bg-forest text-paper' : 'bg-cream text-ink')}>
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 pt-6">
        <button onClick={() => go('reset')} className={cx('press text-sm', dark ? 'text-paper/70 hover:text-paper' : 'text-ink-2 hover:text-ink')}>
          ← Reset Room
        </button>
        <span className={cx('text-sm', dark ? 'text-paper/60' : 'text-ink-3')}>{ex.length}</span>
      </header>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-12 pt-10">
        {done ? (
          <Finished ex={ex} dark={dark} />
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
    'tough-game': 'Game’s over. You don’t have to keep playing it.',
    'clear-head': 'A little more room up there.',
    capture: 'Saved. It’ll be here when you need a reminder.',
    recovery: 'Your body will thank you tomorrow.',
  }
  return (
    <div className="rise flex flex-1 flex-col justify-center">
      <p className={cx('eyebrow', dark && 'text-sage')}>{ex.title}</p>
      <p className="mt-5 font-serif text-5xl font-light leading-tight sm:text-6xl">{lines[ex.id]}</p>
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
          Reset Room
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
          <p className="mx-auto max-w-md font-serif text-3xl font-light leading-snug">{intro}</p>
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
          <p className="mt-10 font-serif text-4xl font-light italic" aria-live="polite">
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
      <label htmlFor="tg" className="mt-4 block font-serif text-4xl font-light leading-tight sm:text-5xl">
        What would you say to a friend who just played that game?
      </label>
      <textarea
        id="tg"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={240}
        placeholder="Optional"
        className="mt-10 w-full resize-none border-0 border-b border-paper/25 bg-transparent pb-3 font-serif text-2xl font-light italic outline-none placeholder:text-paper/35 focus:border-sage"
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
      <label htmlFor="cap" className="mt-4 block font-serif text-4xl font-light leading-tight sm:text-6xl">
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
        className="mt-10 w-full resize-none border-0 border-b border-line-2 bg-transparent pb-3 font-serif text-2xl font-light italic outline-none placeholder:text-ink-3/50 focus:border-forest sm:text-3xl"
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

// [name, how, tutorial]. Tutorials are from named clinicians or established teachers:
// Dr. Katherine Coyner (orthopaedic surgeon), Mike Reinold (PT), Ask Doctor Jo (DPT),
// Dr. Sam Schroetke (DPT) and Yoga With Adriene.
const STRETCHES = [
  ['Calf stretch', 'Hands on a wall, one leg back, heel down. Switch halfway.', 'https://www.youtube.com/watch?v=usQDLsgsMx4'],
  ['Hip flexor lunge', 'Low lunge, back knee down, hips gently forward. Switch halfway.', 'https://www.youtube.com/watch?v=Hmec1bQBQOE'],
  ['Hamstring fold', 'Soft knees, fold forward, let your head hang heavy.', 'https://www.youtube.com/watch?v=oRdXgERlSag'],
  ['Shoulder cross-body', 'Draw one arm across your chest. Switch halfway.', 'https://www.youtube.com/watch?v=KrBCD8Hv-fk'],
  ['Child’s pose', 'Knees wide, arms long, forehead down. Just breathe.', 'https://www.youtube.com/watch?v=eqVMAPM00DM'],
] as const

/** A north-east arrow that opens the stretch's video tutorial. Only the arrow is the link. */
function TutorialLink({ name, url, size = 'sm' }: { name: string; url: string; size?: 'sm' | 'lg' }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Watch a ${name.toLowerCase()} tutorial on YouTube (opens in a new tab)`}
      title="Watch a tutorial on YouTube"
      className={cx(
        'press inline-grid shrink-0 place-items-center rounded-full border border-line-2 text-forest hover:border-forest hover:bg-forest hover:text-paper',
        size === 'lg' ? 'h-11 w-11' : 'h-8 w-8',
      )}
    >
      <svg width={size === 'lg' ? 18 : 14} height={size === 'lg' ? 18 : 14} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M4.5 11.5l7-7M5.5 4.5h6v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  )
}

function Recovery({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(-1)
  const next = () => (i >= STRETCHES.length - 1 ? onDone() : setI(i + 1))

  if (i < 0)
    return (
      <div className="rise flex flex-1 flex-col justify-center">
        <p className="eyebrow">Recovery mode</p>
        <h1 className="mt-4 font-serif text-5xl font-light leading-tight sm:text-6xl">Five easy stretches.</h1>
        <p className="mt-4 max-w-md text-ink-2">
          Thirty seconds each. Ease in, never push into pain. If anything hurts, stop.
        </p>
        <ol className="mt-8 max-w-sm divide-y divide-line border-y border-line text-ink-2">
          {STRETCHES.map(([n, , url], k) => (
            <li key={n} className="flex items-center justify-between gap-4 py-2.5">
              <span>
                <span className="tabular text-ink-3">0{k + 1}</span> {n}
              </span>
              <TutorialLink name={n} url={url} />
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-ink-3">Tap an arrow to watch how it's done. Videos open on YouTube.</p>
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

  const [name, how, url] = STRETCHES[i]
  return (
    <div className="rise flex flex-1 flex-col justify-center">
      <p className="eyebrow">
        Stretch {i + 1} of {STRETCHES.length}
      </p>
      <div className="mt-4 flex items-center gap-4">
        <h1 className="font-serif text-5xl font-light sm:text-7xl">{name}</h1>
        <TutorialLink name={name} url={url} size="lg" />
      </div>
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
