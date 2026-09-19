// Swim times: "1:47.03" ↔ 107.03 seconds. Hundredths everywhere; never floats in the UI.

export function parseTime(text) {
  if (typeof text !== "string") return null;
  const m = /^\s*(?:(\d{1,2}):)?(\d{1,2})[.,](\d{1,2})\s*$/.exec(text);
  if (!m) return null;
  const minutes = m[1] ? Number(m[1]) : 0;
  const seconds = Number(m[2]);
  if (m[1] && seconds >= 60) return null;
  const hundredths = m[3].length === 1 ? Number(m[3]) * 10 : Number(m[3]);
  return Math.round((minutes * 60 + seconds) * 100 + hundredths) / 100;
}

export function formatTime(seconds, { sign = false } = {}) {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  const neg = seconds < 0;
  const total = Math.round(Math.abs(seconds) * 100);
  const m = Math.floor(total / 6000);
  const s = Math.floor((total % 6000) / 100);
  const h = total % 100;
  const body = m > 0 ? `${m}:${String(s).padStart(2, "0")}.${String(h).padStart(2, "0")}` : `${s}.${String(h).padStart(2, "0")}`;
  return (neg ? "-" : sign ? "+" : "") + body;
}

// A gap in seconds as a swimmer would say it: "0.83 s", "1.2 s", "12 s", "1:03".
export function formatGap(seconds) {
  const a = Math.abs(seconds);
  if (a >= 60) return formatTime(a);
  if (a >= 10) return `${a.toFixed(1)} s`;
  return `${a.toFixed(2)} s`;
}
