export const FORMS = ["Character", "Car", "Helicopter", "Puppy", "Building", "Tree", "Phone"] as const;
export type Form = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type Phase = "HUMANOID" | "COMPRESSING" | "LIQUID_MASS" | "REFORMING" | "STABILIZING" | "TARGET_IDLE";
export type Snapshot = { current: Form; target: Form; phase: Phase; locked: boolean; progress: number };
export const DURATION = 3.4;

/** One clock and one transition; requests are rejected synchronously while locked. */
export class Transformation {
  current: Form = 0;
  target: Form = 0;
  elapsed = DURATION;

  request(form: Form) {
    if (this.elapsed < DURATION || form === this.current) return false;
    this.target = form;
    this.elapsed = 0;
    return true;
  }

  advance(dt: number) {
    this.elapsed = Math.min(DURATION, this.elapsed + dt);
    if (this.elapsed === DURATION) this.current = this.target;
    return this.snapshot();
  }

  snapshot(): Snapshot {
    const progress = this.elapsed / DURATION;
    const locked = progress < 1;
    const phase: Phase = !locked ? (this.current === 0 ? "HUMANOID" : "TARGET_IDLE")
      : progress < 0.38 ? "COMPRESSING" : progress < 0.54 ? "LIQUID_MASS"
      : progress < 0.88 ? "REFORMING" : "STABILIZING";
    return { current: this.current, target: this.target, phase, locked, progress };
  }
}
