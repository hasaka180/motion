import { separatePetals } from "./creation-petals.js";

// A local, deterministic living-painting renderer. Independent, feathered
// deformation fields articulate the artwork; detached petals use rigid sprites.
// All coordinates are in the source image's 941 × 1672 coordinate system.
const vertexSource = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = position * .5 + .5;
  gl_Position = vec4(position, 0., 1.);
}`;

const fragmentSource = `
precision highp float;
varying vec2 uv;
uniform sampler2D artwork;
uniform float phase;
uniform vec2 outputSize;
const vec2 sourceSize = vec2(941., 1672.);

float patch(vec2 p, vec2 center, vec2 radius) {
  return 1. - smoothstep(.48, 1., length((p - center) / radius));
}
float capsule(vec2 p, vec2 a, vec2 b, float radius) {
  vec2 ab = b - a;
  float along = clamp(dot(p - a, ab) / dot(ab, ab), 0., 1.);
  return 1. - smoothstep(radius * .65, radius, length(p - a - ab * along));
}
mat2 rotation(float angle) {
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}
vec2 articulate(vec2 p, vec2 center, vec2 radius, vec2 pivot,
                float angle, vec2 translation) {
  vec2 d = p - pivot;
  return (rotation(angle) * d - d - translation) * patch(p, center, radius);
}

void main() {
  // Contain the complete art in both formats; extend parchment at the sides in
  // 3:4 instead of cropping away the figures, feet, or foreground clouds.
  float scale = min(outputSize.x / sourceSize.x, outputSize.y / sourceSize.y);
  vec2 p = (vec2(uv.x, 1. - uv.y) * outputSize - outputSize * .5) / scale + sourceSize * .5;
  if (p.x < 0. || p.x > sourceSize.x) {
    float side = p.x < 0. ? -p.x : p.x - sourceSize.x;
    vec2 paper = vec2(30. + mod(side, 135.), 35. + mod(p.y * .21, 90.));
    gl_FragColor = texture2D(artwork, paper / sourceSize);
    return;
  }

  float breath = sin(phase);
  float reach = smoothstep(.04, .82, .5 - .5 * cos(phase));
  vec2 q = p;

  float robotArm = capsule(p, vec2(175., 860.), vec2(448., 753.), 48.);
  float humanArm = capsule(p, vec2(830., 625.), vec2(510., 748.), 64.);
  float robotBody = patch(p, vec2(134., 951.), vec2(193., 330.));
  float rightBody = patch(p, vec2(873., 701.), vec2(180., 340.));
  float foreground = max(max(robotArm, humanArm), max(robotBody, rightBody));
  foreground = max(foreground, capsule(p, vec2(248., 1100.), vec2(549., 1355.), 99.));
  foreground = max(foreground, patch(p, vec2(292., 1041.), vec2(128., 220.)));
  float rockEdge = 383. + (p.y - 1050.) * .38;
  float cliff = smoothstep(995., 1070., p.y) * (1. - smoothstep(rockEdge - 20., rockEdge + 20., p.x));
  foreground = max(foreground, cliff);
  foreground = max(foreground, patch(p, vec2(758., 410.), vec2(131., 190.)));
  foreground = max(foreground, patch(p, vec2(750., 1050.), vec2(140., 160.)));
  foreground = max(foreground, patch(p, vec2(650., 913.), vec2(97., 102.)));
  foreground = smoothstep(.04, .18, foreground);

  // Sky: different cloud banks drift at different depths, with the blue window
  // border held in place. Protect the reaching figures from the sky flow.
  vec2 edge = min(p - vec2(255., 163.), vec2(690., 1333.) - p);
  float sky = smoothstep(0., 90., min(edge.x, edge.y)) * (1. - foreground);
  float skyWind = sin(phase + p.y * .0035) - sin(p.y * .0035);
  float cloudRise = cos(phase + p.x * .004) - cos(p.x * .004);
  q += vec2(10. * skyWind, 7. * cloudRise) * sky;
  q += vec2(6. * sin(phase), -7. * sin(phase)) * patch(p, vec2(88., 590.), vec2(170., 160.));
  q += vec2(8. * sin(phase), 4. * (1. - cos(phase))) * patch(p, vec2(75., 1420.), vec2(250., 215.));
  q += vec2(-9. * sin(phase), 6. * sin(phase)) * patch(p, vec2(359., 1589.), vec2(340., 155.));

  // Quiet motion in the cliff, moss, torso and legs gives the whole collage life.
  q += articulate(p, vec2(242., 1267.), vec2(320., 310.), vec2(210., 1590.),
                  .003 * breath, vec2(1.2 * breath, 1.5 * breath));
  q += articulate(p, vec2(132., 935.), vec2(181., 250.), vec2(99., 1072.),
                  -.006 * reach, vec2(1.8 * breath, -2.4 * breath));
  q += articulate(p, vec2(290., 1050.), vec2(111., 190.), vec2(217., 1110.),
                  .004 * breath, vec2(0., -2.2 * breath));
  q += articulate(p, vec2(406., 1250.), vec2(206., 169.), vec2(234., 1111.),
                  -.003 * breath, vec2(1.3 * breath, -1.2 * breath));
  q += articulate(p, vec2(129., 754.), vec2(98., 99.), vec2(100., 840.),
                  -.012 * reach, vec2(1.1 * breath, -.8 * breath));

  // An anchored shoulder/elbow reach, then independent wrist/finger articulation.
  // The two fingertip trajectories converge at the center, hold, and release.
  q += articulate(p, vec2(341., 795.), vec2(158., 102.), vec2(196., 848.),
                  -.008 * reach, vec2(1.7 * reach, 0.));
  q += articulate(p, vec2(433., 755.), vec2(75., 60.), vec2(376., 771.),
                  .014 * reach, vec2(4.8 * reach, 1.8 * reach));
  q += vec2(-1.2 * reach, -2. * sin(phase)) * patch(p, vec2(444., 778.), vec2(29., 21.));
  q += articulate(p, vec2(682., 682.), vec2(217., 123.), vec2(812., 638.),
                  -.006 * reach, vec2(-1.9 * reach, 1.2 * reach));
  q += articulate(p, vec2(523., 752.), vec2(68., 66.), vec2(570., 730.),
                  -.012 * reach, vec2(-4.5 * reach, -1.7 * reach));
  q += vec2(1. * reach, -2.8 * sin(phase)) * patch(p, vec2(524., 778.), vec2(31., 27.));
  float leftTip = 1. - smoothstep(476., 480., p.x);
  q += vec2(-3.2, 2.0) * reach * leftTip * patch(p, vec2(465., 749.), vec2(33., 25.));
  q += vec2(2.5, -.5) * reach * (1. - leftTip) * patch(p, vec2(487., 748.), vec2(29., 25.));

  // Red drapery billows, while the faces retain their painted anatomy.
  float robe = patch(p, vec2(829., 714.), vec2(240., 425.));
  float face = patch(p, vec2(840., 494.), vec2(83., 102.));
  vec3 original = texture2D(artwork, p / sourceSize).rgb;
  float red = smoothstep(.025, .15, original.r - original.b) * smoothstep(.025, .15, original.r - original.g);
  float cloth = robe * (1. - max(face, humanArm) * .96) * red;
  q += vec2(2.5 * (sin(phase + p.y * .013) - sin(p.y * .013)),
            1.6 * (cos(phase + p.x * .013) - cos(p.x * .013))) * cloth;
  q += articulate(p, vec2(846., 500.), vec2(99., 120.), vec2(889., 604.),
                  .009 * reach, vec2(-1.1 * reach, 1. * breath));
  q += vec2(4. * breath, 2.2 * (cos(phase) - 1.)) * patch(p, vec2(875., 555.), vec2(91., 60.));
  q += vec2(3.2 * breath, 2.2 * sin(phase * 2.)) * patch(p, vec2(840., 442.), vec2(103., 55.));
  q += articulate(p, vec2(749., 559.), vec2(75., 81.), vec2(776., 610.),
                  -.012 * breath, vec2(1.1 * breath, -1.4 * breath));
  q += articulate(p, vec2(748., 767.), vec2(80., 79.), vec2(810., 791.),
                  .012 * breath, vec2(-1.2 * breath, 1.3 * breath));
  q += articulate(p, vec2(875., 929.), vec2(106., 102.), vec2(924., 1005.),
                  -.01 * breath, vec2(1.5 * breath, -1.3 * breath));

  // Attached flowers sway around their stems, independently of the red cloak.
  q += articulate(p, vec2(764., 344.), vec2(119., 123.), vec2(803., 423.),
                  .025 * breath, vec2(3.2 * breath, -2. * breath));
  q += articulate(p, vec2(896., 294.), vec2(78., 106.), vec2(911., 367.),
                  -.04 * breath, vec2(-3. * breath, 2. * breath));
  q += articulate(p, vec2(730., 434.), vec2(83., 100.), vec2(735., 488.),
                  -.035 * breath, vec2(4. * breath, 1.3 * breath));
  q += articulate(p, vec2(650., 902.), vec2(103., 120.), vec2(723., 900.),
                  .037 * breath, vec2(2.5 * breath, 3. * breath));
  q += articulate(p, vec2(762., 1053.), vec2(133., 133.), vec2(804., 944.),
                  -.035 * breath, vec2(-4.5 * breath, 2. * breath));

  // A tiny breathing expansion in the lime arc and a moving daylight wash.
  float arc = patch(p, vec2(113., 572.), vec2(167., 218.));
  q += (p - vec2(0., 640.)) * .009 * breath * arc * (1. - robotBody);
  vec3 color = texture2D(artwork, clamp(q / sourceSize, .0001, .9999)).rgb;
  float sunlight = sin(phase + p.x * .002 + p.y * .001) - sin(p.x * .002 + p.y * .001);
  color += vec3(.0035, .0029, .0017) * sunlight;
  gl_FragColor = vec4(color, 1.);
}`;

export async function createCreationRenderer() {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) throw new Error("WebGL is required to animate the artwork.");
  const image = new Image();
  image.src = new URL("./assets/creation-source.png", import.meta.url).href;
  await image.decode();
  const { base, sprites } = separatePetals(image);
  const composition = document.createElement("canvas"),
    compositionContext = composition.getContext("2d");
  const shaders = [];
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vertexSource],
    [gl.FRAGMENT_SHADER, fragmentSource],
  ]) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader));
    }
    shaders.push(shader);
  }
  const program = gl.createProgram();
  shaders.forEach((shader) => gl.attachShader(program, shader));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(program));
  shaders.forEach((shader) => gl.deleteShader(shader));
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, base);
  gl.uniform1i(gl.getUniformLocation(program, "artwork"), 0);
  const phase = gl.getUniformLocation(program, "phase");
  const outputSize = gl.getUniformLocation(program, "outputSize");
  let lost = false;
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    lost = true;
  });
  return {
    render(seconds, width, height) {
      if (lost)
        throw new Error(
          "The artwork graphics context was lost. Reload the page to continue.",
        );
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.uniform2f(outputSize, width, height);
      gl.uniform1f(phase, ((seconds % 10) / 10) * Math.PI * 2);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (composition.width !== width || composition.height !== height) {
        composition.width = width;
        composition.height = height;
      }
      compositionContext.drawImage(canvas, 0, 0);
      const scale = Math.min(width / 941, height / 1672),
        angle = ((seconds % 10) / 10) * Math.PI * 2;
      compositionContext.save();
      compositionContext.translate(
        (width - 941 * scale) / 2,
        (height - 1672 * scale) / 2,
      );
      compositionContext.scale(scale, scale);
      for (const petal of sprites) {
        const wind = Math.sin(angle + petal.seed) - Math.sin(petal.seed);
        const lift = Math.cos(angle + petal.seed) - Math.cos(petal.seed);
        compositionContext.save();
        compositionContext.translate(
          petal.x + petal.width / 2 + 17 * wind,
          petal.y + petal.height / 2 + 22 * lift,
        );
        compositionContext.rotate(0.2 * wind);
        compositionContext.scale(1, 1 + 0.07 * Math.sin(angle));
        compositionContext.drawImage(
          petal.canvas,
          -petal.width / 2,
          -petal.height / 2,
        );
        compositionContext.restore();
      }
      compositionContext.restore();
      return composition;
    },
    dispose() {
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}
