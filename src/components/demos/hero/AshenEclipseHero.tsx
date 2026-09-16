"use client";

import { useEffect, useRef, useState } from "react";
import { createSequenceRenderer } from "./ashen/sequence";
import styles from "./AshenEclipseHero.module.css";

export function AshenEclipseHero() {
  const host = useRef<HTMLElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const root = host.current, scroll = scroller.current, surface = canvas.current;
    if (!root || !scroll || !surface) return;
    let disposed = false, visible = false, raf = 0, last = 0, elapsed = 0;
    let target = 0, current = 0, failed = false;
    let renderer: ReturnType<typeof createSequenceRenderer> | undefined;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    function unavailable() { if (!disposed) { failed = true; setFallback(true); } }
    function loading(loaded: number, total: number) {
      root!.style.setProperty("--loaded", String(loaded / total));
      root!.dataset.loaded = String(loaded === total);
    }
    function readScroll() {
      const range = scroll!.scrollHeight - scroll!.clientHeight;
      target = range > 0 ? scroll!.scrollTop / range : 0;
      schedule();
    }
    function paint(now: number) {
      raf = 0;
      if (disposed || !visible || document.hidden || failed) { last = 0; return; }
      const dt = last ? Math.min((now - last) / 1000, .05) : 1 / 60;
      if (last && dt < 1 / 32 && !preference.matches) { schedule(); return; }
      last = now;
      current += (target - current) * (1 - Math.exp(-dt * 7));
      if (Math.abs(current - target) < .0001) current = target;
      if (!preference.matches) elapsed += dt;
      const p = preference.matches ? 1 : current;
      root!.dataset.progress = p.toFixed(3);
      renderer?.draw(p, elapsed, preference.matches);
      if (!preference.matches) schedule();
    }
    function schedule() { if (!raf && !disposed && !failed && visible && !document.hidden) raf = requestAnimationFrame(paint); }
    function resize() {
      root!.style.setProperty("--stage-height", `${root!.clientHeight}px`);
      renderer?.resize(root!.clientWidth, root!.clientHeight);
      readScroll();
    }
    function visibilityChanged() {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; last = 0; }
      else schedule();
    }
    const sizes = new ResizeObserver(resize); sizes.observe(root);
    const views = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        if (!renderer && !failed) {
          try { renderer = createSequenceRenderer(surface, schedule, unavailable, loading); root.dataset.ready = "true"; resize(); }
          catch { unavailable(); }
        }
        schedule();
      } else { cancelAnimationFrame(raf); raf = 0; last = 0; }
    }, { rootMargin: "120px" });
    views.observe(root);
    scroll.addEventListener("scroll", readScroll, { passive: true });
    document.addEventListener("visibilitychange", visibilityChanged);
    preference.addEventListener("change", schedule);
    resize();
    return () => {
      disposed = true; cancelAnimationFrame(raf); sizes.disconnect(); views.disconnect();
      scroll.removeEventListener("scroll", readScroll);
      document.removeEventListener("visibilitychange", visibilityChanged);
      preference.removeEventListener("change", schedule);
      renderer?.dispose();
    };
  }, []);

  return (
    <section ref={host} className={styles.hero} aria-label="Ashen eclipse — the awakening">
      <div ref={scroller} className={styles.scroller} tabIndex={0} aria-label="Scroll through the thirty-frame sequence. Use arrow keys, Page Down, Home or End to raise the hand.">
        <div className={styles.track}>
          <div className={styles.screen}>
            <canvas ref={canvas} className={styles.canvas} role="img" aria-label="An armored hand breaks through a ruined wasteland, rises before a green eclipse, then lowers and grips the earth." />
            <div className={styles.grade} />
            <div className={styles.loader} aria-hidden="true" />
            {fallback && <div className={styles.fallback} role="img" aria-label="Final frame: the armored hand gripping the wasteland under a green eclipse." />}
            {fallback && <p className={styles.srOnly} role="status">The sequence is unavailable. Its final reference image is shown.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
