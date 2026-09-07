/**
 * The scroll-develop dither, in one place.
 *
 * An image is sampled down to a coarse grid and thresholded through an 8x8
 * Bayer matrix, so tone is carried purely by how many cells survive in a
 * neighbourhood — there are no greys anywhere. Each surviving cell then gets
 * its own threshold from a hash of its coordinates, and painting sweeps a
 * progress value past those thresholds, which is what makes the picture come
 * up in grain like a darkroom print instead of wiping or fading in.
 *
 * The demo, the studio preview and the exported code all read from here, so
 * there is only ever one implementation of the maths.
 */

/** 8x8 Bayer matrix — ordered dithering, values 0-63. */
export const BAYER = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

export const smoothstep = (t: number) => {
  const c = clamp(t);
  return c * c * (3 - 2 * c);
};

/** Deterministic per-cell noise, so the same image always develops the same way. */
export function hash(x: number, y: number) {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

export type DitherOptions = {
  /** Grid columns. Everything else — cell size, row count — falls out of this. */
  gridW: number;
  /** Overall ink density. */
  weight: number;
  /** Midtone bend applied to luminance before thresholding. */
  gamma: number;
  /** Fraction of the height over which the print dissolves at its bottom edge. */
  fade: number;
  /** Luminance under this is background and is dropped entirely. */
  bgCut: number;
  /** Luminance at or over this is a blown highlight — bare paper. */
  figHi: number;
  /** Spread of the per-cell thresholds. Cells finish developing at this value. */
  spread: number;
  /** Ink the highlights instead of the shadows. */
  invert: boolean;
  /**
   * Keep each cell's own colour instead of reducing to one ink. The Bayer
   * threshold is skipped — with colour you want the picture, not a 1-bit
   * rendering of it — so every cell survives except where the bottom fade
   * thins it out.
   */
  colour: boolean;
};

/**
 * Levels per channel when cells carry colour. Cells are sorted by palette
 * entry so painting sets fillStyle once per colour rather than once per cell,
 * which is the difference between a smooth frame and a stalled one; the
 * palette has to stay small for that to pay off.
 */
const LEVELS = 8;

export const DEFAULTS: DitherOptions = {
  gridW: 140,
  weight: 1.14,
  gamma: 0.9,
  fade: 0.26,
  bgCut: 5,
  figHi: 140,
  spread: 0.62,
  invert: false,
  colour: true,
};

export type Cells = {
  x: Int16Array;
  y: Int16Array;
  /** Per-cell develop threshold, in progress units. */
  t: Float32Array;
  n: number;
  cols: number;
  rows: number;
  /** Palette entry per cell. Absent when the cells are a single ink. */
  tone?: Uint16Array;
  /** CSS colours, indexed by `tone`. Absent when the cells are a single ink. */
  palette?: string[];
};

/**
 * Draw any image source down to the working grid and hand back its pixels.
 * The grid is deliberately tiny — a few hundred cells across at most — so the
 * cost here is independent of how large the original image was.
 */
export function sampleToGrid(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  gridW: number
): { data: Uint8ClampedArray; cols: number; rows: number } {
  const cols = Math.max(1, Math.round(gridW));
  const rows = Math.max(1, Math.round((cols * srcH) / srcW));

  const c = document.createElement("canvas");
  c.width = cols;
  c.height = rows;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(source, 0, 0, cols, rows);

  return { data: ctx.getImageData(0, 0, cols, rows).data, cols, rows };
}

/**
 * Keep only the cells that survive the dither, and give each one the threshold
 * at which it will develop. Cell positions are independent of display size, so
 * this runs once — a resize only changes how big each square is drawn.
 */
export function buildCells(
  data: Uint8ClampedArray,
  cols: number,
  rows: number,
  o: DitherOptions
): Cells {
  const xs: number[] = [];
  const ys: number[] = [];
  const ts: number[] = [];
  const tones: number[] = [];
  /** Packed quantised RGB -> palette index. */
  const index = new Map<number, number>();
  const palette: string[] = [];
  const span = Math.max(1, rows * o.fade);
  const step = 255 / (LEVELS - 1);

  for (let y = 0; y < rows; y++) {
    // Bottom rows lose density, so the picture dissolves into the ground.
    const bottom = o.fade > 0 ? smoothstep((rows - y) / span) : 1;
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const alpha = data[i + 3] / 255;
      const threshold = (BAYER[y & 7][x & 7] + 0.5) / 64;

      if (o.colour) {
        // Every cell survives; only the bottom fade thins them, and it does so
        // through the same Bayer matrix so the edge dissolves rather than cuts.
        if (alpha < 0.5) continue;
        if (bottom < threshold) continue;

        const r = Math.round(Math.round(data[i] / step) * step);
        const g = Math.round(Math.round(data[i + 1] / step) * step);
        const b = Math.round(Math.round(data[i + 2] / step) * step);
        const packed = (r << 16) | (g << 8) | b;
        let tone = index.get(packed);
        if (tone === undefined) {
          tone = palette.length;
          index.set(packed, tone);
          palette.push(`rgb(${r},${g},${b})`);
        }

        xs.push(x);
        ys.push(y);
        ts.push(clamp(hash(x, y) * o.spread));
        tones.push(tone);
        continue;
      }

      let l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      // Transparent pixels composite onto paper, not onto black.
      l = l * alpha + 255 * (1 - alpha);
      if (o.invert) l = 255 - l;
      if (l < o.bgCut) continue;

      const value = Math.pow(clamp((l - o.bgCut) / (o.figHi - o.bgCut)), o.gamma);
      const density = (1 - value) * o.weight * bottom;
      if (density > threshold) {
        xs.push(x);
        ys.push(y);
        ts.push(clamp(hash(x, y) * o.spread));
      }
    }
  }

  const n = xs.length;

  if (!o.colour) {
    return {
      x: Int16Array.from(xs),
      y: Int16Array.from(ys),
      t: Float32Array.from(ts),
      n,
      cols,
      rows,
    };
  }

  // Sort by palette entry, so painting can set fillStyle once per colour
  // instead of once per cell. Squares do not overlap at rest, so reordering
  // the draw is invisible.
  const order = Array.from({ length: n }, (_, i) => i).sort(
    (a, b) => tones[a] - tones[b]
  );

  const x = new Int16Array(n);
  const y = new Int16Array(n);
  const tArr = new Float32Array(n);
  const tone = new Uint16Array(n);
  for (let k = 0; k < n; k++) {
    const i = order[k];
    x[k] = xs[i];
    y[k] = ys[i];
    tArr[k] = ts[i];
    tone[k] = tones[i];
  }

  return { x, y, t: tArr, n, cols, rows, tone, palette };
}

/** How wide a single cell's fade-in is, in progress units. */
export const CELL_FADE = 0.06;

/** Paint the cells that have developed by `progress` (0-1). */
export function paintCells(
  ctx: CanvasRenderingContext2D,
  cells: Cells,
  cell: number,
  progress: number,
  ink: string,
  round = false
) {
  ctx.clearRect(0, 0, cells.cols * cell, cells.rows * cell);
  const { tone, palette } = cells;
  // Cells are sorted by palette entry, so this only changes on a boundary.
  let last = -1;
  if (!tone || !palette) ctx.fillStyle = ink;
  const r = cell / 2;

  // Once everything has developed there is no alpha left to vary, so skip it.
  if (progress > 0.999) {
    for (let i = 0; i < cells.n; i++) {
      if (tone && palette && tone[i] !== last) {
        last = tone[i];
        ctx.fillStyle = palette[last];
      }
      const px = cells.x[i] * cell;
      const py = cells.y[i] * cell;
      if (round) {
        ctx.beginPath();
        ctx.arc(px + r, py + r, r, 0, 6.2832);
        ctx.fill();
      } else {
        ctx.fillRect(px, py, cell, cell);
      }
    }
    return;
  }

  for (let i = 0; i < cells.n; i++) {
    const a = (progress - cells.t[i]) / CELL_FADE;
    if (a <= 0) continue;
    if (tone && palette && tone[i] !== last) {
      last = tone[i];
      ctx.fillStyle = palette[last];
    }
    ctx.globalAlpha = a < 1 ? a : 1;
    const px = cells.x[i] * cell;
    const py = cells.y[i] * cell;
    if (round) {
      ctx.beginPath();
      ctx.arc(px + r, py + r, r, 0, 6.2832);
      ctx.fill();
    } else {
      ctx.fillRect(px, py, cell, cell);
    }
  }
  ctx.globalAlpha = 1;
}
