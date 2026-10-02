export type Mood = 'happy' | 'calm' | 'energized' | 'neutral' | 'frustrated' | 'drained'
export type Social = 'solo' | 'friends' | 'club' | 'tournament' | 'family' | 'other'
export type Intensity = 'easy' | 'moderate' | 'hard'
export type SessionType = 'match' | 'practice' | 'casual' | 'lesson'
export type Level = 'new' | 'casual' | 'regular' | 'competitive'
export type Result = 'won' | 'lost' | 'no_score'
export type BodyAfter = 'fresh' | 'tired' | 'sore'
export type PlayerType = 'comeback' | 'high_volume' | 'casual'
export type WellnessGoal =
  | 'energized'
  | 'consistent'
  | 'enjoy'
  | 'pressure'
  | 'routine'
  | 'patterns'

export interface User {
  id: string
  name: string
  primarySport: string
  sports: string[]
  experienceLevel: Level
  currentFrequency: string
  weeklyGoal: number
  wellnessGoal: WellnessGoal[]
  /** Optional: "What brings you here?" Orders which insights surface first. */
  playerType?: PlayerType
  createdAt: string
  isDemo: boolean
}

export interface ActivitySession {
  id: string
  userId: string
  sport: string
  date: string // ISO
  duration: number // minutes
  sessionType: SessionType
  intensity: Intensity
  socialContext: Social
  enjoyment: number // 1-5
  energyBefore: number // 1-5
  energyAfter: number // 1-5
  moodAfter: Mood
  standouts: string[]
  reflection: string
  /** Optional, only asked for matches. */
  result?: Result
  /** Optional: how the body felt afterwards. */
  bodyAfter?: BodyAfter
  /** Optional: how the player felt going in, captured when a game is started live. */
  feelingsBefore?: string[]
}

/** A game that has been started but not yet reflected on. Lives until Finish or Cancel. */
export interface ActiveGame {
  sport: string
  startedAt: string // ISO
  sessionType: SessionType
  socialContext: Social
  energyBefore: number // 1-5
  feelingsBefore: string[]
  /** Asked when the game ends, not before. Older stored games may still carry one. */
  intensity?: Intensity
}

export interface CheckIn {
  id: string
  userId: string
  date: string
  mood: Mood
  energy: number // 1-5
  stress: number // 1-3
  note: string
}

export interface Season {
  id: string
  userId: string
  name: string
  startDate: string
  endDate: string
  weeklyGoal: number
}

export interface Moment {
  id: string
  date: string
  text: string
}

export interface AppData {
  version: 1
  user: User | null
  sessions: ActivitySession[]
  checkins: CheckIn[]
  seasons: Season[]
  moments: Moment[]
  /** Optional: the game currently being played. */
  active?: ActiveGame | null
}
