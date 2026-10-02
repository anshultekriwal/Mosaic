import type { ActivitySession } from './types'
import { avg, commonTraits, computeInsights, durationBucket, fmt1, groupBy, lift, MIN_SESSIONS, socialPhrase, type Dimension } from './insights'
import { enjoymentTrend } from './derive'
import { moodLabel } from './meta'

export const SUGGESTED = [
  'What do my best games have in common?',
  'Why have I been enjoying it less lately?',
  'Does a rest day help?',
  'How do wins and losses affect me?',
  'What leaves me sore?',
  'When in the day do I enjoy playing most?',
]

/** Shown when a question doesn't match anything we can answer honestly. */
export const CAN_ANSWER = [
  'what your best (or toughest) games have in common',
  'whether your enjoyment has been drifting',
  'rest days versus back-to-back games',
  'heavy weeks versus lighter ones',
  'wins versus losses',
  'what leaves you sore',
  'time of day, game length, who you play with, and energy',
]

export interface Answer {
  lines: string[]
  basedOn: number
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

function describeDiff(a: ActivitySession[], b: ActivitySession[], labelA: string, labelB: string) {
  return `${labelA} averaged ${fmt1(avg(a.map((s) => s.enjoyment)))}/5 enjoyment (${plural(a.length, 'game')}); ${labelB} averaged ${fmt1(avg(b.map((s) => s.enjoyment)))}/5 (${b.length}).`
}

/**
 * Answers questions by reading the player's own log, or the filtered slice of it.
 * Keyword-routed and deterministic: no model, no guessing, and it says so when there
 * isn't enough to go on.
 */
export function ask(question: string, sessions: ActivitySession[], opts: { all?: ActivitySession[] } = {}, now = new Date()): Answer {
  const q = question.toLowerCase()
  const all = opts.all ?? sessions
  const sports = [...new Set(sessions.map((s) => s.sport))]
  const sport = sports.find((sp) => q.includes(sp.toLowerCase()))
  const pool = sport ? sessions.filter((s) => s.sport === sport) : sessions
  const subject = sport ? `${sport} games` : 'games'

  if (pool.length < 3) {
    return {
      basedOn: pool.length,
      lines: [
        `There ${pool.length === 1 ? 'is' : 'are'} ${plural(pool.length, sport ? `${sport} game` : 'game')} to go on so far. That's not quite enough to see a pattern yet.`,
        'A few more games and this will start to say something useful.',
      ],
    }
  }

  const done = (lines: string[]): Answer => ({ lines, basedOn: pool.length })
  const insight = (dim: Dimension) => computeInsights(pool, { all }).find((i) => i.dimension === dim)
  const notYet = (what: string) => `Nothing clear about ${what} yet. A pattern needs at least ${MIN_SESSIONS} games and two on each side of the comparison.`

  // What do my best / toughest games have in common?
  const best = /best|loved|favou?rite|in common|great games/.test(q) && !/feel best/.test(q)
  const tough = /tough|worst|not great|bad games|didn.t enjoy/.test(q)
  if (best || tough) {
    const subset = tough ? pool.filter((s) => s.enjoyment <= 2) : pool.filter((s) => s.enjoyment >= 5)
    const noun = tough ? 'your toughest games' : 'your best games'
    if (subset.length < MIN_SESSIONS)
      return done([
        `You have ${plural(subset.length, tough ? 'game' : 'five-star game')}${tough ? ' rated 2/5 or below' : ''} here. Comparing needs at least ${MIN_SESSIONS}.`,
      ])
    const traits = commonTraits(subset, pool, { all, noun })
    if (!traits.length) return done([`${noun[0].toUpperCase()}${noun.slice(1)} look a lot like the rest of your games. Nothing stands out yet.`])
    return done([`Here is what stands out about ${noun} (${subset.length}):`, ...traits.map((t) => t.basis)])
  }

  // Rest days
  if (/rest|back.to.back|break|days? off|recover/.test(q)) {
    const i = insight('rest')
    return done([i ? `${i.headline} ${i.basis}` : notYet('rest days versus back-to-back games')])
  }

  // Wins and losses
  if (/\bwin|\bwon|\blos[et]|losing|score|result/.test(q)) {
    const i = insight('result')
    const tagged = pool.filter((s) => s.result).length
    return done([
      i
        ? `${i.headline} ${i.basis}`
        : tagged
          ? notYet('wins versus losses')
          : 'No match results logged yet. Tap Won or Lost after a match and this will fill in.',
    ])
  }

  // Soreness
  if (/sore|body|ache|hurt|injur|stiff/.test(q)) {
    const i = insight('body')
    const sore = pool.filter((s) => s.bodyAfter === 'sore').length
    return done([
      i ? `${i.headline} ${i.basis}` : sore ? notYet('what leaves you sore') : 'You have not logged feeling sore after a game. That is worth noticing too.',
      'This is an observation from your log, not medical advice. If something hurts, talk to a professional.',
    ])
  }

  // Time of day
  if (/morning|afternoon|evening|night|time of day|in the day|what time/.test(q)) {
    const lines = groupBy(pool, 'time').map((g) => `${g.label}: ${fmt1(g.enjoyment)}/5 enjoyment (${plural(g.sessions.length, 'game')}).`)
    const i = insight('time')
    if (i) lines.unshift(i.headline)
    return done(lines)
  }

  // Drift
  if (/less|lately|recent|drop|down|worse|not enjoy|stopped|drift|bored/.test(q)) {
    const t = enjoymentTrend(pool, now)
    const lines: string[] = []
    if (t.recent.length && t.earlier.length) {
      lines.push(
        `In the last 4 weeks you've logged ${plural(t.recent.length, subject.replace(/s$/, ''))}, averaging ${fmt1(t.recentAvg)}/5 enjoyment. Before that you averaged ${fmt1(t.earlierAvg)}/5.`,
      )
      if (t.delta >= -0.15) lines.push(`So on paper, your enjoyment hasn't dropped. It's ${t.delta > 0.15 ? 'actually up' : 'about the same'}.`)
    }
    const low = pool.filter((s) => s.enjoyment <= 3)
    if (low.length) {
      const longLow = low.filter((s) => s.duration >= 90).length
      const tiredLow = low.filter((s) => s.energyBefore <= 2).length
      const compLow = low.filter((s) => s.socialContext === 'tournament' || s.intensity === 'hard').length
      const soreLow = low.filter((s) => s.bodyAfter === 'sore').length
      const reasons: string[] = []
      if (longLow) reasons.push(`${longLow} ran 90 minutes or longer`)
      if (compLow) reasons.push(`${compLow} were tournaments or hard matches`)
      if (soreLow) reasons.push(`${soreLow} left you sore`)
      if (tiredLow) reasons.push(`${tiredLow} started with low energy`)
      lines.push(
        `Your ${plural(low.length, 'lower-rated game')} (3/5 or below)${reasons.length ? ` have something in common: ${reasons.join(', ')}.` : ' don’t share an obvious pattern yet.'}`,
      )
    } else {
      lines.push(`None of your ${subject} have been rated below 4/5, which is worth noticing too.`)
    }
    return done(lines)
  }

  // Competition
  if (/compet|tournament|match|pressure/.test(q)) {
    const lines: string[] = []
    const comp = pool.filter((s) => s.socialContext === 'tournament' || s.sessionType === 'match')
    const rest = pool.filter((s) => !(s.socialContext === 'tournament' || s.sessionType === 'match'))
    if (comp.length && rest.length) lines.push(describeDiff(comp, rest, 'Matches and tournaments', 'Casual hits and practice'))
    const after = comp.map((s) => s.moodAfter)
    const toughN = after.filter((m) => m === 'frustrated' || m === 'drained').length
    if (comp.length)
      lines.push(
        `After competitive games you most often felt ${moodLabel(mode(after)).toLowerCase()}. ${toughN ? `${plural(toughN, 'time')} you felt frustrated or drained.` : 'You never logged feeling frustrated.'}`,
      )
    return done(lines.length ? lines : ['No matches or tournaments in this view yet.'])
  }

  // Weekly load
  if (/week|often|too many|too much|load|busy|how many/.test(q)) {
    const i = insight('load')
    return done([i ? `${i.headline} ${i.basis}` : notYet('heavy weeks versus lighter ones')])
  }

  if (/long|short|duration|minutes|hours/.test(q)) {
    return done(
      groupBy(pool, 'duration').map(
        (g) => `${g.label}: ${fmt1(g.enjoyment)}/5 enjoyment, energy ${g.lift >= 0 ? 'up' : 'down'} ${fmt1(Math.abs(g.lift))} on average (${plural(g.sessions.length, 'game')}).`,
      ),
    )
  }

  if (/who|friend|alone|solo|club|family|people|social/.test(q)) {
    return done(groupBy(pool, 'social').map((g) => `${g.label}: ${fmt1(g.enjoyment)}/5 enjoyment across ${plural(g.sessions.length, 'game')}.`))
  }

  if (/energy|tired|drain|exhaust/.test(q)) {
    const lines: string[] = []
    const l = avg(pool.map(lift))
    lines.push(`On average your energy goes ${l >= 0 ? 'up' : 'down'} ${fmt1(Math.abs(l))} points (out of 5) from before to after playing.`)
    const top = [...pool].sort((a, b) => lift(b) - lift(a))[0]
    lines.push(`Your biggest lift was a ${top.duration}-minute ${top.sport.toLowerCase()} game, played ${socialPhrase(top.socialContext)}.`)
    const longL = avg(pool.filter((s) => durationBucket(s.duration) === 'long').map(lift))
    if (pool.some((s) => durationBucket(s.duration) === 'long') && longL < 0)
      lines.push('Games of 90 minutes or more have tended to leave you with less energy than you started with.')
    return done(lines)
  }

  // When do I feel best?
  if (/feel best|enjoy most|happiest|most fun|when do i/.test(q)) {
    const lines: string[] = []
    const top = pool.filter((s) => s.enjoyment >= 5)
    if (top.length) {
      const soc = mode(top.map((s) => s.socialContext))
      const median = top.map((s) => s.duration).sort((a, b) => a - b)[Math.floor(top.length / 2)]
      lines.push(`Your ${plural(top.length, 'five-star game')} were most often played ${socialPhrase(soc)}, and typically around ${median} minutes.`)
    }
    const first = pool.length >= MIN_SESSIONS ? computeInsights(pool, { all })[0] : undefined
    if (first) lines.push(first.basis)
    if (!lines.length) lines.push(`Your ${subject} average ${fmt1(avg(pool.map((s) => s.enjoyment)))}/5 enjoyment.`)
    return done(lines)
  }

  return done([
    "I can't answer that one from your log yet. Here's what I can tell you about:",
    ...CAN_ANSWER.map((c) => `• ${c}`),
    'Try one of the suggested questions to start.',
  ])
}

function mode<T>(xs: T[]): T {
  const m = new Map<T, number>()
  xs.forEach((x) => m.set(x, (m.get(x) ?? 0) + 1))
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0][0]
}
