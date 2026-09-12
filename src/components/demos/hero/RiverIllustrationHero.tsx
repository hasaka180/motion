"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createRiverMotion } from "./river-motion";
import styles from "./RiverIllustrationHero.module.css";

export function RiverIllustrationHero() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const motion = useRef<ReturnType<typeof createRiverMotion>>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!canvas.current) return;
    const controller = createRiverMotion(canvas.current, "/images/river/underwater.png");
    motion.current = controller;
    return () => { controller?.dispose(); motion.current = null; };
  }, []);

  return (
    <section className={styles.hero} aria-label="Beneath the surface — an illustrated river escape">
      <Image className={styles.artwork} src="/images/river/underwater.png" alt="Two people peer through a sunlit river surface, surrounded by rippling light, giant catfish and aquatic plants." fill sizes="(max-width: 768px) 100vw, 1100px" />
      <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
      <div className={styles.shade} />
      <header className={styles.header}>
        <span className={styles.wordmark}>FIELDWORK<span>Stories from the outside</span></span>
        <span className={styles.issue}>A river study<br />No. 001 — Take it slow</span>
      </header>
      <div className={styles.title}>
        <p>There’s another world down here.</p>
        <h2>BENEATH<br /><span>THE SURFACE</span></h2>
      </div>
      <footer className={styles.footer}>
        <p>Less hurry. More wonder.<br /><span>A little closer to the wild.</span></p>
        <button className={styles.pause} type="button" aria-pressed={paused} onClick={() => {
          const next = !paused;
          setPaused(next);
          motion.current?.setPaused(next);
        }}>
          <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span>
          {paused ? "Resume motion" : "Pause motion"}
        </button>
      </footer>
    </section>
  );
}
