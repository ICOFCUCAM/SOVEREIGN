import { BRAND, TOOLS } from "@/lib/tools";

// The browser-tab name for every route, so tabs, history and search results can
// tell the pages apart. Tool pages take their name from TOOLS; everything else
// is named here, using the same labels the navigation and footer show.
const NAMES: Record<string, string> = {
  "/pricing": "Pricing",
  "/resources": "Resources",
  "/for-schools": "For Schools",
  "/accessibility": "Accessibility",
  "/security": "Security & Governance",
  "/catalog": "Marketplace",
  "/institutions": "Institutions",
  "/dashboard": "Dashboard",
  "/account": "Account",
  "/insights": "Insights",
  "/library": "Library",
  "/collections": "Collections",
  "/organizations": "Organizations",
  "/marketplace-health": "Marketplace Health",
  "/admin/claude": "Claude Studio",
  "/series": "Storybooks & Series",
  "/storybook": "Storybook Creator",
  "/coloring": "Coloring Books",
  "/edu-readers": "Educational Readers",
  "/classroom": "Classroom Packs",
  "/primary-books": "Primary Books",
  "/workbooks": "Workbooks",
  "/curriculum": "Curriculum Builder",
  "/teacher": "Teacher Resource Center",
  "/assessment": "Exam & Assessment Pack",
  "/assessment-bank": "Assessment Bank",
  "/translate": "Translate & Localize",
  "/editions": "Edition Manager",
  "/illustrations": "Illustration Studio",
  "/publishing": "Publish & Distribute",
  "/reset-password": "Reset your password",
};

const PREFIXES: [string, string][] = [
  ["/catalog/author/", "Author"],
  ["/organizations/", "Organization workspace"],
  ["/org/", "Organization"],
  ["/shared/", "Shared document"],
  ["/collection/", "Collection"],
  ["/series/public/", "Series"],
];

export const HOME_TITLE = `${BRAND} — The operating system for global knowledge creation & distribution`;

/** The page's own name, or null for the home page and unknown routes. */
export function pageName(pathname: string): string | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (path === "/") return null;
  const tool = TOOLS.find((t) => t.path === path);
  if (tool) return tool.name;
  if (NAMES[path]) return NAMES[path];
  if (path.endsWith("/analytics") && path.startsWith("/organizations/")) return "Organization analytics";
  return PREFIXES.find(([p]) => path.startsWith(p))?.[1] ?? null;
}

export function pageTitle(pathname: string): string {
  const name = pageName(pathname);
  return name ? `${name} · ${BRAND}` : HOME_TITLE;
}
