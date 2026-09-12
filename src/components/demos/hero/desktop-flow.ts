/** A two-surface, softly lit blue wallpaper. No textures or external assets. */
export function createDesktopFlow(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, powerPreference: "low-power" });
  if (!gl) return () => {};
  const context = gl;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let timeUniform: WebGLUniformLocation | null = null;
  let resolutionUniform: WebGLUniformLocation | null = null;
  let frame = 0, time = 0, last = 0, lastPaint = -Infinity;
  let visible = false, lost = false, disposed = false;

  function initialize() {
    const vertex = context.createShader(context.VERTEX_SHADER);
    const fragment = context.createShader(context.FRAGMENT_SHADER);
    if (!vertex || !fragment) return false;
    context.shaderSource(vertex, `attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`);
    context.shaderSource(fragment, `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;

      float softMax(float a, float b, float k) {
        float h = max(k - abs(a - b), 0.0) / k;
        return max(a, b) + h * h * k * .25;
      }
      float glow(float distance, float width) {
        return exp(-pow(distance / width, 2.0));
      }
      vec3 edgeLight(vec3 color, float distance) {
        // Cyan on the lit face, a peach reflection on the opposite rim.
        color = mix(color, vec3(.65, .89, .98), glow(distance + .033, .080) * .78);
        color = mix(color, vec3(.96, .73, .76), glow(distance - .018, .030) * .67);
        color = mix(color, vec3(.99, 1.0, .98), glow(distance, .010) * .96);
        return color;
      }
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution;
        uv.y = 1.0 - uv.y;
        // Keep the composition broad on portrait screens as well as desktop.
        vec2 p = uv;
        float t = time * .16;
        p.x += sin(t * .63) * .055;
        p.y += sin(t * .47) * .025;
        float lower = .52 + .31 * pow(sin(p.x * 3.14159 + sin(t) * .13), 2.0);
        lower += sin(p.x * 5.0 - t * .8) * .028;
        float lowerDistance = (p.y - lower) * .76;
        vec3 color = mix(vec3(.38, .57, .78), vec3(.47, .66, .83), p.x * .5 + p.y * .3);
        vec3 lowerColor = mix(vec3(.40, .48, .68), vec3(.40, .60, .80), uv.x);
        color = mix(color, lowerColor, smoothstep(-.004, .004, lowerDistance));
        color = edgeLight(color, lowerDistance);

        // A rounded fold enters from above, opening into a second luminous plane.
        float left = .47 + sin(t * .72 + .5) * .042;
        float curve = .35 - 1.48 * pow(p.x - .51, 2.0) + sin(t * .85) * .045;
        float topDistance = softMax((left - p.x) * .9, (p.y - curve) * .76, .065);
        vec3 upperColor = mix(vec3(.39, .70, .85), vec3(.62, .85, .93), clamp(p.x, 0.0, 1.0));
        color = mix(color, upperColor, 1.0 - smoothstep(-.006, .006, topDistance));
        color = edgeLight(color, topDistance);

        // Fixed fine grain avoids temporal shimmer while the surfaces move.
        float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
        color += (grain - .5) * .018;
        gl_FragColor = vec4(color, 1.0);
      }
    `);
    context.compileShader(vertex);
    context.compileShader(fragment);
    if (!context.getShaderParameter(vertex, context.COMPILE_STATUS) || !context.getShaderParameter(fragment, context.COMPILE_STATUS)) {
      context.deleteShader(vertex); context.deleteShader(fragment); return false;
    }
    program = context.createProgram();
    if (!program) { context.deleteShader(vertex); context.deleteShader(fragment); return false; }
    context.attachShader(program, vertex); context.attachShader(program, fragment); context.linkProgram(program);
    context.deleteShader(vertex); context.deleteShader(fragment);
    if (!context.getProgramParameter(program, context.LINK_STATUS)) { context.deleteProgram(program); program = null; return false; }
    context.useProgram(program);
    buffer = context.createBuffer();
    context.bindBuffer(context.ARRAY_BUFFER, buffer);
    context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), context.STATIC_DRAW);
    const position = context.getAttribLocation(program, "position");
    context.enableVertexAttribArray(position); context.vertexAttribPointer(position, 2, context.FLOAT, false, 0, 0);
    timeUniform = context.getUniformLocation(program, "time");
    resolutionUniform = context.getUniformLocation(program, "resolution");
    return true;
  }

  function paint() {
    if (!program || lost || disposed) return;
    context.viewport(0, 0, canvas.width, canvas.height);
    context.uniform2f(resolutionUniform, canvas.width, canvas.height);
    context.uniform1f(timeUniform, preference.matches ? 0 : time);
    context.drawArrays(context.TRIANGLES, 0, 3);
    canvas.dataset.ready = "true";
  }
  function tick(now: number) {
    frame = 0;
    if (!visible || document.hidden || preference.matches || lost || disposed) return;
    time += Math.min(now - last, 80) / 1000;
    last = now;
    if (now - lastPaint >= 1000 / 30) { paint(); lastPaint = now; }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0;
    if (lost || disposed) return;
    if (preference.matches) { paint(); return; }
    if (visible && !document.hidden) { last = performance.now(); frame = requestAnimationFrame(tick); }
  }
  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const scale = Math.min(devicePixelRatio || 1, 1.5, 1440 / Math.max(1, bounds.width));
    canvas.width = Math.max(1, Math.round(bounds.width * scale));
    canvas.height = Math.max(1, Math.round(bounds.height * scale));
    paint();
  }
  function contextLost(event: Event) {
    event.preventDefault(); lost = true;
    cancelAnimationFrame(frame); frame = 0;
    delete canvas.dataset.ready;
  }
  function contextRestored() {
    lost = false;
    if (initialize()) { resize(); sync(); }
  }
  if (!initialize()) return () => {};
  const sizes = new ResizeObserver(resize);
  const views = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
  sizes.observe(canvas); views.observe(canvas);
  document.addEventListener("visibilitychange", sync);
  preference.addEventListener("change", sync);
  canvas.addEventListener("webglcontextlost", contextLost);
  canvas.addEventListener("webglcontextrestored", contextRestored);
  resize();
  return () => {
    disposed = true; cancelAnimationFrame(frame);
    sizes.disconnect(); views.disconnect();
    document.removeEventListener("visibilitychange", sync);
    preference.removeEventListener("change", sync);
    canvas.removeEventListener("webglcontextlost", contextLost);
    canvas.removeEventListener("webglcontextrestored", contextRestored);
    context.deleteBuffer(buffer); context.deleteProgram(program);
    delete canvas.dataset.ready;
  };
}
