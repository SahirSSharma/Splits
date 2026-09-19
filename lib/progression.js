// How a swimmer's times have moved: per-event history with running bests, and a summary per event.
import { parseTime } from "./time.js";

export function history(swims, event) {
  const rows = swims
    .filter((s) => s.event === event && !s.flag)
    .map((s) => ({ ...s, seconds: parseTime(s.time) }))
    .filter((s) => s.seconds != null)
    .sort((a, b) => a.date.localeCompare(b.date));
  let best = Infinity;
  for (const r of rows) {
    r.pb = r.seconds < best;
    r.drop = r.pb && best !== Infinity ? Math.round((best - r.seconds) * 100) / 100 : null;
    if (r.pb) best = r.seconds;
  }
  return rows;
}

// One line per event: first and best swims, how much came off, and what happened in the last year.
export function progression(swims, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const events = [...new Set(swims.map((s) => s.event))];
  const yearAgo = shiftDays(today, -365);
  return events
    .map((event) => {
      const rows = history(swims, event);
      if (!rows.length) return null;
      const best = rows.reduce((a, b) => (b.seconds < a.seconds ? b : a));
      const first = rows[0];
      const recent = rows.filter((r) => r.date >= yearAgo);
      const before = rows.filter((r) => r.date < yearAgo);
      const bestBefore = before.length ? Math.min(...before.map((r) => r.seconds)) : null;
      const bestRecent = recent.length ? Math.min(...recent.map((r) => r.seconds)) : null;
      return {
        event,
        swims: rows.length,
        first: { seconds: first.seconds, date: first.date },
        best: { seconds: best.seconds, date: best.date, meet: best.meet },
        latest: { seconds: rows.at(-1).seconds, date: rows.at(-1).date },
        totalDrop: Math.round((first.seconds - best.seconds) * 100) / 100,
        lastYearDrop: bestBefore != null && bestRecent != null ? Math.round((bestBefore - bestRecent) * 100) / 100 : null,
        stale: best.date < yearAgo,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.swims - a.swims);
}

export function shiftDays(iso, days) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
