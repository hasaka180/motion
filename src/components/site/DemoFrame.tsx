"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

type Panel = "prompt" | "code";

type Props = {
  title: string;
  description: string;
  /** Shown as small pills under the title, e.g. ["useScroll", "clip-path"]. */
  tags?: string[];
  /** Tailwind height for the stage. Defaults to a 16:9-ish panel. */
  stageClassName?: string;
  /** The prompt this motion was built from. */
  prompt?: string;
  /** The demo's own source, read off disk at build time. */
  source?: string;
  /** Path of that source, relative to src/components/demos. */
  sourcePath?: string;
  children: ReactNode;
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          // Clipboard is unavailable over http or without permission — the
          // text is selectable in the panel either way, so stay quiet.
        }
      }}
      className="rounded-md border border-ink-700 bg-ink-850 px-2.5 py-1 font-mono text-[11px] text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-50"
    >
      {copied ? "Copied" : label}
    </button>
  );
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors ${
        active
          ? "bg-ink-700 text-ink-50"
          : "text-ink-400 hover:bg-ink-800 hover:text-ink-200"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Uniform frame around every demo: the stage, the replay, and the two things
 * you need to reuse the motion — the prompt that produced it and its source.
 *
 * The replay button bumps a key so the subtree remounts — the only reliable
 * way to re-fire entrance animations.
 */
export function DemoFrame({
  title,
  description,
  tags,
  stageClassName = "h-[420px]",
  prompt,
  source,
  sourcePath,
  children,
}: Props) {
  const [runId, setRunId] = useState(0);
  const [panel, setPanel] = useState<Panel | null>(null);

  const open = (next: Panel) => setPanel((p) => (p === next ? null : next));
  const body = panel === "prompt" ? prompt : panel === "code" ? source : null;

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

      {(prompt || source) && (
        <>
          <div className="flex items-center justify-between gap-3 border-t border-ink-800 px-5 py-2.5">
            <div className="flex items-center gap-1">
              {prompt && (
                <Toggle active={panel === "prompt"} onClick={() => open("prompt")}>
                  Prompt
                </Toggle>
              )}
              {source && (
                <Toggle active={panel === "code"} onClick={() => open("code")}>
                  Code
                </Toggle>
              )}
            </div>

            <div className="flex items-center gap-2">
              {panel === "code" && sourcePath && (
                <span className="font-mono text-[11px] text-ink-600">{sourcePath}</span>
              )}
              {body && (
                <CopyButton
                  text={body}
                  label={panel === "code" ? "Copy code" : "Copy prompt"}
                />
              )}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {body && (
              <motion.div
                key={panel}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden border-t border-ink-800 bg-ink-950"
              >
                {panel === "prompt" ? (
                  <div className="scroll-thin max-h-[420px] overflow-y-auto px-5 py-4">
                    {body.split("\n\n").map((para, i) => (
                      <p
                        key={i}
                        className="mt-3 text-sm leading-relaxed text-ink-200 first:mt-0"
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                ) : (
                  <pre className="scroll-thin max-h-[520px] overflow-auto px-5 py-4 font-mono text-[12px] leading-[1.65] text-ink-200">
                    {body}
                  </pre>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </section>
  );
}
