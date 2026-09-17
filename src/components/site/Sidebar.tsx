"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { categories, totalDemos } from "@/lib/categories";
import { site } from "@/lib/site";

/**
 * From lg up the sidebar is a narrow rail — the mark, a dot and number per
 * category, a dot per tool — and opens into the full menu on click. The open
 * menu lays over the page rather than pushing it, so the page only ever
 * reserves the rail's width and nothing reflows when you open it. Below lg
 * it stays the horizontal strip.
 */

const TOOLS = [
  { href: "/studio", label: "Pixel Studio", color: "linear-gradient(135deg, #6366f1, #22d3ee)" },
  { href: "/story", label: "Story Studio", color: "#dd91ab" },
  { href: "/guidelines", label: "Guidelines Builder", color: "#b6a6f6" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Labels show on the strip (mobile) always, and on the rail only when open.
  const label = open ? "lg:inline" : "lg:hidden";
  const row = open ? "lg:justify-start" : "lg:justify-center";

  const item = (href: string, active: boolean, dot: string, text: string, meta: string, className = "") => (
    <Link
      key={href}
      href={href}
      title={text}
      aria-current={active ? "page" : undefined}
      onClick={() => setOpen(false)}
      className={`relative shrink-0 rounded-lg px-3 py-2 text-sm transition-colors lg:shrink ${
        active ? "text-ink-50" : "text-ink-400 hover:text-ink-200"
      } ${className}`}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-lg bg-ink-800"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      <span className={`relative flex items-center gap-2.5 whitespace-nowrap ${row}`}>
        <span
          className="size-1.5 shrink-0 rounded-full"
          style={{ background: active ? dot : "var(--color-ink-600)" }}
        />
        <span className={label}>{text}</span>
        <span className={`ml-auto hidden font-mono text-[10px] tabular-nums text-ink-600 ${label}`}>{meta}</span>
        {/* On the closed rail the number stands in for the name. */}
        {!open && (
          <span className="hidden font-mono text-[10px] tabular-nums text-ink-600 lg:inline">{meta}</span>
        )}
      </span>
    </Link>
  );

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 hidden bg-ink-950/50 backdrop-blur-[2px] lg:block"
        />
      )}

      <aside
        onClick={() => { if (!open) setOpen(true); }}
        className={`lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:border-r lg:border-ink-800 lg:bg-ink-900/80 lg:backdrop-blur lg:transition-[width] lg:duration-200 lg:ease-out ${
          open ? "lg:w-72 lg:shadow-2xl lg:shadow-black/40" : "lg:w-18 lg:cursor-pointer"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className={`flex items-center gap-3 border-b border-ink-800 px-6 py-5 ${open ? "" : "lg:justify-center lg:px-0"}`}>
            <Link href="/" className="group inline-flex items-center gap-3" onClick={(e) => { e.stopPropagation(); setOpen(false); }}>
              <span className="relative grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-alt">
                <motion.span
                  className="size-3 rounded-[3px] bg-ink-950"
                  animate={{ rotate: [0, 90, 90, 0], borderRadius: ["3px", "3px", "9px", "9px"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              </span>
              <span className={`leading-tight ${label}`}>
                <span className="block text-sm font-semibold tracking-[0.2em]">
                  {site.wordmark}
                  <sup className="ml-0.5 align-super text-[7px] tracking-normal">™</sup>
                </span>
                <span className="block text-xs text-ink-400">{totalDemos} animations</span>
              </span>
            </Link>
            <button
              type="button"
              aria-expanded={open}
              aria-label={open ? "Collapse menu" : "Expand menu"}
              onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
              className={`ml-auto hidden size-7 place-items-center rounded-md border border-ink-700 text-ink-400 transition-colors hover:border-ink-500 hover:text-ink-50 lg:grid ${open ? "" : "lg:hidden"}`}
            >
              <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M10 3 5 8l5 5" />
              </svg>
            </button>
          </div>

          <nav
            aria-label="Sections"
            className="scroll-thin flex gap-1 overflow-x-auto border-b border-ink-800 px-4 py-3 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:px-3 lg:py-4"
          >
            {categories.map((c, i) =>
              item(`/${c.slug}`, pathname === `/${c.slug}`, `linear-gradient(135deg, ${c.gradient[0]}, ${c.gradient[1]})`, c.title, String(i + 1).padStart(2, "0")),
            )}
            <span className="hidden lg:mt-2 lg:block lg:border-t lg:border-ink-800 lg:pt-2" aria-hidden="true" />
            {TOOLS.map((t) => item(t.href, pathname === t.href, t.color, t.label, "tool"))}
          </nav>

          <div className={`hidden border-t border-ink-800 px-6 py-4 lg:block ${open ? "" : "lg:hidden"}`}>
            <a href={site.parent.url} className="text-xs text-ink-400 transition-colors hover:text-ink-200">
              ↗ {site.parent.name}
            </a>
            <p className="mt-1 text-xs text-ink-600">Next.js · Tailwind · Motion</p>
          </div>
        </div>
      </aside>
    </>
  );
}
