const vertex = `
attribute vec2 position;
varying vec2 uv;
void main() { uv = position * .5 + .5; gl_Position = vec4(position, 0., 1.); }
`;

const fragment = `
precision mediump float;
varying vec2 uv;
uniform sampler2D artwork;
uniform vec2 cover;
uniform float time;

float ellipse(vec2 p, vec2 center, vec2 radius) {
  return 1. - smoothstep(.65, 1.15, length((p - center) / radius));
}
vec2 person(vec2 p, vec2 center, vec2 radius, vec2 pivot, float phase) {
  float weight = ellipse(p, center, radius);
  float angle = sin(time * .47 + phase) * .012;
  vec2 d = p - pivot;
  vec2 rotated = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * d;
  return ((rotated - d) + vec2(sin(time * .38 + phase) * .002, sin(time * .62 + phase) * .003)) * weight;
}
vec2 ripple(vec2 p, vec2 center, float phase) {
  vec2 d = (p - center) * vec2(1.6, 1.);
  float radius = length(d);
  float wave = sin(radius * 62. - time * 1.35 + phase);
  return d / max(radius, .02) * wave * .0018 * exp(-radius * 2.3);
}
void main() {
  vec2 p = (vec2(uv.x, 1. - uv.y) - .5) * cover + .5;
  float leftPerson = ellipse(p, vec2(.351, .331), vec2(.065, .15));
  float rightPerson = ellipse(p, vec2(.631, .353), vec2(.115, .155));
  vec2 q = p;
  q += person(p, vec2(.351, .331), vec2(.08, .17), vec2(.354, .46), 0.);
  q += person(p, vec2(.631, .353), vec2(.135, .18), vec2(.65, .47), 2.1);
  float surface = 1. - smoothstep(.46, .58, p.y);
  float water = surface * (1. - max(leftPerson, rightPerson) * .9);
  q += (ripple(p, vec2(.49, .10), 0.) + ripple(p, vec2(.69, .32), 2.)) * water;
  q.x += sin(p.y * 26. + time * .5) * .0009 * (1. - surface);
  vec3 color = texture2D(artwork, q).rgb;
  float shimmer = sin(length((p - vec2(.49, .10)) * vec2(1.6, 1.)) * 52. - time * 1.3);
  color += shimmer * .009 * water;
  gl_FragColor = vec4(color, 1.);
}
`;

/** Local figure deformation and surface refraction on an original illustration. */
export function createRiverMotion(canvas: HTMLCanvasElement, src: string) {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
  if (!gl) return null;
  const context = gl;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const artwork = new Image();
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let texture: WebGLTexture | null = null;
  let timeUniform: WebGLUniformLocation | null = null;
  let coverUniform: WebGLUniformLocation | null = null;
  let frame = 0, time = 0, last = 0, lastPaint = 0;
  let visible = false, paused = false, disposed = false, lost = false, loaded = false;

  function release() {
    context.deleteTexture(texture); context.deleteBuffer(buffer); context.deleteProgram(program);
    texture = null; buffer = null; program = null;
  }
  function initialize() {
    const shaders: WebGLShader[] = [];
    for (const [type, source] of [[context.VERTEX_SHADER, vertex], [context.FRAGMENT_SHADER, fragment]] as const) {
      const shader = context.createShader(type);
      if (!shader) { shaders.forEach(s => context.deleteShader(s)); return false; }
      context.shaderSource(shader, source); context.compileShader(shader);
      if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
        context.deleteShader(shader); shaders.forEach(s => context.deleteShader(s)); return false;
      }
      shaders.push(shader);
    }
    program = context.createProgram();
    if (!program) { shaders.forEach(s => context.deleteShader(s)); return false; }
    shaders.forEach(s => context.attachShader(program!, s));
    context.linkProgram(program);
    shaders.forEach(s => context.deleteShader(s));
    if (!context.getProgramParameter(program, context.LINK_STATUS)) { release(); return false; }
    context.useProgram(program);
    buffer = context.createBuffer(); texture = context.createTexture();
    if (!buffer || !texture) { release(); return false; }
    context.bindBuffer(context.ARRAY_BUFFER, buffer);
    context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), context.STATIC_DRAW);
    const position = context.getAttribLocation(program, "position");
    context.enableVertexAttribArray(position); context.vertexAttribPointer(position, 2, context.FLOAT, false, 0, 0);
    context.bindTexture(context.TEXTURE_2D, texture);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
    context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, artwork);
    context.uniform1i(context.getUniformLocation(program, "artwork"), 0);
    timeUniform = context.getUniformLocation(program, "time"); coverUniform = context.getUniformLocation(program, "cover");
    return true;
  }
  function paint() {
    if (!loaded || !program || lost || disposed) return;
    const ratio = (canvas.width / canvas.height) / (artwork.naturalWidth / artwork.naturalHeight);
    context.viewport(0, 0, canvas.width, canvas.height);
    context.uniform2f(coverUniform, Math.min(ratio, 1), Math.min(1 / ratio, 1));
    context.uniform1f(timeUniform, preference.matches ? 0 : time);
    context.drawArrays(context.TRIANGLES, 0, 3);
    canvas.dataset.ready = "true";
  }
  function tick(now: number) {
    frame = 0;
    if (disposed || lost || paused || preference.matches || !visible || document.hidden) return;
    time += Math.min(now - last, 80) / 1000; last = now;
    if (now - lastPaint >= 1000 / 30) { paint(); lastPaint = now; }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0;
    if (!loaded || !program || disposed || lost) return;
    paint();
    if (visible && !document.hidden && !paused && !preference.matches) { last = performance.now(); frame = requestAnimationFrame(tick); }
  }
  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.5, 1600 / Math.max(bounds.width, 1));
    canvas.width = Math.max(1, Math.round(bounds.width * dpr)); canvas.height = Math.max(1, Math.round(bounds.height * dpr));
    paint();
  }
  function contextLost(event: Event) {
    event.preventDefault(); lost = true; cancelAnimationFrame(frame); delete canvas.dataset.ready;
  }
  function contextRestored() {
    lost = false;
    if (loaded && initialize()) { resize(); sync(); }
  }
  const sizes = new ResizeObserver(resize);
  const views = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
  sizes.observe(canvas); views.observe(canvas);
  document.addEventListener("visibilitychange", sync); preference.addEventListener("change", sync);
  canvas.addEventListener("webglcontextlost", contextLost); canvas.addEventListener("webglcontextrestored", contextRestored);
  artwork.onload = () => { if (!disposed) { loaded = true; if (!lost && initialize()) { resize(); sync(); } } };
  artwork.src = src;
  return {
    setPaused(value: boolean) { paused = value; sync(); },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); sizes.disconnect(); views.disconnect();
      artwork.onload = null; artwork.onerror = null;
      document.removeEventListener("visibilitychange", sync); preference.removeEventListener("change", sync);
      canvas.removeEventListener("webglcontextlost", contextLost); canvas.removeEventListener("webglcontextrestored", contextRestored);
      release(); delete canvas.dataset.ready;
    },
  };
}
