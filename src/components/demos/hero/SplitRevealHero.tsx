"use client";

import { motion } from "motion/react";

const EASE = [0.83, 0, 0.17, 1] as const;

/** Two panels retract from the centre line to expose the hero beneath. */
export function SplitRevealHero() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-ink-900 via-ink-950 to-ink-900">
        <div className="px-8 text-center">
          <motion.h2
            className="bg-gradient-to-r from-ink-50 via-accent-soft to-accent-alt bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl"
            initial={{ scale: 1.12, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7, duration: 1.2, ease: EASE }}
          >
            Split reveal
          </motion.h2>
          <motion.p
            className="mt-4 text-sm text-ink-400"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.7 }}
          >
            Curtains driven by transform, not width — no layout thrash.
          </motion.p>
        </div>
      </div>

      {(["left", "right"] as const).map((side) => (
        <motion.div
          key={side}
          className="absolute inset-y-0 w-1/2 bg-ink-800"
          style={{ [side]: 0 }}
          initial={{ x: 0 }}
          animate={{ x: side === "left" ? "-100%" : "100%" }}
          transition={{ delay: 0.45, duration: 1.1, ease: EASE }}
        >
          <div
            className={`absolute inset-y-0 w-px bg-accent/60 ${
              side === "left" ? "right-0" : "left-0"
            }`}
          />
        </motion.div>
      ))}
    </div>
  );
}
