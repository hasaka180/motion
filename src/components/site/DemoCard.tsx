import { readFileSync } from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import { DemoFrame } from "@/components/site/DemoFrame";
import { getPrompt } from "@/lib/prompts";

type Props = {
  /**
   * The demo's path under src/components/demos, without the extension —
   * e.g. "scroll/ParallaxLayers". Used to find both the source file and the
   * prompt that produced it.
   */
  id: string;
  title: string;
  description: string;
  tags?: string[];
  stageClassName?: string;
  children: ReactNode;
};

const DEMOS_DIR = path.join(process.cwd(), "src", "components", "demos");

/**
 * Server half of the card: every route here is prerendered, so the demo's own
 * source is read off disk at build time and shipped as a string. That means
 * the code on the page is always the code that ran — there is no second copy
 * to keep in sync.
 */
function readSource(id: string): string | undefined {
  try {
    return readFileSync(path.join(DEMOS_DIR, `${id}.tsx`), "utf8");
  } catch {
    // A renamed or missing demo should cost the card its Code tab, not the
    // whole build.
    return undefined;
  }
}

export function DemoCard({ id, children, ...rest }: Props) {
  return (
    <DemoFrame
      {...rest}
      prompt={getPrompt(id)}
      source={readSource(id)}
      sourcePath={`${id}.tsx`}
    >
      {children}
    </DemoFrame>
  );
}
