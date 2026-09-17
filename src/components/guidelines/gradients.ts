import type { GradientStyle } from "./types";

export const GRADIENT_PRESETS: { name: string; value: GradientStyle }[] = [
  { name: "Festival haze", value: { kind: "mesh", colors: ["#ff846b", "#e8b5f7", "#e8ffb8"], angle: 90 } },
  { name: "Pink dusk", value: { kind: "linear", colors: ["#efb2ef", "#ff9ca3", "#ff765e"], angle: 170 } },
  { name: "Violet stage", value: { kind: "radial", colors: ["#a299ff", "#4d3bea", "#111226"], angle: 135 } },
  { name: "Lime light", value: { kind: "linear", colors: ["#efffd0", "#dfff9f", "#cce891"], angle: 125 } },
  { name: "Edge glow", value: { kind: "edge", colors: ["#fa8599", "#a486d8", "#0c0c0c"], angle: 90 } },
];

export function gradientCss(g: GradientStyle) {
  const [a, b, c] = g.colors;
  if (g.kind === "mesh") return `radial-gradient(ellipse at 92% 8%, ${a} 0%, transparent 62%), radial-gradient(ellipse at 4% 8%, ${b} 0%, transparent 68%), radial-gradient(ellipse at 35% 100%, ${c} 0%, transparent 72%), #f4eee8`;
  if (g.kind === "radial") return `radial-gradient(ellipse at ${50 + 35 * Math.cos(g.angle * Math.PI / 180)}% ${50 + 35 * Math.sin(g.angle * Math.PI / 180)}%, ${a}, ${b} 45%, ${c} 100%)`;
  if (g.kind === "edge") return `linear-gradient(${g.angle}deg, ${a} 0%, ${b} 3%, ${c} 10%, ${c} 100%)`;
  return `linear-gradient(${g.angle}deg, ${a} 0%, ${b} 50%, ${c} 100%)`;
}

// A small repeating SVG texture; stays crisp in print and requires no network.
export const GRAIN = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch"/></filter><path fill="#888" filter="url(#n)" d="M0 0h160v160H0z"/></svg>')}")`;
