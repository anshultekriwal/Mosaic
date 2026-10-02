// Small wrappers around optional browser features. All fail silently.

export function vibrate(pattern) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern)
    }
  } catch {
    /* unsupported */
  }
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Keep the screen awake during a session where supported.
let sentinel = null
let wanted = false

async function acquire() {
  try {
    if (wanted && !sentinel && navigator.wakeLock && document.visibilityState === 'visible') {
      sentinel = await navigator.wakeLock.request('screen')
      sentinel.addEventListener?.('release', () => {
        sentinel = null
      })
    }
  } catch {
    sentinel = null
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', acquire)
}

export function keepAwake(on) {
  wanted = on
  if (on) acquire()
  else if (sentinel) {
    sentinel.release().catch(() => {})
    sentinel = null
  }
}
