"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { MediaTile } from "@/components/demos/shared/MediaTile";
import { posters } from "@/components/demos/shared/posters";

/**
 * Thumbnails are placed as percentages and pinned by their own centre, so the
 * constellation reflows with the stage instead of being locked to pixels.
 * `depth` drives both the parallax distance and the entrance order — nearer
 * tiles travel further and arrive last.
 */
const SCATTER = [
  { poster: 0, x: 34, y: 13, w: 116, depth: 1.0 },
  { poster: 1, x: 58, y: 11, w: 104, depth: 0.7 },
  { poster: 2, x: 20, y: 37, w: 128, depth: 1.3 },
  { poster: 3, x: 76, y: 33, w: 120, depth: 1.1 },
  { poster: 5, x: 21, y: 69, w: 132, depth: 1.4 },
  { poster: 4, x: 77, y: 66, w: 112, depth: 0.9 },
  { poster: 6, x: 37, y: 90, w: 108, depth: 0.6 },
  { poster: 9, x: 61, y: 89, w: 124, depth: 1.2 },
];

function Thumb({
  item,
  px,
  py,
  index,
}: {
  item: (typeof SCATTER)[number];
  px: ReturnType<typeof useSpring>;
  py: ReturnType<typeof useSpring>;
  index: number;
}) {
  // Pointer parallax: further-forward tiles swing wider.
  const x = useTransform(px, (v) => v * 22 * item.depth);
  const y = useTransform(py, (v) => v * 16 * item.depth);

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${item.x}%`,
        top: `${item.y}%`,
        width: item.w,
        x,
        y,
        translateX: "-50%",
        translateY: "-50%",
      }}
    >
      {/* Entrance */}
      <motion.div
        initial={{ opacity: 0, scale: 0.72, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{
          delay: 0.5 + index * 0.09,
          duration: 1.1,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {/* Idle drift — separate layer so it never fights the parallax transform */}
        <motion.div
          animate={{ y: [0, -7, 0] }}
          transition={{
            duration: 5 + index * 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.35,
          }}
        >
          <MediaTile
            poster={posters[item.poster]}
            className="aspect-video w-full rounded-[3px] shadow-[0_18px_50px_-20px_rgba(0,0,0,0.9)]"
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function ScatteredMediaHero() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 90, damping: 22, mass: 0.7 };
  const px = useSpring(mx, spring);
  const py = useSpring(my, spring);

  return (
    <div
      className="absolute inset-0 bg-[#080807]"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        // Normalised to -1…1 from the centre.
        mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
        my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      {SCATTER.map((item, i) => (
        <Thumb key={item.poster} item={item} px={px} py={py} index={i} />
      ))}

      {/* Centre column */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6">
        <motion.span
          className="text-[11px] font-medium tracking-[0.42em] text-ink-50"
          initial={{ opacity: 0, letterSpacing: "0.9em" }}
          animate={{ opacity: 1, letterSpacing: "0.42em" }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        >
          DARWIN
          <sup className="ml-1 text-[7px] tracking-normal align-super">™</sup>
        </motion.span>

        {/* Hairline rule with the little travelling marker from the reference */}
        <div className="relative mt-7 h-px w-[min(320px,60%)] overflow-visible">
          <motion.div
            className="h-px w-full origin-center bg-ink-600"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.35, duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.span
            className="absolute -top-px left-0 h-[3px] w-4 bg-ink-50"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: [0, 1, 1], x: [0, 6, 0] }}
            transition={{ delay: 1.1, duration: 2.4, ease: "easeInOut" }}
          />
        </div>

        <div className="mt-14 overflow-hidden">
          <motion.h2
            className="font-serif text-5xl font-normal tracking-tight text-ink-50 sm:text-6xl"
            initial={{ y: "115%" }}
            animate={{ y: 0 }}
            transition={{ delay: 0.75, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            Minifolio
          </motion.h2>
        </div>

        <motion.span
          className="mt-4 text-sm text-ink-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.25, duration: 1 }}
        >
          (2026)
        </motion.span>
      </div>
    </div>
  );
}
