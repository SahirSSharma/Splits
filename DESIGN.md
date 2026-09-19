# Splits — design

**Tagline:** How far are you from the cut? Paste your times and see the standard you are closest to, by how much,
what that is per 50, how each event has moved, and your Swimcloud Power Index — from the official published
tables, with the source and the date on every number.

Built for Beginner's Paradise — FirstCommit (Aug 21 – Sep 30, 2026). Fresh repo; all code written inside the window.

## Why this shape
- A swimmer's times live on Swimcloud and in USA Swimming's SWIMS database; the cuts live in PDFs on
  usaswimming.org, one per meet, and in club handouts. Nobody puts the two side by side. Swimmers work it out
  by hand at the kitchen table before every taper.
- The cuts are public, structured and small (four PDFs, ~600 numbers). That is an ingest, not a database.
- Swimcloud sits behind Cloudflare: a server cannot fetch a profile, and scraping it is against its terms. So the
  input is the swimmer's own copy of their times — pasted, uploaded, or typed — and everything runs in the browser.
  Nothing is stored anywhere; a share link carries the swims in the URL.

## Architecture
```
paste / CSV / typed times ──▶ lib/parse.js ──▶ swims[]  (+ profile: gender, age today, grad class)
                                                │
              data/standards.json ──▶ lib/standards.js  ──▶ cuts[]  → closest cuts, ladder per event
              data/powerindex.json ──▶ lib/powerindex.js ──▶ Power Index + per-event points   (Sahir's module)
                                       lib/progression.js ──▶ per-event history, running PBs, last-year drop
                                                │
                                          React pages (static; no API route, no key, no server state)
```
- `scripts/ingest.mjs` downloads the USA Swimming PDFs, runs `pdftotext -layout`, parses the tables and writes
  `data/standards.json`. It is committed; a Vercel build never runs the ingest.
- `scripts/demo.mjs` builds `data/demo.json` (the demo swimmer) from a Swimcloud event-history export kept outside
  the repo. Only official individual swims are kept. The output carries the swimmer's age on the build date, not a
  birthdate and not per-swim ages.
- Everything in `lib/` is plain ESM with no framework imports so it runs in `node --test` and in the browser.

## Data contracts
**Swim** (what the parser produces and every module consumes):
```json
{ "event": "100 FR SCY", "time": "48.77", "date": "2025-03-02", "meet": "Speedo Sectionals - Oceanside", "flag": "R" }
```
`event` is `<distance> <stroke> <course>`: stroke ∈ FR BK BR FL IM, course ∈ SCY SCM LCM (`lib/events.js`).
`time` is the string as swum; `lib/time.js` converts. `date` ISO or null. `flag` is optional: `R` relay lead-off,
`X` extracted split, `U` user-entered, `A` altitude-adjusted — flagged swims are shown but never count as bests.

**Profile:** `{ "gender": "M"|"F", "age": 18, "gradClass": 2026 }`. `age` is the swimmer's age **today**, typed by the
swimmer (the demo file records the age on the day it was built). Cuts are measured against the bracket that
age falls in now: motivational 10U · 11-12 · 13-14 · 15-16 · 17-18 (none at 19+); Futures 18U / 19O; Sectionals
all ages; Junior Nationals 18U. USA Swimming applies age on the first day of a meet; "today" is the honest
approximation for "what applies to me now", and the UI names the bracket it used.

**`data/standards.json`** — `{ fetchedAt, sets: [...] }`, each set:
```json
{ "id": "motivational-2028", "kind": "motivational", "name": "USA Swimming Motivational Standards 2025–2028",
  "url": "https://www.usaswimming.org/…/2028-motivational-standards-age-group.pdf",
  "levels": ["B","BB","A","AA","AAA","AAAA"],
  "times": { "M|17-18|100 FR SCY": { "B": 60.29, "BB": 55.99, "A": 51.69, "AA": 49.59, "AAA": 47.39, "AAAA": 45.29 } } }
{ "id": "futures-2026", "kind": "meet", "name": "2026 TYR Futures Championships", "url": "…", "ages": ["18U","19O"],
  "qualifying": "June 1, 2025 through entry deadline", "times": { "M|18U|100 FR SCY": 46.39 } }
```
Sets: `motivational-2028` (482 ladders), `sectionals-2026` (USA Swimming's *maximum* standards — a zone or LSC may
be faster), `futures-2026`, `jrnats-2026`, `jrnats-2026-bonus`. Relays are dropped. The 2026 Winter Junior
Championships PDF is an image with no text layer and is not ingested.

**Cut** (`lib/standards.js` → `cuts()`): one per (personal best, standard that applies):
```json
{ "event": "100 FR SCY", "pb": { "seconds": 48.77, "time": "48.77", "date": "2025-03-02", "meet": "…" },
  "set": "motivational-2028", "setName": "…", "level": "AAA", "highest": "AA", "ages": "17-18",
  "cut": 47.39, "gap": 1.38, "achieved": false, "pct": 0.0291, "per50": 0.69 }
```
`gap` = pb − cut in seconds (positive: still slower). `pct` = gap ÷ cut, the number "closest" sorts by so a 50 and a
mile compare fairly. `per50` = gap ÷ (distance ÷ 50). For motivational sets `level` is the next level not yet made
(`AAAA` with `achieved: true` when everything is made) and `highest` the best level made.

**Progression** (`lib/progression.js`): `history(swims, event)` → chronological rows with `pb` and `drop`;
`progression(swims)` → per event `{ swims, first, best, latest, totalDrop, lastYearDrop, stale }`.

**Power Index** (`lib/powerindex.js`, `data/powerindex.json`) — spec for Sahir's module:
- `baseTime({ gradClass, gender, course, slot })` → the base time in seconds from the class table (2028 uses the 2027
  table via `classAliases`), or `null` where the table has no cell. Slots are the 18 NCAA events with 500/1000/1650 y
  folded into 400/800/1500 (`eventSlot` in `lib/events.js`).
- `powerPoints(T, B)` = `((T / B)^3 − 1) × 100 + 1`, clamped to [1, 100], rounded to 2 dp **per event before aggregating**.
- `powerIndex(pointsBySlot)` = `(p1 + p2 + 0.25·p3 + 0.02·p4) / 2.27` over the four lowest, a missing 3rd/4th
  padded with 100, rounded to 2 dp; `null` with fewer than two slots.
- `swimmerPowerIndex({ swims, gender, gradClass })` → `{ index, events: [{ slot, course, event, time, base, points }] }`,
  one course per slot (whichever scores lowest — no time conversion), official individual swims only.
- Source: Sahir's reverse-engineering note of 2026-09-16 (99.6 % exact over 278 live profiles). The class-2027/28
  table is Swimcloud's published one; the class-2026 table is back-solved and **provisional** — the UI says so.
  Swimcloud does not compute an index for the class of 2025 or earlier, so the demo swimmer's card is labelled
  "as a class-of-2026 swimmer".

**`data/demo.json`:** `{ name, gender, age, ageAsOf, gradClass, club, source, note, swims: [Swim] }` — 373 official
individual swims, 2017–2025, 30 events.

## Stack (all declared for the hackathon)
Next.js 16 (App Router, JavaScript), React 19, Tailwind CSS 4, Vercel. `node --test` for tests; `pdftotext`
(poppler) for the ingest only. No database, no API key, no server route.

## Deployment
Vercel. Every push → preview deployment (= staging, reported with its URL). Production only on an explicit go.

## Decisions log
- 2026-09-18 — **Fresh product, fresh code.** Sahir has a private July-2026 repo, SwimmingRank (Python, a
  rankings-and-times viewer over USA Swimming exports). Splits is a different product — cuts, gaps and Power Index
  over a swimmer's own pasted times — in a different language with zero shared code. That repo was not opened
  during this build. The Power Index note it cites is Sahir's own research from 2026-09-16, inside the window.
- 2026-09-18 — Input is paste/CSV/typed, never a fetch of Swimcloud: Cloudflare returns 403 to servers, scraping
  is against its terms, and a swimmer copying their own page is the honest path. Verified: `curl` of a times page → 403.
- 2026-09-18 — Fully static; no `/api`. Every computation is a pure function in `lib/`, tested in Node, run in the
  browser. "Same structure as Standing" means the docs, tests, staging and Devpost discipline — not its server shape.
- 2026-09-18 — Standards are ingested from USA Swimming's own PDFs with `pdftotext -layout` and committed; the
  ingest records the URL and fetch date. Winter Juniors 2026 skipped (image-only PDF). Sectionals uses the
  national maximum sheet and says so.
- 2026-09-18 — Demo data keeps only unflagged rows of the Swimcloud event histories (373 of 416): relay lead-offs,
  extracted splits, user-entered and league-tagged times are dropped so every demo best is an official swim.
- 2026-09-18 — Age is a typed input (age today), not a birthdate; brackets are named on screen. The demo swimmer
  turns 19 on Oct 4, inside judging; `ageAsOf` is recorded so the change is visible rather than silent.
- 2026-09-18 — `lib/powerindex.js` is specified, tested and left unwritten for Sahir (FirstCommit's AI rule and the
  30 % Learning & Growth criterion). Its tests are marked `todo` so `npm test` stays a usable regression gate;
  they turn into real passes when he writes it. The UI shows the card as "coming" meanwhile.
- 2026-09-18 — Working name "Splits". It was chosen for the race-pacing idea, which is cut from scope (input
  burden: one race page per swim). Renaming is one `gh repo rename` if Sahir prefers a name that says cuts.
