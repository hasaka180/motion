# Story Studio

Open `/story` in the Next.js app, or serve this folder over HTTP and open
`index.html`. No remote resources are needed at runtime.

Use the Animation selector to switch between two independent ten-second scenes.
Both support 9:16 and 3:4 layouts, timeline scrubbing, stills and video exports.

## A thought, rendered

The two layouts share one deterministic ten-second animation: a gentle camera
orbit, traveling tile waves, drifting stars, a character-decoding title, and a
delayed subtitle. Both start and end on the same background pose.

- Story: 1080 × 1920 (9:16).
- Portrait: 1080 × 1440 (3:4).
- Title: Instrument Serif 400 and Handjet Regular 400.
- Subtitle: Helvetica Now Display Regular.

The white title is left-aligned: `WHAT IF IT` on the first line and
`COULD EXIST?` on the second. Only `EXIST?` uses Handjet, with its capital height
matched to the serif. The subtitle sits below with a slight optical inset.
Dunes use reflective crimson highlights over plum shadows with no uniform
emission, preserving the dark landscape in the supplied reference.

## The first touch

Open `/story?scene=creation` directly, or choose **02 — The first touch**.
This scene uses the supplied Renaissance/cyborg collage without a text overlay.
The hands reach into fingertip contact around the midpoint, then release. The
preview includes a shortcut to that pose. Background and foreground cloud banks
drift at different rates; flower clusters sway; ten detached petals float and
rotate on individual paths. The figures, hair, beard, fabric, cliff, foliage and
lime arc have subtle local motion. The first and last frames are identical.

`creation.js` applies local WebGL deformation fields to the flattened artwork.
`creation-petals.js` separates the loose petals into rigid sprites in memory and
fills the small vacated regions from surrounding pixels. This is an authored
2D living-painting animation, not a generated video or a reconstructed 3D scene;
details hidden behind moving petals are approximated locally. Everything runs
in the browser, with no runtime upload or generation service. The 3:4 version
retains the whole composition and extends parchment at the sides.

## Controls and exports

The controls switch formats, play/pause, replay, scrub the timeline, save the
current frame as a PNG, and record the complete animation as a silent video.
Video export uses the browser's MediaRecorder: MP4 when supported, otherwise
WebM. Recording takes ten seconds and needs the tab to remain visible; switching
away interrupts the export with a retry message. Videos use a 30 fps capture
target and 14 Mbps encoding; achieved cadence depends on device performance.
Reduced-motion preferences start the preview paused on the settled title.

`story.js` owns scene composition, motion, type placement, and exports.
`index.html` owns the preview interface. `window.renderStory(seconds, format)`
renders any point deterministically; `?capture` disables preview playback.

## Asset provenance

- `assets/dream-scene.glb`: the original Darwin hero scene retrieved from
  https://thedarwin.co/assets/dream/dream-scene.glb on 2026-09-17.
- Instrument Serif: the Latin webfont served by that hero.
- Handjet Regular 400: the official Google Fonts static TrueType font.
- Helvetica Now Display: the user's installed local font, copied for this project.
- `assets/creation-source.png`: the user's supplied
  `ChatGPT Image Sep 17, 2026, 02_00_07 AM.png`, preserved unchanged.
- `vendor/`: Three.js 0.186.0 and the GLTF loader/lighting utilities, distributed
  under the included MIT license. Relative utility imports are adjusted for this
  standalone folder. Keep `three.module.js` and `three.core.js` at the same version.

The scene lighting and tile field follow the supplied hero reference; the story
framing, looping motion, title choreography, and export interface are authored
for this deliverable.
