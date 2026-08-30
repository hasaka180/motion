"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { MediaTile } from "@/components/demos/shared/MediaTile";
import { posters } from "@/components/demos/shared/posters";

/**
 * How far each card climbs, as a fraction of the fastest. Increments shrink
 * left to right, so the row fans out on an eased curve rather than a straight
 * diagonal — and the offsets persist at rest instead of collapsing flat.
 */
const CARDS = [
  { poster: 10, speed: 0.72 },
  { poster: 2, speed: 0.84 },
  { poster: 0, speed: 0.93 },
  { poster: 13, speed: 1.0 },
];

/** Start position, as a percentage of card height below its resting slot. */
const DROP = 132;

function Card({
  card,
  progress,
}: {
  card: (typeof CARDS)[number];
  progress: MotionValue<number>;
}) {
  const y = useTransform(
    progress,
    [0, 1],
    [`${DROP}%`, `${DROP * (1 - card.speed)}%`]
  );

  // The artwork settles as the frame climbs, so the image reveals through the
  // mask instead of riding up rigidly with it.
  const imageY = useTransform(progress, [0, 1], ["12%", "-8%"]);

  return (
    <motion.figure
      className="relative h-[62%] w-[30%] shrink-0 overflow-hidden"
      style={{ y }}
    >
      <motion.div className="absolute -top-[14%] h-[128%] w-full" style={{ y: imageY }}>
        <MediaTile poster={posters[card.poster]} className="h-full w-full" />
      </motion.div>
    </motion.figure>
  );
}

/**
 * A row of cards rising out of the bottom edge, each climbing at its own rate.
 * Because the rates differ rather than the start times, the fan is readable at
 * every scroll position instead of only during a one-shot entrance.
 */
export function RisingImageCards() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: ref });

  const hintOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  return (
    <div ref={ref} className="scroll-thin absolute inset-0 overflow-y-auto bg-white">
      <div className="sticky top-0 h-full overflow-hidden">
        <motion.div
          className="absolute left-8 top-8 font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400"
          style={{ opacity: hintOpacity }}
        >
          Selected work — scroll ↓
        </motion.div>

        {/* Anchored below the frame so the cards stay cropped at the bottom */}
        <div className="absolute inset-x-0 -bottom-16 flex items-end gap-[2.5%] pl-8">
          {CARDS.map((card, i) => (
            <Card key={i} card={card} progress={scrollYProgress} />
          ))}
        </div>
      </div>

      <div className="h-[320%]" />
    </div>
  );
}
