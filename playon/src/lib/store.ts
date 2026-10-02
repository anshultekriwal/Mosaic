import { useSyncExternalStore } from 'react'
import type { ActivitySession, AppData, CheckIn, Moment, Season, User } from './types'
import { addDays, seasonNameFor, startOfWeek } from './dates'

const KEY = 'playon:v1'
const EMPTY: AppData = { version: 1, user: null, sessions: [], checkins: [], seasons: [], moments: [] }

export const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).slice(0, 18)

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as AppData
    if (parsed?.version !== 1) return EMPTY
    return { ...EMPTY, ...parsed }
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
  /** Drop today's check-ins so the mood can be picked again. */
  undoCheckInToday() {
    const today = new Date().toDateString()
    commit({ ...state, checkins: state.checkins.filter((c) => new Date(c.date).toDateString() !== today) })
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
