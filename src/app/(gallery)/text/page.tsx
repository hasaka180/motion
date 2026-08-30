import { DemoCard } from "@/components/site/DemoCard";
import { PageHeader } from "@/components/site/PageHeader";
import { getCategory } from "@/lib/categories";
import { GlitchOnHover } from "@/components/demos/text/GlitchOnHover";
import { StaggerWords } from "@/components/demos/text/StaggerWords";
import { ScrambleText } from "@/components/demos/text/ScrambleText";
import { MaskedLineReveal } from "@/components/demos/text/MaskedLineReveal";
import { GradientShine } from "@/components/demos/text/GradientShine";

export const metadata = { title: "Text Animations" };

export default function Page() {
  const category = getCategory("text")!;

  return (
    <>
      <PageHeader category={category} />
      <div className="grid gap-6 xl:grid-cols-2">
        <DemoCard
          title="Glitch on hover"
          description="Ten displaced copies of the headline, each clipped to its own band or block and randomising on its own clock. Hover the stage to drive it."
          tags={["clip-path", "mix-blend-mode", "MotionValue", "rAF"]}
          stageClassName="h-[380px] xl:col-span-2"
        >
          <GlitchOnHover />
        </DemoCard>

        <DemoCard
          title="Word stagger"
          description="Split on spaces, each word rising out of its own overflow mask."
          tags={["variants", "staggerChildren"]}
          stageClassName="h-[320px]"
        >
          <StaggerWords />
        </DemoCard>

        <DemoCard
          title="Character scramble"
          description="Glyphs cycle until each index settles, driven by one rAF loop."
          tags={["requestAnimationFrame", "no library"]}
          stageClassName="h-[320px]"
        >
          <ScrambleText />
        </DemoCard>

        <DemoCard
          title="Masked line reveal"
          description="Editorial-style entrance — lines slide up and un-rotate behind a mask."
          tags={["overflow-hidden", "rotate", "stagger"]}
          stageClassName="h-[320px]"
        >
          <MaskedLineReveal />
        </DemoCard>

        <DemoCard
          title="Gradient shine"
          description="An oversized gradient clipped to the glyphs and panned forever."
          tags={["background-clip", "backgroundPosition"]}
          stageClassName="h-[320px]"
        >
          <GradientShine />
        </DemoCard>
      </div>
    </>
  );
}
