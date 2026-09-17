/** Shared vocabulary for extraction, completion and the coverage report. */
export const SECTION_BRIEFS = {
  cover: ["Cover", "Brand name, brand guidelines title and edition."],
  contents: ["Contents", "Accurate navigation using the supplied final page inventory and page numbers."],
  statement: ["Brand foundations", "Purpose, positioning, audience and a short mission. Use editable draft copy if absent."],
  values: ["Brand values", "Three distinct values, each with a practical behaviour and short explanation."],
  voice: ["Voice & tone", "Voice principles plus three concrete before/after writing examples for different contexts."],
  wordmark: ["Primary logo", "A generous primary mark specimen and usage guidance."],
  logoVariants: ["Logo variants", "Primary, compact and reversed lockups with labels and appropriate backgrounds."],
  logoScale: ["Minimum size", "Digital and print size examples. Label unverified minimum dimensions as proposed."],
  clearspace: ["Clear space", "A diagram defining the exclusion zone with a consistent x unit and explanatory labels."],
  logoMisuse: ["Logo misuse", "Six labelled incorrect examples: stretch, rotate, recolour, effects, clutter, poor contrast."],
  colour: ["Primary palette", "Named swatches, exact HEX and RGB values, dominant/support/accent roles."],
  secondaryColour: ["Supporting palette", "Secondary colour roles and suggested proportions; do not invent approved colours."],
  greyscale: ["Monochrome", "Positive and reversed monochrome specimens and usage instructions."],
  contrast: ["Colour combinations", "Show recommended foreground/background pairs. Do not claim accessibility ratios unless provided."],
  typography: ["Type families", "Display and body type specimens, exact substitute family names and available weights."],
  typeHierarchy: ["Type hierarchy", "Headline, subheading, body and caption examples with size, leading and tracking labels."],
  specimen: ["Type specimen", "Alphabet, numerals, punctuation and a short editorial composition using the brand faces."],
  layout: ["Grid & spacing", "A labelled column-grid diagram with margins, gutters and spacing rhythm."],
  iconography: ["Iconography", "Consistent simple geometric symbols with stroke, size and spacing guidance."],
  photography: ["Photography", "A considered moodboard with subject-matched photographs and art-direction notes."],
  imageTreatment: ["Image treatment", "Crop, focal point, colour treatment and overlay examples with do/don't guidance."],
  inUse: ["Brand applications", "Brand applied to stationery or packaging, constructed with editable panels, marks and copy."],
  digital: ["Digital & social", "Editable social-post and website-header compositions with sample headline and call to action."],
  closing: ["Brand resources", "Asset handoff checklist, file formats and editable brand-owner contact placeholders."],
} as const;
export type Section = keyof typeof SECTION_BRIEFS | "other";
export const SECTION_ORDER = Object.keys(SECTION_BRIEFS) as Exclude<Section, "other">[];
export const FAMILIES = [
  "Inter", "Space Grotesk", "Manrope", "DM Sans", "Work Sans", "Archivo", "Archivo Black", "Archivo Narrow",
  "Bebas Neue", "Anton", "Oswald", "Syne", "Unbounded", "Sora", "Plus Jakarta Sans", "Outfit", "Geist",
  "Playfair Display", "DM Serif Display", "Instrument Serif", "Fraunces", "Cormorant Garamond",
  "Libre Caslon Display", "EB Garamond", "Newsreader", "Bodoni Moda",
  "IBM Plex Mono", "JetBrains Mono", "Space Mono", "DM Mono", "Geist Mono",
] as const;

/** Some display faces do not have an italic axis or multiple weights. */
export function googleFontUrl(family: string) {
  const fixed = ["Archivo Black", "Bebas Neue", "Anton", "DM Serif Display", "Instrument Serif", "Libre Caslon Display"];
  const mono = ["Space Mono", "DM Mono"];
  const max700 = ["Archivo Narrow", "Oswald", "Cormorant Garamond", "EB Garamond", "IBM Plex Mono"];
  const max800 = ["Manrope", "Syne", "Sora", "Plus Jakarta Sans", "Newsreader", "JetBrains Mono"];
  const max = max700.includes(family) ? 700 : max800.includes(family) ? 800 : 900;
  const weights = fixed.includes(family) ? [400] : mono.includes(family) ? (family === "Space Mono" ? [400, 700] : [400, 500]) : [400, 500, 600, 700, 800, 900].filter(w => w <= max);
  const italic = ["Inter", "DM Sans", "Work Sans", "Archivo", "Archivo Narrow", "Playfair Display", "DM Serif Display", "Instrument Serif", "Fraunces", "Cormorant Garamond", "EB Garamond", "Newsreader", "Bodoni Moda", "IBM Plex Mono", "JetBrains Mono", "Space Mono", "DM Mono"].includes(family);
  const axes = italic ? `ital,wght@${[0, 1].flatMap(i => weights.map(w => `${i},${w}`)).join(";")}` : `wght@${weights.join(";")}`;
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:${axes}&display=swap`;
}
