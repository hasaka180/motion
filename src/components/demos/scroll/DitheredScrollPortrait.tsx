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

/**
 * A print that develops as you scroll.
 *
 * The maths lives in src/lib/dither.ts — an image is thresholded through an
 * 8x8 Bayer matrix into ink cells, each carrying its own threshold, and scroll
 * progress sweeps past them so the picture comes up in grain rather than in a
 * wipe. This component is only the wiring: a source, a canvas, and a scroll.
 *
 * The source here is drawn procedurally (see drawSource) so the repo carries
 * no bitmaps. To develop your own photograph instead — and to get the code for
 * it — use the studio at /studio.
 */

const INK = "#12222a";
const GROUND = "#f1efe9";

/** Aspect of the source render, and therefore of the finished print. */
const SRC_W = 300;
const SRC_H = 390;

const OPTIONS = { ...DEFAULTS, gridW: 140 };

/** A soft dark blob — the shading that gives the face its structure. */
function shade(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  alpha: number
) {
  const g = c.createRadialGradient(x, y, 0, x, y, 1);
  g.addColorStop(0, `rgba(0,0,0,${alpha})`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.save();
  c.translate(x, y);
  c.scale(rx, ry);
  c.translate(-x, -y);
  c.fillStyle = g;
  c.fillRect(x - 1, y - 1, 2, 2);
  c.restore();
}

/**
 * Stand-in for a photograph: a lit bust painted with canvas gradients. Only
 * luminance matters downstream, so this needs a real tonal range and nothing
 * else. Anything at or above the highlight ceiling ends up as bare paper,
 * anything under the background cut-off is dropped entirely.
 */
function drawSource(c: CanvasRenderingContext2D) {
  const w = SRC_W;
  const h = SRC_H;

  c.fillStyle = "#000";
  c.fillRect(0, 0, w, h);

  // Body first, as a clip, so the key light only ever lands on the figure.
  c.save();
  c.beginPath();
  c.ellipse(w * 0.5, h * 1.14, w * 0.46, h * 0.42, 0, 0, Math.PI * 2);
  c.ellipse(w * 0.5, h * 0.6, w * 0.105, h * 0.16, 0, 0, Math.PI * 2);
  c.clip();

  const key = c.createRadialGradient(
    w * 0.34,
    h * 0.24,
    w * 0.02,
    w * 0.34,
    h * 0.3,
    w * 0.92
  );
  key.addColorStop(0, "#ffffff");
  key.addColorStop(0.16, "#e2e2e2");
  key.addColorStop(0.34, "#9a9a9a");
  key.addColorStop(0.58, "#4a4a4a");
  key.addColorStop(0.8, "#242424");
  key.addColorStop(1, "#131313");
  c.fillStyle = key;
  c.fillRect(0, 0, w, h);

  // Rim down the shadow side, so the dark half keeps an edge against the paper.
  const rim = c.createLinearGradient(w * 0.68, 0, w, 0);
  rim.addColorStop(0, "rgba(255,255,255,0)");
  rim.addColorStop(1, "rgba(255,255,255,0.5)");
  c.globalCompositeOperation = "lighter";
  c.fillStyle = rim;
  c.fillRect(0, 0, w, h);
  c.globalCompositeOperation = "source-over";
  c.restore();

  // Hair is the densest ink in the frame: dark, but kept well above the
  // background cut-off so it reads as solid tone instead of dropping out.
  const strands = c.createLinearGradient(w * 0.3, 0, w * 0.72, h * 0.5);
  strands.addColorStop(0, "#343434");
  strands.addColorStop(0.5, "#1e1e1e");
  strands.addColorStop(1, "#101010");
  c.fillStyle = strands;
  c.beginPath();
  c.ellipse(w * 0.5, h * 0.335, w * 0.2, h * 0.235, 0, 0, Math.PI * 2);
  c.ellipse(w * 0.325, h * 0.43, w * 0.045, h * 0.085, 0, 0, Math.PI * 2);
  c.ellipse(w * 0.675, h * 0.43, w * 0.045, h * 0.085, 0, 0, Math.PI * 2);
  c.fill();

  // The face sits inside the hair, so the hair frames it.
  c.save();
  c.beginPath();
  c.ellipse(w * 0.505, h * 0.385, w * 0.158, h * 0.2, 0, 0, Math.PI * 2);
  c.clip();

  // Radius chosen so the gradient actually crosses the face: the forehead sits
  // in the blown-out highlight, the jaw falls through the ceiling into ink.
  // Without that traverse the oval prints as blank paper.
  const skin = c.createRadialGradient(
    w * 0.42,
    h * 0.3,
    w * 0.02,
    w * 0.42,
    h * 0.3,
    w * 0.34
  );
  skin.addColorStop(0, "#ffffff");
  skin.addColorStop(0.3, "#fafafa");
  skin.addColorStop(0.55, "#c0c0c0");
  skin.addColorStop(0.75, "#6e6e6e");
  skin.addColorStop(0.95, "#2e2e2e");
  skin.addColorStop(1, "#1a1a1a");
  c.fillStyle = skin;
  c.fillRect(0, 0, w, h);

  // Enough modelling to read as a face at this grid size — brow line, the
  // shadow beside the nose, and the mouth. Any finer detail is lost anyway.
  shade(c, w * 0.45, h * 0.35, w * 0.062, h * 0.03, 0.72);
  shade(c, w * 0.565, h * 0.35, w * 0.058, h * 0.028, 0.66);
  shade(c, w * 0.535, h * 0.415, w * 0.028, h * 0.035, 0.55);
  shade(c, w * 0.5, h * 0.455, w * 0.05, h * 0.02, 0.6);
  c.restore();

  // Cast shadow under the jaw, so the head sits on the neck.
  shade(c, w * 0.5, h * 0.53, w * 0.16, h * 0.055, 0.75);
}

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
    drawSource(src.getContext("2d")!);

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
