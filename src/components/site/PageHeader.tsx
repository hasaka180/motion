import type { Category } from "@/lib/categories";

export function PageHeader({ category }: { category: Category }) {
  return (
    <header className="mb-10 border-b border-ink-800 pb-8">
      <div
        className="mb-5 h-1 w-16 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${category.gradient[0]}, ${category.gradient[1]})`,
        }}
      />
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {category.title}
      </h1>
      <p className="mt-3 max-w-2xl text-balance text-ink-400">{category.blurb}</p>
      <p className="mt-4 font-mono text-xs text-ink-600">
        {category.count} demos · hover a stage to interact · press Replay to re-run
      </p>
    </header>
  );
}
