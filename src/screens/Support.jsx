import { BigButton, CallLink, QuietLink, TextLink, contactName } from '../components/ui.jsx'
import { loadContact } from '../lib/storage.js'

const primary =
  'flex min-h-14 w-full max-w-sm flex-col items-center justify-center rounded-3xl bg-calm px-6 py-3 text-night'
const soft =
  'flex min-h-14 w-full max-w-sm flex-col items-center justify-center rounded-3xl bg-tide px-6 py-3 text-mist'

/** Shown after two check-ins without "Better". */
export default function Support({ onContinue, onBetter }) {
  const contact = loadContact()
  const name = contactName(contact)

  return (
    <div className="flex w-full flex-col items-center gap-5 text-center [@media(max-height:700px)]:gap-3">
      <h1 className="text-4xl leading-tight font-semibold">Call someone you trust.</h1>
      <p className="max-w-xs text-xl text-haze [@media(max-height:700px)]:hidden">You don’t have to do this alone.</p>
      <div className="flex w-full flex-col items-center gap-3 [@media(max-height:700px)]:gap-2">
        {contact && (
          <>
            <CallLink number={contact.phone} className={primary}>
              <span className="text-2xl font-semibold">Call {name}</span>
            </CallLink>
            <TextLink number={contact.phone} body={contact.message} className={soft}>
              <span className="text-2xl font-semibold">Text {name}</span>
            </TextLink>
          </>
        )}
        <CallLink number="14416" className={contact ? soft : primary}>
          <span className="text-2xl font-semibold">Call 14416</span>
          <span className="text-sm">Tele-MANAS helpline, free, 24/7</span>
        </CallLink>
        <BigButton
          variant={contact ? 'ghost' : 'soft'}
          onClick={onContinue}
          className={contact ? 'min-h-12 py-2 text-xl' : ''}
        >
          Keep breathing with me
        </BigButton>
      </div>
      <QuietLink onClick={onBetter}>I’m feeling better</QuietLink>
    </div>
  )
}
