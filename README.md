# Darwin

A categorised repository of production-ready React animations, by
[thedarwin.co](https://thedarwin.co). Every demo is a single self-contained
file, and every motion ships with two things beside it: the **prompt** that
produces it and the **code** that runs it. Open the page, hit **Replay**, then
copy whichever one you need.

Built with **Next.js 16** (App Router), **Tailwind CSS v4** and **Motion**.

## Deployment

Darwin is intended to run on a subdomain of `thedarwin.co`. The origin is read
from `NEXT_PUBLIC_SITE_URL` (see `.env.example`) and feeds `metadataBase` plus
the Open Graph tags — set it to the real subdomain before deploying:

```bash
NEXT_PUBLIC_SITE_URL=https://motion.thedarwin.co
```

Everything else is static: `next build` prerenders all ten routes, so any
static host or a Vercel project pointed at the subdomain will serve it.

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```

## Categories

| Route          | Category                   | Demos |
| -------------- | -------------------------- | ----- |
| `/hero`        | Hero Sections              | 4     |
| `/intro`       | Intro Animations           | 3     |
| `/text`        | Text Animations            | 5     |
| `/carousel`    | Carousels                  | 4     |
| `/scroll`      | Scroll Animations          | 7     |
| `/hover`       | Hover & Micro-interactions | 5     |
| `/loaders`     | Loaders & Spinners         | 3     |
| `/transitions` | Page Transitions           | 5     |

Plus one tool:

| Route      | What it is                                                     |
| ---------- | -------------------------------------------------------------- |
| `/studio`  | Pixel Studio — upload a picture, dither it, take the code       |

## Structure

```
src/
├── app/
│   ├── layout.tsx              root shell — sidebar + fonts + metadata
│   ├── page.tsx                home: intro + category grid
│   └── (gallery)/              one folder per category, all sharing a container
│       └── <slug>/page.tsx     imports its demos, wraps each in <DemoCard>
├── components/
│   ├── site/                   chrome: Sidebar, DemoCard/DemoFrame, PageHeader
│   └── demos/
│       ├── shared/             MediaTile + the CSS-gradient poster set
│       └── <category>/         the animations themselves, one file each
│   └── studio/                 Pixel Studio — the upload-and-export tool
└── lib/
    ├── categories.ts           single source of truth for nav, home grid, headers
    ├── dither.ts               the scroll-develop dither, shared by demo + studio
    ├── pixelExport.ts          code generation for the studio's React/HTML output
    ├── prompts.ts              the prompt behind every motion, keyed by demo id
    └── site.ts                 brand name, tagline and the thedarwin.co origin
```

## Pixel Studio

`/studio` is the one page here that is a tool rather than a demo. Drop in a
picture and it is sampled to a coarse grid and thresholded through an 8×8 Bayer
matrix, so tone is carried by how many cells survive in a neighbourhood rather
than by any grey. Each surviving cell takes its own threshold from a hash of its
coordinates, and scroll progress sweeps past them — which is why the picture
comes up in grain instead of fading in.

Nothing is uploaded anywhere: the file is read in the browser, and the image
travels inside the generated code as a data URI. It is re-encoded to at most
640px first, because the grid only needs a few hundred columns — that keeps a
pasted export in the tens of KB rather than the megabytes.

Two outputs, both self-contained:

- **React** — a `.tsx` client component with no dependency beyond React. The
  develop lag is a hand-rolled lerp, not a spring, so there is nothing to
  install. It typechecks under `strict`.
- **HTML** — one block of markup, CSS and script for a page that is not running
  React.

Both drive off window scroll over a section that pins its own stage, which is
how you would actually use it on a page. The preview in the studio runs the
same lerp the export does, so the Catch-up slider means the same thing in both.

The maths lives in `src/lib/dither.ts` and is shared by the studio, the
`/scroll` demo and the generated code, so there is only ever one implementation
of it.

### Three conventions worth knowing

**`DemoCard` owns the replay.** Each demo renders into a fixed-size stage. The
replay button bumps a `key` on that stage so the subtree remounts — the only
reliable way to re-fire an entrance animation.

**Demos are absolutely positioned.** Every demo component starts with
`absolute inset-0` and fills whatever stage it is given, so the same component
drops into a real page section unchanged.

**Every motion carries its prompt and its code.** `DemoCard` is the server half
of the frame: it takes an `id` like `scroll/ParallaxLayers`, reads that demo's
own source off disk at build time, and looks its prompt up in
`src/lib/prompts.ts`. `DemoFrame` is the client half that renders the stage and
the two panels. Because the code panel is the file itself rather than a copy,
it cannot drift — and because every route is prerendered, the read happens once
at build and nothing touches the filesystem at runtime.

## Media in the demos

The media-led demos (`ScatteredMediaHero`, `GrayscaleFilmstrip`) use
`<MediaTile>` — a stack of CSS gradients plus SVG grain, defined in
`src/components/demos/shared/posters.ts`. That keeps the repo free of binary
assets while still giving the grayscale transitions real colour to act on.
Swap a `<MediaTile>` for an `<img>` or `<video>` and nothing else changes; the
demos only care about the box, not what fills it.

## Adding a demo

1. Create `src/components/demos/<category>/MyDemo.tsx` — mark it `"use client"`
   and root it in `absolute inset-0`.
2. Add the prompt it was built from to `src/lib/prompts.ts`, keyed
   `"<category>/MyDemo"`. Without it the card renders with no Prompt panel.
3. Import it in `src/app/(gallery)/<category>/page.tsx` and wrap it in a
   `<DemoCard>` with `id="<category>/MyDemo"`, a title, description and `tags`.
   The `id` is what finds both the source file and the prompt.
4. Bump `count` for that category in `src/lib/categories.ts`.

## Adding a category

1. Add an entry to `categories` in `src/lib/categories.ts` (slug, title, blurb,
   count, gradient). The sidebar, home grid and page header all read from it.
2. Create `src/app/(gallery)/<slug>/page.tsx` following any existing page.
3. Create `src/components/demos/<slug>/` for its demos.
