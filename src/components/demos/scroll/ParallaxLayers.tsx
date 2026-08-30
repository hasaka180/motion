"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

/** Three layers driven off one scroll progress at different rates. */
export function ParallaxLayers() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: ref });

  const sky = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const hills = useTransform(scrollYProgress, [0, 1], ["0%", "48%"]);
  const front = useTransform(scrollYProgress, [0, 1], ["0%", "95%"]);
  const titleY = useTransform(scrollYProgress, [0, 0.6], ["0%", "-140%"]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);

  return (
    <div ref={ref} className="scroll-thin absolute inset-0 overflow-y-auto">
      {/* Fixed-position stage painted behind the scrolling spacer */}
      <div className="pointer-events-none sticky top-0 h-full overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-violet-950 to-ink-950"
          style={{ y: sky }}
        />
        <motion.div
          className="absolute -bottom-10 left-0 h-40 w-full rounded-[100%] bg-violet-800/50 blur-sm"
          style={{ y: hills }}
        />
        <motion.div
          className="absolute -bottom-16 left-0 h-40 w-full rounded-[100%] bg-ink-900"
          style={{ y: front }}
        />
        <motion.h3
          className="absolute inset-x-0 top-1/3 text-center text-3xl font-semibold tracking-tight"
          style={{ y: titleY, opacity: titleOpacity }}
        >
          Parallax
        </motion.h3>
      </div>

      {/* Scroll runway */}
      <div className="h-[220%]" />
    </div>
  );
}
