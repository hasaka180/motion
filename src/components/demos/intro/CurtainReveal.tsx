"use client";

import { motion } from "motion/react";

const BARS = 6;

/** Vertical bars retract one after another, wiping the content in. */
export function CurtainReveal() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-ink-900 to-ink-950 px-8">
        <div className="text-center">
          <motion.h2
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            Studio Ninety
          </motion.h2>
          <motion.p
            className="mt-3 font-mono text-xs uppercase tracking-[0.3em] text-ink-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.35, duration: 0.8 }}
          >
            Est. 2019 — Rotterdam
          </motion.p>
        </div>
      </div>

      <div className="absolute inset-0 flex">
        {Array.from({ length: BARS }).map((_, i) => (
          <motion.div
            key={i}
            className="h-full flex-1 bg-ink-800"
            initial={{ y: 0 }}
            animate={{ y: "-101%" }}
            transition={{
              delay: 0.3 + i * 0.08,
              duration: 0.85,
              ease: [0.76, 0, 0.24, 1],
            }}
          />
        ))}
      </div>
    </div>
  );
}
