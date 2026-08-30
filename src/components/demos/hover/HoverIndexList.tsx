"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MediaTile } from "@/components/demos/shared/MediaTile";
import { posters } from "@/components/demos/shared/posters";

const ITEMS = [
  { label: "HERO SECTIONS", poster: 2 },
  { label: "INTRO SEQUENCES", poster: 9 },
  { label: "TEXT REVEALS", poster: 0 },
  { label: "SCROLL PARALLAX", poster: 13 },
  { label: "DRAG CAROUSELS", poster: 8 },
  { label: "PAGE TRANSITIONS", poster: 5 },
  { label: "MICRO INTERACTIONS", poster: 15 },
  { label: "LOADING STATES", poster: 10 },
];

const INK = "#2b0a10";
const MUTED = "#c8949f";

/**
 * An editorial index where hovering a row swaps the panel beside it. The swap
 * is a directional wipe rather than a crossfade: the incoming frame enters
 * from whichever way the pointer travelled through the list, so the panel
 * reads as connected to the cursor instead of just blinking.
 */
export function HoverIndexList() {
  const [[active, direction], setActive] = useState<[number, number]>([5, 1]);

  const pick = (i: number) =>
    setActive(([prev]) => (i === prev ? [prev, 1] : [i, i > prev ? 1 : -1]));

  return (
    <div className="absolute inset-0 flex bg-[#f6dfe3]">
      <div className="flex min-w-0 flex-1 flex-col justify-center px-8 py-6">
        <div className="mb-6 flex items-center gap-4 self-center text-[10px] font-semibold tracking-[0.25em]"
          style={{ color: INK }}
        >
          <span className="text-[7px]">□</span>
          WHAT DARWIN COVERS
          <span className="text-[7px]">□</span>
        </div>

        <ul className="text-center font-display leading-[1.04]">
          {ITEMS.map((item, i) => (
            <li key={item.label}>
              <motion.button
                type="button"
                onPointerEnter={() => pick(i)}
                onFocus={() => pick(i)}
                className="w-full cursor-default text-[clamp(15px,2.4vw,26px)] tracking-[-0.01em] outline-none"
                animate={{ color: active === i ? INK : MUTED }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                {item.label}
              </motion.button>
            </li>
          ))}
        </ul>

        <p
          className="mx-auto mt-8 max-w-xs text-center text-[10px] font-semibold leading-[1.7] tracking-[0.06em]"
          style={{ color: INK }}
        >
          MOTION DOESN&rsquo;T DEPEND ON ONE PERFECT EASING CURVE. KNOWING WHEN
          TO HOLD STILL IS WHAT MATTERS THE MOST — IT&rsquo;S CONSISTENT RHYTHM.
        </p>
      </div>

      <div className="relative w-[42%] shrink-0 overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.div
            key={active}
            className="absolute inset-0"
            // The outgoing frame simply holds until it is covered, so there is
            // never a gap of empty panel between the two.
            initial={{
              clipPath:
                direction > 0 ? "inset(100% 0 0 0)" : "inset(0 0 100% 0)",
            }}
            animate={{ clipPath: "inset(0 0 0 0)" }}
            exit={{ opacity: 1, transition: { duration: 0.7 } }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <motion.div
              className="h-full w-full"
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <MediaTile
                poster={posters[ITEMS[active].poster]}
                className="h-full w-full"
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
