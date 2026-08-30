"use client";

import { useEffect, useRef, useState } from "react";

const TARGET = "DECRYPTING SIGNAL";
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&@*<>/\\";

/**
 * Each character locks in one at a time while the rest keep cycling.
 * Runs on a single rAF loop rather than a timer per character.
 */
export function ScrambleText() {
  const [output, setOutput] = useState(TARGET);
  const frame = useRef(0);

  useEffect(() => {
    let raf = 0;
    // How many frames before each index settles.
    const settleAt = TARGET.split("").map((_, i) => 12 + i * 4);

    const tick = () => {
      const f = frame.current++;
      setOutput(
        TARGET.split("")
          .map((ch, i) => {
            if (ch === " ") return " ";
            if (f >= settleAt[i]) return ch;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join("")
      );
      if (f < settleAt[settleAt.length - 1]) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="absolute inset-0 grid place-items-center px-8">
      <div className="text-center">
        <p className="font-mono text-xl font-medium tracking-[0.15em] text-accent-alt sm:text-3xl">
          {output}
        </p>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.25em] text-ink-600">
          characters resolve left to right
        </p>
      </div>
    </div>
  );
}
