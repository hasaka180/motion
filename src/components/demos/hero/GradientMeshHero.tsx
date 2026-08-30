"use client";

import { motion } from "motion/react";

const blobs = [
  { c: "#8b5cf6", size: 340, x: "10%", y: "20%", dur: 13 },
  { c: "#ec4899", size: 300, x: "62%", y: "10%", dur: 17 },
  { c: "#22d3ee", size: 260, x: "40%", y: "58%", dur: 15 },
];

/** Slow-drifting blurred blobs behind fade-up content. */
export function GradientMeshHero() {
  return (
    <div className="absolute inset-0 grid place-items-center overflow-hidden">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-[80px]"
          style={{
            width: b.size,
            height: b.size,
            left: b.x,
            top: b.y,
            background: b.c,
            opacity: 0.35,
          }}
          animate={{
            x: [0, 70, -40, 0],
            y: [0, -50, 40, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Frosted panel keeps the copy readable over the mesh */}
      <motion.div
        className="relative mx-6 max-w-md rounded-2xl border border-white/10 bg-ink-950/50 p-8 text-center backdrop-blur-xl"
        initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-ink-200">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
          v2.0 is live
        </span>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight">
          Ship interfaces that breathe
        </h2>
        <p className="mt-3 text-sm text-ink-400">
          Three blurred blobs on independent loops. Cheap to render, impossible
          to spot the repeat.
        </p>
      </motion.div>
    </div>
  );
}
