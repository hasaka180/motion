import { GuidelinesLoader } from "@/components/guidelines/GuidelinesLoader";

export const metadata = {
  title: "Guidelines Builder",
  description:
    "Build a client's brand guidelines from a starter deck: swap the palette, drop in photography, arrange the pages, print to PDF.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-[1600px] px-6 py-10 sm:px-8">
      <header className="mb-8 border-b border-ink-800 pb-6">
        <div
          className="mb-5 h-1 w-16 rounded-full"
          style={{ background: "linear-gradient(90deg, #b6a6f6, #d4ff5b)" }}
        />
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Guidelines Builder</h1>
        <p className="mt-3 max-w-2xl text-balance text-ink-400">
          A brand book for each client, started from a template — five built in, or one
          traced from a reference. Every page paints from the client&apos;s palette slots,
          so changing a colour changes the whole deck. Drop photography straight onto a
          page, drag anything into place — it snaps to the page and to its neighbours —
          then print the deck to PDF at full size.
        </p>
        <p className="mt-4 font-mono text-xs text-ink-600">
          decks live in this browser only — export JSON to move one, print to PDF to send
          one · references are read by a vision model when the host has a key, and traced
          locally when it doesn&apos;t
        </p>
      </header>

      <GuidelinesLoader />
    </div>
  );
}
