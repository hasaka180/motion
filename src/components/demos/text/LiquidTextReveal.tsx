"use client";

import { useEffect, useId, useRef } from "react";
import { animate } from "motion";

const LINES = ["Make something", "worth stopping", "for."];
const DURATION = 1.2;
const STAGGER = 0.1;
const matrix = (gain: number, offset: number) =>
  `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${gain} ${offset}`;

/** Inspired by bleibtgleich.dev: thresholded blur resolves into stationary type. */
export function LiquidTextReveal() {
  const root = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const lines = Array.from(element.querySelectorAll<HTMLElement>("[data-liquid-line]"));
    const blurs = Array.from(element.querySelectorAll("feGaussianBlur"));
    const matrices = Array.from(element.querySelectorAll("feColorMatrix"));
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const controls: Array<ReturnType<typeof animate>> = [];
    let disposed = false;
    let started = false;
    const finish = () => {
      controls.forEach(control => control.stop());
      lines.forEach(line => { line.style.filter = "none"; });
    };
    const play = () => {
      if (started || disposed) return;
      started = true;
      if (preference.matches) { finish(); return; }
      lines.forEach((line, index) => {
        const delay = 0.15 + index * STAGGER;
        controls.push(animate(50, 0, {
          duration: DURATION, delay, ease: [0.25, 1, 0.5, 1],
          onUpdate: value => blurs[index].setAttribute("stdDeviation", String(value)),
        }));
        // Relax the alpha threshold over the final 35% for crisp native type.
        controls.push(animate(0, 1, {
          duration: DURATION * 0.35, delay: delay + DURATION * 0.65, ease: "linear",
          onUpdate: value => matrices[index].setAttribute("values", matrix(20 - 19 * value, -8 + 8 * value)),
          onComplete: () => { line.style.filter = "none"; },
        }));
      });
    };
    const onPreference = () => { if (preference.matches) finish(); };
    preference.addEventListener("change", onPreference);
    if (!preference.matches) {
      lines.forEach((line, index) => {
        blurs[index].setAttribute("stdDeviation", "50");
        matrices[index].setAttribute("values", matrix(20, -8));
        line.style.filter = `url(#${id}-${index})`;
      });
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        void document.fonts.ready.then(play);
      }
    }, { threshold: 0.2 });
    observer.observe(element);
    return () => {
      disposed = true;
      observer.disconnect();
      preference.removeEventListener("change", onPreference);
      finish();
    };
  }, [id]);

  return (
    <div ref={root} className="absolute inset-0 flex flex-col justify-between overflow-hidden bg-[#e9e7e1] px-6 py-6 text-[#252722] sm:px-10 sm:py-8" style={{ containerType: "inline-size" }}>
      <svg aria-hidden="true" width="0" height="0" className="pointer-events-none absolute">
        <defs>
          {LINES.map((_, index) => (
            <filter key={index} id={`${id}-${index}`} x="-25%" y="-50%" width="150%" height="200%" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="50" result="blur" />
              <feColorMatrix in="blur" type="matrix" values={matrix(20, -8)} />
            </filter>
          ))}
        </defs>
      </svg>
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] sm:text-[11px]">
        <span>Darwin® / Type studies</span><span>№ 006</span>
      </div>
      <h2 aria-label={LINES.join(" ")} className="my-8 font-semibold" style={{ fontSize: "clamp(24px, 13cqw, 104px)", lineHeight: 0.98, letterSpacing: "-0.065em" }}>
        {LINES.map((line, index) => (
          <span key={line} data-liquid-line aria-hidden="true" className="block whitespace-nowrap" style={{ color: index === 2 ? "#5e6853" : undefined }}>{line}</span>
        ))}
      </h2>
      <div className="flex items-end justify-between gap-6 border-t border-[#252722]/20 pt-4 font-mono text-[10px] leading-relaxed sm:text-[11px]">
        <span>From an impression<br />to something clear.</span>
        <a href="https://bleibtgleich.dev/" target="_blank" rel="noreferrer" className="text-right underline decoration-[#252722]/30 underline-offset-4 hover:decoration-current focus-visible:outline focus-visible:outline-offset-4">Inspired by<br />bleibtgleich.dev ↗</a>
      </div>
    </div>
  );
}
