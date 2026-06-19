import type { FontId } from "@/lib/fonts";

// The flagship premium catalog — a small set of recruitment-grade designs,
// organized into collections, replacing the long tail of average templates.
export type PremiumCollection = "executive" | "technology" | "nordic" | "consulting" | "corporate";
export type PremiumLayout = "sidebar" | "single" | "twocol";

export interface PremiumTemplate {
  id: string;
  name: string;
  collection: PremiumCollection;
  layout: PremiumLayout;
  font: FontId;
  accent: string;
  dark?: boolean;
  blurb: string;
}

export const PREMIUM_COLLECTIONS: { id: PremiumCollection; label: string; blurb: string }[] = [
  { id: "executive", label: "Executive", blurb: "Restrained, authoritative layouts for senior and board-level roles." },
  { id: "technology", label: "Technology", blurb: "Crisp, modern designs for engineering, product and data roles." },
  { id: "nordic", label: "Nordic Professional", blurb: "Airy, understated Scandinavian designs." },
  { id: "consulting", label: "Consulting", blurb: "Structured, sharp layouts for advisory and strategy roles." },
  { id: "corporate", label: "Modern Corporate", blurb: "Clean single-column designs, optimized for ATS parsing." },
];

export const PREMIUM_TEMPLATES: PremiumTemplate[] = [
  // Executive
  { id: "executive-onyx", name: "Onyx", collection: "executive", layout: "single", font: "jakarta", accent: "#0f172a", blurb: "Minimal, centered, authoritative." },
  { id: "executive-platinum", name: "Platinum", collection: "executive", layout: "sidebar", font: "manrope", accent: "#1e293b", blurb: "Refined sidebar with quiet contrast." },

  // Technology
  { id: "tech-cobalt", name: "Cobalt", collection: "technology", layout: "twocol", font: "inter", accent: "#2563eb", blurb: "Balanced two-column, cobalt accents." },
  { id: "tech-graphite", name: "Graphite", collection: "technology", layout: "sidebar", font: "inter", accent: "#38bdf8", dark: true, blurb: "Dark mode with a sky accent." },
  { id: "tech-spectrum", name: "Spectrum", collection: "technology", layout: "twocol", font: "inter", accent: "#4f46e5", blurb: "Modern indigo, generous spacing." },

  // Nordic Professional
  { id: "nordic-fjord", name: "Fjord", collection: "nordic", layout: "single", font: "inter", accent: "#2c5d8f", blurb: "Single-column, muted Nordic blue." },
  { id: "nordic-frost", name: "Frost", collection: "nordic", layout: "sidebar", font: "manrope", accent: "#475569", blurb: "Airy sidebar, soft greys." },

  // Consulting
  { id: "consulting-meridian", name: "Meridian", collection: "consulting", layout: "twocol", font: "jakarta", accent: "#1e3a5f", blurb: "Structured two-column, deep navy." },
  { id: "consulting-summit", name: "Summit", collection: "consulting", layout: "single", font: "jakarta", accent: "#7f1d1d", blurb: "Single-column, considered serif-like hierarchy." },

  // Modern Corporate (ATS-first)
  { id: "corporate-azure", name: "Azure", collection: "corporate", layout: "single", font: "inter", accent: "#0369a1", blurb: "Clean single-column, ATS-safe." },
  { id: "corporate-slate", name: "Slate", collection: "corporate", layout: "single", font: "dmsans", accent: "#334155", blurb: "Neutral, maximally ATS-friendly." },
  { id: "corporate-emerald", name: "Emerald", collection: "corporate", layout: "single", font: "manrope", accent: "#047857", blurb: "Fresh corporate green, single-column." },
];

export const isPremiumId = (id?: string): boolean => Boolean(id && PREMIUM_TEMPLATES.some((t) => t.id === id));
export const getPremiumTemplate = (id?: string): PremiumTemplate | undefined => PREMIUM_TEMPLATES.find((t) => t.id === id);
