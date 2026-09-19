// Swimcloud Power Index — Sahir's module.
//
// The formula and the base tables come from Sahir's own reverse-engineering note
// (SwimCloud-PowerIndex-Formula.md, 2026-09-16; 99.6 % exact reproduction over 278 live profiles).
// The spec is in DESIGN.md ("Power Index") and the tests in test/powerindex.test.js reproduce the five
// published swimmers from that note. This file is left for Sahir to write; the tests fail until it is.
//
// Contract:
//   baseTime({ gradClass, gender, course, slot })  → seconds or null (data/powerindex.json; 2028 → 2027 table)
//   powerPoints(timeSeconds, baseSeconds)          → ((T/B)^3 − 1) × 100 + 1, clamped to [1, 100], rounded to 2 dp
//   powerIndex(pointsBySlot)                       → (p1 + p2 + 0.25·p3 + 0.02·p4) / 2.27 over the four lowest,
//                                                    3rd/4th padded with 100, rounded to 2 dp; null under two slots
//   swimmerPowerIndex({ swims, gender, gradClass }) → { index, events: [{ slot, course, event, time, base, points }] }
//                                                    one course per slot (the course that scores lowest), only
//                                                    official individual swims (no `flag`), only eligible slots

export function baseTime() {
  throw new Error("TODO(Sahir): baseTime — see DESIGN.md › Power Index");
}

export function powerPoints() {
  throw new Error("TODO(Sahir): powerPoints — see DESIGN.md › Power Index");
}

export function powerIndex() {
  throw new Error("TODO(Sahir): powerIndex — see DESIGN.md › Power Index");
}

export function swimmerPowerIndex() {
  throw new Error("TODO(Sahir): swimmerPowerIndex — see DESIGN.md › Power Index");
}
