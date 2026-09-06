import { DemoCard } from "@/components/site/DemoCard";
import { PageHeader } from "@/components/site/PageHeader";
import { getCategory } from "@/lib/categories";
import { SpinnerSet } from "@/components/demos/loaders/SpinnerSet";
import { ShimmerSkeleton } from "@/components/demos/loaders/ShimmerSkeleton";
import { ProgressRing } from "@/components/demos/loaders/ProgressRing";

export const metadata = { title: "Loaders & Spinners" };

export default function Page() {
  const category = getCategory("loaders")!;

  return (
    <>
      <PageHeader category={category} />
      <div className="grid gap-6 xl:grid-cols-2">
        <DemoCard
          id="loaders/SpinnerSet"
          title="Spinner set"
          description="Orbit, wave, arc and bars — all transform and opacity only, so they stay on the compositor."
          tags={["repeat: Infinity", "delay stagger"]}
          stageClassName="h-[300px]"
        >
          <SpinnerSet />
        </DemoCard>

        <DemoCard
          id="loaders/ProgressRing"
          title="Progress ring"
          description="strokeDashoffset from a motion value, with a numeric readout subscribed to the same source."
          tags={["SVG", "strokeDasharray", "value.on('change')"]}
          stageClassName="h-[300px]"
        >
          <ProgressRing />
        </DemoCard>

        <DemoCard
          id="loaders/ShimmerSkeleton"
          title="Shimmer skeleton"
          description="Placeholder blocks with a highlight sweeping across on a slight per-line delay."
          tags={["gradient sweep", "delay", "loading state"]}
          stageClassName="h-[420px]"
        >
          <ShimmerSkeleton />
        </DemoCard>
      </div>
    </>
  );
}
