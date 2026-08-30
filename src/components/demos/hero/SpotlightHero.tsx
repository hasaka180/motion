"use client";

import { useMotionValue, useMotionTemplate, motion } from "motion/react";

/** Radial spotlight that follows the cursor, over a staggered headline. */
export function SpotlightHero() {
  const mx = useMotionValue(50);
  const my = useMotionValue(50);

  const spotlight = useMotionTemplate`radial-gradient(320px circle at ${mx}% ${my}%, rgba(139,92,246,0.28), transparent 70%)`;

  return (
    <div
      className="absolute inset-0 grid place-items-center"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width) * 100);
        my.set(((e.clientY - r.top) / r.height) * 100);
      }}
    >
      {/* Grid floor */}
      <div
        className="absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-ink-600) 1px, transparent 1px), linear-gradient(90deg, var(--color-ink-600) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black, transparent 75%)",
        }}
      />
      <motion.div className="absolute inset-0" style={{ background: spotlight }} />

      <div className="relative px-8 text-center">
        {["Design in", "motion."].map((l, i) => (
          <div key={l} className="overflow-hidden">
            <motion.h2
              className="text-4xl font-semibold tracking-tight sm:text-5xl"
              initial={{ y: "115%" }}
              animate={{ y: 0 }}
              transition={{ delay: i * 0.12, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              {l}
            </motion.h2>
          </div>
        ))}

        <motion.p
          className="mx-auto mt-4 max-w-sm text-sm text-ink-400"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.8 }}
        >
          Move your cursor across the stage — the light follows.
        </motion.p>

        <motion.div
          className="mt-7 flex justify-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <button className="rounded-full bg-ink-50 px-5 py-2 text-sm font-medium text-ink-950 transition-transform hover:scale-105">
            Get started
          </button>
          <button className="rounded-full border border-ink-700 px-5 py-2 text-sm text-ink-200 transition-colors hover:border-ink-400">
            Docs
          </button>
        </motion.div>
      </div>
    </div>
  );
}
