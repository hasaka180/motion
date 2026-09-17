/**
 * The document model for the guidelines builder.
 *
 * A project is one client's deck: a brand (name, palette, fonts, logo) and a
 * list of slides. Slides are laid out in a fixed 1600×900 space and scaled to
 * fit wherever they are drawn, so positions are stable across screen sizes and
 * print. Blocks never store a literal colour where a token will do — they name
 * a palette slot, so swapping the client's palette recolours the whole deck.
 */

export const SLIDE_W = 1600;
export const SLIDE_H = 900;

/** Palette slots every template provides, so layouts can be written once. */
export type TokenKey = "paper" | "ink" | "primary" | "accent" | "muted" | "surface";

export type Brand = {
  name: string;
  tagline: string;
  /** Free text that prints on covers and footers, e.g. "Brand Guidelines 2026". */
  edition: string;
  palette: Record<TokenKey, { name: string; hex: string }>;
  /** Extra named swatches shown on the colour pages. */
  extras: { name: string; hex: string }[];
  /** The type system. Text blocks with a role take their face and weight from here. */
  type: Record<TypeRole, TypeStyle>;
  /** Data URL of an uploaded logo, if any. */
  logo?: string;
};

/** The four faces the site ships. */
export type FontKey = "sans" | "serif" | "mono" | "display" | "condensed" | "script";
/** A shipped face, or any Google Fonts family by name, loaded at runtime. */
export type FontFace = FontKey | (string & {});
export type TypeRole = "h1" | "h2" | "h3" | "body";
export type TypeStyle = {
  face: FontFace;
  weight: 400 | 500 | 600 | 700 | 800 | 900;
  italic?: boolean;
  uppercase?: boolean;
};

/** A colour is either a palette slot or a literal. */
export type Paint = TokenKey | `#${string}`;

type Base = { id: string; x: number; y: number; w: number; h: number; rotation?: number; opacity?: number; locked?: boolean };

export type GradientStyle = {
  kind: "linear" | "radial" | "mesh" | "edge";
  colors: [string, string, string];
  angle: number;
};

export type TextBlock = Base & {
  kind: "text";
  /** Supports {brand}, {tagline}, {edition}, {year}. */
  text: string;
  /** When set, face, weight, italic and case follow the brand's type system. */
  role?: TypeRole;
  font: FontFace;
  size: number;
  weight: 400 | 500 | 600 | 700 | 800 | 900;
  italic?: boolean;
  uppercase?: boolean;
  align: "left" | "center" | "right";
  valign: "top" | "middle" | "bottom";
  lineHeight: number;
  tracking: number;
  color: Paint;
};

export type ImageBlock = Base & {
  kind: "image";
  src?: string;
  fit: "cover" | "contain";
  radius: number;
  /** What the empty slot says. */
  label: string;
  /** Tint drawn under the image while the slot is empty. */
  tint: Paint;
  grayscale?: boolean;
  focalX?: number;
  focalY?: number;
};

export type IconName = "sparkle" | "star" | "arrow" | "heart" | "quote" | "instagram" | "music" | "globe" | "ticket";
export type IconBlock = Base & {
  kind: "icon";
  icon: IconName;
  color: Paint;
  strokeWidth: number;
  /** An optional uploaded replacement for the default vector. */
  src?: string;
  label: string;
};

export type RectBlock = Base & {
  kind: "rect";
  fill: Paint;
  radius: number;
  /** Optional CSS gradient; overrides fill when present. */
  gradient?: string;
  gradientStyle?: GradientStyle;
  grain?: number;
};

export type SwatchBlock = Base & {
  kind: "swatch";
  token: TokenKey | number;
  radius: number;
  /** Where the name and hex print. */
  caption: "inside" | "below" | "none";
};

export type LogoBlock = Base & {
  kind: "logo";
  /** Falls back to the brand name in the display face when no logo is uploaded. */
  color: Paint;
  size: number;
};

export type Block = TextBlock | ImageBlock | RectBlock | SwatchBlock | LogoBlock | IconBlock;

export type Slide = {
  id: string;
  name: string;
  bg: Paint;
  gradient?: string;
  gradientStyle?: GradientStyle;
  grain?: number;
  blocks: Block[];
  provenance?: { kind: "reference" | "generated"; section: string; source?: string; warnings: string[] };
  /** A traced reference image, drawn under the page in the editor only. */
  reference?: { src: string; opacity: number; visible: boolean };
};

/** A deck saved as a starting point for the next client. */
export type CustomTemplate = {
  id: string;
  name: string;
  brand: Brand;
  slides: Slide[];
};

export type Project = {
  id: string;
  templateId: string;
  client: string;
  brand: Brand;
  slides: Slide[];
  updatedAt: number;
};

export type Template = {
  id: string;
  name: string;
  blurb: string;
  brand: Brand;
  /** Built from the brand so palette and copy tokens resolve. */
  slides: (brand: Brand) => Slide[];
};

let counter = 0;
export const uid = (prefix = "b") =>
  `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`;

export function resolvePaint(paint: Paint | undefined, brand: Brand, extras?: boolean): string {
  if (!paint) return "transparent";
  if (paint.startsWith("#")) return paint;
  const slot = brand.palette[paint as TokenKey];
  if (slot) return slot.hex;
  void extras;
  return "#ff00ff";
}

export function resolveText(text: string, brand: Brand) {
  return text
    .replaceAll("{brand}", brand.name)
    .replaceAll("{tagline}", brand.tagline)
    .replaceAll("{edition}", brand.edition)
    .replaceAll("{year}", String(new Date().getFullYear()));
}

export const FONT_STACK: Record<FontKey, string> = {
  sans: "var(--font-sans)",
  serif: "var(--font-serif)",
  mono: "var(--font-mono)",
  display: "var(--font-display)",
  condensed: '"Festival Condensed", Impact, sans-serif',
  script: '"Festival Script", cursive',
};

export const isShippedFace = (face: FontFace): face is FontKey => face in FONT_STACK;

/** CSS font-family for a shipped face or a Google family. */
export function fontStack(face: FontFace) {
  return isShippedFace(face) ? FONT_STACK[face] : `"${face}", system-ui, sans-serif`;
}

/** What a text block actually renders in, once its role is applied. */
export function textStyle(block: TextBlock, brand: Brand) {
  const role = block.role ? brand.type[block.role] : undefined;
  return {
    face: role?.face ?? block.font,
    weight: role?.weight ?? block.weight,
    italic: role ? !!role.italic : !!block.italic,
    uppercase: role ? !!role.uppercase : !!block.uppercase,
  };
}

export const DEFAULT_TYPE: Brand["type"] = {
  h1: { face: "sans", weight: 600 },
  h2: { face: "sans", weight: 500 },
  h3: { face: "mono", weight: 400, uppercase: true },
  body: { face: "sans", weight: 400 },
};
