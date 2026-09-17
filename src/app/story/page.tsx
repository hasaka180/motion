import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Story Studio",
  description:
    "Two animated social stories: a surreal landscape and a living Renaissance collage.",
};

export default async function StoryPage({
  searchParams,
}: {
  searchParams: Promise<{ scene?: string | string[] }>;
}) {
  const { scene } = await searchParams;
  return (
    <iframe
      src={
        scene === "creation"
          ? "/story/index.html?scene=creation"
          : "/story/index.html"
      }
      title="Story Studio — animated social story and export controls"
      className="block h-[calc(100svh-150px)] min-h-[760px] w-full border-0 lg:h-svh lg:min-h-[720px]"
      allow="fullscreen"
    />
  );
}
