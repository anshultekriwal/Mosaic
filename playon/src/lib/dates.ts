const DAY = 86_400_000

export const startOfDay = (d: Date) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/** Monday-based week start. */
export const startOfWeek = (d: Date) => {
  const x = startOfDay(d)
  const dow = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - dow)
  return x
}

export const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export const daysBetween = (a: Date, b: Date) =>
  Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY)

export const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6

export function relativeDay(iso: string, now = new Date()) {
  const n = daysBetween(new Date(iso), now)
  if (n <= 0) return 'Today'
  if (n === 1) return 'Yesterday'
  if (n < 7) return new Date(iso).toLocaleDateString(undefined, { weekday: 'long' })
  if (n < 14) return 'Last week'
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })

export function greeting(now = new Date()) {
  const h = now.getHours()
  if (h < 5) return 'Late night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function seasonNameFor(d: Date) {
  const m = d.getMonth()
  if (m >= 2 && m <= 4) return 'Spring'
  if (m >= 5 && m <= 7) return 'Summer'
  if (m >= 8 && m <= 10) return 'Autumn'
  return 'Winter'
}

export const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
