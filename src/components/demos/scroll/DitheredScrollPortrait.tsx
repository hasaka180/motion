"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from "motion/react";
import {
  DEFAULTS,
  buildCells,
  paintCells,
  sampleToGrid,
  type Cells,
} from "@/lib/dither";
import { SRC_H, SRC_W, drawPortrait } from "@/components/demos/shared/portrait";

/**
 * A print that develops as you scroll.
 *
 * The maths lives in src/lib/dither.ts — an image is thresholded through an
 * 8x8 Bayer matrix into ink cells, each carrying its own threshold, and scroll
 * progress sweeps past them so the picture comes up in grain rather than in a
 * wipe. This component is only the wiring: a source, a canvas, and a scroll.
 *
 * The source is drawn procedurally (see shared/portrait) so the repo carries
 * no bitmaps. To develop your own photograph instead — and to get the code for
 * it — use the studio at /studio.
 */

const INK = "#12222a";
const GROUND = "#f1efe9";

const OPTIONS = { ...DEFAULTS, gridW: 140 };

export function DitheredScrollPortrait() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const cellsRef = useRef<Cells | null>(null);
  const cellRef = useRef(1);
  /** Last painted progress, so a resize can repaint where we left off. */
  const progressRef = useRef(0);

  const reduce = useReducedMotion();

  const paint = useCallback((p: number) => {
    const ctx = ctxRef.current;
    const cells = cellsRef.current;
    if (!ctx || !cells) return;
    progressRef.current = p;
    paintCells(ctx, cells, cellRef.current, p, INK);
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    const stage = stageRef.current;
    if (!cv || !stage) return;

    ctxRef.current = cv.getContext("2d");

    const src = document.createElement("canvas");
    src.width = SRC_W;
    src.height = SRC_H;
    drawPortrait(src.getContext("2d")!);

    const { data, cols, rows } = sampleToGrid(src, SRC_W, SRC_H, OPTIONS.gridW);
    cellsRef.current = buildCells(data, cols, rows, OPTIONS);

    const layout = () => {
      const ctx = ctxRef.current;
      const cells = cellsRef.current;
      if (!ctx || !cells) return;

      const box = stage.getBoundingClientRect();
      const cell = Math.min(
        (box.width * 0.8) / cells.cols,
        (box.height * 0.88) / cells.rows
      );
      cellRef.current = cell;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.style.width = `${cells.cols * cell}px`;
      cv.style.height = `${cells.rows * cell}px`;
      cv.width = Math.round(cells.cols * cell * dpr);
      cv.height = Math.round(cells.rows * cell * dpr);
      // Assigning width/height clears the transform, so set it after.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(progressRef.current);
    };

    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [paint]);

  const { scrollYProgress } = useScroll({ container: scrollRef });
  // The spring is the developer bath: cells keep coming up for a beat after
  // the scroll stops, instead of snapping to the scrollbar position.
  const developed = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.35,
  });

  // Under reduced motion the print still develops — the scroll is the user's
  // own gesture, and refusing to draw it just leaves a dead canvas. What goes
  // is the spring: cells land exactly where the finger is, with nothing
  // continuing to move after it stops.
  useMotionValueEvent(reduce ? scrollYProgress : developed, "change", paint);

  return (
    <div ref={scrollRef} className="scroll-thin absolute inset-0 overflow-y-auto">
      <div
        ref={stageRef}
        className="sticky top-0 flex h-full items-center justify-center overflow-hidden"
        style={{ background: GROUND }}
      >
        <canvas ref={canvasRef} aria-hidden className="block" />
      </div>

      {/* Scroll runway — the print occupies this much travel. */}
      <div className="h-[320%]" />
    </div>
  );
}
