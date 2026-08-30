"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

const CARDS = ["Brief", "Sketch", "Prototype", "Polish", "Ship"];

/** Vertical scroll inside the stage is remapped to horizontal travel. */
export function HorizontalScrollSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: ref });

  const x = useTransform(scrollYProgress, [0, 1], ["2%", "-62%"]);
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={ref} className="scroll-thin absolute inset-0 overflow-y-auto">
      <div className="sticky top-0 flex h-full flex-col justify-center overflow-hidden">
        <motion.div className="flex gap-5 px-8" style={{ x }}>
          {CARDS.map((c, i) => (
            <div
              key={c}
              className="flex h-52 w-64 shrink-0 flex-col justify-between rounded-2xl border border-ink-800 bg-ink-900 p-5"
            >
              <span className="font-mono text-xs text-ink-600">
                0{i + 1} / 0{CARDS.length}
              </span>
              <span className="text-2xl font-semibold tracking-tight">{c}</span>
            </div>
          ))}
        </motion.div>

        <div className="mx-8 mt-8 h-px bg-ink-800">
          <motion.div
            className="h-full origin-left bg-accent"
            style={{ scaleX: bar }}
          />
        </div>
      </div>

      <div className="h-[300%]" />
    </div>
  );
}
