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
vec2 catfish(vec2 p, vec2 center, vec2 radius, vec2 head, float phase) {
  float weight = ellipse(p, center, radius);
  vec2 d = p - head;
  float angle = sin(time * .38 + phase) * .017;
  vec2 turn = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * d - d;
  // A small cruising bob at the head, with more flex farther along the body.
  float tail = smoothstep(.06, .35, length(d));
  vec2 glide = vec2(sin(time * .31 + phase) * .004, sin(time * .48 + phase) * .003);
  turn.x += sin(time * .72 + p.y * 9. + phase) * .006 * tail;
  return (turn + glide) * weight;
}
vec2 paintedBubble(vec2 p, vec2 center, float phase) {
  float weight = ellipse(p, center, vec2(.018, .027));
  return vec2(sin(time * .8 + phase) * .0015, sin(time * .65 + phase) * .003) * weight;
}
vec3 risingBubbles(vec3 color, vec2 p) {
  // Staggered lifetimes fade at both ends so wrapping never produces a pop.
  for (int i = 0; i < 16; i++) {
    float seed = float(i);
    float progress = fract(time * (.025 + fract(seed * .381) * .012) + seed * .618);
    float x = .06 + fract(seed * .7549) * .88;
    x += sin(time * .55 + seed * 2.4 + progress * 7.) * .009;
    vec2 center = vec2(x, 1.04 - progress * .64);
    float radius = .0025 + fract(seed * .427) * .0035;
    vec2 d = (p - center) * vec2(1.6, 1.);
    float distance = length(d) / radius;
    float edge = 1. - smoothstep(.78, 1.12, distance);
    float rim = smoothstep(.55, .8, distance) * edge;
    float highlight = 1. - smoothstep(.13, .36, length(d / radius - vec2(-.3, -.3)));
    float fade = smoothstep(0., .12, progress) * (1. - smoothstep(.78, 1., progress));
    float grain = .92 + .08 * sin(p.x * 2900. + p.y * 1900.);
    color = mix(color, vec3(.78, .96, .95), (edge * .15 + rim * .28 + highlight * .35) * fade * grain);
  }
  return color;
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
  float leftFish = ellipse(p, vec2(.16, .47), vec2(.24, .39));
  float rightFish = ellipse(p, vec2(.88, .72), vec2(.23, .30));
  q += catfish(p, vec2(.16, .47), vec2(.24, .39), vec2(.32, .66), .4);
  q += catfish(p, vec2(.88, .72), vec2(.23, .30), vec2(.81, .54), 2.8);
  // Soft plant patches move their outlines too; roots stay planted at the bed.
  float foliage = max(ellipse(p, vec2(.065, .75), vec2(.09, .30)), ellipse(p, vec2(.43, .84), vec2(.18, .28)));
  foliage = max(foliage, ellipse(p, vec2(.66, .77), vec2(.075, .28)));
  foliage = max(foliage, ellipse(p, vec2(.95, .85), vec2(.075, .20)));
  float rooted = (1. - smoothstep(.65, 1., p.y)) * smoothstep(.48, .62, p.y);
  float plants = foliage * rooted * (1. - max(leftFish, rightFish) * .92);
  q.x += sin(time * .7 + p.y * 7. + p.x * 15.) * .012 * plants;
  q.y += cos(time * .6 + p.x * 12.) * .002 * plants;
  q += paintedBubble(p, vec2(.353, .625), .2);
  q += paintedBubble(p, vec2(.362, .682), 1.8);
  q += paintedBubble(p, vec2(.439, .540), 3.1);
  q += paintedBubble(p, vec2(.627, .558), 4.2);
  q += paintedBubble(p, vec2(.842, .396), 2.3);
  q += paintedBubble(p, vec2(.557, .763), 5.2);
  q += paintedBubble(p, vec2(.302, .885), 1.1);
  q += paintedBubble(p, vec2(.735, .812), 3.7);
  vec3 color = texture2D(artwork, q).rgb;
  float shimmer = sin(length((p - vec2(.49, .10)) * vec2(1.6, 1.)) * 52. - time * 1.3);
  color += shimmer * .009 * water;
  color = risingBubbles(color, p);
  gl_FragColor = vec4(color, 1.);
}
`;

/** Gentle figures, fish, rooted foliage, rising bubbles and surface refraction. */
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
