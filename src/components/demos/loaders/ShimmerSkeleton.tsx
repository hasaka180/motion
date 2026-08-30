"use client";

import { motion } from "motion/react";

function Line({ w, delay }: { w: string; delay: number }) {
  return (
    <div className="relative h-3 overflow-hidden rounded-full bg-ink-800" style={{ width: w }}>
      <motion.div
        className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-ink-600 to-transparent"
        animate={{ x: ["-120%", "260%"] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay }}
      />
    </div>
  );
}

/** Skeleton placeholders with a sweeping highlight — one div per line. */
export function ShimmerSkeleton() {
  return (
    <div className="absolute inset-0 grid place-items-center px-8">
      <div className="w-full max-w-sm rounded-2xl border border-ink-800 bg-ink-900 p-6">
        <div className="flex items-center gap-4">
          <div className="relative size-12 overflow-hidden rounded-full bg-ink-800">
            <motion.div
              className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-ink-600 to-transparent"
              animate={{ x: ["-120%", "260%"] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <Line w="60%" delay={0.1} />
            <Line w="40%" delay={0.2} />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Line w="100%" delay={0.3} />
          <Line w="92%" delay={0.4} />
          <Line w="70%" delay={0.5} />
        </div>

        <div className="mt-6 h-24 w-full overflow-hidden rounded-xl bg-ink-800">
          <motion.div
            className="h-full w-1/2 bg-gradient-to-r from-transparent via-ink-700 to-transparent"
            animate={{ x: ["-120%", "260%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          />
        </div>
      </div>
    </div>
  );
}
