import { CategoryGrid } from "@/components/site/CategoryGrid";
import { HomeIntro } from "@/components/site/HomeIntro";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <HomeIntro />
      <CategoryGrid />
    </div>
  );
}
