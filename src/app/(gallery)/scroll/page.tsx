import Link from "next/link";
import { DemoCard } from "@/components/site/DemoCard";
import { PageHeader } from "@/components/site/PageHeader";
import { getCategory } from "@/lib/categories";
import { DitheredScrollPhoto } from "@/components/demos/scroll/DitheredScrollPhoto";
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
        hijacking the page. To run the dithered develop on your own picture and
        take the code for it, use the{" "}
        <Link href="/studio" className="text-ink-200 underline underline-offset-4 hover:text-ink-50">
          Pixel Studio
        </Link>
        .
      </p>
      <div className="flex flex-col gap-6">
        <DemoCard
          id="scroll/DitheredScrollPhoto"
          title="Dithered photo develop"
          description="A print coming up in the tray. A JPEG is thresholded through an 8×8 Bayer matrix into ink cells, each holding its own scroll threshold, so the photo develops in grain instead of fading in."
          tags={["canvas", "Bayer dither", "useSpring", "devicePixelRatio"]}
          stageClassName="h-[620px]"
        >
          <DitheredScrollPhoto />
        </DemoCard>

        <DemoCard
          id="scroll/CinematicTunnel"
          title="Cinematic tunnel"
          description="Scroll flies the camera down a corridor of screens. Scroll velocity — not position — drives the motion blur, so hard scrubbing smears the corridor while the titles stay sharp."
          tags={["CSS 3D", "preserve-3d", "useVelocity", "perspective"]}
          stageClassName="h-[620px]"
        >
          <CinematicTunnel />
        </DemoCard>

        <DemoCard
          id="scroll/StickyMediaSections"
          title="Sticky media sections"
          description="A pinned clip column beside text that advances with the scrollbar. Clips push each other out vertically while the heading decodes into place."
          tags={["sticky", "useMotionValueEvent", "push swap", "scramble"]}
          stageClassName="h-[520px]"
        >
          <StickyMediaSections />
        </DemoCard>

        <DemoCard
          id="scroll/RisingImageCards"
          title="Rising image cards"
          description="A row climbing out of the bottom edge, each card at its own rate so the fan holds at every scroll position. The artwork counter-drifts inside its mask."
          tags={["useScroll", "per-card rate", "mask parallax"]}
          stageClassName="h-[520px]"
        >
          <RisingImageCards />
        </DemoCard>

        <DemoCard
          id="scroll/ParallaxLayers"
          title="Parallax layers"
          description="One scrollYProgress mapped to three different travel distances."
          tags={["useScroll", "useTransform", "container"]}
          stageClassName="h-[440px]"
        >
          <ParallaxLayers />
        </DemoCard>

        <DemoCard
          id="scroll/RevealOnView"
          title="Reveal on view"
          description="Rows fade, rise and unblur as they cross the container's viewport edge."
          tags={["whileInView", "viewport.root", "margin"]}
          stageClassName="h-[440px]"
        >
          <RevealOnView />
        </DemoCard>

        <DemoCard
          id="scroll/HorizontalScrollSection"
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
