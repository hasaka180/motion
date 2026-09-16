/** Absolute scroll math keeps forward playback and reverse seeking identical. */
export const clamp = (n: number) => Math.max(0, Math.min(1, n));
export function phase(progress: number, from: number, to: number) {
  const t = clamp((progress - from) / (to - from));
  return t * t * t * (t * (t * 6 - 15) + 10);
}
