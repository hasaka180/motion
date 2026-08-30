/**
 * Stand-in artwork for the media demos. Each poster is a stack of CSS gradients
 * rather than a bitmap, so the repo carries no binary assets and every tile
 * still has real colour for the grayscale transitions to act on.
 *
 * Swapping in production media: replace <MediaTile poster={...} /> with an
 * <img> or <video> — the demos only care about the box, not what fills it.
 */
export type Poster = {
  id: string;
  label: string;
  background: string;
};

export const posters: Poster[] = [
  {
    id: "terrace",
    label: "Terrace",
    background: [
      "repeating-linear-gradient(105deg, rgba(255,255,255,0.12) 0 5px, transparent 5px 24px)",
      "radial-gradient(120% 80% at 20% 100%, rgba(120,72,40,0.55), transparent 60%)",
      "linear-gradient(200deg, #f6e9d8 0%, #e3c7a3 45%, #8a6440 100%)",
    ].join(","),
  },
  {
    id: "ascent",
    label: "Ascent",
    background: [
      "linear-gradient(90deg, #2b2f36 0 17%, transparent 17% 83%, #232830 83% 100%)",
      "repeating-linear-gradient(0deg, rgba(255,255,255,0.07) 0 3px, transparent 3px 11px)",
      "linear-gradient(180deg, #7fb3dd, #d8ecfa)",
    ].join(","),
  },
  {
    id: "ridge",
    label: "Ridge",
    background: [
      "radial-gradient(90% 60% at 50% 100%, #2f3a3f, transparent 70%)",
      "linear-gradient(160deg, #cfd8dd 0%, #8b979e 40%, #4b555b 100%)",
    ].join(","),
  },
  {
    id: "bloom",
    label: "Bloom",
    background: [
      "linear-gradient(90deg, #e8552f 0 13%, transparent 13% 87%, #e8552f 87% 100%)",
      "radial-gradient(58% 68% at 46% 56%, #f4bda4 0 42%, transparent 43%)",
      "linear-gradient(180deg, #2f4bd8, #1b2ea8)",
    ].join(","),
  },
  {
    id: "ribbon",
    label: "Ribbon",
    background: [
      "radial-gradient(70% 120% at 70% 25%, rgba(255,255,255,0.38), transparent 55%)",
      "conic-gradient(from 210deg at 40% 60%, #0f766e, #34d399, #064e3b, #0f766e)",
    ].join(","),
  },
  {
    id: "almuerzo",
    label: "Almuerzo",
    background: [
      "radial-gradient(80% 60% at 50% 18%, #f4d9b0, transparent 70%)",
      "linear-gradient(180deg, #6f8f5a 0 42%, #c0392b 42% 100%)",
    ].join(","),
  },
  {
    id: "ember",
    label: "Ember",
    background: [
      "radial-gradient(38% 38% at 50% 55%, #ef4444 0%, #7f1d1d 36%, transparent 70%)",
      "linear-gradient(#161314, #0a0809)",
    ].join(","),
  },
  {
    id: "silk",
    label: "Silk",
    background: [
      "repeating-linear-gradient(115deg, rgba(255,255,255,0.10) 0 9px, transparent 9px 32px)",
      "radial-gradient(70% 100% at 30% 40%, #60a5fa, transparent 60%)",
      "linear-gradient(140deg, #0b1220, #1e3a8a 60%, #0b1220)",
    ].join(","),
  },
  {
    id: "dune",
    label: "Dune",
    background: [
      "radial-gradient(90% 70% at 50% 110%, #7c3f1d, transparent 65%)",
      "linear-gradient(180deg, #f6d7a8, #d99a52 60%, #8a5a2b)",
    ].join(","),
  },
  {
    id: "tide",
    label: "Tide",
    background: [
      "repeating-linear-gradient(0deg, rgba(255,255,255,0.07) 0 3px, transparent 3px 9px)",
      "linear-gradient(180deg, #062e3f, #0e7490 55%, #67e8f9)",
    ].join(","),
  },
  {
    id: "atrium",
    label: "Atrium",
    background: [
      "repeating-linear-gradient(90deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 28px)",
      "radial-gradient(80% 60% at 50% 0%, #eef2f5, transparent 70%)",
      "linear-gradient(190deg, #b8c2c9, #6d787f 60%, #39424a)",
    ].join(","),
  },
  {
    id: "nocturne",
    label: "Nocturne",
    background: [
      "radial-gradient(45% 55% at 62% 40%, #c4b5fd, transparent 62%)",
      "linear-gradient(165deg, #1e1b4b, #4c1d95 55%, #0b0718)",
    ].join(","),
  },
  {
    id: "signal",
    label: "Signal",
    background: [
      "repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0 2px, transparent 2px 5px)",
      "radial-gradient(60% 70% at 50% 55%, #4ade80, transparent 70%)",
      "linear-gradient(#04140c, #072016)",
    ].join(","),
  },
  {
    id: "bazaar",
    label: "Bazaar",
    background: [
      "repeating-linear-gradient(45deg, rgba(0,0,0,0.16) 0 8px, transparent 8px 18px)",
      "radial-gradient(70% 70% at 35% 40%, #fbbf24, transparent 65%)",
      "linear-gradient(140deg, #9a3412, #7c2d12 60%, #431407)",
    ].join(","),
  },
  {
    id: "frost",
    label: "Frost",
    background: [
      "radial-gradient(60% 50% at 40% 30%, #ffffff, transparent 70%)",
      "linear-gradient(200deg, #dbeafe, #93c5fd 55%, #5b7fa8)",
    ].join(","),
  },
  {
    id: "cinder",
    label: "Cinder",
    background: [
      "radial-gradient(50% 45% at 55% 65%, #fb923c, transparent 65%)",
      "linear-gradient(160deg, #292524, #1c1917 55%, #0c0a09)",
    ].join(","),
  },
];
