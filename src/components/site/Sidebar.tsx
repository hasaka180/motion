"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { categories, totalDemos } from "@/lib/categories";
import { site } from "@/lib/site";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-72 lg:border-r lg:border-ink-800 lg:bg-ink-900/60 lg:backdrop-blur">
      <div className="flex h-full flex-col">
        <div className="border-b border-ink-800 px-6 py-5">
          <Link href="/" className="group inline-flex items-center gap-3">
            <span className="relative grid size-9 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-alt">
              <motion.span
                className="size-3 rounded-[3px] bg-ink-950"
                animate={{ rotate: [0, 90, 90, 0], borderRadius: ["3px", "3px", "9px", "9px"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-[0.2em]">
                {site.wordmark}
                <sup className="ml-0.5 align-super text-[7px] tracking-normal">™</sup>
              </span>
              <span className="block text-xs text-ink-400">{totalDemos} animations</span>
            </span>
          </Link>
        </div>

        {/* Horizontal on mobile, vertical from lg up */}
        <nav className="scroll-thin flex gap-1 overflow-x-auto border-b border-ink-800 px-4 py-3 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:px-3 lg:py-4">
          {categories.map((c, i) => {
            const href = `/${c.slug}`;
            const active = pathname === href;
            return (
              <Link
                key={c.slug}
                href={href}
                className={`relative shrink-0 rounded-lg px-3 py-2 text-sm transition-colors lg:shrink ${
                  active ? "text-ink-50" : "text-ink-400 hover:text-ink-200"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-ink-800"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative flex items-center gap-2.5 whitespace-nowrap">
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{
                      background: active
                        ? `linear-gradient(135deg, ${c.gradient[0]}, ${c.gradient[1]})`
                        : "var(--color-ink-600)",
                    }}
                  />
                  {c.title}
                  <span className="ml-auto hidden text-xs tabular-nums text-ink-600 lg:inline">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </span>
              </Link>
            );
          })}
          <Link
            href="/studio"
            className={`relative shrink-0 rounded-lg px-3 py-2 text-sm transition-colors lg:mt-2 lg:shrink lg:border-t lg:border-ink-800 lg:pt-4 ${
              pathname === "/studio" ? "text-ink-50" : "text-ink-400 hover:text-ink-200"
            }`}
          >
            {pathname === "/studio" && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 rounded-lg bg-ink-800"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative flex items-center gap-2.5 whitespace-nowrap">
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{
                  background:
                    pathname === "/studio"
                      ? "linear-gradient(135deg, #6366f1, #22d3ee)"
                      : "var(--color-ink-600)",
                }}
              />
              Pixel Studio
              <span className="ml-auto hidden font-mono text-[10px] text-ink-600 lg:inline">
                tool
              </span>
            </span>
          </Link>
        </nav>

        <div className="hidden border-t border-ink-800 px-6 py-4 lg:block">
          <a
            href={site.parent.url}
            className="text-xs text-ink-400 transition-colors hover:text-ink-200"
          >
            ↗ {site.parent.name}
          </a>
          <p className="mt-1 text-xs text-ink-600">
            Next.js · Tailwind · Motion
          </p>
        </div>
      </div>
    </aside>
  );
}
