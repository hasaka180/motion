export const LILIUM_FRAMES = [
  "Specimen / 01", "Digital silhouette", "Negative scan", "Chromatic inversion",
  "Surface coordinates", "Anatomy scan", "Pixel dissolution", "Structural mapping",
  "The anatomy of a bloom", "From bud to bloom", "In bloom", "Living geometry", "Geometric trace",
] as const;

type Rect = { x: number; y: number; w: number; h: number };
const PAPER = "#f6f1f2", RED = "#e31c32", BLACK = "#050505";
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const random = (index: number) => { const x = Math.sin(index * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export function createLiliumRenderer(canvas: HTMLCanvasElement, specimen: HTMLImageElement, bud: HTMLImageElement, blossom?: HTMLImageElement) {
  const output = canvas.getContext("2d");
  if (!output) return null;
  const source = document.createElement("canvas");
  source.width = specimen.naturalWidth; source.height = specimen.naturalHeight;
  const sourceContext = source.getContext("2d", { willReadFrequently: true })!;
  sourceContext.drawImage(specimen, 0, 0);
  const pixels = sourceContext.getImageData(0, 0, source.width, source.height);
  function makeNegative(image: HTMLImageElement | HTMLCanvasElement) {
    const result = document.createElement("canvas");
    result.width = image.width; result.height = image.height;
    const context = result.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const inverted = context.getImageData(0, 0, result.width, result.height);
    for (let i = 0; i < inverted.data.length; i += 4) {
      const r = inverted.data[i], g = inverted.data[i + 1], b = inverted.data[i + 2];
      inverted.data[i] = 255 - r;
      inverted.data[i + 1] = 255 - (g * .7 + r * .3);
      inverted.data[i + 2] = 255 - b * .65;
    }
    context.putImageData(inverted, 0, 0);
    return result;
  }
  const negative = makeNegative(source);
  const negativeBloom = blossom ? makeNegative(blossom) : negative;
  const grey = document.createElement("canvas");
  grey.width = source.width; grey.height = source.height;
  const greyContext = grey.getContext("2d")!;
  greyContext.filter = "grayscale(1) brightness(.9)"; greyContext.drawImage(source, 0, 0);
  const layers = [document.createElement("canvas"), document.createElement("canvas")];
  const contexts = layers.map(layer => layer.getContext("2d")!);
  let width = 1, height = 1, dpr = 1;
  const points: { x: number; y: number; seed: number }[] = [];
  for (let i = 0; i < 1500 && points.length < 90; i++) {
    const x = .06 + random(i * 3) * .9, y = .025 + random(i * 3 + 1) * .54;
    const at = (Math.floor(y * source.height) * source.width + Math.floor(x * source.width)) * 4;
    if (pixels.data[at + 3] > 210 && pixels.data[at] > 90) points.push({ x, y, seed: random(i + 900) });
  }

  function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color = BLACK, align: CanvasTextAlign = "left", mono = false) {
    ctx.fillStyle = color; ctx.font = `${size}px ${mono ? '"Courier New", monospace' : 'Arial, Helvetica, sans-serif'}`;
    ctx.textAlign = align; ctx.textBaseline = "top"; ctx.fillText(value, x, y);
  }
  function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, dashed = false) {
    ctx.strokeStyle = color; ctx.lineWidth = .7; ctx.setLineDash(dashed ? [5, 5] : []);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
  }
  function handles(ctx: CanvasRenderingContext2D, rect: Rect, color = PAPER, size = 7) {
    ctx.fillStyle = color;
    for (const [x, y] of [[rect.x, rect.y], [rect.x + rect.w, rect.y], [rect.x, rect.y + rect.h], [rect.x + rect.w, rect.y + rect.h]]) ctx.fillRect(x - size / 2, y - size / 2, size, size);
  }
  function frame(ctx: CanvasRenderingContext2D, rect: Rect, color = PAPER) {
    ctx.strokeStyle = color; ctx.lineWidth = .8; ctx.strokeRect(rect.x, rect.y, rect.w, rect.h); handles(ctx, rect, color);
  }
  function specimenRect(zoom = 1): Rect {
    const h = height * .68 * zoom, w = h * source.width / source.height;
    return { x: width * .5 - w / 2, y: height * .17 - (h - height * .68) / 2, w, h };
  }
  function macroRect(zoom = 1): Rect {
    const w = Math.max(width * 1.08, height * .95) * zoom;
    const h = w * source.height / source.width;
    return { x: width * .51 - w / 2, y: height * .48 - h * .30, w, h };
  }
  function flower(ctx: CanvasRenderingContext2D, rect: Rect, mode: "red" | "negative" | "grey" = "red") {
    ctx.drawImage(mode === "negative" ? negative : mode === "grey" ? grey : source, rect.x, rect.y, rect.w, rect.h);
  }
  function specimenGrid(ctx: CanvasRenderingContext2D, zoom: number) {
    const size = Math.min(width * .56, height * .70) * zoom;
    const rect = { x: width / 2 - size / 2, y: height / 2 - size / 2, w: size, h: size };
    [rect.x, rect.x + size].forEach(x => line(ctx, x, 0, x, height, "#676267"));
    [rect.y, rect.y + size].forEach(y => line(ctx, 0, y, width, y, "#676267"));
    line(ctx, rect.x, rect.y, rect.x + size, rect.y + size, "#969097", true);
    line(ctx, rect.x + size, rect.y, rect.x, rect.y + size, "#969097", true);
    ctx.beginPath(); ctx.arc(width / 2, height / 2, size / 2, 0, Math.PI * 2); ctx.strokeStyle = "#969097"; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
    handles(ctx, rect, RED, 9); ctx.fillStyle = RED; ctx.fillRect(width / 2 - 4, height / 2 - 4, 8, 8);
    ctx.fillStyle = RED; ctx.fillRect(rect.x, rect.y + size - 30, Math.min(130, size * .48), 30);
    text(ctx, "SPECIMEN_01", rect.x + 10, rect.y + size - 21, Math.min(13, width * .018), PAPER);
  }
  function metadata(ctx: CanvasRenderingContext2D, color = BLACK) {
    if (width < 560) return;
    const lines = ["SPECIMEN: LILIUM-01", "TYPE: RED LILY", "STATE: EARLY BLOOM", "PETAL FORM: OPEN / CURVED", "SURFACE: ORGANIC", "CAPTURE: FRONT STUDY"];
    lines.forEach((value, i) => text(ctx, value, width * .77, height * .32 + i * 10, Math.max(7, width * .0075), color));
  }
  function giantTitle(ctx: CanvasRenderingContext2D, value: string, color: string, y: number, size: number, align: CanvasTextAlign = "left", x = width * .12) {
    text(ctx, value, x, y, size, color, align);
  }
  function pixelFlower(ctx: CanvasRenderingContext2D, rect: Rect, phase: number, breakup = false) {
    const cell = Math.max(7, width / (breakup ? 43 : 78));
    let index = 0;
    for (let y = 0; y < height; y += cell) for (let x = 0; x < width; x += cell) {
      index++;
      const sx = (x + cell / 2 - rect.x) / rect.w, sy = (y + cell / 2 - rect.y) / rect.h;
      if (sx < 0 || sx >= 1 || sy < 0 || sy >= 1) continue;
      const at = (Math.floor(sy * source.height) * source.width + Math.floor(sx * source.width)) * 4;
      if (pixels.data[at + 3] < 150 || (breakup && random(index) < .22 + phase * .4)) continue;
      ctx.fillStyle = PAPER; ctx.fillRect(x, y, cell + .3, cell + .3);
      line(ctx, x + cell * .5, y + cell * .18, x + cell * .5, y + cell * .82, BLACK);
      line(ctx, x + cell * .18, y + cell * .5, x + cell * .82, y + cell * .5, BLACK);
    }
  }
  function coordinates(ctx: CanvasRenderingContext2D, rect: Rect, phase: number, boxes = false, greyMode = false) {
    for (const point of points) {
      const x = rect.x + point.x * rect.w, y = rect.y + point.y * rect.h;
      if (point.seed > .65 + phase * .35) continue;
      if (boxes) {
        const s = 9 + point.seed * 55;
        ctx.fillStyle = greyMode ? "#e31c3235" : "#ffffff05"; ctx.fillRect(x - s / 2, y - s * .34, s, s * .68);
        ctx.strokeStyle = greyMode ? "#ec516276" : "#ffffff95"; ctx.lineWidth = .7; ctx.strokeRect(x - s / 2, y - s * .34, s, s * .68);
      }
      line(ctx, x - 2.5, y, x + 2.5, y, PAPER); line(ctx, x, y - 2.5, x, y + 2.5, PAPER);
      if (!boxes || greyMode) text(ctx, `x:${Math.round(point.x * 1600)} y:${Math.round(point.y * 900)}`, x - 8, y - 12, Math.max(5, width * .006), "#fff8", "left", true);
    }
  }
  function imageCrop(ctx: CanvasRenderingContext2D, rect: Rect, crop: [number, number, number, number], mode: "red" | "negative" | "bud" = "red") {
    const image = mode === "bud" ? bud : mode === "negative" ? negative : source;
    const iw = image.width, ih = image.height;
    ctx.fillStyle = BLACK; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.drawImage(image, crop[0] * iw, crop[1] * ih, crop[2] * iw, crop[3] * ih, rect.x, rect.y, rect.w, rect.h);
  }
  function inspector(ctx: CanvasRenderingContext2D, rect: Rect, crop: [number, number, number, number], label: string) {
    imageCrop(ctx, rect, crop, "negative"); frame(ctx, rect);
    text(ctx, label, rect.x, rect.y - 23, Math.max(10, width * .018), PAPER);
  }
  function mapping(ctx: CanvasRenderingContext2D, rect: Rect, phase: number) {
    coordinates(ctx, rect, phase, true, true);
    ctx.strokeStyle = "#ffffff75"; ctx.setLineDash([4, 6]);
    for (let i = 0; i < 12; i++) {
      const a = points[i * 3], b = points[i * 3 + 2];
      ctx.beginPath(); ctx.moveTo(rect.x + a.x * rect.w, rect.y + a.y * rect.h);
      ctx.quadraticCurveTo(width * random(i), height * random(i + 100), rect.x + b.x * rect.w, rect.y + b.y * rect.h); ctx.stroke();
    }
    ctx.setLineDash([]);
  }
  function anatomy(ctx: CanvasRenderingContext2D, phase: number, simplified = false) {
    const compact = width < 560 && !simplified;
    const card = compact ? width * .27 : Math.min(width * .185, height * .27);
    const rowWidth = compact ? width * .90 : simplified ? card * 4.1 : card * 4.6;
    const start = width / 2 - rowWidth / 2;
    const items: { label: string; crop: [number, number, number, number]; mode: "red" | "bud" }[] = [
      { label: "Bud", crop: [0, 0, 1, 1], mode: "bud" },
      { label: "Tepal", crop: [.10, .09, .30, .28], mode: "red" },
      { label: "Stigma", crop: [.46, .155, .085, .075], mode: "red" },
      { label: "Stamen", crop: [.31, .17, .31, .22], mode: "red" },
      { label: "Receptacle", crop: [.37, .345, .29, .26], mode: "red" },
    ];
    const positions: Rect[] = [];
    items.forEach((item, i) => {
      if (simplified && i !== 0 && i !== 3) return;
      const x = compact ? width * (i < 3 ? .05 + i * .315 : .20 + (i - 3) * .33) : simplified ? start + (i === 0 ? 0 : card * 2.55) : start + i * card * .9;
      const y = compact ? height * (i < 3 ? .28 : .56) + Math.sin(i + phase * .35) * 9 : height * .34 + Math.sin(i * 1.4 + phase * .35) * height * .055;
      const rect = { x, y, w: card, h: card * (i === 0 ? 1.1 : .98) };
      positions.push(rect);
      imageCrop(ctx, rect, item.crop, item.mode); frame(ctx, rect);
      text(ctx, item.label, x, y - 23, Math.max(10, width * .016), PAPER);
    });
    const y1 = height * (compact ? .23 : .28), y2 = height * (compact ? .78 : .72);
    line(ctx, 0, y1, width, y1, "#ffdadb85", true); line(ctx, 0, y2, width, y2, "#ffdadb85", true);
    line(ctx, start, 0, start, height, "#ffdadb85", true); line(ctx, start + rowWidth, 0, start + rowWidth, height, "#ffdadb85", true);
    ctx.strokeStyle = "#ffebeccc"; ctx.lineWidth = .7;
    positions.slice(0, -1).forEach((rect, i) => {
      if (compact && i === 2) return;
      const next = positions[i + 1];
      const x1 = rect.x + rect.w * .5, x2 = next.x + next.w * .5;
      const bottom = Math.max(rect.y + rect.h, next.y + next.h) + height * .065;
      ctx.beginPath(); ctx.moveTo(x1, rect.y + rect.h);
      ctx.bezierCurveTo(x1 + (x2 - x1) * .25, bottom, x2 - (x2 - x1) * .25, bottom, x2, next.y + next.h); ctx.stroke();
      ctx.fillStyle = PAPER; ctx.fillRect(x1 - 3, rect.y + rect.h - 3, 6, 6);
      ctx.fillStyle = BLACK; ctx.beginPath(); ctx.arc(x1, rect.y + rect.h, 1.2, 0, Math.PI * 2); ctx.fill();
    });
    if (simplified) {
      text(ctx, "BL", start + card * 1.02, height * .37, card * .95, PAPER);
      text(ctx, "M", start + card * 3.53, height * .43, card * .95, PAPER);
    }
  }
  function bloom(ctx: CanvasRenderingContext2D, phase: number, negativeMode = false) {
    const size = Math.min(width * .60, height * .74) * (1 + phase * .025);
    const bloomImage = negativeMode ? negativeBloom : blossom ?? source;
    const cropHeight = blossom ? bloomImage.height : source.height * .60;
    ctx.save(); ctx.translate(width * .52, height * .51); ctx.rotate((phase - .5) * .10);
    ctx.drawImage(bloomImage, 0, 0, bloomImage.width, cropHeight, -size / 2, -size / 2, size, size);
    if (negativeMode) {
      const radius = size * .46;
      ctx.strokeStyle = "#fff9"; ctx.lineWidth = .85; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const angle = i / 6 * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(x + y * .38, y - x * .38, x, y); ctx.quadraticCurveTo(x * .35 - y * .28, y * .35 + x * .28, 0, 0); ctx.stroke();
        ctx.fillStyle = BLACK; ctx.beginPath(); ctx.arc(x, y, 2.8, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }
  function drawScene(ctx: CanvasRenderingContext2D, index: number, phase: number) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1;
    const background = [PAPER, RED, PAPER, BLACK, BLACK, BLACK, BLACK, BLACK, RED, RED, PAPER, BLACK, BLACK][index];
    ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
    const zoom = 1 + phase * .055;
    if (index === 0) { specimenGrid(ctx, .92 + phase * .08); flower(ctx, specimenRect(zoom)); metadata(ctx); }
    if (index === 1) {
      pixelFlower(ctx, specimenRect(1.15 + phase * .12), phase); metadata(ctx);
      giantTitle(ctx, "LILIUM", BLACK, height * .61, width * .17);
      text(ctx, "SPECIMEN_01", width * .32, height * .83, width * .018, PAPER);
    }
    if (index === 2) {
      specimenGrid(ctx, 1.08); const rect = specimenRect(1.22 + phase * .17); flower(ctx, rect); metadata(ctx);
      giantTitle(ctx, "LILIUM", BLACK, height * .64, width * .18);
      const aperture = { x: width * (.36 - phase * .07), y: height * (.33 - phase * .12), w: width * (.3 + phase * .14), h: height * (.4 + phase * .21) };
      ctx.save(); ctx.beginPath(); ctx.rect(aperture.x, aperture.y, aperture.w, aperture.h); ctx.clip(); ctx.fillStyle = BLACK; ctx.fillRect(0, 0, width, height); flower(ctx, rect, "negative"); ctx.restore();
    }
    if (index === 3) flower(ctx, macroRect(.73 + phase * .20), "negative");
    if (index === 4 || index === 5 || index === 7) {
      const rect = macroRect(zoom);
      flower(ctx, rect, index === 7 ? "grey" : "red");
      if (index === 7) {
        // Displaced horizontal slices stay attached to the same specimen.
        for (let i = 0; i < 3; i++) {
          const y = height * (.27 + i * .23); ctx.save(); ctx.beginPath(); ctx.rect(0, y, width, height * .085); ctx.clip();
          ctx.fillStyle = BLACK; ctx.fillRect(0, y, width, height * .085); flower(ctx, { ...rect, x: rect.x + (i % 2 ? -1 : 1) * width * .04 * Math.sin(phase * 2 + 1) }, "grey"); ctx.restore();
        }
        mapping(ctx, rect, phase);
      } else coordinates(ctx, rect, phase, index === 5);
      if (index === 5) {
        inspector(ctx, { x: width * .47, y: height * .24, w: width * .23, h: height * .23 }, [.40, .16, .21, .16], "Surface_02");
        inspector(ctx, { x: width * .40, y: height * .65, w: width * .14, h: height * .20 }, [.25, .28, .18, .20], "Surface_03");
      }
    }
    if (index === 6) pixelFlower(ctx, macroRect(1.13 + phase * .6), phase, true);
    if (index === 8 || index === 9) anatomy(ctx, phase, index === 9);
    if (index === 10) giantTitle(ctx, "IN BLOOM", RED, height * .40, width * .145, "center", width / 2);
    if (index === 11) {
      ctx.fillStyle = "#ffffff80";
      for (let x = 20; x < width; x += 55) for (let y = 30; y < height; y += 55) { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill(); }
      giantTitle(ctx, "LIVING", PAPER, height * .05 - phase * 12, width * .23, "right", width * 1.01);
      giantTitle(ctx, "GEOMETRY", PAPER, height * .72 + phase * 12, width * .18, "center", width / 2);
      bloom(ctx, phase);
    }
    if (index === 12) {
      for (let x = 18; x < width; x += 32) line(ctx, x, 0, x, height, "#ffffff24");
      for (let y = 22; y < height; y += 32) line(ctx, 0, y, width, y, "#ffffff24");
      bloom(ctx, phase, true);
      text(ctx, "GEOMETRIC TRACE", width * .045, height * .25, Math.max(10, width * .016), PAPER);
      if (width > 560) {
        ["FORM: RADIAL", "TRACE: ORGANIC CURVE", "STRUCTURE: INTERSECTING ARCS", "SYSTEM: NATURAL SYMMETRY", "STATE: LIVING FORM"].forEach((value, i) => text(ctx, value, width * .045, height * .36 + i * 12, width * .008, PAPER));
        ["Organic form traced", "through curves,", "intersections & symmetry."].forEach((value, i) => text(ctx, value, width * .80, height * .52 + i * 15, width * .011, PAPER));
      }
    }
  }
  function draw(progress: number, reducedMotion = false) {
    const bounds = canvas.getBoundingClientRect();
    const nextWidth = Math.max(1, bounds.width), nextHeight = Math.max(1, bounds.height);
    const nextDpr = Math.min(devicePixelRatio || 1, 1.6);
    if (width !== nextWidth || height !== nextHeight || dpr !== nextDpr) {
      width = nextWidth; height = nextHeight; dpr = nextDpr;
      [canvas, ...layers].forEach(layer => { layer.width = Math.round(width * dpr); layer.height = Math.round(height * dpr); });
    }
    const position = clamp(progress) * 12;
    const index = Math.min(12, Math.floor(position)), phase = position - index;
    const mix = reducedMotion ? (phase >= .5 ? 1 : 0) : ease((phase - .48) / .52);
    drawScene(contexts[0], index, reducedMotion ? 0 : phase);
    output!.setTransform(1, 0, 0, 1, 0, 0); output!.globalAlpha = 1; output!.drawImage(layers[0], 0, 0);
    if (mix > 0 && index < 12) {
      drawScene(contexts[1], index + 1, 0);
      if ([0, 5, 6].includes(index) && !reducedMotion) {
        output!.save(); output!.beginPath();
        const cell = Math.ceil(canvas.width / 36);
        let counter = 0;
        for (let y = 0; y < canvas.height; y += cell) for (let x = 0; x < canvas.width; x += cell) {
          if (random(counter++) < mix) output!.rect(x, y, cell, cell);
        }
        output!.clip(); output!.drawImage(layers[1], 0, 0); output!.restore();
      } else if (index === 2 && !reducedMotion) {
        const w = canvas.width * (.34 + mix * .66), h = canvas.height * (.5 + mix * .5);
        output!.save(); output!.beginPath(); output!.rect((canvas.width - w) / 2, (canvas.height - h) / 2, w, h); output!.clip(); output!.globalAlpha = mix; output!.drawImage(layers[1], 0, 0); output!.restore();
      } else { output!.globalAlpha = mix; output!.drawImage(layers[1], 0, 0); output!.globalAlpha = 1; }
    }
  }
  return { draw, dispose: () => { [source, negative, negativeBloom, grey, ...layers].forEach(layer => { layer.width = 1; layer.height = 1; }); } };
}
