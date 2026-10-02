import type { ActivitySession, AppData, Social } from './types'
import { daysBetween, isWeekend } from './dates'
import { POSITIVE_MOODS, socialLabel, SOCIALS } from './meta'
import { sortedSessions } from './store'

export const MIN_SESSIONS = 5
const MIN_GROUP = 2

export const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
export const lift = (s: ActivitySession) => s.energyAfter - s.energyBefore
export const fmt1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1)
const signed = (n: number) => `${n >= 0 ? '+' : '−'}${fmt1(Math.abs(n))}`

export type Dimension = 'social' | 'duration' | 'day' | 'intensity' | 'sport' | 'competitive' | 'readiness'

export interface Group {
  key: string
  label: string
  sessions: ActivitySession[]
  enjoyment: number
  lift: number
  highlight?: boolean
}

export interface Insight {
  id: string
  dimension: Dimension
  headline: string
  /** Plain-language explanation of exactly what was compared. */
  basis: string
  metric: 'enjoyment' | 'lift' | 'count'
  groups: Group[]
  score: number
}

function group(key: string, label: string, sessions: ActivitySession[]): Group {
  return { key, label, sessions, enjoyment: avg(sessions.map((s) => s.enjoyment)), lift: avg(sessions.map(lift)) }
}

export const durationBucket = (m: number) => (m <= 60 ? 'short' : m < 90 ? 'mid' : 'long')
export const DURATION_LABEL: Record<string, string> = {
  short: 'Up to 60 min',
  mid: '61–89 min',
  long: '90 min +',
}

export function groupBy(sessions: ActivitySession[], dim: Dimension): Group[] {
  switch (dim) {
    case 'social':
      return SOCIALS.map((s) => group(s.id, s.label, sessions.filter((x) => x.socialContext === s.id))).filter(
        (g) => g.sessions.length,
      )
    case 'duration':
      return ['short', 'mid', 'long']
        .map((k) => group(k, DURATION_LABEL[k], sessions.filter((x) => durationBucket(x.duration) === k)))
        .filter((g) => g.sessions.length)
    case 'day':
      return [
        group('weekday', 'Weekdays', sessions.filter((x) => !isWeekend(new Date(x.date)))),
        group('weekend', 'Weekends', sessions.filter((x) => isWeekend(new Date(x.date)))),
      ].filter((g) => g.sessions.length)
    case 'intensity':
      return (['easy', 'moderate', 'hard'] as const)
        .map((k) => group(k, k[0].toUpperCase() + k.slice(1), sessions.filter((x) => x.intensity === k)))
        .filter((g) => g.sessions.length)
    case 'sport': {
      const sports = [...new Set(sessions.map((s) => s.sport))]
      return sports.map((sp) => group(sp, sp, sessions.filter((x) => x.sport === sp)))
    }
    default:
      return []
  }
}

const isCompetitive = (s: ActivitySession) =>
  s.socialContext === 'tournament' || (s.sessionType === 'match' && s.intensity === 'hard')

export function headlineStats(sessions: ActivitySession[]) {
  const before = avg(sessions.map((s) => s.energyBefore))
  const after = avg(sessions.map((s) => s.energyAfter))
  return {
    count: sessions.length,
    minutes: sessions.reduce((a, s) => a + s.duration, 0),
    enjoyment: avg(sessions.map((s) => s.enjoyment)),
    energyChangePct: before ? (after / before - 1) * 100 : 0,
    before,
    after,
    positiveShare: sessions.length
      ? sessions.filter((s) => POSITIVE_MOODS.includes(s.moodAfter)).length / sessions.length
      : 0,
  }
}

/**
 * Transparent, rule-based insights. Every rule needs MIN_GROUP sessions on each side
 * of the comparison and a meaningful gap, otherwise it stays silent.
 */
export function computeInsights(sessions: ActivitySession[]): Insight[] {
  if (sessions.length < MIN_SESSIONS) return []
  const out: Insight[] = []

  // 1 — who you play with
  const social = groupBy(sessions, 'social').filter((g) => g.sessions.length >= MIN_GROUP)
  if (social.length >= 2) {
    const best = [...social].sort((a, b) => b.enjoyment - a.enjoyment)[0]
    const rest = sessions.filter((s) => s.socialContext !== best.key)
    const restAvg = avg(rest.map((s) => s.enjoyment))
    const gap = best.enjoyment - restAvg
    if (gap >= 0.4) {
      const who = best.key === 'solo' ? 'on your own' : best.key === 'tournament' ? 'in tournaments' : `with ${socialLabel(best.key as Social).toLowerCase()}`
      out.push({
        id: 'social',
        dimension: 'social',
        headline: `You seem to enjoy your sessions most when you play ${who}.`,
        basis: `${best.sessions.length} sessions ${who} averaged ${fmt1(best.enjoyment)}/5 enjoyment, compared with ${fmt1(restAvg)}/5 across your other ${rest.length}.`,
        metric: 'enjoyment',
        groups: groupBy(sessions, 'social').map((g) => ({ ...g, highlight: g.key === best.key })),
        score: gap,
      })
    }
  }

  // 2 — session length and energy
  const short = sessions.filter((s) => durationBucket(s.duration) === 'short')
  const long = sessions.filter((s) => durationBucket(s.duration) === 'long')
  if (short.length >= MIN_GROUP && long.length >= MIN_GROUP) {
    const ls = avg(short.map(lift))
    const ll = avg(long.map(lift))
    const es = avg(short.map((s) => s.enjoyment))
    const el = avg(long.map((s) => s.enjoyment))
    if (ls - ll >= 0.5) {
      out.push({
        id: 'duration-energy',
        dimension: 'duration',
        headline: 'Your energy tends to be higher after shorter sessions.',
        basis: `After sessions of an hour or less your energy moved ${signed(ls)} points on average (out of 5). After 90+ minute sessions it moved ${signed(ll)}.`,
        metric: 'lift',
        groups: groupBy(sessions, 'duration').map((g) => ({ ...g, highlight: g.key === 'short' })),
        score: (ls - ll) / 2,
      })
    } else if (es - el >= 0.4) {
      out.push({
        id: 'duration-enjoy',
        dimension: 'duration',
        headline: 'Your shorter sessions have been your most enjoyable lately.',
        basis: `Sessions of an hour or less averaged ${fmt1(es)}/5; sessions of 90+ minutes averaged ${fmt1(el)}/5.`,
        metric: 'enjoyment',
        groups: groupBy(sessions, 'duration').map((g) => ({ ...g, highlight: g.key === 'short' })),
        score: es - el,
      })
    } else if (el - es >= 0.4) {
      out.push({
        id: 'duration-long',
        dimension: 'duration',
        headline: 'Your longer sessions have tended to be the ones you enjoy most.',
        basis: `90+ minute sessions averaged ${fmt1(el)}/5; sessions of an hour or less averaged ${fmt1(es)}/5.`,
        metric: 'enjoyment',
        groups: groupBy(sessions, 'duration').map((g) => ({ ...g, highlight: g.key === 'long' })),
        score: el - es,
      })
    }
  }

  // 3 — competitive sessions and frustration
  const comp = sessions.filter(isCompetitive)
  const compLow = comp.filter((s) => s.moodAfter === 'frustrated' || s.moodAfter === 'drained')
  if (compLow.length >= 2) {
    const nonComp = sessions.filter((s) => !isCompetitive(s))
    out.push({
      id: 'competitive',
      dimension: 'competitive',
      headline: `You reported feeling frustrated or drained after ${compLow.length} of your ${comp.length} most competitive sessions.`,
      basis: `“Most competitive” means tournaments or hard-fought matches. Those averaged ${fmt1(avg(comp.map((s) => s.enjoyment)))}/5 enjoyment, against ${fmt1(avg(nonComp.map((s) => s.enjoyment)))}/5 for everything else.`,
      metric: 'enjoyment',
      groups: [
        { ...group('competitive', 'Competitive', comp), highlight: true },
        group('other', 'Everything else', nonComp),
      ].filter((g) => g.sessions.length),
      score: 0.6 + compLow.length * 0.1,
    })
  }

  // 4 — weekends
  const days = groupBy(sessions, 'day')
  if (days.length === 2 && days.every((g) => g.sessions.length >= MIN_GROUP)) {
    const [wd, we] = days
    const gap = we.enjoyment - wd.enjoyment
    if (Math.abs(gap) >= 0.4) {
      const best = gap > 0 ? we : wd
      out.push({
        id: 'day',
        dimension: 'day',
        headline: `Your most enjoyable sessions have been on ${best.label.toLowerCase()}.`,
        basis: `Weekend sessions averaged ${fmt1(we.enjoyment)}/5 (${we.sessions.length} sessions); weekday sessions ${fmt1(wd.enjoyment)}/5 (${wd.sessions.length}).`,
        metric: 'enjoyment',
        groups: days.map((g) => ({ ...g, highlight: g.key === best.key })),
        score: Math.abs(gap) * 0.8,
      })
    }
  }

  // 5 — low-energy days
  const lowStart = sessions.filter((s) => s.energyBefore <= 2)
  if (lowStart.length >= MIN_GROUP) {
    const l = avg(lowStart.map(lift))
    if (l >= 1) {
      out.push({
        id: 'readiness',
        dimension: 'readiness',
        headline: 'On low-energy days, playing has usually lifted you rather than drained you.',
        basis: `You started ${lowStart.length} sessions with low energy (2/5 or less). On average you finished ${signed(l)} points higher.`,
        metric: 'lift',
        groups: [
          { ...group('low', 'Started low', lowStart), highlight: true },
          group('rest', 'Started steady or higher', sessions.filter((s) => s.energyBefore > 2)),
        ].filter((g) => g.sessions.length),
        score: l * 0.4,
      })
    }
  }

  // 6 — intensity
  const ints = groupBy(sessions, 'intensity').filter((g) => g.sessions.length >= MIN_GROUP)
  const hard = ints.find((g) => g.key === 'hard')
  const softer = sessions.filter((s) => s.intensity !== 'hard')
  if (hard && softer.length >= MIN_GROUP) {
    const gap = avg(softer.map((s) => s.enjoyment)) - hard.enjoyment
    if (Math.abs(gap) >= 0.5) {
      out.push({
        id: 'intensity',
        dimension: 'intensity',
        headline:
          gap > 0
            ? 'Easy and moderate sessions have felt better to you than flat-out ones.'
            : 'You seem to enjoy it most when you really push.',
        basis: `Hard sessions averaged ${fmt1(hard.enjoyment)}/5; easy and moderate ones ${fmt1(avg(softer.map((s) => s.enjoyment)))}/5.`,
        metric: 'enjoyment',
        groups: groupBy(sessions, 'intensity').map((g) => ({ ...g, highlight: gap > 0 ? g.key !== 'hard' : g.key === 'hard' })),
        score: Math.abs(gap) * 0.7,
      })
    }
  }

  return out.sort((a, b) => b.score - a.score)
}

/** The single sentence at the top of the Game Map. Combines the two strongest compatible patterns. */
export function strongestPattern(insights: Insight[]): string | null {
  if (!insights.length) return null
  const social = insights.find((i) => i.id === 'social')
  const dur = insights.find((i) => i.id.startsWith('duration') && i.id !== 'duration-long')
  if (social && dur) {
    const best = social.groups.find((g) => g.highlight)
    const who =
      best?.key === 'solo' ? 'on your own' : best?.key === 'tournament' ? 'in tournaments' : `with ${best?.label.toLowerCase()}`
    return `You seem to get the most out of shorter sessions ${who}.`
  }
  return insights[0].headline
}

export function daysSinceLastSession(d: AppData, now = new Date()) {
  const s = sortedSessions(d)
  if (!s.length) return null
  return daysBetween(new Date(s[s.length - 1].date), now)
}
