"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/** Backdrop fade + spring-scaled dialog, dismissable on backdrop or Escape. */
export function ModalTransition() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="absolute inset-0 grid place-items-center">
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="rounded-full bg-ink-50 px-6 py-2.5 text-sm font-medium text-ink-950"
      >
        Open dialog
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
            />

            <motion.div
              role="dialog"
              aria-modal
              className="absolute mx-6 w-full max-w-sm rounded-2xl border border-ink-700 bg-ink-900 p-6 shadow-2xl"
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
              <h4 className="text-lg font-semibold tracking-tight">Delete project?</h4>
              <p className="mt-2 text-sm text-ink-400">
                This removes every environment and its history. There is no undo.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-ink-700 px-4 py-2 text-sm text-ink-200 hover:border-ink-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
