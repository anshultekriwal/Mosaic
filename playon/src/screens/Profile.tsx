import { useState } from 'react'
import { Button, Chips, cx, go, PageHeader, Rule, Stars } from '../components/ui'
import { actions, sortedSessions, useData } from '../lib/store'
import { moodLabel, socialLabel } from '../lib/meta'
import { shortDate } from '../lib/dates'

export default function Profile() {
  const data = useData()
  const user = data.user!
  const sessions = sortedSessions(data).reverse()
  const [name, setName] = useState(user.name)
  const [confirmReset, setConfirmReset] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `play-on-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title={user.name}
        sub={`${user.sports.join(' · ')} · since ${new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`}
      />

      {user.isDemo && (
        <section className="rounded-3xl border border-dashed border-ember/50 bg-ember-soft/40 p-5 sm:p-6">
          <p className="text-lg font-semibold">You're exploring a sample season.</p>
          <p className="mt-2 max-w-xl text-sm text-ink-2">
            Alex and their sessions are made up so you can see how PLAY ON works. Start your own season to clear the sample
            and begin with a blank slate.
          </p>
          <Button
            className="mt-5"
            onClick={() => {
              actions.reset()
              go('onboarding')
            }}
          >
            Start my own season
          </Button>
        </section>
      )}

      <section aria-labelledby="h-prefs" className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <h2 id="h-prefs" className="text-xl font-bold">
          Preferences
        </h2>
        <div className="space-y-7">
          <div className="max-w-sm">
            <label htmlFor="pname" className="eyebrow">
              Name
            </label>
            <input
              id="pname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => name.trim() && actions.updateUser({ name: name.trim() })}
              className="mt-2 h-11 w-full rounded-xl border border-line-2 bg-paper/60 px-4 outline-none focus:border-forest"
            />
          </div>
          <Chips
            label="Main sport"
            options={user.sports.map((s) => ({ id: s, label: s }))}
            value={user.primarySport}
            onChange={(s) => actions.updateUser({ primarySport: s })}
          />
          <Chips
            label="Weekly intention"
            options={[1, 2, 3, 4, 5].map((n) => ({ id: String(n), label: `${n}× a week` }))}
            value={String(user.weeklyGoal)}
            onChange={(n) => actions.updateUser({ weeklyGoal: Number(n) })}
          />
        </div>
      </section>

      <Rule />

      <section aria-labelledby="h-history" className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div>
          <h2 id="h-history" className="text-xl font-bold">
            Activity history
          </h2>
          <p className="mt-2 text-sm text-ink-2">{sessions.length} sessions logged.</p>
        </div>
        <div>
          {sessions.length === 0 ? (
            <p className="text-ink-3">Nothing yet. Your first session will show up here.</p>
          ) : (
            <ul className="border-t border-line">
              {(showAll ? sessions : sessions.slice(0, 5)).map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {s.sport} <span className="text-sm font-normal text-ink-3">· {s.duration} min · {socialLabel(s.socialContext)}</span>
                    </p>
                    <p className="text-xs text-ink-3">
                      {shortDate(s.date)} · felt {moodLabel(s.moodAfter).toLowerCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Stars value={s.enjoyment} size={14} />
                    {pendingDelete === s.id ? (
                      <span className="flex items-center gap-2 text-xs">
                        <button
                          className="rounded-full bg-ink px-3 py-1 text-paper"
                          onClick={() => {
                            actions.deleteSession(s.id)
                            setPendingDelete(null)
                          }}
                        >
                          Delete
                        </button>
                        <button className="text-ink-2 underline" onClick={() => setPendingDelete(null)}>
                          Keep
                        </button>
                      </span>
                    ) : (
                      <button
                        className="text-xs text-ink-3 underline underline-offset-4 hover:text-ink"
                        onClick={() => setPendingDelete(s.id)}
                        aria-label={`Remove ${s.sport} session from ${shortDate(s.date)}`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {sessions.length > 5 && (
            <Button variant="quiet" className="mt-4" onClick={() => setShowAll((x) => !x)}>
              {showAll ? 'Show fewer' : `Show all ${sessions.length}`}
            </Button>
          )}
        </div>
      </section>

      <Rule />

      <section aria-labelledby="h-data" className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div>
          <h2 id="h-data" className="text-xl font-bold">
            Your data
          </h2>
          <p className="mt-2 text-sm text-ink-2">Everything lives in this browser. Nothing is sent anywhere.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" onClick={exportData}>
            Download my data
          </Button>
          {confirmReset ? (
            <span className={cx('fade flex items-center gap-3 rounded-full border border-line-2 py-1 pl-4 pr-1 text-sm')}>
              Clear everything on this device?
              <Button
                onClick={() => {
                  actions.reset()
                  go('welcome')
                }}
              >
                Yes, clear
              </Button>
              <Button variant="quiet" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
            </span>
          ) : (
            <Button variant="quiet" onClick={() => setConfirmReset(true)}>
              Clear all data
            </Button>
          )}
        </div>
      </section>

      <p className="max-w-2xl text-xs leading-relaxed text-ink-3">
        PLAY ON shares observations about your own logged sessions. It isn't a medical device and doesn't give medical,
        psychological or coaching advice.
      </p>
    </div>
  )
}
