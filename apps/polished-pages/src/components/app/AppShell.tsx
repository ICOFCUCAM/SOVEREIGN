import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, Search, ChevronDown, LogOut, Settings, LayoutDashboard, Crown, Library, Rocket, Store, FolderOpen, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { fetchPlanStatus, type PlanStatus } from "@/lib/session";
import { planDisplayName } from "@/lib/plans";
import { BRAND, DASHBOARD_NAV, ACCOUNT_NAV, LIBRARY_NAV } from "@/lib/tools";
import CommandPalette from "@/components/app/CommandPalette";
import WorkflowNav from "@/components/app/WorkflowNav";
import MobileNav from "@/components/app/MobileNav";

// The persistent studio chrome: one global navigation that ties every tool
// together, an account menu with live plan/usage, and the ⌘K command palette.
// Rendered once (by AuthGate) around the whole signed-in app.
const AppShell = ({ email, children }: { email: string; children: ReactNode }) => {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const { pathname } = useLocation();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => { fetchPlanStatus().then(setStatus); }, []);

  const isPro = !!status && status.plan !== "free"; // any paid tier
  const usageLabel = status
    ? (isPro ? `${planDisplayName(status.plan)} · ${status.imagesUsed}/${status.imagesLim} image credits` : `${status.used}/${status.lim} generations this month`)
    : "";

  return (
    <div className="min-h-screen bg-background">
      <a href="#main" className="sr-only z-[100] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-2">Skip to content</a>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link to={DASHBOARD_NAV.path} className="flex shrink-0 items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            <span className="font-serif text-base font-bold tracking-tight">{BRAND}</span>
          </Link>

          <Link
            to={DASHBOARD_NAV.path}
            className={`ml-2 hidden rounded-md px-3 py-1.5 text-sm font-sans transition-premium md:block ${pathname === DASHBOARD_NAV.path ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Dashboard
          </Link>
          <WorkflowNav />

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted sm:flex"
              aria-label="Open command palette"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
              <kbd className="rounded border border-border bg-background px-1.5 font-sans text-[10px]">⌘K</kbd>
            </button>

            {!isPro && status && (
              <Button asChild size="sm" variant="hero" className="hidden sm:inline-flex">
                <Link to="/pricing"><Crown className="mr-1 h-3.5 w-3.5" /> Upgrade</Link>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-muted/60">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {(email[0] || "?").toUpperCase()}
                  </span>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="truncate text-sm font-medium">{email}</div>
                  {usageLabel && <div className="text-xs text-muted-foreground">{usageLabel}</div>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to={DASHBOARD_NAV.path}><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to={LIBRARY_NAV.path}><Library className="mr-2 h-4 w-4" /> Library</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/collections"><FolderOpen className="mr-2 h-4 w-4" /> Collections</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/publishing"><Rocket className="mr-2 h-4 w-4" /> Publish &amp; distribute</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/catalog"><Store className="mr-2 h-4 w-4" /> Content catalog</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to={ACCOUNT_NAV.path}><Settings className="mr-2 h-4 w-4" /> Account & billing</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/pricing"><Crown className="mr-2 h-4 w-4" /> Plans &amp; pricing</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => supabase.auth.signOut()}><LogOut className="mr-2 h-4 w-4" /> Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main id="main" className="pt-14">{children}</main>
    </div>
  );
};

export default AppShell;
