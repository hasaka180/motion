export type Origin = { x: number; y: number };

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const noise = (n: number) => {
  const value = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

function surface(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/** An environment-mapped torus, painted once and reused by every tile. */
function chromeRing(size: number) {
  const canvas = surface(size, size);
  const ctx = canvas.getContext("2d")!;
  const pixels = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size - 0.5) * 2;
      const v = (y / size - 0.5) * 2;
      const radius = Math.hypot(u, v);
      const tube = (radius - 0.63) / 0.3;
      if (Math.abs(tube) >= 1) continue;
      const z = Math.sqrt(1 - tube * tube);
      const angle = Math.atan2(v, u);
      const reflection = Math.asin(tube) * 3.2 + Math.sin(angle * 3) * 0.8;
      const stripe = Math.pow(Math.max(0, Math.sin(reflection * 9)), 10);
      const light = 0.15 + 0.65 * z + stripe * 0.5;
      const highlight = Math.pow(clamp(z * 0.82 - tube * (u + v) / radius * 0.4), 42);
      const i = (y * size + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        const spectrum = 0.5 + 0.5 * Math.sin(reflection * 3 + angle * 2 + channel * 2.1);
        pixels.data[i + channel] = Math.min(255, (12 + spectrum ** 3 * 235) * light + highlight * 240);
      }
      pixels.data[i + 3] = clamp((1 - Math.abs(tube)) * size * 0.25) * 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}

function artwork(width: number, height: number, dark: boolean) {
  const canvas = surface(width, height);
  const ctx = canvas.getContext("2d")!;
  const sky = ctx.createLinearGradient(0, 0, width * 0.3, height);
  sky.addColorStop(0, dark ? "#030307" : "#ffd9ff");
  sky.addColorStop(0.48, dark ? "#080511" : "#ef80f6");
  sky.addColorStop(1, dark ? "#090619" : "#650c99");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  if (!dark) {
    // Irregular translucent facets give the pink scene a crystalline surface.
    for (let i = 0; i < 2200; i++) {
      const x = noise(i * 7) * width;
      const y = noise(i * 7 + 1) * height;
      const size = (4 + noise(i * 7 + 2) ** 3 * 95) * width / 1000;
      ctx.fillStyle = `hsla(${275 + noise(i + 9) * 45}, 95%, ${65 + noise(i + 3) * 35}%, ${0.12 + noise(i) * 0.45})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + size, y - size * noise(i + 4));
      ctx.lineTo(x + size * 0.7, y + size * 1.7);
      ctx.lineTo(x - size * 0.2, y + size * 0.8);
      ctx.fill();
    }
    const ringSize = Math.round(Math.min(width * 0.64, height * 0.95));
    const ring = chromeRing(ringSize);
    ctx.save();
    ctx.translate(width * 0.64, height * 0.48);
    ctx.rotate(-0.27);
    ctx.scale(1, 0.88);
    ctx.shadowColor = "#50005f";
    ctx.shadowBlur = height * 0.08;
    ctx.shadowOffsetY = height * 0.04;
    ctx.drawImage(ring, -ringSize / 2, -ringSize / 2);
    ctx.restore();
  } else {
    // Draw distant columns first, then larger foreground prisms and reflections.
    const horizon = height * 0.57;
    for (let row = 0; row < 5; row++) {
      const depth = (row + 1) / 5;
      for (let col = 0; col < 15; col++) {
        const seed = row * 17 + col;
        const x = width * 0.5 + (col - 7) * width * (0.022 + depth * 0.065);
        const w = width * (0.009 + depth * 0.033);
        const h = height * (0.06 + noise(seed + 5) * 0.38) * depth;
        const bottom = horizon + depth ** 2 * height * 0.18;
        const spectrum = ctx.createLinearGradient(x, bottom - h, x + w * 0.4, bottom);
        for (let stop = 0; stop <= 18; stop++) {
          const hue = (stop * 107 + seed * 41) % 360;
          spectrum.addColorStop(stop / 18, `hsl(${hue}, 100%, ${stop % 4 === 0 ? 9 : 48}%)`);
        }
        ctx.fillStyle = spectrum;
        ctx.fillRect(x, bottom - h, w, h);
        const shine = ctx.createLinearGradient(x, 0, x + w, 0);
        shine.addColorStop(0, "#ffffff88");
        shine.addColorStop(0.12, "#ffffff08");
        shine.addColorStop(0.65, "#00000066");
        shine.addColorStop(1, "#000000d9");
        ctx.fillStyle = shine;
        ctx.fillRect(x, bottom - h, w, h);
        ctx.save();
        ctx.translate(0, bottom * 2);
        ctx.scale(1, -1);
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = spectrum;
        ctx.fillRect(x, bottom - h * 0.75, w, h * 0.75);
        ctx.restore();
      }
    }
    const glow = ctx.createRadialGradient(width * 0.5, horizon, 0, width * 0.5, horizon, width * 0.55);
    glow.addColorStop(0, "#836eff24");
    glow.addColorStop(1, "#00000000");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }
  const shade = ctx.createLinearGradient(0, height * 0.55, 0, height);
  shade.addColorStop(0, "#08001100");
  shade.addColorStop(1, dark ? "#030208dd" : "#300044b0");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);
  return canvas;
}

export function createPrismaticRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return null;
  let frames: HTMLCanvasElement[] = [];
  let width = 0;
  let height = 0;
  let cell = 0;

  return {
    resize(cssWidth: number, cssHeight: number) {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const nextWidth = Math.max(1, Math.round(cssWidth * ratio));
      const nextHeight = Math.max(1, Math.round(cssHeight * ratio));
      if (width === nextWidth && height === nextHeight) return;
      width = canvas.width = nextWidth;
      height = canvas.height = nextHeight;
      cell = Math.max(18, Math.round(cssWidth / 34)) * ratio;
      frames = [artwork(width, height, false), artwork(width, height, true)];
    },
    draw(progress: number, from: number, origin: Origin) {
      if (!frames.length) return;
      const outgoing = frames[from];
      const incoming = frames[1 - from];
      ctx.drawImage(progress >= 1 ? incoming : outgoing, 0, 0);
      if (progress <= 0 || progress >= 1) return;

      const ox = origin.x * width;
      const oy = origin.y * height;
      const reach = Math.hypot(Math.max(ox, width - ox), Math.max(oy, height - oy));
      const front = progress * 1.5 - 0.2;
      const cols = Math.ceil(width / cell);
      for (let y = 0, row = 0; y < height; y += cell, row++) {
        for (let x = 0, col = 0; x < width; x += cell, col++) {
          const seed = row * cols + col;
          const random = noise(seed);
          const distance = Math.hypot(x + cell / 2 - ox, y + cell / 2 - oy) / reach;
          const arrival = distance + (random - 0.5) * 0.23;
          const local = clamp((front - arrival) / 0.2 + 0.5);
          if (local <= 0) continue;
          const w = Math.min(cell, width - x);
          const h = Math.min(cell, height - y);
          const edge = Math.sin(local * Math.PI);
          const offset = Math.round((random - 0.5) * edge * 7) * cell;
          const sourceX = Math.max(0, Math.min(width - w, x + offset));
          const sourceY = Math.max(0, Math.min(height - h, y + offset * 0.5));
          ctx.drawImage(local > 0.3 ? incoming : outgoing, sourceX, sourceY, w, h, x, y, w, h);
          if (edge > 0.05) {
            ctx.globalAlpha = edge * (random > 0.8 ? 0.85 : 0.38);
            ctx.fillStyle = random > 0.8 ? "#07020c" : ["#fe6df7", "#b486ff", "#154dff", "#edc7ff"][seed % 4];
            ctx.fillRect(x, y, w, h);
            ctx.globalAlpha = 1;
          }
        }
      }
    },
    dispose() {
      frames.forEach(frame => { frame.width = frame.height = 0; });
      frames = [];
    },
  };
}
