import type { ActivitySession } from './types'
import { daysBetween } from './dates'

/*
 * Derived facts about a session. None of these ask the player for anything new:
 * they come from the timestamp, the length and the rest of the log.
 */

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'
export const TIMES: { id: TimeOfDay; label: string }[] = [
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
  { id: 'night', label: 'Night' },
]
export const timeLabel = (t: TimeOfDay) => TIMES.find((x) => x.id === t)!.label

/** Morning 5–12, afternoon 12–17, evening 17–21, night otherwise. Uses local time. */
export function timeOfDay(s: Pick<ActivitySession, 'date'>): TimeOfDay {
  const h = new Date(s.date).getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 21) return 'evening'
  return 'night'
}

export type LengthBucket = 'under45' | '45to90' | 'over90'
export const LENGTHS: { id: LengthBucket; label: string; phrase: string }[] = [
  { id: 'under45', label: 'Under 45 min', phrase: 'under 45 minutes' },
  { id: '45to90', label: '45 to 90 min', phrase: '45 to 90 minutes' },
  { id: 'over90', label: 'Over 90 min', phrase: 'over 90 minutes' },
]
export const lengthLabel = (b: LengthBucket) => LENGTHS.find((x) => x.id === b)!.label

export function lengthBucket(s: Pick<ActivitySession, 'duration'>): LengthBucket {
  if (s.duration < 45) return 'under45'
  if (s.duration <= 90) return '45to90'
  return 'over90'
}

export interface SessionContext {
  /** Whole days since the previous logged game; null for the first one. */
  daysSinceLastGame: number | null
  /** Games in the trailing 7 days, this one included. */
  weeklyLoad: number
}

/**
 * Context that depends on the whole history, not just a filtered slice. Build it once
 * from every session, then look sessions up by id while analysing any subset.
 */
export function buildContext(all: ActivitySession[]): Map<string, SessionContext> {
  const sorted = [...all].sort((a, b) => a.date.localeCompare(b.date))
  const out = new Map<string, SessionContext>()
  sorted.forEach((s, i) => {
    const t = new Date(s.date)
    const prev = sorted[i - 1]
    let load = 1
    for (let j = i - 1; j >= 0; j--) {
      if (daysBetween(new Date(sorted[j].date), t) >= 7) break
      load++
    }
    out.set(s.id, { daysSinceLastGame: prev ? daysBetween(new Date(prev.date), t) : null, weeklyLoad: load })
  })
  return out
}

export const daysSinceLastGame = (s: ActivitySession, all: ActivitySession[]) =>
  buildContext(all).get(s.id)?.daysSinceLastGame ?? null

export const weeklyLoad = (s: ActivitySession, all: ActivitySession[]) => buildContext(all).get(s.id)?.weeklyLoad ?? 1

/** A week with this many games or more counts as a heavy week. */
export const HIGH_LOAD = 4

export interface Trend {
  recent: ActivitySession[]
  earlier: ActivitySession[]
  recentAvg: number
  earlierAvg: number
  /** recentAvg minus earlierAvg; negative means enjoyment has dropped. */
  delta: number
}

/** Recent = games in the last `windowDays` days; earlier = everything before. */
export function enjoymentTrend(sessions: ActivitySession[], now = new Date(), windowDays = 28): Trend {
  const recent = sessions.filter((s) => daysBetween(new Date(s.date), now) < windowDays)
  const earlier = sessions.filter((s) => daysBetween(new Date(s.date), now) >= windowDays)
  const recentAvg = avg(recent.map((s) => s.enjoyment))
  const earlierAvg = avg(earlier.map((s) => s.enjoyment))
  return { recent, earlier, recentAvg, earlierAvg, delta: recent.length && earlier.length ? recentAvg - earlierAvg : 0 }
}
