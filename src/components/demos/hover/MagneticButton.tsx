"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

function Magnetic({ label, strength = 0.4 }: { label: string; strength?: number }) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.6 });

  // The label trails the button for a slight parallax.
  const lx = useTransform(sx, (v) => v * 0.35);
  const ly = useTransform(sy, (v) => v * 0.35);

  return (
    <motion.button
      ref={ref}
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      whileTap={{ scale: 0.95 }}
      className="relative rounded-full border border-ink-700 bg-ink-900 px-7 py-3 text-sm font-medium text-ink-50"
    >
      <motion.span className="relative block" style={{ x: lx, y: ly }}>
        {label}
      </motion.span>
    </motion.button>
  );
}

/** Buttons that lean toward the cursor and spring back on exit. */
export function MagneticButton() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex flex-col items-center gap-8">
        <div className="flex gap-5">
          <Magnetic label="Subtle" strength={0.25} />
          <Magnetic label="Strong" strength={0.6} />
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-600">
          hover near a button
        </p>
      </div>
    </div>
  );
}
