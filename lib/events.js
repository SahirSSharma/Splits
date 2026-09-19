// Event names in every spelling swimmers meet — "100 Free", "100 freestyle Prelims", "100 FR SCY",
// "100 Fly", "100 Butterfly", "400/500 FR" — to one key: "100 FR SCY".

export const STROKES = { FR: "Free", BK: "Back", BR: "Breast", FL: "Fly", IM: "IM" };
export const COURSES = { SCY: "yards", SCM: "short course metres", LCM: "long course metres" };

const STROKE_WORDS = [
  [/\b(fr|free|freestyle)\b/i, "FR"],
  [/\b(bk|back|backstroke)\b/i, "BK"],
  [/\b(br|breast|breaststroke|brst)\b/i, "BR"],
  [/\b(fl|fly|butterfly)\b/i, "FL"],
  [/\b(im|medley|individual medley)\b/i, "IM"],
];
const RELAY = /\b(relay|-r|fr-r|med-r|medley relay|free relay|4x\d+)\b/i;

export function parseEvent(text, { course: defaultCourse } = {}) {
  if (typeof text !== "string") return null;
  const t = text.replace(/\s+/g, " ").trim();
  if (RELAY.test(t)) return null;
  const dist = /(?:^|\D)(\d{2,4})(?:\s*\/\s*(\d{2,4}))?\s*(?:y|yd|yards|m|meters|metres)?\b/i.exec(t);
  if (!dist) return null;
  const stroke = STROKE_WORDS.find(([re]) => re.test(t))?.[1];
  if (!stroke) return null;
  const courseMatch = /\b(SCY|SCM|LCM)\b/i.exec(t);
  const course = courseMatch ? courseMatch[1].toUpperCase() : defaultCourse ?? null;
  let distance = Number(dist[1]);
  if (dist[2]) distance = course === "SCY" ? Number(dist[2]) : Number(dist[1]); // "400/500 FR"
  if (![25, 50, 100, 200, 400, 500, 800, 1000, 1500, 1650].includes(distance)) return null;
  if (stroke === "IM" && ![100, 200, 400].includes(distance)) return null;
  return { distance, stroke, course };
}

export function eventKey({ distance, stroke, course }) {
  return `${distance} ${stroke} ${course}`;
}

export function eventLabel({ distance, stroke }) {
  return `${distance} ${STROKES[stroke]}`;
}

// Distance families across courses (500 y ≈ 400 m …), so a swimmer's "500 Free" and "400 Free" share a slot.
export function eventSlot({ distance, stroke }) {
  const d = { 500: 400, 1000: 800, 1650: 1500 }[distance] ?? distance;
  return `${d} ${stroke}`;
}

export function splitKey(key) {
  const [distance, stroke, course] = key.split(" ");
  return { distance: Number(distance), stroke, course };
}
