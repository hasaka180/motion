"use client";

import { motion } from "motion/react";
import { categories, totalDemos } from "@/lib/categories";
import { site } from "@/lib/site";

const line = "An animation repository.";

export function HomeIntro() {
  return (
    <div className="relative mb-14">
      {/* Drifting backdrop */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-0 -z-10 size-72 rounded-full bg-accent/20 blur-[100px]"
        animate={{ x: [0, 60, 0], y: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-ink-400"
      >
        {site.wordmark} — {site.tagline}
      </motion.p>

      <h1 className="max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
        {line.split(" ").map((word, i) => (
          <span key={word} className="mr-[0.25em] inline-block overflow-hidden align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={{ delay: 0.1 + i * 0.09, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mt-5 max-w-xl text-balance text-ink-400"
      >
        {totalDemos} copy-pasteable React components across {categories.length}{" "}
        categories, maintained by{" "}
        <a
          href={site.parent.url}
          className="text-ink-200 underline decoration-ink-600 underline-offset-4 transition-colors hover:decoration-ink-200"
        >
          {site.parent.name}
        </a>
        . Every demo is a single self-contained file — open the stage, hit
        replay, then lift the source.
      </motion.p>
    </div>
  );
}
