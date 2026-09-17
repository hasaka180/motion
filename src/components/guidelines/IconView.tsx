import type { IconName } from "./types";

export const ICON_NAMES: IconName[] = ["sparkle", "star", "arrow", "heart", "quote", "instagram", "music", "globe", "ticket"];

export function IconView({ name, strokeWidth = 1.4 }: { name: IconName; strokeWidth?: number }) {
  return <svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "sparkle" && <path d="M24 2C25 18 30 23 46 24C30 25 25 30 24 46C23 30 18 25 2 24C18 23 23 18 24 2Z" />}
    {name === "star" && <path d="m24 3 6.2 13.5L45 18l-11 10 3 16-13-8-13 8 3-16L3 18l14.8-1.5Z" />}
    {name === "arrow" && <path d="M7 24h34M27 10l14 14-14 14" />}
    {name === "heart" && <path d="M24 42 6 24C-6 8 16-2 24 12c8-14 30-4 18 12Z" />}
    {name === "quote" && <path d="M6 10h14v14L10 38H4l8-14H6Zm24 0h14v14L34 38h-6l8-14h-6Z" fill="currentColor" stroke="none" />}
    {name === "instagram" && <><rect x="5" y="5" width="38" height="38" rx="11" /><circle cx="24" cy="24" r="9" /><circle cx="35" cy="13" r="1.5" fill="currentColor" /></>}
    {name === "music" && <><path d="M19 35V10l22-5v26M19 17l22-5" /><ellipse cx="12" cy="36" rx="7" ry="5" /><ellipse cx="34" cy="32" rx="7" ry="5" /></>}
    {name === "globe" && <><circle cx="24" cy="24" r="20" /><ellipse cx="24" cy="24" rx="9" ry="20" /><path d="M4 24h40M8 12h32M8 36h32" /></>}
    {name === "ticket" && <><path d="M4 11h40v9a4 4 0 0 0 0 8v9H4v-9a4 4 0 0 0 0-8Z" /><path d="M32 12v4m0 5v5m0 5v5" /></>}
  </svg>;
}
