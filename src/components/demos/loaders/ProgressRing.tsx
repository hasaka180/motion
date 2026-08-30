"use client";

import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";

const R = 52;
const C = 2 * Math.PI * R;

/** SVG ring driven by strokeDashoffset, with a synced numeric readout. */
export function ProgressRing() {
  const value = useMotionValue(0);
  const offset = useTransform(value, (v) => C - (v / 100) * C);
  const [label, setLabel] = useState(0);

  useEffect(() => {
    const unsub = value.on("change", (v) => setLabel(Math.round(v)));
    const controls = animate(value, [0, 68, 68, 100], {
      duration: 4,
      times: [0, 0.45, 0.6, 1],
      ease: "easeInOut",
      repeat: Infinity,
      repeatDelay: 0.6,
    });
    return () => {
      controls.stop();
      unsub();
    };
  }, [value]);

  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="relative grid place-items-center">
        <svg viewBox="0 0 130 130" className="size-40 -rotate-90">
          <circle
            cx="65"
            cy="65"
            r={R}
            fill="none"
            stroke="var(--color-ink-800)"
            strokeWidth="8"
          />
          <motion.circle
            cx="65"
            cy="65"
            r={R}
            fill="none"
            stroke="url(#ring-grad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={C}
            style={{ strokeDashoffset: offset }}
          />
          <defs>
            <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute text-center">
          <div className="font-mono text-3xl font-semibold tabular-nums">{label}%</div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-600">
            uploading
          </div>
        </div>
      </div>
    </div>
  );
}
