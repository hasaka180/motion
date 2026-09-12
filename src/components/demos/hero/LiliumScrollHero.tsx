"use client";

import { useEffect, useRef, useState } from "react";
import { createLiliumRenderer, LILIUM_FRAMES } from "./lilium/renderer";
import styles from "./LiliumScrollHero.module.css";

export function LiliumScrollHero() {
  const host = useRef<HTMLElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [position, setPosition] = useState({ progress: 0, frame: 0 });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const root = host.current, scroll = scroller.current, surface = canvas.current;
    if (!root || !scroll || !surface) return;
    let disposed = false, visible = false, frame = 0, progress = 0;
    let renderer: ReturnType<typeof createLiliumRenderer> = null;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const images = [new Image(), new Image()];
    const paths = ["/images/lilium/specimen.png", "/images/lilium/bud.png"];

    function paint() {
      frame = 0;
      if (disposed || !visible || document.hidden) return;
      const range = scroll!.scrollHeight - scroll!.clientHeight;
      progress = range > 0 ? Math.max(0, Math.min(1, scroll!.scrollTop / range)) : 0;
      const current = Math.min(12, Math.floor(progress * 12 + (preference.matches ? .5 : .25)));
      root!.dataset.frame = String(current);
      root!.dataset.dark = String(![0, 2, 10].includes(current));
      renderer?.draw(progress, preference.matches);
      setPosition({ progress, frame: current });
    }
    function schedule() {
      if (!frame && !disposed) frame = requestAnimationFrame(paint);
    }
    function resize() {
      root!.style.setProperty("--viewport-height", `${root!.clientHeight}px`);
      scroll!.scrollTop = progress * (scroll!.scrollHeight - scroll!.clientHeight);
      schedule();
    }
    const sizes = new ResizeObserver(resize);
    const views = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) schedule(); });
    sizes.observe(root); views.observe(root);
    scroll.addEventListener("scroll", schedule, { passive: true });
    document.addEventListener("visibilitychange", schedule);
    preference.addEventListener("change", schedule);
    resize();
    Promise.all(images.map((image, index) => new Promise<void>((resolve, reject) => {
      image.onload = () => resolve(); image.onerror = () => reject(new Error("Specimen image unavailable")); image.src = paths[index];
    }))).then(() => {
      if (disposed) return;
      renderer = createLiliumRenderer(surface, images[0], images[1]);
      setStatus(renderer ? "ready" : "error"); schedule();
    }).catch(() => { if (!disposed) setStatus("error"); });
    return () => {
      disposed = true; cancelAnimationFrame(frame); sizes.disconnect(); views.disconnect();
      scroll.removeEventListener("scroll", schedule);
      document.removeEventListener("visibilitychange", schedule);
      preference.removeEventListener("change", schedule);
      images.forEach(image => { image.onload = null; image.onerror = null; });
      renderer?.dispose();
    };
  }, []);

  function seek(progress: number) {
    const scroll = scroller.current;
    if (scroll) scroll.scrollTo({ top: progress * (scroll.scrollHeight - scroll.clientHeight), behavior: "instant" });
  }

  return (
    <section ref={host} className={styles.hero} aria-label="Lilium scroll study" data-dark="false" data-ready={status === "ready"}>
      <h2 className={styles.srOnly}>Lilium — a botanical study in thirteen frames</h2>
      <div ref={scroller} className={styles.scroller} tabIndex={0} aria-label="Scroll to explore the botanical study">
        <div className={styles.track}>
          <div className={styles.screen}>
            <canvas ref={canvas} className={styles.canvas} role="img" aria-label={`Red lily botanical study: ${LILIUM_FRAMES[position.frame]}`} />
            <header className={styles.header}><span>LILIUM<span className={styles.headerSub}> / BOTANICAL STUDY</span></span><span>SPECIMEN_01</span></header>
            {status !== "ready" && <div className={styles.loading} role="status">{status === "loading" ? "Preparing the specimen…" : "The specimen could not load. Use Replay to try again."}</div>}
            <footer className={styles.footer}>
              <div className={styles.frameLabel}><span>{String(position.frame + 1).padStart(2, "0")} / 13</span><strong>{LILIUM_FRAMES[position.frame]}</strong><span className={styles.scrollHint}>{position.progress < .98 ? "SCROLL TO EXPLORE ↓" : "END OF STUDY ↖"}</span></div>
              <input className={styles.scrubber} type="range" min={0} max={1200} step={1} value={Math.round(position.progress * 1200)} aria-label="Botanical study timeline" aria-valuetext={`Frame ${position.frame + 1}: ${LILIUM_FRAMES[position.frame]}`} onChange={event => seek(Number(event.target.value) / 1200)} />
              <nav className={styles.frameNav} aria-label="Study frames">
                <button className={styles.arrow} aria-label="Previous frame" disabled={position.frame === 0} onClick={() => seek((position.frame - 1) / 12)}>←</button>
                <div className={styles.frameDots}>{LILIUM_FRAMES.map((label, index) => <button key={label} onClick={() => seek(index / 12)} aria-label={`Frame ${index + 1}: ${label}`} aria-current={index === position.frame ? "step" : undefined}><span /></button>)}</div>
                <button className={styles.arrow} aria-label="Next frame" disabled={position.frame === 12} onClick={() => seek((position.frame + 1) / 12)}>→</button>
              </nav>
            </footer>
          </div>
        </div>
      </div>
    </section>
  );
}
