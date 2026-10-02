import type { ActivitySession, AppData, PlayerType, Social } from './types'
import { daysBetween, isWeekend } from './dates'
import { POSITIVE_MOODS, RESULTS, BODIES, SESSION_TYPES, INTENSITIES, socialLabel, SOCIALS, sessionTypeLabel } from './meta'
import { sortedSessions } from './store'
import {
  buildContext,
  enjoymentTrend,
  HIGH_LOAD,
  LENGTHS,
  lengthBucket,
  TIMES,
  timeOfDay,
  type SessionContext,
} from './derive'

export const MIN_SESSIONS = 5
export const MIN_GROUP = 2

export const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
export const lift = (s: ActivitySession) => s.energyAfter - s.energyBefore
export const fmt1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1)
const signed = (n: number) => `${n >= 0 ? '+' : '−'}${fmt1(Math.abs(n))}`
const games = (n: number) => `${n} game${n === 1 ? '' : 's'}`

export type Dimension =
  | 'social'
  | 'duration'
  | 'day'
  | 'intensity'
  | 'sport'
  | 'competitive'
  | 'readiness'
  | 'time'
  | 'rest'
  | 'load'
  | 'result'
  | 'body'
  | 'trend'

export interface Group {
  key: string
  label: string
  sessions: ActivitySession[]
  enjoyment: number
  lift: number
  /** For share metrics: the fraction of sessions with the trait (0–1). */
  share?: number
  highlight?: boolean
}

export interface Insight {
  id: string
  dimension: Dimension
  headline: string
  /** Plain-language explanation of exactly what was compared. */
  basis: string
  metric: 'enjoyment' | 'lift' | 'share'
  /** What the share counts, when metric is 'share'. */
  shareOf?: string
  groups: Group[]
  score: number
  /** A pattern that is worth gently flagging (drift, heavy weeks, soreness). */
  warning?: boolean
}

function group(key: string, label: string, sessions: ActivitySession[]): Group {
  return { key, label, sessions, enjoyment: avg(sessions.map((s) => s.enjoyment)), lift: avg(sessions.map(lift)) }
}

export const durationBucket = (m: number) => (m <= 60 ? 'short' : m < 90 ? 'mid' : 'long')
export const DURATION_LABEL: Record<string, string> = {
  short: 'Up to 60 min',
  mid: '61 to 89 min',
  long: '90 min +',
}

export function groupBy(sessions: ActivitySession[], dim: Dimension): Group[] {
  const nonEmpty = (gs: Group[]) => gs.filter((g) => g.sessions.length)
  switch (dim) {
    case 'social':
      return nonEmpty(SOCIALS.map((s) => group(s.id, s.label, sessions.filter((x) => x.socialContext === s.id))))
    case 'duration':
      return nonEmpty(
        ['short', 'mid', 'long'].map((k) => group(k, DURATION_LABEL[k], sessions.filter((x) => durationBucket(x.duration) === k))),
      )
    case 'day':
      return nonEmpty([
        group('weekday', 'Weekdays', sessions.filter((x) => !isWeekend(new Date(x.date)))),
        group('weekend', 'Weekends', sessions.filter((x) => isWeekend(new Date(x.date)))),
      ])
    case 'intensity':
      return nonEmpty(INTENSITIES.map((i) => group(i.id, i.label, sessions.filter((x) => x.intensity === i.id))))
    case 'sport': {
      const sports = [...new Set(sessions.map((s) => s.sport))]
      return sports.map((sp) => group(sp, sp, sessions.filter((x) => x.sport === sp)))
    }
    case 'time':
      return nonEmpty(TIMES.map((t) => group(t.id, t.label, sessions.filter((x) => timeOfDay(x) === t.id))))
    default:
      return []
  }
}

const isCompetitive = (s: ActivitySession) =>
  s.socialContext === 'tournament' || (s.sessionType === 'match' && s.intensity === 'hard')

export const socialPhrase = (k: Social) =>
  k === 'solo' ? 'on your own' : k === 'tournament' ? 'in tournaments' : k === 'club' ? 'at the club' : k === 'other' ? 'with others' : `with ${socialLabel(k).toLowerCase()}`

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

export interface InsightOptions {
  /** The full history, so rest gaps and weekly load stay true when `sessions` is a filtered slice. */
  all?: ActivitySession[]
  /** Dimensions to leave out, e.g. the one the player is filtering by. */
  exclude?: Dimension[]
  now?: Date
}

/**
 * Transparent, rule-based insights that run on any subset of sessions. Every rule needs
 * MIN_SESSIONS overall, MIN_GROUP sessions on each side of the comparison and a
 * meaningful gap, otherwise it stays silent.
 */
export function computeInsights(sessions: ActivitySession[], opts: InsightOptions = {}): Insight[] {
  if (sessions.length < MIN_SESSIONS) return []
  const skip = (d: Dimension) => opts.exclude?.includes(d) ?? false
  const ctx = buildContext(opts.all ?? sessions)
  const c = (s: ActivitySession): SessionContext => ctx.get(s.id) ?? { daysSinceLastGame: null, weeklyLoad: 1 }
  const out: Insight[] = []

  // who you play with
  if (!skip('social')) {
    const social = groupBy(sessions, 'social').filter((g) => g.sessions.length >= MIN_GROUP)
    if (social.length >= 2) {
      const best = [...social].sort((a, b) => b.enjoyment - a.enjoyment)[0]
      const rest = sessions.filter((s) => s.socialContext !== best.key)
      const restAvg = avg(rest.map((s) => s.enjoyment))
      const gap = best.enjoyment - restAvg
      if (gap >= 0.4 && rest.length >= MIN_GROUP) {
        const who = socialPhrase(best.key as Social)
        out.push({
          id: 'social',
          dimension: 'social',
          headline: `You seem to enjoy your games most when you play ${who}.`,
          basis: `${games(best.sessions.length)} ${who} averaged ${fmt1(best.enjoyment)}/5 enjoyment, compared with ${fmt1(restAvg)}/5 across your other ${rest.length}.`,
          metric: 'enjoyment',
          groups: groupBy(sessions, 'social').map((g) => ({ ...g, highlight: g.key === best.key })),
          score: gap,
        })
      }
    }
  }

  // session length and energy
  if (!skip('duration')) {
    const short = sessions.filter((s) => durationBucket(s.duration) === 'short')
    const long = sessions.filter((s) => durationBucket(s.duration) === 'long')
    if (short.length >= MIN_GROUP && long.length >= MIN_GROUP) {
      const ls = avg(short.map(lift))
      const ll = avg(long.map(lift))
      const es = avg(short.map((s) => s.enjoyment))
      const el = avg(long.map((s) => s.enjoyment))
      const groups = (k: string) => groupBy(sessions, 'duration').map((g) => ({ ...g, highlight: g.key === k }))
      if (ls - ll >= 0.5) {
        out.push({
          id: 'duration-energy',
          dimension: 'duration',
          headline: 'Your energy tends to be higher after shorter games.',
          basis: `After games of an hour or less your energy moved ${signed(ls)} points on average (out of 5). After 90+ minute games it moved ${signed(ll)}.`,
          metric: 'lift',
          groups: groups('short'),
          score: (ls - ll) / 2,
        })
      } else if (es - el >= 0.4) {
        out.push({
          id: 'duration-enjoy',
          dimension: 'duration',
          headline: 'Your shorter games have been your most enjoyable.',
          basis: `Games of an hour or less averaged ${fmt1(es)}/5; games of 90+ minutes averaged ${fmt1(el)}/5.`,
          metric: 'enjoyment',
          groups: groups('short'),
          score: es - el,
        })
      } else if (el - es >= 0.4) {
        out.push({
          id: 'duration-long',
          dimension: 'duration',
          headline: 'Your longer games have tended to be the ones you enjoy most.',
          basis: `90+ minute games averaged ${fmt1(el)}/5; games of an hour or less averaged ${fmt1(es)}/5.`,
          metric: 'enjoyment',
          groups: groups('long'),
          score: el - es,
        })
      }
    }
  }

  // competitive sessions and frustration
  if (!skip('competitive')) {
    const comp = sessions.filter(isCompetitive)
    const compLow = comp.filter((s) => s.moodAfter === 'frustrated' || s.moodAfter === 'drained')
    const nonComp = sessions.filter((s) => !isCompetitive(s))
    if (compLow.length >= MIN_GROUP && nonComp.length >= MIN_GROUP) {
      out.push({
        id: 'competitive',
        dimension: 'competitive',
        headline: `You felt frustrated or drained after ${compLow.length} of your ${comp.length} most competitive games.`,
        basis: `"Most competitive" means tournaments or hard-fought matches. Those averaged ${fmt1(avg(comp.map((s) => s.enjoyment)))}/5 enjoyment, against ${fmt1(avg(nonComp.map((s) => s.enjoyment)))}/5 for everything else.`,
        metric: 'enjoyment',
        groups: [{ ...group('competitive', 'Competitive', comp), highlight: true }, group('other', 'Everything else', nonComp)],
        score: 0.6 + compLow.length * 0.1,
      })
    }
  }

  // weekends
  if (!skip('day')) {
    const days = groupBy(sessions, 'day')
    if (days.length === 2 && days.every((g) => g.sessions.length >= MIN_GROUP)) {
      const [wd, we] = days
      const gap = we.enjoyment - wd.enjoyment
      if (Math.abs(gap) >= 0.4) {
        const best = gap > 0 ? we : wd
        out.push({
          id: 'day',
          dimension: 'day',
          headline: `Your most enjoyable games have been on ${best.label.toLowerCase()}.`,
          basis: `Weekend games averaged ${fmt1(we.enjoyment)}/5 (${games(we.sessions.length)}); weekday games ${fmt1(wd.enjoyment)}/5 (${wd.sessions.length}).`,
          metric: 'enjoyment',
          groups: days.map((g) => ({ ...g, highlight: g.key === best.key })),
          score: Math.abs(gap) * 0.8,
        })
      }
    }
  }

  // low-energy days
  if (!skip('readiness')) {
    const lowStart = sessions.filter((s) => s.energyBefore <= 2)
    const rest = sessions.filter((s) => s.energyBefore > 2)
    if (lowStart.length >= MIN_GROUP && rest.length >= MIN_GROUP) {
      const l = avg(lowStart.map(lift))
      if (l >= 1) {
        out.push({
          id: 'readiness',
          dimension: 'readiness',
          headline: 'On low-energy days, playing has usually lifted you rather than drained you.',
          basis: `You started ${games(lowStart.length)} with low energy (2/5 or less). On average you finished ${signed(l)} points higher.`,
          metric: 'lift',
          groups: [{ ...group('low', 'Started low', lowStart), highlight: true }, group('rest', 'Started steady+', rest)],
          score: l * 0.4,
        })
      }
    }
  }

  // intensity
  if (!skip('intensity')) {
    const hard = groupBy(sessions, 'intensity').find((g) => g.key === 'hard' && g.sessions.length >= MIN_GROUP)
    const softer = sessions.filter((s) => s.intensity !== 'hard')
    if (hard && softer.length >= MIN_GROUP) {
      const gap = avg(softer.map((s) => s.enjoyment)) - hard.enjoyment
      if (Math.abs(gap) >= 0.5) {
        out.push({
          id: 'intensity',
          dimension: 'intensity',
          headline: gap > 0 ? 'Easy and moderate games have felt better to you than flat-out ones.' : 'You seem to enjoy it most when you really push.',
          basis: `Hard games averaged ${fmt1(hard.enjoyment)}/5; easy and moderate ones ${fmt1(avg(softer.map((s) => s.enjoyment)))}/5.`,
          metric: 'enjoyment',
          groups: groupBy(sessions, 'intensity').map((g) => ({ ...g, highlight: gap > 0 ? g.key !== 'hard' : g.key === 'hard' })),
          score: Math.abs(gap) * 0.7,
        })
      }
    }
  }

  // sport
  if (!skip('sport')) {
    const sports = groupBy(sessions, 'sport').filter((g) => g.sessions.length >= MIN_GROUP)
    if (sports.length >= 2) {
      const best = [...sports].sort((a, b) => b.enjoyment - a.enjoyment)[0]
      const rest = sessions.filter((s) => s.sport !== best.key)
      const restAvg = avg(rest.map((s) => s.enjoyment))
      if (best.enjoyment - restAvg >= 0.4 && rest.length >= MIN_GROUP) {
        out.push({
          id: 'sport',
          dimension: 'sport',
          headline: `${best.label} has been your most enjoyable sport.`,
          basis: `${games(best.sessions.length)} of ${best.label.toLowerCase()} averaged ${fmt1(best.enjoyment)}/5, compared with ${fmt1(restAvg)}/5 across your other ${rest.length}.`,
          metric: 'enjoyment',
          groups: groupBy(sessions, 'sport').map((g) => ({ ...g, highlight: g.key === best.key })),
          score: (best.enjoyment - restAvg) * 0.8,
        })
      }
    }
  }

  // time of day
  if (!skip('time')) {
    const times = groupBy(sessions, 'time').filter((g) => g.sessions.length >= MIN_GROUP)
    if (times.length >= 2) {
      const best = [...times].sort((a, b) => b.enjoyment - a.enjoyment)[0]
      const rest = sessions.filter((s) => timeOfDay(s) !== best.key)
      const restAvg = avg(rest.map((s) => s.enjoyment))
      if (best.enjoyment - restAvg >= 0.4 && rest.length >= MIN_GROUP) {
        const when = best.label.toLowerCase()
        out.push({
          id: 'time',
          dimension: 'time',
          headline: `You enjoy your ${when} games most.`,
          basis: `${games(best.sessions.length)} in the ${when} averaged ${fmt1(best.enjoyment)}/5, compared with ${fmt1(restAvg)}/5 across your other ${rest.length}.`,
          metric: 'enjoyment',
          groups: groupBy(sessions, 'time').map((g) => ({ ...g, highlight: g.key === best.key })),
          score: (best.enjoyment - restAvg) * 0.9,
        })
      }
    }
  }

  // rest gap
  if (!skip('rest')) {
    const rested = sessions.filter((s) => (c(s).daysSinceLastGame ?? -1) >= 2)
    const b2b = sessions.filter((s) => {
      const d = c(s).daysSinceLastGame
      return d != null && d <= 1
    })
    if (rested.length >= MIN_GROUP && b2b.length >= MIN_GROUP) {
      const r = avg(rested.map((s) => s.enjoyment))
      const b = avg(b2b.map((s) => s.enjoyment))
      if (Math.abs(r - b) >= 0.4) {
        out.push({
          id: 'rest',
          dimension: 'rest',
          headline:
            r > b
              ? 'Games after a rest day or two have felt better than back-to-back ones.'
              : 'You have enjoyed back-to-back days more than games after a break.',
          basis: `After 2 or more rest days, ${games(rested.length)} averaged ${fmt1(r)}/5. On back-to-back days, ${games(b2b.length)} averaged ${fmt1(b)}/5.`,
          metric: 'enjoyment',
          groups: [
            { ...group('rested', '2+ rest days', rested), highlight: r > b },
            { ...group('b2b', 'Back-to-back', b2b), highlight: r <= b },
          ],
          score: Math.abs(r - b) * 0.9,
        })
      }
    }
  }

  // weekly load
  if (!skip('load')) {
    const high = sessions.filter((s) => c(s).weeklyLoad >= HIGH_LOAD)
    const normal = sessions.filter((s) => c(s).weeklyLoad < HIGH_LOAD)
    if (high.length >= MIN_GROUP && normal.length >= MIN_GROUP) {
      const h = avg(high.map((s) => s.enjoyment))
      const n = avg(normal.map((s) => s.enjoyment))
      if (Math.abs(n - h) >= 0.4) {
        out.push({
          id: 'load',
          dimension: 'load',
          headline:
            n > h
              ? `Heavy weeks, with ${HIGH_LOAD} or more games, have felt less fun.`
              : 'You have enjoyed your busiest weeks the most.',
          basis: `Games in a week with ${HIGH_LOAD}+ games averaged ${fmt1(h)}/5 (${games(high.length)}). Games in lighter weeks averaged ${fmt1(n)}/5 (${normal.length}).`,
          metric: 'enjoyment',
          groups: [
            { ...group('normal', `Under ${HIGH_LOAD} a week`, normal), highlight: n > h },
            { ...group('high', `${HIGH_LOAD}+ a week`, high), highlight: n <= h },
          ],
          score: Math.abs(n - h) * 0.95,
          warning: n > h,
        })
      }
    }
  }

  // result
  if (!skip('result')) {
    const won = sessions.filter((s) => s.sessionType === 'match' && s.result === 'won')
    const lost = sessions.filter((s) => s.sessionType === 'match' && s.result === 'lost')
    if (won.length >= MIN_GROUP && lost.length >= MIN_GROUP) {
      const w = avg(won.map((s) => s.enjoyment))
      const l = avg(lost.map((s) => s.enjoyment))
      const basis = `Matches you won averaged ${fmt1(w)}/5 enjoyment (${games(won.length)}); matches you lost averaged ${fmt1(l)}/5 (${lost.length}).`
      const groups = [
        { ...group('won', 'Won', won), highlight: w - l >= 0.8 },
        { ...group('lost', 'Lost', lost), highlight: w - l >= 0.8 },
      ]
      if (w - l >= 0.8) {
        out.push({
          id: 'result',
          dimension: 'result',
          headline: 'The score has been shaping how much you enjoy a match.',
          basis,
          metric: 'enjoyment',
          groups,
          score: (w - l) * 0.5,
        })
      } else if (Math.abs(w - l) <= 0.3) {
        out.push({
          id: 'result',
          dimension: 'result',
          headline: 'You enjoy a match about as much whether you win or lose.',
          basis,
          metric: 'enjoyment',
          groups: groups.map((g) => ({ ...g, highlight: true })),
          score: 0.45,
        })
      }
    }
  }

  // body after
  if (!skip('body')) {
    const rated = sessions.filter((s) => s.bodyAfter)
    const sore = (xs: ActivitySession[]) => xs.filter((s) => s.bodyAfter === 'sore').length
    if (rated.length >= MIN_SESSIONS && sore(rated) >= MIN_GROUP) {
      type Cand = { dim: 'length' | 'intensity'; key: string; phrase: string; label: string; of: ActivitySession[]; rest: ActivitySession[] }
      const cands: Cand[] = [
        ...LENGTHS.map((l) => ({
          dim: 'length' as const,
          key: l.id,
          phrase: `games ${l.phrase}`,
          label: l.label,
          of: rated.filter((s) => lengthBucket(s) === l.id),
          rest: rated.filter((s) => lengthBucket(s) !== l.id),
        })),
        ...INTENSITIES.map((i) => ({
          dim: 'intensity' as const,
          key: i.id,
          phrase: `${i.label.toLowerCase()} games`,
          label: i.label,
          of: rated.filter((s) => s.intensity === i.id),
          rest: rated.filter((s) => s.intensity !== i.id),
        })),
      ]
      const scored = cands
        .filter((k) => k.of.length >= MIN_GROUP && k.rest.length >= MIN_GROUP && sore(k.of) >= MIN_GROUP)
        .map((k) => ({ k, rate: sore(k.of) / k.of.length, restRate: sore(k.rest) / k.rest.length }))
        .filter((x) => x.rate >= 0.5 && x.rate - x.restRate >= 0.3)
        .sort((a, b) => b.rate - b.restRate - (a.rate - a.restRate))
      const top = scored[0]
      if (top) {
        const { k } = top
        const phrase = k.phrase.charAt(0).toUpperCase() + k.phrase.slice(1)
        const shareGroups: Group[] = (
          k.dim === 'length'
            ? LENGTHS.map((l) => group(l.id, l.label, rated.filter((s) => lengthBucket(s) === l.id)))
            : INTENSITIES.map((i) => group(i.id, i.label, rated.filter((s) => s.intensity === i.id)))
        )
          .filter((g) => g.sessions.length)
          .map((g) => ({ ...g, share: sore(g.sessions) / g.sessions.length, highlight: g.key === k.key }))
        out.push({
          id: 'body',
          dimension: 'body',
          headline: `${phrase} are the ones that tend to leave you sore.`,
          basis: `${sore(k.of)} of your ${k.of.length} ${k.phrase} left you sore, compared with ${sore(k.rest)} of ${k.rest.length} other games.`,
          metric: 'share',
          shareOf: 'left you sore',
          groups: shareGroups,
          score: (top.rate - top.restRate) * 1.2,
          warning: true,
        })
      }
    }
  }

  // enjoyment trend (drift)
  if (!skip('trend')) {
    const t = enjoymentTrend(sessions, opts.now)
    if (t.recent.length >= 3 && t.earlier.length >= 3 && Math.abs(t.delta) >= 0.6) {
      const down = t.delta < 0
      out.push({
        id: 'trend',
        dimension: 'trend',
        headline: down ? 'Your enjoyment has been drifting down lately.' : 'You have been enjoying your games more lately.',
        basis: `Your ${games(t.recent.length)} in the last 4 weeks averaged ${fmt1(t.recentAvg)}/5, ${down ? 'down' : 'up'} from ${fmt1(t.earlierAvg)}/5 across the ${t.earlier.length} before them.`,
        metric: 'enjoyment',
        groups: [
          { ...group('earlier', 'Before', t.earlier), highlight: false },
          { ...group('recent', 'Last 4 weeks', t.recent), highlight: true },
        ],
        score: down ? 1.2 + Math.abs(t.delta) * 0.3 : Math.abs(t.delta) * 0.6,
        warning: down,
      })
    }
  }

  return out.sort((a, b) => b.score - a.score)
}

/** Which patterns each kind of player sees first. */
const PRIORITY: Record<PlayerType, Dimension[]> = {
  comeback: ['rest', 'trend', 'body', 'duration', 'readiness'],
  high_volume: ['load', 'body', 'rest', 'trend', 'intensity'],
  casual: ['social', 'time', 'sport', 'day', 'result'],
}

/** Reorders insights so the ones that matter most to this player come first. Never adds or removes any. */
export function orderInsights(insights: Insight[], playerType?: PlayerType): Insight[] {
  if (!playerType) return insights
  const p = PRIORITY[playerType]
  const rank = (i: Insight) => {
    const k = p.indexOf(i.dimension)
    return k < 0 ? p.length : k
  }
  return [...insights].sort((a, b) => rank(a) - rank(b) || b.score - a.score)
}

/** The single sentence at the top of the Game Map. Combines the two strongest compatible patterns. */
export function strongestPattern(insights: Insight[]): string | null {
  if (!insights.length) return null
  const first = insights[0]
  const social = insights.find((i) => i.id === 'social')
  const dur = insights.find((i) => i.id.startsWith('duration') && i.id !== 'duration-long')
  if (social && dur && (first === social || first === dur)) {
    const best = social.groups.find((g) => g.highlight)
    return `You seem to get the most out of shorter games ${socialPhrase((best?.key ?? 'friends') as Social)}.`
  }
  return first.headline
}

export function daysSinceLastSession(d: AppData, now = new Date()) {
  const s = sortedSessions(d)
  if (!s.length) return null
  return daysBetween(new Date(s[s.length - 1].date), now)
}

/* ------------------------------------------------------------------ */
/* What a set of games has in common, compared with a baseline.        */
/* ------------------------------------------------------------------ */

export type TraitDim = 'sport' | 'social' | 'type' | 'intensity' | 'time' | 'length' | 'rest' | 'load' | 'result' | 'body'

export interface Trait {
  dim: TraitDim
  key: string
  label: string
  count: number
  of: number
  baseCount: number
  baseOf: number
  basis: string
}

/**
 * The 2–3 traits most over-represented in `subset` versus `baseline`. Each trait needs at
 * least MIN_GROUP games in the subset and a clear gap, so it never reports noise.
 */
export function commonTraits(
  subset: ActivitySession[],
  baseline: ActivitySession[],
  opts: { all?: ActivitySession[]; exclude?: TraitDim[]; noun?: string } = {},
): Trait[] {
  if (subset.length < MIN_SESSIONS || baseline.length < MIN_SESSIONS) return []
  const ctx = buildContext(opts.all ?? baseline)
  const gap = (s: ActivitySession) => ctx.get(s.id)?.daysSinceLastGame ?? null
  const load = (s: ActivitySession) => ctx.get(s.id)?.weeklyLoad ?? 1
  const noun = opts.noun ?? 'these games'

  const defs: { dim: TraitDim; key: string; label: string; phrase: string; test: (s: ActivitySession) => boolean }[] = [
    ...[...new Set(baseline.map((s) => s.sport))].map((sp) => ({
      dim: 'sport' as const,
      key: sp,
      label: sp,
      phrase: `${sp.toLowerCase()} games`,
      test: (s: ActivitySession) => s.sport === sp,
    })),
    ...SOCIALS.map((so) => ({
      dim: 'social' as const,
      key: so.id,
      label: socialPhrase(so.id).replace(/^./, (x) => x.toUpperCase()),
      phrase: `played ${socialPhrase(so.id)}`,
      test: (s: ActivitySession) => s.socialContext === so.id,
    })),
    ...SESSION_TYPES.map((t) => ({
      dim: 'type' as const,
      key: t.id,
      label: sessionTypeLabel(t.id),
      phrase: { match: 'matches', casual: 'casual hits', practice: 'practice sessions', lesson: 'lessons' }[t.id],
      test: (s: ActivitySession) => s.sessionType === t.id,
    })),
    ...INTENSITIES.map((i) => ({
      dim: 'intensity' as const,
      key: i.id,
      label: `${i.label} intensity`,
      phrase: `${i.label.toLowerCase()} intensity`,
      test: (s: ActivitySession) => s.intensity === i.id,
    })),
    ...TIMES.map((t) => ({
      dim: 'time' as const,
      key: t.id,
      label: `${t.label}s`,
      phrase: `in the ${t.label.toLowerCase()}`,
      test: (s: ActivitySession) => timeOfDay(s) === t.id,
    })),
    ...LENGTHS.map((l) => ({
      dim: 'length' as const,
      key: l.id,
      label: l.label,
      phrase: l.phrase,
      test: (s: ActivitySession) => lengthBucket(s) === l.id,
    })),
    { dim: 'rest', key: 'rested', label: 'After a rest day', phrase: 'after 2 or more rest days', test: (s) => (gap(s) ?? -1) >= 2 },
    { dim: 'rest', key: 'b2b', label: 'Back-to-back days', phrase: 'on back-to-back days', test: (s) => { const g = gap(s); return g != null && g <= 1 } },
    { dim: 'load', key: 'high', label: `Weeks with ${HIGH_LOAD}+ games`, phrase: `in a week with ${HIGH_LOAD}+ games`, test: (s) => load(s) >= HIGH_LOAD },
    { dim: 'load', key: 'normal', label: 'Lighter weeks', phrase: `in a week with fewer than ${HIGH_LOAD} games`, test: (s) => load(s) < HIGH_LOAD },
    ...RESULTS.filter((r) => r.id !== 'no_score').map((r) => ({
      dim: 'result' as const,
      key: r.id,
      label: r.id === 'won' ? 'Wins' : 'Losses',
      phrase: r.id === 'won' ? 'matches you won' : 'matches you lost',
      test: (s: ActivitySession) => s.result === r.id,
    })),
    ...BODIES.map((b) => ({
      dim: 'body' as const,
      key: b.id,
      label: `Left you ${b.label.toLowerCase()}`,
      phrase: `games that left you feeling ${b.label.toLowerCase()}`,
      test: (s: ActivitySession) => s.bodyAfter === b.id,
    })),
  ]

  const scored = defs
    .filter((d) => !opts.exclude?.includes(d.dim))
    .map((d) => {
      const count = subset.filter(d.test).length
      const baseCount = baseline.filter(d.test).length
      const share = count / subset.length
      const baseShare = baseCount / baseline.length
      return { d, count, baseCount, share, baseShare, diff: share - baseShare }
    })
    .filter((x) => x.count >= MIN_GROUP && x.share >= 0.4 && x.diff >= 0.15 && x.share >= x.baseShare * 1.3)
    .sort((a, b) => b.diff - a.diff)

  const seen = new Set<TraitDim>()
  const picked: Trait[] = []
  for (const x of scored) {
    if (seen.has(x.d.dim)) continue
    seen.add(x.d.dim)
    picked.push({
      dim: x.d.dim,
      key: x.d.key,
      label: x.d.label,
      count: x.count,
      of: subset.length,
      baseCount: x.baseCount,
      baseOf: baseline.length,
      basis: `${x.count} of ${noun} (${Math.round(x.share * 100)}%) were ${x.d.phrase}, compared with ${x.baseCount} of ${baseline.length} games overall (${Math.round(x.baseShare * 100)}%).`,
    })
    if (picked.length === 3) break
  }
  return picked
}

/* ------------------------------------------------------------------ */
/* Early warning: one gentle flag and one thing to try.               */
/* ------------------------------------------------------------------ */

export interface EarlyWarning {
  insight: Insight
  title: string
  suggestion: string
  /** Optional good news: the last few games are already better. */
  bounce?: string
}

/** Picks the most useful warning pattern (drift, then heavy weeks, then soreness), if any fired. */
export function earlyWarning(insights: Insight[], sessions: ActivitySession[]): EarlyWarning | null {
  const pick = ['trend', 'load', 'body'].map((id) => insights.find((i) => i.id === id && i.warning)).find(Boolean)
  if (!pick) return null

  const social = insights.find((i) => i.id === 'social')
  const bestWho = social?.groups.find((g) => g.highlight)?.key as Social | undefined
  const rest = insights.find((i) => i.id === 'rest' && i.groups.find((g) => g.key === 'rested')?.highlight)
  const socialTip =
    bestWho && bestWho !== 'tournament' && bestWho !== 'solo' ? `Try a relaxed game ${socialPhrase(bestWho)} this week, just for fun.` : null
  const restTip = rest ? 'Take a rest day before your next game. Your games after a break have felt better.' : null

  let title: string
  let suggestion: string
  if (pick.id === 'trend') {
    title = 'Your games have been feeling less fun lately.'
    suggestion = socialTip ?? restTip ?? 'Mix in one game this week that is purely for fun.'
  } else if (pick.id === 'load') {
    title = 'Your busiest weeks have felt less fun.'
    suggestion = restTip ?? 'Try a lighter week, with a rest day between games.'
  } else {
    title = pick.headline
    suggestion = 'Next time, try a shorter or easier game and notice how your body feels after.'
  }

  let bounce: string | undefined
  const recent = pick.groups.find((g) => g.key === 'recent')
  const last3 = [...sessions].sort((a, b) => a.date.localeCompare(b.date)).slice(-3)
  if (recent && last3.length === 3) {
    const l3 = avg(last3.map((s) => s.enjoyment))
    if (l3 - recent.enjoyment >= 0.5) bounce = `Your last 3 games averaged ${fmt1(l3)}/5, so something you changed already seems to be helping.`
  }
  return { insight: pick, title, suggestion, bounce }
}
