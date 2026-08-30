"use client";

import { useEffect, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "motion/react";

/** Counts 0 → 100, then the whole loader lifts away. */
export function CounterPreloader() {
  const progress = useMotionValue(0);
  const label = useTransform(progress, (v) => Math.round(v).toString().padStart(3, "0"));
  const scaleX = useTransform(progress, [0, 100], [0, 1]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const controls = animate(progress, 100, {
      duration: 2.4,
      ease: [0.65, 0, 0.35, 1],
      onComplete: () => setTimeout(() => setDone(true), 250),
    });
    return () => controls.stop();
  }, [progress]);

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 grid place-items-center px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={done ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.35, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-3xl font-semibold tracking-tight">Welcome in</h2>
          <p className="mt-2 text-sm text-ink-400">
            The page was ready the whole time — the loader just paced the entrance.
          </p>
        </motion.div>
      </div>

      <AnimatePresence>
        {!done && (
          <motion.div
            className="absolute inset-0 flex flex-col justify-between bg-ink-900 p-8"
            exit={{ y: "-100%" }}
            transition={{ duration: 0.9, ease: [0.83, 0, 0.17, 1] }}
          >
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink-400">
              Loading assets
            </span>

            <motion.span className="self-end font-mono text-6xl font-semibold tabular-nums sm:text-8xl">
              {label}
            </motion.span>

            <div className="h-px w-full bg-ink-700">
              <motion.div
                className="h-full origin-left bg-gradient-to-r from-accent to-accent-alt"
                style={{ scaleX }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
