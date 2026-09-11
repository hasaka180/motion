type Point = { x: number; y: number; time: number };

/** White paint on a difference-blended canvas inverts the actual DOM below it. */
export function createNegativeTrail(host: HTMLElement, canvas: HTMLCanvasElement, artwork: HTMLElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const context = ctx;
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const lifetime = 800;
  let width = 1, height = 1, stroke = 36;
  let frame = 0, last = 0, clock = 0;
  let visible = false, disposed = false, active = false, initialized = false;
  let targetX = 0, targetY = 0, x = 0, y = 0, panX = 0, panY = 0;
  let points: Point[] = [];

  function clear() { context.clearRect(0, 0, width, height); }
  function reset() {
    points = [];
    active = false;
    initialized = false;
    panX = panY = 0;
    artwork.style.transform = "translate3d(0, 0, 0)";
    clear();
  }

  function paint() {
    clear();
    if (points.length < 2) return;
    const head = points[points.length - 1];
    const fade = Math.min(1, Math.max(0, (lifetime - (clock - head.time)) / 240));
    const left: { x: number; y: number }[] = [];
    const right: { x: number; y: number }[] = [];
    points.forEach((point, index) => {
      const before = points[Math.max(0, index - 1)];
      const after = points[Math.min(points.length - 1, index + 1)];
      const dx = after.x - before.x, dy = after.y - before.y;
      const length = Math.hypot(dx, dy) || 1;
      const age = Math.max(0, 1 - (clock - point.time) / lifetime);
      const taper = Math.pow(index / (points.length - 1), 0.65);
      const radius = stroke * 0.5 * taper * Math.sqrt(age);
      left.push({ x: point.x - dy / length * radius, y: point.y + dx / length * radius });
      right.push({ x: point.x + dy / length * radius, y: point.y - dx / length * radius });
    });
    // One filled silhouette avoids bright seams where translucent strokes overlap.
    const outline = [...left, ...right.reverse()];
    context.beginPath();
    const end = outline[outline.length - 1];
    context.moveTo((end.x + outline[0].x) / 2, (end.y + outline[0].y) / 2);
    outline.forEach((point, index) => {
      const next = outline[(index + 1) % outline.length];
      context.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
    });
    context.closePath();
    context.fillStyle = `rgba(255,255,255,${fade})`;
    context.fill();
  }

  function tick(now: number) {
    frame = 0;
    if (disposed || !visible || document.hidden || preference.matches) return;
    const dt = Math.min(now - last, 40);
    last = now;
    clock += dt;
    const ease = 1 - Math.exp(-dt / 55);
    if (active) {
      const moved = Math.hypot(targetX - x, targetY - y) > 0.2;
      x += (targetX - x) * ease;
      y += (targetY - y) * ease;
      const previous = points[points.length - 1];
      if (moved && (!previous || Math.hypot(previous.x - x, previous.y - y) > 0.45)) points.push({ x, y, time: clock });
    }
    points = points.filter(point => clock - point.time < lifetime).slice(-100);
    const desiredX = active ? (targetX / width - 0.5) * -16 : 0;
    const desiredY = active ? (targetY / height - 0.5) * -12 : 0;
    panX += (desiredX - panX) * ease;
    panY += (desiredY - panY) * ease;
    artwork.style.transform = `translate3d(${panX.toFixed(3)}px, ${panY.toFixed(3)}px, 0)`;
    paint();
    const moving = active && Math.hypot(targetX - x, targetY - y) > 0.2;
    const panning = Math.hypot(desiredX - panX, desiredY - panY) > 0.02;
    if (points.length || moving || panning) frame = requestAnimationFrame(tick);
  }

  function wake() {
    if (frame || disposed || !visible || document.hidden || preference.matches) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    if (preference.matches) reset();
    else if (!visible || document.hidden) reset();
    else wake();
  }
  function resize() {
    const bounds = host.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    stroke = Math.min(90, Math.max(36, width * 0.09));
    reset();
    wake();
  }
  function move(event: PointerEvent) {
    if (preference.matches || !event.isPrimary) return;
    const bounds = host.getBoundingClientRect();
    targetX = event.clientX - bounds.left;
    targetY = event.clientY - bounds.top;
    if (!initialized) {
      x = targetX;
      y = targetY;
      points = [];
      initialized = true;
    }
    active = true;
    wake();
  }
  function leave() { active = false; initialized = false; wake(); }
  function up(event: PointerEvent) { if (event.pointerType !== "mouse") leave(); }

  const sizeObserver = new ResizeObserver(resize);
  const viewObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
  sizeObserver.observe(host);
  viewObserver.observe(host);
  host.addEventListener("pointermove", move, { passive: true });
  host.addEventListener("pointerdown", move, { passive: true });
  host.addEventListener("pointerleave", leave);
  host.addEventListener("pointercancel", leave);
  host.addEventListener("pointerup", up);
  document.addEventListener("visibilitychange", sync);
  preference.addEventListener("change", sync);
  resize();

  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    sizeObserver.disconnect();
    viewObserver.disconnect();
    host.removeEventListener("pointermove", move);
    host.removeEventListener("pointerdown", move);
    host.removeEventListener("pointerleave", leave);
    host.removeEventListener("pointercancel", leave);
    host.removeEventListener("pointerup", up);
    document.removeEventListener("visibilitychange", sync);
    preference.removeEventListener("change", sync);
    reset();
  };
}
