"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_IMAGE = "/images/darwin-botanical.webp";
const COLS = 6, ROWS = 4, DURATION = 5.8;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
// Deterministic placement makes replay repeatable, including server renders.
const random = (seed: number) => { const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
const LEADS = [1, 2, 7, 8, 9, 13, 14, 15];
const ANCHORS = [[0.16, 0.30, 200], [0.43, 0.18, 900], [0.78, 0.38, 300], [0.30, 0.72, 60], [0.62, 0.73, 120], [0.62, 0.44, 650], [0.88, 0.70, 800], [0.12, 0.83, 600]];
const tiles = Array.from({ length: COLS * ROWS }, (_, i) => ({
  col: i % COLS, row: Math.floor(i / COLS),
  // These eight fragments carry the composition during the sparse opening.
  lead: LEADS.includes(i),
  x: ANCHORS[LEADS.indexOf(i)]?.[0] ?? 0.1 + random(i + 1) * 0.8,
  y: ANCHORS[LEADS.indexOf(i)]?.[1] ?? 0.12 + random(i + 53) * 0.76,
  depth: ANCHORS[LEADS.indexOf(i)]?.[2] ?? 180 + random(i + 107) * 1100,
  phase: random(i + 201) * Math.PI * 2,
  delay: random(i + 313) * 0.65,
})).sort((a, b) => b.depth - a.depth);

/** Full-colour image tiles travel through a projected depth field, then assemble. */
export function FloatingImageAssemble() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const ownedUrl = useRef<string | null>(null);
  const [src, setSrc] = useState(DEFAULT_IMAGE);
  const [run, setRun] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => () => { if (ownedUrl.current) URL.revokeObjectURL(ownedUrl.current); }, []);

  useEffect(() => {
    const stage = root.current, surface = canvas.current;
    const ctx = surface?.getContext("2d");
    if (!stage || !surface || !ctx) return;
    const photo = new Image();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0, height = 0, frame = 0, elapsed = 0, last = 0;
    let ready = false, inView = false, disposed = false;

    const draw = () => {
      if (!ready || !width || !height) return;
      const time = reduced.matches ? DURATION : elapsed;
      const inset = width < 600 ? 12 : 24;
      const w = width - inset * 2, h = height - inset * 2;
      const scale = Math.max(w / photo.naturalWidth, h / photo.naturalHeight);
      const sourceW = w / scale, sourceH = h / scale;
      const sourceX = (photo.naturalWidth - sourceW) / 2;
      const sourceY = (photo.naturalHeight - sourceH) / 2;
      ctx.clearRect(0, 0, width, height);
      // A single, identically cropped draw at rest eliminates tile seams.
      if (time >= 5.1) {
        ctx.drawImage(photo, sourceX, sourceY, sourceW, sourceH, inset, inset, w, h);
      } else {
        for (const tile of tiles) {
          const start = 1.65 + tile.delay;
          const p = smooth((time - start) / 2.75);
          const remaining = 1 - p;
          const alpha = tile.lead ? smooth(time / 0.65) : smooth((time - start + 0.25) / 0.7);
          if (alpha <= 0) continue;
          const perspective = 850 / (850 + tile.depth * remaining);
          const tw = w / COLS, th = h / ROWS;
          const targetX = inset + (tile.col + 0.5) * tw;
          const targetY = inset + (tile.row + 0.5) * th;
          const floatX = width * tile.x + Math.sin(time * 0.8 + tile.phase) * w * 0.018;
          const floatY = height * tile.y + Math.cos(time * 0.65 + tile.phase) * h * 0.026;
          // Forward travel grows a distant small fragment into its full image cell.
          const x = floatX * remaining + targetX * p;
          const y = floatY * remaining + targetY * p;
          const size = perspective * (0.8 + 0.2 * p);
          const blur = Math.max(0, (tile.depth - 480) / 150) * remaining;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.filter = blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : "none";
          ctx.translate(x, y);
          ctx.rotate(Math.sin(time * 0.55 + tile.phase) * 0.035 * remaining);
          ctx.drawImage(photo,
            sourceX + tile.col * sourceW / COLS, sourceY + tile.row * sourceH / ROWS,
            sourceW / COLS, sourceH / ROWS,
            -tw * size / 2, -th * size / 2, tw * size + 0.35 * p, th * size + 0.35 * p);
          ctx.restore();
        }
      }
      if (caption.current) {
        caption.current.style.opacity = String(smooth((time - 4.9) / 0.8));
        caption.current.style.transform = `translateY(${(1 - smooth((time - 4.9) / 0.8)) * 12}px)`;
      }
      if (progress.current) progress.current.style.transform = `scaleX(${clamp(time / DURATION)})`;
    };
    const tick = (now: number) => {
      frame = 0;
      if (disposed || !ready || !inView || document.hidden) { last = 0; return; }
      if (last) elapsed += Math.min((now - last) / 1000, 0.05);
      last = now;
      draw();
      if (!reduced.matches && elapsed < DURATION) frame = requestAnimationFrame(tick);
    };
    const resume = () => {
      if (!frame && ready && inView && !document.hidden) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    };
    const resize = () => {
      const box = stage.getBoundingClientRect();
      width = box.width; height = box.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.round(width * dpr); surface.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; last = 0; }
      else resume();
    };
    const preference = () => {
      if (reduced.matches) { elapsed = DURATION; draw(); }
      resume();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    const io = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (inView) resume();
      else { cancelAnimationFrame(frame); frame = 0; last = 0; }
    }, { threshold: 0.15 });
    io.observe(stage);
    document.addEventListener("visibilitychange", visibility);
    reduced.addEventListener("change", preference);
    if (caption.current) caption.current.style.opacity = "0";
    if (progress.current) progress.current.style.transform = "scaleX(0)";
    photo.onload = () => {
      if (disposed) return;
      ready = true;
      resize();
      resume();
    };
    photo.onerror = () => { if (!disposed) setError("This image could not be opened. Choose another image."); };
    photo.src = src;
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      io.disconnect(); ro.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", preference);
      photo.onload = null; photo.onerror = null;
    };
  }, [src, run]);

  return (
    <div className="absolute inset-0 bg-[#0d0e0c] text-[#f0f1e9]">
      <div ref={root} className="absolute inset-x-0 bottom-16 top-0 overflow-hidden">
        <canvas ref={canvas} role="img" aria-label="Image fragments floating forward and assembling into a complete photograph" className="block h-full w-full" />
        <div ref={caption} className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 opacity-0" style={{ textShadow: "0 2px 24px #0008" }}>
          <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.25em] sm:text-[11px]">A study in coming together</p>
          <h2 className="text-center text-[clamp(34px,6vw,100px)] font-light leading-none tracking-[-0.06em]">FORM & FIELD</h2>
          <p className="mt-5 text-xs text-white/75 sm:text-sm">Every piece. One perspective.</p>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-white/45 sm:inline">Fragments / 01</span>
        <div className="ml-auto flex shrink-0 gap-2 whitespace-nowrap">
          <button type="button" onClick={() => picker.current?.click()} className="rounded-full border border-white/20 px-3 py-2 text-[11px] transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-offset-4">Choose image</button>
          <button type="button" onClick={() => setRun(n => n + 1)} className="rounded-full bg-[#e6eadb] px-3 py-2 text-[11px] text-[#1c2117] hover:bg-white focus-visible:outline focus-visible:outline-offset-4">Reassemble ↗</button>
        </div>
        <input ref={picker} type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden onChange={event => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          if (!/^image\/(png|jpeg|webp|avif)$/.test(file.type)) { setError("Choose a PNG, JPEG, WebP or AVIF image."); return; }
          if (file.size > 20 * 1024 * 1024) { setError("Choose an image smaller than 20 MB."); return; }
          const next = URL.createObjectURL(file);
          if (ownedUrl.current) URL.revokeObjectURL(ownedUrl.current);
          ownedUrl.current = next;
          setError(""); setSrc(next);
        }} />
      </div>
      <span ref={progress} aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px origin-left bg-[#bac8a4]" style={{ transform: "scaleX(0)" }} />
      {error && <p role="alert" className="absolute bottom-20 left-6 right-6 rounded bg-black/80 p-3 text-sm">{error}</p>}
    </div>
  );
}
