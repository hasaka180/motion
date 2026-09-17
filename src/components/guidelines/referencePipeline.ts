import { brandFromStyle, callTrace, cropBox, detectPages, encodeImage, loadImage, materializePage, readPage, readStyle, type AiPage } from "./aiTrace";
import { SECTION_BRIEFS, SECTION_ORDER, type Section } from "./referenceSpec";
import type { Brand, Slide } from "./types";

export type SourcePage = { src: string; source: string; warnings: string[]; nativeText?: string; fontNames?: string[] };
export type ReferenceProgress = { message: string; sources: SourcePage[]; read: number; generated: number };
export type Reconstructed = { slide: Slide; section: Section; layout: AiPage };

/** Original pixels are kept until crop time. PDF pages are enumerated, never sampled. */
export async function extractSources(files: File[], update: (p: ReferenceProgress) => void): Promise<SourcePage[]> {
  const sources: SourcePage[] = [];
  if (!files.length) throw new Error("Choose a PDF, page images or a contact sheet.");
  for (const file of files) {
    if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
      update({ message: `Opening ${file.name}…`, sources: [...sources], read: 0, generated: 0 });
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.mjs";
      const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), cMapUrl: "/vendor/pdfjs/cmaps/", cMapPacked: true, standardFontDataUrl: "/vendor/pdfjs/standard_fonts/", wasmUrl: "/vendor/pdfjs/wasm/", isEvalSupported: false });
      try {
        const pdf = await task.promise;
        for (let n = 1; n <= pdf.numPages; n++) {
          update({ message: `Extracting ${file.name} · page ${n} of ${pdf.numPages}…`, sources: [...sources], read: 0, generated: 0 });
          const page = await pdf.getPage(n), natural = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: 2400 / Math.max(natural.width, natural.height) });
          const canvas = document.createElement("canvas"); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
          await page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport }).promise;
          const content = await page.getTextContent();
          const textItems = content.items.filter(item => "str" in item);
          const fontNames = [...new Set(textItems.map(item => {
            try { return String(page.commonObjs.get(item.fontName)?.name ?? content.styles[item.fontName]?.fontFamily ?? item.fontName); }
            catch { return content.styles[item.fontName]?.fontFamily ?? item.fontName; }
          }))];
          sources.push({ src: canvas.toDataURL("image/png"), source: `${file.name} · page ${n}`, warnings: [],
            nativeText: textItems.map(item => item.str + (item.hasEOL ? "\n" : " ")).join(""), fontNames });
          page.cleanup(); canvas.width = 0; canvas.height = 0;
        }
      } finally { await task.destroy(); }
    } else if (file.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(file.name)) {
      update({ message: `Finding every page in ${file.name}…`, sources: [...sources], read: 0, generated: 0 });
      const original = URL.createObjectURL(file);
      try {
        const { boxes, warnings } = await detectPages(original);
        const img = await loadImage(original);
        for (const [i, box] of boxes.entries()) {
          const notes = [...warnings];
          if (box.w * img.naturalWidth < 800) notes.push("Small source page: fine text may be unreadable. Use the original PDF or a larger page image for better detail.");
          if (Math.abs((box.w * img.naturalWidth) / (box.h * img.naturalHeight) - 16 / 9) > .2) notes.push("Source proportions preserved with margins on the 16:9 editing canvas.");
          sources.push({ src: await cropBox(original, box), source: `${file.name} · page ${i + 1}`, warnings: notes });
        }
      } finally { URL.revokeObjectURL(original); }
    } else throw new Error(`Unsupported reference: ${file.name}. Choose PDF, PNG, JPEG or WebP files.`);
  }
  if (!sources.length) throw new Error("No source pages were extracted.");
  return sources;
}

/** Keep every original in its relative order. Insert additions beside related sections. */
export function planDeck(pages: { section: Section }[]): ({ kind: "reference"; index: number; section: Section } | { kind: "generated"; section: Exclude<Section, "other"> })[] {
  const plan: ReturnType<typeof planDeck> = pages.map((p, index) => ({ kind: "reference", index, section: p.section }));
  const present = new Set(pages.map(p => p.section));
  for (const section of SECTION_ORDER) {
    if (present.has(section)) continue;
    const rank = SECTION_ORDER.indexOf(section);
    const next = plan.findIndex(p => p.section !== "other" && SECTION_ORDER.indexOf(p.section) > rank);
    plan.splice(next < 0 ? plan.length : next, 0, { kind: "generated", section });
  }
  return plan;
}

const related: Partial<Record<Section, Section[]>> = {
  logoVariants: ["wordmark", "greyscale"], logoMisuse: ["wordmark", "clearspace"], logoScale: ["wordmark", "clearspace"],
  secondaryColour: ["colour"], contrast: ["colour", "greyscale"], typeHierarchy: ["typography", "specimen"],
  imageTreatment: ["photography", "inUse"], digital: ["inUse", "photography"], values: ["statement"], voice: ["statement", "specimen"],
};
export function chooseExamples(pages: Reconstructed[], section: Section) {
  return pages.map((p, index) => ({ p, index, score: p.section === section ? 3 : related[section]?.includes(p.section) ? 2 : p.section === "cover" ? 0 : 1 }))
    .sort((a, b) => b.score - a.score || a.index - b.index).slice(0, 3).map(x => x.index);
}

/** Match literal palette colours to tokens so the resulting template can be reused. */
export function tokenizeSlides(slides: Slide[], brand: Brand) {
  const token = (value: string) => (Object.entries(brand.palette).find(([, p]) => p.hex.toLowerCase() === value.toLowerCase())?.[0] ?? value) as Slide["bg"];
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const brandPattern = brand.name ? new RegExp(`(?<![\\p{L}\\p{N}])${escape(brand.name)}(?![\\p{L}\\p{N}])`, "giu") : null;
  for (const slide of slides) {
    slide.bg = token(slide.bg);
    for (const b of slide.blocks) {
      if (b.kind === "rect") b.fill = token(b.fill);
      if (b.kind === "text" || b.kind === "logo") b.color = token(b.color);
      if (b.kind === "text" && brandPattern) b.text = b.text.split(/(\{(?:brand|tagline|edition|year)\})/g).map(part => /^\{(?:brand|tagline|edition|year)\}$/.test(part) ? part : part.replace(brandPattern, "{brand}")).join("");
    }
  }
}

export async function buildReferenceTemplate(files: File[], name: string, update: (p: ReferenceProgress) => void, complete = true) {
  const sources = await extractSources(files, update);
  let read = 0, generated = 0;
  const progress = (message: string) => update({ message, sources: [...sources], read, generated });
  const style = await readStyle(sources.map(s => s.src), progress);
  const brand = brandFromStyle(style, name), pages: Reconstructed[] = [];
  for (const [i, source] of sources.entries()) {
    progress(`Recreating page ${i + 1} of ${sources.length} · ${source.source}…`);
    const result = await readPage(source.src, style, { nativeText: source.nativeText, fontNames: source.fontNames });
    result.slide.provenance!.source = source.source;
    result.slide.provenance!.warnings.push(...source.warnings);
    if (i === 0 && style.design.fontNotes) result.slide.provenance!.warnings.push(`Typeface matching: ${style.design.fontNotes}`);
    pages.push(result); read++;
  }
  // Reuse the actual source mark on added pages. Source logos remain replaceable image blocks.
  const logoPage = pages.find(p => p.layout.blocks.some(b => b.kind === "logo"));
  if (logoPage) {
    const raw = logoPage.layout.blocks.find(b => b.kind === "logo")!;
    brand.logo = await cropBox(sources[pages.indexOf(logoPage)].src, raw, 1000);
  }
  const plan = complete ? planDeck(pages) : pages.map((p, index) => ({ kind: "reference" as const, index, section: p.section }));
  const inventory = plan.map((entry, i) => ({ page: i + 1, section: entry.section, name: entry.kind === "reference" ? pages[entry.index].slide.name : SECTION_BRIEFS[entry.section][0] }));
  const slides: Slide[] = [];
  const missing = plan.filter(p => p.kind === "generated").length;
  for (const [i, entry] of plan.entries()) {
    if (entry.kind === "reference") { slides.push(pages[entry.index].slide); continue; }
    progress(`Designing ${SECTION_BRIEFS[entry.section][0]} · addition ${generated + 1} of ${missing}…`);
    const examples = chooseExamples(pages, entry.section);
    const images = await Promise.all(examples.map(n => encodeImage(sources[n].src, 1600, 800_000)));
    const context = { section: entry.section, pageNumber: i + 1, style, inventory,
      referenceLayouts: examples.map(n => ({ ...pages[n].layout, blocks: pages[n].layout.blocks.slice(0, 80).map(b => ({ ...b, text: b.text?.slice(0, 160) ?? null })) })),
      brand: { name: brand.name, tagline: brand.tagline, palette: brand.palette, type: brand.type },
    };
    const result = await callTrace<AiPage>("generate", images, context);
    if (result.section !== entry.section) throw new Error(`Expected ${SECTION_BRIEFS[entry.section][0]}, but received a different section. Retry to resume cached progress.`);
    const { slide } = await materializePage(result, style);
    slide.provenance!.warnings.push("Added guidance is a draft for brand-owner review.");
    slides.push(slide); generated++;
  }
  if (complete) tokenizeSlides(slides, brand);
  progress(`Checking ${slides.length} pages, fonts and image slots…`);
  await checkTypography(slides, brand);
  return { brand, slides, sources: sources.length, generated, style };
}

/** Browser-measured overflow check after fonts load. Warnings remain attached to the page. */
async function checkTypography(slides: Slide[], brand: Brand) {
  const { fontStack, resolveText, textStyle } = await import("./types");
  const { googleFontUrl } = await import("./referenceSpec");
  const families = new Set(slides.flatMap(s => s.blocks.flatMap(b => b.kind === "text" ? [b.font] : [])));
  const loaded = await Promise.all([...families].map(async family => {
    if (["sans", "serif", "mono", "display"].includes(family)) return true;
    const link = document.createElement("link"); link.rel = "stylesheet"; link.href = googleFontUrl(family);
    const success = await new Promise<boolean>(resolve => {
      const timer = setTimeout(() => resolve(false), 8000);
      link.onload = () => { clearTimeout(timer); resolve(true); }; link.onerror = () => { clearTimeout(timer); resolve(false); };
      document.head.appendChild(link);
    });
    return success;
  }));
  const fontRequests = new Set(slides.flatMap(s => s.blocks.flatMap(b => b.kind === "text" ? [`${b.italic ? "italic " : ""}${b.weight} 16px ${fontStack(b.font)}`] : [])));
  await Promise.race([Promise.all([...fontRequests].map(font => document.fonts.load(font).catch(() => []))), new Promise(r => setTimeout(r, 8000))]);
  for (const slide of slides) {
    if (loaded.includes(false)) slide.provenance?.warnings.push("Some substitute fonts could not load; reconnect before final export.");
    for (const b of slide.blocks) {
      if (b.kind !== "text") continue;
      const t = textStyle(b, brand), el = document.createElement("div");
      Object.assign(el.style, { position: "fixed", visibility: "hidden", left: "-10000px", width: `${b.w}px`, fontFamily: fontStack(t.face), fontSize: `${b.size}px`, fontWeight: String(t.weight), fontStyle: t.italic ? "italic" : "normal", textTransform: t.uppercase ? "uppercase" : "none", lineHeight: String(b.lineHeight), letterSpacing: `${b.tracking}em`, whiteSpace: "pre-wrap", overflowWrap: "break-word" });
      el.textContent = resolveText(b.text, brand); document.body.appendChild(el);
      const height = el.getBoundingClientRect().height; el.remove();
      if (height > b.h + 3) {
        // Generated text may be fitted modestly; source typography stays faithful and is flagged.
        if (slide.provenance?.kind === "generated" && height / b.h < 1.3) b.size *= Math.max(.8, b.h / height);
        else slide.provenance?.warnings.push(`Text may overflow: “${b.text.slice(0, 45)}”.`);
      }
    }
    if (slide.provenance) slide.provenance.warnings = [...new Set(slide.provenance.warnings)];
  }
}
