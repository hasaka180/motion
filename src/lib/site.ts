/**
 * Site identity. This app is intended to run on a subdomain of thedarwin.co —
 * set NEXT_PUBLIC_SITE_URL in the environment to override the default.
 */
export const site = {
  name: "Darwin",
  wordmark: "DARWIN",
  tagline: "Animation repository",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://motion.thedarwin.co",
  parent: {
    name: "thedarwin.co",
    url: "https://thedarwin.co",
  },
} as const;
