# Changelog

## 2026-09-18 — Day 1: repo, data, core libraries
- Scaffolded with create-next-app 16.3.5 (JavaScript, App Router, Tailwind 4, ESLint), `type: module`, scripts
  `test` / `ingest` / `demo`. Source-available LICENSE. `.env*.local`, `.vercel` and the session log gitignored.
- `scripts/ingest.mjs`: USA Swimming's 2025–2028 motivational standards and the 2026 Sectionals, Futures and
  Junior Nationals sheets → `data/standards.json` (seconds, keyed `gender|ages|event`). Committed.
- `scripts/demo.mjs`: demo swimmer's 373 official individual swims → `data/demo.json`.
- `lib/time.js`, `lib/events.js`, `lib/standards.js`, `lib/progression.js`, `lib/parse.js` with `node --test` suites.
- `lib/powerindex.js` specified and stubbed for Sahir; `data/powerindex.json` holds the base tables from his
  2026-09-16 note; `test/powerindex.test.js` reproduces the five published swimmers and fails until he writes it.
- DESIGN.md contracts and decisions, PROGRESS.md plan through Sept 29, LEARNING.md scaffold, README with the AI
  disclosure draft, `devpost/HACKATHON.md` (rules, dates, criteria, prizes, deltas from LexHack).
