// Build data/demo.json — the demo swimmer's official individual swims — from a Swimcloud event-history
// export kept outside the repo (DEMO_SOURCE). Only rows with no flag are kept: relay lead-offs (R),
// extracted splits (X), user-entered times (U) and league-tagged rows are dropped, so every demo time is
// an official individual swim. Ages are computed here from a birthdate that is not committed.
import { readFileSync, writeFileSync } from "node:fs";

const src = process.env.DEMO_SOURCE;
const born = process.env.DEMO_BORN; // YYYY-MM-DD, never written to the output
if (!src || !born) { console.error("Set DEMO_SOURCE=<event-histories.json> and DEMO_BORN=YYYY-MM-DD"); process.exit(1); }

const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
function isoDate(s) { // "Mar 1, 2025"
  const m = /^([A-Z][a-z]{2}) (\d{1,2}), (\d{4})$/.exec(s.trim());
  return `${m[3]}-${String(MONTHS[m[1]]).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}
function ageOn(iso, dob) {
  const [y, m, d] = iso.split("-").map(Number), [by, bm, bd] = dob.split("-").map(Number);
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
}
const STROKE = { Free: "FR", Back: "BK", Breast: "BR", Fly: "FL", IM: "IM" };

const histories = JSON.parse(readFileSync(src, "utf8"));
const swims = [];
let dropped = 0;
for (const [label, { rows }] of Object.entries(histories)) {
  const [dist, strokeName, course] = label.split(" ");
  for (const r of rows) {
    const [time, flag, meet, date] = r.cells;
    if (flag !== "" || r.flags.length) { dropped++; continue; }
    const iso = isoDate(date);
    swims.push({ event: `${dist} ${STROKE[strokeName]} ${course}`, time, date: iso, meet });
  }
}
swims.sort((a, b) => a.date.localeCompare(b.date) || a.event.localeCompare(b.event));
const today = new Date().toLocaleDateString("sv-SE"); // local YYYY-MM-DD
const demo = {
  name: "Sahir", gender: "M", age: ageOn(today, born), ageAsOf: today, gradClass: 2025,
  club: "Palo Alto Stanford Aquatics", source: "Swimcloud swimmer profile 1376522, event histories captured 2026-09-15",
  note: `${swims.length} official individual swims kept; ${dropped} relay lead-offs, extracted splits, user-entered and league-tagged rows dropped.`,
  swims,
};
writeFileSync("data/demo.json", JSON.stringify(demo, null, 1) + "\n");
console.log(demo.note, `${swims[0].date} → ${swims.at(-1).date}`);
