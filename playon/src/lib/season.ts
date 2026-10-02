import type { ActivitySession, AppData, Season } from './types'
import { addDays, startOfWeek } from './dates'
import { avg } from './insights'
import { currentSeason } from './store'

export interface WeekSlot {
  index: number
  start: Date
  sessions: ActivitySession[]
  isCurrent: boolean
  isFuture: boolean
}

export function seasonWeeks(season: Season, sessions: ActivitySession[], now = new Date()): WeekSlot[] {
  const start = new Date(season.startDate)
  const thisWeek = startOfWeek(now).getTime()
  const weeks: WeekSlot[] = []
  for (let i = 0; i < 12; i++) {
    const ws = addDays(start, i * 7)
    const we = addDays(ws, 7)
    weeks.push({
      index: i,
      start: ws,
      sessions: sessions.filter((s) => {
        const t = new Date(s.date).getTime()
        return t >= ws.getTime() && t < we.getTime()
      }),
      isCurrent: ws.getTime() === thisWeek,
      isFuture: ws.getTime() > thisWeek,
    })
  }
  return weeks
}

export function seasonSummary(d: AppData, now = new Date()) {
  const season = currentSeason(d)
  if (!season) return null
  const start = new Date(season.startDate).getTime()
  const inSeason = d.sessions.filter((s) => new Date(s.date).getTime() >= start)
  const weeks = seasonWeeks(season, inSeason, now)
  const current = weeks.find((w) => w.isCurrent)
  const sportCounts = new Map<string, number>()
  inSeason.forEach((s) => sportCounts.set(s.sport, (sportCounts.get(s.sport) ?? 0) + 1))
  const favorite = [...sportCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const weekNumber = Math.min(12, Math.max(1, Math.floor((startOfWeek(now).getTime() - start) / (7 * 86_400_000)) + 1))
  const playedWeeks = weeks.filter((w) => !w.isFuture && w.sessions.length > 0).length
  const metIntentionWeeks = weeks.filter((w) => w.sessions.length >= season.weeklyGoal).length
  return {
    season,
    weeks,
    sessions: inSeason,
    thisWeek: current?.sessions.length ?? 0,
    weekNumber,
    favorite,
    minutes: inSeason.reduce((a, s) => a + s.duration, 0),
    enjoyment: avg(inSeason.map((s) => s.enjoyment)),
    playedWeeks,
    metIntentionWeeks,
  }
}

export const MILESTONES = [1, 5, 10, 15, 25, 40, 60]
export const milestoneLabel = (n: number) => (n === 1 ? 'First session' : `${n} sessions`)
