import type { Metadata } from "next";
import { Archivo_Black, Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Sidebar } from "@/components/site/Sidebar";
import { site } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});
const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description:
    "Darwin is a categorised repository of production-ready React animations: hero sections, intros, text effects, carousels, scroll motion and page transitions.",
  openGraph: {
    title: `${site.name} — ${site.tagline}`,
    description:
      "A categorised repository of production-ready React animations, by thedarwin.co.",
    url: site.url,
    siteName: site.name,
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${archivoBlack.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Sidebar />
        <main className="lg:pl-72">{children}</main>
      </body>
    </html>
  );
}
