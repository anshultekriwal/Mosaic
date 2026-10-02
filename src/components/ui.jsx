// Shared layout and controls.

export function EmergencyLink() {
  return (
    <a
      href="tel:112"
      className="flex min-h-11 items-center justify-center px-4 text-center text-sm text-haze underline decoration-haze/40 underline-offset-4"
    >
      Severe chest pain or feel faint? Call 112
    </a>
  )
}

/**
 * Full-height session screen: never scrolls. `onLeave` shows a quiet exit
 * link top-left; `emergency` pins the 112 link to the bottom.
 */
export function SessionScreen({ children, onLeave, emergency = true, stepKey }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-12 shrink-0 items-center px-3">
        {onLeave && (
          <button
            type="button"
            onClick={onLeave}
            className="min-h-11 rounded-full px-3 text-sm text-haze/70"
          >
            Leave
          </button>
        )}
      </div>
      <main key={stepKey} className="settle flex min-h-0 flex-1 flex-col items-center justify-center px-6">
        {children}
      </main>
      {emergency && <EmergencyLink />}
    </div>
  )
}

/** Scrollable page for the non-session screens (log, about, preview). */
export function Page({ title, onBack, children }) {
  return (
    <div className="mx-auto min-h-dvh max-w-xl px-6 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),2rem)]">
      <div className="flex h-12 items-center">
        <button type="button" onClick={onBack} className="-ml-3 min-h-11 rounded-full px-3 text-haze">
          ← Back
        </button>
      </div>
      <h1 className="mt-4 mb-8 text-3xl font-semibold tracking-tight">{title}</h1>
      <div className="settle">{children}</div>
    </div>
  )
}

export function BigButton({ children, onClick, variant = 'primary', className = '', ...rest }) {
  const styles = {
    primary: 'bg-calm text-night shadow-[0_0_60px_-10px] shadow-calm/50',
    soft: 'bg-tide text-mist',
    ghost: 'text-haze',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-16 w-full max-w-sm rounded-3xl px-6 py-5 text-2xl font-semibold transition-transform duration-300 active:scale-[0.98] ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function QuietLink({ children, ...rest }) {
  const Tag = rest.href ? 'a' : 'button'
  return (
    <Tag
      {...(Tag === 'button' ? { type: 'button' } : {})}
      className="min-h-11 rounded-full px-4 text-base text-haze underline decoration-haze/30 underline-offset-4"
      {...rest}
    >
      {children}
    </Tag>
  )
}
