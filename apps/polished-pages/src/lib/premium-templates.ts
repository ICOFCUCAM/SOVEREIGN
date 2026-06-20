import type { FontId } from "@/lib/fonts";

// The flagship premium library. Each template is a DISTINCT architecture — a
// different structure and visual identity, not a recolor. The id doubles as the
// layout key that PremiumCv dispatches on.
export type PremiumCollection =
  | "executive" | "nordic" | "technology" | "consulting" | "corporate"
  | "academic" | "creative" | "startup" | "government" | "international";

export interface PremiumTemplate {
  id: string;
  name: string;
  collection: PremiumCollection;
  font: FontId;
  accent: string;
  dark?: boolean;
  blurb: string;
}

export const PREMIUM_COLLECTIONS: { id: PremiumCollection; label: string; blurb: string }[] = [
  { id: "executive", label: "Executive", blurb: "Boardroom-grade layouts for directors and senior leaders." },
  { id: "technology", label: "Technology", blurb: "Engineering-focused with skills matrix and projects." },
  { id: "consulting", label: "Consulting", blurb: "Impact-driven structures for advisory and strategy." },
  { id: "corporate", label: "Modern Corporate", blurb: "Contemporary enterprise designs, ATS-safe." },
  { id: "nordic", label: "Nordic Professional", blurb: "Minimalist Scandinavian design." },
  { id: "academic", label: "Academic & Research", blurb: "Publications, research and grants." },
  { id: "creative", label: "Creative", blurb: "Bold and modern, still ATS-compatible." },
  { id: "startup", label: "Startup & Founder", blurb: "Growth metrics and venture-building." },
  { id: "government", label: "Government & Public Sector", blurb: "Formal, compliance-oriented." },
  { id: "international", label: "International", blurb: "Global recruitment, multi-language." },
];

export const PREMIUM_TEMPLATES: PremiumTemplate[] = [
  { id: "executive-boardroom", name: "Boardroom", collection: "executive", font: "jakarta", accent: "#0f172a", blurb: "Oversized name banner, executive summary, achievement-led experience." },
  { id: "premium-single", name: "Monarch", collection: "executive", font: "inter", accent: "#1f2937", blurb: "Elite single-column. Maximum ATS compatibility." },
  { id: "tech-architect", name: "Architect", collection: "technology", font: "inter", accent: "#2563eb", blurb: "Skills matrix, certifications and project highlights." },
  { id: "consulting-elite", name: "Meridian", collection: "consulting", font: "jakarta", accent: "#1e3a5f", blurb: "Impact-metric band over structured engagements." },
  { id: "corporate-modern", name: "Vanguard", collection: "corporate", font: "inter", accent: "#0369a1", blurb: "Contemporary enterprise design with a strong hierarchy." },
  { id: "premium-twocol", name: "Atlas", collection: "corporate", font: "manrope", accent: "#475569", blurb: "Two-column with a skills & certifications panel." },
  { id: "nordic-professional", name: "Fjord", collection: "nordic", font: "manrope", accent: "#334155", blurb: "Minimalist Scandinavian — hairline rules, generous space." },
  { id: "academic-research", name: "Scholar", collection: "academic", font: "jakarta", accent: "#6b2737", blurb: "Publications, research projects, grants and conferences." },
  { id: "creative-professional", name: "Studio", collection: "creative", font: "jakarta", accent: "#7c3aed", blurb: "Bold modern header with a portfolio emphasis." },
  { id: "startup-leader", name: "Velocity", collection: "startup", font: "inter", accent: "#ea580c", blurb: "Growth-metric band, ventures and product launches." },
  { id: "government-public", name: "Sentinel", collection: "government", font: "dmsans", accent: "#1e293b", blurb: "Formal, compliance-oriented, with a clearance line." },
  { id: "international-pro", name: "Global", collection: "international", font: "inter", accent: "#0d9488", blurb: "Language-proficiency panel and a global format." },
];

export const isPremiumId = (id?: string): boolean => Boolean(id && PREMIUM_TEMPLATES.some((t) => t.id === id));
export const getPremiumTemplate = (id?: string): PremiumTemplate | undefined => PREMIUM_TEMPLATES.find((t) => t.id === id);
