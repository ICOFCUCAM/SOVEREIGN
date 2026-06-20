import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Library, Store, Menu, type LucideIcon } from "lucide-react";

// Fixed bottom tab bar for the signed-in app on mobile — the native pattern
// users expect on a phone. Replaces relying on the top hamburger alone, putting
// the primary destinations one thumb-tap away. Hidden on md+ (desktop uses the
// mega menu). Respects the safe-area inset on notched devices.
const TABS: { label: string; to: string; icon: LucideIcon }[] = [
  { label: "Home", to: "/dashboard", icon: LayoutDashboard },
  { label: "Library", to: "/library", icon: Library },
  { label: "Market", to: "/catalog", icon: Store },
];

const MobileTabBar = ({ onMenu }: { onMenu: () => void }) => {
  const { pathname } = useLocation();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-lg md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary mobile"
    >
      <div className="flex items-stretch">
        {TABS.map((t) => {
          const active = pathname === t.to;
          return (
            <Link
              key={t.to}
              to={t.to}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium font-sans transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <t.icon className={`h-5 w-5 ${active ? "" : "opacity-80"}`} />
              {t.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMenu}
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium text-muted-foreground font-sans"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 opacity-80" />
          More
        </button>
      </div>
    </nav>
  );
};

export default MobileTabBar;
