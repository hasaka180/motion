"use client";

import { GRADIENT_PRESETS, gradientCss } from "./gradients";
import type { GradientStyle } from "./types";

type Props = {
  value?: GradientStyle;
  legacy?: string;
  grain?: number;
  onChange: (patch: { gradientStyle?: GradientStyle; gradient?: string; grain?: number }) => void;
};
export function GradientEditor({ value, legacy, grain = 0, onChange }: Props) {
  const input = "h-7 min-w-0 rounded border border-ink-700 bg-ink-850 px-2 text-xs text-ink-200";
  const update = (patch: Partial<GradientStyle>) => onChange({ gradientStyle: { ...(value ?? GRADIENT_PRESETS[0].value), ...patch }, gradient: undefined });
  return <details className="rounded-lg border border-ink-800 p-2" open={!!value || !!legacy}>
    <summary className="cursor-pointer text-xs text-ink-300">Gradient & texture</summary>
    <div className="mt-3 flex flex-col gap-3">
      <div className="grid grid-cols-5 gap-1.5">
        {GRADIENT_PRESETS.map(p => <button key={p.name} type="button" aria-label={p.name} title={p.name}
          onClick={() => onChange({ gradientStyle: structuredClone(p.value), gradient: undefined })}
          className="h-8 rounded border border-white/20" style={{ background: gradientCss(p.value) }} />)}
      </div>
      {value && <>
        <label className="flex items-center justify-between text-xs text-ink-400">Gradient type
          <select aria-label="Gradient type" className={input} value={value.kind} onChange={e => update({ kind: e.target.value as GradientStyle["kind"] })}>
            <option value="linear">Linear</option><option value="radial">Radial</option><option value="mesh">Mesh</option><option value="edge">Edge glow</option>
          </select>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {value.colors.map((color, i) => <label key={i} className="text-[10px] text-ink-500">Colour {i + 1}
            <input type="color" aria-label={`Gradient colour ${i + 1}`} value={color} className="mt-1 h-7 w-full cursor-pointer rounded bg-transparent"
              onChange={e => { const colors = [...value.colors] as GradientStyle["colors"]; colors[i] = e.target.value; update({ colors }); }} />
          </label>)}
        </div>
        {value.kind !== "mesh" && <label className="flex items-center justify-between text-xs text-ink-400">Angle
          <input aria-label="Gradient angle" type="number" min={0} max={360} value={value.angle} className={`${input} w-20`} onChange={e => update({ angle: Number(e.target.value) })} />
        </label>}
      </>}
      <label className="flex items-center justify-between gap-3 text-xs text-ink-400">Grain {Math.round(grain * 100)}%
        <input aria-label="Grain amount" type="range" min={0} max={.5} step={.01} value={grain} className="min-w-0 flex-1 accent-accent" onChange={e => onChange({ grain: Number(e.target.value) })} />
      </label>
      <button type="button" className={`${input} text-left`} onClick={() => onChange({ gradientStyle: undefined, gradient: undefined, grain: 0 })}>Remove gradient & texture</button>
      <details><summary className="cursor-pointer text-[11px] text-ink-500">Custom CSS gradient</summary>
        <input aria-label="Custom CSS gradient" className={`${input} mt-2 w-full`} placeholder="linear-gradient(…)" value={legacy ?? ""} onChange={e => onChange({ gradient: e.target.value || undefined, gradientStyle: undefined })} />
      </details>
    </div>
  </details>;
}
