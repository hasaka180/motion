"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { MediaTile } from "@/components/demos/shared/MediaTile";
import { posters } from "@/components/demos/shared/posters";

const SECTIONS = [
  {
    title: "Hero sections",
    poster: 2,
    body: "Above-the-fold openers that set the tone before a single word is read — cursor spotlights, drifting gradient meshes and curtain reveals.",
  },
  {
    title: "Text reveals",
    poster: 13,
    body: "Type that arrives with intent. Word staggers, character scrambles and masked line reveals, tuned so the sentence reads itself.",
  },
  {
    title: "Scroll motion",
    poster: 5,
    body: "Motion bound to the scrollbar rather than a timer. Parallax depth, pinned sections and camera flights that scrub in both directions.",
  },
  {
    title: "Page transitions",
    poster: 9,
    body: "Moving between views without losing the thread. Pixel dissolves, slat wipes and shared-element handoffs.",
  },
];

const GLYPHS = "abcdefghijklmnopqrstuvwxyz";

/** Resolves left to right, unresolved characters cycling — one rAF, no timers. */
function Scrambled({ text }: { text: string }) {
  const [out, setOut] = useState(text);

  useEffect(() => {
    let raf = 0;
    let frame = 0;
    const settleAt = text.split("").map((_, i) => 6 + i * 2.6);
    const done = settleAt[settleAt.length - 1];

    const tick = () => {
      const f = frame++;
      setOut(
        text
          .split("")
          .map((ch, i) =>
            ch === " " || f >= settleAt[i]
              ? ch
              : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          )
          .join("")
      );
      if (f < done) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text]);

  return <>{out}</>;
}

/**
 * A pinned media column beside text that advances with the scrollbar. The
 * column is one tall strip translated by a fraction of its own height, so the
 * outgoing clip pushes the incoming one — during the swap both are on screen,
 * which is what separates this from a crossfade.
 */
export function StickyMediaSections() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: ref });
  const [index, setIndex] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = Math.min(SECTIONS.length - 1, Math.max(0, Math.floor(p * SECTIONS.length)));
    setIndex((current) => (current === next ? current : next));
  });

  const section = SECTIONS[index];

  return (
    <div ref={ref} className="scroll-thin absolute inset-0 overflow-y-auto bg-[#0e0e0f]">
      <div className="sticky top-0 flex h-full items-center gap-8 px-8">
        <div className="relative h-[86%] w-[38%] shrink-0 overflow-hidden rounded-2xl bg-black">
          <motion.div
            className="h-full"
            // Each child is one card-height, so the strip is N cards tall and
            // one step is 100/N percent of the strip — not 100%.
            animate={{ y: `${(-index * 100) / SECTIONS.length}%` }}
            transition={{ type: "spring", stiffness: 150, damping: 26, mass: 0.9 }}
          >
            {SECTIONS.map((s) => (
              <div key={s.title} className="h-full w-full">
                <MediaTile poster={posters[s.poster]} className="h-full w-full" />
              </div>
            ))}
          </motion.div>

          <span className="absolute bottom-4 left-4 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-white/80">
            Darwin — categories
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-[clamp(26px,3.6vw,44px)] font-medium tracking-tight text-ink-50">
            <Scrambled text={section.title} />
          </h3>

          <motion.p
            key={index}
            className="mt-4 max-w-sm text-sm leading-relaxed text-ink-400"
            initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            {section.body}
          </motion.p>

          <div className="mt-10 flex items-center gap-4">
            <span className="font-mono text-[11px] tabular-nums text-ink-600">
              {String(index + 1).padStart(2, "0")} / {String(SECTIONS.length).padStart(2, "0")}
            </span>
            <div className="h-px w-32 bg-ink-800">
              <motion.div
                className="h-full origin-left bg-ink-200"
                animate={{ scaleX: (index + 1) / SECTIONS.length }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="h-[400%]" />
    </div>
  );
}
