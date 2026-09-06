import { DemoCard } from "@/components/site/DemoCard";
import { PageHeader } from "@/components/site/PageHeader";
import { getCategory } from "@/lib/categories";
import { HoverIndexList } from "@/components/demos/hover/HoverIndexList";
import { ParticleShapeField } from "@/components/demos/hover/ParticleShapeField";
import { MagneticButton } from "@/components/demos/hover/MagneticButton";
import { TiltCard } from "@/components/demos/hover/TiltCard";
import { PillNav } from "@/components/demos/hover/PillNav";

export const metadata = { title: "Hover & Micro-interactions" };

export default function Page() {
  const category = getCategory("hover")!;

  return (
    <>
      <PageHeader category={category} />
      <div className="grid gap-6 xl:grid-cols-2">
        <DemoCard
          id="hover/HoverIndexList"
          title="Hover index"
          description="Hovering a row swaps the panel beside it with a directional wipe — the frame enters from whichever way the pointer moved through the list."
          tags={["AnimatePresence", "clip-path", "direction"]}
          stageClassName="h-[480px] xl:col-span-2"
        >
          <HoverIndexList />
        </DemoCard>

        <DemoCard
          id="hover/ParticleShapeField"
          title="Particle scatter"
          description="A pixel shape that blows apart like air under the cursor — pushed outward, stirred by turbulence and lifted, then drifting home when you leave. Click to change shape."
          tags={["canvas", "rAF", "pointer field", "eased particles"]}
          stageClassName="h-[440px] xl:col-span-2"
        >
          <ParticleShapeField />
        </DemoCard>

        <DemoCard
          id="hover/MagneticButton"
          title="Magnetic buttons"
          description="Offset from the pointer, smoothed by a spring, with the label trailing behind."
          tags={["useSpring", "useMotionValue", "parallax"]}
          stageClassName="h-[340px]"
        >
          <MagneticButton />
        </DemoCard>

        <DemoCard
          id="hover/TiltCard"
          title="3D tilt card"
          description="Pointer position drives rotateX/rotateY and the glare highlight together."
          tags={["perspective", "transformStyle", "useSpring"]}
          stageClassName="h-[340px]"
        >
          <TiltCard />
        </DemoCard>

        <DemoCard
          id="hover/PillNav"
          title="Shared-element nav"
          description="Two layoutIds — one for the hover pill, one for the selected pill — so both glide."
          tags={["layoutId", "spring", "hover state"]}
          stageClassName="h-[340px]"
        >
          <PillNav />
        </DemoCard>
      </div>
    </>
  );
}
