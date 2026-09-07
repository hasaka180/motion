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
  "hero/BlobKidHero": p(`
    Build a hero background: a soft toy character — a blob kid — walking a
    bright studio, following the pointer, and playing when left alone.

    Do not model it as a mesh. Build the body as a signed distance field of
    about thirteen capsules and raymarch it in a single fullscreen fragment
    shader, welding the capsules with a polynomial smooth-minimum at around
    0.08. That smooth-min is the character: it fuses the arms into the torso
    and the feet into the shins with a soft crease rather than a seam, which is
    what makes it read as one moulded toy. Watch the radii against the spacing
    — limbs closer together than their radii will weld into a single mass.

    Toy proportions: an enormous spherical head about a third of the total
    height, no neck, a rounded trunk, short thick arms hanging at the sides and
    stubby legs ending in blunt feet.

    Light it like a studio, in three colours. A warm key from above and in
    front, a cyan fill from the left, and a saturated orange bounce off the
    floor whose strength falls off exponentially with height, so it only
    reaches the legs and feet — that last one is what makes the feet glow.
    Sit it on a near-white gradient with a soft contact shadow and a warm
    bounce on the floor beneath it. Add a wide soft specular and a gentle
    fresnel rim, or it will not separate from a white room.

    Pose the field from a skeleton: compute bone matrices on the CPU and send
    the shader only each capsule's two endpoints and radius, so it knows
    nothing about walking. Drive the pose from a flat array of joint angles so
    two poses can be blended. Write a procedural walk cycle — opposed hips and
    shoulders, a knee that bends on the back swing, a bob at twice the stride —
    and idle activities: a hop with tucked knees, a spin with the arms out, a
    wave. Ease every joint toward its target so changing behaviour is a
    transition rather than a cut. Turn side-on while travelling, and back to
    face the viewer when it stops.

    Raymarch below native resolution — the field is soft, so it costs almost
    nothing visually — and skip the march entirely for rays that miss a
    bounding sphere around the body.

    ${SHARED} Raw WebGL2, no 3D library: one triangle and one shader.
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
