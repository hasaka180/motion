type InkStroke = { path: SVGPathElement; start: number; duration: number };

/** One visible-time clock coordinates the writing and image decoding. */
export function createBotanicalReveal(
  host: HTMLElement,
  artwork: HTMLElement,
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  portal: HTMLCanvasElement,
  lettering: SVGSVGElement,
) {
  const ctx = canvas.getContext("2d");
  const portalCtx = portal.getContext("2d");
  if (!ctx || !portalCtx) return () => {};
  const context = ctx;
  const portalContext = portalCtx;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const sample = document.createElement("canvas");
  const portalSource = document.createElement("canvas");
  const sampleContext = sample.getContext("2d", { willReadFrequently: true })!;
  const portalSourceContext = portalSource.getContext("2d")!;
  const glyphs = "01:*/+#DARWIN";
  const vectors = Array.from(lettering.querySelectorAll<SVGPathElement>("[data-vector]"));
  const welcomeLetters = Array.from(host.querySelectorAll<HTMLElement>("[data-letter]"));
  const portalPaths = vectors.map((path) => new Path2D(path.getAttribute("d") ?? ""));
  const ink: InkStroke[] = [
    { path: vectors[0], start: 260, duration: 900 },
    { path: vectors[1], start: 980, duration: 2900 },
  ];
  const endTime = 4000;
  const portalDuration = 1850;
  const portalEnd = endTime + portalDuration;
  const welcomeTime = endTime + portalDuration * .42;
  const portalAnchor = { x: 309.205, y: 98.5081 };
  let width = 1, height = 1, cell = 9, columns = 1, rows = 1;
  let dpr = 1, cropX = 0, cropY = 0, cropWidth = 1, cropHeight = 1;
  let portalX = 0, portalY = 0, portalSourceReady = false;
  let pixels = new Uint8ClampedArray(4);
  let time = 0, last = 0, lastPaint = -Infinity, frame = 0;
  let visible = false, disposed = false, hovering = false, strength = 0;
  let pointerX = -1000, pointerY = -1000;
  let welcomeTimer: ReturnType<typeof setTimeout> | undefined;

  // Refresh the scattered ink sources on each showing, outside React render
  // so server and client markup remain identical.
  function scatterInk() {
    const shuffled = [...welcomeLetters];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    shuffled.forEach((letter, rank) => {
      const x = 15 + Math.random() * 70;
      const y = 15 + Math.random() * 70;
      const origin: string[] = [], spread: string[] = [], full: string[] = [];
      const rotation = Math.random() * Math.PI * 2;
      for (let point = 0; point < 24; point++) {
        const angle = rotation + point / 24 * Math.PI * 2;
        const radius = 20 + Math.random() * 22;
        const edge = 170 + Math.random() * 70;
        origin.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
        spread.push(`${(x + Math.cos(angle) * radius).toFixed(2)}% ${(y + Math.sin(angle) * radius).toFixed(2)}%`);
        full.push(`${(x + Math.cos(angle) * edge).toFixed(2)}% ${(y + Math.sin(angle) * edge).toFixed(2)}%`);
      }
      letter.style.setProperty("--ink-origin", `polygon(${origin.join(",")})`);
      letter.style.setProperty("--ink-spread", `polygon(${spread.join(",")})`);
      letter.style.setProperty("--ink-full", `polygon(${full.join(",")})`);
      letter.style.setProperty("--ink-delay", `${2500 + rank / Math.max(1, shuffled.length - 1) * 4200}ms`);
      letter.style.setProperty("--ink-duration", `${1600 + Math.random() * 1000}ms`);
    });
  }

  function pauseWelcome() {
    clearTimeout(welcomeTimer);
    welcomeTimer = undefined;
  }

  function scheduleWelcome() {
    if (disposed || !visible || document.hidden || preference.matches ||
      host.dataset.complete !== "true" || welcomeTimer !== undefined) return;
    const showing = host.dataset.welcomeVisible !== "false";
    const delay = showing ? 12000 + Math.random() * 6000 : 3000 + Math.random() * 3000;
    welcomeTimer = setTimeout(() => {
      welcomeTimer = undefined;
      if (!showing) {
        scatterInk();
        host.style.setProperty("--welcome-x", `${Math.round(Math.random() * 24 - 12)}px`);
        host.style.setProperty("--welcome-y", `${Math.round(Math.random() * 24 - 12)}px`);
      }
      host.dataset.welcomeVisible = String(!showing);
      scheduleWelcome();
    }, delay);
  }

  function drawInk() {
    ink.forEach(({ path, start, duration }) => {
      const progress = Math.max(0, Math.min(1, (time - start) / duration));
      path.style.opacity = progress > 0 ? "1" : "0";
      path.style.strokeDashoffset = String(1 - progress);
    });
    const complete = time >= endTime;
    lettering.dataset.written = String(complete);
    lettering.style.opacity = complete && !preference.matches ? "0" : "1";
    host.dataset.revealed = String(complete);
    host.dataset.complete = String(preference.matches || time >= welcomeTime);
    scheduleWelcome();
  }

  function buildPortalSource() {
    const artworkBounds = artwork.getBoundingClientRect();
    const letterBounds = lettering.getBoundingClientRect();
    const letterScale = letterBounds.width / 638;
    portalX = letterBounds.left - artworkBounds.left + portalAnchor.x * letterScale;
    portalY = letterBounds.top - artworkBounds.top + portalAnchor.y * letterScale;
    portalSource.width = Math.round(width * dpr);
    portalSource.height = Math.round(height * dpr);
    portalSourceContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    portalSourceContext.clearRect(0, 0, width, height);
    portalSourceContext.save();
    portalSourceContext.translate(portalX, portalY);
    portalSourceContext.scale(letterScale, letterScale);
    portalSourceContext.translate(-portalAnchor.x, -portalAnchor.y);
    portalSourceContext.strokeStyle = "#fff";
    portalSourceContext.lineWidth = 14.8883;
    portalSourceContext.lineCap = "round";
    portalPaths.forEach((path) => portalSourceContext.stroke(path));
    portalSourceContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    portalSourceContext.globalCompositeOperation = "source-in";
    portalSourceContext.filter = "saturate(1.25) invert(1)";
    portalSourceContext.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      width,
      height,
    );
    portalSourceContext.restore();
    portalSourceReady = true;
  }

  function drawPortal() {
    portalContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    portalContext.clearRect(0, 0, width, height);
    if (preference.matches || time < endTime || !image.naturalWidth) return;
    if (!portalSourceReady) buildPortalSource();

    const progress = Math.min(1, (time - endTime) / portalDuration);
    const zoom = 1 + 79 * progress * progress;
    portalContext.save();
    portalContext.translate(portalX, portalY);
    portalContext.scale(zoom, zoom);
    portalContext.translate(-portalX, -portalY);
    portalContext.drawImage(
      portalSource,
      0,
      0,
      portalSource.width,
      portalSource.height,
      0,
      0,
      width,
      height,
    );
    portalContext.restore();
  }

  function drawField() {
    context.clearRect(0, 0, width, height);
    if (preference.matches) return;
    context.font = `${cell * .83}px monospace`;
    context.textBaseline = "middle";
    context.textAlign = "center";
    const step = Math.floor(time / 75);
    const radius = Math.max(95, width * .14);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const i = (row * columns + col) * 4;
        const r = pixels[i] || 0, g = pixels[i + 1] || 0, b = pixels[i + 2] || 0;
        const hash = ((col * 127 + row * 311) % 997) / 997;
        const settle = 450 + (col / columns * .55 + row / rows * .45) * 1750 + hash * 500;
        const entrance = Math.max(0, Math.min(1, (settle - time) / 500));
        const x = (col + .5) * cell, y = (row + .5) * cell;
        const distance = Math.hypot(x - pointerX, y - pointerY);
        const local = Math.max(0, 1 - distance / radius) * strength;
        const amount = Math.max(entrance, local);
        if (amount > .01) {
          context.fillStyle = `rgba(${r >> 1},${g >> 1},${b >> 1},${amount})`;
          context.fillRect(col * cell, row * cell, cell, cell);
        }
        // A faint stable field remains even in the dark negative space.
        const alpha = .10 + amount * .80;
        const boost = 48 + amount * 60;
        context.fillStyle = `rgba(${Math.min(255, r + boost)},${Math.min(255, g + boost)},${Math.min(255, b + boost)},${alpha})`;
        const char = (col * 3 + row * 7 + (amount > .02 ? step : 0)) % glyphs.length;
        context.fillText(glyphs[char], x, y);
      }
    }
  }

  function tick(now: number) {
    frame = 0;
    if (disposed || !visible || document.hidden || preference.matches) return;
    const delta = Math.min(50, now - last);
    last = now;
    time += delta;
    strength += ((hovering ? 1 : 0) - strength) * (1 - Math.exp(-delta / 100));
    drawInk();
    drawPortal();
    if (now - lastPaint >= 1000 / 24) { drawField(); lastPaint = now; }
    if (time < portalEnd || hovering || strength > .005) frame = requestAnimationFrame(tick);
    else { strength = 0; drawField(); }
  }
  function wake() {
    if (frame || disposed || !visible || document.hidden || preference.matches) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0;
    pauseWelcome();
    if (preference.matches) {
      host.dataset.welcomeVisible = "true";
      host.style.removeProperty("--welcome-x");
      host.style.removeProperty("--welcome-y");
      time = portalEnd; strength = 0; hovering = false;
      drawInk(); drawField(); drawPortal();
    } else if (visible && !document.hidden) wake();
    else { hovering = false; strength = 0; drawField(); drawPortal(); }
    scheduleWelcome();
  }
  function resize() {
    const bounds = artwork.getBoundingClientRect();
    portalSourceReady = false;
    width = Math.max(1, bounds.width); height = Math.max(1, bounds.height);
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    portal.width = Math.round(width * dpr); portal.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    portalContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = Math.max(8, width / 135);
    columns = Math.ceil(width / cell); rows = Math.ceil(height / cell);
    sample.width = columns; sample.height = rows;
    if (image.naturalWidth && image.naturalHeight) {
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      cropWidth = width / scale; cropHeight = height / scale;
      cropX = (image.naturalWidth - cropWidth) / 2;
      cropY = (image.naturalHeight - cropHeight) / 2;
      sampleContext.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, columns, rows);
    }
    pixels = sampleContext.getImageData(0, 0, columns, rows).data;
    drawField(); drawInk(); drawPortal(); wake();
  }
  function move(event: PointerEvent) {
    if (preference.matches || !event.isPrimary) return;
    const bounds = artwork.getBoundingClientRect();
    pointerX = event.clientX - bounds.left; pointerY = event.clientY - bounds.top;
    hovering = true; wake();
  }
  function leave() { hovering = false; wake(); }
  function up(event: PointerEvent) { if (event.pointerType !== "mouse") leave(); }
  const sizes = new ResizeObserver(resize);
  const views = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
  sizes.observe(host); views.observe(host);
  host.addEventListener("pointermove", move, { passive: true });
  host.addEventListener("pointerdown", move, { passive: true });
  host.addEventListener("pointerleave", leave);
  host.addEventListener("pointercancel", leave);
  host.addEventListener("pointerup", up);
  document.addEventListener("visibilitychange", sync);
  preference.addEventListener("change", sync);
  scatterInk(); resize(); sync();
  return () => {
    pauseWelcome();
    disposed = true; cancelAnimationFrame(frame); sizes.disconnect(); views.disconnect();
    host.removeEventListener("pointermove", move); host.removeEventListener("pointerdown", move);
    host.removeEventListener("pointerleave", leave); host.removeEventListener("pointercancel", leave);
    host.removeEventListener("pointerup", up); document.removeEventListener("visibilitychange", sync);
    preference.removeEventListener("change", sync);
    delete host.dataset.revealed;
    delete host.dataset.complete;
    delete host.dataset.welcomeVisible;
    host.style.removeProperty("--welcome-x");
    host.style.removeProperty("--welcome-y");
    welcomeLetters.forEach((letter) => {
      ["--ink-origin", "--ink-spread", "--ink-full", "--ink-delay", "--ink-duration"]
        .forEach((property) => letter.style.removeProperty(property));
    });
  };
}
