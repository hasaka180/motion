import { SLIDE_H, SLIDE_W, uid, type Block, type Slide, type TokenKey, type TypeRole } from "./types";

/**
 * Reference → page, by a vision model.
 *
 * The browser sends one image at a time to /api/trace, which holds the key.
 * What comes back is a layout the model read off the page: every text block
 * with its actual words and role, photographs and panels as boxes, colour
 * swatches with their hex, and a palette. Coordinates are fractions of the
 * image, so this file maps them into the 1600×900 page the same way the
 * reference itself is fitted — and crops each photograph out of the reference
 * so the slot is filled rather than empty.
 */

export type AiBlock = {
  kind: "text" | "image" | "rect" | "swatch" | "logo";
  x: number; y: number; w: number; h: number;
  text: string | null;
  role: TypeRole | null;
  size: number | null;
  weight: number | null;
  align: "left" | "center" | "right" | null;
  color: string | null;
  hex: string | null;
  label: string | null;
};

export type AiPage = {
  name: string;
  background: string;
  palette: Record<TokenKey, string> | null;
  blocks: AiBlock[];
};

export class TraceUnavailable extends Error {}

const HEX = /^#[0-9a-f]{6}$/i;
const clamp01 = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);
const asHex = (v: unknown, fallback: `#${string}`): `#${string}` =>
  typeof v === "string" && HEX.test(v) ? (v.toLowerCase() as `#${string}`) : fallback;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("Could not read the reference"));
    img.src = src;
  });
}

/** Ask the server to read one page. Null means no key is configured. */
export async function traceWithAI(src: string): Promise<{ slide: Slide; palette: string[]; slots: Record<TokenKey, string> | null }> {
  const res = await fetch("/api/trace", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image: src }),
  });
  if (res.status === 501) throw new TraceUnavailable("no key");
  const body = (await res.json().catch(() => ({}))) as Partial<AiPage> & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `The model call failed (${res.status}).`);

  const img = await loadImage(src);
  const fit = Math.min(SLIDE_W / img.naturalWidth, SLIDE_H / img.naturalHeight);
  const dw = img.naturalWidth * fit, dh = img.naturalHeight * fit;
  const offX = (SLIDE_W - dw) / 2, offY = (SLIDE_H - dh) / 2;
  const bg = asHex(body.background, "#f4f4f4");
  const light = parseInt(bg.slice(1, 3), 16) * 0.2126 + parseInt(bg.slice(3, 5), 16) * 0.7152 + parseInt(bg.slice(5, 7), 16) * 0.0722 > 128;
  const inkDefault: `#${string}` = light ? "#111111" : "#f4f4f4";

  const blocks: Block[] = [];
  for (const raw of (Array.isArray(body.blocks) ? body.blocks : []).slice(0, 60)) {
    const fx = clamp01(raw.x), fy = clamp01(raw.y);
    const fw = Math.max(0.01, clamp01(raw.w)), fh = Math.max(0.01, clamp01(raw.h));
    const x = Math.round(offX + fx * dw), y = Math.round(offY + fy * dh);
    const w = Math.max(24, Math.round(fw * dw)), h = Math.max(16, Math.round(fh * dh));

    if (raw.kind === "image") {
      // Fill the slot from the reference itself, so the page reads at once.
      const crop = document.createElement("canvas");
      const sw = fw * img.naturalWidth, sh = fh * img.naturalHeight;
      crop.width = Math.min(1600, Math.round(sw)); crop.height = Math.max(1, Math.round(crop.width * (sh / sw)));
      crop.getContext("2d")!.drawImage(img, fx * img.naturalWidth, fy * img.naturalHeight, sw, sh, 0, 0, crop.width, crop.height);
      const out = crop.toDataURL("image/webp", 0.85);
      blocks.push({ id: uid("i"), kind: "image", x, y, w, h, fit: "cover", radius: 0, label: raw.label ?? "Image", tint: "surface",
        src: out.startsWith("data:image/webp") ? out : crop.toDataURL("image/jpeg", 0.85) });
      continue;
    }
    if (raw.kind === "rect") {
      blocks.push({ id: uid("r"), kind: "rect", x, y, w, h, fill: asHex(raw.hex ?? raw.color, "#888888"), radius: 0 });
      continue;
    }
    if (raw.kind === "swatch") {
      // Swatches keep their literal colour as a rect with a caption block above it.
      const hex = asHex(raw.hex ?? raw.color, "#888888");
      blocks.push({ id: uid("r"), kind: "rect", x, y, w, h, fill: hex, radius: 0 });
      if (raw.label) {
        blocks.push({ id: uid("t"), kind: "text", x: x + 14, y: y + 12, w: Math.max(24, w - 28), h: 48, text: `${raw.label}\n${hex.toUpperCase()}`,
          role: "h3", font: "mono", size: Math.max(12, Math.round(Math.min(w, h) * 0.09)), weight: 500, align: "left", valign: "top", lineHeight: 1.3, tracking: 0.04,
          color: parseInt(hex.slice(1, 3), 16) * 0.2126 + parseInt(hex.slice(3, 5), 16) * 0.7152 + parseInt(hex.slice(5, 7), 16) * 0.0722 > 140 ? "#111111" : "#ffffff" });
      }
      continue;
    }
    if (raw.kind === "logo") {
      blocks.push({ id: uid("l"), kind: "logo", x, y, w, h, color: asHex(raw.color, inkDefault), size: Math.max(24, Math.round(h * 0.6)) });
      continue;
    }
    // text
    const size = Math.max(10, Math.min(260, Math.round(typeof raw.size === "number" ? raw.size : h * 0.7)));
    const weight = ([400, 500, 600, 700, 800, 900] as const).find((v) => v === raw.weight) ?? (size > 60 ? 600 : 400);
    const role = (["h1", "h2", "h3", "body"] as const).find((r) => r === raw.role);
    blocks.push({
      id: uid("t"), kind: "text", x, y, w, h,
      text: (raw.text ?? "").trim() || "Text",
      ...(role ? { role } : {}),
      font: role === "h3" ? "mono" : "sans", size, weight,
      align: raw.align ?? "left", valign: "top", lineHeight: 1.15, tracking: 0,
      color: asHex(raw.color, inkDefault),
    });
  }

  const slots = body.palette && typeof body.palette === "object"
    ? (Object.fromEntries((["paper", "ink", "primary", "accent", "muted", "surface"] as TokenKey[]).map((k) => [k, asHex(body.palette![k], k === "paper" ? bg : inkDefault)])) as Record<TokenKey, string>)
    : null;
  const palette = [bg, ...(slots ? Object.values(slots) : [])].filter((v, i, a) => a.indexOf(v) === i);

  const slide: Slide = {
    id: uid("p"), name: typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 60) : "Traced page",
    bg, blocks, reference: { src, opacity: 0.25, visible: false },
  };
  return { slide, palette, slots };
}
