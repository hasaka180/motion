"use client";

import { useEffect, useRef } from "react";

/**
 * A soft blob kid, walking a bright room.
 *
 * The body is a signed distance field, not a mesh: thirteen capsules welded
 * together with a polynomial smooth-minimum and raymarched in one fullscreen
 * fragment shader. That smooth-min is the whole character — it is what fuses
 * the arms into the torso and the feet into the shins with a soft crease
 * instead of a seam, which no amount of mesh work gives you for free.
 *
 * Animation drives the capsule endpoints, so a skeleton poses the field: the
 * shader gets twenty-six vectors a frame and knows nothing about walking.
 *
 * It walks toward your pointer. Leave it alone and it turns to face you and
 * finds something to do.
 *
 * Raw WebGL2 and no 3D library — the whole thing is one triangle and one
 * shader, so a library would carry a dependency without carrying any work.
 */

/** Seconds of standing still before it starts playing. */
const IDLE_AFTER = 1.5;
/**
 * The field is soft and the camera never moves fast, so marching below native
 * resolution costs almost nothing visually and buys a lot of headroom.
 */
const RENDER_SCALE = 0.72;

// ----------------------------------------------------------------- mat4
type M4 = Float32Array;
const m4 = () => new Float32Array(16);

function identity(o: M4) {
  o.fill(0);
  o[0] = o[5] = o[10] = o[15] = 1;
  return o;
}

function multiply(o: M4, a: M4, b: M4) {
  for (let c = 0; c < 4; c++) {
    const b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
    o[c * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
    o[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
    o[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
    o[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
  }
  return o;
}

/** Translate, then rotate in YXZ — enough for a skeleton. */
function compose(o: M4, tx: number, ty: number, tz: number, rx: number, ry: number, rz: number) {
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const cz = Math.cos(rz), sz = Math.sin(rz);
  o[0] = cy * cz + sy * sx * sz;
  o[1] = cx * sz;
  o[2] = -sy * cz + cy * sx * sz;
  o[3] = 0;
  o[4] = -cy * sz + sy * sx * cz;
  o[5] = cx * cz;
  o[6] = sy * sz + cy * sx * cz;
  o[7] = 0;
  o[8] = sy * cx;
  o[9] = -sx;
  o[10] = cy * cx;
  o[11] = 0;
  o[12] = tx;
  o[13] = ty;
  o[14] = tz;
  o[15] = 1;
  return o;
}

// -------------------------------------------------------------- skeleton
const PELVIS = 0, CHEST = 1, HEAD = 2;
const UARM_L = 3, FARM_L = 4, UARM_R = 5, FARM_R = 6;
const THIGH_L = 7, SHIN_L = 8, THIGH_R = 9, SHIN_R = 10;
const FOOT_L = 11, FOOT_R = 12;
const BONES = 13;

type Bone = {
  parent: number;
  off: [number, number, number];
  len: number;
  radius: number;
  /** +1 grows along +Y, -1 along -Y. */
  dir: number;
};

/**
 * Toy proportions: an enormous head, no neck to speak of, a rounded trunk and
 * short thick limbs ending in blunt feet. The radii matter more than the
 * lengths — the smooth-min does the sculpting.
 */
const SKELETON: Bone[] = [
  { parent: -1, off: [0, 0, 0], len: 0.16, radius: 0.235, dir: 1 },
  { parent: PELVIS, off: [0, 0.16, 0], len: 0.24, radius: 0.250, dir: 1 },
  { parent: CHEST, off: [0, 0.52, 0], len: 0.01, radius: 0.300, dir: 1 },
  { parent: CHEST, off: [-0.30, 0.20, 0], len: 0.22, radius: 0.103, dir: -1 },
  { parent: UARM_L, off: [0, -0.22, 0], len: 0.20, radius: 0.098, dir: -1 },
  { parent: CHEST, off: [0.30, 0.20, 0], len: 0.22, radius: 0.103, dir: -1 },
  { parent: UARM_R, off: [0, -0.22, 0], len: 0.20, radius: 0.098, dir: -1 },
  { parent: PELVIS, off: [-0.155, 0.0, 0], len: 0.22, radius: 0.124, dir: -1 },
  { parent: THIGH_L, off: [0, -0.22, 0], len: 0.20, radius: 0.115, dir: -1 },
  { parent: PELVIS, off: [0.155, 0.0, 0], len: 0.22, radius: 0.124, dir: -1 },
  { parent: THIGH_R, off: [0, -0.22, 0], len: 0.20, radius: 0.115, dir: -1 },
  { parent: SHIN_L, off: [0, -0.20, 0], len: 0.14, radius: 0.152, dir: -1 },
  { parent: SHIN_R, off: [0, -0.20, 0], len: 0.14, radius: 0.152, dir: -1 },
];

/** Hip height, so the feet rest on y = 0. */
const HIP = 0.60;

// ------------------------------------------------------------------ pose
const J = {
  y: 0, roll: 1, pitch: 2, yaw: 3,
  chestPitch: 4, chestRoll: 5, headPitch: 6, headYaw: 7,
  shoulderL: 8, elbowL: 9, shoulderR: 10, elbowR: 11,
  hipL: 12, kneeL: 13, hipR: 14, kneeR: 15, ankleL: 16, ankleR: 17,
  armOutL: 18, armOutR: 19,
};
const JOINTS = 20;

function walkPose(out: Float32Array, phase: number, speed: number) {
  const a = phase * Math.PI * 2;
  const s = Math.min(1, speed);
  out.fill(0);
  out[J.y] = 0.026 * Math.sin(a * 2) * s;
  out[J.roll] = 0.07 * Math.sin(a) * s;
  out[J.pitch] = 0.05 * s;
  out[J.chestPitch] = -0.03 * s;
  out[J.chestRoll] = -0.05 * Math.sin(a) * s;
  out[J.headPitch] = 0.04 * s;
  out[J.hipL] = 0.66 * Math.sin(a) * s;
  out[J.hipR] = 0.66 * Math.sin(a + Math.PI) * s;
  out[J.kneeL] = (0.10 + 0.80 * Math.max(0, Math.sin(a - 1.15))) * s;
  out[J.kneeR] = (0.10 + 0.80 * Math.max(0, Math.sin(a + Math.PI - 1.15))) * s;
  out[J.ankleL] = 0.18 * Math.sin(a + 0.6) * s;
  out[J.ankleR] = 0.18 * Math.sin(a + Math.PI + 0.6) * s;
  out[J.shoulderL] = -0.52 * Math.sin(a) * s;
  out[J.shoulderR] = -0.52 * Math.sin(a + Math.PI) * s;
  out[J.elbowL] = (0.18 + 0.22 * Math.max(0, -Math.sin(a))) * s;
  out[J.elbowR] = (0.18 + 0.22 * Math.max(0, Math.sin(a))) * s;
  out[J.armOutL] = 0.09;
  out[J.armOutR] = 0.09;
}

function idlePose(out: Float32Array, t: number) {
  out.fill(0);
  const b = Math.sin(t * 1.5);
  out[J.y] = 0.014 * b;
  out[J.roll] = 0.045 * Math.sin(t * 0.6);
  out[J.chestPitch] = -0.04 + 0.03 * b;
  out[J.headPitch] = 0.05 + 0.05 * Math.sin(t * 0.9 + 1);
  out[J.headYaw] = 0.28 * Math.sin(t * 0.45);
  out[J.shoulderL] = 0.05 * b;
  out[J.shoulderR] = -0.05 * b;
  out[J.elbowL] = 0.22;
  out[J.elbowR] = 0.22;
  out[J.armOutL] = 0.11;
  out[J.armOutR] = 0.11;
  out[J.kneeL] = 0.05;
  out[J.kneeR] = 0.05;
}

/** Hop on the spot, knees tucked, arms thrown up. */
function hopPose(out: Float32Array, t: number) {
  idlePose(out, t * 4);
  const local = (t * 3) % 1;
  const lift = Math.pow(Math.sin(Math.PI * local), 0.75);
  const crouch = local < 0.16 || local > 0.86 ? 1 : 0;
  out[J.y] = 0.40 * lift - 0.13 * crouch;
  out[J.hipL] = out[J.hipR] = -0.5 * lift;
  out[J.kneeL] = out[J.kneeR] = 1.35 * lift + 0.45 * crouch;
  out[J.shoulderL] = out[J.shoulderR] = -2.25 * lift;
  out[J.elbowL] = out[J.elbowR] = 0.2 + 0.3 * lift;
  out[J.armOutL] = out[J.armOutR] = 0.18 + 0.3 * lift;
  out[J.chestPitch] = -0.16 * lift;
}

/** Spin on the spot with the arms flung out. */
function spinPose(out: Float32Array, t: number) {
  idlePose(out, t * 2);
  const e = t < 0.15 ? t / 0.15 : t > 0.85 ? (1 - t) / 0.15 : 1;
  out[J.yaw] = Math.PI * 4 * (t * t * (3 - 2 * t));
  out[J.armOutL] = out[J.armOutR] = 0.12 + 1.15 * e;
  out[J.shoulderL] = out[J.shoulderR] = -0.3 * e;
  out[J.elbowL] = out[J.elbowR] = 0.12;
  out[J.roll] = 0.09 * e * Math.sin(t * 22);
  out[J.y] = 0.03 * e * Math.abs(Math.sin(t * 18));
}

/** Wave, with a little bounce. */
function wavePose(out: Float32Array, t: number) {
  idlePose(out, t * 3);
  const e = Math.min(1, t / 0.18) * Math.min(1, (1 - t) / 0.18);
  out[J.shoulderR] = -2.4 * e;
  out[J.elbowR] = 0.4 + 0.4 * Math.sin(t * 26);
  out[J.armOutR] = 0.16 + 0.42 * e + 0.2 * Math.sin(t * 26);
  out[J.headYaw] = 0.14;
  out[J.chestRoll] = -0.06 * e;
  out[J.y] = 0.02 * Math.abs(Math.sin(t * 13)) * e;
}

const ACTIVITIES = [hopPose, spinPose, wavePose];
const ACTIVITY_SECONDS = [2.6, 2.2, 2.8];

// ---------------------------------------------------------------- shaders
const VERT = `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 frag;

uniform vec4 uA[${BONES}];   // xyz = capsule start, w = radius
uniform vec4 uB[${BONES}];   // xyz = capsule end
uniform float uAspect;
uniform float uTanHalf;
uniform vec3 uEye;
uniform vec3 uCentre;        // bounding sphere, to skip empty pixels
uniform float uBound;
uniform vec2 uFeet;          // feet in screen space, for the contact shadow

/** Welds the capsules into one body — the reason the joints have creases
    rather than seams. */
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a;
  vec3 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

float map(vec3 p) {
  float d = sdCapsule(p, uA[0].xyz, uB[0].xyz, uA[0].w);
  for (int i = 1; i < ${BONES}; i++) {
    d = smin(d, sdCapsule(p, uA[i].xyz, uB[i].xyz, uA[i].w), 0.082);
  }
  return d;
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(1.0, -1.0) * 0.0015;
  return normalize(
    e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) +
    e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}

vec3 background(vec2 uv) {
  // A bright, almost white studio, warm at the top.
  vec3 col = mix(vec3(0.878, 0.888, 0.902), vec3(0.957, 0.945, 0.941), uv.y);
  col += vec3(0.022, 0.010, 0.004) * smoothstep(0.35, 1.05, uv.x * 0.5 + uv.y);

  vec2 sd = (uv - uFeet) * vec2(uAspect * 0.85, 3.6);
  float near = exp(-dot(sd, sd) * 2.1);
  // Contact shadow, then the warm bounce the feet throw onto the floor.
  col *= 1.0 - 0.30 * near;
  col += vec3(0.115, 0.048, 0.0) * exp(-dot(sd, sd) * 0.9) * 0.75;
  return col;
}

void main() {
  vec2 ndc = vUv * 2.0 - 1.0;
  vec3 rd = normalize(vec3(ndc.x * uAspect * uTanHalf, ndc.y * uTanHalf, -1.0));
  vec3 ro = uEye;
  vec3 col = background(vUv);

  // Skip the march entirely unless the ray could reach the body.
  vec3 oc = ro - uCentre;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - uBound * uBound;
  float disc = b * b - c;

  if (disc > 0.0) {
    float sq = sqrt(disc);
    float t = max(-b - sq, 0.0);
    float tMax = -b + sq;
    bool hit = false;
    vec3 p = ro;

    for (int i = 0; i < 88; i++) {
      p = ro + rd * t;
      float d = map(p);
      if (d < 0.0009) { hit = true; break; }
      t += d;
      if (t > tMax) break;
    }

    if (hit) {
      vec3 n = normalAt(p);
      vec3 v = -rd;

      // A three-light studio: warm key from above and in front, cyan fill from
      // the left, and a saturated bounce off the floor that only reaches the
      // legs and feet. That last one is what makes the feet glow.
      float key = max(0.0, dot(n, normalize(vec3(0.30, 0.82, 0.50))));
      float fill = max(0.0, dot(n, normalize(vec3(-0.88, 0.12, 0.36))));
      float bounce = max(0.0, dot(n, normalize(vec3(0.05, -0.90, 0.42))));
      float floorNear = exp(-max(0.0, p.y) * 2.15);

      col = vec3(0.660, 0.635, 0.860);
      col = mix(col, vec3(1.00, 0.735, 0.400), pow(key, 1.15) * 0.95);
      col = mix(col, vec3(0.400, 0.845, 0.935), fill * 0.52);
      col = mix(col, vec3(1.00, 0.430, 0.055), clamp(bounce * floorNear * 1.45, 0.0, 1.0));

      // A wide soft highlight, and a rim so it separates from a white room.
      float spec = pow(max(0.0, dot(reflect(-normalize(vec3(0.30, 0.82, 0.50)), n), v)), 18.0);
      col += spec * 0.13;
      col += pow(1.0 - max(0.0, dot(n, v)), 2.4) * 0.14;
    }
  }

  // Grain, or the gradients band on a wide screen.
  float g = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
  col += (g - 0.5) * 0.012;
  frag = vec4(col, 1.0);
}
`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh) ?? "shader failed");
  }
  return sh;
}

export function BlobKidHero() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false });
    if (!gl) return;

    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
    } catch {
      return;
    }

    const vao = gl.createVertexArray()!;
    const uA = gl.getUniformLocation(prog, "uA");
    const uB = gl.getUniformLocation(prog, "uB");
    const uAspect = gl.getUniformLocation(prog, "uAspect");
    const uTanHalf = gl.getUniformLocation(prog, "uTanHalf");
    const uEye = gl.getUniformLocation(prog, "uEye");
    const uCentre = gl.getUniformLocation(prog, "uCentre");
    const uBound = gl.getUniformLocation(prog, "uBound");
    const uFeet = gl.getUniformLocation(prog, "uFeet");

    const capA = new Float32Array(BONES * 4);
    const capB = new Float32Array(BONES * 4);
    const localM = m4();
    const worldM: M4[] = Array.from({ length: BONES }, () => m4());

    const pose = new Float32Array(JOINTS);
    const target = new Float32Array(JOINTS);

    // Camera looks straight down -Z, so framing is two numbers.
    const FOV = 0.62;
    const tanHalf = Math.tan(FOV / 2);
    const EYE_Y = 0.80;
    const EYE_Z = 3.55;

    let aspect = 1;
    let frame = 0;
    let last = performance.now();
    let figureX = 0;
    let facing = 1;
    let yaw = 0;
    let phase = 0;
    let stillFor = 0;
    let activity = -1;
    let activityT = 0;
    let visible = true;
    const pointer = { x: 0.5 };

    const resize = () => {
      const box = host.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * RENDER_SCALE;
      canvas.width = Math.max(1, Math.round(box.width * dpr));
      canvas.height = Math.max(1, Math.round(box.height * dpr));
      canvas.style.width = `${box.width}px`;
      canvas.style.height = `${box.height}px`;
      aspect = canvas.width / canvas.height;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const onMove = (e: PointerEvent) => {
      const box = host.getBoundingClientRect();
      if (box.width) pointer.x = (e.clientX - box.left) / box.width;
    };

    const buildBones = () => {
      const p = pose;
      compose(worldM[PELVIS], figureX, HIP + p[J.y], 0, p[J.pitch], yaw + p[J.yaw], p[J.roll]);

      const chain: [number, number, number, number][] = [
        [CHEST, p[J.chestPitch], 0, p[J.chestRoll]],
        [HEAD, p[J.headPitch], p[J.headYaw], 0],
        [UARM_L, p[J.shoulderL], 0, -p[J.armOutL]],
        [FARM_L, p[J.elbowL], 0, 0],
        [UARM_R, p[J.shoulderR], 0, p[J.armOutR]],
        [FARM_R, p[J.elbowR], 0, 0],
        [THIGH_L, p[J.hipL], 0, -0.03],
        [SHIN_L, p[J.kneeL], 0, 0],
        [THIGH_R, p[J.hipR], 0, 0.03],
        [SHIN_R, p[J.kneeR], 0, 0],
        [FOOT_L, p[J.ankleL] + 1.15, 0, 0],
        [FOOT_R, p[J.ankleR] + 1.15, 0, 0],
      ];

      for (const [bi, rx, ry, rz] of chain) {
        const b = SKELETON[bi];
        compose(localM, b.off[0], b.off[1], b.off[2], rx, ry, rz);
        multiply(worldM[bi], worldM[b.parent], localM);
      }

      // Each bone becomes a capsule: its origin, and its tip along local Y.
      for (let i = 0; i < BONES; i++) {
        const m = worldM[i];
        const L = SKELETON[i].dir * SKELETON[i].len;
        capA[i * 4] = m[12];
        capA[i * 4 + 1] = m[13];
        capA[i * 4 + 2] = m[14];
        capA[i * 4 + 3] = SKELETON[i].radius;
        capB[i * 4] = m[4] * L + m[12];
        capB[i * 4 + 1] = m[5] * L + m[13];
        capB[i * 4 + 2] = m[6] * L + m[14];
        capB[i * 4 + 3] = 0;
      }
    };

    /** Project a world point to screen uv, for the contact shadow. */
    const project = (x: number, y: number, z: number) => {
      const vz = z - EYE_Z;
      const d = Math.max(0.001, -vz);
      return [
        0.5 + (x / d / tanHalf / aspect) * 0.5,
        0.5 + ((y - EYE_Y) / d / tanHalf) * 0.5,
      ];
    };

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;

      const targetX = (pointer.x - 0.5) * 2.4;
      const dx = targetX - figureX;
      const near = Math.abs(dx) < 0.08;
      stillFor = near ? stillFor + dt : 0;

      if (!near) {
        const speed = Math.min(0.8, 0.32 + Math.abs(dx) * 0.75);
        figureX += Math.sign(dx) * speed * dt;
        facing = Math.sign(dx) || facing;
        phase += speed * dt * 1.3;
        activity = -1;
        activityT = 0;
        walkPose(target, phase, Math.min(1, speed / 0.65));
        yaw += ((facing > 0 ? -Math.PI / 2 : Math.PI / 2) - yaw) * Math.min(1, dt * 4);
      } else {
        yaw += (0 - yaw) * Math.min(1, dt * 3);
        if (stillFor > IDLE_AFTER) {
          if (activity < 0) {
            activity = (Math.random() * ACTIVITIES.length) | 0;
            activityT = 0;
          }
          activityT += dt / ACTIVITY_SECONDS[activity];
          if (activityT >= 1) {
            activity = -1;
            activityT = 0;
            stillFor = IDLE_AFTER * 0.3;
          }
        }
        if (activity >= 0) ACTIVITIES[activity](target, Math.min(1, activityT));
        else idlePose(target, t);
      }

      const k = Math.min(1, dt * (activity >= 0 ? 12 : 7));
      for (let i = 0; i < JOINTS; i++) pose[i] += (target[i] - pose[i]) * k;
      // The spin drives yaw outright, so it must not be smoothed away.
      if (activity >= 0) pose[J.yaw] = target[J.yaw];

      buildBones();
    };

    const draw = () => {
      gl.useProgram(prog);
      gl.bindVertexArray(vao);
      gl.uniform4fv(uA, capA);
      gl.uniform4fv(uB, capB);
      gl.uniform1f(uAspect, aspect);
      gl.uniform1f(uTanHalf, tanHalf);
      gl.uniform3f(uEye, 0, EYE_Y, EYE_Z);
      gl.uniform3f(uCentre, figureX, HIP + 0.25, 0);
      gl.uniform1f(uBound, 1.45);
      const feet = project(figureX, 0.02, 0);
      gl.uniform2f(uFeet, feet[0], feet[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (!visible) return;
      step(now);
      draw();
    };

    identity(localM);
    resize();
    if (calm) {
      idlePose(pose, 0);
      buildBones();
      draw();
    } else {
      frame = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const io = new IntersectionObserver((e) => {
      visible = e[0].isIntersecting;
    });
    io.observe(host);
    host.addEventListener("pointermove", onMove);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointermove", onMove);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
    };
  }, []);

  return (
    <div ref={hostRef} className="absolute inset-0 overflow-hidden bg-[#e6e8ea]">
      <canvas ref={canvasRef} aria-hidden className="block" />
      <p className="pointer-events-none absolute bottom-6 left-8 font-mono text-[10px] uppercase tracking-[0.28em] text-black/30">
        move the pointer · leave it alone and it plays
      </p>
    </div>
  );
}
