"use client";

import dynamic from "next/dynamic";

/**
 * The builder reads localStorage in its initial state, which only makes sense
 * on the client — so it is never server-rendered. This is also what lets it
 * use a lazy initialiser instead of setting state from an effect.
 */
const GuidelinesBuilder = dynamic(
  () => import("./GuidelinesBuilder").then((m) => m.GuidelinesBuilder),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[520px] place-items-center rounded-xl border border-ink-800 bg-ink-900 font-mono text-[11px] uppercase tracking-[.2em] text-ink-500">
        Opening your decks…
      </div>
    ),
  },
);

export function GuidelinesLoader() {
  return <GuidelinesBuilder />;
}
