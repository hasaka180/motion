"use client";

import { useState } from "react";
import { motion } from "motion/react";

const SLATS = 15;
const SLAT_DURATION = 0.55;
const SLAT_STAGGER = 0.035;
const SLAT_COLOUR = "#8b7bf5";

const PAGES = [
  { word: "FLUX", tag: "001 — MOTION", bg: "#f4f4f2", fg: "#0a0a0a", band: "#e8562a" },
  { word: "DRIFT", tag: "002 — EASING", bg: "#e8562a", fg: "#0a0a0a", band: "#f4f4f2" },
  { word: "PULSE", tag: "003 — RHYTHM", bg: "#8b7bf5", fg: "#0a0a0a", band: "#0a0a0a" },
];

type Phase = "idle" | "cover" | "reveal";

/**
 * A slat wipe between views. Columns sweep down to cover, the page swaps while
 * hidden, then the same columns keep travelling down to uncover — one
 * continuous direction, so it reads as a single pass rather than a curtain
 * that closes and reopens.
 */
export function SlatTransition() {
  const [page, setPage] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  /**
   * Bumped after each pass to remount the slats. Without it they would animate
   * from the bottom back up to the top on reset, sweeping visibly through the
   * page they just uncovered.
   */
  const [pass, setPass] = useState(0);

  const advance = () => {
    if (phase !== "idle") return;
    setPhase("cover");
  };

  const onSlatsSettled = () => {
    if (phase === "cover") {
      setPage((p) => (p + 1) % PAGES.length);
      setPhase("reveal");
    } else if (phase === "reveal") {
      setPhase("idle");
      setPass((n) => n + 1);
    }
  };

  const view = PAGES[page];
  const y = phase === "cover" ? "0%" : phase === "reveal" ? "100%" : "-100%";

  return (
    <div
      className="absolute inset-0 cursor-pointer overflow-hidden"
      style={{ background: view.bg }}
      onClick={advance}
    >
      <div className="absolute inset-0 flex flex-col justify-center px-10">
        <motion.span
          key={`${page}-tag`}
          className="font-mono text-[10px] tracking-[0.3em]"
          style={{ color: view.fg }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          {view.tag}
        </motion.span>
        <motion.h3
          key={`${page}-word`}
          className="font-display text-[clamp(48px,11vw,120px)] leading-none tracking-[-0.03em]"
          style={{ color: view.fg }}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {view.word}
        </motion.h3>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 h-16"
        style={{ background: view.band }}
      />

      {/* Static hairlines — the slats land on a visible grid */}
      <div className="pointer-events-none absolute inset-0 flex">
        {Array.from({ length: SLATS }).map((_, i) => (
          <div key={i} className="h-full flex-1 border-r border-black/10 last:border-r-0" />
        ))}
      </div>

      {/* The slats themselves */}
      <div key={pass} className="pointer-events-none absolute inset-0 flex">
        {Array.from({ length: SLATS }).map((_, i) => (
          <motion.div
            key={i}
            className="h-full flex-1 border-r border-white/25 last:border-r-0"
            style={{ background: SLAT_COLOUR }}
            initial={{ y: "-100%" }}
            animate={{ y }}
            transition={{
              duration: SLAT_DURATION,
              ease: [0.76, 0, 0.24, 1],
              delay: i * SLAT_STAGGER,
            }}
            onAnimationComplete={i === SLATS - 1 ? onSlatsSettled : undefined}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-5 flex items-center justify-between px-10">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-60"
          style={{ color: view.fg }}
        >
          click to advance
        </span>
        <span className="flex gap-1.5">
          {PAGES.map((_, i) => (
            <span
              key={i}
              className="size-1.5 rounded-full transition-opacity"
              style={{ background: view.fg, opacity: i === page ? 1 : 0.3 }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
