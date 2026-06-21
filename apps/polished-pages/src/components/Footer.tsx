import { Link } from "react-router-dom";
import { BRAND } from "@/lib/tools";
import { useI18n } from "@/lib/i18n";
import SpineMark from "@/components/brand/SpineMark";

interface Col { title: string; links: { label: string; to: string }[] }

const COLUMNS: Col[] = [
  { title: "Career", links: [
    { label: "CV Builder", to: "/cv" },
    { label: "Tailor to a Job", to: "/tailor" },
    { label: "Cover Letters", to: "/cover-letter" },
  ] },
  { title: "Publishing", links: [
    { label: "Book Creator", to: "/book" },
    { label: "Transform a Book", to: "/book-transform" },
    { label: "Illustration Studio", to: "/illustrations" },
    { label: "Publish & Distribute", to: "/publishing" },
  ] },
  { title: "Education", links: [
    { label: "Children’s Studio", to: "/children" },
    { label: "Storybooks & Series", to: "/series" },
    { label: "Coloring Books", to: "/coloring" },
    { label: "School Content", to: "/classroom" },
    { label: "Curriculum Builder", to: "/curriculum" },
  ] },
  { title: "Platform", links: [
    { label: "Marketplace", to: "/catalog" },
    { label: "Organizations", to: "/organizations" },
    { label: "For Schools", to: "/for-schools" },
    { label: "Pricing", to: "/pricing" },
    { label: "Resources", to: "/resources" },
  ] },
  { title: "For you", links: [
    { label: "Authors", to: "/book" },
    { label: "Publishers", to: "/pricing" },
    { label: "Teachers", to: "/children" },
    { label: "Schools", to: "/curriculum" },
    { label: "Parents", to: "/storybook" },
  ] },
];

const Footer = () => {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border bg-background">
      {/* Brand accent line — the same top-of-section gold gradient used across the platform */}
      <div className="h-[2px] bg-gold-gradient opacity-60" />
      <div className="container px-6 py-14">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <SpineMark size="sm" className="mb-4" />
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo-mark.png" alt="" className="h-6 w-auto" width={35} height={24} />
              <span className="font-serif text-base font-bold text-foreground">{BRAND}</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground font-sans">
              {t("footer.tagline")}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {[
                { dot: "bg-career", label: "Career" },
                { dot: "bg-publishing", label: "Publishing" },
                { dot: "bg-educational", label: "Education" },
                { dot: "bg-marketplace", label: "Marketplace" },
              ].map((p) => (
                <span key={p.label} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-sans">
                  <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />{p.label}
                </span>
              ))}
            </div>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground font-sans">{col.title}</div>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}><Link to={l.to} className="text-sm text-foreground/80 hover:text-primary transition-colors font-sans">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground font-sans">© {new Date().getFullYear()} {BRAND}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground font-sans">
            <Link to="/for-schools" className="hover:text-primary transition-colors">For Schools</Link>
            <Link to="/security" className="hover:text-primary transition-colors">Security &amp; Governance</Link>
            <Link to="/accessibility" className="hover:text-primary transition-colors">Accessibility</Link>
            <Link to="/resources" className="hover:text-primary transition-colors">Resources</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
