/**
 * Reads a brand-book page with a vision model and returns it as a layout.
 *
 * The browser sends one image; this holds the key. The model transcribes every
 * text block with its words and role, boxes photographs and panels, reads
 * swatches, and names a palette — all as fractions of the image, which the
 * client maps into its 1600×900 page. Structured output is enforced with a
 * strict JSON schema, so what comes back is always the shape the client expects.
 *
 * This is the one server-side piece of the site. Without OPENAI_API_KEY it
 * answers 501 and the client falls back to its local tracer.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";
/** ~2.6MB decoded — plenty for a 1600px page, small enough to stay under function limits. */
const MAX_IMAGE_CHARS = 3_500_000;

const SYSTEM = `You recreate pages from brand guideline decks as editable layouts. You are precise about position, size and colour, and you transcribe text exactly as printed, keeping line breaks.`;

const USER = `Read this page and return its layout.

Coordinates: x, y, w, h are FRACTIONS (0-1) of the image's own width and height, measured from the top-left. Be tight: a text block's box hugs its lines.

Blocks, one per visible element, in reading order:
- "text": every run of text. "text" is the exact words with line breaks as "\\n". "role": "h1" for the page's largest title, "h2" for section headings and big statements, "h3" for small labels, running heads, captions and page numbers, "body" for paragraphs. "size" is the cap height in px if this page were 1600px wide. "weight" 400-900. "align" left/center/right. "color" the text colour as #rrggbb.
- "image": a photograph or illustration. "label" a two-word description.
- "rect": a solid colour panel or shape (not a swatch tile). "hex" its colour.
- "swatch": a colour tile from a palette page. "hex" its colour, "label" its printed name if any.
- "logo": a logo or wordmark. "color" its colour.

"background": the page's dominant background colour as #rrggbb.
"palette": the brand's colours as #rrggbb — paper (page background), ink (main text), primary (hero colour), accent (second colour), muted (secondary text), surface (cards/panels). Use null only if the page shows none.
"name": a two- or three-word name for the page, e.g. "Colour principles".

Fields you cannot fill are null. Never invent text that is not on the page.`;

const HEX = { type: "string", pattern: "^#[0-9a-fA-F]{6}$" };
const NULLABLE_HEX = { anyOf: [HEX, { type: "null" }] };
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["name", "background", "palette", "blocks"],
  properties: {
    name: { type: "string" },
    background: HEX,
    palette: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["paper", "ink", "primary", "accent", "muted", "surface"],
          properties: { paper: HEX, ink: HEX, primary: HEX, accent: HEX, muted: HEX, surface: HEX },
        },
        { type: "null" },
      ],
    },
    blocks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "x", "y", "w", "h", "text", "role", "size", "weight", "align", "color", "hex", "label"],
        properties: {
          kind: { type: "string", enum: ["text", "image", "rect", "swatch", "logo"] },
          x: { type: "number" }, y: { type: "number" }, w: { type: "number" }, h: { type: "number" },
          text: { type: ["string", "null"] },
          role: { anyOf: [{ type: "string", enum: ["h1", "h2", "h3", "body"] }, { type: "null" }] },
          size: { type: ["number", "null"] },
          weight: { type: ["integer", "null"] },
          align: { anyOf: [{ type: "string", enum: ["left", "center", "right"] }, { type: "null" }] },
          color: NULLABLE_HEX,
          hex: NULLABLE_HEX,
          label: { type: ["string", "null"] },
        },
      },
    },
  },
};

const fail = (error: string, status: number) => Response.json({ error }, { status });

export async function POST(request: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return fail("No model key on this deployment. Set OPENAI_API_KEY to read references with a model.", 501);

  // The key must not be spendable from another site.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try { if (new URL(origin).host !== host) return fail("Forbidden", 403); }
    catch { return fail("Forbidden", 403); }
  }

  let image: unknown;
  try { ({ image } = (await request.json()) as { image?: unknown }); }
  catch { return fail("Send JSON with an `image` data URL.", 400); }
  if (typeof image !== "string" || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image)) {
    return fail("`image` must be a PNG, JPEG or WebP data URL.", 400);
  }
  if (image.length > MAX_IMAGE_CHARS) return fail("That image is too large — send it at 1600px or smaller.", 413);

  let upstream: Response;
  try {
    upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      signal: AbortSignal.timeout(55_000),
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        response_format: { type: "json_schema", json_schema: { name: "brand_page", strict: true, schema: SCHEMA } },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: [{ type: "text", text: USER }, { type: "image_url", image_url: { url: image, detail: "high" } }] },
        ],
      }),
    });
  } catch (err) {
    return fail(err instanceof Error && err.name === "TimeoutError" ? "The model took too long. Try a smaller image." : "Could not reach the model.", 504);
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    let detail = text.slice(0, 200);
    try { detail = (JSON.parse(text) as { error?: { message?: string } }).error?.message ?? detail; } catch { /* not JSON */ }
    return fail(`Model call failed (${upstream.status}): ${detail}`, 502);
  }

  const data = (await upstream.json()) as { choices?: { message?: { content?: string; refusal?: string } }[] };
  const message = data.choices?.[0]?.message;
  if (message?.refusal) return fail(`The model declined: ${message.refusal}`, 502);
  try {
    const page = JSON.parse(message?.content ?? "") as { blocks?: unknown };
    if (!Array.isArray(page.blocks)) throw new Error("no blocks");
    return Response.json(page);
  } catch {
    return fail("The model returned something that was not a page.", 502);
  }
}
