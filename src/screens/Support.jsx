import { BigButton, QuietLink } from '../components/ui.jsx'

/** Shown after two check-ins without "Better". */
export default function Support({ onContinue, onBetter }) {
  return (
    <div className="flex w-full flex-col items-center gap-8 text-center">
      <h1 className="text-4xl leading-tight font-semibold">Call someone you trust.</h1>
      <p className="max-w-xs text-xl text-haze">You don’t have to do this alone.</p>
      <div className="flex w-full flex-col items-center gap-4">
        <a
          href="tel:14416"
          className="flex min-h-16 w-full max-w-sm flex-col items-center justify-center rounded-3xl bg-calm px-6 py-4 text-night"
        >
          <span className="text-2xl font-semibold">Call 14416</span>
          <span className="text-base">Tele-MANAS helpline, free, 24/7</span>
        </a>
        <BigButton variant="soft" onClick={onContinue}>
          Keep breathing with me
        </BigButton>
      </div>
      <QuietLink onClick={onBetter}>I’m feeling better</QuietLink>
    </div>
  )
}
