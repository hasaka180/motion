"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULTS, buildCells, sampleToGrid, type Cells } from "@/lib/dither";
import {
  ASSEMBLE_DEFAULTS,
  createAssembly,
  paintAssembly,
  type Assembly,
} from "@/lib/assembleField";
import { SRC_H, SRC_W, drawPortrait } from "@/components/demos/shared/portrait";

/**
 * A picture forming out of dust.
 *
 * The image is dithered to a grid of ink cells (lib/dither), then every cell is
 * thrown out from the centre, turned transparent and shrunk. Over the run each
 * one spirals home, fades up and grows, with a turbulence that dies as it
 * lands. Departures are staggered, so the picture resolves out of noise rather
 * than sliding into place — see lib/assembleField for the model.
 *
 * It runs once, when the stage first comes into view. Click to run it again.
 */

const INK = "#f4f4f7";
const GROUND = "#08080b";

const OPTIONS = { ...DEFAULTS, gridW: 120, fade: 0.18 };
const MOTION = ASSEMBLE_DEFAULTS;
/** Square size within its cell, leaving the pixel gap. */
const FILL = 0.86;

export function ParticleAssemble() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dither the source once, then lay out where each cell starts from.
    const src = document.createElement("canvas");
    src.width = SRC_W;
    src.height = SRC_H;
    drawPortrait(src.getContext("2d")!);
    const { data, cols, rows } = sampleToGrid(src, SRC_W, SRC_H, OPTIONS.gridW);
    const cells: Cells = buildCells(data, cols, rows, OPTIONS);
    const assembly: Assembly = createAssembly(cells, MOTION);

    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0;
    let H = 0;
    let cell = 1;
    let originX = 0;
    let originY = 0;
    let frame = 0;
    let startedAt = 0;
    let done = false;

    const layout = () => {
      const box = stage.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.round(box.width * dpr);
      H = Math.round(box.height * dpr);
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = `${box.width}px`;
      canvas.style.height = `${box.height}px`;
      // Leave room around the picture for the dust to arrive from.
      cell = Math.min((W * 0.62) / cols, (H * 0.62) / rows);
      originX = (W - cols * cell) / 2;
      originY = (H - rows * cell) / 2;
      done = false;
    };

    const draw = (progress: number, time: number) => {
      paintAssembly(ctx, assembly, {
        width: W,
        height: H,
        cell,
        originX,
        originY,
        ink: INK,
        fill: FILL,
        progress,
        time,
        params: MOTION,
        calm,
      });
    };

    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (!W || !startedAt) return;
      // Once it has landed there is nothing left to animate.
      if (done) return;

      const elapsed = (performance.now() - startedAt) / 1000;
      const progress = Math.min(1, elapsed / MOTION.duration);
      draw(progress, elapsed);
      if (progress >= 1) done = true;
    };

    layout();
    draw(0, 0);
    frame = requestAnimationFrame(loop);

    // Hold the dust until the stage is actually on screen.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !startedAt) {
          startedAt = performance.now();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(stage);

    const ro = new ResizeObserver(layout);
    ro.observe(stage);

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
    };
  }, [run]);

  return (
    <div
      ref={stageRef}
      onClick={() => setRun((n) => n + 1)}
      className="absolute inset-0 cursor-pointer select-none overflow-hidden"
      style={{ background: GROUND }}
    >
      <canvas ref={canvasRef} aria-hidden className="block" />

      <span className="pointer-events-none absolute bottom-5 right-5 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-600">
        click to re-form
      </span>
    </div>
  );
}
