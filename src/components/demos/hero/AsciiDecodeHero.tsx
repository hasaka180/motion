"use client";

import { useEffect, useRef, useState } from "react";
import { createAsciiField } from "./ascii-field/renderer";
import styles from "./AsciiDecodeHero.module.css";

const SYMBOLS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#*/+<>0123456789";

/** Stable letter slots prevent the layout jumping while characters resolve. */
function Decode({ text, delay = 0, run, paused }: { text: string; delay?: number; run: number; paused: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const progress = useRef(0);
  const previousRun = useRef(run);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const letters = Array.from(root.children);
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, hoverFrame = 0, last = 0, hoverLast = 0, hoverStep = 0;
    const hovered = new Set<number>();
    if (previousRun.current !== run) { progress.current = 0; previousRun.current = run; }
    const resolve = () => letters.forEach((letter, i) => { letter.textContent = text[i]; });
    const tick = (now: number) => {
      if (!document.hidden) progress.current += last ? Math.min(now - last, 80) : 0;
      last = now;
      const elapsed = progress.current - delay;
      letters.forEach((letter, i) => {
        if (text[i] === " ") return;
        const settle = 240 + i * 48;
        letter.textContent = elapsed > settle ? text[i] : elapsed < 0 ? "\u00a0" : SYMBOLS[(Math.floor(elapsed / 65) * 7 + i * 13) % SYMBOLS.length];
      });
      if (elapsed < 300 + text.length * 48) frame = requestAnimationFrame(tick);
      else resolve();
    };
    const hoverTick = (now: number) => {
      if (now - hoverLast > 52) {
        hoverLast = now;
        hoverStep++;
        hovered.forEach(index => {
          letters[index].textContent = SYMBOLS[(hoverStep * 7 + index * 13) % SYMBOLS.length];
        });
      }
      if (hovered.size) hoverFrame = requestAnimationFrame(hoverTick);
    };
    const enterHandlers = letters.map((letter, index) => () => {
      if (text[index] === " " || preference.matches || paused) return;
      hovered.add(index);
      if (hovered.size === 1) hoverFrame = requestAnimationFrame(hoverTick);
    });
    const leaveHandlers = letters.map((letter, index) => () => {
      hovered.delete(index);
      letter.textContent = text[index];
      if (!hovered.size) cancelAnimationFrame(hoverFrame);
    });
    letters.forEach((letter, index) => {
      letter.addEventListener("pointerenter", enterHandlers[index]);
      letter.addEventListener("pointerleave", leaveHandlers[index]);
    });
    const start = () => {
      cancelAnimationFrame(frame);
      if (preference.matches) resolve();
      else if (!paused) { last = 0; frame = requestAnimationFrame(tick); }
    };
    start();
    preference.addEventListener("change", start);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(hoverFrame);
      letters.forEach((letter, index) => {
        letter.removeEventListener("pointerenter", enterHandlers[index]);
        letter.removeEventListener("pointerleave", leaveHandlers[index]);
      });
      preference.removeEventListener("change", start);
    };
  }, [text, delay, run, paused]);
  return <span ref={ref} aria-hidden="true">{text.split("").map((letter, index) => <span key={index} className={`${styles.letter} ${letter === " " ? styles.space : ""}`}>{letter}</span>)}</span>;
}

export function AsciiDecodeHero() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const field = useRef<ReturnType<typeof createAsciiField>>(null);
  const [paused, setPaused] = useState(false);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (!canvas.current) return;
    field.current = createAsciiField(canvas.current);
    return () => { field.current?.dispose(); field.current = null; };
  }, []);
  useEffect(() => { field.current?.pause(paused); }, [paused]);

  const decode = (text: string, delay: number) => <Decode text={text} delay={delay} run={run} paused={paused} />;
  return (
    <section className={styles.hero} aria-label="Character field animated hero">
      <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
      <div className={styles.shade} />
      <header className={styles.header}>
        <button type="button" className={styles.control} aria-pressed={paused} aria-label={paused ? "Resume animation" : "Pause animation"} onClick={() => setPaused(value => !value)}>
          <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span>
        </button>
      </header>
      <h2 className={styles.headline} aria-label="Where brave minds shape digital worlds">
        <span className={styles.line}>{decode("WHERE", 100)}</span>
        <span className={styles.line}>{decode("BRAVE MINDS", 320)}</span>
        <span className={`${styles.line} ${styles.split}`}>{decode("SHAPE", 540)}{decode("DIGITAL", 700)}</span>
        <span className={styles.line}>{decode("WORLDS", 900)}</span>
      </h2>
      <footer className={styles.footer}>
        <button type="button" className={`${styles.control} ${styles.replay}`} aria-label="Replay text decoding" onClick={() => { setPaused(false); setRun(value => value + 1); }}>↻</button>
      </footer>
    </section>
  );
}
