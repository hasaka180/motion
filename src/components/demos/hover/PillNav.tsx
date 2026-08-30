"use client";

import { useState } from "react";
import { motion } from "motion/react";

const ITEMS = ["Overview", "Pricing", "Changelog", "Docs"];

/** One shared layoutId makes the pill glide between items instead of popping. */
export function PillNav() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState(0);

  return (
    <div className="absolute inset-0 grid place-items-center px-6">
      <div className="flex flex-col items-center gap-10">
        <nav
          className="flex rounded-full border border-ink-800 bg-ink-900 p-1.5"
          onPointerLeave={() => setHovered(null)}
        >
          {ITEMS.map((item, i) => (
            <button
              key={item}
              onPointerEnter={() => setHovered(i)}
              onClick={() => setSelected(i)}
              className={`relative rounded-full px-4 py-2 text-sm transition-colors ${
                selected === i ? "text-ink-950" : "text-ink-400 hover:text-ink-100"
              }`}
            >
              {hovered === i && selected !== i && (
                <motion.span
                  layoutId="pill-hover"
                  className="absolute inset-0 rounded-full bg-ink-800"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              {selected === i && (
                <motion.span
                  layoutId="pill-active"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-accent-soft to-accent-alt"
                  transition={{ type: "spring", stiffness: 340, damping: 30 }}
                />
              )}
              <span className="relative">{item}</span>
            </button>
          ))}
        </nav>

        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-600">
          hover to preview · click to select
        </p>
      </div>
    </div>
  );
}
