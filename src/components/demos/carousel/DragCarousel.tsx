"use client";

import { useRef } from "react";
import { motion } from "motion/react";

const SLIDES = [
  { title: "Aurora", hue: "from-violet-500 to-fuchsia-500" },
  { title: "Tidal", hue: "from-cyan-500 to-blue-600" },
  { title: "Ember", hue: "from-amber-500 to-red-500" },
  { title: "Fern", hue: "from-emerald-500 to-teal-600" },
  { title: "Dusk", hue: "from-indigo-500 to-purple-600" },
];

/** Drag-to-scroll track with elastic edges and momentum. */
export function DragCarousel() {
  const track = useRef<HTMLDivElement>(null);

  return (
    <div className="absolute inset-0 flex flex-col justify-center">
      <div ref={track} className="overflow-hidden px-8">
        <motion.div
          className="flex cursor-grab gap-4 active:cursor-grabbing"
          drag="x"
          dragConstraints={track}
          dragElastic={0.12}
          dragTransition={{ power: 0.3, timeConstant: 260 }}
          whileTap={{ cursor: "grabbing" }}
        >
          {SLIDES.map((s) => (
            <motion.div
              key={s.title}
              className="relative h-56 w-48 shrink-0 overflow-hidden rounded-2xl border border-ink-800"
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${s.hue} opacity-80`} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent" />
              <span className="absolute bottom-4 left-4 text-sm font-semibold">
                {s.title}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <p className="mt-6 px-8 text-center font-mono text-xs uppercase tracking-[0.2em] text-ink-600">
        drag the track ←→
      </p>
    </div>
  );
}
