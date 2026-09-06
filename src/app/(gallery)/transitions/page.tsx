import { DemoCard } from "@/components/site/DemoCard";
import { PageHeader } from "@/components/site/PageHeader";
import { getCategory } from "@/lib/categories";
import { SharedLayoutTabs } from "@/components/demos/transitions/SharedLayoutTabs";
import { PixelDissolve } from "@/components/demos/transitions/PixelDissolve";
import { SlatTransition } from "@/components/demos/transitions/SlatTransition";
import { ModalTransition } from "@/components/demos/transitions/ModalTransition";
import { RouteStack } from "@/components/demos/transitions/RouteStack";

export const metadata = { title: "Page Transitions" };

export default function Page() {
  const category = getCategory("transitions")!;

  return (
    <>
      <PageHeader category={category} />
      <div className="grid gap-6 xl:grid-cols-2">
        <DemoCard
          id="transitions/PixelDissolve"
          title="Pixel dissolve"
          description="A grid of tiles assembles the incoming frame along a diagonal front. Each tile carries its own slice of the image, so the picture builds out of the mesh rather than being uncovered behind it."
          tags={["background-position", "diagonal stagger", "448 tiles"]}
          stageClassName="h-[440px] xl:col-span-2"
        >
          <PixelDissolve />
        </DemoCard>

        <DemoCard
          id="transitions/SlatTransition"
          title="Slat wipe"
          description="Columns sweep down to cover, the view swaps while hidden, then the same columns keep travelling to uncover — one continuous pass, not a curtain reopening."
          tags={["stagger", "phase machine", "remount reset"]}
          stageClassName="h-[420px] xl:col-span-2"
        >
          <SlatTransition />
        </DemoCard>

        <DemoCard
          id="transitions/SharedLayoutTabs"
          title="Shared-layout tabs"
          description="A layoutId underline glides between tabs while the panel swaps out before the next one enters."
          tags={["layoutId", "AnimatePresence", "mode: wait"]}
          stageClassName="h-[340px]"
        >
          <SharedLayoutTabs />
        </DemoCard>

        <DemoCard
          id="transitions/ModalTransition"
          title="Spring modal"
          description="Backdrop fade plus a spring-scaled dialog. Dismiss on backdrop click or Escape."
          tags={["AnimatePresence", "spring", "backdrop-blur"]}
          stageClassName="h-[340px]"
        >
          <ModalTransition />
        </DemoCard>

        <DemoCard
          id="transitions/RouteStack"
          title="Push / pop route stack"
          description="Direction is stored alongside the index, so custom variants flip the enter and exit offsets."
          tags={["custom variants", "direction", "popLayout"]}
          stageClassName="h-[340px]"
        >
          <RouteStack />
        </DemoCard>
      </div>
    </>
  );
}
