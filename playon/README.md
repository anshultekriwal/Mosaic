# PLAY ON

**A wellness companion for people who love to play.**

PLAY ON is for recreational athletes: the Sunday pickleball crowd, the office table-tennis regulars, the weekend golfers. Most fitness apps ask *how much did you do?* PLAY ON asks *how did playing affect you?*, and over a season turns those answers into a picture of what keeps you coming back.

> Keep playing. Just play differently.

## The journey

1. **Welcome**: you can start your own season, or explore a demo with a clearly labelled sample season for "Alex".
2. **Onboarding**: one question per screen: your sports, experience level, how often you play now, what you want from the app, and a weekly *intention* (not a rule).
3. **Home**: a quick mood check-in, your season at a glance, your last session, one thing we've noticed, and a Reset Room suggestion matched to how you feel.
4. **Play**: log a session in about 30 seconds (sport, length, type, who you played with, intensity, energy going in).
5. **Post-game**: a full-screen "GAME OVER. How did it feel?" moment. You rate your energy, mood, enjoyment and what stood out, and can add an optional note. It ends with a session summary and one honest line drawn from your data.
6. **Season**: a 12-week season shown as a landscape. Each session is a tree (taller means you enjoyed it more), milestones are flags, quiet weeks are meadows, and the weeks still to come are hatched. There are no streaks. A week you didn't play is labelled "rest".
7. **Insights / Your Game Map**: headline numbers, your strongest pattern, and a scatter of every session (minutes against enjoyment or energy change, coloured by who you played with). Tap a pattern to see exactly which sessions it came from. There is also a table view.
8. **Ask PLAY ON**: ask questions like "why have I been enjoying pickleball less lately?". Answers are worked out by fixed rules from your log only. No AI model is involved, and the answers say so.
9. **Reset Room**: 60–150 second exercises: reset after a tough game (breathing plus one question), clear your head (box breathing), capture the moment, and recovery stretches.

## Principles in the code

- **Insights stay honest.** `src/lib/insights.ts` runs transparent rules. A rule needs at least 5 sessions overall and 2 on each side of a comparison, otherwise it stays quiet. Every insight carries the sentence explaining what was compared and the sessions behind it.
- **Demo data is labelled as demo.** It is built in `src/lib/demo.ts` with dates relative to today. Every screen shows a "Sample data" badge while it is loaded, and one click clears it.
- **Nothing punishes you.** There are no streaks and no red warnings. After 7 days away you see "Welcome back."
- **Not medical.** The app shares observations about your own play, never diagnoses or advice.

## Stack

React 19, TypeScript, Vite and Tailwind CSS v4. There is no backend. Data is stored in `localStorage` (`playon:v1`) and you can download it from Profile. Charts and the season landscape are hand-built SVG. Fonts are Fraunces and Inter.

Accessibility: semantic landmarks, labelled controls, radio and checkbox roles on chips, keyboard-reachable chart marks with text labels, a table view of the chart data, visible focus rings, and support for `prefers-reduced-motion`.

## Run

```sh
cd playon
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in playon/dist
```

To deploy, `dist/` is a static site that uses relative paths. On Vercel or Netlify, set the root directory to `playon`, the build command to `npm run build`, and the output directory to `dist`.
