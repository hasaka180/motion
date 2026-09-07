/**
 * The stand-in photograph.
 *
 * A lit bust painted with canvas gradients, so the repo carries no bitmaps.
 * Only luminance matters to anything downstream — the dither reads this and
 * throws the colour away — so all this needs is a real tonal range: anything at
 * or above the highlight ceiling prints as bare paper, anything under the
 * background cut-off is dropped entirely.
 *
 * Swap it for `ctx.drawImage(yourImage, 0, 0, SRC_W, SRC_H)` and every demo
 * that uses it develops your photograph instead. The studio at /studio does
 * exactly that with an upload.
 */

/** Aspect of the source render, and therefore of the finished print. */
export const SRC_W = 300;
export const SRC_H = 390;

/** A soft dark blob — the shading that gives the face its structure. */
export function shade(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  alpha: number
) {
  const g = c.createRadialGradient(x, y, 0, x, y, 1);
  g.addColorStop(0, `rgba(0,0,0,${alpha})`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.save();
  c.translate(x, y);
  c.scale(rx, ry);
  c.translate(-x, -y);
  c.fillStyle = g;
  c.fillRect(x - 1, y - 1, 2, 2);
  c.restore();
}

/**
 * Stand-in for a photograph: a lit bust painted with canvas gradients. Only
 * luminance matters downstream, so this needs a real tonal range and nothing
 * else. Anything at or above the highlight ceiling ends up as bare paper,
 * anything under the background cut-off is dropped entirely.
 */
export function drawPortrait(c: CanvasRenderingContext2D) {
  const w = SRC_W;
  const h = SRC_H;

  c.fillStyle = "#000";
  c.fillRect(0, 0, w, h);

  // Body first, as a clip, so the key light only ever lands on the figure.
  c.save();
  c.beginPath();
  c.ellipse(w * 0.5, h * 1.14, w * 0.46, h * 0.42, 0, 0, Math.PI * 2);
  c.ellipse(w * 0.5, h * 0.6, w * 0.105, h * 0.16, 0, 0, Math.PI * 2);
  c.clip();

  const key = c.createRadialGradient(
    w * 0.34,
    h * 0.24,
    w * 0.02,
    w * 0.34,
    h * 0.3,
    w * 0.92
  );
  key.addColorStop(0, "#ffffff");
  key.addColorStop(0.16, "#e2e2e2");
  key.addColorStop(0.34, "#9a9a9a");
  key.addColorStop(0.58, "#4a4a4a");
  key.addColorStop(0.8, "#242424");
  key.addColorStop(1, "#131313");
  c.fillStyle = key;
  c.fillRect(0, 0, w, h);

  // Rim down the shadow side, so the dark half keeps an edge against the paper.
  const rim = c.createLinearGradient(w * 0.68, 0, w, 0);
  rim.addColorStop(0, "rgba(255,255,255,0)");
  rim.addColorStop(1, "rgba(255,255,255,0.5)");
  c.globalCompositeOperation = "lighter";
  c.fillStyle = rim;
  c.fillRect(0, 0, w, h);
  c.globalCompositeOperation = "source-over";
  c.restore();

  // Hair is the densest ink in the frame: dark, but kept well above the
  // background cut-off so it reads as solid tone instead of dropping out.
  const strands = c.createLinearGradient(w * 0.3, 0, w * 0.72, h * 0.5);
  strands.addColorStop(0, "#343434");
  strands.addColorStop(0.5, "#1e1e1e");
  strands.addColorStop(1, "#101010");
  c.fillStyle = strands;
  c.beginPath();
  c.ellipse(w * 0.5, h * 0.335, w * 0.2, h * 0.235, 0, 0, Math.PI * 2);
  c.ellipse(w * 0.325, h * 0.43, w * 0.045, h * 0.085, 0, 0, Math.PI * 2);
  c.ellipse(w * 0.675, h * 0.43, w * 0.045, h * 0.085, 0, 0, Math.PI * 2);
  c.fill();

  // The face sits inside the hair, so the hair frames it.
  c.save();
  c.beginPath();
  c.ellipse(w * 0.505, h * 0.385, w * 0.158, h * 0.2, 0, 0, Math.PI * 2);
  c.clip();

  // Radius chosen so the gradient actually crosses the face: the forehead sits
  // in the blown-out highlight, the jaw falls through the ceiling into ink.
  // Without that traverse the oval prints as blank paper.
  const skin = c.createRadialGradient(
    w * 0.42,
    h * 0.3,
    w * 0.02,
    w * 0.42,
    h * 0.3,
    w * 0.34
  );
  skin.addColorStop(0, "#ffffff");
  skin.addColorStop(0.3, "#fafafa");
  skin.addColorStop(0.55, "#c0c0c0");
  skin.addColorStop(0.75, "#6e6e6e");
  skin.addColorStop(0.95, "#2e2e2e");
  skin.addColorStop(1, "#1a1a1a");
  c.fillStyle = skin;
  c.fillRect(0, 0, w, h);

  // Enough modelling to read as a face at this grid size — brow line, the
  // shadow beside the nose, and the mouth. Any finer detail is lost anyway.
  shade(c, w * 0.45, h * 0.35, w * 0.062, h * 0.03, 0.72);
  shade(c, w * 0.565, h * 0.35, w * 0.058, h * 0.028, 0.66);
  shade(c, w * 0.535, h * 0.415, w * 0.028, h * 0.035, 0.55);
  shade(c, w * 0.5, h * 0.455, w * 0.05, h * 0.02, 0.6);
  c.restore();

  // Cast shadow under the jaw, so the head sits on the neck.
  shade(c, w * 0.5, h * 0.53, w * 0.16, h * 0.055, 0.75);
}
