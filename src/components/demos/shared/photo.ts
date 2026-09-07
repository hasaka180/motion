/**
 * The stand-in photograph.
 *
 * A real JPEG in `public/`, not a drawing — the pixel demos decode it exactly
 * the way the studio decodes an upload, so the demo path and the real path are
 * the same code. In colour mode each cell keeps the colour of the pixel it
 * came from, so what forms is the photograph, not a stencil of it.
 *
 * To use your own: replace `public/photo.jpg`. A clear subject and saturated
 * colour read best once the picture is only a few thousand squares; flat,
 * low-contrast images turn to mud.
 *
 * Credit: photograph by Steven Spassov, via Unsplash (Unsplash License).
 * https://unsplash.com/photos/tVIqMgGlAG0
 */

export const PHOTO_SRC = "/photo.jpg";

/**
 * Decode the photograph. Resolves once the pixels are actually available, so
 * callers can sample it immediately.
 */
export function loadPhoto(src: string = PHOTO_SRC): Promise<HTMLImageElement> {
  const img = new Image();
  // Same-origin here, but this keeps getImageData working if the file is ever
  // served from a CDN.
  img.crossOrigin = "anonymous";
  img.src = src;
  return img.decode().then(() => img);
}
