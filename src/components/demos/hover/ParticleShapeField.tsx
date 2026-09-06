"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A pixel shape that scatters like air under the cursor.
 *
 * The shape is drawn once into a small offscreen grid, and every filled cell
 * becomes a particle that remembers where it belongs. The cursor does three
 * things to the particles near it: pushes them radially out, adds a little
 * turbulence so the scatter is not a clean ring, and lifts them, because air
 * rises. Each particle then eases toward that target rather than snapping to
 * it, which is what makes the field feel like smoke instead of a shockwave —
 * and why it drifts home slowly when the cursor leaves.
 *
 * Nothing moves until you point at it: influence falls to zero outside the
 * cursor's reach, so the shape sits perfectly still at rest.
 *
 * Click to change shape.
 */

const INK = "#f4f4f7";

/** Cells across the shape's own grid. Particle count falls out of this. */
const GRID = 60;
/** Alpha over this counts as a filled cell. */
const ALPHA_CUT = 110;

/** Reach of the cursor, as a fraction of the shape's width. */
const REACH = 0.36;
/** How far particles are blown, as a fraction of the shape's width. */
const PUSH = 0.075;
/** Turbulence amplitude, same units. */
const DRIFT = 0.026;
/** Upward bias — air rises. */
const LIFT = 0.022;
/** Per-frame easing toward the target. Low is floaty. */
const EASE = 0.07;
/** Particles thin as they disperse. */
const THIN = 0.5;
/** Square size within its cell, leaving the pixel gap. */
const FILL = 0.82;

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
    // Punch the middle out rather than stroking, so the edge lands on the grid
    // the same way the outer edge does.
    c.globalCompositeOperation = "destination-out";
    c.beginPath();
    c.arc(mid, mid, s * 0.26, 0, Math.PI * 2);
    c.fill();
    c.globalCompositeOperation = "source-over";
    return;
  }

  if (kind === "square") {
    const a = s * 0.08;
    const w = s * 0.84;
    c.fillRect(a, a, w, w);
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

type Particle = {
  /** Home cell, in grid coordinates. */
  gx: number;
  gy: number;
  /** Current offset from home, in device pixels. */
  dx: number;
  dy: number;
  /** Phase, so neighbours do not drift in lockstep. */
  seed: number;
};

function buildParticles(kind: Shape): Particle[] {
  const off = document.createElement("canvas");
  off.width = GRID;
  off.height = GRID;
  const ctx = off.getContext("2d", { willReadFrequently: true })!;
  drawShape(ctx, kind);
  const data = ctx.getImageData(0, 0, GRID, GRID).data;

  const out: Particle[] = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (data[(y * GRID + x) * 4 + 3] > ALPHA_CUT) {
        out.push({ gx: x, gy: y, dx: 0, dy: 0, seed: Math.random() });
      }
    }
  }
  return out;
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

    const particles = buildParticles(shape);
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0;
    let H = 0;
    let cell = 1;
    let originX = 0;
    let originY = 0;
    let frame = 0;

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
      // The shape keeps to the middle so there is margin on every side for the
      // particles to disperse into.
      cell = (Math.min(W, H) * 0.52) / GRID;
      originX = (W - GRID * cell) / 2;
      originY = (H - GRID * cell) / 2;
    };

    const onMove = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      if (!box.width) return;
      targetX = (e.clientX - box.left) * (W / box.width);
      targetY = (e.clientY - box.top) * (H / box.height);
    };

    // Park the cursor far away so influence decays and the shape reassembles.
    const onLeave = () => {
      targetX = -9999;
      targetY = -9999;
    };

    const start = performance.now();

    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (!W) return;

      const t = (performance.now() - start) / 1000;
      if (curX < -9000) {
        curX = targetX;
        curY = targetY;
      } else {
        curX += (targetX - curX) * 0.1;
        curY += (targetY - curY) * 0.1;
      }

      // Everything is sized off the shape, not the stage, so the feel does not
      // change when the card does.
      const span = GRID * cell;
      const reach = span * REACH;
      const base = cell * FILL;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = INK;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const homeX = originX + p.gx * cell + cell * 0.5;
        const homeY = originY + p.gy * cell + cell * 0.5;

        const vx = homeX - curX;
        const vy = homeY - curY;
        const d = Math.hypot(vx, vy) || 0.0001;
        const env = Math.max(0, 1 - d / reach);
        // Squared, so the falloff is soft at the edge and steep at the centre.
        const ev = env * env;

        let tx = 0;
        let ty = 0;
        if (ev > 0) {
          const phase = p.seed * 6.283;
          const turb = calm ? 0 : ev * span * DRIFT;
          tx =
            (vx / d) * ev * span * PUSH +
            turb * Math.sin(t * 0.9 + (p.gx / GRID) * 28 + phase) +
            turb * 0.5 * Math.sin(t * 1.9 + phase * 1.7);
          ty =
            (vy / d) * ev * span * PUSH +
            turb * Math.cos(t * 0.8 + (p.gy / GRID) * 6.4 + phase) +
            turb * 0.5 * Math.cos(t * 1.7 + phase * 1.3) -
            ev * span * LIFT;
        }

        p.dx += (tx - p.dx) * EASE;
        p.dy += (ty - p.dy) * EASE;

        const s = base * (1 - ev * THIN);
        ctx.fillRect(homeX + p.dx - s * 0.5, homeY + p.dy - s * 0.5, s, s);
      }
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
