"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const VIEWS = [
  { title: "Inbox", body: "38 threads, 4 unread." },
  { title: "Thread", body: "Re: motion spec — 12 replies." },
  { title: "Message", body: "Attached the revised easing curve." },
];

/** Push/pop stack: direction flips the enter and exit offsets. */
export function RouteStack() {
  const [[index, dir], setState] = useState<[number, number]>([0, 1]);

  const go = (next: number) => {
    if (next < 0 || next >= VIEWS.length) return;
    setState([next, next > index ? 1 : -1]);
  };

  const view = VIEWS[index];

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="flex items-center justify-between border-b border-ink-800 px-5 py-3">
        <button
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className="rounded-lg px-2 py-1 text-sm text-ink-200 disabled:opacity-30"
        >
          ← Back
        </button>
        <span className="font-mono text-xs text-ink-600">
          {index + 1} / {VIEWS.length}
        </span>
        <button
          onClick={() => go(index + 1)}
          disabled={index === VIEWS.length - 1}
          className="rounded-lg px-2 py-1 text-sm text-ink-200 disabled:opacity-30"
        >
          Next →
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout" custom={dir}>
          <motion.div
            key={index}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: `${d * 100}%`, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: `${d * -35}%`, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 grid place-items-center bg-ink-950 p-8 text-center"
          >
            <div>
              <h4 className="text-2xl font-semibold tracking-tight">{view.title}</h4>
              <p className="mt-2 text-sm text-ink-400">{view.body}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
