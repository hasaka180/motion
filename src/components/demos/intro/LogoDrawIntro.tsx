"use client";

import { motion } from "motion/react";

const WORD = "MOTION";

/** SVG stroke draws itself, then the wordmark rises through a mask. */
export function LogoDrawIntro() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex flex-col items-center gap-6">
        <svg viewBox="0 0 100 100" className="size-24" fill="none">
          <motion.circle
            cx="50"
            cy="50"
            r="38"
            stroke="var(--color-ink-700)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          />
          <motion.path
            d="M28 62 L50 30 L72 62"
            stroke="url(#draw-grad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          />
          <defs>
            <linearGradient id="draw-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>

        <div className="flex overflow-hidden">
          {WORD.split("").map((ch, i) => (
            <motion.span
              key={i}
              className="inline-block text-2xl font-semibold tracking-[0.35em]"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: 1.35 + i * 0.06,
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {ch}
            </motion.span>
          ))}
        </div>

        <motion.div
          className="h-px w-40 origin-center bg-gradient-to-r from-transparent via-ink-600 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.8, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
