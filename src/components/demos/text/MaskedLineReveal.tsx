"use client";

import { motion } from "motion/react";

const LINES = ["We build the", "interfaces that", "other teams copy."];

/** Classic editorial reveal: each line slides up behind its own mask. */
export function MaskedLineReveal() {
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-1 px-10">
      {LINES.map((line, i) => (
        <div key={line} className="overflow-hidden py-0.5">
          <motion.h2
            className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl"
            initial={{ y: "105%", rotate: 4 }}
            animate={{ y: 0, rotate: 0 }}
            transition={{ delay: i * 0.11, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            {line}
          </motion.h2>
        </div>
      ))}

      <motion.div
        className="mt-6 h-px origin-left bg-ink-700"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.55, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
