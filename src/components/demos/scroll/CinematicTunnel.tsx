"use client";

import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "motion/react";
import { MediaTile } from "@/components/demos/shared/MediaTile";
import { posters } from "@/components/demos/shared/posters";

/** Total Z distance the camera covers over one full scroll of the stage. */
const TRAVEL = 6000;
const COUNT = 40;

/** Depths, in scene units, at which a panel fades up, holds, and cuts out. */
const FAR = -3400;
const HOLD_IN = -1100;
const HOLD_OUT = -260;
const NEAR = -40;

/** Deterministic PRNG — the layout must be identical on server and client. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Panel = {
  x: number;
  y: number;
  z: number;
  rotateX: number;
  rotateY: number;
  w: number;
  peak: number;
  poster: number;
};

/**
 * Panels line the walls of a corridor: left and right slabs angled inward,
 * a thinner band above and below, and a few drifting in the open field so the
 * centre never reads as an empty pipe.
 */
const PANELS: Panel[] = (() => {
  const rand = mulberry32(20260830);
  return Array.from({ length: COUNT }, (_, i) => {
    const roll = rand();
    const w = 150 + rand() * 170;
    // Spread evenly through depth so a steady scroll meets a steady stream.
    const z = -320 - (i / COUNT) * TRAVEL - rand() * 140;
    const peak = 0.42 + rand() * 0.58;
    const poster = Math.floor(rand() * posters.length);

    if (roll < 0.36) {
      return {
        x: -(330 + rand() * 240),
        y: (rand() - 0.5) * 460,
        z,
        rotateX: 0,
        rotateY: 36 + rand() * 16,
        w,
        peak,
        poster,
      };
    }
    if (roll < 0.72) {
      return {
        x: 330 + rand() * 240,
        y: (rand() - 0.5) * 460,
        z,
        rotateX: 0,
        rotateY: -(36 + rand() * 16),
        w,
        peak,
        poster,
      };
    }
    if (roll < 0.88) {
      const above = rand() < 0.5;
      return {
        x: (rand() - 0.5) * 640,
        y: above ? -(230 + rand() * 130) : 230 + rand() * 130,
        z,
        rotateX: above ? 28 + rand() * 12 : -(28 + rand() * 12),
        rotateY: 0,
        w,
        peak,
        poster,
      };
    }
    return {
      x: (rand() - 0.5) * 700,
      y: (rand() - 0.5) * 400,
      z,
      rotateX: 0,
      rotateY: (rand() - 0.5) * 18,
      w: w * 0.75,
      peak: peak * 0.9,
      poster,
    };
  });
})();

function Frame({
  panel,
  progress,
  blur,
}: {
  panel: Panel;
  progress: MotionValue<number>;
  blur: MotionValue<string>;
}) {
  /**
   * Opacity is derived from the panel's effective depth rather than mapped
   * from a keyframe range. A range would have to run outside [0, 1] for panels
   * that are already fading when the scroll starts, or still visible when it
   * ends — and Motion hands scroll-linked keyframes to the browser's native
   * scroll timeline, which only accepts offsets within [0, 1]. The function
   * form stays on the main thread and takes any depth.
   */
  const opacity = useTransform(progress, (p) => {
    const depth = panel.z + p * TRAVEL;
    if (depth <= FAR || depth >= NEAR) return 0;
    if (depth < HOLD_IN) return (panel.peak * (depth - FAR)) / (HOLD_IN - FAR);
    if (depth <= HOLD_OUT) return panel.peak;
    return (panel.peak * (NEAR - depth)) / (NEAR - HOLD_OUT);
  });

  const h = (panel.w * 9) / 16;

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{
        width: panel.w,
        height: h,
        marginLeft: -panel.w / 2,
        marginTop: -h / 2,
        x: panel.x,
        y: panel.y,
        z: panel.z,
        rotateX: panel.rotateX,
        rotateY: panel.rotateY,
        opacity,
        filter: blur,
        backfaceVisibility: "hidden",
      }}
    >
      <MediaTile poster={posters[panel.poster]} className="h-full w-full" />
      {/* Screens read as emissive, not lit — a dark wash keeps them filmic. */}
      <div className="pointer-events-none absolute inset-0 bg-ink-950/35" />
    </motion.div>
  );
}

const Lead = ({ children }: { children: React.ReactNode }) => (
  <span className="mx-2 align-middle text-[9px] uppercase tracking-[0.34em] text-ink-400 sm:text-[10px]">
    {children}
  </span>
);

const Key = ({ children }: { children: React.ReactNode }) => (
  <span className="text-xl tracking-[0.14em] sm:text-3xl">{children}</span>
);

/**
 * A scroll-driven camera flight down a corridor of screens. Vertical scroll
 * inside the stage translates the whole 3D scene toward the viewer; scroll
 * *velocity* drives a blur on the panels only, so hard scrubbing smears the
 * corridor while the titles stay legible.
 */
export function CinematicTunnel() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: ref });

  const sceneZ = useTransform(scrollYProgress, [0, 1], [0, TRAVEL]);

  const velocity = useVelocity(scrollYProgress);
  const smoothed = useSpring(velocity, { stiffness: 240, damping: 44, mass: 0.4 });
  const blurPx = useTransform(smoothed, [-2.2, 0, 2.2], [14, 0, 14], { clamp: true });
  const blur = useMotionTemplate`blur(${blurPx}px)`;

  const introOpacity = useTransform(scrollYProgress, [0, 0.05, 0.13], [1, 1, 0]);
  const welcomeOpacity = useTransform(
    scrollYProgress,
    [0.24, 0.34, 0.5, 0.58],
    [0, 1, 1, 0]
  );
  const welcomeScale = useTransform(scrollYProgress, [0.24, 0.58], [0.92, 1.08]);
  const indexOpacity = useTransform(
    scrollYProgress,
    [0.7, 0.78, 0.92, 0.98],
    [0, 1, 1, 0]
  );
  const indexScale = useTransform(scrollYProgress, [0.7, 0.98], [0.94, 1.05]);

  return (
    <div ref={ref} className="scroll-thin absolute inset-0 overflow-y-auto bg-black">
      <div
        className="sticky top-0 h-full overflow-hidden"
        style={{ perspective: 900, perspectiveOrigin: "50% 50%" }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d", z: sceneZ }}
        >
          {PANELS.map((panel, i) => (
            <Frame key={i} panel={panel} progress={scrollYProgress} blur={blur} />
          ))}
        </motion.div>

        {/* Vignette — the corridor should fall off into black at the edges */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 20%, rgba(0,0,0,0.75) 78%, #000 100%)",
          }}
        />

        {/* Title beats, held in screen space rather than inside the scene */}
        <motion.div
          className="pointer-events-none absolute inset-0 grid place-items-center"
          style={{ opacity: introOpacity }}
        >
          <div className="text-center">
            <span className="text-[10px] font-medium tracking-[0.42em] text-ink-200">
              DARWIN
              <sup className="ml-0.5 align-super text-[6px] tracking-normal">™</sup>
            </span>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-600">
              scroll to enter
            </p>
          </div>
        </motion.div>

        <motion.div
          className="pointer-events-none absolute inset-0 grid place-items-center px-8"
          style={{ opacity: welcomeOpacity, scale: welcomeScale }}
        >
          <p className="text-center font-serif leading-[2] text-ink-50">
            <span className="block text-[9px] uppercase tracking-[0.5em] text-ink-200">
              Welcome
            </span>
            <span className="block">
              <Lead>to</Lead>
              <Key>DARWIN&rsquo;S</Key>
              <Lead>universe</Lead>
            </span>
            <span className="block">
              <Lead>of</Lead>
              <Key>HERO</Key>
              <Lead>+</Lead>
              <Key>TEXT</Key>
              <Lead>and</Lead>
              <Key>SCROLL</Key>
            </span>
            <span className="block">
              <Lead>motion</Lead>
              <Key>ENGINEERING</Key>
            </span>
          </p>
        </motion.div>

        <motion.div
          className="pointer-events-none absolute inset-0 grid place-items-center"
          style={{ opacity: indexOpacity, scale: indexScale }}
        >
          <div className="text-center">
            <span className="block text-xs text-ink-400">+</span>
            <span className="mt-3 block font-serif text-sm tracking-[0.42em] text-ink-200">
              INDEX VIEW
            </span>
          </div>
        </motion.div>

        {/* Depth readout */}
        <div className="pointer-events-none absolute inset-x-0 bottom-4 mx-auto h-px w-40 bg-white/10">
          <motion.div
            className="h-full origin-left bg-white/50"
            style={{ scaleX: scrollYProgress }}
          />
        </div>
      </div>

      {/* Scroll runway */}
      <div className="h-[600%]" />
    </div>
  );
}
