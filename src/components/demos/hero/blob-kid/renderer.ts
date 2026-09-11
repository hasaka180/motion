import { Transformation, type Form, type Snapshot } from "./forms";
import { FRAGMENT, VERTEX } from "./shaders";

export type View = "Orbit" | "Front" | "Side" | "Rear" | "Top";
export type Studio = { select: (form: Form) => void; view: (view: View) => void; zoom: (delta: number) => void; dispose: () => void };

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to allocate a shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message ?? "Unable to compile the studio shader.");
  }
  return shader;
}

export function createStudio(canvas: HTMLCanvasElement, onState: (state: Snapshot) => void, onError: (message: string) => void): Studio {
  const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
  if (!gl) throw new Error("This studio needs WebGL 2. Try a browser with graphics acceleration enabled.");
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create the studio.");
  const shaders: WebGLShader[] = [];
  try {
    shaders.push(compile(gl, gl.VERTEX_SHADER, VERTEX));
    shaders.push(compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    for (const shader of shaders) gl.attachShader(program, shader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "Unable to link the studio.");
  } catch (error) {
    gl.deleteProgram(program);
    throw error;
  } finally {
    for (const shader of shaders) gl.deleteShader(shader);
  }
  const vao = gl.createVertexArray();
  const uniforms = Object.fromEntries(["resolution", "eye", "target", "ortho", "zoom", "time", "idleTime", "progress", "sourceForm", "targetForm", "moving"].map(name => [name, gl.getUniformLocation(program, name)]));
  const machine = new Transformation();
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = motion.matches;
  let yaw = 0.26, pitch = 0.10, distance = 8.3, orthographic = false;
  let width = 1, height = 1;
  let frame = 0, last = 0, time = 0, idleTime = 0, lastPublish = 0;
  let visible = true, disposed = false, lost = false, dirty = true;
  let quality = window.matchMedia("(max-width: 640px)").matches ? 0.8 : 1;
  let averageFrame = 16.7, measuredFrames = 0;
  const pointers = new Map<number, { x: number; y: number }>();
  let pinch = 0;

  const resize = () => {
    if (disposed || lost) return;
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5) * quality;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    gl.viewport(0, 0, canvas.width, canvas.height);
    dirty = true;
  };
  const draw = () => {
    const aspect = width / height;
    const radius = distance * Math.max(1, 0.78 / aspect);
    const cp = Math.cos(pitch);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform3f(uniforms.eye, Math.sin(yaw) * cp * radius, 1.76 + Math.sin(pitch) * radius, Math.cos(yaw) * cp * radius);
    gl.uniform3f(uniforms.target, 0, 1.76, 0);
    gl.uniform1f(uniforms.ortho, orthographic ? 1 : 0);
    gl.uniform1f(uniforms.zoom, radius);
    gl.uniform1f(uniforms.time, time);
    gl.uniform1f(uniforms.idleTime, idleTime);
    gl.uniform1f(uniforms.progress, machine.snapshot().progress);
    gl.uniform1i(uniforms.sourceForm, machine.current);
    gl.uniform1i(uniforms.targetForm, machine.target);
    gl.uniform1f(uniforms.moving, reduced || orthographic ? 0 : 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
    dirty = false;
  };
  const publish = () => { onState(machine.snapshot()); lastPublish = time; };
  const loop = (now: number) => {
    if (disposed || lost) return;
    frame = requestAnimationFrame(loop);
    if (!visible || document.hidden) { last = 0; return; }
    const elapsed = last ? (now-last)/1000 : 0;
    last = now;
    const dt = Math.min(elapsed, 0.05);
    time += dt;
    const progress = machine.snapshot().progress;
    const idleSpeed = progress < 0.14 ? 1-progress/0.14 : progress > 0.88 ? (progress-0.88)/0.12 : 0;
    if (!reduced && !orthographic) idleTime += dt*idleSpeed;
    const wasLocked = machine.snapshot().locked;
    if (wasLocked) {
      machine.advance(dt);
      if (!machine.snapshot().locked || time-lastPublish > 0.08) publish();
    }
    if (dirty || wasLocked || (!reduced && !orthographic)) draw();
    // Adapt pixel cost only after sustained slow frames, never per frame.
    if (elapsed > 0 && elapsed < 0.15 && !reduced && !orthographic) {
      averageFrame = averageFrame * 0.97 + elapsed * 1000 * 0.03;
      measuredFrames++;
      if (measuredFrames > 120 && averageFrame > 24 && quality > 0.55) {
        quality = Math.max(0.55, quality-0.15);
        measuredFrames = 0;
        resize();
      }
    }
  };
  const select = (form: Form) => {
    if (disposed || lost) return;
    if (!machine.request(form)) return;
    if (reduced) machine.advance(10);
    dirty = true;
    publish();
  };
  const changeZoom = (delta: number) => {
    distance = Math.max(7.2, Math.min(11.5, distance+delta));
    dirty = true;
  };
  const view = (name: View) => {
    orthographic = name !== "Orbit";
    yaw = name === "Side" ? Math.PI/2 : name === "Rear" ? Math.PI : name === "Orbit" ? 0.26 : 0;
    // Tiny offset avoids a singular look-at basis at the pole.
    pitch = name === "Top" ? Math.PI/2-0.00001 : name === "Orbit" ? 0.10 : 0;
    dirty = true;
  };
  const down = (event: PointerEvent) => {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    canvas.setPointerCapture(event.pointerId);
    canvas.focus({ preventScroll: true });
    pinch = 0;
  };
  const move = (event: PointerEvent) => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const dx = event.clientX-previous.x, dy = event.clientY-previous.y;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const [a,b] = [...pointers.values()];
      const span = Math.hypot(a.x-b.x,a.y-b.y);
      if (pinch) changeZoom((pinch-span)*0.02);
      pinch = span;
    } else {
      orthographic = false;
      yaw -= dx*0.008;
      pitch = Math.max(-0.05, Math.min(1.25, pitch+dy*0.006));
      dirty = true;
    }
  };
  const up = (event: PointerEvent) => { pointers.delete(event.pointerId); pinch = 0; };
  const wheel = (event: WheelEvent) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    changeZoom(event.deltaY*0.008);
  };
  const key = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if (/^[1-7]$/.test(event.key)) { event.preventDefault(); select((Number(event.key)-1) as Form); }
    else if (event.key.toLowerCase() === "r") { event.preventDefault(); select(0); }
    else if (event.target === canvas && event.key.startsWith("Arrow")) {
      event.preventDefault(); orthographic = false;
      if (event.key === "ArrowLeft") yaw -= 0.15;
      if (event.key === "ArrowRight") yaw += 0.15;
      if (event.key === "ArrowUp") pitch = Math.min(1.25,pitch+0.1);
      if (event.key === "ArrowDown") pitch = Math.max(-0.05,pitch-0.1);
      dirty = true;
    }
  };
  const visibility = () => { last = 0; dirty = true; };
  const motionChange = () => { reduced = motion.matches; dirty = true; };
  const contextLost = (event: Event) => {
    event.preventDefault(); lost = true; cancelAnimationFrame(frame);
    onError("The graphics session was interrupted. Reload the studio to continue.");
  };
  const observer = new ResizeObserver(resize);
  const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; last = 0; });
  observer.observe(canvas); intersection.observe(canvas);
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("lostpointercapture", up);
  canvas.addEventListener("wheel", wheel, { passive: false });
  canvas.addEventListener("webglcontextlost", contextLost);
  const keyHost = canvas.parentElement?.parentElement;
  keyHost?.addEventListener("keydown", key);
  document.addEventListener("visibilitychange", visibility);
  motion.addEventListener("change", motionChange);
  resize(); draw(); publish();
  frame = requestAnimationFrame(loop);
  return { select, view, zoom: changeZoom, dispose() {
    disposed = true; cancelAnimationFrame(frame);
    observer.disconnect(); intersection.disconnect();
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerup", up);
    canvas.removeEventListener("pointercancel", up);
    canvas.removeEventListener("lostpointercapture", up);
    canvas.removeEventListener("wheel", wheel);
    canvas.removeEventListener("webglcontextlost", contextLost);
    keyHost?.removeEventListener("keydown", key);
    document.removeEventListener("visibilitychange", visibility);
    motion.removeEventListener("change", motionChange);
    gl.deleteVertexArray(vao); gl.deleteProgram(program);
  } };
}
