"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { posters } from "@/components/demos/shared/posters";

const COLS = 32;
const ROWS = 14;
const TILES = COLS * ROWS;

const TILE_DURATION = 0.5;
/** Delay across the full diagonal, in seconds. */
const SWEEP = 0.85;

const FRAMES = [2, 13, 5, 9, 0];

/**
 * Each tile carries its own slice of the *incoming* frame: one background
 * image blown up to grid size and offset to that cell, so at scale 1 the
 * tiles reassemble the picture exactly. That is what makes this a dissolve
 * rather than a shutter — the image builds out of the mesh instead of being
 * uncovered behind it.
 */
function slice(col: number, row: number, background: string) {
  return {
    backgroundImage: background,
    backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
    backgroundPosition: `${(col / (COLS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`,
  };
}

export function PixelDissolve() {
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  /** Remounts the grid so tiles snap back to scale 0 without animating. */
  const [pass, setPass] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const next = (index + 1) % FRAMES.length;

  const advance = () => {
    if (busy) return;
    setBusy(true);
    // The grid finishes when the last tile on the diagonal lands. Tiles are
    // driven by per-tile delays rather than an orchestrator, so the completion
    // point is arithmetic, not a callback race across 448 elements.
    timer.current = setTimeout(
      () => {
        setIndex(next);
        setPass((n) => n + 1);
        setBusy(false);
      },
      (SWEEP + TILE_DURATION) * 1000 + 40
    );
  };

  return (
    <div
      className="absolute inset-0 cursor-pointer select-none overflow-hidden bg-black"
      onClick={advance}
    >
      {/* Current frame, full bleed */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: posters[FRAMES[index]].background }}
      />

      {/* Incoming frame, sliced across the grid */}
      <div
        key={pass}
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        }}
      >
        {Array.from({ length: TILES }).map((_, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          // Normalised so the front stays at a constant angle whatever the
          // stage aspect, instead of skewing with the cell count.
          const diagonal = (col / (COLS - 1) + row / (ROWS - 1)) / 2;

          return (
            <motion.div
              key={i}
              style={{
                ...slice(col, row, posters[FRAMES[next]].background),
                willChange: "transform",
              }}
              initial={{ scale: 0 }}
              animate={{ scale: busy ? 1 : 0 }}
              transition={{
                duration: TILE_DURATION,
                ease: [0.16, 1, 0.3, 1],
                delay: busy ? diagonal * SWEEP : 0,
              }}
            />
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
        <span className="font-display text-3xl leading-none tracking-tight text-white mix-blend-difference">
          {posters[FRAMES[index]].label.toUpperCase()}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white mix-blend-difference">
          {String(index + 1).padStart(2, "0")} / {String(FRAMES.length).padStart(2, "0")} · click
        </span>
      </div>
    </div>
  );
}
