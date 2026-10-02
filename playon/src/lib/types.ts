export type Mood = 'happy' | 'calm' | 'energized' | 'neutral' | 'frustrated' | 'drained'
export type Social = 'solo' | 'friends' | 'club' | 'tournament' | 'family' | 'other'
export type Intensity = 'easy' | 'moderate' | 'hard'
export type SessionType = 'match' | 'practice' | 'casual' | 'lesson'
export type Level = 'new' | 'casual' | 'regular' | 'competitive'
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
}
