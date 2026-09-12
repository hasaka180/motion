import { DemoCard } from "@/components/site/DemoCard";
import { PageHeader } from "@/components/site/PageHeader";
import { getCategory } from "@/lib/categories";
import { BlobKidHero } from "@/components/demos/hero/BlobKidHero";
import { AsciiDecodeHero } from "@/components/demos/hero/AsciiDecodeHero";
import { DarwinNegativeHero } from "@/components/demos/hero/DarwinNegativeHero";
import { MacDesktopHero } from "@/components/demos/hero/MacDesktopHero";
import { ScatteredMediaHero } from "@/components/demos/hero/ScatteredMediaHero";
import { SpotlightHero } from "@/components/demos/hero/SpotlightHero";
import { GradientMeshHero } from "@/components/demos/hero/GradientMeshHero";
import { SplitRevealHero } from "@/components/demos/hero/SplitRevealHero";

export const metadata = { title: "Hero Sections" };

export default function Page() {
  const category = getCategory("hero")!;

  return (
    <>
      <PageHeader category={category} />
      <div className="flex flex-col gap-6">
        <DemoCard
          id="hero/MacDesktopHero"
          sourceFiles={["hero/MacDesktopHero.module.css", "hero/desktop-flow.ts"]}
          title="Desktop — a space for ideas"
          description="A macOS-inspired portfolio over slowly flowing blue surfaces with luminous edges. Click folders to open page windows, drag them around, or minimize them to the frosted dock."
          tags={["desktop interface", "folder navigation", "draggable windows", "application dock"]}
          stageClassName="h-[660px] sm:h-[700px]"
        >
          <MacDesktopHero />
        </DemoCard>

        <DemoCard
          id="hero/DarwinNegativeHero"
          sourceFiles={["hero/DarwinNegativeHero.module.css", "hero/darwin-negative/trail.ts", "hero/darwin-negative/reveal.ts"]}
          title="Vector handwriting — botanical negative"
          description="A supplied handwriting vector becomes a growing negative-image mask and hands directly into an ivory welcome screen, where letters carve into the blank surface before black ink blooms from scattered points with irregular, spreading edges."
          tags={["custom SVG handwriting", "negative mask", "zoom-through transition", "scattered ink reveal"]}
          stageClassName="h-[560px] sm:h-[680px]"
        >
          <DarwinNegativeHero />
        </DemoCard>

        <DemoCard
          id="hero/AsciiDecodeHero"
          sourceFiles={["hero/AsciiDecodeHero.module.css", "hero/ascii-field/renderer.ts"]}
          title="ASCII decoding field"
          description="A dark sculptural ribbon twists through a character grid while oversized red type decodes into place. Move your pointer to shift the form."
          tags={["Canvas 2D", "character decoding", "pixel deformation", "pointer parallax"]}
          stageClassName="h-[620px] sm:h-[680px]"
        >
          <AsciiDecodeHero />
        </DemoCard>

        <DemoCard
          id="hero/BlobKidHero"
          sourceFiles={["hero/blob-kid/forms.ts", "hero/blob-kid/shaders.ts", "hero/blob-kid/renderer.ts"]}
          title="Blob kid"
          description="A softly sculpted character with seven possibilities. Choose a form and watch it melt, flow, and reform in a pastel studio. Drag to orbit, or inspect the silhouette from every side."
          tags={["WebGL2", "liquid transformations", "7 forms", "no dependencies"]}
          stageClassName="h-[620px]"
        >
          <BlobKidHero />
        </DemoCard>

        <DemoCard
          id="hero/ScatteredMediaHero"
          title="Scattered media constellation"
          description="Thumbnails ring a centred wordmark, drifting on idle and swinging on pointer parallax at three different depths."
          tags={["useSpring", "depth parallax", "layered transforms"]}
          stageClassName="h-[620px]"
        >
          <ScatteredMediaHero />
        </DemoCard>

        <DemoCard
          id="hero/SpotlightHero"
          title="Cursor spotlight"
          description="A radial gradient tracks the pointer over a masked grid while the headline rises into place."
          tags={["useMotionValue", "useMotionTemplate", "mask-image"]}
          stageClassName="h-[440px]"
        >
          <SpotlightHero />
        </DemoCard>

        <DemoCard
          id="hero/GradientMeshHero"
          title="Gradient mesh"
          description="Three blurred blobs on independent loops behind a frosted glass panel."
          tags={["keyframes", "blur", "backdrop-filter"]}
          stageClassName="h-[440px]"
        >
          <GradientMeshHero />
        </DemoCard>

        <DemoCard
          id="hero/SplitRevealHero"
          title="Split curtain reveal"
          description="Two panels retract from the centre seam, then the headline scales down into focus."
          tags={["transform", "staggered delay", "cubic-bezier"]}
          stageClassName="h-[440px]"
        >
          <SplitRevealHero />
        </DemoCard>
      </div>
    </>
  );
}
