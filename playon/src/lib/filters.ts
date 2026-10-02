import type { ActivitySession, BodyAfter, Intensity, Result, SessionType, Social } from './types'
import { BODIES, INTENSITIES, RESULTS, SESSION_TYPES, SOCIALS } from './meta'
import { LENGTHS, lengthBucket, TIMES, timeOfDay, type LengthBucket, type TimeOfDay } from './derive'
import { daysBetween } from './dates'
import type { Dimension, Insight, TraitDim } from './insights'

export type EnjoyBucket = '5' | '4' | '3' | 'low'
export type Period = '4w' | 'season' | 'all'

export interface Filters {
  sport: string[]
  enjoy: EnjoyBucket[]
  with: Social[]
  type: SessionType[]
  intensity: Intensity[]
  time: TimeOfDay[]
  length: LengthBucket[]
  result: Result[]
  body: BodyAfter[]
  period: Period
}

export type MultiKey = Exclude<keyof Filters, 'period'>

export const DEFAULT_FILTERS: Filters = {
  sport: [],
  enjoy: [],
  with: [],
  type: [],
  intensity: [],
  time: [],
  length: [],
  result: [],
  body: [],
  period: 'season',
}

export const ENJOY: { id: EnjoyBucket; label: string }[] = [
  { id: '5', label: 'Loved it' },
  { id: '4', label: 'Good' },
  { id: '3', label: 'Okay' },
  { id: 'low', label: 'Not great' },
]

export const PERIODS: { id: Period; label: string }[] = [
  { id: '4w', label: 'Last 4 weeks' },
  { id: 'season', label: 'This season' },
  { id: 'all', label: 'All time' },
]

export const enjoyBucket = (s: ActivitySession): EnjoyBucket => (s.enjoyment >= 5 ? '5' : s.enjoyment >= 4 ? '4' : s.enjoyment >= 3 ? '3' : 'low')

/** Every multi-select group, in display order, with how to read a session's value. */
export const GROUPS: { key: MultiKey; label: string; value: (s: ActivitySession) => string | undefined }[] = [
  { key: 'sport', label: 'Sport', value: (s) => s.sport },
  { key: 'enjoy', label: 'Enjoyment', value: enjoyBucket },
  { key: 'with', label: 'Played with', value: (s) => s.socialContext },
  { key: 'type', label: 'Session type', value: (s) => s.sessionType },
  { key: 'intensity', label: 'Intensity', value: (s) => s.intensity },
  { key: 'time', label: 'Time of day', value: (s) => timeOfDay(s) },
  { key: 'length', label: 'Length', value: (s) => lengthBucket(s) },
  { key: 'result', label: 'Result', value: (s) => (s.sessionType === 'match' ? s.result : undefined) },
  { key: 'body', label: 'Body after', value: (s) => s.bodyAfter },
]

/** The fixed option list for each group. Sports come from the log. */
export function optionsFor(key: MultiKey, sports: string[]): { id: string; label: string }[] {
  switch (key) {
    case 'sport':
      return sports.map((s) => ({ id: s, label: s }))
    case 'enjoy':
      return ENJOY
    case 'with':
      return SOCIALS
    case 'type':
      return SESSION_TYPES
    case 'intensity':
      return INTENSITIES
    case 'time':
      return TIMES
    case 'length':
      return LENGTHS
    case 'result':
      return RESULTS
    case 'body':
      return BODIES
  }
}

/* ---------- hash encoding ---------- */

const QUERY_KEYS: Record<MultiKey, string> = {
  sport: 'sport',
  enjoy: 'enjoy',
  with: 'with',
  type: 'type',
  intensity: 'intensity',
  time: 'time',
  length: 'length',
  result: 'result',
  body: 'body',
}

/** "sport=pickleball&enjoy=5". Defaults are left out, so the unfiltered view has a clean URL. */
export function encodeFilters(f: Filters): string {
  const parts: string[] = []
  for (const g of GROUPS) {
    const v = f[g.key] as string[]
    if (v.length) parts.push(`${QUERY_KEYS[g.key]}=${v.map((x) => encodeURIComponent(g.key === 'sport' ? x.toLowerCase() : x)).join(',')}`)
  }
  if (f.period !== DEFAULT_FILTERS.period) parts.push(`period=${f.period}`)
  return parts.join('&')
}

/** Reads a query string defensively: unknown keys and values are ignored. */
export function decodeFilters(query: string, sports: string[]): Filters {
  const out: Filters = { ...DEFAULT_FILTERS }
  if (!query) return out
  let params: URLSearchParams
  try {
    params = new URLSearchParams(query)
  } catch {
    return out
  }
  for (const g of GROUPS) {
    const raw = params.get(QUERY_KEYS[g.key])
    if (!raw) continue
    const allowed = optionsFor(g.key, sports).map((o) => o.id)
    const picked = raw
      .split(',')
      .map((x) => x.trim())
      .map((x) => (g.key === 'sport' ? allowed.find((a) => a.toLowerCase() === x.toLowerCase()) : allowed.find((a) => a === x)))
      .filter((x): x is string => !!x)
    ;(out[g.key] as string[]) = [...new Set(picked)]
  }
  const p = params.get('period')
  if (p === '4w' || p === 'season' || p === 'all') out.period = p
  return out
}

/* ---------- applying filters ---------- */

export function inPeriod(sessions: ActivitySession[], period: Period, seasonStart?: string, now = new Date()) {
  if (period === 'all') return sessions
  if (period === '4w') return sessions.filter((s) => daysBetween(new Date(s.date), now) < 28)
  if (!seasonStart) return sessions
  const t = new Date(seasonStart).getTime()
  return sessions.filter((s) => new Date(s.date).getTime() >= t)
}

/** True when the session passes every multi-select group, optionally ignoring one. */
export function passes(s: ActivitySession, f: Filters, ignore?: MultiKey) {
  return GROUPS.every((g) => {
    if (g.key === ignore) return true
    const sel = f[g.key] as string[]
    if (!sel.length) return true
    const v = g.value(s)
    return v != null && sel.includes(v)
  })
}

export const applyFilters = (periodSessions: ActivitySession[], f: Filters, ignore?: MultiKey) =>
  periodSessions.filter((s) => passes(s, f, ignore))

export interface FacetOption {
  id: string
  label: string
  count: number
  selected: boolean
}
export interface Facet {
  key: MultiKey
  label: string
  options: FacetOption[]
}

/**
 * Chip counts for each group. Each option counts the games that would match if it were
 * part of the selection, given every other group. Options with no games are hidden,
 * unless selected (so they can always be switched off).
 */
export function facets(periodSessions: ActivitySession[], f: Filters, sports: string[]): Facet[] {
  return GROUPS.map((g) => {
    const pool = applyFilters(periodSessions, f, g.key)
    const sel = f[g.key] as string[]
    const options = optionsFor(g.key, sports)
      .map((o) => ({ id: o.id, label: o.label, count: pool.filter((s) => g.value(s) === o.id).length, selected: sel.includes(o.id) }))
      .filter((o) => o.count > 0 || o.selected)
    return { key: g.key, label: g.label, options }
  }).filter((fc) => {
    // Results only appear once competitive games exist.
    if (fc.key === 'result' && !periodSessions.some((s) => s.sessionType === 'match')) return fc.options.some((o) => o.selected)
    return fc.options.length > 0
  })
}

export const activeCount = (f: Filters) => GROUPS.reduce((a, g) => a + (f[g.key] as string[]).length, 0)
export const isDefault = (f: Filters) => activeCount(f) === 0 && f.period === DEFAULT_FILTERS.period

export const toggle = (f: Filters, key: MultiKey, id: string): Filters => {
  const cur = f[key] as string[]
  return { ...f, [key]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] }
}

/* ---------- which insights still make sense ---------- */

const EXCLUDES: Partial<Record<MultiKey, Dimension[]>> = {
  sport: ['sport'],
  with: ['social'],
  type: ['competitive'],
  intensity: ['intensity'],
  time: ['time'],
  length: ['duration'],
  result: ['result'],
  body: ['body'],
}

/** Dimensions to drop: never compare the thing the player is already filtering by. */
export function excludedDimensions(f: Filters): Dimension[] {
  const out = new Set<Dimension>()
  for (const g of GROUPS) if ((f[g.key] as string[]).length) EXCLUDES[g.key]?.forEach((d) => out.add(d))
  if (f.enjoy.length) out.add('trend')
  if (f.period === '4w') out.add('trend')
  return [...out]
}

/** With an enjoyment filter on, enjoyment averages are circular, so only keep other metrics. */
export const keepInsight = (f: Filters) => (i: Insight) => !(f.enjoy.length && i.metric === 'enjoyment')

const TRAIT_EXCLUDES: Partial<Record<MultiKey, TraitDim>> = {
  sport: 'sport',
  with: 'social',
  type: 'type',
  intensity: 'intensity',
  time: 'time',
  length: 'length',
  result: 'result',
  body: 'body',
}
export function excludedTraits(f: Filters): TraitDim[] {
  return GROUPS.filter((g) => (f[g.key] as string[]).length && TRAIT_EXCLUDES[g.key]).map((g) => TRAIT_EXCLUDES[g.key]!)
}

/** "best" when only Loved it is picked, "toughest" when only Not great is. */
export function enjoyFocus(f: Filters): 'best' | 'toughest' | null {
  if (f.enjoy.length !== 1) return null
  return f.enjoy[0] === '5' ? 'best' : f.enjoy[0] === 'low' ? 'toughest' : null
}

/** Filters survive moving between screens for the rest of the visit. */
let remembered: Filters | null = null
export const rememberFilters = (f: Filters) => {
  remembered = f
}
export const rememberedFilters = () => remembered
