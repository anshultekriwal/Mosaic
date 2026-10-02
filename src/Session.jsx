import { useCallback, useEffect, useRef, useState } from 'react'
import { SessionScreen, BigButton } from './components/ui.jsx'
import { keepAwake } from './lib/device.js'
import { stopMotion } from './lib/motion.js'
import Measure from './screens/Measure.jsx'
import Reflect from './screens/Reflect.jsx'
import Pacer from './screens/Pacer.jsx'
import CheckIn from './screens/CheckIn.jsx'
import Grounding from './screens/Grounding.jsx'
import Support from './screens/Support.jsx'
import Pulse from './screens/Pulse.jsx'
import Summary from './screens/Summary.jsx'

/**
 * The guided flow. `practice` runs only the pacer and check-in loop and
 * never saves anything.
 *
 * live:     measure → reflect → pacer → check-in
 *             better → pulse → remeasure → summary
 *             same/worse → grounding → pacer → check-in …
 *             every 2nd check-in without "better" → support
 * practice: pacer → check-in → (better → done | else grounding → pacer …)
 */
export default function Session({ practice = false, onExit }) {
  const [step, setStep] = useState(practice ? 'pacer' : 'measure')
  const [round, setRound] = useState(0)
  const notBetter = useRef(0)
  const data = useRef({ id: crypto.randomUUID?.() ?? String(Date.now()), start: Date.now() })

  useEffect(() => {
    keepAwake(true)
    return () => {
      keepAwake(false)
      stopMotion()
    }
  }, [])

  const go = (s) => setStep(s)

  const onBefore = useCallback((r) => {
    data.current.before = r
    setStep('reflect')
  }, [])
  const onReflected = useCallback(() => setStep('pacer'), [])
  const onPaced = useCallback(() => setStep('checkin'), [])
  const onGrounded = useCallback(() => {
    setRound((n) => n + 1)
    setStep('pacer')
  }, [])
  const onPulse = useCallback((bpm) => {
    data.current.pulse = bpm
    setStep('remeasure')
  }, [])
  const onAfter = useCallback((r) => {
    const end = Date.now()
    Object.assign(data.current, {
      after: r,
      end,
      durationSec: Math.round((end - data.current.start) / 1000),
      loops: round + 1,
    })
    setStep('summary')
  }, [round])

  function onAnswer(answer) {
    if (answer === 'better') return go(practice ? 'practiceDone' : 'pulse')
    notBetter.current += 1
    if (!practice && notBetter.current % 2 === 0) return go('support')
    go('grounding')
  }

  function continueAfterSupport() {
    setRound((n) => n + 1)
    go('pacer')
  }

  let content
  switch (step) {
    case 'measure':
      content = <Measure onDone={onBefore} />
      break
    case 'reflect':
      content = <Reflect reading={data.current.before} onNext={onReflected} />
      break
    case 'pacer':
      content = (
        <Pacer
          key={round}
          startBpm={round === 0 && !practice ? data.current.before?.bpm : round === 0 ? 12 : null}
          holdCycles={round === 0 ? 3 : 6}
          onDone={onPaced}
        />
      )
      break
    case 'checkin':
      content = <CheckIn onAnswer={onAnswer} />
      break
    case 'grounding':
      content = <Grounding onDone={onGrounded} />
      break
    case 'support':
      content = <Support onContinue={continueAfterSupport} onBetter={() => go('pulse')} />
      break
    case 'pulse':
      content = <Pulse onDone={onPulse} />
      break
    case 'remeasure':
      content = <Measure title="Once more. Tap each time you breathe in." onDone={onAfter} />
      break
    case 'summary':
      content = <Summary episode={data.current} onDone={onExit} />
      break
    case 'practiceDone':
      content = (
        <div className="flex w-full flex-col items-center gap-10 text-center">
          <p className="max-w-xs text-4xl leading-snug font-medium">
            That’s it. Come back to this any time.
          </p>
          <BigButton onClick={onExit}>Done</BigButton>
        </div>
      )
      break
  }

  const leave = step === 'summary' || step === 'practiceDone' ? null : onExit

  return (
    <SessionScreen onLeave={leave} showContact={step !== 'support'} stepKey={step === 'pacer' ? `pacer-${round}` : step}>
      {content}
    </SessionScreen>
  )
}
