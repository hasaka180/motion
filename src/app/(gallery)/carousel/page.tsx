import { DemoCard } from "@/components/site/DemoCard";
import { PageHeader } from "@/components/site/PageHeader";
import { getCategory } from "@/lib/categories";
import { GrayscaleFilmstrip } from "@/components/demos/carousel/GrayscaleFilmstrip";
import { InfiniteMarquee } from "@/components/demos/carousel/InfiniteMarquee";
import { DragCarousel } from "@/components/demos/carousel/DragCarousel";
import { FadeStackCarousel } from "@/components/demos/carousel/FadeStackCarousel";

export const metadata = { title: "Carousels" };

export default function Page() {
  const category = getCategory("carousel")!;

  return (
    <>
      <PageHeader category={category} />
      <div className="flex flex-col gap-6">
        <DemoCard
          id="carousel/GrayscaleFilmstrip"
          title="Grayscale filmstrip"
          description="Each frame is struck as a vertical hairline that opens horizontally into the image. Pans with pointer position, and only the hovered frame carries colour."
          tags={["clip-path", "line reveal", "pointer pan", "grayscale"]}
          stageClassName="h-[460px]"
        >
          <GrayscaleFilmstrip />
        </DemoCard>

        <DemoCard
          id="carousel/InfiniteMarquee"
          title="Infinite marquee"
          description="Duplicate the list once and loop to -50% — the wrap is invisible. Hover to inspect."
          tags={["linear loop", "duplicated track", "mask-image"]}
          stageClassName="h-[320px]"
        >
          <InfiniteMarquee />
        </DemoCard>

        <DemoCard
          id="carousel/DragCarousel"
          title="Drag track"
          description="Pointer-dragged with elastic edges and momentum handoff on release."
          tags={["drag", "dragConstraints", "dragTransition"]}
          stageClassName="h-[380px]"
        >
          <DragCarousel />
        </DemoCard>

        <DemoCard
          id="carousel/FadeStackCarousel"
          title="Auto crossfade"
          description="Advances every four seconds with a progress bar per slide. Hover to pause."
          tags={["AnimatePresence", "popLayout", "timers"]}
          stageClassName="h-[420px]"
        >
          <FadeStackCarousel />
        </DemoCard>
      </div>
    </>
  );
}
