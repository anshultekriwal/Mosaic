import { useEffect, type ReactNode } from 'react'
import { useData, actions } from './lib/store'
import { currentRoute, cx, DemoBadge, go, navTo, useRoute, type Route } from './components/ui'
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
  { id: 'season', label: 'Season', icon: <IconSeason /> },
  { id: 'play', label: 'Log', icon: <IconPlus /> },
  { id: 'insights', label: 'Insights', icon: <IconMap /> },
  { id: 'reset', label: 'Reset', icon: <IconReset /> },
]

export default function App() {
  const data = useData()
  const { route, param } = useRoute()

  const needsUser = !data.user && route !== 'welcome' && route !== 'onboarding'
  useEffect(() => {
    // Read the live route: a reset may already have navigated to onboarding.
    if (needsUser && currentRoute() !== 'welcome' && currentRoute() !== 'onboarding') go('welcome')
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

  const active = route
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_1fr]">
      <a href="#main" onClick={(e) => (e.preventDefault(), document.getElementById('main')?.focus())} className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-paper focus:px-4 focus:py-2">
        Skip to content
      </a>

      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-paper/60 px-5 py-8 lg:flex">
        <button onClick={() => go('home')} className="press px-3 text-left" aria-label="PLAY ON home">
          <Wordmark />
        </button>
        <nav className="mt-10 flex flex-col gap-1" aria-label="Primary">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#/${n.id}`}
              onClick={navTo(n.id)}
              aria-current={active === n.id ? 'page' : undefined}
              className={cx(
                'press flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium',
                active === n.id ? 'bg-forest text-paper' : 'text-ink-2 hover:bg-cream hover:text-ink',
              )}
            >
              {n.icon}
              {n.id === 'play' ? 'Log a session' : n.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          {data.user.isDemo && <DemoNote />}
          <a
            href="#/profile"
            onClick={navTo('profile')}
            aria-current={active === 'profile' ? 'page' : undefined}
            className={cx(
              'press flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium',
              active === 'profile' ? 'bg-forest text-paper' : 'text-ink-2 hover:bg-cream hover:text-ink',
            )}
          >
            <Avatar name={data.user.name} />
            {data.user.name}
          </a>
        </div>
      </aside>

      <div className="min-w-0">
        {/* mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line/70 bg-cream/90 px-5 py-3 backdrop-blur lg:hidden">
          <button onClick={() => go('home')} className="press" aria-label="PLAY ON home">
            <Wordmark small />
          </button>
          <div className="flex items-center gap-3">
            {data.user.isDemo && <DemoBadge />}
            <a href="#/profile" onClick={navTo('profile')} aria-label="Profile and settings" aria-current={active === 'profile' ? 'page' : undefined}>
              <Avatar name={data.user.name} active={active === 'profile'} />
            </a>
          </div>
        </header>

        <main id="main" tabIndex={-1} key={route} className="fade mx-auto w-full max-w-4xl px-5 pb-32 pt-6 outline-none sm:px-8 lg:px-12 lg:pb-16 lg:pt-10">
          {screen}
        </main>
      </div>

      {/* mobile bottom nav */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="mx-auto flex max-w-lg items-end justify-around px-2">
          {NAV.map((n) => {
            const on = active === n.id
            const primary = n.id === 'play'
            return (
              <li key={n.id} className="flex-1">
                <a
                  href={`#/${n.id}`}
                  onClick={navTo(n.id)}
                  aria-current={on ? 'page' : undefined}
                  className={cx('press flex flex-col items-center gap-1 py-2 text-[11px] font-medium', on ? 'text-forest' : 'text-ink-3')}
                >
                  <span
                    className={cx(
                      'grid place-items-center rounded-full',
                      primary ? 'h-11 w-11 -mt-4 bg-forest text-paper shadow-[0_8px_20px_-8px_rgba(30,58,45,0.6)]' : 'h-7 w-12',
                      !primary && on && 'bg-sage-soft',
                    )}
                  >
                    {n.icon}
                  </span>
                  {n.label}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

function Avatar({ name, active }: { name: string; active?: boolean }) {
  return (
    <span
      className={cx(
        'grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold',
        active ? 'bg-forest text-paper' : 'bg-sage-soft text-forest',
      )}
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase() || '·'}
    </span>
  )
}

function DemoNote() {
  return (
    <div className="rounded-2xl border border-dashed border-ember/50 p-4 text-xs leading-relaxed text-ink-2">
      <DemoBadge />
      <p className="mt-2">You're exploring a sample season.</p>
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
      <span className={cx('font-bold tracking-[0.18em]', small ? 'text-[13px]' : 'text-sm')}>PLAY ON</span>
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
function IconSeason() {
  return <I d="M2 19l5-7 4 4 4-6 7 9zM16 6.5a1.5 1.5 0 1 0 0-.01" />
}
function IconMap() {
  return <I d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
}
function IconPlus() {
  return <I d="M12 5v14M5 12h14" />
}
function IconReset() {
  return <I d="M12 21c-4.5-2.5-8-6-8-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 11c0 4-3.5 7.5-8 10z" />
}
