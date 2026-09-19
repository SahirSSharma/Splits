import test from "node:test";
import assert from "node:assert/strict";
import { ageGroup, meetAges, personalBests, cuts, closest, SETS, LEVELS } from "../lib/standards.js";

const swims = [
  { event: "100 FR SCY", time: "48.77", date: "2025-03-02", meet: "Sectionals" },
  { event: "100 FR SCY", time: "49.05", date: "2025-02-27", meet: "Time trials", flag: "U" },
  { event: "100 FR SCY", time: "50.10", date: "2024-12-21", meet: "Frolic" },
  { event: "50 FR SCY", time: "22.13", date: "2025-02-22", meet: "Last chance" },
  { event: "200 IM SCY", time: "2:02.67", date: "2023-12-03", meet: "MAC" },
  { event: "100 FL LCM", time: "1:00.69", date: "2023-07-07", meet: "Grand Challenge" },
];

test("age groups", () => {
  assert.equal(ageGroup(9), "10U"); assert.equal(ageGroup(10), "10U"); assert.equal(ageGroup(11), "11-12");
  assert.equal(ageGroup(14), "13-14"); assert.equal(ageGroup(16), "15-16"); assert.equal(ageGroup(18), "17-18");
  assert.equal(ageGroup(19), null); assert.equal(ageGroup(null), null);
});

test("meet brackets", () => {
  const futures = SETS.find((s) => s.id === "futures-2026"), sect = SETS.find((s) => s.id === "sectionals-2026"), jr = SETS.find((s) => s.id === "jrnats-2026");
  assert.equal(meetAges(futures, 18), "18U"); assert.equal(meetAges(futures, 19), "19O");
  assert.equal(meetAges(sect, 30), "ALL"); assert.equal(meetAges(jr, 18), "18U"); assert.equal(meetAges(jr, 19), null);
});

test("personal bests ignore flagged swims and keep the fastest", () => {
  const pb = personalBests(swims);
  assert.equal(pb.get("100 FR SCY").seconds, 48.77);
  assert.equal(pb.get("100 FR SCY").meet, "Sectionals");
  assert.equal(pb.size, 4);
});

test("every ladder in the corpus is monotonic and complete", () => {
  const moti = SETS.find((s) => s.kind === "motivational");
  for (const [key, ladder] of Object.entries(moti.times)) {
    const t = LEVELS.map((l) => ladder[l]);
    assert.ok(t.every((x) => typeof x === "number" && x > 0), key);
    for (let i = 1; i < t.length; i++) assert.ok(t[i] < t[i - 1], `${key} ${LEVELS[i]} should be faster than ${LEVELS[i - 1]}`);
  }
  assert.ok(Object.keys(moti.times).length >= 480);
});

test("cuts for an 18-year-old boy: motivational next level and meet cuts", () => {
  const all = cuts({ swims, gender: "M", age: 18 });
  const fr100 = all.filter((c) => c.event === "100 FR SCY");
  const moti = fr100.find((c) => c.set === "motivational-2028");
  assert.equal(moti.ages, "17-18");
  assert.equal(moti.highest, "AA");       // 48.77 ≤ 49.59 (AA), > 47.39 (AAA)
  assert.equal(moti.level, "AAA");
  assert.equal(moti.cut, 47.39);
  assert.equal(moti.gap, 1.38);
  assert.equal(moti.achieved, false);
  const futures = fr100.find((c) => c.set === "futures-2026");
  assert.equal(futures.ages, "18U"); assert.equal(futures.cut, 46.39); assert.equal(futures.gap, 2.38);
  const sect = fr100.find((c) => c.set === "sectionals-2026");
  assert.equal(sect.cut, 47.39); assert.equal(sect.gap, 1.38); assert.equal(sect.per50, 0.69);
  const jr = fr100.find((c) => c.set === "jrnats-2026");
  assert.equal(jr.cut, 44.39);
});

test("at 19 the motivational and junior sets drop out and Futures moves to 19 & over", () => {
  const all = cuts({ swims, gender: "M", age: 19 });
  assert.ok(!all.some((c) => c.set === "motivational-2028"));
  assert.ok(!all.some((c) => c.set.startsWith("jrnats")));
  const futures = all.find((c) => c.event === "100 FR SCY" && c.set === "futures-2026");
  assert.equal(futures.ages, "19O"); assert.equal(futures.cut, 44.39);
});

test("closest sorts by relative gap and skips achieved cuts", () => {
  const all = cuts({ swims, gender: "M", age: 18 });
  const top = closest(all, { n: 3 });
  assert.equal(top.length, 3);
  assert.ok(top.every((c) => !c.achieved));
  assert.ok(top[0].pct <= top[1].pct && top[1].pct <= top[2].pct);
  const only = closest(all, { sets: ["futures-2026"] });
  assert.ok(only.every((c) => c.set === "futures-2026"));
});

test("a made cut is reported as achieved with a negative gap", () => {
  const all = cuts({ swims: [{ event: "50 FR SCY", time: "20.50", date: "2025-01-01" }], gender: "M", age: 17 });
  const sect = all.find((c) => c.set === "sectionals-2026");
  assert.equal(sect.achieved, true); assert.ok(sect.gap < 0);
  const moti = all.find((c) => c.set === "motivational-2028");
  assert.equal(moti.highest, "AAAA"); assert.equal(moti.achieved, true);
});
