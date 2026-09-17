# Darwin

A categorised repository of production-ready React animations, by
[thedarwin.co](https://thedarwin.co). Every motion ships with two things beside
it: the **prompt** that produces it and the **code** that runs it. Open the
page, hit **Replay**, then copy whichever one you need.

Most demos are a single self-contained file. The pixel demos are the exception:
they share their maths with the studio and with the code it generates, so it
only exists once — see `src/lib/dither.ts`, `particleField.ts` and
`assembleField.ts`. They work on a real photograph (`public/photo.jpg`), decoded
the same way the studio decodes an upload.

Built with **Next.js 16** (App Router), **Tailwind CSS v4** and **Motion**.

## Deployment

Darwin is intended to run on a subdomain of `thedarwin.co`. The origin is read
from `NEXT_PUBLIC_SITE_URL` (see `.env.example`) and feeds `metadataBase` plus
the Open Graph tags — set it to the real subdomain before deploying:

```bash
NEXT_PUBLIC_SITE_URL=https://motion.thedarwin.co
```

Everything else is static — `next build` prerenders every page — with one
exception: `/api/trace`, the route the Guidelines Builder uses to read
reference images with a vision model. It needs `OPENAI_API_KEY` (and optionally
`OPENAI_MODEL`, default `gpt-4o`) set on the host. Without the key the route
answers 501 and the builder falls back to tracing locally. So: any static host
serves the site; a Vercel project with the key set serves the model too.

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
| `/hero`        | Hero Sections              | 11    |
| `/intro`       | Intro Animations           | 4     |
| `/text`        | Text Animations            | 5     |
| `/carousel`    | Carousels                  | 4     |
| `/scroll`      | Scroll Animations          | 7     |
| `/hover`       | Hover & Micro-interactions | 5     |
| `/loaders`     | Loaders & Spinners         | 3     |
| `/transitions` | Page Transitions           | 6     |

Plus one tool:

| Route      | What it is                                                     |
| ---------- | -------------------------------------------------------------- |
| `/studio`  | Pixel Studio — upload a picture, dither it, take the code       |

(The studio does three effects: scroll-develop, assemble and cursor-scatter.)

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
    ├── assembleField.ts        the dust-assembly model, likewise shared
    ├── dither.ts               image → grid of ink cells, shared by demos + studio
    ├── particleField.ts        the cursor-scatter force model, likewise shared
    ├── pixelExport.ts          code generation for the studio's React/HTML output
    ├── prompts.ts              the prompt behind every motion, keyed by demo id
    └── site.ts                 brand name, tagline and the thedarwin.co origin
```

## Guidelines Builder

`/guidelines` opens on a dashboard: template cards with a live cover — the five
built in and any you have saved — your client decks, and a card that turns
reference images into a template. It builds a brand book per client from one
of those starting points.
A deck is a brand — six palette slots, extra swatches, three faces, an optional
logo — and a list of 1600×900 pages. Pages are laid out against the palette
*slots*, not literal colours, so changing a client's colour changes every page.
Text blocks can carry `{brand}`, `{tagline}`, `{edition}` and `{year}`, which
fill in from the brand.

On a page: drag to move (it snaps to the page's edges and centre and to the
other blocks), corners to resize, double-click text to edit it in place,
shift-click to select several, then align or distribute them from the
inspector. Drop an image on a slot, or anywhere on the page, and it is
downscaled and stored with the deck. Undo covers a whole gesture.

Type is a system, not a per-block choice: the brand carries a face and weight
for H1, H2, H3 and body, and any text block with a role follows it across every
page. Faces are the four the site ships or any Google Fonts family by name,
loaded on demand.

To replicate a reference — a screenshot of a page from another brand book —
drop it on the dashboard's first card, or into the Decks panel of an open deck.
With `OPENAI_API_KEY` set, `/api/trace` has a vision model read the page: every
text block comes back with its actual words and a role, photographs and panels
as boxes, swatches with their hex, and a palette that seeds the brand. Photos
are cropped out of the reference into their slots so the page reads at once.
Without a key the local tracer runs instead — layout only, placeholder text —
and the builder says which happened. Either way the reference stays under the
page to rebuild against and never prints. Save the deck as a template and it
appears beside the built-in ones for the next client.

Autosave is on by default and stamps the top bar with the time of the last
save. Turn it off to work in memory and save by hand; the tab then warns
before closing with unsaved changes.

Decks live in `localStorage` and never leave the browser. Export is a JSON file
— hand it to a colleague, who imports it — and the browser's own print-to-PDF,
which prints every page at its native size using the same renderer the editor
uses. The model is `src/components/guidelines/types.ts`; the starter decks are
`templates.ts`.

## Pixel Studio

`/studio` is the one page here that is a tool rather than a demo. Drop in a
picture and it is sampled to a coarse grid and thresholded through an 8×8 Bayer
matrix, so tone is carried by how many cells survive in a neighbourhood rather
than by any grey. Each surviving cell takes its own threshold from a hash of its
coordinates, and scroll progress sweeps past them — which is why the picture
comes up in grain instead of fading in.

In colour mode each cell keeps the colour of the pixel it came from, so what
forms is the photograph itself rather than a one-ink stencil of it. Those
colours are quantised to a few hundred entries and the cells are sorted by
palette entry, so painting sets `fillStyle` once per colour instead of once per
cell — with tens of thousands of particles that is what keeps it at 60fps.
Turning colour off gives the 1-bit Bayer dither instead.

Nothing is uploaded anywhere: the file is read in the browser, and the image
travels inside the generated code as a data URI. It is re-encoded to at most
640px first, because the grid only needs a few hundred columns — that keeps a
pasted export in the tens of KB rather than the megabytes.

Those cells then drive one of three effects, and switching does not re-dither
anything — the Print controls mean the same thing in every mode:

- **Scroll develop** — each cell takes its own threshold from a hash of its
  coordinates and scroll progress sweeps past them, so the picture comes up in
  grain instead of fading in.
- **Assemble** — each cell starts thrown out from the centre along its own line,
  transparent and small, then spirals home while fading up and growing, with a
  turbulence that dies as it lands. Departures are staggered, so the picture
  resolves out of noise rather than sliding into place. It runs once, when the
  section comes into view.
- **Cursor scatter** — each cell becomes a particle that remembers where it
  belongs. The cursor pushes the nearby ones out, stirs them with a turbulence
  keyed off each particle's own phase, and lifts them; every particle eases
  toward that target rather than being set to it, which is what makes it read as
  smoke rather than a shockwave, and why it drifts home when you leave.

Two outputs per effect — six in all, every one self-contained:

- **React** — a `.tsx` client component with no dependency beyond React. The
  develop lag is a hand-rolled lerp, not a spring, so there is nothing to
  install. It typechecks under `strict`.
- **HTML** — one block of markup, CSS and script for a page that is not running
  React.

The develop exports drive off window scroll over a section that pins its own
stage; the scatter and assemble exports are a block that fills its container,
one listening for the pointer and the other for coming into view. Either way the preview in the studio runs the same maths the export
does — the same lerp, the same force model — so what you scrub is what you ship.

The maths lives in `src/lib/dither.ts`, `src/lib/particleField.ts` and
`src/lib/assembleField.ts`, shared by the studio, the `/scroll`, `/hover` and
`/intro` demos and the generated code, so there is only ever one implementation
of each.

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
