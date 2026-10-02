import { useSyncExternalStore } from 'react'
import type { ActivitySession, AppData, CheckIn, Moment, Season, User } from './types'
import { addDays, seasonNameFor, startOfWeek } from './dates'

const KEY = 'playon:v1'
const EMPTY: AppData = { version: 1, user: null, sessions: [], checkins: [], seasons: [], moments: [] }

export const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).slice(0, 18)

const RESULTS: readonly string[] = ['won', 'lost', 'no_score']
const BODIES: readonly string[] = ['fresh', 'tired', 'sore']
const PLAYER_TYPES: readonly string[] = ['comeback', 'high_volume', 'casual']
const arr = <T>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : [])

/**
 * Brings any stored v1 data up to the current shape. New fields are optional, so old
 * sessions load untouched; anything malformed is dropped instead of crashing a screen.
 */
export function normalize(parsed: Partial<AppData>): AppData {
  const sessions = arr<ActivitySession>(parsed.sessions)
    .filter((s) => s && typeof s.id === 'string' && typeof s.date === 'string' && !Number.isNaN(Date.parse(s.date)))
    .map((s) => {
      const out: ActivitySession = {
        ...s,
        sport: String(s.sport ?? 'Other'),
        duration: Number(s.duration) || 0,
        enjoyment: Math.min(5, Math.max(1, Number(s.enjoyment) || 3)),
        energyBefore: Math.min(5, Math.max(1, Number(s.energyBefore) || 3)),
        energyAfter: Math.min(5, Math.max(1, Number(s.energyAfter) || 3)),
        standouts: arr<string>(s.standouts),
        reflection: typeof s.reflection === 'string' ? s.reflection : '',
      }
      // Results only make sense for matches; drop unknown values.
      if (!(out.result && RESULTS.includes(out.result) && out.sessionType === 'match')) delete out.result
      if (!(out.bodyAfter && BODIES.includes(out.bodyAfter))) delete out.bodyAfter
      return out
    })
  const user = parsed.user ? { ...parsed.user } : null
  if (user && user.playerType && !PLAYER_TYPES.includes(user.playerType)) delete user.playerType
  return {
    version: 1,
    user,
    sessions,
    checkins: arr(parsed.checkins),
    seasons: arr(parsed.seasons),
    moments: arr(parsed.moments),
  }
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as AppData
    if (parsed?.version !== 1) return EMPTY
    return normalize(parsed)
  } catch {
    return EMPTY
  }
}

let state: AppData = load()
const listeners = new Set<() => void>()

function commit(next: AppData) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable (private mode) — keep working in memory */
  }
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useData = () => useSyncExternalStore(subscribe, () => state)
export const getData = () => state

export function makeSeason(userId: string, from: Date, weeklyGoal: number): Season {
  const start = startOfWeek(from)
  return {
    id: uid(),
    userId,
    name: `${seasonNameFor(from)} Season`,
    startDate: start.toISOString(),
    endDate: addDays(start, 12 * 7 - 1).toISOString(),
    weeklyGoal,
  }
}

export const actions = {
  replaceAll(next: AppData) {
    commit(next)
  },
  startFresh(user: User) {
    commit({ ...EMPTY, user, seasons: [makeSeason(user.id, new Date(), user.weeklyGoal)] })
  },
  updateUser(patch: Partial<User>) {
    if (!state.user) return
    const user = { ...state.user, ...patch }
    const seasons =
      patch.weeklyGoal != null
        ? state.seasons.map((s, i) => (i === state.seasons.length - 1 ? { ...s, weeklyGoal: patch.weeklyGoal! } : s))
        : state.seasons
    commit({ ...state, user, seasons })
  },
  addSession(s: ActivitySession) {
    commit({ ...state, sessions: [...state.sessions, s] })
  },
  updateSession(id: string, patch: Partial<ActivitySession>) {
    commit({ ...state, sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
  },
  deleteSession(id: string) {
    commit({ ...state, sessions: state.sessions.filter((s) => s.id !== id) })
  },
  addCheckIn(c: CheckIn) {
    commit({ ...state, checkins: [...state.checkins, c] })
  },
  addMoment(m: Moment) {
    commit({ ...state, moments: [...state.moments, m] })
  },
  startNewSeason() {
    if (!state.user) return
    commit({ ...state, seasons: [...state.seasons, makeSeason(state.user.id, new Date(), state.user.weeklyGoal)] })
  },
  reset() {
    commit(EMPTY)
  },
}

/** Sessions sorted oldest → newest. */
export const sortedSessions = (d: AppData) =>
  [...d.sessions].sort((a, b) => a.date.localeCompare(b.date))

export const currentSeason = (d: AppData): Season | undefined => d.seasons[d.seasons.length - 1]
