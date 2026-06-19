// Per-template visual themes for the CV preview. Previously the preview keyed
// its styling off the 9 broad categories, so every template inside a category
// looked identical and the two-column layouts were never actually rendered.
// This gives each of the 55 templates a distinct accent, typography, heading
// treatment, and a real layout (single column, or a left/right sidebar), so the
// rendered CV matches the template the user picked.
//
// Accent colours are applied via inline styles (not Tailwind classes) because
// they're chosen at runtime — Tailwind only emits classes it sees at build time.

export type CvLayout = "single" | "sidebar-left" | "sidebar-right";
export type HeadingKind = "rule" | "band" | "plain" | "gradient" | "hash";
export type FontKind = "serif" | "sans" | "mono";

export interface CvTheme {
  layout: CvLayout;
  font: FontKind;
  fontClass: string;
  accent: string;       // hex
  pageBg: string;       // hex
  pageText: string;     // hex
  mutedText: string;    // hex
  dark: boolean;
  designed: boolean;    // premium structured layout (header band + photo + sidebar cards)
  headingKind: HeadingKind;
  gradientFrom?: string;
  gradientTo?: string;
  container: string;    // tailwind max-w-*
}

interface Spec {
  accent: string;
  font?: FontKind;
  layout?: CvLayout;
  heading?: HeadingKind;
  dark?: boolean;
  designed?: boolean;
  bg?: string;
  text?: string;
  gradient?: [string, string];
}

const FONT_CLASS: Record<FontKind, string> = { serif: "font-serif", sans: "font-sans", mono: "font-mono" };

// id → spec. Layouts mirror the structural intent of each template's prompt.
const SPECS: Record<string, Spec> = {
  // Premium — structured designed layout (header band + photo + sidebar cards)
  "premium-executive": { accent: "#1d4ed8", font: "sans", layout: "sidebar-left", heading: "band", designed: true },
  "premium-emerald": { accent: "#059669", font: "sans", layout: "sidebar-left", heading: "band", designed: true },
  "premium-slate": { accent: "#38bdf8", font: "sans", layout: "sidebar-left", heading: "band", designed: true, dark: true, bg: "#0f172a", text: "#e2e8f0" },
  "premium-burgundy": { accent: "#9f1239", font: "serif", layout: "sidebar-left", heading: "band", designed: true },
  "premium-charcoal": { accent: "#f59e0b", font: "sans", layout: "sidebar-left", heading: "band", designed: true, dark: true, bg: "#1c1c1e", text: "#e5e5e5" },
  "premium-teal": { accent: "#0d9488", font: "sans", layout: "sidebar-left", heading: "band", designed: true },
  "premium-indigo": { accent: "#4f46e5", font: "sans", layout: "sidebar-left", heading: "band", designed: true },

  // Classic — serif, single column, rule headings
  professional: { accent: "#1f3a5f", font: "serif", heading: "rule" },
  traditional: { accent: "#1a1a1a", font: "serif", heading: "rule" },
  chronological: { accent: "#1d5b5b", font: "serif", heading: "rule" },
  functional: { accent: "#6b2737", font: "serif", heading: "plain" },
  combination: { accent: "#36456b", font: "serif", heading: "band" },
  "classic-elegant": { accent: "#7a5c2e", font: "serif", heading: "rule" },

  // Modern — sans
  modern: { accent: "#2563eb", font: "sans", layout: "sidebar-left", heading: "plain" },
  metro: { accent: "#0f172a", font: "sans", heading: "band" },
  sleek: { accent: "#7c3aed", font: "sans", heading: "plain" },
  startup: { accent: "#ea580c", font: "sans", heading: "band" },
  "digital-first": { accent: "#0891b2", font: "sans", layout: "sidebar-left", heading: "plain" },
  "tech-modern": { accent: "#10b981", font: "mono", layout: "sidebar-right", heading: "hash", dark: true, bg: "#0d1117", text: "#c9d1d9" },
  "flat-design": { accent: "#e11d48", font: "sans", heading: "band" },

  // Creative
  creative: { accent: "#ff6b35", font: "sans", heading: "gradient", gradient: ["#ff6b35", "#e84393"], bg: "#fff7f3" },
  portfolio: { accent: "#6d28d9", font: "sans", heading: "plain" },
  artistic: { accent: "#c026d3", font: "sans", heading: "plain" },
  storyteller: { accent: "#b45309", font: "serif", heading: "plain" },
  infographic: { accent: "#2563eb", font: "sans", layout: "sidebar-left", heading: "band" },
  magazine: { accent: "#b91c1c", font: "serif", layout: "sidebar-right", heading: "plain" },
  "brand-identity": { accent: "#0d9488", font: "sans", heading: "band" },

  // Industry
  engineering: { accent: "#475569", font: "sans", layout: "sidebar-left", heading: "band" },
  healthcare: { accent: "#0e7490", font: "sans", heading: "plain" },
  legal: { accent: "#1e293b", font: "serif", heading: "rule" },
  finance: { accent: "#15803d", font: "sans", heading: "band" },
  "education-sector": { accent: "#4338ca", font: "serif", heading: "rule" },
  marketing: { accent: "#db2777", font: "sans", layout: "sidebar-right", heading: "plain" },
  hospitality: { accent: "#b45309", font: "sans", heading: "plain" },
  government: { accent: "#0f1b3d", font: "sans", heading: "band" },

  // Academic — serif
  "academic-cv": { accent: "#1a1a2e", font: "serif", heading: "rule" },
  research: { accent: "#334155", font: "sans", layout: "sidebar-left", heading: "plain" },
  "phd-candidate": { accent: "#3730a3", font: "serif", heading: "rule" },
  postdoc: { accent: "#0f766e", font: "serif", heading: "rule" },
  professor: { accent: "#6b2737", font: "serif", heading: "rule" },

  // Executive — premium, some dark
  executive: { accent: "#c9a84c", font: "serif", heading: "plain", dark: true, bg: "#0a0a0a", text: "#e8e0cc" },
  "c-suite": { accent: "#c9a84c", font: "serif", heading: "plain", dark: true, bg: "#111111", text: "#e8e0cc" },
  "board-director": { accent: "#1e293b", font: "serif", heading: "rule" },
  "senior-manager": { accent: "#334155", font: "sans", heading: "band" },
  consultant: { accent: "#1d4ed8", font: "sans", layout: "sidebar-right", heading: "plain" },
  entrepreneur: { accent: "#ea580c", font: "sans", heading: "band" },

  // Minimalist — sparse
  minimal: { accent: "#404040", font: "sans", heading: "plain" },
  zen: { accent: "#6b7280", font: "sans", heading: "plain", bg: "#fafaf9" },
  "one-page": { accent: "#404040", font: "sans", layout: "sidebar-left", heading: "plain" },
  swiss: { accent: "#dc2626", font: "sans", heading: "plain" },
  "clean-slate": { accent: "#171717", font: "sans", heading: "plain" },

  // Regional
  europass: { accent: "#003399", font: "sans", layout: "sidebar-left", heading: "band" },
  "uk-standard": { accent: "#1e293b", font: "sans", heading: "plain" },
  nordic: { accent: "#2563eb", font: "sans", heading: "plain" },
  australian: { accent: "#15803d", font: "sans", heading: "band" },
  canadian: { accent: "#d80621", font: "sans", heading: "plain" },

  // Specialty
  "career-change": { accent: "#7c3aed", font: "sans", heading: "band" },
  freelancer: { accent: "#ea580c", font: "sans", heading: "plain" },
  "military-transition": { accent: "#4d5320", font: "sans", heading: "band" },
  internship: { accent: "#16a34a", font: "sans", heading: "plain" },
  "remote-worker": { accent: "#0891b2", font: "sans", layout: "sidebar-left", heading: "plain" },
  "volunteer-focused": { accent: "#0d9488", font: "sans", heading: "plain" },
};

const FALLBACK: Spec = { accent: "#1f3a5f", font: "serif", heading: "rule" };

export function getCvTheme(templateId?: string): CvTheme {
  const s = (templateId && SPECS[templateId]) || FALLBACK;
  const font = s.font ?? "sans";
  const dark = s.dark ?? false;
  return {
    layout: s.layout ?? "single",
    font,
    fontClass: FONT_CLASS[font],
    accent: s.accent,
    pageBg: s.bg ?? (dark ? "#0a0a0a" : "#ffffff"),
    pageText: s.text ?? (dark ? "#e5e5e5" : "#1f2937"),
    mutedText: dark ? "#a3a3a3" : "#6b7280",
    dark,
    designed: s.designed ?? false,
    headingKind: s.heading ?? "plain",
    gradientFrom: s.gradient?.[0],
    gradientTo: s.gradient?.[1],
    container: s.layout && s.layout !== "single" ? "max-w-4xl" : "max-w-3xl",
  };
}
