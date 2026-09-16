"use client";

import { useEffect, useRef, useState } from "react";
import { createPrismaticRenderer, type Origin } from "./prismatic/renderer";
import styles from "./PrismaticTransition.module.css";

const SCENES = ["Chromatic bloom", "Spectrum architecture"];
const DURATION = 2400;

export function PrismaticTransition() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const meterRef = useRef<HTMLDivElement>(null);
  const advanceRef = useRef<(origin?: Origin) => void>(() => {});
  const [scene, setScene] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = createPrismaticRenderer(canvas);
    if (!renderer) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let current = 0;
    let progress = 0;
    let origin = { x: 0.64, y: 0.48 };
    let started = 0;
    let raf = 0;
    let running = false;
    let previewed = false;
    let preview: ReturnType<typeof setTimeout> | undefined;

    const paint = () => {
      renderer.draw(progress * progress * (3 - 2 * progress), current, origin);
      if (meterRef.current) meterRef.current.style.setProperty("--progress", String(progress));
    };
    const finish = () => {
      cancelAnimationFrame(raf);
      current = 1 - current;
      progress = 0;
      running = false;
      setScene(current);
      setBusy(false);
      paint();
    };
    const tick = (now: number) => {
      progress = Math.min(1, (now - started) / DURATION);
      // Smooth the radial front while keeping individual tile edges hard.
      renderer.draw(progress * progress * (3 - 2 * progress), current, origin);
      if (meterRef.current) meterRef.current.style.setProperty("--progress", String(progress));
      if (progress < 1) raf = requestAnimationFrame(tick);
      else finish();
    };
    advanceRef.current = (point = { x: 0.64, y: 0.48 }) => {
      if (running) return;
      clearTimeout(preview);
      previewed = true;
      origin = point;
      if (reduced.matches) {
        finish();
        return;
      }
      running = true;
      setBusy(true);
      started = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const resize = new ResizeObserver(([entry]) => {
      renderer.resize(entry.contentRect.width, entry.contentRect.height);
      paint();
    });
    resize.observe(canvas);
    const visibility = new IntersectionObserver(([entry]) => {
      clearTimeout(preview);
      if (!entry.isIntersecting) {
        if (running) finish();
        return;
      }
      if (!previewed && !reduced.matches) {
        preview = setTimeout(() => advanceRef.current(), 1400);
      }
    }, { threshold: 0.4 });
    visibility.observe(canvas);
    const onPreference = () => {
      if (reduced.matches) {
        clearTimeout(preview);
        if (running) finish();
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        clearTimeout(preview);
        if (running) finish();
      }
    };
    reduced.addEventListener("change", onPreference);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(preview);
      cancelAnimationFrame(raf);
      resize.disconnect();
      visibility.disconnect();
      reduced.removeEventListener("change", onPreference);
      document.removeEventListener("visibilitychange", onVisibility);
      advanceRef.current = () => {};
      renderer.dispose();
    };
  }, []);

  return (
    <div className={styles.stage} data-scene={scene} data-transitioning={busy}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <button
        type="button"
        className={styles.hitArea}
        aria-label="Transition to the next scene from this point"
        aria-disabled={busy}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          advanceRef.current(event.detail === 0 ? undefined : {
            x: (event.clientX - rect.left) / rect.width,
            y: (event.clientY - rect.top) / rect.height,
          });
        }}
      />
      <div className={styles.topbar} aria-hidden="true">
        <span className={styles.brand}>prisma®</span>
        <span className={styles.eyebrow}>Experiments in perception</span>
        <span className={styles.live}><i /> Live canvas</span>
      </div>
      <div className={styles.caption}>
        <span className={styles.eyebrow}>An exploration of light & form</span>
        <h3>Between<br /><em>dimensions.</em></h3>
      </div>
      <div className={styles.bottom}>
        <div className={styles.scene} role="status" aria-live="polite">
          <span className={styles.sceneNumber}>0{scene + 1}</span>
          <span>{SCENES[scene]}<small>Click anywhere to shift perspective</small></span>
        </div>
        <button
          type="button"
          className={styles.next}
          aria-disabled={busy}
          onClick={() => advanceRef.current()}
        >
          {busy ? "Shifting" : "Next scene"}<span aria-hidden="true">↗</span>
        </button>
      </div>
      <div ref={meterRef} className={styles.meter} aria-hidden="true"><i /></div>
    </div>
  );
}
