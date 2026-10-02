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
