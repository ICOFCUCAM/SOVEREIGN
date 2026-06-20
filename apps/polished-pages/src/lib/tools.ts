import { FileText, Target, PenTool, BookOpen, LayoutDashboard, Settings, type LucideIcon } from "lucide-react";

// The product's canonical name. Used everywhere so branding stays consistent
// (the app shipped with a mix of "DocuForge" and "Polished Pages").
export const BRAND = "Polished Pages";

export interface ToolDef {
  id: string;
  name: string;
  short: string;          // nav label
  description: string;
  path: string;
  icon: LucideIcon;
  badge?: "New" | "Flagship";
  // Quick-action verb for the command palette / dashboard ("Create a CV").
  action: string;
  keywords: string[];
}

// Single source of truth for every capability in the studio. The nav, the
// command palette, and the dashboard all render from this list, so a new tool
// appears in all three the moment it is added here.
export const TOOLS: ToolDef[] = [
  {
    id: "cv",
    name: "CV Builder",
    short: "CV Builder",
    description: "Marketplace-grade, ATS-safe résumés rendered in premium template families.",
    path: "/cv",
    icon: FileText,
    action: "Create a CV",
    keywords: ["resume", "cv", "curriculum vitae", "template", "ats"],
  },
  {
    id: "tailor",
    name: "Tailor to a Job",
    short: "Tailor",
    description: "Upload your CV and a job posting — get a re-focused CV, a matching cover letter, and a fit score.",
    path: "/tailor",
    icon: Target,
    badge: "New",
    action: "Tailor CV to a job",
    keywords: ["job", "match", "tailor", "ats", "keywords", "application", "fit"],
  },
  {
    id: "cover-letter",
    name: "Cover Letters",
    short: "Cover Letter",
    description: "Personalized, human-sounding cover letters aligned to a specific job description.",
    path: "/cover-letter",
    icon: PenTool,
    action: "Write a cover letter",
    keywords: ["cover", "letter", "application", "job"],
  },
  {
    id: "book",
    name: "Book Creator",
    short: "Book",
    description: "Full-length books with structured chapters, ready for EPUB, PDF, or print.",
    path: "/book",
    icon: BookOpen,
    action: "Create a book",
    keywords: ["book", "ebook", "epub", "chapters", "publish", "author"],
  },
];

export const DASHBOARD_NAV = { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard };
export const ACCOUNT_NAV = { name: "Account", path: "/account", icon: Settings };
