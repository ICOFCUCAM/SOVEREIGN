import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { TOOLS, BRAND, DASHBOARD_NAV } from "@/lib/tools";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container flex items-center justify-between h-16 px-6">
        <Link to={DASHBOARD_NAV.path} className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-lg font-bold font-serif tracking-tight text-foreground">{BRAND}</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground font-sans">
          {TOOLS.map((t) => (
            <Link key={t.id} to={t.path} className="hover:text-foreground transition-colors">
              {t.short}
              {t.badge === "New" && <span className="ml-1 rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold text-gold align-middle">New</span>}
            </Link>
          ))}
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground font-sans">
            <Link to={DASHBOARD_NAV.path}>Sign In</Link>
          </Button>
          <Button asChild variant="hero" size="sm" className="font-sans">
            <Link to={DASHBOARD_NAV.path}>Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
