import { useEffect, useId, useState, type ReactNode, type ButtonHTMLAttributes } from 'react'

export function cx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ')
}

/* ---------- routing ---------- */

export type Route = 'welcome' | 'onboarding' | 'home' | 'play' | 'season' | 'insights' | 'reset' | 'profile'

type Loc = { route: Route; param?: string }

const parseHash = (): Loc => {
  let h = ''
  try {
    h = window.location.hash
  } catch {
    /* sandboxed frame */
  }
  const [r, param] = h.replace(/^#\/?/, '').split('/')
  return { route: (r || 'home') as Route, param }
}

// The in-memory location is the source of truth; the URL hash is synced when the
// host allows it, so routing also works inside sandboxed frames.
let current: Loc = parseHash()
const routeListeners = new Set<(l: Loc) => void>()
const emit = () => {
  routeListeners.forEach((l) => l(current))
  window.scrollTo({ top: 0 })
}

export const currentRoute = () => current.route

export function useRoute() {
  const [loc, setLoc] = useState(current)
  useEffect(() => {
    routeListeners.add(setLoc)
    const onHash = () => {
      const next = parseHash()
      if (next.route === current.route && next.param === current.param) return
      current = next
      emit()
    }
    window.addEventListener('hashchange', onHash)
    return () => {
      routeListeners.delete(setLoc)
      window.removeEventListener('hashchange', onHash)
    }
  }, [])
  return loc
}

export const go = (route: Route, param?: string) => {
  current = { route, param }
  try {
    history.pushState(null, '', `#/${route}${param ? `/${param}` : ''}`)
  } catch {
    /* URL updates blocked; in-memory routing still works */
  }
  emit()
}

/** onClick for <a href="#/x"> links so they route in-app. */
export const navTo = (route: Route) => (e: { preventDefault: () => void }) => {
  e.preventDefault()
  go(route)
}

/* ---------- buttons ---------- */

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'quiet' | 'light'; size?: 'md' | 'lg' }

export function Button({ variant = 'primary', size = 'md', className, ...p }: BtnProps) {
  return (
    <button
      {...p}
      className={cx(
        'press inline-flex items-center justify-center gap-2 rounded-full font-medium disabled:cursor-not-allowed disabled:opacity-40',
        size === 'lg' ? 'h-14 px-8 text-[15px]' : 'h-11 px-5 text-sm',
        variant === 'primary' && 'bg-forest text-paper hover:bg-forest-2',
        variant === 'light' && 'bg-paper text-forest hover:bg-white',
        variant === 'ghost' && 'border border-line-2 bg-transparent text-ink hover:border-forest hover:bg-paper',
        variant === 'quiet' && 'px-2 text-ink-2 underline decoration-line-2 underline-offset-4 hover:text-ink hover:decoration-ink',
        className,
      )}
    />
  )
}

export function LinkArrow({ children, onClick, className }: { children: ReactNode; onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cx('press group inline-flex items-center gap-2 text-sm font-medium text-forest', className)}
    >
      <span className="underline decoration-line-2 underline-offset-[6px] group-hover:decoration-forest">{children}</span>
      <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
    </button>
  )
}

/* ---------- choice chips (single or multi) ---------- */

export function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
  multi,
  size = 'md',
  hideLabel,
}: {
  label: string
  options: { id: T; label: ReactNode; sub?: string }[]
  value: T | T[] | null
  onChange: (v: T) => void
  multi?: boolean
  size?: 'md' | 'lg'
  hideLabel?: boolean
}) {
  const selected = (id: T) => (Array.isArray(value) ? value.includes(id) : value === id)
  return (
    <fieldset>
      <legend className={cx('mb-3', hideLabel ? 'sr-only' : 'eyebrow')}>{label}</legend>
      <div className="flex flex-wrap gap-2" role={multi ? 'group' : 'radiogroup'} aria-label={label}>
        {options.map((o) => {
          const on = selected(o.id)
          return (
            <button
              key={o.id}
              type="button"
              role={multi ? 'checkbox' : 'radio'}
              aria-checked={on}
              onClick={() => onChange(o.id)}
              className={cx(
                'press rounded-full border text-left',
                size === 'lg' ? 'px-5 py-3 text-[15px]' : 'px-4 py-2 text-sm',
                on
                  ? 'border-forest bg-forest text-paper'
                  : 'border-line-2 bg-paper/60 text-ink hover:border-ink-3 hover:bg-paper',
              )}
            >
              {o.label}
              {o.sub && <span className={cx('block text-xs', on ? 'text-paper/70' : 'text-ink-3')}>{o.sub}</span>}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

/* ---------- stars ---------- */

export function Stars({ value, size = 16, label }: { value: number; size?: number; label?: string }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={label ?? `${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} fill={value >= i ? 1 : value >= i - 0.5 ? 0.5 : 0} />
      ))}
    </span>
  )
}

function Star({ size, fill }: { size: number; fill: number }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id={id}>
          <stop offset={fill} stopColor="var(--color-ember)" />
          <stop offset={fill} stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.8l2.7 5.9 6.4.7-4.8 4.3 1.4 6.3L12 16.8 6.3 20l1.4-6.3L2.9 9.4l6.4-.7z"
        fill={`url(#${id})`}
        stroke="var(--color-ember)"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const words = ['Not for me today', 'It was okay', 'Pretty good', 'Really enjoyed it', 'Loved it']
  return (
    <div>
      <div className="flex gap-1 sm:gap-3" role="radiogroup" aria-label="Enjoyment, 1 to 5">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i}: ${words[i - 1]}`}
            onClick={() => onChange(i)}
            className="press grid h-12 w-12 place-items-center rounded-full hover:bg-ember-soft"
          >
            <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden className={cx('transition-transform duration-300', value >= i && 'scale-110')}>
              <path
                d="M12 2.8l2.7 5.9 6.4.7-4.8 4.3 1.4 6.3L12 16.8 6.3 20l1.4-6.3L2.9 9.4l6.4-.7z"
                fill={value >= i ? 'var(--color-ember)' : 'transparent'}
                stroke={value >= i ? 'var(--color-ember)' : 'var(--color-line-2)'}
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}
      </div>
      <p className="mt-2 h-6 font-medium text-ink-2" aria-live="polite">
        {value ? words[value - 1] : ''}
      </p>
    </div>
  )
}

/* ---------- labelled 1–5 slider ---------- */

export function Scale({
  label,
  value,
  onChange,
  low = 'Low',
  high = 'High',
  words,
  hideLabel,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  low?: string
  high?: string
  words?: string[]
  hideLabel?: boolean
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <label className={hideLabel ? 'sr-only' : 'eyebrow'} htmlFor={`sc-${label}`}>
          {label}
        </label>
        {words && <span className="text-sm font-medium text-ink-2">{words[value - 1]}</span>}
      </div>
      <input
        id={`sc-${label}`}
        className="slider"
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        aria-valuetext={words ? words[value - 1] : String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="flex justify-between text-xs text-ink-3">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  )
}

/* ---------- misc ---------- */

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border border-dashed border-ember/60 bg-ember-soft/60 px-2.5 py-1 text-[11px] font-medium tracking-wide text-[#8a3a12]',
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-ember" aria-hidden />
      Sample data
    </span>
  )
}

export function PageHeader({ title, sub, aside }: { title: ReactNode; sub?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{title}</h1>
        {sub && <p className="mt-2 max-w-xl text-ink-2">{sub}</p>}
      </div>
      {aside}
    </header>
  )
}

/** A quiet bordered surface for grouping one idea. */
export function Card({ children, className, tone }: { children: ReactNode; className?: string; tone?: string }) {
  return <section className={cx('rounded-3xl border border-line p-5 sm:p-6', tone ?? 'bg-paper', className)}>{children}</section>
}

export function Rule({ className }: { className?: string }) {
  return <hr className={cx('border-0 border-t border-line', className)} />
}

export function Arrow({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function useReducedMotion() {
  const [r, setR] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  useEffect(() => {
    const m = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!m) return
    const on = () => setR(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return r
}

/** Animated count-up for hero numbers. */
export function useCountUp(target: number, ms = 1100) {
  const reduced = useReducedMotion()
  const [v, setV] = useState(reduced ? target : 0)
  useEffect(() => {
    if (reduced) {
      setV(target)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      setV(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms, reduced])
  return v
}
