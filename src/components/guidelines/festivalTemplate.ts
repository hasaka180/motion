import { GRADIENT_PRESETS } from "./gradients";
import { uid, type Block, type Brand, type GradientStyle, type IconBlock, type ImageBlock, type Paint, type RectBlock, type Slide, type Template, type TextBlock } from "./types";

/** Hand-built from the two supplied All Things Go contact sheets. Every
 * element remains a normal editor block; no flattened reference screenshots. */
export const FESTIVAL_IMAGE = "/images/guidelines/festival-placeholder.svg";
const CREAM = "#f7efe5", BLACK = "#0c0c0c", RULE = "#343431", BLUE = "#a8e6ed", LIME = "#e6ffa9";
const haze = GRADIENT_PRESETS[0].value, pink = GRADIENT_PRESETS[1].value, violet = GRADIENT_PRESETS[2].value, lime = GRADIENT_PRESETS[3].value, edge = GRADIENT_PRESETS[4].value;

const t = (x: number, y: number, w: number, h: number, text: string, size = 44, options: Partial<TextBlock> = {}): TextBlock => ({
  id: uid("t"), kind: "text", x, y, w, h, text, size, font: "serif", weight: 400,
  align: "left", valign: "top", lineHeight: 1, tracking: -.025, color: "ink", ...options,
});
const label = (x: number, y: number, w: number, text: string, options: Partial<TextBlock> = {}) => t(x, y, w, 42, text, 16, { font: "mono", tracking: 0, lineHeight: 1.35, ...options });
const r = (x: number, y: number, w: number, h: number, fill: Paint = "surface", options: Partial<RectBlock> = {}): RectBlock => ({ id: uid("r"), kind: "rect", x, y, w, h, fill, radius: 0, ...options });
const rule = (x: number, y: number, w: number) => r(x, y, w, 1, RULE, { locked: true });
const photo = (x: number, y: number, w: number, h: number, name: string, options: Partial<ImageBlock> = {}): ImageBlock => ({ id: uid("i"), kind: "image", x, y, w, h, src: FESTIVAL_IMAGE, fit: "cover", radius: 5, label: name, tint: "surface", ...options });
const icon = (x: number, y: number, size: number, name: IconBlock["icon"] = "sparkle", color: Paint = "ink", options: Partial<IconBlock> = {}): IconBlock => ({ id: uid("i"), kind: "icon", x, y, w: size, h: size, icon: name, color, strokeWidth: 1.2, label: `${name} icon`, ...options });
const gradient = (x: number, y: number, w: number, h: number, style: GradientStyle, options: Partial<RectBlock> = {}) => r(x, y, w, h, "primary", { gradientStyle: structuredClone(style), grain: .16, ...options });
const head = (name: string, n: number): Block[] => [label(60, 44, 1000, name), label(1430, 44, 110, String(n).padStart(2, "0"), { align: "right" })];
const page = (name: string, blocks: Block[], options: Partial<Slide> = {}): Slide => ({ id: uid("p"), name, bg: "paper", blocks, ...options });
const paragraph = (x: number, y: number, w: number, text: string, options: Partial<TextBlock> = {}) => t(x, y, w, 160, text, 20, { font: "mono", tracking: -.015, lineHeight: 1.45, ...options });
const condensed = (x: number, y: number, w: number, h: number, text: string, size: number, options: Partial<TextBlock> = {}) => t(x, y, w, h, text, size, { font: "condensed", tracking: -.01, ...options });
const script = (x: number, y: number, w: number, text: string, size = 70, color: Paint = "accent") => t(x, y, w, size * 1.4, text, size, { font: "script", color, rotation: -7, tracking: -.035 });

function cover(): Slide {
  return page("Festival cover", [
    photo(790, 115, 680, 685, "Cover hero image", { rotation: 5 }),
    ...head("Independent music. Shared energy.", 1),
    condensed(75, 195, 1140, 235, "{brand}", 220, { color: CREAM, lineHeight: .92 }),
    label(80, 494, 720, "MUSIC • CULTURE • COMMUNITY", { size: 22, tracking: .16 }),
    t(80, 620, 760, 120, "A world of our own.", 94),
    label(80, 805, 720, "Brand guidelines & campaign toolkit / {year}"),
    icon(1390, 60, 95, "sparkle"),
  ], { gradientStyle: structuredClone(violet), grain: .13 });
}

function contents(): Slide {
  const names = ["The festival", "Our community", "Cultural impact", "Identity essentials", "Colour & typography", "Image & voice", "Social toolkit", "Working together"];
  const numbers = ["03—04", "05—06", "07—10", "11—13", "14—17", "18—20", "21—23", "24"];
  return page("Contents", [
    ...head("The world of {brand}", 2),
    t(60, 285, 640, 340, "Good things\ncome together.", 123),
    script(95, 650, 510, "Start here", 86),
    ...names.flatMap((name, i) => [rule(790, 178 + i * 77, 740), t(790, 192 + i * 77, 570, 60, name, 43), label(1410, 207 + i * 77, 120, numbers[i], { align: "right" })]),
  ]);
}

function overview(): Slide {
  return page("Overview — festival in numbers", [
    ...head("Overview", 3),
    ...[175, 342, 509, 676].map(y => rule(65, y, 1470)),
    t(72, 180, 220, 210, "86", 205), t(295, 255, 300, 88, "artists", 83), script(590, 229, 360, "and more", 86),
    t(72, 347, 595, 205, "100,000", 200), t(678, 431, 200, 82, "fans", 77),
    t(72, 514, 115, 210, "2", 205), t(198, 587, 340, 90, "cities", 84),
    t(72, 678, 860, 205, "1 weekend", 195),
    photo(1282, 526, 250, 314, "Overview crowd image"),
  ], { gradientStyle: structuredClone(edge), grain: .1 });
}

function lineup(): Slide {
  const artists = ["BILLIE EILISH", "LORDE", "CHARLI XCX", "LANA DEL REY", "MAGGIE ROGERS", "BOYGENIUS", "MITSKI", "HAIM", "RENEÉ RAPP", "JANELLE MONÁE"];
  return page("Artist lineup", [
    label(55, 42, 335, "Celebrating the most\ninfluential artists", { color: BLACK }),
    ...artists.map((name, i) => condensed(380, 38 + i * 80, 870, 83, name, 87, { align: "center", color: i === 9 ? "#a13b52" : BLACK, lineHeight: .94 })),
    icon(778, 324, 82, "sparkle", CREAM), label(60, 836, 590, "Sample lineup / replace names for your event", { size: 13, color: BLACK }),
  ], { gradientStyle: structuredClone(haze), grain: .2 });
}

function community(): Slide {
  return page("Community — photo collage", [
    ...head("Our community", 5),
    photo(52, 135, 425, 445, "Community portrait 1", { grayscale: true }),
    photo(505, 265, 310, 255, "Community detail"),
    photo(850, 130, 340, 365, "Community portrait 2", { grayscale: true }),
    photo(1220, 265, 325, 480, "Community portrait 3"),
    t(75, 599, 1060, 195, "More than a crowd.\nA place to belong.", 108, { lineHeight: .98 }),
    script(950, 726, 350, "Together", 93),
    label(60, 837, 900, "Lead with real people, shared moments and a little beautiful chaos.", { size: 14 }),
  ]);
}

function audience(): Slide {
  const blocks: Block[] = [
    label(290, 50, 350, "Audience overview"), r(798, 0, 1, 900, RULE, { locked: true }),
    t(100, 170, 600, 90, "{brand}", 79, { align: "center" }),
    t(100, 252, 600, 90, "attracts a socially", 79, { align: "center" }),
    t(100, 340, 305, 90, "conscious,", 74, { align: "center" }),
    script(377, 333, 365, "trendsetting", 72),
    t(100, 425, 600, 90, "audience", 79, { align: "center" }),
    rule(292, 575, 45), paragraph(292, 595, 400, "With key interests in music, fashion and technology, shaping both culture and conversations around them."),
    paragraph(292, 735, 420, "Our attendees are influential tastemakers within their social circles.", { size: 17 }),
    label(848, 55, 680, "YEAR-OVER-YEAR GROWTH", { size: 13, color: "muted" }),
    r(820, 330, 755, 265, "surface"), gradient(842, 352, 490, 217, pink, { radius: 4 }), gradient(1350, 352, 203, 217, lime, { radius: 4 }),
    t(860, 358, 410, 130, "77%", 118, { color: BLACK }), t(1363, 365, 180, 95, "23%", 71, { color: BLACK }),
    t(860, 524, 400, 40, "Female", 28, { color: BLACK }), t(1366, 524, 160, 40, "Male", 28, { color: BLACK }),
    rule(820, 621, 755),
    gradient(850, 672, 300, 5, haze), gradient(1240, 672, 300, 5, haze),
    t(850, 692, 280, 83, "86%", 75), t(1240, 692, 280, 83, "75%", 75),
    paragraph(850, 781, 295, "are aged 18–34\nCulture's next generation.", { size: 15 }),
    paragraph(1240, 781, 295, "have an annual income\nof $75K+ (sample data).", { size: 15 }),
  ];
  const xs = [864, 1070, 1288, 1512], ys = [250, 222, 172, 132], values = ["20K", "40K", "70K", "100K"];
  for (let i = 0; i < 4; i++) {
    if (i < 3) {
      const dx = xs[i + 1] - xs[i], dy = ys[i + 1] - ys[i], length = Math.hypot(dx, dy);
      blocks.push(r((xs[i] + xs[i + 1]) / 2 - length / 2, (ys[i] + ys[i + 1]) / 2, length, 1, CREAM, { rotation: Math.atan2(dy, dx) * 180 / Math.PI }));
    }
    blocks.push(r(xs[i] - 5, ys[i] - 5, 10, 10, "primary"), t(xs[i] - 38, ys[i] - 48, 90, 42, values[i], 35), label(xs[i] - 18, 285, 75, String(2022 + i), { size: 13, color: "muted" }));
  }
  return page("Audience overview", blocks);
}

function reach(): Slide {
  const names = ["{brand}", "Festival two", "Festival three", "Festival four", "Festival five"];
  const bars = (y: number, platform: string, symbol: IconBlock["icon"]) => [
    r(833, y, 704, 335, "surface", { radius: 5 }), icon(860, y + 25, 32, symbol), label(905, y + 25, 540, platform, { size: 14 }),
    ...names.flatMap((name, i) => [label(886, y + 92 + i * 43, 235, name, { size: 16, color: i === 0 ? "ink" : "muted" }),
      i === 0 ? gradient(1120, y + 100, 330, 7, haze) : r(1120, y + 100 + i * 43, 180 - i * 27, 7, "#484845"),
      label(i === 0 ? 1456 : 1305, y + 87 + i * 43, 80, i === 0 ? "1X" : `${5 - i}M`, { size: 13, color: i === 0 ? "ink" : "muted" })]),
  ];
  return page("Digital reach", [
    ...head("Marketing reach", 7), r(790, 115, 1, 720, RULE, { locked: true }),
    t(75, 210, 690, 170, "We drive digital", 98, { align: "center" }), script(282, 304, 400, "waves", 116, "#e6ffa9"),
    paragraph(75, 534, 370, "It all starts with a highly engaged community. Every story, share and save extends the experience.", { size: 18 }),
    ...["280,000+", "3.5M+", "20M+", "10M+", "2M+", "1M+"].flatMap((v, i) => [t(493, 490 + i * 48, 220, 49, v, 43, { color: LIME }), label(688, 505 + i * 48, 80, ["fans", "reach", "views", "plays", "shares", "saves"][i], { size: 12 })]),
    ...bars(133, "Engagement impact / sample comparison", "arrow"), ...bars(493, "Instagram / sample comparison", "instagram"),
  ]);
}

function press(): Slide {
  const cards = [
    { x: 50, y: 250, w: 254, h: 385, copy: "Queer moments\nin pop. All the\njoy, all in one\nweekend.", mast: "THE DAILY", size: 37 },
    { x: 328, y: 439, w: 245, h: 365, copy: "Creators on\nexpanding the\nfestival feeling\nbeyond the stage.", mast: "SOUND & VISION", size: 35 },
    { x: 600, y: 210, w: 386, h: 585, copy: "The newest\nmusic festival\nwas a dream\ncome true.", mast: "CULTURE", size: 67 },
    { x: 1012, y: 122, w: 240, h: 366, copy: "{brand}\ncomes to\nNew York.", mast: "THE REVIEW", size: 38 },
    { x: 1280, y: 384, w: 263, h: 405, copy: "A safe space\nto be yourself—\nand say what\nyou feel.", mast: "EDITORIAL", size: 42 },
  ];
  return page("Press — editorial clippings", [
    ...head("The conversation / sample editorial copy", 8), t(333, 129, 270, 100, "Press", 90),
    ...cards.flatMap((c, i) => [i === 2 ? gradient(c.x, c.y, c.w, c.h, haze, { radius: 5 }) : r(c.x, c.y, c.w, c.h, "ink", { radius: 5 }),
      icon(c.x + 19, c.y + 22, 29, "quote", BLACK),
      t(c.x + 18, c.y + 72, c.w - 36, c.h - 164, c.copy, c.size, { color: BLACK, lineHeight: .98 }),
      label(c.x + 18, c.y + c.h - 94, c.w - 36, "Oct. 04, {year}", { color: BLACK, size: 11 }),
      condensed(c.x + 18, c.y + c.h - 58, c.w - 36, 47, c.mast, i === 2 ? 47 : 29, { color: BLACK })]),
  ]);
}

function quotes(): Slide {
  const cards = [
    { x: 60, y: 170, w: 300, h: 540, name: "ARTIST ONE", quote: "A place for us.\nA weekend I'll\nnever forget." },
    { x: 390, y: 310, w: 292, h: 510, name: "ARTIST TWO", quote: "My favourite\nshow of the\nyear." },
    { x: 715, y: 230, w: 294, h: 514, name: "ARTIST THREE", quote: "Feeling the love,\nfrom the stage\nto the crowd." },
    { x: 1042, y: 145, w: 490, h: 650, name: "ARTIST FOUR", quote: "All things good.\nAll the best\nmoments, together." },
  ];
  return page("Artist quotes", [
    ...head("The artists / sample testimonials", 9), t(400, 100, 590, 110, "Top artists' quotes", 70),
    gradient(0, 860, 1600, 40, pink, { locked: true }),
    ...cards.flatMap((c, i) => [r(c.x, c.y, c.w, c.h, i === 3 ? BLUE : "ink", { radius: 8 }),
      photo(c.x + 12, c.y + 12, c.w - 24, c.h * .53, `Artist quote portrait ${i + 1}`),
      icon(c.x + 20, c.y + c.h * .57, 23, "quote", BLACK), label(c.x + 57, c.y + c.h * .57, c.w - 70, c.name, { size: 11, color: BLACK }),
      t(c.x + 20, c.y + c.h * .65, c.w - 40, c.h * .34, c.quote, i === 3 ? 53 : 36, { color: BLACK, lineHeight: .99 })]),
  ]);
}

function partners(): Slide {
  return page("Past partners", [
    ...head("In good company", 10),
    ...Array.from({ length: 8 }, (_, i) => {
      const x = 65 + (i % 4) * 375, y = 150 + Math.floor(i / 4) * 210;
      return [rule(x, y, 350), label(x, y + 15, 55, String(i + 1).padStart(2, "0"), { color: "muted", size: 12 }),
        icon(x + 48, y + 75, 48, (["star", "music", "globe", "ticket"] as const)[i % 4]),
        condensed(x + 115, y + 81, 224, 75, `PARTNER ${i + 1}`, 42)];
    }).flat(),
    t(65, 615, 1170, 222, "Past partners", 202), icon(1370, 689, 104, "arrow"),
  ]);
}

function foundations(): Slide {
  return page("Brand foundations", [
    ...head("01 / What brings us together", 11),
    t(65, 170, 1340, 250, "Independent in spirit.\nConnected by music.", 138),
    ...["Belonging", "Discovery", "Expression"].flatMap((name, i) => [rule(65 + i * 505, 533, 460),
      label(65 + i * 505, 555, 460, `0${i + 1} / ${name.toUpperCase()}`),
      t(65 + i * 505, 630, 460, 155, ["Make room for\nevery kind of fan.", "Put new voices\non a bigger stage.", "Let people show up\nas themselves."][i], 52),
      label(65 + i * 505, 812, 460, "Draft principle / adapt to your brand", { color: "muted", size: 12 })]),
  ]);
}

function wordmark(): Slide {
  return page("Wordmark & variants", [
    ...head("02 / The name, front and centre", 12),
    condensed(70, 210, 1450, 220, "{brand}", 213, { align: "center", role: "h2" }),
    rule(65, 524, 1470),
    condensed(65, 608, 690, 110, "{brand}", 94, { role: "h2" }), label(65, 765, 550, "PRIMARY / CONDENSED WORDMARK"),
    r(900, 574, 635, 227, "ink", { radius: 4 }), condensed(920, 635, 595, 100, "{brand}", 79, { role: "h2", color: "paper", align: "center" }),
    label(910, 819, 570, "REVERSED / ALWAYS KEEP STRONG CONTRAST", { size: 13 }),
  ]);
}

function clearspace(): Slide {
  return page("Logo spacing & usage", [
    ...head("03 / Give the identity room", 13),
    t(65, 155, 690, 115, "Space to be seen.", 96),
    r(200, 352, 1060, 270, "surface"),
    ...[352, 422, 552, 622].map(y => rule(120, y, 1360)),
    ...[200, 300, 1160, 1260].map(x => r(x, 290, 1, 400, RULE, { locked: true })),
    condensed(310, 425, 840, 137, "{brand}", 127, { align: "center", role: "h2" }),
    label(231, 462, 70, "x", { color: BLUE, size: 27 }), label(732, 371, 100, "x", { color: BLUE, size: 27 }),
    paragraph(65, 728, 650, "Use the cap height of the small wordmark as a starting exclusion zone. Keep photography, captions and borders outside it.", { size: 18 }),
    paragraph(900, 728, 590, "Keep proportions intact. Avoid stretching, shadows or low contrast. Final minimum sizes require brand-owner approval.", { size: 18 }),
  ]);
}

function palette(brand: Brand): Slide {
  const tokens = ["paper", "ink", "primary", "accent", "surface"] as const;
  const names = ["Night", "Warm paper", "Coral", "Ice blue", "Stage grey"];
  return page("Colour palette", [
    ...head("04 / After dark, in full colour", 14), t(65, 160, 1160, 140, "A little electric.", 130),
    ...tokens.flatMap((key, i) => [r(65 + i * 300, 388, 275, 292, key, { radius: 3 }),
      t(80 + i * 300, 412, 241, 112, names[i], 46, { color: i === 0 || i === 4 ? CREAM : BLACK }),
      label(80 + i * 300, 630, 241, brand.palette[key].hex.toUpperCase(), { color: i === 0 || i === 4 ? CREAM : BLACK, size: 17 }),
      label(65 + i * 300, 709, 275, ["60% / base", "25% / type & cards", "5% / energy", "5% / annotation", "5% / panels"][i], { color: "muted", size: 13 })]),
    paragraph(65, 810, 1440, "Keep the page dark and the type warm. Colour is a moment of emphasis: a card, a glow, a handwritten aside.", { size: 17, h: 50 }),
  ]);
}

function gradients(): Slide {
  return page("Gradient recipes", [
    ...head("05 / Light, not decoration", 15), t(65, 130, 1220, 150, "Let the colour bloom.", 119),
    ...[haze, pink, violet, edge].flatMap((g, i) => [gradient(65 + i * 377, 342, 347, 335, g, { radius: 4 }),
      label(65 + i * 377, 710, 347, ["01 / FESTIVAL HAZE", "02 / PINK DUSK", "03 / VIOLET STAGE", "04 / EDGE GLOW"][i], { size: 15 }),
      paragraph(65 + i * 377, 762, 330, ["Lineups & culture\nMesh / 20% grain", "Cards & highlights\nLinear / 170°", "Posters & stories\nRadial / 135°", "Editorial statistics\nEdge / 90°"][i], { size: 15, h: 80 })]),
  ]);
}

function typography(): Slide {
  return page("Type system", [
    ...head("06 / Four voices, one language", 16),
    ...[165, 353, 550, 727].map(y => rule(65, y, 1470)),
    t(65, 190, 900, 130, "The art of gathering.", 115, { role: "h1" }), label(1110, 234, 425, "INSTRUMENT SERIF\nEditorial / numbers / quotations", { size: 14 }),
    condensed(65, 379, 990, 140, "TURN THE VOLUME UP", 126, { role: "h2" }), label(1110, 427, 425, "BEBAS NEUE\nWordmarks / artists / campaigns", { size: 14 }),
    script(65, 575, 920, "Make it feel human", 115), label(1110, 610, 425, "CAVEAT\nOne short accent per page", { size: 14 }),
    label(65, 775, 910, "SMALL DETAILS. BIG DIFFERENCE.", { size: 27 }), label(1110, 778, 425, "GEIST MONO\nLabels / dates / supporting copy", { size: 14 }),
  ]);
}

function grid(): Slide {
  return page("Grid & hierarchy", [
    ...head("07 / Keep the rhythm", 17), t(65, 135, 1120, 145, "Structure creates freedom.", 108),
    ...Array.from({ length: 6 }, (_, i) => r(65 + i * 252, 350, 220, 339, i % 2 ? "#232426" : "surface")),
    ...[350, 515, 689].map(y => rule(65, y, 1480)),
    label(87, 378, 1450, "60 PX MARGIN / 6 COLUMNS / 32 PX GUTTERS / 1600 × 900 CANVAS", { color: BLUE, size: 18 }),
    t(88, 471, 1310, 133, "Type leads. Images punctuate.", 111),
    ...["Keep captions small.", "Align to shared rules.", "Leave real breathing room."].flatMap((s, i) => [label(65 + i * 505, 751, 460, `0${i + 1}`), t(65 + i * 505, 795, 460, 55, s, 36)]),
  ]);
}

function icons(): Slide {
  const names = ["sparkle", "star", "arrow", "heart", "quote", "instagram", "music", "globe", "ticket"] as const;
  return page("Icons & graphic language", [
    ...head("08 / Small marks, big personality", 18), t(65, 146, 1300, 130, "A few familiar signals.", 116),
    ...names.flatMap((name, i) => {
      const x = 70 + (i % 5) * 300, y = 330 + Math.floor(i / 5) * 265;
      return [rule(x, y, 260), icon(x + 65, y + 40, 110, name, i % 3 === 0 ? BLUE : "ink"), label(x, y + 185, 260, name.toUpperCase(), { size: 13, align: "center" })];
    }),
    paragraph(1280, 656, 230, "One line weight. Open shapes. Plenty of space.", { size: 17 }),
  ]);
}

function photography(): Slide {
  return page("Photography & image treatment", [
    ...head("09 / Let the experience speak", 19),
    photo(65, 142, 698, 474, "Photography colour example"), photo(795, 142, 740, 474, "Photography monochrome example", { grayscale: true }),
    t(65, 658, 690, 85, "In living colour.", 75), t(795, 658, 700, 85, "In the moment.", 75),
    paragraph(65, 776, 655, "Saturated stage light, expressive faces, imperfect energy. Keep the subject close and the crop intentional.", { size: 17, h: 94 }),
    paragraph(795, 776, 700, "Use monochrome for documentary moments. Keep the contrast gentle and leave space for editorial type.", { size: 17, h: 94 }),
  ]);
}

function voice(): Slide {
  return page("Voice & tone", [
    ...head("10 / Sound like a person", 20), t(65, 155, 1150, 150, "Warm. Direct. A little loud.", 110),
    ...["Invitation", "Announcement", "Community"].flatMap((name, i) => {
      const x = 65 + i * 505;
      return [rule(x, 374, 450), label(x, 401, 450, `0${i + 1} / ${name}`),
        t(x, 484, 445, 190, ["Your people.\nYour weekend.", "Meet your next\nfavourite artist.", "Everyone has\na place here."][i], 66),
        paragraph(x, 733, 450, ["Lead with a feeling. Make the invitation open and uncomplicated.", "Be specific. Let the names, the date and the energy do the work.", "Write with care. Celebrate individuality without speaking for everyone."][i], { size: 17, h: 130 })];
    }),
  ]);
}

export function festivalSocialFeed(): Slide {
  return page("Social — square posts", [
    ...head("11 / Feed toolkit / 1:1", 21),
    r(65, 223, 460, 460, "ink", { radius: 6 }), photo(78, 236, 434, 260, "Social feed artist photo"),
    condensed(88, 520, 410, 70, "ARTIST NAME", 60, { color: BLACK }), label(88, 611, 410, "LIVE AT {brand}", { color: BLACK, size: 13 }),
    gradient(566, 223, 460, 460, haze, { radius: 6 }), label(591, 250, 410, "THIS IS YOUR WEEKEND", { color: BLACK, size: 12 }),
    condensed(591, 322, 410, 214, "MAKE\nSOME\nMEMORIES", 79, { color: BLACK, lineHeight: .9 }), icon(911, 565, 74, "sparkle", BLACK),
    photo(1067, 223, 460, 460, "Social feed announcement photo"),
    r(1067, 542, 460, 141, BLACK, { opacity: .83, locked: true }), condensed(1090, 565, 415, 70, "SEE YOU THERE", 64),
    ...["01 / ARTIST ANNOUNCEMENT", "02 / CULTURE & COPY", "03 / PHOTO MOMENT"].map((s, i) => label(65 + i * 501, 726, 460, s, { size: 14 })),
    paragraph(65, 806, 1450, "One message per post. Preserve the frame, replace the photograph and make the words your own.", { size: 17, h: 55 }),
  ]);
}

export function festivalSocialStories(): Slide {
  const x = [102, 626, 1150], w = 350, h = 622;
  return page("Social — stories", [
    ...head("12 / Story toolkit / 9:16", 22),
    photo(x[0], 155, w, h, "Social story portrait"),
    r(x[0], 620, w, 157, BLACK, { opacity: .85, locked: true }), condensed(x[0] + 24, 643, 303, 106, "YOUR NEXT\nFAVOURITE.", 56),
    gradient(x[1], 155, w, h, violet, { radius: 5 }), label(x[1] + 24, 181, 302, "{brand}", { size: 14 }),
    condensed(x[1] + 24, 289, 302, 222, "A WEEKEND\nTO FEEL\nEVERYTHING.", 70),
    icon(x[1] + 130, 538, 90, "sparkle"), r(x[1] + 40, 679, 270, 53, "ink", { radius: 30 }), label(x[1] + 46, 695, 258, "GET YOUR TICKETS", { color: BLACK, size: 13, align: "center" }),
    gradient(x[2], 155, w, h, haze, { radius: 5 }), photo(x[2] + 20, 180, 310, 321, "Social story inset photo"),
    t(x[2] + 25, 536, 300, 135, "Wish you\nwere here.", 64, { color: BLACK }), label(x[2] + 25, 723, 300, "#ALLTOGETHER", { color: BLACK, size: 13 }),
    ...["01 / ARTIST", "02 / TICKETS", "03 / RECAP"].map((s, i) => label(x[i], 808, w, s, { size: 13 })),
  ]);
}

function socialPoster(): Slide {
  return page("Social — campaign poster", [
    ...head("13 / Campaign toolkit", 23),
    gradient(65, 150, 924, 620, violet, { radius: 4 }), photo(542, 195, 406, 527, "Campaign poster hero"),
    condensed(90, 236, 840, 184, "{brand}", 143), label(97, 433, 730, "MUSIC FESTIVAL", { size: 25, tracking: .13 }),
    icon(865, 602, 78, "sparkle"), label(100, 670, 780, "SEPT. 27–28 / WASHINGTON, DC", { size: 17 }),
    t(1050, 223, 440, 204, "Make the\nmoment yours.", 78),
    paragraph(1050, 514, 455, "Hero photography anchors the composition. Keep the event name clear and the date easy to find.", { size: 19 }),
    label(65, 810, 900, "LANDSCAPE ANNOUNCEMENT / REPLACE IMAGE, EVENT NAME & DATE", { size: 13 }),
  ]);
}

function closing(): Slide {
  return page("Brand handoff", [
    ...head("14 / Ready for the next chapter", 24),
    t(65, 171, 1360, 318, "All good things\nstart here.", 160), script(970, 352, 450, "Let's go", 125),
    rule(65, 620, 1470),
    label(65, 655, 600, "ASSET CHECKLIST"), paragraph(65, 709, 600, "Wordmarks / SVG + PNG\nPhotographs / approved masters\nFonts / licences & styles", { size: 18, h: 115 }),
    label(870, 655, 630, "BRAND OWNER"), paragraph(870, 709, 630, "[Name / team]\n[Contact email]\n[Asset library link]", { size: 18, h: 115 }),
  ], { gradientStyle: structuredClone(edge), grain: .12 });
}

export const FESTIVAL_TEMPLATE: Template = {
  id: "all-things-go", name: "All Things Go", blurb: "24 editable pages from your references: editorial statistics, pastel lineups, press, quotes and social layouts.",
  brand: {
    name: "ALL THINGS GO", tagline: "A world of our own.", edition: "Brand guidelines / {year}",
    palette: { paper: { name: "Night", hex: BLACK }, ink: { name: "Warm paper", hex: CREAM }, primary: { name: "Coral", hex: "#ff9185" }, accent: { name: "Ice blue", hex: BLUE }, muted: { name: "Stone", hex: "#a6a39c" }, surface: { name: "Stage grey", hex: "#222220" } },
    extras: [{ name: "Lime light", hex: LIME }, { name: "Lilac", hex: "#c4b1ea" }],
    type: { h1: { face: "serif", weight: 400 }, h2: { face: "condensed", weight: 400 }, h3: { face: "mono", weight: 400 }, body: { face: "mono", weight: 400 } },
  },
  slides: brand => [cover(), contents(), overview(), lineup(), community(), audience(), reach(), press(), quotes(), partners(), foundations(), wordmark(), clearspace(), palette(brand), gradients(), typography(), grid(), icons(), photography(), voice(), festivalSocialFeed(), festivalSocialStories(), socialPoster(), closing()],
};
