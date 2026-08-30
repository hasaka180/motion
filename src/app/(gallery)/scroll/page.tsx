import { DemoCard } from "@/components/site/DemoCard";
import { PageHeader } from "@/components/site/PageHeader";
import { getCategory } from "@/lib/categories";
import { CinematicTunnel } from "@/components/demos/scroll/CinematicTunnel";
import { RisingImageCards } from "@/components/demos/scroll/RisingImageCards";
import { StickyMediaSections } from "@/components/demos/scroll/StickyMediaSections";
import { ParallaxLayers } from "@/components/demos/scroll/ParallaxLayers";
import { RevealOnView } from "@/components/demos/scroll/RevealOnView";
import { HorizontalScrollSection } from "@/components/demos/scroll/HorizontalScrollSection";

export const metadata = { title: "Scroll Animations" };

export default function Page() {
  const category = getCategory("scroll")!;

  return (
    <>
      <PageHeader category={category} />
      <p className="-mt-4 mb-6 text-sm text-ink-400">
        Each stage owns its own scroll container, so the demos work inline without
        hijacking the page.
      </p>
      <div className="flex flex-col gap-6">
        <DemoCard
          title="Cinematic tunnel"
          description="Scroll flies the camera down a corridor of screens. Scroll velocity — not position — drives the motion blur, so hard scrubbing smears the corridor while the titles stay sharp."
          tags={["CSS 3D", "preserve-3d", "useVelocity", "perspective"]}
          stageClassName="h-[620px]"
        >
          <CinematicTunnel />
        </DemoCard>

        <DemoCard
          title="Sticky media sections"
          description="A pinned clip column beside text that advances with the scrollbar. Clips push each other out vertically while the heading decodes into place."
          tags={["sticky", "useMotionValueEvent", "push swap", "scramble"]}
          stageClassName="h-[520px]"
        >
          <StickyMediaSections />
        </DemoCard>

        <DemoCard
          title="Rising image cards"
          description="A row climbing out of the bottom edge, each card at its own rate so the fan holds at every scroll position. The artwork counter-drifts inside its mask."
          tags={["useScroll", "per-card rate", "mask parallax"]}
          stageClassName="h-[520px]"
        >
          <RisingImageCards />
        </DemoCard>

        <DemoCard
          title="Parallax layers"
          description="One scrollYProgress mapped to three different travel distances."
          tags={["useScroll", "useTransform", "container"]}
          stageClassName="h-[440px]"
        >
          <ParallaxLayers />
        </DemoCard>

        <DemoCard
          title="Reveal on view"
          description="Rows fade, rise and unblur as they cross the container's viewport edge."
          tags={["whileInView", "viewport.root", "margin"]}
          stageClassName="h-[440px]"
        >
          <RevealOnView />
        </DemoCard>

        <DemoCard
          title="Pinned horizontal scroll"
          description="Vertical scroll inside the stage is remapped to horizontal travel."
          tags={["sticky", "useScroll", "x transform"]}
          stageClassName="h-[440px]"
        >
          <HorizontalScrollSection />
        </DemoCard>
      </div>
    </>
  );
}
