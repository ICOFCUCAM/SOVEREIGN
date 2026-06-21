import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { BRAND, DASHBOARD_NAV } from "@/lib/tools";
import ThemeToggle from "@/components/app/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";

// Maps the English nav labels (used as data keys) to i18n keys.
const NAV_KEY: Record<string, string> = {
  Career: "nav.career", Publishing: "nav.publishing", Education: "nav.education",
  Marketplace: "nav.marketplace", "For Schools": "nav.forSchools", Pricing: "nav.pricing", Resources: "nav.resources",
};

interface MenuItem { label: string; to: string; dot?: string }
interface MenuGroup { label: string; dot: string; items: MenuItem[] }

// Category-led navigation that reflects the whole platform (career, publishing,
// education) plus the marketplace and pricing, rather than a flat list of tools.
const GROUPS: MenuGroup[] = [
  { label: "Career", dot: "bg-career", items: [
    { label: "CV Builder", to: "/cv" },
    { label: "Tailor to a Job", to: "/tailor" },
    { label: "Cover Letters", to: "/cover-letter" },
  ] },
  { label: "Publishing", dot: "bg-publishing", items: [
    { label: "Book Creator", to: "/book" },
    { label: "Transform a Book", to: "/book-transform" },
    { label: "Illustration Studio", to: "/illustrations" },
    { label: "Edition Manager", to: "/editions" },
    { label: "Publish & Distribute", to: "/publishing" },
  ] },
  { label: "Education", dot: "bg-educational", items: [
    { label: "Educational Studio — all 14 tools", to: "/children" },
    { label: "Storybooks & Series", to: "/storybook" },
    { label: "Classroom Packs", to: "/classroom" },
    { label: "Teacher Resource Center", to: "/teacher" },
    { label: "Curriculum Builder", to: "/curriculum" },
    { label: "Assessment Bank", to: "/assessment-bank" },
    { label: "Translate & Localize", to: "/translate" },
  ] },
];
const DIRECT: MenuItem[] = [
  { label: "Marketplace", to: "/catalog", dot: "bg-marketplace" },
  { label: "For Schools", to: "/for-schools" },
  { label: "Pricing", to: "/pricing" },
  { label: "Resources", to: "/resources" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useI18n();
  const navLabel = (label: string) => (NAV_KEY[label] ? t(NAV_KEY[label]) : label);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container flex items-center justify-between h-16 px-6">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-lg font-bold font-serif tracking-tight text-foreground">{BRAND}</span>
        </Link>

        <div className="hidden md:flex items-center gap-7 text-sm text-muted-foreground font-sans">
          <Link to="/" className="py-2 hover:text-foreground transition-colors">{t("nav.home")}</Link>
          {GROUPS.map((g) => (
            <div key={g.label} className="relative group">
              <button className="flex items-center gap-1.5 py-2 hover:text-foreground transition-colors">
                <span className={`h-1.5 w-1.5 rounded-full ${g.dot}`} /> {navLabel(g.label)} <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
              <div className="invisible absolute left-0 top-full pt-2 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                <div className="min-w-[220px] rounded-xl border border-border bg-card p-1.5 shadow-premium">
                  {g.items.map((it) => (
                    <Link key={it.to} to={it.to} className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors">{it.label}</Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {DIRECT.map((d) => (
            <Link key={d.to} to={d.to} className="flex items-center gap-1.5 py-2 hover:text-foreground transition-colors">
              {d.dot && <span className={`h-1.5 w-1.5 rounded-full ${d.dot}`} />}{navLabel(d.label)}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <ThemeToggle className="hidden sm:inline-flex" />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex text-muted-foreground font-sans">
            <Link to={DASHBOARD_NAV.path}>{t("nav.signIn")}</Link>
          </Button>
          <Button asChild variant="hero" size="sm" className="font-sans">
            <Link to={DASHBOARD_NAV.path}>{t("nav.getStarted")}</Link>
          </Button>
          <button className="md:hidden p-1 text-muted-foreground" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 px-6 py-4">
          <Link to="/" onClick={() => setMobileOpen(false)} className="mb-3 block text-sm font-medium text-foreground font-sans">{t("nav.home")}</Link>
          {GROUPS.map((g) => (
            <div key={g.label} className="mb-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground font-sans"><span className={`h-1.5 w-1.5 rounded-full ${g.dot}`} /> {navLabel(g.label)}</div>
              <div className="flex flex-col">
                {g.items.map((it) => (
                  <Link key={it.to} to={it.to} onClick={() => setMobileOpen(false)} className="py-1.5 text-sm text-foreground font-sans">{it.label}</Link>
                ))}
              </div>
            </div>
          ))}
          <div className="flex flex-col border-t border-border pt-3">
            {DIRECT.map((d) => (
              <Link key={d.to} to={d.to} onClick={() => setMobileOpen(false)} className="py-1.5 text-sm font-medium text-foreground font-sans">{navLabel(d.label)}</Link>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
