import { useEffect, useId, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Button, cx } from './ui'
import { activeCount, DEFAULT_FILTERS, PERIODS, toggle, type Facet, type Filters, type MultiKey, type Period } from '../lib/filters'

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  /** Facets and match count for any filter state, so the sheet can preview before applying. */
  compute: (f: Filters) => { facets: Facet[]; count: number }
}

/**
 * Desktop: grouped chip sections in one horizontally scrolling row, applied instantly.
 * Mobile: a Filters button that opens a bottom sheet with a live count and Apply.
 */
export default function FilterBar({ filters, onChange, compute }: Props) {
  const { facets } = compute(filters)
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const n = activeCount(filters)

  return (
    <div>
      {/* desktop */}
      <div className="hidden md:block">
        <div className="flex items-start gap-6">
          <PeriodControl value={filters.period} onChange={(p) => onChange({ ...filters, period: p })} />
          <div className="relative min-w-0 flex-1">
            <div className="no-scrollbar flex gap-0 overflow-x-auto pb-2" role="group" aria-label="Filter games">
              {facets.map((fc, i) => (
                <FacetGroup
                  key={fc.key}
                  facet={fc}
                  onToggle={(id) => onChange(toggle(filters, fc.key, id))}
                  className={cx('shrink-0 px-5', i > 0 && 'border-l border-line', i === 0 && 'pl-0')}
                />
              ))}
            </div>
            <span className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-cream to-transparent" aria-hidden />
          </div>
        </div>
      </div>

      {/* mobile */}
      <div className="flex items-center gap-2 md:hidden">
        <button
          ref={trigger}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="press inline-flex h-11 items-center gap-2 rounded-full border border-line-2 bg-paper px-4 text-sm font-medium"
        >
          <FunnelIcon />
          Filters
          {n > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-forest px-1.5 text-[11px] text-paper tabular">{n}</span>}
        </button>
        <span className="truncate text-sm text-ink-2">{PERIODS.find((p) => p.id === filters.period)!.label}</span>
      </div>

      {open && (
        <Sheet
          initial={filters}
          compute={compute}
          onApply={(f) => {
            onChange(f)
            setOpen(false)
          }}
          onClose={() => setOpen(false)}
          returnFocus={trigger}
        />
      )}
    </div>
  )
}

function PeriodControl({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <fieldset className="shrink-0">
      <legend className="eyebrow mb-2 text-[10px]">Period</legend>
      <div className="flex rounded-full border border-line-2 bg-paper/60 p-1 text-sm" role="radiogroup" aria-label="Period">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={value === p.id}
            onClick={() => onChange(p.id)}
            className={cx('press whitespace-nowrap rounded-full px-3 py-1.5', value === p.id ? 'bg-forest text-paper' : 'text-ink-2 hover:text-ink')}
          >
            {p.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function FacetGroup({ facet, onToggle, className, wrap }: { facet: Facet; onToggle: (id: string) => void; className?: string; wrap?: boolean }) {
  const id = useId()
  return (
    <div className={className} role="group" aria-labelledby={id}>
      <p id={id} className="eyebrow mb-2 text-[10px]">
        {facet.label}
      </p>
      <div className={cx('flex gap-1.5', wrap && 'flex-wrap')}>
        {facet.options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={o.selected}
            aria-label={`${o.label}, ${o.count} game${o.count === 1 ? '' : 's'}`}
            onClick={() => onToggle(o.id)}
            className={cx(
              'press inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm',
              o.selected ? 'border-forest bg-forest text-paper' : 'border-line-2 bg-paper/60 text-ink hover:border-ink-3 hover:bg-paper',
            )}
          >
            {o.label}
            <span className={cx('text-xs tabular', o.selected ? 'text-paper/70' : 'text-ink-3')} aria-hidden>
              {o.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Sheet({
  initial,
  compute,
  onApply,
  onClose,
  returnFocus,
}: {
  initial: Filters
  compute: Props['compute']
  onApply: (f: Filters) => void
  onClose: () => void
  returnFocus: RefObject<HTMLButtonElement | null>
}) {
  const [draft, setDraft] = useState(initial)
  const { facets, count } = compute(draft)
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.querySelector<HTMLElement>('button, [href], input')?.focus()
    const ret = returnFocus.current
    return () => {
      document.body.style.overflow = prevOverflow
      ret?.focus()
    }
  }, [returnFocus])

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab' || !panel.current) return
    const els = [...panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input')]
    if (!els.length) return
    const first = els[0]
    const last = els[els.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  // Portal to <body>: the page's fade-in creates a stacking context that would put the
  // bottom nav on top of the sheet and hide the Apply button.
  return createPortal(
    <div className="fixed inset-0 z-[60] md:hidden" onKeyDown={onKeyDown}>
      <div className="fade absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="sheet-up absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col supports-[height:100dvh]:max-h-[88dvh] rounded-t-[1.75rem] bg-paper shadow-[0_-20px_50px_-20px_rgba(30,58,45,0.4)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
          <h2 id={titleId} className="font-serif text-2xl">
            Filters
          </h2>
          <button onClick={onClose} className="press rounded-full px-3 py-1.5 text-sm text-ink-2 underline underline-offset-4">
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5">
          <PeriodControl value={draft.period} onChange={(p) => setDraft({ ...draft, period: p })} />
          {facets.map((fc) => (
            <FacetGroup key={fc.key} facet={fc} wrap onToggle={(id) => setDraft(toggle(draft, fc.key as MultiKey, id))} />
          ))}
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line bg-paper px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button onClick={() => setDraft(DEFAULT_FILTERS)} className="press text-sm text-ink-2 underline underline-offset-4">
            Clear all
          </button>
          <Button size="lg" onClick={() => onApply(draft)} aria-live="polite">
            Apply · {count} game{count === 1 ? '' : 's'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function FunnelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  )
}
