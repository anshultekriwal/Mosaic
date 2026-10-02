import type { ActivitySession } from './types'
import { avg, computeInsights, durationBucket, fmt1, groupBy, lift, MIN_SESSIONS } from './insights'
import { daysBetween } from './dates'
import { moodLabel } from './meta'

export const SUGGESTED = [
  'Why have I been enjoying pickleball less lately?',
  'When do I feel best after playing?',
  'Does competing affect how I feel?',
  'Am I playing too long?',
]

export interface Answer {
  lines: string[]
  basedOn: number
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

function describeDiff(a: ActivitySession[], b: ActivitySession[], labelA: string, labelB: string) {
  return `${labelA} averaged ${fmt1(avg(a.map((s) => s.enjoyment)))}/5 enjoyment (${plural(a.length, 'session')}); ${labelB} averaged ${fmt1(avg(b.map((s) => s.enjoyment)))}/5 (${b.length}).`
}

/**
 * Answers questions by reading the user's own log. Keyword-routed and deterministic:
 * no model, no guessing, and it says so when there isn't enough to go on.
 */
export function ask(question: string, all: ActivitySession[], _opts: { all?: ActivitySession[] } = {}, now = new Date()): Answer {
  const q = question.toLowerCase()
  const sports = [...new Set(all.map((s) => s.sport))]
  const sport = sports.find((sp) => q.includes(sp.toLowerCase()))
  const pool = sport ? all.filter((s) => s.sport === sport) : all
  const subject = sport ? `${sport} sessions` : 'sessions'

  if (pool.length < 3) {
    return {
      basedOn: pool.length,
      lines: [
        sport
          ? `You've logged ${plural(pool.length, `${sport} session`)} so far — not quite enough to see a pattern yet.`
          : `You've logged ${plural(pool.length, 'session')} so far — not quite enough to see a pattern yet.`,
        'A few more sessions and this will start to say something useful.',
      ],
    }
  }

  const lines: string[] = []

  if (/less|lately|recent|drop|down|worse|not enjoy|stopped/.test(q)) {
    const recent = pool.filter((s) => daysBetween(new Date(s.date), now) <= 21)
    const earlier = pool.filter((s) => daysBetween(new Date(s.date), now) > 21)
    if (recent.length && earlier.length) {
      const r = avg(recent.map((s) => s.enjoyment))
      const e = avg(earlier.map((s) => s.enjoyment))
      lines.push(
        `In the last three weeks you've logged ${plural(recent.length, subject.replace(/s$/, ''))}, averaging ${fmt1(r)}/5 enjoyment. Before that you averaged ${fmt1(e)}/5.`,
      )
      if (r >= e - 0.15) lines.push(`So on paper, your enjoyment hasn't dropped — it's ${r > e + 0.15 ? 'actually up' : 'about the same'}.`)
    }
    const low = pool.filter((s) => s.enjoyment <= 3)
    if (low.length) {
      const longLow = low.filter((s) => s.duration >= 90).length
      const tiredLow = low.filter((s) => s.energyBefore <= 2).length
      const compLow = low.filter((s) => s.socialContext === 'tournament' || s.intensity === 'hard').length
      const reasons: string[] = []
      if (longLow) reasons.push(`${longLow} ran 90 minutes or longer`)
      if (compLow) reasons.push(`${compLow} were tournaments or hard matches`)
      if (tiredLow) reasons.push(`${tiredLow} started with low energy`)
      lines.push(
        `Your ${plural(low.length, 'lower-rated session')} (3/5 or below)${reasons.length ? ` have something in common: ${reasons.join(', ')}.` : ' don’t share an obvious pattern yet.'}`,
      )
    } else {
      lines.push(`None of your ${subject} have been rated below 4/5 — which is worth noticing too.`)
    }
    return { lines, basedOn: pool.length }
  }

  if (/compet|tournament|match|win|lose|losing|pressure/.test(q)) {
    const comp = pool.filter((s) => s.socialContext === 'tournament' || s.sessionType === 'match')
    const rest = pool.filter((s) => !(s.socialContext === 'tournament' || s.sessionType === 'match'))
    if (comp.length && rest.length) lines.push(describeDiff(comp, rest, 'Matches and tournaments', 'Casual hits and practice'))
    const after = comp.map((s) => s.moodAfter)
    const tough = after.filter((m) => m === 'frustrated' || m === 'drained').length
    if (comp.length) lines.push(`After competitive sessions you most often felt ${moodLabel(mode(after)).toLowerCase()}. ${tough ? `${plural(tough, 'time')} you felt frustrated or drained.` : 'You never logged feeling frustrated.'}`)
    return { lines, basedOn: pool.length }
  }

  if (/long|short|duration|how much|too much|minutes|hours/.test(q)) {
    for (const g of groupBy(pool, 'duration')) {
      lines.push(`${g.label}: ${fmt1(g.enjoyment)}/5 enjoyment, energy ${g.lift >= 0 ? 'up' : 'down'} ${fmt1(Math.abs(g.lift))} on average (${plural(g.sessions.length, 'session')}).`)
    }
    return { lines, basedOn: pool.length }
  }

  if (/who|friend|alone|solo|club|family|people/.test(q)) {
    for (const g of groupBy(pool, 'social')) lines.push(`${g.label}: ${fmt1(g.enjoyment)}/5 enjoyment across ${plural(g.sessions.length, 'session')}.`)
    return { lines, basedOn: pool.length }
  }

  if (/energy|tired|drain|exhaust/.test(q)) {
    const l = avg(pool.map(lift))
    lines.push(`On average your energy goes ${l >= 0 ? 'up' : 'down'} ${fmt1(Math.abs(l))} points (out of 5) from before to after playing.`)
    const best = [...pool].sort((a, b) => lift(b) - lift(a))[0]
    lines.push(`Your biggest lift was a ${best.duration}-minute ${best.sport.toLowerCase()} session, ${best.socialContext === 'solo' ? 'on your own' : `with ${best.socialContext}`}.`)
    const longL = avg(pool.filter((s) => durationBucket(s.duration) === 'long').map(lift))
    if (pool.some((s) => durationBucket(s.duration) === 'long') && longL < 0)
      lines.push(`Sessions of 90 minutes or more have tended to leave you with less energy than you started with.`)
    return { lines, basedOn: pool.length }
  }

  // Default: when do I feel best?
  const top = pool.filter((s) => s.enjoyment >= 5)
  if (top.length) {
    const soc = mode(top.map((s) => s.socialContext))
    const median = top.map((s) => s.duration).sort((a, b) => a - b)[Math.floor(top.length / 2)]
    lines.push(
      `Your ${plural(top.length, 'five-star session')} were most often with ${soc === 'solo' ? 'nobody else — solo' : soc}, and typically around ${median} minutes.`,
    )
  }
  const insights = pool.length >= MIN_SESSIONS ? computeInsights(pool) : []
  if (insights[0]) lines.push(insights[0].basis)
  if (!lines.length) lines.push(`Your ${subject} average ${fmt1(avg(pool.map((s) => s.enjoyment)))}/5 enjoyment.`)
  return { lines, basedOn: pool.length }
}

function mode<T>(xs: T[]): T {
  const m = new Map<T, number>()
  xs.forEach((x) => m.set(x, (m.get(x) ?? 0) + 1))
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0][0]
}
