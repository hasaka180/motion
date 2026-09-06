import { DemoCard } from "@/components/site/DemoCard";
import { PageHeader } from "@/components/site/PageHeader";
import { getCategory } from "@/lib/categories";
import { CounterPreloader } from "@/components/demos/intro/CounterPreloader";
import { CurtainReveal } from "@/components/demos/intro/CurtainReveal";
import { LogoDrawIntro } from "@/components/demos/intro/LogoDrawIntro";

export const metadata = { title: "Intro Animations" };

export default function Page() {
  const category = getCategory("intro")!;

  return (
    <>
      <PageHeader category={category} />
      <div className="flex flex-col gap-6">
        <DemoCard
          id="intro/CounterPreloader"
          title="Counter preloader"
          description="Counts to 100, then the loader lifts off the page it was covering."
          tags={["animate()", "useTransform", "AnimatePresence"]}
          stageClassName="h-[420px]"
        >
          <CounterPreloader />
        </DemoCard>

        <DemoCard
          id="intro/CurtainReveal"
          title="Sequential curtain"
          description="Six columns clear the stage one after another, wiping the content in."
          tags={["stagger", "transform", "ease-in-out-quart"]}
          stageClassName="h-[420px]"
        >
          <CurtainReveal />
        </DemoCard>

        <DemoCard
          id="intro/LogoDrawIntro"
          title="Logo draw"
          description="An SVG stroke draws itself with pathLength, handing off to a masked wordmark."
          tags={["pathLength", "SVG", "letter stagger"]}
          stageClassName="h-[420px]"
        >
          <LogoDrawIntro />
        </DemoCard>
      </div>
    </>
  );
}
