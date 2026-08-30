"use client";

import { useRef } from "react";
import { motion } from "motion/react";

const ROWS = [
  { k: "01", t: "Discovery", d: "Audit, interviews, a shared vocabulary." },
  { k: "02", t: "Direction", d: "Two routes, one chosen, the other archived." },
  { k: "03", t: "Design", d: "Components before pages, always." },
  { k: "04", t: "Build", d: "Shipped behind a flag, measured, widened." },
  { k: "05", t: "Care", d: "The part everyone forgets to budget for." },
];

/** whileInView with the scroll container as viewport root. */
export function RevealOnView() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="scroll-thin absolute inset-0 overflow-y-auto px-8 py-10">
      <p className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-ink-600">
        scroll ↓
      </p>

      {ROWS.map((row) => (
        <motion.div
          key={row.k}
          initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ root: ref, margin: "0px 0px -15% 0px", once: false }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex gap-5 border-t border-ink-800 py-7"
        >
          <span className="font-mono text-xs text-accent-soft">{row.k}</span>
          <div>
            <h4 className="text-lg font-medium tracking-tight">{row.t}</h4>
            <p className="mt-1 text-sm text-ink-400">{row.d}</p>
          </div>
          <motion.span
            className="ml-auto self-center text-ink-600"
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ root: ref, once: false }}
            transition={{ delay: 0.15, duration: 0.6 }}
          >
            →
          </motion.span>
        </motion.div>
      ))}

      <div className="h-10" />
    </div>
  );
}
