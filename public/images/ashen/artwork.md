# Ashen eclipse — photographic frame sequence

The hero uses Canvas 2D to scrub 18 WebP poses (960 × 540) with short dissolves.
There is no 3D renderer or new runtime dependency. The hand rises from 40–65%
of scroll, holds the original open pose until 74%, then lowers and settles by 98%.

- `source/rise.webp` and `source/grip.webp`: two 3 × 3 photographic pose sheets
  generated with the built-in imagegen tool using the supplied references.
  These sheets also provide immediate previews during uncached seeks.
- `frames/000.webp` through `017.webp`: individually exported clean poses.
  Frames 8 and 9 use the original reaching image; frame 17 uses the original
  ground-grip image. Generated cells have less native detail than the originals.
  Transitions are brief photographic dissolves, not continuous simulated motion.
- `wasteland.webp`: built-in imagegen edit of the final reference, removing the
  hand and moon for the opening land reveal.
- `reaching.jpg` and `settled.jpg`: supplied original references. The latter is
  also the reduced-motion and loading/render failure fallback.
- `sequence.json`: dimensions, frame count, and transition metadata.

Rebuild: `node scripts/build-ashen-sequence.mjs` (sharp is included by Next.js).
At most 18 sequence bitmaps and four scene images are decoded. Frame requests
are limited to three concurrent requests and prioritized around scroll position.
The renderer pauses offscreen and releases decoded resources on unmount.

The player applies a subtle 2.6% push plus restrained fog and dust drift. No text
or controls are overlaid on the image; the gallery supplies Replay and instructions.

## Built-in imagegen prompts

### Emergence sheet

Create a production animation sprite sheet, exactly 3 columns by 3 rows, nine equal 16:9 panels edge-to-edge, no gutters, no borders, no labels. Output 3840x2160 pixels so each panel is 1280x720. Every panel is a photorealistic movie frame using the attached scene as the EXACT fixed camera, same green eclipsed moon size/position, same rubble and buried helmets, same dark lighting. This is a chronological animation of this same giant armored hand slowly emerging from the ground. Image 1 is the precise open-hand destination pose and visual identity; image 2 is the empty ground reference (add the same green moon from image 1). Reading left to right, top to bottom: panel 1 empty terrain and green moon, absolutely NO hand; panel 2 only 3 small dark armored fingertip caps breaking the ground in the center; panel 3 the fingertips slightly taller and knuckles barely visible; panel 4 upper fingers and knuckles rising amid a small low dust cloud, palm still buried; panel 5 half the palm rises; panel 6 three quarters of palm rises and fingers gently spread; panel 7 the wrist rises and fingers open; panel 8 near the exact reaching pose of image 1; panel 9 matches image 1's reaching hand. The moon and helmets are registered to precisely the same pixel location within all nine frames. All changes confined to the hand and small nearby dust/rubble. No camera motion. Keep cinematic photographic texture and realistic anatomy with five armored fingers, black chipped steel, not plastic, not 3D illustration. Do not change lighting or landscape between frames. This sheet will be cut into frames and played in sequence; small coherent changes are vital.

### Ground-grip sheet

Create a production animation sprite sheet, exactly 3 columns by 3 rows, nine equal 16:9 panels edge-to-edge, no gutters, borders, labels, text. Output 3840x2160 pixels so each panel is 1280x720. Each panel is a photorealistic movie still of the same exact scene, camera, moon, ruins and foreground helmets as the supplied references. Reference image 1 is the START pose: ancient armored hand upright reaching. Reference image 2 is the END pose: same hand bent forward gripping the earth. Animate ONLY the hand in nine chronological small coherent steps reading left-to-right then top-to-bottom: 1 matches the exact first reference, 2 hand begins tipping forward 10 degrees with fingers still open, 3 hand tips forward 25 degrees and begins lowering, 4 hand tips forward 40 degrees with fingers starting to curl down, 5 hand tips forward 55 degrees with palm approaching ground, 6 tips 65 degrees and fingers nearing ground, 7 tips 75 degrees and fingertips contact ground with subtle dust, 8 hand grips ground in exact final reference pose with small dust puff, 9 same exact final reference pose after dust settles. Final reference shows wrist coming from upper left back, knuckles low center and fingers bent downward gripping rubble. Preserve that anatomy and five fingers. CRITICAL: SAME hand identity/material all panels, SAME moon size/location, identical horizon and helmet positions within each panel. Do not zoom, pan, reframe, flip hand, change light or change scenery. The sheets will be sliced into chronological movie frames. Preserve black chipped steel, cracked plates, mud and photographic detail, dark green apocalyptic cinematic atmosphere. No faces or bodies. Not cartoon, not a smooth toy/render.

### Environment plate

Edit the supplied final-pose reference into a cinematic 16:9 background plate.
Remove only the entire central giant hand/arm and the green moon/corona.
Inpaint with uninterrupted rubble and dark green-black fog. Preserve the
composition, ruined pillars, buried foreground helmets, terrain textures,
lighting, and horizon. Keep the center clear for the hand reveal. No text,
logos, character, hand, or moon.

