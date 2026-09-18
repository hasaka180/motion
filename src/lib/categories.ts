export type Category = {
  slug: string;
  title: string;
  blurb: string;
  /** Number of demos on the page — keep in sync when you add one. */
  count: number;
  /** Two-stop gradient used for the card + nav accent. */
  gradient: [string, string];
};

/**
 * Single source of truth for the sidebar, the home grid and the
 * category page headers. Adding a category = one entry here plus
 * a folder under src/app/(gallery)/<slug>.
 */
export const categories: Category[] = [
  {
    slug: "hero",
    title: "Hero Sections",
    blurb:
      "Above-the-fold openers — a cinematic wasteland image sequence, an illustrated river escape, a scroll-driven botanical study, an interactive desktop, a botanical negative, a decoding ASCII sculpture, a sculpted blob kid, scattered media, cursor spotlights, gradient meshes and curtain reveals.",
    count: 11,
    gradient: ["#8b5cf6", "#ec4899"],
  },
  {
    slug: "intro",
    title: "Intro Animations",
    blurb:
      "First-load choreography. Floating fragments assemble an image, pictures form out of dust, counters, sequential curtains and SVG logo draws hand off to the page.",
    count: 5,
    gradient: ["#22d3ee", "#3b82f6"],
  },
  {
    slug: "text",
    title: "Text Animations",
    blurb:
      "Type that arrives with intent — liquid reveals, hover glitches, word staggers, character scrambles, masked line reveals and gradient sweeps.",
    count: 6,
    gradient: ["#f59e0b", "#ef4444"],
  },
  {
    slug: "carousel",
    title: "Carousels",
    blurb:
      "Grayscale filmstrips, seamless marquees, drag-to-scroll tracks with momentum, and auto-advancing crossfades.",
    count: 4,
    gradient: ["#10b981", "#22d3ee"],
  },
  {
    slug: "scroll",
    title: "Scroll Animations",
    blurb:
      "Scroll-linked motion — a dithered portrait that develops in the scroll, a cinematic 3D fly-through, pinned media sections, rising image cards, parallax layers, viewport reveals and a pinned horizontal section.",
    count: 7,
    gradient: ["#6366f1", "#8b5cf6"],
  },
  {
    slug: "hover",
    title: "Hover & Micro-interactions",
    blurb:
      "The small stuff. A hover-swap editorial index, a pixel shape that scatters like air under the cursor, magnetic buttons, 3D tilt with glare and a shared-element nav indicator.",
    count: 5,
    gradient: ["#ec4899", "#f59e0b"],
  },
  {
    slug: "loaders",
    title: "Loaders & Spinners",
    blurb:
      "Waiting states that feel intentional — orbit spinners, shimmer skeletons and animated progress rings.",
    count: 3,
    gradient: ["#14b8a6", "#84cc16"],
  },
  {
    slug: "transitions",
    title: "Page Transitions",
    blurb:
      "Moving between views. Prismatic section transitions, pixel dissolves, slat wipes, shared-layout tabs, spring modals and a push/pop route stack.",
    count: 6,
    gradient: ["#0ea5e9", "#6366f1"],
  },
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export const totalDemos = categories.reduce((n, c) => n + c.count, 0);
