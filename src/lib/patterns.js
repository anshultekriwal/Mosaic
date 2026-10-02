// Plain-language pattern lines for the log.

const PARTS = [
  ['night', (h) => h < 5 || h >= 22],
  ['morning', (h) => h >= 5 && h < 12],
  ['afternoon', (h) => h >= 12 && h < 17],
  ['evening', (h) => h >= 17 && h < 22],
]

export function partOfDay(ts) {
  const h = new Date(ts).getHours()
  return PARTS.find(([, test]) => test(h))[0]
}

// The single most common value, or null when there is a tie or too little data.
function mostCommon(values) {
  const counts = new Map()
  values.forEach((v) => v && counts.set(v, (counts.get(v) || 0) + 1))
  const ranked = [...counts].sort((a, b) => b[1] - a[1])
  if (!ranked.length || ranked[0][1] < 2) return null
  if (ranked[1] && ranked[1][1] === ranked[0][1]) return null
  return ranked[0][0]
}

export function patternLines(episodes) {
  if (episodes.length < 2) return []
  const lines = []
  const part = mostCommon(episodes.map((e) => partOfDay(e.start)))
  lines.push(part ? `Most episodes happen in the ${part}.` : 'Episodes happen at different times of day.')

  const trigger = mostCommon(episodes.map((e) => (e.trigger === 'Don’t know' ? null : e.trigger)))
  if (trigger) lines.push(`${trigger} comes up most often.`)

  const paired = episodes.filter((e) => e.before?.bpm && e.after?.bpm)
  if (paired.length >= 2) {
    const drop = paired.reduce((s, e) => s + (e.before.bpm - e.after.bpm), 0) / paired.length
    if (drop >= 2) lines.push(`Your breathing slows by about ${Math.round(drop)} breaths a minute by the end.`)
  }
  return lines
}
