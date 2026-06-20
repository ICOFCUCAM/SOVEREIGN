import { Link, useLocation } from "react-router-dom";
import { Layers, Globe, Languages, Send, Store } from "lucide-react";

// Contextual workspace navigation shared across the publishing lifecycle pages
// (Series → Editions → Localize → Distribute → Sell). Always visible inside the
// workspace so users can move between stages without returning to the top nav.
const STAGES = [
  { label: "Series", path: "/series", icon: Layers },
  { label: "Editions", path: "/editions", icon: Globe },
  { label: "Localize", path: "/translate", icon: Languages },
  { label: "Distribute", path: "/publishing", icon: Send },
  { label: "Sell", path: "/catalog", icon: Store },
];

const PublishingWorkspaceNav = () => {
  const { pathname } = useLocation();
  return (
    <nav className="mb-6 -mx-1 flex items-center gap-1 overflow-x-auto pb-1" aria-label="Publishing workspace">
      {STAGES.map((s) => {
        const active = pathname === s.path;
        return (
          <Link
            key={s.path}
            to={s.path}
            aria-current={active ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium font-sans transition-premium ${
              active
                ? "border-publishing/40 bg-publishing/10 text-publishing"
                : "border-border text-muted-foreground hover:border-publishing/30 hover:text-foreground"
            }`}
          >
            <s.icon className="h-3.5 w-3.5" /> {s.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default PublishingWorkspaceNav;
