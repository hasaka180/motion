"use client";

import { useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { MediaTile } from "@/components/demos/shared/MediaTile";
import { posters } from "@/components/demos/shared/posters";

const W = 320;
const H = 208;

/** Per-frame offset for the draw-then-open stagger. */
const STEP = 0.07;
/** How long the line is on screen before the image starts opening out of it. */
const HOLD = 0.4;

/**
 * A light-ground filmstrip. Each frame is struck as a vertical hairline that
 * then opens horizontally into the image — the reveal is a clip-path, not a
 * width or scale, so the artwork never squashes as it widens.
 *
 * Panning is driven by pointer position rather than a scrollbar, so the whole
 * strip is reachable inside a fixed stage without hijacking the page scroll.
 * Colour is the affordance: everything sits at grayscale(1) until a frame is
 * hovered, so the one you are looking at is the only one carrying colour.
 */
export function GrayscaleFilmstrip() {
  const [hovered, setHovered] = useState<number | null>(null);

  const pointer = useMotionValue(0.5);
  const eased = useSpring(pointer, { stiffness: 60, damping: 22, mass: 0.8 });
  const x = useTransform(eased, [0, 1], ["6%", "-58%"]);

  return (
    <div
      className="absolute inset-0 flex flex-col justify-center overflow-hidden bg-white"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        pointer.set((e.clientX - r.left) / r.width);
      }}
      onPointerLeave={() => setHovered(null)}
    >
      <motion.div className="flex items-center gap-8" style={{ x }}>
        {posters.map((poster, i) => {
          const delay = i * STEP;
          return (
            <motion.figure
              key={poster.id}
              className="relative shrink-0"
              style={{ width: W, height: H }}
              onPointerEnter={() => setHovered(i)}
              animate={{
                filter: hovered === i ? "grayscale(0)" : "grayscale(1)",
                opacity: hovered === null || hovered === i ? 1 : 0.45,
                scale: hovered === i ? 1.05 : 1,
              }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* The struck line: draws outward from the centre, then hands
                  off to the image and fades as the frame opens past it. */}
              <motion.span
                className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-neutral-900"
                initial={{ scaleY: 0, opacity: 1 }}
                animate={{ scaleY: [0, 1, 1], opacity: [1, 1, 0] }}
                transition={{
                  duration: HOLD + 0.75,
                  times: [0, 0.5, 1],
                  ease: [0.16, 1, 0.3, 1],
                  delay,
                }}
              />

              {/* The image itself, held shut at the same hairline until the
                  line has finished drawing. */}
              <motion.div
                className="h-full w-full"
                initial={{ clipPath: "inset(0 50% 0 50%)" }}
                animate={{ clipPath: "inset(0 0% 0 0%)" }}
                transition={{
                  delay: delay + HOLD,
                  duration: 1,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <MediaTile poster={poster} className="h-full w-full rounded-[2px]" />
              </motion.div>

              <motion.figcaption
                className="absolute -bottom-7 left-0 flex items-baseline gap-2 text-[11px] text-neutral-500"
                animate={{ opacity: hovered === i ? 1 : 0, y: hovered === i ? 0 : -4 }}
                transition={{ duration: 0.35 }}
              >
                <span className="font-mono">{String(i + 1).padStart(2, "0")}</span>
                <span className="uppercase tracking-[0.18em]">{poster.label}</span>
              </motion.figcaption>
            </motion.figure>
          );
        })}
      </motion.div>

      {/* Edge fades keep the strip feeling endless */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent" />

      <motion.p
        className="pointer-events-none absolute inset-x-0 bottom-5 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
      >
        move across to pan · hover a frame for colour
      </motion.p>
    </div>
  );
}
