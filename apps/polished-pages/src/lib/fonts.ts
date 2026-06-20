// Modern recruitment-grade typefaces, bundled locally (no external requests) so
// they render identically in the browser, in screenshots, and in the PDF.
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/playfair-display/800.css";
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";

export type FontId = "inter" | "manrope" | "jakarta" | "dmsans" | "playfair" | "fraunces" | "mono";

export const FONT_FAMILY: Record<FontId, string> = {
  inter: "'Inter', system-ui, -apple-system, sans-serif",
  manrope: "'Manrope', system-ui, -apple-system, sans-serif",
  jakarta: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  dmsans: "'DM Sans', system-ui, -apple-system, sans-serif",
  playfair: "'Playfair Display', Georgia, serif",
  fraunces: "'Fraunces', Georgia, serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

// Display family for big headings, paired per template (kept separate so a
// template can set a serif display name over a sans body, etc.).
export const DISPLAY_FAMILY: Record<string, string> = FONT_FAMILY;
