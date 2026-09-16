import { clamp } from "./timeline";

/** The shot: a wasteland, a hand breaking the ground, the eclipse, the grip. */
export const FRAME_COUNT = 30;
const frameUrl = (i: number) => `/images/frames/frame-${String(i + 1).padStart(4, "0")}.webp`;
const WIDTH = 1916, HEIGHT = 1080;

/** Frames either side of the playhead kept decoded. Everything else stays a compressed blob. */
const WINDOW = 5;
const CONCURRENCY = 4;

/** Scroll to a fractional frame, holding briefly on the first and last. */
export const frameAt = (progress: number) => clamp((progress - .03) / .94) * (FRAME_COUNT - 1);

/**
 * A scroll-scrubbed image sequence.
 *
 * Thirty full-HD frames would be around 250MB decoded, so only a window around
 * the playhead is ever a bitmap, decoded at the size it is drawn. Every fetched
 * frame is kept as its compressed blob, so scrubbing back re-decodes locally
 * instead of hitting the network. Fetches go out nearest-the-playhead first,
 * which means the frame you are looking at is always the next one to arrive.
 */
export function createSequenceRenderer(
  canvas: HTMLCanvasElement,
  invalidate: () => void,
  onError: () => void,
  onProgress: (loaded: number, total: number) => void,
) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas is unavailable");
  const context = ctx;

  let disposed = false, width = 1, height = 1, ratio = 1;
  let playhead = -1, decodeWidth = 0, decodeHeight = 0;
  const blobs = new Map<number, Blob>();
  const bitmaps = new Map<number, ImageBitmap>();
  const decoding = new Set<number>();
  const fetching = new Map<number, AbortController>();
  const failed = new Set<number>();
  const nearest = (a: number, b: number) => Math.abs(a - playhead) - Math.abs(b - playhead);

  function pumpFetch() {
    if (disposed) return;
    const queue = Array.from({ length: FRAME_COUNT }, (_, i) => i)
      .filter(i => !blobs.has(i) && !fetching.has(i) && !failed.has(i))
      .sort(nearest);
    while (fetching.size < CONCURRENCY && queue.length) {
      const index = queue.shift()!;
      const controller = new AbortController();
      fetching.set(index, controller);
      fetch(frameUrl(index), { signal: controller.signal })
        .then(response => { if (!response.ok) throw new Error(`Frame ${index + 1} unavailable`); return response.blob(); })
        .then(blob => {
          if (disposed) return;
          blobs.set(index, blob);
          onProgress(blobs.size, FRAME_COUNT);
          pumpDecode();
        })
        .catch(() => {
          if (controller.signal.aborted || disposed) return;
          failed.add(index);
          // A handful of missing frames just means a coarser scrub; most of them means there is no scene.
          if (failed.size > FRAME_COUNT / 2) onError();
        })
        .finally(() => { fetching.delete(index); pumpFetch(); });
    }
  }

  /** Decode at display size where the browser allows it; fall back to full size where it does not. */
  async function decode(blob: Blob, w: number, h: number) {
    try {
      return await createImageBitmap(blob, { resizeWidth: w, resizeHeight: h, resizeQuality: "high" });
    } catch {
      return createImageBitmap(blob);
    }
  }

  function pumpDecode() {
    if (disposed || !decodeWidth || playhead < 0) return;
    for (const [index, bitmap] of bitmaps) {
      if (Math.abs(index - playhead) > WINDOW + 1) { bitmap.close(); bitmaps.delete(index); }
    }
    const wanted = [...blobs.keys()]
      .filter(i => Math.abs(i - playhead) <= WINDOW && !bitmaps.has(i) && !decoding.has(i))
      .sort(nearest);
    for (const index of wanted.slice(0, Math.max(0, 2 - decoding.size))) {
      decoding.add(index);
      const w = decodeWidth, h = decodeHeight;
      decode(blobs.get(index)!, w, h)
        .then(bitmap => {
          // Stale work — the stage resized or the playhead moved on while this decoded.
          if (disposed || w !== decodeWidth || Math.abs(index - playhead) > WINDOW + 1) { bitmap.close(); return; }
          bitmaps.get(index)?.close();
          bitmaps.set(index, bitmap);
          invalidate();
        })
        .catch(() => failed.add(index))
        .finally(() => { decoding.delete(index); pumpDecode(); });
    }
  }

  /** The exact frame if it is ready, otherwise the closest one that is. */
  function closest(index: number) {
    for (let d = 0; d < FRAME_COUNT; d++) {
      const hit = bitmaps.get(index - d) ?? bitmaps.get(index + d);
      if (hit) return hit;
    }
    return undefined;
  }

  function cover(image: ImageBitmap) {
    const scale = Math.max(width / WIDTH, height / HEIGHT);
    const dw = WIDTH * scale, dh = HEIGHT * scale;
    context.drawImage(image, (width - dw) / 2, (height - dh) / 2, dw, dh);
  }

  function draw(progress: number, time: number, reduced = false) {
    const position = reduced ? FRAME_COUNT - 1 : frameAt(clamp(progress));
    const index = Math.floor(position);
    const next = Math.min(FRAME_COUNT - 1, index + 1);
    if (index !== playhead) { playhead = index; pumpFetch(); pumpDecode(); }

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = "#020707";
    context.fillRect(0, 0, width, height);

    const base = closest(index);
    if (base) cover(base);
    // Adjacent frames of one continuous shot: a short blend removes the step
    // between them without inventing motion. Only blend two real frames.
    const mix = position - index;
    const after = bitmaps.get(next);
    if (mix > .01 && next !== index && after && bitmaps.has(index)) {
      context.globalAlpha = mix;
      cover(after);
      context.globalAlpha = 1;
    }

    if (reduced) return;
    // Drifting ash. The photographs carry the atmosphere; this only keeps the still frames alive.
    for (let i = 0; i < 42; i++) {
      const x = ((i * .618033 + time * .0014) % 1) * width;
      const y = ((i * .381966 - time * .002 + 100) % 1) * height;
      context.fillStyle = `rgba(180,190,165,${.1 * (.3 + (i % 5) / 5)})`;
      context.fillRect(x, y, i % 3 === 0 ? 1.2 : .7, .7);
    }
  }

  function resize(w: number, h: number) {
    width = Math.max(1, w);
    height = Math.max(1, h);
    ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    // Decode no larger than the frame is drawn, and never above the source.
    // Quantised, so small layout shifts do not throw away every decoded frame.
    const scale = Math.max(width / WIDTH, height / HEIGHT) * ratio;
    const target = Math.min(WIDTH, Math.ceil((WIDTH * scale) / 160) * 160);
    if (target !== decodeWidth) {
      decodeWidth = target;
      decodeHeight = Math.round((target * HEIGHT) / WIDTH);
      bitmaps.forEach(bitmap => bitmap.close());
      bitmaps.clear();
      pumpDecode();
    }
    invalidate();
  }

  return {
    draw,
    resize,
    dispose() {
      disposed = true;
      fetching.forEach(request => request.abort());
      bitmaps.forEach(bitmap => bitmap.close());
      bitmaps.clear();
      blobs.clear();
    },
  };
}
