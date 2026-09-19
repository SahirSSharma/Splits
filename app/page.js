import { FETCHED_AT, SETS } from "@/lib/standards";
import demo from "@/data/demo.json";

export default function Home() {
  const cuts = SETS.reduce((n, s) => n + Object.keys(s.times).length, 0);
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-widest text-aqua-deep">Splits</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">How far are you from the cut?</h1>
        <p className="max-w-xl text-lg text-muted">
          Paste your times and see the standard you are closest to, by how much, and per 50 — from USA
          Swimming&apos;s own sheets.
        </p>
      </header>
      <section className="rounded-2xl border border-line bg-card p-6 shadow-card">
        <p className="text-sm text-muted">Day 1. The data is in; the page comes tomorrow.</p>
        <ul className="mt-3 grid gap-1 text-sm">
          <li>{cuts.toLocaleString()} standards across {SETS.length} sets, fetched {FETCHED_AT}.</li>
          <li>Demo swimmer: {demo.swims.length} official swims, {demo.swims[0].date} → {demo.swims.at(-1).date}.</li>
        </ul>
      </section>
    </main>
  );
}
