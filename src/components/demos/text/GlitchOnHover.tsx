"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue } from "motion/react";

const LINES = ["ACCELERATING", "INTERFACE", "MOTION"];

/** Full-width horizontal tears. */
const BANDS = 6;
/** Small rectangular corruption, offset on both axes. */
const BLOCKS = 4;

const HIDDEN = "inset(0 0 100% 0)";

type Mode = "band" | "block";

/**
 * One displaced copy of the headline. Each slice owns its own timer and
 * randomises itself — glitch reads as broken precisely because the layers are
 * uncorrelated, so driving them from one shared clock would make it pulse.
 *
 * Values are pushed straight into MotionValues rather than React state: at
 * ~15 changes a second across ten layers, re-rendering would cost far more
 * than the effect is worth, and none of it needs to be in the tree.
 */
function Slice({
  mode,
  active,
  children,
}: {
  mode: Mode;
  active: boolean;
  children: ReactNode;
}) {
  const clipPath = useMotionValue(HIDDEN);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useMotionValue(0);

  useEffect(() => {
    let raf = 0;
    let last = 0;

    const clear = () => {
      clipPath.set(HIDDEN);
      opacity.set(0);
      x.set(0);
      y.set(0);
    };

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      // Hold each state for a beat. A per-frame shuffle reads as noise; the
      // stutter is what makes it look like dropped frames.
      if (t - last < 55 + Math.random() * 75) return;
      last = t;

      // Idle still twitches occasionally so the demo isn't dead on arrival —
      // but rarely enough to read as a flicker, not as constant noise. Ten
      // slices ticking ~8x a second means even a small chance adds up.
      if (!active && Math.random() > 0.015) {
        clear();
        return;
      }

      if (mode === "band") {
        const top = Math.random() * 88;
        const height = 3 + Math.random() * 13;
        clipPath.set(`inset(${top}% 0 ${100 - top - height}% 0)`);
        x.set((Math.random() - 0.5) * (active ? 70 : 30));
        y.set(0);
      } else {
        const top = Math.random() * 70;
        const left = Math.random() * 70;
        clipPath.set(
          `inset(${top}% ${100 - left - (8 + Math.random() * 22)}% ${
            100 - top - (6 + Math.random() * 18)
          }% ${left}%)`
        );
        x.set((Math.random() - 0.5) * (active ? 90 : 36));
        y.set((Math.random() - 0.5) * 22);
      }

      opacity.set(Math.random() < 0.22 ? 0 : 1);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clear();
    };
  }, [active, mode, clipPath, opacity, x, y]);

  return (
    <motion.div
      aria-hidden
      className="absolute inset-0"
      style={{
        clipPath,
        x,
        y,
        opacity,
        // Difference blending is what produces the punched-out negative
        // blocks — plain white copies would only ever look like ghosting.
        mixBlendMode: mode === "block" ? "difference" : "normal",
      }}
    >
      {children}
    </motion.div>
  );
}

export function GlitchOnHover() {
  const [active, setActive] = useState(false);
  const jitterX = useMotionValue(0);
  const frame = useRef(0);

  // Whole-headline judder, only while hovered.
  useEffect(() => {
    if (!active) {
      jitterX.set(0);
      return;
    }
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (frame.current++ % 4) return;
      jitterX.set((Math.random() - 0.5) * 5);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      jitterX.set(0);
    };
  }, [active, jitterX]);

  const headline = (
    <div className="font-medium uppercase leading-[1.06] tracking-[0.07em] text-white">
      {LINES.map((line, i) => (
        <div key={line} style={{ paddingLeft: i * 34 }}>
          {line}
        </div>
      ))}
    </div>
  );

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[#0b0b0c]"
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
    >
      {/* Lamp falling across the right of the frame */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 70% at 72% 38%, rgba(255,255,255,0.16), transparent 62%)",
        }}
      />

      <div className="absolute inset-0 grid place-items-center px-8">
        <motion.div
          className="relative text-[clamp(26px,5.4vw,58px)]"
          style={{ x: jitterX }}
        >
          {headline}
          {Array.from({ length: BANDS }).map((_, i) => (
            <Slice key={`band-${i}`} mode="band" active={active}>
              {headline}
            </Slice>
          ))}
          {Array.from({ length: BLOCKS }).map((_, i) => (
            <Slice key={`block-${i}`} mode="block" active={active}>
              {headline}
            </Slice>
          ))}
        </motion.div>
      </div>

      {/* Scanlines and grain sit above the type so the whole frame degrades */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.45) 0 1px, transparent 1px 3px)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.13] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <p className="pointer-events-none absolute inset-x-0 bottom-5 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-white/35">
        hover to corrupt
      </p>
    </div>
  );
}
