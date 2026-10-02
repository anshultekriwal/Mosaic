# Steady

A calm, mobile-first web app that guides someone through a panic response,
one step at a time. React + Vite + Tailwind. No backend, no login. Episodes are
stored only in the browser's `localStorage`.

## Run

```sh
npm install
npm run dev         # http://localhost:5173
npm run dev:https   # self-signed HTTPS on your LAN, for testing on a phone
npm run build       # static site in dist/
```

Motion sensors and vibration need a secure context, so test on phones over
HTTPS (`dev:https`, or deploy `dist/` to any static HTTPS host). The build uses
relative paths, so it works from a sub-folder too.

## Flow

1. **Home**: "I need help now". On iOS this tap also requests motion permission.
2. **Measure**: tap on each in-breath (4 taps → breaths/min). Hand tremor is read in
   the background from `DeviceMotion` (linear acceleration RMS over 5 s, taps masked
   out) and bucketed steady / slightly shaky / shaky. If unavailable it's skipped silently.
3. **Reflect**: one sentence from the readings; auto-advances after 4 s.
4. **Pacer**: starts at the measured rate and eases to 4 s in / 6 s out over ~2 min,
   with vibration cues where supported.
5. **Check-in**: Better → pulse. Same/Worse → 5-4-3-2-1 grounding → pacer again.
   Every second "not better" shows "Call someone you trust", Tele-MANAS 14416 and 112.
6. **Pulse** (skippable): tap with your heartbeat for 15 s.
7. **Summary**: re-measure, before/after, optional trigger tag. Saved automatically.

Also: **My log** (episodes and simple patterns), **Wearable preview** (simulated
heart-rate feed), **How this works**, and **Practise when calm** (pacer + check-in
only, nothing saved).

Every session screen carries "Severe chest pain or feel faint? Call 112".

**Settings** holds one trusted contact (name, number, and a ready-written text
message). Once set, "Call" and "Text" links for them sit beside the 112 link on
every session screen, and become the first options on the "Call someone you
trust" screen. Calls and texts open the phone's own dialer and messages app via
`tel:` and `sms:` links; Steady sends nothing itself.

## Notes

- Tremor thresholds (`src/lib/motion.js`) are heuristics for a hand-held phone,
  not clinical measurements.
- Screen wake lock is requested during a session where supported.
- `prefers-reduced-motion` swaps the growing circle for a gentle brightness change
  and turns off fades and ripples.

This is not a diagnosis or a treatment.
