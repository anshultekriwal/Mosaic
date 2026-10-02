import { BigButton, QuietLink } from '../components/ui.jsx'

export default function Home({ onHelp, onNavigate }) {
  return (
    <div className="flex h-dvh flex-col items-center justify-between px-6 pt-[max(env(safe-area-inset-top),2rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
      <p className="text-lg tracking-[0.3em] text-haze uppercase">Steady</p>

      <div className="settle flex w-full flex-col items-center gap-6">
        <div className="glow pointer-events-none absolute -z-10 h-80 w-80 rounded-full bg-calm/10 blur-3xl" />
        <BigButton onClick={onHelp} className="min-h-28 text-3xl">
          I need help now
        </BigButton>
      </div>

      <nav className="flex flex-col items-center gap-1">
        <div className="flex flex-wrap justify-center gap-x-2">
          <QuietLink onClick={() => onNavigate('practice')}>Practise when calm</QuietLink>
          <QuietLink onClick={() => onNavigate('log')}>My log</QuietLink>
          <QuietLink onClick={() => onNavigate('wearable')}>Wearable preview</QuietLink>
          <QuietLink onClick={() => onNavigate('about')}>How this works</QuietLink>
          <QuietLink onClick={() => onNavigate('circle')}>My circle</QuietLink>
        </div>
        <p className="mt-3 text-sm text-haze/80">Nothing you enter leaves this device.</p>
      </nav>
    </div>
  )
}
