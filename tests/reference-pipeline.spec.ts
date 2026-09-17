import { POST } from "../src/app/api/trace/route";
import { test, expect, type Page } from "@playwright/test";
import { SECTION_ORDER } from "../src/components/guidelines/referenceSpec";
import { normalizeBoxes } from "../src/components/guidelines/aiTrace";
import { planDeck, tokenizeSlides } from "../src/components/guidelines/referencePipeline";
import { TEMPLATES } from "../src/components/guidelines/templates";
import type { Slide } from "../src/components/guidelines/types";

const palette = { paper: "#f6f0e6", ink: "#222222", primary: "#bf482a", accent: "#a2b39b", muted: "#65615d", surface: "#e5ddd1" };
const style = { name: "Studio North", tagline: "Thoughtful by nature", palette,
  type: Object.fromEntries(["h1", "h2", "h3", "body"].map(role => [role, { family: role === "h1" ? "Instrument Serif" : "Geist", weight: 400, uppercase: false }])),
  numbered: true, dark: false, sections: ["cover", "typography"],
  design: { margins: "5%", grid: "Two columns", headings: "Large left serif", body: "Small sans", runningHeads: "Tiny top labels", shapes: "Fine rules", imagery: "Architecture, warm light", rhythm: "Cream and rust", fontNotes: "Instrument Serif as a display substitute" },
};
const block = { kind: "text", x: .05, y: .2, w: .8, h: .2, text: "Studio North", role: "h1", size: 90, weight: 400, family: "Instrument Serif", italic: false, uppercase: false, lineHeight: 1.05, tracking: -.02, align: "left", color: palette.ink, hex: null, label: null, radius: 0, rotation: 0 };
function layout(section: string, index = 0) {
  return { name: section === "cover" ? "Brand Guidelines" : section === "typography" ? "Our Typography" : section,
    section, background: palette.paper, palette, warnings: [], blocks: [
      { ...block, kind: "rect", text: null, x: .05, y: .14, w: .9, h: .001, hex: palette.ink },
      { ...block, text: section === "cover" ? "Studio North\nBrand Guidelines" : section, y: .2, h: .28 },
      { ...block, text: `Page ${index + 1}`, role: "h3", family: "Geist", size: 16, x: .8, y: .9, w: .1, h: .04 },
      ...(section === "photography" ? [{ ...block, kind: "image", text: null, label: "warm architecture", x: .5, y: .52, w: .4, h: .3 }] : []),
    ],
  };
}
function twoPagePdf() {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 800 450] /Resources << /Font << /F1 7 0 R >> >> /Contents 4 0 R >>",
    "", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 800 450] /Resources << /Font << /F1 7 0 R >> >> /Contents 6 0 R >>", "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  for (const [i, text] of [[3, "Studio North / Brand Guidelines"], [5, "Typography / Aa Bb Cc"]] as const) {
    const stream = `0.965 0.94 0.90 rg 0 0 800 450 re f BT /F1 40 Tf 0.15 0.15 0.15 rg 40 260 Td (${text}) Tj ET`;
    objects[i] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  }
  let pdf = "%PDF-1.4\n"; const offsets = [0];
  objects.forEach((o, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(n => `${String(n).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}
async function saved(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const req = indexedDB.open("darwin-guidelines", 1); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
    return new Promise<{ projects: { templateId: string; slides: Slide[] }[]; customTemplates: { slides: Slide[] }[] }>(resolve => { const req = db.transaction("documents").objectStore("documents").get("state"); req.onsuccess = () => { db.close(); resolve(req.result); }; });
  });
}

test("completion preserves all original pages, including duplicates and unclassified pages", () => {
  const pages = [{ section: "cover" }, { section: "typography" }, { section: "other" }, { section: "typography" }, { section: "closing" }] as const;
  const plan = planDeck([...pages]);
  expect(plan.filter(p => p.kind === "reference").map(p => p.index)).toEqual([0, 1, 2, 3, 4]);
  expect(new Set(plan.map(p => p.section))).toEqual(new Set([...SECTION_ORDER, "other"]));
  expect(plan.filter(p => p.kind === "generated")).toHaveLength(21);
});

test("boxes retain tiny pages and tokenisation does not corrupt existing tokens", () => {
  expect(normalizeBoxes([{ x: .9, y: .9, w: .2, h: .2 }, { x: .1, y: .1, w: .02, h: .03 }, { x: .1, y: .1, w: .02, h: .03 }])).toHaveLength(2);
  const brand = structuredClone(TEMPLATES[0].brand); brand.name = "Brand";
  const slides = [{ id: "a", name: "a", bg: "paper", blocks: [{ ...block, id: "b", kind: "text", font: "sans", valign: "top", text: "Brand / {brand} / Branding", color: "ink" }] }] as Slide[];
  tokenizeSlides(slides, brand);
  expect(slides[0].blocks[0]).toMatchObject({ text: "{brand} / {brand} / Branding" });
});

test("PDF imports every page, completes all sections, preserves thin rules and persists on reload", async ({ page }) => {
  const calls: { mode: string; images: string[]; context: { section: string } }[] = [];
  let read = 0;
  let mismatchedGeneratedSection = false;
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: "" }));
  await page.route("**/api/trace", async route => {
    const body = route.request().postDataJSON(); calls.push(body);
    const result = body.mode === "style"
      ? style
      : body.mode === "page"
        ? layout(read++ === 0 ? "cover" : "typography", read - 1)
        : !mismatchedGeneratedSection
          ? (mismatchedGeneratedSection = true, layout("other"))
          : layout(body.context.section);
    await route.fulfill({ json: result });
  });
  page.on("dialog", dialog => dialog.accept("North reference"));
  await page.goto("/guidelines");
  await page.locator('input[type="file"][accept*="application/pdf"]').first().setInputFiles({ name: "north.pdf", mimeType: "application/pdf", buffer: twoPagePdf() });
  await expect(page.getByText(/Page report · 2 recreated · 22 added/)).toBeVisible({ timeout: 60000 });
  await expect.poll(async () => (await saved(page)).customTemplates.length).toBe(1);
  const documents = await saved(page), deck = documents.projects.find(p => p.templateId === "reference")!;
  expect(deck.slides).toHaveLength(24);
  expect(deck.slides.filter(s => s.provenance?.kind === "reference").map(s => s.provenance?.source)).toEqual(["north.pdf · page 1", "north.pdf · page 2"]);
  expect(deck.slides[0].blocks[0].h).toBeLessThan(2);
  expect(deck.slides[0].blocks[1]).toMatchObject({ font: "serif", weight: 400, lineHeight: 1.05, tracking: -.02 });
  expect(deck.slides.find(s => s.provenance?.kind === "generated")?.provenance?.warnings)
    .toContainEqual(expect.stringContaining("placed in the requested"));
  expect(calls.filter(c => c.mode === "pages")).toHaveLength(0);
  expect(calls.find(c => c.mode === "style")!.images).toHaveLength(2);
  expect(calls.filter(c => c.mode === "generate")).toHaveLength(22);
  expect(deck.slides.find(s => s.provenance?.section === "photography")!.blocks.some(b => b.kind === "image" && b.src === "/images/guidelines/architecture.jpg")).toBeTruthy();
  await page.screenshot({ path: "/private/tmp/guidelines-reference-editor.png", fullPage: true });
  await page.reload();
  await expect(page.getByRole("button", { name: "North reference yours · 24p" })).toBeVisible();
});

test("missing model key produces a persistent error without saving a fake template", async ({ page }) => {
  await page.route("**/api/trace", route => route.fulfill({ status: 501, json: { error: "Reference generation needs OPENAI_API_KEY on this deployment. No template was generated." } }));
  page.on("dialog", dialog => dialog.accept("Unavailable template"));
  await page.goto("/guidelines");
  await page.locator('input[type="file"][accept*="application/pdf"]').first().setInputFiles({ name: "north.pdf", mimeType: "application/pdf", buffer: twoPagePdf() });
  await expect(page.getByRole("alert").filter({ hasText: "OPENAI_API_KEY" })).toContainText("OPENAI_API_KEY");
  expect((await saved(page)).customTemplates).toHaveLength(0);
});

test("contact sheets crop original pixels and retry reuses successful analyses", async ({ page }) => {
  let fail = true, pageReads = 0;
  const calls: { mode: string; images: string[]; context: { section: string } }[] = [];
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: "" }));
  await page.route("**/api/trace", async route => {
    const body = route.request().postDataJSON(); calls.push(body);
    if (body.mode === "generate" && fail) {
      await route.fulfill({ status: 400, json: { error: "Fixture interrupted after reconstruction" } }); return;
    }
    const result = body.mode === "pages" ? { pages: [{ x: .02, y: .05, w: .47, h: .9 }, { x: .51, y: .05, w: .47, h: .9 }], warnings: [] }
      : body.mode === "style" ? style : body.mode === "page" ? layout(pageReads++ === 0 ? "cover" : "typography") : layout(body.context.section);
    await route.fulfill({ json: result });
  });
  page.on("dialog", dialog => dialog.accept("Sheet reference"));
  await page.goto("/guidelines");
  const image = await page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = 5000; canvas.height = 1450;
    const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#ddd"; ctx.fillRect(0, 0, 5000, 1450);
    ctx.fillStyle = "#f6f0e6"; ctx.fillRect(100, 72, 2350, 1305); ctx.fillStyle = "#bf482a"; ctx.fillRect(2550, 72, 2350, 1305);
    ctx.fillStyle = "#222"; ctx.font = "100px serif"; ctx.fillText("Studio North", 200, 500); ctx.fillText("Typography", 2650, 500);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const file = { name: "sheet.png", mimeType: "image/png", buffer: Buffer.from(image, "base64") };
  await page.locator('input[type="file"][accept*="application/pdf"]').first().setInputFiles(file);
  await expect(page.getByText(/Fixture interrupted after reconstruction/)).toBeVisible();
  const readImages = calls.filter(c => c.mode === "page").map(c => c.images[0]);
  const widths = await page.evaluate(async sources => Promise.all(sources.map(src => new Promise<number>(resolve => { const img = new Image(); img.onload = () => resolve(img.naturalWidth); img.src = src; }))), readImages);
  expect(widths).toEqual([2350, 2350]);
  fail = false;
  await page.locator('input[type="file"][accept*="application/pdf"]').first().setInputFiles(file);
  await expect(page.getByText(/Page report · 2 recreated · 22 added/)).toBeVisible({ timeout: 60000 });
  expect(calls.filter(c => c.mode === "page")).toHaveLength(2);
  expect(calls.filter(c => c.mode === "style")).toHaveLength(1);
  await expect.poll(async () => (await saved(page)).customTemplates.length).toBe(1);
});

test("large decks save to IndexedDB beyond localStorage capacity", async ({ page }) => {
  await page.goto("/guidelines");
  await expect(page.getByText("Create a template from references")).toBeVisible();
  const template = structuredClone(TEMPLATES[0].brand);
  const deck = { id: "large", templateId: "reference", client: "Large import", brand: template,
    slides: [{ id: "large-slide", name: "Large source", bg: "paper", blocks: [], provenance: { kind: "reference", section: "other", warnings: ["x".repeat(6_000_000)] } }], updatedAt: Date.now() };
  page.on("dialog", dialog => dialog.accept("Starter"));
  await page.getByRole("button", { name: /Mold/ }).first().click();
  await page.locator('input[type="file"][accept="application/json"]').setInputFiles({ name: "large.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(deck)) });
  await expect.poll(async () => (await saved(page)).projects.some(p => p.slides.some(s => s.id === "large-slide"))).toBeTruthy();
  await page.reload();
  await expect(page.getByRole("button", { name: /Large import/ })).toBeVisible();
});

test("trace API rejects unknown modes and reports truncated output", async () => {
  const originalKey = process.env.OPENAI_API_KEY, originalFetch = global.fetch;
  process.env.OPENAI_API_KEY = "fixture-key";
  const request = (mode: string) => new Request("http://localhost/api/trace", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode, images: ["data:image/png;base64,AAAA"] }) });
  try {
    expect((await POST(request("constructor"))).status).toBe(400);
    global.fetch = async () => Response.json({ choices: [{ finish_reason: "length", message: { content: "{}" } }] });
    const truncated = await POST(request("page"));
    expect(truncated.status).toBe(502);
    expect((await truncated.json()).error).toContain("truncated");
    global.fetch = async () => Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ ...layout("other"), blocks: [] }) } }] });
    // A blank source must survive; an empty generated design must not.
    expect((await POST(request("page"))).status).toBe(200);
    const generated = new Request("http://localhost/api/trace", { method: "POST", body: JSON.stringify({ mode: "generate", images: ["data:image/png;base64,AAAA"], context: { section: "voice" } }) });
    expect((await POST(generated)).status).toBe(502);
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey;
  }
});
