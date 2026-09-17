"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Canvas } from "./Canvas";
import { Dashboard } from "./Dashboard";
import { FaceField, Inspector } from "./Inspector";
import { SlideView } from "./SlideView";
import { STORAGE_KEY, current, init, persist, reducer, shrinkImage } from "./store";
import { LAYOUTS, TEMPLATES } from "./templates";
import { TraceUnavailable, traceWithAI } from "./aiTrace";
import { brandFromPalette, traceReference } from "./trace";
import { SLIDE_H, SLIDE_W, isShippedFace, uid, type Brand, type Project, type Slide, type TokenKey, type TypeRole, type TypeStyle } from "./types";
import styles from "./guidelines.module.css";

/**
 * Brand guidelines, per client, from a handful of starter decks.
 *
 * Everything lives in the browser: decks persist to localStorage and never
 * leave the machine. Export is a JSON file (to hand a deck to a colleague or
 * back it up) and the browser's own print-to-PDF, which prints each page at
 * its native 1600×900 — the same slide renderer, unscaled.
 */

const TOKENS: TokenKey[] = ["paper", "ink", "primary", "accent", "muted", "surface"];
const ROLES: [TypeRole, string][] = [["h1", "H1 · titles"], ["h2", "H2 · headings"], ["h3", "H3 · labels"], ["body", "Body"]];

/** Every Google family the deck uses, so its stylesheet can be loaded. */
function googleFamilies(project: Project) {
  const faces = new Set<string>();
  for (const role of Object.values(project.brand.type)) if (!isShippedFace(role.face)) faces.add(role.face);
  for (const s of project.slides) for (const b of s.blocks) if (b.kind === "text" && !b.role && !isShippedFace(b.font)) faces.add(b.font);
  return [...faces];
}

export function GuidelinesBuilder() {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const [toast, setToast] = useState<string | null>(null);
  const [panel, setPanel] = useState<"decks" | "brand">("decks");
  const [printing, setPrinting] = useState(false);
  /** The builder opens on the dashboard; the editor is a click into a deck. */
  const [view, setView] = useState<"dashboard" | "editor">("dashboard");
  /** Off means changes stay in memory until Save; the choice itself is remembered. */
  const [autosave, setAutosave] = useState(() => localStorage.getItem(`${STORAGE_KEY}.autosave`) !== "off");
  const [savedAt, setSavedAt] = useState(() => Date.now());
  /** How references are read: the model behind /api/trace, or the local tracer. */
  const [tracer, setTracer] = useState<"ai" | "local">("ai");
  const logoRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const refsRef = useRef<HTMLInputElement>(null);
  const [tracing, setTracing] = useState(false);

  const project = current(state);
  const slide = project.slides[state.slide];

  const dirty = project.updatedAt > savedAt;

  // Persist after every change while autosave is on. Storage is the external
  // system here; the saved-at stamp comes back through the callback.
  useEffect(() => {
    if (autosave) persist(state, setToast, setSavedAt);
  }, [state, autosave]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}.autosave`, autosave ? "on" : "off");
  }, [autosave]);
  // With autosave off, closing the tab would lose work — ask first.
  useEffect(() => {
    if (autosave || !dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [autosave, dirty]);
  const saveNow = () => persist(state, setToast, setSavedAt);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // Google families load on demand; the four shipped faces are already here.
  const families = googleFamilies(project).join("|");
  useEffect(() => {
    for (const family of families.split("|").filter(Boolean)) {
      const id = `gf-${family.replace(/\W+/g, "-")}`;
      if (document.getElementById(id)) continue;
      const link = document.createElement("link");
      link.id = id; link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${family.trim().replace(/\s+/g, "+")}:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap`;
      document.head.appendChild(link);
    }
  }, [families]);

  // Print only once the print sheet is in the DOM.
  useEffect(() => {
    if (!printing) return;
    const after = () => setPrinting(false);
    window.addEventListener("afterprint", after);
    const t = setTimeout(() => window.print(), 80);
    return () => { clearTimeout(t); window.removeEventListener("afterprint", after); };
  }, [printing]);

  const brand = (patch: Partial<Brand>) => dispatch({ type: "brand", patch });
  const palette = (key: TokenKey, patch: Partial<{ name: string; hex: string }>) =>
    brand({ palette: { ...project.brand.palette, [key]: { ...project.brand.palette[key], ...patch } } });

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${project.client.replace(/\s+/g, "-").toLowerCase()}-guidelines.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importJson = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Project;
      if (!parsed.slides || !parsed.brand) throw new Error("bad");
      dispatch({ type: "import", project: parsed });
      setToast(`Imported ${parsed.client}.`);
    } catch { setToast("That file isn't a deck export."); }
  };

  const newDeck = (templateId: string) => {
    const client = window.prompt("Client name", "");
    if (client === null) return;
    dispatch({ type: "new", templateId, client: client.trim() });
    setPanel("brand");
    setView("editor");
  };
  const openDeck = (id: string) => { dispatch({ type: "open", id }); setView("editor"); };

  /**
   * Every image becomes a page. The model reads the page — real words, roles,
   * a palette — when /api/trace has a key; otherwise the local tracer recovers
   * the layout with placeholders, and says so.
   */
  const tracePages = async (files: FileList) => {
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!images.length) throw new Error("no images");
    const pages: Slide[] = [];
    const colours: string[] = [];
    let slots: Record<TokenKey, string> | null = null;
    let usedModel = false;
    for (const [i, file] of images.entries()) {
      const src = await shrinkImage(file, 1600);
      let result: { slide: Slide; palette: string[] };
      if (tracer === "ai") {
        try {
          const ai = await traceWithAI(src);
          result = ai; slots = slots ?? ai.slots; usedModel = true;
        } catch (err) {
          if (!(err instanceof TraceUnavailable)) throw err;
          // No key on this deployment: fall back for this and every later page.
          setTracer("local");
          result = await traceReference(src);
        }
      } else {
        result = await traceReference(src);
      }
      if (!usedModel) result.slide.name = `Ref ${i + 1} · ${file.name.replace(/\.[^.]+$/, "")}`;
      pages.push(result.slide);
      for (const hex of result.palette) if (!colours.includes(hex)) colours.push(hex);
    }
    return { pages, colours, slots, usedModel };
  };

  /** From the dashboard: references become a deck, saved as a template at once. */
  const createTemplateFromReferences = async (files: FileList) => {
    const name = window.prompt("Template name", "Reference template")?.trim();
    if (!name) return;
    setTracing(true);
    try {
      const { pages, colours, slots, usedModel } = await tracePages(files);
      const brand = brandFromPalette(name, colours);
      if (slots) for (const k of Object.keys(slots) as TokenKey[]) brand.palette[k] = { ...brand.palette[k], hex: slots[k] };
      dispatch({ type: "newFromPages", client: name, brand, slides: pages });
      dispatch({ type: "saveTemplate", name });
      setPanel("brand");
      setView("editor");
      setToast(usedModel
        ? `${pages.length} page${pages.length > 1 ? "s" : ""} read by the model and saved as “${name}” — check the words, then Save as template again.`
        : `${pages.length} page${pages.length > 1 ? "s" : ""} traced locally (no model key on this deployment) and saved as “${name}”. Text is placeholders.`);
    } catch (err) {
      setToast(err instanceof Error && err.message !== "no images" ? err.message : "Drop image files of the pages you want to replicate.");
    } finally {
      setTracing(false);
    }
  };

  const saveTemplate = () => {
    const name = window.prompt("Template name", `${project.client} template`)?.trim();
    if (!name) return;
    dispatch({ type: "saveTemplate", name });
    setToast(`Saved “${name}” — it is now under New deck from.`);
  };

  const setRole = (role: TypeRole, patch: Partial<TypeStyle>) =>
    brand({ type: { ...project.brand.type, [role]: { ...project.brand.type[role], ...patch } } });

  /** Each reference image becomes a page: its layout as blocks, itself as an underlay. */
  const traceFiles = async (files: FileList) => {
    setTracing(true);
    try {
      const { pages, colours: found } = await tracePages(files);
      dispatch({ type: "addPages", slides: pages });
      // Colours seen in the references join Extras, where they can be assigned to slots.
      const have = new Set(project.brand.extras.map((e) => e.hex.toLowerCase()));
      const extras = [...project.brand.extras];
      for (const hex of found) if (!have.has(hex.toLowerCase()) && extras.length < 12) { have.add(hex.toLowerCase()); extras.push({ name: `Ref ${extras.length + 1}`, hex }); }
      if (extras.length !== project.brand.extras.length) dispatch({ type: "brand", patch: { extras } });
      setToast(`${pages.length} page${pages.length > 1 ? "s" : ""} added.`);
    } catch {
      setToast("Couldn't read one of those images.");
    } finally {
      setTracing(false);
    }
  };

  const inputCls = "h-7 w-full min-w-0 rounded-md border border-ink-700 bg-ink-850 px-2 font-mono text-[11px] text-ink-100 outline-none focus:border-ink-500";
  const btn = "h-7 rounded-md border border-ink-700 bg-ink-850 px-2.5 font-mono text-[11px] text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-50 disabled:opacity-40";

  if (view === "dashboard") {
    return (
      <>
        <Dashboard
          state={state}
          tracing={tracing}
          onNewDeck={newDeck}
          onOpenDeck={openDeck}
          onDeleteDeck={(id) => { const p = state.projects.find((x) => x.id === id); if (p && window.confirm(`Delete “${p.client}”? This cannot be undone.`)) dispatch({ type: "deleteProject", id }); }}
          onDeleteTemplate={(id) => { const c = state.customTemplates.find((x) => x.id === id); if (c && window.confirm(`Delete template “${c.name}”?`)) dispatch({ type: "deleteTemplate", id }); }}
          onCreateFromReferences={(files) => void createTemplateFromReferences(files)}
        />
        {toast && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-ink-700 bg-ink-900 px-4 py-2 text-sm text-ink-100 shadow-xl">{toast}</div>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ------------------------------------------------------- top bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-ink-800 bg-ink-900 px-3 py-2">
        <button className={btn} onClick={() => setView("dashboard")} title="Back to templates and decks">← Decks</button>
        <input
          value={project.client}
          onChange={(e) => dispatch({ type: "rename", client: e.target.value })}
          className="h-8 w-56 rounded-md border border-transparent bg-transparent px-2 text-sm font-semibold text-ink-50 outline-none hover:border-ink-700 focus:border-ink-600"
          aria-label="Client name"
        />
        <span className="font-mono text-[11px] text-ink-600">{TEMPLATES.find((t) => t.id === project.templateId)?.name ?? "custom"} · {project.slides.length} pages</span>
        <span className="mx-1 h-5 w-px bg-ink-800" />
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-500">
          <button
            type="button"
            role="switch"
            aria-checked={autosave}
            onClick={() => setAutosave((a) => !a)}
            title={autosave ? "Autosave is on — turn off to save by hand" : "Autosave is off — turn on"}
            className={`relative h-4 w-7 rounded-full border transition-colors ${autosave ? "border-accent bg-accent/60" : "border-ink-600 bg-ink-800"}`}
          >
            <span className={`absolute top-0.5 size-2.5 rounded-full bg-ink-50 transition-transform ${autosave ? "translate-x-3.5" : "translate-x-0.5"}`} />
          </button>
          {autosave
            ? <span>Autosaved {new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            : dirty
              ? <><span className="text-amber-400">Unsaved changes</span><button className={btn} onClick={saveNow}>Save</button></>
              : <span>Saved</span>}
        </span>
        <span className="mx-1 h-5 w-px bg-ink-800" />
        <button className={btn} disabled={!state.past.length} onClick={() => dispatch({ type: "undo" })} title="Undo (⌘Z)">Undo</button>
        <button className={btn} disabled={!state.future.length} onClick={() => dispatch({ type: "redo" })} title="Redo (⇧⌘Z)">Redo</button>
        <span className="ml-auto flex items-center gap-2">
          <input ref={importRef} type="file" accept="application/json" hidden onChange={(e) => { if (e.target.files?.[0]) void importJson(e.target.files[0]); e.target.value = ""; }} />
          <button className={btn} onClick={() => importRef.current?.click()}>Import</button>
          <button className={btn} onClick={exportJson}>Export JSON</button>
          <button className={btn} onClick={saveTemplate} title="Keep this deck as a starting point for other clients">Save as template</button>
          <button className={`${btn} border-ink-500 text-ink-50`} onClick={() => setPrinting(true)}>Print / PDF</button>
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)_260px]">
        {/* ------------------------------------------------------ left */}
        <aside className="flex min-h-0 flex-col gap-3 rounded-xl border border-ink-800 bg-ink-900 p-3">
          <div className="flex gap-1">
            {(["decks", "brand"] as const).map((p) => (
              <button key={p} onClick={() => setPanel(p)} className={`flex-1 rounded-md px-2 py-1 font-mono text-[11px] ${panel === p ? "bg-ink-700 text-ink-50" : "text-ink-400 hover:bg-ink-800"}`}>
                {p === "decks" ? "Decks" : "Brand"}
              </button>
            ))}
          </div>

          {panel === "decks" && (
            <div className="flex flex-col gap-4 overflow-y-auto scroll-thin">
              <p className="text-[11px] leading-snug text-ink-600">Templates and your other decks are on the dashboard — ← Decks, top left.</p>
              <section>
                <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-ink-500">Clients</h3>
                <ul className="flex flex-col gap-1">
                  {state.projects.map((p) => (
                    <li key={p.id} className="flex items-center gap-1">
                      <button onClick={() => dispatch({ type: "open", id: p.id })} className={`min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-left text-[13px] ${p.id === project.id ? "bg-ink-800 text-ink-50" : "text-ink-300 hover:bg-ink-850"}`}>
                        {p.client}
                      </button>
                      <button title="Delete deck" onClick={() => { if (window.confirm(`Delete “${p.client}”? This cannot be undone.`)) dispatch({ type: "deleteProject", id: p.id }); }} className="rounded-md px-1.5 py-1 font-mono text-[11px] text-ink-600 hover:text-red-400">×</button>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-ink-500">Replicate a reference</h3>
                <input ref={refsRef} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files?.length) void traceFiles(e.target.files); e.target.value = ""; }} />
                <button
                  disabled={tracing}
                  onClick={() => refsRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
                  onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) void traceFiles(e.dataTransfer.files); }}
                  className="w-full rounded-lg border border-dashed border-ink-700 px-3 py-4 text-center text-[12px] text-ink-300 transition-colors hover:border-ink-500 disabled:opacity-50"
                >
                  {tracing ? "Tracing…" : "Drop page images here"}
                  <span className="mt-1 block text-[11px] leading-snug text-ink-600">Each becomes an editable page: photos cropped in, shapes and text boxes placed, colours added to Extras. Then save the deck as a template.</span>
                </button>
              </section>
              {state.customTemplates.length > 0 && (
                <section>
                  <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-ink-500">Your templates</h3>
                  <ul className="flex flex-col gap-1">
                    {state.customTemplates.map((c) => (
                      <li key={c.id} className="flex items-center gap-1">
                        <button onClick={() => newDeck(`custom:${c.id}`)} className="min-w-0 flex-1 truncate rounded-md border border-ink-800 bg-ink-850 px-2 py-1.5 text-left text-[13px] text-ink-100 transition-colors hover:border-ink-600" title={`${c.slides.length} pages`}>
                          {c.name}
                        </button>
                        <button title="Delete template" onClick={() => { if (window.confirm(`Delete template “${c.name}”?`)) dispatch({ type: "deleteTemplate", id: c.id }); }} className="rounded-md px-1.5 py-1 font-mono text-[11px] text-ink-600 hover:text-red-400">×</button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <section>
                <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-ink-500">New deck from</h3>
                <ul className="flex flex-col gap-1.5">
                  {TEMPLATES.map((t) => (
                    <li key={t.id}>
                      <button onClick={() => newDeck(t.id)} className="group w-full rounded-lg border border-ink-800 bg-ink-850 p-2 text-left transition-colors hover:border-ink-600">
                        <span className="flex items-center gap-2">
                          <span className="flex gap-0.5">
                            {(["paper", "primary", "accent", "ink"] as TokenKey[]).map((k) => <span key={k} className="size-3 rounded-sm border border-black/30" style={{ background: t.brand.palette[k].hex }} />)}
                          </span>
                          <span className="text-[13px] font-medium text-ink-100">{t.name}</span>
                        </span>
                        <span className="mt-1 block text-[11px] leading-snug text-ink-500">{t.blurb}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}

          {panel === "brand" && (
            <div className="flex flex-col gap-4 overflow-y-auto scroll-thin text-[12px]">
              <section className="flex flex-col gap-2">
                <h3 className="font-mono text-[10px] uppercase tracking-[.2em] text-ink-500">Identity</h3>
                <label className="flex flex-col gap-1 text-ink-400">Name<input value={project.brand.name} onChange={(e) => brand({ name: e.target.value })} className={inputCls} /></label>
                <label className="flex flex-col gap-1 text-ink-400">Tagline<input value={project.brand.tagline} onChange={(e) => brand({ tagline: e.target.value })} className={inputCls} /></label>
                <label className="flex flex-col gap-1 text-ink-400">Edition<input value={project.brand.edition} onChange={(e) => brand({ edition: e.target.value })} className={inputCls} /></label>
                <div className="flex items-center gap-2">
                  <input ref={logoRef} type="file" accept="image/*,.svg" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; try { brand({ logo: f.type === "image/svg+xml" ? await toDataUrl(f) : await shrinkImage(f, 1200) }); } catch { setToast("Couldn't read that logo."); } }} />
                  <button className={btn} onClick={() => logoRef.current?.click()}>{project.brand.logo ? "Replace logo" : "Upload logo"}</button>
                  {project.brand.logo && <button className={btn} onClick={() => brand({ logo: undefined })}>Remove</button>}
                </div>
                {project.brand.logo && (
                  <div className="rounded-md border border-ink-800 bg-ink-850 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- an uploaded data URL; nothing for next/image to optimise */}
                    <img src={project.brand.logo} alt="" className="mx-auto max-h-12" />
                  </div>
                )}
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="font-mono text-[10px] uppercase tracking-[.2em] text-ink-500">Palette</h3>
                <p className="text-[11px] text-ink-600">Every page paints from these slots. Change a slot and the whole deck follows.</p>
                {TOKENS.map((k) => (
                  <div key={k} className="flex items-center gap-2">
                    <input type="color" value={project.brand.palette[k].hex} onChange={(e) => palette(k, { hex: e.target.value })} className="size-7 shrink-0 cursor-pointer rounded-md border border-ink-700 bg-transparent p-0" />
                    <input value={project.brand.palette[k].name} onChange={(e) => palette(k, { name: e.target.value })} className={inputCls} />
                    <span className="w-14 shrink-0 font-mono text-[10px] uppercase text-ink-600">{k}</span>
                  </div>
                ))}
                <h4 className="mt-1 font-mono text-[10px] uppercase tracking-[.2em] text-ink-600">Extras</h4>
                {project.brand.extras.map((x, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="color" value={x.hex} onChange={(e) => brand({ extras: project.brand.extras.map((y, j) => (j === i ? { ...y, hex: e.target.value } : y)) })} className="size-7 shrink-0 cursor-pointer rounded-md border border-ink-700 bg-transparent p-0" />
                    <input value={x.name} onChange={(e) => brand({ extras: project.brand.extras.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)) })} className={inputCls} />
                    <button className="px-1 font-mono text-ink-600 hover:text-red-400" onClick={() => brand({ extras: project.brand.extras.filter((_, j) => j !== i) })}>×</button>
                  </div>
                ))}
                <button className={btn} onClick={() => brand({ extras: [...project.brand.extras, { name: "New", hex: "#888888" }] })}>+ Add colour</button>
              </section>

              <section className="flex flex-col gap-3">
                <h3 className="font-mono text-[10px] uppercase tracking-[.2em] text-ink-500">Type</h3>
                <p className="text-[11px] text-ink-600">Titles, headings, labels and body each take a face and weight. Any text block with that role follows — across every page.</p>
                {ROLES.map(([role, label]) => (
                  <div key={role} className="flex flex-col gap-1.5 rounded-md border border-ink-800 p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-[.16em] text-ink-400">{label}</span>
                      <span className="flex gap-1">
                        <button type="button" title="Uppercase" onClick={() => setRole(role, { uppercase: !project.brand.type[role].uppercase })} className={`h-6 rounded border px-1.5 font-mono text-[10px] ${project.brand.type[role].uppercase ? "border-ink-500 bg-ink-700 text-ink-50" : "border-ink-700 text-ink-400"}`}>AA</button>
                        <button type="button" title="Italic" onClick={() => setRole(role, { italic: !project.brand.type[role].italic })} className={`h-6 rounded border px-1.5 font-mono text-[10px] ${project.brand.type[role].italic ? "border-ink-500 bg-ink-700 text-ink-50" : "border-ink-700 text-ink-400"}`}><i>I</i></button>
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <FaceField value={project.brand.type[role].face} onChange={(face) => setRole(role, { face })} />
                      <select value={project.brand.type[role].weight} onChange={(e) => setRole(role, { weight: Number(e.target.value) as TypeStyle["weight"] })} className={`${inputCls} w-16`}>
                        {[400, 500, 600, 700, 800, 900].map((w) => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-ink-600">Pick “Google font…” and type a family name — Space Grotesk, Playfair Display, anything on Google Fonts — and it loads on the spot.</p>
              </section>
            </div>
          )}
        </aside>

        {/* ---------------------------------------------------- centre */}
        <div className="flex min-w-0 flex-col gap-3">
          <Canvas slide={slide} brand={project.brand} selection={state.selection} dispatch={dispatch} onWarn={setToast} />

          {/* add blocks */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-mono text-[10px] uppercase tracking-[.2em] text-ink-500">Add</span>
            <button className={btn} onClick={() => dispatch({ type: "add", block: { id: uid("t"), kind: "text", x: 80, y: 120, w: 700, h: 120, text: "New text", font: "sans", size: 40, weight: 500, align: "left", valign: "top", lineHeight: 1.15, tracking: -.01, color: "ink" } })}>Text</button>
            <button className={btn} onClick={() => dispatch({ type: "add", block: { id: uid("i"), kind: "image", x: 520, y: 260, w: 560, h: 380, fit: "cover", radius: 0, label: "Image", tint: "surface" } })}>Image slot</button>
            <button className={btn} onClick={() => dispatch({ type: "add", block: { id: uid("r"), kind: "rect", x: 600, y: 300, w: 400, h: 300, fill: "primary", radius: 0 } })}>Shape</button>
            <button className={btn} onClick={() => dispatch({ type: "add", block: { id: uid("s"), kind: "swatch", x: 640, y: 340, w: 320, h: 220, token: "primary", radius: 0, caption: "inside" } })}>Swatch</button>
            <button className={btn} onClick={() => dispatch({ type: "add", block: { id: uid("l"), kind: "logo", x: 500, y: 350, w: 600, h: 200, color: "ink", size: 120 } })}>Logo</button>
            <span className="ml-auto font-mono text-[10px] text-ink-600">⌘Z undo · ⌘D duplicate · ⌫ delete · arrows nudge · ⌥ drag disables snapping</span>
          </div>

          {/* slide strip */}
          <div className="rounded-xl border border-ink-800 bg-ink-900 p-3">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 font-mono text-[10px] uppercase tracking-[.2em] text-ink-500">Pages</span>
              {LAYOUTS.map((l) => <button key={l.id} className={btn} onClick={() => dispatch({ type: "slideAdd", slide: l.make() })}>+ {l.name}</button>)}
              <span className="ml-auto flex gap-1.5">
                <button className={btn} disabled={state.slide === 0} onClick={() => dispatch({ type: "slideMove", from: state.slide, to: state.slide - 1 })}>←</button>
                <button className={btn} disabled={state.slide === project.slides.length - 1} onClick={() => dispatch({ type: "slideMove", from: state.slide, to: state.slide + 1 })}>→</button>
                <button className={btn} onClick={() => dispatch({ type: "slideDuplicate", index: state.slide })}>Duplicate</button>
                <button className={btn} disabled={project.slides.length <= 1} onClick={() => { if (window.confirm("Delete this page?")) dispatch({ type: "slideRemove", index: state.slide }); }}>Delete</button>
              </span>
            </div>
            <ol className="flex gap-2 overflow-x-auto pb-1 scroll-thin">
              {project.slides.map((s, i) => (
                <li key={s.id} className="shrink-0">
                  <button
                    onClick={() => dispatch({ type: "goto", slide: i })}
                    className={`block overflow-hidden rounded-md border ${i === state.slide ? "border-accent" : "border-ink-800 hover:border-ink-600"}`}
                    style={{ width: 176, height: 99 }}
                    title={s.name}
                  >
                    <div style={{ width: SLIDE_W, height: SLIDE_H, transform: `scale(${176 / SLIDE_W})`, transformOrigin: "0 0", pointerEvents: "none" }}>
                      <SlideView slide={s} brand={project.brand} />
                    </div>
                  </button>
                  <div className="mt-1 truncate text-center font-mono text-[10px] text-ink-500" style={{ width: 176 }}>{String(i + 1).padStart(2, "0")} · {s.name}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ----------------------------------------------------- right */}
        <div className="rounded-xl border border-ink-800 bg-ink-900 p-3">
          <Inspector slide={slide} brand={project.brand} selection={state.selection} dispatch={dispatch} />
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-ink-700 bg-ink-900 px-4 py-2 text-sm text-ink-100 shadow-xl">{toast}</div>
      )}

      {printing && createPortal(
        <div className={styles.printRoot}>
          {project.slides.map((s) => (
            <div key={s.id} className={styles.printPage}>
              <SlideView slide={s} brand={project.brand} />
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

const toDataUrl = (file: File) => new Promise<string>((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(file);
});
