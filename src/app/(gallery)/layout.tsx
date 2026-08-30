export default function GalleryLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-14 sm:px-10">{children}</div>
  );
}
