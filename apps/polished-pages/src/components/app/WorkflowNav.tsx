import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { WORKFLOWS } from "@/lib/nav";

// Desktop workflow navigation: five lifecycle verbs, each opening a mega-menu
// panel. Opens on hover and on keyboard focus-within for accessibility.
const WorkflowNav = () => {
  const { pathname } = useLocation();
  return (
    <nav className="ml-1 hidden items-center gap-0.5 md:flex" aria-label="Primary">
      {WORKFLOWS.map((w) => {
        const active = w.columns.some((c) => c.items.some((i) => i.path === pathname));
        const wide = w.columns.length > 1;
        return (
          <div key={w.id} className="group relative">
            <button
              type="button"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-sans transition-premium ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <w.icon className="h-4 w-4 opacity-70" />
              {w.label}
              <ChevronDown className="h-3 w-3 opacity-50 transition-transform group-hover:rotate-180" />
            </button>
            <div
              className={`invisible absolute left-0 top-full z-50 translate-y-1 pt-2 opacity-0 transition-premium group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 ${wide ? "w-[42rem]" : "w-72"}`}
            >
              <div className="rounded-xl border border-border bg-popover p-3 shadow-e3">
                <p className="px-2 pb-2 text-xs text-muted-foreground font-sans">{w.blurb}</p>
                <div className={`grid gap-x-2 gap-y-0.5 ${wide ? "grid-cols-4" : "grid-cols-1"}`}>
                  {w.columns.map((col, ci) => (
                    <div key={ci}>
                      {col.heading && (
                        <div className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground font-sans">{col.heading}</div>
                      )}
                      {col.items.map((it) => {
                        const isActive = it.path === pathname;
                        return (
                          <Link
                            key={`${it.path}-${it.label}`}
                            to={it.path}
                            className={`block rounded-lg px-2 py-1.5 transition-colors ${isActive ? "bg-primary/10" : "hover:bg-muted"}`}
                          >
                            <div className={`text-sm font-sans ${isActive ? "font-semibold text-primary" : "text-foreground"}`}>{it.label}</div>
                            {it.desc && <div className="text-[11px] text-muted-foreground font-sans">{it.desc}</div>}
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
};

export default WorkflowNav;
