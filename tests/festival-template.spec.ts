import { test, expect, type Page } from "@playwright/test";
import { FESTIVAL_TEMPLATE } from "../src/components/guidelines/festivalTemplate";
import type { Project } from "../src/components/guidelines/types";

async function openFestival(page: Page) {
  page.on("dialog", dialog => dialog.accept("ALL THINGS GO"));
  await page.goto("/guidelines");
  await page.getByRole("button", { name: /All Things Go/ }).first().click();
  await expect(page.locator('[aria-label="Client name"]')).toHaveValue("ALL THINGS GO");
  await page.evaluate(() => document.fonts.ready);
}
async function currentProject(page: Page): Promise<Project> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open("darwin-guidelines", 1); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
    });
    return new Promise<Project>(resolve => {
      const req = db.transaction("documents").objectStore("documents").get("state");
      req.onsuccess = () => { const data = req.result; db.close(); resolve(data.projects.find((p: Project) => p.id === data.currentId)); };
    });
  });
}
const replacement = { name: "replacement.svg", mimeType: "image/svg+xml", buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#ff3300"/></svg>') };

test("festival image and icon replacements browse on click, persist, and undo", async ({ page }) => {
  await openFestival(page);
  await page.getByTitle("Social — square posts", { exact: true }).click();
  const image = page.getByRole("button", { name: "Replace Social feed artist photo", exact: true });
  const chooser = page.waitForEvent("filechooser"); await image.click(); await (await chooser).setFiles(replacement);
  await expect(image.locator("img")).toHaveAttribute("src", /^data:image\//);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(image.locator("img")).toHaveAttribute("src", "/images/guidelines/festival-placeholder.svg");
  // A populated slot remains clickable after replacing it once.
  const again = page.waitForEvent("filechooser"); await image.click(); await (await again).setFiles(replacement);
  await expect(image.locator("img")).toHaveAttribute("src", /^data:image\//);
  await page.getByTitle("Social — stories", { exact: true }).click();
  const story = page.getByRole("button", { name: "Replace Social story inset photo", exact: true });
  const storyFile = page.waitForEvent("filechooser"); await story.click(); await (await storyFile).setFiles(replacement);
  await expect(story.locator("img")).toHaveAttribute("src", /^data:image\//);
  await page.getByTitle("Icons & graphic language", { exact: true }).click();
  const icon = page.getByRole("button", { name: "Replace sparkle icon", exact: true });
  const iconFile = page.waitForEvent("filechooser"); await icon.click(); await (await iconFile).setFiles(replacement);
  await expect(icon.locator("img")).toHaveAttribute("src", /^data:image\//);
  await page.getByRole("button", { name: "Use heart icon", exact: true }).click();
  await expect(icon.locator("svg")).toBeVisible();
  await expect.poll(async () => (await currentProject(page)).slides[20].blocks.some(b => b.kind === "image" && b.src?.startsWith("data:"))).toBe(true);
  await page.reload();
  await page.getByRole("button", { name: /ALL THINGS GO 24p/ }).click();
  await page.getByTitle("Social — stories", { exact: true }).click();
  await expect(page.getByRole("button", { name: "Replace Social story inset photo" }).locator("img")).toHaveAttribute("src", /^data:image\//);
});

test("dragging an image does not browse; gradients are editable and saved", async ({ page }) => {
  await openFestival(page);
  await page.getByTitle("Social — square posts", { exact: true }).click();
  let fileDialogs = 0; page.on("filechooser", () => fileDialogs++);
  const image = page.getByRole("button", { name: "Replace Social feed artist photo", exact: true });
  const bounds = (await image.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down(); await page.mouse.move(bounds.x + bounds.width / 2 + 35, bounds.y + bounds.height / 2 + 25, { steps: 8 }); await page.mouse.up();
  expect(fileDialogs).toBe(0);
  await expect.poll(async () => (await currentProject(page)).slides[20].blocks.find(b => b.kind === "image")!.x).not.toBe(78);
  await page.getByTitle("Artist lineup", { exact: true }).click();
  await page.getByRole("button", { name: "Pink dusk", exact: true }).click();
  await page.getByLabel("Gradient angle", { exact: true }).fill("45");
  await page.getByLabel("Gradient colour 1", { exact: true }).fill("#34aaff");
  await page.getByLabel("Grain amount", { exact: true }).fill("0.3");
  await expect.poll(async () => (await currentProject(page)).slides[3].gradientStyle).toMatchObject({ kind: "linear", angle: 45, colors: ["#34aaff", "#ff9ca3", "#ff765e"] });
  await expect.poll(async () => (await currentProject(page)).slides[3].grain).toBe(.3);
  await page.getByRole("button", { name: "Remove gradient & texture", exact: true }).click();
  await expect.poll(async () => (await currentProject(page)).slides[3].gradientStyle).toBeUndefined();
});

test("all 24 festival layouts render with local assets and without overflowing text", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1900, height: 1300 });
  const errors: string[] = []; page.on("pageerror", err => errors.push(err.message));
  await openFestival(page);
  const names = FESTIVAL_TEMPLATE.slides(FESTIVAL_TEMPLATE.brand).map(s => s.name);
  const overflow: string[] = [];
  for (const [i, name] of names.entries()) {
    if (i) await page.getByTitle(name, { exact: true }).click();
    await page.evaluate(() => document.fonts.ready);
    const canvas = page.locator('[data-slide]').first();
    await expect(canvas).toBeVisible();
    overflow.push(...await canvas.evaluate((el, title) => [...el.querySelectorAll<HTMLElement>('[data-block]')].flatMap(block => {
      const text = block.firstElementChild as HTMLElement | null;
      if (!text || text.tagName !== "DIV" || !text.style.minHeight) return [];
      const expected = block.getBoundingClientRect().height;
      return text.getBoundingClientRect().height > expected + 4 ? [`${title}: ${text.textContent?.slice(0, 60)}`] : [];
    }), name));
    await canvas.screenshot({ path: `/private/tmp/festival-review/page-${String(i + 1).padStart(2, "0")}.png` });
    expect(await canvas.locator("img").evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  }
  expect(errors).toEqual([]);
  expect(overflow).toEqual([]);
});
