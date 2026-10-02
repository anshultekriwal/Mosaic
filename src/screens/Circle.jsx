import { useState } from 'react'
import { DEFAULT_MESSAGE, MAX_CONTACTS, cleanPhone, loadCircle, saveCircle } from '../lib/storage.js'
import { BigButton, CallLink, Page, QuietLink } from '../components/ui.jsx'

const field =
  'mt-1 w-full rounded-2xl border border-tide bg-night px-4 py-3 text-lg text-mist placeholder:text-haze/60 focus:border-calm focus:outline-none'
const ORDER = ['1st', '2nd', '3rd']
const small =
  'min-h-11 min-w-11 rounded-full px-3 text-base text-haze disabled:opacity-30 enabled:active:bg-tide'

let nextId = 1
const withId = (c) => ({ ...c, id: nextId++ })
const validPhone = (p) => cleanPhone(p).replace('+', '').length >= 3

export default function Circle({ onBack }) {
  const saved = loadCircle()
  const [people, setPeople] = useState(() =>
    saved.contacts.length ? saved.contacts.map(withId) : [withId({ name: '', phone: '' })],
  )
  const [message, setMessage] = useState(saved.message)
  const [status, setStatus] = useState('')

  const update = (id, patch) => setPeople((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const remove = (id) => setPeople((ps) => ps.filter((p) => p.id !== id))
  const move = (index, delta) =>
    setPeople((ps) => {
      const next = [...ps]
      const [p] = next.splice(index, 1)
      next.splice(index + delta, 0, p)
      return next
    })

  function save(e) {
    e.preventDefault()
    const filled = people.filter((p) => p.name.trim() || p.phone.trim())
    const bad = filled.find((p) => !validPhone(p.phone))
    if (bad) {
      setStatus(`Add a phone number for ${bad.name.trim() || 'each person'}.`)
      return
    }
    const contacts = filled.map((p) => ({ name: p.name.trim(), phone: cleanPhone(p.phone) }))
    saveCircle({ contacts, message: message.trim() || DEFAULT_MESSAGE })
    setPeople(contacts.length ? contacts.map(withId) : [withId({ name: '', phone: '' })])
    setStatus(contacts.length ? 'Saved on this device.' : 'Your circle is empty.')
  }

  return (
    <Page title="My circle" onBack={onBack}>
      <p className="mb-8 text-lg text-haze">
        Up to three people who’d want to know you’re struggling. If a session gets hard, Steady
        calls them in this order and lines up a text for anyone who doesn’t answer.
      </p>

      <form onSubmit={save} className="flex flex-col gap-6">
        <ol className="flex flex-col gap-4">
          {people.map((p, i) => (
            <li key={p.id} className="rounded-3xl bg-deep p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-base font-semibold whitespace-nowrap text-calm">
                  {ORDER[i]} to call
                </span>
                <div className="flex items-center">
                  <button
                    type="button"
                    className={small}
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${p.name || 'this person'} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={small}
                    onClick={() => move(i, 1)}
                    disabled={i === people.length - 1}
                    aria-label={`Move ${p.name || 'this person'} down`}
                  >
                    ↓
                  </button>
                  <button type="button" className={small} onClick={() => remove(p.id)}>
                    Remove
                  </button>
                </div>
              </div>
              <label htmlFor={`name-${p.id}`} className="block text-base text-haze">
                Name
                <input
                  id={`name-${p.id}`}
                  className={field}
                  value={p.name}
                  onChange={(e) => update(p.id, { name: e.target.value })}
                  placeholder="e.g. Asha"
                  autoComplete="off"
                  maxLength={40}
                />
              </label>
              <label htmlFor={`phone-${p.id}`} className="mt-3 block text-base text-haze">
                Phone number
                <input
                  id={`phone-${p.id}`}
                  className={field}
                  type="tel"
                  inputMode="tel"
                  value={p.phone}
                  onChange={(e) => update(p.id, { phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  autoComplete="off"
                />
              </label>
              {validPhone(p.phone) && (
                <CallLink number={cleanPhone(p.phone)} className="mt-2 inline-block min-h-11 leading-[2.75rem] text-calm underline underline-offset-4">
                  Test call
                </CallLink>
              )}
            </li>
          ))}
        </ol>

        {people.length < MAX_CONTACTS && (
          <button
            type="button"
            onClick={() => setPeople((ps) => [...ps, withId({ name: '', phone: '' })])}
            className="min-h-14 rounded-3xl border border-dashed border-haze/40 text-lg text-haze"
          >
            + Add someone
          </button>
        )}

        <label htmlFor="circle-message" className="text-lg">
          Message for anyone who doesn’t answer
          <textarea
            id="circle-message"
            className={`${field} resize-none`}
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={300}
          />
          <span className="mt-1 block text-sm text-haze">
            It opens in your messages app ready to send.
          </span>
        </label>

        <BigButton type="submit" className="max-w-none">
          Save my circle
        </BigButton>
        <p className="min-h-6 text-center text-haze" role="status">
          {status}
        </p>
      </form>

      <p className="mt-4 text-base text-haze">
        Stored only in this browser. Steady can’t call or text by itself: it opens your phone’s
        dialer and messages app, and you tap call or send.
      </p>
      <div className="mt-2 text-center">
        <QuietLink onClick={onBack}>Done</QuietLink>
      </div>
    </Page>
  )
}
