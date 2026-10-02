# PLAY ON

**Keep playing. Just play differently.**

Adults rarely quit recreational sport because they get unfit. They quit because it slowly stops being fun. PLAY ON keeps a 30-second memory of each game, so players can spot that drift early and keep playing. Players already talk after games, but those conversations vanish. PLAY ON remembers.

## Who it is for

Recreational athletes: the Sunday pickleball crowd, office table-tennis regulars, weekend tennis and badminton players. That includes people getting back into sport, people playing a lot lately, and people who just love to play. Onboarding asks which one you are and shows the patterns that matter to you first.

## The journey

1. **Welcome**: start your own season, or explore a labelled sample season for "Alex". `#demo` opens the demo in one click.
2. **Onboarding**: one question per screen, including "What brings you here?"
3. **Home**: a mood check-in, your week, your last game, a gentle **Worth noticing** card when enjoyment is drifting (or heavy weeks or soreness are a pattern) with one thing to try, and one pattern we've noticed. Before 5 games it shows "3 of 5 games logged".
4. **Play + Post-game**: about 30 seconds, mostly taps. **Start a game** before you play: answer energy and how you feel going in (excited, nervous, focused…), and a live game with a timer stays on Home and in the nav until you **Finish and reflect** (the clock stops and its minutes are saved as the game length automatically; you only say how hard it was) or cancel. Or **log a past game**. Play is prefilled from your last game, and a 24-hour time dial (or one-tap Morning, Afternoon, Evening, Night) sets when you started. Post-game asks for energy, how your body feels, mood (plus the score for matches), enjoyment, and an optional note. The summary compares energy in and out, and this game with your last one.
5. **Game page**: tap the sport in "Last time you played" (or any game in Profile's history) to see everything about that game: before and after (energy, feelings going in, mood, body, what stood out), length, type, intensity, result, your note, and how it compares with your usual for that sport, with rest days and the week's load. Previous/next game and a link to that sport on the Game Map.
5. **Season**: a 12-week landscape. Each game is a tree, and quiet weeks are meadows. No streaks.
6. **Game Map**: headline numbers, your strongest pattern, a scatter of every game, patterns with the games behind them, moods, a table view, and **filters** (sport, enjoyment, played with, session type, intensity, time of day, length, result, body after, period). Filters drive every section, show counts, sync to the URL (`#/insights?sport=pickleball&enjoy=5`) and use a bottom sheet on mobile. Picking only "Loved it" or "Not great" shows **what your best (or toughest) games have in common**.
7. **Ask PLAY ON**: fixed rules over your own log (respecting active filters). No AI model.
8. **Reset Room**: "Reset after a tough game", box breathing, and five easy recovery stretches (suggested after a game that left you sore or tired).

## Principles in the code

- **Insights stay honest.** `src/lib/insights.ts` runs transparent rules: at least 5 games overall and 2 on each side of a comparison, or the rule stays quiet. Every insight has a basis sentence and the game groups behind it. Rules run on any filtered slice. Rest gaps and weekly load use the full history (`src/lib/derive.ts`).
- **No streaks, no guilt, not medical.** Observations about your own play, never diagnoses or advice.
- **Old data keeps working.** `normalize()` in `src/lib/store.ts` migrates stored `playon:v1` data. The new fields (`result`, `bodyAfter`, `playerType`) are optional.
- **Demo data is labelled.** `src/lib/demo.ts` uses dates relative to today and shows "Sample data" badges everywhere.

## Stack

React 19, TypeScript, Vite 8, Tailwind CSS 4, hand-built SVG charts. No backend. Data lives in `localStorage` (`playon:v1`) and can be downloaded from Profile. Hash routing with an in-memory fallback, so it also works inside sandboxed frames. Supports `prefers-reduced-motion`, keyboard use and screen readers (filter chips are toggle buttons with `aria-pressed`; the mobile filter sheet is a modal dialog).

## Run

```sh
cd playon
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run build      # static site in playon/dist
```

## Deploy on Vercel

- **Root Directory:** `playon`
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install` (default)

No environment variables are needed. Routing is hash-based, so no rewrites are required. Share `https://<your-app>.vercel.app/#demo` for a one-click demo.
