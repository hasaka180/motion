import { PixelStudio } from "@/components/studio/PixelStudio";

export const metadata = {
  title: "Pixel Studio",
  description:
    "Upload a picture, dither it to a pixel grid, and take the code for a scroll-developed version.",
};

export default function Page() {
  return (
    <>
      <header className="mb-10 border-b border-ink-800 pb-8">
        <div
          className="mb-5 h-1 w-16 rounded-full"
          style={{ background: "linear-gradient(90deg, #6366f1, #22d3ee)" }}
        />
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Pixel Studio</h1>
        <p className="mt-3 max-w-2xl text-balance text-ink-400">
          Drop in a picture and it is thresholded through an 8×8 Bayer matrix into
          a grid of ink cells. Each cell carries its own threshold, so scrolling
          brings the picture up in grain rather than fading it in. Tune it, then
          take the code.
        </p>
        <p className="mt-4 font-mono text-xs text-ink-600">
          nothing is uploaded — the image is read in your browser and travels
          inside the generated code
        </p>
      </header>

      <PixelStudio />
    </>
  );
}
