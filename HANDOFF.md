# Handoff: Mosaic Wellness Builder Round

Context for continuing this work in a new Claude conversation. Paste this whole file in as your first message.

## The brief

Mosaic Wellness, CEO's Office, Builder Round. Build a consumer health and wellness web app with a coding agent. Submit by **3 October, 15:00**:
- a working app link
- a short description (who it's for, what it does, what makes it interesting)
- optional: source code, demo video, AI tools used

## Repo

- GitHub: `anshultekriwal/mosaic`, branch `claude/kind-archimedes-h45d6m` (everything is pushed)
- The repo holds two separate apps. Both use React 19, Vite and Tailwind v4, have no backend, and store data in `localStorage`.

| App | Folder | Live Artifact (private until shared) |
|---|---|---|
| **PLAY ON** (the main submission) | `playon/` | https://claude.ai/artifact/TDawQSWrGPqYKirvP5czn1 |
| **Steady** (earlier idea) | repo root | https://claude.ai/artifact/PttNmQj3BFWcX69LLk5g7n |

Neither app has a public deployment yet. **This is the main open task.**

---

## PLAY ON: wellness companion for recreational athletes

**Idea:** most fitness apps ask "how much did you do?". PLAY ON asks "how did playing affect you?", then turns a season of short reflections into personal patterns. There are no streaks and no guilt messages. Tagline: *Keep playing. Just play differently.*

**Stack:** TypeScript, React 19, Vite 8, Tailwind 4, and hand-built SVG charts with no chart library. Data lives in `localStorage` under the key `playon:v1`. Routing is hash-based with an in-memory fallback, so the app also works inside sandboxed frames such as Artifacts.

**Screens** (`playon/src/screens/`):
- `Welcome`: hero page with **Start your season** and **Explore a demo**.
- `Onboarding`: name, sports, experience, how often you play now, goals, weekly intention (1–5). Then "Your Autumn Season starts now".
- `Home`: mood check-in (mood, energy, stress, note), sessions this week against the intention, last session, "Something we've noticed", and a Reset suggestion. Shows "Welcome back" after 7+ days away.
- `Play`: 30-second session log (sport, length, type, played with, intensity, energy before, date).
- `PostGame`: full screen "GAME OVER. How did it feel?". Asks energy, mood, stars and what stood out, plus an optional note. Ends with a session summary and one line based on the data.
- `Season`: 12-week landscape SVG. Sessions are trees (height = enjoyment), milestones are flags, empty weeks are "rest" meadows, future weeks are hatched. A week-by-week timeline sits below.
- `Insights` (Game Map):
  - hero numbers and the strongest pattern;
  - a scatter of minutes against enjoyment or energy change, coloured by who you played with, with legend filters and a table view;
  - pattern rows with comparison bars, plus "Show these sessions on the map" to highlight them;
  - a mood distribution;
  - **Ask PLAY ON**: deterministic keyword-routed answers from the log (`lib/ask.ts`), with no AI model.
- `Reset`: four exercises:
  - Reset after a tough game: 50 s of 4/6 breathing, then one question;
  - Clear your head: 90 s box breathing;
  - Capture the moment: save a note;
  - Recovery mode: 5 stretches × 30 s.
- `Profile`: preferences, history with remove, data download, clear all, and "Start my own season" to leave the demo.

**Logic** (`playon/src/lib/`):
- `insights.ts`: rule-based insights covering social context, session length vs energy, competitive frustration, weekends, low-energy days and intensity. Thresholds: at least 5 sessions in total and at least 2 per group. Each insight carries a `basis` sentence and the groups of sessions behind it.
- `demo.ts`: demo user "Alex" with 15 hand-written sessions (pickleball and table tennis) and dates relative to today. Flagged with `isDemo` and shown with "Sample data" badges.
- `season.ts`, `store.ts` (store built on useSyncExternalStore), `dates.ts`, `meta.ts` (labels and a categorical palette checked with a colour validator).

**Design:** deep forest `#1e3a2d`, cream `#f5f0e6`, paper `#fbf8f1`, ember accent `#d9622b`, plus sage, lavender and sky. Fonts are Fraunces (serif display) and Inter. Animations are subtle and respect `prefers-reduced-motion`. Mobile has bottom navigation; desktop has a sidebar.

**Run / deploy:**
```sh
cd playon && npm install && npm run dev    # npm run build -> playon/dist
```
On Vercel or Netlify, set the root directory to `playon`, the build command to `npm run build`, and the output directory to `dist`.

**To rebuild the Artifact:** run `npm run build`, then inline `dist/assets/*.css` into a `<style>` and `dist/assets/*.js` into a `<script type="module">`. Add `<title>PLAY ON</title>`, the Google Fonts link and `<div id="root">` (no html/head/body tags). Publish to the same Artifact URL.

**Known limits:** "Download my data" does nothing inside the Artifact viewer, which blocks downloads; it works in a normal deployment.

---

## Steady: guided panic-response app (repo root)

React and Vite in plain JavaScript, mobile-first, with a dark calm UI. Flow: **I need help now** → measure breathing rate by tapping on each in-breath (hand tremor read from DeviceMotion when available) → a one-line reflection → a breathing pacer that eases to 4 s in / 6 s out → check-in. "Better" leads to an optional pulse tap and then a summary with before/after and an optional trigger tag. "Same/Worse" leads to 5-4-3-2-1 grounding and back to the pacer.

Also included:
- **My circle**: up to 3 trusted contacts, reached in order through `tel:`/`sms:` links. Falls back to the Tele-MANAS helpline 14416.
- A 112 notice on every session screen.
- A log with patterns, a simulated wearable preview, "How this works", and a practice mode.

Run it with `npm install && npm run dev` at the repo root. Details are in the root `README.md`.

---

## Suggested next steps

1. Deploy `playon/` publicly (Vercel or Netlify) and submit that link.
2. Write the submission blurb. The core statement: *PLAY ON helps recreational athletes understand how sport makes them feel, build sustainable routines around activities they love, and keep playing for the long game.*
3. Optional: record a 2–3 minute demo: Explore a demo → log a session → post-game → Season → Game Map ("See where this comes from") → Reset Room.
