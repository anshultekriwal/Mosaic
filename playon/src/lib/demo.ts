import type { ActivitySession, AppData, BodyAfter, CheckIn, Intensity, Mood, Result, SessionType, Social } from './types'
import { addDays, seasonNameFor, startOfDay, startOfWeek } from './dates'
import { makeSeason, uid } from './store'

type Row = [
  dayOffset: number, // days before today
  hour: number, // local start time, drives time of day
  sport: string,
  duration: number,
  type: SessionType,
  social: Social,
  intensity: Intensity,
  enjoyment: number,
  before: number,
  after: number,
  mood: Mood,
  standouts: string[],
  result: Result | null,
  body: BodyAfter,
  note?: string,
]

const FUN = 'I had fun with friends'
const WELL = 'I played really well'
const LEARN = 'I learned something'
const HARD = 'It was challenging'
const COMP = 'I felt competitive'
const BREAK = 'I needed a break'

/*
 * Alex's sample season, written by hand so every pattern is honest to the data.
 * The story: weeks of social doubles in the evening feel great. Then Alex jumps to
 * four or more competitive games a week (long, hard, often back to back, mostly
 * lost) and the fun drains out, with soreness. Mixing social doubles and rest days
 * back in brings it back. Dates are relative to today so the demo always looks current.
 */
const ROWS: Row[] = [
  // Weeks 1-3: social doubles, rest days between games
  [47, 19, 'Pickleball', 60, 'casual', 'friends', 'moderate', 5, 3, 4, 'happy', [FUN], null, 'fresh', 'Sunday doubles. Laughed more than I scored.'],
  [44, 18, 'Table Tennis', 45, 'casual', 'friends', 'easy', 5, 2, 4, 'energized', [FUN], null, 'fresh', 'Office table after work. Exactly what I needed.'],
  [42, 19, 'Pickleball', 75, 'match', 'club', 'moderate', 4, 3, 4, 'happy', [WELL], 'won', 'fresh'],
  [39, 18, 'Pickleball', 60, 'casual', 'family', 'easy', 5, 2, 4, 'happy', [FUN], null, 'fresh', 'Taught my sister to serve. She is already better than me.'],
  [37, 19, 'Pickleball', 60, 'casual', 'friends', 'moderate', 5, 3, 4, 'happy', [FUN, WELL], null, 'tired'],
  [34, 19, 'Table Tennis', 40, 'casual', 'friends', 'easy', 4, 3, 4, 'calm', [BREAK], null, 'fresh'],
  [32, 10, 'Pickleball', 90, 'match', 'club', 'moderate', 4, 3, 3, 'calm', [LEARN], 'won', 'tired'],
  [29, 18, 'Pickleball', 75, 'practice', 'solo', 'moderate', 4, 3, 3, 'neutral', [LEARN], null, 'tired', 'Drilled third-shot drops. Useful, a bit lonely.'],
  // Weeks 4-5: the jump to four-plus competitive games a week
  [27, 9, 'Pickleball', 120, 'match', 'tournament', 'hard', 3, 4, 2, 'drained', [HARD, COMP], 'lost', 'sore', 'Lost the semi 9-11. Kept replaying it on the drive home.'],
  [26, 18, 'Pickleball', 105, 'match', 'club', 'hard', 3, 3, 2, 'neutral', [COMP], 'won', 'sore'],
  [25, 19, 'Pickleball', 105, 'match', 'club', 'hard', 2, 2, 2, 'frustrated', [COMP], 'lost', 'sore'],
  [24, 13, 'Table Tennis', 60, 'match', 'club', 'hard', 3, 3, 3, 'neutral', [COMP], 'lost', 'tired'],
  [22, 9, 'Pickleball', 120, 'match', 'tournament', 'hard', 2, 3, 1, 'drained', [HARD], 'lost', 'sore', 'Played to win, not to play. Noted.'],
  [20, 19, 'Pickleball', 105, 'match', 'club', 'hard', 2, 2, 2, 'frustrated', [COMP], 'lost', 'sore'],
  [19, 14, 'Table Tennis', 60, 'match', 'club', 'moderate', 3, 3, 3, 'neutral', [COMP], 'won', 'tired'],
  [17, 9, 'Pickleball', 120, 'match', 'tournament', 'hard', 2, 3, 2, 'drained', [HARD, COMP], 'lost', 'sore'],
  [16, 18, 'Pickleball', 90, 'match', 'club', 'hard', 2, 2, 2, 'drained', [BREAK], 'lost', 'sore', 'My body says enough. Taking a few days off.'],
  // Weeks 6-7: social doubles and rest days again
  [11, 19, 'Pickleball', 60, 'casual', 'friends', 'moderate', 4, 2, 4, 'happy', [FUN], null, 'fresh', 'Back to Sunday doubles. Forgot how much I like this.'],
  [8, 19, 'Table Tennis', 45, 'casual', 'friends', 'easy', 5, 3, 4, 'energized', [FUN], null, 'fresh'],
  [6, 18, 'Pickleball', 60, 'casual', 'friends', 'moderate', 5, 3, 4, 'happy', [FUN, WELL], null, 'fresh', 'Finally hit the Erne. Everyone cheered.'],
  [1, 19, 'Pickleball', 60, 'casual', 'friends', 'moderate', 5, 3, 5, 'energized', [FUN, WELL], null, 'fresh', 'Social doubles, then tacos. This is the game I love.'],
]

const CHECKINS: [number, Mood, number, number, string][] = [
  [21, 'drained', 2, 3, 'Long week at work.'],
  [16, 'frustrated', 2, 3, ''],
  [9, 'calm', 3, 2, ''],
  [5, 'happy', 4, 1, ''],
  [2, 'energized', 4, 1, ''],
]

export function buildDemo(): AppData {
  const userId = 'demo-alex'
  const today = startOfDay(new Date())
  const at = (offset: number, hour: number) => {
    const d = addDays(today, -offset)
    d.setHours(hour, 0, 0, 0)
    return d.toISOString()
  }

  const sessions: ActivitySession[] = ROWS.map((r, i) => ({
    id: `demo-s${i}`,
    userId,
    date: at(r[0], r[1]),
    sport: r[2],
    duration: r[3],
    sessionType: r[4],
    socialContext: r[5],
    intensity: r[6],
    enjoyment: r[7],
    energyBefore: r[8],
    energyAfter: r[9],
    moodAfter: r[10],
    standouts: r[11],
    ...(r[12] ? { result: r[12] } : {}),
    bodyAfter: r[13],
    reflection: r[14] ?? '',
  }))

  const checkins: CheckIn[] = CHECKINS.map(([o, mood, energy, stress, note]) => ({
    id: uid(),
    userId,
    date: at(o, 9),
    mood,
    energy,
    stress,
    note,
  }))

  const seasonStart = startOfWeek(addDays(today, -47))
  const season = { ...makeSeason(userId, seasonStart, 3), name: `${seasonNameFor(today)} Season` }

  return {
    version: 1,
    user: {
      id: userId,
      name: 'Alex',
      primarySport: 'Pickleball',
      sports: ['Pickleball', 'Table Tennis'],
      experienceLevel: 'regular',
      currentFrequency: '2–3 times a week',
      weeklyGoal: 3,
      wellnessGoal: ['enjoy', 'pressure'],
      playerType: 'high_volume',
      createdAt: seasonStart.toISOString(),
      isDemo: true,
    },
    sessions,
    checkins,
    seasons: [season],
    moments: [],
  }
}
