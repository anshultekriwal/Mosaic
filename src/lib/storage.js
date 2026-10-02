// Episodes live only in this browser's localStorage.
const KEY = 'steady.episodes.v1'

export function loadEpisodes() {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* storage full or blocked: nothing else we can do */
  }
}

/** Insert or replace an episode by id. */
export function saveEpisode(episode) {
  const list = loadEpisodes().filter((e) => e.id !== episode.id)
  list.push(episode)
  write(list)
}

export function clearEpisodes() {
  write([])
}

// "My circle": up to three people, in the order Steady should reach them.
const CIRCLE_KEY = 'steady.circle.v1'
const LEGACY_CONTACT_KEY = 'steady.contact.v1' // single contact, before the circle

export const MAX_CONTACTS = 3

export const DEFAULT_MESSAGE =
  'I’m having a hard time right now. Can you call me or come and be with me?'

export function loadCircle() {
  try {
    const c = JSON.parse(localStorage.getItem(CIRCLE_KEY) || 'null')
    if (c && Array.isArray(c.contacts)) {
      return {
        contacts: c.contacts.filter((x) => x && x.phone).slice(0, MAX_CONTACTS),
        message: c.message || DEFAULT_MESSAGE,
      }
    }
    const old = JSON.parse(localStorage.getItem(LEGACY_CONTACT_KEY) || 'null')
    if (old && old.phone) {
      return { contacts: [{ name: old.name || '', phone: old.phone }], message: old.message || DEFAULT_MESSAGE }
    }
  } catch {
    /* fall through */
  }
  return { contacts: [], message: DEFAULT_MESSAGE }
}

export function saveCircle(circle) {
  try {
    localStorage.setItem(CIRCLE_KEY, JSON.stringify(circle))
    localStorage.removeItem(LEGACY_CONTACT_KEY)
  } catch {
    /* storage blocked */
  }
}

/** Keep a leading + and digits only, so tel:/sms: links are valid. */
export function cleanPhone(raw) {
  const s = String(raw || '').trim()
  return (s.startsWith('+') ? '+' : '') + s.replace(/\D/g, '')
}
