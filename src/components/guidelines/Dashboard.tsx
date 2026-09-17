"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { SlideView } from "./SlideView";
import type { State } from "./store";
import { TEMPLATES } from "./templates";
import { SLIDE_H, SLIDE_W, type Brand, type Slide } from "./types";

/**
 * Where the builder opens: everything you can start from, as cards with a
 * live cover. Built-in templates and any you have saved start a
 * new client deck; your decks reopen; and references become a template of
 * their own, traced page by page.
 */

type Props = {
  state: State;
  /** What the reference pipeline is doing, or null when idle. */
  tracing: string | null;
  onNewDeck: (templateId: string) => void;
  onOpenDeck: (id: string) => void;
  onDeleteDeck: (id: string) => void;
  onDeleteTemplate: (id: string) => void;
  onCreateFromReferences: (files: FileList) => void;
};

/** A slide drawn small — the same renderer, in a box of the given width. */
export function Preview({ slide, brand, width }: { slide: Slide; brand: Brand; width: number }) {
  const scale = width / SLIDE_W;
  return (
    <div className="overflow-hidden rounded-md" style={{ width, height: Math.round(SLIDE_H * scale) }}>
      <div style={{ width: SLIDE_W, height: SLIDE_H, transform: `scale(${scale})`, transformOrigin: "0 0", pointerEvents: "none" }}>
        <SlideView slide={slide} brand={brand} />
      </div>
    </div>
  );
}

function Card({ onClick, children, aside, title }: { onClick: () => void; children: ReactNode; aside?: ReactNode; title?: string }) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        title={title}
        className="w-full rounded-xl border border-ink-800 bg-ink-900 p-2.5 text-left transition-colors hover:border-ink-600 focus-visible:border-accent focus-visible:outline-none"
      >
        {children}
      </button>
      {aside}
    </div>
  );
}

const Delete = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className="absolute right-3 top-3 hidden size-6 place-items-center rounded-md bg-ink-950/80 font-mono text-[12px] text-ink-400 hover:text-red-400 group-hover:grid"
  >
    ×
  </button>
);

const Section = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <section>
    <div className="mb-3 flex items-baseline gap-3">
      <h2 className="font-mono text-[10px] uppercase tracking-[.2em] text-ink-500">{title}</h2>
      {hint && <span className="text-[12px] text-ink-600">{hint}</span>}
    </div>
    {children}
  </section>
);

const CARD_W = 236;

export function Dashboard({ state, tracing, onNewDeck, onOpenDeck, onDeleteDeck, onDeleteTemplate, onCreateFromReferences }: Props) {
  const refsRef = useRef<HTMLInputElement>(null);

  // Built-in covers are generated once; they only depend on the template.
  const builtIn = useMemo(() => TEMPLATES.map((t) => ({ t, cover: t.slides(t.brand)[0] })), []);

  return (
    <div className="flex flex-col gap-10">
      <Section title="Start from a template" hint="each starts a new client deck — name the client, then change anything">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_W}px, 1fr))` }}>
          {/* create from references */}
          <div
            className="flex flex-col"
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) onCreateFromReferences(e.dataTransfer.files); }}
          >
            <input ref={refsRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" multiple hidden onChange={(e) => { if (e.target.files?.length) onCreateFromReferences(e.target.files); e.target.value = ""; }} />
            <button
              type="button"
              disabled={!!tracing}
              onClick={() => refsRef.current?.click()}
              className="flex h-full min-h-[212px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-700 bg-ink-900/40 p-4 text-center transition-colors hover:border-ink-500 disabled:opacity-60"
            >
              <span className="grid size-9 place-items-center rounded-full border border-ink-700 text-lg text-ink-300">+</span>
              <span className="text-[13px] font-medium text-ink-100">{tracing ?? "Create a template from references"}</span>
              <span className="text-[11px] leading-snug text-ink-500">
                {tracing
                  ? "Reading each page on its own — this takes a moment per page."
                  : "Drop a PDF, page images or contact sheets. Recreate each page, match the type and layouts, then design missing sections for a complete brand book."}
              </span>
            </button>
          </div>

          {state.customTemplates.map((c) => (
            <Card key={c.id} onClick={() => onNewDeck(`custom:${c.id}`)} title={`${c.slides.length} pages`}
              aside={<Delete label={`Delete template ${c.name}`} onClick={() => onDeleteTemplate(c.id)} />}>
              <Preview slide={c.slides[0]} brand={c.brand} width={CARD_W - 22} />
              <div className="mt-2.5 flex items-baseline justify-between gap-2 px-0.5">
                <span className="truncate text-[13px] font-medium text-ink-100">{c.name}</span>
                <span className="shrink-0 font-mono text-[10px] text-ink-600">yours · {c.slides.length}p</span>
              </div>
            </Card>
          ))}

          {builtIn.map(({ t, cover }) => (
            <Card key={t.id} onClick={() => onNewDeck(t.id)} title={t.blurb}>
              <Preview slide={cover} brand={t.brand} width={CARD_W - 22} />
              <div className="mt-2.5 px-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-medium text-ink-100">{t.name}</span>
                  <span className="flex gap-0.5">
                    {(["paper", "primary", "accent", "ink"] as const).map((k) => (
                      <span key={k} className="size-2.5 rounded-sm border border-black/30" style={{ background: t.brand.palette[k].hex }} />
                    ))}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-ink-500">{t.blurb}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Your decks" hint={state.projects.length ? "click to keep editing" : "decks you start will appear here"}>
        {state.projects.length > 0 && (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_W}px, 1fr))` }}>
            {state.projects.map((p) => (
              <Card key={p.id} onClick={() => onOpenDeck(p.id)} aside={<Delete label={`Delete deck ${p.client}`} onClick={() => onDeleteDeck(p.id)} />}>
                <Preview slide={p.slides[0]} brand={p.brand} width={CARD_W - 22} />
                <div className="mt-2.5 flex items-baseline justify-between gap-2 px-0.5">
                  <span className="truncate text-[13px] font-medium text-ink-100">{p.client}</span>
                  <span className="shrink-0 font-mono text-[10px] text-ink-600">
                    {p.slides.length}p · {new Date(p.updatedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
