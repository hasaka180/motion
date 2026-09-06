/**
 * The cursor-scatter field, in one place.
 *
 * A set of cells becomes particles that each remember where they belong. The
 * cursor does three things to the ones near it: pushes them radially out, stirs
 * them with a two-octave turbulence keyed off each particle's own phase so
 * neighbours never drift in lockstep, and lifts them, because air rises. Every
 * particle then *eases* toward that target rather than being set to it — which
 * is what makes the field read as smoke instead of a shockwave, and what makes
 * it drift home slowly when the cursor leaves.
 *
 * The cells can come from anywhere. A shape mask gives you a pixel disc; the
 * dither in lib/dither.ts gives you a photograph. The maths does not care.
 */

export type ParticleParams = {
  /** Reach of the cursor, as a fraction of the field's width. */
  reach: number;
  /** How far particles are blown, same units. */
  push: number;
  /** Turbulence amplitude, same units. */
  drift: number;
  /** Upward bias — air rises. */
  lift: number;
  /** Per-frame easing toward the target. Low is floaty. */
  ease: number;
  /** How much particles thin as they disperse. */
  thin: number;
  /** Square size within its cell, leaving the pixel gap. */
  fill: number;
};

export const PARTICLE_DEFAULTS: ParticleParams = {
  reach: 0.36,
  push: 0.075,
  drift: 0.026,
  lift: 0.022,
  ease: 0.07,
  thin: 0.5,
  fill: 0.82,
};

export type Field = {
  /** Home cell, in grid coordinates. */
  gx: Int16Array;
  gy: Int16Array;
  /** Current offset from home, in device pixels. */
  dx: Float32Array;
  dy: Float32Array;
  /** Phase, so neighbours do not drift in lockstep. */
  seed: Float32Array;
  n: number;
  cols: number;
  rows: number;
};

/** Any cell list — dithered image or shape mask — can drive the field. */
export function createField(source: {
  x: Int16Array;
  y: Int16Array;
  n: number;
  cols: number;
  rows: number;
}): Field {
  const seed = new Float32Array(source.n);
  for (let i = 0; i < source.n; i++) seed[i] = Math.random();
  return {
    gx: source.x,
    gy: source.y,
    dx: new Float32Array(source.n),
    dy: new Float32Array(source.n),
    seed,
    n: source.n,
    cols: source.cols,
    rows: source.rows,
  };
}

/** Turn an alpha mask into the cell list a field wants. */
export function maskToCells(
  data: Uint8ClampedArray,
  cols: number,
  rows: number,
  alphaCut = 110
) {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (data[(y * cols + x) * 4 + 3] > alphaCut) {
        xs.push(x);
        ys.push(y);
      }
    }
  }
  return {
    x: Int16Array.from(xs),
    y: Int16Array.from(ys),
    n: xs.length,
    cols,
    rows,
  };
}

export type StepOptions = {
  width: number;
  height: number;
  cell: number;
  originX: number;
  originY: number;
  ink: string;
  /** Seconds, for the turbulence. */
  time: number;
  cursorX: number;
  cursorY: number;
  params: ParticleParams;
  /** prefers-reduced-motion: keep the cursor push, drop the turbulence. */
  calm: boolean;
};

/**
 * Advance every particle one frame and paint it. Returns whether anything is
 * still moving, so a caller can stop asking for frames once the field settles.
 */
export function stepField(
  ctx: CanvasRenderingContext2D,
  f: Field,
  o: StepOptions
): boolean {
  const p = o.params;
  const cell = o.cell;
  // Everything is sized off the field, not the canvas, so the feel does not
  // change when the container does.
  const span = f.cols * cell;
  const reach = span * p.reach;
  const reach2 = reach * reach;
  const base = cell * p.fill;
  const pushK = span * p.push;
  const driftK = span * p.drift;
  const liftK = span * p.lift;
  const half = cell * 0.5;

  ctx.clearRect(0, 0, o.width, o.height);
  ctx.fillStyle = o.ink;

  let moving = false;

  for (let i = 0; i < f.n; i++) {
    const homeX = o.originX + f.gx[i] * cell + half;
    const homeY = o.originY + f.gy[i] * cell + half;
    const vx = homeX - o.cursorX;
    const vy = homeY - o.cursorY;
    const d2 = vx * vx + vy * vy;

    let tx = 0;
    let ty = 0;
    let ev = 0;

    // Only particles inside the cursor's reach do any trig — with a large
    // field that is the difference between a smooth frame and a stalled one.
    if (d2 < reach2) {
      const d = Math.sqrt(d2) || 0.0001;
      const env = 1 - d / reach;
      // Squared, so the falloff is soft at the edge and steep at the centre.
      ev = env * env;
      const phase = f.seed[i] * 6.283;
      const turb = o.calm ? 0 : ev * driftK;
      tx =
        (vx / d) * ev * pushK +
        turb * Math.sin(o.time * 0.9 + (f.gx[i] / f.cols) * 28 + phase) +
        turb * 0.5 * Math.sin(o.time * 1.9 + phase * 1.7);
      ty =
        (vy / d) * ev * pushK +
        turb * Math.cos(o.time * 0.8 + (f.gy[i] / f.rows) * 6.4 + phase) +
        turb * 0.5 * Math.cos(o.time * 1.7 + phase * 1.3) -
        ev * liftK;
    }

    const dx = f.dx[i] + (tx - f.dx[i]) * p.ease;
    const dy = f.dy[i] + (ty - f.dy[i]) * p.ease;
    f.dx[i] = dx;
    f.dy[i] = dy;
    if (!moving && dx * dx + dy * dy > 0.02) moving = true;

    const s = base * (1 - ev * p.thin);
    ctx.fillRect(homeX + dx - s * 0.5, homeY + dy - s * 0.5, s, s);
  }

  return moving;
}
