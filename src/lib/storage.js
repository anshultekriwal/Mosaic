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

// One trusted contact the user can call or text from a session.
const CONTACT_KEY = 'steady.contact.v1'

export const DEFAULT_MESSAGE =
  'I’m having a hard time right now. Can you call me or come and be with me?'

export function loadContact() {
  try {
    const c = JSON.parse(localStorage.getItem(CONTACT_KEY) || 'null')
    return c && c.phone ? c : null
  } catch {
    return null
  }
}

export function saveContact(contact) {
  try {
    if (contact) localStorage.setItem(CONTACT_KEY, JSON.stringify(contact))
    else localStorage.removeItem(CONTACT_KEY)
  } catch {
    /* storage blocked */
  }
}

/** Keep a leading + and digits only, so tel:/sms: links are valid. */
export function cleanPhone(raw) {
  const s = String(raw || '').trim()
  return (s.startsWith('+') ? '+' : '') + s.replace(/\D/g, '')
}
