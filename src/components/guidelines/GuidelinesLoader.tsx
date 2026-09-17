"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { init, type State } from "./store";
import { readSavedDocuments } from "./persistence";

const Builder = dynamic(() => import("./GuidelinesBuilder").then(m => m.GuidelinesBuilder), { ssr: false });
export function GuidelinesLoader() {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    readSavedDocuments().then(saved => { if (active) setState(init(saved)); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);
  if (error) return <p className="p-8 text-sm text-amber-300">Browser storage could not be opened. Enable site storage and reload to protect your saved decks.</p>;
  if (!state) return <div className="grid h-[520px] place-items-center rounded-xl border border-ink-800 bg-ink-900 text-xs text-ink-500">Opening your decks…</div>;
  return <Builder initialState={state} />;
}
