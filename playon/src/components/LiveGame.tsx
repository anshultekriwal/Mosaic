import { useEffect, useState } from 'react'
import { Arrow, Button, cx, go } from './ui'
import { actions } from '../lib/store'
import { ENERGY_WORDS, sessionTypeLabel } from '../lib/meta'
import { socialPhrase } from '../lib/insights'
import type { ActiveGame } from '../lib/types'

/** Live milliseconds since the game started, ticking once a second. */
export function useElapsed(startedAt: string) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  return Math.max(0, now - new Date(startedAt).getTime())
}

export function fmtElapsed(ms: number) {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

/** A game left running for this long was probably not ended on time. */
export const STALE_MS = 5 * 60 * 60 * 1000

/** The open game, shown on Home until it's finished or cancelled. */
export function LiveGameCard({ game }: { game: ActiveGame }) {
  const ms = useElapsed(game.startedAt)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const stale = ms > STALE_MS
  const started = new Date(game.startedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

  return (
    <section
      aria-labelledby="h-live"
      className="rise relative overflow-hidden rounded-[2rem] bg-forest px-6 py-8 text-paper sm:px-10 sm:py-10"
    >
      <svg className="pointer-events-none absolute -right-12 -top-12 h-72 w-72 opacity-20" viewBox="0 0 200 200" aria-hidden>
        <circle cx="100" cy="100" r="90" fill="none" stroke="var(--color-sage)" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="var(--color-sage)" />
        <path d="M10 120c50-25 130-25 180 0" fill="none" stroke="var(--color-ember)" strokeWidth="2" />
      </svg>
      <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <div>
          <h2 id="h-live" className="eyebrow flex items-center gap-2 text-sage">
            <LiveDot />
            {stale ? 'Still playing?' : 'Playing now'}
          </h2>
          <p className="mt-4 text-4xl sm:text-5xl">{game.sport}</p>
          <p className="mt-2 text-sm text-paper/70">
            {sessionTypeLabel(game.sessionType)}, {socialPhrase(game.socialContext)} · started {started}
          </p>
          <p className="mt-6 text-6xl tabular sm:text-7xl" aria-hidden>
            {fmtElapsed(ms)}
          </p>
          <p className="sr-only" aria-live="off">
            {Math.floor(ms / 60000)} minutes so far
          </p>
          <p className="mt-4 text-sm text-paper/75">
            Going in: energy {ENERGY_WORDS[game.energyBefore - 1].toLowerCase()}
            {game.feelingsBefore.length > 0 && <>, feeling {game.feelingsBefore.map((f) => f.toLowerCase()).join(', ')}</>}.
          </p>
          {stale && (
            <p className="mt-2 text-sm text-ember-soft">This started a while ago. You can set how long you actually played when you finish.</p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
          <Button variant="light" size="lg" onClick={() => go('play', 'finish')}>
            Finish and reflect <Arrow />
          </Button>
          {confirmCancel ? (
            <span className="fade flex flex-wrap items-center gap-3 text-sm text-paper/80">
              Cancel without logging?
              <button className="rounded-full bg-paper px-3 py-1.5 font-medium text-forest" onClick={() => actions.clearGame()}>
                Yes, cancel
              </button>
              <button className="underline underline-offset-4" onClick={() => setConfirmCancel(false)}>
                Keep playing
              </button>
            </span>
          ) : (
            <button
              className="self-start text-sm text-paper/70 underline underline-offset-4 hover:text-paper lg:self-center"
              onClick={() => setConfirmCancel(true)}
            >
              Cancel game
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

/** Compact "Playing now" link for the nav, visible on every screen. */
export function LivePill({ game, className }: { game: ActiveGame; className?: string }) {
  const ms = useElapsed(game.startedAt)
  return (
    <button
      onClick={() => go('play', 'finish')}
      aria-label={`${game.sport} in progress, ${Math.floor(ms / 60000)} minutes. Finish and reflect.`}
      className={cx(
        'press inline-flex items-center gap-2 rounded-full bg-forest px-3 py-1.5 text-xs font-medium text-paper hover:bg-forest-2',
        className,
      )}
    >
      <LiveDot />
      <span className="max-w-28 truncate">{game.sport}</span>
      <span className="tabular text-paper/75">{fmtElapsed(ms)}</span>
    </button>
  )
}

function LiveDot() {
  return (
    <span className="relative inline-flex h-2 w-2" aria-hidden>
      <span className="live-ping absolute inline-flex h-full w-full rounded-full bg-ember opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-ember" />
    </span>
  )
}
