"use client";

import { useState } from "react";
import { GradientEditor } from "./GradientEditor";
import { ICON_NAMES, IconView } from "./IconView";
import type { Action } from "./store";
import { isShippedFace, type Block, type Brand, type FontFace, type Paint, type Slide, type TextBlock, type TokenKey, type TypeRole } from "./types";

/**
 * The right-hand panel: what is selected, and what can be changed about it.
 * Alignment acts on the slide when one block is selected and on the group's
 * own bounds when several are — the way every layout tool does it.
 */

type Props = {
  slide: Slide;
  brand: Brand;
  selection: string[];
  dispatch: (a: Action) => void;
};

const TOKENS: TokenKey[] = ["paper", "ink", "primary", "accent", "muted", "surface"];

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="flex items-center justify-between gap-3 text-[12px] text-ink-400">
    <span className="shrink-0">{label}</span>
    <span className="flex min-w-0 items-center gap-1.5">{children}</span>
  </label>
);
const inputCls = "h-7 w-full min-w-0 rounded-md border border-ink-700 bg-ink-850 px-2 font-mono text-[11px] text-ink-100 outline-none focus:border-ink-500";
const Num = ({ value, onChange, step = 1, w = "w-16" }: { value: number; onChange: (v: number) => void; step?: number; w?: string }) => (
  <input type="number" step={step} value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0} onChange={(e) => onChange(Number(e.target.value))} className={`${inputCls} ${w}`} />
);
const Sel = <T extends string | number>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) => (
  <select value={value} onChange={(e) => onChange((typeof value === "number" ? Number(e.target.value) : e.target.value) as T)} className={`${inputCls} w-28`}>
    {options.map(([v, l]) => <option key={String(v)} value={v}>{l}</option>)}
  </select>
);
const Btn = ({ onClick, title, children, active }: { onClick: () => void; title: string; children: React.ReactNode; active?: boolean }) => (
  <button type="button" onClick={onClick} title={title} className={`h-7 min-w-7 rounded-md border px-2 font-mono text-[11px] transition-colors ${active ? "border-ink-500 bg-ink-700 text-ink-50" : "border-ink-700 bg-ink-850 text-ink-300 hover:border-ink-600 hover:text-ink-50"}`}>{children}</button>
);

export const inputClass = inputCls;

/** The four shipped faces, or any Google Fonts family typed by name. */
export function FaceField({ value, onChange }: { value: FontFace; onChange: (f: FontFace) => void }) {
  const custom = !isShippedFace(value);
  const [draft, setDraft] = useState(custom ? value : "");
  return (
    <span className="flex min-w-0 flex-col items-stretch gap-1">
      <select
        value={custom ? "google" : value}
        onChange={(e) => onChange(e.target.value === "google" ? draft || "Inter" : (e.target.value as FontFace))}
        className={`${inputCls} w-36`}
      >
        <option value="sans">Geist Sans</option>
        <option value="serif">Instrument Serif</option>
        <option value="mono">Geist Mono</option>
        <option value="display">Archivo Black</option>
        <option value="condensed">Bebas Neue</option>
        <option value="script">Caveat</option>
        <option value="google">Google font…</option>
      </select>
      {custom && (
        <input
          value={draft}
          placeholder="Family name, e.g. Space Grotesk"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => { if (draft.trim()) onChange(draft.trim()); }}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          className={`${inputCls} w-36`}
        />
      )}
    </span>
  );
}

function PaintPicker({ value, brand, onChange }: { value: Paint; brand: Brand; onChange: (p: Paint) => void }) {
  const isToken = !value.startsWith("#");
  return (
    <span className="flex items-center gap-1">
      {TOKENS.map((t) => (
        <button
          key={t} type="button" title={`${brand.palette[t].name} (${t})`}
          onClick={() => onChange(t)}
          className={`size-5 rounded-full border ${isToken && value === t ? "border-ink-50 ring-1 ring-ink-50" : "border-ink-600"}`}
          style={{ background: brand.palette[t].hex }}
        />
      ))}
      <input
        type="color" title="Custom colour"
        value={isToken ? brand.palette[value as TokenKey].hex : value}
        onChange={(e) => onChange(e.target.value as Paint)}
        className={`size-5 cursor-pointer rounded-full border bg-transparent p-0 ${!isToken ? "border-ink-50" : "border-ink-600"}`}
      />
    </span>
  );
}

export function Inspector({ slide, brand, selection, dispatch }: Props) {
  const selected = slide.blocks.filter((b) => selection.includes(b.id));
  const one = selected.length === 1 ? selected[0] : null;
  const patch = (p: Partial<Block> | ((b: Block) => Block)) => dispatch({ type: "patch", ids: selection, patch: p });

  // --- alignment
  const align = (how: "left" | "hcenter" | "right" | "top" | "vcenter" | "bottom") => {
    const ref = selected.length > 1
      ? { x: Math.min(...selected.map((b) => b.x)), y: Math.min(...selected.map((b) => b.y)), r: Math.max(...selected.map((b) => b.x + b.w)), b: Math.max(...selected.map((b) => b.y + b.h)) }
      : { x: 0, y: 0, r: 1600, b: 900 };
    patch((b) => {
      if (b.locked) return b;
      switch (how) {
        case "left": return { ...b, x: ref.x };
        case "hcenter": return { ...b, x: Math.round((ref.x + ref.r) / 2 - b.w / 2) };
        case "right": return { ...b, x: ref.r - b.w };
        case "top": return { ...b, y: ref.y };
        case "vcenter": return { ...b, y: Math.round((ref.y + ref.b) / 2 - b.h / 2) };
        case "bottom": return { ...b, y: ref.b - b.h };
      }
    });
  };
  const distribute = (axis: "x" | "y") => {
    if (selected.length < 3) return;
    const sorted = [...selected].sort((a, b) => a[axis] - b[axis]);
    const size = axis === "x" ? "w" : "h";
    const first = sorted[0], last = sorted[sorted.length - 1];
    const span = last[axis] + last[size] - first[axis];
    const total = sorted.reduce((s, b) => s + b[size], 0);
    const gap = (span - total) / (sorted.length - 1);
    let cursor = first[axis];
    const pos: Record<string, number> = {};
    for (const b of sorted) { pos[b.id] = Math.round(cursor); cursor += b[size] + gap; }
    patch((b) => (b.locked ? b : { ...b, [axis]: pos[b.id] }));
  };

  return (
    <aside className="flex h-full flex-col gap-5 overflow-y-auto scroll-thin text-sm">
      {/* ---- page */}
      <section>
        <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-ink-500">Page</h3>
        <div className="flex flex-col gap-2">
          <Field label="Name"><input value={slide.name} onChange={(e) => dispatch({ type: "slidePatch", patch: { name: e.target.value } })} className={`${inputCls} w-40`} /></Field>
          <Field label="Background"><PaintPicker value={slide.bg} brand={brand} onChange={(bg) => dispatch({ type: "slidePatch", patch: { bg, gradient: undefined, gradientStyle: undefined } })} /></Field>
          <GradientEditor value={slide.gradientStyle} legacy={slide.gradient} grain={slide.grain} onChange={patch => dispatch({ type: "slidePatch", patch })} />
          {slide.reference && (
            <>
              <Field label="Reference">
                <Btn title="Show or hide the traced reference under the page" active={slide.reference.visible} onClick={() => dispatch({ type: "slideReference", patch: { visible: !slide.reference!.visible } })}>
                  {slide.reference.visible ? "Shown" : "Hidden"}
                </Btn>
                <Btn title="Remove the reference from this page" onClick={() => dispatch({ type: "slideReference", patch: null })}>Remove</Btn>
              </Field>
              <Field label="Opacity">
                <input type="range" min={0.1} max={1} step={0.05} value={slide.reference.opacity} onChange={(e) => dispatch({ type: "slideReference", patch: { opacity: Number(e.target.value) } })} className="w-36 accent-accent" />
              </Field>
              <p className="text-[11px] text-ink-600">The reference never prints. Rebuild it in blocks, then hide or remove it.</p>
            </>
          )}
        </div>
      </section>

      {!selected.length && (
        <p className="text-[12px] leading-relaxed text-ink-500">
          Select a block to edit it. Drag to move, corners to resize, double-click text to edit it in place. Shift-click to select several; drop an image anywhere on the page.
        </p>
      )}

      {selected.length > 0 && (
        <>
          {/* ---- arrange */}
          <section>
            <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-ink-500">
              Align {selected.length > 1 ? `· ${selected.length} selected` : "· to page"}
            </h3>
            <div className="flex flex-wrap gap-1">
              <Btn title="Align left" onClick={() => align("left")}>⇤</Btn>
              <Btn title="Align centre" onClick={() => align("hcenter")}>↔</Btn>
              <Btn title="Align right" onClick={() => align("right")}>⇥</Btn>
              <Btn title="Align top" onClick={() => align("top")}>⤒</Btn>
              <Btn title="Align middle" onClick={() => align("vcenter")}>↕</Btn>
              <Btn title="Align bottom" onClick={() => align("bottom")}>⤓</Btn>
              {selected.length >= 3 && (<>
                <Btn title="Distribute horizontally" onClick={() => distribute("x")}>⋯</Btn>
                <Btn title="Distribute vertically" onClick={() => distribute("y")}>⋮</Btn>
              </>)}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <Btn title="Bring to front" onClick={() => dispatch({ type: "order", ids: selection, dir: "front" })}>Front</Btn>
              <Btn title="Bring forward" onClick={() => dispatch({ type: "order", ids: selection, dir: "forward" })}>+1</Btn>
              <Btn title="Send backward" onClick={() => dispatch({ type: "order", ids: selection, dir: "backward" })}>−1</Btn>
              <Btn title="Send to back" onClick={() => dispatch({ type: "order", ids: selection, dir: "back" })}>Back</Btn>
              <Btn title="Duplicate (⌘D)" onClick={() => dispatch({ type: "duplicate", ids: selection })}>Dup</Btn>
              <Btn title="Lock / unlock" active={selected.every((b) => b.locked)} onClick={() => patch((b) => ({ ...b, locked: !selected.every((s) => s.locked) }))}>Lock</Btn>
              <Btn title="Delete" onClick={() => dispatch({ type: "remove", ids: selection })}>Del</Btn>
            </div>
          </section>

          {/* ---- geometry */}
          {one && (
            <section>
              <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-ink-500">Position · {one.kind}</h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                <Field label="X"><Num value={one.x} onChange={(x) => patch({ x })} /></Field>
                <Field label="Y"><Num value={one.y} onChange={(y) => patch({ y })} /></Field>
                <Field label="W"><Num value={one.w} onChange={(w) => patch({ w: Math.max(16, w) })} /></Field>
                <Field label="H"><Num value={one.h} onChange={(h) => patch({ h: Math.max(16, h) })} /></Field>
                <Field label="Rotate"><Num value={one.rotation ?? 0} onChange={(rotation) => patch({ rotation })} /></Field>
                <Field label="Opacity"><Num value={(one.opacity ?? 1) * 100} onChange={(value) => patch({ opacity: Math.max(0, Math.min(1, value / 100)) })} /></Field>
              </div>
            </section>
          )}

          {/* ---- kind-specific */}
          {one?.kind === "text" && (
            <section>
              <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-ink-500">Type</h3>
              <div className="flex flex-col gap-2">
                <textarea
                  value={one.text}
                  onChange={(e) => patch({ text: e.target.value })}
                  rows={3}
                  className="w-full rounded-md border border-ink-700 bg-ink-850 p-2 font-mono text-[11px] text-ink-100 outline-none focus:border-ink-500"
                />
                <p className="text-[11px] text-ink-600">{"{brand} {tagline} {edition} {year} fill in from the brand."}</p>
                <Field label="Role">
                  <Sel
                    value={one.role ?? "custom"}
                    options={[["custom", "Custom"], ["h1", "H1"], ["h2", "H2"], ["h3", "H3"], ["body", "Body"]]}
                    onChange={(v) => patch((b) => { const { role, ...rest } = b as TextBlock; void role; return v === "custom" ? rest as Block : { ...rest, role: v as TypeRole }; })}
                  />
                </Field>
                {one.role ? (
                  <p className="text-[11px] text-ink-600">Face, weight and case come from <b className="uppercase text-ink-400">{one.role}</b> in Brand › Type. Size, leading and colour stay with the block.</p>
                ) : (
                  <>
                    <Field label="Face"><FaceField value={one.font} onChange={(font) => patch({ font })} /></Field>
                    <Field label="Weight"><Sel value={one.weight} options={[[400, "400"], [500, "500"], [600, "600"], [700, "700"], [800, "800"], [900, "900"]]} onChange={(weight) => patch({ weight: weight as TextBlock["weight"] })} /></Field>
                  </>
                )}
                <Field label="Size"><Num value={one.size} onChange={(size) => patch({ size: Math.max(6, size) })} /></Field>
                <Field label="Leading"><Num value={one.lineHeight} step={.05} onChange={(lineHeight) => patch({ lineHeight })} /></Field>
                <Field label="Tracking"><Num value={one.tracking} step={.01} onChange={(tracking) => patch({ tracking })} /></Field>
                <Field label="Align">
                  <Btn title="Left" active={one.align === "left"} onClick={() => patch({ align: "left" })}>L</Btn>
                  <Btn title="Centre" active={one.align === "center"} onClick={() => patch({ align: "center" })}>C</Btn>
                  <Btn title="Right" active={one.align === "right"} onClick={() => patch({ align: "right" })}>R</Btn>
                </Field>
                <Field label="Vertical">
                  <Btn title="Top" active={one.valign === "top"} onClick={() => patch({ valign: "top" })}>T</Btn>
                  <Btn title="Middle" active={one.valign === "middle"} onClick={() => patch({ valign: "middle" })}>M</Btn>
                  <Btn title="Bottom" active={one.valign === "bottom"} onClick={() => patch({ valign: "bottom" })}>B</Btn>
                </Field>
                {!one.role && (
                  <Field label="Style">
                    <Btn title="Uppercase" active={!!one.uppercase} onClick={() => patch({ uppercase: !one.uppercase })}>AA</Btn>
                    <Btn title="Italic" active={!!one.italic} onClick={() => patch({ italic: !one.italic })}><i>I</i></Btn>
                  </Field>
                )}
                <Field label="Colour"><PaintPicker value={one.color} brand={brand} onChange={(color) => patch({ color })} /></Field>
              </div>
            </section>
          )}

          {one?.kind === "image" && (
            <section>
              <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-ink-500">Image</h3>
              <div className="flex flex-col gap-2">
                <Field label="Fit"><Sel value={one.fit} options={[["cover", "Cover"], ["contain", "Contain"]]} onChange={(fit) => patch({ fit })} /></Field>
                <Field label="Radius"><Num value={one.radius} onChange={(radius) => patch({ radius: Math.max(0, radius) })} /></Field>
                <Field label="Empty tint"><PaintPicker value={one.tint} brand={brand} onChange={(tint) => patch({ tint })} /></Field>
                <Field label="Label"><input value={one.label} onChange={(e) => patch({ label: e.target.value })} className={`${inputCls} w-40`} /></Field>
                <Field label="Crop X"><Num value={one.focalX ?? 50} onChange={(focalX) => patch({ focalX: Math.max(0, Math.min(100, focalX)) })} /></Field>
                <Field label="Crop Y"><Num value={one.focalY ?? 50} onChange={(focalY) => patch({ focalY: Math.max(0, Math.min(100, focalY)) })} /></Field>
                <Btn title="Toggle black and white" active={one.grayscale} onClick={() => patch({ grayscale: !one.grayscale })}>Black & white</Btn>
                <p className="text-[11px] text-ink-500">Click the image on the page to browse a replacement. Shift-click selects it without opening the browser.</p>
                {one.src && <Btn title="Remove the picture, keep the slot" onClick={() => patch({ src: undefined })}>Clear image</Btn>}
              </div>
            </section>
          )}

          {one?.kind === "rect" && (
            <section>
              <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-ink-500">Shape</h3>
              <div className="flex flex-col gap-2">
                <Field label="Fill"><PaintPicker value={one.fill} brand={brand} onChange={(fill) => patch({ fill, gradient: undefined, gradientStyle: undefined })} /></Field>
                <GradientEditor value={one.gradientStyle} legacy={one.gradient} grain={one.grain} onChange={patch} />
                <Field label="Radius"><Num value={one.radius} onChange={(radius) => patch({ radius: Math.max(0, radius) })} /></Field>
              </div>
            </section>
          )}

          {one?.kind === "icon" && <section>
            <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-ink-500">Icon</h3>
            <div className="grid grid-cols-5 gap-2">
              {ICON_NAMES.map(icon => <button type="button" key={icon} title={icon} aria-label={`Use ${icon} icon`} className="size-8 rounded border border-ink-700 p-1 text-ink-200" onClick={() => patch({ icon, src: undefined })}><IconView name={icon} /></button>)}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <Field label="Colour"><PaintPicker value={one.color} brand={brand} onChange={color => patch({ color })} /></Field>
              <Field label="Stroke"><Num value={one.strokeWidth} step={.2} onChange={strokeWidth => patch({ strokeWidth: Math.max(.2, strokeWidth) })} /></Field>
              <p className="text-[11px] text-ink-500">Click the icon on the page to upload a replacement. Choose a symbol here to restore its default vector.</p>
            </div>
          </section>}

          {one?.kind === "swatch" && (
            <section>
              <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-ink-500">Swatch</h3>
              <div className="flex flex-col gap-2">
                <Field label="Colour">
                  <Sel
                    value={typeof one.token === "number" ? `x${one.token}` : one.token}
                    options={[...TOKENS.map((t) => [t, brand.palette[t].name] as [string, string]), ...brand.extras.map((e, i) => [`x${i}`, e.name] as [string, string])]}
                    onChange={(v) => patch({ token: v.startsWith("x") ? Number(v.slice(1)) : (v as TokenKey) })}
                  />
                </Field>
                <Field label="Caption"><Sel value={one.caption} options={[["inside", "Inside"], ["below", "Below"], ["none", "None"]]} onChange={(caption) => patch({ caption })} /></Field>
                <Field label="Radius"><Num value={one.radius} onChange={(radius) => patch({ radius: Math.max(0, radius) })} /></Field>
              </div>
            </section>
          )}

          {one?.kind === "logo" && (
            <section>
              <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-ink-500">Logo</h3>
              <div className="flex flex-col gap-2">
                <Field label="Colour"><PaintPicker value={one.color} brand={brand} onChange={(color) => patch({ color })} /></Field>
                <Field label="Wordmark size"><Num value={one.size} onChange={(size) => patch({ size: Math.max(8, size) })} /></Field>
                <p className="text-[11px] text-ink-600">Shows the brand name in the display face until a logo is uploaded in Brand.</p>
              </div>
            </section>
          )}
        </>
      )}
    </aside>
  );
}
