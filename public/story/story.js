import * as T from "three";
import { GLTFLoader } from "./vendor/GLTFLoader.js";
import { RectAreaLightUniformsLib } from "./vendor/RectAreaLightUniformsLib.js";
import { createCreationRenderer } from "./creation.js";

// One deterministic ten-second timeline feeds both aspect ratios.
const output = document.querySelector("#story"),
  ctx = output.getContext("2d");
const renderer = new T.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(1);
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
const scene = new T.Scene(),
  camera = new T.PerspectiveCamera(40, 9 / 16, 0.1, 180);
RectAreaLightUniformsLib.init();
const env = new T.Scene();
env.background = new T.Color(0.055, 0.018, 0.055);
for (const [pos, size, color] of [
  [
    [-2, 4, -12],
    [14, 2.2],
    [1.9, 0.27, 0.2],
  ],
  [
    [-9, 5, -2],
    [2.3, 10],
    [0.7, 0.23, 1.3],
  ],
  [
    [8, 3, -5],
    [2, 8],
    [0.6, 0.32, 0.95],
  ],
  [
    [2, 8, 8],
    [8, 4],
    [0.8, 0.55, 0.75],
  ],
  [
    [10, 4, 5],
    [5, 5],
    [1.3, 0.16, 0.3],
  ],
  [
    [-2, 12, 0],
    [4, 4],
    [1.1, 0.85, 1],
  ],
]) {
  const card = new T.Mesh(
    new T.PlaneGeometry(...size),
    new T.MeshBasicMaterial({
      color: new T.Color(...color),
      side: T.DoubleSide,
    }),
  );
  card.position.set(...pos);
  card.lookAt(0, 0, 0);
  env.add(card);
}
const pmrem = new T.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(env, 0.035).texture;
scene.environmentIntensity = 0.85;
const sky = new T.Mesh(
  new T.PlaneGeometry(2, 2),
  new T.ShaderMaterial({
    depthWrite: false,
    depthTest: false,
    vertexShader:
      "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,.9999,1.);}",
    fragmentShader: `varying vec2 vUv;void main(){vec3 c=mix(vec3(.40,.20,.29),vec3(.085,.028,.14),smoothstep(.42,1.02,vUv.y));float h=exp(-dot((vUv-vec2(.31,.73))*vec2(5.,5.5),(vUv-vec2(.31,.73))*vec2(5.,5.5)));c+=vec3(.065,.028,.095)*h;gl_FragColor=vec4(c,1.);}`,
  }),
);
sky.frustumCulled = false;
sky.renderOrder = -100;
scene.add(sky);
for (const [color, power, w, h, pos, target] of [
  [0xc4a5cf, 6, 5, 5, [-3, 7, -4], [0, 1, 0]],
  [0x9867b3, 12, 3.5, 7, [-5, 4, 1], [0, 2, -2]],
  [0xe6c9db, 18, 0.7, 5, [3.15, 4, -1.8], [0, 2, -2]],
  [0xc64f65, 9, 9, 2, [-3, 5, -10], [0, 0.4, -9]],
  [0x875478, 8, 15, 10, [-6, 10, -16], [0, 0, -16]],
  [0xa577bc, 12, 2.5, 6, [6.2, 6, 2], [4.5, 3, -3]],
  [0xcf7466, 16, 8, 2, [-8, 7, 3], [-5, 0, -10]],
  [0xc0a1b9, 7, 12, 8, [0, 7, 9], [0, 0, 5]],
  [0xcf6b73, 16, 7, 5, [7, 3, -1], [3, 0, 3]],
]) {
  const light = new T.RectAreaLight(color, power * 0.22, w, h);
  light.position.set(...pos);
  light.lookAt(...target);
  scene.add(light);
}
scene.add(new T.HemisphereLight(0xb491b8, 0x2b1326, 0.2));
const gltf = await new GLTFLoader().loadAsync("./assets/dream-scene.glb");
gltf.scene.traverse((o) => {
  if (!o.isMesh) return;
  const m = o.material;
  if (
    m.name.startsWith("Floor") ||
    m.name.startsWith("Sky") ||
    m.name.startsWith("Moon") ||
    m.name.startsWith("Stars")
  )
    o.visible = false;
  if (m.name.startsWith("Architecture")) m.envMapIntensity = 0.45;
  if (m.name.startsWith("Curtain")) m.envMapIntensity = 0.4;
  if (m.name.startsWith("Chrome")) m.envMapIntensity = 1.2;
  if (m.name.startsWith("Dunes")) {
    m.vertexColors = false;
    // The source GLB has a uniform coral emission that washes out its valleys.
    // Let the red environment reflections light the ridges over a plum base.
    m.emissive.setRGB(0, 0, 0);
    m.emissiveIntensity = 0;
    m.color.setRGB(0.38, 0.22, 0.28);
    m.metalness = 0.78;
    m.roughness = 0.32;
    m.envMapIntensity = 0.85;
  }
});
scene.add(gltf.scene);

let seed = 3917;
const rand = () =>
  (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
const time = { value: 0 },
  step = 0.32,
  nx = 132,
  nz = 88;
const groundMat = new T.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.72,
  roughness: 0.38,
  envMapIntensity: 0.25,
});
groundMat.onBeforeCompile = (s) => {
  s.uniforms.uTime = time;
  s.vertexShader = "uniform float uTime;\n" + s.vertexShader;
  s.vertexShader = s.vertexShader.replace(
    "#include <begin_vertex>",
    `#include <begin_vertex>
 vec2 g=instanceMatrix[3].xz;float a=uTime*6.2831853/10.;float front=smoothstep(-3.,1.,g.y);
 transformed.y+=(sin(g.x*.65+g.y*.48-a)*.13+sin(g.x*.3-g.y*.55+a)*.09)*front;`,
  );
};
const ground = new T.InstancedMesh(
    new T.BoxGeometry(step * 0.79, step * 0.79, step * 0.79),
    groundMat,
    nx * nz,
  ),
  matrix = new T.Matrix4(),
  col = new T.Color();
for (let z = 0, i = 0; z < nz; z++)
  for (let x = 0; x < nx; x++, i++) {
    const xx = -21 + x * step,
      zz = -6 + z * step,
      front = T.MathUtils.smoothstep(zz, -3, 0.5);
    matrix.makeTranslation(
      xx,
      -0.43 * step +
        (0.48 * Math.pow(Math.max(0, Math.sin(xx * 0.38 + zz * 0.29)), 3) +
          0.1 * rand()) *
          front,
      zz,
    );
    ground.setMatrixAt(i, matrix);
    col.setHSL(0.84 + 0.12 * rand(), 0.25 + 0.16 * rand(), 0.2 + 0.17 * rand());
    ground.setColorAt(i, col);
  }
ground.frustumCulled = false;
scene.add(ground);
const stars = Array.from({ length: 115 }, () => ({
  x: rand(),
  y: rand(),
  r: 0.5 + rand() * 1.2,
  p: rand() * Math.PI * 2,
}));
await Promise.all([
  document.fonts.load("100px Instrument"),
  document.fonts.load("400 160px Handjet"),
  document.fonts.load("30px HelveticaNow"),
]);
const smooth = (a, b, x) => {
  const v = T.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return v * v * (3 - 2 * v);
};
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789?#%/";
function decode(text, t, start, duration) {
  return [...text]
    .map((c, i) => {
      if (c === " ") return c;
      const p = (t - start) / duration,
        threshold = 0.22 + (0.7 * i) / Math.max(text.length - 1, 1);
      return p >= threshold
        ? c
        : alphabet[(Math.floor(t * 22) * 17 + i * 13) % alphabet.length];
    })
    .join("");
}
function lettering(text, font, size, x, y, alpha, t, start, duration) {
  ctx.font = `400 ${size}px ${font}`;
  ctx.textBaseline = "alphabetic";
  const baseline = y + ctx.measureText(text).actualBoundingBoxAscent;
  const chars = [...text],
    // Prefix advances retain Instrument Serif's kerning in the final lockup.
    advances = chars.map((_, i) => ctx.measureText(text.slice(0, i)).width),
    width = ctx.measureText(text).width;
  const scrambled = decode(text, t, start, duration);
  ctx.globalAlpha = alpha;
  // Render the resolved word in one pass, preserving the font's glyph shaping.
  if (scrambled === text) {
    ctx.fillText(text, x, baseline);
    ctx.globalAlpha = 1;
    return x + width;
  }
  chars.forEach((c, i) => {
    ctx.fillText(
      scrambled[i],
      x +
        advances[i] +
        (ctx.measureText(c).width - ctx.measureText(scrambled[i]).width) / 2,
      baseline,
    );
  });
  ctx.globalAlpha = 1;
  return x + width;
}
function renderSurreal(t, format = "9:16") {
  const h = format === "3:4" ? 1440 : 1920;
  if (output.height !== h || renderer.domElement.height !== h) {
    output.width = 1080;
    output.height = h;
    renderer.setSize(1080, h, false);
    camera.aspect = 1080 / h;
    camera.updateProjectionMatrix();
  }
  const a = (t * Math.PI * 2) / 10;
  time.value = t;
  camera.position.set(
    5.7 + 0.38 * Math.sin(a),
    8.2 + 0.14 * Math.cos(a),
    27 + 0.32 * Math.sin(a),
  );
  camera.lookAt(-0.8, 5.9, -3);
  renderer.render(scene, camera);
  ctx.drawImage(renderer.domElement, 0, 0);
  // Darken only behind the title while keeping the chrome and coral foreground luminous.
  const shade = ctx.createLinearGradient(0, 0, 0, h * 0.76);
  shade.addColorStop(0, "rgba(17,5,25,.42)");
  shade.addColorStop(0.56, "rgba(17,5,25,.18)");
  shade.addColorStop(1, "rgba(17,5,25,0)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, 1080, h);
  for (const s of stars) {
    ctx.globalAlpha = 0.18 + 0.22 * (0.5 + 0.5 * Math.sin(a + s.p));
    ctx.fillStyle = "#f7dfeb";
    ctx.beginPath();
    ctx.arc(
      (s.x * 1080 + 8 * Math.sin(a + s.p) + 1080) % 1080,
      s.y * h * 0.75 + 5 * Math.cos(a + s.p),
      s.r,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const exit = 1 - smooth(8.7, 9.55, t),
    intro = smooth(0.25, 0.65, t) * exit;
  // Reference: a left-aligned, two-line lockup with matching cap heights.
  const titleX = 130,
    titleY = h === 1920 ? 303 : 112,
    secondLineAlpha = smooth(0.6, 0.95, t) * exit;
  ctx.fillStyle = "#ffffff";
  ctx.shadowBlur = 0;
  lettering(
    "WHAT IF IT",
    "Instrument",
    146,
    titleX,
    titleY,
    intro,
    t,
    0.3,
    1.25,
  );
  const couldEnd = lettering(
    "COULD",
    "Instrument",
    146,
    titleX,
    titleY + 144,
    secondLineAlpha,
    t,
    0.65,
    1.1,
  );
  lettering(
    "EXIST?",
    "Handjet",
    160,
    couldEnd + 28,
    titleY + 144,
    secondLineAlpha,
    t,
    0.9,
    1.25,
  );
  ctx.shadowBlur = 0;
  ctx.font = "49px HelveticaNow";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.globalAlpha = smooth(1.8, 2.65, t) * exit;
  ctx.fillText(
    "A thought, rendered.",
    titleX + 16,
    titleY +
      303 +
      ctx.measureText("A thought, rendered.").actualBoundingBoxAscent +
      9 * (1 - smooth(1.8, 2.65, t)),
  );
  ctx.textAlign = "left";
  ctx.globalAlpha = 1;
}
let activeScene = "surreal",
  creationRenderer;
window.renderStory = (t, format = "9:16") => {
  if (activeScene === "creation") {
    const height = format === "3:4" ? 1440 : 1920;
    if (output.height !== height) {
      output.width = 1080;
      output.height = height;
    }
    ctx.globalAlpha = 1;
    ctx.drawImage(creationRenderer.render(t, 1080, height), 0, 0);
  } else renderSurreal(t, format);
};
let format = "9:16",
  currentTime = 0,
  previous = performance.now(),
  playing = !matchMedia("(prefers-reduced-motion: reduce)").matches,
  exporting = false;
const $ = (id) => document.getElementById(id),
  status = $("status"),
  timeline = $("timeline");
const types = [
  "video/mp4;codecs=avc1.42001f",
  "video/mp4",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
];
const mime =
  typeof MediaRecorder !== "undefined"
    ? types.find((type) => MediaRecorder.isTypeSupported(type))
    : null;
const videoButton = $("export-video");
videoButton.textContent = mime
  ? `Export ${mime.includes("mp4") ? "MP4" : "WebM"}`
  : "Video unavailable";
videoButton.disabled = !mime || !output.captureStream;
status.textContent = mime
  ? "10 seconds · silent · 1080px wide"
  : "Video export is unavailable in this browser. You can still save a PNG.";
function update() {
  timeline.value = currentTime;
  $("time").textContent = `${currentTime.toFixed(1)}s`;
  $("pause").textContent = playing ? "Pause" : "Play";
  window.renderStory(currentTime, format);
}
function sceneDetails() {
  const creation = activeScene === "creation";
  $("scene").value = activeScene;
  output.dataset.scene = activeScene;
  output.setAttribute(
    "aria-label",
    creation
      ? "A living Renaissance collage: human and mechanical fingertips meet, clouds drift, flowers sway and petals float."
      : "What if it could exist? A thought, rendered.",
  );
  $("scene-title").textContent = creation
    ? "The first touch."
    : "A thought, rendered.";
  $("scene-description").textContent = creation
    ? "Reaching hands · drifting clouds · floating petals. A living painting, made from your artwork."
    : "Instrument Serif / Handjet / Helvetica Now Display";
  $("touch-moment").classList.toggle("hidden", !creation);
}
function lockControls() {
  const states = [...document.querySelectorAll("button,input,select")].map(
    (element) => [element, element.disabled],
  );
  states.forEach(([element]) => {
    element.disabled = true;
  });
  return () =>
    states.forEach(([element, disabled]) => {
      element.disabled = disabled;
    });
}
$("scene").onchange = async () => {
  if (exporting) return;
  const requested = $("scene").value;
  const restoreControls = lockControls();
  try {
    if (requested === "creation" && !creationRenderer) {
      status.textContent = "Preparing the living painting…";
      creationRenderer = await createCreationRenderer();
    }
    activeScene = requested;
    currentTime = 0;
    previous = performance.now();
    playing = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!playing) currentTime = 5;
    sceneDetails();
    update();
    status.textContent = "10 seconds · silent · 1080px wide";
  } catch (error) {
    $("scene").value = activeScene;
    status.textContent =
      error.message || "Could not load this animation. Please try again.";
  } finally {
    restoreControls();
  }
};
$("touch-moment").onclick = () => {
  playing = false;
  currentTime = 5;
  update();
};
const exportName = () =>
  activeScene === "creation" ? "the-first-touch" : "a-thought-rendered";
function setFormat(value) {
  if (exporting) return;
  format = value;
  $("portrait").setAttribute("aria-pressed", String(value === "9:16"));
  $("feed").setAttribute("aria-pressed", String(value === "3:4"));
  $("dimensions").textContent =
    value === "9:16" ? "1080 × 1920 · Story" : "1080 × 1440 · Portrait";
  update();
}
$("portrait").onclick = () => setFormat("9:16");
$("feed").onclick = () => setFormat("3:4");
$("pause").onclick = () => {
  playing = !playing;
  previous = performance.now();
  update();
};
$("replay").onclick = () => {
  currentTime = 0;
  playing = true;
  previous = performance.now();
  update();
};
timeline.oninput = () => {
  playing = false;
  currentTime = Number(timeline.value);
  update();
};
function download(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
$("export-still").onclick = () => {
  output.toBlob((blob) => {
    if (blob) {
      download(blob, `${exportName()}-${format.replace(":", "x")}.png`);
      status.textContent = "Current frame saved as a full-resolution PNG.";
    } else status.textContent = "Could not save the frame. Please try again.";
  }, "image/png");
};
videoButton.onclick = async () => {
  if (exporting || !mime) return;
  exporting = true;
  const wasPlaying = playing,
    savedTime = currentTime;
  playing = false;
  const restoreControls = lockControls();
  let stream,
    recorder,
    hidden = false,
    raf = 0;
  const onHidden = () => {
    if (document.hidden) {
      hidden = true;
      if (recorder?.state === "recording") recorder.stop();
    }
  };
  document.addEventListener("visibilitychange", onHidden);
  try {
    window.renderStory(0, format);
    stream = output.captureStream(30);
    recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: 14000000,
    });
    const chunks = [];
    const finished = new Promise((resolve, reject) => {
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.onerror = (e) =>
        reject(e.error || new Error("Recording failed"));
      recorder.onstop = resolve;
    });
    recorder.start(250);
    const began = performance.now();
    const capture = (now) => {
      if (hidden || recorder.state !== "recording") return;
      const elapsed = (now - began) / 1000;
      currentTime = Math.min(elapsed, 9.999);
      update();
      status.textContent = `Exporting ${Math.min(100, Math.round(elapsed * 10))}% — keep this tab visible.`;
      if (elapsed >= 10) recorder.stop();
      else raf = requestAnimationFrame(capture);
    };
    raf = requestAnimationFrame(capture);
    await finished;
    if (hidden)
      throw new Error(
        "Export interrupted when the tab was hidden. Please keep it visible and try again.",
      );
    const blob = new Blob(chunks, { type: mime });
    if (!blob.size)
      throw new Error("No video frames were recorded. Please try again.");
    const extension = mime.includes("mp4") ? "mp4" : "webm";
    download(blob, `${exportName()}-${format.replace(":", "x")}.${extension}`);
    status.textContent = `${extension.toUpperCase()} saved · ${output.width} × ${output.height} · 10 seconds`;
  } catch (error) {
    status.textContent =
      error.message || "Video export failed. Please try again.";
  } finally {
    cancelAnimationFrame(raf);
    if (recorder?.state === "recording") recorder.stop();
    stream?.getTracks().forEach((track) => track.stop());
    document.removeEventListener("visibilitychange", onHidden);
    exporting = false;
    playing = wasPlaying;
    currentTime = savedTime;
    previous = performance.now();
    restoreControls();
    update();
  }
};
if (new URLSearchParams(location.search).get("scene") === "creation") {
  creationRenderer = await createCreationRenderer();
  activeScene = "creation";
}
sceneDetails();
$("loading").classList.add("hidden");
if (!playing) currentTime = 4;
update();
window.storyReady = true;
document.addEventListener("visibilitychange", () => {
  previous = performance.now();
});
if (!new URLSearchParams(location.search).has("capture")) {
  const tick = (now) => {
    const delta = now - previous;
    if (!document.hidden && !exporting && playing && delta >= 1000 / 30) {
      currentTime = (currentTime + Math.min(delta / 1000, 0.1)) % 10;
      previous = now;
      update();
    } else if (!playing || exporting || document.hidden) previous = now;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
