"use client";
import type { ReferenceProgress } from "./referencePipeline";
import { SECTION_BRIEFS, SECTION_ORDER } from "./referenceSpec";
import type { Slide } from "./types";

export function ReferenceStatus({ progress, active, error }: { progress: ReferenceProgress | null; active: boolean; error: string | null }) {
  if (!active && !error) return null;
  return <section aria-live="polite" className="mb-4 rounded-xl border border-ink-700 bg-ink-900 p-4">
    <p className="text-sm text-ink-100">{error ? "Template generation paused" : progress?.message ?? "Preparing references…"}</p>
    {error && <p role="alert" className="mt-2 text-sm text-amber-300">{error} Successful analyses are cached for this session; choose the same files to retry.</p>}
    <p className="mt-2 text-xs text-ink-400">{progress?.sources.length ?? 0} pages extracted · {progress?.read ?? 0} recreated · {progress?.generated ?? 0} added</p>
    {!!progress?.sources.length && <details className="mt-3">
      <summary className="cursor-pointer text-xs text-ink-300">Source page inventory</summary>
      <div className="mt-3 grid max-h-72 grid-cols-3 gap-3 overflow-auto md:grid-cols-6">
        {progress.sources.map((source, i) => <figure key={`${source.source}-${i}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- local source thumbnail */}
          <img src={source.src} alt={`Extracted ${source.source}`} className="aspect-video w-full rounded bg-ink-800 object-contain" />
          <figcaption className="mt-1 text-[10px] text-ink-400">{i + 1}. {source.source}</figcaption>
        </figure>)}
      </div>
    </details>}
  </section>;
}

export function ReferenceReport({ slides, onPage }: { slides: Slide[]; onPage: (index: number) => void }) {
  if (!slides.some(s => s.provenance)) return null;
  const reference = slides.filter(s => s.provenance?.kind === "reference").length;
  const generated = slides.filter(s => s.provenance?.kind === "generated").length;
  const review = slides.filter(s => s.provenance?.warnings.length).length;
  const covered = new Set(slides.map(s => s.provenance?.section));
  const missing = SECTION_ORDER.filter(s => !covered.has(s));
  return <details className="rounded-xl border border-ink-700 bg-ink-900 p-3">
    <summary className="cursor-pointer text-xs text-ink-300">Page report · {reference} recreated · {generated} added · {review} to review{missing.length ? ` · ${missing.length} sections absent` : " · all 24 sections covered"}</summary>
    <p className="mt-3 text-xs text-ink-400">Reference order is preserved. Added guidance and substitute fonts should be reviewed. Source logos are retained as image crops; replace these when adapting the template to another brand.</p>
    {!!missing.length && <p className="mt-2 text-xs text-amber-300">Missing: {missing.map(s => SECTION_BRIEFS[s][0]).join(", ")}.</p>}
    <ol className="mt-3 max-h-80 space-y-2 overflow-auto">
      {slides.map((slide, index) => <li key={slide.id} className="rounded-lg bg-ink-850 p-3 text-xs">
        <button className="text-ink-100 underline decoration-ink-600 underline-offset-4" onClick={() => onPage(index)}>{String(index + 1).padStart(2, "0")} · {slide.name}</button>
        <span className="ml-2 text-ink-500">{slide.provenance?.kind === "reference" ? slide.provenance.source : "Added section"}</span>
        {!!slide.provenance?.warnings.length && <ul className="mt-2 list-inside list-disc space-y-1 text-amber-200/80">{slide.provenance.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul>}
      </li>)}
    </ol>
  </details>;
}
