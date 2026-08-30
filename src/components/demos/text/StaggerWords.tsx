"use client";

import { motion } from "motion/react";

const TEXT = "Every word arrives a beat after the last, so the sentence reads itself.";

/** Word-by-word rise out of an overflow mask. */
export function StaggerWords() {
  return (
    <div className="absolute inset-0 grid place-items-center px-10">
      <motion.p
        className="max-w-lg text-center text-2xl font-medium leading-snug tracking-tight sm:text-3xl"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      >
        {TEXT.split(" ").map((word, i) => (
          <span key={i} className="mr-[0.28em] inline-block overflow-hidden align-bottom">
            <motion.span
              className="inline-block"
              variants={{
                hidden: { y: "110%", opacity: 0 },
                show: {
                  y: 0,
                  opacity: 1,
                  transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
                },
              }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </motion.p>
    </div>
  );
}
