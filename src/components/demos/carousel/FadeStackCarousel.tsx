"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  type AnimationPlaybackControls,
} from "motion/react";

const SLIDES = [
  { title: "Northern light", body: "Shot on a 30s exposure.", hue: "from-violet-600 to-indigo-900" },
  { title: "Deep current", body: "Long-lens, cold water.", hue: "from-cyan-600 to-blue-900" },
  { title: "Low sun", body: "Golden hour, no filter.", hue: "from-amber-500 to-rose-800" },
];

const DURATION = 4;

/**
 * Auto-advancing crossfade. The progress bar *is* the timer — advancing on its
 * onComplete means hover-to-pause freezes the bar mid-track instead of
 * restarting it, which a separate setTimeout could never stay in sync with.
 */
export function FadeStackCarousel() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const progress = useMotionValue(0);
  const controls = useRef<AnimationPlaybackControls | null>(null);

  useEffect(() => {
    progress.set(0);
    const run = animate(progress, 1, {
      duration: DURATION,
      ease: "linear",
      onComplete: () => setI((n) => (n + 1) % SLIDES.length),
    });
    controls.current = run;
    return () => run.stop();
  }, [i, progress]);

  useEffect(() => {
    if (paused) controls.current?.pause();
    else controls.current?.play();
  }, [paused]);

  const slide = SLIDES[i];

  return (
    <div
      className="absolute inset-0"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <AnimatePresence>
        <motion.div
          key={i}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${slide.hue}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-x-0 bottom-0 p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <h3 className="text-2xl font-semibold tracking-tight">{slide.title}</h3>
            <p className="mt-1 text-sm text-ink-200">{slide.body}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-5 flex gap-2">
          {SLIDES.map((_, n) => (
            <button
              key={n}
              onClick={() => setI(n)}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/20"
              aria-label={`Go to slide ${n + 1}`}
            >
              <motion.span
                className="block h-full origin-left bg-white"
                style={{ scaleX: n === i ? progress : n < i ? 1 : 0 }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
