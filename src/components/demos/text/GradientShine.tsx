"use client";

import { motion } from "motion/react";

/** A highlight sweeps across the type by animating background-position. */
export function GradientShine() {
  return (
    <div className="absolute inset-0 grid place-items-center px-8">
      <div className="text-center">
        <motion.h2
          className="bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-6xl"
          style={{
            backgroundImage:
              "linear-gradient(110deg, var(--color-ink-700) 30%, var(--color-ink-50) 45%, var(--color-accent-soft) 52%, var(--color-ink-700) 68%)",
            backgroundSize: "250% 100%",
          }}
          animate={{ backgroundPosition: ["150% 0%", "-50% 0%"] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
        >
          Shimmer
        </motion.h2>

        <p className="mt-4 max-w-xs text-sm text-ink-400">
          One oversized gradient, clipped to the glyphs, panned on a loop.
        </p>
      </div>
    </div>
  );
}
