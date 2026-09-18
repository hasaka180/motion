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
`OPENAI_MODEL`, default `gpt-5.6-sol`) set on the host. Without the key the route
answers 501 and the importer shows a persistent error without saving a fake
completed template. Reference generation requires a server deployment. Astra
model overrides are excluded; the route falls back to `gpt-5.6-sol`.

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
| `/text`        | Text Animations            | 6     |
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
A deck is a brand — six palette slots, extra swatches, four type roles, an optional
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

To create a template, drop PDFs, page images or contact sheets onto the first
dashboard card. PDF.js enumerates every PDF page. Image page boundaries are
read by the model with a local gutter scan as a hint, then cropped from the
original pixels before resizing for analysis. A source inventory makes page
counts reviewable; original page order and repeated sections are preserved.

The model studies all source pages in batches and records margins, grids,
running heads, image direction, colour rhythm and substitute font choices.
Each source page is reconstructed independently, preserving per-block fonts,
weights, leading, tracking, rotation, thin rules and paint order. Source photos
and logos are cropped into replaceable image blocks. Unreadable text is marked
rather than fabricated. Non-16:9 sources are fitted proportionally onto the
1600×900 canvas, with a warning in the report.

Missing sections are designed individually from the measured style, related
source images, their editable layouts and the final page inventory. The
24-section checklist includes foundations, values, voice, logo variants and
misuse, palettes, monochrome, colour combinations, type hierarchy, grids,
photography, applications and digital layouts. Added guidance is identified as
a draft. Subject-matched placeholder photos ship locally, avoiding random
remote images. Their source URLs are in `public/images/guidelines/README.md`.
The report records recreated/added pages, absent sections and review notes.
Text overflow is checked after loading substitute fonts.

The API key remains server-side. Reference images are sent to the configured
OpenAI model through `/api/trace`. Calls use strict schemas, bounded image
payloads and retries for transient failures. Successful analyses are cached
in memory for the session, so retrying the same files reuses completed work.
No partial or local-only trace is passed off as a completed template.

Autosave is on by default. Image-heavy decks and templates are stored in
IndexedDB; existing localStorage decks are loaded on the first migration.
Turn autosave off to save by hand. Export JSON to back up or transfer decks;
print-to-PDF uses the same slide renderer. Reference underlays never print.
Cropped source logos must be replaced when adapting a template to a new brand.

`npm run test:guidelines` runs the browser regression suite against a running
local development server (or `TEST_BASE_URL`). Install Chromium once with
`npx playwright install chromium`. The suite uses controlled model responses
and tests real PDF rendering, source preservation, completion, typography,
missing-key errors and persistence without spending API credits. It does not
measure live-model reconstruction accuracy.

### All Things Go reference template

The Guidelines dashboard includes **All Things Go**, a hand-built, 24-page
template based on the two supplied festival contact sheets. It recreates the
visible overview, lineup, community collage, audience dashboard, digital reach,
press clippings, artist quotes, partner grid and campaign treatments, then adds
matching brand guidance and social layouts. Partially visible source pages are
interpreted, not claimed as exact transcriptions. Sample metrics, artist names
and editorial copy are editable examples.

Each photo has a local default placeholder. Click an image or icon, including
photos inside social layouts, to browse a replacement. Drag moves it;
Shift-click selects it without opening the browser. The inspector includes
image crop positioning, monochrome treatment, nine vector icons, rotation and
opacity. Icon uploads can be restored to a default vector in the inspector.

Page backgrounds and shapes support mesh, linear, radial and edge-glow
gradients, three editable colour stops, direction and grain. Changes persist
with the deck and its JSON export. Social square posts and 9:16 story layouts
can also be added using the page controls. All are editable blocks on the
existing 1600×900 document canvas. The condensed and script fonts are bundled
locally with their OFL licences. This template requires no API generation.

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
