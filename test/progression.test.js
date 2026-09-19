import test from "node:test";
import assert from "node:assert/strict";
import { history, progression, shiftDays } from "../lib/progression.js";

const swims = [
  { event: "100 FR SCY", time: "52.00", date: "2023-01-10", meet: "A" },
  { event: "100 FR SCY", time: "50.10", date: "2024-12-21", meet: "B" },
  { event: "100 FR SCY", time: "51.00", date: "2024-01-05", meet: "C" },
  { event: "100 FR SCY", time: "48.77", date: "2025-03-02", meet: "D" },
  { event: "100 FR SCY", time: "48.00", date: "2025-03-03", meet: "E", flag: "U" },
  { event: "50 FR SCY", time: "22.13", date: "2025-02-22", meet: "F" },
];

test("history is chronological with running PBs", () => {
  const h = history(swims, "100 FR SCY");
  assert.deepEqual(h.map((r) => r.date), ["2023-01-10", "2024-01-05", "2024-12-21", "2025-03-02"]);
  assert.deepEqual(h.map((r) => r.pb), [true, true, true, true]);
  assert.deepEqual(h.map((r) => r.drop), [null, 1, 0.9, 1.33]);
});

test("progression summary", () => {
  const p = progression(swims, { today: "2025-09-18" });
  const fr = p.find((e) => e.event === "100 FR SCY");
  assert.equal(fr.swims, 4);
  assert.equal(fr.totalDrop, 3.23);
  assert.equal(fr.best.seconds, 48.77);
  assert.equal(fr.lastYearDrop, 2.23); // best before 2024-09-18 was 51.00; since then 48.77
  assert.equal(fr.stale, false);
  const fifty = p.find((e) => e.event === "50 FR SCY");
  assert.equal(fifty.lastYearDrop, null);
  assert.equal(p[0].event, "100 FR SCY");
});

test("stale when the best is more than a year old", () => {
  const p = progression(swims, { today: "2026-09-18" });
  assert.equal(p.find((e) => e.event === "100 FR SCY").stale, true);
});

test("shiftDays", () => {
  assert.equal(shiftDays("2026-03-01", -1), "2026-02-28");
  assert.equal(shiftDays("2025-09-18", -365), "2024-09-18");
});
