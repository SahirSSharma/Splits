// Reproduces the published numbers in SwimCloud-PowerIndex-Formula.md. These fail until lib/powerindex.js is written.
import test from "node:test";
import assert from "node:assert/strict";
import { baseTime, powerPoints, powerIndex, swimmerPowerIndex } from "../lib/powerindex.js";

test("base times come from the class table, 2028 shares 2027", () => {
  assert.equal(baseTime({ gradClass: 2027, gender: "M", course: "SCY", slot: "100 FR" }), 42.39);
  assert.equal(baseTime({ gradClass: 2028, gender: "M", course: "SCY", slot: "100 FR" }), 42.39);
  assert.equal(baseTime({ gradClass: 2026, gender: "M", course: "SCY", slot: "100 FR" }), 42.69);
  assert.equal(baseTime({ gradClass: 2026, gender: "F", course: "SCY", slot: "100 IM" }), 52.99);
  assert.equal(baseTime({ gradClass: 2027, gender: "F", course: "LCM", slot: "100 IM" }), null);
  assert.equal(baseTime({ gradClass: 2026, gender: "F", course: "SCM", slot: "400 FR" }), null);
});

test("power points: base time scores exactly 1.00, slower scores more, clamped", () => {
  assert.equal(powerPoints(42.39, 42.39), 1);
  assert.equal(powerPoints(48.77, 42.69), 50.1); // ((48.77/42.69)^3 − 1) × 100 + 1
  assert.equal(powerPoints(60, 42.39), 100);
  assert.equal(powerPoints(40, 42.39), 1);
});

test("power index reproduces the five published swimmers", () => {
  assert.equal(powerIndex({ a: 6.69, b: 8.01 }), 18.37);
  assert.equal(powerIndex({ a: 8.42, b: 13.08, c: 15.33 }), 12.04);
  assert.equal(powerIndex({ a: 11.25, b: 18.82, c: 33.13 }), 17.78);
  assert.equal(powerIndex({ a: 9.72, b: 18.77, c: 40.21 }), 17.86);
  assert.equal(powerIndex({ a: 16.63, b: 18.27, c: 20.91 }), 18.56);
  assert.equal(powerIndex({ a: 5, b: 6, c: 7, d: 8, e: 9 }), 5.69); // only the four lowest count
  assert.equal(powerIndex({ a: 5 }), null);
});

test("a swimmer's index uses one course per slot and skips flagged swims", () => {
  const swims = [
    { event: "100 FR SCY", time: "48.77", date: "2025-03-02" },
    { event: "100 FR LCM", time: "57.61", date: "2023-07-16" },   // 100 FR slot: SCY scores lower (50.10 vs 70.79)
    { event: "50 FR SCY", time: "22.13", date: "2025-02-22" },
    { event: "50 FR SCY", time: "21.00", date: "2025-02-23", flag: "R" }, // relay lead-off: ignored
    { event: "200 IM SCY", time: "2:02.67", date: "2023-12-03" },
  ];
  const r = swimmerPowerIndex({ swims, gender: "M", gradClass: 2026 });
  const fr100 = r.events.find((e) => e.slot === "100 FR");
  assert.equal(fr100.course, "SCY"); assert.equal(fr100.points, 50.1);
  const fr50 = r.events.find((e) => e.slot === "50 FR");
  assert.equal(fr50.time, "22.13"); assert.equal(fr50.points, 47.39); // ((22.13/19.49)^3 − 1) × 100 + 1
  const im = r.events.find((e) => e.slot === "200 IM");
  assert.equal(im.points, 65.15); // ((122.67/103.99)^3 − 1) × 100 + 1
  assert.equal(r.events.length, 3);
  assert.equal(r.index, powerIndex({ a: 47.39, b: 50.1, c: 65.15 }));
});
