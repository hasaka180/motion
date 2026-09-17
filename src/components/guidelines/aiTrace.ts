import { SECTION_ORDER, type Section } from "./referenceSpec";
import { SLIDE_H, SLIDE_W, uid, type Block, type Brand, type FontFace, type Slide, type TokenKey, type TypeRole, type TypeStyle } from "./types";

export class TraceUnavailable extends Error {}
export type Box = { x: number; y: number; w: number; h: number };
export type StyleGuide = {
  name: string; tagline: string | null; palette: Record<TokenKey, string>;
  type: Record<TypeRole, { family: string; weight: number; uppercase: boolean }>;
  numbered: boolean; dark: boolean; sections: Section[];
  design: Record<"margins" | "grid" | "headings" | "body" | "runningHeads" | "shapes" | "imagery" | "rhythm" | "fontNotes", string>;
};
export type AiBlock = Box & {
  kind: "text" | "image" | "rect" | "swatch" | "logo";
  text: string | null; role: TypeRole | null; size: number | null; weight: number | null;
  family: string | null; italic: boolean | null; uppercase: boolean | null; lineHeight: number | null; tracking: number | null;
  align: "left" | "center" | "right" | null; color: string | null; hex: string | null; label: string | null;
  radius: number | null; rotation: number | null;
};
export type AiPage = { name: string; section: Section; background: string; palette: Record<TokenKey, string> | null; blocks: AiBlock[]; warnings: string[] };
const HEX = /^#[0-9a-f]{6}$/i;
const clamp01 = (v: unknown) => typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
const asHex = (v: unknown, fallback: `#${string}`): `#${string}` => typeof v === "string" && HEX.test(v) ? v.toLowerCase() as `#${string}` : fallback;
const lum = (hex: string) => { const n = parseInt(hex.slice(1), 16); return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; };
export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error("Could not read reference image.")); img.src = src;
  });
}

const analysisCache = new Map<string, unknown>();

/** Retry only transient transport/rate-limit failures, not invalid input or missing keys. */
export async function callTrace<T>(mode: "pages" | "style" | "page" | "generate", images: string[], context: unknown = {}): Promise<T> {
  const payload = JSON.stringify({ images, mode, context });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
  const key = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
  if (analysisCache.has(key)) return structuredClone(analysisCache.get(key)) as T;
  for (let attempt = 0; attempt < 3; attempt++) {
    let res: Response;
    try {
      res = await fetch("/api/trace", { method: "POST", headers: { "content-type": "application/json" }, body: payload, signal: AbortSignal.timeout(115_000) });
    } catch (error) { if (attempt === 2) throw error; await new Promise(r => setTimeout(r, 1200 * (attempt + 1))); continue; }
    const body = await res.json().catch(() => ({}));
    if (res.status === 501) throw new TraceUnavailable(body.error);
    if (res.ok) {
      if (analysisCache.size >= 300) analysisCache.delete(analysisCache.keys().next().value!);
      analysisCache.set(key, body); return structuredClone(body) as T;
    }
    if (![429, 502, 503, 504].includes(res.status) || attempt === 2) throw new Error(body.error ?? `Reference request failed (${res.status}).`);
    await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
  }
  throw new Error("Reference request failed.");
}

/** Local, stable photographs: no random remote image redirects at render/print time. */
export function placeholderImage(subject: string) {
  const s = subject.toLowerCase();
  const name = /people|person|portrait|human|face|fashion/.test(s) ? "portrait"
    : /building|architect|facade|urban|city/.test(s) ? "architecture"
    : /interior|room|home|furniture/.test(s) ? "interior"
    : /office|work|team|desk|studio/.test(s) ? "workspace"
    : /product|object|still.life|packag|material|texture/.test(s) ? "objects" : "landscape";
  return `/images/guidelines/${name}.jpg`;
}
export function fillPlaceholders(slides: Slide[]) {
  for (const slide of slides) for (const b of slide.blocks) if (b.kind === "image" && !b.src) {
    b.src = placeholderImage(b.label); b.label = `Placeholder — ${b.label}`;
  }
}

/** Render for analysis only. Original files remain intact until after page crops. */
export async function encodeImage(src: string, max = 2000, maxChars = 600_000): Promise<string> {
  const img = await loadImage(src);
  let scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  for (let attempt = 0; attempt < 6; attempt++) {
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const out = canvas.toDataURL("image/jpeg", .93 - attempt * .06);
    if (out.length <= maxChars) return out;
    scale *= .8;
  }
  throw new Error("This image could not be prepared within the request size limit.");
}
export async function splitSheetLocal(src: string): Promise<Box[] | null> {
  const img = await loadImage(src);
  const scale = Math.min(640 / img.naturalWidth, 1800 / img.naturalHeight);
  const W = Math.max(1, Math.round(img.naturalWidth * scale)), H = Math.max(1, Math.round(img.naturalHeight * scale));
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, W, H);
  const d = ctx.getImageData(0, 0, W, H).data;
  const px = (i: number) => [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]];

  // The sheet's ground: the colour its border agrees on.
  const bins = new Map<string, { n: number; s: number[] }>();
  const vote = (i: number) => { const p = px(i); const k = p.map((v) => v >> 4).join(","); const b = bins.get(k) ?? { n: 0, s: [0, 0, 0] }; b.n++; b.s[0] += p[0]; b.s[1] += p[1]; b.s[2] += p[2]; bins.set(k, b); };
  for (let x = 0; x < W; x++) { vote(x); vote((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { vote(y * W); vote(y * W + W - 1); }
  const top = [...bins.values()].sort((a, b) => b.n - a.n)[0];
  const bg = top.s.map((v) => v / top.n);
  const isBg = (i: number) => { const p = px(i); return Math.hypot(p[0] - bg[0], p[1] - bg[1], p[2] - bg[2]) < 36; };

  const colBg = new Float32Array(W), rowBg = new Float32Array(H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isBg(y * W + x)) { colBg[x] += 1 / H; rowBg[y] += 1 / W; }

  // Runs of content between gutters, along each axis.
  const runs = (profile: Float32Array, n: number, minLen: number) => {
    const out: [number, number][] = [];
    let start = -1;
    for (let i = 0; i <= n; i++) {
      const content = i < n && profile[i] < 0.965;
      if (content && start < 0) start = i;
      if (!content && start >= 0) { if (i - start >= minLen) out.push([start, i]); start = -1; }
    }
    return out;
  };
  const cols = runs(colBg, W, 40), rows = runs(rowBg, H, 24);
  if (cols.length * rows.length < 2) return null;

  const boxes: Box[] = [];
  for (const [y0, y1] of rows) for (const [x0, x1] of cols) {
    // Keep a cell only if it actually holds a page, not an empty grid slot.
    let ink = 0;
    for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) if (!isBg(y * W + x)) ink++;
    if (ink / (((y1 - y0) / 2) * ((x1 - x0) / 2)) > 0.2) boxes.push({ x: x0 / W, y: y0 / H, w: (x1 - x0) / W, h: (y1 - y0) / H });
  }
  return boxes.length >= 2 ? boxes : null;
}

/** Clamp bounds and remove duplicate boxes; never discard pages based on tiny text. */
export function normalizeBoxes(boxes: Box[]): Box[] {
  const result: Box[] = [];
  for (const b of boxes) {
    if (!b || ![b.x, b.y, b.w, b.h].every(Number.isFinite)) continue;
    const x = clamp01(b.x), y = clamp01(b.y), w = Math.min(clamp01(b.w), 1 - x), h = Math.min(clamp01(b.h), 1 - y);
    if (w <= 0 || h <= 0) continue;
    const duplicate = result.some(a => {
      const intersection = Math.max(0, Math.min(a.x + a.w, x + w) - Math.max(a.x, x)) * Math.max(0, Math.min(a.y + a.h, y + h) - Math.max(a.y, y));
      return intersection / (a.w * a.h + w * h - intersection) > .92;
    });
    if (!duplicate) result.push({ x, y, w, h });
  }
  return result;
}
export async function detectPages(src: string, useModel = true) {
  const local = await splitSheetLocal(src);
  if (!useModel) return { boxes: local ?? [{ x: 0, y: 0, w: 1, h: 1 }], warnings: ["Local page boundaries are approximate."] };
  const image = await encodeImage(src, 2800, 1_400_000);
  const result = await callTrace<{ pages: Box[]; warnings: string[] }>("pages", [image], { candidateBoxes: local });
  const boxes = normalizeBoxes(result.pages);
  if (!boxes.length) throw new Error("No page boundaries were found. Try individual page images or the original PDF.");
  const warnings = result.warnings ?? [];
  if (local && local.length !== boxes.length) warnings.push(`Page detection found ${boxes.length} pages; the gutter scan suggested ${local.length}. Check the source inventory.`);
  return { boxes, warnings };
}

/** Crop original pixels first; never upscale and claim recovered detail. */
export async function cropBox(src: string, box: Box, max = 2400): Promise<string> {
  const img = await loadImage(src);
  const sx = box.x * img.naturalWidth, sy = box.y * img.naturalHeight;
  const sw = Math.max(1, Math.min(box.w * img.naturalWidth, img.naturalWidth - sx));
  const sh = Math.max(1, Math.min(box.h * img.naturalHeight, img.naturalHeight - sy));
  const scale = Math.min(1, max / Math.max(sw, sh));
  const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(sw * scale)); c.height = Math.max(1, Math.round(sh * scale));
  c.getContext("2d")!.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
  return c.toDataURL("image/png");
}
const SHIPPED: Record<string, FontFace> = { "Instrument Serif": "serif", "Archivo Black": "display", "Geist": "sans", "Geist Mono": "mono" };
const face = (family: string): FontFace => SHIPPED[family] ?? family;
const weight = (w: unknown): TypeStyle["weight"] => ([400, 500, 600, 700, 800, 900] as const).reduce((a, b) => Math.abs(b - Number(w)) < Math.abs(a - Number(w)) ? b : a, 400 as TypeStyle["weight"]);

export async function readStyle(images: string[], onProgress: (message: string) => void): Promise<StyleGuide> {
  let style: StyleGuide | undefined;
  for (let i = 0; i < images.length; i += 6) {
    onProgress(`Studying the visual system · pages ${i + 1}–${Math.min(i + 6, images.length)} of ${images.length}…`);
    const batch = await Promise.all(images.slice(i, i + 6).map(src => encodeImage(src, 1400, 480_000)));
    style = await callTrace<StyleGuide>("style", batch, { previousStyle: style ?? null });
  }
  if (!style) throw new Error("No reference style was found.");
  return style;
}
export function brandFromStyle(style: StyleGuide, name: string): Brand {
  const type = Object.fromEntries(Object.entries(style.type).map(([k, t]) => [k, { face: face(t.family), weight: weight(t.weight), uppercase: t.uppercase }])) as Brand["type"];
  return { name: style.name || name, tagline: style.tagline ?? "", edition: "Brand Guidelines {year}",
    palette: Object.fromEntries(Object.entries(style.palette).map(([k, hex]) => [k, { name: k[0].toUpperCase() + k.slice(1), hex }])) as Brand["palette"], extras: [], type };
}

export async function readPage(src: string, style: StyleGuide, pdfEvidence?: { nativeText?: string; fontNames?: string[] }) {
  const body = await callTrace<AiPage>("page", [await encodeImage(src, 2400, 2_600_000)], { style, pdfEvidence });
  return { ...await materializePage(body, style, src), layout: body };
}

/** Same converter for source and designed pages. Small rules are not inflated. */
export async function materializePage(body: AiPage, style: StyleGuide, source?: string) {
  if (!Array.isArray(body.blocks) || (!source && !body.blocks.length)) throw new Error("The model returned an empty designed page.");
  const img = source ? await loadImage(source) : null;
  const fit = img ? Math.min(SLIDE_W / img.naturalWidth, SLIDE_H / img.naturalHeight) : 1;
  const dw = img ? img.naturalWidth * fit : SLIDE_W, dh = img ? img.naturalHeight * fit : SLIDE_H;
  const offX = (SLIDE_W - dw) / 2, offY = (SLIDE_H - dh) / 2;
  const bg = asHex(body.background, "#f4f4f4"), ink: `#${string}` = lum(bg) > .5 ? "#111111" : "#f4f4f4";
  const blocks: Block[] = [], warnings = [...(body.warnings ?? [])];
  for (const raw of body.blocks) {
    if (![raw.x, raw.y, raw.w, raw.h].every(Number.isFinite) || raw.w <= 0 || raw.h <= 0) { warnings.push("An invalid element was omitted; compare with the source."); continue; }
    const fx = clamp01(raw.x), fy = clamp01(raw.y), fw = Math.min(clamp01(raw.w), 1 - fx), fh = Math.min(clamp01(raw.h), 1 - fy);
    const x = offX + fx * dw, y = offY + fy * dh, w = fw * dw, h = fh * dh;
    if (!w || !h) continue;
    const base = { id: uid(raw.kind[0]), x, y, w, h, rotation: raw.rotation ?? 0 };
    const radius = Math.max(0, (raw.radius ?? 0) * dw / SLIDE_W);
    if (raw.kind === "image" || (raw.kind === "logo" && source)) {
      const label = raw.label ?? (raw.kind === "logo" ? "Reference logo" : style.design.imagery);
      let src: string;
      if (source) {
        src = await cropBox(source, { x: fx, y: fy, w: fw, h: fh }, 1600);
        if (img && fw * img.naturalWidth < 240) warnings.push(`Low-resolution ${label}; retained the source crop for fidelity.`);
      } else src = placeholderImage(label);
      blocks.push({ ...base, kind: "image", src, fit: source ? "contain" : "cover", radius, label: source ? label : `Placeholder — ${label}`, tint: "surface" });
      continue;
    }
    if (raw.kind === "rect" || raw.kind === "swatch") {
      blocks.push({ ...base, kind: "rect", fill: asHex(raw.hex ?? raw.color, "#888888"), radius }); continue;
    }
    if (raw.kind === "logo") {
      blocks.push({ ...base, kind: "logo", color: asHex(raw.color, ink), size: h * .65 }); continue;
    }
    const role = raw.role ?? "body", t = style.type[role] ?? style.type.body;
    blocks.push({ ...base, kind: "text", text: raw.text || "[Unreadable text]",
      font: face(raw.family ?? t.family), size: Math.max(4, (raw.size ?? h * .7) * (raw.size ? dw / SLIDE_W : 1)),
      weight: weight(raw.weight ?? t.weight), italic: raw.italic ?? false, uppercase: raw.uppercase ?? false,
      align: raw.align ?? "left", valign: "top", lineHeight: Math.max(.7, Math.min(2.5, raw.lineHeight ?? 1.2)),
      tracking: Math.max(-.15, Math.min(.5, raw.tracking ?? 0)), color: asHex(raw.color, ink),
    });
  }
  if (!blocks.length && body.blocks.length) throw new Error("No usable elements were reconstructed.");
  if (!blocks.length) warnings.push("No editable content was found. Confirm that the source page is blank.");
  const section = (SECTION_ORDER as readonly string[]).includes(body.section) ? body.section : "other";
  const slide: Slide = { id: uid("p"), name: body.name || "Reference page", bg, blocks,
    ...(source ? { reference: { src: await encodeImage(source, 1600, 350_000), opacity: .35, visible: false } } : {}),
    provenance: { kind: source ? "reference" : "generated", section, warnings },
  };
  return { slide, section, palette: body.palette ? Object.values(body.palette) : [bg] };
}
