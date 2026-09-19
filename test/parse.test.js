import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parsePaste } from "../lib/parse.js";

const fx = (n) => readFileSync(new URL(`./fixtures/${n}`, import.meta.url), "utf8");

test("Swimcloud times page: headings set the event, flags are kept, dates and meets parsed", () => {
  const { swims, skipped } = parsePaste(fx("swimcloud-times.txt"));
  assert.equal(skipped.length, 0);
  assert.equal(swims.length, 7);
  assert.deepEqual(swims[0], { event: "100 FR SCY", time: "48.77", date: "2025-03-02", meet: "Speedo Sectionals - Oceanside" });
  assert.equal(swims[1].flag, "U");
  assert.equal(swims[4].flag, "R"); assert.equal(swims[4].event, "50 FR SCY");
  assert.equal(swims[5].flag, "X");
  assert.deepEqual(swims[6], { event: "200 IM SCY", time: "2:02.67", date: "2023-12-03", meet: "GU MAC Winter Invitational" });
});

test("free-form lines with a default course", () => {
  const { swims, skipped } = parsePaste(fx("freeform.txt"), { course: "SCY" });
  assert.deepEqual(skipped, ["Sectionals were fun"]);
  assert.deepEqual(swims.map((s) => [s.event, s.time, s.date]), [
    ["100 FR SCY", "48.77", null],
    ["50 FL SCY", "24.62", "2024-12-21"],
    ["200 IM SCY", "2:02.67", null],
    ["100 BR LCM", "1:24.07", null],
    ["1650 FR SCY", "20:12.02", "2020-02-02"],
  ]);
});

test("free-form without a course is skipped rather than guessed", () => {
  const { swims, skipped } = parsePaste("100 free 48.77");
  assert.equal(swims.length, 0); assert.equal(skipped.length, 1);
});

test("CSV with a header", () => {
  const { swims, skipped } = parsePaste(fx("table.csv"));
  assert.equal(swims.length, 3);
  assert.deepEqual(swims[2], { event: "200 FL LCM", time: "2:20.19", date: "2023-07-16", meet: "PC SCSC Super League Finals" });
  assert.equal(skipped.length, 1);
});

test("empty and junk input", () => {
  assert.deepEqual(parsePaste(""), { swims: [], skipped: [] });
  assert.deepEqual(parsePaste(null), { swims: [], skipped: [] });
  const r = parsePaste("hello\nworld 12");
  assert.equal(r.swims.length, 0); assert.equal(r.skipped.length, 2);
});
