"use client";

import { useState, type ReactNode } from "react";
import { motion } from "motion/react";

type Props = {
  title: string;
  description: string;
  /** Shown as small pills under the title, e.g. ["useScroll", "clip-path"]. */
  tags?: string[];
  /** Tailwind height for the stage. Defaults to a 16:9-ish panel. */
  stageClassName?: string;
  children: ReactNode;
};

/**
 * Uniform frame around every demo. The replay button bumps a key so the
 * subtree remounts — the only reliable way to re-fire entrance animations.
 */
export function DemoCard({
  title,
  description,
  tags,
  stageClassName = "h-[420px]",
  children,
}: Props) {
  const [runId, setRunId] = useState(0);

  return (
    <section className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-900">
      <header className="flex items-start justify-between gap-4 border-b border-ink-800 px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-ink-50">{title}</h3>
          <p className="mt-1 text-sm text-ink-400">{description}</p>
          {tags && tags.length > 0 && (
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <li
                  key={t}
                  className="rounded-md border border-ink-700 bg-ink-850 px-2 py-0.5 font-mono text-[11px] text-ink-400"
                >
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>

        <motion.button
          type="button"
          onClick={() => setRunId((n) => n + 1)}
          whileTap={{ scale: 0.94 }}
          className="group flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-850 px-3 py-1.5 text-xs text-ink-200 transition-colors hover:border-ink-600 hover:text-ink-50"
        >
          <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="size-3.5"
            key={runId}
            initial={{ rotate: 0 }}
            animate={{ rotate: -360 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </motion.svg>
          Replay
        </motion.button>
      </header>

      <div
        key={runId}
        className={`relative isolate overflow-hidden bg-ink-950 ${stageClassName}`}
      >
        {children}
      </div>
    </section>
  );
}
