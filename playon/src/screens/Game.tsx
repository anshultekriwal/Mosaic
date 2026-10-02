import type { ReactNode } from 'react'
import { Arrow, cx, DemoBadge, go, LinkArrow, Stars } from '../components/ui'
import { sortedSessions, useData } from '../lib/store'
import { avg, fmt1, socialPhrase } from '../lib/insights'
import { buildContext, HIGH_LOAD, lengthLabel, lengthBucket, timeLabel, timeOfDay } from '../lib/derive'
import { bodyLabel, ENERGY_WORDS, intensityLabel, moodGlyph, moodLabel, resultLabel, sessionTypeLabel } from '../lib/meta'

/** Everything about one logged game: before, during, after, and how it compares. */
export default function Game({ id }: { id?: string }) {
  const data = useData()
  const all = sortedSessions(data)
  const s = all.find((x) => x.id === id)

  if (!s)
    return (
      <div className="mx-auto max-w-3xl py-6">
        <p className="eyebrow">Game</p>
        <h1 className="mt-4 text-4xl">We couldn't find that game.</h1>
        <p className="mt-3 text-ink-2">It may have been removed. Your other games are on your Season and Game Map.</p>
        <LinkArrow className="mt-6" onClick={() => go('home')}>
          Back to Home
        </LinkArrow>
      </div>
    )

  const d = new Date(s.date)
  const ctx = buildContext(all).get(s.id)
  const lift = s.energyAfter - s.energyBefore
  const sameSport = all.filter((x) => x.sport === s.sport && x.id !== s.id)
  const sportAvg = avg(sameSport.map((x) => x.enjoyment))
  const sportLen = avg(sameSport.map((x) => x.duration))
  const idx = all.indexOf(s)
  const prev = all[idx - 1]
  const next = all[idx + 1]

  const compare: string[] = []
  if (sameSport.length >= 2) {
    const diff = s.enjoyment - sportAvg
    compare.push(
      Math.abs(diff) < 0.3
        ? `About as enjoyable as your usual ${s.sport.toLowerCase()} game (${fmt1(sportAvg)}/5 across ${sameSport.length} others).`
        : `${diff > 0 ? 'More' : 'Less'} enjoyable than your usual ${s.sport.toLowerCase()} game: ${s.enjoyment}/5 against an average of ${fmt1(sportAvg)}/5 across ${sameSport.length} others.`,
    )
    const ld = s.duration - sportLen
    if (Math.abs(ld) >= 15) compare.push(`${Math.round(Math.abs(ld))} minutes ${ld > 0 ? 'longer' : 'shorter'} than your typical ${s.sport.toLowerCase()} game.`)
  } else {
    compare.push(`One of your first ${s.sport.toLowerCase()} games. Comparisons appear once there are a few more.`)
  }
  if (ctx?.daysSinceLastGame != null)
    compare.push(
      ctx.daysSinceLastGame === 0
        ? 'Your second game that day.'
        : ctx.daysSinceLastGame === 1
          ? 'Played the day after your previous game.'
          : `Played after ${ctx.daysSinceLastGame} rest days.`,
    )
  if (ctx) compare.push(`Game ${ctx.weeklyLoad} of the week${ctx.weeklyLoad >= HIGH_LOAD ? ', a busy week' : ''}.`)

  return (
    <div className="space-y-12">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <p className="eyebrow">
            {d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
            {d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          </p>
          {data.user!.isDemo && <DemoBadge />}
        </div>
        <h1 className="mt-4 text-5xl">{s.sport}</h1>
        <p className="mt-2 text-ink-2">
          {sessionTypeLabel(s.sessionType)}, played {socialPhrase(s.socialContext)}
          {s.result && <> · {resultLabel(s.result)}</>}
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Played" value={<span className="tabular">{s.duration} min</span>} sub={lengthLabel(lengthBucket(s))} />
        <Tile
          label="Enjoyment"
          value={
            <span className="inline-flex flex-col items-center gap-1">
              <Stars value={s.enjoyment} size={18} />
              <span className="tabular">{s.enjoyment}/5</span>
            </span>
          }
        />
        <Tile
          label="Energy"
          value={
            <span className="tabular">
              {s.energyBefore} → {s.energyAfter}
            </span>
          }
          sub={lift === 0 ? 'Held steady' : `${lift > 0 ? 'Up' : 'Down'} ${Math.abs(lift)}`}
        />
        <Tile label="Left feeling" value={<span>{moodLabel(s.moodAfter)}</span>} sub={moodGlyph(s.moodAfter)} />
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Going in">
          <Row k="Energy" v={ENERGY_WORDS[s.energyBefore - 1]} />
          <Row k="Feeling" v={s.feelingsBefore?.length ? s.feelingsBefore.join(', ') : 'Not recorded'} muted={!s.feelingsBefore?.length} />
          <Row k="Time of day" v={timeLabel(timeOfDay(s))} />
          <Row k="Intensity" v={intensityLabel(s.intensity)} />
        </Panel>
        <Panel title="Coming off">
          <Row k="Energy" v={ENERGY_WORDS[s.energyAfter - 1]} />
          <Row k="Mood" v={moodLabel(s.moodAfter)} />
          <Row k="Body" v={s.bodyAfter ? bodyLabel(s.bodyAfter) : 'Not recorded'} muted={!s.bodyAfter} />
          <Row k="Stood out" v={s.standouts.length ? s.standouts.join(', ') : 'Nothing picked'} muted={!s.standouts.length} />
        </Panel>
      </div>

      {s.reflection && (
        <section aria-labelledby="h-note" className="rounded-[2rem] bg-forest px-6 py-8 text-paper sm:px-10">
          <h2 id="h-note" className="eyebrow text-sage">
            What you wanted to remember
          </h2>
          <blockquote className="mt-4 text-xl">
            <span className="text-ember" aria-hidden>
              “
            </span>
            {s.reflection}
            <span className="text-ember" aria-hidden>
              ”
            </span>
          </blockquote>
        </section>
      )}

      <section aria-labelledby="h-compare">
        <h2 id="h-compare" className="text-2xl">
          How it compares
        </h2>
        <ul className="mt-4 space-y-2 text-ink-2">
          {compare.map((c) => (
            <li key={c} className="flex gap-3">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" aria-hidden />
              {c}
            </li>
          ))}
        </ul>
        <LinkArrow className="mt-6" onClick={() => go('insights', undefined, `sport=${encodeURIComponent(s.sport.toLowerCase())}`)}>
          See all your {s.sport.toLowerCase()} games on the Game Map
        </LinkArrow>
      </section>

      <nav aria-label="Other games" className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
        {prev ? <GameLink label="Previous game" s={prev} /> : <span />}
        {next ? <GameLink label="Next game" s={next} right /> : <span />}
      </nav>
    </div>
  )
}

function Tile({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-paper px-3 py-5 text-center">
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="text-xl">{value}</dd>
      {sub && <dd className="text-xs text-ink-3">{sub}</dd>}
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-line bg-paper p-6">
      <h2 className="text-2xl">{title}</h2>
      <dl className="mt-4 divide-y divide-line">{children}</dl>
    </section>
  )
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="text-ink-3">{k}</dt>
      <dd className={cx('text-right', muted ? 'text-ink-3' : 'font-medium text-ink')}>{v}</dd>
    </div>
  )
}

function GameLink({ label, s, right }: { label: string; s: { id: string; sport: string; date: string }; right?: boolean }) {
  return (
    <button
      onClick={() => go('game', s.id)}
      className={cx('press group flex items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-paper', right && 'sm:flex-row-reverse sm:text-right')}
    >
      <Arrow className={cx('shrink-0 text-forest', !right && 'rotate-180')} />
      <span>
        <span className="block text-xs text-ink-3">{label}</span>
        <span className="font-medium">
          {s.sport} · {new Date(s.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
        </span>
      </span>
    </button>
  )
}
