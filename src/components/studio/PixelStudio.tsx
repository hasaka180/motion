"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULTS,
  buildCells,
  paintCells,
  sampleToGrid,
  type Cells,
  type DitherOptions,
} from "@/lib/dither";
import {
  ASSEMBLE_DEFAULTS,
  createAssembly,
  paintAssembly,
  type Assembly,
} from "@/lib/assembleField";
import {
  PARTICLE_DEFAULTS,
  createField,
  stepField,
  type Field,
} from "@/lib/particleField";
import {
  formatBytes,
  toHtml,
  toHtmlAssemble,
  toHtmlScatter,
  toReact,
  toReactAssemble,
  toReactScatter,
  type ExportSettings,
} from "@/lib/pixelExport";

/**
 * Upload a picture, work it, take the code.
 *
 * One pipeline, two endings: the image is dithered to a grid of ink cells, and
 * those cells either develop as you scroll or scatter under your cursor. Both
 * read the same cell list, so the Print controls mean the same thing in either
 * mode and switching does not re-dither anything.
 *
 * The preview runs the same maths the exported code does — the same lerp, the
 * same force model — so what you scrub here is what you ship.
 */

/** The embedded copy only feeds a grid a few hundred cells wide, so it can be
 *  small: this cap keeps the pasted code in the tens of KB, not the megabytes. */
const EMBED_MAX = 640;

type Settings = ExportSettings;
type Mode = "scroll" | "scatter" | "assemble";

const INITIAL: Settings = {
  ...DEFAULTS,
  ...PARTICLE_DEFAULTS,
  ...ASSEMBLE_DEFAULTS,
  ink: "#12222a",
  ground: "#f1efe9",
  round: false,
  runway: 3.2,
  lag: 0.16,
};

/** Scatter and assemble want ink on a dark ground; the develop wants paper. */
const DARK_COLOURS = { ink: "#f4f4f7", ground: "#0c0c11" };
const PAPER_COLOURS = { ink: INITIAL.ink, ground: INITIAL.ground };

/** Re-encode to something small enough to paste. */
function embed(image: HTMLImageElement): string {
  const scale = Math.min(1, EMBED_MAX / Math.max(image.naturalWidth, image.naturalHeight));
  const w = Math.max(1, Math.round(image.naturalWidth * scale));
  const h = Math.max(1, Math.round(image.naturalHeight * scale));

  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  // Only luminance survives the dither, so flattening alpha onto white here
  // costs nothing and lets us use a lossy format.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(image, 0, 0, w, h);

  const webp = c.toDataURL("image/webp", 0.82);
  return webp.startsWith("data:image/webp") ? webp : c.toDataURL("image/jpeg", 0.82);
}

/** Stand-in source, so the studio is usable before you have picked a file. */
function sampleImage(): Promise<HTMLImageElement> {
  const c = document.createElement("canvas");
  c.width = 600;
  c.height = 720;
  const x = c.getContext("2d")!;
  x.fillStyle = "#f4f4f4";
  x.fillRect(0, 0, 600, 720);

  const g = x.createRadialGradient(220, 210, 12, 300, 320, 380);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.42, "#8d8d8d");
  g.addColorStop(1, "#0a0a0a");
  x.fillStyle = g;
  x.beginPath();
  x.arc(300, 300, 220, 0, 6.2832);
  x.fill();

  const floor = x.createLinearGradient(0, 560, 0, 720);
  floor.addColorStop(0, "#1a1a1a");
  floor.addColorStop(1, "#f4f4f4");
  x.fillStyle = floor;
  x.fillRect(0, 560, 600, 160);

  const img = new Image();
  img.src = c.toDataURL();
  return img.decode().then(() => img);
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-ink-400">{label}</span>
        <span className="font-mono text-[11px] tabular-nums text-ink-200">
          {format ? format(value) : value}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="mt-1.5 w-full accent-accent"
      />
    </label>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink-400">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-3.5 accent-accent"
      />
      {label}
    </label>
  );
}

function Swatch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <span
        className="relative size-7 shrink-0 rounded-md border border-ink-700"
        style={{ background: value }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </span>
      <span className="text-[13px] text-ink-400">{label}</span>
    </label>
  );
}

export function PixelStudio() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [dataUri, setDataUri] = useState("");
  const [fileName, setFileName] = useState("");
  const [hot, setHot] = useState(false);
  const [set, setSet] = useState<Settings>(INITIAL);
  const [tab, setTab] = useState<"react" | "html">("react");
  const [mode, setMode] = useState<Mode>("scroll");
  const [copied, setCopied] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const cellsRef = useRef<Cells | null>(null);
  const cellRef = useRef(1);
  const currentRef = useRef(0);
  const fieldRef = useRef<Field | null>(null);
  const assemblyRef = useRef<Assembly | null>(null);
  /** When the current assemble run started, or 0 while it is holding. */
  const runAtRef = useRef(0);
  /** Cursor target and its eased follower, in backing-store pixels. */
  const cursor = useRef({ tx: -9999, ty: -9999, x: -9999, y: -9999 });

  /** Live settings for the rAF loop, so it never closes over a stale value. */
  const setRef = useRef(set);
  useEffect(() => {
    setRef.current = set;
  }, [set]);

  const patch = useCallback(
    (p: Partial<Settings>) => setSet((s) => ({ ...s, ...p })),
    []
  );

  const switchMode = useCallback((next: Mode) => {
    setMode(next);
    currentRef.current = 0;
    cursor.current = { tx: -9999, ty: -9999, x: -9999, y: -9999 };

    // Scatter and assemble read best as light ink on a dark ground; the
    // develop reads as ink on paper. Only swap the palette if it is still the
    // other default — a colour you picked is yours.
    const wantsDark = next !== "scroll";
    const want = wantsDark ? DARK_COLOURS : PAPER_COLOURS;
    const other = wantsDark ? PAPER_COLOURS : DARK_COLOURS;
    setSet((s) =>
      s.ink === other.ink && s.ground === other.ground ? { ...s, ...want } : s
    );
  }, []);

  const load = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setDataUri(embed(img));
        setFileName(file.name);
        currentRef.current = 0;
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  // Start on the sample so the page is never an empty box.
  useEffect(() => {
    let live = true;
    sampleImage().then((img) => {
      if (!live) return;
      setImage(img);
      setDataUri(embed(img));
      setFileName("sample");
    });
    return () => {
      live = false;
    };
  }, []);

  // Dither options only — colours and motion do not invalidate the cell list.
  const dither: DitherOptions = useMemo(
    () => ({
      gridW: set.gridW,
      weight: set.weight,
      gamma: set.gamma,
      fade: set.fade,
      bgCut: set.bgCut,
      figHi: set.figHi,
      spread: set.spread,
      invert: set.invert,
    }),
    [set.gridW, set.weight, set.gamma, set.fade, set.bgCut, set.figHi, set.spread, set.invert]
  );

  // The cell list is a pure function of the image and the dither options.
  const cells = useMemo(() => {
    if (!image) return null;
    const { data, cols, rows } = sampleToGrid(
      image,
      image.naturalWidth,
      image.naturalHeight,
      dither.gridW
    );
    return buildCells(data, cols, rows, dither);
  }, [image, dither]);

  // The paint loop reads through refs so it never has to be torn down. The
  // scatter field is just the same cells with somewhere to put their offsets.
  useEffect(() => {
    cellsRef.current = cells;
    fieldRef.current = cells ? createField(cells) : null;
  }, [cells]);

  // Where each particle starts is baked in, so it is rebuilt only when the
  // cells or the layout parameters change — not while dragging swirl or
  // duration, which apply at paint time. Rebuilding re-runs the animation.
  useEffect(() => {
    assemblyRef.current = cells
      ? createAssembly(cells, {
          distance: set.distance,
          swirl: set.swirl,
          turbulence: set.turbulence,
          stagger: set.stagger,
          order: set.order,
          duration: set.duration,
        })
      : null;
    runAtRef.current = performance.now();
  }, [cells, set.distance, set.order, set.stagger, set.swirl, set.turbulence, set.duration]);

  const cellCount = cells?.n ?? 0;
  const grid = cells ? `${cells.cols} × ${cells.rows}` : "—";

  // One loop drives layout, the develop lerp and painting.
  useEffect(() => {
    const cv = canvasRef.current;
    const stage = stageRef.current;
    // The scroll container only exists in scroll mode — scatter has no runway.
    const scroller = scrollRef.current;
    if (!cv || !stage) return;
    if (mode === "scroll" && !scroller) return;
    ctxRef.current = cv.getContext("2d");

    let frame = 0;
    let lastKey = "";

    // Scroll fits the print to the stage; scatter leaves margin all round for
    // the particles to disperse into, and paints across the whole canvas.
    let W = 0;
    let H = 0;
    let originX = 0;
    let originY = 0;

    const layout = () => {
      const ctx = ctxRef.current;
      const cells = cellsRef.current;
      if (!ctx || !cells) return;
      const box = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      if (mode === "scroll") {
        const cell = Math.min(
          (box.width * 0.8) / cells.cols,
          (box.height * 0.88) / cells.rows
        );
        cellRef.current = cell;
        W = Math.round(cells.cols * cell * dpr);
        H = Math.round(cells.rows * cell * dpr);
        cv.style.width = `${cells.cols * cell}px`;
        cv.style.height = `${cells.rows * cell}px`;
        originX = 0;
        originY = 0;
      } else {
        W = Math.round(box.width * dpr);
        H = Math.round(box.height * dpr);
        cv.style.width = `${box.width}px`;
        cv.style.height = `${box.height}px`;
        // Both cursor modes and the assemble need margin around the picture —
        // one for particles to disperse into, one for dust to arrive from.
        const room = mode === "assemble" ? 0.62 : 0.72;
        const cell = Math.min((W * room) / cells.cols, (H * room) / cells.rows);
        cellRef.current = cell;
        originX = (W - cells.cols * cell) / 2;
        originY = (H - cells.rows * cell) / 2;
      }

      cv.width = W;
      cv.height = H;
      // Assigning width/height clears the transform. Scroll paints in CSS
      // pixels and scales by dpr; scatter works in backing-store pixels.
      ctx.setTransform(
        mode === "scroll" ? dpr : 1,
        0,
        0,
        mode === "scroll" ? dpr : 1,
        0,
        0
      );
    };

    const start = performance.now();

    const loop = () => {
      const ctx = ctxRef.current;
      const cells = cellsRef.current;
      const s = setRef.current;

      if (ctx && cells) {
        // Re-fit whenever the grid changes shape under us.
        const key = `${cells.cols}x${cells.rows}x${stage.clientWidth}x${stage.clientHeight}`;
        if (key !== lastKey) {
          lastKey = key;
          layout();
        }

        if (mode === "scroll" && scroller) {
          const span = scroller.scrollHeight - scroller.clientHeight;
          const target = span > 0 ? scroller.scrollTop / span : 0;
          currentRef.current += (target - currentRef.current) * s.lag;
          paintCells(ctx, cells, cellRef.current, currentRef.current, s.ink, s.round);
        } else if (mode === "assemble") {
          const assembly = assemblyRef.current;
          if (assembly) {
            const elapsed = runAtRef.current
              ? (performance.now() - runAtRef.current) / 1000
              : 0;
            paintAssembly(ctx, assembly, {
              width: W,
              height: H,
              cell: cellRef.current,
              originX,
              originY,
              ink: s.ink,
              fill: s.fill,
              progress: Math.min(1, elapsed / s.duration),
              time: elapsed,
              params: s,
              calm: false,
            });
          }
        } else if (mode === "scatter") {
          const field = fieldRef.current;
          const c = cursor.current;
          if (field) {
            if (c.x < -9000) {
              c.x = c.tx;
              c.y = c.ty;
            } else {
              c.x += (c.tx - c.x) * 0.1;
              c.y += (c.ty - c.y) * 0.1;
            }
            stepField(ctx, field, {
              width: W,
              height: H,
              cell: cellRef.current,
              originX,
              originY,
              ink: s.ink,
              time: (performance.now() - start) / 1000,
              cursorX: c.x,
              cursorY: c.y,
              params: s,
              calm: false,
            });
          }
        }
      }
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [mode]);

  const code = useMemo(() => {
    if (!dataUri) return "";
    if (mode === "scroll") {
      return tab === "react" ? toReact(dataUri, set) : toHtml(dataUri, set);
    }
    if (mode === "assemble") {
      return tab === "react" ? toReactAssemble(dataUri, set) : toHtmlAssemble(dataUri, set);
    }
    return tab === "react" ? toReactScatter(dataUri, set) : toHtmlScatter(dataUri, set);
  }, [dataUri, set, tab, mode]);

  const stem =
    mode === "scroll"
      ? ["ScrollDither.tsx", "scroll-dither.html"]
      : mode === "assemble"
        ? ["PixelAssemble.tsx", "pixel-assemble.html"]
        : ["PixelScatter.tsx", "pixel-scatter.html"];
  const fileName2 = tab === "react" ? stem[0] : stem[1];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard needs https or permission — the code is selectable regardless.
    }
  };

  const download = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName2;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ---------------------------------------------------------- preview */}
      <section className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-900">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-800 px-5 py-3">
          <div className="flex items-center gap-1">
            {(["scroll", "assemble", "scatter"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                aria-pressed={mode === m}
                className={`rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors ${
                  mode === m
                    ? "bg-ink-700 text-ink-50"
                    : "text-ink-400 hover:bg-ink-800 hover:text-ink-200"
                }`}
              >
                {m === "scroll"
                  ? "Scroll develop"
                  : m === "assemble"
                    ? "Assemble"
                    : "Cursor scatter"}
              </button>
            ))}
            {mode === "assemble" ? (
              <button
                type="button"
                onClick={() => {
                  runAtRef.current = performance.now();
                }}
                className="ml-2 rounded-md border border-ink-700 bg-ink-850 px-2.5 py-1 font-mono text-[11px] text-ink-200 transition-colors hover:border-ink-600 hover:text-ink-50"
              >
                Replay
              </button>
            ) : (
              <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-600">
                {mode === "scroll" ? "scroll the stage" : "move over the stage"}
              </span>
            )}
          </div>
          <p className="font-mono text-[11px] tabular-nums text-ink-600">
            {grid} · {cellCount.toLocaleString()}{" "}
            {mode === "scroll" ? "cells" : "particles"}
          </p>
        </header>

        {mode === "scroll" ? (
          <div
            ref={scrollRef}
            className="scroll-thin relative h-[520px] overflow-y-auto"
            style={{ background: set.ground }}
          >
            <div
              ref={stageRef}
              className="sticky top-0 flex h-[520px] items-center justify-center overflow-hidden"
            >
              <canvas ref={canvasRef} aria-hidden className="block" />
            </div>
            <div style={{ height: `${set.runway * 100}%` }} />
          </div>
        ) : (
          <div
            ref={stageRef}
            onPointerMove={(e) => {
              if (mode !== "scatter") return;
              const cv = canvasRef.current;
              if (!cv) return;
              const box = cv.getBoundingClientRect();
              if (!box.width) return;
              cursor.current.tx = (e.clientX - box.left) * (cv.width / box.width);
              cursor.current.ty = (e.clientY - box.top) * (cv.height / box.height);
            }}
            onPointerLeave={() => {
              // Park the cursor far away so influence decays and it reassembles.
              cursor.current.tx = -9999;
              cursor.current.ty = -9999;
            }}
            className={`relative h-[520px] overflow-hidden ${
              mode === "scatter" ? "cursor-crosshair" : ""
            }`}
            style={{ background: set.ground }}
          >
            <canvas ref={canvasRef} aria-hidden className="block" />
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------- source */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-ink-800 bg-ink-900 p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-tight text-ink-50">Picture</h2>

          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setHot(true);
            }}
            onDragLeave={() => setHot(false)}
            onDrop={(e) => {
              e.preventDefault();
              setHot(false);
              if (e.dataTransfer.files[0]) load(e.dataTransfer.files[0]);
            }}
            className={`cursor-pointer rounded-xl border border-dashed px-4 py-7 text-center transition-colors ${
              hot ? "border-accent bg-ink-850" : "border-ink-700 hover:border-ink-600"
            }`}
          >
            <p className="text-sm text-ink-200">Drop an image, or click to browse</p>
            <p className="mt-1 text-[12.5px] text-ink-600">
              Portraits and high-contrast subjects dither best
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && load(e.target.files[0])}
          />

          <p className="mt-3 truncate font-mono text-[11px] text-ink-600">
            {fileName || "—"}
            {dataUri && ` · embeds at ${formatBytes(Math.ceil((dataUri.length * 3) / 4))}`}
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Swatch label="Ink" value={set.ink} onChange={(ink) => patch({ ink })} />
            <Swatch label="Paper" value={set.ground} onChange={(ground) => patch({ ground })} />
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2.5">
            <Check label="Invert" checked={set.invert} onChange={(invert) => patch({ invert })} />
            {mode === "scroll" && (
              <Check label="Round dots" checked={set.round} onChange={(round) => patch({ round })} />
            )}
          </div>
        </section>

        {/* -------------------------------------------------------- controls */}
        <section className="rounded-2xl border border-ink-800 bg-ink-900 p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-tight text-ink-50">Print</h2>
          <div className="grid gap-4">
            <Slider
              label="Detail"
              value={set.gridW}
              min={40}
              max={260}
              step={4}
              format={(v) => `${v} cols`}
              onChange={(gridW) => patch({ gridW })}
            />
            <Slider
              label="Ink weight"
              value={set.weight}
              min={0.6}
              max={1.6}
              step={0.02}
              format={(v) => v.toFixed(2)}
              onChange={(weight) => patch({ weight })}
            />
            <Slider
              label="Highlight ceiling"
              value={set.figHi}
              min={60}
              max={255}
              step={5}
              onChange={(figHi) => patch({ figHi })}
            />
            <Slider
              label="Black point"
              value={set.bgCut}
              min={0}
              max={80}
              step={1}
              onChange={(bgCut) => patch({ bgCut })}
            />
            <Slider
              label="Midtones"
              value={set.gamma}
              min={0.5}
              max={1.6}
              step={0.05}
              format={(v) => v.toFixed(2)}
              onChange={(gamma) => patch({ gamma })}
            />
            <Slider
              label="Bottom fade"
              value={set.fade}
              min={0}
              max={0.6}
              step={0.02}
              format={(v) => v.toFixed(2)}
              onChange={(fade) => patch({ fade })}
            />
          </div>

          <h2 className="mb-4 mt-7 text-sm font-semibold tracking-tight text-ink-50">
            {mode === "scroll" ? "Develop" : mode === "assemble" ? "Arrival" : "Scatter"}
          </h2>
          {mode === "assemble" ? (
            <div className="grid gap-4">
              <Slider
                label="Throw distance"
                value={set.distance}
                min={0.05}
                max={1.2}
                step={0.02}
                format={(v) => v.toFixed(2)}
                onChange={(distance) => patch({ distance })}
              />
              <Slider
                label="Swirl"
                value={set.swirl}
                min={0}
                max={3.2}
                step={0.1}
                format={(v) => `${v.toFixed(1)} rad`}
                onChange={(swirl) => patch({ swirl })}
              />
              <Slider
                label="Turbulence"
                value={set.turbulence}
                min={0}
                max={0.2}
                step={0.005}
                format={(v) => v.toFixed(3)}
                onChange={(turbulence) => patch({ turbulence })}
              />
              <Slider
                label="Stagger"
                value={set.stagger}
                min={0}
                max={0.9}
                step={0.05}
                format={(v) => v.toFixed(2)}
                onChange={(stagger) => patch({ stagger })}
              />
              <Slider
                label="Order"
                value={set.order}
                min={0}
                max={1}
                step={0.05}
                format={(v) => (v < 0.2 ? "random" : v > 0.8 ? "radial" : v.toFixed(2))}
                onChange={(order) => patch({ order })}
              />
              <Slider
                label="Duration"
                value={set.duration}
                min={0.6}
                max={8}
                step={0.1}
                format={(v) => `${v.toFixed(1)}s`}
                onChange={(duration) => patch({ duration })}
              />
            </div>
          ) : mode === "scroll" ? (
            <div className="grid gap-4">
              <Slider
                label="Grain spread"
                value={set.spread}
                min={0}
                max={0.95}
                step={0.05}
                format={(v) => v.toFixed(2)}
                onChange={(spread) => patch({ spread })}
              />
              <Slider
                label="Scroll runway"
                value={set.runway}
                min={1.5}
                max={6}
                step={0.1}
                format={(v) => `${v.toFixed(1)}×`}
                onChange={(runway) => patch({ runway })}
              />
              <Slider
                label="Catch-up"
                value={set.lag}
                min={0.04}
                max={0.6}
                step={0.02}
                format={(v) => v.toFixed(2)}
                onChange={(lag) => patch({ lag })}
              />
            </div>
          ) : (
            <div className="grid gap-4">
              <Slider
                label="Cursor reach"
                value={set.reach}
                min={0.1}
                max={0.9}
                step={0.02}
                format={(v) => v.toFixed(2)}
                onChange={(reach) => patch({ reach })}
              />
              <Slider
                label="Push"
                value={set.push}
                min={0}
                max={0.24}
                step={0.005}
                format={(v) => v.toFixed(3)}
                onChange={(push) => patch({ push })}
              />
              <Slider
                label="Turbulence"
                value={set.drift}
                min={0}
                max={0.09}
                step={0.002}
                format={(v) => v.toFixed(3)}
                onChange={(drift) => patch({ drift })}
              />
              <Slider
                label="Lift"
                value={set.lift}
                min={0}
                max={0.08}
                step={0.002}
                format={(v) => v.toFixed(3)}
                onChange={(lift) => patch({ lift })}
              />
              <Slider
                label="Float"
                value={set.ease}
                min={0.02}
                max={0.4}
                step={0.01}
                format={(v) => v.toFixed(2)}
                onChange={(ease) => patch({ ease })}
              />
              <Slider
                label="Thinning"
                value={set.thin}
                min={0}
                max={0.9}
                step={0.05}
                format={(v) => v.toFixed(2)}
                onChange={(thin) => patch({ thin })}
              />
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              setSet(mode === "scroll" ? INITIAL : { ...INITIAL, ...DARK_COLOURS })
            }
            className="mt-6 rounded-lg border border-ink-700 bg-ink-850 px-3 py-1.5 font-mono text-[11px] text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-50"
          >
            Reset
          </button>
        </section>
      </div>

      {/* ------------------------------------------------------------- code */}
      <section className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-900">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-800 px-5 py-3">
          <div className="flex items-center gap-1">
            {(["react", "html"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={`rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors ${
                  tab === t
                    ? "bg-ink-700 text-ink-50"
                    : "text-ink-400 hover:bg-ink-800 hover:text-ink-200"
                }`}
              >
                {t === "react" ? "React" : "HTML"}
              </button>
            ))}
            <span className="ml-2 font-mono text-[11px] text-ink-600">
              {fileName2} · {formatBytes(new Blob([code]).size)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={download}
              className="rounded-md border border-ink-700 bg-ink-850 px-2.5 py-1 font-mono text-[11px] text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-50"
            >
              Download
            </button>
            <button
              type="button"
              onClick={copy}
              className="rounded-md border border-ink-700 bg-ink-850 px-2.5 py-1 font-mono text-[11px] text-ink-200 transition-colors hover:border-ink-600 hover:text-ink-50"
            >
              {copied ? "Copied" : "Copy code"}
            </button>
          </div>
        </header>

        <pre className="scroll-thin max-h-[420px] overflow-auto bg-ink-950 px-5 py-4 font-mono text-[12px] leading-[1.65] text-ink-200">
          {code}
        </pre>
      </section>
    </div>
  );
}
