"use client";

import { useEffect, useRef, useState } from "react";
import { FORMS, Transformation, type Form, type Snapshot } from "./blob-kid/forms";
import { createStudio, type Studio, type View } from "./blob-kid/renderer";

const PHASE_LABELS = {
  HUMANOID: "A little being. Endless possibilities.",
  COMPRESSING: "Letting go of this shape…",
  LIQUID_MASS: "A moment in between…",
  REFORMING: "Becoming something new…",
  STABILIZING: "Settling into shape…",
  TARGET_IDLE: "Same little being. A new possibility.",
};

export function BlobKidHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const studioRef = useRef<Studio | null>(null);
  const [state, setState] = useState<Snapshot>(() => new Transformation().snapshot());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Paint the loading UI before compiling all seven procedural forms.
    const start = requestAnimationFrame(() => {
      try {
        studioRef.current = createStudio(canvas, setState, setError);
        setReady(true);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "The studio could not start.");
      }
    });
    return () => { cancelAnimationFrame(start); studioRef.current?.dispose(); studioRef.current = null; };
  }, [session]);

  const unavailable = !ready || !!error;
  return (
    <div data-blob-studio data-form={FORMS[state.current]} data-phase={state.phase} className="absolute inset-0 flex flex-col overflow-hidden bg-[#f3f1ed] text-[#55505e]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-5 sm:p-7">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#827b89]">An experiment in becoming</p>
          <h2 className="mt-1 text-2xl font-medium tracking-[-0.06em] text-[#514959]">Blob kid<span className="text-[#afa5b9]">.</span></h2>
        </div>
        <span className="rounded-full border border-[#dcd5df] px-2.5 py-1 font-mono text-[9px] tracking-wider text-[#827b89]">0{state.target+1} / 07</span>
      </div>
      <div className="relative min-h-0 flex-1">
        <canvas key={session} ref={canvasRef} tabIndex={0} aria-label={`3D ${FORMS[state.current]}. Drag or use arrow keys to orbit. Pinch to zoom. Number keys 1 to 7 select a form.`} className="block h-full w-full cursor-grab touch-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#9b8cab] active:cursor-grabbing" />
        <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center justify-between gap-2 sm:left-7 sm:right-7">
          <div role="group" aria-label="Camera views" className="flex rounded-full border border-[#ded8e1] bg-[#f8f6f3]/90 p-0.5">
            {(["Orbit", "Front", "Side", "Rear", "Top"] as View[]).map(view => (
              <button type="button" key={view} disabled={unavailable} onClick={() => studioRef.current?.view(view)} className="rounded-full px-2 py-2 text-[10px] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-[#8f7da1] disabled:opacity-40 sm:px-3">{view}</button>
            ))}
          </div>
          <div role="group" aria-label="Camera zoom" className="flex rounded-full border border-[#ded8e1] bg-[#f8f6f3]/90 p-0.5">
            <button type="button" aria-label="Zoom out" disabled={unavailable} onClick={() => studioRef.current?.zoom(0.6)} className="h-8 w-8 rounded-full hover:bg-white">−</button>
            <button type="button" aria-label="Zoom in" disabled={unavailable} onClick={() => studioRef.current?.zoom(-0.6)} className="h-8 w-8 rounded-full hover:bg-white">+</button>
          </div>
        </div>
        {(!ready || error) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#f3f1ed] p-8 text-center text-sm" role="status">
            <p>{error ? "The studio couldn’t start." : "Warming up the studio…"}</p>
            {error && <><p className="max-w-sm text-xs">{error}</p><button type="button" className="rounded-full border border-[#bcb0c7] px-4 py-2" onClick={() => { setReady(false); setError(null); setSession(value => value+1); }}>Reload studio</button></>}
          </div>
        )}
      </div>
      <div className="relative z-10 border-t border-[#e2dce4] bg-[#f8f6f3] px-4 pb-4 pt-3 sm:px-7 sm:pb-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p role="status" aria-live="polite" className="text-[11px] text-[#827789]">{PHASE_LABELS[state.phase]}</p>
          <button type="button" disabled={unavailable || state.locked || state.current === 0} onClick={() => studioRef.current?.select(0)} className="shrink-0 text-[10px] text-[#6c5a7d] hover:underline disabled:opacity-35">Reset ↺</button>
        </div>
        <div role="group" aria-label="Choose a form" className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
          {FORMS.map((name, index) => (
            <button key={name} type="button" aria-pressed={state.current === index} disabled={unavailable || state.locked} onClick={() => studioRef.current?.select(index as Form)} className={`flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-1 text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8f7da1] disabled:cursor-default ${state.target === index ? "border-[#887497] bg-[#887497] text-white" : "border-[#dfd8e4] bg-white/50 text-[#75677f] hover:border-[#b7a6c4] hover:bg-white"}`}>
              <span className="hidden font-mono text-[9px] opacity-55 lg:inline">{index+1}</span>{name}
            </button>
          ))}
        </div>
        <div aria-hidden className="absolute inset-x-0 top-0 h-px origin-left bg-[#9c80ad] transition-transform duration-100" style={{ transform: `scaleX(${state.locked ? state.progress : 0})` }} />
      </div>
    </div>
  );
}
