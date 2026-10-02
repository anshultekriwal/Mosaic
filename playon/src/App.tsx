import { useEffect, type ReactNode } from 'react'
import { useData, actions } from './lib/store'
import { cx, DemoBadge, go, useRoute, type Route } from './components/ui'
import Welcome from './screens/Welcome'
import Onboarding from './screens/Onboarding'
import Home from './screens/Home'
import Play from './screens/Play'
import Season from './screens/Season'
import Insights from './screens/Insights'
import Reset from './screens/Reset'
import Profile from './screens/Profile'

const NAV: { id: Route; label: string; icon: ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <IconHome /> },
  { id: 'play', label: 'Play', icon: <IconPlay /> },
  { id: 'season', label: 'Season', icon: <IconSeason /> },
  { id: 'insights', label: 'Insights', icon: <IconMap /> },
  { id: 'profile', label: 'Profile', icon: <IconProfile /> },
]

export default function App() {
  const data = useData()
  const { route, param } = useRoute()

  const needsUser = !data.user && route !== 'welcome' && route !== 'onboarding'
  useEffect(() => {
    // Read the live hash: a reset may already have navigated to onboarding.
    if (needsUser && !/^#\/(welcome|onboarding)/.test(window.location.hash)) go('welcome')
  }, [needsUser])

  if (!data.user || route === 'welcome' || route === 'onboarding') {
    return route === 'onboarding' ? <Onboarding /> : <Welcome />
  }

  // Post-game and the Reset Room exercises are full-bleed moments.
  const immersive = (route === 'play' && param === 'reflect') || (route === 'reset' && !!param)

  const screen = (() => {
    switch (route) {
      case 'play':
        return <Play step={param} />
      case 'season':
        return <Season />
      case 'insights':
        return <Insights focus={param} />
      case 'reset':
        return <Reset exercise={param} />
      case 'profile':
        return <Profile />
      default:
        return <Home />
    }
  })()

  if (immersive) return <main key={route + param}>{screen}</main>

  const active = route === 'reset' ? 'home' : route
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-paper focus:px-4 focus:py-2">
        Skip to content
      </a>

      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-paper/60 px-6 py-8 lg:flex">
        <button onClick={() => go('home')} className="press text-left" aria-label="PLAY ON home">
          <Wordmark />
        </button>
        <nav className="mt-12 flex flex-col gap-1" aria-label="Primary">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#/${n.id}`}
              aria-current={active === n.id ? 'page' : undefined}
              className={cx(
                'press flex items-center gap-3 rounded-full px-4 py-2.5 text-sm',
                active === n.id ? 'bg-forest text-paper' : 'text-ink-2 hover:bg-cream hover:text-ink',
              )}
            >
              {n.icon}
              {n.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto space-y-4">
          <a href="#/reset" className="press block rounded-2xl border border-line bg-lavender-soft/70 p-4 text-sm hover:border-lavender">
            <span className="eyebrow block text-[10px]">Reset Room</span>
            <span className="mt-1 block font-serif text-lg leading-snug">Need a minute?</span>
          </a>
          {data.user.isDemo && <DemoNote />}
        </div>
      </aside>

      <div className="min-w-0">
        {/* mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line/70 bg-cream/85 px-5 py-3 backdrop-blur lg:hidden">
          <button onClick={() => go('home')} className="press" aria-label="PLAY ON home">
            <Wordmark small />
          </button>
          {data.user.isDemo ? (
            <button onClick={() => go('profile')} aria-label="You're viewing sample data. Open profile to start fresh.">
              <DemoBadge />
            </button>
          ) : (
            <a href="#/reset" className="text-sm text-ink-2 underline decoration-line-2 underline-offset-4">
              Reset Room
            </a>
          )}
        </header>

        <main id="main" key={route} className="fade mx-auto w-full max-w-6xl px-5 pb-32 pt-6 sm:px-8 lg:px-14 lg:pb-20 lg:pt-12">
          {screen}
        </main>
      </div>

      {/* mobile bottom nav */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="mx-auto flex max-w-lg justify-around">
          {NAV.map((n) => (
            <li key={n.id}>
              <a
                href={`#/${n.id}`}
                aria-current={active === n.id ? 'page' : undefined}
                className={cx(
                  'press flex w-16 flex-col items-center gap-1 py-2.5 text-[11px]',
                  active === n.id ? 'text-forest' : 'text-ink-3',
                )}
              >
                <span className={cx('grid h-8 w-12 place-items-center rounded-full', active === n.id && 'bg-sage-soft')}>
                  {n.icon}
                </span>
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

function DemoNote() {
  return (
    <div className="rounded-2xl border border-dashed border-ember/50 p-4 text-xs leading-relaxed text-ink-2">
      <DemoBadge />
      <p className="mt-2">You're exploring Alex's sample season. Nothing here is real.</p>
      <button
        className="mt-2 font-medium text-forest underline underline-offset-4"
        onClick={() => {
          actions.reset()
          go('onboarding')
        }}
      >
        Start my own season
      </button>
    </div>
  )
}

export function Wordmark({ small, light }: { small?: boolean; light?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-2', light ? 'text-paper' : 'text-forest')}>
      <svg width={small ? 22 : 26} height={small ? 22 : 26} viewBox="0 0 32 32" aria-hidden>
        <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M6 20c6-3.5 14-3.5 20 0" fill="none" stroke="var(--color-ember)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className={cx('font-sans font-semibold tracking-[0.2em]', small ? 'text-[13px]' : 'text-sm')}>PLAY ON</span>
    </span>
  )
}

/* nav icons — 20px line icons */
function I({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  )
}
function IconHome() {
  return <I d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" />
}
function IconPlay() {
  return <I d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3.5 9.5c5 2 12 2 17 0M3.5 14.5c5-2 12-2 17 0" />
}
function IconSeason() {
  return <I d="M2 19l5-7 4 4 4-6 7 9zM16 6.5a1.5 1.5 0 1 0 0-.01" />
}
function IconMap() {
  return <I d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
}
function IconProfile() {
  return <I d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />
}
