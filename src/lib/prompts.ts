/**
 * The prompt behind every motion.
 *
 * Each entry is keyed by the demo's path under src/components/demos, which is
 * also how DemoCard finds the source file to show beside it. Keep the two in
 * step: adding a demo means adding a prompt here, or the card renders without
 * one.
 *
 * These are written to be portable — paste one into any coding agent and you
 * should get the same motion back. They describe the mechanism, not the
 * styling, because the mechanism is the part worth keeping.
 */

/** Strips the source indentation so the prompt reads clean in the UI. */
const p = (s: string) => s.trim().replace(/^[ \t]+/gm, "");

const SHARED =
  "React client component, TypeScript, Tailwind, and Motion (`motion/react`). " +
  "Root the component in `absolute inset-0` so it fills whatever box it is given.";

export const prompts: Record<string, string> = {
  // ---------------------------------------------------------------- hero
  "hero/MacDesktopHero": p(`
    Create a macOS-inspired portfolio desktop as a React client component with a
    CSS module. Fill a 700px desktop / 660px mobile stage. Render a procedural
    WebGL wallpaper of slowly flowing powder-blue surfaces. Use a broad curved
    lower boundary and a rounded fold entering from the upper right, with cyan
    light on the faces, soft white edges, peach-pink rim reflections and fine
    static grain. Animate the curves gently with sine functions. Cap rendering
    at 30fps and DPR 1.5, pause when hidden or offscreen, and show a still frame
    with reduced motion. Handle context loss/restoration and provide a static
    CSS gradient fallback. Keep the botanical asset for project thumbnails and
    page content only. Place a translucent menu bar at the top, a live local
    clock, a large editorial serif welcome, a small project image file, four
    blue folder buttons at the right, and a frosted application dock below.
    Single-click Work, About, Notes, or Library to open a separate page window.
    Work opens a botanical project detail; Library links to the existing gallery
    routes. Supply complete editorial content for each page. Use white windows,
    traffic-light controls, a draggable title bar, independent scrolling content,
    and a subtle footer. Support multiple windows, focus stacking, close,
    minimize, dock restore, maximize/restore, and Show desktop. Never duplicate
    an already open page. Use pointer capture for dragging; clamp positions to
    the desktop bounds and reclamp on resize. Support arrow-key title movement,
    Escape to close, accessible dialog labels, visible focus, and focus return.
    Use CSS folder and app icons, no external runtime dependencies. Retain all
    functionality on mobile and skip decorative motion with reduced motion.
    Clean up the clock, observers, frame, listeners and GPU resources on unmount.
    Include the component, CSS, desktop-flow helper and botanical project asset
    when reusing the component.
  `),

  "hero/DarwinNegativeHero": p(`
    Build a minimal botanical hero around a supplied two-path handwriting SVG.
    Preserve its exact 638 by 200 viewBox, Bézier geometry, 14.8883 stroke width,
    and round caps. Draw the first path and then the long connected second path
    from left to right over roughly four seconds using normalized path lengths.
    Stroke it white and apply mix-blend-mode: difference to the vector layer so
    each completed section becomes a true inverted window into the artwork.
    Place it over a dark, grainy photographic-negative floral artwork with tall
    carnation stems with cobalt-blue and lilac petals and muted emerald foliage.
    Use a centered cover crop, 680px desktop and 560px mobile stage heights.

    Generate the original text-free artwork with the built-in image generation
    tool and save it as public/images/darwin-botanical.webp. This asset is required
    alongside the component source; do not bake the wordmark into the image.
    Floral asset prompt: Create a wide 16:9 photographic-negative image of tall
    carnations and closed buds against an almost-black forest-green background.
    Center the ruffled blooms in the upper and middle image, with slender stems
    extending below the frame. Preserve dark space on either side. Use cobalt,
    electric blue, lavender, lilac, and muted emerald, softly textured petals,
    darkroom solarization and restrained analog grain. No text, logo or UI.

    Use one transparent Canvas 2D overlay with a white tapered ribbon and CSS
    mix-blend-mode: difference inside an isolated hero. It must invert both the
    image and the actual DOM lettering. Ease recent pointer positions into a
    smooth filled ribbon, 36–90px wide, fading out within 800ms. Add slight floral
    parallax. After image and font loading, coordinate the pen writing with a
    Canvas 2D pixel-character decode of the entire floral image and dark space.
    Sample image colors in a small grid. Resolve changing glyphs and pixel cells
    into the photograph over three seconds; retain a subtle stable character
    texture. Keep the opening background cool blue-green. Once the handwriting
    completes, hand off seamlessly to a second transparent Canvas 2D layer.
    Draw the inverted floral image through the supplied vector paths using
    source-in compositing and freeze that completed masked word into an offscreen
    canvas. Scale the single masked snapshot from 1x to 80x over 1.85 seconds
    around a point lying directly on the long stroke, so the flower texture stays
    attached to the same parts of the lettering throughout the zoom. Do not
    crossfade or switch the background. Counters and open dark spaces continue
    to show the original green-blue artwork until the expanding stroke physically
    pushes them outside the viewport; the final frame is filled naturally by the
    same masked negative image. Before the zoom settles into a held full-negative
    frame, hand off directly to a warm ivory-white screen with a fast 200ms fade.
    Show no title — only this exact copy, centred, all of it in one size of the
    italic display serif a step below title size: “Welcome. You made it. Nothing particularly
    exciting happens here, but we felt like a welcome screen would make the
    whole thing look more professional. Click something, or don’t. Honestly,
    we’re just happy the page loaded.” Keep whole-word wrapping, but split every
    word into individual letter spans with a continuous index across the copy.
    On every showing, hold a blank ivory surface for 450ms, then carve the letters
    into it with dark upper inner edges and white lower rims. Animate depth from
    zero with surface-colored lettering, with a 4ms letter stagger and 900ms
    duration. At 2.5 seconds, begin revealing black ink from randomly scattered
    letters, with a different origin inside each glyph. Shuffle the letters and
    distribute their starts over 4.2 seconds; vary each spread from 1.6–2.6 seconds.
    Animate an irregular 24-point polygon from a collapsed seed through a small
    jagged patch to a shape that fully covers the glyph. Use randomized radial
    distances so the ink edges advance unevenly, with subtle charcoal reflections.
    Generate new origins, edges, durations and order on every showing, in the
    client helper after hydration. Preserve the stationary carved layer underneath.
    The first ink starts only after all empty recesses have formed. Use black ink.
    Keep the completed ink as the resting style so hiding never pops. Keep
    the ivory background visible. Show the copy for a random 12–18
    seconds, gently fade it out for 3–6 seconds, then show it again with a new
    random offset of up to 12px per axis. Pause timers while hidden or offscreen
    and clean them up on disposal. Keep the copy steady with reduced motion.
    Hide the pointer ribbon during this final welcome state. Reduced motion skips
    directly to the completed welcome screen.
    Pointer proximity reactivates local decoding, then settles on exit.
    Stop animation after the trail settles, suspend when offscreen or hidden,
    support touch without blocking vertical scroll, cap DPR at 2, and dispose
    every frame, observer and listener. Reduced motion shows the complete inverted
    wordmark and photograph immediately with all animated effects disabled.
    Use React, TypeScript, a CSS module and a helper; no new runtime dependencies.
  `),

  "hero/AsciiDecodeHero": p(`
    Create a dark editorial hero inspired by Orange Horse: a dense monochrome
    character grid behind an oversized abstract sculptural ribbon, a small serif
    wordmark, bracketed studio copy, and a red condensed four-line headline:
    WHERE / BRAVE MINDS / SHAPE DIGITAL / WORLDS.

    Render a deforming three-dimensional loop with a Canvas 2D depth buffer.
    Project a sampled parametric surface into whole character cells. Occlude the
    background with almost-black cells, then shade the surface with cyan, rose,
    and white glyphs using a cached glyph atlas. Add slow rotation, organic
    deformation, occasional stepped row displacements, and eased pointer parallax.
    Keep the silhouette visibly pixelated; do not use a photograph or video.

    Decode the headline from changing symbols into real letters with staggered
    line delays. Use fixed-width character slots and one accessible final label.
    Include pause/resume and replay controls, responsive container-based type,
    reduced-motion support, capped DPR and frame rate, offscreen/hidden canvas
    suspension, and cleanup for every animation frame, observer, and listener.
    Use React, TypeScript, a CSS module, and no additional dependencies. Keep the
    renderer in a helper module and root the hero in absolute inset-0.
  `),

  "hero/BlobKidHero": p(`
    Build Blob Kid: a featureless humanoid standing in a warm off-white studio.
    Use a spherical head about 31% of total height, a visible narrow neck,
    sloping shoulders, a pear-shaped torso, symmetrical relaxed arms with mitten
    hands, two separated thick legs, and large rounded feet with soles at Y=0.
    Blend anatomical joints locally so the neck and limb gaps remain clear.

    Model seven seamless analytic signed distance fields: Character, Car,
    Helicopter, Puppy, Building, Tree, and Phone. Give each an immediately
    recognizable rounded silhouette and the same pearl-lavender material,
    cyan left light, peach key, orange floor bounce, and soft contact shadow.
    Use directional illumination rather than a rainbow texture.

    Transform any form into any other over 3.4 seconds. Compress the source,
    smoothly blend its distance field into a wobbling central liquid mass,
    then reform the target with a small settling bounce. Both halves must
    reach exactly the same central field, hiding topology changes without
    mesh swaps or opacity fades. Use one state machine and reject concurrent
    requests. Restore the exact original character when returning to it.

    Add responsive form buttons, current-form state, phase feedback, reset,
    number shortcuts 1–7, drag and arrow-key orbit, pinch and button zoom, and
    true orthographic front, side, rear, and top inspection views. Preserve
    the camera during transitions. Animate subtle form-specific idles only
    in the presentation view; keep inspection views still. Respect reduced
    motion with immediate user-requested changes and no idle movement.

    Compile every form before enabling controls. Include a loading state and
    recoverable WebGL errors. Cap DPR, adapt resolution to sustained frame
    cost, skip rays outside the bounding sphere, pause when hidden or offscreen,
    and dispose all GPU resources, observers, and listeners on unmount.

    ${SHARED} Raw WebGL2, no additional dependencies. Keep the form state,
    shader definitions, renderer lifecycle, and React controls in modules.
  `),

  "hero/ScatteredMediaHero": p(`
    Build a hero section where a ring of media thumbnails is scattered around a
    centred wordmark. Assign each thumbnail one of three depth values. Every
    thumbnail drifts continuously on its own slow loop, and on pointer move the
    whole constellation swings — offset scaled by depth, so near tiles travel
    further than far ones. Smooth the pointer offset through a spring rather
    than applying it raw, and keep idle drift and pointer parallax on separate
    transforms so they compose instead of fighting.

    ${SHARED}
  `),

  "hero/SpotlightHero": p(`
    Build a hero with a radial-gradient spotlight that follows the pointer over
    a faint grid. Track the pointer with two motion values and compose them into
    the gradient with a motion template rather than re-rendering on every move.
    The grid is masked by the same spotlight, so it only exists where the light
    falls. The headline rises into place once on mount and does not react to the
    pointer.

    ${SHARED}
  `),

  "hero/GradientMeshHero": p(`
    Build a hero backdrop of three large, heavily blurred colour blobs, each on
    its own keyframe loop with a different duration so they never resynchronise.
    Float a frosted glass panel over them using backdrop-filter, with the
    headline inside it. Animate position and scale only — never the blur radius,
    which cannot be composited.

    ${SHARED}
  `),

  "hero/SplitRevealHero": p(`
    Build a hero that opens with two solid panels meeting at a centre seam. On
    mount they retract to the left and right edges, and once they are clear the
    headline scales down slightly into focus behind them. Drive the panels and
    the headline off one staggered delay chain with a strong ease-out curve, so
    the sequence reads as one gesture rather than two animations.

    ${SHARED}
  `),

  // --------------------------------------------------------------- intro
  "intro/ParticleAssemble": p(`
    Build a picture that forms out of dust.

    Reduce the picture to a grid of ink cells first — decode the image, sample
    it down to around 120 columns and threshold it through an 8x8 Bayer matrix, so tone is carried by
    how many cells survive in a neighbourhood rather than by any grey. Those
    cells are the particles.

    Give every particle a start away from home: push it out along its own line
    from the centre of the picture, by a random distance around 40% of the
    picture's width, with the angle jittered so the cloud is loose rather than a
    clean explosion. Pushing along its own line matters — the cloud keeps the
    picture's silhouette instead of collapsing to a disc. Start it transparent
    and at about half size.

    Over the run, each particle eases home on an ease-out cubic while its start
    offset is rotated by an angle that unwinds to zero, so it spirals in rather
    than running straight down its radius. Fade it up and grow it to full size
    as it arrives, and add a turbulence keyed off the particle's own phase that
    is strongest at the start and gone by the time it lands. Stagger departures
    with a per-particle delay — blend random order with radial distance from the
    centre so you can dial between dust and a spreading wave — but scale the
    remaining window so everything still lands together at the end.

    Store every offset in units of the picture's width, so a resize moves the
    particles with the picture instead of changing the shape of the motion. Run
    it once when the stage comes into view, stop asking for frames when it
    lands, and under prefers-reduced-motion paint the finished picture instead
    of animating it in.

    ${SHARED} One requestAnimationFrame loop writing straight to a canvas; there
    is no per-particle DOM here.
  `),

  "intro/CounterPreloader": p(`
    Build a full-bleed preloader that counts from 0 to 100. Animate a single
    numeric motion value and derive the displayed text from it, rather than
    setting state 100 times. When the count lands, the whole loader lifts off
    the page it was covering and unmounts through an exit animation, revealing
    the content underneath.

    ${SHARED}
  `),

  "intro/CurtainReveal": p(`
    Build an intro where six full-height columns cover the stage and then clear
    it one after another, wiping the content in behind them. Use a per-column
    stagger and an ease-in-out quart curve so the columns accelerate off the
    stage. The content underneath is already mounted — the columns only uncover
    it.

    ${SHARED}
  `),

  "intro/LogoDrawIntro": p(`
    Build an intro where an SVG mark draws itself: animate pathLength from 0 to
    1 on each stroke, with a small stagger between them. When the drawing
    finishes, hand off to a wordmark whose letters rise out of individual
    overflow masks. The handoff should be one continuous sequence, timed off the
    draw duration.

    ${SHARED}
  `),

  // ---------------------------------------------------------------- text
  "text/GlitchOnHover": p(`
    Build a headline that glitches while the pointer is over its container.
    Stack about ten absolutely positioned copies of the same text, each clipped
    to its own horizontal band or block with clip-path, each displaced by its
    own offset and blend mode. Randomise the offsets and clip windows on a
    single requestAnimationFrame loop writing to motion values — never to React
    state — and freeze the stack back to a clean single copy on pointer out.

    ${SHARED}
  `),

  "text/StaggerWords": p(`
    Build a headline that arrives word by word. Split the string on spaces, wrap
    each word in an overflow-hidden span, and animate the inner span up from
    below its own mask. Drive it with parent/child variants and staggerChildren
    rather than per-word delays, so the timing stays declarative.

    ${SHARED}
  `),

  "text/ScrambleText": p(`
    Build a text scramble: every glyph cycles through random characters until
    its index settles, left to right. Run the whole thing on one
    requestAnimationFrame loop with no animation library — track a settle index
    against elapsed time and rebuild the string each frame. Preserve spaces and
    keep the layout from shifting while it runs.

    ${SHARED}
  `),

  "text/MaskedLineReveal": p(`
    Build an editorial line reveal: each line of a paragraph sits inside its own
    overflow-hidden wrapper and enters by sliding up while un-rotating from a
    few degrees, so the line appears to swing into place from behind the mask.
    Stagger the lines, and set the transform origin at the leading edge so the
    rotation pivots there.

    ${SHARED}
  `),

  "text/GradientShine": p(`
    Build a heading with a light sweeping through the glyphs. Clip an oversized
    multi-stop gradient to the text with background-clip: text and transparent
    fill, then pan backgroundPosition on an infinite linear loop. The gradient
    must be wide enough that the wrap point never lands inside the visible text.

    ${SHARED}
  `),

  // ------------------------------------------------------------ carousel
  "carousel/GrayscaleFilmstrip": p(`
    Build a horizontal filmstrip where each frame is first struck as a vertical
    hairline and then opens horizontally into the full image, driven by an
    animated clip-path inset with a per-frame stagger. The whole strip pans with
    pointer position across the container. Frames sit in grayscale by default
    and only the hovered one takes on colour.

    ${SHARED}
  `),

  "carousel/InfiniteMarquee": p(`
    Build a seamless marquee. Render the list twice inside one track and animate
    the track to -50% on an infinite linear loop — at the wrap point the second
    copy is exactly where the first started, so the seam is invisible. Pause on
    hover, and fade both edges with a mask-image gradient instead of overlaying
    solid blocks.

    ${SHARED}
  `),

  "carousel/DragCarousel": p(`
    Build a pointer-dragged track with elastic edges: constrain dragging to the
    measured overflow width, allow it to rubber-band past the ends, and hand off
    to inertia on release so the track keeps travelling and settles. Measure the
    constraints from the DOM rather than hard-coding them, and re-measure on
    resize.

    ${SHARED}
  `),

  "carousel/FadeStackCarousel": p(`
    Build an auto-advancing crossfade carousel: slides stacked on top of each
    other, advancing every four seconds, the outgoing slide leaving as the
    incoming one arrives. Give each slide a progress bar that fills over the
    dwell time. Hovering pauses both the timer and the bar, and the timer resets
    cleanly when the slide changes by any route.

    ${SHARED}
  `),

  // -------------------------------------------------------------- scroll
  "scroll/CinematicTunnel": p(`
    Build a scroll-driven fly-through down a corridor of screens. Lay the panels
    out in CSS 3D on a preserve-3d stage with perspective, and map scroll
    progress to translateZ so the camera advances between them. Drive the motion
    blur from scroll *velocity*, not position, so hard scrubbing smears the
    corridor while the panel titles stay sharp.

    ${SHARED} The stage owns its own scroll container so it works inline without
    hijacking the page.
  `),

  "scroll/StickyMediaSections": p(`
    Build a pinned media column beside text that advances with the scrollbar.
    The clip column sticks while the copy scrolls; each new clip pushes the
    previous one out vertically rather than crossfading. Subscribe to scroll
    progress with a motion value event to pick the active index, and decode the
    heading into place on each change.

    ${SHARED} The stage owns its own scroll container.
  `),

  "scroll/RisingImageCards": p(`
    Build a row of cards climbing out of the bottom edge as you scroll, each at
    its own rate so the row holds a fan shape at every scroll position. Inside
    each card, counter-drift the artwork against the card's own travel so the
    image parallaxes within its mask.

    ${SHARED} The stage owns its own scroll container.
  `),

  "scroll/ParallaxLayers": p(`
    Build a three-layer parallax scene from one scroll progress value: sky,
    mid-ground and foreground each mapped to a different travel distance, with
    a title that rises and fades out over the first part of the scroll. One
    scroll source, several transforms — not three separate scroll listeners.

    ${SHARED} The stage owns its own scroll container.
  `),

  "scroll/RevealOnView": p(`
    Build rows that fade, rise and un-blur as they cross into view. Trigger on
    viewport entry with a once-only in-view animation, scoped to the scrolling
    container rather than the window, and use a negative viewport margin so the
    reveal fires slightly before the row reaches the edge.

    ${SHARED} The stage owns its own scroll container.
  `),

  "scroll/HorizontalScrollSection": p(`
    Build a pinned section where vertical scroll is remapped to horizontal
    travel: the stage sticks while a wide track translates on x, driven by
    scroll progress through a runway tall enough to cover the track's full
    width. Compute the travel from the measured track width so it always ends
    flush.

    ${SHARED} The stage owns its own scroll container.
  `),

  "scroll/DitheredScrollPhoto": p(`
    Build a photograph that develops as you scroll, like a darkroom print
    coming up in the tray.

    Decode a JPEG, then sample it down to a coarse grid — around 140 columns — and convert
    each cell to luminance. Turn luminance into an ink density with a gamma
    curve, drop anything under a dark cut-off so the background stays empty, and
    treat anything above a highlight ceiling as bare paper. Threshold the
    density against an 8x8 Bayer matrix, so tone is carried purely by how many
    squares survive in a neighbourhood — no greys anywhere. Multiply density by
    a smoothstep that falls to zero over the bottom quarter of the image, so the
    print dissolves into the paper at its lower edge.

    Give every surviving cell its own random threshold in [0, 0.62] from a
    deterministic hash of its coordinates. Map scroll progress through a spring,
    then paint: a cell fades in over a narrow window once progress passes its
    threshold. The spring is what makes it read as developing — cells keep
    coming up for a beat after the scroll stops instead of snapping to the
    scrollbar.

    Build the cell list once; on resize only recompute the square size and
    repaint, and scale the backing store by devicePixelRatio. Under
    prefers-reduced-motion, keep developing but drop the spring and read scroll
    progress directly — the scroll is the user's own gesture, so what has to go
    is motion that continues after they stop, not the effect itself.

    ${SHARED} The stage owns its own scroll container and holds nothing but
    the print — centred, no copy, no chrome.
  `),

  // --------------------------------------------------------------- hover
  "hover/HoverIndexList": p(`
    Build an editorial index where hovering a row swaps a preview panel beside
    it. The incoming panel wipes in with an animated clip-path from whichever
    direction the pointer travelled through the list — compare the new index
    against the previous one to pick the direction — and the outgoing panel
    leaves the same way. Track the last hovered row so the panel does not reset
    when the pointer leaves.

    ${SHARED}
  `),

  "hover/ParticleShapeField": p(`
    Build a pixel shape that scatters like air under the cursor.

    Draw a shape — a disc, say — once into a small offscreen grid, around 60
    cells across, and turn every filled cell into a particle that remembers its
    home cell and carries a random phase. Each frame, measure each particle
    against an eased cursor position: take an influence that falls linearly to
    zero at a reach of about a third of the shape's width, then square it so the
    falloff is soft at the edge and steep at the centre.

    Influence drives three things at once — a radial push directly away from the
    cursor, a two-octave sine/cosine turbulence keyed off the particle's own
    phase so neighbours never drift in lockstep, and a constant upward bias,
    because air rises. Ease each particle toward that target by a small fraction
    per frame rather than setting it, which is what makes the field read as
    smoke instead of a shockwave, and what makes it drift home slowly when the
    cursor leaves. Shrink each particle as its influence rises so the cloud
    thins as it disperses.

    Size every distance off the shape's own width, not the canvas, so the feel
    survives a resize. Leave margin around the shape for particles to disperse
    into. Nothing should move at rest — influence is zero away from the cursor —
    and under prefers-reduced-motion keep the push but drop the turbulence, so
    nothing oscillates on its own.

    ${SHARED} Drive it with one requestAnimationFrame loop writing straight to a
    canvas; there is no per-particle DOM here.
  `),

  "hover/MagneticButton": p(`
    Build buttons that lean toward the pointer. On pointer move within a
    threshold, offset the button by a fraction of the distance from its centre;
    smooth the offset through a spring and release to zero on pointer out. Give
    the label a smaller fraction than the button body so it trails slightly
    behind.

    ${SHARED}
  `),

  "hover/TiltCard": p(`
    Build a card that tilts in 3D toward the pointer. Map normalised pointer
    position within the card to rotateX and rotateY on a perspective parent with
    preserve-3d, smoothing both through springs. Drive a glare highlight from
    the same two values so the specular moves with the tilt rather than lagging
    it, and reset on pointer out.

    ${SHARED}
  `),

  "hover/PillNav": p(`
    Build a nav where a pill glides between items. Use two shared-layout ids —
    one pill for the hovered item, one for the selected item — so both animate
    independently and can be in different places at once. Spring the layout
    transition, and make sure the labels stay above both pills.

    ${SHARED}
  `),

  // ------------------------------------------------------------- loaders
  "loaders/SpinnerSet": p(`
    Build four loading indicators side by side — an orbit, a wave, an arc and a
    set of bars. Every one animates transform and opacity only, so they all stay
    on the compositor. Use infinite repeats with per-element delay staggers, and
    no layout-affecting properties anywhere.

    ${SHARED}
  `),

  "loaders/ProgressRing": p(`
    Build an SVG progress ring driven by strokeDashoffset from a single motion
    value, with a numeric percentage readout subscribed to that same value via
    its change event rather than to React state. Rotate the circle so the ring
    starts at twelve o'clock.

    ${SHARED}
  `),

  "loaders/ShimmerSkeleton": p(`
    Build a skeleton loading state: placeholder blocks with a highlight
    gradient sweeping across them on an infinite loop, each line delayed
    slightly against the one above so the sweep reads as a diagonal. Animate
    transform on the highlight rather than the block, so nothing relayouts
    while the placeholder is on screen.

    ${SHARED}
  `),

  // --------------------------------------------------------- transitions
  "transitions/PixelDissolve": p(`
    Build a frame-to-frame transition made of a tile grid — roughly 32 by 14 —
    that assembles the incoming image along a diagonal front. Each tile carries
    its own slice of the incoming frame as a blown-up background image offset to
    that cell, so at full scale the tiles reassemble the picture exactly: the
    image builds out of the mesh instead of being uncovered behind it.

    Scale each tile from 0 to 1 with a delay taken from its normalised diagonal
    position, so the front holds a constant angle whatever the stage aspect.
    Compute the completion time arithmetically from the sweep and tile duration
    rather than waiting on callbacks from hundreds of elements, and remount the
    grid to reset it.

    ${SHARED}
  `),

  "transitions/SlatTransition": p(`
    Build a slat wipe: vertical columns sweep down to cover the stage, the view
    swaps while it is hidden, then the same columns keep travelling in the same
    direction to uncover it. One continuous pass — not a curtain that reopens.
    Drive it with an explicit phase machine (idle, covering, swapping,
    uncovering) and remount to reset the columns between passes.

    ${SHARED}
  `),

  "transitions/SharedLayoutTabs": p(`
    Build tabs with a shared-layout underline that glides between them, and a
    panel that swaps on change. Use wait mode so the outgoing panel finishes
    leaving before the next enters, and key the panel by tab id so the exit
    actually runs.

    ${SHARED}
  `),

  "transitions/ModalTransition": p(`
    Build a modal: backdrop fades in with a blur, dialog arrives on a spring
    from slightly under full scale. Dismiss on backdrop click or Escape, and
    animate the exit rather than unmounting flat. Keep the click handler off the
    dialog itself so clicks inside do not close it.

    ${SHARED}
  `),

  "transitions/RouteStack": p(`
    Build a push/pop view stack where the enter and exit offsets flip with
    direction. Store the direction alongside the index and pass it into custom
    variants, so pushing slides the new view in from the right while popping
    brings the previous one back from the left. Use pop layout so the outgoing
    view leaves the flow immediately.

    ${SHARED}
  `),
};

export function getPrompt(id: string): string | undefined {
  return prompts[id];
}
