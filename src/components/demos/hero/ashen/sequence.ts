import { clamp, phase } from "./timeline";

export const FRAME_COUNT = 18;
export const frameAt = (progress: number) => progress < .74
  ? phase(progress, .40, .65) * 8
  : 8 + phase(progress, .74, .98) * 9;
const ASSETS = "/images/ashen/";
const WIDTH = 960, HEIGHT = 540;
const CACHE_LIMIT = 18;

/** Bounded decoded-frame cache. Sprite sheets provide an immediate seek preview. */
export function createSequenceRenderer(canvas: HTMLCanvasElement, invalidate: () => void, onError: () => void) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas is unavailable");
  let disposed = false, width = 1, height = 1, ratio = 1, wanted = 0;
  const cache = new Map<number, ImageBitmap>();
  const requests = new Map<number, AbortController>();
  const failed = new Set<number>();
  const assets = new Map<string, ImageBitmap>();
  const assetController = new AbortController();
  let pending: number[] = [];

  async function loadAsset(name: string, url: string) {
    try {
      const response = await fetch(url, { signal: assetController.signal });
      if (!response.ok) throw new Error(`Missing scene asset: ${url}`);
      const bitmap = await createImageBitmap(await response.blob());
      if (disposed) { bitmap.close(); return; }
      assets.set(name, bitmap); invalidate();
    } catch { if (!disposed && !assetController.signal.aborted) onError(); }
  }
  void loadAsset("land", `${ASSETS}wasteland.webp`);
  void loadAsset("rise", `${ASSETS}source/rise.webp`);
  void loadAsset("grip", `${ASSETS}source/grip.webp`);
  void loadAsset("settled", `${ASSETS}settled.jpg`);

  function trim() {
    while (cache.size > CACHE_LIMIT) {
      // Retain the visible frame; evict frames furthest from current scroll.
      let candidate = -1, distance = -1;
      for (const frame of cache.keys()) if (Math.abs(frame - wanted) > distance) {
        candidate = frame; distance = Math.abs(frame - wanted);
      }
      cache.get(candidate)?.close(); cache.delete(candidate);
    }
  }
  function pump() {
    while (!disposed && requests.size < 3 && pending.length) {
      const index = pending.shift()!;
      if (cache.has(index) || requests.has(index) || failed.has(index)) continue;
      const controller = new AbortController(); requests.set(index, controller);
      fetch(`${ASSETS}frames/${String(index).padStart(3, "0")}.webp`, { signal: controller.signal })
        .then(response => { if (!response.ok) throw new Error("Frame unavailable"); return response.blob(); })
        .then(blob => createImageBitmap(blob))
        .then(bitmap => {
          if (disposed || controller.signal.aborted) { bitmap.close(); return; }
          cache.set(index, bitmap); trim(); invalidate();
        })
        .catch(() => { if (!controller.signal.aborted) failed.add(index); })
        .finally(() => { requests.delete(index); pump(); });
    }
  }
  function prepare(index: number) {
    wanted = index;
    pending = [index];
    for (let i = 1; i <= 8; i++) {
      if (index + i < FRAME_COUNT) pending.push(index + i);
      if (index - i >= 0) pending.push(index - i);
    }
    for (const [frame, request] of requests) if (Math.abs(frame - index) > 20) request.abort();
    pump();
  }

  function fit(image: ImageBitmap, y = 0, zoom = 1) {
    const scale = Math.max(width / WIDTH, height / HEIGHT) * zoom;
    const dw = WIDTH * scale, dh = HEIGHT * scale;
    ctx!.drawImage(image, (width - dw) / 2, (height - dh) / 2 + y, dw, dh);
  }
  function drawFrame(index: number, zoom: number) {
    const ready = cache.get(index);
    if (ready) { fit(ready, 0, zoom); return; }
    const pose = Math.max(0, Math.min(17, index));
    const sheet = assets.get(pose < 9 ? "rise" : "grip");
    if (!sheet) return;
    const cell = pose % 9, col = cell % 3, row = Math.floor(cell / 3);
    const left = Math.round(col * sheet.width / 3), top = Math.round(row * sheet.height / 3);
    const sw = Math.round((col + 1) * sheet.width / 3) - left;
    const sh = Math.round((row + 1) * sheet.height / 3) - top;
    const scale = Math.max(width / WIDTH, height / HEIGHT) * zoom;
    const dw = WIDTH * scale, dh = HEIGHT * scale;
    ctx!.drawImage(sheet, left + 4, top + 4, sw - 8, sh - 8, (width - dw) / 2, (height - dh) / 2, dw, dh);
  }

  function draw(progress: number, time: number, reduced = false) {
    const p = clamp(progress), position = frameAt(p), index = Math.floor(position);
    if (!reduced) prepare(index);
    ctx!.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx!.fillStyle = "#020707"; ctx!.fillRect(0, 0, width, height);
    if (reduced && assets.has("settled")) { fit(assets.get("settled")!); return; }
    const land = phase(p, .02, .23), moon = phase(p, .23, .4);
    const zoom = 1 + phase(p, .4, 1) * .026;
    if (p < .4) {
      const image = assets.get("land");
      if (image) {
        ctx!.globalAlpha = land;
        fit(image, (1 - land) * height * .3);
      }
      ctx!.globalAlpha = moon;
      drawFrame(0, 1);
      ctx!.globalAlpha = 1;
    } else {
      drawFrame(index, zoom);
      // Hold each clean pose, then briefly dissolve into its neighbor. No
      // optical-flow distortion of finger anatomy or the eclipse silhouette.
      const dissolve = phase(position - index, .58, 1);
      if (dissolve > 0 && index < FRAME_COUNT - 1) {
        ctx!.globalAlpha = dissolve; drawFrame(index + 1, zoom); ctx!.globalAlpha = 1;
      }
    }
    // Atmosphere is intentionally restrained; photographic frames carry the scene.
    const impact = phase(p, .87, .94) * (1 - phase(p, .95, 1));
    for (let i = 0; i < 5; i++) {
      const x = width * (.16 + i * .18 + Math.sin(time * .027 + i * 2) * .035);
      const y = height * (.71 + Math.sin(i * 4 + time * .02) * .028);
      const radius = width * (.13 + i * .008);
      const fog = ctx!.createRadialGradient(x, y, 0, x, y, radius);
      fog.addColorStop(0, `rgba(116,139,124,${(.018 + impact * .09) * Math.max(.08, land)})`);
      fog.addColorStop(1, "rgba(70,94,82,0)");
      ctx!.fillStyle = fog; ctx!.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    for (let i = 0; i < 42; i++) {
      const x = ((i * .618033 + time * .0014) % 1) * width;
      const y = ((i * .381966 - time * .002 + 100) % 1) * height;
      ctx!.fillStyle = `rgba(180,190,165,${(.04 + land * .13) * (.3 + (i % 5) / 5)})`;
      ctx!.fillRect(x, y, i % 3 === 0 ? 1.2 : .7, .7);
    }
  }

  return {
    draw,
    resize(w: number, h: number) {
      width = Math.max(1, w); height = Math.max(1, h);
      ratio = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      invalidate();
    },
    dispose() {
      disposed = true; pending = []; assetController.abort();
      requests.forEach(request => request.abort());
      cache.forEach(bitmap => bitmap.close()); assets.forEach(bitmap => bitmap.close());
      cache.clear(); assets.clear();
    },
  };
}
