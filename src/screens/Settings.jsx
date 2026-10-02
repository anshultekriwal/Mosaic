import { useState } from 'react'
import { DEFAULT_MESSAGE, cleanPhone, loadContact, saveContact } from '../lib/storage.js'
import { BigButton, CallLink, Page, QuietLink, TextLink, contactName } from '../components/ui.jsx'

const field =
  'mt-2 w-full rounded-2xl border border-tide bg-deep px-4 py-3 text-lg text-mist placeholder:text-haze/60 focus:border-calm focus:outline-none'

export default function Settings({ onBack }) {
  const saved = loadContact()
  const [name, setName] = useState(saved?.name ?? '')
  const [phone, setPhone] = useState(saved?.phone ?? '')
  const [message, setMessage] = useState(saved?.message ?? DEFAULT_MESSAGE)
  const [contact, setContact] = useState(saved)
  const [status, setStatus] = useState('')

  const digits = cleanPhone(phone).replace('+', '')

  function save(e) {
    e.preventDefault()
    if (digits.length < 3) {
      setStatus('Enter a phone number with at least 3 digits.')
      return
    }
    const next = { name: name.trim(), phone: cleanPhone(phone), message: message.trim() || DEFAULT_MESSAGE }
    saveContact(next)
    setContact(next)
    setPhone(next.phone)
    setStatus('Saved on this device.')
  }

  function remove() {
    saveContact(null)
    setContact(null)
    setName('')
    setPhone('')
    setMessage(DEFAULT_MESSAGE)
    setStatus('Contact removed.')
  }

  return (
    <Page title="Settings" onBack={onBack}>
      <form onSubmit={save} className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold text-calm">Trusted contact</h2>
          <p className="mt-2 text-lg text-haze">
            Someone you can call or text during a session. They appear next to the 112 link.
          </p>
        </div>

        <label htmlFor="contact-name" className="text-lg">
          Name
          <input
            id="contact-name"
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Asha"
            autoComplete="off"
            maxLength={40}
          />
        </label>

        <label htmlFor="contact-phone" className="text-lg">
          Phone number
          <input
            id="contact-phone"
            className={field}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            autoComplete="off"
            required
          />
        </label>

        <label htmlFor="contact-message" className="text-lg">
          Text message
          <textarea
            id="contact-message"
            className={`${field} resize-none`}
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={300}
          />
          <span className="mt-1 block text-sm text-haze">
            Opens in your messages app ready to send. You can still change it there.
          </span>
        </label>

        <BigButton type="submit" className="max-w-none">
          Save contact
        </BigButton>
        <p className="min-h-6 text-center text-haze" role="status">
          {status}
        </p>
      </form>

      {contact && (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-3xl bg-deep p-5 text-center">
          <p className="text-lg">
            {contactName(contact)} · <span className="tabular-nums">{contact.phone}</span>
          </p>
          <div className="flex flex-wrap justify-center gap-x-2">
            <CallLink number={contact.phone} className="min-h-11 px-3 leading-[2.75rem] text-calm underline underline-offset-4">
              Test call
            </CallLink>
            <TextLink number={contact.phone} body={contact.message} className="min-h-11 px-3 leading-[2.75rem] text-calm underline underline-offset-4">
              Test text
            </TextLink>
          </div>
          <QuietLink onClick={remove}>Remove contact</QuietLink>
        </div>
      )}

      <p className="mt-8 text-base text-haze">
        Your contact is stored only in this browser. Steady never sends anything itself: calls and
        texts go through your phone’s own apps.
      </p>
    </Page>
  )
}
