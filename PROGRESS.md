# Progress

Deadline: **Sept 30, 2026, 2:00 pm PDT** (5 pm EDT). Target submission: **Sept 29**. Standing's LexHack deadline
(Sept 27) runs alongside: its video Sept 24, its submission Sept 26.

| Day | Date | Goal | Status |
|---|---|---|---|
| 1 | Sep 18 | Repo, contracts, standards ingest, demo data, core libs with tests, staging | done — details below |
| 2 | Sep 19 | UI v1: paste box + demo, closest cuts, per-event ladders; real Swimcloud paste captured as a fixture | |
| 3 | Sep 20 | Progression view; share link; 390–2560 px pass; staging | |
| 4 | Sep 21 | **Sahir writes `lib/powerindex.js`** (tests go green) and the first LEARNING.md entries; Power Index card | |
| 5 | Sep 22 | Design pass (Best Design prize): identity, motion, empty states; copy | |
| 6 | Sep 23 | Second swimmer's paste end to end; edge cases the eval finds; README + AI disclosure final | |
| — | Sep 24 | Standing: demo video | |
| 7 | Sep 25 | Devpost package: copy, thumbnail, gallery | |
| — | Sep 26 | Standing: LexHack submission. **Hedge:** Standing also entered in FirstCommit (FirstCommit-shaped copy + fuller AI disclosure in its README) | |
| 8 | Sep 27 | Buffer / polish | |
| 9 | Sep 28 | Splits demo video (3–5 min: what, process, challenges, learning) | |
| 10 | Sep 29 | Submit Splits on Devpost | |

## Sahir's files — the build is gated on these
- `lib/powerindex.js` — spec in DESIGN.md › Power Index; `npm test` fails on `test/powerindex.test.js` until written.
- `LEARNING.md` — headings and prompts are in place; the entries are his.
- The README's "AI disclosure" paragraph — a draft is there; the final wording is his.

## Where the AI chat history lives (the rules say organizers may ask for it)
- Day 1 was run from a Claude Code session whose working directory was the Standing repo, so its hook log is
  `~/Desktop/Standing/.claude/session-log.jsonl` and its transcript is under
  `~/.claude/projects/-Users-sahir-Desktop-Standing/`. From day 2, sessions start in `~/Desktop/Splits`, so the
  log accrues at `~/Desktop/Splits/.claude/session-log.jsonl` (gitignored, kept) and the transcripts under
  `~/.claude/projects/-Users-sahir-Desktop-Splits/`.

## Day 1 — what works (2026-09-18)
- `npm run ingest`: four USA Swimming PDFs → `data/standards.json`: 482 motivational ladders (5 age groups × 3
  courses × up to 18 events × 2 genders), Sectionals 68 cuts, Futures 136 (18U + 19O), Junior Nationals 68 + 68
  bonus. Every ladder checked monotonic B → AAAA by a test. Winter Juniors skipped (image PDF).
- `npm run demo`: 373 official individual swims for the demo swimmer, 2017-03-18 → 2025-03-02, 30 events; 43
  flagged rows dropped. Only the swimmer's age on the build date is stored; per-swim ages are not (they would pin the birthday).
- `lib/`: time parsing/formatting, event normalisation (every spelling → `100 FR SCY`), standards (age brackets,
  personal bests, cuts, closest), progression (history with running PBs, per-event summary), paste parser
  (Swimcloud times layout, free-form lines, CSV with header). `npm test`: 25 pass; the four `powerindex`
  tests run as `todo` (they print, they fail, the suite still exits 0) until Sahir writes the module.

## Staging
- Preview (staging): https://splits-m9hh2t8q5-sss-4bfd.vercel.app — the day-1 placeholder page, read back through
  `vercel curl` (heading, 822 standards / 5 sets, 373 demo swims). Preview URLs sit behind Vercel's login, so open
  it signed in; a public production URL comes with the domain, on an explicit go.
- **Note:** the very first `vercel deploy` (no flags) from `main` was recorded as a *Production* deployment
  (`splits-f853baocj-sss-4bfd.vercel.app`, placeholder content, no domain attached). Not intended; nothing public
  points at it. Every deploy from here on is `vercel deploy --target=preview`.
- `vercel git connect` could not link the GitHub repo: the Vercel account has no GitHub login connection. Deploys
  stay CLI-driven (as with Standing). Optional: add the connection at vercel.com/account/login-connections.

## Not yet verified
- **A real clipboard paste from Swimcloud.** The parser is built against the page's row structure (time · flag ·
  meet · date under an event heading) and a synthetic fixture. Sahir copies his own Times page once; it becomes
  `test/fixtures/swimcloud-real.txt`.
- No UI yet beyond a placeholder; nothing on staging has been looked at in a browser.
- Whether Vercel's build tolerates `import … with { type: "json" }` in client components (Node 24 does).
