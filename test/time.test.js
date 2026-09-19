import test from "node:test";
import assert from "node:assert/strict";
import { parseTime, formatTime, formatGap } from "../lib/time.js";

test("parses seconds and minutes", () => {
  assert.equal(parseTime("22.13"), 22.13);
  assert.equal(parseTime("1:47.03"), 107.03);
  assert.equal(parseTime("20:12.02"), 1212.02);
  assert.equal(parseTime(" 48.77 "), 48.77);
  assert.equal(parseTime("1:03,31"), 63.31);
});

test("rejects non-times", () => {
  for (const bad of ["", "DQ", "NS", "1:75.00", "22", "2025", "22.1.3", null]) assert.equal(parseTime(bad), null, String(bad));
});

test("formats back", () => {
  assert.equal(formatTime(22.13), "22.13");
  assert.equal(formatTime(107.03), "1:47.03");
  assert.equal(formatTime(1212.02), "20:12.02");
  assert.equal(formatTime(60), "1:00.00");
  assert.equal(formatTime(-0.83), "-0.83");
  assert.equal(formatTime(0.83, { sign: true }), "+0.83");
});

test("gap wording", () => {
  assert.equal(formatGap(0.834), "0.83 s");
  assert.equal(formatGap(12.34), "12.3 s");
  assert.equal(formatGap(63.4), "1:03.40");
});
