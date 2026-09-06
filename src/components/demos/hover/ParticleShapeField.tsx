"use client";

import { useEffect, useRef, useState } from "react";
import {
  PARTICLE_DEFAULTS,
  createField,
  maskToCells,
  stepField,
} from "@/lib/particleField";

/**
 * A pixel shape that scatters like air under the cursor.
 *
 * The force model lives in src/lib/particleField.ts — radial push, turbulence
 * and lift around the cursor, all eased rather than set. This component is
 * only the source and the wiring: a shape drawn into a small grid, a canvas,
 * and a pointer.
 *
 * Nothing moves until you point at it, and the loop stops asking for frames
 * once the field settles. Click to change shape.
 *
 * To scatter your own photograph instead — and to get the code for it — use
 * the studio at /studio.
 */

const INK = "#f4f4f7";

/** Cells across the shape's own grid. Particle count falls out of this. */
const GRID = 60;

const SHAPES = ["circle", "ring", "square", "triangle"] as const;
type Shape = (typeof SHAPES)[number];

/** Paint the source shape into a GRID x GRID alpha mask. */
function drawShape(c: CanvasRenderingContext2D, kind: Shape) {
  const s = GRID;
  const mid = s / 2;
  c.clearRect(0, 0, s, s);
  c.fillStyle = "#fff";

  if (kind === "circle") {
    c.beginPath();
    c.arc(mid, mid, s * 0.46, 0, Math.PI * 2);
    c.fill();
    return;
  }

  if (kind === "ring") {
    c.beginPath();
    c.arc(mid, mid, s * 0.46, 0, Math.PI * 2);
    c.fill();
    // Punch the middle out rather than stroking, so the inner edge lands on
    // the grid the same way the outer one does.
    c.globalCompositeOperation = "destination-out";
    c.beginPath();
    c.arc(mid, mid, s * 0.26, 0, Math.PI * 2);
    c.fill();
    c.globalCompositeOperation = "source-over";
    return;
  }

  if (kind === "square") {
    const a = s * 0.08;
    c.fillRect(a, a, s * 0.84, s * 0.84);
    return;
  }

  const h = s * 0.86;
  const top = (s - h) / 2;
  c.beginPath();
  c.moveTo(mid, top);
  c.lineTo(mid + h * 0.5, top + h);
  c.lineTo(mid - h * 0.5, top + h);
  c.closePath();
  c.fill();
}

export function ParticleShapeField() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shape, setShape] = useState<Shape>("circle");

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const off = document.createElement("canvas");
    off.width = GRID;
    off.height = GRID;
    const octx = off.getContext("2d", { willReadFrequently: true })!;
    drawShape(octx, shape);
    const field = createField(
      maskToCells(octx.getImageData(0, 0, GRID, GRID).data, GRID, GRID)
    );

    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0;
    let H = 0;
    let cell = 1;
    let originX = 0;
    let originY = 0;
    let frame = 0;
    /** Set while the field is at rest and the cursor is away. */
    let idle = false;

    // Cursor target and its eased follower, both in backing-store pixels.
    let targetX = -9999;
    let targetY = -9999;
    let curX = -9999;
    let curY = -9999;

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
      // The shape keeps to the middle, so there is margin on every side for
      // the particles to disperse into.
      cell = (Math.min(W, H) * 0.52) / GRID;
      originX = (W - GRID * cell) / 2;
      originY = (H - GRID * cell) / 2;
      idle = false;
    };

    const onMove = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      if (!box.width) return;
      targetX = (e.clientX - box.left) * (W / box.width);
      targetY = (e.clientY - box.top) * (H / box.height);
      idle = false;
    };

    // Park the cursor far away so influence decays and the shape reassembles.
    const onLeave = () => {
      targetX = -9999;
      targetY = -9999;
      idle = false;
    };

    const start = performance.now();

    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (idle || !W) return;

      if (curX < -9000) {
        curX = targetX;
        curY = targetY;
      } else {
        curX += (targetX - curX) * 0.1;
        curY += (targetY - curY) * 0.1;
      }

      const moving = stepField(ctx, field, {
        width: W,
        height: H,
        cell,
        originX,
        originY,
        ink: INK,
        time: (performance.now() - start) / 1000,
        cursorX: curX,
        cursorY: curY,
        params: PARTICLE_DEFAULTS,
        calm,
      });

      // Once it has settled and the cursor is gone, stop repainting.
      idle = !moving && targetX < -9000;
    };

    layout();
    frame = requestAnimationFrame(loop);

    const observer = new ResizeObserver(layout);
    observer.observe(stage);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, [shape]);

  return (
    <div
      ref={stageRef}
      onClick={() => setShape((s) => SHAPES[(SHAPES.indexOf(s) + 1) % SHAPES.length])}
      className="absolute inset-0 cursor-crosshair select-none overflow-hidden bg-ink-950"
    >
      <canvas ref={canvasRef} aria-hidden className="block" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-600">
          {shape}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-600">
          move to scatter · click to change
        </span>
      </div>
    </div>
  );
}
