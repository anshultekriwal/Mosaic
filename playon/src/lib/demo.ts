import type { ActivitySession, AppData, CheckIn, Intensity, Mood, SessionType, Social } from './types'
import { addDays, seasonNameFor, startOfDay, startOfWeek } from './dates'
import { makeSeason, uid } from './store'

type Row = [
  dayOffset: number, // days before today
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
  note?: string,
]

/*
 * Alex's sample history. Written by hand so the patterns are honest to the data:
 * friends + shorter sessions tend to feel best, long tournament days less so.
 * Dates are relative to today so the demo always looks current.
 */
const ROWS: Row[] = [
  [47, 'Pickleball', 60, 'casual', 'friends', 'moderate', 5, 3, 4, 'happy', ['I had fun with friends'], 'Sunday doubles. Laughed more than I scored.'],
  [44, 'Pickleball', 90, 'match', 'club', 'moderate', 4, 3, 3, 'calm', ['I learned something']],
  [41, 'Table Tennis', 45, 'casual', 'friends', 'easy', 5, 2, 4, 'energized', ['I had fun with friends'], 'Office table after work. Exactly what I needed.'],
  [39, 'Pickleball', 120, 'match', 'tournament', 'hard', 3, 4, 2, 'drained', ['It was challenging', 'I felt competitive'], 'Lost the semi 9–11. Kept replaying it on the drive home.'],
  [34, 'Pickleball', 60, 'casual', 'friends', 'moderate', 5, 3, 4, 'happy', ['I had fun with friends', 'I played really well']],
  [31, 'Pickleball', 75, 'practice', 'solo', 'moderate', 3, 3, 3, 'neutral', ['I learned something'], 'Drilled third-shot drops. Useful, a bit lonely.'],
  [27, 'Table Tennis', 50, 'match', 'club', 'moderate', 4, 3, 4, 'energized', ['I played really well']],
  [26, 'Pickleball', 60, 'casual', 'family', 'easy', 5, 2, 4, 'happy', ['I had fun with friends'], 'Taught my sister to serve. She is already better than me.'],
  // a quiet stretch: a deliberate recovery gap
  [16, 'Pickleball', 105, 'match', 'tournament', 'hard', 2, 4, 2, 'frustrated', ['I felt competitive', 'It was challenging'], 'Played to win, not to play. Noted.'],
  [13, 'Pickleball', 60, 'casual', 'friends', 'moderate', 5, 3, 5, 'energized', ['I had fun with friends']],
  [12, 'Table Tennis', 40, 'casual', 'friends', 'easy', 4, 2, 4, 'calm', ['I needed a break']],
  [9, 'Pickleball', 90, 'match', 'club', 'hard', 4, 3, 3, 'happy', ['I played really well', 'I felt competitive']],
  [6, 'Pickleball', 60, 'casual', 'friends', 'moderate', 5, 3, 4, 'happy', ['I had fun with friends', 'I played really well'], 'Finally hit the Erne. Everyone cheered.'],
  [4, 'Pickleball', 75, 'practice', 'club', 'moderate', 4, 3, 4, 'calm', ['I learned something']],
  [1, 'Pickleball', 75, 'match', 'friends', 'moderate', 5, 3, 4, 'energized', ['I had fun with friends', 'I played really well']],
]

const CHECKINS: [number, Mood, number, number, string][] = [
  [20, 'drained', 2, 3, 'Long week at work.'],
  [15, 'frustrated', 2, 3, ''],
  [8, 'calm', 3, 2, ''],
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
    sport: r[1],
    date: at(r[0], 18),
    duration: r[2],
    sessionType: r[3],
    socialContext: r[4],
    intensity: r[5],
    enjoyment: r[6],
    energyBefore: r[7],
    energyAfter: r[8],
    moodAfter: r[9],
    standouts: r[10],
    reflection: r[11] ?? '',
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
      createdAt: seasonStart.toISOString(),
      isDemo: true,
    },
    sessions,
    checkins,
    seasons: [season],
    moments: [],
  }
}
