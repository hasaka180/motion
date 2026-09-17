import {
  SLIDE_H,
  SLIDE_W,
  uid,
  type Brand,
  type FontFace,
  type ImageBlock,
  type LogoBlock,
  type Paint,
  type RectBlock,
  type Slide,
  type SwatchBlock,
  type Template,
  type TextBlock,
  type TokenKey,
} from "./types";

/**
 * Starter decks. Each template is a brand — palette, faces, copy — and a set
 * of page layouts written against palette *slots*, so a client's colours drop
 * in without touching a layout. Change the palette and every page follows.
 */

// ------------------------------------------------------------ block helpers
const text = (
  x: number, y: number, w: number, h: number, body: string, o: Partial<TextBlock> = {},
): TextBlock => ({
  id: uid("t"), kind: "text", x, y, w, h, text: body,
  font: "sans", size: 26, weight: 400, align: "left", valign: "top",
  lineHeight: 1.2, tracking: 0, color: "ink", ...o,
});
const image = (
  x: number, y: number, w: number, h: number, o: Partial<ImageBlock> = {},
): ImageBlock => ({
  id: uid("i"), kind: "image", x, y, w, h, fit: "cover", radius: 0,
  label: "Drop image", tint: "surface", ...o,
});
const rect = (x: number, y: number, w: number, h: number, fill: Paint, o: Partial<RectBlock> = {}): RectBlock =>
  ({ id: uid("r"), kind: "rect", x, y, w, h, fill, radius: 0, ...o });
const swatch = (
  x: number, y: number, w: number, h: number, token: TokenKey | number, o: Partial<SwatchBlock> = {},
): SwatchBlock => ({ id: uid("s"), kind: "swatch", x, y, w, h, token, radius: 0, caption: "inside", ...o });
const logo = (x: number, y: number, w: number, h: number, o: Partial<LogoBlock> = {}): LogoBlock =>
  ({ id: uid("l"), kind: "logo", x, y, w, h, color: "ink", size: 64, ...o });
const slide = (name: string, bg: Paint, blocks: Slide["blocks"], gradient?: string): Slide =>
  ({ id: uid("p"), name, bg, gradient, blocks });

/** The choices that make one template read differently from another. */
type Style = {
  head: FontFace;
  headWeight: TextBlock["weight"];
  upper: boolean;
  tracking: number;
  label: FontFace;
  /** Colour used for the small running labels on dark pages. */
  labelColor: Paint;
};

// ----------------------------------------------------------- page builders
const M = 80; // page margin

function runningHead(section: string, title: string, s: Style, color: Paint = "muted") {
  return [
    text(M, 48, 400, 30, "{brand}", { role: "h3", font: s.label, size: 16, color, tracking: .08, uppercase: true }),
    text(SLIDE_W / 2 - 200, 48, 400, 30, section, { role: "h3", font: s.label, size: 16, color, align: "center", tracking: .08, uppercase: true }),
    text(SLIDE_W - M - 400, 48, 400, 30, title, { role: "h3", font: s.label, size: 16, color, align: "right", tracking: .08, uppercase: true }),
  ];
}
const pageNo = (n: number, s: Style, color: Paint = "muted") =>
  text(SLIDE_W - M - 120, SLIDE_H - 68, 120, 24, String(n).padStart(2, "0"), { role: "h3", font: s.label, size: 14, color, align: "right", tracking: .1 });

function cover(bg: Paint, fg: Paint, s: Style, title = "Brand\nGuidelines") {
  return slide("Cover", bg, [
    ...runningHead("", "{edition}", s, fg),
    text(M, SLIDE_H - 100 - 300, 1200, 300, title, {
      role: "h1", font: s.head, size: 150, weight: s.headWeight, uppercase: s.upper, valign: "bottom",
      lineHeight: .92, tracking: s.tracking, color: fg,
    }),
    logo(SLIDE_W - M - 260, SLIDE_H - 100 - 80, 260, 80, { color: fg, size: 40 }),
  ]);
}

function contents(bg: Paint, fg: Paint, s: Style, items: string[]) {
  const rows = items.map((label, i) => [
    text(SLIDE_W / 2 - 40, 300 + i * 58, 100, 48, String(i).padStart(2, "0"), { font: s.label, size: 30, color: fg }),
    text(SLIDE_W / 2 + 90, 300 + i * 58, 640, 48, label, { font: s.head === "display" ? "sans" : s.head, size: 30, weight: 500, color: fg }),
  ]).flat();
  return slide("Contents", bg, [
    ...runningHead("Summary", "{edition}", s, fg),
    text(M, 300, 520, 60, "Contents", { role: "h3", font: s.label, size: 16, color: fg, uppercase: true, tracking: .14 }),
    ...rows,
    pageNo(1, s, fg),
  ]);
}

function statement(bg: Paint, fg: Paint, accent: Paint, s: Style, label: string, body: string, n: number, name = "Statement") {
  return slide(name, bg, [
    ...runningHead("The Prologue", label, s),
    text(M, 380, 380, 140, label, { font: "sans", size: 46, weight: 400, color: fg }),
    text(600, 360, 920, 380, body, {
      role: "h2", font: s.head === "display" ? "sans" : s.head, size: 72, weight: 600, color: accent,
      lineHeight: 1.05, tracking: -.02,
    }),
    pageNo(n, s),
  ]);
}

function wordmark(bg: Paint, fg: Paint, s: Style, n: number) {
  return slide("Wordmark", bg, [
    ...runningHead("Wordmark instructions", "01", s, fg),
    logo(SLIDE_W / 2 - 400, SLIDE_H / 2 - 120, 800, 240, { color: fg, size: 200 }),
    text(M, SLIDE_H - 100 - 130, 200, 130, "01", { font: s.head, size: 110, weight: s.headWeight, color: fg, valign: "bottom", lineHeight: 1 }),
    text(320, SLIDE_H - 100 - 130, 900, 130, "Wordmark\nInstructions", {
      role: "h2", font: s.head, size: 56, weight: s.headWeight, uppercase: s.upper, color: fg, valign: "bottom", lineHeight: 1, tracking: s.tracking,
    }),
    pageNo(n, s, fg),
  ]);
}

function logoScale(bg: Paint, fg: Paint, s: Style, n: number) {
  const sizes = [220, 150, 100, 64];
  let y = 220;
  const marks = sizes.map((size) => {
    const b = logo(SLIDE_W / 2 - 120, y, 800, size * 1.15, { color: fg, size });
    y += size * 1.15 + 36;
    return b;
  });
  return slide("Logo scale", bg, [
    ...runningHead("Wordmark instructions", "Logo scale", s),
    text(M, 220, 360, 120, "04\nLogo\nScale", { font: "sans", size: 34, weight: 400, color: fg, lineHeight: 1.05 }),
    text(M, 420, 360, 200, "Minimum sizes for print and screen. Never reproduce the wordmark below the smallest size shown here.", { role: "body", font: "sans", size: 16, color: "muted", lineHeight: 1.5 }),
    ...marks,
    pageNo(n, s),
  ]);
}

function clearspace(bg: Paint, fg: Paint, s: Style, n: number) {
  const bx = 560, by = 220, bw = 900, bh = 460;
  return slide("Clearspace", bg, [
    ...runningHead("Wordmark instructions", "Alignment dos", s),
    text(M, 220, 360, 120, "08\nAlignment\nDos", { font: "sans", size: 34, weight: 400, color: fg, lineHeight: 1.05 }),
    text(M, 420, 380, 220, "Keep a clear zone equal to the height of the mark on every side. Nothing enters it — not type, not imagery, not the edge of the page.", { role: "body", font: "sans", size: 16, color: "muted", lineHeight: 1.5 }),
    rect(bx, by, bw, bh, "surface"),
    rect(bx + 120, by + 120, bw - 240, bh - 240, "primary", { radius: 0 }),
    logo(bx + 120, by + 120, bw - 240, bh - 240, { color: "paper", size: 96 }),
    text(bx, by + bh + 16, 200, 24, "x = mark height", { font: s.label, size: 13, color: "muted", tracking: .06, uppercase: true }),
    pageNo(n, s),
  ]);
}

function colours(bg: Paint, fg: Paint, s: Style, brand: Brand, n: number) {
  const tokens: (TokenKey | number)[] = ["primary", "accent", "ink", "paper", "muted", "surface", ...brand.extras.map((_, i) => i)];
  const cols = 4, gap = 20, w = (SLIDE_W - M * 2 - gap * (cols - 1)) / cols;
  const rows = Math.ceil(tokens.length / cols), h = Math.min(220, (SLIDE_H - 200 - 100 - gap * (rows - 1)) / rows);
  const tiles = tokens.map((t, i) => swatch(M + (i % cols) * (w + gap), 200 + Math.floor(i / cols) * (h + gap), w, h, t));
  return slide("Colour principles", bg, [
    ...runningHead("Colour principles", "03", s),
    text(M, 110, 800, 60, "03  Colour Principles", { role: "h3", font: s.label, size: 16, color: fg, uppercase: true, tracking: .14 }),
    ...tiles,
    pageNo(n, s),
  ]);
}

function greyscale(bg: Paint, fg: Paint, s: Style, n: number) {
  const greys = ["#111114", "#2a2a2f", "#55555c", "#a4a4ab", "#f4f4f7"];
  const w = 200, gap = 16;
  return slide("Greyscale", bg, [
    ...runningHead("Colour principles", "Greyscale", s),
    text(M, 220, 360, 120, "03\nGreyscale", { font: "sans", size: 34, weight: 400, color: fg, lineHeight: 1.05 }),
    ...greys.map((hex, i) => rect(560 + (i % 3) * (w + gap), 220 + Math.floor(i / 3) * (w + gap), w, w, hex as Paint)),
    ...greys.map((hex, i) => text(560 + (i % 3) * (w + gap) + 14, 220 + Math.floor(i / 3) * (w + gap) + 14, w - 28, 40, hex.toUpperCase(), {
      font: s.label, size: 12, color: i > 2 ? "#111114" : "#f4f4f7", tracking: .06,
    })),
    pageNo(n, s),
  ]);
}

function typography(bg: Paint, fg: Paint, s: Style, n: number) {
  return slide("Typography", bg, [
    ...runningHead("Typographic guidelines", "02", s),
    text(M, 220, 360, 160, "01\nPrimary\nTypeface", { font: "sans", size: 34, weight: 400, color: fg, lineHeight: 1.05 }),
    text(560, 200, 960, 300, "AaBbCcDdEeFfGgHh\nIiJjKkLlMmNnOoPpQqRr\nSsTtUuVvWwXxYyZz\n1234567890&,#?!", {
      font: s.head === "display" ? "sans" : s.head, size: 52, weight: 500, color: fg, lineHeight: 1.18, tracking: -.01,
    }),
    text(560, 560, 960, 120, "Regular · Medium · Semibold · Bold\nUse weight for hierarchy, not size. Two sizes per page, at most.", { role: "body", font: "sans", size: 18, color: "muted", lineHeight: 1.5 }),
    pageNo(n, s),
  ]);
}

function specimen(bg: Paint, fg: Paint, accent: Paint, s: Style, n: number) {
  return slide("Type specimen", bg, [
    ...runningHead("Typographic guidelines", "Specimen", s),
    text(M, 170, 1440, 180, "ABC Normal", { font: s.head === "display" ? "sans" : s.head, size: 150, weight: 500, color: accent, lineHeight: 1, tracking: -.03 }),
    text(M, 380, 1440, 400, "A mad boxer shot a quick, gloved jab to the jaw of his dizzy opponent. Sphinx of black quartz, judge my vow. The quick brown fox jumps over the lazy dog. Crazy Frederick bought many very exquisite opal jewels. The job requires extra pluck and zeal from every young wage earner.", {
      font: s.head === "display" ? "sans" : s.head, size: 44, weight: 400, color: fg, lineHeight: 1.22, tracking: -.01,
    }),
    pageNo(n, s),
  ]);
}

function photography(bg: Paint, fg: Paint, s: Style, n: number) {
  const cols = 3, rows = 2, gap = 16;
  const w = (SLIDE_W - M * 2 - gap * (cols - 1)) / cols, h = (SLIDE_H - 200 - 80 - gap) / rows;
  const cells = Array.from({ length: cols * rows }, (_, i) =>
    image(M + (i % cols) * (w + gap), 200 + Math.floor(i / cols) * (h + gap), w, h, { label: `Photo ${i + 1}` }));
  return slide("Photography", bg, [
    ...runningHead("Photography practice", "04", s),
    text(M, 110, 800, 60, "04  Photography Practice", { role: "h3", font: s.label, size: 16, color: fg, uppercase: true, tracking: .14 }),
    ...cells,
    pageNo(n, s),
  ]);
}

function inUse(bg: Paint, fg: Paint, accent: Paint, s: Style, n: number, num = "05", title = "Brand in\nUse") {
  return slide("Brand in use", bg, [
    image(0, 0, SLIDE_W, SLIDE_H, { label: "Full-bleed photograph", tint: "surface" }),
    rect(0, SLIDE_H - 360, SLIDE_W, 360, "#000000", { gradient: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,.72))" }),
    text(M, SLIDE_H - 100 - 130, 200, 130, num, { font: s.head, size: 110, weight: s.headWeight, color: fg, valign: "bottom", lineHeight: 1 }),
    text(320, SLIDE_H - 100 - 130, 900, 130, title, {
      role: "h2", font: s.head, size: 56, weight: s.headWeight, uppercase: s.upper, color: accent, valign: "bottom", lineHeight: 1, tracking: s.tracking,
    }),
    pageNo(n, s, fg),
  ]);
}

function iconography(bg: Paint, fg: Paint, s: Style, n: number) {
  const glyphs = ["✦", "✧", "◆", "◇", "●", "○", "▲", "△", "■", "□", "✕", "✚", "❖", "✱", "⌘", "⌂", "➜", "✓"];
  const cols = 6, gap = 16, w = (SLIDE_W - M * 2 - gap * (cols - 1)) / cols, h = 150;
  return slide("Iconography", bg, [
    ...runningHead("Iconography", "Icon set", s),
    text(M, 110, 800, 60, "Iconography", { role: "h3", font: s.label, size: 16, color: fg, uppercase: true, tracking: .14 }),
    ...glyphs.flatMap((g, i) => {
      const x = M + (i % cols) * (w + gap), y = 200 + Math.floor(i / cols) * (h + gap);
      return [
        rect(x, y, w, h, "surface"),
        text(x, y, w, h, g, { font: "sans", size: 44, weight: 400, color: fg, align: "center", valign: "middle" }),
      ];
    }),
    text(M, 720, 900, 60, "One stroke weight, one optical size, drawn on the same grid as the wordmark. Fill the tiles with the set as it grows.", { role: "body", font: "sans", size: 16, color: "muted", lineHeight: 1.5 }),
    pageNo(n, s),
  ]);
}

function closing(bg: Paint, fg: Paint, s: Style) {
  return slide("Closing", bg, [
    logo(SLIDE_W / 2 - 300, SLIDE_H / 2 - 100, 600, 160, { color: fg, size: 120 }),
    text(M, SLIDE_H - 100, 700, 30, "{brand} · {edition}", { font: s.label, size: 14, color: fg, tracking: .1, uppercase: true }),
    text(SLIDE_W - M - 700, SLIDE_H - 100, 700, 30, "Prepared by Darwin Corp", { font: s.label, size: 14, color: fg, align: "right", tracking: .1, uppercase: true }),
  ]);
}

const INDEX = ["The Prologue", "Wordmark Instructions", "Typographic Guidelines", "Colour Principles", "Photography Practice", "Brand in Use"];

// -------------------------------------------------------------- templates
const palette = (
  paper: string, ink: string, primary: string, accent: string, muted: string, surface: string,
  names: [string, string, string, string, string, string] = ["Paper", "Ink", "Primary", "Accent", "Muted", "Surface"],
): Brand["palette"] => ({
  paper: { name: names[0], hex: paper }, ink: { name: names[1], hex: ink },
  primary: { name: names[2], hex: primary }, accent: { name: names[3], hex: accent },
  muted: { name: names[4], hex: muted }, surface: { name: names[5], hex: surface },
});

export const TEMPLATES: Template[] = [
  {
    id: "mold",
    name: "Mold",
    blurb: "Lilac on black. Grotesk headlines, a neon second colour, numbered sections.",
    brand: {
      name: "Drop", tagline: "Break the mold on social", edition: "Brand Guidelines {year}",
      palette: palette("#0a0a0b", "#f3f1ff", "#b6a6f6", "#d4ff5b", "#8c8b9a", "#17171c", ["Eerie Black", "Off White", "Lilac", "Neon Green", "Dusty Grey", "Smoky Black"]),
      extras: [{ name: "Sand", hex: "#d9d2c3" }, { name: "Mauve", hex: "#8c6bb1" }, { name: "Flame", hex: "#ff6a2b" }, { name: "Olive", hex: "#8a9a3a" }, { name: "Icterine", hex: "#f5f26b" }, { name: "Neon", hex: "#c8ff5a" }],
      type: { h1: { face: "sans", weight: 500, uppercase: true }, h2: { face: "sans", weight: 500, uppercase: true }, h3: { face: "mono", weight: 400, uppercase: true }, body: { face: "sans", weight: 400 } },
    },
    slides: (b) => {
      const s: Style = { head: "sans", headWeight: 500, upper: true, tracking: -.02, label: "mono", labelColor: "muted" };
      return [
        cover("primary", "#0a0a0b", s),
        contents("primary", "#0a0a0b", s, INDEX),
        statement("paper", "primary", "primary", s, "What", "{brand} reinvents how people buy and sell online.", 2),
        wordmark("primary", "#0a0a0b", s, 3),
        logoScale("paper", "ink", s, 4),
        clearspace("paper", "ink", s, 5),
        colours("paper", "ink", s, b, 6),
        greyscale("paper", "ink", s, 7),
        typography("paper", "ink", s, 8),
        specimen("paper", "primary", "primary", s, 9),
        photography("paper", "ink", s, 10),
        inUse("paper", "ink", "accent", s, 11),
        closing("primary", "#0a0a0b", s),
      ];
    },
  },
  {
    id: "circuit",
    name: "Circuit",
    blurb: "Obsidian, neon yellow and royal blue. Heavy display type, product-style panels.",
    brand: {
      name: "Born to Build", tagline: "The fastest growing launchpad", edition: "Brand Guidelines {year}",
      palette: palette("#0e0e10", "#ffffff", "#d9ff00", "#2b5cff", "#8a8a90", "#1a1a1d", ["Obsidian", "Ice White", "Neon Yellow", "Royal Blue", "Light Silver", "Graphite"]),
      extras: [{ name: "Light Silver", hex: "#d0d0d3" }, { name: "Ice White", hex: "#f5f5f7" }],
      type: { h1: { face: "display", weight: 400, uppercase: true }, h2: { face: "display", weight: 400, uppercase: true }, h3: { face: "mono", weight: 400, uppercase: true }, body: { face: "sans", weight: 400 } },
    },
    slides: (b) => {
      const s: Style = { head: "display", headWeight: 400, upper: true, tracking: 0, label: "mono", labelColor: "muted" };
      return [
        cover("paper", "ink", s, "Brand\nGuidelines."),
        contents("paper", "ink", s, INDEX),
        statement("primary", "#0e0e10", "#0e0e10", s, "About", "{brand} is the fastest growing launchpad with the industry's greatest yield generating tools.", 2),
        wordmark("paper", "primary", s, 3),
        clearspace("paper", "ink", s, 4),
        logoScale("paper", "ink", s, 5),
        colours("paper", "ink", s, b, 6),
        typography("paper", "ink", s, 7),
        specimen("paper", "ink", "primary", s, 8),
        photography("paper", "ink", s, 9),
        inUse("paper", "ink", "primary", s, 10),
        closing("accent", "ink", s),
      ];
    },
  },
  {
    id: "unlimited",
    name: "Unlimited",
    blurb: "Coral on white. Enormous condensed uppercase, photography that fills the page.",
    brand: {
      name: "The Unlimited", tagline: "We challenge the status quo", edition: "Brand Book {year}",
      palette: palette("#f1f1f1", "#141414", "#ff4b2b", "#141414", "#6b6b6b", "#ffffff", ["White", "Black", "Coral", "Black", "Grey", "Paper"]),
      extras: [],
      type: { h1: { face: "display", weight: 400, uppercase: true }, h2: { face: "display", weight: 400, uppercase: true }, h3: { face: "sans", weight: 500, uppercase: true }, body: { face: "sans", weight: 400 } },
    },
    slides: (b) => {
      const s: Style = { head: "display", headWeight: 400, upper: true, tracking: -.01, label: "sans", labelColor: "muted" };
      return [
        cover("primary", "paper", s, "Brand\nTone."),
        contents("paper", "ink", s, INDEX),
        statement("paper", "ink", "primary", s, "Our identity", "Coral is the new black.", 2),
        wordmark("paper", "primary", s, 3),
        logoScale("paper", "ink", s, 4),
        colours("paper", "ink", s, b, 5),
        typography("primary", "paper", s, 6),
        specimen("paper", "ink", "primary", s, 7),
        photography("paper", "ink", s, 8),
        inUse("paper", "paper", "primary", s, 9, "09", "Photo\ngraphy."),
        closing("primary", "paper", s),
      ];
    },
  },
  {
    id: "festival",
    name: "Festival",
    blurb: "Serif numerals and a sunset gradient. Editorial, warm, built for stats and quotes.",
    brand: {
      name: "All Things Go", tagline: "Two cities. One weekend.", edition: "Partner Deck {year}",
      palette: palette("#0e0e0f", "#f7e9e6", "#ff8fa3", "#dcff7a", "#9a9aa0", "#18181b", ["Night", "Blush White", "Pink", "Lime", "Ash", "Charcoal"]),
      extras: [{ name: "Peach", hex: "#ffd9b8" }, { name: "Sky", hex: "#8fd3ff" }],
      type: { h1: { face: "serif", weight: 400 }, h2: { face: "serif", weight: 400 }, h3: { face: "mono", weight: 400, uppercase: true }, body: { face: "sans", weight: 400 } },
    },
    slides: (b) => {
      const s: Style = { head: "serif", headWeight: 400, upper: false, tracking: -.02, label: "mono", labelColor: "muted" };
      const sunset = "linear-gradient(135deg, #ffb1c1 0%, #ffd9b8 45%, #e9ffb0 100%)";
      const stats = slide("Overview", "paper", [
        rect(0, 0, 60, SLIDE_H, "primary", { gradient: "linear-gradient(180deg, #ffb1c1, #ffd9b8, #e9ffb0)" }),
        ...runningHead("Overview", "{edition}", s),
        text(M + 60, 200, 900, 560, "86 artists\n100,000 fans\n2 cities\n1 weekend", { font: "serif", size: 120, weight: 400, color: "ink", lineHeight: 1.05, tracking: -.03 }),
        image(1080, 300, 440, 300, { label: "Crowd photo" }),
        pageNo(2, s),
      ]);
      const names = slide("Artists", "paper", [
        text(M, 60, 600, 60, "Celebrating the most\ninfluential artists", { font: "mono", size: 14, color: "#1a1a1a", uppercase: true, tracking: .08 }),
        text(0, 150, SLIDE_W, 650, "Billie Eilish\nLorde\nCharli XCX\nLana Del Rey\nMaggie Rogers\nBoygenius\nMitski\nHaim", {
          font: "display", size: 64, weight: 400, color: "#111111", align: "center", uppercase: true, lineHeight: 1.05,
        }),
      ], sunset);
      return [
        cover("paper", "ink", s, "Brand\nGuidelines"),
        contents("paper", "ink", s, INDEX),
        stats,
        names,
        wordmark("paper", "ink", s, 4),
        colours("paper", "ink", s, b, 5),
        typography("paper", "ink", s, 6),
        specimen("paper", "ink", "primary", s, 7),
        photography("paper", "ink", s, 8),
        inUse("paper", "ink", "accent", s, 9),
        closing("paper", "ink", s),
      ];
    },
  },
  {
    id: "mono",
    name: "Mono",
    blurb: "Black and white with one signal colour. Quiet, systematic, studio-grade.",
    brand: {
      name: "Odyssey", tagline: "Beyond the ordinary", edition: "Identity System {year}",
      palette: palette("#000000", "#ffffff", "#ff3b1f", "#ffffff", "#777777", "#111111", ["Black", "White", "Signal", "White", "Grey", "Carbon"]),
      extras: [{ name: "Concrete", hex: "#d6d6d6" }],
      type: { h1: { face: "sans", weight: 500 }, h2: { face: "sans", weight: 500 }, h3: { face: "mono", weight: 400, uppercase: true }, body: { face: "sans", weight: 400 } },
    },
    slides: (b) => {
      const s: Style = { head: "sans", headWeight: 500, upper: false, tracking: -.03, label: "mono", labelColor: "muted" };
      return [
        cover("paper", "ink", s, "Identity\nSystem"),
        contents("paper", "ink", s, INDEX),
        statement("paper", "ink", "ink", s, "Position", "{tagline}.", 2),
        wordmark("paper", "ink", s, 3),
        logoScale("paper", "ink", s, 4),
        clearspace("paper", "ink", s, 5),
        colours("paper", "ink", s, b, 6),
        typography("paper", "ink", s, 7),
        specimen("primary", "paper", "paper", s, 8),
        photography("paper", "ink", s, 9),
        inUse("paper", "ink", "primary", s, 10),
        closing("paper", "ink", s),
      ];
    },
  },
];

/** Blank pages a client can add to any deck. */
export const LAYOUTS: { id: string; name: string; make: () => Slide }[] = [
  { id: "blank", name: "Blank", make: () => slide("Blank", "paper", []) },
  { id: "title", name: "Title", make: () => slide("Title", "paper", [
    text(M, SLIDE_H - 100 - 240, 1200, 240, "Section\nTitle", { role: "h1", font: "sans", size: 120, weight: 500, valign: "bottom", lineHeight: .95, tracking: -.03 }),
  ]) },
  { id: "split", name: "Text + image", make: () => slide("Text + image", "paper", [
    text(M, 200, 620, 500, "Heading", { role: "h2", font: "sans", size: 56, weight: 500, lineHeight: 1.05 }),
    text(M, 500, 620, 300, "Body copy goes here.", { role: "body", font: "sans", size: 20, color: "muted", lineHeight: 1.5 }),
    image(800, 0, 800, SLIDE_H, { label: "Image" }),
  ]) },
  { id: "grid", name: "Photo grid", make: () => slide("Photo grid", "paper", Array.from({ length: 6 }, (_, i) =>
    image(M + (i % 3) * 493, 100 + Math.floor(i / 3) * 366, 473, 350, { label: `Photo ${i + 1}` }))) },
  { id: "full", name: "Full bleed", make: () => slide("Full bleed", "paper", [
    image(0, 0, SLIDE_W, SLIDE_H, { label: "Full-bleed image" }),
  ]) },
];

// -------------------------------------------------------- standard pages
export { SECTION_ORDER, type Section } from "./referenceSpec";
import type { Section } from "./referenceSpec";

const lum = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return .5;
  const n = parseInt(m[1], 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};

/** A Style read off a brand's own type system, so generated pages match it. */
function styleOf(brand: Brand): Style {
  return {
    head: brand.type.h1.face, headWeight: brand.type.h1.weight, upper: !!brand.type.h1.uppercase,
    tracking: brand.type.h1.face === "serif" ? -.02 : -.01, label: brand.type.h3.face, labelColor: "muted",
  };
}

/**
 * The pages a deck is missing, generated in its own style. Every one is built
 * against the brand's palette slots and type roles, so it sits beside the
 * pages that were read from the references as if it came from the same hand.
 * `n` is each page's number in the finished deck, so the folios are right.
 */
export function standardPages(brand: Brand, wanted: { section: Section; n: number }[]): Partial<Record<Section, Slide>> {
  const s = styleOf(brand);
  const p = brand.palette;
  // The cover sits on the hero colour; its text is whichever of ink or paper reads against it.
  const coverFg: Paint = lum(p.primary.hex) > .55 ? (lum(p.ink.hex) < .5 ? "ink" : "paper") : (lum(p.ink.hex) >= .5 ? "ink" : "paper");
  const line = brand.tagline?.trim() ? "{tagline}" : "Built to grow with the people who use it.";
  const out: Partial<Record<Section, Slide>> = {};
  for (const { section, n } of wanted) {
    switch (section) {
      case "cover": out.cover = cover("primary", coverFg, s); break;
      case "contents": out.contents = contents("paper", "ink", s, INDEX); break;
      case "statement": out.statement = statement("paper", "ink", "primary", s, "Mission", line, n); break;
      case "wordmark": out.wordmark = wordmark("primary", coverFg, s, n); break;
      case "logoScale": out.logoScale = logoScale("paper", "ink", s, n); break;
      case "clearspace": out.clearspace = clearspace("paper", "ink", s, n); break;
      case "colour": out.colour = colours("paper", "ink", s, brand, n); break;
      case "greyscale": out.greyscale = greyscale("paper", "ink", s, n); break;
      case "typography": out.typography = typography("paper", "ink", s, n); break;
      case "specimen": out.specimen = specimen("paper", "ink", "primary", s, n); break;
      case "iconography": out.iconography = iconography("paper", "ink", s, n); break;
      case "photography": out.photography = photography("paper", "ink", s, n); break;
      case "inUse": out.inUse = inUse("paper", "paper", "primary", s, n); break;
      case "closing": out.closing = closing("primary", coverFg, s); break;
      default: break;
    }
  }
  return out;
}
