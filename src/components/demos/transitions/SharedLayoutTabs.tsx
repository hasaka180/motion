"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const TABS = [
  { id: "design", label: "Design", body: "Tokens, components, then screens — in that order." },
  { id: "build", label: "Build", body: "Typed props, no magic strings, tests on the seams." },
  { id: "ship", label: "Ship", body: "Behind a flag first. Widen once the graphs are boring." },
];

/** layoutId indicator + AnimatePresence mode="wait" for the panel swap. */
export function SharedLayoutTabs() {
  const [active, setActive] = useState(TABS[0].id);
  const tab = TABS.find((t) => t.id === active)!;

  return (
    <div className="absolute inset-0 grid place-items-center px-8">
      <div className="w-full max-w-md">
        <div className="flex gap-6 border-b border-ink-800">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`relative pb-3 text-sm transition-colors ${
                active === t.id ? "text-ink-50" : "text-ink-400 hover:text-ink-200"
              }`}
            >
              {t.label}
              {active === t.id && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute -bottom-px left-0 h-0.5 w-full rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="relative mt-6 h-28">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <h4 className="text-xl font-semibold tracking-tight">{tab.label}</h4>
              <p className="mt-2 text-sm text-ink-400">{tab.body}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
