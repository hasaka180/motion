import type { CSSProperties } from "react";
import type { Poster } from "./posters";

/** Fractal-noise grain, inlined so the tiles read as film rather than flat CSS. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function MediaTile({
  poster,
  className = "",
  style,
}: {
  poster: Poster;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: poster.background, ...style }}
      role="img"
      aria-label={poster.label}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />
    </div>
  );
}
