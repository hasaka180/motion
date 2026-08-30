# Darwin

A categorised repository of production-ready React animations, by
[thedarwin.co](https://thedarwin.co). Every demo is a single self-contained
file — open the page, hit **Replay**, then copy the source.

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
| `/scroll`      | Scroll Animations          | 6     |
| `/hover`       | Hover & Micro-interactions | 4     |
| `/loaders`     | Loaders & Spinners         | 3     |
| `/transitions` | Page Transitions           | 5     |

## Structure

```
src/
├── app/
│   ├── layout.tsx              root shell — sidebar + fonts + metadata
│   ├── page.tsx                home: intro + category grid
│   └── (gallery)/              one folder per category, all sharing a container
│       └── <slug>/page.tsx     imports its demos, wraps each in <DemoCard>
├── components/
│   ├── site/                   chrome: Sidebar, DemoCard, PageHeader, home bits
│   └── demos/
│       ├── shared/             MediaTile + the CSS-gradient poster set
│       └── <category>/         the animations themselves, one file each
└── lib/
    ├── categories.ts           single source of truth for nav, home grid, headers
    └── site.ts                 brand name, tagline and the thedarwin.co origin
```

### Two conventions worth knowing

**`DemoCard` owns the replay.** Each demo renders into a fixed-size stage. The
replay button bumps a `key` on that stage so the subtree remounts — the only
reliable way to re-fire an entrance animation.

**Demos are absolutely positioned.** Every demo component starts with
`absolute inset-0` and fills whatever stage it is given, so the same component
drops into a real page section unchanged.

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
2. Import it in `src/app/(gallery)/<category>/page.tsx` and wrap it in a
   `<DemoCard>` with a title, description and `tags`.
3. Bump `count` for that category in `src/lib/categories.ts`.

## Adding a category

1. Add an entry to `categories` in `src/lib/categories.ts` (slug, title, blurb,
   count, gradient). The sidebar, home grid and page header all read from it.
2. Create `src/app/(gallery)/<slug>/page.tsx` following any existing page.
3. Create `src/components/demos/<slug>/` for its demos.
