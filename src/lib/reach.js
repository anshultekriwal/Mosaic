// Opening the phone's dialer and messages app.
//
// A web page can only hand a number to the phone: it cannot place a call or
// send a text by itself, cannot do both from one tap, and cannot tell whether
// a call was answered. Each launch must happen inside a tap handler.

// Inside a frame (an embed or preview) a tel:/sms: link would navigate the
// frame itself, which many hosts block, leaving an error page where the app
// was. There we open a new browsing context instead.
export const framed = (() => {
  try {
    return window.self !== window.top
  } catch {
    return true
  }
})()

export const frameSafe = framed ? { target: '_blank', rel: 'noopener' } : {}

export const telUrl = (number) => `tel:${number}`

// `sms:NUMBER?&body=` is the form both iOS Messages and Android accept.
export const smsUrl = (number, body) =>
  `sms:${number}${body ? `?&body=${encodeURIComponent(body)}` : ''}`

/** Open a tel:/sms: URL. Call only from a tap handler. */
export function launch(url) {
  try {
    const a = document.createElement('a')
    a.href = url
    if (framed) {
      a.target = '_blank'
      a.rel = 'noopener'
    }
    document.body.appendChild(a)
    a.click()
    a.remove()
  } catch {
    /* nothing more we can do; the number is still shown on screen */
  }
}

export const callPerson = (c) => launch(telUrl(c.phone))
export const textPerson = (c, message) => launch(smsUrl(c.phone, message))
