"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { categories } from "@/lib/categories";

export function CategoryGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {categories.map((c, i) => (
        <motion.div
          key={c.slug}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href={`/${c.slug}`}
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 p-5 transition-colors hover:border-ink-600"
          >
            {/* Glow that blooms from the card's own gradient on hover */}
            <div
              className="pointer-events-none absolute -inset-px opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20"
              style={{
                background: `linear-gradient(135deg, ${c.gradient[0]}, ${c.gradient[1]})`,
              }}
            />

            <div className="relative flex items-center justify-between">
              <span
                className="grid size-10 place-items-center rounded-xl text-sm font-semibold text-ink-950"
                style={{
                  background: `linear-gradient(135deg, ${c.gradient[0]}, ${c.gradient[1]})`,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-mono text-xs text-ink-600">{c.count} demos</span>
            </div>

            <h2 className="relative mt-4 text-base font-semibold tracking-tight">
              {c.title}
            </h2>
            <p className="relative mt-2 flex-1 text-sm leading-relaxed text-ink-400">
              {c.blurb}
            </p>

            <span className="relative mt-5 inline-flex items-center gap-1.5 text-sm text-ink-200">
              Open
              <span
                aria-hidden
                className="inline-block transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
