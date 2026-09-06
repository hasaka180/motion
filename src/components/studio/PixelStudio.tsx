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
  formatBytes,
  toHtml,
  toReact,
  type ExportSettings,
} from "@/lib/pixelExport";

/**
 * Upload a picture, watch it develop, take the code.
 *
 * The preview runs the same lerp the exported code does — not a spring — so
 * the Catch-up slider means the same thing here as it will on the page you
 * paste into. What you scrub is what you ship.
 */

/** The embedded copy only feeds a grid a few hundred cells wide, so it can be
 *  small: this cap keeps the pasted code in the tens of KB, not the megabytes. */
const EMBED_MAX = 640;

type Settings = ExportSettings;

const INITIAL: Settings = {
  ...DEFAULTS,
  ink: "#12222a",
  ground: "#f1efe9",
  round: false,
  runway: 3.2,
  ease: 0.16,
};

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
  const [copied, setCopied] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const cellsRef = useRef<Cells | null>(null);
  const cellRef = useRef(1);
  const currentRef = useRef(0);
  /** Live settings for the rAF loop, so it never closes over a stale value. */
  const setRef = useRef(set);
  useEffect(() => {
    setRef.current = set;
  }, [set]);

  const patch = useCallback(
    (p: Partial<Settings>) => setSet((s) => ({ ...s, ...p })),
    []
  );

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

  // The paint loop reads through a ref so it never has to be torn down.
  useEffect(() => {
    cellsRef.current = cells;
  }, [cells]);

  const cellCount = cells?.n ?? 0;
  const grid = cells ? `${cells.cols} × ${cells.rows}` : "—";

  // One loop drives layout, the develop lerp and painting.
  useEffect(() => {
    const cv = canvasRef.current;
    const stage = stageRef.current;
    const scroller = scrollRef.current;
    if (!cv || !stage || !scroller) return;
    ctxRef.current = cv.getContext("2d");

    let frame = 0;
    let lastKey = "";

    const layout = () => {
      const ctx = ctxRef.current;
      const cells = cellsRef.current;
      if (!ctx || !cells) return;
      const box = stage.getBoundingClientRect();
      const cell = Math.min(
        (box.width * 0.8) / cells.cols,
        (box.height * 0.88) / cells.rows
      );
      cellRef.current = cell;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.style.width = `${cells.cols * cell}px`;
      cv.style.height = `${cells.rows * cell}px`;
      cv.width = Math.round(cells.cols * cell * dpr);
      cv.height = Math.round(cells.rows * cell * dpr);
      // Assigning width/height clears the transform, so set it after.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

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

        const span = scroller.scrollHeight - scroller.clientHeight;
        const target = span > 0 ? scroller.scrollTop / span : 0;
        currentRef.current += (target - currentRef.current) * s.ease;
        paintCells(ctx, cells, cellRef.current, currentRef.current, s.ink, s.round);
      }
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  const code = useMemo(() => {
    if (!dataUri) return "";
    return tab === "react" ? toReact(dataUri, set) : toHtml(dataUri, set);
  }, [dataUri, set, tab]);

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
    a.download = tab === "react" ? "ScrollDither.tsx" : "scroll-dither.html";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ---------------------------------------------------------- preview */}
      <section className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-900">
        <header className="flex items-center justify-between gap-4 border-b border-ink-800 px-5 py-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-400">
            Scroll the stage to develop
          </p>
          <p className="font-mono text-[11px] tabular-nums text-ink-600">
            {grid} · {cellCount.toLocaleString()} cells
          </p>
        </header>

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
            <Check label="Round dots" checked={set.round} onChange={(round) => patch({ round })} />
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

          <h2 className="mb-4 mt-7 text-sm font-semibold tracking-tight text-ink-50">Develop</h2>
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
              value={set.ease}
              min={0.04}
              max={0.6}
              step={0.02}
              format={(v) => v.toFixed(2)}
              onChange={(ease) => patch({ ease })}
            />
          </div>

          <button
            type="button"
            onClick={() => setSet(INITIAL)}
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
              {tab === "react" ? "ScrollDither.tsx" : "scroll-dither.html"} ·{" "}
              {formatBytes(new Blob([code]).size)}
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
