"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { SlideView } from "./SlideView";
import { shrinkImage, type Action } from "./store";
import { SLIDE_H, SLIDE_W, uid, type Block, type Brand, type Slide } from "./types";

/**
 * The editing surface. Blocks live in slide units (1600×900); the slide is
 * scaled to fit the pane, and every pointer delta is divided back by that
 * scale so a drag moves what the cursor moves.
 *
 * Snapping is to the slide's edges and centre and to every other block's
 * edges and centre, within a few slide units — the guides you see are the
 * candidates that won. A gesture takes one undo snapshot when it starts.
 */

type Props = {
  slide: Slide;
  brand: Brand;
  selection: string[];
  dispatch: (a: Action) => void;
  onWarn: (msg: string) => void;
};

const SNAP = 8;
const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;
type Handle = (typeof HANDLES)[number];

type Gesture =
  | { kind: "move"; start: { x: number; y: number }; origin: Record<string, { x: number; y: number }> }
  | { kind: "resize"; handle: Handle; start: { x: number; y: number }; origin: Block; aspect: number };

export function Canvas({ slide, brand, selection, dispatch, onWarn }: Props) {
  const paneRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [scale, setScale] = useState(0.5);
  const [editing, setEditing] = useState<string | null>(null);
  const [guides, setGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const gesture = useRef<Gesture | null>(null);
  const pendingImage = useRef<string | null>(null);

  // Fit the slide to the pane.
  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(Math.max(0.1, (entry.contentRect.width - 2) / SLIDE_W));
    });
    ro.observe(pane);
    return () => ro.disconnect();
  }, []);

  const selected = slide.blocks.filter((b) => selection.includes(b.id));
  const bounds = selected.length
    ? {
        x: Math.min(...selected.map((b) => b.x)), y: Math.min(...selected.map((b) => b.y)),
        r: Math.max(...selected.map((b) => b.x + b.w)), b: Math.max(...selected.map((b) => b.y + b.h)),
      }
    : null;

  // ------------------------------------------------------------ gestures
  const slideUnits = (e: { clientX: number; clientY: number }) => {
    const pane = paneRef.current!.getBoundingClientRect();
    return { x: (e.clientX - pane.left) / scale, y: (e.clientY - pane.top) / scale };
  };

  /** Whatever ends the gesture in flight — kept so unmount can call it. */
  const release = useRef<(() => void) | null>(null);
  useEffect(() => () => release.current?.(), []);

  /**
   * Listeners are bound per gesture and close over the geometry at the moment
   * it starts. That is deliberate: the blocks being dragged are read from the
   * gesture's own origin record, and the ones being snapped to do not move
   * while it runs, so nothing here can go stale.
   */
  const beginGesture = (g: Gesture) => {
    release.current?.();
    gesture.current = g;
    dispatch({ type: "snapshot" });
    const blocks = slide.blocks;

    const move = (e: PointerEvent) => {
      const p = slideUnits(e);
      const dx = p.x - g.start.x, dy = p.y - g.start.y;

      if (g.kind === "move") {
        const ids = Object.keys(g.origin);
        const moving = blocks.filter((b) => ids.includes(b.id));
        const others = blocks.filter((b) => !ids.includes(b.id));
        const minX = Math.min(...moving.map((b) => g.origin[b.id].x));
        const minY = Math.min(...moving.map((b) => g.origin[b.id].y));
        const w = Math.max(...moving.map((b) => g.origin[b.id].x + b.w)) - minX;
        const h = Math.max(...moving.map((b) => g.origin[b.id].y + b.h)) - minY;
        const left = minX + dx, top = minY + dy;

        const xs = [0, SLIDE_W / 2, SLIDE_W, ...others.flatMap((b) => [b.x, b.x + b.w / 2, b.x + b.w])];
        const ys = [0, SLIDE_H / 2, SLIDE_H, ...others.flatMap((b) => [b.y, b.y + b.h / 2, b.y + b.h])];
        let sx = 0, sy = 0;
        const gx: number[] = [], gy: number[] = [];
        // A little looser when zoomed out, so a snap is still reachable.
        const snap = (cands: number[], edges: number[], set: (d: number, c: number) => void) => {
          let best = (SNAP / scale) * 1.2;
          for (const c of cands) for (const edge of edges) {
            const d = c - edge;
            if (Math.abs(d) < best) { best = Math.abs(d); set(d, c); }
          }
        };
        snap(xs, [left, left + w / 2, left + w], (d, c) => { sx = d; gx.length = 0; gx.push(c); });
        snap(ys, [top, top + h / 2, top + h], (d, c) => { sy = d; gy.length = 0; gy.push(c); });
        if (e.altKey) { sx = 0; sy = 0; gx.length = 0; gy.length = 0; }
        setGuides({ x: gx, y: gy });

        dispatch({
          type: "patch", ids, transient: true,
          patch: (b) => ({ ...b, x: Math.round(g.origin[b.id].x + dx + sx), y: Math.round(g.origin[b.id].y + dy + sy) }),
        });
        return;
      }

      const o = g.origin;
      let { x, y, w, h } = o;
      const hd = g.handle;
      if (hd.includes("e")) w = o.w + dx;
      if (hd.includes("s")) h = o.h + dy;
      if (hd.includes("w")) { x = o.x + dx; w = o.w - dx; }
      if (hd.includes("n")) { y = o.y + dy; h = o.h - dy; }
      if (e.shiftKey && hd.length === 2) {
        // Corners keep the aspect when shift is held.
        if (Math.abs(w / o.w) > Math.abs(h / o.h)) h = w / g.aspect; else w = h * g.aspect;
        if (hd.includes("w")) x = o.x + o.w - w;
        if (hd.includes("n")) y = o.y + o.h - h;
      }
      w = Math.max(16, w); h = Math.max(16, h);
      dispatch({ type: "patch", ids: [o.id], transient: true, patch: { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) } });
    };

    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      release.current = null;
      gesture.current = null;
      setGuides({ x: [], y: [] });
    };
    release.current = up;
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onBlockPointerDown = (e: ReactPointerEvent, block: Block) => {
    if (editing) { if (editing !== block.id) setEditing(null); else return; }
    if (e.button !== 0) return;
    e.stopPropagation();
    let ids = selection;
    if (e.shiftKey) {
      dispatch({ type: "select", ids: [block.id], additive: true });
      ids = selection.includes(block.id) ? selection.filter((i) => i !== block.id) : [...selection, block.id];
    } else if (!selection.includes(block.id)) {
      dispatch({ type: "select", ids: [block.id] });
      ids = [block.id];
    }
    if (block.locked || !ids.length) return;
    const origin: Record<string, { x: number; y: number }> = {};
    for (const b of slide.blocks) if (ids.includes(b.id) && !b.locked) origin[b.id] = { x: b.x, y: b.y };
    if (!Object.keys(origin).length) return;
    beginGesture({ kind: "move", start: slideUnits(e), origin });
  };

  const onHandleDown = (e: ReactPointerEvent, handle: Handle) => {
    if (selected.length !== 1 || e.button !== 0) return;
    e.stopPropagation();
    const o = selected[0];
    beginGesture({ kind: "resize", handle, start: slideUnits(e), origin: o, aspect: o.w / Math.max(1, o.h) });
  };

  // ------------------------------------------------------------ images
  const placeImage = async (files: FileList, targetId: string | null, at?: { x: number; y: number }) => {
    const file = Array.from(files).find((f) => f.type.startsWith("image/"));
    if (!file) { onWarn("That wasn't an image."); return; }
    try {
      const src = await shrinkImage(file);
      if (targetId) {
        dispatch({ type: "patch", ids: [targetId], patch: { src } });
      } else {
        const w = 560, h = 380;
        const x = Math.round(Math.max(0, Math.min(SLIDE_W - w, (at?.x ?? SLIDE_W / 2) - w / 2)));
        const y = Math.round(Math.max(0, Math.min(SLIDE_H - h, (at?.y ?? SLIDE_H / 2) - h / 2)));
        dispatch({ type: "add", block: { id: uid("i"), kind: "image", x, y, w, h, src, fit: "cover", radius: 0, label: "Image", tint: "surface" } });
      }
    } catch {
      onWarn("Couldn't read that image.");
    }
  };

  // ------------------------------------------------------------ keyboard
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (editing) { if (e.key === "Escape") { (document.activeElement as HTMLElement | null)?.blur(); setEditing(null); } return; }
    const meta = e.metaKey || e.ctrlKey;
    if (meta && e.key.toLowerCase() === "z") { e.preventDefault(); dispatch({ type: e.shiftKey ? "redo" : "undo" }); return; }
    if (meta && e.key.toLowerCase() === "d" && selection.length) { e.preventDefault(); dispatch({ type: "duplicate", ids: selection }); return; }
    if (meta && e.key.toLowerCase() === "a") { e.preventDefault(); dispatch({ type: "select", ids: slide.blocks.map((b) => b.id) }); return; }
    if (!selection.length) return;
    if (e.key === "Backspace" || e.key === "Delete") { e.preventDefault(); dispatch({ type: "remove", ids: selection }); return; }
    if (e.key === "Escape") { dispatch({ type: "select", ids: [] }); return; }
    if (e.key === "Enter" && selected.length === 1 && selected[0].kind === "text") { e.preventDefault(); setEditing(selected[0].id); return; }
    const step = e.shiftKey ? 10 : 1;
    const nudge = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (nudge) {
      e.preventDefault();
      dispatch({ type: "patch", ids: selection, patch: (b) => (b.locked ? b : { ...b, x: b.x + nudge[0], y: b.y + nudge[1] }) });
    }
  };

  // ------------------------------------------------------------ render
  const H = 10; // handle size in screen px
  const handlePos = (hd: Handle, b: { x: number; y: number; r: number; b: number }) => {
    const cx = (b.x + b.r) / 2, cy = (b.y + b.b) / 2;
    const x = hd.includes("w") ? b.x : hd.includes("e") ? b.r : cx;
    const y = hd.includes("n") ? b.y : hd.includes("s") ? b.b : cy;
    return { left: x * scale - H / 2, top: y * scale - H / 2 };
  };
  const cursorFor: Record<Handle, string> = { n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize", ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize" };

  return (
    <div
      ref={paneRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={() => { if (!editing) dispatch({ type: "select", ids: [] }); else { setEditing(null); } }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
      onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) void placeImage(e.dataTransfer.files, null, slideUnits(e)); }}
      className="relative w-full select-none overflow-hidden rounded-xl border border-ink-800 bg-ink-950 outline-none focus-visible:ring-1 focus-visible:ring-accent"
      style={{ height: Math.round(SLIDE_H * scale) + 2 }}
    >
      <input
        ref={fileRef} type="file" accept="image/*" hidden
        onChange={(e) => { const id = pendingImage.current; pendingImage.current = null; if (e.target.files?.length) void placeImage(e.target.files, id); e.target.value = ""; }}
      />

      {/* the slide, scaled */}
      <div style={{ position: "absolute", left: 1, top: 1, width: SLIDE_W, height: SLIDE_H, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        <SlideView
          slide={slide}
          brand={brand}
          editable
          editingId={editing}
          selection={selection}
          onBlockPointerDown={onBlockPointerDown}
          onBlockDoubleClick={(b) => { if (b.kind === "text" && !b.locked) { dispatch({ type: "select", ids: [b.id] }); setEditing(b.id); } }}
          onTextCommit={(id, text) => { dispatch({ type: "patch", ids: [id], patch: { text } }); setEditing(null); }}
          onImageDrop={(id, files) => void placeImage(files, id)}
          onImageClick={(id) => { pendingImage.current = id; fileRef.current?.click(); }}
        />
      </div>

      {/* overlay in screen space: guides, selection, handles */}
      <div className="pointer-events-none absolute inset-0" style={{ left: 1, top: 1 }}>
        {guides.x.map((x) => <div key={`x${x}`} className="absolute top-0 h-full w-px bg-accent-alt" style={{ left: x * scale }} />)}
        {guides.y.map((y) => <div key={`y${y}`} className="absolute left-0 w-full bg-accent-alt" style={{ top: y * scale, height: 1 }} />)}

        {selected.map((b) => (
          <div key={b.id} className="absolute border border-accent" style={{ left: b.x * scale, top: b.y * scale, width: b.w * scale, height: b.h * scale, opacity: b.locked ? .5 : 1 }} />
        ))}

        {bounds && selected.length === 1 && !selected[0].locked && !editing && HANDLES.map((hd) => (
          <div
            key={hd}
            onPointerDown={(e) => onHandleDown(e, hd)}
            className="pointer-events-auto absolute rounded-[2px] border border-accent bg-ink-950"
            style={{ ...handlePos(hd, bounds), width: H, height: H, cursor: cursorFor[hd] }}
          />
        ))}

        {bounds && (
          <div className="absolute rounded-md bg-ink-900/90 px-1.5 py-0.5 font-mono text-[10px] text-ink-200" style={{ left: bounds.x * scale, top: bounds.b * scale + 6 }}>
            {Math.round(bounds.x)}, {Math.round(bounds.y)} · {Math.round(bounds.r - bounds.x)}×{Math.round(bounds.b - bounds.y)}
          </div>
        )}
      </div>
    </div>
  );
}
