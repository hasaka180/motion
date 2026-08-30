"use client";

import { motion } from "motion/react";

function Orbit() {
  return (
    <motion.div
      className="relative size-10"
      animate={{ rotate: 360 }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
    >
      <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 rounded-full bg-accent" />
      <span className="absolute bottom-0 left-1/2 size-2 -translate-x-1/2 rounded-full bg-accent-alt" />
      <span className="absolute inset-0 rounded-full border border-ink-700" />
    </motion.div>
  );
}

function DotWave() {
  return (
    <div className="flex h-10 items-center gap-1.5">
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="size-2 rounded-full bg-ink-200"
          animate={{ y: [0, -9, 0], opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.12,
          }}
        />
      ))}
    </div>
  );
}

function ArcSpinner() {
  return (
    <motion.svg
      viewBox="0 0 50 50"
      className="size-10"
      animate={{ rotate: 360 }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
    >
      <circle cx="25" cy="25" r="20" fill="none" stroke="var(--color-ink-700)" strokeWidth="4" />
      <motion.circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="var(--color-accent-alt)"
        strokeWidth="4"
        strokeLinecap="round"
        animate={{ pathLength: [0.05, 0.7, 0.05] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}

function BarPulse() {
  return (
    <div className="flex h-10 items-end gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-accent to-accent-alt"
          animate={{ height: [8, 30, 8] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}

const SET = [
  { name: "orbit", node: <Orbit /> },
  { name: "wave", node: <DotWave /> },
  { name: "arc", node: <ArcSpinner /> },
  { name: "bars", node: <BarPulse /> },
];

/** Four loop-forever indicators, all transform/opacity only. */
export function SpinnerSet() {
  return (
    <div className="absolute inset-0 grid grid-cols-2 place-items-center gap-4 p-8 sm:grid-cols-4">
      {SET.map((s) => (
        <div key={s.name} className="flex flex-col items-center gap-4">
          {s.node}
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-600">
            {s.name}
          </span>
        </div>
      ))}
    </div>
  );
}
