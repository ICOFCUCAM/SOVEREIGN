import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, ChevronDown, LayoutDashboard, Library, Settings, Store } from "lucide-react";
import { WORKFLOWS } from "@/lib/nav";
import { DASHBOARD_NAV, LIBRARY_NAV, ACCOUNT_NAV } from "@/lib/tools";

// Full-height mobile drawer for the signed-in shell. Workflow groups are
// collapsible accordions so the whole platform is reachable on a phone without
// a wall of links.
const MobileNav = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState<string | null>("create");
  if (!open) return null;

  const close = () => onClose();

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={close} aria-hidden />
      <div className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col border-l border-border bg-background shadow-e4">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-serif text-base font-bold">Menu</span>
          <button type="button" onClick={close} aria-label="Close menu" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <Link to={DASHBOARD_NAV.path} onClick={close} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium font-sans hover:bg-muted">
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" /> Dashboard
          </Link>

          {WORKFLOWS.map((w) => {
            const isOpen = expanded === w.id;
            return (
              <div key={w.id} className="mt-1">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : w.id)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium font-sans hover:bg-muted"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center gap-2.5"><w.icon className="h-4 w-4 text-muted-foreground" /> {w.label}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="mb-1 ml-3 border-l border-border pl-3">
                    {w.columns.flatMap((c) => c.items).map((it) => {
                      const active = it.path === pathname;
                      return (
                        <Link
                          key={`${it.path}-${it.label}`}
                          to={it.path}
                          onClick={close}
                          className={`block rounded-md px-3 py-2 text-sm font-sans ${active ? "font-semibold text-primary" : "text-foreground/80 hover:text-foreground"}`}
                        >
                          {it.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="my-3 border-t border-border" />
          <Link to={LIBRARY_NAV.path} onClick={close} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-sans hover:bg-muted">
            <Library className="h-4 w-4 text-muted-foreground" /> Library
          </Link>
          <Link to="/catalog" onClick={close} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-sans hover:bg-muted">
            <Store className="h-4 w-4 text-muted-foreground" /> Marketplace
          </Link>
          <Link to={ACCOUNT_NAV.path} onClick={close} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-sans hover:bg-muted">
            <Settings className="h-4 w-4 text-muted-foreground" /> Account &amp; billing
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
