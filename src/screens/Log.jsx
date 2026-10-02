import { useState } from 'react'
import { clearEpisodes, loadEpisodes } from '../lib/storage.js'
import { patternLines } from '../lib/patterns.js'
import { tremorText } from '../lib/readings.js'
import { Page, QuietLink } from '../components/ui.jsx'

const fmtDate = (ts) =>
  new Date(ts).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })

function fmtDuration(sec) {
  if (!sec) return null
  const m = Math.round(sec / 60)
  return m < 1 ? 'under a minute' : `${m} min`
}

const pair = (a, b) => (a || b ? `${a ?? '—'} → ${b ?? '—'}` : null)

export default function Log({ onBack }) {
  const [episodes, setEpisodes] = useState(() => loadEpisodes().sort((a, b) => b.start - a.start))
  const lines = patternLines(episodes)

  function clear() {
    if (!confirm('Delete every saved episode from this device?')) return
    clearEpisodes()
    setEpisodes([])
  }

  return (
    <Page title="My log" onBack={onBack}>
      {episodes.length === 0 ? (
        <p className="text-xl text-haze">Nothing here yet. Episodes you get through will show up here.</p>
      ) : (
        <>
          {lines.length > 0 && (
            <div className="mb-8 rounded-3xl bg-deep p-5">
              {lines.map((l) => (
                <p key={l} className="text-xl leading-snug">
                  {l}
                </p>
              ))}
            </div>
          )}
          <ul className="flex flex-col gap-3">
            {episodes.map((e) => {
              const breath = pair(e.before?.bpm && `${e.before.bpm}`, e.after?.bpm && `${e.after.bpm}`)
              const hands = pair(tremorText(e.before?.tremor), tremorText(e.after?.tremor))
              return (
                <li key={e.id} className="rounded-3xl bg-deep px-5 py-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-lg font-medium">{fmtDate(e.start)}</span>
                    <span className="shrink-0 text-haze">{fmtDuration(e.durationSec)}</span>
                  </div>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-base">
                    {breath && (
                      <>
                        <dt className="text-haze">Breaths/min</dt>
                        <dd>{breath}</dd>
                      </>
                    )}
                    {hands && (
                      <>
                        <dt className="text-haze">Hands</dt>
                        <dd>{hands}</dd>
                      </>
                    )}
                    {e.pulse && (
                      <>
                        <dt className="text-haze">Pulse</dt>
                        <dd>{e.pulse} bpm</dd>
                      </>
                    )}
                    <dt className="text-haze">Trigger</dt>
                    <dd>{e.trigger ?? '—'}</dd>
                  </dl>
                </li>
              )
            })}
          </ul>
          <div className="mt-10 text-center">
            <QuietLink onClick={clear}>Delete all episodes</QuietLink>
          </div>
        </>
      )}
    </Page>
  )
}
