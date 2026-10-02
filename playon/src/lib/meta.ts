import type { BodyAfter, Intensity, Level, Mood, PlayerType, Result, SessionType, Social, WellnessGoal } from './types'

export const RESULTS: { id: Result; label: string }[] = [
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
  { id: 'no_score', label: 'No score' },
]
export const resultLabel = (r: Result) => RESULTS.find((x) => x.id === r)?.label ?? r

export const BODIES: { id: BodyAfter; label: string }[] = [
  { id: 'fresh', label: 'Fresh' },
  { id: 'tired', label: 'Tired' },
  { id: 'sore', label: 'Sore' },
]
export const bodyLabel = (b: BodyAfter) => BODIES.find((x) => x.id === b)?.label ?? b

export const PLAYER_TYPES: { id: PlayerType; label: string; hint: string }[] = [
  { id: 'comeback', label: 'Getting back into sport', hint: 'Easing back in after time away' },
  { id: 'high_volume', label: 'Playing a lot lately', hint: 'Most weeks have several games' },
  { id: 'casual', label: 'Just love playing', hint: 'Here for the fun of it' },
]

export const MOODS: { id: Mood; label: string; glyph: string }[] = [
  { id: 'happy', label: 'Happy', glyph: '🙂' },
  { id: 'calm', label: 'Calm', glyph: '😌' },
  { id: 'energized', label: 'Energized', glyph: '⚡' },
  { id: 'neutral', label: 'Neutral', glyph: '😐' },
  { id: 'frustrated', label: 'Frustrated', glyph: '😤' },
  { id: 'drained', label: 'Drained', glyph: '😴' },
]
export const moodLabel = (m: Mood) => MOODS.find((x) => x.id === m)?.label ?? m
export const moodGlyph = (m: Mood) => MOODS.find((x) => x.id === m)?.glyph ?? ''
export const POSITIVE_MOODS: Mood[] = ['happy', 'calm', 'energized']

// Fixed order — colour follows the entity, never its rank.
export const SOCIALS: { id: Social; label: string; color: string }[] = [
  { id: 'friends', label: 'Friends', color: 'var(--c-friends)' },
  { id: 'club', label: 'Club', color: 'var(--c-club)' },
  { id: 'tournament', label: 'Tournament', color: 'var(--c-tournament)' },
  { id: 'solo', label: 'Solo', color: 'var(--c-solo)' },
  { id: 'family', label: 'Family', color: 'var(--c-family)' },
  { id: 'other', label: 'Other', color: 'var(--c-other)' },
]
export const socialLabel = (s: Social) => SOCIALS.find((x) => x.id === s)?.label ?? s
export const socialColor = (s: Social) => SOCIALS.find((x) => x.id === s)?.color ?? 'var(--c-other)'

export const INTENSITIES: { id: Intensity; label: string; hint: string }[] = [
  { id: 'easy', label: 'Easy', hint: 'Could chat the whole time' },
  { id: 'moderate', label: 'Moderate', hint: 'Working, but comfortable' },
  { id: 'hard', label: 'Hard', hint: 'Left it all out there' },
]
export const intensityLabel = (i: Intensity) => INTENSITIES.find((x) => x.id === i)?.label ?? i

export const SESSION_TYPES: { id: SessionType; label: string }[] = [
  { id: 'match', label: 'Match' },
  { id: 'casual', label: 'Casual hit' },
  { id: 'practice', label: 'Practice' },
  { id: 'lesson', label: 'Lesson' },
]
export const sessionTypeLabel = (t: SessionType) => SESSION_TYPES.find((x) => x.id === t)?.label ?? t

export const LEVELS: { id: Level; label: string; hint: string }[] = [
  { id: 'new', label: 'Just starting', hint: 'Still learning the basics' },
  { id: 'casual', label: 'Casual', hint: 'I play when I can' },
  { id: 'regular', label: 'Regular', hint: 'It is part of my week' },
  { id: 'competitive', label: 'Competitive', hint: 'Leagues, ladders, tournaments' },
]

export const FREQUENCIES = ['Rarely', 'A few times a month', 'Once a week', '2–3 times a week', '4+ times a week']

export const GOALS: { id: WellnessGoal; label: string }[] = [
  { id: 'energized', label: 'Feel more energized' },
  { id: 'consistent', label: 'Stay consistent' },
  { id: 'enjoy', label: 'Enjoy my sport more' },
  { id: 'pressure', label: 'Manage competition pressure' },
  { id: 'routine', label: 'Build a healthier routine' },
  { id: 'patterns', label: 'Understand my patterns' },
]

export const SPORTS = [
  'Pickleball',
  'Table Tennis',
  'Tennis',
  'Badminton',
  'Basketball',
  'Cricket',
  'Football',
  'Golf',
  'Running',
  'Swimming',
  'Cycling',
  'Squash',
  'Padel',
  'Yoga',
  'Climbing',
  'Volleyball',
]

export const STANDOUTS = [
  'I played really well',
  'I learned something',
  'I had fun with friends',
  'It was challenging',
  'I felt competitive',
  'I needed a break',
  'Something else',
]

export const ENERGY_WORDS = ['Running on empty', 'Low', 'Steady', 'Good', 'Buzzing']
