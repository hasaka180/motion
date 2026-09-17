import { DEFAULT_TYPE, SLIDE_H, SLIDE_W, uid, type Block, type Brand, type Slide } from "./types";

/**
 * Turn a reference image of a page into an editable page.
 *
 * No model is involved, so no words are read; what comes back is the layout.
 * The background is the colour the image's border agrees on. Everything that
 * disagrees with it is ink; ink is thickened a little so letters join into
 * lines and lines into paragraphs, then split into connected regions. Each
 * region is classified by how much of it is ink and how varied its colour is:
 * varied and dense is a photograph, flat and dense is a shape, sparse is text.
 * Photographs are cropped straight out of the reference so the page reads at
 * once; text gets a placeholder at the size its line height implies. The
 * reference itself is kept under the page to trace against.
 */

export type Traced = {
  slide: Slide;
  /** Prominent colours, background first, as hex. */
  palette: string[];
};

const WORK_W = 400;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("Could not read the reference"));
    img.src = src;
  });
}

const hex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");

const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** Distance from a colour to the segment between two others, in RGB. */
function offSegment(p: number[], a: number[], b: number[]) {
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2;
  const t = len2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1] + (p[2] - a[2]) * ab[2]) / len2)) : 0;
  return dist(p, [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t]);
}

export async function traceReference(src: string): Promise<Traced> {
  const img = await loadImage(src);
  const scale = WORK_W / img.naturalWidth;
  const w = WORK_W, h = Math.max(1, Math.round(img.naturalHeight * scale));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const px = (i: number) => [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]];

  // ---- background: the colour the border agrees on
  const bins = new Map<string, { n: number; sum: number[] }>();
  const vote = (i: number) => {
    const p = px(i);
    const key = p.map((v) => v >> 4).join(",");
    const b = bins.get(key) ?? { n: 0, sum: [0, 0, 0] };
    b.n++; b.sum[0] += p[0]; b.sum[1] += p[1]; b.sum[2] += p[2];
    bins.set(key, b);
  };
  for (let x = 0; x < w; x++) { vote(x); vote((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { vote(y * w); vote(y * w + w - 1); }
  const top = [...bins.values()].sort((a, b) => b.n - a.n)[0];
  const bg = top.sum.map((s) => s / top.n);

  // ---- ink mask, then thicken so glyphs join into lines and lines into blocks
  const ink = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) ink[i] = dist(px(i), bg) > 48 ? 1 : 0;
  // Two working pixels — ten on the page — joins letters and lines, not neighbouring blocks.
  const R = 2;
  const grown = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!ink[y * w + x]) continue;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const yy = y + dy, xx = x + dx;
      if (yy >= 0 && yy < h && xx >= 0 && xx < w) grown[yy * w + xx] = 1;
    }
  }

  // ---- connected regions
  const seen = new Uint8Array(w * h);
  const regions: { x0: number; y0: number; x1: number; y1: number }[] = [];
  const stack: number[] = [];
  for (let s = 0; s < w * h; s++) {
    if (!grown[s] || seen[s]) continue;
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    stack.push(s); seen[s] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      const x = i % w, y = (i / w) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || xx >= w || yy < 0 || yy >= h) continue;
        const j = yy * w + xx;
        if (grown[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
      }
    }
    // Pull the box back in by the thickening so it hugs the ink.
    x0 = Math.min(x1, x0 + R); y0 = Math.min(y1, y0 + R); x1 = Math.max(x0, x1 - R); y1 = Math.max(y0, y1 - R);
    if ((x1 - x0 + 1) * (y1 - y0 + 1) >= 16) regions.push({ x0, y0, x1, y1 });
  }
  regions.sort((a, b) => (b.x1 - b.x0) * (b.y1 - b.y0) - (a.x1 - a.x0) * (a.y1 - a.y0));

  // ---- fit the reference into the page, letterboxed if it is not 16:9
  const fit = Math.min(SLIDE_W / w, SLIDE_H / h);
  const offX = (SLIDE_W - w * fit) / 2, offY = (SLIDE_H - h * fit) / 2;
  const toPage = (v: number) => Math.round(v * fit);

  const blocks: Block[] = [];
  const colours: number[][] = [];
  for (const r of regions.slice(0, 40)) {
    const bw = r.x1 - r.x0 + 1, bh = r.y1 - r.y0 + 1;
    let n = 0; const sum = [0, 0, 0]; const inked: number[] = [];
    const rows = new Uint8Array(bh);
    for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) {
      const i = y * w + x;
      if (!ink[i]) continue;
      const p = px(i);
      n++; sum[0] += p[0]; sum[1] += p[1]; sum[2] += p[2];
      inked.push(i);
      rows[y - r.y0] = 1;
    }
    if (!n) continue;
    const mean = sum.map((s) => s / n);
    const fill = n / (bw * bh);
    // How much of the ink is a colour the region does not otherwise have.
    // Antialiased edges are blends of the ink colour and the background, so
    // they sit on the line between the two in colour space; a photograph's
    // colours do not. Distance from that segment ignores edges completely,
    // where spread or distance-from-mean would call a crisp bar a photo.
    let strays = 0;
    for (const i of inked) if (offSegment(px(i), mean, bg) > 40) strays++;
    const varied = strays / n;
    // A dark, desaturated photograph strays little in hue, so also ask
    // whether the region's core — pixels well clear of the background, hence
    // no edge blends — is uniform in brightness. A shape's is; a photo's isn't.
    const core = inked.filter((i) => dist(px(i), bg) > 120);
    const lum = (i: number) => { const p = px(i); return 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]; };
    const coreMean = core.length ? core.reduce((s, i) => s + lum(i), 0) / core.length : 0;
    const textured = core.length > 40 ? core.filter((i) => Math.abs(lum(i) - coreMean) > 28).length / core.length : 0;
    // And whether it has edges inside it. A flat shape has none; a photograph,
    // however dark, changes brightness from one pixel to the next everywhere.
    const edges = core.length > 40
      ? core.filter((i) => i % w < w - 1 && Math.abs(lum(i) - lum(i + 1)) > 14).length / core.length
      : 0;
    colours.push(mean);

    const x = Math.round(offX + toPage(r.x0)), y = Math.round(offY + toPage(r.y0));
    const W = Math.max(24, toPage(bw)), H = Math.max(16, toPage(bh));

    if (fill > 0.5 && (varied > 0.2 || textured > 0.25 || edges > 0.18)) {
      // A photograph: crop it out of the full-size reference.
      const crop = document.createElement("canvas");
      const sx = r.x0 / scale, sy = r.y0 / scale, sw = bw / scale, sh = bh / scale;
      crop.width = Math.min(1600, Math.round(sw)); crop.height = Math.round(crop.width * (sh / sw));
      crop.getContext("2d")!.drawImage(img, sx, sy, sw, sh, 0, 0, crop.width, crop.height);
      const out = crop.toDataURL("image/webp", 0.85);
      blocks.push({ id: uid("i"), kind: "image", x, y, w: W, h: H, fit: "cover", radius: 0, label: "Image", tint: "surface",
        src: out.startsWith("data:image/webp") ? out : crop.toDataURL("image/jpeg", 0.85) });
      continue;
    }
    if (fill > 0.8) {
      blocks.push({ id: uid("r"), kind: "rect", x, y, w: W, h: H, fill: hex(mean[0], mean[1], mean[2]) as `#${string}`, radius: 0 });
      continue;
    }
    // Text: line height from the runs of inked rows.
    const runs: number[] = [];
    let run = 0;
    for (let i = 0; i < bh; i++) { if (rows[i]) run++; else if (run) { runs.push(run); run = 0; } }
    if (run) runs.push(run);
    const line = runs.length ? runs.sort((a, b) => a - b)[Math.floor(runs.length / 2)] : bh;
    const size = Math.max(10, Math.round((line * fit) / 0.82));
    const lines = Math.max(1, runs.length);
    const lineHeight = lines > 1 ? Math.max(0.9, Math.min(1.8, H / lines / size)) : 1.1;
    blocks.push({
      id: uid("t"), kind: "text", x, y, w: W, h: H,
      text: Array.from({ length: Math.min(lines, 6) }, () => "Replace with your copy").join("\n"),
      font: "sans", size, weight: size > 60 ? 600 : 400, align: "left", valign: "top",
      lineHeight, tracking: 0, color: hex(mean[0], mean[1], mean[2]) as `#${string}`,
    });
  }

  // ---- palette: background, then the most distinct region colours
  const palette = [hex(bg[0], bg[1], bg[2])];
  for (const m of colours) {
    const hx = hex(m[0], m[1], m[2]);
    if (palette.every((p) => dist(m, p.match(/\w\w/g)!.map((s) => parseInt(s, 16))) > 56)) palette.push(hx);
    if (palette.length >= 7) break;
  }

  const slide: Slide = {
    id: uid("p"), name: "Traced page", bg: hex(bg[0], bg[1], bg[2]) as `#${string}`, blocks,
    reference: { src, opacity: 0.35, visible: true },
  };
  return { slide, palette };
}

const luminance = (hx: string) => {
  const [r, g, b] = hx.match(/\w\w/g)!.map((s) => parseInt(s, 16));
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};
const saturation = (hx: string) => {
  const c = hx.match(/\w\w/g)!.map((s) => parseInt(s, 16));
  const max = Math.max(...c), min = Math.min(...c);
  return max ? (max - min) / max : 0;
};

/**
 * A brand seeded from a reference's colours: the page's own background as
 * paper, the colour that contrasts it most as ink, the most saturated of the
 * rest as primary, and so on. A starting point to correct, not an answer.
 */
export function brandFromPalette(name: string, palette: string[]): Brand {
  const paper = palette[0] ?? "#f4f4f4";
  const rest = palette.slice(1);
  const byContrast = [...rest].sort((a, b) => Math.abs(luminance(b) - luminance(paper)) - Math.abs(luminance(a) - luminance(paper)));
  const ink = byContrast[0] ?? (luminance(paper) > 0.5 ? "#111111" : "#f4f4f4");
  const bySat = rest.filter((c) => c !== ink).sort((a, b) => saturation(b) - saturation(a));
  const primary = bySat[0] ?? ink;
  const accent = bySat[1] ?? primary;
  const dark = luminance(paper) < 0.5;
  return {
    name, tagline: "", edition: "Brand Guidelines {year}",
    palette: {
      paper: { name: "Paper", hex: paper },
      ink: { name: "Ink", hex: ink },
      primary: { name: "Primary", hex: primary },
      accent: { name: "Accent", hex: accent },
      muted: { name: "Muted", hex: dark ? "#8a8a90" : "#6b6b70" },
      surface: { name: "Surface", hex: dark ? "#1c1c20" : "#e6e6e8" },
    },
    extras: rest.filter((c) => c !== ink && c !== primary && c !== accent).slice(0, 6).map((hex, i) => ({ name: `Ref ${i + 1}`, hex })),
    type: DEFAULT_TYPE,
  };
}
