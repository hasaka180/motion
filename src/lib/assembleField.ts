/**
 * The assemble — a picture forming out of dust.
 *
 * Every cell starts somewhere it does not belong: pushed out from the centre by
 * a random distance, rotated off its line so the approach curves rather than
 * running straight in, transparent, and small. Over the run each one spirals
 * home, fades up and grows to full size, with a turbulence that is strongest
 * at the start and gone by the time it lands. Per-particle delays mean they do
 * not all set off together, which is what makes it read as dust coalescing
 * instead of a picture sliding into place.
 *
 * Every offset is stored in units of the field's own width, so a resize moves
 * the particles with the picture instead of changing the shape of the motion.
 *
 * The cells come from lib/dither.ts, so anything that can be dithered can be
 * assembled.
 */

export type AssembleParams = {
  /** How far out particles start, as a fraction of the field's width. */
  distance: number;
  /** Radians of rotation at the start, so the approach spirals. */
  swirl: number;
  /** In-flight jitter, as a fraction of the field's width. Decays on landing. */
  turbulence: number;
  /** Share of the run spent staggering departures. 0 sends them all at once. */
  stagger: number;
  /** 0 sends them in random order, 1 works outward from the centre. */
  order: number;
  /** Seconds for the whole run. */
  duration: number;
};

export const ASSEMBLE_DEFAULTS: AssembleParams = {
  distance: 0.42,
  swirl: 1.1,
  turbulence: 0.05,
  stagger: 0.55,
  order: 0.35,
  duration: 2.6,
};

export type Assembly = {
  gx: Int16Array;
  gy: Int16Array;
  /** Start offset from home, in units of the field's width. */
  sx: Float32Array;
  sy: Float32Array;
  /** When this particle sets off, as a fraction of the run. */
  delay: Float32Array;
  seed: Float32Array;
  n: number;
  cols: number;
  rows: number;
  /** Palette entry per particle. Absent when the picture is a single ink. */
  tone?: Uint16Array;
  /** CSS colours, indexed by `tone`. */
  palette?: string[];
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Lay out where every particle begins. Deterministic per build, so a replay
 * reassembles exactly the same way.
 */
export function createAssembly(
  source: {
    x: Int16Array;
    y: Int16Array;
    n: number;
    cols: number;
    rows: number;
    tone?: Uint16Array;
    palette?: string[];
  },
  p: AssembleParams
): Assembly {
  const n = source.n;
  const sx = new Float32Array(n);
  const sy = new Float32Array(n);
  const delay = new Float32Array(n);
  const seed = new Float32Array(n);

  const midX = source.cols / 2;
  const midY = source.rows / 2;
  // Normalise radial distance against the corner, so `order` reaches every cell.
  const maxR = Math.hypot(midX, midY) || 1;

  for (let i = 0; i < n; i++) {
    // Push out along the particle's own line from the centre, so the cloud
    // keeps the picture's silhouette rather than collapsing to a disc.
    const vx = source.x[i] - midX;
    const vy = source.y[i] - midY;
    const r = Math.hypot(vx, vy) || 0.0001;
    const angle = Math.atan2(vy, vx) + (Math.random() - 0.5) * 1.4;
    const dist = p.distance * (0.35 + Math.random() * 0.9);

    sx[i] = Math.cos(angle) * dist;
    sy[i] = Math.sin(angle) * dist;
    seed[i] = Math.random();

    // Departure order: random, radial, or anywhere between.
    const radial = r / maxR;
    delay[i] = (Math.random() * (1 - p.order) + radial * p.order) * p.stagger;
  }

  return {
    gx: source.x,
    gy: source.y,
    sx,
    sy,
    delay,
    seed,
    n,
    cols: source.cols,
    rows: source.rows,
    tone: source.tone,
    palette: source.palette,
  };
}

export type AssembleOptions = {
  width: number;
  height: number;
  cell: number;
  originX: number;
  originY: number;
  ink: string;
  /** Square size within its cell, leaving the pixel gap. */
  fill: number;
  /** 0 is dust, 1 is the finished picture. */
  progress: number;
  /** Seconds, for the in-flight turbulence. */
  time: number;
  params: AssembleParams;
  /** prefers-reduced-motion: land everything immediately. */
  calm: boolean;
};

/** Paint the picture at `progress`. */
export function paintAssembly(
  ctx: CanvasRenderingContext2D,
  a: Assembly,
  o: AssembleOptions
) {
  const p = o.params;
  const cell = o.cell;
  const span = a.cols * cell;
  const base = cell * o.fill;
  const half = cell * 0.5;
  // Departures are staggered but everything still lands together at 1.
  const window = Math.max(0.0001, 1 - p.stagger);
  const turb = p.turbulence * span;

  ctx.clearRect(0, 0, o.width, o.height);
  const { tone, palette } = a;
  // Particles are sorted by palette entry, so this only changes on a boundary.
  let last = -1;
  if (!tone || !palette) ctx.fillStyle = o.ink;

  if (o.calm || o.progress >= 1) {
    for (let i = 0; i < a.n; i++) {
      if (tone && palette && tone[i] !== last) {
        last = tone[i];
        ctx.fillStyle = palette[last];
      }
      ctx.fillRect(
        o.originX + a.gx[i] * cell + half - base * 0.5,
        o.originY + a.gy[i] * cell + half - base * 0.5,
        base,
        base
      );
    }
    return;
  }

  for (let i = 0; i < a.n; i++) {
    const local = clamp01((o.progress - a.delay[i]) / window);
    if (local <= 0) continue;

    const e = easeOutCubic(local);
    const away = 1 - e;

    // Rotate the start offset by an angle that unwinds as it lands, so the
    // path curves in instead of running straight down its own radius.
    const ang = p.swirl * away;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const ox = (a.sx[i] * ca - a.sy[i] * sa) * span * away;
    const oy = (a.sx[i] * sa + a.sy[i] * ca) * span * away;

    const phase = a.seed[i] * 6.283;
    const wob = turb * away;
    const jx = wob * Math.sin(o.time * 1.7 + phase * 2.3);
    const jy = wob * Math.cos(o.time * 1.4 + phase * 1.9);

    if (tone && palette && tone[i] !== last) {
      last = tone[i];
      ctx.fillStyle = palette[last];
    }
    // Fade and grow on the way in — dust arriving, not tiles dropping.
    ctx.globalAlpha = local < 1 ? local : 1;
    const s = base * (0.55 + 0.45 * e);

    ctx.fillRect(
      o.originX + a.gx[i] * cell + half + ox + jx - s * 0.5,
      o.originY + a.gy[i] * cell + half + oy + jy - s * 0.5,
      s,
      s
    );
  }
  ctx.globalAlpha = 1;
}
