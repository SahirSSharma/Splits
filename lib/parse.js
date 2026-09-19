// Turn pasted text into swims. Accepts the Swimcloud "Times" page copied as text (an event heading,
// then rows of time · flag · meet · date), a USA Swimming or Hy-Tek style table, a CSV with a header,
// or free lines like "100 free 48.77". Anything without a time is skipped and reported.
import { parseTime } from "./time.js";
import { parseEvent, eventKey } from "./events.js";

const DATE_PATTERNS = [
  [/\b([A-Z][a-z]{2})[a-z]*\.? (\d{1,2}), (\d{4})\b/, (m) => iso(m[3], MONTHS[m[1]], m[2])],
  [/\b(\d{4})-(\d{2})-(\d{2})\b/, (m) => iso(m[1], Number(m[2]), m[3])],
  [/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/, (m) => iso(m[3], Number(m[1]), m[2])],
];
const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const iso = (y, m, d) => (m ? `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` : null);
const FLAGS = new Set(["R", "X", "U", "XR", "RX", "A", "CL-B"]);

function findDate(text) {
  for (const [re, make] of DATE_PATTERNS) {
    const m = re.exec(text);
    if (m) { const d = make(m); if (d) return { date: d, rest: text.replace(m[0], " ") }; }
  }
  return { date: null, rest: text };
}

function cells(line) {
  if (line.includes("\t")) return line.split("\t").map((c) => c.trim());
  if (line.includes(",") && !/[A-Za-z]{3} \d{1,2}, \d{4}/.test(line)) return line.split(",").map((c) => c.trim());
  return line.split(/\s{2,}/).map((c) => c.trim());
}

export function parsePaste(text, { course: defaultCourse } = {}) {
  const swims = [], skipped = [];
  let heading = null; // current event from a heading line, Swimcloud style
  let csv = null;     // column map from a CSV header line
  for (const raw of String(text ?? "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = cells(line);
    if (!csv && parts.length >= 2 && parts.every((p) => /^[a-z_ ]+$/i.test(p)) && parts.some((p) => /time/i.test(p))) {
      csv = Object.fromEntries(parts.map((p, i) => [p.toLowerCase().replace(/\s+/g, ""), i]));
      continue;
    }
    if (csv) {
      const time = parseTime(parts[csv.time] ?? "");
      const evText = [parts[csv.event], parts[csv.stroke], parts[csv.distance], parts[csv.course]].filter(Boolean).join(" ");
      const ev = parseEvent(evText, { course: (parts[csv.course] ?? defaultCourse ?? "").toUpperCase() || undefined });
      if (time != null && ev?.course) { swims.push({ event: eventKey(ev), time: parts[csv.time].trim(), date: findDate(parts[csv.date] ?? "").date, meet: parts[csv.meet] ?? null }); continue; }
      skipped.push(line); continue;
    }
    let tokens = parts, free = false;
    let timeIdx = tokens.findIndex((p) => parseTime(p) != null);
    if (timeIdx === -1) {
      // Free-form line ("100 free 48.77"): look for a time among the words.
      tokens = line.split(/\s+/);
      timeIdx = tokens.findIndex((p) => parseTime(p) != null);
      free = true;
    }
    if (timeIdx === -1) {
      // A heading ("100 Free SCY") sets the event for the rows below it.
      const ev = parseEvent(line, { course: defaultCourse });
      if (ev && line.length < 40) heading = ev; else skipped.push(line);
      continue;
    }
    const time = tokens[timeIdx];
    const { date, rest } = findDate(tokens.filter((_, i) => i !== timeIdx).join(free ? " " : "  "));
    const clean = (s) => s.replace(/^[\s()\-–|]+|[\s()\-–|]+$/g, "");
    const others = (free ? [rest] : rest.split(/\s{2,}/)).map(clean).filter(Boolean);
    const flag = others.find((o) => FLAGS.has(o)) ?? null;
    const evText = others.filter((o) => o !== flag).join(" ");
    let ev = parseEvent(evText, { course: defaultCourse });
    if (!ev && heading) ev = heading;
    if (ev && !ev.course && heading?.course) ev = { ...ev, course: heading.course };
    if (!ev?.course) { skipped.push(line); continue; }
    const meet = others.filter((o) => o !== flag && !parseEvent(o)).join(" ") || null;
    swims.push({ event: eventKey(ev), time: time.trim(), date, meet, ...(flag ? { flag } : {}) });
  }
  return { swims, skipped };
}
