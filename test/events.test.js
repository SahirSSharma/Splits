import test from "node:test";
import assert from "node:assert/strict";
import { parseEvent, eventKey, eventLabel, eventSlot } from "../lib/events.js";

const k = (t, o) => { const e = parseEvent(t, o); return e && eventKey(e); };

test("every spelling lands on one key", () => {
  assert.equal(k("100 Free SCY"), "100 FR SCY");
  assert.equal(k("100 freestyle Prelims", { course: "SCY" }), "100 FR SCY");
  assert.equal(k("100 FR SCY"), "100 FR SCY");
  assert.equal(k("100 Fly LCM"), "100 FL LCM");
  assert.equal(k("100 Butterfly", { course: "LCM" }), "100 FL LCM");
  assert.equal(k("200 IM SCY"), "200 IM SCY");
  assert.equal(k("200 Individual Medley", { course: "SCM" }), "200 IM SCM");
  assert.equal(k("50 Breast SCY"), "50 BR SCY");
  assert.equal(k("1650 Free SCY"), "1650 FR SCY");
  assert.equal(k("100 Y Free"), "100 FR null");
});

test("dual distances pick the course's distance", () => {
  assert.equal(k("400/500 FR", { course: "SCY" }), "500 FR SCY");
  assert.equal(k("400/500 FR", { course: "LCM" }), "400 FR LCM");
  assert.equal(k("1500/1650 FR SCY"), "1650 FR SCY");
});

test("relays and nonsense are not events", () => {
  assert.equal(parseEvent("200 FR-R SCY"), null);
  assert.equal(parseEvent("4x100 Medley Relay"), null);
  assert.equal(parseEvent("Speedo Sectionals - Oceanside"), null);
  assert.equal(parseEvent("300 IM SCY"), null);
  assert.equal(parseEvent("Mar 1, 2025"), null);
});

test("labels and slots", () => {
  assert.equal(eventLabel({ distance: 100, stroke: "FL" }), "100 Fly");
  assert.equal(eventSlot({ distance: 500, stroke: "FR" }), "400 FR");
  assert.equal(eventSlot({ distance: 1650, stroke: "FR" }), "1500 FR");
  assert.equal(eventSlot({ distance: 200, stroke: "IM" }), "200 IM");
});
