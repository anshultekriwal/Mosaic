import { useState } from 'react'
import { BigButton, CallLink, QuietLink, contactName } from '../components/ui.jsx'
import { callPerson, textPerson } from '../lib/reach.js'

/**
 * Works through the circle in order. The tap that opened this screen has
 * already dialled the first person. A browser can't tell whether a call was
 * answered, so we ask; "No answer" opens the text to that person and lines up
 * the next one. After everyone, the helpline.
 *
 * phase: calling → (talked | queued next → calling …) → exhausted
 */
export default function ReachOut({ contacts, message, onContinue, onBetter }) {
  const [i, setI] = useState(0)
  const [phase, setPhase] = useState('calling')
  const person = contacts[i]
  const name = contactName(person)
  const prev = i > 0 ? contactName(contacts[i - 1]) : null

  function noAnswer() {
    textPerson(person, message)
    if (i + 1 < contacts.length) {
      setI(i + 1)
      setPhase('next')
    } else {
      setPhase('exhausted')
    }
  }

  function callNext() {
    callPerson(person)
    setPhase('calling')
  }

  function startOver() {
    callPerson(contacts[0])
    setI(0)
    setPhase('calling')
  }

  if (phase === 'calling') {
    return (
      <Frame key={`call-${i}`} title={`Calling ${name}`} note={`Did ${name} answer?`}>
        <BigButton onClick={() => setPhase('talked')}>Yes, we’re talking</BigButton>
        <BigButton variant="soft" onClick={noAnswer}>
          No answer
        </BigButton>
        <QuietLink onClick={() => callPerson(person)}>Call {name} again</QuietLink>
      </Frame>
    )
  }

  if (phase === 'next') {
    return (
      <Frame key={`next-${i}`} title={`Now ${name}`} note={`Your message to ${prev} is ready. Tap send, then come back.`}>
        <BigButton onClick={callNext}>Call {name}</BigButton>
      </Frame>
    )
  }

  if (phase === 'talked') {
    return (
      <Frame key="talked" title={`I’m glad you reached ${name}.`} note="Stay with them as long as you need.">
        <BigButton variant="soft" onClick={onContinue}>
          Keep breathing with me
        </BigButton>
        <QuietLink onClick={onBetter}>I’m feeling better</QuietLink>
      </Frame>
    )
  }

  return (
    <Frame
      key="exhausted"
      title="Let’s try a helpline."
      note={`Your message to ${name} is ready. Tap send, then come back.`}
    >
      <CallLink
        number="14416"
        className="flex min-h-16 w-full max-w-sm flex-col items-center justify-center rounded-3xl bg-calm px-6 py-3 text-night"
      >
        <span className="text-2xl font-semibold">Call 14416</span>
        <span className="text-sm">Tele-MANAS helpline, free, 24/7</span>
      </CallLink>
      <BigButton variant="soft" onClick={startOver}>
        Try {contactName(contacts[0])} again
      </BigButton>
      <QuietLink onClick={onContinue}>Keep breathing with me</QuietLink>
    </Frame>
  )
}

function Frame({ title, note, children }) {
  return (
    <div className="settle flex w-full flex-col items-center gap-8 text-center short:gap-4">
      <div>
        <h1 className="text-4xl leading-tight font-semibold text-balance">{title}</h1>
        {note && <p className="mx-auto mt-3 max-w-xs text-xl text-haze short:text-lg">{note}</p>}
      </div>
      <div className="flex w-full flex-col items-center gap-3">{children}</div>
    </div>
  )
}
