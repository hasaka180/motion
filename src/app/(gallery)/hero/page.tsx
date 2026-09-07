import { DemoCard } from "@/components/site/DemoCard";
import { PageHeader } from "@/components/site/PageHeader";
import { getCategory } from "@/lib/categories";
import { BlobKidHero } from "@/components/demos/hero/BlobKidHero";
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
          id="hero/BlobKidHero"
          title="Blob kid"
          description="A soft toy character raymarched as one signed distance field — thirteen capsules welded with a smooth minimum, which is what fuses the limbs into the body with a crease instead of a seam. It walks to your pointer, then turns and plays."
          tags={["WebGL2", "raymarched SDF", "smooth minimum", "no dependencies"]}
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
