// Fetch USA Swimming's published time standards (PDF) and parse them into data/standards.json.
// Requires `pdftotext` (poppler) on PATH. Run: npm run ingest
// Every time is stored in seconds. Keys are `${gender}|${ages}|${distance} ${stroke} ${course}`.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "https://www.usaswimming.org/docs/default-source/timesdocuments/time-standards";
const SOURCES = [
  { id: "motivational-2028", kind: "motivational", name: "USA Swimming Motivational Standards 2025–2028",
    file: "2025/2028-motivational-standards-age-group.pdf", levels: ["B", "BB", "A", "AA", "AAA", "AAAA"] },
  { id: "sectionals-2026", kind: "meet", name: "2026 Speedo Sectionals (maximum standards)",
    file: "2026/2026_speedosectionals_timestandards_max.pdf", qualifying: "June 1, 2025 through entry deadline",
    note: "USA Swimming's maximum standards; a zone or LSC may publish faster cuts for its own Sectionals meet." },
  { id: "futures-2026", kind: "meet", name: "2026 TYR Futures Championships",
    file: "2026/2026_tyrfutureschampionships_timestandards-2.pdf", qualifying: "June 1, 2025 through entry deadline" },
  { id: "jrnats-2026", kind: "meet", name: "2026 Speedo Junior National Championships",
    file: "2026/2026_speedojuniornationalchampionships_timestandards.pdf", qualifying: "June 1, 2025 through entry deadline",
    note: "18 & under meet. The bonus standards are kept as a separate set." },
];
// Skipped: the 2026 Winter Junior Championships PDF is an image with no text layer.

const out = join(process.cwd(), "data");
const cache = join(process.cwd(), ".cache", "standards");
mkdirSync(out, { recursive: true });
mkdirSync(cache, { recursive: true });

export function toSeconds(t) {
  const m = /^(?:(\d+):)?(\d{1,2})\.(\d{2})$/.exec(t.trim());
  if (!m) return null;
  return (m[1] ? Number(m[1]) * 60 : 0) + Number(m[2]) + Number(m[3]) / 100;
}
const TIME = String.raw`(?:\d{1,2}:)?\d{1,2}\.\d{2}`;

async function text(src) {
  const pdf = join(cache, src.id + ".pdf");
  if (!existsSync(pdf)) {
    const res = await fetch(`${BASE}/${src.file}`, { headers: { "user-agent": "Mozilla/5.0 (Splits ingest)" } });
    if (!res.ok) throw new Error(`${src.id}: HTTP ${res.status}`);
    writeFileSync(pdf, Buffer.from(await res.arrayBuffer()));
  }
  return execFileSync("pdftotext", ["-layout", pdf, "-"], { encoding: "utf8" });
}

function parseMotivational(txt, levels) {
  const times = {};
  let ages = null;
  const row = new RegExp(String.raw`^\s*((?:${TIME}\s*\*?\s*){6})\s+(\d+)\s+(FR|BK|BR|FL|IM)\s+(SCY|SCM|LCM)\s+((?:${TIME}\s*\*?\s*){6})\s*$`);
  for (const line of txt.split("\n")) {
    const h = /^\s*(10 & under|\d{2}-\d{2}) Girls\s+Event\s+\1 Boys/.exec(line);
    if (h) { ages = h[1] === "10 & under" ? "10U" : h[1]; continue; }
    const m = row.exec(line);
    if (!m || !ages) continue;
    const girls = m[1].replace(/\*/g, "").trim().split(/\s+/).map(toSeconds); // B … AAAA
    const boys = m[5].replace(/\*/g, "").trim().split(/\s+/).map(toSeconds);  // AAAA … B
    const event = `${m[2]} ${m[3]} ${m[4]}`;
    times[`F|${ages}|${event}`] = Object.fromEntries(levels.map((l, i) => [l, girls[i]]));
    times[`M|${ages}|${event}`] = Object.fromEntries(levels.map((l, i) => [l, boys[5 - i]]));
  }
  return times;
}

// Meet sheets: WOMEN SCY, WOMEN LCM, EVENT, MEN LCM, MEN SCY. "400/500 FR" is 400 m or 500 y.
function parseMeet(txt) {
  const sections = []; // { ages, bonus, times }
  let cur = null;
  const cell = String.raw`(${TIME}|x)`;
  const row = new RegExp(String.raw`^\s*${cell}\s+${cell}\s+(\d+)(?:/(\d+))?\s+(FR|BK|BR|FL|IM)\s+${cell}\s+${cell}\s*$`);
  for (const line of txt.split("\n")) {
    const h = /^\s*WOMEN\s+(.*?STANDARDS)\s+MEN\s*$/.exec(line);
    if (h) {
      const label = h[1];
      cur = { ages: /18 & UNDER/.test(label) ? "18U" : /19 & OVER/.test(label) ? "19O" : "ALL",
              bonus: /BONUS/.test(label), times: {} };
      sections.push(cur);
      continue;
    }
    const m = row.exec(line);
    if (!m || !cur) continue;
    const [wScy, wLcm, d1, d2, stroke, mLcm, mScy] = m.slice(1);
    const yards = d2 ? d2 : d1, metres = d1;
    const put = (g, course, dist, t) => { if (t !== "x") cur.times[`${g}|${cur.ages}|${dist} ${stroke} ${course}`] = toSeconds(t); };
    put("F", "SCY", yards, wScy); put("F", "LCM", metres, wLcm);
    put("M", "LCM", metres, mLcm); put("M", "SCY", yards, mScy);
  }
  return sections;
}

const sets = [];
for (const src of SOURCES) {
  const txt = await text(src);
  if (src.kind === "motivational") {
    const times = parseMotivational(txt, src.levels);
    sets.push({ id: src.id, kind: src.kind, name: src.name, url: `${BASE}/${src.file}`, levels: src.levels, times });
    console.log(`${src.id}: ${Object.keys(times).length} rows`);
  } else {
    const sections = parseMeet(txt);
    const main = Object.assign({}, ...sections.filter((s) => !s.bonus).map((s) => s.times));
    sets.push({ id: src.id, kind: "meet", name: src.name, url: `${BASE}/${src.file}`, qualifying: src.qualifying,
                note: src.note, ages: src.id === "jrnats-2026" ? ["18U"] : [...new Set(sections.filter((s) => !s.bonus).map((s) => s.ages))],
                times: src.id === "jrnats-2026" ? Object.fromEntries(Object.entries(main).map(([k, v]) => [k.replace("|ALL|", "|18U|"), v])) : main });
    const bonus = sections.filter((s) => s.bonus);
    if (bonus.length) {
      const t = Object.fromEntries(Object.entries(Object.assign({}, ...bonus.map((s) => s.times))).map(([k, v]) => [k.replace("|ALL|", "|18U|"), v]));
      sets.push({ id: src.id + "-bonus", kind: "meet", name: src.name + " — bonus standards", url: `${BASE}/${src.file}`,
                  qualifying: src.qualifying, note: "Bonus cuts: enterable only once a swimmer holds a qualifying standard in another event.", ages: ["18U"], times: t });
    }
    console.log(`${src.id}: ${sections.map((s) => `${s.ages}${s.bonus ? " bonus" : ""}=${Object.keys(s.times).length}`).join(", ")}`);
  }
}
const result = { fetchedAt: new Date().toISOString().slice(0, 10), sets };
writeFileSync(join(out, "standards.json"), JSON.stringify(result, null, 1) + "\n");
console.log(`wrote data/standards.json (${sets.length} sets)`);
