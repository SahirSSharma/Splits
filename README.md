# Splits

**How far are you from the cut?** Paste your swim times — copied from your Swimcloud page, a results sheet, or
typed — and Splits shows the standard you are closest to and by how much, per 50; every event's ladder from B to
AAAA and the meet cuts (Sectionals, Futures, Junior Nationals) that apply to your age; how each event has moved
since your first swim; and your Swimcloud Power Index, with the base time each event was scored against. Every
number links to the official USA Swimming sheet it came from, with the date it was fetched.

Built for [Beginner's Paradise — FirstCommit](https://firstcommit.devpost.com/) (Aug 21 – Sep 30, 2026).
Submission copy in [devpost/SUBMISSION.md](devpost/SUBMISSION.md); the hackathon's rules and criteria in
[devpost/HACKATHON.md](devpost/HACKATHON.md).

_Status: day 1 — data and core libraries, see PROGRESS.md._

## Run locally
```bash
npm install
npm run dev      # http://localhost:3000 — data/ is committed, no ingest needed
npm test         # node --test: time, events, standards, progression, parse, powerindex
npm run ingest   # re-fetch USA Swimming's PDFs → data/standards.json (needs `pdftotext` from poppler)
npm run demo     # rebuild data/demo.json from a Swimcloud event-history export (DEMO_SOURCE, DEMO_BORN)
```
No API key, no database, no server route: everything runs in the browser from two committed JSON files.

## Stack
- **Next.js 16** (App Router, JavaScript), **React 19**, **Tailwind CSS 4**, deployed on **Vercel**.
- Node's built-in test runner. `pdftotext` (poppler) for the ingest only.

## How it works
1. `lib/parse.js` turns pasted text into swims: `{ event: "100 FR SCY", time: "48.77", date, meet, flag? }`.
   It understands the Swimcloud Times page copied as text, CSV with a header, and lines like `100 free 48.77`.
2. `lib/standards.js` finds each event's personal best (flagged swims — relay lead-offs, extracted splits,
   user-entered — never count) and measures it against every standard that applies to the swimmer's age today.
   "Closest" sorts by gap ÷ cut so a 50 and a mile compare fairly.
3. `lib/progression.js` builds each event's history with running bests and the drop in the last year.
4. `lib/powerindex.js` computes the Swimcloud Power Index from the base tables in `data/powerindex.json`.
5. `data/standards.json` is built by `scripts/ingest.mjs` from USA Swimming's own PDFs. Contracts in [DESIGN.md](DESIGN.md).

## Data
- USA Swimming 2025–2028 Motivational Standards (age group); 2026 Speedo Sectionals maximum standards; 2026 TYR
  Futures Championships; 2026 Speedo Junior National Championships (with bonus standards). All from
  usaswimming.org/times/time-standards. The 2026 Winter Juniors sheet is an image and is not included.
- Swimcloud Power Index base times: Swimcloud's published class-of-2027/28 table, and a class-of-2026 table
  back-solved from live profiles (provisional, labelled as such).
- The demo swimmer is me: 373 official individual swims, 2017–2025, from my own Swimcloud profile.

## Tests
`npm test` runs every suite in `test/`. `standards.test.js` also checks the whole ingested corpus: every ladder
complete and strictly faster from B to AAAA.

## AI disclosure
_Draft — final wording is mine._ I built Splits with Claude Code as a pair programmer. I chose the product, the
scope and the data sources; it scaffolded the project, wrote the ingest, the parsers and their tests to contracts we
agreed in DESIGN.md, and reviewed my code. I wrote `lib/powerindex.js` myself from my own reverse-engineering of
the Swimcloud Power Index, and the entries in LEARNING.md. Every commit was reviewed and run by me before it was
pushed. The full session transcripts are kept and available on request.

## Credits
- USA Swimming for publishing the standards; Swimcloud for the times pages swimmers paste from.
- Geist typefaces (Vercel) via `next/font/google`.
- Not affiliated with or endorsed by USA Swimming or Swimcloud.
