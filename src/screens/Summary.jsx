import { useEffect, useRef, useState } from 'react'
import { saveEpisode } from '../lib/storage.js'
import { tremorText } from '../lib/readings.js'
import { BigButton } from '../components/ui.jsx'

export const TRIGGERS = ['Work', 'Crowd', 'Sleep', 'Caffeine', 'Don’t know']

function Row({ label, before, after }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-tide py-3 last:border-0 short:py-2">
      <span className="shrink-0 text-lg text-haze">{label}</span>
      <span className="min-w-0 text-right text-xl tabular-nums">
        {before ?? '—'}
        {after !== undefined && (
          <>
            <span className="mx-2 text-haze">→</span>
            <span className="font-semibold text-calm">{after ?? '—'}</span>
          </>
        )}
      </span>
    </div>
  )
}

/** Before/after readings; the episode is saved as soon as this appears. */
export default function Summary({ episode, onDone }) {
  const [trigger, setTrigger] = useState(null)
  const ep = useRef(episode)

  useEffect(() => {
    saveEpisode({ ...ep.current, trigger })
  }, [trigger])

  const { before, after, pulse } = episode
  const fmtRate = (r) => (r?.bpm ? `${r.bpm}` : null)
  const showHands = before?.tremor || after?.tremor

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6 short:gap-2">
      <h1 className="text-center text-5xl leading-tight font-semibold short:text-4xl short:leading-none">You got through it.</h1>

      <div className="w-full rounded-3xl bg-deep px-5 py-2 short:py-0">
        <Row label="Breaths / min" before={fmtRate(before)} after={fmtRate(after)} />
        {showHands && <Row label="Hands" before={tremorText(before?.tremor)} after={tremorText(after?.tremor)} />}
        {pulse && <Row label="Pulse" before={`${pulse} bpm`} />}
      </div>

      <div className="w-full text-center">
        <p className="mb-3 text-lg text-haze short:mb-2 short:text-base">What might have set it off?</p>
        <div className="flex flex-wrap justify-center gap-2">
          {TRIGGERS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={trigger === t}
              onClick={() => setTrigger(trigger === t ? null : t)}
              className={`min-h-11 rounded-full px-4 text-base transition-colors short:min-h-10 duration-300 ${
                trigger === t ? 'bg-calm text-night' : 'bg-tide text-mist'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <BigButton onClick={onDone}>Done</BigButton>
    </div>
  )
}
