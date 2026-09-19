// Which cut is closest? Reads data/standards.json (built by scripts/ingest.mjs) and measures every
// personal best against every standard that applies to the swimmer's age today.
import standards from "../data/standards.json" with { type: "json" };
import { parseTime } from "./time.js";
import { splitKey } from "./events.js";

export const SETS = standards.sets;
export const FETCHED_AT = standards.fetchedAt;
export const LEVELS = ["B", "BB", "A", "AA", "AAA", "AAAA"];

// USA Swimming motivational groups. Age is the swimmer's age today; 19 and over have no motivational standard.
export function ageGroup(age) {
  if (age == null || age > 18) return null;
  if (age <= 10) return "10U";
  if (age <= 12) return "11-12";
  if (age <= 14) return "13-14";
  if (age <= 16) return "15-16";
  return "17-18";
}

// The age bracket a meet's standards use for this swimmer, or null when the meet does not take their age.
export function meetAges(set, age) {
  if (set.ages.includes("ALL")) return "ALL";
  if (age == null) return set.ages.includes("18U") ? "18U" : null;
  if (age <= 18) return set.ages.includes("18U") ? "18U" : null;
  return set.ages.includes("19O") ? "19O" : null;
}

// Fastest official swim per event key. Swims carry `event` ("100 FR SCY") and `time` ("48.77").
export function personalBests(swims) {
  const best = new Map();
  for (const s of swims) {
    const seconds = parseTime(s.time);
    if (seconds == null || s.flag) continue;
    const cur = best.get(s.event);
    if (!cur || seconds < cur.seconds || (seconds === cur.seconds && s.date < cur.date)) best.set(s.event, { ...s, seconds });
  }
  return best;
}

function describe(event, pb, cut) {
  const { distance } = splitKey(event);
  const gap = Math.round((pb.seconds - cut) * 100) / 100; // > 0: still slower than the cut
  return { gap, achieved: gap <= 0, pct: gap / cut, per50: gap / (distance / 50) };
}

// Every (event, standard) pair for this swimmer. Motivational sets yield the next level not yet made
// (and the highest level made); meet sets yield the one cut for the swimmer's bracket.
export function cuts({ swims, gender, age }) {
  const bests = personalBests(swims);
  const group = ageGroup(age);
  const out = [];
  for (const [event, pb] of bests) {
    for (const set of SETS) {
      if (set.kind === "motivational") {
        if (!group) continue;
        const ladder = set.times[`${gender}|${group}|${event}`];
        if (!ladder) continue;
        const made = LEVELS.filter((l) => pb.seconds <= ladder[l]);
        const next = LEVELS.find((l) => pb.seconds > ladder[l]);
        const highest = made.at(-1) ?? null;
        if (next) out.push({ event, pb, set: set.id, setName: set.name, level: next, cut: ladder[next], ages: group, highest, ...describe(event, pb, ladder[next]) });
        else out.push({ event, pb, set: set.id, setName: set.name, level: "AAAA", cut: ladder.AAAA, ages: group, highest, ...describe(event, pb, ladder.AAAA) });
      } else {
        const ages = meetAges(set, age);
        if (!ages) continue;
        const cut = set.times[`${gender}|${ages}|${event}`];
        if (cut == null) continue;
        out.push({ event, pb, set: set.id, setName: set.name, level: null, cut, ages, ...describe(event, pb, cut) });
      }
    }
  }
  return out;
}

// The cuts still ahead, nearest first. `sets` limits to some standard ids.
export function closest(all, { n = 5, sets } = {}) {
  return all
    .filter((c) => !c.achieved && (!sets || sets.includes(c.set)))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, n);
}

export function setById(id) {
  return SETS.find((s) => s.id === id);
}
