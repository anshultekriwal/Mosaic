# Mosaic Wellness Builder Round

Read `HANDOFF.md` first. It holds the full project history, the brief (submission due 3 October, 15:00), the live Artifact links and the open next steps.

## Quick facts

- Two separate apps, both built with React 19, Vite and Tailwind v4. Neither has a backend; data lives in `localStorage`.
  - **PLAY ON** (main submission) is in `playon/`. It uses TypeScript, and its storage key is `playon:v1`. Run `cd playon && npm install && npm run dev`.
  - **Steady** (an earlier panic-response app) is at the repo root and uses plain JavaScript. Run `npm install && npm run dev`.
- PLAY ON uses hash routing with an in-memory fallback so it works inside sandboxed frames (Artifacts). Keep that fallback.
- Main open task: deploy `playon/` publicly (Vercel or Netlify with root `playon`, build `npm run build`, output `dist`) and write the submission blurb.

When anything significant changes, update `HANDOFF.md` so the history stays current.
