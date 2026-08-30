"use client";

import { motion } from "motion/react";

const ITEMS = ["Framer", "Vercel", "Linear", "Stripe", "Raycast", "Arc", "Vitest"];

function Row({ reverse = false, duration }: { reverse?: boolean; duration: number }) {
  return (
    <div className="group flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
      <motion.div
        className="flex shrink-0 gap-4 pr-4 group-hover:[animation-play-state:paused]"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      >
        {/* Duplicated once so the -50% wrap is seamless */}
        {[...ITEMS, ...ITEMS].map((label, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-ink-800 bg-ink-900 px-5 py-3 text-sm text-ink-200"
          >
            <span className="size-2 rounded-full bg-gradient-to-br from-accent to-accent-alt" />
            {label}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/** Two counter-scrolling tracks. The trick is duplicating the list and looping to -50%. */
export function InfiniteMarquee() {
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-4">
      <Row duration={22} />
      <Row duration={28} reverse />
      <p className="px-8 pt-2 text-center font-mono text-xs uppercase tracking-[0.2em] text-ink-600">
        seamless — no gap on wrap
      </p>
    </div>
  );
}
