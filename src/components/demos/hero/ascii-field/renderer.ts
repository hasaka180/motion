/** A depth-buffered, deforming ribbon rendered entirely as character cells. */
export function createAsciiField(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return null;
  const ctx = context;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const background = document.createElement("canvas");
  const bg = background.getContext("2d")!;
  const glyphs = " .:+*ESROH#";
  const atlas = document.createElement("canvas");
  const ink = atlas.getContext("2d")!;
  const tile = 20;
  atlas.width = glyphs.length * tile;
  atlas.height = 32 * 3 * tile;
  ink.font = "12px monospace";
  ink.textAlign = "center";
  ink.textBaseline = "middle";
  for (let palette = 0; palette < 3; palette++) {
    for (let light = 0; light < 32; light++) {
      const value = light / 31;
      const color = palette === 0 ? [176, 177, 170] : palette === 1 ? [255, 164, 151] : [84, 185, 202];
      ink.fillStyle = `rgb(${color.map(channel => Math.round(channel * value)).join(",")})`;
      for (let g = 0; g < glyphs.length; g++) {
        ink.fillText(glyphs[g], g * tile + tile / 2, (palette * 32 + light) * tile + tile / 2);
      }
    }
  }

  let width = 1, height = 1, columns = 1, rows = 1, cell = 8, pixelRatio = 1;
  let depth = new Float32Array(1);
  let shades = new Float32Array(1);
  let colors = new Uint8Array(1);
  let frame = 0, last = 0, time = 0;
  let inView = false, paused = false, disposed = false;
  let pointerX = 0, pointerY = 0, driftX = 0, driftY = 0;
  let hover = 0, hoverTarget = 0;

  // Precompute the surface angles; only the deformation changes each frame.
  const around = 260, across = 96;
  const sinU = Float32Array.from({ length: around }, (_, i) => Math.sin(i / around * Math.PI * 2));
  const cosU = Float32Array.from({ length: around }, (_, i) => Math.cos(i / around * Math.PI * 2));
  const sinV = Float32Array.from({ length: across }, (_, i) => Math.sin(i / across * Math.PI * 2));
  const cosV = Float32Array.from({ length: across }, (_, i) => Math.cos(i / across * Math.PI * 2));

  function paint() {
    hover += (hoverTarget - hover) * 0.11;
    // Treat each cell row as a tiny scanline. Near the pointer the scanlines
    // peel sideways and bob vertically, so the backdrop itself feels alive.
    ctx.fillStyle = "#111211";
    ctx.fillRect(0, 0, width, height);
    for (let row = 0; row < rows; row++) {
      const distance = row / rows - (pointerY + 0.5);
      const influence = hover * Math.exp(-(distance * distance) / 0.022);
      const offsetX = influence * cell * (Math.sin(row * 0.57 + time * 5.4) * 1.45 + driftX * 5.5);
      const offsetY = influence * cell * Math.sin(row * 0.21 - time * 3.1) * 0.52;
      const sourceY = row * cell * pixelRatio;
      const sourceHeight = Math.min(cell * pixelRatio, background.height - sourceY);
      if (sourceHeight > 0) {
        ctx.drawImage(background, 0, sourceY, background.width, sourceHeight,
          offsetX, row * cell + offsetY, width, sourceHeight / pixelRatio + 0.7);
      }
    }
    depth.fill(-Infinity);
    shades.fill(0);
    driftX += (pointerX - driftX) * 0.065;
    driftY += (pointerY - driftY) * 0.065;
    const tilt = 0.58 + Math.sin(time * 0.29) * 0.38 + driftX * 0.18;
    const roll = -0.46 + Math.sin(time * 0.21) * 0.22 + driftY * 0.1;
    const ct = Math.cos(tilt), st = Math.sin(tilt), cr = Math.cos(roll), sr = Math.sin(roll);
    const scale = Math.min(width * 0.46, height * 0.52);
    const centerX = width * (width < 500 ? 0.60 : 0.65);
    const centerY = height * 0.49;
    for (let u = 0; u < around; u++) {
      const angle = u / around * Math.PI * 2;
      const wave = Math.sin(angle * 3 + time * 0.57);
      const radius = 0.86 + 0.10 * wave + 0.045 * Math.sin(angle * 5 - time * 0.3);
      const tube = 0.34 + 0.09 * Math.sin(angle * 2 - time * 0.46);
      const twist = angle * 2 + time * 0.22;
      const a = Math.cos(twist), b = Math.sin(twist);
      for (let v = 0; v < across; v++) {
        const crossX = cosV[v] * a - sinV[v] * b;
        const crossZ = sinV[v] * a + cosV[v] * b;
        const r = radius + tube * crossX;
        const x = r * cosU[u], y = r * sinU[u];
        const z = tube * crossZ * 1.22 + 0.15 * Math.sin(angle * 2 + time * 0.38);
        const rx = x * ct + z * st;
        const rz = z * ct - x * st;
        const perspective = 3.8 / (3.8 - rz);
        const screenY = (rx * sr + y * cr) * scale * perspective + centerY;
        const row = Math.floor(screenY / cell);
        // Short bands slip by whole cells, giving the smooth form digital edges.
        const slip = Math.sin(row * 0.73 + Math.floor(time * 5) * 1.7) > 0.987 ? 2 : 0;
        const col = Math.floor(((rx * cr - y * sr) * scale * perspective + centerX) / cell) + slip;
        if (col < -1 || col >= columns || row < -1 || row >= rows) continue;
        const nx = crossX * cosU[u], ny = crossX * sinU[u];
        const normalX = nx * ct + crossZ * st;
        const normalZ = crossZ * ct - nx * st;
        const light = Math.max(0, -normalX * 0.46 - ny * 0.57 + normalZ * 0.68);
        const rim = Math.pow(1 - Math.abs(normalZ), 4);
        const shine = Math.pow(light, 11);
        const shade = Math.min(1, 0.045 + light * 0.17 + shine * 0.72 + rim * 0.23);
        const palette = Math.sin(angle * 3 + crossZ * 3 + time * 0.25) > 0.28 ? 1 : 2;
        // Overlapping cell splats close sampling holes while retaining a stepped silhouette.
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const cx = col + dx, cy = row + dy;
            if (cx < 0 || cx >= columns || cy < 0 || cy >= rows) continue;
            const index = cy * columns + cx;
            if (rz <= depth[index]) continue;
            depth[index] = rz;
            shades[index] = shade;
            colors[index] = shine > 0.65 ? 0 : palette;
          }
        }
      }
    }
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        if (depth[index] === -Infinity) continue;
        const shade = shades[index];
        ctx.fillStyle = shade > 0.46 ? (colors[index] === 1 ? "#352326" : "#152b31") : "#050708";
        ctx.fillRect(col * cell, row * cell, cell, cell);
        const glyph = Math.min(glyphs.length - 1, 2 + Math.floor(shade * 8 + (col + row) % 3));
        const light = Math.min(31, Math.floor(shade * 31));
        ctx.drawImage(atlas, glyph * tile, (colors[index] * 32 + light) * tile, tile, tile,
          col * cell - cell * 0.25, row * cell - cell * 0.25, cell * 1.5, cell * 1.5);
      }
    }
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    cell = Math.max(7, width / 150);
    columns = Math.ceil(width / cell);
    rows = Math.ceil(height / cell);
    depth = new Float32Array(columns * rows);
    shades = new Float32Array(columns * rows);
    colors = new Uint8Array(columns * rows);
    background.width = canvas.width;
    background.height = canvas.height;
    bg.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    bg.fillStyle = "#111211";
    bg.fillRect(0, 0, width, height);
    bg.font = `${cell * 0.78}px monospace`;
    bg.textAlign = "center";
    bg.textBaseline = "middle";
    const chars = ".+ESROH";
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = col / columns, y = row / rows;
        const distance = Math.hypot((x - 0.48) * 1.15, (y - 0.48) * 0.8);
        const band = (Math.sin(distance * 13 + x * 2 - y * 3) + 1) / 2;
        const strength = Math.max(0.09, (1 - distance) * 0.61 + band * 0.20);
        bg.fillStyle = `rgba(205,205,194,${strength})`;
        bg.fillText(chars[Math.min(6, Math.floor(band * 5 + strength * 2))], (col + 0.5) * cell, (row + 0.5) * cell);
      }
    }
    paint();
  }

  function tick(now: number) {
    frame = 0;
    if (disposed || paused || reducedMotion.matches || !inView || document.hidden) return;
    if (now - last >= 1000 / 30) {
      time += Math.min((now - last) / 1000, 0.06);
      last = now;
      paint();
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = performance.now();
    if (!disposed && !paused && !reducedMotion.matches && inView && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function move(event: PointerEvent) {
    if (reducedMotion.matches) return;
    const bounds = canvas.getBoundingClientRect();
    pointerX = (event.clientX - bounds.left) / width - 0.5;
    pointerY = (event.clientY - bounds.top) / height - 0.5;
    hoverTarget = 1;
  }
  function leave() { pointerX = 0; pointerY = 0; hoverTarget = 0; }
  const host = canvas.parentElement!;
  const observer = new ResizeObserver(resize);
  const intersection = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
  observer.observe(canvas);
  intersection.observe(canvas);
  host.addEventListener("pointermove", move);
  host.addEventListener("pointerleave", leave);
  document.addEventListener("visibilitychange", sync);
  reducedMotion.addEventListener("change", sync);
  resize();

  return {
    pause(value: boolean) { paused = value; sync(); },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", sync);
      reducedMotion.removeEventListener("change", sync);
    },
  };
}
