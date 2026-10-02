import { Wordmark } from '../App'
import { Arrow, Button, go } from '../components/ui'
import { actions, getData } from '../lib/store'
import { buildDemo } from '../lib/demo'

export default function Welcome() {
  const existing = getData().user

  const demo = () => {
    actions.replaceAll(buildDemo())
    go('home')
  }

  return (
    <div className="min-h-dvh bg-cream">
      {/* hero */}
      <section className="relative overflow-hidden bg-forest text-paper">
        <CourtLines />
        <div className="relative mx-auto flex min-h-[92dvh] max-w-6xl flex-col px-6 pb-14 pt-8 sm:px-10 lg:min-h-[86dvh]">
          <header className="flex items-center justify-between">
            <Wordmark light />
            {existing && (
              <button onClick={() => go('home')} className="text-sm text-paper/80 underline underline-offset-4 hover:text-paper">
                Back to my season
              </button>
            )}
          </header>

          <div className="mt-auto max-w-3xl pt-24">
            <p className="eyebrow rise text-sage" style={{ animationDelay: '80ms' }}>
              A wellness companion for people who love to play
            </p>
            <h1 className="mt-6 font-serif text-[clamp(3.2rem,9vw,7.5rem)] font-light leading-[0.92]">
              <span className="rise block" style={{ animationDelay: '160ms' }}>
                Keep playing.
              </span>
              <span className="rise block italic text-sage" style={{ animationDelay: '320ms' }}>
                Just play differently.
              </span>
            </h1>
            <p className="rise mt-8 max-w-xl text-lg leading-relaxed text-paper/80" style={{ animationDelay: '480ms' }}>
              Your game. Your pace. Your well-being. PLAY ON helps you understand how playing makes you feel — and
              build a routine around the sports you love that actually lasts.
            </p>
            <div className="rise mt-10 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: '620ms' }}>
              <Button variant="light" size="lg" onClick={() => go('onboarding')}>
                Start your season <Arrow />
              </Button>
              <Button
                size="lg"
                onClick={demo}
                className="border border-paper/30 bg-transparent text-paper hover:border-paper hover:bg-paper/5"
              >
                Explore a demo
              </Button>
            </div>
            <p className="rise mt-4 text-xs text-paper/55" style={{ animationDelay: '700ms' }}>
              The demo loads a clearly-labelled sample season for Alex, a recreational pickleball player. Everything stays on
              this device.
            </p>
          </div>
        </div>
      </section>

      {/* story */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:px-10 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          <div>
            <p className="eyebrow">Why PLAY ON?</p>
            <h2 className="mt-4 font-serif text-4xl font-light leading-tight sm:text-5xl">
              Wellness isn't always about doing <em>more</em>.
            </h2>
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-ink-2">
            <p>
              Most fitness apps ask how much you did. Steps, streaks, personal bests. But you didn't pick up a paddle to
              close a ring — you did it because it felt good.
            </p>
            <p>
              PLAY ON asks a different question: <span className="font-serif italic text-ink">how did playing affect you?</span>{' '}
              Over a season, your answers turn into something useful — a map of what keeps you coming back.
            </p>
          </div>
        </div>

        <ol className="mt-20 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">
          {[
            ['01', 'How you play', 'Log a session in under a minute. Sport, time, who you played with.'],
            ['02', 'How you feel', 'A short, honest reflection afterwards. Energy, mood, enjoyment.'],
            ['03', 'What keeps you coming back', 'Your Game Map shows the patterns — drawn only from what you logged.'],
          ].map(([n, t, d]) => (
            <li key={n} className="bg-paper p-8">
              <span className="font-serif text-sm italic text-ember">{n}</span>
              <h3 className="mt-6 font-serif text-2xl">{t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">{d}</p>
            </li>
          ))}
        </ol>

        <div className="mt-20 grid gap-8 border-t border-line pt-10 text-sm text-ink-2 sm:grid-cols-3">
          <p>
            <span className="block font-medium text-ink">No punishing streaks.</span>
            Miss a week? Your season is still here when you come back.
          </p>
          <p>
            <span className="block font-medium text-ink">No guesswork.</span>
            Every insight shows the sessions it came from. Not enough data? We'll say so.
          </p>
          <p>
            <span className="block font-medium text-ink">Not a medical app.</span>
            Observations about your own play — never diagnoses or advice.
          </p>
        </div>
      </section>
    </div>
  )
}

function CourtLines() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.16]"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <g fill="none" stroke="var(--color-sage)" strokeWidth="1.5">
        <rect className="draw" x="560" y="80" width="560" height="640" />
        <line className="draw" x1="560" y1="400" x2="1120" y2="400" style={{ animationDelay: '0.3s' }} />
        <line className="draw" x1="560" y1="300" x2="1120" y2="300" style={{ animationDelay: '0.5s' }} />
        <line className="draw" x1="560" y1="500" x2="1120" y2="500" style={{ animationDelay: '0.5s' }} />
        <line className="draw" x1="840" y1="80" x2="840" y2="300" style={{ animationDelay: '0.7s' }} />
        <line className="draw" x1="840" y1="500" x2="840" y2="720" style={{ animationDelay: '0.7s' }} />
        <circle className="draw" cx="300" cy="620" r="180" style={{ animationDelay: '0.2s' }} />
      </g>
    </svg>
  )
}
