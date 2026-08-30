"use client";

import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

/** 3D tilt from pointer position, with a glare that tracks the same values. */
export function TiltCard() {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const spring = { stiffness: 220, damping: 20 };
  const rotateX = useSpring(useTransform(py, [0, 1], [12, -12]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-14, 14]), spring);

  const glareX = useTransform(px, (v) => `${v * 100}%`);
  const glareY = useTransform(py, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(200px circle at ${glareX} ${glareY}, rgba(255,255,255,0.22), transparent 60%)`;

  return (
    <div className="absolute inset-0 grid place-items-center" style={{ perspective: 1000 }}>
      <motion.div
        ref={ref}
        className="relative h-64 w-80 overflow-hidden rounded-2xl border border-ink-700 bg-gradient-to-br from-ink-800 to-ink-900 p-6"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onPointerMove={(e) => {
          const r = ref.current!.getBoundingClientRect();
          px.set((e.clientX - r.left) / r.width);
          py.set((e.clientY - r.top) / r.height);
        }}
        onPointerLeave={() => {
          px.set(0.5);
          py.set(0.5);
        }}
      >
        <motion.div className="pointer-events-none absolute inset-0" style={{ background: glare }} />

        <div style={{ transform: "translateZ(45px)" }}>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent-soft">
            Member
          </span>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight">Motion Lab</h3>
          <p className="mt-2 text-sm text-ink-400">Lifetime access</p>
        </div>

        <div
          className="absolute bottom-6 left-6 font-mono text-sm text-ink-200"
          style={{ transform: "translateZ(28px)" }}
        >
          •••• 4291
        </div>
      </motion.div>
    </div>
  );
}
